/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { InventoryItem, PurchaseOrder, SystemPolicySettings, WarehouseLocation, SupplierOffer } from './types/inventory';
import { INITIAL_INVENTORY_ITEMS, INITIAL_PURCHASE_ORDERS, DEFAULT_POLICY_SETTINGS } from './data/mockData';
import { calculateOptimizationMetrics } from './utils/replenishmentMath';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { RiskCenter } from './components/RiskCenter';
import { DemandForecastStudio } from './components/DemandForecastStudio';
import { ReplenishmentEngine } from './components/ReplenishmentEngine';
import { SupplierMatrix } from './components/SupplierMatrix';
import { ScenarioSimulator } from './components/ScenarioSimulator';
import { PurchaseOrderManager } from './components/PurchaseOrderManager';
import { SkuDetailDrawer } from './components/SkuDetailDrawer';
import { NewPOModal } from './components/NewPOModal';
import { AuditReportModal } from './components/AuditReportModal';
import { SettingsModal } from './components/SettingsModal';

export default function App() {
  const [items, setItems] = useState<InventoryItem[]>(INITIAL_INVENTORY_ITEMS);
  const [orders, setOrders] = useState<PurchaseOrder[]>(INITIAL_PURCHASE_ORDERS);
  const [policies, setPolicies] = useState<SystemPolicySettings>(DEFAULT_POLICY_SETTINGS);
  const [activeTab, setActiveTab] = useState<'risk' | 'forecast' | 'replenish' | 'suppliers' | 'orders' | 'simulate'>('risk');
  const [selectedWarehouse, setSelectedWarehouse] = useState<'ALL' | WarehouseLocation>('ALL');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState<boolean>(false);

  // Modals & Drawers
  const [selectedSku, setSelectedSku] = useState<InventoryItem | null>(null);
  const [isNewPOOpen, setIsNewPOOpen] = useState<boolean>(false);
  const [isAuditOpen, setIsAuditOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [preselectedItemForPO, setPreselectedItemForPO] = useState<{
    item: InventoryItem;
    supplier: SupplierOffer;
    quantity: number;
  } | null>(null);

  // Selected SKU optimization metrics
  const selectedSkuMetrics = useMemo(() => {
    if (!selectedSku) return null;
    return calculateOptimizationMetrics(selectedSku);
  }, [selectedSku]);

  // Counts for top bar / sidebar badges
  const pendingPOCount = useMemo(() => {
    return orders.filter((o) => o.status === 'PENDING_APPROVAL').length;
  }, [orders]);

  const criticalCount = useMemo(() => {
    return items.filter((i) => calculateOptimizationMetrics(i).riskLevel === 'CRITICAL').length;
  }, [items]);

  // Handlers
  const handleUpdateStock = (itemId: string, newStock: number) => {
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, currentStock: newStock, lastAuditedAt: new Date().toISOString().split('T')[0] } : i))
    );
    if (selectedSku && selectedSku.id === itemId) {
      setSelectedSku((prev) => (prev ? { ...prev, currentStock: newStock } : null));
    }
  };

  const handleOpenSinglePO = (item: InventoryItem, supplier: SupplierOffer, quantity: number) => {
    setPreselectedItemForPO({ item, supplier, quantity });
    setIsNewPOOpen(true);
  };

  const handleBatchPO = (selectedItems: { item: InventoryItem; supplier: SupplierOffer; quantity: number }[]) => {
    if (selectedItems.length === 0) return;
    const now = new Date();
    const leadTime = Math.max(...selectedItems.map((s) => s.supplier.leadTimeDays));
    const expectedDelivery = new Date(now.getTime() + leadTime * 86400000).toISOString();
    const poNumber = `PO-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const lineItems = selectedItems.map(({ item, supplier, quantity }) => ({
      itemId: item.id,
      sku: item.sku,
      name: item.name,
      quantity,
      unitCost: supplier.unitCost,
      totalCost: quantity * supplier.unitCost,
      safetyStockAtTime: Math.round(item.avgDailyDemand * 4),
      currentStockAtTime: item.currentStock,
    }));

    const subtotal = lineItems.reduce((s, i) => s + i.totalCost, 0);
    const shippingCost = Math.round(subtotal * 0.04);
    const tax = Math.round(subtotal * 0.05);

    const newPO: PurchaseOrder = {
      id: `po-${Date.now()}`,
      poNumber,
      supplierId: selectedItems[0].supplier.supplierId,
      supplierName: selectedItems[0].supplier.supplierName,
      warehouse: selectedItems[0].item.warehouse,
      status: 'PENDING_APPROVAL',
      createdAt: now.toISOString(),
      expectedDeliveryDate: expectedDelivery,
      incoterms: 'DDP',
      paymentTerms: 'Net 30',
      subtotal,
      shippingCost,
      tax,
      totalAmount: subtotal + shippingCost + tax,
      notes: `Consolidated batch order for ${selectedItems.length} SKUs via ReStock AI automated optimizer.`,
      aiJustification: `Multi-item optimization: Consolidated order saves estimated $${Math.round(shippingCost * 0.35)} in grouped logistics.`,
      items: lineItems,
    };

    setOrders((prev) => [newPO, ...prev]);
    setActiveTab('orders');
  };

  const handleApprovePO = (poId: string, approverName: string) => {
    setOrders((prev) =>
      prev.map((po) => {
        if (po.id === poId) {
          // Increase onOrderStock in the inventory catalog
          po.items.forEach((line) => {
            setItems((prevItems) =>
              prevItems.map((it) => (it.id === line.itemId ? { ...it, onOrderStock: it.onOrderStock + line.quantity } : it))
            );
          });

          return {
            ...po,
            status: 'IN_TRANSIT',
            approvedBy: approverName,
            approvedAt: new Date().toISOString(),
          };
        }
        return po;
      })
    );
  };

  const handleRejectPO = (poId: string, reason: string) => {
    setOrders((prev) =>
      prev.map((po) => (po.id === poId ? { ...po, status: 'CANCELLED', rejectionReason: reason } : po))
    );
  };

  const handleReceivePO = (poId: string) => {
    const target = orders.find((o) => o.id === poId);
    if (!target) return;

    // Add received items to current stock and reduce on-order stock
    setItems((prev) =>
      prev.map((item) => {
        const line = target.items.find((i) => i.itemId === item.id);
        if (line) {
          return {
            ...item,
            currentStock: item.currentStock + line.quantity,
            onOrderStock: Math.max(0, item.onOrderStock - line.quantity),
            lastRestockedAt: new Date().toISOString().split('T')[0],
          };
        }
        return item;
      })
    );

    setOrders((prev) =>
      prev.map((po) => (po.id === poId ? { ...po, status: 'RECEIVED' } : po))
    );
  };

  const handleQuickReplenishAllCritical = () => {
    const critical = items.filter((i) => calculateOptimizationMetrics(i).riskLevel === 'CRITICAL');
    const batchPayload = critical.map((item) => {
      const m = calculateOptimizationMetrics(item);
      const supplier = item.suppliers.find((s) => s.supplierId === m.recommendedSupplierId) || item.suppliers[0];
      return {
        item,
        supplier,
        quantity: m.recommendedOrderQty || supplier.moq,
      };
    });
    handleBatchPO(batchPayload);
  };

  const handleResetData = () => {
    setItems(INITIAL_INVENTORY_ITEMS);
    setOrders(INITIAL_PURCHASE_ORDERS);
    setPolicies(DEFAULT_POLICY_SETTINGS);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex font-sans selection:bg-indigo-500 selection:text-white">
      {/* Sleek Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingPOCount={pendingPOCount}
        criticalCount={criticalCount}
        isMobileOpen={isMobileNavOpen}
        setIsMobileOpen={setIsMobileNavOpen}
      />

      {/* Main Workspace Layout */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Sleek Top Header Bar */}
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          selectedWarehouse={selectedWarehouse}
          setSelectedWarehouse={setSelectedWarehouse}
          onOpenNewPO={() => {
            setPreselectedItemForPO(null);
            setIsNewPOOpen(true);
          }}
          onOpenAuditModal={() => setIsAuditOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          pendingPOCount={pendingPOCount}
          criticalCount={criticalCount}
          isMobileMenuOpen={isMobileNavOpen}
          setIsMobileMenuOpen={setIsMobileNavOpen}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'risk' && (
            <RiskCenter
              items={items}
              selectedWarehouse={selectedWarehouse}
              onSelectSku={(item) => setSelectedSku(item)}
              onQuickReplenish={(item) => {
                const m = calculateOptimizationMetrics(item);
                const sup = item.suppliers.find((s) => s.supplierId === m.recommendedSupplierId) || item.suppliers[0];
                handleOpenSinglePO(item, sup, m.recommendedOrderQty || sup.moq);
              }}
              onOpenAudit={() => setIsAuditOpen(true)}
            />
          )}

          {activeTab === 'forecast' && (
            <DemandForecastStudio
              items={items}
              onSelectSku={(item) => setSelectedSku(item)}
            />
          )}

          {activeTab === 'replenish' && (
            <ReplenishmentEngine
              items={items}
              onSelectSku={(item) => setSelectedSku(item)}
              onGenerateBatchPO={handleBatchPO}
              onGenerateSinglePO={handleOpenSinglePO}
            />
          )}

          {activeTab === 'suppliers' && <SupplierMatrix items={items} />}

          {activeTab === 'simulate' && <ScenarioSimulator items={items} />}

          {activeTab === 'orders' && (
            <PurchaseOrderManager
              orders={orders}
              onApprovePO={handleApprovePO}
              onRejectPO={handleRejectPO}
              onReceivePO={handleReceivePO}
              onOpenNewPOModal={() => {
                setPreselectedItemForPO(null);
                setIsNewPOOpen(true);
              }}
            />
          )}
        </main>
      </div>

      {/* SKU 360 Deep-Dive Drawer */}
      {selectedSku && selectedSkuMetrics && (
        <SkuDetailDrawer
          item={selectedSku}
          metrics={selectedSkuMetrics}
          onClose={() => setSelectedSku(null)}
          onGeneratePO={(item, supplier, qty) => {
            setSelectedSku(null);
            handleOpenSinglePO(item, supplier, qty);
          }}
          onUpdateStock={handleUpdateStock}
        />
      )}

      {/* New PO Creation Modal */}
      <NewPOModal
        items={items}
        isOpen={isNewPOOpen}
        onClose={() => {
          setIsNewPOOpen(false);
          setPreselectedItemForPO(null);
        }}
        onSubmitPO={(newPO) => setOrders((prev) => [newPO, ...prev])}
        preselectedItem={preselectedItemForPO}
      />

      {/* Global AI Risk Audit Modal */}
      <AuditReportModal
        isOpen={isAuditOpen}
        onClose={() => setIsAuditOpen(false)}
        items={items}
        onQuickReplenishAllCritical={handleQuickReplenishAllCritical}
      />

      {/* Settings & Replenishment Policies Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={policies}
        onUpdateSettings={setPolicies}
        onResetData={handleResetData}
      />
    </div>
  );
}
