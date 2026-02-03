// FitStream Landing Page Translations
// 15 languages for health-conscious, high-income countries

const i18n = {
    en: {
        _meta: { name: "English", flag: "🇬🇧" },
        nav: { features: "Features", aiPower: "AI Power", pricing: "Pricing", getStarted: "Get Started" },
        hero: {
            powered: "Powered by Google Gemini AI",
            title1: "Your AI-Powered", title2: "Fitness Companion",
            desc: "Track workouts, scan food for calories, read your scale with AI, and get personalized motivation — all in one beautiful app.",
            download: "Download Free", see: "See Features"
        },
        features: {
            title: "Everything You Need", subtitle: "Powerful features to transform your fitness journey",
            pose: "AI Pose Tracking", poseDesc: "Real-time form analysis with MediaPipe. 15 exercises with instant feedback.",
            kitchen: "Smart Kitchen", kitchenDesc: "Manage fridge, pantry & freezer. AI recognizes products from photos.",
            cooking: "Guided Cooking", cookingDesc: "Step-by-step recipes with timers, reminders & troubleshooting tips.",
            coach: "AI Workout Coach", coachDesc: "Real-time guidance and rep counting with voice feedback",
            scale: "AI Scale Scanner", scaleDesc: "Point your camera at any scale — AI reads automatically",
            food: "AI Food Scanner", foodDesc: "Snap a photo for instant calorie and macro estimates",
            receipt: "Receipt Scanning", receiptDesc: "Scan grocery receipts to auto-add products with prices & expiry dates.",
            finance: "Food Finance", financeDesc: "Track food spending. Calculate savings from home cooking vs eating out.",
            health: "Health Platform Sync", healthDesc: "Seamless sync with Google Fit, Apple Health & Samsung Health.",
            goals: "Daily Goals", goalsDesc: "Set custom goals for steps, pushups, squats, and more",
            charts: "Progress Charts", chartsDesc: "Visualize your weight and workout history",
            offline: "Offline First", offlineDesc: "Works without internet — syncs when back online",
            shop: "Shopping Assistant", shopDesc: "AI plans meals and creates smart shopping lists"
        },
        ai: {
            powered: "Powered by Advanced Gemini",
            title1: "AI That Actually", title2: "Understands Fitness",
            desc: "Our AI doesn't just count — it sees, understands, and adapts.",
            vision: "Vision AI", visionDesc: "Reads scales, identifies food, analyzes menus",
            portion: "Smart Portion Estimation", portionDesc: "Uses reference objects for accurate portions",
            motivation: "Personalized Motivation", motivationDesc: "AI adapts encouragement to your progress"
        },
        pricing: {
            title: "Pay As You Go", subtitle: "Free app, pay only for AI features you use",
            howItWorks: "How It Works",
            step1Title: "3-Day Free Trial", step1Desc: "Try all AI features for free. See how much you'd spend.",
            step2Title: "Top Up Balance", step2Desc: "Add funds via PayPal. Start from just $5.",
            step3Title: "Use AI Features", step3Desc: "Each scan costs $0.05. Average user: ~$5/month.",
            free: "Always Free", freeSub: "Core features without AI", forever: "forever",
            aiFeatures: "AI Features", aiSub: "Pay only for what you use", payPerUse: "PAY PER USE",
            fromPrice: "from $0.05", perScan: "scan",
            f1: "Unlimited workouts & tracking", f2: "850+ offline recipes", f3: "Manual food logging", f4: "Daily Goals & Streaks", f5: "Progress Charts", f6: "Offline mode",
            p1: "Food Scanner — $0.05/scan", p2: "Scale Reader — $0.02/scan", p3: "Receipt Scanner — $0.06/scan", p4: "Fridge Scanner — $0.06/scan", p5: "Menu Analyzer — $0.05/scan", p6: "AI Recipes — $0.01/recipe",
            startFree: "Get Started Free", tryFree: "Try Free for 3 Days",
            packages: "Top-Up Packages", pkg1: "~100 scans", pkg2: "~220 scans", pkg3: "~600 scans"
        },
        download: {
            title1: "Ready to Transform", title2: "Your Fitness?",
            desc: "Download FitStream now and start your AI-powered fitness journey",
            appStore: "App Store", googlePlay: "Google Play", web: "Web Browser",
            on: "Download on the", get: "Get it on", use: "Use in"
        },
        footer: { privacy: "Privacy Policy", terms: "Terms of Service", contact: "Contact", rights: "All rights reserved." },
        phone: {
            tracking: "AI-Powered Tracking", streak: "STREAK",
            motivation: "Every rep counts. Keep pushing!",
            steps: "Steps", squats: "Squats", pushups: "Pushups", situps: "Situps",
            dashboard: "Home", nutrition: "Food", workout: "Train", social: "Friends", settings: "Settings",
            tap: "Tap rings to add progress!",
            water: "Water Intake", glasses: "glasses", calories: "Calories Burned", kcal: "kcal",
            leaderboard: "Leaderboard", you: "YOU", points: "pts",
            theme: "Theme", dark: "Dark", light: "Light", lang: "Language"
        },
        modal: {
            pose: ["Real-time pose detection with MediaPipe", "15 different exercises supported", "Instant feedback on form", "Rep counting with AI", "Works on any camera"],
            kitchen: ["Track products in fridge, pantry & freezer", "AI recognizes products from photos", "Expiry date tracking", "Smart shopping lists", "Low stock notifications"],
            cooking: ["Step-by-step recipe guidance", "Built-in cooking timers", "Voice reminders", "Troubleshooting tips", "Ingredient substitutions"],
            coach: ["Real-time voice guidance", "Automatic rep counting", "Form correction tips", "Customizable voice (male/female)", "Workout history tracking"],
            scale: ["Point camera at any scale", "AI reads weight automatically", "Works with digital & analog scales", "Phone tare weight support", "Trend tracking"],
            food: ["Instant calorie estimation", "Macro breakdown (protein, carbs, fat)", "Reference object for accuracy", "Meal history logging", "Daily nutrition summary"],
            receipt: ["Scan grocery receipts", "Auto-extract products & prices", "Expiry date estimation", "Price history tracking", "Budget insights"],
            finance: ["Track food spending", "Home cooking vs eating out", "Monthly budget reports", "Savings calculator", "Cost per meal analysis"],
            health: ["Google Fit integration", "Apple Health sync", "Samsung Health Connect", "Steps & activity data", "Sleep tracking import"],
            goals: ["Custom daily goals", "Steps, pushups, squats & more", "Streak tracking", "Progress visualization", "Reminder notifications"],
            charts: ["Weight trend charts", "Workout history graphs", "Progress over time", "Body composition tracking", "Export data as CSV"],
            offline: ["Full offline functionality", "Automatic sync when online", "No data loss", "Local storage backup", "Works anywhere"],
            shop: ["AI meal planning for any period", "Smart shopping list generation", "Shelf scanner finds products", "Product verification via photo", "Health score for items"],
            gotIt: "Got it!"
        },
        testimonials: {
            title: "What Users Say",
            subtitle: "Real reviews from real athletes",
            name: "James Cooper",
            role: "Fitness Enthusiast",
            review: "FitStream gave me the data-driven approach I needed. The AI scale reader saves me time every morning, and the progress charts keep me accountable week after week.",
            avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=JamesCooper&backgroundColor=b6e3f4"
        }
    },
    ru: {
        _meta: { name: "Русский", flag: "🇷🇺" },
        nav: { features: "Функции", aiPower: "Сила ИИ", pricing: "Цены", getStarted: "Начать" },
        hero: {
            powered: "На базе Google Gemini AI",
            title1: "Ваш ИИ-помощник", title2: "для фитнеса",
            desc: "Отслеживайте тренировки, сканируйте еду, считывайте весы с помощью ИИ и получайте мотивацию — всё в одном приложении.",
            download: "Скачать бесплатно", see: "Смотреть функции"
        },
        features: {
            title: "Всё что нужно", subtitle: "Мощные функции для вашего фитнес-пути",
            pose: "ИИ-трекинг позы", poseDesc: "Анализ формы в реальном времени с MediaPipe. 15 упражнений с обратной связью.",
            kitchen: "Умная кухня", kitchenDesc: "Управление холодильником, шкафом и морозилкой. ИИ распознаёт продукты по фото.",
            cooking: "Режим готовки", cookingDesc: "Пошаговые рецепты с таймерами, напоминаниями и советами.",
            coach: "ИИ-тренер", coachDesc: "Голосовое сопровождение и подсчёт повторений",
            scale: "ИИ-сканер весов", scaleDesc: "Наведите камеру — ИИ считает вес автоматически",
            food: "ИИ-сканер еды", foodDesc: "Сфото для мгновенной оценки калорий и БЖУ",
            receipt: "Сканирование чеков", receiptDesc: "Сканируйте чеки для автодобавления продуктов с ценами и сроками.",
            finance: "Расходы на еду", financeDesc: "Отслеживайте траты. Считайте экономию от домашней готовки.",
            health: "Синхронизация здоровья", healthDesc: "Интеграция с Google Fit, Apple Health и Samsung Health.",
            goals: "Дневные цели", goalsDesc: "Цели по шагам, отжиманиям, приседаниям",
            charts: "Графики прогресса", chartsDesc: "Визуализация истории веса и тренировок",
            offline: "Работает офлайн", offlineDesc: "Без интернета — синхронизация автоматически",
            shop: "Помощник покупок", shopDesc: "ИИ планирует меню и создаёт умные списки"
        },
        ai: {
            powered: "На базе Advanced Gemini",
            title1: "ИИ, который", title2: "понимает фитнес",
            desc: "Наш ИИ не просто считает — он видит, понимает и адаптируется.",
            vision: "Компьютерное зрение", visionDesc: "Читает весы, определяет еду, анализирует меню",
            portion: "Умная оценка порций", portionDesc: "Эталонные объекты для точного расчёта",
            motivation: "Персональная мотивация", motivationDesc: "ИИ адаптирует поддержку под ваш прогресс"
        },
        pricing: {
            title: "Плати за использование", subtitle: "Приложение бесплатно, платите только за ИИ-функции",
            howItWorks: "Как это работает",
            step1Title: "3 дня бесплатно", step1Desc: "Попробуйте все ИИ-функции. Увидите сколько бы потратили.",
            step2Title: "Пополните баланс", step2Desc: "Добавьте средства через PayPal. От $5.",
            step3Title: "Используйте ИИ", step3Desc: "Каждый скан ~$0.05. В среднем ~$5/мес.",
            free: "Всегда бесплатно", freeSub: "Базовые функции без ИИ", forever: "навсегда",
            aiFeatures: "ИИ-функции", aiSub: "Платите только за то, что используете", payPerUse: "ПО ИСПОЛЬЗОВАНИЮ",
            fromPrice: "от $0.05", perScan: "скан",
            f1: "Безлимитные тренировки", f2: "850+ офлайн рецептов", f3: "Ручной ввод еды", f4: "Цели и серии", f5: "Графики прогресса", f6: "Офлайн режим",
            p1: "Сканер еды — $0.05/скан", p2: "Чтение весов — $0.02/скан", p3: "Сканер чеков — $0.06/скан", p4: "Сканер холодильника — $0.06/скан", p5: "Анализатор меню — $0.05/скан", p6: "ИИ рецепты — $0.01/рецепт",
            startFree: "Начать бесплатно", tryFree: "Попробовать 3 дня бесплатно",
            packages: "Пакеты пополнения", pkg1: "~100 сканов", pkg2: "~220 сканов", pkg3: "~600 сканов"
        },
        download: {
            title1: "Готовы изменить", title2: "свой фитнес?",
            desc: "Скачайте FitStream и начните путь с ИИ-помощником",
            appStore: "App Store", googlePlay: "Google Play", web: "браузере",
            on: "Скачать в", get: "Доступно в", use: "Открыть в"
        },
        footer: { privacy: "Конфиденциальность", terms: "Условия", contact: "Контакты", rights: "Все права защищены." },
        phone: {
            tracking: "ИИ-трекинг", streak: "СЕРИЯ",
            motivation: "Каждое повторение важно. Продолжай!",
            steps: "Шаги", squats: "Присед", pushups: "Отжим", situps: "Пресс",
            dashboard: "Главная", nutrition: "Еда", workout: "Трен", social: "Друзья", settings: "Настр",
            tap: "Нажмите на кольца!",
            water: "Вода", glasses: "стак.", calories: "Сожжено", kcal: "ккал",
            leaderboard: "Рейтинг", you: "ВЫ", points: "очк",
            theme: "Тема", dark: "Тёмная", light: "Светлая", lang: "Язык"
        },
        modal: {
            pose: ["Отслеживание позы в реальном времени с MediaPipe", "Поддержка 15 упражнений", "Мгновенная обратная связь по форме", "Подсчёт повторений с ИИ", "Работает с любой камерой"],
            kitchen: ["Отслеживание продуктов в холодильнике и морозилке", "ИИ распознаёт продукты по фото", "Контроль сроков годности", "Умные списки покупок", "Уведомления о заканчивающихся продуктах"],
            cooking: ["Пошаговые инструкции рецептов", "Встроенные таймеры готовки", "Голосовые напоминания", "Советы по устранению проблем", "Замена ингредиентов"],
            coach: ["Голосовое сопровождение в реальном времени", "Автоматический подсчёт повторений", "Советы по коррекции формы", "Настраиваемый голос (муж/жен)", "История тренировок"],
            scale: ["Наведите камеру на любые весы", "ИИ автоматически считывает вес", "Работает с цифровыми и аналоговыми весами", "Поддержка тары телефона", "Отслеживание трендов"],
            food: ["Мгновенная оценка калорий", "Разбивка по макросам (белки, углеводы, жиры)", "Эталонный объект для точности", "Журнал приёмов пищи", "Дневная сводка питания"],
            receipt: ["Сканирование чеков из магазина", "Автоизвлечение продуктов и цен", "Оценка сроков годности", "История цен", "Аналитика бюджета"],
            finance: ["Отслеживание расходов на еду", "Домашняя готовка vs кафе", "Месячные отчёты по бюджету", "Калькулятор экономии", "Анализ стоимости за приём пищи"],
            health: ["Интеграция с Google Fit", "Синхронизация с Apple Health", "Samsung Health Connect", "Данные о шагах и активности", "Импорт трекинга сна"],
            goals: ["Пользовательские дневные цели", "Шаги, отжимания, приседания и др.", "Отслеживание серий", "Визуализация прогресса", "Напоминания"],
            charts: ["Графики динамики веса", "Графики истории тренировок", "Прогресс со временем", "Отслеживание состава тела", "Экспорт данных в CSV"],
            offline: ["Полная работа офлайн", "Автосинхронизация при подключении", "Без потери данных", "Локальное резервное копирование", "Работает везде"],
            shop: ["ИИ планирование меню на любой срок", "Умная генерация списка покупок", "Сканер полки находит продукты", "Проверка продукта по фото", "Оценка полезности товаров"],
            gotIt: "Понятно!"
        },
        testimonials: {
            title: "Что говорят пользователи",
            subtitle: "Реальные отзывы реальных спортсменов",
            name: "Алексей Петров",
            role: "Фитнес-энтузиаст",
            review: "Сначала не верил в очередное фитнес-приложение, но FitStream реально удивил. ИИ-сканер весов работает чётко, а трекер питания наконец-то считает калории без мучений. За 3 месяца скинул 8 кг — цифры не врут.",
            avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=AlexeyPetrov&backgroundColor=c0aede"
        }
    },
    de: {
        _meta: { name: "Deutsch", flag: "🇩🇪" },
        nav: { features: "Funktionen", aiPower: "KI-Power", pricing: "Preise", getStarted: "Loslegen" },
        hero: {
            powered: "Powered by Google Gemini AI",
            title1: "Dein KI-gestützter", title2: "Fitness-Begleiter",
            desc: "Verfolge Workouts, scanne Essen für Kalorien, lies deine Waage mit KI und erhalte personalisierte Motivation — alles in einer App.",
            download: "Kostenlos herunterladen", see: "Funktionen ansehen"
        },
        features: {
            title: "Alles was du brauchst", subtitle: "Leistungsstarke Funktionen für deine Fitness-Reise",
            pose: "KI-Haltungsanalyse", poseDesc: "Echtzeit-Formanalyse mit MediaPipe. 15 Übungen mit sofortigem Feedback.",
            kitchen: "Smarte Küche", kitchenDesc: "Verwalte Kühlschrank, Vorrat & Gefriertruhe. KI erkennt Produkte auf Fotos.",
            cooking: "Geführtes Kochen", cookingDesc: "Schritt-für-Schritt Rezepte mit Timern, Erinnerungen & Tipps.",
            coach: "KI-Workout-Coach", coachDesc: "Echtzeit-Anleitung und Wiederholungszählung mit Sprachfeedback",
            scale: "KI-Waagen-Scanner", scaleDesc: "Richte deine Kamera auf jede Waage — KI liest automatisch",
            food: "KI-Essens-Scanner", foodDesc: "Mach ein Foto für sofortige Kalorien- und Makroschätzungen",
            receipt: "Kassenbon-Scan", receiptDesc: "Scanne Kassenbons um Produkte automatisch mit Preisen hinzuzufügen.",
            finance: "Essens-Finanzen", financeDesc: "Verfolge Ausgaben. Berechne Ersparnisse durch Selbstkochen.",
            health: "Gesundheits-Sync", healthDesc: "Nahtlose Sync mit Google Fit, Apple Health & Samsung Health.",
            goals: "Tägliche Ziele", goalsDesc: "Setze Ziele für Schritte, Liegestütze, Kniebeugen und mehr",
            charts: "Fortschritts-Diagramme", chartsDesc: "Visualisiere dein Gewicht und Workout-Verlauf",
            offline: "Offline-First", offlineDesc: "Funktioniert ohne Internet — synchronisiert automatisch"
        },
        ai: {
            powered: "Powered by Advanced Gemini",
            title1: "KI die wirklich", title2: "Fitness versteht",
            desc: "Unsere KI zählt nicht nur — sie sieht, versteht und passt sich an.",
            vision: "Vision-KI", visionDesc: "Liest Waagen, erkennt Essen, analysiert Menüs",
            portion: "Smarte Portionsschätzung", portionDesc: "Nutzt Referenzobjekte für genaue Portionen",
            motivation: "Personalisierte Motivation", motivationDesc: "KI passt Ermutigung an deinen Fortschritt an"
        },
        pricing: {
            title: "Pay As You Go", subtitle: "Kostenlose App, zahle nur für KI-Funktionen",
            howItWorks: "So funktioniert's",
            step1Title: "3 Tage kostenlos", step1Desc: "Teste alle KI-Funktionen gratis. Sieh, was du ausgeben würdest.",
            step2Title: "Guthaben aufladen", step2Desc: "Füge Guthaben per PayPal hinzu. Ab nur $5.",
            step3Title: "KI-Funktionen nutzen", step3Desc: "Jeder Scan kostet $0.05. Durchschnitt: ~$5/Monat.",
            free: "Immer kostenlos", freeSub: "Basisfunktionen ohne KI", forever: "für immer",
            aiFeatures: "KI-Funktionen", aiSub: "Zahle nur was du nutzt", payPerUse: "PRO NUTZUNG",
            fromPrice: "ab $0.05", perScan: "Scan",
            f1: "Unbegrenzte Workouts & Tracking", f2: "850+ Offline-Rezepte", f3: "Manuelle Essensprotokolle", f4: "Tägliche Ziele & Streaks", f5: "Fortschritts-Diagramme", f6: "Offline-Modus",
            p1: "Essens-Scanner — $0.05/Scan", p2: "Waagen-Leser — $0.02/Scan", p3: "Kassenbon-Scanner — $0.06/Scan", p4: "Kühlschrank-Scanner — $0.06/Scan", p5: "Menü-Analyzer — $0.05/Scan", p6: "KI-Rezepte — $0.01/Rezept",
            startFree: "Kostenlos starten", tryFree: "3 Tage kostenlos testen",
            packages: "Aufladen-Pakete", pkg1: "~100 Scans", pkg2: "~220 Scans", pkg3: "~600 Scans",
            startFree: "Kostenlos starten", upgrade: "Auf PRO upgraden"
        },
        download: {
            title1: "Bereit deine", title2: "Fitness zu transformieren?",
            desc: "Lade FitStream jetzt herunter und starte deine KI-gestützte Fitness-Reise",
            appStore: "App Store", googlePlay: "Google Play", web: "Web Browser",
            on: "Laden im", get: "Jetzt bei", use: "Nutzen im"
        },
        footer: { privacy: "Datenschutz", terms: "AGB", contact: "Kontakt", rights: "Alle Rechte vorbehalten." },
        phone: {
            tracking: "KI-Tracking", streak: "SERIE",
            motivation: "Jede Wiederholung zählt. Weitermachen!",
            steps: "Schritte", squats: "Knieb.", pushups: "Liegest.", situps: "Situps",
            dashboard: "Start", nutrition: "Essen", workout: "Train", social: "Freunde", settings: "Einst.",
            tap: "Tippe auf Ringe!",
            water: "Wasser", glasses: "Gläser", calories: "Verbrannt", kcal: "kcal",
            leaderboard: "Rangliste", you: "DU", points: "Pkt",
            theme: "Design", dark: "Dunkel", light: "Hell", lang: "Sprache"
        },
        modal: {
            pose: ["Echtzeit-Haltungserkennung mit MediaPipe", "15 verschiedene Übungen unterstützt", "Sofortiges Feedback zur Form", "Rep-Zählung mit KI", "Funktioniert mit jeder Kamera"],
            kitchen: ["Produkte in Kühlschrank & Gefrierschrank verfolgen", "KI erkennt Produkte auf Fotos", "Ablaufdatum-Tracking", "Intelligente Einkaufslisten", "Benachrichtigungen bei niedrigem Bestand"],
            cooking: ["Schritt-für-Schritt Rezeptanleitung", "Eingebaute Kochtimer", "Spracherinnerungen", "Problemlösungstipps", "Zutatenaustausch"],
            coach: ["Echtzeit-Sprachanleitung", "Automatische Rep-Zählung", "Tipps zur Formkorrektur", "Anpassbare Stimme (m/w)", "Trainingshistorie"],
            scale: ["Kamera auf jede Waage richten", "KI liest Gewicht automatisch", "Funktioniert mit digitalen & analogen Waagen", "Telefon-Tara-Unterstützung", "Trend-Tracking"],
            food: ["Sofortige Kalorienschätzung", "Makro-Aufschlüsselung (Protein, Kohlenhydrate, Fett)", "Referenzobjekt für Genauigkeit", "Mahlzeiten-Protokoll", "Tägliche Ernährungsübersicht"],
            receipt: ["Kassenzettel scannen", "Produkte & Preise automatisch extrahieren", "Ablaufdatum-Schätzung", "Preishistorie", "Budget-Einblicke"],
            finance: ["Lebensmittelausgaben verfolgen", "Selbstkochen vs. Auswärts essen", "Monatliche Budgetberichte", "Spar-Rechner", "Kosten pro Mahlzeit"],
            health: ["Google Fit Integration", "Apple Health Sync", "Samsung Health Connect", "Schritte & Aktivitätsdaten", "Schlaf-Tracking Import"],
            goals: ["Benutzerdefinierte Tagesziele", "Schritte, Liegestütze, Kniebeugen & mehr", "Streak-Tracking", "Fortschrittsvisualisierung", "Erinnerungsbenachrichtigungen"],
            charts: ["Gewichtstrend-Diagramme", "Trainingshistorie-Grafiken", "Fortschritt über Zeit", "Körperzusammensetzung-Tracking", "Daten als CSV exportieren"],
            offline: ["Volle Offline-Funktionalität", "Automatische Sync wenn online", "Kein Datenverlust", "Lokale Speicher-Backup", "Funktioniert überall"],
            gotIt: "Verstanden!"
        },
        testimonials: {
            title: "Was Nutzer sagen",
            subtitle: "Echte Bewertungen von echten Sportlern",
            name: "Markus Weber",
            role: "Sportenthusiast",
            review: "Die Datengenauigkeit von FitStream ist beeindruckend. Der KI-Waagescanner liefert konsistente Ergebnisse, und die Fortschrittsdiagramme geben mir exakt die Kontrolle über mein Training, die ich brauche.",
            avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=MarkusWeber&backgroundColor=d1d4f9"
        }
    },
    fr: {
        _meta: { name: "Français", flag: "🇫🇷" },
        nav: { features: "Fonctions", aiPower: "IA Power", pricing: "Tarifs", getStarted: "Commencer" },
        hero: {
            powered: "Propulsé par Google Gemini AI",
            title1: "Votre compagnon", title2: "fitness IA",
            desc: "Suivez vos entraînements, scannez vos repas, lisez votre balance avec l'IA et recevez une motivation personnalisée — tout en une app.",
            download: "Télécharger gratuitement", see: "Voir les fonctions"
        },
        features: {
            title: "Tout ce qu'il vous faut", subtitle: "Des fonctionnalités puissantes pour transformer votre parcours fitness",
            coach: "Coach IA", coachDesc: "Guidage en temps réel et comptage des répétitions avec feedback vocal",
            scale: "Scanner de balance IA", scaleDesc: "Pointez votre caméra vers n'importe quelle balance — l'IA lit automatiquement",
            food: "Scanner alimentaire IA", foodDesc: "Prenez une photo pour une estimation instantanée des calories et macros",
            goals: "Objectifs quotidiens", goalsDesc: "Définissez des objectifs pour les pas, pompes, squats et plus",
            charts: "Graphiques de progrès", chartsDesc: "Visualisez votre poids et historique d'entraînement",
            offline: "Hors ligne d'abord", offlineDesc: "Fonctionne sans internet — synchronise automatiquement"
        },
        ai: {
            powered: "Propulsé par Advanced Gemini",
            title1: "Une IA qui comprend", title2: "vraiment le fitness",
            desc: "Notre IA ne compte pas seulement — elle voit, comprend et s'adapte.",
            vision: "Vision IA", visionDesc: "Lit les balances, identifie les aliments, analyse les menus",
            portion: "Estimation intelligente des portions", portionDesc: "Utilise des objets de référence pour des portions précises",
            motivation: "Motivation personnalisée", motivationDesc: "L'IA adapte les encouragements à votre progression"
        },
        pricing: {
            title: "Paiement à l'usage", subtitle: "Application gratuite, payez uniquement les fonctions IA utilisées",
            howItWorks: "Comment ça marche",
            step1Title: "3 jours gratuits", step1Desc: "Testez toutes les fonctions IA gratuitement. Voyez ce que vous dépenseriez.",
            step2Title: "Rechargez le solde", step2Desc: "Ajoutez des fonds via PayPal. À partir de $5.",
            step3Title: "Utilisez l'IA", step3Desc: "Chaque scan coûte $0.05. Moyenne: ~$5/mois.",
            free: "Toujours gratuit", freeSub: "Fonctions de base sans IA", forever: "pour toujours",
            aiFeatures: "Fonctions IA", aiSub: "Payez uniquement ce que vous utilisez", payPerUse: "À L'USAGE",
            fromPrice: "dès $0.05", perScan: "scan",
            f1: "Entraînements & suivi illimités", f2: "850+ recettes hors-ligne", f3: "Journal alimentaire manuel", f4: "Objectifs & Séries", f5: "Graphiques de progrès", f6: "Mode hors-ligne",
            p1: "Scanner alimentaire — $0.05/scan", p2: "Lecteur de balance — $0.02/scan", p3: "Scanner de reçus — $0.06/scan", p4: "Scanner frigo — $0.06/scan", p5: "Analyseur de menu — $0.05/scan", p6: "Recettes IA — $0.01/recette",
            startFree: "Commencer gratuitement", tryFree: "Essayer 3 jours gratuits",
            packages: "Forfaits recharge", pkg1: "~100 scans", pkg2: "~220 scans", pkg3: "~600 scans",
            startFree: "Commencer gratuitement", upgrade: "Passer à PRO"
        },
        download: {
            title1: "Prêt à transformer", title2: "votre fitness?",
            desc: "Téléchargez FitStream maintenant et commencez votre parcours fitness avec l'IA",
            appStore: "App Store", googlePlay: "Google Play", web: "Navigateur Web",
            on: "Télécharger sur", get: "Disponible sur", use: "Utiliser dans"
        },
        footer: { privacy: "Confidentialité", terms: "Conditions", contact: "Contact", rights: "Tous droits réservés." },
        phone: {
            tracking: "Suivi IA", streak: "SÉRIE",
            motivation: "Chaque répétition compte. Continuez!",
            steps: "Pas", squats: "Squats", pushups: "Pompes", situps: "Abdos",
            dashboard: "Accueil", nutrition: "Repas", workout: "Sport", social: "Amis", settings: "Param.",
            tap: "Touchez les anneaux!",
            water: "Eau", glasses: "verres", calories: "Brûlées", kcal: "kcal",
            leaderboard: "Classement", you: "VOUS", points: "pts",
            theme: "Thème", dark: "Sombre", light: "Clair", lang: "Langue"
        },
        modal: {
            pose: ["Détection de pose en temps réel avec MediaPipe", "15 exercices différents supportés", "Feedback instantané sur la forme", "Comptage des reps avec IA", "Fonctionne avec n'importe quelle caméra"],
            kitchen: ["Suivez les produits au frigo et congélateur", "L'IA reconnaît les produits sur photos", "Suivi des dates d'expiration", "Listes de courses intelligentes", "Notifications de stock bas"],
            cooking: ["Guidance de recette étape par étape", "Minuteries de cuisson intégrées", "Rappels vocaux", "Conseils de dépannage", "Substitutions d'ingrédients"],
            coach: ["Guidance vocale en temps réel", "Comptage automatique des reps", "Conseils de correction de forme", "Voix personnalisable (h/f)", "Historique d'entraînement"],
            scale: ["Pointez la caméra vers n'importe quelle balance", "L'IA lit le poids automatiquement", "Fonctionne avec balances numériques et analogiques", "Support de tare téléphone", "Suivi des tendances"],
            food: ["Estimation instantanée des calories", "Répartition des macros (protéines, glucides, lipides)", "Objet de référence pour précision", "Journal des repas", "Résumé nutritionnel quotidien"],
            receipt: ["Scanner les tickets de caisse", "Extraction auto des produits et prix", "Estimation date d'expiration", "Historique des prix", "Aperçus budget"],
            finance: ["Suivre les dépenses alimentaires", "Cuisine maison vs restaurant", "Rapports budget mensuels", "Calculateur d'économies", "Analyse coût par repas"],
            health: ["Intégration Google Fit", "Sync Apple Health", "Samsung Health Connect", "Données de pas et activité", "Import suivi sommeil"],
            goals: ["Objectifs quotidiens personnalisés", "Pas, pompes, squats et plus", "Suivi des séries", "Visualisation du progrès", "Notifications de rappel"],
            charts: ["Graphiques tendance de poids", "Graphiques historique d'entraînement", "Progrès dans le temps", "Suivi composition corporelle", "Export données en CSV"],
            offline: ["Fonctionnalité offline complète", "Sync auto quand en ligne", "Pas de perte de données", "Sauvegarde stockage local", "Fonctionne partout"],
            gotIt: "Compris!"
        },
        testimonials: {
            title: "Ce que disent nos utilisateurs",
            subtitle: "De vrais avis de vrais sportifs",
            name: "Sophie Martin",
            role: "Passionnée de bien-être",
            review: "FitStream allie élégance et efficacité. Le scanner alimentaire est d'une précision remarquable, et l'interface est si agréable qu'on prend plaisir à suivre ses progrès au quotidien.",
            avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=SophieMartin&backgroundColor=ffd5dc"
        }
    },
    es: {
        _meta: { name: "Español", flag: "🇪🇸" },
        nav: { features: "Funciones", aiPower: "Poder IA", pricing: "Precios", getStarted: "Empezar" },
        hero: {
            powered: "Impulsado por Google Gemini AI",
            title1: "Tu compañero", title2: "fitness con IA",
            desc: "Rastrea entrenamientos, escanea comida para calorías, lee tu báscula con IA y recibe motivación personalizada — todo en una app.",
            download: "Descargar gratis", see: "Ver funciones"
        },
        features: {
            title: "Todo lo que necesitas", subtitle: "Funciones potentes para transformar tu viaje fitness",
            coach: "Entrenador IA", coachDesc: "Guía en tiempo real y conteo de repeticiones con retroalimentación de voz",
            scale: "Escáner de báscula IA", scaleDesc: "Apunta tu cámara a cualquier báscula — la IA lee automáticamente",
            food: "Escáner de comida IA", foodDesc: "Toma una foto para estimaciones instantáneas de calorías y macros",
            goals: "Metas diarias", goalsDesc: "Establece metas para pasos, flexiones, sentadillas y más",
            charts: "Gráficos de progreso", chartsDesc: "Visualiza tu peso e historial de entrenamientos",
            offline: "Sin conexión primero", offlineDesc: "Funciona sin internet — sincroniza automáticamente"
        },
        ai: {
            powered: "Impulsado por Advanced Gemini",
            title1: "IA que realmente", title2: "entiende el fitness",
            desc: "Nuestra IA no solo cuenta — ve, entiende y se adapta.",
            vision: "Visión IA", visionDesc: "Lee básculas, identifica comida, analiza menús",
            portion: "Estimación inteligente de porciones", portionDesc: "Usa objetos de referencia para porciones precisas",
            motivation: "Motivación personalizada", motivationDesc: "La IA adapta el ánimo a tu progreso"
        },
        pricing: {
            title: "Pago por uso", subtitle: "App gratis, paga solo por las funciones de IA que usas",
            howItWorks: "Cómo funciona",
            step1Title: "3 días gratis", step1Desc: "Prueba todas las funciones de IA gratis. Ve cuánto gastarías.",
            step2Title: "Recarga saldo", step2Desc: "Añade fondos vía PayPal. Desde solo $5.",
            step3Title: "Usa funciones IA", step3Desc: "Cada escaneo cuesta $0.05. Promedio: ~$5/mes.",
            free: "Siempre gratis", freeSub: "Funciones básicas sin IA", forever: "para siempre",
            aiFeatures: "Funciones IA", aiSub: "Paga solo por lo que usas", payPerUse: "POR USO",
            fromPrice: "desde $0.05", perScan: "escaneo",
            f1: "Entrenamientos y seguimiento ilimitados", f2: "850+ recetas offline", f3: "Registro manual de comida", f4: "Metas y Rachas", f5: "Gráficos de progreso", f6: "Modo offline",
            p1: "Escáner de comida — $0.05/escaneo", p2: "Lector de báscula — $0.02/escaneo", p3: "Escáner de recibos — $0.06/escaneo", p4: "Escáner de nevera — $0.06/escaneo", p5: "Analizador de menú — $0.05/escaneo", p6: "Recetas IA — $0.01/receta",
            startFree: "Empezar gratis", tryFree: "Prueba 3 días gratis",
            packages: "Paquetes de recarga", pkg1: "~100 escaneos", pkg2: "~220 escaneos", pkg3: "~600 escaneos",
            startFree: "Empezar gratis", upgrade: "Mejorar a PRO"
        },
        download: {
            title1: "¿Listo para transformar", title2: "tu fitness?",
            desc: "Descarga FitStream ahora y comienza tu viaje fitness con IA",
            appStore: "App Store", googlePlay: "Google Play", web: "Navegador Web",
            on: "Descargar en", get: "Disponible en", use: "Usar en"
        },
        footer: { privacy: "Privacidad", terms: "Términos", contact: "Contacto", rights: "Todos los derechos reservados." },
        phone: {
            tracking: "Seguimiento IA", streak: "RACHA",
            motivation: "¡Cada repetición cuenta. Sigue adelante!",
            steps: "Pasos", squats: "Sentad.", pushups: "Flex.", situps: "Abdos",
            dashboard: "Inicio", nutrition: "Comida", workout: "Entreno", social: "Amigos", settings: "Ajustes",
            tap: "¡Toca los anillos!",
            water: "Agua", glasses: "vasos", calories: "Quemadas", kcal: "kcal",
            leaderboard: "Ranking", you: "TÚ", points: "pts",
            theme: "Tema", dark: "Oscuro", light: "Claro", lang: "Idioma"
        },
        modal: {
            pose: ["Detección de postura en tiempo real con MediaPipe", "15 ejercicios diferentes soportados", "Feedback instantáneo sobre la forma", "Conteo de reps con IA", "Funciona con cualquier cámara"],
            kitchen: ["Rastrea productos en nevera y congelador", "IA reconoce productos en fotos", "Seguimiento de fechas de caducidad", "Listas de compras inteligentes", "Notificaciones de stock bajo"],
            cooking: ["Guía de recetas paso a paso", "Temporizadores de cocina integrados", "Recordatorios por voz", "Consejos de solución de problemas", "Sustituciones de ingredientes"],
            coach: ["Guía de voz en tiempo real", "Conteo automático de reps", "Consejos de corrección de forma", "Voz personalizable (h/m)", "Historial de entrenamientos"],
            scale: ["Apunta la cámara a cualquier báscula", "IA lee el peso automáticamente", "Funciona con básculas digitales y analógicas", "Soporte de tara de teléfono", "Seguimiento de tendencias"],
            food: ["Estimación instantánea de calorías", "Desglose de macros (proteína, carbos, grasa)", "Objeto de referencia para precisión", "Registro de comidas", "Resumen nutricional diario"],
            receipt: ["Escanear tickets de compra", "Extracción automática de productos y precios", "Estimación de fecha de caducidad", "Historial de precios", "Perspectivas de presupuesto"],
            finance: ["Rastrear gastos en comida", "Cocina casera vs comer fuera", "Informes de presupuesto mensual", "Calculadora de ahorros", "Análisis de costo por comida"],
            health: ["Integración con Google Fit", "Sync con Apple Health", "Samsung Health Connect", "Datos de pasos y actividad", "Importar seguimiento de sueño"],
            goals: ["Metas diarias personalizadas", "Pasos, flexiones, sentadillas y más", "Seguimiento de rachas", "Visualización de progreso", "Notificaciones de recordatorio"],
            charts: ["Gráficos de tendencia de peso", "Gráficos de historial de entrenamiento", "Progreso en el tiempo", "Seguimiento de composición corporal", "Exportar datos a CSV"],
            offline: ["Funcionalidad offline completa", "Sync automático cuando en línea", "Sin pérdida de datos", "Copia de seguridad local", "Funciona en cualquier lugar"],
            gotIt: "¡Entendido!"
        },
        testimonials: {
            title: "Lo que dicen nuestros usuarios",
            subtitle: "Opiniones reales de atletas reales",
            name: "Carlos García",
            role: "Entusiasta del fitness",
            review: "¡FitStream cambió mi vida y la de toda mi familia! Mi esposa usa el escáner de comida, yo sigo mis entrenamientos, y hasta los niños compiten en el ranking. Una app que nos une en salud.",
            avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=CarlosGarcia&backgroundColor=ffdfbf"
        }
    },
    it: {
        _meta: { name: "Italiano", flag: "🇮🇹" },
        nav: { features: "Funzioni", aiPower: "Potenza IA", pricing: "Prezzi", getStarted: "Inizia" },
        hero: {
            powered: "Alimentato da Google Gemini AI",
            title1: "Il tuo compagno", title2: "fitness con IA",
            desc: "Traccia allenamenti, scansiona cibo per calorie, leggi la bilancia con IA e ricevi motivazione personalizzata — tutto in un'app.",
            download: "Scarica gratis", see: "Vedi funzioni"
        },
        features: {
            title: "Tutto ciò di cui hai bisogno", subtitle: "Funzionalità potenti per trasformare il tuo percorso fitness",
            coach: "Coach IA", coachDesc: "Guida in tempo reale e conteggio ripetizioni con feedback vocale",
            scale: "Scanner bilancia IA", scaleDesc: "Punta la fotocamera verso qualsiasi bilancia — l'IA legge automaticamente",
            food: "Scanner cibo IA", foodDesc: "Scatta una foto per stime istantanee di calorie e macro",
            goals: "Obiettivi giornalieri", goalsDesc: "Imposta obiettivi per passi, flessioni, squat e altro",
            charts: "Grafici progressi", chartsDesc: "Visualizza peso e cronologia allenamenti",
            offline: "Offline First", offlineDesc: "Funziona senza internet — sincronizza automaticamente"
        },
        ai: {
            powered: "Alimentato da Advanced Gemini",
            title1: "IA che capisce", title2: "davvero il fitness",
            desc: "La nostra IA non conta solo — vede, capisce e si adatta.",
            vision: "Visione IA", visionDesc: "Legge bilance, identifica cibo, analizza menu",
            portion: "Stima intelligente porzioni", portionDesc: "Usa oggetti di riferimento per porzioni accurate",
            motivation: "Motivazione personalizzata", motivationDesc: "L'IA adatta l'incoraggiamento ai tuoi progressi"
        },
        pricing: {
            title: "Prezzi semplici", subtitle: "Inizia gratis, passa a PRO quando sei pronto",
            free: "Gratis", freeSub: "Perfetto per iniziare", forever: "per sempre",
            pro: "FitStream PRO", proSub: "Per appassionati seri di fitness", month: "mese",
            popular: "PIÙ POPOLARE",
            f1: "Allenamenti illimitati", f2: "Scanner bilancia IA", f3: "Scanner cibo IA", f4: "Obiettivi & Serie", f5: "Grafici progressi",
            p1: "Tutto da Gratis", p2: "Analisi composizione corporea", p3: "Analizzatore menu ristorante", p4: "Icone personalizzate", p5: "Supporto prioritario",
            startFree: "Inizia gratis", upgrade: "Passa a PRO"
        },
        download: {
            title1: "Pronto a trasformare", title2: "il tuo fitness?",
            desc: "Scarica FitStream ora e inizia il tuo percorso fitness con IA",
            appStore: "App Store", googlePlay: "Google Play", web: "Browser Web",
            on: "Scarica su", get: "Disponibile su", use: "Usa nel"
        },
        footer: { privacy: "Privacy", terms: "Termini", contact: "Contatti", rights: "Tutti i diritti riservati." },
        phone: {
            tracking: "Tracking IA", streak: "SERIE",
            motivation: "Ogni ripetizione conta. Continua così!",
            steps: "Passi", squats: "Squat", pushups: "Fless.", situps: "Addome",
            dashboard: "Home", nutrition: "Cibo", workout: "Allena", social: "Amici", settings: "Impost.",
            tap: "Tocca gli anelli!",
            water: "Acqua", glasses: "bicch.", calories: "Bruciate", kcal: "kcal",
            leaderboard: "Classifica", you: "TU", points: "pti",
            theme: "Tema", dark: "Scuro", light: "Chiaro", lang: "Lingua"
        },
        modal: {
            pose: ["Rilevamento postura in tempo reale con MediaPipe", "15 esercizi diversi supportati", "Feedback istantaneo sulla forma", "Conteggio rep con IA", "Funziona con qualsiasi fotocamera"],
            kitchen: ["Traccia prodotti in frigo e freezer", "IA riconosce prodotti dalle foto", "Tracciamento date di scadenza", "Liste della spesa intelligenti", "Notifiche scorte basse"],
            cooking: ["Guida ricette passo passo", "Timer cottura integrati", "Promemoria vocali", "Consigli risoluzione problemi", "Sostituzioni ingredienti"],
            coach: ["Guida vocale in tempo reale", "Conteggio automatico rep", "Consigli correzione forma", "Voce personalizzabile (m/f)", "Cronologia allenamenti"],
            scale: ["Punta la fotocamera su qualsiasi bilancia", "IA legge il peso automaticamente", "Funziona con bilance digitali e analogiche", "Supporto tara telefono", "Tracciamento tendenze"],
            food: ["Stima istantanea calorie", "Ripartizione macro (proteine, carbo, grassi)", "Oggetto riferimento per precisione", "Registro pasti", "Riepilogo nutrizionale giornaliero"],
            receipt: ["Scansiona scontrini", "Estrazione auto prodotti e prezzi", "Stima data scadenza", "Storico prezzi", "Approfondimenti budget"],
            finance: ["Traccia spese alimentari", "Cucina casalinga vs fuori", "Report budget mensili", "Calcolatore risparmi", "Analisi costo per pasto"],
            health: ["Integrazione Google Fit", "Sync Apple Health", "Samsung Health Connect", "Dati passi e attività", "Importa tracciamento sonno"],
            goals: ["Obiettivi giornalieri personalizzati", "Passi, flessioni, squat e altro", "Tracciamento serie", "Visualizzazione progressi", "Notifiche promemoria"],
            charts: ["Grafici tendenza peso", "Grafici cronologia allenamenti", "Progressi nel tempo", "Tracciamento composizione corporea", "Esporta dati in CSV"],
            offline: ["Funzionalità offline completa", "Sync automatico quando online", "Nessuna perdita dati", "Backup storage locale", "Funziona ovunque"],
            gotIt: "Capito!"
        },
        testimonials: {
            title: "Cosa dicono gli utenti",
            subtitle: "Recensioni vere da veri atleti",
            name: "Marco Rossi",
            role: "Appassionato di fitness",
            review: "Mamma mia, finalmente un'app che capisce il cibo! Lo scanner alimentare riconosce anche la pasta fatta in casa. Il monitoraggio delle calorie non è mai stato così semplice e preciso.",
            avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=MarcoRossi&backgroundColor=c0f0e8"
        }
    },
    pt: {
        _meta: { name: "Português", flag: "🇧🇷" },
        nav: { features: "Recursos", aiPower: "Poder IA", pricing: "Preços", getStarted: "Começar" },
        hero: {
            powered: "Powered by Google Gemini AI",
            title1: "Seu companheiro", title2: "fitness com IA",
            desc: "Acompanhe treinos, escaneie comida para calorias, leia sua balança com IA e receba motivação personalizada — tudo em um app.",
            download: "Baixar grátis", see: "Ver recursos"
        },
        features: {
            title: "Tudo que você precisa", subtitle: "Recursos poderosos para transformar sua jornada fitness",
            coach: "Coach IA", coachDesc: "Orientação em tempo real e contagem de repetições com feedback de voz",
            scale: "Scanner de balança IA", scaleDesc: "Aponte sua câmera para qualquer balança — a IA lê automaticamente",
            food: "Scanner de comida IA", foodDesc: "Tire uma foto para estimativas instantâneas de calorias e macros",
            goals: "Metas diárias", goalsDesc: "Defina metas para passos, flexões, agachamentos e mais",
            charts: "Gráficos de progresso", chartsDesc: "Visualize seu peso e histórico de treinos",
            offline: "Offline primeiro", offlineDesc: "Funciona sem internet — sincroniza automaticamente"
        },
        ai: {
            powered: "Powered by Advanced Gemini",
            title1: "IA que realmente", title2: "entende fitness",
            desc: "Nossa IA não apenas conta — ela vê, entende e se adapta.",
            vision: "Visão IA", visionDesc: "Lê balanças, identifica comida, analisa cardápios",
            portion: "Estimativa inteligente de porções", portionDesc: "Usa objetos de referência para porções precisas",
            motivation: "Motivação personalizada", motivationDesc: "A IA adapta o incentivo ao seu progresso"
        },
        pricing: {
            title: "Preços simples", subtitle: "Comece grátis, faça upgrade quando estiver pronto",
            free: "Grátis", freeSub: "Perfeito para começar", forever: "para sempre",
            pro: "FitStream PRO", proSub: "Para entusiastas sérios de fitness", month: "mês",
            popular: "MAIS POPULAR",
            f1: "Treinos ilimitados", f2: "Scanner de balança IA", f3: "Scanner de comida IA", f4: "Metas & Sequências", f5: "Gráficos de progresso",
            p1: "Tudo do Grátis", p2: "Análise de composição corporal", p3: "Analisador de cardápio", p4: "Ícones personalizados", p5: "Suporte prioritário",
            startFree: "Começar grátis", upgrade: "Fazer upgrade para PRO"
        },
        download: {
            title1: "Pronto para transformar", title2: "seu fitness?",
            desc: "Baixe FitStream agora e comece sua jornada fitness com IA",
            appStore: "App Store", googlePlay: "Google Play", web: "Navegador Web",
            on: "Baixar na", get: "Disponível no", use: "Usar no"
        },
        footer: { privacy: "Privacidade", terms: "Termos", contact: "Contato", rights: "Todos os direitos reservados." },
        phone: {
            tracking: "Rastreamento IA", streak: "SEQUÊNCIA",
            motivation: "Cada repetição conta. Continue!",
            steps: "Passos", squats: "Agach.", pushups: "Flex.", situps: "Abdome",
            dashboard: "Início", nutrition: "Comida", workout: "Treino", social: "Amigos", settings: "Config.",
            tap: "Toque nos anéis!",
            water: "Água", glasses: "copos", calories: "Queimadas", kcal: "kcal",
            leaderboard: "Ranking", you: "VOCÊ", points: "pts",
            theme: "Tema", dark: "Escuro", light: "Claro", lang: "Idioma"
        },
        modal: {
            pose: ["Detecção de postura em tempo real com MediaPipe", "15 exercícios diferentes suportados", "Feedback instantâneo sobre forma", "Contagem de reps com IA", "Funciona com qualquer câmera"],
            kitchen: ["Rastreie produtos na geladeira e freezer", "IA reconhece produtos em fotos", "Rastreamento de validade", "Listas de compras inteligentes", "Notificações de estoque baixo"],
            cooking: ["Guia de receitas passo a passo", "Timers de cozinha integrados", "Lembretes por voz", "Dicas de solução de problemas", "Substituições de ingredientes"],
            coach: ["Orientação por voz em tempo real", "Contagem automática de reps", "Dicas de correção de forma", "Voz personalizável (m/f)", "Histórico de treinos"],
            scale: ["Aponte a câmera para qualquer balança", "IA lê o peso automaticamente", "Funciona com balanças digitais e analógicas", "Suporte de tara do telefone", "Rastreamento de tendências"],
            food: ["Estimativa instantânea de calorias", "Divisão de macros (proteína, carbos, gordura)", "Objeto de referência para precisão", "Registro de refeições", "Resumo nutricional diário"],
            receipt: ["Escanear recibos de compras", "Extração automática de produtos e preços", "Estimativa de data de validade", "Histórico de preços", "Insights de orçamento"],
            finance: ["Rastrear gastos com comida", "Cozinhar em casa vs comer fora", "Relatórios de orçamento mensal", "Calculadora de economia", "Análise de custo por refeição"],
            health: ["Integração Google Fit", "Sync Apple Health", "Samsung Health Connect", "Dados de passos e atividade", "Importar rastreamento de sono"],
            goals: ["Metas diárias personalizadas", "Passos, flexões, agachamentos e mais", "Rastreamento de sequências", "Visualização de progresso", "Notificações de lembrete"],
            charts: ["Gráficos de tendência de peso", "Gráficos de histórico de treinos", "Progresso ao longo do tempo", "Rastreamento de composição corporal", "Exportar dados para CSV"],
            offline: ["Funcionalidade offline completa", "Sync automático quando online", "Sem perda de dados", "Backup de armazenamento local", "Funciona em qualquer lugar"],
            gotIt: "Entendi!"
        },
        testimonials: {
            title: "O que dizem nossos usuários",
            subtitle: "Avaliações reais de atletas reais",
            name: "Lucas Silva",
            role: "Entusiasta de fitness",
            review: "FitStream trouxe uma energia nova pro meu treino! O ranking com os amigos virou competição saudável, e o scanner de alimentos facilita demais o dia a dia. Recomendo pra galera toda!",
            avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=LucasSilva&backgroundColor=fce4b8"
        }
    },
    ja: {
        _meta: { name: "日本語", flag: "🇯🇵" },
        nav: { features: "機能", aiPower: "AIパワー", pricing: "料金", getStarted: "始める" },
        hero: {
            powered: "Google Gemini AI搭載",
            title1: "AIパワード", title2: "フィットネスパートナー",
            desc: "ワークアウトを追跡、食事をスキャンしてカロリー計算、AIで体重計を読み取り、パーソナライズされたモチベーションを受け取る — すべて1つのアプリで。",
            download: "無料ダウンロード", see: "機能を見る"
        },
        features: {
            title: "必要なものすべて", subtitle: "フィットネスの旅を変える強力な機能",
            coach: "AIワークアウトコーチ", coachDesc: "音声フィードバック付きのリアルタイムガイダンスとレップカウント",
            scale: "AI体重計スキャナー", scaleDesc: "カメラを体重計に向けるだけ — AIが自動で読み取り",
            food: "AI食品スキャナー", foodDesc: "写真を撮るだけでカロリーとマクロを即座に推定",
            goals: "デイリーゴール", goalsDesc: "歩数、腕立て、スクワットなどの目標を設定",
            charts: "進捗チャート", chartsDesc: "体重とワークアウト履歴を可視化",
            offline: "オフラインファースト", offlineDesc: "インターネットなしでも動作 — 自動で同期"
        },
        ai: {
            powered: "Advanced Gemini搭載",
            title1: "本当にフィットネスを", title2: "理解するAI",
            desc: "私たちのAIは数えるだけではなく — 見て、理解し、適応します。",
            vision: "ビジョンAI", visionDesc: "体重計を読み、食品を識別、メニューを分析",
            portion: "スマートポーション推定", portionDesc: "参照オブジェクトで正確なポーションを計算",
            motivation: "パーソナライズされたモチベーション", motivationDesc: "AIがあなたの進捗に合わせて励まし"
        },
        pricing: {
            title: "シンプルな料金", subtitle: "無料で始めて、準備ができたらアップグレード",
            free: "無料", freeSub: "始めるのに最適", forever: "永久",
            pro: "FitStream PRO", proSub: "本気のフィットネス愛好家向け", month: "月",
            popular: "最も人気",
            f1: "無制限のワークアウト", f2: "AI体重計スキャナー", f3: "AI食品スキャナー", f4: "デイリーゴール＆ストリーク", f5: "進捗チャート",
            p1: "無料の全機能", p2: "体組成分析", p3: "レストランメニュー分析", p4: "カスタムアイコン", p5: "優先サポート",
            startFree: "無料で始める", upgrade: "PROにアップグレード"
        },
        download: {
            title1: "フィットネスを", title2: "変える準備はできましたか?",
            desc: "今すぐFitStreamをダウンロードしてAIパワードのフィットネスジャーニーを始めましょう",
            appStore: "App Store", googlePlay: "Google Play", web: "ウェブブラウザ",
            on: "でダウンロード", get: "で入手", use: "で使用"
        },
        footer: { privacy: "プライバシー", terms: "利用規約", contact: "お問い合わせ", rights: "All rights reserved." },
        phone: {
            tracking: "AIトラッキング", streak: "ストリーク",
            motivation: "一回一回が大切。頑張って!",
            steps: "歩数", squats: "スクワット", pushups: "腕立て", situps: "腹筋",
            dashboard: "ホーム", nutrition: "食事", workout: "トレ", social: "友達", settings: "設定",
            tap: "リングをタップ!",
            water: "水分", glasses: "杯", calories: "消費", kcal: "kcal",
            leaderboard: "ランキング", you: "あなた", points: "pt",
            theme: "テーマ", dark: "ダーク", light: "ライト", lang: "言語"
        },
        modal: {
            pose: ["MediaPipeによるリアルタイム姿勢検出", "15種類のエクササイズに対応", "フォームへの即時フィードバック", "AIによるレップカウント", "どのカメラでも動作"],
            kitchen: ["冷蔵庫と冷凍庫の製品を追跡", "AIが写真から製品を認識", "賞味期限の追跡", "スマート買い物リスト", "在庫低下通知"],
            cooking: ["ステップバイステップのレシピガイド", "内蔵調理タイマー", "音声リマインダー", "トラブルシューティングのヒント", "材料の代替"],
            coach: ["リアルタイム音声ガイダンス", "自動レップカウント", "フォーム修正のヒント", "カスタマイズ可能な声（男/女）", "ワークアウト履歴"],
            scale: ["どの体重計にもカメラを向ける", "AIが自動的に体重を読み取り", "デジタル・アナログ両方の体重計に対応", "電話風袋サポート", "トレンド追跡"],
            food: ["即時カロリー推定", "マクロ内訳（タンパク質、炭水化物、脂肪）", "精度のための参照オブジェクト", "食事ログ", "毎日の栄養サマリー"],
            receipt: ["レシートをスキャン", "製品と価格の自動抽出", "賞味期限の推定", "価格履歴", "予算インサイト"],
            finance: ["食費を追跡", "自炊vs外食", "月間予算レポート", "節約計算機", "一食あたりのコスト分析"],
            health: ["Google Fit連携", "Apple Health同期", "Samsung Health Connect", "歩数とアクティビティデータ", "睡眠追跡インポート"],
            goals: ["カスタムデイリー目標", "歩数、腕立て、スクワットなど", "ストリーク追跡", "進捗の可視化", "リマインダー通知"],
            charts: ["体重トレンドチャート", "ワークアウト履歴グラフ", "時間経過での進捗", "体組成追跡", "CSVでデータエクスポート"],
            offline: ["完全オフライン機能", "オンライン時に自動同期", "データ損失なし", "ローカルストレージバックアップ", "どこでも動作"],
            gotIt: "了解！"
        },
        testimonials: {
            title: "ユーザーの声",
            subtitle: "実際のアスリートからのレビュー",
            name: "田中太郎",
            role: "フィットネス愛好家",
            review: "AIスケールスキャナーの精度に感動しました。毎朝の体重測定がとても簡単になり、食事のカロリー計算も写真一枚で完了します。細かいデータ管理が好きな方に最適です。",
            avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=TanakaTaro&backgroundColor=e8d5f5"
        }
    },
    ko: {
        _meta: { name: "한국어", flag: "🇰🇷" },
        nav: { features: "기능", aiPower: "AI 파워", pricing: "가격", getStarted: "시작하기" },
        hero: {
            powered: "Google Gemini AI 기반",
            title1: "AI 기반", title2: "피트니스 파트너",
            desc: "운동 추적, 음식 스캔으로 칼로리 계산, AI로 체중계 읽기, 맞춤 동기부여 — 모든 것이 하나의 앱에.",
            download: "무료 다운로드", see: "기능 보기"
        },
        features: {
            title: "필요한 모든 것", subtitle: "피트니스 여정을 바꿀 강력한 기능",
            coach: "AI 운동 코치", coachDesc: "음성 피드백과 함께 실시간 가이드 및 횟수 카운트",
            scale: "AI 체중계 스캐너", scaleDesc: "카메라를 체중계에 대면 — AI가 자동으로 읽기",
            food: "AI 음식 스캐너", foodDesc: "사진 한 장으로 칼로리와 영양소 즉시 추정",
            goals: "일일 목표", goalsDesc: "걸음, 푸시업, 스쿼트 등의 목표 설정",
            charts: "진행 차트", chartsDesc: "체중과 운동 기록 시각화",
            offline: "오프라인 우선", offlineDesc: "인터넷 없이도 작동 — 자동 동기화"
        },
        ai: {
            powered: "Advanced Gemini 기반",
            title1: "진정으로 피트니스를", title2: "이해하는 AI",
            desc: "우리 AI는 단순히 세지 않습니다 — 보고, 이해하고, 적응합니다.",
            vision: "비전 AI", visionDesc: "체중계 읽기, 음식 식별, 메뉴 분석",
            portion: "스마트 포션 추정", portionDesc: "참조 물체로 정확한 포션 계산",
            motivation: "맞춤 동기부여", motivationDesc: "AI가 진행 상황에 맞춰 격려"
        },
        pricing: {
            title: "간단한 가격", subtitle: "무료로 시작, 준비되면 업그레이드",
            free: "무료", freeSub: "시작하기에 완벽", forever: "영원히",
            pro: "FitStream PRO", proSub: "진지한 피트니스 애호가를 위해", month: "월",
            popular: "가장 인기",
            f1: "무제한 운동", f2: "AI 체중계 스캐너", f3: "AI 음식 스캐너", f4: "일일 목표 & 연속", f5: "진행 차트",
            p1: "무료의 모든 기능", p2: "체성분 분석", p3: "레스토랑 메뉴 분석", p4: "커스텀 아이콘", p5: "우선 지원",
            startFree: "무료로 시작", upgrade: "PRO로 업그레이드"
        },
        download: {
            title1: "피트니스를", title2: "바꿀 준비 되셨나요?",
            desc: "지금 FitStream을 다운로드하고 AI 기반 피트니스 여정을 시작하세요",
            appStore: "App Store", googlePlay: "Google Play", web: "웹 브라우저",
            on: "에서 다운로드", get: "에서 받기", use: "에서 사용"
        },
        footer: { privacy: "개인정보", terms: "이용약관", contact: "문의", rights: "All rights reserved." },
        phone: {
            tracking: "AI 트래킹", streak: "연속",
            motivation: "모든 반복이 중요해요. 힘내세요!",
            steps: "걸음", squats: "스쿼트", pushups: "푸시업", situps: "싯업",
            dashboard: "홈", nutrition: "식단", workout: "운동", social: "친구", settings: "설정",
            tap: "링을 탭하세요!",
            water: "물", glasses: "잔", calories: "소모", kcal: "kcal",
            leaderboard: "리더보드", you: "나", points: "점",
            theme: "테마", dark: "다크", light: "라이트", lang: "언어"
        },
        modal: {
            pose: ["MediaPipe로 실시간 자세 감지", "15가지 운동 지원", "폼에 대한 즉각적인 피드백", "AI로 횟수 카운트", "모든 카메라에서 작동"],
            kitchen: ["냉장고와 냉동고 제품 추적", "AI가 사진에서 제품 인식", "유통기한 추적", "스마트 쇼핑 리스트", "재고 부족 알림"],
            cooking: ["단계별 레시피 안내", "내장 요리 타이머", "음성 알림", "문제 해결 팁", "재료 대체"],
            coach: ["실시간 음성 안내", "자동 횟수 카운트", "폼 교정 팁", "커스터마이즈 가능한 음성 (남/여)", "운동 기록"],
            scale: ["아무 체중계에나 카메라를 대세요", "AI가 자동으로 체중 읽기", "디지털 및 아날로그 체중계 작동", "휴대폰 영점 지원", "트렌드 추적"],
            food: ["즉각적인 칼로리 추정", "매크로 분석 (단백질, 탄수화물, 지방)", "정확도를 위한 참조 객체", "식사 기록", "일일 영양 요약"],
            receipt: ["영수증 스캔", "제품 및 가격 자동 추출", "유통기한 추정", "가격 기록", "예산 인사이트"],
            finance: ["식비 추적", "집밥 vs 외식", "월간 예산 리포트", "절약 계산기", "식사당 비용 분석"],
            health: ["Google Fit 연동", "Apple Health 동기화", "Samsung Health Connect", "걸음 및 활동 데이터", "수면 추적 가져오기"],
            goals: ["맞춤 일일 목표", "걸음, 푸시업, 스쿼트 등", "연속 기록 추적", "진행 시각화", "알림"],
            charts: ["체중 트렌드 차트", "운동 기록 그래프", "시간 경과에 따른 진행", "체성분 추적", "CSV로 데이터 내보내기"],
            offline: ["완전한 오프라인 기능", "온라인 시 자동 동기화", "데이터 손실 없음", "로컬 저장소 백업", "어디서나 작동"],
            gotIt: "알겠어요!"
        },
        testimonials: {
            title: "사용자 후기",
            subtitle: "실제 운동인들의 리얼 리뷰",
            name: "김민준",
            role: "피트니스 매니아",
            review: "리더보드 기능이 진짜 중독적이에요! 친구들이랑 경쟁하면서 운동하니까 동기부여가 확 됩니다. AI 식단 스캐너도 한식 인식률이 놀라울 정도로 정확해요.",
            avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=KimMinjun&backgroundColor=d5e8f5"
        }
    },
    zh: {
        _meta: { name: "中文", flag: "🇨🇳" },
        nav: { features: "功能", aiPower: "AI能力", pricing: "价格", getStarted: "开始" },
        hero: {
            powered: "由Google Gemini AI驱动",
            title1: "你的AI", title2: "健身伙伴",
            desc: "追踪锻炼、扫描食物计算卡路里、用AI读取体重秤、获得个性化激励 — 一切尽在一个应用中。",
            download: "免费下载", see: "查看功能"
        },
        features: {
            title: "你需要的一切", subtitle: "改变你健身之旅的强大功能",
            coach: "AI健身教练", coachDesc: "实时指导和次数计数，带语音反馈",
            scale: "AI体重秤扫描", scaleDesc: "将相机对准任何体重秤 — AI自动读取",
            food: "AI食物扫描", foodDesc: "拍张照片即可获得卡路里和营养素估算",
            goals: "每日目标", goalsDesc: "设定步数、俯卧撑、深蹲等目标",
            charts: "进度图表", chartsDesc: "可视化你的体重和锻炼历史",
            offline: "离线优先", offlineDesc: "无需网络即可使用 — 自动同步"
        },
        ai: {
            powered: "由Advanced Gemini驱动",
            title1: "真正理解", title2: "健身的AI",
            desc: "我们的AI不只是计数 — 它能看到、理解和适应。",
            vision: "视觉AI", visionDesc: "读取体重秤、识别食物、分析菜单",
            portion: "智能份量估算", portionDesc: "使用参照物精确计算份量",
            motivation: "个性化激励", motivationDesc: "AI根据你的进度调整鼓励"
        },
        pricing: {
            title: "简单定价", subtitle: "免费开始，准备好了再升级",
            free: "免费", freeSub: "完美的开始", forever: "永久",
            pro: "FitStream PRO", proSub: "为认真的健身爱好者", month: "月",
            popular: "最受欢迎",
            f1: "无限次锻炼", f2: "AI体重秤扫描", f3: "AI食物扫描", f4: "每日目标和连续", f5: "进度图表",
            p1: "免费版所有功能", p2: "身体成分分析", p3: "餐厅菜单分析", p4: "自定义图标", p5: "优先支持",
            startFree: "免费开始", upgrade: "升级到PRO"
        },
        download: {
            title1: "准备好改变", title2: "你的健身了吗?",
            desc: "立即下载FitStream，开始你的AI健身之旅",
            appStore: "App Store", googlePlay: "Google Play", web: "网页浏览器",
            on: "在此下载", get: "在此获取", use: "在此使用"
        },
        footer: { privacy: "隐私政策", terms: "服务条款", contact: "联系我们", rights: "保留所有权利。" },
        phone: {
            tracking: "AI追踪", streak: "连续",
            motivation: "每一次都很重要。继续加油!",
            steps: "步数", squats: "深蹲", pushups: "俯卧撑", situps: "仰卧起坐",
            dashboard: "首页", nutrition: "饮食", workout: "训练", social: "好友", settings: "设置",
            tap: "点击圆环!",
            water: "饮水", glasses: "杯", calories: "消耗", kcal: "千卡",
            leaderboard: "排行榜", you: "你", points: "分",
            theme: "主题", dark: "深色", light: "浅色", lang: "语言"
        },
        modal: {
            pose: ["使用MediaPipe实时姿势检测", "支持15种不同运动", "即时动作反馈", "AI次数计数", "适用于任何相机"],
            kitchen: ["追踪冰箱和冷冻室的产品", "AI从照片识别产品", "保质期追踪", "智能购物清单", "低库存通知"],
            cooking: ["分步食谱指导", "内置烹饪计时器", "语音提醒", "问题解决技巧", "食材替换"],
            coach: ["实时语音指导", "自动次数计数", "动作纠正提示", "可定制声音（男/女）", "锻炼历史"],
            scale: ["将相机对准任何体重秤", "AI自动读取体重", "适用于数字和模拟体重秤", "手机去皮支持", "趋势追踪"],
            food: ["即时卡路里估算", "宏量营养素分解（蛋白质、碳水、脂肪）", "参考物体提高精度", "餐食记录", "每日营养摘要"],
            receipt: ["扫描购物小票", "自动提取产品和价格", "保质期估算", "价格历史", "预算洞察"],
            finance: ["追踪食物支出", "在家做饭vs外出就餐", "月度预算报告", "节省计算器", "每餐成本分析"],
            health: ["Google Fit集成", "Apple Health同步", "Samsung Health Connect", "步数和活动数据", "导入睡眠追踪"],
            goals: ["自定义每日目标", "步数、俯卧撑、深蹲等", "连续打卡追踪", "进度可视化", "提醒通知"],
            charts: ["体重趋势图表", "锻炼历史图表", "随时间的进度", "身体成分追踪", "导出CSV数据"],
            offline: ["完全离线功能", "在线时自动同步", "无数据丢失", "本地存储备份", "随处可用"],
            gotIt: "明白了！"
        },
        testimonials: {
            title: "用户评价",
            subtitle: "来自真实运动爱好者的评价",
            name: "王小明",
            role: "健身爱好者",
            review: "FitStream非常实用高效。AI扫描功能节省了大量时间，进度图表一目了然。三个月内减重5公斤，完全达到了预期目标。推荐给注重效率的朋友。",
            avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=WangXiaoming&backgroundColor=f5d5d5"
        }
    },
    nl: {
        _meta: { name: "Nederlands", flag: "🇳🇱" },
        nav: { features: "Functies", aiPower: "AI Kracht", pricing: "Prijzen", getStarted: "Beginnen" },
        hero: {
            powered: "Powered by Google Gemini AI",
            title1: "Jouw AI-aangedreven", title2: "Fitness Partner",
            desc: "Volg workouts, scan eten voor calorieën, lees je weegschaal met AI en ontvang gepersonaliseerde motivatie — alles in één app.",
            download: "Gratis downloaden", see: "Bekijk functies"
        },
        features: {
            title: "Alles wat je nodig hebt", subtitle: "Krachtige functies om je fitnessreis te transformeren",
            coach: "AI Workout Coach", coachDesc: "Realtime begeleiding en rep-telling met spraakfeedback",
            scale: "AI Weegschaal Scanner", scaleDesc: "Richt je camera op elke weegschaal — AI leest automatisch",
            food: "AI Voedsel Scanner", foodDesc: "Maak een foto voor directe calorie- en macroschattingen",
            goals: "Dagelijkse Doelen", goalsDesc: "Stel doelen voor stappen, push-ups, squats en meer",
            charts: "Voortgangsgrafieken", chartsDesc: "Visualiseer je gewicht en workoutgeschiedenis",
            offline: "Offline Eerst", offlineDesc: "Werkt zonder internet — synchroniseert automatisch"
        },
        ai: {
            powered: "Powered by Advanced Gemini",
            title1: "AI die echt", title2: "fitness begrijpt",
            desc: "Onze AI telt niet alleen — ze ziet, begrijpt en past zich aan.",
            vision: "Visie AI", visionDesc: "Leest weegschalen, identificeert voedsel, analyseert menu's",
            portion: "Slimme Portie Schatting", portionDesc: "Gebruikt referentieobjecten voor nauwkeurige porties",
            motivation: "Gepersonaliseerde Motivatie", motivationDesc: "AI past aanmoediging aan op je voortgang"
        },
        pricing: {
            title: "Simpele Prijzen", subtitle: "Begin gratis, upgrade wanneer je klaar bent",
            free: "Gratis", freeSub: "Perfect om te beginnen", forever: "voor altijd",
            pro: "FitStream PRO", proSub: "Voor serieuze fitness enthousiasten", month: "maand",
            popular: "MEEST POPULAIR",
            f1: "Unlimited workouts", f2: "AI Weegschaal Scanner", f3: "AI Voedsel Scanner", f4: "Dagelijkse Doelen & Reeksen", f5: "Voortgangsgrafieken",
            p1: "Alles uit Gratis", p2: "Onbeperkte workouts", p3: "Restaurant Menu Analyzer", p4: "Aangepaste Iconen", p5: "Prioriteit Support",
            startFree: "Gratis beginnen", upgrade: "Upgrade naar PRO"
        },
        download: {
            title1: "Klaar om je", title2: "fitness te transformeren?",
            desc: "Download FitStream nu en begin je AI-aangedreven fitnessreis",
            appStore: "App Store", googlePlay: "Google Play", web: "Web Browser",
            on: "Download in de", get: "Beschikbaar op", use: "Gebruik in"
        },
        footer: { privacy: "Privacy", terms: "Voorwaarden", contact: "Contact", rights: "Alle rechten voorbehouden." },
        phone: {
            tracking: "AI Tracking", streak: "REEKS",
            motivation: "Elke rep telt. Blijf doorgaan!",
            steps: "Stappen", squats: "Squats", pushups: "Push-ups", situps: "Situps",
            dashboard: "Home", nutrition: "Voeding", workout: "Train", social: "Vrienden", settings: "Instel.",
            tap: "Tik op de ringen!",
            water: "Water", glasses: "glazen", calories: "Verbrand", kcal: "kcal",
            leaderboard: "Ranglijst", you: "JIJ", points: "ptn",
            theme: "Thema", dark: "Donker", light: "Licht", lang: "Taal"
        },
        modal: {
            pose: ["Realtime houdingsdetectie met MediaPipe", "15 verschillende oefeningen ondersteund", "Directe feedback op vorm", "Rep-telling met AI", "Werkt met elke camera"],
            kitchen: ["Volg producten in koelkast en vriezer", "AI herkent producten op foto's", "Houdbaarheidsdatum tracking", "Slimme boodschappenlijsten", "Meldingen bij lage voorraad"],
            cooking: ["Stap-voor-stap receptbegeleiding", "Ingebouwde kooktimers", "Spraakherinneringen", "Probleemoplossingstips", "Ingrediëntenvervangingen"],
            coach: ["Realtime spraakbegeleiding", "Automatische rep-telling", "Tips voor vormcorrectie", "Aanpasbare stem (m/v)", "Trainingsgeschiedenis"],
            scale: ["Richt camera op elke weegschaal", "AI leest gewicht automatisch", "Werkt met digitale en analoge weegschalen", "Telefoon tarra-ondersteuning", "Trend tracking"],
            food: ["Directe calorieënschatting", "Macro-uitsplitsing (eiwit, koolhydraten, vet)", "Referentieobject voor nauwkeurigheid", "Maaltijdlog", "Dagelijks voedingsoverzicht"],
            receipt: ["Kassabonnen scannen", "Auto-extractie producten en prijzen", "Houdbaarheidsschatting", "Prijsgeschiedenis", "Budgetinzichten"],
            finance: ["Voedseluitgaven volgen", "Thuiskoken vs uit eten", "Maandelijkse budgetrapporten", "Besparingscalculator", "Kosten per maaltijd analyse"],
            health: ["Google Fit integratie", "Apple Health sync", "Samsung Health Connect", "Stappen en activiteitsgegevens", "Slaaptracking importeren"],
            goals: ["Aangepaste dagelijkse doelen", "Stappen, push-ups, squats en meer", "Reeksregistratie", "Voortgangsvisualisatie", "Herinneringsmeldingen"],
            charts: ["Gewichtstrend grafieken", "Trainingsgeschiedenis grafieken", "Voortgang in de tijd", "Lichaamssamenstelling tracking", "Data exporteren als CSV"],
            offline: ["Volledige offline functionaliteit", "Automatische sync wanneer online", "Geen gegevensverlies", "Lokale opslag backup", "Werkt overal"],
            gotIt: "Begrepen!"
        },
        testimonials: {
            title: "Wat gebruikers zeggen",
            subtitle: "Echte beoordelingen van echte sporters",
            name: "Jan de Vries",
            role: "Sportliefhebber",
            review: "Geen poespas, gewoon een app die doet wat het moet doen. De AI-scanner werkt snel en nauwkeurig, de interface is overzichtelijk. Precies wat ik zocht — simpel en effectief.",
            avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=JandeVries&backgroundColor=f5e8d5"
        }
    },
    sv: {
        _meta: { name: "Svenska", flag: "🇸🇪" },
        nav: { features: "Funktioner", aiPower: "AI-Kraft", pricing: "Priser", getStarted: "Kom igång" },
        hero: {
            powered: "Drivs av Google Gemini AI",
            title1: "Din AI-drivna", title2: "Fitnesspartner",
            desc: "Spåra träning, skanna mat för kalorier, läs din våg med AI och få personlig motivation — allt i en app.",
            download: "Ladda ner gratis", see: "Se funktioner"
        },
        features: {
            title: "Allt du behöver", subtitle: "Kraftfulla funktioner för att förvandla din fitnessresa",
            coach: "AI-Träningscoach", coachDesc: "Realtidsvägledning och rep-räkning med röstfeedback",
            scale: "AI-Vågskanner", scaleDesc: "Rikta kameran mot valfri våg — AI läser automatiskt",
            food: "AI-Matskanner", foodDesc: "Ta ett foto för direkta kalori- och makrouppskattningar",
            goals: "Dagliga Mål", goalsDesc: "Sätt mål för steg, armhävningar, knäböj och mer",
            charts: "Framstegsdiagram", chartsDesc: "Visualisera din vikt och träningshistorik",
            offline: "Offline Först", offlineDesc: "Fungerar utan internet — synkar automatiskt"
        },
        ai: {
            powered: "Drivs av Advanced Gemini",
            title1: "AI som verkligen", title2: "förstår fitness",
            desc: "Vår AI räknar inte bara — den ser, förstår och anpassar sig.",
            vision: "Vision AI", visionDesc: "Läser vågar, identifierar mat, analyserar menyer",
            portion: "Smart Portionsuppskattning", portionDesc: "Använder referensobjekt för exakta portioner",
            motivation: "Personlig Motivation", motivationDesc: "AI anpassar uppmuntran efter din framgång"
        },
        pricing: {
            title: "Enkla Priser", subtitle: "Börja gratis, uppgradera när du är redo",
            free: "Gratis", freeSub: "Perfekt för att börja", forever: "för alltid",
            pro: "FitStream PRO", proSub: "För seriösa fitnessentusiaster", month: "månad",
            popular: "MEST POPULÄR",
            f1: "Obegränsade träningar", f2: "AI-Vågskanner", f3: "AI-Matskanner", f4: "Dagliga Mål & Serier", f5: "Framstegsdiagram",
            p1: "Allt i Gratis", p2: "Kroppssammansättningsanalys", p3: "Restaurangmenyanalys", p4: "Anpassade ikoner", p5: "Prioriterad support",
            startFree: "Börja gratis", upgrade: "Uppgradera till PRO"
        },
        download: {
            title1: "Redo att förvandla", title2: "din fitness?",
            desc: "Ladda ner FitStream nu och börja din AI-drivna fitnessresa",
            appStore: "App Store", googlePlay: "Google Play", web: "Webbläsare",
            on: "Ladda ner på", get: "Hämta på", use: "Använd i"
        },
        footer: { privacy: "Integritet", terms: "Villkor", contact: "Kontakt", rights: "Alla rättigheter förbehållna." },
        phone: {
            tracking: "AI-Spårning", streak: "SERIE",
            motivation: "Varje rep räknas. Fortsätt!",
            steps: "Steg", squats: "Knäböj", pushups: "Armh.", situps: "Situps",
            dashboard: "Hem", nutrition: "Mat", workout: "Träna", social: "Vänner", settings: "Inst.",
            tap: "Tryck på ringarna!",
            water: "Vatten", glasses: "glas", calories: "Förbrända", kcal: "kcal",
            leaderboard: "Topplista", you: "DU", points: "pkt",
            theme: "Tema", dark: "Mörkt", light: "Ljust", lang: "Språk"
        },
        modal: {
            pose: ["Realtids hållningsdetektering med MediaPipe", "15 olika övningar stöds", "Omedelbar feedback på form", "Rep-räkning med AI", "Fungerar med vilken kamera som helst"],
            kitchen: ["Spåra produkter i kyl och frys", "AI känner igen produkter på foton", "Utgångsdatumsspårning", "Smarta inköpslistor", "Meddelanden vid lågt lager"],
            cooking: ["Steg-för-steg receptvägledning", "Inbyggda kocktimers", "Röstpåminnelser", "Felsökningstips", "Ingrediensersättningar"],
            coach: ["Realtids röstvägledning", "Automatisk rep-räkning", "Tips för formkorrigering", "Anpassningsbar röst (m/k)", "Träningshistorik"],
            scale: ["Rikta kameran mot valfri våg", "AI läser vikt automatiskt", "Fungerar med digitala och analoga vågar", "Telefon tara-stöd", "Trendspårning"],
            food: ["Omedelbar kaloriuppskattning", "Makro-uppdelning (protein, kolhydrater, fett)", "Referensobjekt för noggrannhet", "Måltidslogg", "Daglig näringssammanfattning"],
            receipt: ["Skanna kvitton", "Auto-extrahera produkter och priser", "Utgångsdatumuppskattning", "Prishistorik", "Budgetinsikter"],
            finance: ["Spåra matutgifter", "Hemlagad mat vs äta ute", "Månadsbudgetrapporter", "Sparkalkylator", "Kostnad per måltid analys"],
            health: ["Google Fit integration", "Apple Health synk", "Samsung Health Connect", "Steg och aktivitetsdata", "Importera sömnspårning"],
            goals: ["Anpassade dagliga mål", "Steg, armhävningar, knäböj och mer", "Seriespårning", "Framstegsvisualisering", "Påminnelsenotifikationer"],
            charts: ["Vikttrenddiagram", "Träningshistorikgrafer", "Framsteg över tid", "Kroppssammansättningsspårning", "Exportera data som CSV"],
            offline: ["Full offline-funktionalitet", "Automatisk synk när online", "Ingen dataförlust", "Lokal lagringsbackup", "Fungerar överallt"],
            gotIt: "Uppfattat!"
        },
        testimonials: {
            title: "Vad användare säger",
            subtitle: "Riktiga omdömen från riktiga atleter",
            name: "Erik Lindberg",
            role: "Hälsoentusiast",
            review: "FitStream har en ren och minimalistisk design som jag verkligen uppskattar. AI-funktionerna är smarta utan att vara påträngande. Perfekt för den som vill ha koll på sin hälsa utan krångel.",
            avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=ErikLindberg&backgroundColor=d5f5e8"
        }
    },
    pl: {
        _meta: { name: "Polski", flag: "🇵🇱" },
        nav: { features: "Funkcje", aiPower: "Moc AI", pricing: "Ceny", getStarted: "Zacznij" },
        hero: {
            powered: "Napędzane przez Google Gemini AI",
            title1: "Twój partner", title2: "fitness z AI",
            desc: "Śledź treningi, skanuj jedzenie dla kalorii, czytaj wagę z AI i otrzymuj spersonalizowaną motywację — wszystko w jednej aplikacji.",
            download: "Pobierz za darmo", see: "Zobacz funkcje"
        },
        features: {
            title: "Wszystko czego potrzebujesz", subtitle: "Potężne funkcje do transformacji Twojej podróży fitness",
            coach: "Trener AI", coachDesc: "Wskazówki w czasie rzeczywistym i liczenie powtórzeń z głosowym feedbackiem",
            scale: "Skaner wagi AI", scaleDesc: "Skieruj kamerę na wagę — AI odczytuje automatycznie",
            food: "Skaner jedzenia AI", foodDesc: "Zrób zdjęcie dla natychmiastowych szacunków kalorii i makro",
            goals: "Dzienne cele", goalsDesc: "Ustaw cele dla kroków, pompek, przysiadów i więcej",
            charts: "Wykresy postępu", chartsDesc: "Wizualizuj wagę i historię treningów",
            offline: "Najpierw offline", offlineDesc: "Działa bez internetu — synchronizuje automatycznie"
        },
        ai: {
            powered: "Napędzane przez Advanced Gemini",
            title1: "AI które naprawdę", title2: "rozumie fitness",
            desc: "Nasze AI nie tylko liczy — widzi, rozumie i dostosowuje się.",
            vision: "Vision AI", visionDesc: "Czyta wagi, identyfikuje jedzenie, analizuje menu",
            portion: "Inteligentne szacowanie porcji", portionDesc: "Używa obiektów referencyjnych dla dokładnych porcji",
            motivation: "Spersonalizowana motywacja", motivationDesc: "AI dostosowuje zachęty do Twojego postępu"
        },
        pricing: {
            title: "Proste ceny", subtitle: "Zacznij za darmo, ulepsz gdy będziesz gotowy",
            free: "Darmowy", freeSub: "Idealny na początek", forever: "na zawsze",
            pro: "FitStream PRO", proSub: "Dla poważnych entuzjastów fitness", month: "miesiąc",
            popular: "NAJPOPULARNIEJSZY",
            f1: "Nieograniczone treningi", f2: "Skaner wagi AI", f3: "Skaner jedzenia AI", f4: "Dzienne cele i serie", f5: "Wykresy postępu",
            p1: "Wszystko z Darmowego", p2: "Analiza składu ciała", p3: "Analizator menu restauracji", p4: "Własne ikony", p5: "Priorytetowe wsparcie",
            startFree: "Zacznij za darmo", upgrade: "Ulepsz do PRO"
        },
        download: {
            title1: "Gotowy zmienić", title2: "swój fitness?",
            desc: "Pobierz FitStream teraz i rozpocznij swoją podróż fitness z AI",
            appStore: "App Store", googlePlay: "Google Play", web: "Przeglądarka",
            on: "Pobierz w", get: "Dostępne w", use: "Użyj w"
        },
        footer: { privacy: "Prywatność", terms: "Regulamin", contact: "Kontakt", rights: "Wszelkie prawa zastrzeżone." },
        phone: {
            tracking: "Śledzenie AI", streak: "SERIA",
            motivation: "Każde powtórzenie się liczy. Dalej!",
            steps: "Kroki", squats: "Przysiad", pushups: "Pompki", situps: "Brzuszki",
            dashboard: "Start", nutrition: "Jedz.", workout: "Tren.", social: "Znajomi", settings: "Ustaw.",
            tap: "Dotknij pierścieni!",
            water: "Woda", glasses: "szkl.", calories: "Spalone", kcal: "kcal",
            leaderboard: "Ranking", you: "TY", points: "pkt",
            theme: "Motyw", dark: "Ciemny", light: "Jasny", lang: "Język"
        },
        modal: {
            pose: ["Wykrywanie postawy w czasie rzeczywistym z MediaPipe", "Obsługa 15 różnych ćwiczeń", "Natychmiastowa informacja zwrotna o formie", "Liczenie powtórzeń z AI", "Działa z każdą kamerą"],
            kitchen: ["Śledź produkty w lodówce i zamrażarce", "AI rozpoznaje produkty ze zdjęć", "Śledzenie dat ważności", "Inteligentne listy zakupów", "Powiadomienia o niskim stanie"],
            cooking: ["Przewodnik po przepisach krok po kroku", "Wbudowane timery gotowania", "Przypomnienia głosowe", "Wskazówki rozwiązywania problemów", "Zamienniki składników"],
            coach: ["Prowadzenie głosowe w czasie rzeczywistym", "Automatyczne liczenie powtórzeń", "Wskazówki korekty formy", "Konfigurowalny głos (m/k)", "Historia treningów"],
            scale: ["Skieruj kamerę na dowolną wagę", "AI automatycznie odczytuje wagę", "Działa z wagami cyfrowymi i analogowymi", "Obsługa tary telefonu", "Śledzenie trendów"],
            food: ["Natychmiastowe szacowanie kalorii", "Rozkład makro (białko, węglowodany, tłuszcz)", "Obiekt odniesienia dla dokładności", "Dziennik posiłków", "Dzienny przegląd żywieniowy"],
            receipt: ["Skanowanie paragonów", "Automatyczna ekstrakcja produktów i cen", "Szacowanie daty ważności", "Historia cen", "Wgląd w budżet"],
            finance: ["Śledzenie wydatków na jedzenie", "Gotowanie w domu vs jedzenie na mieście", "Miesięczne raporty budżetowe", "Kalkulator oszczędności", "Analiza kosztu posiłku"],
            health: ["Integracja z Google Fit", "Synchronizacja Apple Health", "Samsung Health Connect", "Dane o krokach i aktywności", "Import śledzenia snu"],
            goals: ["Niestandardowe cele dzienne", "Kroki, pompki, przysiady i więcej", "Śledzenie serii", "Wizualizacja postępów", "Powiadomienia przypominające"],
            charts: ["Wykresy trendu wagi", "Wykresy historii treningów", "Postępy w czasie", "Śledzenie składu ciała", "Eksport danych do CSV"],
            offline: ["Pełna funkcjonalność offline", "Automatyczna synchronizacja online", "Bez utraty danych", "Kopia zapasowa lokalnego magazynu", "Działa wszędzie"],
            gotIt: "Rozumiem!"
        },
        testimonials: {
            title: "Co mówią użytkownicy",
            subtitle: "Prawdziwe opinie prawdziwych sportowców",
            name: "Tomasz Kowalski",
            role: "Entuzjasta fitnessu",
            review: "Szukałem czegoś w dobrej cenie z prawdziwym AI — FitStream to strzał w dziesiątkę. Skaner wagi działa bezbłędnie, śledzenie posiłków jest proste, a za tę cenę to naprawdę świetna aplikacja.",
            avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=TomaszKowalski&backgroundColor=e8f5d5"
        }
    },
    tr: {
        _meta: { name: "Türkçe", flag: "🇹🇷" },
        nav: { features: "Özellikler", aiPower: "AI Gücü", pricing: "Fiyatlar", getStarted: "Başla" },
        hero: {
            powered: "Google Gemini AI ile güçlendirildi",
            title1: "AI Destekli", title2: "Fitness Arkadaşın",
            desc: "Antrenmanları takip et, yemekleri tara, tartını AI ile oku ve kişisel motivasyon al — hepsi tek uygulamada.",
            download: "Ücretsiz indir", see: "Özellikleri gör"
        },
        features: {
            title: "İhtiyacın olan her şey", subtitle: "Fitness yolculuğunu dönüştürecek güçlü özellikler",
            coach: "AI Antrenör", coachDesc: "Sesli geri bildirimle gerçek zamanlı rehberlik ve tekrar sayımı",
            scale: "AI Tartı Tarayıcı", scaleDesc: "Kameranı herhangi bir tartıya tut — AI otomatik okur",
            food: "AI Yemek Tarayıcı", foodDesc: "Anlık kalori ve makro tahmini için fotoğraf çek",
            goals: "Günlük Hedefler", goalsDesc: "Adım, şınav, squat ve daha fazlası için hedef belirle",
            charts: "İlerleme Grafikleri", chartsDesc: "Kilo ve antrenman geçmişini görselleştir",
            offline: "Önce Çevrimdışı", offlineDesc: "İnternetsiz çalışır — otomatik senkronize eder"
        },
        ai: {
            powered: "Advanced Gemini ile güçlendirildi",
            title1: "Gerçekten fitness", title2: "anlayan AI",
            desc: "AI'mız sadece saymıyor — görüyor, anlıyor ve uyum sağlıyor.",
            vision: "Görüş AI", visionDesc: "Tartıları okur, yemekleri tanır, menüleri analiz eder",
            portion: "Akıllı Porsiyon Tahmini", portionDesc: "Doğru porsiyonlar için referans nesneler kullanır",
            motivation: "Kişisel Motivasyon", motivationDesc: "AI teşviki ilerlemenize göre uyarlar"
        },
        pricing: {
            title: "Basit Fiyatlandırma", subtitle: "Ücretsiz başla, hazır olunca yükselt",
            free: "Ücretsiz", freeSub: "Başlamak için mükemmel", forever: "sonsuza dek",
            pro: "FitStream PRO", proSub: "Ciddi fitness tutkunları için", month: "ay",
            popular: "EN POPÜLER",
            f1: "Sınırsız antrenman", f2: "AI Tartı Tarayıcı", f3: "AI Yemek Tarayıcı", f4: "Günlük Hedefler & Seriler", f5: "İlerleme Grafikleri",
            p1: "Ücretsiz'deki her şey", p2: "Vücut kompozisyon analizi", p3: "Restoran Menü Analizi", p4: "Özel İkonlar", p5: "Öncelikli Destek",
            startFree: "Ücretsiz başla", upgrade: "PRO'ya yükselt"
        },
        download: {
            title1: "Fitness'ını", title2: "dönüştürmeye hazır mısın?",
            desc: "FitStream'i şimdi indir ve AI destekli fitness yolculuğuna başla",
            appStore: "App Store", googlePlay: "Google Play", web: "Web Tarayıcı",
            on: "İndir", get: "Al", use: "Kullan"
        },
        footer: { privacy: "Gizlilik", terms: "Şartlar", contact: "İletişim", rights: "Tüm hakları saklıdır." },
        phone: {
            tracking: "AI Takip", streak: "SERİ",
            motivation: "Her tekrar önemli. Devam et!",
            steps: "Adım", squats: "Squat", pushups: "Şınav", situps: "Mekik",
            dashboard: "Ana", nutrition: "Yemek", workout: "Antr.", social: "Arkadaş", settings: "Ayar",
            tap: "Halkalara dokun!",
            water: "Su", glasses: "bardak", calories: "Yakılan", kcal: "kcal",
            leaderboard: "Sıralama", you: "SEN", points: "puan",
            theme: "Tema", dark: "Koyu", light: "Açık", lang: "Dil"
        },
        modal: {
            pose: ["MediaPipe ile gerçek zamanlı duruş algılama", "15 farklı egzersiz destekleniyor", "Form hakkında anında geri bildirim", "AI ile tekrar sayımı", "Her kamerayla çalışır"],
            kitchen: ["Buzdolabı ve dondurucudaki ürünleri takip edin", "AI fotoğraflardan ürünleri tanır", "Son kullanma tarihi takibi", "Akıllı alışveriş listeleri", "Düşük stok bildirimleri"],
            cooking: ["Adım adım tarif rehberi", "Dahili pişirme zamanlayıcıları", "Sesli hatırlatmalar", "Sorun giderme ipuçları", "Malzeme değişimleri"],
            coach: ["Gerçek zamanlı sesli rehberlik", "Otomatik tekrar sayımı", "Form düzeltme ipuçları", "Özelleştirilebilir ses (e/k)", "Antrenman geçmişi"],
            scale: ["Kamerayı herhangi bir tartıya doğrultun", "AI ağırlığı otomatik okur", "Dijital ve analog tartılarla çalışır", "Telefon dara desteği", "Trend takibi"],
            food: ["Anında kalori tahmini", "Makro dağılımı (protein, karbonhidrat, yağ)", "Doğruluk için referans nesnesi", "Öğün kaydı", "Günlük beslenme özeti"],
            receipt: ["Fiş tarama", "Ürün ve fiyatların otomatik çıkarılması", "Son kullanma tarihi tahmini", "Fiyat geçmişi", "Bütçe içgörüleri"],
            finance: ["Yemek harcamalarını takip edin", "Evde pişirme vs dışarıda yeme", "Aylık bütçe raporları", "Tasarruf hesaplayıcı", "Öğün başına maliyet analizi"],
            health: ["Google Fit entegrasyonu", "Apple Health senkronizasyonu", "Samsung Health Connect", "Adım ve aktivite verileri", "Uyku takibi içe aktarma"],
            goals: ["Özel günlük hedefler", "Adımlar, şınavlar, squat ve daha fazlası", "Seri takibi", "İlerleme görselleştirme", "Hatırlatma bildirimleri"],
            charts: ["Kilo trend grafikleri", "Antrenman geçmişi grafikleri", "Zaman içinde ilerleme", "Vücut kompozisyonu takibi", "CSV olarak veri dışa aktarma"],
            offline: ["Tam çevrimdışı işlevsellik", "Çevrimiçi olduğunda otomatik senkronizasyon", "Veri kaybı yok", "Yerel depolama yedeklemesi", "Her yerde çalışır"],
            gotIt: "Anladım!"
        },
        testimonials: {
            title: "Kullanıcılar ne diyor",
            subtitle: "Gerçek sporculardan gerçek yorumlar",
            name: "Mehmet Yılmaz",
            role: "Fitness tutkunu",
            review: "Ailece kullanıyoruz! Eşim yemek tarayıcısını çok seviyor, ben antrenman takibini yapıyorum. Sağlıklı yaşam artık tüm ailenin ortak projesi oldu. Harika bir uygulama.",
            avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=MehmetYilmaz&backgroundColor=f5d5e8"
        }
    },
    ar: {
        _meta: { name: "العربية", flag: "🇦🇪", rtl: true },
        nav: { features: "المميزات", aiPower: "قوة الذكاء", pricing: "الأسعار", getStarted: "ابدأ" },
        hero: {
            powered: "مدعوم بـ Google Gemini AI",
            title1: "رفيقك الرياضي", title2: "بالذكاء الاصطناعي",
            desc: "تتبع التمارين، امسح الطعام للسعرات، اقرأ ميزانك بالذكاء الاصطناعي واحصل على تحفيز مخصص — كل شيء في تطبيق واحد.",
            download: "تحميل مجاني", see: "شاهد المميزات"
        },
        features: {
            title: "كل ما تحتاجه", subtitle: "ميزات قوية لتحويل رحلتك الرياضية",
            coach: "مدرب AI", coachDesc: "إرشاد فوري وعد التكرارات مع تعليقات صوتية",
            scale: "ماسح الميزان AI", scaleDesc: "وجه الكاميرا لأي ميزان — AI يقرأ تلقائياً",
            food: "ماسح الطعام AI", foodDesc: "التقط صورة لتقدير السعرات والمغذيات فوراً",
            goals: "أهداف يومية", goalsDesc: "حدد أهدافاً للخطوات والضغط والقرفصاء والمزيد",
            charts: "مخططات التقدم", chartsDesc: "تصور وزنك وسجل التمارين",
            offline: "يعمل بدون إنترنت", offlineDesc: "يعمل بدون اتصال — يزامن تلقائياً"
        },
        ai: {
            powered: "مدعوم بـ Advanced Gemini",
            title1: "ذكاء اصطناعي", title2: "يفهم اللياقة حقاً",
            desc: "ذكاؤنا الاصطناعي لا يعد فقط — يرى ويفهم ويتكيف.",
            vision: "رؤية AI", visionDesc: "يقرأ الموازين، يحدد الطعام، يحلل القوائم",
            portion: "تقدير ذكي للحصص", portionDesc: "يستخدم مراجع للحصص الدقيقة",
            motivation: "تحفيز مخصص", motivationDesc: "AI يكيف التشجيع حسب تقدمك"
        },
        pricing: {
            title: "أسعار بسيطة", subtitle: "ابدأ مجاناً، ترقّ عندما تكون جاهزاً",
            free: "مجاني", freeSub: "مثالي للبداية", forever: "للأبد",
            pro: "FitStream PRO", proSub: "لعشاق اللياقة الجادين", month: "شهر",
            popular: "الأكثر شعبية",
            f1: "تمارين غير محدودة", f2: "ماسح الميزان AI", f3: "ماسح الطعام AI", f4: "أهداف وسلاسل يومية", f5: "مخططات التقدم",
            p1: "كل شيء في المجاني", p2: "تحليل تركيب الجسم", p3: "محلل قوائم المطاعم", p4: "أيقونات مخصصة", p5: "دعم أولوية",
            startFree: "ابدأ مجاناً", upgrade: "ترقية إلى PRO"
        },
        download: {
            title1: "مستعد لتحويل", title2: "لياقتك؟",
            desc: "حمّل FitStream الآن وابدأ رحلتك الرياضية بالذكاء الاصطناعي",
            appStore: "App Store", googlePlay: "Google Play", web: "المتصفح",
            on: "تحميل من", get: "احصل من", use: "استخدم في"
        },
        footer: { privacy: "الخصوصية", terms: "الشروط", contact: "اتصل", rights: "جميع الحقوق محفوظة." },
        phone: {
            tracking: "تتبع AI", streak: "سلسلة",
            motivation: "!كل تكرار مهم. استمر",
            steps: "خطوات", squats: "قرفصاء", pushups: "ضغط", situps: "بطن",
            dashboard: "الرئيسية", nutrition: "طعام", workout: "تمرين", social: "أصدقاء", settings: "إعداد",
            tap: "!اضغط على الحلقات",
            water: "ماء", glasses: "كوب", calories: "محروقة", kcal: "سعرة",
            leaderboard: "الترتيب", you: "أنت", points: "نقطة",
            theme: "المظهر", dark: "داكن", light: "فاتح", lang: "اللغة"
        },
        modal: {
            pose: ["كشف الوضعية في الوقت الفعلي مع MediaPipe", "دعم 15 تمرينًا مختلفًا", "ردود فعل فورية على الشكل", "عد التكرارات بالذكاء الاصطناعي", "يعمل مع أي كاميرا"],
            kitchen: ["تتبع المنتجات في الثلاجة والمجمد", "الذكاء الاصطناعي يتعرف على المنتجات من الصور", "تتبع تاريخ انتهاء الصلاحية", "قوائم تسوق ذكية", "إشعارات المخزون المنخفض"],
            cooking: ["إرشادات الوصفات خطوة بخطوة", "مؤقتات الطبخ المدمجة", "تذكيرات صوتية", "نصائح استكشاف الأخطاء", "بدائل المكونات"],
            coach: ["إرشاد صوتي في الوقت الفعلي", "عد التكرارات التلقائي", "نصائح تصحيح الشكل", "صوت قابل للتخصيص (ذ/أ)", "سجل التمارين"],
            scale: ["وجه الكاميرا إلى أي ميزان", "الذكاء الاصطناعي يقرأ الوزن تلقائيًا", "يعمل مع الموازين الرقمية والتناظرية", "دعم وزن الهاتف", "تتبع الاتجاهات"],
            food: ["تقدير السعرات الحرارية الفوري", "تفصيل الماكرو (بروتين، كربوهيدرات، دهون)", "كائن مرجعي للدقة", "سجل الوجبات", "ملخص التغذية اليومي"],
            receipt: ["مسح الفواتير", "استخراج المنتجات والأسعار تلقائيًا", "تقدير تاريخ انتهاء الصلاحية", "سجل الأسعار", "رؤى الميزانية"],
            finance: ["تتبع نفقات الطعام", "الطبخ المنزلي مقابل الأكل خارجًا", "تقارير الميزانية الشهرية", "حاسبة التوفير", "تحليل التكلفة لكل وجبة"],
            health: ["تكامل Google Fit", "مزامنة Apple Health", "Samsung Health Connect", "بيانات الخطوات والنشاط", "استيراد تتبع النوم"],
            goals: ["أهداف يومية مخصصة", "الخطوات والضغط والقرفصاء والمزيد", "تتبع السلاسل", "تصور التقدم", "إشعارات التذكير"],
            charts: ["مخططات اتجاه الوزن", "رسوم بيانية لسجل التمارين", "التقدم عبر الزمن", "تتبع تركيب الجسم", "تصدير البيانات كـ CSV"],
            offline: ["وظائف كاملة بدون اتصال", "مزامنة تلقائية عند الاتصال", "لا فقدان للبيانات", "نسخ احتياطي للتخزين المحلي", "يعمل في أي مكان"],
            gotIt: "فهمت!"
        },
        testimonials: {
            title: "ماذا يقول المستخدمون",
            subtitle: "تقييمات حقيقية من رياضيين حقيقيين",
            name: "أحمد الحسن",
            role: "متحمس للياقة البدنية",
            review: "FitStream ساعدني على الانضباط في تحقيق أهدافي الرياضية. متابعة التمارين والتغذية أصبحت سهلة، والنتائج واضحة. تطبيق يستحق الاحترام لمن يأخذ صحته بجدية.",
            avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=AhmedAlHasan&backgroundColor=d5d5f5"
        }
    },
    ka: {
        _meta: { name: "ქართული", flag: "🇬🇪" },
        nav: { features: "ფუნქციები", aiPower: "AI ძალა", pricing: "ფასები", getStarted: "დაწყება" },
        hero: {
            powered: "Google Gemini AI-ზე დაფუძნებული",
            title1: "შენი AI", title2: "ფიტნეს პარტნიორი",
            desc: "თვალყური ადევნე ვარჯიშებს, დაასკანერე საკვები კალორიებისთვის, წაიკითხე სასწორი AI-ით და მიიღე პერსონალური მოტივაცია — ყველაფერი ერთ აპლიკაციაში.",
            download: "უფასოდ ჩამოტვირთვა", see: "ფუნქციების ნახვა"
        },
        features: {
            title: "ყველაფერი რაც გჭირდება", subtitle: "მძლავრი ფუნქციები შენი ფიტნეს მოგზაურობის ტრანსფორმაციისთვის",
            pose: "AI პოზის თვალყურისდევნება", poseDesc: "რეალურ დროში ფორმის ანალიზი MediaPipe-ით. 15 ვარჯიში მყისიერი უკუკავშირით.",
            kitchen: "ჭკვიანი სამზარეულო", kitchenDesc: "მართე მაცივარი, საკუჭნაო და საყინულე. AI ცნობს პროდუქტებს ფოტოებზე.",
            cooking: "მზარეულობის რეჟიმი", cookingDesc: "ნაბიჯ-ნაბიჯ რეცეპტები ტაიმერებით, შეხსენებებითა და რჩევებით.",
            coach: "AI ვარჯიშის მწვრთნელი", coachDesc: "რეალურ დროში მითითებები და გამეორებების დათვლა ხმოვანი უკუკავშირით",
            scale: "AI სასწორის სკანერი", scaleDesc: "მიმართე კამერა ნებისმიერ სასწორზე — AI ავტომატურად კითხულობს",
            food: "AI საკვების სკანერი", foodDesc: "გადაიღე ფოტო კალორიებისა და მაკროების მყისიერი შეფასებისთვის",
            receipt: "ჩეკების სკანირება", receiptDesc: "დაასკანერე სასურსათო ჩეკები პროდუქტების ფასებითა და ვადებით ავტომატურად დასამატებლად.",
            finance: "საკვების ფინანსები", financeDesc: "თვალყური ადევნე საკვებზე დანახარჯებს. გამოთვალე დანაზოგი სახლში მზარეულობისგან.",
            health: "ჯანმრთელობის პლატფორმის სინქრონიზაცია", healthDesc: "უწყვეტი სინქრონიზაცია Google Fit, Apple Health და Samsung Health-თან.",
            goals: "ყოველდღიური მიზნები", goalsDesc: "დასახე მიზნები ნაბიჯებისთვის, ბრუნვებისთვის, სკვოტებისთვის და სხვა",
            charts: "პროგრესის დიაგრამები", chartsDesc: "ვიზუალიზე შენი წონა და ვარჯიშების ისტორია",
            offline: "ჯერ ოფლაინ", offlineDesc: "მუშაობს ინტერნეტის გარეშე — ავტომატურად სინქრონდება"
        },
        ai: {
            powered: "Advanced Gemini-ზე დაფუძნებული",
            title1: "AI რომელიც ნამდვილად", title2: "ესმის ფიტნესი",
            desc: "ჩვენი AI არა მხოლოდ ითვლის — ის ხედავს, ესმის და ადაპტირდება.",
            vision: "ხედვის AI", visionDesc: "კითხულობს სასწორებს, ცნობს საკვებს, აანალიზებს მენიუებს",
            portion: "ჭკვიანი პორციის შეფასება", portionDesc: "იყენებს საორიენტაციო ობიექტებს ზუსტი პორციებისთვის",
            motivation: "პერსონალიზებული მოტივაცია", motivationDesc: "AI ადაპტირებს წახალისებას შენს პროგრესზე"
        },
        pricing: {
            title: "მარტივი ფასები", subtitle: "დაიწყე უფასოდ, განაახლე როცა მზად იქნები",
            free: "უფასო", freeSub: "იდეალური დასაწყებად", forever: "სამუდამოდ",
            pro: "FitStream PRO", proSub: "სერიოზული ფიტნეს ენთუზიასტებისთვის", month: "თვე",
            popular: "ყველაზე პოპულარული",
            f1: "შეუზღუდავი ვარჯიშები", f2: "AI სასწორის სკანერი", f3: "AI საკვების სკანერი", f4: "ყოველდღიური მიზნები და სერიები", f5: "პროგრესის დიაგრამები",
            p1: "ყველაფერი უფასოდან", p2: "სხეულის შემადგენლობის ანალიზი", p3: "რესტორნის მენიუს ანალიზატორი", p4: "მორგებული ხატულები", p5: "პრიორიტეტული მხარდაჭერა",
            startFree: "დაიწყე უფასოდ", upgrade: "განაახლე PRO-მდე"
        },
        download: {
            title1: "მზად ხარ შენი", title2: "ფიტნესის ტრანსფორმაციისთვის?",
            desc: "ჩამოტვირთე FitStream ახლავე და დაიწყე შენი AI-ზე დაფუძნებული ფიტნეს მოგზაურობა",
            appStore: "App Store", googlePlay: "Google Play", web: "ვებ ბრაუზერი",
            on: "ჩამოტვირთე", get: "მიიღე", use: "გამოიყენე"
        },
        footer: { privacy: "კონფიდენციალურობა", terms: "პირობები", contact: "კონტაქტი", rights: "ყველა უფლება დაცულია." },
        phone: {
            tracking: "AI თვალყურისდევნება", streak: "სერია",
            motivation: "ყოველი გამეორება მნიშვნელოვანია. გაგრძელე!",
            steps: "ნაბიჯები", squats: "სკვოტი", pushups: "ბრუნვა", situps: "პრესი",
            dashboard: "მთავარი", nutrition: "საკვები", workout: "ვარჯ.", social: "მეგობრები", settings: "პარამ.",
            tap: "შეეხე რგოლებს!",
            water: "წყალი", glasses: "ჭიქა", calories: "დაწვა", kcal: "კკალ",
            leaderboard: "რეიტინგი", you: "შენ", points: "ქულა",
            theme: "თემა", dark: "მუქი", light: "ნათელი", lang: "ენა"
        },
        modal: {
            pose: ["რეალურ დროში პოზის აღმოჩენა MediaPipe-ით", "15 სხვადასხვა ვარჯიში მხარდაჭერილია", "მყისიერი უკუკავშირი ფორმაზე", "გამეორებების დათვლა AI-ით", "მუშაობს ნებისმიერ კამერაზე"],
            kitchen: ["თვალყური ადევნე პროდუქტებს მაცივარსა და საყინულეში", "AI ცნობს პროდუქტებს ფოტოებზე", "ვადის გასვლის თვალყურისდევნება", "ჭკვიანი საყიდლების სიები", "დაბალი მარაგის შეტყობინებები"],
            cooking: ["ნაბიჯ-ნაბიჯ რეცეპტის სახელმძღვანელო", "ჩაშენებული მზარეულობის ტაიმერები", "ხმოვანი შეხსენებები", "პრობლემების მოგვარების რჩევები", "ინგრედიენტების ჩანაცვლება"],
            coach: ["რეალურ დროში ხმოვანი მითითება", "ავტომატური გამეორებების დათვლა", "ფორმის გასწორების რჩევები", "მორგებადი ხმა (მ/ქ)", "ვარჯიშის ისტორია"],
            scale: ["მიმართე კამერა ნებისმიერ სასწორზე", "AI ავტომატურად კითხულობს წონას", "მუშაობს ციფრულ და ანალოგურ სასწორებზე", "ტელეფონის ტარა მხარდაჭერა", "ტრენდების თვალყურისდევნება"],
            food: ["მყისიერი კალორიების შეფასება", "მაკროების დაშლა (ცილა, ნახშირწყლები, ცხიმი)", "საორიენტაციო ობიექტი სიზუსტისთვის", "კვების ჟურნალი", "ყოველდღიური კვების შეჯამება"],
            receipt: ["ჩეკების სკანირება", "პროდუქტებისა და ფასების ავტომატური ამოღება", "ვადის გასვლის შეფასება", "ფასების ისტორია", "ბიუჯეტის ინსაიტები"],
            finance: ["საკვებზე დანახარჯების თვალყურისდევნება", "სახლში მზადება vs გარეთ ჭამა", "ყოველთვიური ბიუჯეტის ანგარიშები", "დანაზოგის კალკულატორი", "ერთ კვებაზე ხარჯების ანალიზი"],
            health: ["Google Fit ინტეგრაცია", "Apple Health სინქრონიზაცია", "Samsung Health Connect", "ნაბიჯების და აქტივობის მონაცემები", "ძილის თვალყურისდევნების იმპორტი"],
            goals: ["მორგებული ყოველდღიური მიზნები", "ნაბიჯები, ბრუნვები, სკვოტები და სხვა", "სერიების თვალყურისდევნება", "პროგრესის ვიზუალიზაცია", "შეხსენების შეტყობინებები"],
            charts: ["წონის ტრენდის დიაგრამები", "ვარჯიშის ისტორიის გრაფიკები", "პროგრესი დროთა განმავლობაში", "სხეულის შემადგენლობის თვალყურისდევნება", "მონაცემების ექსპორტი CSV-ში"],
            offline: ["სრული ოფლაინ ფუნქციონალობა", "ავტომატური სინქრონიზაცია ონლაინ რეჟიმში", "მონაცემთა დაკარგვა არ ხდება", "ლოკალური შენახვის სარეზერვო ასლი", "მუშაობს ყველგან"],
            gotIt: "გასაგებია!"
        },
        testimonials: {
            title: "რას ამბობენ მომხმარებლები",
            subtitle: "ნამდვილი შეფასებები ნამდვილი სპორტსმენებისგან",
            name: "გიორგი ბერიძე",
            role: "ფიტნეს-ენთუზიასტი",
            review: "ქართველისთვის ჯანსაღი ცხოვრება ტრადიციაა, და FitStream ამ ტრადიციას თანამედროვე ტექნოლოგიებთან აკავშირებს. AI სკანერი ზუსტია, ინტერფეისი მარტივი — ვამაყობ რომ ასეთ აპს ვიყენებ.",
            avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=GiorgiBeridzе&backgroundColor=f5f5d5"
        }
    }
};

// Language detection and management
function detectLanguage() {
    const browserLang = navigator.language.split('-')[0];
    return i18n[browserLang] ? browserLang : 'en';
}

function getAvailableLanguages() {
    return Object.entries(i18n).map(([code, data]) => ({
        code,
        name: data._meta.name,
        flag: data._meta.flag,
        rtl: data._meta.rtl || false
    }));
}
