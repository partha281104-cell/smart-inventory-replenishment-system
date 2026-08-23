import React, { useState, useMemo } from 'react';
import {
  FileText,
  CheckCircle,
  Clock,
  Truck,
  AlertCircle,
  Plus,
  Eye,
  Check,
  X,
  PackageCheck,
  Download,
  Printer,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import { PurchaseOrder, POStatus, InventoryItem } from '../types/inventory';

interface PurchaseOrderManagerProps {
  orders: PurchaseOrder[];
  onApprovePO: (poId: string, approverName: string) => void;
  onRejectPO: (poId: string, reason: string) => void;
  onReceivePO: (poId: string) => void;
  onOpenNewPOModal: () => void;
}

export const PurchaseOrderManager: React.FC<PurchaseOrderManagerProps> = ({
  orders,
  onApprovePO,
  onRejectPO,
  onReceivePO,
  onOpenNewPOModal,
}) => {
  const [statusFilter, setStatusFilter] = useState<'ALL' | POStatus>('ALL');
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [rejectionModalOpen, setRejectionModalOpen] = useState<boolean>(false);
  const [rejectionReasonText, setRejectionReasonText] = useState<string>('');

  const filteredOrders = useMemo(() => {
    if (statusFilter === 'ALL') return orders;
    return orders.filter((o) => o.status === statusFilter);
  }, [orders, statusFilter]);

  const getStatusBadge = (status: POStatus) => {
    switch (status) {
      case 'PENDING_APPROVAL':
        return (
          <span className="bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 shadow-2xs">
            <Clock className="w-3.5 h-3.5" />
            Pending Approval
          </span>
        );
      case 'APPROVED':
        return (
          <span className="bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 shadow-2xs">
            <CheckCircle className="w-3.5 h-3.5" />
            Approved
          </span>
        );
      case 'IN_TRANSIT':
        return (
          <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 shadow-2xs">
            <Truck className="w-3.5 h-3.5" />
            In Transit
          </span>
        );
      case 'RECEIVED':
        return (
          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 shadow-2xs">
            <PackageCheck className="w-3.5 h-3.5" />
            Received & Restocked
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="bg-rose-50 text-rose-700 border border-rose-200 px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 shadow-2xs">
            <X className="w-3.5 h-3.5" />
            Cancelled
          </span>
        );
      default:
        return (
          <span className="bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 shadow-2xs">
            <FileText className="w-3.5 h-3.5" />
            Draft
          </span>
        );
    }
  };

  const handleExportCSV = (po: PurchaseOrder) => {
    const rows = [
      ['PO Number', po.poNumber],
      ['Supplier', po.supplierName],
      ['Warehouse', po.warehouse],
      ['Status', po.status],
      ['Created At', po.createdAt],
      ['Expected Delivery', po.expectedDeliveryDate],
      ['Incoterms', po.incoterms],
      ['Payment Terms', po.paymentTerms],
      [],
      ['SKU', 'Item Name', 'Quantity', 'Unit Cost', 'Total'],
      ...po.items.map((i) => [i.sku, i.name, i.quantity, i.unitCost, i.totalCost]),
      [],
      ['Subtotal', '', '', '', po.subtotal],
      ['Shipping', '', '', '', po.shippingCost],
      ['Tax', '', '', '', po.tax],
      ['Total', '', '', '', po.totalAmount],
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${po.poNumber}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div>
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Purchase Order Management & Workflow Approvals
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Human-in-the-loop governance for autonomous replenishment triggers and ERP sync.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            {(['ALL', 'PENDING_APPROVAL', 'IN_TRANSIT', 'RECEIVED'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  statusFilter === st
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st === 'ALL' ? 'All Orders' : st.replace('_', ' ')}
              </button>
            ))}
          </div>

          <button
            onClick={onOpenNewPOModal}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Custom PO</span>
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="p-4">PO Number</th>
                <th className="p-4">Supplier & Destination</th>
                <th className="p-4">Status</th>
                <th className="p-4">Line Items</th>
                <th className="p-4 text-right">Total Amount</th>
                <th className="p-4">Delivery Target</th>
                <th className="p-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filteredOrders.map((po) => (
                <tr
                  key={po.id}
                  className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                  onClick={() => setSelectedPO(po)}
                >
                  <td className="p-4 font-bold text-slate-900 font-mono">{po.poNumber}</td>

                  <td className="p-4 font-sans">
                    <div className="text-slate-900 font-semibold">{po.supplierName}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{po.warehouse}</div>
                  </td>

                  <td className="p-4 font-sans">{getStatusBadge(po.status)}</td>

                  <td className="p-4 font-sans text-slate-600">
                    <span className="font-semibold text-slate-900 font-mono">{po.items.length} SKUs</span> (
                    {po.items.reduce((s, i) => s + i.quantity, 0)} units)
                  </td>

                  <td className="p-4 text-right font-bold text-slate-900">
                    ${po.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>

                  <td className="p-4 font-sans text-slate-600">
                    {new Date(po.expectedDeliveryDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </td>

                  <td className="p-4 text-center font-sans" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-2">
                      {po.status === 'PENDING_APPROVAL' && (
                        <button
                          onClick={() => onApprovePO(po.id, 'Procurement Director')}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition-all shadow-xs flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" />
                          <span>Approve</span>
                        </button>
                      )}

                      {po.status === 'IN_TRANSIT' && (
                        <button
                          onClick={() => onReceivePO(po.id)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition-all shadow-xs flex items-center gap-1"
                        >
                          <PackageCheck className="w-3 h-3" />
                          <span>Receive</span>
                        </button>
                      )}

                      <button
                        onClick={() => setSelectedPO(po)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
                        title="View Full PO Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredOrders.length === 0 && (
            <div className="p-12 text-center text-slate-400">
              No purchase orders found in this category.
            </div>
          )}
        </div>
      </div>

      {/* PO Full Details Modal */}
      {selectedPO && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setSelectedPO(null)} />

          <div className="relative w-full max-w-3xl bg-white border border-slate-200/80 rounded-3xl shadow-2xl overflow-hidden z-10">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-1.5">
                  <span className="font-mono text-base font-bold text-slate-900">{selectedPO.poNumber}</span>
                  {getStatusBadge(selectedPO.status)}
                </div>
                <div className="text-xs text-slate-500">
                  Created {new Date(selectedPO.createdAt).toLocaleString()} • Destination: {selectedPO.warehouse}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExportCSV(selectedPO)}
                  className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                  title="Export as CSV"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSelectedPO(null)}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs">
              {/* AI Justification Banner */}
              {selectedPO.aiJustification && (
                <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4.5 flex items-start gap-3">
                  <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-900 mb-0.5">
                      Autonomous Replenishment Justification
                    </div>
                    <p className="text-slate-700 leading-relaxed">{selectedPO.aiJustification}</p>
                  </div>
                </div>
              )}

              {/* Supplier & Freight Details */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80 font-mono">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-sans font-bold">Vendor</span>
                  <span className="font-bold text-slate-900 font-sans">{selectedPO.supplierName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-sans font-bold">Incoterms</span>
                  <span className="font-bold text-slate-800">{selectedPO.incoterms}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-sans font-bold">Payment Terms</span>
                  <span className="font-bold text-slate-800">{selectedPO.paymentTerms}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-sans font-bold">Est. Delivery</span>
                  <span className="font-bold text-indigo-600 font-sans">
                    {new Date(selectedPO.expectedDeliveryDate).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Line Items Table */}
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Line Items ({selectedPO.items.length})
                </div>
                <div className="border border-slate-200/80 rounded-2xl overflow-hidden bg-white shadow-2xs">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-100 text-[11px]">
                        <th className="p-3.5">Item Details</th>
                        <th className="p-3.5 text-right">Quantity</th>
                        <th className="p-3.5 text-right">Unit Cost</th>
                        <th className="p-3.5 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {selectedPO.items.map((it) => (
                        <tr key={it.itemId}>
                          <td className="p-3.5 font-sans">
                            <div className="font-mono font-bold text-slate-900 text-xs">{it.sku}</div>
                            <div className="text-slate-500 text-xs">{it.name}</div>
                          </td>
                          <td className="p-3.5 text-right font-bold text-indigo-600">{it.quantity} u</td>
                          <td className="p-3.5 text-right text-slate-600">${it.unitCost.toFixed(2)}</td>
                          <td className="p-3.5 text-right font-bold text-slate-900">${it.totalCost.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Totals */}
              <div className="flex justify-end">
                <div className="w-64 space-y-2 bg-slate-50 p-4.5 rounded-2xl border border-slate-200/80 font-mono text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Subtotal:</span>
                    <span className="text-slate-800">${selectedPO.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Freight / Shipping:</span>
                    <span className="text-slate-800">${selectedPO.shippingCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Estimated Tax / Duties:</span>
                    <span className="text-slate-800">${selectedPO.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-200">
                    <span>Total Landed:</span>
                    <span className="text-indigo-600">${selectedPO.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedPO.notes && (
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs text-slate-600">
                  <span className="font-semibold text-slate-900 block mb-1">Procurement Notes:</span>
                  {selectedPO.notes}
                </div>
              )}

              {/* Approval Stamp */}
              {selectedPO.approvedBy && (
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3.5 text-xs text-blue-900 flex items-center justify-between">
                  <div>
                    Authorized by <strong className="font-bold">{selectedPO.approvedBy}</strong>
                  </div>
                  <div className="text-blue-700 text-[11px] font-mono">
                    {selectedPO.approvedAt && new Date(selectedPO.approvedAt).toLocaleString()}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="text-xs text-slate-400">ReStock AI Secure Procurement Gateway</div>

              <div className="flex items-center gap-2.5">
                {selectedPO.status === 'PENDING_APPROVAL' && (
                  <>
                    <button
                      onClick={() => setRejectionModalOpen(true)}
                      className="bg-slate-100 hover:bg-slate-200 text-rose-700 border border-rose-200 text-xs font-semibold px-4 py-2 rounded-xl transition-colors"
                    >
                      Reject PO
                    </button>
                    <button
                      onClick={() => {
                        onApprovePO(selectedPO.id, 'Procurement Manager');
                        setSelectedPO(null);
                      }}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-5 py-2 rounded-xl transition-all shadow-sm"
                    >
                      Authorize & Dispatch PO
                    </button>
                  </>
                )}

                {selectedPO.status === 'IN_TRANSIT' && (
                  <button
                    onClick={() => {
                      onReceivePO(selectedPO.id);
                      setSelectedPO(null);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-5 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                  >
                    <PackageCheck className="w-4 h-4" />
                    <span>Confirm Warehouse Receipt & Restock</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Note Dialog */}
      {rejectionModalOpen && selectedPO && (
        <div className="fixed inset-0 z-60 overflow-y-auto flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" />
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl z-10 space-y-4">
            <h3 className="text-sm font-bold text-rose-700">Reject Purchase Order {selectedPO.poNumber}</h3>
            <p className="text-xs text-slate-500">Please provide a reason for the supply chain audit log:</p>
            <textarea
              value={rejectionReasonText}
              onChange={(e) => setRejectionReasonText(e.target.value)}
              placeholder="e.g. Budget ceiling reached, vendor lead time too long..."
              className="w-full h-24 bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:border-rose-500"
            />
            <div className="flex justify-end gap-2 text-xs">
              <button
                onClick={() => setRejectionModalOpen(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onRejectPO(selectedPO.id, rejectionReasonText || 'Rejected by user');
                  setRejectionModalOpen(false);
                  setSelectedPO(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl shadow-xs transition-colors"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
