import React from 'react';
import { ShieldAlert, Plus, Sparkles, SlidersHorizontal, Building2, ChevronRight, Menu, X, Bell } from 'lucide-react';
import { WarehouseLocation } from '../types/inventory';

interface HeaderProps {
  activeTab: 'risk' | 'forecast' | 'replenish' | 'suppliers' | 'orders' | 'simulate';
  setActiveTab: (tab: 'risk' | 'forecast' | 'replenish' | 'suppliers' | 'orders' | 'simulate') => void;
  selectedWarehouse: 'ALL' | WarehouseLocation;
  setSelectedWarehouse: (wh: 'ALL' | WarehouseLocation) => void;
  onOpenNewPO: () => void;
  onOpenAuditModal: () => void;
  onOpenSettings: () => void;
  pendingPOCount: number;
  criticalCount: number;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  selectedWarehouse,
  setSelectedWarehouse,
  onOpenNewPO,
  onOpenAuditModal,
  onOpenSettings,
  pendingPOCount,
  criticalCount,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
}) => {
  const getTabLabel = () => {
    switch (activeTab) {
      case 'risk':
        return 'Risk Center & Stockout Radar';
      case 'forecast':
        return 'AI Demand Forecasting Studio';
      case 'replenish':
        return 'Autonomous Replenishment Engine';
      case 'suppliers':
        return 'Multi-Supplier Scorecard Matrix';
      case 'orders':
        return 'Purchase Orders & Governance';
      case 'simulate':
        return 'What-If Supply Chain Simulator';
      default:
        return 'Inventory Platform';
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
      <div className="px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16 gap-4">
        {/* Left: Mobile Toggle + Breadcrumb */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <span className="hidden sm:inline font-semibold text-slate-700">ReStock AI</span>
            <ChevronRight className="hidden sm:inline w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-900 font-semibold text-sm tracking-tight">{getTabLabel()}</span>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Warehouse Selector */}
          <div className="relative hidden md:flex items-center">
            <Building2 className="w-3.5 h-3.5 absolute left-3 text-slate-400 pointer-events-none" />
            <select
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value as any)}
              className="bg-slate-50 hover:bg-slate-100/80 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl pl-8 pr-7 py-2 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
            >
              <option value="ALL">All Facilities (Global)</option>
              <option value="CENTRAL_HUB">Central Hub</option>
              <option value="WEST_DC">West DC</option>
              <option value="EAST_HUB">East Hub</option>
              <option value="SOUTH_FACILITY">South Facility</option>
            </select>
          </div>

          {/* AI Risk Audit Action */}
          <button
            onClick={onOpenAuditModal}
            className="hidden sm:inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition-all shadow-xs"
            title="Run Autonomous AI Inventory Audit"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>AI Risk Audit</span>
            {criticalCount > 0 && (
              <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                {criticalCount}
              </span>
            )}
          </button>

          {/* Primary CTA: New PO */}
          <button
            onClick={onOpenNewPO}
            className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-sm transition-all focus:ring-2 focus:ring-indigo-500/30"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New PO</span>
          </button>

          {/* Settings Trigger */}
          <button
            onClick={onOpenSettings}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors border border-transparent hover:border-slate-200"
            title="System Policies & Replenishment Parameters"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
