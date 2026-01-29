# FitStream Android Release Guide

## Подготовка к публикации в Google Play

### 1. Предварительные требования

- [Android Studio](https://developer.android.com/studio) (последняя версия)
- Java JDK 17+
- Google Play Developer аккаунт ($25 одноразово)

### 2. Создание подписи (Keystore)

#### Вариант A: Через командную строку

```bash
# Windows (PowerShell)
keytool -genkey -v -keystore android/fitstream-release.keystore -alias fitstream -keyalg RSA -keysize 2048 -validity 10000

# Вас попросят ввести:
# - Пароль keystore (запомните!)
# - Имя и фамилию
# - Организацию
# - Город, регион, страну
```

#### Вариант B: Через Android Studio

1. Build → Generate Signed Bundle / APK
2. Create new... (создать новый keystore)
3. Заполните данные

### 3. Настройка keystore.properties

Создайте файл `android/keystore.properties`:

```properties
storePassword=ВАШ_ПАРОЛЬ_KEYSTORE
keyPassword=ВАШ_ПАРОЛЬ_KEY
keyAlias=fitstream
storeFile=fitstream-release.keystore
```

⚠️ **ВАЖНО:** Не коммитьте этот файл в Git!

### 4. Сборка приложения

```bash
# 1. Собрать веб-приложение
npm run build

# 2. Синхронизировать с Android
npm run cap:build:android

# 3. Открыть Android Studio
npm run cap:android
```

### 5. Генерация AAB для Google Play

В Android Studio:

1. **Build** → **Generate Signed Bundle / APK**
2. Выберите **Android App Bundle**
3. Укажите путь к keystore
4. Введите пароли
5. Выберите **release** build variant
6. Нажмите **Finish**

Файл появится в: `android/app/release/app-release.aab`

### 6. Публикация в Google Play Console

#### 6.1 Создание приложения

1. Зайдите в [Google Play Console](https://play.google.com/console)
2. **Create app** → Заполните информацию

#### 6.2 Необходимые материалы

| Элемент | Требования |
|---------|------------|
| Иконка приложения | 512x512 PNG (есть в `public/icons/icon-512.png`) |
| Feature Graphic | 1024x500 PNG |
| Скриншоты | Минимум 2 для телефона |
| Краткое описание | До 80 символов |
| Полное описание | До 4000 символов |
| Privacy Policy | URL на политику конфиденциальности |

#### 6.3 Internal Testing (быстрый старт)

1. **Testing** → **Internal testing** → **Create new release**
2. Загрузите AAB файл
3. Добавьте email адреса тестеров (до 100)
4. **Save** → **Review release** → **Start rollout**

Тестеры получат ссылку для установки сразу после публикации.

### 7. Версионирование

При каждом обновлении увеличьте в `android/app/build.gradle`:

```gradle
defaultConfig {
    versionCode 2  // Увеличивайте на 1 каждый раз
    versionName "1.0.1"  // Семантическое версионирование
}
```

### 8. Полезные команды

```bash
# Проверить подключенные устройства
adb devices

# Установить APK на устройство
adb install android/app/build/outputs/apk/release/app-release.apk

# Просмотр логов
adb logcat | grep -i fitstream

# Очистить данные приложения
adb shell pm clear com.fitstream.app
```

### 9. Troubleshooting

#### "App not installed"
- Удалите старую версию приложения
- Проверьте, что APK подписан

#### "Keystore was tampered with"
- Проверьте правильность паролей в keystore.properties

#### "Target SDK version is too low"
- Убедитесь что `targetSdkVersion` в build.gradle ≥ 33

---

## Чеклист перед публикацией

- [ ] Keystore создан и сохранён в безопасном месте
- [ ] keystore.properties настроен
- [ ] Версия приложения обновлена
- [ ] AAB файл сгенерирован
- [ ] Privacy Policy URL готов
- [ ] Скриншоты подготовлены
- [ ] Описание на нужных языках
- [ ] Content rating заполнен
