import {
  MealCategory,
  PlanMap,
  PorzioniMap,
  TemplatesMap,
  NValuesMap,
  PricesMap,
  ConstraintsMap,
  NutrientValues,
} from '../types';
import { MEAL_CATEGORIES, getDateStrWithOffset } from '../constants';
import {
  calculateMealCost,
  calculateMealNutrients,
  mealSupportsCategory,
  getMealIngredients,
} from './nutrition';

export interface OptimizerResult {
  success: boolean;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
  updatedPlan?: PlanMap;
  updatedPorzioni?: PorzioniMap;
}

interface SlotInfo {
  index: number;
  dateKey: string;
  category: MealCategory;
}

export function optimizeWeeklyPlan(
  planData: PlanMap,
  porzioniData: PorzioniMap,
  templates: TemplatesMap,
  nvalues: NValuesMap,
  prices: PricesMap,
  constraints: ConstraintsMap,
  offset = 0
): OptimizerResult {
  const safeOffset = Math.max(0, offset);

  if (!templates || Object.keys(templates).length === 0) {
    return {
      success: false,
      message: 'Non ci sono Pasti Rapidi salvati!',
      type: 'warning',
    };
  }

  // 1. Check for untemplated planned meals in the 5-day window
  const untemplated: string[] = [];
  for (let i = 0; i < 5; i++) {
    const dKey = getDateStrWithOffset(safeOffset + i);
    const dayPlan = planData[dKey];
    if (dayPlan) {
      for (const cat of MEAL_CATEGORIES) {
        const meal = dayPlan[cat];
        if (meal && meal !== '-' && !templates[meal]) {
          untemplated.push(`${meal} (${dKey}, ${cat})`);
        }
      }
    }
  }

  if (untemplated.length > 0) {
    return {
      success: false,
      message:
        'Pasti nel piano senza template (usa il modifica per aggiungere ingredienti): ' +
        untemplated.join('; '),
      type: 'error',
    };
  }

  // 2. Collect eligible meals (positive price, not excluded)
  const eligibleMeals: string[] = [];
  const mealCosts: Record<string, number> = {};
  const mealNutrients: Record<string, NutrientValues> = {};

  for (const [name, mealData] of Object.entries(templates)) {
    if (typeof mealData === 'object' && !Array.isArray(mealData) && mealData.exclude) {
      continue;
    }
    const cost = calculateMealCost(name, templates, prices);
    if (cost !== null && cost > 0) {
      eligibleMeals.push(name);
      mealCosts[name] = cost;
      mealNutrients[name] = calculateMealNutrients(name, templates, nvalues);
    }
  }

  if (eligibleMeals.length === 0) {
    return {
      success: false,
      message: 'Nessun pasto ha prezzi validi nel database!',
      type: 'error',
    };
  }

  // 3. Find empty slots in the 5-day window (excluding Merenda as in original)
  const slotsToFill: SlotInfo[] = [];
  const daysSlots: Record<string, MealCategory[]> = {};
  const assignedMeals = new Set<string>();

  for (let i = 0; i < 5; i++) {
    const dKey = getDateStrWithOffset(safeOffset + i);
    const dayPlan = planData[dKey] || {
      Colazione: '-',
      Pranzo: '-',
      Cena: '-',
      Merenda: '-',
    };

    for (const cat of MEAL_CATEGORIES) {
      const name = dayPlan[cat];
      if (name && name !== '-') {
        assignedMeals.add(name);
      } else if (cat !== 'Merenda') {
        if (!daysSlots[dKey]) daysSlots[dKey] = [];
        daysSlots[dKey].push(cat);
      }
    }
  }

  let slotCounter = 0;
  for (const dKey of Object.keys(daysSlots).sort()) {
    for (const cat of daysSlots[dKey]) {
      slotsToFill.push({
        index: slotCounter++,
        dateKey: dKey,
        category: cat,
      });
    }
  }

  if (slotsToFill.length === 0) {
    return {
      success: false,
      message: 'Tutti i giorni hanno già un piano completo.',
      type: 'info',
    };
  }

  // Exclude already assigned meals
  const availableMeals = eligibleMeals.filter((m) => !assignedMeals.has(m));
  if (availableMeals.length === 0) {
    return {
      success: false,
      message: 'Tutti i pasti sono già assegnati manualmente.',
      type: 'info',
    };
  }

  // 4. Candidate meals per slot
  const candidatesPerSlot: Record<number, string[]> = {};
  for (const slot of slotsToFill) {
    const supported = availableMeals.filter((m) =>
      mealSupportsCategory(templates[m], slot.category)
    );
    if (supported.length === 0) {
      return {
        success: false,
        message: `Nessun pasto idoneo salvato per la categoria '${slot.category}'!`,
        type: 'warning',
      };
    }
    // Sort candidates by cost with subtle jitter for diversity
    supported.sort((a, b) => {
      const jitterA = ((a.charCodeAt(0) * 17) % 10) * 0.005;
      const jitterB = ((b.charCodeAt(0) * 17) % 10) * 0.005;
      return (mealCosts[a] + jitterA) - (mealCosts[b] + jitterB);
    });
    candidatesPerSlot[slot.index] = supported;
  }

  // 5. Group slots by date
  const slotsByDate: Record<string, SlotInfo[]> = {};
  for (const slot of slotsToFill) {
    if (!slotsByDate[slot.dateKey]) slotsByDate[slot.dateKey] = [];
    slotsByDate[slot.dateKey].push(slot);
  }

  // Compute fixed nutrients for meals already assigned on each day
  const fixedNutrientsPerDate: Record<string, NutrientValues> = {};
  for (const dKey of Object.keys(daysSlots)) {
    const fixed: NutrientValues = { kcal: 0, proteine: 0, carboidrati: 0, grassi: 0 };
    const dayPlan = planData[dKey];
    if (dayPlan) {
      for (const cat of MEAL_CATEGORIES) {
        const mealName = dayPlan[cat];
        if (mealName && mealName !== '-') {
          const portion = porzioniData[dKey]?.[cat] || 1.0;
          const n = calculateMealNutrients(mealName, templates, nvalues, portion);
          fixed.kcal += n.kcal;
          fixed.proteine += n.proteine;
          fixed.carboidrati += n.carboidrati;
          fixed.grassi += n.grassi;
        }
      }
    }
    fixedNutrientsPerDate[dKey] = fixed;
  }

  // Repetition constraints
  const usageCount: Record<string, number> = {};
  const maxUsage: Record<string, number> = {};
  for (const m of availableMeals) {
    const matchingSlots = slotsToFill.filter((s) =>
      candidatesPerSlot[s.index].includes(m)
    );
    const minPool = matchingSlots.length > 0
      ? Math.min(...matchingSlots.map((s) => candidatesPerSlot[s.index].length))
      : 1;
    maxUsage[m] = Math.max(1, Math.ceil(matchingSlots.length / Math.max(1, minPool)));
    usageCount[m] = 0;
  }

  // 6. Solver: Solve day-by-day (or global backtracking)
  // For each day, we pick one meal per slot such that there exists a portion p in [0.5, 1.8]
  // that satisfies all active daily constraints:
  // min <= fixed + sum(p * meal_nutrients) <= max
  const sortedDates = Object.keys(slotsByDate).sort();
  const chosenAssignment: Record<number, { meal: string; portion: number }> = {};

  function checkDayConstraints(
    dKey: string,
    daySlots: SlotInfo[],
    meals: string[],
    portion: number
  ): boolean {
    const fixed = fixedNutrientsPerDate[dKey];
    const totals: NutrientValues = { ...fixed };

    for (let i = 0; i < meals.length; i++) {
      const m = meals[i];
      const nut = mealNutrients[m];
      totals.kcal += nut.kcal * portion;
      totals.proteine += nut.proteine * portion;
      totals.carboidrati += nut.carboidrati * portion;
      totals.grassi += nut.grassi * portion;
    }

    const nutKeys: (keyof NutrientValues)[] = ['kcal', 'proteine', 'carboidrati', 'grassi'];
    for (const k of nutKeys) {
      const cfg = constraints[k as keyof ConstraintsMap];
      if (!cfg || !cfg.enabled) continue;
      if (cfg.min !== null && cfg.min !== undefined && totals[k] < cfg.min) {
        return false;
      }
      if (cfg.max !== null && cfg.max !== undefined && totals[k] > cfg.max) {
        return false;
      }
    }
    return true;
  }

  function findFeasiblePortionForDay(
    dKey: string,
    daySlots: SlotInfo[],
    meals: string[]
  ): number | null {
    // Check multiple candidate portion multipliers between 0.5 and 1.8
    // Prefer portions closest to 1.0 (standard size), while minimizing cost
    const candidatePortions = [1.0, 0.9, 1.1, 0.8, 1.2, 0.7, 1.3, 0.6, 1.4, 0.5, 1.5, 1.6, 1.7, 1.8];
    for (const p of candidatePortions) {
      if (checkDayConstraints(dKey, daySlots, meals, p)) {
        return p;
      }
    }
    // Fine-grained test
    for (let p = 0.5; p <= 1.8001; p += 0.05) {
      const rounded = Math.round(p * 100) / 100;
      if (checkDayConstraints(dKey, daySlots, meals, rounded)) {
        return rounded;
      }
    }
    return null;
  }

  // Recursive backtracking through days
  function solveDay(dateIdx: number): boolean {
    if (dateIdx >= sortedDates.length) {
      return true;
    }

    const dKey = sortedDates[dateIdx];
    const daySlots = slotsByDate[dKey];

    // Generate combinations of meals for daySlots
    function getSlotOptions(sIdx: number): string[][] {
      if (sIdx >= daySlots.length) return [[]];
      const currentSlot = daySlots[sIdx];
      const rest = getSlotOptions(sIdx + 1);
      const res: string[][] = [];

      for (const meal of candidatesPerSlot[currentSlot.index]) {
        if ((usageCount[meal] || 0) >= (maxUsage[meal] || 1)) {
          continue;
        }
        for (const sub of rest) {
          // Avoid duplicate meals in the same day
          if (!sub.includes(meal)) {
            res.push([meal, ...sub]);
          }
        }
      }
      return res;
    }

    const dayMealCombinations = getSlotOptions(0);
    // Sort combinations by estimated cost
    dayMealCombinations.sort((combA, combB) => {
      const costA = combA.reduce((sum, m) => sum + mealCosts[m], 0);
      const costB = combB.reduce((sum, m) => sum + mealCosts[m], 0);
      return costA - costB;
    });

    for (const comb of dayMealCombinations) {
      const portion = findFeasiblePortionForDay(dKey, daySlots, comb);
      if (portion !== null) {
        // Record assignment
        for (let i = 0; i < daySlots.length; i++) {
          const slot = daySlots[i];
          const meal = comb[i];
          chosenAssignment[slot.index] = { meal, portion };
          usageCount[meal] = (usageCount[meal] || 0) + 1;
        }

        if (solveDay(dateIdx + 1)) {
          return true;
        }

        // Backtrack
        for (let i = 0; i < daySlots.length; i++) {
          const slot = daySlots[i];
          const meal = comb[i];
          delete chosenAssignment[slot.index];
          usageCount[meal] = (usageCount[meal] || 0) - 1;
        }
      }
    }

    return false;
  }

  const foundSolution = solveDay(0);

  if (!foundSolution) {
    return {
      success: false,
      message: 'Impossibile trovare una combinazione che soddisfi i vincoli!',
      type: 'error',
    };
  }

  // Apply chosen plan and portions
  const newPlan: PlanMap = JSON.parse(JSON.stringify(planData));
  const newPorzioni: PorzioniMap = JSON.parse(JSON.stringify(porzioniData));

  for (const slot of slotsToFill) {
    const chosen = chosenAssignment[slot.index];
    if (chosen) {
      if (!newPlan[slot.dateKey]) {
        newPlan[slot.dateKey] = {
          Colazione: '-',
          Pranzo: '-',
          Cena: '-',
          Merenda: '-',
        };
      }
      newPlan[slot.dateKey][slot.category] = chosen.meal;

      if (!newPorzioni[slot.dateKey]) {
        newPorzioni[slot.dateKey] = {};
      }
      newPorzioni[slot.dateKey][slot.category] = Math.round(chosen.portion * 100) / 100;
    }
  }

  return {
    success: true,
    message: 'Ottimizzazione completata con successo!',
    type: 'success',
    updatedPlan: newPlan,
    updatedPorzioni: newPorzioni,
  };
}
