import { StatsResult } from '../types';

export function computeStats(
  weights: [string, number][] | undefined,
  calories: [string, number][] | undefined
): StatsResult {
  const result: StatsResult = {
    trend: 'Stazionario',
    slope: 'Dati insufficienti',
    mean_cal: 'N/D',
    fabisogno: 'N/D',
  };

  if (!weights || weights.length <= 1) {
    return result;
  }

  try {
    const parsed: { date: Date; val: number }[] = [];
    for (const w of weights) {
      if (!w || !w[0]) continue;
      const dt = new Date(w[0]);
      const val = Number(w[1]);
      if (!isNaN(dt.getTime()) && !isNaN(val)) {
        parsed.push({ date: dt, val });
      }
    }

    if (parsed.length < 2) {
      return result;
    }

    parsed.sort((a, b) => a.date.getTime() - b.date.getTime());
    const firstTime = parsed[0].date.getTime();

    const x: number[] = [];
    const y: number[] = [];

    for (const item of parsed) {
      const days = (item.date.getTime() - firstTime) / (86400 * 1000);
      x.push(days);
      y.push(item.val);
    }

    // Linear regression: y = slope * x + intercept
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((acc, curr, i) => acc + curr * y[i], 0);
    const sumXX = x.reduce((acc, curr) => acc + curr * curr, 0);

    const denom = n * sumXX - sumX * sumX;
    let slope = 0;
    if (Math.abs(denom) > 1e-9) {
      slope = (n * sumXY - sumX * sumY) / denom;
    }

    let trendDir: 'Dimagrimento' | 'Aumento' | 'Stazionario' = 'Stazionario';
    if (slope < -0.001) {
      trendDir = 'Dimagrimento';
    } else if (slope > 0.001) {
      trendDir = 'Aumento';
    }

    result.trend = trendDir;
    result.rawSlope = slope;
    result.slope = `${slope.toFixed(3)} kg/giorno (circa ${(slope * 7700).toFixed(0)} kcal/giorno)`;

    const validCals: number[] = [];
    for (const c of calories || []) {
      if (!c) continue;
      const cal = Number(c[1]);
      if (!isNaN(cal) && cal > 0) {
        validCals.push(cal);
      }
    }

    if (validCals.length > 0) {
      const meanCal = validCals.reduce((a, b) => a + b, 0) / validCals.length;
      result.rawMeanCal = meanCal;
      result.mean_cal = `${Math.round(meanCal)} kcal/giorno`;
      result.fabisogno = `${Math.round(meanCal - slope * 7700)} kcal/giorno`;
    } else {
      result.mean_cal = 'N/D';
      result.fabisogno = 'Dati peso insufficienti';
    }
  } catch (err) {
    console.error('Error computing stats:', err);
  }

  return result;
}
