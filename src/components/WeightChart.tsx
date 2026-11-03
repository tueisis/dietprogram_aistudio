import React, { useState } from 'react';
import { formatItalianDate } from '../constants';

interface WeightChartProps {
  weights: [string, number][];
}

export const WeightChart: React.FC<WeightChartProps> = ({ weights }) => {
  const [hoveredPoint, setHoveredPoint] = useState<{
    x: number;
    y: number;
    date: string;
    weight: number;
  } | null>(null);

  const parsed = weights
    .map(([dateStr, w]) => {
      const dt = new Date(dateStr);
      return { dt, dateStr, weight: Number(w) };
    })
    .filter((p) => !isNaN(p.dt.getTime()) && !isNaN(p.weight))
    .sort((a, b) => a.dt.getTime() - b.dt.getTime());

  if (parsed.length === 0) {
    return (
      <div className="card hint text-center" style={{ padding: '60px' }}>
        Nessun dato di peso registrato disponibile per il grafico.
      </div>
    );
  }

  const width = 500;
  const height = 300;
  const padding = { top: 40, right: 30, bottom: 40, left: 50 };

  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  const minWeight = Math.floor(Math.min(...parsed.map((p) => p.weight)) - 1);
  const maxWeight = Math.ceil(Math.max(...parsed.map((p) => p.weight)) + 1);
  const weightRange = maxWeight - minWeight || 1;

  const firstTime = parsed[0].dt.getTime();
  const lastTime = parsed[parsed.length - 1].dt.getTime();
  const timeRange = lastTime - firstTime || 1;

  const points = parsed.map((p) => {
    const xRatio = timeRange > 0 ? (p.dt.getTime() - firstTime) / timeRange : 0.5;
    const yRatio = (p.weight - minWeight) / weightRange;
    const x = padding.left + (parsed.length === 1 ? plotWidth / 2 : xRatio * plotWidth);
    const y = padding.top + plotHeight - yRatio * plotHeight;
    return { x, y, ...p };
  });

  const pathD = points.reduce((acc, curr, idx) => {
    return idx === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`;
  }, '');

  // Y-axis ticks (4-5 ticks)
  const yTicks: number[] = [];
  const yStep = Math.max(1, Math.round(weightRange / 4));
  for (let w = minWeight; w <= maxWeight; w += yStep) {
    yTicks.push(w);
  }

  // X-axis ticks (up to 5 evenly spaced dates)
  const xTicksIndices = [0];
  if (points.length > 2) {
    xTicksIndices.push(Math.floor(points.length / 2));
  }
  if (points.length > 1) {
    xTicksIndices.push(points.length - 1);
  }

  return (
    <div className="plot-container" style={{ position: 'relative' }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{
          width: '100%',
          maxWidth: '520px',
          background: 'var(--chart-bg, #ffffff)',
          borderRadius: '10px',
          border: '1px solid var(--chart-border, #e4e4e7)',
          boxShadow: 'var(--shadow-card)',
          overflow: 'visible',
          transition: 'background-color 0.2s ease, border-color 0.2s ease',
        }}
      >
        {/* Title */}
        <text
          x={width / 2}
          y="24"
          fill="var(--text-main, #09090b)"
          fontSize="12.5"
          fontWeight="700"
          letterSpacing="-0.01em"
          textAnchor="middle"
        >
          Andamento Peso Corporeo
        </text>

        {/* Y Grid lines and labels */}
        {yTicks.map((val) => {
          const y = padding.top + plotHeight - ((val - minWeight) / weightRange) * plotHeight;
          return (
            <g key={`y-${val}`}>
              <line
                x1={padding.left}
                y1={y}
                x2={padding.left + plotWidth}
                y2={y}
                stroke="var(--chart-grid, #f1f1f4)"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
              <text
                x={padding.left - 8}
                y={y + 4}
                fill="var(--chart-text, #71717a)"
                fontSize="9"
                fontFamily="JetBrains Mono, monospace"
                textAnchor="end"
              >
                {val} kg
              </text>
            </g>
          );
        })}

        {/* X Ticks */}
        {Array.from(new Set(xTicksIndices)).map((idx) => {
          const pt = points[idx];
          if (!pt) return null;
          return (
            <g key={`x-${idx}`}>
              <line
                x1={pt.x}
                y1={padding.top}
                x2={pt.x}
                y2={padding.top + plotHeight}
                stroke="var(--chart-grid, #f1f1f4)"
                strokeDasharray="3 3"
                strokeWidth="0.8"
              />
              <text
                x={pt.x}
                y={padding.top + plotHeight + 18}
                fill="var(--chart-text, #71717a)"
                fontSize="9"
                fontFamily="JetBrains Mono, monospace"
                textAnchor="middle"
              >
                {formatItalianDate(pt.dateStr)}
              </text>
            </g>
          );
        })}

        {/* Axis border spines */}
        <line
          x1={padding.left}
          y1={padding.top}
          x2={padding.left}
          y2={padding.top + plotHeight}
          stroke="var(--border-color, #e4e4e7)"
          strokeWidth="1.2"
        />
        <line
          x1={padding.left}
          y1={padding.top + plotHeight}
          x2={padding.left + plotWidth}
          y2={padding.top + plotHeight}
          stroke="var(--border-color, #e4e4e7)"
          strokeWidth="1.2"
        />

        {/* Gradient fill area under the line */}
        <defs>
          <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-line, #059669)" stopOpacity="0.2" />
            <stop offset="100%" stopColor="var(--chart-line, #059669)" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {points.length > 1 && (
          <path
            d={`${pathD} L ${points[points.length - 1].x} ${padding.top + plotHeight} L ${points[0].x} ${padding.top + plotHeight} Z`}
            fill="url(#weightGradient)"
          />
        )}

        {/* Line */}
        {points.length > 1 && (
          <path
            d={pathD}
            fill="none"
            stroke="var(--chart-line, #059669)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Data points */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={hoveredPoint?.date === p.dateStr ? 6 : 4}
            fill="var(--chart-line, #059669)"
            stroke="var(--chart-bg, #ffffff)"
            strokeWidth="2"
            style={{ cursor: 'pointer', transition: 'r 0.15s' }}
            onMouseEnter={() =>
              setHoveredPoint({ x: p.x, y: p.y, date: p.dateStr, weight: p.weight })
            }
            onMouseLeave={() => setHoveredPoint(null)}
          />
        ))}

        {/* Tooltip in SVG */}
        {hoveredPoint && (
          <g transform={`translate(${Math.min(hoveredPoint.x, width - 85)}, ${Math.max(hoveredPoint.y - 35, 30)})`}>
            <rect
              x="-40"
              y="-18"
              width="80"
              height="24"
              rx="4"
              fill="var(--bg-card, #ffffff)"
              stroke="var(--primary, #2563eb)"
              strokeWidth="1.2"
              filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))"
            />
            <text
              x="0"
              y="-2"
              fill="var(--text-main, #09090b)"
              fontSize="9.5"
              fontWeight="700"
              fontFamily="JetBrains Mono, monospace"
              textAnchor="middle"
            >
              {hoveredPoint.weight} kg
            </text>
          </g>
        )}
      </svg>
    </div>
  );
};
