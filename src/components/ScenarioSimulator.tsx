import React, { useState, useMemo } from 'react';
import {
  Sliders,
  RotateCcw,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  ShieldAlert,
  Sparkles,
  DollarSign,
  Activity,
  Layers
} from 'lucide-react';
import { InventoryItem, SimulationParameters } from '../types/inventory';
import { runCatalogSimulation } from '../utils/replenishmentMath';

interface ScenarioSimulatorProps {
  items: InventoryItem[];
}

export const ScenarioSimulator: React.FC<ScenarioSimulatorProps> = ({ items }) => {
  const [demandMultiplier, setDemandMultiplier] = useState<number>(1.0);
  const [leadTimeShiftDays, setLeadTimeShiftDays] = useState<number>(0);
  const [targetServiceLevel, setTargetServiceLevel] = useState<number>(0.95);
  const [holdingCostRate, setHoldingCostRate] = useState<number>(0.22);
  const [supplierPriceChangePercent, setSupplierPriceChangePercent] = useState<number>(0);

  // Baseline simulation
  const baseline = useMemo(() => {
    return runCatalogSimulation(items, {
      demandMultiplier: 1.0,
      leadTimeShiftDays: 0,
      targetServiceLevel: 0.95,
      holdingCostRate: 0.22,
      supplierPriceChangePercent: 0,
    });
  }, [items]);

  // Current tweaked simulation
  const currentSim = useMemo(() => {
    return runCatalogSimulation(items, {
      demandMultiplier,
      leadTimeShiftDays,
      targetServiceLevel,
      holdingCostRate,
      supplierPriceChangePercent,
    });
  }, [items, demandMultiplier, leadTimeShiftDays, targetServiceLevel, holdingCostRate, supplierPriceChangePercent]);

  const handleReset = () => {
    setDemandMultiplier(1.0);
    setLeadTimeShiftDays(0);
    setTargetServiceLevel(0.95);
    setHoldingCostRate(0.22);
    setSupplierPriceChangePercent(0);
  };

  const deltaStockoutExposure = currentSim.totalStockoutRiskValue - baseline.totalStockoutRiskValue;
  const deltaWorkingCapital = currentSim.totalReplenishmentCapitalNeeded - baseline.totalReplenishmentCapitalNeeded;
  const deltaHoldingCost = currentSim.totalAnnualHoldingCost - baseline.totalAnnualHoldingCost;

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div>
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Supply Chain "What-If" Stress Test & Shock Simulator
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time sensitivity analysis testing macro demand surges, vendor port delays, and capital cost shifts.
          </p>
        </div>

        <button
          onClick={handleReset}
          className="bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset to Baseline</span>
        </button>
      </div>

      {/* Interactive Simulation Sliders Deck */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-indigo-600" />
          <span>Supply Chain Macro Variables</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-xs">
          {/* Slider 1: Demand Multiplier */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-700">Demand Velocity Multiplier</span>
              <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                {Math.round((demandMultiplier - 1) * 100) >= 0 ? `+${Math.round((demandMultiplier - 1) * 100)}%` : `${Math.round((demandMultiplier - 1) * 100)}%`}
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.05"
              value={demandMultiplier}
              onChange={(e) => setDemandMultiplier(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>-50% Slump</span>
              <span>1.0x Baseline</span>
              <span>+100% Surge</span>
            </div>
          </div>

          {/* Slider 2: Vendor Lead Time Shift */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-700">Vendor Lead Time Shift</span>
              <span className={`font-mono font-bold px-2 py-0.5 rounded-lg border ${leadTimeShiftDays > 0 ? 'text-rose-600 bg-rose-50 border-rose-200' : 'text-slate-700 bg-slate-100 border-slate-200'}`}>
                {leadTimeShiftDays > 0 ? `+${leadTimeShiftDays} Days Delay` : `${leadTimeShiftDays} Days`}
              </span>
            </div>
            <input
              type="range"
              min="-3"
              max="20"
              step="1"
              value={leadTimeShiftDays}
              onChange={(e) => setLeadTimeShiftDays(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-rose-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>-3d Faster</span>
              <span>0d Normal</span>
              <span>+20d Port Congestion</span>
            </div>
          </div>

          {/* Slider 3: Target Service Level */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-700">Target Service Level (Z-Factor)</span>
              <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
                {(targetServiceLevel * 100).toFixed(1)}%
              </span>
            </div>
            <input
              type="range"
              min="0.85"
              max="0.995"
              step="0.005"
              value={targetServiceLevel}
              onChange={(e) => setTargetServiceLevel(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>85% (Lean)</span>
              <span>95% Standard</span>
              <span>99.5% Ultra-Resilient</span>
            </div>
          </div>

          {/* Slider 4: Holding Cost Rate */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-700">Annual Carrying Cost Rate</span>
              <span className="font-mono font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-100">
                {(holdingCostRate * 100).toFixed(0)}%/yr
              </span>
            </div>
            <input
              type="range"
              min="0.10"
              max="0.40"
              step="0.02"
              value={holdingCostRate}
              onChange={(e) => setHoldingCostRate(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-purple-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>10% Low WACC</span>
              <span>22% Typical</span>
              <span>40% Tight Storage / High Rates</span>
            </div>
          </div>

          {/* Slider 5: Supplier Price Inflation */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-700">Supplier Price Inflation</span>
              <span className="font-mono font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100">
                {supplierPriceChangePercent >= 0 ? `+${supplierPriceChangePercent}%` : `${supplierPriceChangePercent}%`}
              </span>
            </div>
            <input
              type="range"
              min="-20"
              max="30"
              step="2"
              value={supplierPriceChangePercent}
              onChange={(e) => setSupplierPriceChangePercent(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-amber-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>-20% Deflation</span>
              <span>0% Flat</span>
              <span>+30% Inflation Surge</span>
            </div>
          </div>
        </div>
      </div>

      {/* Before vs After Impact Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Stockout Exposure */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <div className="text-xs font-bold text-slate-500 uppercase">Simulated Stockout Loss</div>
          <div className="text-2xl font-black font-mono text-rose-600 mt-1">
            ${currentSim.totalStockoutRiskValue.toLocaleString()}
          </div>
          <div className="text-xs mt-1.5 flex items-center justify-between text-slate-500">
            <span>Base: ${baseline.totalStockoutRiskValue.toLocaleString()}</span>
            <span className={`font-mono font-bold ${deltaStockoutExposure > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {deltaStockoutExposure >= 0 ? `+$${deltaStockoutExposure.toLocaleString()}` : `-$${Math.abs(deltaStockoutExposure).toLocaleString()}`}
            </span>
          </div>
        </div>

        {/* Metric 2: Working Capital Needed */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <div className="text-xs font-bold text-slate-500 uppercase">Required PO Capital</div>
          <div className="text-2xl font-black font-mono text-emerald-600 mt-1">
            ${currentSim.totalReplenishmentCapitalNeeded.toLocaleString()}
          </div>
          <div className="text-xs mt-1.5 flex items-center justify-between text-slate-500">
            <span>Base: ${baseline.totalReplenishmentCapitalNeeded.toLocaleString()}</span>
            <span className={`font-mono font-bold ${deltaWorkingCapital > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {deltaWorkingCapital >= 0 ? `+$${deltaWorkingCapital.toLocaleString()}` : `-$${Math.abs(deltaWorkingCapital).toLocaleString()}`}
            </span>
          </div>
        </div>

        {/* Metric 3: Total Annual Holding Cost */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <div className="text-xs font-bold text-slate-500 uppercase">Carrying Cost Burden</div>
          <div className="text-2xl font-black font-mono text-purple-700 mt-1">
            ${currentSim.totalAnnualHoldingCost.toLocaleString()}
            <span className="text-xs text-slate-400 font-sans font-normal">/yr</span>
          </div>
          <div className="text-xs mt-1.5 flex items-center justify-between text-slate-500">
            <span>Base: ${baseline.totalAnnualHoldingCost.toLocaleString()}</span>
            <span className="font-mono font-bold text-slate-700">
              {deltaHoldingCost >= 0 ? `+$${deltaHoldingCost.toLocaleString()}` : `-$${Math.abs(deltaHoldingCost).toLocaleString()}`}
            </span>
          </div>
        </div>

        {/* Metric 4: Resilience Score */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <div className="text-xs font-bold text-slate-500 uppercase">Resilience Index</div>
          <div className="text-2xl font-black font-mono text-blue-600 mt-1">
            {currentSim.resilienceScore} / 100
          </div>
          <div className="text-xs mt-1.5 flex items-center justify-between text-slate-500">
            <span>Stockout Rate:</span>
            <span className="font-mono font-bold text-rose-600">
              {currentSim.stockoutIncidenceRate}% catalog
            </span>
          </div>
        </div>
      </div>

      {/* AI Synthesis & Recommendation Banner */}
      <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl p-6 shadow-xl text-white">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300">
            AI Stress-Test Synthesis & Policy Recommendation
          </h4>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          {leadTimeShiftDays > 3
            ? `Severe supply chain bottleneck detected (+${leadTimeShiftDays}d supplier lag). ReStock AI recommends immediately raising Safety Stock buffer days from 7 to ${Math.round(7 + leadTimeShiftDays * 0.8)} days and approving expedited domestic vendor allocations to prevent $${currentSim.totalStockoutRiskValue.toLocaleString()} in stockout revenue losses.`
            : demandMultiplier > 1.25
            ? `High surge scenario (+${Math.round((demandMultiplier - 1) * 100)}% demand velocity). Accelerate release of batch POs to lock in supplier allocation before capacity constraints emerge.`
            : `Under current simulated macro conditions, your supply chain maintains an optimal resilience score of ${currentSim.resilienceScore}/100. Replenishment schedules remain well within calculated tolerance bands.`}
        </p>
      </div>
    </div>
  );
};
