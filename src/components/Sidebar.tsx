import React from 'react';
import {
  AlertTriangle,
  TrendingUp,
  RotateCw,
  Building2,
  FileText,
  Sliders,
  Sparkles,
  Layers,
  ShieldCheck,
  CheckCircle2,
  X
} from 'lucide-react';

interface SidebarProps {
  activeTab: 'risk' | 'forecast' | 'replenish' | 'suppliers' | 'orders' | 'simulate';
  setActiveTab: (tab: 'risk' | 'forecast' | 'replenish' | 'suppliers' | 'orders' | 'simulate') => void;
  pendingPOCount: number;
  criticalCount: number;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  pendingPOCount,
  criticalCount,
  isMobileOpen,
  setIsMobileOpen,
}) => {
  const navItems = [
    {
      id: 'risk' as const,
      label: 'Risk Center',
      sublabel: 'Stockout & Overstock Alerts',
      icon: AlertTriangle,
      badge: criticalCount > 0 ? criticalCount : undefined,
      badgeColor: 'bg-rose-500 text-white',
    },
    {
      id: 'forecast' as const,
      label: 'Demand Forecast',
      sublabel: 'ML Trajectory & Seasonality',
      icon: TrendingUp,
    },
    {
      id: 'replenish' as const,
      label: 'Replenishment',
      sublabel: 'EOQ & Batch Optimizer',
      icon: RotateCw,
    },
    {
      id: 'suppliers' as const,
      label: 'Supplier Matrix',
      sublabel: 'Scorecards & Negotiation',
      icon: Building2,
    },
    {
      id: 'orders' as const,
      label: 'Purchase Orders',
      sublabel: 'Approval Governance & Sync',
      icon: FileText,
      badge: pendingPOCount > 0 ? pendingPOCount : undefined,
      badgeColor: 'bg-amber-500 text-slate-950 font-bold',
    },
    {
      id: 'simulate' as const,
      label: 'What-If Sim',
      sublabel: 'Supply Chain Stress Test',
      icon: Sliders,
    },
  ];

  const handleSelect = (tab: any) => {
    setActiveTab(tab);
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div>
          <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black shadow-sm shadow-indigo-950">
                R
              </div>
              <div>
                <span className="font-bold text-base text-white tracking-tight block leading-none">
                  ReStock AI
                </span>
                <span className="text-[10px] text-slate-400 font-medium tracking-wide">
                  Autonomous Procurement
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsMobileOpen(false)}
              className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3.5 space-y-1.5">
            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Procurement Workspace
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white font-semibold shadow-sm shadow-indigo-950'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <div className="min-w-0">
                      <div className="text-xs truncate">{item.label}</div>
                    </div>
                  </div>

                  {item.badge !== undefined && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom AI Diagnostic Engine Status Card */}
        <div className="p-4 border-t border-slate-800/80">
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-[11px] font-bold text-slate-200 uppercase tracking-wide">
                  Engine Active
                </span>
              </div>
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Monitoring 12 catalog SKUs across 4 distribution hubs in real-time.
            </p>
            <div className="pt-1 flex items-center justify-between text-[10px] text-slate-500 font-mono">
              <span>Next cycle: 12m</span>
              <span className="text-emerald-400 font-sans font-semibold">99.8% OTIF</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
