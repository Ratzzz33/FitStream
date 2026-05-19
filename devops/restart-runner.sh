#!/bin/bash
# FitStream GitHub Actions Runner — Emergency Restart Script
#
# Запускать на сервере через SSH при оффлайне runner'а:
#   ssh root@<server> "cd /path/to/FitStream/devops && bash restart-runner.sh"
#
# Что делает:
#   1. Останавливает и удаляет старый контейнер github-runner
#   2. Поднимает заново через podman-compose (ACCESS_TOKEN гарантирует свежий reg-token)
#   3. Проверяет, что контейнер запустился
#   4. Опционально: проверяет статус через GitHub API

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="${SCRIPT_DIR}/podman-compose.github-minimal.yml"
ENV_FILE="${SCRIPT_DIR}/../.env"
RUNNER_NAME="${RUNNER_NAME:-fitstream-runner}"

log() { echo "[$(date -u +"%H:%M:%S UTC")] $*"; }

# ============================================
# 0. Проверка зависимостей
# ============================================
for cmd in podman podman-compose; do
  if ! command -v "$cmd" &>/dev/null; then
    echo "ERROR: '$cmd' не найден. Установи podman + podman-compose."
    exit 1
  fi
done

# ============================================
# 1. Загрузить .env
# ============================================
if [ -f "$ENV_FILE" ]; then
  log "Загрузка .env из $ENV_FILE"
  set -a; source "$ENV_FILE"; set +a
else
  log "WARN: .env не найден в $ENV_FILE — используются переменные окружения"
fi

# Проверить обязательные переменные
if [ -z "${ACCESS_TOKEN:-}" ] && [ -z "${RUNNER_TOKEN:-}" ]; then
  echo "ERROR: Необходимо задать ACCESS_TOKEN (PAT) или RUNNER_TOKEN в .env"
  echo "       ACCESS_TOKEN предпочтительнее — RUNNER_TOKEN истекает через 1 час."
  exit 1
fi

if [ -z "${GITHUB_REPO_URL:-}" ]; then
  echo "ERROR: GITHUB_REPO_URL не задан в .env (пример: https://github.com/Ratzzz33/FitStream)"
  exit 1
fi

# ============================================
# 2. Остановить и удалить старый контейнер
# ============================================
log "Остановка старого контейнера github-runner ..."
podman stop github-runner 2>/dev/null && log "Контейнер остановлен" || log "Контейнер уже был остановлен"
podman rm github-runner 2>/dev/null && log "Контейнер удалён" || log "Контейнер уже был удалён"

# ============================================
# 3. Пересоздать через podman-compose
# ============================================
log "Запуск github-runner через podman-compose ..."
podman-compose -f "$COMPOSE_FILE" up -d github-runner

# ============================================
# 4. Ждать запуска (до 30 секунд)
# ============================================
log "Ожидание запуска контейнера ..."
for i in $(seq 1 15); do
  if podman ps --filter "name=github-runner" --filter "status=running" --quiet | grep -q .; then
    log "Контейнер запущен (попытка $i)"
    break
  fi
  sleep 2
done

CONTAINER_STATUS=$(podman inspect github-runner --format '{{.State.Status}}' 2>/dev/null || echo "unknown")
if [ "$CONTAINER_STATUS" != "running" ]; then
  echo "ERROR: Контейнер не запустился. Статус: $CONTAINER_STATUS"
  echo "Логи:"
  podman logs github-runner --tail=30 2>&1 || true
  exit 1
fi

log "OK: Контейнер github-runner запущен (статус: $CONTAINER_STATUS)"

# ============================================
# 5. Проверить регистрацию через GitHub API (опционально)
# ============================================
GH_TOKEN="${ACCESS_TOKEN:-${GH_PAT:-}}"
GITHUB_REPO="${GITHUB_REPO_URL#https://github.com/}"

if [ -n "$GH_TOKEN" ]; then
  log "Проверка регистрации runner'а через GitHub API ..."
  sleep 10  # runner регистрируется ~5-10 секунд после старта контейнера

  RUNNERS_JSON=$(curl -s \
    -H "Authorization: Bearer $GH_TOKEN" \
    -H "Accept: application/vnd.github+json" \
    "https://api.github.com/repos/${GITHUB_REPO}/actions/runners" 2>/dev/null || echo '{}')

  RUNNER_STATUS=$(echo "$RUNNERS_JSON" | python3 -c "
import sys, json
d = json.load(sys.stdin)
runners = d.get('runners', [])
for r in runners:
    if r.get('name') == '$RUNNER_NAME':
        print(r.get('status', 'unknown'))
        sys.exit(0)
print('not_found')
" 2>/dev/null || echo "parse_error")

  if [ "$RUNNER_STATUS" = "online" ]; then
    log "SUCCESS: runner '$RUNNER_NAME' зарегистрирован и ONLINE в GitHub"
  else
    log "WARN: runner '$RUNNER_NAME' статус = '$RUNNER_STATUS' (ожидай ~30 сек и перепроверь)"
    log "      gh api repos/${GITHUB_REPO}/actions/runners"
  fi
else
  log "WARN: ACCESS_TOKEN не задан — пропуск проверки GitHub API"
  log "      Проверь вручную: gh api repos/${GITHUB_REPO}/actions/runners"
fi

# ============================================
# 6. Итог
# ============================================
echo ""
echo "=== Итог ==="
echo "Контейнер:  running"
echo "Runner:     ${RUNNER_NAME}"
echo "Repo:       ${GITHUB_REPO_URL}"
echo ""
echo "Следующие шаги:"
echo "  1. Подождать 30 сек, затем проверить статус:"
echo "     gh api repos/${GITHUB_REPO}/actions/runners"
echo "  2. Если runner не появился — смотреть логи:"
echo "     podman logs github-runner --tail=50"
echo "  3. Если ACCESS_TOKEN не задан — задай его в .env и перезапусти"
