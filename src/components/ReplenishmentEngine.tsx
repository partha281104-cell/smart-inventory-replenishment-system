import React, { useState, useMemo } from 'react';
import {
  ShoppingCart,
  CheckSquare,
  Square,
  Sparkles,
  Info,
  Truck,
  DollarSign,
  ArrowRight,
  ShieldCheck,
  Check
} from 'lucide-react';
import { InventoryItem, OptimizationMetrics, SupplierOffer } from '../types/inventory';
import { calculateOptimizationMetrics } from '../utils/replenishmentMath';

interface ReplenishmentEngineProps {
  items: InventoryItem[];
  onSelectSku: (item: InventoryItem) => void;
  onGenerateBatchPO: (selectedItems: { item: InventoryItem; supplier: SupplierOffer; quantity: number }[]) => void;
  onGenerateSinglePO: (item: InventoryItem, supplier: SupplierOffer, quantity: number) => void;
}

export const ReplenishmentEngine: React.FC<ReplenishmentEngineProps> = ({
  items,
  onSelectSku,
  onGenerateBatchPO,
  onGenerateSinglePO,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filterMode, setFilterMode] = useState<'REORDER_RECOMMENDED' | 'ALL'>('REORDER_RECOMMENDED');

  const itemsWithMetrics = useMemo(() => {
    return items.map((item) => {
      const metrics = calculateOptimizationMetrics(item);
      const supplier = item.suppliers.find((s) => s.supplierId === metrics.recommendedSupplierId) || item.suppliers[0];
      return { item, metrics, supplier };
    });
  }, [items]);

  const displayedList = useMemo(() => {
    if (filterMode === 'REORDER_RECOMMENDED') {
      return itemsWithMetrics.filter(({ metrics }) => metrics.recommendedOrderQty > 0);
    }
    return itemsWithMetrics;
  }, [itemsWithMetrics, filterMode]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const selectAll = () => {
    if (selectedIds.length === displayedList.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(displayedList.map((d) => d.item.id));
    }
  };

  const handleBatchPO = () => {
    const selectedPayload = displayedList
      .filter(({ item }) => selectedIds.includes(item.id))
      .map(({ item, supplier, metrics }) => ({
        item,
        supplier,
        quantity: metrics.recommendedOrderQty || supplier.moq,
      }));

    if (selectedPayload.length > 0) {
      onGenerateBatchPO(selectedPayload);
    }
  };

  const totalBatchCost = useMemo(() => {
    return displayedList
      .filter(({ item }) => selectedIds.includes(item.id))
      .reduce((sum, { metrics }) => sum + metrics.estimatedOrderCost, 0);
  }, [displayedList, selectedIds]);

  return (
    <div className="space-y-6">
      {/* Top Banner with Batch Action Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div>
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Automated Replenishment & Order Optimization
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Stochastic EOQ optimization with dynamic lead-time risk buffering and MOQ rounding.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-100 p-1 rounded-xl flex text-xs font-semibold">
            <button
              onClick={() => setFilterMode('REORDER_RECOMMENDED')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterMode === 'REORDER_RECOMMENDED'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Recommended Only ({itemsWithMetrics.filter((m) => m.metrics.recommendedOrderQty > 0).length})
            </button>
            <button
              onClick={() => setFilterMode('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterMode === 'ALL' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All SKUs ({items.length})
            </button>
          </div>

          {selectedIds.length > 0 && (
            <button
              onClick={handleBatchPO}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm transition-all"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>
                Create Batch PO ({selectedIds.length} items • ${totalBatchCost.toLocaleString()})
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Replenishment Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="p-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === displayedList.length && displayedList.length > 0}
                    onChange={selectAll}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-0 cursor-pointer"
                  />
                </th>
                <th className="p-4">SKU & Item Name</th>
                <th className="p-4 text-right">On Hand</th>
                <th className="p-4 text-right">Safety Stock (SS)</th>
                <th className="p-4 text-right">Reorder Point (ROP)</th>
                <th className="p-4 text-right">EOQ</th>
                <th className="p-4 text-right">Recommended Qty</th>
                <th className="p-4">Allocated Supplier</th>
                <th className="p-4 text-right">Est. Landed Cost</th>
                <th className="p-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {displayedList.map(({ item, metrics, supplier }) => {
                const isChecked = selectedIds.includes(item.id);
                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-slate-50/70 transition-colors cursor-pointer ${
                      isChecked ? 'bg-indigo-50/40' : ''
                    }`}
                    onClick={() => toggleSelect(item.id)}
                  >
                    <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSelect(item.id)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-0 cursor-pointer"
                      />
                    </td>

                    <td className="p-4 font-sans max-w-[220px]">
                      <div className="font-mono text-slate-700 font-bold text-xs">{item.sku}</div>
                      <div className="text-slate-900 font-semibold text-xs truncate mt-0.5">{item.name}</div>
                      <div className="text-[10px] text-slate-400 font-sans">{item.warehouse}</div>
                    </td>

                    <td className="p-4 text-right text-slate-900 font-bold">
                      {item.currentStock} u
                    </td>

                    <td className="p-4 text-right text-amber-600 font-semibold">
                      {metrics.safetyStock} u
                    </td>

                    <td className="p-4 text-right text-indigo-600 font-semibold">
                      {metrics.reorderPoint} u
                    </td>

                    <td className="p-4 text-right text-slate-600">
                      {metrics.economicOrderQuantity} u
                    </td>

                    <td className="p-4 text-right">
                      {metrics.recommendedOrderQty > 0 ? (
                        <span className="text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md inline-block">
                          +{metrics.recommendedOrderQty} u
                        </span>
                      ) : (
                        <span className="text-slate-400 font-sans">0</span>
                      )}
                    </td>

                    <td className="p-4 font-sans">
                      <div className="text-slate-900 font-semibold text-xs truncate">{supplier.supplierName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {supplier.leadTimeDays}d lead • ${(supplier.unitCost + supplier.shippingCostPerUnit).toFixed(2)}/u
                      </div>
                    </td>

                    <td className="p-4 text-right text-slate-900 font-bold">
                      ${metrics.estimatedOrderCost.toLocaleString()}
                    </td>

                    <td className="p-4 text-center font-sans" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1.5">
                        {metrics.recommendedOrderQty > 0 ? (
                          <button
                            onClick={() => onGenerateSinglePO(item, supplier, metrics.recommendedOrderQty)}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition-all shadow-xs"
                          >
                            Order
                          </button>
                        ) : null}
                        <button
                          onClick={() => onSelectSku(item)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                          title="Inspect 360 Analysis"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {displayedList.length === 0 && (
            <div className="p-12 text-center text-slate-400">
              No replenishment orders required. All SKUs are currently operating within safe inventory thresholds.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
