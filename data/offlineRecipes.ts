/**
 * Offline Recipe Database
 *
 * Встроенная база рецептов для работы без интернета.
 * Рецепты подобраны для типичных продуктов российской кухни.
 */

import { GeneratedRecipe } from '../services/geminiService';

// Simplified step for offline recipes
export interface OfflineStep {
  order: number;
  instruction: string;
  durationMinutes?: number;
  heatLevel?: 1 | 2 | 3;
  tip?: string;
  technique?: string;
  doneWhen?: string;
  troubleshoot?: { problem: string; solution: string }[];
}

// Simplified ingredient for offline recipes
export interface OfflineIngredient {
  name: string;
  amount: string;
  unit: string;
  emoji: string;
  isOptional?: boolean;
}

export interface OfflineRecipe {
  id: string;
  name: string;
  description: string;
  servings: number;
  totalTimeMinutes: number;
  caloriesPerServing: number;
  proteinPerServing: number;
  carbsPerServing: number;
  fatPerServing: number;
  difficulty: 'easy' | 'medium' | 'hard';
  difficultyReason: string;
  nutritionNote: string;
  equipment: { name: string; emoji: string; essential: boolean }[];
  messyLevel: number;
  messyWarning: string;
  keywords: string[];  // Ключевые слова для поиска по продуктам
  requiredIngredients: string[];  // Обязательные ингредиенты
  optionalIngredients: string[];  // Опциональные ингредиенты
  ingredients: OfflineIngredient[];
  steps: OfflineStep[];
  cookingTips: string[];
  mealTypes: ('breakfast' | 'lunch' | 'dinner' | 'snack')[];
}

// Нормализация названий для поиска
const normalizeIngredient = (name: string): string => {
  return name.toLowerCase()
    .replace(/[ёе]/g, 'е')
    .replace(/\s+/g, ' ')
    .trim();
};

// Синонимы продуктов для лучшего матчинга
const INGREDIENT_SYNONYMS: Record<string, string[]> = {
  'яйцо': ['яйца', 'яичко', 'яички'],
  'курица': ['куриное филе', 'куриная грудка', 'курятина', 'куриное мясо', 'курочка'],
  'молоко': ['молочко'],
  'сыр': ['сырок', 'сыра'],
  'помидор': ['помидоры', 'томат', 'томаты'],
  'огурец': ['огурцы', 'огурчик', 'огурчики'],
  'лук': ['лучок', 'репчатый лук', 'луковица'],
  'чеснок': ['чесночок', 'чеснока'],
  'картофель': ['картошка', 'картофелина', 'картошечка'],
  'морковь': ['морковка', 'морковочка'],
  'капуста': ['капустка'],
  'рис': ['рисовая крупа'],
  'макароны': ['паста', 'спагетти', 'лапша', 'вермишель', 'пенне'],
  'хлеб': ['хлебушек', 'батон', 'булка'],
  'масло': ['масло сливочное', 'сливочное масло'],
  'масло растительное': ['подсолнечное масло', 'оливковое масло'],
  'сметана': ['сметанка'],
  'творог': ['творожок'],
  'мука': ['мучка'],
  'сахар': ['сахарок', 'сахарный песок'],
  'соль': ['соли'],
  'перец': ['перчик', 'черный перец'],
  'говядина': ['говяжье мясо', 'говяжий фарш'],
  'свинина': ['свиное мясо', 'свиной фарш'],
  'фарш': ['мясной фарш'],
  'рыба': ['рыбка', 'филе рыбы'],
  'банан': ['бананы', 'бананчик'],
  'яблоко': ['яблоки', 'яблочко'],
  'апельсин': ['апельсины'],
  'кефир': ['кефирчик'],
  'йогурт': ['йогуртик'],
  'овсянка': ['овсяные хлопья', 'геркулес'],
  'гречка': ['гречневая крупа', 'гречиха'],
};

// Проверка совпадения ингредиента
export const matchesIngredient = (userIngredient: string, recipeIngredient: string): boolean => {
  const userNorm = normalizeIngredient(userIngredient);
  const recipeNorm = normalizeIngredient(recipeIngredient);

  // Прямое совпадение
  if (userNorm.includes(recipeNorm) || recipeNorm.includes(userNorm)) {
    return true;
  }

  // Проверка синонимов
  for (const [main, synonyms] of Object.entries(INGREDIENT_SYNONYMS)) {
    const allForms = [main, ...synonyms].map(normalizeIngredient);
    const userMatches = allForms.some(form => userNorm.includes(form) || form.includes(userNorm));
    const recipeMatches = allForms.some(form => recipeNorm.includes(form) || form.includes(userNorm));
    if (userMatches && recipeMatches) {
      return true;
    }
  }

  return false;
};

export const OFFLINE_RECIPES: OfflineRecipe[] = [
  // ============ ЗАВТРАКИ ============
  {
    id: 'scrambled-eggs',
    name: '🍳 Яичница-болтунья',
    description: 'Нежная яичница с молоком — классика быстрого завтрака',
    servings: 2,
    totalTimeMinutes: 10,
    caloriesPerServing: 180,
    proteinPerServing: 13,
    carbsPerServing: 2,
    fatPerServing: 14,
    difficulty: 'easy',
    difficultyReason: 'Очень просто',
    nutritionNote: 'Богато белком — отличное начало дня',
    equipment: [
      { name: 'Сковорода', emoji: '🍳', essential: true },
      { name: 'Венчик', emoji: '🥄', essential: false }
    ],
    messyLevel: 1,
    messyWarning: '',
    keywords: ['яйцо', 'молоко', 'масло'],
    requiredIngredients: ['яйцо'],
    optionalIngredients: ['молоко', 'масло', 'соль', 'перец'],
    ingredients: [
      { name: 'Яйца', amount: '4', unit: 'шт', emoji: '🥚' },
      { name: 'Молоко', amount: '50', unit: 'мл', emoji: '🥛', isOptional: true },
      { name: 'Масло сливочное', amount: '20', unit: 'г', emoji: '🧈' },
      { name: 'Соль', amount: '', unit: 'по вкусу', emoji: '🧂' }
    ],
    steps: [
      {
        order: 1,
        instruction: 'Разбейте яйца в миску, добавьте молоко и щепотку соли',
        durationMinutes: 1,
        tip: '💡 Молоко делает яичницу нежнее',
        heatLevel: 1
      },
      {
        order: 2,
        instruction: 'Взбейте вилкой или венчиком до однородности',
        durationMinutes: 1,
        tip: '💡 Не переусердствуйте — достаточно 20-30 секунд',
        heatLevel: 1
      },
      {
        order: 3,
        instruction: 'Растопите масло на сковороде на среднем огне',
        durationMinutes: 1,
        heatLevel: 2,
        doneWhen: 'Масло растаяло и слегка шипит'
      },
      {
        order: 4,
        instruction: 'Вылейте яичную смесь и помешивайте лопаткой',
        durationMinutes: 3,
        heatLevel: 2,
        tip: '💡 Помешивайте от краёв к центру',
        doneWhen: 'Яйца загустели, но ещё слегка влажные',
        troubleshoot: [{ problem: 'Яйца сохнут', solution: 'Убавьте огонь' }]
      }
    ],
    cookingTips: ['Снимайте с огня чуть раньше — яйца дойдут от остаточного тепла'],
    mealTypes: ['breakfast']
  },
  {
    id: 'oatmeal-banana',
    name: '🥣 Овсянка с бананом',
    description: 'Сытный и полезный завтрак за 5 минут',
    servings: 1,
    totalTimeMinutes: 7,
    caloriesPerServing: 320,
    proteinPerServing: 8,
    carbsPerServing: 58,
    fatPerServing: 7,
    difficulty: 'easy',
    difficultyReason: 'Элементарно',
    nutritionNote: 'Медленные углеводы — энергия на всё утро',
    equipment: [
      { name: 'Кастрюля', emoji: '🍲', essential: true }
    ],
    messyLevel: 1,
    messyWarning: '',
    keywords: ['овсянка', 'банан', 'молоко', 'мёд', 'геркулес'],
    requiredIngredients: ['овсянка', 'банан'],
    optionalIngredients: ['молоко', 'мёд', 'орехи', 'ягоды'],
    ingredients: [
      { name: 'Овсяные хлопья', amount: '50', unit: 'г', emoji: '🌾' },
      { name: 'Молоко', amount: '200', unit: 'мл', emoji: '🥛' },
      { name: 'Банан', amount: '1', unit: 'шт', emoji: '🍌' },
      { name: 'Мёд', amount: '1', unit: 'ч.л.', emoji: '🍯', isOptional: true }
    ],
    steps: [
      {
        order: 1,
        instruction: 'Вскипятите молоко в кастрюле',
        durationMinutes: 2,
        heatLevel: 3,
        tip: '💡 Следите, чтобы не убежало!'
      },
      {
        order: 2,
        instruction: 'Всыпьте овсянку, убавьте огонь и варите помешивая',
        durationMinutes: 3,
        heatLevel: 1,
        doneWhen: 'Каша загустела'
      },
      {
        order: 3,
        instruction: 'Нарежьте банан кружочками и выложите сверху',
        durationMinutes: 1,
        heatLevel: 1,
        tip: '💡 Добавьте мёд или орехи для вкуса'
      }
    ],
    cookingTips: ['Для кремовой текстуры варите на минуту дольше'],
    mealTypes: ['breakfast']
  },
  {
    id: 'cheese-sandwich',
    name: '🧀 Горячий бутерброд с сыром',
    description: 'Хрустящий тост с плавленым сыром',
    servings: 2,
    totalTimeMinutes: 8,
    caloriesPerServing: 280,
    proteinPerServing: 12,
    carbsPerServing: 25,
    fatPerServing: 15,
    difficulty: 'easy',
    difficultyReason: 'Проще некуда',
    nutritionNote: 'Быстрый перекус с белком и углеводами',
    equipment: [
      { name: 'Сковорода', emoji: '🍳', essential: true }
    ],
    messyLevel: 1,
    messyWarning: '',
    keywords: ['хлеб', 'сыр', 'масло'],
    requiredIngredients: ['хлеб', 'сыр'],
    optionalIngredients: ['масло', 'помидор', 'ветчина'],
    ingredients: [
      { name: 'Хлеб', amount: '4', unit: 'ломтика', emoji: '🍞' },
      { name: 'Сыр', amount: '100', unit: 'г', emoji: '🧀' },
      { name: 'Масло сливочное', amount: '20', unit: 'г', emoji: '🧈' }
    ],
    steps: [
      {
        order: 1,
        instruction: 'Нарежьте сыр тонкими ломтиками',
        durationMinutes: 1,
        heatLevel: 1
      },
      {
        order: 2,
        instruction: 'Смажьте хлеб маслом с одной стороны',
        durationMinutes: 1,
        heatLevel: 1,
        tip: '💡 Масло должно быть мягким'
      },
      {
        order: 3,
        instruction: 'Положите на сковороду маслом вниз, сверху сыр',
        durationMinutes: 2,
        heatLevel: 2,
        doneWhen: 'Низ подрумянился'
      },
      {
        order: 4,
        instruction: 'Накройте вторым ломтиком (маслом вверх), переверните',
        durationMinutes: 2,
        heatLevel: 2,
        doneWhen: 'Обе стороны золотистые, сыр тянется'
      }
    ],
    cookingTips: ['Накройте крышкой на минуту — сыр расплавится лучше'],
    mealTypes: ['breakfast', 'snack']
  },
  {
    id: 'cottage-cheese-honey',
    name: '🍯 Творог с мёдом и бананом',
    description: 'Белковый завтрак без готовки',
    servings: 1,
    totalTimeMinutes: 3,
    caloriesPerServing: 280,
    proteinPerServing: 18,
    carbsPerServing: 35,
    fatPerServing: 8,
    difficulty: 'easy',
    difficultyReason: 'Без готовки',
    nutritionNote: 'Много белка для мышц',
    equipment: [],
    messyLevel: 1,
    messyWarning: '',
    keywords: ['творог', 'мёд', 'банан', 'орехи', 'ягоды'],
    requiredIngredients: ['творог'],
    optionalIngredients: ['мёд', 'банан', 'орехи', 'ягоды', 'сметана'],
    ingredients: [
      { name: 'Творог', amount: '150', unit: 'г', emoji: '🧀' },
      { name: 'Мёд', amount: '1', unit: 'ст.л.', emoji: '🍯' },
      { name: 'Банан', amount: '1', unit: 'шт', emoji: '🍌', isOptional: true }
    ],
    steps: [
      {
        order: 1,
        instruction: 'Выложите творог в тарелку',
        durationMinutes: 1,
        heatLevel: 1
      },
      {
        order: 2,
        instruction: 'Нарежьте банан, полейте мёдом',
        durationMinutes: 2,
        heatLevel: 1,
        tip: '💡 Добавьте орехи для хруста'
      }
    ],
    cookingTips: ['Взбейте творог блендером для кремовой текстуры'],
    mealTypes: ['breakfast', 'snack']
  },

  // ============ ОБЕДЫ ============
  {
    id: 'chicken-rice',
    name: '🍗 Курица с рисом',
    description: 'Классическое сочетание белка и углеводов',
    servings: 2,
    totalTimeMinutes: 35,
    caloriesPerServing: 420,
    proteinPerServing: 35,
    carbsPerServing: 45,
    fatPerServing: 10,
    difficulty: 'easy',
    difficultyReason: 'Просто',
    nutritionNote: 'Идеально сбалансированный обед',
    equipment: [
      { name: 'Сковорода', emoji: '🍳', essential: true },
      { name: 'Кастрюля', emoji: '🍲', essential: true }
    ],
    messyLevel: 2,
    messyWarning: 'Возможны брызги масла',
    keywords: ['курица', 'рис', 'лук', 'морковь', 'масло'],
    requiredIngredients: ['курица', 'рис'],
    optionalIngredients: ['лук', 'морковь', 'чеснок', 'соль', 'перец', 'масло'],
    ingredients: [
      { name: 'Куриное филе', amount: '400', unit: 'г', emoji: '🍗' },
      { name: 'Рис', amount: '200', unit: 'г', emoji: '🍚' },
      { name: 'Лук', amount: '1', unit: 'шт', emoji: '🧅' },
      { name: 'Морковь', amount: '1', unit: 'шт', emoji: '🥕', isOptional: true },
      { name: 'Масло растительное', amount: '2', unit: 'ст.л.', emoji: '🫒' }
    ],
    steps: [
      {
        order: 1,
        instruction: 'Промойте рис и поставьте вариться (1:2 с водой)',
        durationMinutes: 5,
        heatLevel: 3,
        tip: '💡 Сначала закипятите воду, потом всыпьте рис'
      },
      {
        order: 2,
        instruction: 'Нарежьте курицу кубиками 2-3 см',
        durationMinutes: 5,
        heatLevel: 1,
        technique: 'Режьте поперёк волокон — будет нежнее'
      },
      {
        order: 3,
        instruction: 'Обжарьте курицу на сильном огне до золотистой корочки',
        durationMinutes: 8,
        heatLevel: 3,
        doneWhen: 'Курица белая внутри, золотистая снаружи',
        tip: '💡 Не перемешивайте слишком часто!'
      },
      {
        order: 4,
        instruction: 'Добавьте нарезанный лук и морковь, обжарьте',
        durationMinutes: 5,
        heatLevel: 2,
        doneWhen: 'Овощи мягкие'
      },
      {
        order: 5,
        instruction: 'Подавайте курицу с готовым рисом',
        durationMinutes: 2,
        heatLevel: 1
      }
    ],
    cookingTips: ['Дайте курице отдохнуть 2 минуты перед подачей — сок распределится'],
    mealTypes: ['lunch', 'dinner']
  },
  {
    id: 'pasta-tomato',
    name: '🍝 Паста с томатным соусом',
    description: 'Итальянская классика за 20 минут',
    servings: 2,
    totalTimeMinutes: 20,
    caloriesPerServing: 380,
    proteinPerServing: 12,
    carbsPerServing: 65,
    fatPerServing: 8,
    difficulty: 'easy',
    difficultyReason: 'Легко',
    nutritionNote: 'Углеводы для энергии',
    equipment: [
      { name: 'Кастрюля', emoji: '🍲', essential: true },
      { name: 'Сковорода', emoji: '🍳', essential: true }
    ],
    messyLevel: 2,
    messyWarning: 'Соус может брызгать',
    keywords: ['макароны', 'паста', 'помидор', 'томат', 'чеснок', 'лук', 'сыр'],
    requiredIngredients: ['макароны', 'помидор'],
    optionalIngredients: ['чеснок', 'лук', 'сыр', 'базилик', 'масло'],
    ingredients: [
      { name: 'Макароны', amount: '250', unit: 'г', emoji: '🍝' },
      { name: 'Помидоры', amount: '400', unit: 'г', emoji: '🍅' },
      { name: 'Чеснок', amount: '2', unit: 'зубчика', emoji: '🧄' },
      { name: 'Масло оливковое', amount: '2', unit: 'ст.л.', emoji: '🫒' },
      { name: 'Сыр', amount: '50', unit: 'г', emoji: '🧀', isOptional: true }
    ],
    steps: [
      {
        order: 1,
        instruction: 'Вскипятите воду с солью, добавьте макароны',
        durationMinutes: 2,
        heatLevel: 3,
        tip: '💡 Воды должно быть много — 1 литр на 100г пасты'
      },
      {
        order: 2,
        instruction: 'Варите макароны согласно инструкции минус 1 минута',
        durationMinutes: 8,
        heatLevel: 2,
        doneWhen: 'Паста al dente — слегка твёрдая внутри'
      },
      {
        order: 3,
        instruction: 'Обжарьте мелко нарезанный чеснок в масле',
        durationMinutes: 1,
        heatLevel: 2,
        tip: '💡 Не пережарьте — чеснок горчит!',
        troubleshoot: [{ problem: 'Чеснок потемнел', solution: 'Начните заново' }]
      },
      {
        order: 4,
        instruction: 'Добавьте нарезанные помидоры, тушите',
        durationMinutes: 7,
        heatLevel: 2,
        doneWhen: 'Помидоры превратились в соус'
      },
      {
        order: 5,
        instruction: 'Смешайте пасту с соусом, посыпьте сыром',
        durationMinutes: 2,
        heatLevel: 1
      }
    ],
    cookingTips: ['Сохраните стакан воды от пасты — добавьте в соус если густой'],
    mealTypes: ['lunch', 'dinner']
  },
  {
    id: 'buckwheat-cutlets',
    name: '🥩 Котлеты с гречкой',
    description: 'Сытный домашний обед',
    servings: 4,
    totalTimeMinutes: 45,
    caloriesPerServing: 450,
    proteinPerServing: 28,
    carbsPerServing: 35,
    fatPerServing: 22,
    difficulty: 'medium',
    difficultyReason: 'Нужно формовать',
    nutritionNote: 'Много белка и медленных углеводов',
    equipment: [
      { name: 'Сковорода', emoji: '🍳', essential: true },
      { name: 'Кастрюля', emoji: '🍲', essential: true }
    ],
    messyLevel: 3,
    messyWarning: 'Формовка фарша — руки испачкаются, масло брызгает',
    keywords: ['фарш', 'гречка', 'лук', 'яйцо', 'хлеб'],
    requiredIngredients: ['фарш', 'гречка'],
    optionalIngredients: ['лук', 'яйцо', 'хлеб', 'чеснок', 'соль', 'перец'],
    ingredients: [
      { name: 'Фарш', amount: '500', unit: 'г', emoji: '🥩' },
      { name: 'Гречка', amount: '200', unit: 'г', emoji: '🌾' },
      { name: 'Лук', amount: '1', unit: 'шт', emoji: '🧅' },
      { name: 'Яйцо', amount: '1', unit: 'шт', emoji: '🥚' },
      { name: 'Хлеб', amount: '2', unit: 'ломтика', emoji: '🍞', isOptional: true }
    ],
    steps: [
      {
        order: 1,
        instruction: 'Поставьте гречку вариться (1:2 с водой)',
        durationMinutes: 5,
        heatLevel: 3
      },
      {
        order: 2,
        instruction: 'Мелко нарежьте лук, замочите хлеб в молоке',
        durationMinutes: 5,
        heatLevel: 1
      },
      {
        order: 3,
        instruction: 'Смешайте фарш, лук, яйцо, отжатый хлеб, соль, перец',
        durationMinutes: 5,
        heatLevel: 1,
        tip: '💡 Вымешивайте руками 2-3 минуты — котлеты будут сочнее'
      },
      {
        order: 4,
        instruction: 'Сформируйте котлеты мокрыми руками',
        durationMinutes: 5,
        heatLevel: 1,
        technique: 'Слепите шарик, слегка приплюсните'
      },
      {
        order: 5,
        instruction: 'Обжарьте котлеты на среднем огне по 5-7 минут с каждой стороны',
        durationMinutes: 15,
        heatLevel: 2,
        doneWhen: 'Золотистая корочка, сок прозрачный',
        troubleshoot: [{ problem: 'Горят', solution: 'Убавьте огонь и накройте крышкой' }]
      }
    ],
    cookingTips: ['Не давите на котлеты лопаткой — вытечет сок'],
    mealTypes: ['lunch', 'dinner']
  },
  {
    id: 'vegetable-soup',
    name: '🥣 Овощной суп',
    description: 'Лёгкий и полезный суп',
    servings: 4,
    totalTimeMinutes: 40,
    caloriesPerServing: 120,
    proteinPerServing: 4,
    carbsPerServing: 20,
    fatPerServing: 3,
    difficulty: 'easy',
    difficultyReason: 'Просто нарезать',
    nutritionNote: 'Низкокалорийный, много витаминов',
    equipment: [
      { name: 'Кастрюля', emoji: '🍲', essential: true }
    ],
    messyLevel: 1,
    messyWarning: '',
    keywords: ['картофель', 'морковь', 'лук', 'капуста', 'помидор'],
    requiredIngredients: ['картофель', 'морковь'],
    optionalIngredients: ['лук', 'капуста', 'помидор', 'зелень', 'соль'],
    ingredients: [
      { name: 'Картофель', amount: '3', unit: 'шт', emoji: '🥔' },
      { name: 'Морковь', amount: '2', unit: 'шт', emoji: '🥕' },
      { name: 'Лук', amount: '1', unit: 'шт', emoji: '🧅' },
      { name: 'Капуста', amount: '200', unit: 'г', emoji: '🥬', isOptional: true }
    ],
    steps: [
      {
        order: 1,
        instruction: 'Вскипятите 2 литра воды',
        durationMinutes: 5,
        heatLevel: 3
      },
      {
        order: 2,
        instruction: 'Нарежьте картофель кубиками, добавьте в кипяток',
        durationMinutes: 5,
        heatLevel: 2
      },
      {
        order: 3,
        instruction: 'Нарежьте морковь и лук, добавьте через 10 минут',
        durationMinutes: 15,
        heatLevel: 2
      },
      {
        order: 4,
        instruction: 'Добавьте капусту, варите до готовности овощей',
        durationMinutes: 10,
        heatLevel: 2,
        doneWhen: 'Картофель легко протыкается вилкой'
      }
    ],
    cookingTips: ['Добавьте зелень в конце — сохранит аромат'],
    mealTypes: ['lunch', 'dinner']
  },
  {
    id: 'fried-potatoes',
    name: '🥔 Жареная картошка',
    description: 'Классика с хрустящей корочкой',
    servings: 3,
    totalTimeMinutes: 30,
    caloriesPerServing: 280,
    proteinPerServing: 4,
    carbsPerServing: 35,
    fatPerServing: 14,
    difficulty: 'easy',
    difficultyReason: 'Нужно следить',
    nutritionNote: 'Углеводы и жиры — сытно надолго',
    equipment: [
      { name: 'Сковорода', emoji: '🍳', essential: true }
    ],
    messyLevel: 2,
    messyWarning: 'Масло брызгает',
    keywords: ['картофель', 'картошка', 'лук', 'масло'],
    requiredIngredients: ['картофель'],
    optionalIngredients: ['лук', 'чеснок', 'укроп', 'масло'],
    ingredients: [
      { name: 'Картофель', amount: '700', unit: 'г', emoji: '🥔' },
      { name: 'Масло растительное', amount: '4', unit: 'ст.л.', emoji: '🫒' },
      { name: 'Лук', amount: '1', unit: 'шт', emoji: '🧅', isOptional: true }
    ],
    steps: [
      {
        order: 1,
        instruction: 'Очистите картофель и нарежьте соломкой',
        durationMinutes: 10,
        heatLevel: 1,
        tip: '💡 Промойте от крахмала — будет хрустящей'
      },
      {
        order: 2,
        instruction: 'Раскалите масло на сковороде',
        durationMinutes: 2,
        heatLevel: 3,
        doneWhen: 'Масло слегка дымится'
      },
      {
        order: 3,
        instruction: 'Выложите картофель одним слоем, не мешайте 5 минут',
        durationMinutes: 5,
        heatLevel: 3,
        tip: '💡 Не перемешивайте сразу — не будет корочки!',
        technique: 'Терпение — ключ к хрусту'
      },
      {
        order: 4,
        instruction: 'Аккуратно переверните, жарьте ещё 10-15 минут',
        durationMinutes: 12,
        heatLevel: 2,
        doneWhen: 'Золотистая корочка, мягкая внутри'
      }
    ],
    cookingTips: ['Солите в конце — соль вытягивает влагу'],
    mealTypes: ['lunch', 'dinner']
  },

  // ============ УЖИНЫ ============
  {
    id: 'omelet-vegetables',
    name: '🥚 Омлет с овощами',
    description: 'Лёгкий ужин с белком',
    servings: 2,
    totalTimeMinutes: 15,
    caloriesPerServing: 220,
    proteinPerServing: 14,
    carbsPerServing: 5,
    fatPerServing: 16,
    difficulty: 'easy',
    difficultyReason: 'Легко',
    nutritionNote: 'Белок и овощи — идеально на ужин',
    equipment: [
      { name: 'Сковорода', emoji: '🍳', essential: true }
    ],
    messyLevel: 1,
    messyWarning: '',
    keywords: ['яйцо', 'помидор', 'перец', 'сыр', 'молоко'],
    requiredIngredients: ['яйцо'],
    optionalIngredients: ['помидор', 'перец', 'сыр', 'молоко', 'зелень'],
    ingredients: [
      { name: 'Яйца', amount: '4', unit: 'шт', emoji: '🥚' },
      { name: 'Помидор', amount: '1', unit: 'шт', emoji: '🍅', isOptional: true },
      { name: 'Перец болгарский', amount: '0.5', unit: 'шт', emoji: '🫑', isOptional: true },
      { name: 'Сыр', amount: '50', unit: 'г', emoji: '🧀', isOptional: true }
    ],
    steps: [
      {
        order: 1,
        instruction: 'Нарежьте овощи кубиками',
        durationMinutes: 3,
        heatLevel: 1
      },
      {
        order: 2,
        instruction: 'Обжарьте овощи 2-3 минуты',
        durationMinutes: 3,
        heatLevel: 2
      },
      {
        order: 3,
        instruction: 'Взбейте яйца с молоком, вылейте на овощи',
        durationMinutes: 1,
        heatLevel: 2
      },
      {
        order: 4,
        instruction: 'Накройте крышкой, готовьте на слабом огне',
        durationMinutes: 5,
        heatLevel: 1,
        doneWhen: 'Верх схватился, но ещё влажный',
        tip: '💡 Посыпьте сыром за минуту до готовности'
      }
    ],
    cookingTips: ['Не пересушите — омлет должен быть нежным'],
    mealTypes: ['dinner', 'breakfast']
  },
  {
    id: 'salad-cucumber-tomato',
    name: '🥗 Салат из свежих овощей',
    description: 'Лёгкий салат за 5 минут',
    servings: 2,
    totalTimeMinutes: 5,
    caloriesPerServing: 80,
    proteinPerServing: 2,
    carbsPerServing: 8,
    fatPerServing: 5,
    difficulty: 'easy',
    difficultyReason: 'Только нарезать',
    nutritionNote: 'Витамины и клетчатка',
    equipment: [],
    messyLevel: 1,
    messyWarning: '',
    keywords: ['огурец', 'помидор', 'лук', 'масло', 'зелень'],
    requiredIngredients: ['огурец', 'помидор'],
    optionalIngredients: ['лук', 'масло', 'зелень', 'сметана'],
    ingredients: [
      { name: 'Огурцы', amount: '2', unit: 'шт', emoji: '🥒' },
      { name: 'Помидоры', amount: '2', unit: 'шт', emoji: '🍅' },
      { name: 'Лук красный', amount: '0.5', unit: 'шт', emoji: '🧅', isOptional: true },
      { name: 'Масло оливковое', amount: '1', unit: 'ст.л.', emoji: '🫒' }
    ],
    steps: [
      {
        order: 1,
        instruction: 'Нарежьте овощи кусочками',
        durationMinutes: 3,
        heatLevel: 1
      },
      {
        order: 2,
        instruction: 'Смешайте, заправьте маслом, посолите',
        durationMinutes: 2,
        heatLevel: 1,
        tip: '💡 Не заправляйте заранее — помидоры пустят сок'
      }
    ],
    cookingTips: ['Добавьте укроп или базилик для аромата'],
    mealTypes: ['lunch', 'dinner', 'snack']
  },

  // ============ ПЕРЕКУСЫ ============
  {
    id: 'banana-smoothie',
    name: '🍌 Банановый смузи',
    description: 'Освежающий напиток за 2 минуты',
    servings: 1,
    totalTimeMinutes: 3,
    caloriesPerServing: 200,
    proteinPerServing: 6,
    carbsPerServing: 35,
    fatPerServing: 4,
    difficulty: 'easy',
    difficultyReason: 'Просто взбить',
    nutritionNote: 'Быстрые углеводы для энергии',
    equipment: [
      { name: 'Блендер', emoji: '🔧', essential: true }
    ],
    messyLevel: 2,
    messyWarning: 'Может разбрызгаться если крышка плохо закрыта',
    keywords: ['банан', 'молоко', 'йогурт', 'мёд'],
    requiredIngredients: ['банан'],
    optionalIngredients: ['молоко', 'йогурт', 'мёд', 'ягоды'],
    ingredients: [
      { name: 'Банан', amount: '1', unit: 'шт', emoji: '🍌' },
      { name: 'Молоко', amount: '200', unit: 'мл', emoji: '🥛' },
      { name: 'Мёд', amount: '1', unit: 'ч.л.', emoji: '🍯', isOptional: true }
    ],
    steps: [
      {
        order: 1,
        instruction: 'Нарежьте банан кусочками',
        durationMinutes: 1,
        heatLevel: 1
      },
      {
        order: 2,
        instruction: 'Поместите в блендер с молоком и мёдом',
        durationMinutes: 1,
        heatLevel: 1
      },
      {
        order: 3,
        instruction: 'Взбивайте 30-60 секунд',
        durationMinutes: 1,
        heatLevel: 1,
        doneWhen: 'Однородная консистенция',
        tip: '💡 Замороженный банан = холодный смузи'
      }
    ],
    cookingTips: ['Добавьте овсянку для сытности'],
    mealTypes: ['breakfast', 'snack']
  },
  {
    id: 'apple-cinnamon',
    name: '🍎 Печёное яблоко с корицей',
    description: 'Полезный десерт',
    servings: 2,
    totalTimeMinutes: 25,
    caloriesPerServing: 120,
    proteinPerServing: 1,
    carbsPerServing: 28,
    fatPerServing: 2,
    difficulty: 'easy',
    difficultyReason: 'Просто запечь',
    nutritionNote: 'Натуральный сахар, много клетчатки',
    equipment: [
      { name: 'Духовка', emoji: '🔥', essential: true }
    ],
    messyLevel: 1,
    messyWarning: '',
    keywords: ['яблоко', 'корица', 'мёд', 'орехи'],
    requiredIngredients: ['яблоко'],
    optionalIngredients: ['корица', 'мёд', 'орехи', 'изюм'],
    ingredients: [
      { name: 'Яблоки', amount: '2', unit: 'шт', emoji: '🍎' },
      { name: 'Корица', amount: '0.5', unit: 'ч.л.', emoji: '🫚', isOptional: true },
      { name: 'Мёд', amount: '2', unit: 'ч.л.', emoji: '🍯', isOptional: true }
    ],
    steps: [
      {
        order: 1,
        instruction: 'Разогрейте духовку до 180°C',
        durationMinutes: 5,
        heatLevel: 1
      },
      {
        order: 2,
        instruction: 'Удалите сердцевину яблок, не протыкая дно',
        durationMinutes: 3,
        heatLevel: 1,
        tip: '💡 Используйте чайную ложку'
      },
      {
        order: 3,
        instruction: 'Посыпьте корицей, добавьте мёд',
        durationMinutes: 2,
        heatLevel: 1
      },
      {
        order: 4,
        instruction: 'Запекайте 15-20 минут',
        durationMinutes: 18,
        heatLevel: 1,
        doneWhen: 'Яблоко мягкое, слегка сморщилось'
      }
    ],
    cookingTips: ['Подавайте с шариком мороженого'],
    mealTypes: ['snack', 'dinner']
  },
  {
    id: 'quick-sandwich',
    name: '🥪 Бутерброд с яйцом и огурцом',
    description: 'Сытный перекус за 5 минут',
    servings: 1,
    totalTimeMinutes: 10,
    caloriesPerServing: 250,
    proteinPerServing: 12,
    carbsPerServing: 25,
    fatPerServing: 12,
    difficulty: 'easy',
    difficultyReason: 'Элементарно',
    nutritionNote: 'Белок + углеводы для перекуса',
    equipment: [
      { name: 'Кастрюля', emoji: '🍲', essential: true }
    ],
    messyLevel: 1,
    messyWarning: '',
    keywords: ['хлеб', 'яйцо', 'огурец', 'масло', 'майонез'],
    requiredIngredients: ['хлеб', 'яйцо'],
    optionalIngredients: ['огурец', 'масло', 'майонез', 'зелень'],
    ingredients: [
      { name: 'Хлеб', amount: '2', unit: 'ломтика', emoji: '🍞' },
      { name: 'Яйцо', amount: '1', unit: 'шт', emoji: '🥚' },
      { name: 'Огурец', amount: '0.5', unit: 'шт', emoji: '🥒', isOptional: true },
      { name: 'Масло сливочное', amount: '10', unit: 'г', emoji: '🧈' }
    ],
    steps: [
      {
        order: 1,
        instruction: 'Отварите яйцо вкрутую (10 минут в кипятке)',
        durationMinutes: 10,
        heatLevel: 2
      },
      {
        order: 2,
        instruction: 'Очистите и нарежьте яйцо кружочками',
        durationMinutes: 2,
        heatLevel: 1
      },
      {
        order: 3,
        instruction: 'Намажьте хлеб маслом, выложите яйцо и огурец',
        durationMinutes: 2,
        heatLevel: 1
      }
    ],
    cookingTips: ['Яйцо-пашот вместо варёного — ещё вкуснее'],
    mealTypes: ['breakfast', 'snack']
  },

  // ============ ДОПОЛНИТЕЛЬНЫЕ РЕЦЕПТЫ ============
  {
    id: 'porridge-milk',
    name: '🥛 Молочная каша',
    description: 'Тёплый завтрак для всей семьи',
    servings: 2,
    totalTimeMinutes: 15,
    caloriesPerServing: 220,
    proteinPerServing: 8,
    carbsPerServing: 35,
    fatPerServing: 6,
    difficulty: 'easy',
    difficultyReason: 'Следить чтоб не убежало',
    nutritionNote: 'Кальций из молока, медленные углеводы',
    equipment: [
      { name: 'Кастрюля', emoji: '🍲', essential: true }
    ],
    messyLevel: 2,
    messyWarning: 'Молоко может убежать',
    keywords: ['молоко', 'рис', 'манка', 'пшено', 'сахар'],
    requiredIngredients: ['молоко'],
    optionalIngredients: ['рис', 'манка', 'пшено', 'сахар', 'масло'],
    ingredients: [
      { name: 'Молоко', amount: '500', unit: 'мл', emoji: '🥛' },
      { name: 'Рис (или манка)', amount: '80', unit: 'г', emoji: '🍚' },
      { name: 'Сахар', amount: '1', unit: 'ст.л.', emoji: '🍬', isOptional: true },
      { name: 'Масло сливочное', amount: '20', unit: 'г', emoji: '🧈' }
    ],
    steps: [
      {
        order: 1,
        instruction: 'Доведите молоко до кипения на среднем огне',
        durationMinutes: 5,
        heatLevel: 2,
        tip: '💡 Не отходите — молоко убегает мгновенно!'
      },
      {
        order: 2,
        instruction: 'Тонкой струйкой всыпьте крупу, помешивая',
        durationMinutes: 1,
        heatLevel: 2,
        tip: '💡 Постоянно мешайте чтобы не было комков'
      },
      {
        order: 3,
        instruction: 'Варите на слабом огне до загустения',
        durationMinutes: 8,
        heatLevel: 1,
        doneWhen: 'Каша густая, не стекает с ложки быстро'
      },
      {
        order: 4,
        instruction: 'Добавьте сахар и масло, перемешайте',
        durationMinutes: 1,
        heatLevel: 1
      }
    ],
    cookingTips: ['Дайте постоять под крышкой 5 минут — будет нежнее'],
    mealTypes: ['breakfast']
  },
  {
    id: 'tuna-salad',
    name: '🐟 Салат с тунцом',
    description: 'Белковый салат за 5 минут',
    servings: 2,
    totalTimeMinutes: 7,
    caloriesPerServing: 180,
    proteinPerServing: 20,
    carbsPerServing: 5,
    fatPerServing: 9,
    difficulty: 'easy',
    difficultyReason: 'Только смешать',
    nutritionNote: 'Много белка, мало углеводов',
    equipment: [],
    messyLevel: 1,
    messyWarning: '',
    keywords: ['тунец', 'огурец', 'яйцо', 'майонез', 'лук'],
    requiredIngredients: ['тунец'],
    optionalIngredients: ['огурец', 'яйцо', 'майонез', 'лук', 'кукуруза'],
    ingredients: [
      { name: 'Тунец консервированный', amount: '1', unit: 'банка', emoji: '🐟' },
      { name: 'Огурец', amount: '1', unit: 'шт', emoji: '🥒', isOptional: true },
      { name: 'Яйцо варёное', amount: '2', unit: 'шт', emoji: '🥚', isOptional: true },
      { name: 'Майонез', amount: '2', unit: 'ст.л.', emoji: '🥫', isOptional: true }
    ],
    steps: [
      {
        order: 1,
        instruction: 'Слейте жидкость из банки с тунцом, разомните вилкой',
        durationMinutes: 2,
        heatLevel: 1
      },
      {
        order: 2,
        instruction: 'Нарежьте огурец и яйца кубиками',
        durationMinutes: 3,
        heatLevel: 1
      },
      {
        order: 3,
        instruction: 'Смешайте всё, заправьте майонезом',
        durationMinutes: 2,
        heatLevel: 1,
        tip: '💡 Йогурт вместо майонеза — более здоровая версия'
      }
    ],
    cookingTips: ['Добавьте каперсы или маринованные огурцы для пикантности'],
    mealTypes: ['lunch', 'dinner', 'snack']
  },
  {
    id: 'fried-eggs-tomato',
    name: '🍳 Шакшука (яйца в томатах)',
    description: 'Израильское блюдо с насыщенным вкусом',
    servings: 2,
    totalTimeMinutes: 20,
    caloriesPerServing: 250,
    proteinPerServing: 14,
    carbsPerServing: 12,
    fatPerServing: 16,
    difficulty: 'easy',
    difficultyReason: 'Несложно',
    nutritionNote: 'Белок и антиоксиданты из томатов',
    equipment: [
      { name: 'Сковорода', emoji: '🍳', essential: true }
    ],
    messyLevel: 2,
    messyWarning: 'Томатный соус может брызгать',
    keywords: ['яйцо', 'помидор', 'перец', 'лук', 'чеснок'],
    requiredIngredients: ['яйцо', 'помидор'],
    optionalIngredients: ['перец', 'лук', 'чеснок', 'специи'],
    ingredients: [
      { name: 'Яйца', amount: '4', unit: 'шт', emoji: '🥚' },
      { name: 'Помидоры', amount: '400', unit: 'г', emoji: '🍅' },
      { name: 'Перец болгарский', amount: '1', unit: 'шт', emoji: '🫑', isOptional: true },
      { name: 'Лук', amount: '1', unit: 'шт', emoji: '🧅' },
      { name: 'Чеснок', amount: '2', unit: 'зубчика', emoji: '🧄' }
    ],
    steps: [
      {
        order: 1,
        instruction: 'Обжарьте нарезанный лук и перец до мягкости',
        durationMinutes: 5,
        heatLevel: 2
      },
      {
        order: 2,
        instruction: 'Добавьте чеснок, обжарьте минуту',
        durationMinutes: 1,
        heatLevel: 2
      },
      {
        order: 3,
        instruction: 'Добавьте нарезанные помидоры, тушите 7-10 минут',
        durationMinutes: 8,
        heatLevel: 2,
        doneWhen: 'Помидоры превратились в соус'
      },
      {
        order: 4,
        instruction: 'Сделайте углубления, разбейте яйца',
        durationMinutes: 1,
        heatLevel: 2,
        tip: '💡 Не разбивайте желтки!'
      },
      {
        order: 5,
        instruction: 'Накройте крышкой, готовьте до желаемой степени',
        durationMinutes: 5,
        heatLevel: 1,
        doneWhen: 'Белок схватился, желток ещё мягкий'
      }
    ],
    cookingTips: ['Подавайте со свежим хлебом для макания'],
    mealTypes: ['breakfast', 'lunch', 'dinner']
  },
  {
    id: 'cheese-pancakes',
    name: '🥞 Сырники',
    description: 'Любимые творожные оладьи',
    servings: 4,
    totalTimeMinutes: 25,
    caloriesPerServing: 220,
    proteinPerServing: 12,
    carbsPerServing: 20,
    fatPerServing: 10,
    difficulty: 'medium',
    difficultyReason: 'Нужно формовать',
    nutritionNote: 'Много белка из творога',
    equipment: [
      { name: 'Сковорода', emoji: '🍳', essential: true }
    ],
    messyLevel: 2,
    messyWarning: 'Тесто липкое',
    keywords: ['творог', 'яйцо', 'мука', 'сахар', 'сметана'],
    requiredIngredients: ['творог', 'яйцо', 'мука'],
    optionalIngredients: ['сахар', 'ванилин', 'сметана', 'изюм'],
    ingredients: [
      { name: 'Творог', amount: '400', unit: 'г', emoji: '🧀' },
      { name: 'Яйцо', amount: '1', unit: 'шт', emoji: '🥚' },
      { name: 'Мука', amount: '3', unit: 'ст.л.', emoji: '🌾' },
      { name: 'Сахар', amount: '2', unit: 'ст.л.', emoji: '🍬' }
    ],
    steps: [
      {
        order: 1,
        instruction: 'Смешайте творог, яйцо, сахар и муку',
        durationMinutes: 5,
        heatLevel: 1,
        tip: '💡 Творог должен быть сухим — отожмите если влажный'
      },
      {
        order: 2,
        instruction: 'Сформируйте сырники руками в муке',
        durationMinutes: 7,
        heatLevel: 1,
        technique: 'Скатайте шарик, приплюсните до 1.5 см толщины'
      },
      {
        order: 3,
        instruction: 'Обжарьте на среднем огне по 3-4 минуты с каждой стороны',
        durationMinutes: 10,
        heatLevel: 2,
        doneWhen: 'Золотистая корочка',
        troubleshoot: [{ problem: 'Разваливаются', solution: 'Добавьте ещё муки' }]
      }
    ],
    cookingTips: ['Подавайте со сметаной, мёдом или вареньем'],
    mealTypes: ['breakfast', 'snack']
  },
  {
    id: 'caesar-salad',
    name: '🥗 Салат Цезарь',
    description: 'Популярный салат с курицей',
    servings: 2,
    totalTimeMinutes: 25,
    caloriesPerServing: 380,
    proteinPerServing: 28,
    carbsPerServing: 15,
    fatPerServing: 24,
    difficulty: 'easy',
    difficultyReason: 'Много нарезки',
    nutritionNote: 'Сбалансированный салат с белком',
    equipment: [
      { name: 'Сковорода', emoji: '🍳', essential: true }
    ],
    messyLevel: 1,
    messyWarning: '',
    keywords: ['курица', 'салат', 'сыр', 'хлеб', 'помидор'],
    requiredIngredients: ['курица', 'салат'],
    optionalIngredients: ['сыр', 'хлеб', 'помидор', 'соус'],
    ingredients: [
      { name: 'Куриное филе', amount: '300', unit: 'г', emoji: '🍗' },
      { name: 'Салат романо (или айсберг)', amount: '200', unit: 'г', emoji: '🥬' },
      { name: 'Сыр пармезан', amount: '50', unit: 'г', emoji: '🧀' },
      { name: 'Хлеб (для сухариков)', amount: '2', unit: 'ломтика', emoji: '🍞' },
      { name: 'Помидоры черри', amount: '100', unit: 'г', emoji: '🍅', isOptional: true }
    ],
    steps: [
      {
        order: 1,
        instruction: 'Нарежьте курицу полосками, обжарьте до готовности',
        durationMinutes: 10,
        heatLevel: 3,
        doneWhen: 'Курица белая внутри'
      },
      {
        order: 2,
        instruction: 'Нарежьте хлеб кубиками, подсушите на сковороде',
        durationMinutes: 5,
        heatLevel: 2,
        doneWhen: 'Сухарики хрустящие'
      },
      {
        order: 3,
        instruction: 'Порвите салат руками, выложите в миску',
        durationMinutes: 3,
        heatLevel: 1
      },
      {
        order: 4,
        instruction: 'Добавьте курицу, помидоры, сухарики, посыпьте сыром',
        durationMinutes: 3,
        heatLevel: 1
      }
    ],
    cookingTips: ['Заправьте оливковым маслом с лимонным соком'],
    mealTypes: ['lunch', 'dinner']
  },
  {
    id: 'mashed-potatoes',
    name: '🥔 Картофельное пюре',
    description: 'Нежный гарнир ко всему',
    servings: 4,
    totalTimeMinutes: 30,
    caloriesPerServing: 180,
    proteinPerServing: 4,
    carbsPerServing: 28,
    fatPerServing: 6,
    difficulty: 'easy',
    difficultyReason: 'Просто',
    nutritionNote: 'Углеводы для энергии',
    equipment: [
      { name: 'Кастрюля', emoji: '🍲', essential: true },
      { name: 'Толкушка', emoji: '🥄', essential: true }
    ],
    messyLevel: 1,
    messyWarning: '',
    keywords: ['картофель', 'молоко', 'масло'],
    requiredIngredients: ['картофель'],
    optionalIngredients: ['молоко', 'масло', 'соль'],
    ingredients: [
      { name: 'Картофель', amount: '800', unit: 'г', emoji: '🥔' },
      { name: 'Молоко', amount: '150', unit: 'мл', emoji: '🥛' },
      { name: 'Масло сливочное', amount: '50', unit: 'г', emoji: '🧈' }
    ],
    steps: [
      {
        order: 1,
        instruction: 'Очистите картофель, нарежьте крупными кусками',
        durationMinutes: 10,
        heatLevel: 1
      },
      {
        order: 2,
        instruction: 'Отварите в подсоленной воде до готовности',
        durationMinutes: 20,
        heatLevel: 2,
        doneWhen: 'Картофель легко протыкается вилкой'
      },
      {
        order: 3,
        instruction: 'Слейте воду, добавьте горячее молоко и масло',
        durationMinutes: 2,
        heatLevel: 1,
        tip: '💡 Молоко должно быть горячим!'
      },
      {
        order: 4,
        instruction: 'Разомните толкушкой до однородности',
        durationMinutes: 3,
        heatLevel: 1,
        tip: '💡 Не используйте блендер — пюре станет клейким'
      }
    ],
    cookingTips: ['Добавьте чеснок или зелёный лук для вкуса'],
    mealTypes: ['lunch', 'dinner']
  }
];

/**
 * Найти рецепты по имеющимся продуктам
 */
export function findMatchingRecipes(
  userIngredients: string[],
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack',
  maxMissing: number = 2
): { recipe: OfflineRecipe; matchCount: number; missingCount: number; matched: string[]; missing: string[] }[] {
  const results: { recipe: OfflineRecipe; matchCount: number; missingCount: number; matched: string[]; missing: string[] }[] = [];

  for (const recipe of OFFLINE_RECIPES) {
    // Фильтр по типу приёма пищи
    if (mealType && !recipe.mealTypes.includes(mealType)) {
      continue;
    }

    const matched: string[] = [];
    const missing: string[] = [];

    // Проверяем обязательные ингредиенты
    for (const required of recipe.requiredIngredients) {
      const found = userIngredients.some(ui => matchesIngredient(ui, required));
      if (found) {
        matched.push(required);
      } else {
        missing.push(required);
      }
    }

    // Проверяем опциональные
    for (const optional of recipe.optionalIngredients) {
      if (userIngredients.some(ui => matchesIngredient(ui, optional))) {
        matched.push(optional);
      }
    }

    // Пропускаем если слишком много недостающих
    if (missing.length > maxMissing) {
      continue;
    }

    results.push({
      recipe,
      matchCount: matched.length,
      missingCount: missing.length,
      matched,
      missing
    });
  }

  // Сортируем по количеству совпадений (больше = лучше) и недостающих (меньше = лучше)
  return results.sort((a, b) => {
    if (a.missingCount !== b.missingCount) {
      return a.missingCount - b.missingCount;
    }
    return b.matchCount - a.matchCount;
  });
}

/**
 * Конвертировать оффлайн рецепт в формат GeneratedRecipe
 */
export function convertToGeneratedRecipe(offline: OfflineRecipe, userIngredients?: string[]): GeneratedRecipe {
  return {
    name: offline.name,
    description: offline.description,
    servings: offline.servings,
    totalTimeMinutes: offline.totalTimeMinutes,
    caloriesPerServing: offline.caloriesPerServing,
    proteinPerServing: offline.proteinPerServing,
    carbsPerServing: offline.carbsPerServing,
    fatPerServing: offline.fatPerServing,
    difficulty: offline.difficulty,
    difficultyReason: offline.difficultyReason,
    nutritionNote: offline.nutritionNote,
    equipment: offline.equipment,
    messyLevel: (offline.messyLevel || 1) as 1 | 2 | 3,
    messyWarning: offline.messyWarning,
    ingredients: offline.ingredients.map(ing => ({
      name: ing.name,
      emoji: ing.emoji,
      quantity: parseFloat(ing.amount) || 1,
      unit: ing.unit,
      isAvailable: userIngredients
        ? userIngredients.some(ui => matchesIngredient(ui, ing.name))
        : true
    })),
    steps: offline.steps.map(step => ({
      order: step.order,
      instruction: step.instruction,
      timerSeconds: step.durationMinutes ? step.durationMinutes * 60 : undefined,
      heatLevel: step.heatLevel,
      tip: step.tip,
      technique: step.technique,
      doneWhen: step.doneWhen,
      reminders: [],
      troubleshoot: step.troubleshoot || []
    }))
  };
}

/**
 * Получить случайные рецепты для вдохновения
 */
export function getRandomRecipes(
  count: number = 3,
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack'
): OfflineRecipe[] {
  let pool = OFFLINE_RECIPES;

  if (mealType) {
    pool = pool.filter(r => r.mealTypes.includes(mealType));
  }

  // Перемешиваем и берём первые N
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
