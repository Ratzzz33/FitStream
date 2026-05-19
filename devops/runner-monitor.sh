#!/bin/bash
# FitStream Self-hosted Runner Monitor
# Runs every 5 minutes (via cron or systemd timer) on the server hosting the runner.
# Checks runner process health locally and sends Telegram alerts when offline.
#
# Usage:
#   ./runner-monitor.sh
#
# Install as cron job (run every 5 min):
#   */5 * * * * /path/to/fitstream/devops/runner-monitor.sh >> /var/log/fitstream-runner-monitor.log 2>&1
#
# Required env vars (set in /etc/environment or .env):
#   TELEGRAM_BOT_TOKEN    - Telegram bot token
#   TELEGRAM_ALERT_CHAT_ID - Chat ID for alerts
#   GH_TOKEN              - GitHub PAT with repo scope (for API check)
#   GITHUB_REPO           - e.g. Ratzzz33/FitStream
#   RUNNER_NAME           - e.g. fitstream-runner

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Load .env if present
if [ -f "${SCRIPT_DIR}/../.env" ]; then
  set -a
  # shellcheck disable=SC1091
  source "${SCRIPT_DIR}/../.env"
  set +a
fi

# Config with defaults
TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-}"
TELEGRAM_ALERT_CHAT_ID="${TELEGRAM_ALERT_CHAT_ID:-}"
GH_TOKEN="${GH_TOKEN:-}"
GITHUB_REPO="${GITHUB_REPO:-Ratzzz33/FitStream}"
RUNNER_NAME="${RUNNER_NAME:-fitstream-runner}"
STATE_FILE="/tmp/fitstream-runner-monitor-state.json"
OFFLINE_THRESHOLD_MINUTES=5
CHECK_INTERVAL_MINUTES=5

log() {
  echo "[$(date -u +"%Y-%m-%d %H:%M:%S UTC")] $*"
}

send_telegram() {
  local message="$1"
  if [ -z "$TELEGRAM_BOT_TOKEN" ] || [ -z "$TELEGRAM_ALERT_CHAT_ID" ]; then
    log "WARN: Telegram credentials not configured, skipping alert"
    return 0
  fi

  local response
  response=$(curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
    -H "Content-Type: application/json" \
    -d "{
      \"chat_id\": \"${TELEGRAM_ALERT_CHAT_ID}\",
      \"text\": $(echo "$message" | jq -Rs .),
      \"parse_mode\": \"Markdown\",
      \"disable_web_page_preview\": true
    }" 2>/dev/null || echo '{"ok":false}')

  local ok
  ok=$(echo "$response" | jq -r '.ok // false')
  if [ "$ok" = "true" ]; then
    log "Telegram alert sent successfully"
  else
    log "WARN: Failed to send Telegram alert: $(echo "$response" | jq -r '.description // "unknown error"')"
  fi
}

check_runner_api() {
  if [ -z "$GH_TOKEN" ]; then
    log "WARN: GH_TOKEN not set, skipping API check"
    echo "unknown"
    return 0
  fi

  local json
  json=$(curl -s \
    -H "Authorization: Bearer $GH_TOKEN" \
    -H "Accept: application/vnd.github+json" \
    "https://api.github.com/repos/${GITHUB_REPO}/actions/runners" 2>/dev/null || echo '{}')

  local runner_status
  runner_status=$(echo "$json" | jq -r \
    --arg name "$RUNNER_NAME" \
    '.runners // [] | map(select(.name == $name)) | .[0].status // "not_found"' 2>/dev/null || echo "error")

  echo "$runner_status"
}

check_runner_process() {
  # Check if runner process is running locally
  if pgrep -f "Runner.Listener\|actions-runner\|run.sh" > /dev/null 2>&1; then
    echo "running"
  else
    echo "not_running"
  fi
}

load_state() {
  if [ -f "$STATE_FILE" ]; then
    cat "$STATE_FILE"
  else
    echo '{"consecutive_failures": 0, "alert_sent_at": null, "last_online_at": null}'
  fi
}

save_state() {
  echo "$1" > "$STATE_FILE"
}

main() {
  log "=== FitStream Runner Monitor tick ==="

  local state
  state=$(load_state)
  local consecutive_failures
  consecutive_failures=$(echo "$state" | jq -r '.consecutive_failures // 0')
  local last_alert_sent
  last_alert_sent=$(echo "$state" | jq -r '.alert_sent_at // ""')

  # Check runner via GitHub API
  local api_status
  api_status=$(check_runner_api)
  log "API status: $api_status"

  # Check local process as fallback
  local process_status
  process_status=$(check_runner_process)
  log "Process status: $process_status"

  local is_online=false
  if [ "$api_status" = "online" ] || [ "$process_status" = "running" ]; then
    is_online=true
  fi

  if [ "$is_online" = "true" ]; then
    log "Runner is ONLINE"
    local new_state
    new_state=$(echo "$state" | jq \
      --arg now "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
      '.consecutive_failures = 0 | .last_online_at = $now')
    save_state "$new_state"

    # Send recovery alert if we had previously sent an offline alert
    if [ -n "$last_alert_sent" ] && [ "$(echo "$state" | jq -r '.consecutive_failures')" -ge 1 ]; then
      local recovery_msg="✅ *FitStream Runner — Восстановлен*

Runner *${RUNNER_NAME}* снова ONLINE.
Время восстановления: $(date -u +"%Y-%m-%d %H:%M UTC")"
      send_telegram "$recovery_msg"

      # Reset alert_sent_at
      new_state=$(echo "$new_state" | jq '.alert_sent_at = null')
      save_state "$new_state"
    fi
    return 0
  fi

  # Runner is offline
  local new_failures=$((consecutive_failures + 1))
  log "Runner OFFLINE. Consecutive failures: $new_failures"

  local new_state
  new_state=$(echo "$state" | jq \
    --argjson f "$new_failures" \
    '.consecutive_failures = $f')
  save_state "$new_state"

  # Check if we should send alert
  # Alert on 1st failure (= 5 min offline since we run every 5 min)
  # Then re-alert every 30 min if still offline
  local should_alert=false
  local minutes_since_last_alert=0

  if [ -n "$last_alert_sent" ]; then
    local last_ts
    last_ts=$(date -d "$last_alert_sent" +%s 2>/dev/null || date -j -f "%Y-%m-%dT%H:%M:%SZ" "$last_alert_sent" +%s 2>/dev/null || echo 0)
    local now_ts
    now_ts=$(date +%s)
    minutes_since_last_alert=$(( (now_ts - last_ts) / 60 ))
  fi

  if [ "$new_failures" -eq 1 ]; then
    should_alert=true
  elif [ "$minutes_since_last_alert" -ge 30 ]; then
    should_alert=true
  fi

  if [ "$should_alert" = "true" ]; then
    local alert_type="first"
    [ "$new_failures" -gt 1 ] && alert_type="repeat"

    local msg
    if [ "$alert_type" = "first" ]; then
      msg="🔴 *FitStream CI Runner OFFLINE*

Runner *${RUNNER_NAME}* не отвечает.

API статус: \`${api_status}\`
Локальный процесс: \`${process_status}\`
Время: $(date -u +"%Y-%m-%d %H:%M UTC")

CI-задания могут зависать в очереди. Проверьте сервер.

Действия:
1. SSH на сервер: \`ssh root@<server>\`
2. Проверить runner: \`cd /opt/actions-runner && ./run.sh\`
3. Или через docker: \`docker ps | grep runner\`"
    else
      msg="🔴 *FitStream CI Runner — Всё ещё OFFLINE*

Runner *${RUNNER_NAME}* остаётся недоступным уже ${new_failures} проверок (~$((new_failures * CHECK_INTERVAL_MINUTES)) мин).

Время: $(date -u +"%Y-%m-%d %H:%M UTC")"
    fi

    send_telegram "$msg"

    new_state=$(echo "$new_state" | jq \
      --arg now "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
      '.alert_sent_at = $now')
    save_state "$new_state"
  else
    log "Offline but suppressing alert (sent ${minutes_since_last_alert}min ago, threshold 30min)"
  fi
}

main "$@"
