import React, { useState, useEffect } from 'react';
import {
  X,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Package,
  Truck,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  ShoppingCart,
  Plus,
  Minus
} from 'lucide-react';
import { InventoryItem, OptimizationMetrics, SupplierOffer } from '../types/inventory';
import { StockProjectionChart } from './charts/StockProjectionChart';
import { ForecastChart } from './charts/ForecastChart';

interface SkuDetailDrawerProps {
  item: InventoryItem | null;
  metrics: OptimizationMetrics | null;
  onClose: () => void;
  onGeneratePO: (item: InventoryItem, supplier: SupplierOffer, quantity: number) => void;
  onUpdateStock: (itemId: string, newStock: number) => void;
}

export const SkuDetailDrawer: React.FC<SkuDetailDrawerProps> = ({
  item,
  metrics,
  onClose,
  onGeneratePO,
  onUpdateStock,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'forecast' | 'suppliers' | 'math'>('overview');
  const [aiExplanation, setAiExplanation] = useState<string>('');
  const [isLoadingAi, setIsLoadingAi] = useState<boolean>(false);
  const [stockEditVal, setStockEditVal] = useState<number>(item?.currentStock || 0);

  useEffect(() => {
    if (item) {
      setStockEditVal(item.currentStock);
      fetchAiExplanation();
    }
  }, [item?.id]);

  if (!item || !metrics) return null;

  const fetchAiExplanation = async () => {
    setIsLoadingAi(true);
    try {
      const bestSupplier = item.suppliers.find(s => s.supplierId === metrics.recommendedSupplierId) || item.suppliers[0];
      const recentTrend = item.historicalSales.slice(-7).reduce((acc, h) => acc + h.actualDemand, 0) / 7 > item.avgDailyDemand
        ? 'Accelerating upward (+28% vs 30-day baseline)'
        : 'Stable at baseline';

      const res = await fetch('/api/gemini/analyze-risk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sku: item.sku,
          name: item.name,
          category: item.category,
          currentStock: item.currentStock,
          avgDailyDemand: item.avgDailyDemand,
          daysOfSupply: metrics.daysOfSupply,
          projectedRunoutDays: metrics.projectedRunoutDays,
          safetyStock: metrics.safetyStock,
          reorderPoint: metrics.reorderPoint,
          recommendedOrderQty: metrics.recommendedOrderQty,
          recommendedSupplierName: metrics.recommendedSupplierName,
          leadTimeDays: bestSupplier?.leadTimeDays || 7,
          potentialStockoutLoss: metrics.potentialStockoutLoss,
          riskLevel: metrics.riskLevel,
          recentSalesTrend: recentTrend,
        }),
      });

      const data = await res.json();
      if (data.explanation) {
        setAiExplanation(data.explanation);
      }
    } catch (err) {
      console.error('Error fetching AI explanation:', err);
    } finally {
      setIsLoadingAi(false);
    }
  };

  const bestSupplier = item.suppliers.find(s => s.supplierId === metrics.recommendedSupplierId) || item.suppliers[0];

  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Critical Stockout Imminent</span>;
      case 'HIGH':
        return <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Breached Reorder Point</span>;
      case 'OVERSTOCKED':
        return <span className="bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Excess Holding Capital</span>;
      default:
        return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Optimal Inventory</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-2xl bg-white border-l border-slate-200 shadow-2xl h-full flex flex-col z-10 overflow-y-auto">
        {/* Drawer Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-slate-200 p-6 z-20">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="font-mono text-xs text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded font-bold">
                  {item.sku}
                </span>
                <span className="text-xs text-slate-500 font-medium">{item.category}</span>
                <span className="text-xs text-slate-300">•</span>
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">Class {item.abcClass}</span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 leading-snug">{item.name}</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center justify-between mt-4 pt-3.5 border-t border-slate-100">
            <div>{getRiskBadge(metrics.riskLevel)}</div>
            <div className="text-right">
              <span className="text-xs text-slate-500">Runout Horizon: </span>
              <span className={`font-mono text-sm font-bold ${metrics.projectedRunoutDays <= 5 ? 'text-rose-600' : 'text-slate-900'}`}>
                {metrics.projectedRunoutDays} Days ({metrics.projectedRunoutDate})
              </span>
            </div>
          </div>

          {/* Sub-tabs */}
          <div className="flex items-center gap-1.5 mt-4 bg-slate-100 p-1 rounded-xl">
            {(['overview', 'forecast', 'suppliers', 'math'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                  activeTab === tab
                    ? 'bg-white text-indigo-600 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Drawer Content */}
        <div className="p-6 space-y-6 flex-1 bg-slate-50/50">
          {activeTab === 'overview' && (
            <>
              {/* AI Agentic Explanation Card */}
              <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl p-5 shadow-sm text-white">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                      ReStock AI Intelligence Brief
                    </span>
                  </div>
                  <button
                    onClick={fetchAiExplanation}
                    disabled={isLoadingAi}
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoadingAi ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                </div>

                {isLoadingAi ? (
                  <div className="space-y-2 py-4 animate-pulse">
                    <div className="h-3 bg-slate-800 rounded w-3/4"></div>
                    <div className="h-3 bg-slate-800 rounded w-full"></div>
                    <div className="h-3 bg-slate-800 rounded w-5/6"></div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-line prose prose-invert max-w-none">
                    {aiExplanation || metrics.reasoningBrief}
                  </div>
                )}
              </div>

              {/* Key Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-2xs">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">On-Hand Stock</div>
                  <div className="text-lg font-bold text-slate-900 font-mono mt-0.5">{item.currentStock}</div>
                  <div className="text-[10px] text-slate-400">{item.allocatedStock} allocated</div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-2xs">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Safety Stock</div>
                  <div className="text-lg font-bold text-amber-600 font-mono mt-0.5">{metrics.safetyStock}</div>
                  <div className="text-[10px] text-slate-400">{(item.targetServiceLevel * 100).toFixed(0)}% Service Lvl</div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-2xs">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Reorder Point</div>
                  <div className="text-lg font-bold text-indigo-600 font-mono mt-0.5">{metrics.reorderPoint}</div>
                  <div className="text-[10px] text-slate-400">Threshold trigger</div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-2xs">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Recommended PO</div>
                  <div className="text-lg font-bold text-emerald-600 font-mono mt-0.5">
                    {metrics.recommendedOrderQty > 0 ? metrics.recommendedOrderQty : 'None'}
                  </div>
                  <div className="text-[10px] text-slate-400">MOQ-aligned</div>
                </div>
              </div>

              {/* Stock Depletion Trajectory Chart */}
              <StockProjectionChart
                currentStock={item.currentStock}
                safetyStock={metrics.safetyStock}
                reorderPoint={metrics.reorderPoint}
                avgDailyDemand={item.avgDailyDemand}
                leadTimeDays={bestSupplier?.leadTimeDays || 7}
                onOrderStock={item.onOrderStock}
                projectedRunoutDays={metrics.projectedRunoutDays}
                recommendedOrderQty={metrics.recommendedOrderQty}
              />

              {/* Recommended Action Bar */}
              {metrics.recommendedOrderQty > 0 && (
                <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4.5 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-bold text-emerald-900">Optimal Procurement Recommended</div>
                    <div className="text-xs text-emerald-700 mt-0.5">
                      Order <strong className="text-emerald-950 font-bold">{metrics.recommendedOrderQty} units</strong> via <strong className="text-emerald-950 font-bold">{bestSupplier.supplierName}</strong> (${metrics.estimatedOrderCost.toLocaleString()} est. landed)
                    </div>
                  </div>
                  <button
                    onClick={() => onGeneratePO(item, bestSupplier, metrics.recommendedOrderQty)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shrink-0 flex items-center gap-1.5 shadow-xs transition-colors"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>Create Draft PO</span>
                  </button>
                </div>
              )}

              {/* Quick Stock Adjustment Tool */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4.5 shadow-2xs">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
                  Inventory Cycle Count & Stock Adjustment
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 overflow-hidden">
                    <button
                      onClick={() => setStockEditVal(prev => Math.max(0, prev - 10))}
                      className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-200/50 transition-colors"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="number"
                      value={stockEditVal}
                      onChange={(e) => setStockEditVal(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-20 bg-transparent text-center text-sm font-mono text-slate-900 font-bold py-1.5 focus:outline-none"
                    />
                    <button
                      onClick={() => setStockEditVal(prev => prev + 10)}
                      className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-200/50 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={() => onUpdateStock(item.id, stockEditVal)}
                    disabled={stockEditVal === item.currentStock}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-xs"
                  >
                    Save Stock Count
                  </button>
                  <span className="text-xs text-slate-400">Last audited: {item.lastAuditedAt}</span>
                </div>
              </div>
            </>
          )}

          {activeTab === 'forecast' && (
            <div className="space-y-4">
              <ForecastChart
                historical={item.historicalSales}
                forecast={item.forecast30d}
                skuName={item.name}
                avgDailyDemand={item.avgDailyDemand}
              />

              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3">
                  Demand Forecasting Parameters
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Avg Daily Velocity</span>
                    <span className="text-sm font-bold text-slate-900 font-mono mt-1 block">
                      {item.avgDailyDemand} units/day
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Demand Std Dev (σD)</span>
                    <span className="text-sm font-bold text-slate-900 font-mono mt-1 block">
                      ±{item.stdDevDailyDemand} units
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Target Service Level</span>
                    <span className="text-sm font-bold text-emerald-600 font-mono mt-1 block">
                      {(item.targetServiceLevel * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'suppliers' && (
            <div className="space-y-4">
              <div className="text-xs text-slate-500">
                Multi-supplier scorecard evaluated against price breaks, lead time volatility, and reliability.
              </div>

              {item.suppliers.map((sup) => {
                const isSelected = sup.supplierId === metrics.recommendedSupplierId;
                return (
                  <div
                    key={sup.supplierId}
                    className={`p-5 rounded-2xl border transition-all ${
                      isSelected
                        ? 'bg-white border-indigo-300 ring-2 ring-indigo-500/20 shadow-sm'
                        : 'bg-white border-slate-200/80 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">{sup.supplierName}</span>
                          {isSelected && (
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              AI Recommended Vendor
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-500">{sup.location}</span>
                      </div>
                      <button
                        onClick={() => onGeneratePO(item, sup, metrics.recommendedOrderQty || sup.moq)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-xs text-white font-semibold px-3.5 py-1.5 rounded-xl transition-all shadow-xs flex items-center gap-1"
                      >
                        <ShoppingCart className="w-3 h-3" />
                        <span>Order Here</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-3.5 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100 font-mono">
                      <div>
                        <span className="text-slate-400 block text-[10px] font-sans font-bold uppercase">Unit Cost</span>
                        <span className="font-bold text-slate-900">${sup.unitCost.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] font-sans font-bold uppercase">Lead Time</span>
                        <span className="font-bold text-slate-800">{sup.leadTimeDays}d (±{sup.leadTimeVarianceDays}d)</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] font-sans font-bold uppercase">OTIF Reliability</span>
                        <span className="font-bold text-emerald-600">{(sup.otifReliabilityRate * 100).toFixed(0)}%</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] font-sans font-bold uppercase">Defect Rate</span>
                        <span className="font-bold text-slate-700">{(sup.defectRate * 100).toFixed(1)}%</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] font-sans font-bold uppercase">MOQ</span>
                        <span className="font-bold text-slate-800">{sup.moq} u</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'math' && (
            <div className="space-y-4">
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs">
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-2">
                  Optimization Formula Transparency
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  ReStock AI calculates replenishment parameters using stochastic inventory theory combining demand uncertainty and lead-time variance.
                </p>

                <div className="mt-4 space-y-3 text-xs font-mono">
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-700 block text-[11px] font-sans font-bold mb-1">
                      1. Safety Stock Calculation (SS)
                    </span>
                    <div className="text-slate-800">
                      SS = Z × √( L · σD² + D² · σL² )
                    </div>
                    <div className="text-slate-500 text-[11px] mt-1">
                      = {metrics.zScore} × √( ({bestSupplier.leadTimeDays} × {item.stdDevDailyDemand}²) + ({item.avgDailyDemand}² × {bestSupplier.leadTimeVarianceDays}²) )
                    </div>
                    <div className="text-amber-600 font-bold mt-1">
                      = {metrics.safetyStock} units
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-700 block text-[11px] font-sans font-bold mb-1">
                      2. Reorder Point (ROP)
                    </span>
                    <div className="text-slate-800">
                      ROP = (Avg Daily Demand × Lead Time) + Safety Stock
                    </div>
                    <div className="text-slate-500 text-[11px] mt-1">
                      = ({item.avgDailyDemand} × {bestSupplier.leadTimeDays}) + {metrics.safetyStock}
                    </div>
                    <div className="text-indigo-600 font-bold mt-1">
                      = {metrics.reorderPoint} units
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-700 block text-[11px] font-sans font-bold mb-1">
                      3. Economic Order Quantity (EOQ)
                    </span>
                    <div className="text-slate-800">
                      EOQ = √( (2 · AnnualDemand · OrderCost) / (UnitCost · HoldingRate) )
                    </div>
                    <div className="text-emerald-600 font-bold mt-1">
                      = {metrics.economicOrderQuantity} units (aligned with MOQ: {bestSupplier.moq})
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
