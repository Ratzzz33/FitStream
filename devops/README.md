# FitStream DevSecOps Stack

Self-hosted CI/CD и security scanning на базе Podman.

## Варианты развёртывания

| Файл | Описание | RAM |
|------|----------|-----|
| `podman-compose.github-minimal.yml` | GitHub Runner + Trivy | 4GB |
| `podman-compose.github.yml` | GitHub Runner + полный стек | 16GB |
| `podman-compose.yml` | Gitea + полный стек | 16GB |
| `podman-compose.minimal.yml` | Gitea минимальный | 4GB |

## Компоненты

| Сервис | Порт | Назначение |
|--------|------|------------|
| GitHub Runner | - | CI/CD executor |
| SonarQube | 9000 | SAST, Code Quality |
| Dependency-Track | 8080 | SCA Dashboard |
| DefectDojo | 8000 | Vulnerability Management |
| Trivy | 4954 | Container/SCA Scanner |

---

## 🚀 Быстрый старт (GitHub Actions)

```bash
# 1. Клонируй и перейди в devops
cd devops

# 2. Запусти интерактивную установку
chmod +x setup-github-runner.sh
./setup-github-runner.sh

# 3. Следуй инструкциям (понадобится GitHub PAT)
```

### Создание GitHub PAT

1. Открой https://github.com/settings/tokens
2. **Generate new token (classic)**
3. Выбери scopes:
   - `repo` (полный доступ к приватным репозиториям)
   - `workflow` (для управления Actions)
4. Скопируй токен

### Ручной запуск

```bash
# Минимальная конфигурация (4GB RAM)
cp .env.github.example .env
nano .env  # заполни GITHUB_REPO_URL и GITHUB_PAT
podman-compose -f podman-compose.github-minimal.yml up -d

# Полная конфигурация (16GB RAM)
podman-compose -f podman-compose.github.yml up -d
```

---

## GitHub Repository Settings

После запуска раннера настрой в репозитории:

### Secrets (Settings → Secrets and variables → Actions)

| Secret | Описание |
|--------|----------|
| `SONAR_TOKEN` | Токен SonarQube (если используется) |
| `DTRACK_API_KEY` | API ключ Dependency-Track |

### Variables (Settings → Secrets and variables → Actions → Variables)

| Variable | Значение |
|----------|----------|
| `SONAR_ENABLED` | `true` / `false` |
| `SONAR_HOST_URL` | `http://sonarqube:9000` |
| `DTRACK_ENABLED` | `true` / `false` |
| `DTRACK_URL` | `http://dependency-track-api:8080` |

---

## Минимальные требования

| Конфигурация | CPU | RAM | Disk |
|--------------|-----|-----|------|
| Минимальная | 2 cores | 4GB | 20GB |
| Полная | 4 cores | 16GB | 50GB |

**OS:** Linux с Podman 4.0+ (Ubuntu 22.04+, Fedora 38+, RHEL 9+)

---

## Полезные команды

```bash
# Статус раннера
podman logs -f github-runner

# Проверка регистрации
podman exec github-runner cat /home/runner/.runner

# Перезапуск раннера
podman-compose -f podman-compose.github-minimal.yml restart github-runner

# Остановка всего
podman-compose -f podman-compose.github-minimal.yml down

# Масштабирование раннеров
podman-compose -f podman-compose.github.yml up -d --scale github-runner=3
```

---

## Security Scanning Tools

### SAST (Static Application Security Testing)
- **Semgrep**: Быстрый pattern-based анализ (в pipeline)
- **SonarQube**: Глубокий анализ + code quality

### SCA (Software Composition Analysis)
- **npm audit**: Встроенный в npm
- **Trivy**: Сканер зависимостей + контейнеров
- **Dependency-Track**: Централизованный SBOM management

### DAST (Dynamic Application Security Testing)
- **OWASP ZAP**: Web application scanner (в pipeline)

### Secrets Detection
- **Gitleaks**: Поиск секретов в git history

---

## Troubleshooting

### Runner не регистрируется
```bash
# Проверь логи
podman logs github-runner

# Проверь PAT - должны быть права repo + workflow
# Проверь URL репозитория
```

### SonarQube не запускается
```bash
# Проверь sysctl
sysctl vm.max_map_count  # должно быть >= 262144

# Если меньше:
sudo sysctl -w vm.max_map_count=524288
```

### Podman socket не найден
```bash
# Включи и запусти
systemctl --user enable --now podman.socket

# Проверь
ls -la /run/user/$(id -u)/podman/podman.sock
```
