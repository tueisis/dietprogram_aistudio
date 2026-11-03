import React, { useState } from 'react';
import { AppStateData } from '../services/storage';
import { MealCategory, EatenItem, MealTemplateDetails } from '../types';
import {
  MEAL_CATEGORIES,
  getDateStrWithOffset,
  formatItalianDate,
  NUTRIENT_LABELS,
} from '../constants';
import {
  formatMealName,
  getMealIngredients,
  getMealCategory,
  calculateMealNutrients,
  calculateMealCost,
} from '../services/nutrition';

interface PlannerScreenProps {
  data: AppStateData;
  onAssignMeal: (date: string, cat: MealCategory, mealName: string) => void;
  onClearPlanRange: (dates: string[]) => void;
  onSwapMeals: (srcDate: string, srcCat: MealCategory, dstDate: string, dstCat: MealCategory) => void;
  onAddPlanToDiary: (mealName: string, date: string, category: MealCategory) => void;
  onSaveMealTemplate: (
    oldName: string | null,
    name: string,
    ingredients: EatenItem[],
    categories: string[],
    exclude: boolean
  ) => void;
  onDeleteMealTemplate: (mealName: string) => void;
  onOptimize: (offset: number) => void;
  onOpenConstraints: () => void;
  onNotify: (type: 'success' | 'error' | 'warning' | 'info', msg: string) => void;
}

export const PlannerScreen: React.FC<PlannerScreenProps> = ({
  data,
  onAssignMeal,
  onClearPlanRange,
  onSwapMeals,
  onAddPlanToDiary,
  onSaveMealTemplate,
  onDeleteMealTemplate,
  onOptimize,
  onOpenConstraints,
  onNotify,
}) => {
  const [statusMessage, setStatusMessage] = useState('Clicca su una colonna per vedere il totale del giorno.');
  const [offset, setOffset] = useState(0);

  // 5 days window dates
  const dateKeys = Array.from({ length: 5 }, (_, i) => {
    const key = getDateStrWithOffset(offset + i);
    const display = formatItalianDate(key);
    return { key, display };
  });

  const todayKey = getDateStrWithOffset(0);

  // Inspector state for clicked cell in grid
  const [selectedCell, setSelectedCell] = useState<{
    date: string;
    cat: MealCategory;
    mealName: string;
    portion: number;
  } | null>(null);

  // Assign Modal state
  const [assignTarget, setAssignTarget] = useState<{
    date: string;
    category: MealCategory;
  } | null>(null);
  const [manualMealInput, setManualMealInput] = useState('');

  // Swap mode state
  const [swapMode, setSwapMode] = useState(false);
  const [swapFirstCell, setSwapFirstCell] = useState<{
    date: string;
    cat: MealCategory;
  } | null>(null);

  // Meal Library / Filter state
  const [mealSearch, setMealSearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('TUTTI');

  // Meal Editor Modal State (replaces old bottom form)
  const [isEditorModalOpen, setIsEditorModalOpen] = useState(false);
  const [editingTemplateName, setEditingTemplateName] = useState<string | null>(null); // null = new meal
  const [editMealName, setEditMealName] = useState('');
  const [editCategories, setEditCategories] = useState<string[]>([]);
  const [editIngredients, setEditIngredients] = useState<EatenItem[]>([]);
  const [editExclude, setEditExclude] = useState(false);

  // Add ingredient within Editor Modal
  const [newIngFood, setNewIngFood] = useState('');
  const [newIngQty, setNewIngQty] = useState('');

  // Check if any meal exists in current 5-day window
  const hasPlanInWindow = dateKeys.some((dk) => {
    const day = data.plan[dk.key];
    return day && Object.values(day).some((m) => m && m !== '-');
  });

  // Active constraints parts
  const activeConstraintParts: string[] = [];
  for (const [key, cfg] of Object.entries(data.constraints)) {
    if (cfg.enabled) {
      const lbl = NUTRIENT_LABELS[key] || key;
      const parts: string[] = [];
      if (cfg.min !== null && cfg.min !== undefined) parts.push(`≥${cfg.min}`);
      if (cfg.max !== null && cfg.max !== undefined) parts.push(`≤${cfg.max}`);
      activeConstraintParts.push(`${lbl}: ${parts.join(', ') || 'attivo'}`);
    }
  }

  // Handle cell single click -> show details inspector
  const handleCellClick = (dateKey: string, cat: MealCategory, mealName: string) => {
    if (swapMode) {
      handleSwapSelection(dateKey, cat);
      return;
    }

    if (!mealName || mealName === '-') {
      setSelectedCell(null);
      return;
    }

    const portion = data.porzioni[dateKey]?.[cat] || 1.0;
    setSelectedCell({
      date: dateKey,
      cat,
      mealName,
      portion,
    });
  };

  // Handle cell double click -> open assign modal
  const handleCellDblClick = (dateKey: string, cat: MealCategory) => {
    if (swapMode) return;
    setAssignTarget({ date: dateKey, category: cat });
    setManualMealInput('');
  };

  // Day summary click on header
  const handleDaySummaryClick = (dateKey: string) => {
    const dayPlan = data.plan[dateKey] || {
      Colazione: '-',
      Pranzo: '-',
      Cena: '-',
      Merenda: '-',
    };

    const totals = { kcal: 0, proteine: 0, carboidrati: 0, grassi: 0 };
    let hasMeals = false;

    for (const cat of MEAL_CATEGORIES) {
      const mealName = dayPlan[cat];
      if (!mealName || mealName === '-') continue;
      const mealData = data.pasti[mealName];
      if (!mealData) continue;
      const portion = data.porzioni[dateKey]?.[cat] || 1.0;
      const nut = calculateMealNutrients(mealName, data.pasti, data.nvalues, portion);
      totals.kcal += nut.kcal;
      totals.proteine += nut.proteine;
      totals.carboidrati += nut.carboidrati;
      totals.grassi += nut.grassi;
      hasMeals = true;
    }

    if (!hasMeals) {
      setStatusMessage(`📅 ${dateKey}: nessun pasto con ingredienti registrati.`);
    } else {
      setStatusMessage(
        `📅 ${dateKey} — Totali: ${Math.round(totals.kcal)} kcal | ${totals.proteine.toFixed(1)}g prot | ${totals.carboidrati.toFixed(1)}g carb | ${totals.grassi.toFixed(1)}g grassi`
      );
    }
  };

  // Swap mechanism
  const handleSwapSelection = (dateKey: string, cat: MealCategory) => {
    if (!swapFirstCell) {
      setSwapFirstCell({ date: dateKey, cat });
      onNotify('info', `Selezionata prima cella (${dateKey}, ${cat}). Clicca sulla seconda cella per scambiare.`);
    } else {
      if (swapFirstCell.date === dateKey && swapFirstCell.cat === cat) {
        setSwapFirstCell(null);
        setSwapMode(false);
        onNotify('info', 'Scambio annullato.');
        return;
      }
      onSwapMeals(swapFirstCell.date, swapFirstCell.cat, dateKey, cat);
      setSwapFirstCell(null);
      setSwapMode(false);
      onNotify('success', 'Pasti scambiati con successo!');
    }
  };

  // Open Editor Modal for a specific template
  const handleOpenEditModal = (name?: string) => {
    if (name && data.pasti[name]) {
      const mealData = data.pasti[name];
      setEditingTemplateName(name);
      setEditMealName(name);
      setEditIngredients(JSON.parse(JSON.stringify(getMealIngredients(mealData))));
      const cat = getMealCategory(mealData);
      if (Array.isArray(cat)) {
        setEditCategories(cat);
      } else if (typeof cat === 'string' && cat.trim()) {
        setEditCategories(cat.split(',').map((c) => c.trim()));
      } else {
        setEditCategories([]);
      }
      setEditExclude(
        typeof mealData === 'object' && !Array.isArray(mealData)
          ? Boolean(mealData.exclude)
          : false
      );
    } else {
      // New meal
      setEditingTemplateName(null);
      setEditMealName('');
      setEditIngredients([]);
      setEditCategories([]);
      setEditExclude(false);
    }
    setNewIngFood('');
    setNewIngQty('');
    setIsEditorModalOpen(true);
  };

  // Save changes from Editor Modal
  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = editMealName.trim();
    if (!trimmed) {
      onNotify('error', 'Il nome del pasto è obbligatorio.');
      return;
    }

    onSaveMealTemplate(
      editingTemplateName,
      trimmed,
      editIngredients,
      editCategories,
      editExclude
    );

    setIsEditorModalOpen(false);
    onNotify('success', `Pasto '${trimmed}' salvato con successo!`);
  };

  // Delete template
  const handleDeleteTemplateFromModal = () => {
    if (!editingTemplateName) return;
    onDeleteMealTemplate(editingTemplateName);
    setIsEditorModalOpen(false);
    onNotify('info', `Pasto '${editingTemplateName}' eliminato.`);
  };

  // Add ingredient in modal
  const handleAddIngredientInModal = () => {
    if (!newIngFood) {
      alert('Seleziona un ingrediente dal database!');
      return;
    }
    const q = parseFloat(newIngQty.replace(',', '.'));
    if (isNaN(q) || q <= 0) {
      alert('Inserisci una quantità valida (maggiore di 0)!');
      return;
    }

    setEditIngredients((prev) => {
      const existing = prev.find((i) => i[0] === newIngFood);
      if (existing) {
        return prev.map((i) =>
          i[0] === newIngFood ? [i[0], Math.round((i[1] + q) * 100) / 100] : i
        );
      }
      return [...prev, [newIngFood, q]];
    });

    setNewIngFood('');
    setNewIngQty('');
  };

  const handleUpdateIngQty = (idx: number, val: string) => {
    const q = parseFloat(val);
    if (!isNaN(q) && q >= 0) {
      setEditIngredients((prev) =>
        prev.map((item, i) => (i === idx ? [item[0], q] : item))
      );
    }
  };

  const handleRemoveIngFromModal = (idx: number) => {
    setEditIngredients((prev) => prev.filter((_, i) => i !== idx));
  };

  // Calculate live nutrition in editor modal
  const modalNutrients = { kcal: 0, proteine: 0, carboidrati: 0, grassi: 0 };
  let modalCost = 0;
  let hasMissingPriceInModal = false;
  for (const [food, qty] of editIngredients) {
    const info = data.nvalues[food];
    if (info) {
      modalNutrients.kcal += (info.kcal || 0) * qty;
      modalNutrients.proteine += (info.proteine || 0) * qty;
      modalNutrients.carboidrati += (info.carboidrati || 0) * qty;
      modalNutrients.grassi += (info.grassi || 0) * qty;
    }
    const price = data.prices[food];
    if (price !== undefined && price > 0) {
      modalCost += price * qty;
    } else {
      hasMissingPriceInModal = true;
    }
  }

  // Filter templates
  const allTemplates = Object.entries(data.pasti).map(([name, mealData]) => {
    const ings = getMealIngredients(mealData);
    const cat = getMealCategory(mealData);
    const categoriesList = Array.isArray(cat)
      ? cat
      : typeof cat === 'string' && cat.trim()
      ? cat.split(',').map((c) => c.trim())
      : [];
    const isExcluded =
      typeof mealData === 'object' && !Array.isArray(mealData)
        ? Boolean(mealData.exclude)
        : false;
    const nut = calculateMealNutrients(name, data.pasti, data.nvalues);
    const cost = calculateMealCost(name, data.pasti, data.prices);

    return {
      name,
      ingredients: ings,
      categories: categoriesList,
      isExcluded,
      nutrients: nut,
      cost,
    };
  });

  const filteredTemplates = allTemplates.filter((item) => {
    // Search filter
    const matchesSearch =
      item.name.toLowerCase().includes(mealSearch.toLowerCase()) ||
      item.ingredients.some(([food]) =>
        food.toLowerCase().includes(mealSearch.toLowerCase())
      );

    // Category filter
    let matchesCategory = true;
    if (selectedCategoryFilter !== 'TUTTI') {
      matchesCategory = item.categories.includes(selectedCategoryFilter);
    }

    return matchesSearch && matchesCategory;
  });

  // Calculate selected cell nutrients for inspector
  const currentPlanMeal = selectedCell ? data.plan[selectedCell.date]?.[selectedCell.cat] : null;
  const inspectorData = selectedCell && currentPlanMeal && currentPlanMeal !== '-'
    ? (() => {
        const mealData = data.pasti[currentPlanMeal];
        const ings = mealData ? getMealIngredients(mealData) : [];
        const nut = calculateMealNutrients(
          currentPlanMeal,
          data.pasti,
          data.nvalues,
          selectedCell.portion
        );
        const cost = calculateMealCost(
          currentPlanMeal,
          data.pasti,
          data.prices,
          selectedCell.portion
        );
        return { ings, nut, cost };
      })()
    : null;

  return (
    <div>
      {/* 5-Day Navigation Header */}
      <div className="card" style={{ marginBottom: '15px', padding: '12px 20px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
            marginBottom: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={() => setOffset((prev) => Math.max(0, prev - 5))}
              className="btn btn-teal"
              disabled={offset <= 0}
              style={{
                fontSize: '14pt',
                padding: '2px 10px',
                lineHeight: 1,
                opacity: offset <= 0 ? 0.4 : 1,
                cursor: offset <= 0 ? 'not-allowed' : 'pointer',
              }}
              title="5 giorni precedenti"
            >
              &laquo;
            </button>

            <span className="card-title" style={{ marginBottom: 0 }}>
              {offset === 0
                ? `Piano Alimentare dei prossimi 5 giorni (${dateKeys[0].display} - ${dateKeys[4].display})`
                : `Piano Alimentare (${dateKeys[0].display} - ${dateKeys[4].display})`}
            </span>

            <button
              type="button"
              onClick={() => setOffset((prev) => prev + 5)}
              className="btn btn-teal"
              style={{ fontSize: '14pt', padding: '2px 10px', lineHeight: 1 }}
              title="5 giorni successivi"
            >
              &raquo;
            </button>
          </div>

          {offset !== 0 && (
            <button
              type="button"
              onClick={() => setOffset(0)}
              className="btn btn-blue"
              style={{ fontSize: '9pt', padding: '4px 10px' }}
            >
              Torna a oggi
            </button>
          )}
        </div>
        <div
          style={{
            background: 'var(--bg-card-hover)',
            padding: '8px 12px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '9pt',
            color: 'var(--text-muted)',
            textAlign: 'center',
            border: '1px solid var(--border-color)',
          }}
        >
          {statusMessage}
        </div>
      </div>

      {/* Weekly Planner Grid */}
      <div className="table-responsive">
        <table className="treeview">
          <thead>
            <tr>
              <th>Orario</th>
              {dateKeys.map((dk) => (
                <th
                  key={dk.key}
                  className="clickable"
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleDaySummaryClick(dk.key)}
                  title="Clicca per visualizzare i totali nutrizionali giornalieri"
                >
                  {dk.display}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MEAL_CATEGORIES.map((cat) => (
              <tr key={cat}>
                <td className="font-bold">{cat}</td>
                {dateKeys.map((dk) => {
                  const mealName = data.plan[dk.key]?.[cat] || '-';
                  const portion = data.porzioni[dk.key]?.[cat];
                  const isToday = dk.key === todayKey;
                  const isSelectedForSwap =
                    swapFirstCell?.date === dk.key && swapFirstCell?.cat === cat;
                  const isCellInspected =
                    selectedCell?.date === dk.key && selectedCell?.cat === cat;

                  return (
                    <td
                      key={dk.key}
                      className={`clickable ${isSelectedForSwap ? 'selected' : ''}`}
                      style={{
                        background: isCellInspected ? 'var(--bg-card-hover)' : undefined,
                        border: isCellInspected ? '2px solid var(--primary)' : undefined,
                      }}
                      onClick={() => handleCellClick(dk.key, cat, mealName)}
                      onDoubleClick={() => handleCellDblClick(dk.key, cat)}
                      title="Click: dettagli e porzione | Doppio click: assegna pasto"
                    >
                      <span className="meal-name">{formatMealName(mealName)}</span>
                      {mealName !== '-' && portion && portion !== 1 && (
                        <span className="portion-badge" title={`Porzione: ${portion}x`}>
                          &times;{portion}
                        </span>
                      )}
                      {mealName !== '-' && isToday && (
                        <span className="cell-actions">
                          <button
                            type="button"
                            className="btn-icon"
                            title="Aggiungi al diario di oggi"
                            onClick={(e) => {
                              e.stopPropagation();
                              onAddPlanToDiary(mealName, dk.key, cat);
                            }}
                          >
                            &#128221;
                          </button>
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modern Planned Meal Inspector (when a meal in the grid is clicked) */}
      {selectedCell && inspectorData && (
        <div
          className="card"
          style={{
            borderLeft: '4px solid var(--primary)',
            background: 'var(--bg-card)',
            marginBottom: '16px',
            animation: 'fadeIn 0.15s ease-out',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px',
              marginBottom: '10px',
            }}
          >
            <div>
              <span
                style={{
                  fontSize: '8pt',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                  letterSpacing: '0.05em',
                }}
              >
                Pasto Pianificato: {selectedCell.cat} &bull; {formatItalianDate(selectedCell.date)}
              </span>
              <h3 style={{ fontSize: '12pt', fontWeight: 700, margin: '2px 0 0' }}>
                {selectedCell.mealName}
                {selectedCell.portion !== 1 && (
                  <span className="portion-badge" style={{ marginLeft: '8px' }}>
                    Porzione &times;{selectedCell.portion.toFixed(2)}
                  </span>
                )}
              </h3>
            </div>

            <div className="flex gap-5">
              {selectedCell.date === todayKey && (
                <button
                  type="button"
                  className="btn btn-green"
                  style={{ fontSize: '8.5pt', padding: '4px 10px' }}
                  onClick={() =>
                    onAddPlanToDiary(
                      selectedCell.mealName,
                      selectedCell.date,
                      selectedCell.cat
                    )
                  }
                >
                  📝 Trascrivi nel Diario
                </button>
              )}
              {data.pasti[selectedCell.mealName] && (
                <button
                  type="button"
                  className="btn btn-teal"
                  style={{ fontSize: '8.5pt', padding: '4px 10px' }}
                  onClick={() => handleOpenEditModal(selectedCell.mealName)}
                >
                  ✏️ Modifica Ricetta
                </button>
              )}
              <button
                type="button"
                className="btn-icon"
                style={{ padding: '4px 8px', fontSize: '9pt' }}
                onClick={() => setSelectedCell(null)}
                title="Chiudi dettaglio"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Macro strip for inspected meal */}
          <div className="meal-macros-strip">
            <div className="macro-item">
              <span className="macro-lbl">Calorie</span>
              <span className="macro-val">{Math.round(inspectorData.nut.kcal)} kcal</span>
            </div>
            <div className="macro-item">
              <span className="macro-lbl">Proteine</span>
              <span className="macro-val">{inspectorData.nut.proteine.toFixed(1)} g</span>
            </div>
            <div className="macro-item">
              <span className="macro-lbl">Carboidrati</span>
              <span className="macro-val">{inspectorData.nut.carboidrati.toFixed(1)} g</span>
            </div>
            <div className="macro-item">
              <span className="macro-lbl">Grassi</span>
              <span className="macro-val">{inspectorData.nut.grassi.toFixed(1)} g</span>
            </div>
            <div className="macro-item">
              <span className="macro-lbl">Costo stimato</span>
              <span className="macro-val" style={{ color: 'var(--success)' }}>
                {inspectorData.cost !== null ? `${inspectorData.cost.toFixed(2)} €` : 'N/D'}
              </span>
            </div>
          </div>

          {/* Scaled Ingredients list */}
          <div style={{ marginTop: '8px' }}>
            <span
              style={{
                fontSize: '8pt',
                fontWeight: 700,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                display: 'block',
                marginBottom: '4px',
              }}
            >
              Ingredienti pesati per questa porzione:
            </span>
            <div className="meal-ingredients-tags">
              {inspectorData.ings.map(([food, qty], idx) => (
                <span key={idx} className="ing-tag font-bold">
                  {food} &mdash; {(qty * selectedCell.portion).toFixed(2)} hg
                </span>
              ))}
              {inspectorData.ings.length === 0 && (
                <span className="hint">Nessun ingrediente specificato nel database.</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons Toolbar */}
      <div className="card">
        <div className="flex items-center gap-10 flex-wrap">
          <button
            type="button"
            className="btn btn-purple"
            onClick={() => onOptimize(offset)}
          >
            Ottimizza Piano
          </button>

          <button
            type="button"
            className="btn btn-red"
            disabled={!hasPlanInWindow}
            style={{
              opacity: !hasPlanInWindow ? 0.5 : 1,
              cursor: !hasPlanInWindow ? 'not-allowed' : 'pointer',
            }}
            onClick={() => {
              if (!hasPlanInWindow) return;
              onClearPlanRange(dateKeys.map((d) => d.key));
              dateKeys.forEach((dk) => {
                MEAL_CATEGORIES.forEach((cat) => {
                  onAssignMeal(dk.key, cat, '-');
                });
              });
              setSelectedCell(null);
              setStatusMessage('Clicca su una colonna per vedere il totale del giorno.');
              onNotify('success', 'Piano settimanale svuotato con successo!');
            }}
          >
            Svuota Piano
          </button>

          <button
            type="button"
            className="btn btn-teal"
            onClick={onOpenConstraints}
          >
            Imposta Vincoli
          </button>

          <button
            type="button"
            className={`btn ${swapMode ? 'btn-orange' : 'btn-teal'}`}
            onClick={() => {
              setSwapMode((prev) => !prev);
              setSwapFirstCell(null);
              if (!swapMode) {
                onNotify('info', 'Modalità Scambia Pasti: clicca su due celle della tabella per scambiarle.');
              }
            }}
          >
            {swapMode ? 'Annulla Scambio' : 'Scambia Pasti'}
          </button>

          <span className="hint" style={{ margin: 0 }}>
            Riempi i giorni vuoti minimizzando il costo e rispettando i vincoli nutrizionali.
          </span>
        </div>
      </div>

      {/* Active constraints display */}
      <div className="card">
        {activeConstraintParts.length > 0 ? (
          <div className="flex items-center gap-10 flex-wrap">
            <span className="text-green font-bold">Vincoli attivi:</span>
            <span className="label-muted">
              {activeConstraintParts.join('  |  ')}
            </span>
          </div>
        ) : (
          <span className="hint">
            Nessun vincolo nutrizionale attivo &mdash; usa "Imposta Vincoli" per aggiungerne.
          </span>
        )}
      </div>

      {/* =========================================================================
          REDESIGNED MEAL CATALOG & RECIPE MANAGEMENT (Bottom of Planner)
          Replaces the old clunky split list/form with an organized card catalog & modal
          ========================================================================= */}
      <div className="card" id="mealManagerCard">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '14px',
          }}
        >
          <div>
            <div className="card-title" style={{ marginBottom: '2px' }}>
              Catalogo Pasti Rapidi &amp; Ricette
            </div>
            <span className="hint" style={{ margin: 0 }}>
              Archivio dei pasti salvati per la pianificazione manuale e l'ottimizzazione automatica.
            </span>
          </div>

          <button
            type="button"
            className="btn btn-green"
            onClick={() => handleOpenEditModal()}
            style={{ padding: '8px 16px', fontSize: '9pt' }}
          >
            + Crea Nuovo Pasto
          </button>
        </div>

        {/* Filter Toolbar: Search + Category Pills */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
            paddingBottom: '12px',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          {/* Category Filter Buttons */}
          <div className="category-filter-bar">
            {['TUTTI', ...MEAL_CATEGORIES].map((cat) => (
              <button
                key={cat}
                type="button"
                className={`cat-filter-btn ${
                  selectedCategoryFilter === cat ? 'active' : ''
                }`}
                onClick={() => setSelectedCategoryFilter(cat)}
              >
                {cat === 'TUTTI' ? 'Tutti i pasti' : cat}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div style={{ minWidth: '220px', flex: '1', maxWidth: '320px' }}>
            <input
              type="text"
              placeholder="🔍 Cerca pasto o ingrediente..."
              value={mealSearch}
              onChange={(e) => setMealSearch(e.target.value)}
              style={{ fontSize: '9pt', padding: '6px 12px' }}
            />
          </div>
        </div>

        {/* Modern Meal Cards Grid */}
        <div className="meal-grid">
          {filteredTemplates.map((meal) => (
            <div key={meal.name} className="meal-card">
              <div>
                {/* Header: Name + Exclude Badge */}
                <div className="meal-card-title">
                  <span>{meal.name}</span>
                  {meal.isExcluded && (
                    <span className="badge-exclude" title="Escluso dall'ottimizzatore">
                      Escluso
                    </span>
                  )}
                </div>

                {/* Categories */}
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '6px' }}>
                  {meal.categories.map((c) => (
                    <span key={c} className="meal-category-pill">
                      {c}
                    </span>
                  ))}
                  {meal.categories.length === 0 && (
                    <span className="meal-category-pill">Tutti i pasti</span>
                  )}
                </div>

                {/* Macro summary strip */}
                <div className="meal-macros-strip">
                  <div className="macro-item">
                    <span className="macro-lbl">Kcal</span>
                    <span className="macro-val">{Math.round(meal.nutrients.kcal)}</span>
                  </div>
                  <div className="macro-item">
                    <span className="macro-lbl">Pro</span>
                    <span className="macro-val">{meal.nutrients.proteine.toFixed(1)}g</span>
                  </div>
                  <div className="macro-item">
                    <span className="macro-lbl">Carb</span>
                    <span className="macro-val">{meal.nutrients.carboidrati.toFixed(1)}g</span>
                  </div>
                  <div className="macro-item">
                    <span className="macro-lbl">Grassi</span>
                    <span className="macro-val">{meal.nutrients.grassi.toFixed(1)}g</span>
                  </div>
                  <div className="macro-item">
                    <span className="macro-lbl">Costo</span>
                    <span className="macro-val" style={{ color: 'var(--success)' }}>
                      {meal.cost !== null ? `${meal.cost.toFixed(2)}€` : 'N/D'}
                    </span>
                  </div>
                </div>

                {/* Ingredients preview tags */}
                <div className="meal-ingredients-tags">
                  {meal.ingredients.map(([food, qty], i) => (
                    <span key={i} className="ing-tag">
                      {food} ({qty} hg)
                    </span>
                  ))}
                  {meal.ingredients.length === 0 && (
                    <span className="hint" style={{ margin: 0 }}>
                      Nessun ingrediente
                    </span>
                  )}
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="meal-card-footer">
                <span className="hint" style={{ margin: 0, fontSize: '8pt' }}>
                  {meal.ingredients.length} ingredient{meal.ingredients.length === 1 ? 'e' : 'i'}
                </span>
                <div className="flex gap-5">
                  <button
                    type="button"
                    className="btn btn-teal"
                    style={{ padding: '4px 10px', fontSize: '8.5pt' }}
                    onClick={() => handleOpenEditModal(meal.name)}
                  >
                    ✏️ Modifica
                  </button>
                  <button
                    type="button"
                    className="btn btn-red"
                    style={{ padding: '4px 8px', fontSize: '8.5pt' }}
                    onClick={() => {
                      onDeleteMealTemplate(meal.name);
                      onNotify('info', `Pasto '${meal.name}' eliminato.`);
                    }}
                    title="Elimina pasto"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filteredTemplates.length === 0 && (
            <div
              style={{
                gridColumn: '1 / -1',
                textAlign: 'center',
                padding: '40px 20px',
                background: 'var(--bg-canvas)',
                borderRadius: 'var(--radius-md)',
                border: '1px dashed var(--border-color)',
              }}
            >
              <p className="font-bold" style={{ marginBottom: '6px' }}>
                Nessun pasto trovato per i criteri selezionati.
              </p>
              <button
                type="button"
                className="btn btn-green"
                onClick={() => handleOpenEditModal()}
                style={{ marginTop: '8px' }}
              >
                + Crea Nuovo Pasto Rapido
              </button>
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          MEAL RECIPE & INGREDIENT EDITOR MODAL
          ========================================================================= */}
      {isEditorModalOpen && (
        <div
          className="modal-overlay"
          onClick={() => setIsEditorModalOpen(false)}
        >
          <div
            className="modal-content"
            style={{ width: '680px', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sheet-handle" />
            <div className="card-title" style={{ justifyContent: 'space-between' }}>
              <span>
                {editingTemplateName ? `Modifica Pasto: ${editingTemplateName}` : 'Nuovo Pasto Rapido'}
              </span>
              <button
                type="button"
                className="btn-icon"
                onClick={() => setIsEditorModalOpen(false)}
                style={{ fontSize: '11pt' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveModal}>
              {/* Meal Name Input */}
              <div className="mb-10">
                <label className="label">Nome Pasto:</label>
                <input
                  type="text"
                  value={editMealName}
                  onChange={(e) => setEditMealName(e.target.value)}
                  placeholder="es. Risotto ai Frutti di Mare"
                  required
                  autoFocus
                />
              </div>

              {/* Categories */}
              <div className="mb-10">
                <label className="label">Categorie compatibili:</label>
                <div className="radio-group" style={{ marginTop: '6px' }}>
                  {MEAL_CATEGORIES.map((cat) => (
                    <label key={cat} style={{ marginRight: '10px' }}>
                      <input
                        type="checkbox"
                        checked={editCategories.includes(cat)}
                        onChange={() => {
                          setEditCategories((prev) =>
                            prev.includes(cat)
                              ? prev.filter((c) => c !== cat)
                              : [...prev, cat]
                          );
                        }}
                      />
                      {cat}
                    </label>
                  ))}
                </div>
              </div>

              {/* Live Nutritional & Cost Summary */}
              <div
                className="meal-macros-strip"
                style={{ background: 'var(--bg-card-hover)', margin: '14px 0' }}
              >
                <div className="macro-item">
                  <span className="macro-lbl">Calorie Totali</span>
                  <span className="macro-val">{Math.round(modalNutrients.kcal)} kcal</span>
                </div>
                <div className="macro-item">
                  <span className="macro-lbl">Proteine</span>
                  <span className="macro-val">{modalNutrients.proteine.toFixed(1)} g</span>
                </div>
                <div className="macro-item">
                  <span className="macro-lbl">Carboidrati</span>
                  <span className="macro-val">{modalNutrients.carboidrati.toFixed(1)} g</span>
                </div>
                <div className="macro-item">
                  <span className="macro-lbl">Grassi</span>
                  <span className="macro-val">{modalNutrients.grassi.toFixed(1)} g</span>
                </div>
                <div className="macro-item">
                  <span className="macro-lbl">Costo Totale</span>
                  <span
                    className="macro-val"
                    style={{ color: hasMissingPriceInModal ? 'var(--warning)' : 'var(--success)' }}
                  >
                    {hasMissingPriceInModal
                      ? `${modalCost.toFixed(2)} € (parziale)`
                      : `${modalCost.toFixed(2)} €`}
                  </span>
                </div>
              </div>

              {/* Ingredients Table */}
              <div className="mb-10">
                <label className="label">Ingredienti (quantità in ettogrammi - 1 hg = 100g):</label>
                <table style={{ marginTop: '6px', fontSize: '9pt' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left' }}>Ingrediente</th>
                      <th style={{ width: '120px' }}>Quantità (hg)</th>
                      <th style={{ width: '120px' }}>Kcal stimate</th>
                      <th style={{ width: '70px' }}>Azione</th>
                    </tr>
                  </thead>
                  <tbody>
                    {editIngredients.map(([food, qty], idx) => {
                      const itemKcal = (data.nvalues[food]?.kcal || 0) * qty;
                      return (
                        <tr key={idx}>
                          <td style={{ textAlign: 'left' }}>
                            <span className="font-bold">{food}</span>
                          </td>
                          <td>
                            <input
                              type="number"
                              step="any"
                              min="0.01"
                              value={qty}
                              onChange={(e) => handleUpdateIngQty(idx, e.target.value)}
                              style={{ width: '85px', padding: '4px 8px' }}
                            />
                          </td>
                          <td style={{ fontVariantNumeric: 'tabular-nums' }}>
                            {Math.round(itemKcal)} kcal
                          </td>
                          <td>
                            <button
                              type="button"
                              className="btn btn-red"
                              style={{ padding: '3px 8px', fontSize: '8pt' }}
                              onClick={() => handleRemoveIngFromModal(idx)}
                              title="Rimuovi ingrediente"
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {editIngredients.length === 0 && (
                      <tr>
                        <td colSpan={4} className="hint" style={{ padding: '16px' }}>
                          Nessun ingrediente in questo pasto. Usa il modulo sottostante per aggiungerne uno.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Add New Ingredient Bar */}
              <div
                style={{
                  border: '1px dashed var(--border-color)',
                  padding: '12px 14px',
                  marginBottom: '16px',
                  background: 'var(--bg-canvas)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <label
                  className="label"
                  style={{ fontSize: '8.5pt', marginBottom: '6px', display: 'block' }}
                >
                  ➕ Aggiungi Ingrediente dal Database Alimenti:
                </label>
                <div className="flex gap-10 items-center">
                  <select
                    value={newIngFood}
                    onChange={(e) => setNewIngFood(e.target.value)}
                    style={{ flex: 1, fontSize: '9pt' }}
                  >
                    <option value="">-- Seleziona alimento --</option>
                    {Object.keys(data.nvalues)
                      .sort((a, b) => a.localeCompare(b, 'it', { sensitivity: 'base' }))
                      .map((f) => (
                        <option key={f} value={f}>
                          {f} ({data.nvalues[f]?.kcal || 0} kcal/hg)
                        </option>
                      ))}
                  </select>
                  <input
                    type="number"
                    step="any"
                    min="0.01"
                    placeholder="hg (es. 1.5)"
                    value={newIngQty}
                    onChange={(e) => setNewIngQty(e.target.value)}
                    style={{ width: '100px', fontSize: '9pt' }}
                  />
                  <button
                    type="button"
                    className="btn btn-teal"
                    onClick={handleAddIngredientInModal}
                    style={{ padding: '6px 14px', whiteSpace: 'nowrap' }}
                  >
                    Aggiungi
                  </button>
                </div>
              </div>

              {/* Optimizer Exclusion Toggle */}
              <div className="mb-10">
                <label style={{ fontSize: '9pt', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    checked={editExclude}
                    onChange={(e) => setEditExclude(e.target.checked)}
                  />
                  <span>
                    <strong>Escludi dall'ottimizzatore automatico:</strong> non assegnare automaticamente questo pasto con il solver PuLP.
                  </span>
                </label>
              </div>

              {/* Modal Footer Buttons */}
              <div className="flex gap-10" style={{ marginTop: '18px' }}>
                <button type="submit" className="btn btn-green w-full">
                  Salva Pasto Rapido
                </button>
                {editingTemplateName && (
                  <button
                    type="button"
                    className="btn btn-red"
                    onClick={handleDeleteTemplateFromModal}
                    style={{ padding: '7px 16px', whiteSpace: 'nowrap' }}
                  >
                    Elimina Pasto
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-teal"
                  onClick={() => setIsEditorModalOpen(false)}
                  style={{ padding: '7px 16px' }}
                >
                  Annulla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {assignTarget && (
        <div
          className="modal-overlay"
          onClick={() => setAssignTarget(null)}
        >
          <div
            className="modal-content"
            style={{ width: '440px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sheet-handle" />
            <div className="card-title">
              Associa Pasto ({assignTarget.category} &mdash; {formatItalianDate(assignTarget.date)})
            </div>

            <div className="food-list" style={{ maxHeight: '250px', marginBottom: '12px' }}>
              <button
                type="button"
                className="food-item-btn"
                style={{ color: '#dc2626', fontWeight: 600 }}
                onClick={() => {
                  onAssignMeal(assignTarget.date, assignTarget.category, '-');
                  setAssignTarget(null);
                }}
              >
                [ Svuota Cella ]
              </button>
              {Object.keys(data.pasti)
                .sort((a, b) => a.localeCompare(b, 'it', { sensitivity: 'base' }))
                .map((t) => (
                  <button
                    key={t}
                    type="button"
                    className="food-item-btn"
                    onClick={() => {
                      onAssignMeal(assignTarget.date, assignTarget.category, t);
                      setAssignTarget(null);
                    }}
                  >
                    {t}
                  </button>
                ))}
              {Object.keys(data.pasti).length === 0 && (
                <div className="hint" style={{ padding: '10px' }}>
                  Nessun pasto rapido salvato.
                </div>
              )}
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', padding: '10px 0', marginBottom: '10px' }}>
              <label className="label-muted" style={{ fontSize: '8.5pt' }}>
                Oppure inserisci un nome pasto manuale:
              </label>
              <div className="flex gap-5" style={{ marginTop: '4px' }}>
                <input
                  type="text"
                  placeholder="Nome pasto..."
                  value={manualMealInput}
                  onChange={(e) => setManualMealInput(e.target.value)}
                  style={{ width: '100%', padding: '6px 10px', fontSize: '9pt' }}
                />
                <button
                  type="button"
                  className="btn btn-green"
                  style={{ padding: '6px 14px', fontSize: '9pt', whiteSpace: 'nowrap' }}
                  onClick={() => {
                    if (manualMealInput.trim()) {
                      onAssignMeal(assignTarget.date, assignTarget.category, manualMealInput.trim());
                      setAssignTarget(null);
                    }
                  }}
                >
                  Inserisci
                </button>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-red w-full"
              onClick={() => setAssignTarget(null)}
            >
              Annulla
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
