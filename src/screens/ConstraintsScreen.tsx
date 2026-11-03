import React, { useState } from 'react';
import { ConstraintsMap, ConstraintNutrient } from '../types';
import { NUTRIENTS, NUTRIENT_LABELS } from '../constants';

interface ConstraintsScreenProps {
  initialConstraints: ConstraintsMap;
  onSave: (newConstraints: ConstraintsMap) => void;
  onClose?: () => void;
  onNotify: (type: 'success' | 'error' | 'warning' | 'info', msg: string) => void;
}

export const ConstraintsScreen: React.FC<ConstraintsScreenProps> = ({
  initialConstraints,
  onSave,
  onClose,
  onNotify,
}) => {
  const [formData, setFormData] = useState<
    Record<ConstraintNutrient, { enabled: boolean; min: string; max: string }>
  >(() => {
    const init: Record<ConstraintNutrient, { enabled: boolean; min: string; max: string }> = {
      kcal: { enabled: false, min: '', max: '' },
      proteine: { enabled: false, min: '', max: '' },
      carboidrati: { enabled: false, min: '', max: '' },
      grassi: { enabled: false, min: '', max: '' },
    };
    for (const key of NUTRIENTS) {
      const cfg = initialConstraints[key];
      if (cfg) {
        init[key] = {
          enabled: Boolean(cfg.enabled),
          min: cfg.min !== null && cfg.min !== undefined ? String(cfg.min) : '',
          max: cfg.max !== null && cfg.max !== undefined ? String(cfg.max) : '',
        };
      }
    }
    return init;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: ConstraintsMap = {
      kcal: { enabled: false, min: null, max: null },
      proteine: { enabled: false, min: null, max: null },
      carboidrati: { enabled: false, min: null, max: null },
      grassi: { enabled: false, min: null, max: null },
    };

    for (const key of NUTRIENTS) {
      const row = formData[key];
      const minVal = row.min.trim() ? parseFloat(row.min.replace(',', '.')) : null;
      const maxVal = row.max.trim() ? parseFloat(row.max.replace(',', '.')) : null;

      if (minVal !== null && isNaN(minVal)) {
        onNotify('error', `Valore minimo non valido per ${key}!`);
        return;
      }
      if (maxVal !== null && isNaN(maxVal)) {
        onNotify('error', `Valore massimo non valido per ${key}!`);
        return;
      }
      if (minVal !== null && maxVal !== null && minVal > maxVal) {
        onNotify('error', `Per ${key}, il minimo non può superare il massimo!`);
        return;
      }

      updated[key] = {
        enabled: row.enabled,
        min: minVal,
        max: maxVal,
      };
    }

    onSave(updated);
    onNotify('success', 'Vincoli salvati con successo!');
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="card" style={{ maxWidth: '540px', margin: '0 auto' }}>
      <div className="card-title">Vincoli Nutrizionali Giornalieri</div>
      <form onSubmit={handleSubmit}>
        <table>
          <thead>
            <tr>
              <th>Attivo</th>
              <th className="text-left">Nutriente</th>
              <th>Min</th>
              <th>Max</th>
            </tr>
          </thead>
          <tbody>
            {NUTRIENTS.map((key) => {
              const label = NUTRIENT_LABELS[key] || key;
              const row = formData[key];

              return (
                <tr key={key}>
                  <td>
                    <input
                      type="checkbox"
                      checked={row.enabled}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          [key]: { ...prev[key], enabled: e.target.checked },
                        }))
                      }
                    />
                  </td>
                  <td className="text-left font-bold">{label}</td>
                  <td>
                    <input
                      type="number"
                      step="any"
                      value={row.min}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          [key]: { ...prev[key], min: e.target.value },
                        }))
                      }
                      placeholder="min"
                      style={{ width: '80px', padding: '5px' }}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      step="any"
                      value={row.max}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          [key]: { ...prev[key], max: e.target.value },
                        }))
                      }
                      placeholder="max"
                      style={{ width: '80px', padding: '5px' }}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="hint mt-10 mb-10">
          Lascia Min o Max vuoto per non imporre quel limite. I vincoli sono applicati per ogni giorno ottimizzato.
        </div>

        <div className="flex gap-10">
          <button type="submit" className="btn btn-green w-full">
            Salva Vincoli
          </button>
          {onClose && (
            <button
              type="button"
              className="btn btn-red"
              onClick={onClose}
              style={{ padding: '7px 18px' }}
            >
              Chiudi
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
