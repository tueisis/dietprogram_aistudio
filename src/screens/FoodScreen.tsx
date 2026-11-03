import React, { useState } from 'react';
import { AppStateData } from '../services/storage';
import { getTodayDateStr } from '../constants';

interface FoodScreenProps {
  data: AppStateData;
  onAddFoodItem: (name: string, qty: number) => void;
  onDeleteFoodItem: (index: number) => void;
  onSaveNewFoodNutrition: (foodName: string, kcal: number) => void;
  onNotify: (type: 'success' | 'error' | 'warning' | 'info', msg: string) => void;
}

export const FoodScreen: React.FC<FoodScreenProps> = ({
  data,
  onAddFoodItem,
  onDeleteFoodItem,
  onSaveNewFoodNutrition,
  onNotify,
}) => {
  const [foodInput, setFoodInput] = useState('');
  const [qtyInput, setQtyInput] = useState('');
  const [modalFoodName, setModalFoodName] = useState<string | null>(null);
  const [modalKcalInput, setModalKcalInput] = useState('');

  const todayStr = getTodayDateStr();
  const todayEaten = data.eaten[todayStr] || [];

  const foodList = Object.keys(data.nvalues).sort((a, b) =>
    a.localeCompare(b, 'it', { sensitivity: 'base' })
  );

  const filteredFoods = foodList.filter((f) =>
    f.toLowerCase().includes(foodInput.toLowerCase())
  );

  // Compute preview calories
  const trimmedName = foodInput.trim();
  const parsedQty = parseFloat(qtyInput.replace(',', '.'));
  let previewText = 'Calorie previste: --';
  let previewColor = 'var(--text-muted)';

  if (trimmedName && data.nvalues[trimmedName] && !isNaN(parsedQty) && parsedQty > 0) {
    const kcalPerHg = data.nvalues[trimmedName].kcal || 0;
    const estimated = Math.round(kcalPerHg * parsedQty * 10) / 10;
    previewText = `Calorie previste: ${estimated} kcal`;
    previewColor = '#10b981';
  }

  // Calculate totals for today
  let totalKcal = 0;
  let totalProt = 0;
  for (const [food, qty] of todayEaten) {
    const info = data.nvalues[food];
    if (info) {
      totalKcal += (info.kcal || 0) * qty;
      totalProt += (info.proteine || 0) * qty;
    }
  }

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trimmedName) {
      onNotify('error', 'Inserisci il nome di un alimento!');
      return;
    }
    if (isNaN(parsedQty) || parsedQty <= 0) {
      onNotify('error', 'Inserisci una quantità numerica valida!');
      return;
    }

    onAddFoodItem(trimmedName, parsedQty);

    // If food not yet in database, prompt to add kcal
    if (!data.nvalues[trimmedName]) {
      setModalFoodName(trimmedName);
      setModalKcalInput('');
    }

    setFoodInput('');
    setQtyInput('');
    onNotify('success', `Aggiunto "${trimmedName}" (${parsedQty} hg) al diario.`);
  };

  const handleModalSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalFoodName) return;
    const kcal = parseFloat(modalKcalInput.replace(',', '.'));
    if (isNaN(kcal) || kcal < 0) {
      onNotify('error', 'Inserisci un valore numerico valido!');
      return;
    }
    onSaveNewFoodNutrition(modalFoodName, kcal);
    setModalFoodName(null);
    onNotify('success', `Calorie salvate per "${modalFoodName}"!`);
  };

  return (
    <div>
      <div className="row">
        {/* Left Column: Form & Food List */}
        <div className="col">
          <div className="card">
            <div className="card-title">Aggiungi un alimento al diario di oggi</div>
            <div className="hint">
              Seleziona un alimento dalla lista qui sotto o digita il nome manualmente,
              poi inserisci la quantità in ettogrammi (hg) e clicca Aggiungi al Diario.
            </div>

            <form onSubmit={handleAddSubmit} className="mb-10">
              <div className="mb-10">
                <label className="label">Alimento:</label>
                <input
                  type="text"
                  value={foodInput}
                  onChange={(e) => setFoodInput(e.target.value)}
                  placeholder="Cerca o digita nome..."
                  required
                />
              </div>

              <div className="flex items-center gap-10 mb-10 flex-wrap">
                <label className="label" style={{ minWidth: '100px' }}>
                  Quantità (hg):
                </label>
                <input
                  type="number"
                  step="any"
                  inputMode="decimal"
                  value={qtyInput}
                  onChange={(e) => setQtyInput(e.target.value)}
                  placeholder="es. 1.5"
                  style={{ width: '100px' }}
                  required
                />
                <span className="hint" style={{ color: previewColor, margin: 0 }}>
                  {previewText}
                </span>
              </div>

              <button type="submit" className="btn btn-blue w-full">
                Aggiungi al Diario
              </button>
            </form>

            <div className="font-bold mb-10">Alimenti salvati nel database:</div>
            <div className="food-list" style={{ maxHeight: '280px' }}>
              {filteredFoods.map((item) => (
                <div
                  key={item}
                  className="food-item"
                  onClick={() => setFoodInput(item)}
                >
                  {item}
                </div>
              ))}
              {filteredFoods.length === 0 && (
                <div className="hint" style={{ padding: '12px', textAlign: 'center' }}>
                  Nessun alimento corrispondente trovato.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Today's Diary */}
        <div className="col">
          <div className="card" style={{ height: '100%' }}>
            <div className="card-title">Diario Alimentare di Oggi ({todayStr})</div>
            <div className="hint">
              Se l'alimento non è nella lista, aggiungilo comunque: si aprirà una finestra
              in cui inserirai le calorie per ettogrammo.
            </div>

            <div className="food-list" style={{ maxHeight: '350px' }}>
              {todayEaten.map(([food, qty], idx) => {
                const info = data.nvalues[food];
                if (info) {
                  const kcal = (info.kcal || 0) * qty;
                  const prot = (info.proteine || 0) * qty;
                  return (
                    <div
                      key={idx}
                      className="food-item flex items-center"
                      style={{ justifyContent: 'space-between' }}
                    >
                      <span>
                        <strong>{food}</strong> - {qty} hg (~{Math.round(kcal)} kcal,{' '}
                        {prot.toFixed(1)}g prot)
                      </span>
                      <button
                        type="button"
                        onClick={() => onDeleteFoodItem(idx)}
                        className="btn btn-red"
                        style={{ padding: '2px 8px', fontSize: '9pt' }}
                        title="Elimina alimento"
                      >
                        X
                      </button>
                    </div>
                  );
                } else {
                  return (
                    <div
                      key={idx}
                      className="food-item flex items-center"
                      style={{ justifyContent: 'space-between', color: '#f59e0b' }}
                    >
                      <span>
                        {food} - {qty} hg (dati mancanti)
                        <button
                          type="button"
                          onClick={() => {
                            setModalFoodName(food);
                            setModalKcalInput('');
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#3b82f6',
                            marginLeft: '8px',
                            cursor: 'pointer',
                            textDecoration: 'underline',
                          }}
                        >
                          Aggiungi kcal
                        </button>
                      </span>
                      <button
                        type="button"
                        onClick={() => onDeleteFoodItem(idx)}
                        className="btn btn-red"
                        style={{ padding: '2px 8px', fontSize: '9pt' }}
                      >
                        X
                      </button>
                    </div>
                  );
                }
              })}

              {todayEaten.length === 0 && (
                <div className="hint" style={{ padding: '24px', textAlign: 'center' }}>
                  Nessun alimento registrato oggi. Inizia ad aggiungerne uno a sinistra!
                </div>
              )}
            </div>

            <hr style={{ borderColor: '#252529', margin: '14px 0' }} />

            <div className="font-bold" style={{ fontSize: '10.5pt' }}>
              TOTALE: {Math.round(totalKcal)} kcal &nbsp;|&nbsp; Proteine:{' '}
              {totalProt.toFixed(1)} g
            </div>
          </div>
        </div>
      </div>

      {/* Modal for new food nutrition */}
      {modalFoodName && (
        <div
          className="modal-overlay"
          onClick={() => setModalFoodName(null)}
        >
          <div
            className="modal-content"
            style={{ width: '360px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sheet-handle" />
            <div className="card-title">Inserisci le kcal per 1 hg</div>
            <p className="hint mb-10">
              Imposta il valore calorico per <strong>{modalFoodName}</strong>:
            </p>
            <form onSubmit={handleModalSave}>
              <div className="mb-10">
                <input
                  type="number"
                  step="any"
                  value={modalKcalInput}
                  onChange={(e) => setModalKcalInput(e.target.value)}
                  placeholder="kcal per hg"
                  autoFocus
                  required
                />
              </div>
              <div className="flex gap-10">
                <button type="submit" className="btn btn-green w-full">
                  Salva e Calcola
                </button>
                <button
                  type="button"
                  className="btn btn-red"
                  onClick={() => setModalFoodName(null)}
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
