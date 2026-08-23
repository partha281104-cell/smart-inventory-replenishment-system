import React, { useState, useMemo } from 'react';
import {
  AlertOctagon,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Search,
  Sparkles,
  ArrowRight,
  ArrowUpRight,
  ShieldCheck,
  Package
} from 'lucide-react';
import { InventoryItem, OptimizationMetrics, WarehouseLocation, RiskLevel } from '../types/inventory';
import { calculateOptimizationMetrics } from '../utils/replenishmentMath';

interface RiskCenterProps {
  items: InventoryItem[];
  selectedWarehouse: 'ALL' | WarehouseLocation;
  onSelectSku: (item: InventoryItem) => void;
  onQuickReplenish: (item: InventoryItem) => void;
  onOpenAudit: () => void;
}

export const RiskCenter: React.FC<RiskCenterProps> = ({
  items,
  selectedWarehouse,
  onSelectSku,
  onQuickReplenish,
  onOpenAudit,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState<string>('ALL');
  const [abcFilter, setAbcFilter] = useState<string>('ALL');

  // Filter items by warehouse first
  const warehouseFilteredItems = useMemo(() => {
    if (selectedWarehouse === 'ALL') return items;
    return items.filter((item) => item.warehouse === selectedWarehouse);
  }, [items, selectedWarehouse]);

  // Compute metrics for all items
  const itemsWithMetrics = useMemo(() => {
    return warehouseFilteredItems.map((item) => ({
      item,
      metrics: calculateOptimizationMetrics(item),
    }));
  }, [warehouseFilteredItems]);

  // Aggregate KPI summary
  const summary = useMemo(() => {
    let totalStockoutRiskExposure = 0;
    let totalExcessCapital = 0;
    let criticalCount = 0;
    let highRiskCount = 0;
    let healthyCount = 0;
    let totalReplenishmentNeeded = 0;

    itemsWithMetrics.forEach(({ item, metrics }) => {
      totalStockoutRiskExposure += metrics.potentialStockoutLoss;
      totalExcessCapital += metrics.excessHoldingCostPerMonth * 12;
      totalReplenishmentNeeded += metrics.estimatedOrderCost;

      if (metrics.riskLevel === 'CRITICAL') criticalCount++;
      else if (metrics.riskLevel === 'HIGH') highRiskCount++;
      else if (metrics.riskLevel === 'HEALTHY') healthyCount++;
    });

    const totalSKUs = itemsWithMetrics.length;
    const healthScore = totalSKUs > 0 ? Math.round(((totalSKUs - criticalCount * 1.5 - highRiskCount * 0.5) / totalSKUs) * 100) : 100;

    return {
      totalStockoutRiskExposure,
      totalExcessCapital,
      criticalCount,
      highRiskCount,
      healthyCount,
      totalReplenishmentNeeded,
      healthScore: Math.max(10, Math.min(100, healthScore)),
    };
  }, [itemsWithMetrics]);

  // Filtered list for the matrix table
  const displayedItems = useMemo(() => {
    return itemsWithMetrics.filter(({ item, metrics }) => {
      if (categoryFilter !== 'ALL' && item.category !== categoryFilter) return false;
      if (riskFilter !== 'ALL' && metrics.riskLevel !== riskFilter) return false;
      if (abcFilter !== 'ALL' && item.abcClass !== abcFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          item.sku.toLowerCase().includes(q) ||
          item.name.toLowerCase().includes(q) ||
          item.tags.some((t) => t.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [itemsWithMetrics, categoryFilter, riskFilter, abcFilter, searchQuery]);

  // Urgent items (< 7 days runout)
  const urgentAlerts = useMemo(() => {
    return itemsWithMetrics
      .filter(({ metrics }) => metrics.riskLevel === 'CRITICAL' || metrics.riskLevel === 'HIGH')
      .sort((a, b) => a.metrics.projectedRunoutDays - b.metrics.projectedRunoutDays);
  }, [itemsWithMetrics]);

  const getRiskPill = (level: RiskLevel) => {
    switch (level) {
      case 'CRITICAL':
        return (
          <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-0.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
            Critical Runout
          </span>
        );
      case 'HIGH':
        return (
          <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            High Risk (ROP)
          </span>
        );
      case 'OVERSTOCKED':
        return (
          <span className="bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-0.5 rounded-full text-xs font-semibold shadow-2xs">
            Overstocked
          </span>
        );
      default:
        return (
          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full text-xs font-semibold inline-flex items-center gap-1 shadow-2xs">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            Optimal
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Metric Cards Deck */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Stockout Exposure */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Stockout Risk Exposure
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
              <AlertOctagon className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600 font-mono mt-2 tracking-tight">
            ${summary.totalStockoutRiskExposure.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
            <span className="font-semibold text-rose-600">{summary.criticalCount} SKUs</span> at imminent runout risk
          </div>
        </div>

        {/* KPI 2: Excess Capital Drain */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Excess Holding Capital
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-700 font-mono mt-2 tracking-tight">
            ${summary.totalExcessCapital.toLocaleString()}
            <span className="text-xs text-slate-400 font-normal font-sans ml-1">/yr</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">Trapped in slow-moving inventory</div>
        </div>

        {/* KPI 3: Replenishment Capital Needed */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Recommended PO Volume
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-indigo-600 font-mono mt-2 tracking-tight">
            ${summary.totalReplenishmentNeeded.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 mt-1">Optimal volume across safety triggers</div>
        </div>

        {/* KPI 4: Supply Chain Health Score */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Catalog Health Index
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 font-mono mt-2 tracking-tight">
            {summary.healthScore}%
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {summary.healthyCount} of {itemsWithMetrics.length} SKUs in optimal buffer
          </div>
        </div>
      </div>

      {/* Urgent Action Feed Banner */}
      {urgentAlerts.length > 0 && (
        <div className="bg-gradient-to-r from-rose-50 via-white to-amber-50/40 border border-rose-200/80 rounded-2xl p-5 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-rose-800">
                Action Required: {urgentAlerts.length} Critical Stockout Alerts
              </span>
            </div>
            <button
              onClick={onOpenAudit}
              className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1.5 font-semibold transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>Full AI Diagnostics Report</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {urgentAlerts.slice(0, 2).map(({ item, metrics }) => (
              <div
                key={item.id}
                className="bg-white border border-rose-100 rounded-xl p-4 flex items-center justify-between gap-3 shadow-2xs hover:border-rose-300 transition-all"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md font-bold border border-rose-200/60">
                      {item.sku}
                    </span>
                    <span className="text-xs text-slate-900 font-semibold truncate">{item.name}</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1.5">
                    Runout in <strong className="text-rose-600 font-mono">{metrics.projectedRunoutDays}d</strong> ({metrics.projectedRunoutDate}) • Exposure: <strong className="text-slate-900 font-mono">${metrics.potentialStockoutLoss.toLocaleString()}</strong>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onQuickReplenish(item)}
                    className="bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs px-3 py-1.5 rounded-xl shadow-xs transition-colors flex items-center gap-1"
                  >
                    <ShoppingCart className="w-3 h-3" />
                    <span>Replenish</span>
                  </button>
                  <button
                    onClick={() => onSelectSku(item)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
                    title="View 360 Deep Dive"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3 flex-1 min-w-[240px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by SKU, item title, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 hover:bg-slate-100/50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 font-medium cursor-pointer"
          >
            <option value="ALL">All Risk Tiers</option>
            <option value="CRITICAL">Critical Only</option>
            <option value="HIGH">High Risk (ROP)</option>
            <option value="HEALTHY">Healthy Buffer</option>
            <option value="OVERSTOCKED">Overstocked</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 font-medium cursor-pointer"
          >
            <option value="ALL">All Categories</option>
            <option value="Consumer Electronics">Consumer Electronics</option>
            <option value="Industrial Hardware">Industrial Hardware</option>
            <option value="Food & Beverage">Food & Beverage</option>
            <option value="Apparel & Footwear">Apparel & Footwear</option>
            <option value="Health & Beauty">Health & Beauty</option>
            <option value="Office & Facilities">Office & Facilities</option>
          </select>

          <select
            value={abcFilter}
            onChange={(e) => setAbcFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 font-medium cursor-pointer"
          >
            <option value="ALL">ABC Classification</option>
            <option value="A">Class A (Top 80% Rev)</option>
            <option value="B">Class B (Mid 15% Rev)</option>
            <option value="C">Class C (Low 5% Rev)</option>
          </select>
        </div>
      </div>

      {/* Main Inventory Risk Matrix Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="p-4">SKU & Item Details</th>
                <th className="p-4">Risk Status</th>
                <th className="p-4 text-right">On-Hand</th>
                <th className="p-4 text-right">Daily Velocity</th>
                <th className="p-4 text-right">Days of Supply</th>
                <th className="p-4 text-right">Safety Buffer</th>
                <th className="p-4 text-right">Reorder Point</th>
                <th className="p-4 text-right">AI Recommended PO</th>
                <th className="p-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedItems.map(({ item, metrics }) => (
                <tr
                  key={item.id}
                  className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                  onClick={() => onSelectSku(item)}
                >
                  <td className="p-4 max-w-[240px]">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-700 font-bold bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-[11px]">
                        {item.sku}
                      </span>
                      <span className="text-[10px] text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded font-bold uppercase">
                        Class {item.abcClass}
                      </span>
                    </div>
                    <div className="font-semibold text-slate-900 mt-1 truncate group-hover:text-indigo-600 transition-colors">
                      {item.name}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{item.category} • {item.warehouse}</div>
                  </td>

                  <td className="p-4">{getRiskPill(metrics.riskLevel)}</td>

                  <td className="p-4 text-right font-mono font-bold text-slate-900">
                    {item.currentStock}
                    {item.onOrderStock > 0 && (
                      <span className="text-[10px] text-indigo-600 block font-sans font-medium">
                        +{item.onOrderStock} on order
                      </span>
                    )}
                  </td>

                  <td className="p-4 text-right font-mono text-slate-600">
                    {item.avgDailyDemand} u/d
                  </td>

                  <td className="p-4 text-right font-mono">
                    <span
                      className={`font-bold ${
                        metrics.projectedRunoutDays <= 4
                          ? 'text-rose-600 font-black'
                          : metrics.projectedRunoutDays <= 10
                          ? 'text-amber-600 font-bold'
                          : 'text-slate-700'
                      }`}
                    >
                      {metrics.projectedRunoutDays}d
                    </span>
                    <span className="text-[10px] text-slate-400 block font-sans">
                      {metrics.projectedRunoutDate}
                    </span>
                  </td>

                  <td className="p-4 text-right font-mono text-amber-600 font-semibold">
                    {metrics.safetyStock} u
                  </td>

                  <td className="p-4 text-right font-mono text-indigo-600 font-semibold">
                    {metrics.reorderPoint} u
                  </td>

                  <td className="p-4 text-right font-mono">
                    {metrics.recommendedOrderQty > 0 ? (
                      <div>
                        <span className="text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md inline-block">
                          +{metrics.recommendedOrderQty} u
                        </span>
                        <span className="text-[10px] text-slate-500 block font-sans mt-0.5 truncate max-w-[120px] ml-auto">
                          via {metrics.recommendedSupplierName.split(' ')[0]}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400 font-sans">None</span>
                    )}
                  </td>

                  <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                    {metrics.recommendedOrderQty > 0 ? (
                      <button
                        onClick={() => onQuickReplenish(item)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3 py-1.5 rounded-xl shadow-xs transition-all"
                      >
                        Auto-PO
                      </button>
                    ) : (
                      <button
                        onClick={() => onSelectSku(item)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors"
                      >
                        Inspect
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {displayedItems.length === 0 && (
            <div className="p-12 text-center text-slate-400">
              No inventory items matched your filter criteria.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
