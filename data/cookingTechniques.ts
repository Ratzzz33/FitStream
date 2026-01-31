/**
 * Cooking Techniques Database
 *
 * База кулинарных техник с YouTube видео для визуальных инструкций.
 * Каждая техника имеет видео на русском и английском языках.
 */

export interface CookingTechnique {
  id: string;
  name: {
    ru: string;
    en: string;
  };
  keywords: string[];  // Ключевые слова для матчинга с инструкциями
  video: {
    ru?: {
      id: string;        // YouTube video ID
      timestamp?: number; // Start time in seconds
      title: string;     // Название для UI
    };
    en?: {
      id: string;
      timestamp?: number;
      title: string;
    };
  };
  thumbnail?: string;  // Custom thumbnail URL (optional, defaults to YouTube)
}

/**
 * Получить YouTube thumbnail URL
 */
export const getYouTubeThumbnail = (videoId: string, quality: 'default' | 'medium' | 'high' | 'maxres' = 'high'): string => {
  const qualityMap = {
    default: 'default',
    medium: 'mqdefault',
    high: 'hqdefault',
    maxres: 'maxresdefault'
  };
  return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}.jpg`;
};

/**
 * Получить YouTube embed URL с timestamp
 */
export const getYouTubeEmbedUrl = (videoId: string, timestamp?: number): string => {
  const base = `https://www.youtube.com/embed/${videoId}`;
  return timestamp ? `${base}?start=${timestamp}` : base;
};

/**
 * Получить YouTube watch URL с timestamp
 */
export const getYouTubeWatchUrl = (videoId: string, timestamp?: number): string => {
  const base = `https://www.youtube.com/watch?v=${videoId}`;
  return timestamp ? `${base}&t=${timestamp}` : base;
};

export type VideoLanguage = 'ru' | 'en';

export interface VideoInfo {
  id: string;
  timestamp?: number;
  title: string;
  language: VideoLanguage;
  isFallback: boolean; // true если показываем видео на другом языке
}

/**
 * Получить видео для техники с fallback на другой язык
 * Если видео на запрошенном языке нет (пустой id), вернёт видео на другом языке
 */
export const getVideoForTechnique = (
  technique: CookingTechnique,
  preferredLanguage: VideoLanguage = 'ru'
): VideoInfo | null => {
  const primary = technique.video[preferredLanguage];
  const fallbackLang: VideoLanguage = preferredLanguage === 'ru' ? 'en' : 'ru';
  const fallback = technique.video[fallbackLang];

  // Если есть видео на предпочитаемом языке
  if (primary?.id) {
    return {
      id: primary.id,
      timestamp: primary.timestamp,
      title: primary.title,
      language: preferredLanguage,
      isFallback: false
    };
  }

  // Fallback на другой язык
  if (fallback?.id) {
    return {
      id: fallback.id,
      timestamp: fallback.timestamp,
      title: fallback.title,
      language: fallbackLang,
      isFallback: true
    };
  }

  return null;
};

/**
 * Получить URL видео для техники с fallback
 */
export const getVideoUrlForTechnique = (
  technique: CookingTechnique,
  preferredLanguage: VideoLanguage = 'ru',
  urlType: 'embed' | 'watch' = 'watch'
): { url: string; info: VideoInfo } | null => {
  const videoInfo = getVideoForTechnique(technique, preferredLanguage);
  if (!videoInfo) return null;

  const url = urlType === 'embed'
    ? getYouTubeEmbedUrl(videoInfo.id, videoInfo.timestamp)
    : getYouTubeWatchUrl(videoInfo.id, videoInfo.timestamp);

  return { url, info: videoInfo };
};

// ============================================
// БАЗА КУЛИНАРНЫХ ТЕХНИК
// ============================================

export const COOKING_TECHNIQUES: CookingTechnique[] = [
  // --- НАРЕЗКА ---
  {
    id: 'dice-onion',
    name: {
      ru: 'Нарезать лук кубиками',
      en: 'Dice an onion'
    },
    keywords: ['нарежьте лук', 'нарезанный лук', 'мелко нарежьте лук', 'лук кубиками'],
    video: {
      ru: {
        id: '-qChQhM-u5g', // Бабушка Эмма - 4 способа нарезки лука
        title: '4 способа нарезки лука - Бабушка Эмма'
      },
      en: {
        id: 'dCGS067s0zo', // Gordon Ramsay
        timestamp: 15,
        title: 'How to dice an onion - Gordon Ramsay'
      }
    }
  },
  {
    id: 'slice-onion',
    name: {
      ru: 'Нарезать лук полукольцами',
      en: 'Slice an onion'
    },
    keywords: ['лук полукольцами', 'лук кольцами', 'тонко нарезать лук'],
    video: {
      ru: {
        id: '-qChQhM-u5g', // Бабушка Эмма - 4 способа нарезки лука
        timestamp: 60,
        title: '4 способа нарезки лука - Бабушка Эмма'
      },
      en: {
        id: 'K4HoDNMCvKA',
        title: 'How to slice an onion'
      }
    }
  },
  {
    id: 'mince-garlic',
    name: {
      ru: 'Измельчить чеснок',
      en: 'Mince garlic'
    },
    keywords: ['измельчите чеснок', 'чеснок мелко', 'нарезанный чеснок', 'раздавить чеснок'],
    video: {
      ru: {
        id: 'OqOL2bYhhVw', // Илья Лазерсон - Как почистить и нарезать чеснок
        title: 'Как почистить и нарезать чеснок - Илья Лазерсон'
      },
      en: {
        id: '1y5h1pDHhzs', // Gordon Ramsay
        title: 'How to mince garlic - Gordon Ramsay'
      }
    }
  },
  {
    id: 'dice-vegetables',
    name: {
      ru: 'Нарезать овощи кубиками',
      en: 'Dice vegetables'
    },
    keywords: ['нарежьте овощи', 'овощи кубиками', 'нарежьте морковь', 'нарежьте картофель'],
    video: {
      ru: {
        id: 'AjpwZS2zMBY', // Бабушка Эмма - Морковь по-корейски (нарезка моркови)
        timestamp: 60,
        title: 'Как нарезать морковь соломкой - Бабушка Эмма'
      },
      en: {
        id: 'JMA2SqaDgG8',
        title: 'Basic knife skills - dicing vegetables'
      }
    }
  },
  {
    id: 'julienne-vegetables',
    name: {
      ru: 'Нарезать соломкой',
      en: 'Julienne vegetables'
    },
    keywords: ['соломкой', 'тонкой соломкой', 'картофель соломкой'],
    video: {
      ru: {
        id: 'q4JIPOsdxOo', // Бабушка Эмма - Способы нарезки картофеля
        title: 'Способы нарезки картофеля - Бабушка Эмма'
      },
      en: {
        id: 'Slqrc5QGkLQ',
        title: 'How to julienne vegetables'
      }
    }
  },
  {
    id: 'slice-banana',
    name: {
      ru: 'Нарезать банан',
      en: 'Slice a banana'
    },
    keywords: ['нарежьте банан', 'банан кружочками', 'банан кусочками'],
    video: {
      ru: {
        id: '',
        title: 'Как нарезать банан'
      },
      en: {
        id: 'wBU9N35ZHIw',
        title: 'How to slice a banana'
      }
    }
  },

  // --- ВАРКА ---
  {
    id: 'boil-water',
    name: {
      ru: 'Вскипятить воду',
      en: 'Boil water'
    },
    keywords: ['вскипятите воду', 'доведите до кипения', 'кипящую воду'],
    video: {
      ru: {
        id: '',
        title: 'Как правильно вскипятить воду'
      },
      en: {
        id: 'yqLjBqbLqUY',
        title: 'How to boil water properly'
      }
    }
  },
  {
    id: 'cook-rice',
    name: {
      ru: 'Сварить рис',
      en: 'Cook rice'
    },
    keywords: ['рис вариться', 'сварите рис', 'отварите рис', 'рис 1:2'],
    video: {
      ru: {
        id: 'fPqh-AaDQLU', // Бабушка Эмма - Рассыпчатый рис
        title: 'Рассыпчатый рис - Бабушка Эмма'
      },
      en: {
        id: 'Jf75I9LKhvg', // Joshua Weissman
        title: 'How to cook perfect rice every time'
      }
    }
  },
  {
    id: 'cook-buckwheat',
    name: {
      ru: 'Сварить гречку',
      en: 'Cook buckwheat'
    },
    keywords: ['гречку вариться', 'сварите гречку', 'гречка 1:2'],
    video: {
      ru: {
        id: 'VmUHNV4zaow', // Бабушка Эмма - Гречневая каша с грибами
        title: 'Гречневая каша с грибами - Бабушка Эмма'
      },
      en: {
        id: 'Dy_L3AXTnz0',
        title: 'How to cook buckwheat'
      }
    }
  },
  {
    id: 'cook-pasta',
    name: {
      ru: 'Сварить макароны',
      en: 'Cook pasta'
    },
    keywords: ['варите макароны', 'сварите пасту', 'макароны al dente'],
    video: {
      ru: {
        id: 'rV7cS06B_Hc', // Бабушка Эмма - Макароны с сырным соусом
        title: 'Макароны с сырным соусом - Бабушка Эмма'
      },
      en: {
        id: 'GuniejPrMtE', // Gordon Ramsay
        title: 'How to cook perfect pasta - Gordon Ramsay'
      }
    }
  },
  {
    id: 'cook-quinoa',
    name: {
      ru: 'Сварить киноа',
      en: 'Cook quinoa'
    },
    keywords: ['сварите киноа', 'варите киноа', 'киноа в воде'],
    video: {
      ru: {
        id: '',
        title: 'Как правильно сварить киноа'
      },
      en: {
        id: 'ljGjTxnwfzc',
        title: 'How to cook quinoa perfectly'
      }
    }
  },
  {
    id: 'boil-potatoes',
    name: {
      ru: 'Отварить картофель',
      en: 'Boil potatoes'
    },
    keywords: ['отварите картофель', 'варите картофель', 'картофель до готовности'],
    video: {
      ru: {
        id: 'Tv9dU7hUuq4', // Бабушка Эмма - Вареники с картошкой (показывает варку картофеля)
        timestamp: 60,
        title: 'Как отварить картофель - Бабушка Эмма'
      },
      en: {
        id: 'k6UV_EWxDgk',
        title: 'How to boil potatoes perfectly'
      }
    }
  },
  {
    id: 'boil-eggs',
    name: {
      ru: 'Сварить яйца вкрутую',
      en: 'Boil eggs'
    },
    keywords: ['отварите яйцо', 'яйцо вкрутую', 'сварите яйца'],
    video: {
      ru: {
        id: 'kzMB5kNJkmI', // Бабушка Эмма - Варка яиц
        title: 'Как сварить яйца - Бабушка Эмма'
      },
      en: {
        id: 'GPFYnlpKako',
        title: 'Perfect hard boiled eggs every time'
      }
    }
  },
  {
    id: 'steam-broccoli',
    name: {
      ru: 'Приготовить брокколи на пару',
      en: 'Steam broccoli'
    },
    keywords: ['брокколи на пару', 'отварите брокколи', 'брокколи соцветия'],
    video: {
      ru: {
        id: '',
        title: 'Как приготовить брокколи на пару'
      },
      en: {
        id: 'n1iSEkFqWNA',
        title: 'How to steam broccoli perfectly'
      }
    }
  },

  // --- ЖАРКА ---
  {
    id: 'saute-onion',
    name: {
      ru: 'Обжарить лук',
      en: 'Sauté onion'
    },
    keywords: ['обжарьте лук', 'пассеруйте лук', 'лук до мягкости', 'лук до золотистости'],
    video: {
      ru: {
        id: 'GdMUhaE0-gk', // Бабушка Эмма - Плов (показывает обжарку лука)
        timestamp: 180,
        title: 'Как обжарить лук для плова - Бабушка Эмма'
      },
      en: {
        id: 'Vv-WqK-j-Tk',
        title: 'How to sauté onions - caramelized vs softened'
      }
    }
  },
  {
    id: 'pan-fry-chicken',
    name: {
      ru: 'Обжарить курицу',
      en: 'Pan-fry chicken'
    },
    keywords: ['обжарьте курицу', 'курицу до золотистой', 'курица на сковороде'],
    video: {
      ru: {
        id: 'UJ8AESLx8G4', // Бабушка Эмма - Курица в казане
        title: 'Курица тушёная в казане - Бабушка Эмма'
      },
      en: {
        id: 'lPAwT7lJ5Aw', // Gordon Ramsay
        title: 'How to pan-fry chicken - Gordon Ramsay'
      }
    }
  },
  {
    id: 'pan-fry-tofu',
    name: {
      ru: 'Обжарить тофу',
      en: 'Pan-fry tofu'
    },
    keywords: ['обжарьте тофу', 'тофу до золотистости', 'тофу на сковороде'],
    video: {
      ru: {
        id: '',
        title: 'Как обжарить тофу до хрустящей корочки'
      },
      en: {
        id: 'hJ9xQp77Jhk',
        title: 'How to cook crispy tofu'
      }
    }
  },
  {
    id: 'stir-fry',
    name: {
      ru: 'Стир-фрай (быстрая обжарка)',
      en: 'Stir-fry'
    },
    keywords: ['стир-фрай', 'обжарьте на сильном огне', 'в воке', 'быстро помешивая'],
    video: {
      ru: {
        id: '',
        title: 'Техника стир-фрай'
      },
      en: {
        id: 'WujehK7kYLU', // Chinese Cooking Demystified
        title: 'Stir-frying basics'
      }
    }
  },
  {
    id: 'fry-cutlets',
    name: {
      ru: 'Жарить котлеты',
      en: 'Pan-fry cutlets/patties'
    },
    keywords: ['обжарьте котлеты', 'жарьте котлеты', 'котлеты на сковороде'],
    video: {
      ru: {
        id: 'SoFJQ6CVSCE', // Бабушка Эмма - Котлеты из говядины
        title: 'Котлеты из говядины - Бабушка Эмма'
      },
      en: {
        id: 'nfY0lrdrQnc',
        title: 'How to pan-fry patties perfectly'
      }
    }
  },
  {
    id: 'deep-fry-potatoes',
    name: {
      ru: 'Жарить картофель фри',
      en: 'Deep-fry potatoes'
    },
    keywords: ['раскалите масло', 'картофель одним слоем', 'жарьте картофель'],
    video: {
      ru: {
        id: 'us0Zfmpi-RU', // Бабушка Эмма - Картофель фри
        title: 'Жареный картофель фри - Бабушка Эмма'
      },
      en: {
        id: 'm6kcANnAJSo', // Kenji
        title: 'The best homemade french fries'
      }
    }
  },
  {
    id: 'fry-syrniki',
    name: {
      ru: 'Жарить сырники',
      en: 'Fry syrniki (cheese pancakes)'
    },
    keywords: ['обжарьте сырники', 'сырники на сковороде'],
    video: {
      ru: {
        id: '2jMtK3wd8sg', // Бабушка Эмма - Сырники
        title: 'Самые вкусные сырники - Бабушка Эмма'
      },
      en: {
        id: 'QdI-ZGWH8Lg',
        title: 'Russian syrniki recipe'
      }
    }
  },

  // --- ВЗБИВАНИЕ И СМЕШИВАНИЕ ---
  {
    id: 'beat-eggs',
    name: {
      ru: 'Взбить яйца',
      en: 'Beat eggs'
    },
    keywords: ['взбейте яйца', 'взбейте вилкой', 'яичную смесь'],
    video: {
      ru: {
        id: 'XcTlcM9x0yQ', // Бабушка Эмма - Французский омлет
        timestamp: 30,
        title: 'Как взбить яйца для омлета - Бабушка Эмма'
      },
      en: {
        id: 'PUP7U5vTMM0', // Gordon Ramsay
        title: 'How to make perfect scrambled eggs - Gordon Ramsay'
      }
    }
  },
  {
    id: 'make-dressing',
    name: {
      ru: 'Приготовить заправку',
      en: 'Make salad dressing'
    },
    keywords: ['приготовьте заправку', 'смешайте масло', 'заправьте салат'],
    video: {
      ru: {
        id: 'DnzqsZaIPPc', // Бабушка Эмма - Соус Винегрет с мёдом
        title: 'Соус Винегрет - заправка для салата - Бабушка Эмма'
      },
      en: {
        id: 'Bn2aOMWZjvU',
        title: 'Basic vinaigrette recipe'
      }
    }
  },
  {
    id: 'blend-smoothie',
    name: {
      ru: 'Взбить смузи в блендере',
      en: 'Blend a smoothie'
    },
    keywords: ['поместите в блендер', 'взбивайте', 'смузи'],
    video: {
      ru: {
        id: 'P9yqJaKgchw', // Завтрак Обед и Ужин - Смузи
        title: 'Смузи фруктово-ягодный - Завтрак Обед и Ужин'
      },
      en: {
        id: 'ExTOhzKHE4Q',
        title: 'How to make the perfect smoothie'
      }
    }
  },
  {
    id: 'make-mashed-potatoes',
    name: {
      ru: 'Сделать пюре из картофеля',
      en: 'Make mashed potatoes'
    },
    keywords: ['разомните толкушкой', 'пюре до однородности', 'добавьте молоко'],
    video: {
      ru: {
        id: 'jc7n_KSC7yg', // Бабушка Эмма - Картофельное пюре
        title: 'Картофельное пюре - Бабушка Эмма'
      },
      en: {
        id: 'HvJB9qkNKj4', // Joshua Weissman
        title: 'The best mashed potatoes'
      }
    }
  },
  {
    id: 'rice-cauliflower',
    name: {
      ru: 'Сделать рис из цветной капусты',
      en: 'Rice cauliflower'
    },
    keywords: ['капусту в "рис"', 'измельчите в блендере до размера риса', 'капустный "рис"'],
    video: {
      ru: {
        id: '',
        title: 'Как сделать рис из цветной капусты'
      },
      en: {
        id: 'Az88l5zQsSw',
        title: 'How to make cauliflower rice'
      }
    }
  },

  // --- ПОДГОТОВКА ---
  {
    id: 'press-tofu',
    name: {
      ru: 'Прессовать тофу',
      en: 'Press tofu'
    },
    keywords: ['прессуйте тофу', 'отжать тофу', 'тофу прессованный'],
    video: {
      ru: {
        id: '',
        title: 'Как правильно прессовать тофу'
      },
      en: {
        id: 'xr5YvYuB1TQ',
        title: 'How to press tofu - 3 methods'
      }
    }
  },
  {
    id: 'soak-bread',
    name: {
      ru: 'Замочить хлеб в молоке',
      en: 'Soak bread in milk'
    },
    keywords: ['замочите хлеб', 'хлеб в молоке', 'отжатый хлеб'],
    video: {
      ru: {
        id: 'oz59Lz8Hwdc', // Бабушка Эмма - Пожарские котлеты (показывает замачивание хлеба)
        timestamp: 45,
        title: 'Как замочить хлеб для котлет - Бабушка Эмма'
      },
      en: {
        id: 'boNoSTWNRlI',
        title: 'Why soak bread in milk for meatballs'
      }
    }
  },
  {
    id: 'peel-potatoes',
    name: {
      ru: 'Очистить картофель',
      en: 'Peel potatoes'
    },
    keywords: ['очистите картофель', 'почистите картофель'],
    video: {
      ru: {
        id: '',
        title: 'Как быстро почистить картофель'
      },
      en: {
        id: 'XO3mTTgkx0A',
        title: 'Fastest way to peel potatoes'
      }
    }
  },
  {
    id: 'core-apple',
    name: {
      ru: 'Удалить сердцевину яблока',
      en: 'Core an apple'
    },
    keywords: ['удалите сердцевину', 'вырежьте сердцевину'],
    video: {
      ru: {
        id: '',
        title: 'Как удалить сердцевину яблока'
      },
      en: {
        id: 'DLDuNQ-L0Wk',
        title: 'How to core an apple'
      }
    }
  },

  // --- ВЫПЕЧКА ---
  {
    id: 'preheat-oven',
    name: {
      ru: 'Разогреть духовку',
      en: 'Preheat oven'
    },
    keywords: ['разогрейте духовку', 'духовку до 180', 'духовку до 200'],
    video: {
      ru: {
        id: '',
        title: 'Зачем и как разогревать духовку'
      },
      en: {
        id: 'xr38kHkKH7Q',
        title: 'Why you should preheat your oven'
      }
    }
  },
  {
    id: 'bake-apple',
    name: {
      ru: 'Запечь яблоко',
      en: 'Bake an apple'
    },
    keywords: ['запекайте', 'запечённые яблоки'],
    video: {
      ru: {
        id: 'FaWKSHXZylo', // Бабушка Эмма - Яблоки запечённые с мёдом
        title: 'Запечённые яблоки с мёдом - Бабушка Эмма'
      },
      en: {
        id: 'qLZJM3uDsTE',
        title: 'Easy baked apples recipe'
      }
    }
  },

  // --- СОУСЫ ---
  {
    id: 'make-tomato-sauce',
    name: {
      ru: 'Приготовить томатный соус',
      en: 'Make tomato sauce'
    },
    keywords: ['томатный соус', 'тушите помидоры', 'помидоры соус'],
    video: {
      ru: {
        id: 'AZdKajgcVEk', // Бабушка Эмма - Итальянский томатный соус
        title: 'Итальянский томатный соус - Бабушка Эмма'
      },
      en: {
        id: 'byZEiLGkOd8', // Basics with Babish
        title: 'How to make tomato sauce from scratch'
      }
    }
  },
  {
    id: 'make-peanut-sauce',
    name: {
      ru: 'Приготовить арахисовый соус',
      en: 'Make peanut sauce'
    },
    keywords: ['арахисовый соус', 'арахисовую пасту', 'соус сатай'],
    video: {
      ru: {
        id: '',
        title: 'Арахисовый соус для азиатских блюд'
      },
      en: {
        id: 'OhVBZwXuQ-Y',
        title: 'Easy peanut sauce recipe'
      }
    }
  },

  // --- ФОРМИРОВАНИЕ ---
  {
    id: 'shape-syrniki',
    name: {
      ru: 'Сформировать сырники',
      en: 'Shape syrniki'
    },
    keywords: ['сформируйте сырники', 'сырники руками в муке'],
    video: {
      ru: {
        id: '2jMtK3wd8sg', // Бабушка Эмма - Сырники
        timestamp: 90,
        title: 'Как лепить сырники - Бабушка Эмма'
      },
      en: {
        id: 'QdI-ZGWH8Lg',
        timestamp: 120,
        title: 'How to shape syrniki'
      }
    }
  },

  // --- ДОПОЛНИТЕЛЬНЫЕ ТЕХНИКИ ---
  {
    id: 'make-pancakes',
    name: {
      ru: 'Жарить блинчики',
      en: 'Make pancakes/crepes'
    },
    keywords: ['блинчики', 'блины', 'тесто для блинов', 'жарьте блины'],
    video: {
      ru: {
        id: 'cdDttPFGamI', // Бабушка Эмма - Блинчики
        title: 'Блинчики - Бабушка Эмма'
      },
      en: {
        id: 'lGLZPMOQqKg',
        title: 'Perfect crepes recipe'
      }
    }
  },
  {
    id: 'make-omelet',
    name: {
      ru: 'Приготовить омлет',
      en: 'Make an omelet'
    },
    keywords: ['омлет', 'взбейте яйца с молоком', 'накройте крышкой'],
    video: {
      ru: {
        id: 'aSqXM4_MMTc', // Бабушка Эмма - Омлет с грибами
        title: 'Омлет с шампиньонами - Бабушка Эмма'
      },
      en: {
        id: 's10etP1p2bU', // Gordon Ramsay
        title: 'How to make the perfect omelette - Gordon Ramsay'
      }
    }
  },
  {
    id: 'make-caesar-salad',
    name: {
      ru: 'Приготовить салат Цезарь',
      en: 'Make Caesar salad'
    },
    keywords: ['салат цезарь', 'порвите салат', 'сухарики', 'пармезан'],
    video: {
      ru: {
        id: 'pKP9pU2qAnw', // Бабушка Эмма - Салат Цезарь
        title: 'Салат Цезарь - Бабушка Эмма'
      },
      en: {
        id: 'a6MZ0VHWqaw',
        title: 'Classic Caesar salad recipe'
      }
    }
  },
  {
    id: 'shape-cutlets',
    name: {
      ru: 'Сформировать котлеты',
      en: 'Shape cutlets/patties'
    },
    keywords: ['сформируйте котлеты', 'мокрыми руками', 'лепить котлеты'],
    video: {
      ru: {
        id: 'SoFJQ6CVSCE', // Бабушка Эмма - Котлеты
        timestamp: 120,
        title: 'Как лепить котлеты - Бабушка Эмма'
      },
      en: {
        id: 'QYZhV-V3XDM',
        title: 'How to shape perfect patties'
      }
    }
  }
];

/**
 * Найти подходящую технику для инструкции
 */
export function findTechniqueForInstruction(instruction: string): CookingTechnique | undefined {
  const normalizedInstruction = instruction.toLowerCase();

  return COOKING_TECHNIQUES.find(technique =>
    technique.keywords.some(keyword => normalizedInstruction.includes(keyword.toLowerCase()))
  );
}

/**
 * Получить все техники для списка инструкций
 */
export function findTechniquesForSteps(instructions: string[]): Map<number, CookingTechnique> {
  const result = new Map<number, CookingTechnique>();

  instructions.forEach((instruction, index) => {
    const technique = findTechniqueForInstruction(instruction);
    if (technique) {
      result.set(index, technique);
    }
  });

  return result;
}
