#!/bin/bash
# FitStream DevOps Host Setup Script
# Запускать на Linux хосте с sudo

set -e

echo "=== FitStream DevOps Host Setup ==="

# 1. Установка Podman (если не установлен)
if ! command -v podman &> /dev/null; then
    echo "[1/6] Установка Podman..."

    # Определяем дистрибутив
    if [ -f /etc/debian_version ]; then
        # Debian/Ubuntu
        sudo apt-get update
        sudo apt-get install -y podman podman-compose
    elif [ -f /etc/redhat-release ]; then
        # RHEL/CentOS/Fedora
        sudo dnf install -y podman podman-compose
    elif [ -f /etc/arch-release ]; then
        # Arch Linux
        sudo pacman -S podman podman-compose
    else
        echo "Неизвестный дистрибутив. Установи Podman вручную."
        exit 1
    fi
else
    echo "[1/6] Podman уже установлен: $(podman --version)"
fi

# 2. Включение rootless Podman
echo "[2/6] Настройка rootless Podman..."
sudo loginctl enable-linger $USER

# Создаём сокет для Podman
systemctl --user enable --now podman.socket
echo "Podman socket: /run/user/$(id -u)/podman/podman.sock"

# 3. Настройка sysctl для SonarQube
echo "[3/6] Настройка sysctl для SonarQube..."
sudo tee /etc/sysctl.d/99-sonarqube.conf > /dev/null <<EOF
vm.max_map_count=524288
fs.file-max=131072
EOF
sudo sysctl --system

# 4. Настройка ulimits
echo "[4/6] Настройка ulimits..."
sudo tee /etc/security/limits.d/99-sonarqube.conf > /dev/null <<EOF
* soft nofile 65536
* hard nofile 65536
* soft nproc 4096
* hard nproc 4096
EOF

# 5. Создание директорий
echo "[5/6] Создание директорий..."
mkdir -p ~/fitstream-devops/{gitea,sonarqube,trivy,dtrack,defectdojo}

# 6. Генерация секретов
echo "[6/6] Генерация секретов..."
cd "$(dirname "$0")"

if [ ! -f .env ]; then
    cp .env.example .env

    # Генерируем безопасные пароли
    SONAR_PASS=$(openssl rand -base64 24 | tr -dc 'a-zA-Z0-9' | head -c 24)
    DTRACK_PASS=$(openssl rand -base64 24 | tr -dc 'a-zA-Z0-9' | head -c 24)
    DOJO_PASS=$(openssl rand -base64 24 | tr -dc 'a-zA-Z0-9' | head -c 24)
    DOJO_SECRET=$(openssl rand -base64 32)
    DOJO_AES=$(openssl rand -base64 32)

    sed -i "s/strong_password_here/$SONAR_PASS/" .env
    sed -i "s/DTRACK_DB_PASSWORD=.*/DTRACK_DB_PASSWORD=$DTRACK_PASS/" .env
    sed -i "s/DOJO_DB_PASSWORD=.*/DOJO_DB_PASSWORD=$DOJO_PASS/" .env
    sed -i "s|DOJO_SECRET_KEY=.*|DOJO_SECRET_KEY=$DOJO_SECRET|" .env
    sed -i "s|DOJO_AES_KEY=.*|DOJO_AES_KEY=$DOJO_AES|" .env

    echo "Секреты сгенерированы в .env"
else
    echo ".env уже существует, пропускаем генерацию"
fi

echo ""
echo "=== Установка завершена! ==="
echo ""
echo "Следующие шаги:"
echo "1. Отредактируй .env файл (особенно GITEA_RUNNER_TOKEN)"
echo "2. Запусти: podman-compose up -d"
echo "3. Открой Gitea: http://localhost:3000"
echo "4. Создай пользователя и репозиторий"
echo "5. Сгенерируй Runner Token: Settings -> Actions -> Runners"
echo "6. Добавь токен в .env и перезапусти runner:"
echo "   podman-compose up -d gitea-runner"
echo ""
echo "URLs сервисов:"
echo "  - Gitea:            http://localhost:3000"
echo "  - SonarQube:        http://localhost:9000 (admin/admin)"
echo "  - Dependency-Track: http://localhost:8080"
echo "  - DefectDojo:       http://localhost:8000"
echo "  - ZAP API:          http://localhost:8090"
echo "  - Trivy Server:     http://localhost:4954"
