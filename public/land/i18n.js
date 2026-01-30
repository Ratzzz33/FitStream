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
            offline: "Offline First", offlineDesc: "Works without internet — syncs when back online"
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
            offline: "Работает офлайн", offlineDesc: "Без интернета — синхронизация автоматически"
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
