import React, { useState } from 'react';
import { X, Plus, Trash2, ShoppingCart, Truck, AlertCircle } from 'lucide-react';
import { InventoryItem, PurchaseOrder, WarehouseLocation, SupplierOffer } from '../types/inventory';

interface NewPOModalProps {
  items: InventoryItem[];
  isOpen: boolean;
  onClose: () => void;
  onSubmitPO: (po: PurchaseOrder) => void;
  preselectedItem?: { item: InventoryItem; supplier: SupplierOffer; quantity: number } | null;
}

export const NewPOModal: React.FC<NewPOModalProps> = ({
  items,
  isOpen,
  onClose,
  onSubmitPO,
  preselectedItem,
}) => {
  if (!isOpen) return null;

  const [warehouse, setWarehouse] = useState<WarehouseLocation>(
    preselectedItem?.item.warehouse || 'CENTRAL_HUB'
  );
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(
    preselectedItem?.supplier.supplierId || items[0]?.suppliers[0]?.supplierId || ''
  );
  const [incoterms, setIncoterms] = useState<'FOB' | 'DDP' | 'EXW' | 'CIF'>('DDP');
  const [paymentTerms, setPaymentTerms] = useState<string>('Net 30');
  const [notes, setNotes] = useState<string>('');

  // Line items state
  const [orderLines, setOrderLines] = useState<
    { itemId: string; quantity: number; unitCost: number }[]
  >(
    preselectedItem
      ? [
          {
            itemId: preselectedItem.item.id,
            quantity: preselectedItem.quantity,
            unitCost: preselectedItem.supplier.unitCost,
          },
        ]
      : items[0]
      ? [
          {
            itemId: items[0].id,
            quantity: items[0].suppliers[0]?.moq || 100,
            unitCost: items[0].suppliers[0]?.unitCost || 50,
          },
        ]
      : []
  );

  // Available unique suppliers
  const allSuppliers: SupplierOffer[] = Array.from(
    new Map<string, SupplierOffer>(
      items.flatMap((i) => i.suppliers).map((s) => [s.supplierId, s])
    ).values()
  );

  const selectedSupplier = allSuppliers.find((s) => s.supplierId === selectedSupplierId) || allSuppliers[0];

  const handleAddLine = () => {
    const unselected = items.find((i) => !orderLines.some((l) => l.itemId === i.id)) || items[0];
    if (unselected) {
      const supOffer = unselected.suppliers.find((s) => s.supplierId === selectedSupplierId) || unselected.suppliers[0];
      setOrderLines([
        ...orderLines,
        {
          itemId: unselected.id,
          quantity: supOffer?.moq || 100,
          unitCost: supOffer?.unitCost || unselected.unitCost,
        },
      ]);
    }
  };

  const handleRemoveLine = (idx: number) => {
    setOrderLines(orderLines.filter((_, i) => i !== idx));
  };

  const handleLineChange = (idx: number, field: 'itemId' | 'quantity', val: any) => {
    const next = [...orderLines];
    if (field === 'itemId') {
      const it = items.find((i) => i.id === val);
      const supOffer = it?.suppliers.find((s) => s.supplierId === selectedSupplierId) || it?.suppliers[0];
      next[idx] = {
        itemId: val,
        quantity: supOffer?.moq || 100,
        unitCost: supOffer?.unitCost || it?.unitCost || 50,
      };
    } else {
      next[idx].quantity = Math.max(1, parseInt(val) || 1);
    }
    setOrderLines(next);
  };

  // Calculations
  const subtotal = orderLines.reduce((sum, line) => sum + line.quantity * line.unitCost, 0);
  const shippingCost = Math.round(orderLines.reduce((sum, line) => sum + line.quantity * (selectedSupplier?.shippingCostPerUnit || 2.5), 0));
  const tax = Math.round(subtotal * 0.05 * 100) / 100;
  const totalAmount = subtotal + shippingCost + tax;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (orderLines.length === 0) return;

    const poNumber = `PO-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date();
    const leadTime = selectedSupplier?.leadTimeDays || 7;
    const expectedDelivery = new Date(now.getTime() + leadTime * 86400000).toISOString();

    const newPO: PurchaseOrder = {
      id: `po-${Date.now()}`,
      poNumber,
      supplierId: selectedSupplier.supplierId,
      supplierName: selectedSupplier.supplierName,
      warehouse,
      status: 'PENDING_APPROVAL',
      createdAt: now.toISOString(),
      expectedDeliveryDate: expectedDelivery,
      incoterms,
      paymentTerms,
      notes: notes || 'Created via ReStock AI procurement engine.',
      subtotal,
      shippingCost,
      tax,
      totalAmount,
      aiJustification: `User initialized PO for ${orderLines.length} SKU(s). Vendor lead time: ${leadTime} days.`,
      items: orderLines.map((line) => {
        const item = items.find((i) => i.id === line.itemId)!;
        return {
          itemId: item.id,
          sku: item.sku,
          name: item.name,
          quantity: line.quantity,
          unitCost: line.unitCost,
          totalCost: line.quantity * line.unitCost,
          safetyStockAtTime: Math.round(item.avgDailyDemand * 4),
          currentStockAtTime: item.currentStock,
        };
      }),
    };

    onSubmitPO(newPO);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-white border border-slate-200/80 rounded-3xl shadow-2xl overflow-hidden z-10">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Create Enterprise Purchase Order
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs">
          {/* Header Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-slate-700 font-semibold block mb-1.5">Target Supplier / Vendor</label>
              <select
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
                className="w-full bg-slate-50 hover:bg-slate-100/50 border border-slate-200 text-slate-800 rounded-xl p-2.5 focus:outline-none focus:border-indigo-500 font-medium cursor-pointer"
              >
                {allSuppliers.map((s) => (
                  <option key={s.supplierId} value={s.supplierId}>
                    {s.supplierName} ({s.location.split('(')[0]})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-700 font-semibold block mb-1.5">Receiving Warehouse</label>
              <select
                value={warehouse}
                onChange={(e) => setWarehouse(e.target.value as any)}
                className="w-full bg-slate-50 hover:bg-slate-100/50 border border-slate-200 text-slate-800 rounded-xl p-2.5 focus:outline-none focus:border-indigo-500 font-medium cursor-pointer"
              >
                <option value="CENTRAL_HUB">Central Hub (Main)</option>
                <option value="WEST_DC">West Distribution Center</option>
                <option value="EAST_HUB">East Coast Logistics Hub</option>
                <option value="SOUTH_FACILITY">Southern Fulfillment Facility</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-slate-700 font-semibold block mb-1.5">Incoterms</label>
              <select
                value={incoterms}
                onChange={(e) => setIncoterms(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-2.5 focus:outline-none focus:border-indigo-500 font-medium cursor-pointer"
              >
                <option value="DDP">DDP (Delivered Duty Paid)</option>
                <option value="FOB">FOB (Free on Board)</option>
                <option value="EXW">EXW (Ex Works)</option>
                <option value="CIF">CIF (Cost, Insurance & Freight)</option>
              </select>
            </div>

            <div>
              <label className="text-slate-700 font-semibold block mb-1.5">Payment Terms</label>
              <input
                type="text"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-2.5 focus:outline-none focus:border-indigo-500 font-medium"
              />
            </div>
          </div>

          {/* Line Items Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                Order Line Items
              </span>
              <button
                type="button"
                onClick={handleAddLine}
                className="text-indigo-600 hover:text-indigo-700 flex items-center gap-1 font-semibold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="space-y-2 border border-slate-200/80 rounded-2xl p-3 bg-slate-50">
              {orderLines.map((line, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                  <select
                    value={line.itemId}
                    onChange={(e) => handleLineChange(idx, 'itemId', e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2 focus:outline-none text-xs font-medium cursor-pointer"
                  >
                    {items.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.sku} – {i.name.slice(0, 30)}
                      </option>
                    ))}
                  </select>

                  <div className="w-24">
                    <input
                      type="number"
                      min="1"
                      value={line.quantity}
                      onChange={(e) => handleLineChange(idx, 'quantity', e.target.value)}
                      placeholder="Qty"
                      className="w-full bg-slate-50 border border-slate-200 text-right text-slate-900 font-mono rounded-lg p-2 focus:outline-none text-xs font-bold"
                    />
                  </div>

                  <div className="w-20 text-right font-mono text-slate-900 text-xs font-bold">
                    ${(line.quantity * line.unitCost).toFixed(2)}
                  </div>

                  {orderLines.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveLine(idx)}
                      className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-slate-700 font-semibold block mb-1.5">Procurement Instructions / Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Priority freight requested, palletize with humidity protection..."
              className="w-full h-16 bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Financial Summary */}
          <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-200/80 flex justify-between items-center font-mono">
            <div className="text-slate-500 text-xs space-y-0.5 font-sans">
              <div>Subtotal: ${subtotal.toFixed(2)}</div>
              <div>Estimated Freight: ${shippingCost.toFixed(2)}</div>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 font-sans block">Total Landed Amount</span>
              <span className="text-xl font-black text-indigo-600">${totalAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold transition-all shadow-sm"
            >
              Generate Draft PO
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
