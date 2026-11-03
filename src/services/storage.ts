import JSZip from 'jszip';
import {
  NValuesMap,
  PricesMap,
  TemplatesMap,
  ConstraintsMap,
  PlanMap,
  EatenMap,
  PorzioniMap,
} from '../types';
import {
  KEY_TO_FILENAME,
  FILENAME_TO_KEY,
  DEFAULT_NVALUES,
  DEFAULT_PRICES,
  DEFAULT_TEMPLATES,
  DEFAULT_CONSTRAINTS,
  DEFAULT_PORZIONI,
  generateInitialWeights,
  generateInitialCalories,
  generateInitialEaten,
  generateInitialPlan,
} from '../constants';

export interface AppStateData {
  weights: [string, number][];
  calories: [string, number][];
  nvalues: NValuesMap;
  prices: PricesMap;
  eaten: EatenMap;
  pasti: TemplatesMap;
  plan: PlanMap;
  constraints: ConstraintsMap;
  porzioni: PorzioniMap;
}

export const STORAGE_KEYS = {
  weights: 'diet_weights',
  calories: 'diet_calories',
  nvalues: 'diet_nvalues',
  prices: 'diet_prices',
  eaten: 'diet_eaten',
  pasti: 'diet_pasti',
  plan: 'diet_plan',
  constraints: 'diet_constraints',
  porzioni: 'diet_porzioni',
  persistInBrowser: 'diet_persist_in_browser',
  sessionData: 'diet_session_data_v2',
};

export function getEmptyAppState(): AppStateData {
  return {
    weights: [],
    calories: [],
    nvalues: {},
    prices: {},
    eaten: {},
    pasti: {},
    plan: {},
    constraints: {
      kcal: { enabled: false, min: null, max: null },
      proteine: { enabled: false, min: null, max: null },
      carboidrati: { enabled: false, min: null, max: null },
      grassi: { enabled: false, min: null, max: null },
    },
    porzioni: {},
  };
}

export function getDemoAppState(): AppStateData {
  return {
    weights: generateInitialWeights(),
    calories: generateInitialCalories(),
    nvalues: DEFAULT_NVALUES,
    prices: DEFAULT_PRICES,
    eaten: generateInitialEaten(),
    pasti: DEFAULT_TEMPLATES,
    plan: generateInitialPlan(),
    constraints: DEFAULT_CONSTRAINTS,
    porzioni: DEFAULT_PORZIONI,
  };
}

export function purgeLegacyLocalStorage(): void {
  const keysToPurge = [
    'diet_weights',
    'diet_calories',
    'diet_nvalues',
    'diet_prices',
    'diet_eaten',
    'diet_pasti',
    'diet_plan',
    'diet_constraints',
    'diet_porzioni',
    'diet_has_initialized_v1',
    'diet_session_data_v2',
  ];
  for (const k of keysToPurge) {
    try {
      localStorage.removeItem(k);
    } catch {
      // ignore
    }
  }
  try {
    sessionStorage.removeItem('diet_session_data_v2');
    sessionStorage.clear();
  } catch {
    // ignore
  }
}

export function loadInitialData(): AppStateData {
  const isPersistEnabled = localStorage.getItem(STORAGE_KEYS.persistInBrowser) === 'true';

  // If user explicitly chose to persist in this browser's localStorage
  if (isPersistEnabled) {
    function getStored<T>(key: string, fallback: T): T {
      try {
        const item = localStorage.getItem(key);
        if (item) {
          return JSON.parse(item) as T;
        }
      } catch (e) {
        console.error(`Error parsing stored key ${key}:`, e);
      }
      return fallback;
    }

    return {
      weights: getStored<[string, number][]>(STORAGE_KEYS.weights, []),
      calories: getStored<[string, number][]>(STORAGE_KEYS.calories, []),
      nvalues: getStored<NValuesMap>(STORAGE_KEYS.nvalues, {}),
      prices: getStored<PricesMap>(STORAGE_KEYS.prices, {}),
      eaten: getStored<EatenMap>(STORAGE_KEYS.eaten, {}),
      pasti: getStored<TemplatesMap>(STORAGE_KEYS.pasti, {}),
      plan: getStored<PlanMap>(STORAGE_KEYS.plan, {}),
      constraints: getStored<ConstraintsMap>(STORAGE_KEYS.constraints, DEFAULT_CONSTRAINTS),
      porzioni: getStored<PorzioniMap>(STORAGE_KEYS.porzioni, {}),
    };
  }

  // DEFAULT (True Offline In-Memory Architecture):
  // Clean up any lingering browser storage so reopened preview always starts clean
  purgeLegacyLocalStorage();

  // App starts clean ("Nessun dato trovato") waiting for the user to upload their offline ZIP or choose Demo
  return getEmptyAppState();
}

export function saveAllData(data: AppStateData, persistInBrowser: boolean = false): void {
  // Only persist to localStorage if user explicitly opted in
  if (persistInBrowser) {
    try {
      localStorage.setItem(STORAGE_KEYS.persistInBrowser, 'true');
      localStorage.setItem(STORAGE_KEYS.weights, JSON.stringify(data.weights));
      localStorage.setItem(STORAGE_KEYS.calories, JSON.stringify(data.calories));
      localStorage.setItem(STORAGE_KEYS.nvalues, JSON.stringify(data.nvalues));
      localStorage.setItem(STORAGE_KEYS.prices, JSON.stringify(data.prices));
      localStorage.setItem(STORAGE_KEYS.eaten, JSON.stringify(data.eaten));
      localStorage.setItem(STORAGE_KEYS.pasti, JSON.stringify(data.pasti));
      localStorage.setItem(STORAGE_KEYS.plan, JSON.stringify(data.plan));
      localStorage.setItem(STORAGE_KEYS.constraints, JSON.stringify(data.constraints));
      localStorage.setItem(STORAGE_KEYS.porzioni, JSON.stringify(data.porzioni));
    } catch (err) {
      console.error('Failed to save to localStorage:', err);
    }
  } else {
    // Keep browser storage clean of user data
    purgeLegacyLocalStorage();
    try {
      localStorage.removeItem(STORAGE_KEYS.persistInBrowser);
    } catch {
      // ignore
    }
  }
}

export function hasAnyData(data: AppStateData): boolean {
  return (
    (data.weights && data.weights.length > 0) ||
    (data.calories && data.calories.length > 0) ||
    (data.nvalues && Object.keys(data.nvalues).length > 0) ||
    (data.prices && Object.keys(data.prices).length > 0) ||
    (data.pasti && Object.keys(data.pasti).length > 0) ||
    (data.plan && Object.keys(data.plan).length > 0) ||
    (data.eaten && Object.keys(data.eaten).length > 0)
  );
}

export async function exportDataZip(data: AppStateData): Promise<Blob> {
  const zip = new JSZip();

  const fileDataMap: Record<string, unknown> = {
    [KEY_TO_FILENAME.weights]: data.weights,
    [KEY_TO_FILENAME.calories]: data.calories,
    [KEY_TO_FILENAME.prices]: data.prices,
    [KEY_TO_FILENAME.nvalues]: data.nvalues,
    [KEY_TO_FILENAME.eaten]: data.eaten,
    [KEY_TO_FILENAME.pasti]: data.pasti,
    [KEY_TO_FILENAME.plan]: data.plan,
    [KEY_TO_FILENAME.constraints]: data.constraints,
    [KEY_TO_FILENAME.porzioni]: data.porzioni,
  };

  for (const [filename, content] of Object.entries(fileDataMap)) {
    zip.file(filename, JSON.stringify(content, null, 2));
  }

  return await zip.generateAsync({ type: 'blob' });
}

export async function importDataFiles(
  files: FileList | File[],
  currentData: AppStateData,
  persistInBrowser: boolean = false
): Promise<{ loaded: number; updatedData: AppStateData; errors: string[] }> {
  const updatedData: AppStateData = { ...currentData };
  let loadedCount = 0;
  const errors: string[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    if (file.name.endsWith('.zip')) {
      try {
        const zip = await JSZip.loadAsync(file);
        for (const [relativePath, zipEntry] of Object.entries(zip.files)) {
          if (zipEntry.dir) continue;
          const basename = relativePath.split('/').pop() || '';
          const key = FILENAME_TO_KEY[basename];
          if (key) {
            try {
              const text = await zipEntry.async('string');
              const parsed = JSON.parse(text);
              (updatedData as unknown as Record<string, unknown>)[key] = parsed;
              loadedCount++;
            } catch (err) {
              errors.push(`Errore nel parsing di ${basename} nello zip`);
            }
          }
        }
      } catch (err) {
        errors.push(`File ${file.name} non è uno zip valido.`);
      }
    } else if (file.name.endsWith('.json')) {
      const basename = file.name.split('/').pop() || '';
      const key = FILENAME_TO_KEY[basename];
      if (key) {
        try {
          const text = await file.text();
          const parsed = JSON.parse(text);
          (updatedData as unknown as Record<string, unknown>)[key] = parsed;
          loadedCount++;
        } catch (err) {
          errors.push(`File ${file.name} non è un JSON valido.`);
        }
      } else {
        errors.push(`File ${file.name} non riconosciuto. Ignorato.`);
      }
    } else {
      errors.push(`File ${file.name}: formato non supportato (solo .zip o .json).`);
    }
  }

  if (loadedCount > 0) {
    saveAllData(updatedData, persistInBrowser);
  }

  return { loaded: loadedCount, updatedData, errors };
}

export function clearAllUserData(): AppStateData {
  const empty = getEmptyAppState();
  try {
    sessionStorage.removeItem(STORAGE_KEYS.sessionData);
  } catch {
    // ignore
  }
  purgeLegacyLocalStorage();
  try {
    localStorage.removeItem(STORAGE_KEYS.persistInBrowser);
  } catch {
    // ignore
  }
  return empty;
}
