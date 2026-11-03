import React, { useState } from 'react';
import { AppStateData } from '../services/storage';
import { EatenItem, MealCategory } from '../types';
import { MEAL_CATEGORIES } from '../constants';

interface HistoryScreenProps {
  data: AppStateData;
  onSaveMealTemplate: (
    name: string,
    ingredients: EatenItem[],
    categories: MealCategory[]
  ) => void;
  onNotify: (type: 'success' | 'error' | 'warning' | 'info', msg: string) => void;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({
  data,
  onSaveMealTemplate,
  onNotify,
}) => {
  const dateList = Object.keys(data.eaten).sort().reverse();
  const [selectedDate, setSelectedDate] = useState<string | null>(
    dateList.length > 0 ? dateList[0] : null
  );

  const [quickMealIngredients, setQuickMealIngredients] = useState<EatenItem[]>([]);
  const [mealNameInput, setMealNameInput] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<MealCategory[]>([]);

  const selectedPasti: EatenItem[] = selectedDate ? data.eaten[selectedDate] || [] : [];

  const handleAddIngredient = (food: string, qty: number) => {
    setQuickMealIngredients((prev) => {
      const existing = prev.find((i) => i[0] === food);
      if (existing) {
        return prev.map((i) =>
          i[0] === food ? [i[0], Math.round((i[1] + qty) * 100) / 100] : i
        );
      }
      return [...prev, [food, qty]];
    });
  };

  const handleRemoveIngredient = (idx: number) => {
    setQuickMealIngredients((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleCategoryToggle = (cat: MealCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleSaveMeal = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = mealNameInput.trim();
    if (!trimmed) {
      onNotify('error', 'Inserisci un nome per il Pasto Rapido!');
      return;
    }
    if (quickMealIngredients.length === 0) {
      onNotify('error', 'Aggiungi almeno un ingrediente!');
      return;
    }

    onSaveMealTemplate(trimmed, quickMealIngredients, selectedCategories);
    setMealNameInput('');
    setQuickMealIngredients([]);
    setSelectedCategories([]);
    onNotify('success', `Pasto '${trimmed}' salvato correttamente!`);
  };

  return (
    <div className="row">
      {/* Col 1: Select Date */}
      <div className="col">
        <div className="card">
          <div className="card-title">Seleziona Data:</div>
          <div className="food-list" style={{ maxHeight: '350px' }}>
            {dateList.map((d) => (
              <div
                key={d}
                className={`food-item ${selectedDate === d ? 'selected' : ''}`}
                onClick={() => setSelectedDate(d)}
              >
                {d}
              </div>
            ))}
            {dateList.length === 0 && (
              <div className="hint" style={{ padding: '16px' }}>
                Nessuna cronologia pasti registrata.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Col 2: Eaten Foods */}
      <div className="col">
        <div className="card">
          <div className="card-title">
            {selectedDate ? `Consumati il ${selectedDate}:` : 'Pasti Consumati:'}
          </div>
          <div className="hint">
            Doppio click (o click) su un cibo per aggiungerlo al Pasto Rapido.
          </div>
          <div className="food-list" style={{ maxHeight: '350px' }}>
            {selectedPasti.map(([food, qty], idx) => (
              <div
                key={idx}
                className="food-item flex items-center"
                style={{ justifyContent: 'space-between' }}
                onClick={() => handleAddIngredient(food, qty)}
                onDoubleClick={() => handleAddIngredient(food, qty)}
                title="Clicca per aggiungere al pasto rapido"
              >
                <span>
                  <strong>{food}</strong> - {qty} hg
                </span>
                <button
                  type="button"
                  className="btn-icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddIngredient(food, qty);
                  }}
                  title="Aggiungi al pasto rapido"
                >
                  ➕
                </button>
              </div>
            ))}
            {selectedDate && selectedPasti.length === 0 && (
              <div className="hint" style={{ padding: '16px' }}>
                Nessun alimento registrato per questa data.
              </div>
            )}
            {!selectedDate && (
              <div className="hint" style={{ padding: '16px' }}>
                Seleziona una data a sinistra
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Col 3: Quick Meal Builder */}
      <div className="col">
        <div className="card">
          <div className="card-title">Crea Pasto Rapido</div>
          <div className="hint">
            Fai doppio click sui cibi al centro per aggiungerli, poi dai un nome al pasto e salvalo come Pasto Rapido.
          </div>

          <div
            className="food-list"
            style={{ maxHeight: '160px', marginBottom: '12px' }}
          >
            {quickMealIngredients.map(([food, qty], idx) => (
              <div
                key={idx}
                className="food-item flex items-center"
                style={{ justifyContent: 'space-between', padding: '6px 10px' }}
              >
                <span>
                  {food} - {qty} hg
                </span>
                <button
                  type="button"
                  className="btn btn-red"
                  style={{ padding: '1px 6px', fontSize: '8pt' }}
                  onClick={() => handleRemoveIngredient(idx)}
                >
                  ✕
                </button>
              </div>
            ))}
            {quickMealIngredients.length === 0 && (
              <div className="hint" style={{ padding: '16px', textAlign: 'center' }}>
                Seleziona elementi con doppio click
              </div>
            )}
          </div>

          <form onSubmit={handleSaveMeal}>
            <div className="mb-10">
              <label className="label">Nome del Pasto Rapido:</label>
              <input
                type="text"
                value={mealNameInput}
                onChange={(e) => setMealNameInput(e.target.value)}
                placeholder="es. Pranzo Leggero"
                required
              />
            </div>

            <div className="mb-10">
              <label className="label">
                Categoria/e pasto (opzionale - scelta multipla):
              </label>
              <div className="radio-group" style={{ marginTop: '6px' }}>
                {MEAL_CATEGORIES.map((cat) => (
                  <label key={cat}>
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(cat)}
                      onChange={() => handleCategoryToggle(cat)}
                    />
                    {cat}
                  </label>
                ))}
              </div>
            </div>

            <button type="submit" className="btn btn-green w-full">
              Salva come Pasto Rapido
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
