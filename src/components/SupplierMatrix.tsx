import React, { useState, useMemo } from 'react';
import { Truck, ShieldCheck, Sparkles, Copy, Check, SlidersHorizontal, DollarSign, Award, ChevronRight } from 'lucide-react';
import { InventoryItem, SupplierOffer } from '../types/inventory';
import { scoreSupplier } from '../utils/replenishmentMath';

interface SupplierMatrixProps {
  items: InventoryItem[];
}

export const SupplierMatrix: React.FC<SupplierMatrixProps> = ({ items }) => {
  const [selectedSkuId, setSelectedSkuId] = useState<string>(items[0]?.id || '');
  const [costWeight, setCostWeight] = useState<number>(35);
  const [speedWeight, setSpeedWeight] = useState<number>(30);
  const [reliabilityWeight, setReliabilityWeight] = useState<number>(25);
  const [qualityWeight, setQualityWeight] = useState<number>(10);

  const [negotiationTargetSupplier, setNegotiationTargetSupplier] = useState<SupplierOffer | null>(null);
  const [negotiationMemo, setNegotiationMemo] = useState<string>('');
  const [isGeneratingMemo, setIsGeneratingMemo] = useState<boolean>(false);
  const [copiedMemo, setCopiedMemo] = useState<boolean>(false);

  const selectedItem = useMemo(() => {
    return items.find((i) => i.id === selectedSkuId) || items[0];
  }, [items, selectedSkuId]);

  // Normalize weights
  const totalWeight = costWeight + speedWeight + reliabilityWeight + qualityWeight || 100;
  const normalizedWeights = {
    cost: costWeight / totalWeight,
    speed: speedWeight / totalWeight,
    reliability: reliabilityWeight / totalWeight,
    quality: qualityWeight / totalWeight,
  };

  const scoredSuppliers = useMemo(() => {
    if (!selectedItem) return [];
    const currentDays = selectedItem.currentStock / Math.max(0.1, selectedItem.avgDailyDemand);
    const scored = selectedItem.suppliers.map((s) => scoreSupplier(selectedItem, s, currentDays, normalizedWeights));
    scored.sort((a, b) => b.compositeScore - a.compositeScore);
    if (scored.length > 0) {
      scored[0].recommended = true;
    }
    return scored;
  }, [selectedItem, normalizedWeights]);

  const handleGenerateNegotiationMemo = async (supplier: SupplierOffer) => {
    setNegotiationTargetSupplier(supplier);
    setIsGeneratingMemo(true);
    setCopiedMemo(false);

    try {
      const res = await fetch('/api/gemini/negotiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sku: selectedItem.sku,
          name: selectedItem.name,
          supplierName: supplier.supplierName,
          currentUnitCost: supplier.unitCost,
          leadTimeDays: supplier.leadTimeDays,
          moq: supplier.moq,
          targetOrderQty: supplier.moq * 2,
          otifReliability: supplier.otifReliabilityRate,
          defectRate: supplier.defectRate,
        }),
      });

      const data = await res.json();
      if (data.memo) {
        setNegotiationMemo(data.memo);
      }
    } catch (err) {
      console.error('Error generating negotiation memo:', err);
    } finally {
      setIsGeneratingMemo(false);
    }
  };

  const handleCopyMemo = () => {
    if (negotiationMemo) {
      navigator.clipboard.writeText(negotiationMemo);
      setCopiedMemo(true);
      setTimeout(() => setCopiedMemo(false), 2500);
    }
  };

  if (!selectedItem) return null;

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div>
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Multi-Supplier Intelligence & Scorecard Allocation
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Evaluate unit economics, shipping lead-time risk, on-time delivery (OTIF), and defect rates.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs text-slate-500 font-semibold">Select SKU to Compare:</label>
          <select
            value={selectedSkuId}
            onChange={(e) => {
              setSelectedSkuId(e.target.value);
              setNegotiationMemo('');
              setNegotiationTargetSupplier(null);
            }}
            className="bg-slate-50 hover:bg-slate-100/70 border border-slate-200 text-slate-800 text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 min-w-[240px] cursor-pointer"
          >
            {items.map((i) => (
              <option key={i.id} value={i.id}>
                {i.sku} ({i.suppliers.length} vendors)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Dynamic Weight Tuning Sliders */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center gap-2 mb-3.5">
          <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Dynamic Scorecard Evaluation Weights
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <div className="flex justify-between text-slate-700 font-medium mb-1.5">
              <span>Landed Cost</span>
              <span className="font-mono font-bold text-emerald-600">{costWeight}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={costWeight}
              onChange={(e) => setCostWeight(parseInt(e.target.value))}
              className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
          </div>

          <div>
            <div className="flex justify-between text-slate-700 font-medium mb-1.5">
              <span>Lead Time Speed</span>
              <span className="font-mono font-bold text-blue-600">{speedWeight}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={speedWeight}
              onChange={(e) => setSpeedWeight(parseInt(e.target.value))}
              className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          <div>
            <div className="flex justify-between text-slate-700 font-medium mb-1.5">
              <span>OTIF Reliability</span>
              <span className="font-mono font-bold text-amber-600">{reliabilityWeight}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={reliabilityWeight}
              onChange={(e) => setReliabilityWeight(parseInt(e.target.value))}
              className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-amber-600"
            />
          </div>

          <div>
            <div className="flex justify-between text-slate-700 font-medium mb-1.5">
              <span>Quality / Low Defect</span>
              <span className="font-mono font-bold text-purple-600">{qualityWeight}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={qualityWeight}
              onChange={(e) => setQualityWeight(parseInt(e.target.value))}
              className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-purple-600"
            />
          </div>
        </div>
      </div>

      {/* Supplier Comparison Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {scoredSuppliers.map((detail) => {
          const { supplier, compositeScore, recommended, tradeOffSummary } = detail;
          const isSelectedForNegotiation = negotiationTargetSupplier?.supplierId === supplier.supplierId;

          return (
            <div
              key={supplier.supplierId}
              className={`rounded-2xl border p-5 flex flex-col justify-between transition-all ${
                recommended
                  ? 'bg-white border-indigo-300 ring-2 ring-indigo-500/20 shadow-sm'
                  : 'bg-white border-slate-200/80 shadow-xs'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="font-bold text-base text-slate-900">{supplier.supplierName}</h3>
                    <div className="text-xs text-slate-500">{supplier.location}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-black font-mono text-indigo-600">{compositeScore}</div>
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Score / 100</div>
                  </div>
                </div>

                {recommended && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-1.5 text-xs text-emerald-800 font-semibold mb-3 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Top Recommendation</span>
                  </div>
                )}

                <p className="text-xs text-slate-600 leading-relaxed mb-4">{tradeOffSummary}</p>

                {/* Score breakdown metrics */}
                <div className="space-y-2.5 text-xs border-t border-slate-100 pt-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Unit Cost + Shipping:</span>
                    <span className="font-mono font-bold text-slate-900">
                      ${supplier.unitCost.toFixed(2)} + ${supplier.shippingCostPerUnit.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Lead Time:</span>
                    <span className="font-mono text-slate-800 font-semibold">
                      {supplier.leadTimeDays} days (±{supplier.leadTimeVarianceDays}d)
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">OTIF Fulfillment:</span>
                    <span className="font-mono text-emerald-600 font-bold">
                      {(supplier.otifReliabilityRate * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Defect RMA Rate:</span>
                    <span className="font-mono text-slate-700">
                      {(supplier.defectRate * 100).toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">MOQ & Terms:</span>
                    <span className="font-mono text-slate-700">
                      {supplier.moq} units • {supplier.paymentTerms}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-5 pt-3.5 border-t border-slate-100">
                <button
                  onClick={() => handleGenerateNegotiationMemo(supplier)}
                  className={`w-full py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    isSelectedForNegotiation
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Generate AI Negotiation Memo</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* AI Negotiation Memo Panel */}
      {(isGeneratingMemo || negotiationMemo) && (
        <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl p-6 shadow-xl space-y-3.5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                AI Negotiation Talking Points & Script for {negotiationTargetSupplier?.supplierName}
              </h3>
            </div>

            {negotiationMemo && (
              <button
                onClick={handleCopyMemo}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors"
              >
                {copiedMemo ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedMemo ? 'Copied' : 'Copy Script'}</span>
              </button>
            )}
          </div>

          {isGeneratingMemo ? (
            <div className="space-y-2 py-4 animate-pulse">
              <div className="h-3 bg-slate-800 rounded w-1/2"></div>
              <div className="h-3 bg-slate-800 rounded w-3/4"></div>
              <div className="h-3 bg-slate-800 rounded w-5/6"></div>
            </div>
          ) : (
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-line">
              {negotiationMemo}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
