#!/bin/bash
# FitStream GitHub Actions Self-Hosted Runner Setup
# Запускать на Linux хосте

set -e

echo "=== FitStream GitHub Actions Runner Setup ==="
echo ""

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Проверка Podman
echo -e "${YELLOW}[1/7] Проверка Podman...${NC}"
if ! command -v podman &> /dev/null; then
    echo -e "${RED}Podman не установлен!${NC}"
    echo "Установи Podman:"
    echo "  Ubuntu/Debian: sudo apt install podman podman-compose"
    echo "  Fedora/RHEL:   sudo dnf install podman podman-compose"
    exit 1
fi
echo -e "${GREEN}✓ Podman $(podman --version | head -1)${NC}"

# 2. Проверка podman-compose
echo -e "${YELLOW}[2/7] Проверка podman-compose...${NC}"
if ! command -v podman-compose &> /dev/null; then
    echo "Установка podman-compose..."
    pip3 install --user podman-compose
fi
echo -e "${GREEN}✓ podman-compose установлен${NC}"

# 3. Настройка rootless Podman
echo -e "${YELLOW}[3/7] Настройка rootless Podman...${NC}"
if ! systemctl --user is-active podman.socket &> /dev/null; then
    sudo loginctl enable-linger $USER
    systemctl --user enable --now podman.socket
fi
echo -e "${GREEN}✓ Podman socket активен${NC}"
echo "  Socket: /run/user/$(id -u)/podman/podman.sock"

# 4. Настройка sysctl (для SonarQube)
echo -e "${YELLOW}[4/7] Настройка sysctl...${NC}"
if [ $(sysctl -n vm.max_map_count) -lt 262144 ]; then
    echo "Требуется sudo для настройки sysctl..."
    sudo tee /etc/sysctl.d/99-devops.conf > /dev/null <<EOF
vm.max_map_count=524288
fs.file-max=131072
EOF
    sudo sysctl --system > /dev/null
fi
echo -e "${GREEN}✓ sysctl настроен${NC}"

# 5. Создание .env файла
echo -e "${YELLOW}[5/7] Создание конфигурации...${NC}"
cd "$(dirname "$0")"

if [ ! -f .env ]; then
    cp .env.github.example .env

    # Генерируем пароли
    SONAR_PASS=$(openssl rand -base64 24 | tr -dc 'a-zA-Z0-9' | head -c 24)
    DTRACK_PASS=$(openssl rand -base64 24 | tr -dc 'a-zA-Z0-9' | head -c 24)
    DOJO_PASS=$(openssl rand -base64 24 | tr -dc 'a-zA-Z0-9' | head -c 24)
    DOJO_SECRET=$(openssl rand -base64 32)
    DOJO_AES=$(openssl rand -base64 32)

    sed -i "s/SONAR_DB_PASSWORD=.*/SONAR_DB_PASSWORD=$SONAR_PASS/" .env
    sed -i "s/DTRACK_DB_PASSWORD=.*/DTRACK_DB_PASSWORD=$DTRACK_PASS/" .env
    sed -i "s/DOJO_DB_PASSWORD=.*/DOJO_DB_PASSWORD=$DOJO_PASS/" .env
    sed -i "s|DOJO_SECRET_KEY=.*|DOJO_SECRET_KEY=$DOJO_SECRET|" .env
    sed -i "s|DOJO_AES_KEY=.*|DOJO_AES_KEY=$DOJO_AES|" .env

    echo -e "${GREEN}✓ .env создан с безопасными паролями${NC}"
else
    echo -e "${GREEN}✓ .env уже существует${NC}"
fi

# 6. Проверка GitHub конфигурации
echo -e "${YELLOW}[6/7] Проверка GitHub конфигурации...${NC}"
source .env 2>/dev/null || true

if [ -z "$GITHUB_REPO_URL" ] || [ "$GITHUB_REPO_URL" = "https://github.com/YOUR_USERNAME/FitStream" ]; then
    echo -e "${RED}⚠ GITHUB_REPO_URL не настроен!${NC}"
    echo ""
    read -p "Введи URL репозитория (https://github.com/user/repo): " REPO_URL
    sed -i "s|GITHUB_REPO_URL=.*|GITHUB_REPO_URL=$REPO_URL|" .env
fi

if [ -z "$GITHUB_PAT" ] || [ "$GITHUB_PAT" = "ghp_xxxxxxxxxxxxxxxxxxxx" ]; then
    echo -e "${RED}⚠ GITHUB_PAT не настроен!${NC}"
    echo ""
    echo "Создай Personal Access Token:"
    echo "  1. Открой https://github.com/settings/tokens"
    echo "  2. Generate new token (classic)"
    echo "  3. Выбери scopes: repo, workflow"
    echo "  4. Скопируй токен"
    echo ""
    read -sp "Введи GitHub PAT: " PAT
    echo ""
    sed -i "s|GITHUB_PAT=.*|GITHUB_PAT=$PAT|" .env
fi

echo -e "${GREEN}✓ GitHub конфигурация готова${NC}"

# 7. Выбор конфигурации
echo -e "${YELLOW}[7/7] Выбор конфигурации...${NC}"
echo ""
echo "Доступные конфигурации:"
echo "  1) Минимальная (4GB RAM) - только runner + Trivy"
echo "  2) Полная (16GB RAM) - все сервисы"
echo ""
read -p "Выбери конфигурацию [1/2]: " CONFIG_CHOICE

case $CONFIG_CHOICE in
    1)
        COMPOSE_FILE="podman-compose.github-minimal.yml"
        echo -e "${GREEN}Выбрана минимальная конфигурация${NC}"
        ;;
    2)
        COMPOSE_FILE="podman-compose.github.yml"
        echo -e "${GREEN}Выбрана полная конфигурация${NC}"
        ;;
    *)
        COMPOSE_FILE="podman-compose.github-minimal.yml"
        echo -e "${YELLOW}По умолчанию: минимальная конфигурация${NC}"
        ;;
esac

# Запуск
echo ""
echo "=== Запуск стека ==="
echo ""
read -p "Запустить сейчас? [y/N]: " START_NOW

if [[ "$START_NOW" =~ ^[Yy]$ ]]; then
    podman-compose -f $COMPOSE_FILE up -d
    echo ""
    echo -e "${GREEN}=== Стек запущен! ===${NC}"
else
    echo ""
    echo "Для запуска выполни:"
    echo "  podman-compose -f $COMPOSE_FILE up -d"
fi

echo ""
echo "=== Готово! ==="
echo ""
echo "Проверь статус раннера:"
echo "  podman logs -f github-runner"
echo ""
echo "После регистрации раннер появится в:"
echo "  GitHub → Settings → Actions → Runners"
echo ""

if [ "$CONFIG_CHOICE" = "2" ]; then
    echo "URLs сервисов:"
    echo "  - SonarQube:        http://localhost:9000 (admin/admin)"
    echo "  - Dependency-Track: http://localhost:8080"
    echo "  - DefectDojo:       http://localhost:8000"
    echo "  - Trivy Server:     http://localhost:4954"
fi
