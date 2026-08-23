import React from 'react';

interface StockProjectionChartProps {
  currentStock: number;
  safetyStock: number;
  reorderPoint: number;
  avgDailyDemand: number;
  leadTimeDays: number;
  onOrderStock: number;
  projectedRunoutDays: number;
  recommendedOrderQty: number;
}

export const StockProjectionChart: React.FC<StockProjectionChartProps> = ({
  currentStock,
  safetyStock,
  reorderPoint,
  avgDailyDemand,
  leadTimeDays,
  onOrderStock,
  projectedRunoutDays,
  recommendedOrderQty,
}) => {
  const days = 35;
  const width = 680;
  const height = 220;
  const paddingLeft = 45;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;
  const plotWidth = width - paddingLeft - paddingRight;
  const plotHeight = height - paddingTop - paddingBottom;

  const maxVal = Math.max(
    currentStock + onOrderStock + recommendedOrderQty * 0.7,
    reorderPoint * 1.6,
    100
  );

  const getX = (d: number) => paddingLeft + (d / days) * plotWidth;
  const getY = (val: number) => paddingTop + plotHeight - (Math.max(0, val) / maxVal) * plotHeight;

  // Unmitigated trajectory (depletion to 0)
  const unmitigatedPoints: { x: number; y: number }[] = [];
  for (let d = 0; d <= days; d++) {
    const stockAtDay = Math.max(0, currentStock - d * avgDailyDemand);
    unmitigatedPoints.push({ x: getX(d), y: getY(stockAtDay) });
  }
  const unmitigatedPath = unmitigatedPoints.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ');

  // Mitigated trajectory (with recommended replenishment arriving at day = leadTimeDays)
  const mitigatedPoints: { x: number; y: number }[] = [];
  for (let d = 0; d <= days; d++) {
    let stockAtDay = currentStock - d * avgDailyDemand;
    if (d >= leadTimeDays) {
      stockAtDay += (recommendedOrderQty + onOrderStock);
    } else if (d >= 4 && onOrderStock > 0) {
      stockAtDay += onOrderStock;
    }
    mitigatedPoints.push({ x: getX(d), y: getY(Math.max(0, stockAtDay)) });
  }
  const mitigatedPath = mitigatedPoints.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ');

  const runoutX = getX(Math.min(days, projectedRunoutDays));
  const leadTimeX = getX(leadTimeDays);

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
        <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
          35-Day Inventory Depletion & Replenishment Trajectory
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1">
            <span className="w-3 h-0.5 bg-rose-500 inline-block"></span>
            <span className="text-slate-300">No Action (Stockout)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-0.5 bg-emerald-400 inline-block"></span>
            <span className="text-slate-300">With Recommended PO</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-0.5 bg-amber-400 border-b border-dashed inline-block"></span>
            <span className="text-slate-400">Safety Buffer</span>
          </div>
        </div>
      </div>

      <div className="relative w-full">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none">
          {/* Safety Stock Area */}
          <rect
            x={paddingLeft}
            y={getY(safetyStock)}
            width={plotWidth}
            height={plotHeight - (getY(safetyStock) - paddingTop)}
            fill="#f59e0b"
            fillOpacity="0.06"
          />

          {/* Safety Stock Line */}
          <line
            x1={paddingLeft}
            y1={getY(safetyStock)}
            x2={width - paddingRight}
            y2={getY(safetyStock)}
            stroke="#f59e0b"
            strokeDasharray="3 3"
            strokeWidth="1.2"
          />
          <text
            x={paddingLeft + 4}
            y={getY(safetyStock) - 4}
            fill="#f59e0b"
            fontSize="9"
            fontFamily="monospace"
          >
            Safety Stock: {safetyStock} u
          </text>

          {/* Reorder Point Line */}
          <line
            x1={paddingLeft}
            y1={getY(reorderPoint)}
            x2={width - paddingRight}
            y2={getY(reorderPoint)}
            stroke="#38bdf8"
            strokeDasharray="4 4"
            strokeWidth="1"
            strokeOpacity="0.7"
          />
          <text
            x={paddingLeft + 4}
            y={getY(reorderPoint) - 4}
            fill="#38bdf8"
            fontSize="9"
            fontFamily="monospace"
          >
            ROP: {reorderPoint} u
          </text>

          {/* Lead Time Vertical Marker */}
          <line
            x1={leadTimeX}
            y1={paddingTop}
            x2={leadTimeX}
            y2={height - paddingBottom}
            stroke="#818cf8"
            strokeDasharray="2 2"
            strokeWidth="1"
          />
          <text
            x={leadTimeX + 4}
            y={paddingTop + 12}
            fill="#818cf8"
            fontSize="9"
            fontWeight="bold"
          >
            PO Arrives (Day {leadTimeDays})
          </text>

          {/* Unmitigated Depletion Line */}
          <path
            d={unmitigatedPath}
            fill="none"
            stroke="#f43f5e"
            strokeWidth="2"
            strokeDasharray="4 3"
            strokeLinecap="round"
          />

          {/* Mitigated Replenishment Line */}
          <path
            d={mitigatedPath}
            fill="none"
            stroke="#10b981"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Critical Stockout Point */}
          {projectedRunoutDays <= days && (
            <g>
              <circle cx={runoutX} cy={getY(0)} r="4" fill="#f43f5e" stroke="#fff" strokeWidth="1.5" />
              <text
                x={runoutX}
                y={getY(0) - 8}
                textAnchor="middle"
                fill="#f43f5e"
                fontSize="9"
                fontWeight="bold"
              >
                Stockout: Day {projectedRunoutDays.toFixed(1)}
              </text>
            </g>
          )}

          {/* Current Stock Marker */}
          <circle cx={paddingLeft} cy={getY(currentStock)} r="4" fill="#38bdf8" />
          <text
            x={paddingLeft + 6}
            y={getY(currentStock) + 3}
            fill="#e2e8f0"
            fontSize="9"
            fontFamily="monospace"
          >
            Now: {currentStock} u
          </text>

          {/* X Axis */}
          <line
            x1={paddingLeft}
            y1={height - paddingBottom}
            x2={width - paddingRight}
            y2={height - paddingBottom}
            stroke="#334155"
          />
          {[0, 7, 14, 21, 28, 35].map((d) => (
            <text
              key={d}
              x={getX(d)}
              y={height - paddingBottom + 16}
              textAnchor="middle"
              fill="#64748b"
              fontSize="9"
            >
              Day {d}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
};
