# Гайд по созданию Demo GIFs для лендинга

## Инструменты

### Запись экрана
- **Android**: встроенная запись или ADB `adb shell screenrecord`
- **iOS**: встроенная запись (Control Center)
- **Web**: OBS Studio или браузерное расширение

### Конвертация в GIF
```bash
# FFmpeg — лучший вариант
ffmpeg -i input.mp4 -vf "fps=15,scale=360:-1:flags=lanczos" -loop 0 output.gif

# Или онлайн: ezgif.com, cloudconvert.com
```

---

## Чеклист для каждого GIF

- [ ] **Длительность**: 5-10 секунд (макс 15)
- [ ] **Разрешение**: 360px ширина (для быстрой загрузки)
- [ ] **FPS**: 15 кадров/сек
- [ ] **Зацикленность**: да, бесшовный loop если возможно
- [ ] **Размер файла**: до 2MB

---

## Сценарии для каждой функции

### 1. poseTracking.gif
**Что снимать**: Workout Session с включённой камерой
**Сценарий**:
1. Открыть тренировку
2. Начать приседания
3. Показать как skeleton overlay отслеживает движения
4. Показать счётчик повторений +1, +2, +3
**Длительность**: 8 сек

### 2. exercises.gif
**Что снимать**: Exercise Picker модалка
**Сценарий**:
1. Нажать "Start Workout"
2. Показать сетку из 15 упражнений
3. Пролистать вниз
4. Выбрать одно упражнение
**Длительность**: 5 сек

### 3. smartKitchen.gif
**Что снимать**: Kitchen tab
**Сценарий**:
1. Открыть вкладку Kitchen
2. Нажать "Scan Products"
3. Показать камеру сканирующую полку
4. Продукты появляются в списке
**Длительность**: 8 сек

### 4. cookingMode.gif
**Что снимать**: Cooking Mode с активным рецептом
**Сценарий**:
1. Выбрать рецепт
2. Нажать "Start Cooking"
3. Показать шаг 1 → шаг 2
4. Запустить таймер
5. Показать напоминание "помешать"
**Длительность**: 10 сек

### 5. nutritionScanner.gif
**Что снимать**: Food scanning flow
**Сценарий**:
1. Нажать "Photo Food" на Dashboard
2. Камера открывается
3. Сфоткать еду (реальную или картинку)
4. Результат: название + калории + КБЖУ
**Длительность**: 8 сек

### 6. smartScale.gif
**Что снимать**: Weight scanning или Scale connection
**Сценарий**:
1. Открыть Settings → Device Settings
2. Нажать "Connect Scale"
3. Показать Bluetooth scanning
4. Весы подключены → данные появились
**Длительность**: 7 сек

### 7. healthIntegrations.gif
**Что снимать**: Health Connect settings
**Сценарий**:
1. Открыть Settings
2. Показать Health Connect секцию
3. Включить синхронизацию
4. Показать "Synced" статус
**Длительность**: 5 сек

### 8. offlineFirst.gif
**Что снимать**: Offline indicator + sync
**Сценарий**:
1. Показать app в offline режиме (airplane mode)
2. Добавить тренировку
3. Включить интернет
4. Показать sync indicator → synced
**Длительность**: 8 сек

### 9. multiLanguage.gif
**Что снимать**: Language switcher
**Сценарий**:
1. Открыть Settings
2. Найти Language selector
3. Переключить EN → RU → ES
4. Показать как интерфейс меняется
**Длительность**: 6 сек

### 10. multiPlatform.gif
**Что снимать**: Split screen или последовательно
**Сценарий**:
1. Показать app на телефоне
2. Показать тот же аккаунт на веб
3. Показать Telegram Mini App
**Длительность**: 8 сек (или 3 отдельных коротких)

### 11. aiCoach.gif
**Что снимать**: Motivation quote + voice selection
**Сценарий**:
1. Показать Dashboard с motivation banner
2. Открыть Settings → AI Coach
3. Переключить голос Fenrir → Kore
4. Показать новую мотивационную фразу
**Длительность**: 7 сек

### 12. smartShopping.gif
**Что снимать**: Shopping Assistant tab
**Сценарий**:
1. Открыть Shopping tab
2. Показать сгенерированный список покупок
3. Отметить пару items как купленные
4. Нажать "Scan Shelf" (если есть)
**Длительность**: 8 сек

### 13. foodFinance.gif
**Что снимать**: Food Finance component
**Сценарий**:
1. Открыть Nutrition → Finance tab
2. Показать расходы за месяц
3. Показать сравнение "дома vs рестораны"
4. Показать экономию
**Длительность**: 7 сек

### 14. receiptScanning.gif
**Что снимать**: Receipt scan flow
**Сценарий**:
1. Открыть Kitchen
2. Нажать "Scan Receipt"
3. Сфоткать чек
4. Продукты добавляются автоматически
**Длительность**: 8 сек

### 15. gamification.gif
**Что снимать**: Social/Leaderboard tab
**Сценарий**:
1. Открыть Social tab
2. Показать свою позицию
3. Показать streak fire icon
4. (если есть) показать achievement popup
**Длительность**: 6 сек

### 16. charts.gif
**Что снимать**: Charts component на Dashboard
**Сценарий**:
1. Открыть Dashboard
2. Нажать "Detailed History"
3. Показать weight chart
4. Переключить на workout chart
**Длительность**: 7 сек

---

## Пост-обработка

### Оптимизация размера
```bash
# Уменьшить количество цветов
gifsicle -O3 --colors 128 input.gif -o optimized.gif

# Или через FFmpeg с palettegen
ffmpeg -i input.mp4 -vf "fps=12,scale=320:-1:flags=lanczos,palettegen" palette.png
ffmpeg -i input.mp4 -i palette.png -lavfi "fps=12,scale=320:-1:flags=lanczos[x];[x][1:v]paletteuse" output.gif
```

### Добавление рамки телефона (опционально)
Можно наложить PNG mockup телефона поверх записи экрана для более профессионального вида.

---

## Структура файлов

```
landing/
├── demos/
│   ├── poseTracking.gif
│   ├── exercises.gif
│   ├── smartKitchen.gif
│   ├── cookingMode.gif
│   ├── nutritionScanner.gif
│   ├── smartScale.gif
│   ├── healthIntegrations.gif
│   ├── offlineFirst.gif
│   ├── multiLanguage.gif
│   ├── multiPlatform.gif
│   ├── aiCoach.gif
│   ├── smartShopping.gif
│   ├── foodFinance.gif
│   ├── receiptScanning.gif
│   ├── gamification.gif
│   └── charts.gif
```

---

## Приоритет записи

**Высокий (ключевые USP)**:
1. poseTracking — главная фича
2. nutritionScanner — wow-эффект
3. smartKitchen — уникальность
4. cookingMode — engagement

**Средний**:
5. charts
6. smartScale
7. smartShopping
8. receiptScanning

**Низкий (можно статичными картинками)**:
9. multiLanguage
10. multiPlatform
11. offlineFirst
12. healthIntegrations
