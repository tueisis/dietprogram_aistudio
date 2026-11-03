import React, { useState } from 'react';
import { AppStateData } from '../services/storage';
import { computeStats } from '../services/analytics';
import { calculateTodayKcal } from '../services/nutrition';
import { getTodayDateStr, MEAL_CATEGORIES } from '../constants';
import { WeightChart } from '../components/WeightChart';

interface MainScreenProps {
  data: AppStateData;
  onRecordWeight: (weight: number) => void;
  onRecordCalories: (calories: number) => void;
  onNotify: (type: 'success' | 'error' | 'warning' | 'info', msg: string) => void;
}

export const MainScreen: React.FC<MainScreenProps> = ({
  data,
  onRecordWeight,
  onRecordCalories,
  onNotify,
}) => {
  const [weightInput, setWeightInput] = useState('');
  const [calorieInput, setCalorieInput] = useState('');

  const todayStr = getTodayDateStr();
  const todayEaten = data.eaten[todayStr] || [];
  const calculatedKcal = calculateTodayKcal(todayEaten, data.nvalues);

  // Check if calories were already recorded today
  let caloriesToday: number | null = null;
  for (let i = data.calories.length - 1; i >= 0; i--) {
    const entry = data.calories[i];
    try {
      const entryDate = new Date(entry[0]).toISOString().split('T')[0];
      if (entryDate === todayStr) {
        caloriesToday = entry[1];
        break;
      }
    } catch {
      // ignore
    }
  }

  const todayPlan = data.plan[todayStr] || {
    Colazione: '-',
    Pranzo: '-',
    Cena: '-',
    Merenda: '-',
  };

  const stats = computeStats(data.weights, data.calories);

  const handleWeightSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(weightInput.replace(',', '.'));
    if (isNaN(val) || val <= 0 || val > 500) {
      onNotify('error', 'Inserisci un numero valido per il peso!');
      return;
    }
    onRecordWeight(val);
    setWeightInput('');
    onNotify('success', 'Peso registrato con successo!');
  };

  const handleCalorieSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(calorieInput.replace(',', '.'));
    if (isNaN(val) || val <= 0) {
      onNotify('error', 'Inserisci un numero valido per le calorie!');
      return;
    }
    onRecordCalories(val);
    setCalorieInput('');
    onNotify('success', 'Calorie registrate con successo!');
  };

  return (
    <div>
      <div className="card">
        {/* Record Weight */}
        <form
          onSubmit={handleWeightSubmit}
          className="flex items-center gap-10"
          style={{ marginBottom: '10px' }}
        >
          <label className="font-bold" style={{ minWidth: '140px' }}>
            Registra Peso (kg):
          </label>
          <input
            type="number"
            step="any"
            value={weightInput}
            onChange={(e) => setWeightInput(e.target.value)}
            placeholder="es. 75.5"
            style={{ width: '120px' }}
            required
          />
          <button type="submit" className="btn btn-green">
            Registra
          </button>
        </form>

        {/* Record Calories */}
        <form
          onSubmit={handleCalorieSubmit}
          className="flex items-center gap-10 flex-wrap"
        >
          <label className="font-bold" style={{ minWidth: '140px' }}>
            Registra Calorie (kcal):
          </label>
          <input
            type="number"
            step="any"
            value={calorieInput}
            onChange={(e) => setCalorieInput(e.target.value)}
            placeholder="es. 2000"
            style={{ width: '120px' }}
            required
          />
          <button type="submit" className="btn btn-blue">
            {caloriesToday !== null ? 'Aggiorna' : 'Registra'}
          </button>
          {caloriesToday !== null && (
            <span className="hint" style={{ color: '#f59e0b', margin: '0 6px' }}>
              ⚠️ Calorie già registrate oggi ({caloriesToday} kcal)
            </span>
          )}
          {calculatedKcal > 0 && (
            <button
              type="button"
              className="btn btn-purple"
              onClick={() => setCalorieInput(String(calculatedKcal))}
            >
              Usa {calculatedKcal} kcal dal diario
            </button>
          )}
        </form>
      </div>

      <div className="card hint">
        Per iniziare registra giorno per giorno la massa corporea e le calorie ingerite.
        Puoi pianificare i pasti nella scheda Piano Settimanale.
        Puoi aiutarti nel calcolare le calorie mangiate giorno per giorno con gli strumenti presenti nella scheda Diario Alimentare.
      </div>

      <div className="row">
        <div className="col">
          <WeightChart weights={data.weights} />
        </div>
        <div className="col">
          <div className="card" style={{ height: '100%' }}>
            <div className="card-title">Pasti Pianificati Oggi</div>
            {MEAL_CATEGORIES.map((cat) => (
              <div
                key={cat}
                className="flex items-center gap-10"
                style={{ marginBottom: '10px' }}
              >
                <span className="label-muted font-bold" style={{ minWidth: '85px' }}>
                  {cat}:
                </span>
                <span style={{ fontWeight: 500 }}>
                  {todayPlan[cat] || '-'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {(stats.trend !== 'Stazionario' || data.weights.length > 1) && (
        <div className="card" style={{ marginTop: '14px' }}>
          <div className="card-title">Analisi e Statistiche del Trend</div>
          <div className="row text-center">
            <div className="col">
              <div className="stat-box">
                <div className="stat-label">Trend Rilevato</div>
                <div
                  className={`stat-value ${
                    stats.trend === 'Dimagrimento' ? 'text-green' : 'text-blue'
                  }`}
                >
                  {stats.trend}
                </div>
              </div>
            </div>
            <div className="col">
              <div className="stat-box">
                <div className="stat-label">Variazione Peso Stimata</div>
                <div className="stat-value">{stats.slope}</div>
              </div>
            </div>
            <div className="col">
              <div className="stat-box">
                <div className="stat-label">Introito Calorico Medio</div>
                <div className="stat-value">{stats.mean_cal}</div>
              </div>
            </div>
            <div className="col">
              <div className="stat-box">
                <div className="stat-label">Fabbisogno Giornaliero Stimato</div>
                <div className="stat-value">{stats.fabisogno}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
