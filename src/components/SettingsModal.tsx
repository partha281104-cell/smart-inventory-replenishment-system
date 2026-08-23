import React from 'react';
import { X, SlidersHorizontal, RotateCcw, ShieldCheck } from 'lucide-react';
import { SystemPolicySettings } from '../types/inventory';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SystemPolicySettings;
  onUpdateSettings: (newSettings: SystemPolicySettings) => void;
  onResetData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onResetData,
}) => {
  if (!isOpen) return null;

  const handleChange = (field: keyof SystemPolicySettings, val: any) => {
    onUpdateSettings({ ...settings, [field]: val });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-white border border-slate-200/80 rounded-3xl shadow-2xl overflow-hidden z-10">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Replenishment Policies & Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-xs">
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-slate-800 font-semibold">Standard Target Service Level</label>
              <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                {Math.round(settings.defaultServiceLevel * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.85"
              max="0.99"
              step="0.01"
              value={settings.defaultServiceLevel}
              onChange={(e) => handleChange('defaultServiceLevel', parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Defines the Z-score buffer for Class B and C non-critical items.
            </span>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-slate-800 font-semibold">Class A Critical Service Level</label>
              <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                {Math.round(settings.criticalItemServiceLevel * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.95"
              max="0.999"
              step="0.005"
              value={settings.criticalItemServiceLevel}
              onChange={(e) => handleChange('criticalItemServiceLevel', parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              High-priority protection buffer for top-selling SKUs.
            </span>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-slate-800 font-semibold">Annual Carrying Cost Rate</label>
              <span className="font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                {(settings.defaultHoldingCostRate * 100).toFixed(0)}%/yr
              </span>
            </div>
            <input
              type="range"
              min="0.10"
              max="0.40"
              step="0.02"
              value={settings.defaultHoldingCostRate}
              onChange={(e) => handleChange('defaultHoldingCostRate', parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-purple-600"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Includes storage rent, insurance, cost of capital (WACC), and obsolescence.
            </span>
          </div>

          <div>
            <label className="text-slate-800 font-semibold block mb-1.5">
              Fixed Purchase Order Placement Cost ($)
            </label>
            <input
              type="number"
              value={settings.defaultOrderPlacementCost}
              onChange={(e) => handleChange('defaultOrderPlacementCost', parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl p-2.5 font-mono focus:outline-none focus:border-indigo-500 font-bold"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Administrative and handling cost incurred per purchase order generated (EOQ factor S).
            </span>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <div>
              <span className="font-semibold text-slate-800 block">Reset Simulation Data</span>
              <span className="text-[11px] text-slate-400">Restore default demo SKUs, orders, and sales history.</span>
            </div>
            <button
              type="button"
              onClick={() => {
                onResetData();
                onClose();
              }}
              className="bg-slate-50 hover:bg-slate-100 text-rose-600 border border-rose-200 font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Data</span>
            </button>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold transition-all shadow-sm"
          >
            Save Policy Settings
          </button>
        </div>
      </div>
    </div>
  );
};
