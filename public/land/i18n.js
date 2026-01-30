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
            title: "Simple Pricing", subtitle: "Start free, upgrade when you're ready",
            free: "Free", freeSub: "Perfect for getting started", forever: "forever",
            pro: "FitStream PRO", proSub: "For serious fitness enthusiasts", month: "month",
            popular: "MOST POPULAR",
            f1: "Unlimited workouts", f2: "AI Scale Scanner", f3: "AI Food Scanner", f4: "Daily Goals & Streaks", f5: "Progress Charts",
            p1: "Everything in Free", p2: "Body Composition Analysis", p3: "Restaurant Menu Analyzer", p4: "Custom Goal Icons", p5: "Priority Support",
            startFree: "Get Started Free", upgrade: "Upgrade to PRO"
        },
        download: {
            title1: "Ready to Transform", title2: "Your Fitness?",
            desc: "Download FitStream now and start your AI-powered fitness journey",
            appStore: "App Store", googlePlay: "Google Play", web: "Web Browser",
            on: "Download on the", get: "Get it on", use: "Use in",
            directDownload: "Direct Download", openIn: "Open in",
            tgNote: "* Telegram mini-app has workout session limits for free users",
            comingSoon: "Coming Soon"
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
            title: "Простые цены", subtitle: "Начните бесплатно, улучшите когда готовы",
            free: "Бесплатно", freeSub: "Идеально для начала", forever: "навсегда",
            pro: "FitStream PRO", proSub: "Для серьёзных спортсменов", month: "месяц",
            popular: "ПОПУЛЯРНЫЙ",
            f1: "Безлимитные тренировки", f2: "ИИ-сканер весов", f3: "ИИ-сканер еды", f4: "Цели и серии", f5: "Графики прогресса",
            p1: "Всё из бесплатной версии", p2: "Анализ состава тела", p3: "Анализатор меню", p4: "Свои иконки целей", p5: "Приоритетная поддержка",
            startFree: "Начать бесплатно", upgrade: "Перейти на PRO"
        },
        download: {
            title1: "Готовы изменить", title2: "свой фитнес?",
            desc: "Скачайте FitStream и начните путь с ИИ-помощником",
            appStore: "App Store", googlePlay: "Google Play", web: "браузере",
            on: "Скачать в", get: "Доступно в", use: "Открыть в",
            directDownload: "Скачать напрямую", openIn: "Открыть в",
            tgNote: "* В Telegram мини-приложении ограничены тренировки для бесплатных пользователей",
            comingSoon: "Скоро"
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
            offline: "Offline-First", offlineDesc: "Funktioniert ohne Internet — synchronisiert automatisch",
            shop: "Einkaufsassistent", shopDesc: "KI plant Mahlzeiten und erstellt smarte Einkaufslisten"
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
            title: "Einfache Preise", subtitle: "Starte kostenlos, upgrade wenn du bereit bist",
            free: "Kostenlos", freeSub: "Perfekt zum Starten", forever: "für immer",
            pro: "FitStream PRO", proSub: "Für ernsthafte Fitness-Enthusiasten", month: "Monat",
            popular: "BELIEBTESTE",
            f1: "Unbegrenzte Workouts", f2: "KI-Waagen-Scanner", f3: "KI-Essens-Scanner", f4: "Tägliche Ziele & Streaks", f5: "Fortschritts-Diagramme",
            p1: "Alles aus Kostenlos", p2: "Körperanalyse", p3: "Restaurant-Menü-Analyzer", p4: "Eigene Ziel-Icons", p5: "Prioritäts-Support",
            startFree: "Kostenlos starten", upgrade: "Auf PRO upgraden"
        },
        download: {
            title1: "Bereit deine", title2: "Fitness zu transformieren?",
            desc: "Lade FitStream jetzt herunter und starte deine KI-gestützte Fitness-Reise",
            appStore: "App Store", googlePlay: "Google Play", web: "Web Browser",
            on: "Laden im", get: "Jetzt bei", use: "Nutzen im",
            directDownload: "Direkter Download", openIn: "Öffnen in",
            tgNote: "* Telegram Mini-App hat Trainings-Limits für kostenlose Nutzer",
            comingSoon: "Demnächst"
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
            shop: ["KI-Mahlzeitenplanung für jeden Zeitraum", "Smarte Einkaufslisten-Generierung", "Regalscanner findet Produkte", "Produktverifizierung per Foto", "Gesundheitsbewertung für Artikel"],
            gotIt: "Verstanden!"
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
            offline: "Hors ligne d'abord", offlineDesc: "Fonctionne sans internet — synchronise automatiquement",
            shop: "Assistant courses", shopDesc: "L'IA planifie les repas et crée des listes de courses intelligentes"
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
            title: "Tarifs simples", subtitle: "Commencez gratuitement, passez à la version supérieure quand vous êtes prêt",
            free: "Gratuit", freeSub: "Parfait pour commencer", forever: "pour toujours",
            pro: "FitStream PRO", proSub: "Pour les passionnés de fitness", month: "mois",
            popular: "LE PLUS POPULAIRE",
            f1: "Entraînements illimités", f2: "Scanner de balance IA", f3: "Scanner alimentaire IA", f4: "Objectifs & Séries", f5: "Graphiques de progrès",
            p1: "Tout de Gratuit", p2: "Analyse corporelle", p3: "Analyseur de menu restaurant", p4: "Icônes personnalisées", p5: "Support prioritaire",
            startFree: "Commencer gratuitement", upgrade: "Passer à PRO"
        },
        download: {
            title1: "Prêt à transformer", title2: "votre fitness?",
            desc: "Téléchargez FitStream maintenant et commencez votre parcours fitness avec l'IA",
            appStore: "App Store", googlePlay: "Google Play", web: "Navigateur Web",
            on: "Télécharger sur", get: "Disponible sur", use: "Utiliser dans",
            directDownload: "Téléchargement direct", openIn: "Ouvrir dans",
            tgNote: "* L'application Telegram a des limites d'entraînement pour les utilisateurs gratuits",
            comingSoon: "Bientôt"
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
            shop: ["Planification de repas IA pour toute période", "Génération de liste de courses intelligente", "Scanner d'étagère trouve les produits", "Vérification produit par photo", "Score santé des articles"],
            gotIt: "Compris!"
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
            offline: "Sin conexión primero", offlineDesc: "Funciona sin internet — sincroniza automáticamente",
            shop: "Asistente de compras", shopDesc: "IA planifica comidas y crea listas de compras inteligentes"
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
            title: "Precios simples", subtitle: "Empieza gratis, mejora cuando estés listo",
            free: "Gratis", freeSub: "Perfecto para empezar", forever: "para siempre",
            pro: "FitStream PRO", proSub: "Para entusiastas serios del fitness", month: "mes",
            popular: "MÁS POPULAR",
            f1: "Entrenamientos ilimitados", f2: "Escáner de báscula IA", f3: "Escáner de comida IA", f4: "Metas y Rachas", f5: "Gráficos de progreso",
            p1: "Todo de Gratis", p2: "Análisis de composición corporal", p3: "Analizador de menú", p4: "Iconos personalizados", p5: "Soporte prioritario",
            startFree: "Empezar gratis", upgrade: "Mejorar a PRO"
        },
        download: {
            title1: "¿Listo para transformar", title2: "tu fitness?",
            desc: "Descarga FitStream ahora y comienza tu viaje fitness con IA",
            appStore: "App Store", googlePlay: "Google Play", web: "Navegador Web",
            on: "Descargar en", get: "Disponible en", use: "Usar en",
            directDownload: "Descarga directa", openIn: "Abrir en",
            tgNote: "* La mini-app de Telegram tiene límites de entrenamiento para usuarios gratuitos",
            comingSoon: "Próximamente"
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
            shop: ["Planificación de comidas IA para cualquier período", "Generación de lista de compras inteligente", "Escáner de estante encuentra productos", "Verificación de producto por foto", "Puntuación de salud de artículos"],
            gotIt: "¡Entendido!"
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
            offline: "Offline First", offlineDesc: "Funziona senza internet — sincronizza automaticamente",
            shop: "Assistente spesa", shopDesc: "L'IA pianifica pasti e crea liste della spesa intelligenti"
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
            on: "Scarica su", get: "Disponibile su", use: "Usa nel",
            directDownload: "Download diretto", openIn: "Apri in",
            tgNote: "* L'app Telegram ha limiti di allenamento per gli utenti gratuiti",
            comingSoon: "Prossimamente"
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
            shop: ["Pianificazione pasti IA per qualsiasi periodo", "Generazione lista spesa intelligente", "Scanner scaffale trova prodotti", "Verifica prodotto via foto", "Punteggio salute articoli"],
            gotIt: "Capito!"
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
            offline: "Offline primeiro", offlineDesc: "Funciona sem internet — sincroniza automaticamente",
            shop: "Assistente de compras", shopDesc: "IA planeja refeições e cria listas de compras inteligentes"
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
            on: "Baixar na", get: "Disponível no", use: "Usar no",
            directDownload: "Download direto", openIn: "Abrir em",
            tgNote: "* O mini-app do Telegram tem limites de treino para usuários gratuitos",
            comingSoon: "Em breve"
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
            shop: ["Planejamento de refeições IA para qualquer período", "Geração de lista de compras inteligente", "Scanner de prateleira encontra produtos", "Verificação de produto por foto", "Pontuação de saúde dos itens"],
            gotIt: "Entendi!"
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
            offline: "オフラインファースト", offlineDesc: "インターネットなしでも動作 — 自動で同期",
            shop: "お買い物アシスタント", shopDesc: "AIが食事計画を立て、スマートな買い物リストを作成"
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
            on: "でダウンロード", get: "で入手", use: "で使用",
            directDownload: "直接ダウンロード", openIn: "で開く",
            tgNote: "* Telegramミニアプリは無料ユーザーのワークアウト制限があります",
            comingSoon: "近日公開"
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
            shop: ["任意期間のAI食事計画", "スマート買い物リスト生成", "棚スキャナーで商品を探す", "写真で商品確認", "商品の健康スコア"],
            gotIt: "了解！"
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
            offline: "오프라인 우선", offlineDesc: "인터넷 없이도 작동 — 자동 동기화",
            shop: "쇼핑 어시스턴트", shopDesc: "AI가 식단을 계획하고 스마트 쇼핑 리스트 생성"
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
            on: "에서 다운로드", get: "에서 받기", use: "에서 사용",
            directDownload: "직접 다운로드", openIn: "에서 열기",
            tgNote: "* 텔레그램 미니앱은 무료 사용자에게 운동 제한이 있습니다",
            comingSoon: "곧 출시"
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
            shop: ["모든 기간에 대한 AI 식단 계획", "스마트 쇼핑 리스트 생성", "선반 스캐너로 제품 찾기", "사진으로 제품 확인", "제품 건강 점수"],
            gotIt: "알겠어요!",
            close: "닫기"
        },
        tiles: {
            pose: {
                realtime: { label: "실시간", desc: "MediaPipe로 33개 신체 포인트를 30fps로 추적." },
                exercises: { label: "15가지 운동", desc: "스쿼트, 푸시업, 플랭크, 런지 등." },
                feedback: { label: "피드백", desc: "자세에 대한 즉각적인 시각 및 음성 안내." },
                counting: { label: "카운팅", desc: "AI가 자동으로 반복 횟수를 카운트." }
            },
            kitchen: {
                storage: { label: "보관 관리", desc: "냉장고와 냉동실의 제품을 정리." },
                "ai-scan": { label: "AI 스캔", desc: "카메라를 향하면 AI가 인식하고 추가." },
                expiry: { label: "유통기한", desc: "유통기한 전 알림. 음식 낭비 감소." },
                shopping: { label: "리스트", desc: "쇼핑 리스트 자동 생성." }
            },
            cooking: {
                steps: { label: "단계별", desc: "각 요리 단계에 대한 명확한 안내." },
                timer: { label: "타이머", desc: "내장 타이머. 여러 개 동시 사용 가능." },
                voice: { label: "음성", desc: "음성 안내로 핸즈프리 요리." },
                tips: { label: "팁", desc: "셰프 팁과 재료 대체 방법." }
            },
            coach: {
                "voice-guide": { label: "음성 코치", desc: "실시간 동기부여. 남성/여성 음성 선택." },
                "rep-count": { label: "카운터", desc: "AI가 자동으로 반복 횟수 카운트." },
                "form-tips": { label: "자세 교정", desc: "자세에 대한 즉각적인 피드백." },
                history: { label: "기록", desc: "모든 운동을 추적." }
            },
            scale: {
                camera: { label: "카메라", desc: "체중계 디스플레이를 향해 촬영만 하면 됩니다." },
                "auto-read": { label: "자동 인식", desc: "AI가 즉시 체중을 읽습니다." },
                "any-scale": { label: "모든 체중계", desc: "디지털 및 아날로그 체중계 모두 지원." },
                trend: { label: "트렌드", desc: "그래프로 체중 변화 추적." }
            },
            food: {
                calories: { label: "칼로리", desc: "사진을 찍으면 몇 초 만에 칼로리 추정." },
                macros: { label: "매크로", desc: "단백질, 탄수화물, 지방 분석." },
                reference: { label: "기준", desc: "카드를 사용해 정확한 분량 추정." },
                log: { label: "기록", desc: "자동으로 식단 일지 작성." }
            },
            receipt: {
                scan: { label: "스캔", desc: "영수증 촬영. AI가 모두 추출." },
                extract: { label: "추출", desc: "제품, 가격, 수량 자동 인식." },
                prices: { label: "가격", desc: "시간에 따른 가격 변화 추적." },
                budget: { label: "예산", desc: "지출 분석과 절약 팁." }
            },
            finance: {
                spending: { label: "지출", desc: "모든 식품 구매 추적." },
                "cooking-vs-out": { label: "집밥 vs 외식", desc: "집에서 요리와 외식 비용 비교." },
                reports: { label: "리포트", desc: "식비 월간 상세 리포트." },
                savings: { label: "절약", desc: "집에서 요리하면 얼마나 절약되는지 계산." }
            },
            health: {
                "google-fit": { label: "Google Fit", desc: "걸음, 운동, 심박수 동기화." },
                "apple-health": { label: "Apple Health", desc: "Apple Health와 완전 연동." },
                steps: { label: "걸음", desc: "폰이나 스마트워치에서 걸음수 가져오기." },
                sync: { label: "동기화", desc: "데이터가 백그라운드에서 자동 동기화." }
            },
            goals: {
                custom: { label: "맞춤 목표", desc: "나만의 일일 목표 설정." },
                exercises: { label: "운동", desc: "걸음, 푸시업, 스쿼트, 물 목표." },
                streak: { label: "연속", desc: "연속 카운터로 습관 형성." },
                progress: { label: "링", desc: "일일 진행 상황을 아름다운 링으로 표시." }
            },
            charts: {
                weight: { label: "체중", desc: "주간 및 월간 체중 트렌드." },
                workouts: { label: "운동", desc: "빈도와 강도 시각화." },
                body: { label: "체성분", desc: "근육량과 체지방 추적." },
                export: { label: "내보내기", desc: "모든 데이터를 CSV로 내보내기." }
            },
            offline: {
                "offline-mode": { label: "오프라인", desc: "인터넷 없이도 전체 기능 사용." },
                "auto-sync": { label: "자동 동기화", desc: "온라인 시 변경사항 자동 동기화." },
                local: { label: "로컬", desc: "모든 데이터를 기기에 안전하게 저장." },
                anywhere: { label: "어디서나", desc: "헬스장, 야외, 여행 중에도 사용." }
            },
            shop: {
                planning: { label: "계획", desc: "선호도에 따라 AI가 식사 제안." },
                list: { label: "스마트 리스트", desc: "매장 섹션별로 자동 정리된 리스트." },
                scanner: { label: "선반 스캐너", desc: "선반을 스캔해 제품을 빠르게 찾기." },
                verify: { label: "확인", desc: "장바구니 촬영으로 모든 것을 확인." }
            }
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
            offline: "离线优先", offlineDesc: "无需网络即可使用 — 自动同步",
            shop: "购物助手", shopDesc: "AI规划餐食并创建智能购物清单"
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
            on: "在此下载", get: "在此获取", use: "在此使用",
            directDownload: "直接下载", openIn: "打开",
            tgNote: "* Telegram迷你应用对免费用户有锻炼限制",
            comingSoon: "即将推出"
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
            shop: ["任意时期的AI餐食规划", "智能购物清单生成", "货架扫描器查找产品", "照片验证产品", "商品健康评分"],
            gotIt: "明白了！",
            close: "关闭"
        },
        tiles: {
            pose: {
                realtime: { label: "实时", desc: "通过MediaPipe以30fps追踪33个身体关键点。" },
                exercises: { label: "15种运动", desc: "深蹲、俯卧撑、平板支撑、弓步等。" },
                feedback: { label: "反馈", desc: "即时的视觉和音频姿势提示。" },
                counting: { label: "计数", desc: "AI自动计算重复次数。" }
            },
            kitchen: {
                storage: { label: "储存管理", desc: "整理冰箱和冷冻室中的产品。" },
                "ai-scan": { label: "AI扫描", desc: "对准相机，AI识别并添加。" },
                expiry: { label: "保质期", desc: "保质期前提醒。减少食物浪费。" },
                shopping: { label: "清单", desc: "自动生成购物清单。" }
            },
            cooking: {
                steps: { label: "步骤", desc: "每个烹饪步骤的清晰说明。" },
                timer: { label: "计时器", desc: "内置计时器。可同时运行多个。" },
                voice: { label: "语音", desc: "语音指导，解放双手烹饪。" },
                tips: { label: "技巧", desc: "厨师技巧和食材替代建议。" }
            },
            coach: {
                "voice-guide": { label: "语音教练", desc: "实时激励。可选男声或女声。" },
                "rep-count": { label: "计数器", desc: "AI自动计算重复次数。" },
                "form-tips": { label: "姿势纠正", desc: "即时姿势反馈。" },
                history: { label: "历史", desc: "追踪所有锻炼记录。" }
            },
            scale: {
                camera: { label: "相机", desc: "只需对准体重秤显示屏。" },
                "auto-read": { label: "自动读取", desc: "AI即时读取体重。" },
                "any-scale": { label: "任意体重秤", desc: "支持数字和模拟体重秤。" },
                trend: { label: "趋势", desc: "通过图表追踪体重变化。" }
            },
            food: {
                calories: { label: "卡路里", desc: "拍照即可在几秒内估算卡路里。" },
                macros: { label: "宏量营养素", desc: "蛋白质、碳水化合物、脂肪分析。" },
                reference: { label: "参照物", desc: "使用卡片准确估算份量。" },
                log: { label: "日志", desc: "自动记录饮食日记。" }
            },
            receipt: {
                scan: { label: "扫描", desc: "拍摄小票。AI提取所有数据。" },
                extract: { label: "提取", desc: "自动识别产品、价格和数量。" },
                prices: { label: "价格", desc: "追踪价格随时间的变化。" },
                budget: { label: "预算", desc: "支出分析和省钱建议。" }
            },
            finance: {
                spending: { label: "支出", desc: "追踪每笔食品购买。" },
                "cooking-vs-out": { label: "在家vs外食", desc: "比较在家做饭和外出就餐的成本。" },
                reports: { label: "报告", desc: "食品支出月度详细报告。" },
                savings: { label: "节省", desc: "计算在家做饭能省多少钱。" }
            },
            health: {
                "google-fit": { label: "Google Fit", desc: "同步步数、锻炼和心率。" },
                "apple-health": { label: "Apple Health", desc: "与Apple Health完全集成。" },
                steps: { label: "步数", desc: "从手机或智能手表导入步数。" },
                sync: { label: "同步", desc: "数据在后台自动同步。" }
            },
            goals: {
                custom: { label: "自定义目标", desc: "设置您自己的每日目标。" },
                exercises: { label: "运动", desc: "步数、俯卧撑、深蹲、饮水目标。" },
                streak: { label: "连续", desc: "通过连续计数器养成习惯。" },
                progress: { label: "圆环", desc: "美观的每日进度圆环显示。" }
            },
            charts: {
                weight: { label: "体重", desc: "周和月的体重趋势。" },
                workouts: { label: "锻炼", desc: "可视化频率和强度。" },
                body: { label: "身体", desc: "追踪肌肉量和体脂。" },
                export: { label: "导出", desc: "将所有数据导出为CSV。" }
            },
            offline: {
                "offline-mode": { label: "离线", desc: "无需网络也能使用全部功能。" },
                "auto-sync": { label: "自动同步", desc: "联网后自动同步更改。" },
                local: { label: "本地", desc: "所有数据安全存储在设备上。" },
                anywhere: { label: "随处可用", desc: "健身房、户外或旅行时都可使用。" }
            },
            shop: {
                planning: { label: "规划", desc: "AI根据您的偏好推荐餐食。" },
                list: { label: "智能清单", desc: "按商店区域自动整理的清单。" },
                scanner: { label: "货架扫描", desc: "扫描货架快速找到您的商品。" },
                verify: { label: "验证", desc: "拍摄购物车确认已购齐所有商品。" }
            }
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
            offline: "Offline Eerst", offlineDesc: "Werkt zonder internet — synchroniseert automatisch",
            shop: "Boodschappenassistent", shopDesc: "AI plant maaltijden en maakt slimme boodschappenlijsten"
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
            on: "Download in de", get: "Beschikbaar op", use: "Gebruik in",
            directDownload: "Directe download", openIn: "Openen in",
            tgNote: "* Telegram mini-app heeft trainingslimieten voor gratis gebruikers",
            comingSoon: "Binnenkort"
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
            shop: ["AI-maaltijdplanning voor elke periode", "Slimme boodschappenlijst generatie", "Schapscanner vindt producten", "Productverificatie via foto", "Gezondheidsscore voor artikelen"],
            gotIt: "Begrepen!",
            close: "Sluiten"
        },
        tiles: {
            pose: {
                realtime: { label: "Realtime", desc: "Volgt 33 lichaamspunten op 30fps met MediaPipe." },
                exercises: { label: "15 oefeningen", desc: "Squats, push-ups, planks, lunges en meer." },
                feedback: { label: "Feedback", desc: "Directe visuele en audio hints over vorm." },
                counting: { label: "Tellen", desc: "AI telt automatisch herhalingen." }
            },
            kitchen: {
                storage: { label: "Opslag", desc: "Organiseer producten in koelkast en vriezer." },
                "ai-scan": { label: "AI-scan", desc: "Richt camera — AI herkent en voegt toe." },
                expiry: { label: "Houdbaar", desc: "Waarschuwingen vóór vervaldatum. Minder verspilling." },
                shopping: { label: "Lijsten", desc: "Automatisch boodschappenlijsten genereren." }
            },
            cooking: {
                steps: { label: "Stappen", desc: "Duidelijke instructies voor elke kookstap." },
                timer: { label: "Timers", desc: "Ingebouwde timers. Meerdere tegelijk." },
                voice: { label: "Stem", desc: "Handsfree koken met spraakinstructies." },
                tips: { label: "Tips", desc: "Chef-tips en ingrediëntenvervangingen." }
            },
            coach: {
                "voice-guide": { label: "Stemcoach", desc: "Realtime motivatie. Mannelijke of vrouwelijke stem." },
                "rep-count": { label: "Teller", desc: "AI telt herhalingen automatisch." },
                "form-tips": { label: "Correctie", desc: "Directe feedback op houding." },
                history: { label: "Geschiedenis", desc: "Volg al je workouts." }
            },
            scale: {
                camera: { label: "Camera", desc: "Richt gewoon op het weegschaalscherm." },
                "auto-read": { label: "Auto-lezen", desc: "AI leest gewicht direct." },
                "any-scale": { label: "Elke weegschaal", desc: "Werkt met digitale en analoge weegschalen." },
                trend: { label: "Trends", desc: "Volg gewichtsverandering met grafieken." }
            },
            food: {
                calories: { label: "Calorieën", desc: "Maak foto voor calorieënschatting in seconden." },
                macros: { label: "Macro's", desc: "Uitsplitsing eiwit, koolhydraten, vet." },
                reference: { label: "Referentie", desc: "Gebruik kaart voor nauwkeurige portieschatting." },
                log: { label: "Dagboek", desc: "Houd automatisch voedingsdagboek bij." }
            },
            receipt: {
                scan: { label: "Scanner", desc: "Fotografeer bon. AI extraheert alles." },
                extract: { label: "Extractie", desc: "Producten, prijzen, hoeveelheden automatisch herkend." },
                prices: { label: "Prijzen", desc: "Volg prijsveranderingen over tijd." },
                budget: { label: "Budget", desc: "Uitgavenanalyse en besparingstips." }
            },
            finance: {
                spending: { label: "Uitgaven", desc: "Volg elke voedselaankoop." },
                "cooking-vs-out": { label: "Thuis vs uit", desc: "Vergelijk kosten thuiskoken en restaurants." },
                reports: { label: "Rapporten", desc: "Maandelijks detail van voedseluitgaven." },
                savings: { label: "Besparing", desc: "Bereken hoeveel je bespaart door thuis te koken." }
            },
            health: {
                "google-fit": { label: "Google Fit", desc: "Synchroniseer stappen, workouts, hartslag." },
                "apple-health": { label: "Apple Health", desc: "Volledige integratie met Apple Health." },
                steps: { label: "Stappen", desc: "Importeer stappen van telefoon of smartwatch." },
                sync: { label: "Sync", desc: "Data synchroniseert automatisch op achtergrond." }
            },
            goals: {
                custom: { label: "Eigen doelen", desc: "Stel je eigen dagelijkse doelen in." },
                exercises: { label: "Oefeningen", desc: "Doelen voor stappen, push-ups, squats, water." },
                streak: { label: "Reeksen", desc: "Bouw gewoontes met reeksteller." },
                progress: { label: "Ringen", desc: "Mooie ringvisualisatie van dagelijkse voortgang." }
            },
            charts: {
                weight: { label: "Gewicht", desc: "Gewichtstrends over weken en maanden." },
                workouts: { label: "Trainingen", desc: "Visualiseer frequentie en intensiteit." },
                body: { label: "Lichaam", desc: "Volg spiermassa en lichaamsvet." },
                export: { label: "Exporteer", desc: "Exporteer alle data naar CSV." }
            },
            offline: {
                "offline-mode": { label: "Offline", desc: "Volledige app zonder internetverbinding." },
                "auto-sync": { label: "Auto-sync", desc: "Wijzigingen synchroniseren wanneer online." },
                local: { label: "Lokaal", desc: "Alle data veilig opgeslagen op apparaat." },
                anywhere: { label: "Overal", desc: "Gebruik in sportschool, buiten of op reis." }
            },
            shop: {
                planning: { label: "Planning", desc: "AI suggereert maaltijden op basis van voorkeuren." },
                list: { label: "Slimme lijsten", desc: "Auto-lijsten georganiseerd per winkelafdeling." },
                scanner: { label: "Schapscanner", desc: "Scan schappen om producten snel te vinden." },
                verify: { label: "Verificatie", desc: "Fotografeer winkelwagen om alles te controleren." }
            }
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
            offline: "Offline Först", offlineDesc: "Fungerar utan internet — synkar automatiskt",
            shop: "Inköpsassistent", shopDesc: "AI planerar måltider och skapar smarta inköpslistor"
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
            on: "Ladda ner på", get: "Hämta på", use: "Använd i",
            directDownload: "Direktnedladdning", openIn: "Öppna i",
            tgNote: "* Telegram-miniappen har träningsbegränsningar för gratisanvändare",
            comingSoon: "Kommer snart"
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
            shop: ["AI-måltidsplanering för valfri period", "Smart inköpslista-generering", "Hyllskanner hittar produkter", "Produktverifiering via foto", "Hälsopoäng för varor"],
            gotIt: "Uppfattat!",
            close: "Stäng"
        },
        tiles: {
            pose: {
                realtime: { label: "Realtid", desc: "Spårar 33 kroppspunkter vid 30fps med MediaPipe." },
                exercises: { label: "15 övningar", desc: "Squats, armhävningar, plankor, utfall med mera." },
                feedback: { label: "Feedback", desc: "Direkta visuella och ljudsignaler om form." },
                counting: { label: "Räkning", desc: "AI räknar automatiskt repetitioner." }
            },
            kitchen: {
                storage: { label: "Förvaring", desc: "Organisera produkter i kyl och frys." },
                "ai-scan": { label: "AI-skanning", desc: "Rikta kameran — AI känner igen och lägger till." },
                expiry: { label: "Utgångsdatum", desc: "Varningar innan utgångsdatum. Mindre svinn." },
                shopping: { label: "Listor", desc: "Automatisk generering av inköpslistor." }
            },
            cooking: {
                steps: { label: "Steg", desc: "Tydliga instruktioner för varje tillagningssteg." },
                timer: { label: "Timers", desc: "Inbyggda timers. Flera samtidigt." },
                voice: { label: "Röst", desc: "Handsfree matlagning med röstinstruktioner." },
                tips: { label: "Tips", desc: "Kocktips och ingrediensersättningar." }
            },
            coach: {
                "voice-guide": { label: "Röstcoach", desc: "Realtidsmotivation. Manlig eller kvinnlig röst." },
                "rep-count": { label: "Räknare", desc: "AI räknar repetitioner automatiskt." },
                "form-tips": { label: "Korrigering", desc: "Direkt feedback på hållning." },
                history: { label: "Historik", desc: "Spåra alla dina träningspass." }
            },
            scale: {
                camera: { label: "Kamera", desc: "Rikta bara mot vågens display." },
                "auto-read": { label: "Autoläsning", desc: "AI läser vikten direkt." },
                "any-scale": { label: "Alla vågar", desc: "Fungerar med digitala och analoga vågar." },
                trend: { label: "Trender", desc: "Spåra viktförändring med grafer." }
            },
            food: {
                calories: { label: "Kalorier", desc: "Ta ett foto för kaloriuppskattning på sekunder." },
                macros: { label: "Makros", desc: "Fördelning av protein, kolhydrater, fett." },
                reference: { label: "Referens", desc: "Använd kort för exakt portionsuppskattning." },
                log: { label: "Dagbok", desc: "Håll automatiskt matdagbok." }
            },
            receipt: {
                scan: { label: "Skanner", desc: "Fotografera kvitto. AI extraherar allt." },
                extract: { label: "Extraktion", desc: "Produkter, priser, mängder identifieras automatiskt." },
                prices: { label: "Priser", desc: "Spåra prisförändringar över tid." },
                budget: { label: "Budget", desc: "Utgiftsanalys och spartips." }
            },
            finance: {
                spending: { label: "Utgifter", desc: "Spåra varje matinköp." },
                "cooking-vs-out": { label: "Hemma vs ute", desc: "Jämför kostnader för hemlagat och restauranger." },
                reports: { label: "Rapporter", desc: "Månadsvis detalj av matutgifter." },
                savings: { label: "Besparing", desc: "Beräkna hur mycket du sparar genom att laga mat hemma." }
            },
            health: {
                "google-fit": { label: "Google Fit", desc: "Synkronisera steg, träning, puls." },
                "apple-health": { label: "Apple Health", desc: "Full integration med Apple Health." },
                steps: { label: "Steg", desc: "Importera steg från telefon eller smartklocka." },
                sync: { label: "Synk", desc: "Data synkroniseras automatiskt i bakgrunden." }
            },
            goals: {
                custom: { label: "Egna mål", desc: "Sätt dina egna dagliga mål." },
                exercises: { label: "Övningar", desc: "Mål för steg, armhävningar, squats, vatten." },
                streak: { label: "Serier", desc: "Bygg vanor med serieräknare." },
                progress: { label: "Ringar", desc: "Vacker ringvisualisering av dagliga framsteg." }
            },
            charts: {
                weight: { label: "Vikt", desc: "Vikttrender över veckor och månader." },
                workouts: { label: "Träning", desc: "Visualisera frekvens och intensitet." },
                body: { label: "Kropp", desc: "Spåra muskelmassa och kroppsfett." },
                export: { label: "Exportera", desc: "Exportera all data till CSV." }
            },
            offline: {
                "offline-mode": { label: "Offline", desc: "Full app utan internetanslutning." },
                "auto-sync": { label: "Autosynk", desc: "Ändringar synkroniseras när online." },
                local: { label: "Lokal", desc: "All data lagras säkert på enheten." },
                anywhere: { label: "Överallt", desc: "Använd på gym, utomhus eller på resa." }
            },
            shop: {
                planning: { label: "Planering", desc: "AI föreslår måltider baserat på preferenser." },
                list: { label: "Smarta listor", desc: "Autolistor organiserade efter butiksavdelning." },
                scanner: { label: "Hyllskanner", desc: "Skanna hyllor för att hitta produkter snabbt." },
                verify: { label: "Verifiering", desc: "Fotografera kundvagn för att bekräfta allt." }
            }
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
            offline: "Najpierw offline", offlineDesc: "Działa bez internetu — synchronizuje automatycznie",
            shop: "Asystent zakupów", shopDesc: "AI planuje posiłki i tworzy inteligentne listy zakupów"
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
            on: "Pobierz w", get: "Dostępne w", use: "Użyj w",
            directDownload: "Bezpośrednie pobieranie", openIn: "Otwórz w",
            tgNote: "* Aplikacja Telegram ma limity treningów dla darmowych użytkowników",
            comingSoon: "Wkrótce"
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
            shop: ["Planowanie posiłków AI na dowolny okres", "Inteligentna generacja listy zakupów", "Skaner półek znajduje produkty", "Weryfikacja produktu przez zdjęcie", "Ocena zdrowotna produktów"],
            gotIt: "Rozumiem!",
            close: "Zamknij"
        },
        tiles: {
            pose: {
                realtime: { label: "Czas rzecz.", desc: "Śledzi 33 punkty ciała przy 30fps z MediaPipe." },
                exercises: { label: "15 ćwiczeń", desc: "Przysiady, pompki, deska, wykroki i więcej." },
                feedback: { label: "Feedback", desc: "Natychmiastowe wizualne i dźwiękowe wskazówki." },
                counting: { label: "Liczenie", desc: "AI automatycznie liczy powtórzenia." }
            },
            kitchen: {
                storage: { label: "Przechow.", desc: "Organizuj produkty w lodówce i zamrażarce." },
                "ai-scan": { label: "Skan AI", desc: "Skieruj aparat — AI rozpozna i doda." },
                expiry: { label: "Ważność", desc: "Powiadomienia przed upływem terminu. Mniej marnotrawstwa." },
                shopping: { label: "Listy", desc: "Automatyczne generowanie list zakupów." }
            },
            cooking: {
                steps: { label: "Kroki", desc: "Jasne instrukcje dla każdego etapu gotowania." },
                timer: { label: "Timery", desc: "Wbudowane timery. Wiele jednocześnie." },
                voice: { label: "Głos", desc: "Gotowanie bez użycia rąk z instrukcjami głosowymi." },
                tips: { label: "Wskazówki", desc: "Porady szefa i zamienniki składników." }
            },
            coach: {
                "voice-guide": { label: "Trener głos.", desc: "Motywacja w czasie rzeczywistym. Męski lub żeński głos." },
                "rep-count": { label: "Licznik", desc: "AI automatycznie liczy powtórzenia." },
                "form-tips": { label: "Korekta", desc: "Natychmiastowa informacja o postawie." },
                history: { label: "Historia", desc: "Śledź wszystkie treningi." }
            },
            scale: {
                camera: { label: "Kamera", desc: "Wystarczy skierować na wyświetlacz wagi." },
                "auto-read": { label: "Auto-odczyt", desc: "AI natychmiast odczytuje wagę." },
                "any-scale": { label: "Każda waga", desc: "Działa z wagami cyfrowymi i analogowymi." },
                trend: { label: "Trendy", desc: "Śledź zmiany wagi za pomocą wykresów." }
            },
            food: {
                calories: { label: "Kalorie", desc: "Zrób zdjęcie, uzyskaj kalorie w sekundach." },
                macros: { label: "Makro", desc: "Podział na białko, węglowodany, tłuszcze." },
                reference: { label: "Odniesienie", desc: "Użyj karty do dokładnej oceny porcji." },
                log: { label: "Dziennik", desc: "Automatycznie prowadź dziennik jedzenia." }
            },
            receipt: {
                scan: { label: "Skaner", desc: "Zrób zdjęcie paragonu. AI wyodrębni wszystko." },
                extract: { label: "Ekstrakcja", desc: "Produkty, ceny, ilości rozpoznane automatycznie." },
                prices: { label: "Ceny", desc: "Śledź zmiany cen w czasie." },
                budget: { label: "Budżet", desc: "Analiza wydatków i porady oszczędnościowe." }
            },
            finance: {
                spending: { label: "Wydatki", desc: "Śledź każdy zakup jedzenia." },
                "cooking-vs-out": { label: "Dom vs miasto", desc: "Porównaj koszty gotowania w domu i restauracji." },
                reports: { label: "Raporty", desc: "Miesięczny szczegół wydatków na jedzenie." },
                savings: { label: "Oszczędność", desc: "Oblicz ile oszczędzasz gotując w domu." }
            },
            health: {
                "google-fit": { label: "Google Fit", desc: "Synchronizuj kroki, treningi, puls." },
                "apple-health": { label: "Apple Health", desc: "Pełna integracja z Apple Health." },
                steps: { label: "Kroki", desc: "Importuj kroki z telefonu lub smartwatcha." },
                sync: { label: "Sync", desc: "Dane synchronizują się automatycznie w tle." }
            },
            goals: {
                custom: { label: "Własne cele", desc: "Ustaw własne dzienne cele." },
                exercises: { label: "Ćwiczenia", desc: "Cele dla kroków, pompek, przysiadów, wody." },
                streak: { label: "Serie", desc: "Buduj nawyki z licznikiem serii." },
                progress: { label: "Pierścienie", desc: "Piękna wizualizacja dziennych postępów." }
            },
            charts: {
                weight: { label: "Waga", desc: "Trendy wagowe w tygodniach i miesiącach." },
                workouts: { label: "Treningi", desc: "Wizualizuj częstotliwość i intensywność." },
                body: { label: "Ciało", desc: "Śledź masę mięśniową i tłuszcz." },
                export: { label: "Eksport", desc: "Eksportuj wszystkie dane do CSV." }
            },
            offline: {
                "offline-mode": { label: "Offline", desc: "Pełna aplikacja bez połączenia z internetem." },
                "auto-sync": { label: "Auto-sync", desc: "Zmiany synchronizują się gdy online." },
                local: { label: "Lokalnie", desc: "Wszystkie dane bezpiecznie na urządzeniu." },
                anywhere: { label: "Wszędzie", desc: "Używaj na siłowni, na zewnątrz lub w podróży." }
            },
            shop: {
                planning: { label: "Planowanie", desc: "AI sugeruje posiłki na podstawie preferencji." },
                list: { label: "Smart listy", desc: "Autolisty zorganizowane według działów sklepu." },
                scanner: { label: "Skaner półek", desc: "Skanuj półki aby szybko znaleźć produkty." },
                verify: { label: "Weryfikacja", desc: "Zrób zdjęcie koszyka by sprawdzić czy masz wszystko." }
            }
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
            offline: "Önce Çevrimdışı", offlineDesc: "İnternetsiz çalışır — otomatik senkronize eder",
            shop: "Alışveriş Asistanı", shopDesc: "AI öğünleri planlar ve akıllı alışveriş listeleri oluşturur"
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
            on: "İndir", get: "Al", use: "Kullan",
            directDownload: "Doğrudan indir", openIn: "Aç",
            tgNote: "* Telegram mini-app ücretsiz kullanıcılar için antrenman sınırları var",
            comingSoon: "Yakında"
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
            shop: ["Herhangi bir dönem için AI öğün planlama", "Akıllı alışveriş listesi oluşturma", "Raf tarayıcı ürünleri bulur", "Fotoğraf ile ürün doğrulama", "Ürünler için sağlık puanı"],
            gotIt: "Anladım!"
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
            offline: "يعمل بدون إنترنت", offlineDesc: "يعمل بدون اتصال — يزامن تلقائياً",
            shop: "مساعد التسوق", shopDesc: "الذكاء الاصطناعي يخطط الوجبات وينشئ قوائم تسوق ذكية"
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
            on: "تحميل من", get: "احصل من", use: "استخدم في",
            directDownload: "تحميل مباشر", openIn: "فتح في",
            tgNote: "* تطبيق تيليجرام المصغر له قيود تمارين للمستخدمين المجانيين",
            comingSoon: "قريباً"
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
            shop: ["تخطيط وجبات بالذكاء الاصطناعي لأي فترة", "إنشاء قائمة تسوق ذكية", "ماسح الرفوف يجد المنتجات", "التحقق من المنتج عبر الصورة", "درجة صحية للمنتجات"],
            gotIt: "فهمت!"
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
            offline: "ჯერ ოფლაინ", offlineDesc: "მუშაობს ინტერნეტის გარეშე — ავტომატურად სინქრონდება",
            shop: "საყიდლების ასისტენტი", shopDesc: "AI გეგმავს კვებას და ქმნის ჭკვიან საყიდლების სიებს"
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
            on: "ჩამოტვირთე", get: "მიიღე", use: "გამოიყენე",
            directDownload: "პირდაპირი ჩამოტვირთვა", openIn: "გახსენი",
            tgNote: "* Telegram მინი-აპს აქვს ვარჯიშის შეზღუდვები უფასო მომხმარებლებისთვის",
            comingSoon: "მალე"
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
            shop: ["AI კვების დაგეგმვა ნებისმიერი პერიოდისთვის", "ჭკვიანი საყიდლების სიის გენერაცია", "თაროს სკანერი პოულობს პროდუქტებს", "პროდუქტის ვერიფიკაცია ფოტოთი", "პროდუქტების ჯანმრთელობის ქულა"],
            gotIt: "გასაგებია!"
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
