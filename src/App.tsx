import React, { useState, useEffect } from 'react';
import {
  TabType,
  ThemeType,
  AlertNotification,
  MealCategory,
  EatenItem,
  ConstraintsMap,
} from './types';
import {
  loadInitialData,
  saveAllData,
  hasAnyData,
  exportDataZip,
  importDataFiles,
  clearAllUserData,
  AppStateData,
} from './services/storage';
import { optimizeWeeklyPlan } from './services/optimizer';
import { getMealIngredients } from './services/nutrition';
import { getTodayDateStr } from './constants';
import { Navbar } from './components/Navbar';
import { SetupBanner } from './components/SetupBanner';
import { MainScreen } from './screens/MainScreen';
import { FoodScreen } from './screens/FoodScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { PlannerScreen } from './screens/PlannerScreen';
import { DatabaseScreen } from './screens/DatabaseScreen';
import { ConstraintsScreen } from './screens/ConstraintsScreen';

export const App: React.FC = () => {
  const [data, setData] = useState<AppStateData>(() => loadInitialData());
  const [activeTab, setActiveTab] = useState<TabType>('main');
  const [alerts, setAlerts] = useState<AlertNotification[]>([]);
  const [showConstraintsModal, setShowConstraintsModal] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<ThemeType>(() => {
    const saved = localStorage.getItem('diet_app_theme') as ThemeType;
    return saved || 'swiss';
  });

  // Apply theme to document root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('diet_app_theme', currentTheme);
  }, [currentTheme]);

  // Sync state changes with localStorage
  useEffect(() => {
    saveAllData(data);
  }, [data]);

  const notify = (
    type: 'success' | 'error' | 'warning' | 'info',
    message: string
  ) => {
    const id = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    setAlerts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    }, 4500);
  };

  const removeAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  // --- Handlers for Main Screen ---
  const handleRecordWeight = (weight: number) => {
    setData((prev) => ({
      ...prev,
      weights: [...prev.weights, [new Date().toISOString(), weight]],
    }));
  };

  const handleRecordCalories = (calories: number) => {
    setData((prev) => ({
      ...prev,
      calories: [...prev.calories, [new Date().toISOString(), calories]],
    }));
  };

  // --- Handlers for Food Diary Screen ---
  const handleAddFoodItem = (name: string, qty: number) => {
    const todayStr = getTodayDateStr();
    setData((prev) => {
      const todayList = prev.eaten[todayStr] ? [...prev.eaten[todayStr]] : [];
      todayList.push([name, qty]);
      return {
        ...prev,
        eaten: {
          ...prev.eaten,
          [todayStr]: todayList,
        },
      };
    });
  };

  const handleDeleteFoodItem = (index: number) => {
    const todayStr = getTodayDateStr();
    setData((prev) => {
      const todayList = prev.eaten[todayStr] ? [...prev.eaten[todayStr]] : [];
      if (index >= 0 && index < todayList.length) {
        todayList.splice(index, 1);
      }
      return {
        ...prev,
        eaten: {
          ...prev.eaten,
          [todayStr]: todayList,
        },
      };
    });
  };

  const handleSaveNewFoodNutrition = (foodName: string, kcal: number) => {
    setData((prev) => ({
      ...prev,
      nvalues: {
        ...prev.nvalues,
        [foodName]: {
          ...(prev.nvalues[foodName] || {}),
          kcal,
        },
      },
    }));
  };

  // --- Handlers for History Screen ---
  const handleSaveMealTemplateFromHistory = (
    name: string,
    ingredients: EatenItem[],
    categories: MealCategory[]
  ) => {
    setData((prev) => ({
      ...prev,
      pasti: {
        ...prev.pasti,
        [name]: {
          ingredients,
          category: categories.join(', '),
          exclude: false,
        },
      },
    }));
  };

  // --- Handlers for Planner Screen ---
  const handleAssignMeal = (
    date: string,
    category: MealCategory,
    mealName: string
  ) => {
    setData((prev) => {
      const updatedPlan = { ...prev.plan };
      if (!updatedPlan[date]) {
        updatedPlan[date] = {
          Colazione: '-',
          Pranzo: '-',
          Cena: '-',
          Merenda: '-',
        };
      } else {
        updatedPlan[date] = { ...updatedPlan[date] };
      }

      updatedPlan[date][category] = mealName;

      // Reset any custom portion for this slot
      const updatedPorzioni = { ...prev.porzioni };
      if (updatedPorzioni[date] && updatedPorzioni[date][category] !== undefined) {
        const dayPortions = { ...updatedPorzioni[date] };
        delete dayPortions[category];
        if (Object.keys(dayPortions).length === 0) {
          delete updatedPorzioni[date];
        } else {
          updatedPorzioni[date] = dayPortions;
        }
      }

      return {
        ...prev,
        plan: updatedPlan,
        porzioni: updatedPorzioni,
      };
    });
  };

  const handleClearPlanRange = (dates: string[]) => {
    setData((prev) => {
      const updatedPlan = { ...prev.plan };
      const updatedPorzioni = { ...prev.porzioni };
      for (const d of dates) {
        delete updatedPlan[d];
        delete updatedPorzioni[d];
      }
      return {
        ...prev,
        plan: updatedPlan,
        porzioni: updatedPorzioni,
      };
    });
  };

  const handleSwapMeals = (
    srcDate: string,
    srcCat: MealCategory,
    dstDate: string,
    dstCat: MealCategory
  ) => {
    setData((prev) => {
      const newPlan = { ...prev.plan };
      for (const d of [srcDate, dstDate]) {
        if (!newPlan[d]) {
          newPlan[d] = {
            Colazione: '-',
            Pranzo: '-',
            Cena: '-',
            Merenda: '-',
          };
        } else {
          newPlan[d] = { ...newPlan[d] };
        }
      }

      const srcMeal = newPlan[srcDate][srcCat] || '-';
      const dstMeal = newPlan[dstDate][dstCat] || '-';

      newPlan[srcDate][srcCat] = dstMeal;
      newPlan[dstDate][dstCat] = srcMeal;

      // Swap portions
      const newPorzioni = { ...prev.porzioni };
      const srcPortion = newPorzioni[srcDate]?.[srcCat];
      const dstPortion = newPorzioni[dstDate]?.[dstCat];

      if (!newPorzioni[srcDate]) newPorzioni[srcDate] = {};
      else newPorzioni[srcDate] = { ...newPorzioni[srcDate] };

      if (!newPorzioni[dstDate]) newPorzioni[dstDate] = {};
      else newPorzioni[dstDate] = { ...newPorzioni[dstDate] };

      if (dstPortion !== undefined) {
        newPorzioni[srcDate][srcCat] = dstPortion;
      } else {
        delete newPorzioni[srcDate][srcCat];
      }

      if (srcPortion !== undefined) {
        newPorzioni[dstDate][dstCat] = srcPortion;
      } else {
        delete newPorzioni[dstDate][dstCat];
      }

      for (const d of [srcDate, dstDate]) {
        if (newPorzioni[d] && Object.keys(newPorzioni[d]).length === 0) {
          delete newPorzioni[d];
        }
      }

      return {
        ...prev,
        plan: newPlan,
        porzioni: newPorzioni,
      };
    });
  };

  const handleAddPlanToDiary = (
    mealName: string,
    date: string,
    category: MealCategory
  ) => {
    const mealData = data.pasti[mealName];
    if (!mealData) {
      notify(
        'error',
        `Pasto '${mealName}' non ha ingredienti salvati. Selezionalo per aggiungerli.`
      );
      return;
    }

    const ingredients = getMealIngredients(mealData);
    const portion = data.porzioni[date]?.[category] || 1.0;
    const scaledIngredients: EatenItem[] = ingredients.map(([food, qty]) => [
      food,
      Math.round(qty * portion * 100) / 100,
    ]);

    if (scaledIngredients.length === 0) {
      notify('warning', `Il pasto '${mealName}' non ha ingredienti registrati.`);
      return;
    }

    const todayStr = getTodayDateStr();
    setData((prev) => {
      const todayList = prev.eaten[todayStr] ? [...prev.eaten[todayStr]] : [];
      return {
        ...prev,
        eaten: {
          ...prev.eaten,
          [todayStr]: [...todayList, ...scaledIngredients],
        },
      };
    });

    notify(
      'success',
      `'${mealName}' aggiunto al diario di oggi (${scaledIngredients.length} ingredienti).`
    );
  };

  const handleSaveMealTemplateFromPlanner = (
    oldName: string | null,
    name: string,
    ingredients: EatenItem[],
    categories: string[],
    exclude: boolean
  ) => {
    setData((prev) => {
      const updatedPasti = { ...prev.pasti };
      if (oldName && oldName in updatedPasti && oldName !== name) {
        delete updatedPasti[oldName];
      }
      updatedPasti[name] = {
        ingredients,
        category: categories.join(', '),
        exclude,
      };
      return {
        ...prev,
        pasti: updatedPasti,
      };
    });
  };

  const handleDeleteMealTemplate = (mealName: string) => {
    setData((prev) => {
      const updatedPasti = { ...prev.pasti };
      delete updatedPasti[mealName];
      return {
        ...prev,
        pasti: updatedPasti,
      };
    });
  };

  const handleOptimize = (offset: number) => {
    const res = optimizeWeeklyPlan(
      data.plan,
      data.porzioni,
      data.pasti,
      data.nvalues,
      data.prices,
      data.constraints,
      offset
    );

    notify(res.type, res.message);

    if (res.success && res.updatedPlan && res.updatedPorzioni) {
      setData((prev) => ({
        ...prev,
        plan: res.updatedPlan!,
        porzioni: res.updatedPorzioni!,
      }));
    }
  };

  // --- Handlers for Database Screen ---
  const handleAddFood = (
    nome: string,
    kcal: number,
    proteine: number,
    carboidrati: number,
    grassi: number,
    prezzo: number
  ) => {
    setData((prev) => ({
      ...prev,
      nvalues: {
        ...prev.nvalues,
        [nome]: { kcal, proteine, carboidrati, grassi },
      },
      prices: {
        ...prev.prices,
        [nome]: prezzo,
      },
    }));
  };

  const handleUpdateFood = (oldName: string, field: string, value: string) => {
    setData((prev) => {
      const newNValues = { ...prev.nvalues };
      const newPrices = { ...prev.prices };
      const newPasti = { ...prev.pasti };

      if (field === 'nome') {
        const newName = value.trim();
        if (!newName || newName in newNValues) return prev;

        if (oldName in newNValues) {
          newNValues[newName] = newNValues[oldName];
          delete newNValues[oldName];
        }
        if (oldName in newPrices) {
          newPrices[newName] = newPrices[oldName];
          delete newPrices[oldName];
        }

        // Rename in all meal templates
        for (const [mName, mData] of Object.entries(newPasti)) {
          const ings = getMealIngredients(mData);
          let modified = false;
          const updatedIngs: EatenItem[] = ings.map(([f, q]) => {
            if (f === oldName) {
              modified = true;
              return [newName, q];
            }
            return [f, q];
          });

          if (modified) {
            if (typeof mData === 'object' && !Array.isArray(mData)) {
              newPasti[mName] = { ...mData, ingredients: updatedIngs };
            } else {
              newPasti[mName] = updatedIngs;
            }
          }
        }
      } else if (field === 'prezzo') {
        const p = parseFloat(value.replace(',', '.'));
        if (!isNaN(p)) {
          newPrices[oldName] = p;
        }
      } else if (['kcal', 'proteine', 'carboidrati', 'grassi'].includes(field)) {
        const val = parseFloat(value.replace(',', '.'));
        if (!isNaN(val) && newNValues[oldName]) {
          newNValues[oldName] = {
            ...newNValues[oldName],
            [field]: val,
          };
        }
      }

      return {
        ...prev,
        nvalues: newNValues,
        prices: newPrices,
        pasti: newPasti,
      };
    });
  };

  const handleDeleteFood = (nome: string) => {
    setData((prev) => {
      const newNValues = { ...prev.nvalues };
      const newPrices = { ...prev.prices };
      delete newNValues[nome];
      delete newPrices[nome];
      return {
        ...prev,
        nvalues: newNValues,
        prices: newPrices,
      };
    });
  };

  // --- Handlers for Constraints ---
  const handleSaveConstraints = (newConstraints: ConstraintsMap) => {
    setData((prev) => ({
      ...prev,
      constraints: newConstraints,
    }));
  };

  // --- Handlers for Data Backup & Status ---
  const handleDownload = async () => {
    try {
      const blob = await exportDataZip(data);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Dati_Dieta.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      notify('info', 'Scaricati file di backup (Dati_Dieta.zip).');
    } catch (err) {
      console.error(err);
      notify('error', 'Errore durante la creazione dello zip di backup.');
    }
  };

  const handleUpload = async (files: FileList) => {
    const { loaded, updatedData, errors } = await importDataFiles(files, data);
    if (loaded > 0) {
      setData(updatedData);
      notify('success', `${loaded} file caricati con successo in memoria!`);
    }
    if (errors.length > 0) {
      errors.forEach((e) => notify('warning', e));
    }
  };

  const handleClear = () => {
    const empty = clearAllUserData();
    setData(empty);
    notify('info', 'Dati rimossi dalla memoria.');
  };

  const isDataPresent = hasAnyData(data);

  return (
    <div>
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setShowConstraintsModal(false);
        }}
        onDownload={handleDownload}
        currentTheme={currentTheme}
        onChangeTheme={setCurrentTheme}
      />

      {/* Setup / Backup Banner */}
      <SetupBanner
        hasData={isDataPresent}
        onUpload={handleUpload}
        onClear={handleClear}
      />

      <div className="container">
        {/* Alerts / Flashed Messages */}
        {alerts.map((al) => (
          <div
            key={al.id}
            className={`alert alert-${al.type}`}
            style={{ justifyContent: 'space-between' }}
          >
            <span>{al.message}</span>
            <button
              type="button"
              onClick={() => removeAlert(al.id)}
              style={{
                background: 'none',
                border: 'none',
                color: 'inherit',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '12pt',
              }}
            >
              &times;
            </button>
          </div>
        ))}

        {/* Tab Content */}
        {activeTab === 'main' && (
          <MainScreen
            data={data}
            onRecordWeight={handleRecordWeight}
            onRecordCalories={handleRecordCalories}
            onNotify={notify}
          />
        )}

        {activeTab === 'food' && (
          <FoodScreen
            data={data}
            onAddFoodItem={handleAddFoodItem}
            onDeleteFoodItem={handleDeleteFoodItem}
            onSaveNewFoodNutrition={handleSaveNewFoodNutrition}
            onNotify={notify}
          />
        )}

        {activeTab === 'history' && (
          <HistoryScreen
            data={data}
            onSaveMealTemplate={handleSaveMealTemplateFromHistory}
            onNotify={notify}
          />
        )}

        {activeTab === 'planner' && (
          <PlannerScreen
            data={data}
            onAssignMeal={handleAssignMeal}
            onClearPlanRange={handleClearPlanRange}
            onSwapMeals={handleSwapMeals}
            onAddPlanToDiary={handleAddPlanToDiary}
            onSaveMealTemplate={handleSaveMealTemplateFromPlanner}
            onDeleteMealTemplate={handleDeleteMealTemplate}
            onOptimize={handleOptimize}
            onOpenConstraints={() => setShowConstraintsModal(true)}
            onNotify={notify}
          />
        )}

        {activeTab === 'database' && (
          <DatabaseScreen
            data={data}
            onAddFood={handleAddFood}
            onUpdateFood={handleUpdateFood}
            onDeleteFood={handleDeleteFood}
            onNotify={notify}
          />
        )}

        {activeTab === 'constraints' && (
          <ConstraintsScreen
            initialConstraints={data.constraints}
            onSave={handleSaveConstraints}
            onNotify={notify}
          />
        )}
      </div>

      {/* Constraints Modal */}
      {showConstraintsModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowConstraintsModal(false)}
        >
          <div
            className="modal-content"
            style={{ maxWidth: '580px', width: '100%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <ConstraintsScreen
              initialConstraints={data.constraints}
              onSave={(c) => {
                handleSaveConstraints(c);
                setShowConstraintsModal(false);
              }}
              onClose={() => setShowConstraintsModal(false)}
              onNotify={notify}
            />
          </div>
        </div>
      )}
    </div>
  );
};
