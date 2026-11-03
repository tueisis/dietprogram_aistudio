import {
  MealCategory,
  NValuesMap,
  PricesMap,
  TemplatesMap,
  ConstraintsMap,
  PlanMap,
  EatenMap,
  PorzioniMap,
} from './types';

export const MEAL_CATEGORIES: MealCategory[] = ['Colazione', 'Pranzo', 'Cena', 'Merenda'];

export const NUTRIENTS = ['kcal', 'proteine', 'carboidrati', 'grassi'] as const;

export const NUTRIENT_LABELS: Record<string, string> = {
  kcal: 'Calorie (kcal)',
  proteine: 'Proteine (g)',
  carboidrati: 'Carboidrati (g)',
  grassi: 'Grassi (g)',
};

export const KEY_TO_FILENAME: Record<string, string> = {
  weights: 'wrecord.json',
  calories: 'calories.json',
  prices: 'food_prices.json',
  nvalues: 'nvalues.json',
  eaten: 'eaten_lists.json',
  pasti: 'pasti.json',
  plan: 'planner.json',
  constraints: 'constraints.json',
  porzioni: 'porzioni_piano.json',
};

export const FILENAME_TO_KEY: Record<string, string> = Object.entries(KEY_TO_FILENAME).reduce(
  (acc, [k, v]) => ({ ...acc, [v]: k }),
  {} as Record<string, string>
);

export const DEFAULT_NVALUES: NValuesMap = {
  'Pasta': { kcal: 355, proteine: 13, carboidrati: 72, grassi: 1.5 },
  'Riso Basmati': { kcal: 350, proteine: 8.5, carboidrati: 77, grassi: 1.0 },
  'Petto di Pollo': { kcal: 110, proteine: 23, carboidrati: 0, grassi: 1.5 },
  'Salmone Fresco': { kcal: 208, proteine: 20, carboidrati: 0, grassi: 13.5 },
  'Uova Intere': { kcal: 143, proteine: 12.5, carboidrati: 0.7, grassi: 9.5 },
  'Olio Extravergine': { kcal: 884, proteine: 0, carboidrati: 0, grassi: 100 },
  'Fiocchi d\'Avena': { kcal: 370, proteine: 13.5, carboidrati: 60, grassi: 7 },
  'Yogurt Greco 0%': { kcal: 55, proteine: 10.3, carboidrati: 3.6, grassi: 0 },
  'Mela': { kcal: 52, proteine: 0.3, carboidrati: 14, grassi: 0.2 },
  'Banana': { kcal: 89, proteine: 1.1, carboidrati: 23, grassi: 0.3 },
  'Noci': { kcal: 654, proteine: 15.2, carboidrati: 13.7, grassi: 65.2 },
  'Pane Integrale': { kcal: 247, proteine: 9.5, carboidrati: 45, grassi: 2.5 },
  'Pomodori': { kcal: 18, proteine: 0.9, carboidrati: 3.9, grassi: 0.2 },
  'Parmigiano Reggiano': { kcal: 431, proteine: 33, carboidrati: 0, grassi: 29 },
  'Tonno al Naturale': { kcal: 101, proteine: 24, carboidrati: 0, grassi: 0.6 },
};

export const DEFAULT_PRICES: PricesMap = {
  'Pasta': 0.22,
  'Riso Basmati': 0.35,
  'Petto di Pollo': 0.95,
  'Salmone Fresco': 2.20,
  'Uova Intere': 0.50,
  'Olio Extravergine': 1.40,
  'Fiocchi d\'Avena': 0.30,
  'Yogurt Greco 0%': 0.65,
  'Mela': 0.25,
  'Banana': 0.20,
  'Noci': 1.80,
  'Pane Integrale': 0.40,
  'Pomodori': 0.28,
  'Parmigiano Reggiano': 2.10,
  'Tonno al Naturale': 1.50,
};

export const DEFAULT_TEMPLATES: TemplatesMap = {
  'Colazione Avena e Yogurt': {
    ingredients: [
      ['Fiocchi d\'Avena', 0.6],
      ['Yogurt Greco 0%', 1.5],
      ['Mela', 1.0],
      ['Noci', 0.2],
    ],
    category: 'Colazione',
    exclude: false,
  },
  'Uova e Toast Integrale': {
    ingredients: [
      ['Uova Intere', 1.2],
      ['Pane Integrale', 0.8],
      ['Olio Extravergine', 0.05],
    ],
    category: 'Colazione',
    exclude: false,
  },
  'Pasta al Tonno': {
    ingredients: [
      ['Pasta', 1.0],
      ['Tonno al Naturale', 1.0],
      ['Pomodori', 1.5],
      ['Olio Extravergine', 0.1],
    ],
    category: 'Pranzo',
    exclude: false,
  },
  'Riso con Pollo e Pomodorini': {
    ingredients: [
      ['Riso Basmati', 0.9],
      ['Petto di Pollo', 1.8],
      ['Pomodori', 1.2],
      ['Olio Extravergine', 0.1],
    ],
    category: 'Pranzo, Cena',
    exclude: false,
  },
  'Salmone con Pane Integrale': {
    ingredients: [
      ['Salmone Fresco', 1.8],
      ['Pane Integrale', 0.7],
      ['Olio Extravergine', 0.05],
    ],
    category: 'Cena',
    exclude: false,
  },
  'Spuntino Frutta e Noci': {
    ingredients: [
      ['Mela', 1.2],
      ['Noci', 0.25],
    ],
    category: 'Merenda',
    exclude: false,
  },
};

export const DEFAULT_CONSTRAINTS: ConstraintsMap = {
  kcal: { enabled: true, min: 1800, max: 2300 },
  proteine: { enabled: true, min: 90, max: 155 },
  carboidrati: { enabled: false, min: 180, max: 280 },
  grassi: { enabled: false, min: 40, max: 80 },
};

export function getTodayDateStr(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getDateStrWithOffset(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function formatItalianDate(dateStr: string): string {
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}`;
    }
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
  } catch {
    return dateStr;
  }
}

// Generate realistic initial weight records for the past 14 days
export function generateInitialWeights(): [string, number][] {
  const records: [string, number][] = [];
  const startWeight = 78.6;
  for (let i = 14; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(7, 30, 0, 0);
    // slight variation with overall downward trend (-0.08 kg/day)
    const noise = ((i * 7) % 5 - 2) * 0.05;
    const w = Math.round((startWeight - (14 - i) * 0.09 + noise) * 10) / 10;
    records.push([d.toISOString(), w]);
  }
  return records;
}

// Generate realistic initial calorie records for the past 14 days
export function generateInitialCalories(): [string, number][] {
  const records: [string, number][] = [];
  for (let i = 14; i >= 1; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(20, 0, 0, 0);
    const cal = 2000 + ((i * 13) % 250 - 100);
    records.push([d.toISOString(), cal]);
  }
  return records;
}

// Generate initial sample eaten history
export function generateInitialEaten(): EatenMap {
  const today = getTodayDateStr();
  const yesterday = getDateStrWithOffset(-1);
  const twoDaysAgo = getDateStrWithOffset(-2);

  return {
    [today]: [
      ['Fiocchi d\'Avena', 0.6],
      ['Yogurt Greco 0%', 1.5],
      ['Mela', 1.0],
      ['Pasta', 1.0],
      ['Tonno al Naturale', 1.0],
      ['Olio Extravergine', 0.1],
    ],
    [yesterday]: [
      ['Uova Intere', 1.2],
      ['Pane Integrale', 0.8],
      ['Riso Basmati', 0.9],
      ['Petto di Pollo', 1.8],
      ['Pomodori', 1.2],
      ['Olio Extravergine', 0.15],
      ['Mela', 1.2],
      ['Noci', 0.25],
    ],
    [twoDaysAgo]: [
      ['Fiocchi d\'Avena', 0.6],
      ['Yogurt Greco 0%', 1.5],
      ['Pasta', 1.0],
      ['Tonno al Naturale', 1.0],
      ['Salmone Fresco', 1.8],
      ['Pane Integrale', 0.7],
      ['Olio Extravergine', 0.15],
    ],
  };
}

// Generate initial plan for today and next few days
export function generateInitialPlan(): PlanMap {
  const today = getTodayDateStr();
  const p1 = getDateStrWithOffset(1);
  const p2 = getDateStrWithOffset(2);

  return {
    [today]: {
      Colazione: 'Colazione Avena e Yogurt',
      Pranzo: 'Pasta al Tonno',
      Cena: 'Salmone con Pane Integrale',
      Merenda: 'Spuntino Frutta e Noci',
    },
    [p1]: {
      Colazione: 'Uova e Toast Integrale',
      Pranzo: 'Riso con Pollo e Pomodorini',
      Cena: '-',
      Merenda: '-',
    },
    [p2]: {
      Colazione: 'Colazione Avena e Yogurt',
      Pranzo: '-',
      Cena: '-',
      Merenda: '-',
    },
  };
}

export const DEFAULT_PORZIONI: PorzioniMap = {
  [getTodayDateStr()]: {
    Pranzo: 1.0,
    Cena: 1.15,
  },
};
