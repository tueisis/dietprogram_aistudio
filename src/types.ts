export type MealCategory = 'Colazione' | 'Pranzo' | 'Cena' | 'Merenda';

export interface NutrientValues {
  kcal: number;
  proteine: number;
  carboidrati: number;
  grassi: number;
  [key: string]: number;
}

export type NValuesMap = Record<string, Partial<NutrientValues>>;
export type PricesMap = Record<string, number>;

export type EatenItem = [string, number]; // [foodName, qty_hg]
export type EatenMap = Record<string, EatenItem[]>; // "YYYY-MM-DD" -> EatenItem[]

export interface MealTemplateDetails {
  ingredients: EatenItem[];
  category?: string | string[];
  exclude?: boolean;
}

export type MealTemplate = MealTemplateDetails | EatenItem[];
export type TemplatesMap = Record<string, MealTemplate>;

export type DayPlan = Record<MealCategory, string>;
export type PlanMap = Record<string, DayPlan>; // "YYYY-MM-DD" -> DayPlan

export type PorzioniMap = Record<string, Partial<Record<MealCategory, number>>>; // "YYYY-MM-DD" -> { Colazione: 1.25, ... }

export interface ConstraintItem {
  enabled: boolean;
  min: number | null;
  max: number | null;
}

export type ConstraintNutrient = 'kcal' | 'proteine' | 'carboidrati' | 'grassi';
export type ConstraintsMap = Record<ConstraintNutrient, ConstraintItem>;

export interface WeightEntry {
  date: string; // ISO string
  weight: number;
}

export interface CalorieEntry {
  date: string; // ISO string
  calories: number;
}

export interface StatsResult {
  trend: 'Dimagrimento' | 'Aumento' | 'Stazionario';
  slope: string;
  mean_cal: string;
  fabisogno: string;
  rawSlope?: number;
  rawMeanCal?: number;
}

export type TabType = 'main' | 'food' | 'history' | 'planner' | 'database' | 'constraints';

export type ThemeType = 'swiss' | 'nordic' | 'obsidian' | 'mediterranean' | 'classic';

export interface AlertNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}
