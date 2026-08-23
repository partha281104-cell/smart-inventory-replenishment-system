import React, { useState, useEffect } from 'react';
import { X, Sparkles, ShieldAlert, CheckCircle2, TrendingDown, DollarSign, RefreshCw, Printer, AlertTriangle } from 'lucide-react';
import { InventoryItem } from '../types/inventory';
import { calculateOptimizationMetrics } from '../utils/replenishmentMath';

interface AuditReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: InventoryItem[];
  onQuickReplenishAllCritical: () => void;
}

export const AuditReportModal: React.FC<AuditReportModalProps> = ({
  isOpen,
  onClose,
  items,
  onQuickReplenishAllCritical,
}) => {
  if (!isOpen) return null;

  const [auditNarrative, setAuditNarrative] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  const metricsList = items.map((i) => calculateOptimizationMetrics(i));
  const criticalItems = items.filter((_, idx) => metricsList[idx].riskLevel === 'CRITICAL');
  const overstockedItems = items.filter((_, idx) => metricsList[idx].riskLevel === 'OVERSTOCKED');
  const totalStockoutLoss = metricsList.reduce((s, m) => s + m.potentialStockoutLoss, 0);
  const totalExcessCapital = metricsList.reduce((s, m) => s + m.excessHoldingCostPerMonth * 12, 0);

  useEffect(() => {
    generateGlobalAudit();
  }, []);

  const generateGlobalAudit = async () => {
    setLoading(true);
    try {
      const summaryPayload = {
        totalSKUs: items.length,
        criticalSKUs: criticalItems.map((c) => c.sku).join(', '),
        overstockedSKUs: overstockedItems.map((o) => o.sku).join(', '),
        totalStockoutLoss,
        totalExcessCapital,
      };

      const res = await fetch('/api/gemini/analyze-risk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sku: 'CATALOG-AUDIT',
          name: 'Global Inventory Health Audit',
          category: 'All Categories',
          currentStock: items.reduce((s, i) => s + i.currentStock, 0),
          avgDailyDemand: items.reduce((s, i) => s + i.avgDailyDemand, 0),
          daysOfSupply: 32,
          projectedRunoutDays: 4,
          safetyStock: 150,
          reorderPoint: 400,
          recommendedOrderQty: 850,
          recommendedSupplierName: 'Multiple Certified Vendors',
          leadTimeDays: 7,
          potentialStockoutLoss: totalStockoutLoss,
          riskLevel: criticalItems.length > 0 ? 'CRITICAL' : 'HEALTHY',
          recentSalesTrend: 'Multi-category seasonal expansion',
        }),
      });

      const data = await res.json();
      setAuditNarrative(data.explanation);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-3xl bg-white border border-slate-200/80 rounded-3xl shadow-2xl overflow-hidden z-10">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Autonomous Supply Chain Risk Audit
              </h2>
              <div className="text-[11px] text-slate-500">
                Generated {new Date().toLocaleDateString()} • ReStock AI Diagnostic Engine
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={generateGlobalAudit}
              disabled={loading}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
              title="Rerun Audit"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl">
              <span className="text-slate-400 text-[10px] uppercase font-bold">Lost Sales Exposure</span>
              <div className="text-2xl font-black font-mono text-rose-600 mt-1">
                ${totalStockoutLoss.toLocaleString()}
              </div>
              <span className="text-[11px] text-slate-500 mt-0.5 block">{criticalItems.length} SKUs in imminent danger</span>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl">
              <span className="text-slate-400 text-[10px] uppercase font-bold">Trapped Holding Capital</span>
              <div className="text-2xl font-black font-mono text-purple-700 mt-1">
                ${totalExcessCapital.toLocaleString()}
                <span className="text-xs font-normal text-slate-400 font-sans ml-1">/yr</span>
              </div>
              <span className="text-[11px] text-slate-500 mt-0.5 block">{overstockedItems.length} overstocked lines</span>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl">
              <span className="text-slate-400 text-[10px] uppercase font-bold">Catalog Health Rating</span>
              <div className="text-2xl font-black font-mono text-emerald-600 mt-1">
                {Math.round(((items.length - criticalItems.length) / items.length) * 100)}%
              </div>
              <span className="text-[11px] text-slate-500 mt-0.5 block">Operating within safety bounds</span>
            </div>
          </div>

          {/* AI Narrative */}
          <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl p-6 shadow-sm text-white">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                Executive Synthesis & AI Diagnostic
              </span>
            </div>

            {loading ? (
              <div className="space-y-2 py-4 animate-pulse">
                <div className="h-3 bg-slate-800 rounded w-2/3"></div>
                <div className="h-3 bg-slate-800 rounded w-full"></div>
                <div className="h-3 bg-slate-800 rounded w-4/5"></div>
              </div>
            ) : (
              <div className="text-slate-300 leading-relaxed whitespace-pre-line text-xs">
                {auditNarrative}
              </div>
            )}
          </div>

          {/* Critical SKU Table */}
          {criticalItems.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                  <span>Immediate Action Required ({criticalItems.length} Critical Items)</span>
                </span>
                <button
                  onClick={() => {
                    onQuickReplenishAllCritical();
                    onClose();
                  }}
                  className="bg-rose-600 hover:bg-rose-500 text-white font-semibold px-3.5 py-1.5 rounded-xl text-xs transition-all shadow-xs"
                >
                  One-Click Auto-Replenish All Critical
                </button>
              </div>

              <div className="border border-slate-200/80 rounded-2xl overflow-hidden bg-white shadow-2xs">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-100 text-[11px]">
                      <th className="p-3.5">SKU</th>
                      <th className="p-3.5 text-right">On-Hand</th>
                      <th className="p-3.5 text-right">Runout Horizon</th>
                      <th className="p-3.5 text-right">Potential Loss</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {criticalItems.map((item) => {
                      const m = calculateOptimizationMetrics(item);
                      return (
                        <tr key={item.id}>
                          <td className="p-3.5 font-sans">
                            <span className="font-mono font-bold text-rose-600 block">{item.sku}</span>
                            <span className="text-slate-800 text-xs font-semibold">{item.name}</span>
                          </td>
                          <td className="p-3.5 text-right font-bold text-slate-900">{item.currentStock} u</td>
                          <td className="p-3.5 text-right text-rose-600 font-bold">{m.projectedRunoutDays}d</td>
                          <td className="p-3.5 text-right text-slate-900 font-bold">${m.potentialStockoutLoss.toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold transition-all shadow-xs"
          >
            Close Audit
          </button>
        </div>
      </div>
    </div>
  );
};
