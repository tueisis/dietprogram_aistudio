import React, { useState } from 'react';
import { AppStateData } from '../services/storage';
import { getMealIngredients } from '../services/nutrition';

interface DatabaseScreenProps {
  data: AppStateData;
  onAddFood: (
    nome: string,
    kcal: number,
    proteine: number,
    carboidrati: number,
    grassi: number,
    prezzo: number
  ) => void;
  onUpdateFood: (oldName: string, field: string, value: string) => void;
  onDeleteFood: (nome: string) => void;
  onNotify: (type: 'success' | 'error' | 'warning' | 'info', msg: string) => void;
}

export const DatabaseScreen: React.FC<DatabaseScreenProps> = ({
  data,
  onAddFood,
  onUpdateFood,
  onDeleteFood,
  onNotify,
}) => {
  // Add form fields
  const [nome, setNome] = useState('');
  const [kcal, setKcal] = useState('');
  const [proteine, setProteine] = useState('');
  const [carboidrati, setCarboidrati] = useState('');
  const [grassi, setGrassi] = useState('');
  const [prezzo, setPrezzo] = useState('');

  // Edit modal
  const [editTarget, setEditTarget] = useState<{
    oldName: string;
    field: string;
    currentVal: string | number;
  } | null>(null);
  const [editValue, setEditValue] = useState('');

  // Collect all foods used in templates
  const foodsInMeals = new Set<string>();
  for (const mealData of Object.values(data.pasti)) {
    const ingredients = getMealIngredients(mealData);
    for (const [food] of ingredients) {
      foodsInMeals.add(food);
    }
  }

  // Active constrained nutrients
  const constrainedNutrients: ('kcal' | 'proteine' | 'carboidrati' | 'grassi')[] = [];
  for (const n of ['kcal', 'proteine', 'carboidrati', 'grassi'] as const) {
    const cfg = data.constraints[n];
    if (cfg && (cfg.min !== null || cfg.max !== null)) {
      constrainedNutrients.push(n);
    }
  }

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedNome = nome.trim();
    if (!trimmedNome) {
      onNotify('error', "Inserisci il nome dell'alimento!");
      return;
    }
    if (data.nvalues[trimmedNome]) {
      onNotify('error', `L'alimento '${trimmedNome}' esiste già!`);
      return;
    }

    const k = parseFloat(kcal.replace(',', '.')) || 0;
    const p = parseFloat(proteine.replace(',', '.')) || 0;
    const c = parseFloat(carboidrati.replace(',', '.')) || 0;
    const g = parseFloat(grassi.replace(',', '.')) || 0;
    const pr = parseFloat(prezzo.replace(',', '.')) || 0;

    onAddFood(trimmedNome, k, p, c, g, pr);
    setNome('');
    setKcal('');
    setProteine('');
    setCarboidrati('');
    setGrassi('');
    setPrezzo('');
    onNotify('success', `Alimento '${trimmedNome}' aggiunto con successo!`);
  };

  const handleOpenEdit = (foodName: string, field: string, currentVal: string | number) => {
    setEditTarget({ oldName: foodName, field, currentVal });
    setEditValue(String(currentVal));
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;

    onUpdateFood(editTarget.oldName, editTarget.field, editValue.trim());
    setEditTarget(null);
    onNotify('success', `Aggiornato campo ${editTarget.field}!`);
  };

  const sortedFoods = Object.keys(data.nvalues).sort((a, b) =>
    a.localeCompare(b, 'it', { sensitivity: 'base' })
  );

  return (
    <div>
      <div className="card">
        <form onSubmit={handleAddSubmit}>
          <div className="row items-center" style={{ flexWrap: 'wrap', gap: '8px' }}>
            <input
              type="text"
              placeholder="Nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
              style={{ flex: 2, minWidth: '140px' }}
            />
            <input
              type="number"
              step="any"
              placeholder="kcal/hg"
              value={kcal}
              onChange={(e) => setKcal(e.target.value)}
              style={{ flex: 1, minWidth: '90px' }}
            />
            <input
              type="number"
              step="any"
              placeholder="Pro/hg (g)"
              value={proteine}
              onChange={(e) => setProteine(e.target.value)}
              style={{ flex: 1, minWidth: '90px' }}
            />
            <input
              type="number"
              step="any"
              placeholder="Carb/hg (g)"
              value={carboidrati}
              onChange={(e) => setCarboidrati(e.target.value)}
              style={{ flex: 1, minWidth: '90px' }}
            />
            <input
              type="number"
              step="any"
              placeholder="Grassi/hg (g)"
              value={grassi}
              onChange={(e) => setGrassi(e.target.value)}
              style={{ flex: 1, minWidth: '90px' }}
            />
            <input
              type="number"
              step="any"
              placeholder="Costo/hg (€)"
              value={prezzo}
              onChange={(e) => setPrezzo(e.target.value)}
              style={{ flex: 1, minWidth: '100px' }}
            />
            <button
              type="submit"
              className="btn btn-green"
              style={{ whiteSpace: 'nowrap' }}
            >
              Aggiungi
            </button>
          </div>
        </form>
      </div>

      <div className="hint">
        Compila tutti i campi per ogni alimento. Prezzo e valori nutrizionali sono essenziali
        per l'ottimizzatore del piano settimanale. Clicca su qualsiasi valore per modificarlo.
      </div>

      <table>
        <thead>
          <tr>
            <th>Alimento</th>
            <th>kcal/hg</th>
            <th>Proteine/hg (g)</th>
            <th>Carboidrati/hg (g)</th>
            <th>Grassi/hg (g)</th>
            <th>Prezzo/hg (€)</th>
            <th>Azioni</th>
          </tr>
        </thead>
        <tbody>
          {sortedFoods.map((foodName) => {
            const val = data.nvalues[foodName] || {};
            const k = val.kcal || 0;
            const p = val.proteine || 0;
            const c = val.carboidrati || 0;
            const g = val.grassi || 0;
            const pr = data.prices[foodName] !== undefined ? data.prices[foodName] : 0;

            let rowClass = '';
            if (foodsInMeals.has(foodName)) {
              const missingPrice = pr <= 0;
              const missingNutrients = constrainedNutrients.some(
                (nutrientKey) => (val[nutrientKey] || 0) <= 0
              );

              if (missingPrice && missingNutrients) {
                rowClass = 'needs-both';
              } else if (missingPrice) {
                rowClass = 'needs-price';
              } else if (missingNutrients) {
                rowClass = 'needs-nutrition';
              }
            }

            return (
              <tr key={foodName} className={rowClass}>
                <td
                  className="clickable"
                  onClick={() => handleOpenEdit(foodName, 'nome', foodName)}
                  title="Clicca per rinominare"
                >
                  <span className="font-bold">{foodName}</span>
                </td>
                <td
                  className="clickable"
                  onClick={() => handleOpenEdit(foodName, 'kcal', k)}
                  title="Clicca per modificare kcal"
                >
                  {k.toFixed(1)}
                </td>
                <td
                  className="clickable"
                  onClick={() => handleOpenEdit(foodName, 'proteine', p)}
                  title="Clicca per modificare proteine"
                >
                  {p.toFixed(1)}
                </td>
                <td
                  className="clickable"
                  onClick={() => handleOpenEdit(foodName, 'carboidrati', c)}
                  title="Clicca per modificare carboidrati"
                >
                  {c.toFixed(1)}
                </td>
                <td
                  className="clickable"
                  onClick={() => handleOpenEdit(foodName, 'grassi', g)}
                  title="Clicca per modificare grassi"
                >
                  {g.toFixed(1)}
                </td>
                <td
                  className="clickable"
                  onClick={() => handleOpenEdit(foodName, 'prezzo', pr)}
                  title="Clicca per modificare prezzo"
                >
                  {pr.toFixed(2)}
                </td>
                <td>
                  <button
                    type="button"
                    className="btn btn-red"
                    style={{ padding: '2px 8px', fontSize: '9pt' }}
                    onClick={() => {
                      if (window.confirm(`Eliminare ${foodName}?`)) {
                        onDeleteFood(foodName);
                        onNotify('info', `Alimento '${foodName}' eliminato!`);
                      }
                    }}
                    title="Elimina alimento dal database"
                  >
                    Elimina
                  </button>
                </td>
              </tr>
            );
          })}
          {sortedFoods.length === 0 && (
            <tr>
              <td colSpan={7} className="hint" style={{ padding: '20px' }}>
                Nessun alimento presente nel database.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="legend flex items-center gap-10 mt-10">
        <span>Legenda colori:</span>
        <span className="needs-price" style={{ fontWeight: 'bold' }}>
          ■
        </span>
        <span> prezzo mancante</span>
        <span className="needs-both" style={{ fontWeight: 'bold' }}>
          ■
        </span>
        <span> prezzo e nutrienti vincolati mancanti</span>
      </div>

      {/* Edit Modal */}
      {editTarget && (
        <div
          className="modal-overlay"
          onClick={() => setEditTarget(null)}
        >
          <div
            className="modal-content"
            style={{ width: '340px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="card-title">
              Modifica {editTarget.field === 'nome' ? 'nome alimento' : editTarget.field}
            </div>
            <form onSubmit={handleSaveEdit}>
              <div className="mb-10">
                <input
                  type={editTarget.field === 'nome' ? 'text' : 'number'}
                  step="any"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="flex gap-10">
                <button type="submit" className="btn btn-blue w-full">
                  Salva
                </button>
                <button
                  type="button"
                  className="btn btn-red"
                  onClick={() => setEditTarget(null)}
                >
                  Annulla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
