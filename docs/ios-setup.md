# iOS Build Setup Guide

Инструкция по настройке автоматической сборки iOS через GitHub Actions.

## Требования

- Apple Developer Account ($99/год)
- Доступ к App Store Connect
- GitHub репозиторий с настроенными Secrets

## Шаг 1: Получение Team ID

1. Зайди на https://developer.apple.com/account
2. В меню слева выбери **Membership**
3. Скопируй **Team ID** (10 символов, например: `ABCD1234EF`)

## Шаг 2: Создание App ID

1. Зайди на https://developer.apple.com/account/resources/identifiers/list
2. Нажми **+** → **App IDs** → **App**
3. Заполни:
   - Description: `FitStream`
   - Bundle ID: `com.fitstream.app` (Explicit)
4. Включи Capabilities:
   - ✅ Push Notifications
   - ✅ Sign In with Apple (опционально)
5. Нажми **Continue** → **Register**

## Шаг 3: Создание Signing Certificate

### Вариант A: Через Keychain Access (Mac)

1. Открой Keychain Access
2. Certificate Assistant → Request a Certificate From a Certificate Authority
3. Заполни email, выбери "Saved to disk"
4. Сохрани `.certSigningRequest` файл

### Вариант B: Через OpenSSL (любая ОС)

```bash
# Генерация приватного ключа
openssl genrsa -out ios_distribution.key 2048

# Создание CSR
openssl req -new -key ios_distribution.key -out ios_distribution.csr \
  -subj "/emailAddress=your@email.com/CN=Your Name/C=RU"
```

### Загрузка в Apple Developer

1. Зайди на https://developer.apple.com/account/resources/certificates/list
2. Нажми **+** → **Apple Distribution**
3. Загрузи `.csr` файл
4. Скачай `.cer` сертификат

### Конвертация в .p12

```bash
# Конвертируй .cer в .pem
openssl x509 -in distribution.cer -inform DER -out distribution.pem -outform PEM

# Создай .p12 с паролем
openssl pkcs12 -export -out distribution.p12 \
  -inkey ios_distribution.key \
  -in distribution.pem \
  -password pass:YOUR_P12_PASSWORD
```

## Шаг 4: Создание Provisioning Profile

1. Зайди на https://developer.apple.com/account/resources/profiles/list
2. Нажми **+** → **App Store Connect** (для distribution)
3. Выбери App ID: `com.fitstream.app`
4. Выбери сертификат (созданный в Шаге 3)
5. Назови профиль: `FitStream Distribution`
6. Скачай `.mobileprovision` файл

## Шаг 5: App Store Connect API Key

1. Зайди на https://appstoreconnect.apple.com/access/integrations/api
2. Нажми **+** для создания нового ключа
3. Назови: `GitHub Actions`
4. Роль: **App Manager** или **Admin**
5. Скачай `.p8` файл (только один раз!)
6. Запиши **Key ID** и **Issuer ID**

## Шаг 6: Настройка GitHub Secrets

Перейди в Settings → Secrets and variables → Actions → New repository secret

| Secret Name | Значение |
|-------------|----------|
| `APPLE_TEAM_ID` | Твой Team ID (10 символов) |
| `APPLE_CERTIFICATE_BASE64` | `base64 -i distribution.p12` |
| `APPLE_CERTIFICATE_PASSWORD` | Пароль от .p12 файла |
| `APPLE_PROVISIONING_PROFILE_BASE64` | `base64 -i FitStream_Distribution.mobileprovision` |
| `APPLE_PROVISIONING_PROFILE_NAME` | `FitStream Distribution` |
| `APPLE_CODE_SIGN_IDENTITY` | `Apple Distribution: Your Name (TEAM_ID)` |
| `APP_STORE_CONNECT_API_KEY_ID` | Key ID из Шага 5 |
| `APP_STORE_CONNECT_ISSUER_ID` | Issuer ID из Шага 5 |
| `APP_STORE_CONNECT_API_KEY` | Содержимое .p8 файла |
| `KEYCHAIN_PASSWORD` | Любой безопасный пароль |

### Конвертация файлов в Base64

```bash
# macOS/Linux
base64 -i distribution.p12 | pbcopy  # копирует в буфер

# Windows (PowerShell)
[Convert]::ToBase64String([IO.File]::ReadAllBytes("distribution.p12")) | Set-Clipboard
```

## Шаг 7: Google Sign-In для iOS

1. Зайди в Google Cloud Console → APIs & Services → Credentials
2. Create Credentials → OAuth client ID
3. Application type: **iOS**
4. Bundle ID: `com.fitstream.app`
5. Скопируй **iOS Client ID**
6. Добавь в GitHub Secrets: `GOOGLE_IOS_CLIENT_ID`

## Запуск сборки

### Автоматически
- Push в `main` → сборка и загрузка в TestFlight

### Вручную
1. Actions → iOS Build → Run workflow
2. Выбери `upload_to_testflight: true` если нужно

## Troubleshooting

### "No signing certificate found"
- Проверь что `APPLE_CERTIFICATE_BASE64` правильно закодирован
- Убедись что сертификат не истёк

### "Provisioning profile doesn't match"
- Bundle ID в профиле должен быть `com.fitstream.app`
- Сертификат должен быть включён в профиль

### "App Store Connect upload failed"
- Проверь что API Key имеет права App Manager
- Убедись что приложение создано в App Store Connect

## Создание приложения в App Store Connect

1. Зайди на https://appstoreconnect.apple.com/apps
2. Нажми **+** → **New App**
3. Заполни:
   - Platform: iOS
   - Name: FitStream
   - Primary Language: Russian
   - Bundle ID: com.fitstream.app
   - SKU: fitstream-app
4. После первой загрузки в TestFlight, приложение появится
