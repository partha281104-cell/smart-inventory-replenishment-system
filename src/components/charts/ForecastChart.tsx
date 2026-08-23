import React, { useState } from 'react';
import { HistoricalSalesPoint, ForecastPoint } from '../../types/inventory';

interface ForecastChartProps {
  historical: HistoricalSalesPoint[];
  forecast: ForecastPoint[];
  skuName: string;
  avgDailyDemand: number;
}

export const ForecastChart: React.FC<ForecastChartProps> = ({
  historical,
  forecast,
  skuName,
  avgDailyDemand,
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<{
    date: string;
    type: 'actual' | 'forecast';
    val: number;
    upper?: number;
    lower?: number;
    note?: string;
  } | null>(null);

  // Combine data for plotting
  // historical length = 30, forecast length = 30
  const maxActual = Math.max(...historical.map(h => h.actualDemand), 10);
  const maxForecast = Math.max(...forecast.map(f => f.confidenceUpper), 10);
  const maxVal = Math.max(maxActual, maxForecast) * 1.15;

  const width = 800;
  const height = 260;
  const paddingLeft = 45;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 35;
  const plotWidth = width - paddingLeft - paddingRight;
  const plotHeight = height - paddingTop - paddingBottom;

  const totalPoints = historical.length + forecast.length;
  const stepX = plotWidth / (totalPoints - 1);

  const getY = (val: number) => {
    return paddingTop + plotHeight - (val / maxVal) * plotHeight;
  };

  // Historical path
  const histPoints = historical.map((h, i) => ({
    x: paddingLeft + i * stepX,
    y: getY(h.actualDemand),
    data: h,
  }));

  const histPath = histPoints.reduce((acc, pt, i) => {
    return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, '');

  // Forecast path (starts connecting from last historical point)
  const lastHist = histPoints[histPoints.length - 1];
  const fcPoints = forecast.map((f, i) => ({
    x: paddingLeft + (historical.length + i) * stepX,
    y: getY(f.predictedDemand),
    yUpper: getY(f.confidenceUpper),
    yLower: getY(f.confidenceLower),
    data: f,
  }));

  const fcPath = [`M ${lastHist.x} ${lastHist.y}`, ...fcPoints.map(p => `L ${p.x} ${p.y}`)].join(' ');

  // Confidence ribbon polygon
  const upperPath = [`M ${lastHist.x} ${lastHist.y}`, ...fcPoints.map(p => `L ${p.x} ${p.yUpper}`)].join(' ');
  const lowerPath = [...fcPoints.map(p => `L ${p.x} ${p.yLower}`).reverse(), `L ${lastHist.x} ${lastHist.y}`].join(' ');
  const confidenceArea = `${upperPath} ${lowerPath} Z`;

  // Grid lines
  const gridTicks = [0, 0.25, 0.5, 0.75, 1].map(pct => Math.round(maxVal * pct));

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div>
          <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Demand Trajectory & Probabilistic Forecast</div>
          <div className="text-sm font-medium text-slate-100">{skuName}</div>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-blue-400 inline-block"></span>
            <span className="text-slate-300">Historical Sales</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-emerald-400 border-b border-dashed inline-block"></span>
            <span className="text-slate-300">AI ML Forecast</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-2 bg-emerald-500/20 rounded inline-block"></span>
            <span className="text-slate-400">P10 - P90 Confidence</span>
          </div>
        </div>
      </div>

      <div className="relative w-full overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none">
          <defs>
            <linearGradient id="histGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="fcGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.20" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {gridTicks.map((val) => {
            const y = getY(val);
            return (
              <g key={val}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="#1e293b"
                  strokeDasharray="3 3"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  fill="#64748b"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Baseline Average Demand line */}
          <line
            x1={paddingLeft}
            y1={getY(avgDailyDemand)}
            x2={width - paddingRight}
            y2={getY(avgDailyDemand)}
            stroke="#f59e0b"
            strokeDasharray="4 4"
            strokeWidth="1"
            opacity="0.6"
          />
          <text
            x={width - paddingRight - 4}
            y={getY(avgDailyDemand) - 4}
            textAnchor="end"
            fill="#f59e0b"
            fontSize="9"
            opacity="0.8"
          >
            Avg: {avgDailyDemand.toFixed(1)} u/d
          </text>

          {/* Confidence interval area */}
          <path d={confidenceArea} fill="url(#fcGradient)" opacity="0.8" />

          {/* Forecast split vertical divider */}
          <line
            x1={lastHist.x}
            y1={paddingTop}
            x2={lastHist.x}
            y2={height - paddingBottom}
            stroke="#475569"
            strokeDasharray="2 2"
            strokeWidth="1.5"
          />
          <text
            x={lastHist.x - 6}
            y={paddingTop + 14}
            textAnchor="end"
            fill="#94a3b8"
            fontSize="10"
            fontWeight="bold"
          >
            Past 30d
          </text>
          <text
            x={lastHist.x + 6}
            y={paddingTop + 14}
            textAnchor="start"
            fill="#10b981"
            fontSize="10"
            fontWeight="bold"
          >
            Next 30d Forecast →
          </text>

          {/* Historical line & area */}
          <path
            d={`${histPath} L ${lastHist.x} ${getY(0)} L ${paddingLeft} ${getY(0)} Z`}
            fill="url(#histGradient)"
          />
          <path d={histPath} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" />

          {/* Forecast line */}
          <path
            d={fcPath}
            fill="none"
            stroke="#10b981"
            strokeWidth="2.5"
            strokeDasharray="5 3"
            strokeLinecap="round"
          />

          {/* Interactive points */}
          {histPoints.map((pt, i) => (
            <circle
              key={`hist-${i}`}
              cx={pt.x}
              cy={pt.y}
              r={pt.data.promotionalEvent ? 4 : 2.5}
              fill={pt.data.promotionalEvent ? '#f59e0b' : '#3b82f6'}
              stroke="#0f172a"
              strokeWidth="1.5"
              className="cursor-pointer transition-all hover:r-5"
              onMouseEnter={() =>
                setHoveredPoint({
                  date: pt.data.date,
                  type: 'actual',
                  val: pt.data.actualDemand,
                  note: pt.data.promotionalEvent,
                })
              }
              onMouseLeave={() => setHoveredPoint(null)}
            />
          ))}

          {fcPoints.map((pt, i) => (
            <circle
              key={`fc-${i}`}
              cx={pt.x}
              cy={pt.y}
              r={pt.data.isSurgePredicted ? 4.5 : 3}
              fill={pt.data.isSurgePredicted ? '#f43f5e' : '#10b981'}
              stroke="#0f172a"
              strokeWidth="1.5"
              className="cursor-pointer transition-all hover:r-5"
              onMouseEnter={() =>
                setHoveredPoint({
                  date: pt.data.date,
                  type: 'forecast',
                  val: pt.data.predictedDemand,
                  upper: pt.data.confidenceUpper,
                  lower: pt.data.confidenceLower,
                  note: pt.data.eventNote,
                })
              }
              onMouseLeave={() => setHoveredPoint(null)}
            />
          ))}

          {/* X Axis dates */}
          <text
            x={paddingLeft}
            y={height - paddingBottom + 18}
            fill="#64748b"
            fontSize="10"
          >
            -30 Days
          </text>
          <text
            x={lastHist.x}
            y={height - paddingBottom + 18}
            textAnchor="middle"
            fill="#94a3b8"
            fontSize="10"
            fontWeight="bold"
          >
            Today
          </text>
          <text
            x={width - paddingRight}
            y={height - paddingBottom + 18}
            textAnchor="end"
            fill="#10b981"
            fontSize="10"
          >
            +30 Days
          </text>
        </svg>

        {/* Tooltip Overlay */}
        {hoveredPoint && (
          <div className="absolute top-2 right-2 bg-slate-800/95 border border-slate-700 px-3 py-2 rounded-lg shadow-lg text-xs backdrop-blur-sm pointer-events-none">
            <div className="text-slate-400 font-mono">{hoveredPoint.date}</div>
            <div className="font-semibold text-white mt-0.5">
              {hoveredPoint.type === 'actual' ? 'Actual Sales: ' : 'Predicted Demand: '}
              <span className={hoveredPoint.type === 'actual' ? 'text-blue-400' : 'text-emerald-400'}>
                {hoveredPoint.val} units
              </span>
            </div>
            {hoveredPoint.upper && (
              <div className="text-slate-400 text-[11px] mt-0.5">
                Confidence: {hoveredPoint.lower} – {hoveredPoint.upper} units
              </div>
            )}
            {hoveredPoint.note && (
              <div className="text-amber-300 text-[11px] mt-1 font-medium">
                ★ {hoveredPoint.note}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
