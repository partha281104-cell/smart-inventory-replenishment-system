export type RiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'HEALTHY' | 'OVERSTOCKED';
export type ABCClass = 'A' | 'B' | 'C';
export type VelocityClass = 'FAST' | 'MEDIUM' | 'SLOW' | 'NON_MOVING';
export type WarehouseLocation = 'CENTRAL_HUB' | 'WEST_DC' | 'EAST_HUB' | 'SOUTH_FACILITY';

export interface SupplierOffer {
  supplierId: string;
  supplierName: string;
  location: string;
  unitCost: number;
  leadTimeDays: number;
  leadTimeVarianceDays: number;
  moq: number;
  otifReliabilityRate: number; // e.g. 0.96 for 96%
  defectRate: number; // e.g. 0.012 for 1.2%
  shippingCostPerUnit: number;
  esgScore: number; // 1-100
  paymentTerms: string; // "Net 30", "Net 60", "2/10 Net 30"
  tierDiscounts?: { minQty: number; discountPercent: number }[];
  isPreferred?: boolean;
}

export interface HistoricalSalesPoint {
  date: string;
  actualDemand: number;
  promotionalEvent?: string;
  outOfStockDays?: number;
}

export interface ForecastPoint {
  date: string;
  predictedDemand: number;
  confidenceLower: number; // P10
  confidenceUpper: number; // P90
  isSurgePredicted?: boolean;
  eventNote?: string;
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: 'Consumer Electronics' | 'Industrial Hardware' | 'Apparel & Footwear' | 'Food & Beverage' | 'Health & Beauty' | 'Office & Facilities';
  warehouse: WarehouseLocation;
  abcClass: ABCClass;
  velocity: VelocityClass;
  currentStock: number;
  allocatedStock: number;
  availableStock: number;
  onOrderStock: number;
  unitCost: number;
  sellingPrice: number;
  annualHoldingCostRate: number; // default e.g. 0.22 (22%)
  orderPlacementCost: number; // fixed cost per PO, e.g. $75
  targetServiceLevel: number; // e.g. 0.95 or 0.98
  targetMaxDaysOfSupply: number; // e.g. 60 days
  avgDailyDemand: number;
  stdDevDailyDemand: number;
  historicalSales: HistoricalSalesPoint[];
  forecast30d: ForecastPoint[];
  suppliers: SupplierOffer[];
  preferredSupplierId: string;
  lastAuditedAt: string;
  lastRestockedAt: string;
  tags: string[];
}

export interface OptimizationMetrics {
  zScore: number;
  combinedStdDev: number;
  safetyStock: number;
  reorderPoint: number;
  economicOrderQuantity: number;
  daysOfSupply: number;
  projectedRunoutDays: number;
  projectedRunoutDate: string;
  isBelowROP: boolean;
  isStockoutImminent: boolean; // < 7 days
  isOverstocked: boolean;
  riskLevel: RiskLevel;
  recommendedOrderQty: number;
  recommendedSupplierId: string;
  recommendedSupplierName: string;
  estimatedOrderCost: number;
  potentialStockoutLoss: number;
  excessHoldingCostPerMonth: number;
  reasoningBrief: string;
  aiExplanation?: string;
}

export interface SupplierScoreDetail {
  supplier: SupplierOffer;
  costScore: number; // 0-100
  speedScore: number; // 0-100
  reliabilityScore: number; // 0-100
  qualityScore: number; // 0-100
  compositeScore: number; // 0-100
  recommended: boolean;
  tradeOffSummary: string;
}

export interface PurchaseOrderItem {
  itemId: string;
  sku: string;
  name: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  safetyStockAtTime: number;
  currentStockAtTime: number;
}

export type POStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'IN_TRANSIT' | 'RECEIVED' | 'CANCELLED';

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  warehouse: WarehouseLocation;
  items: PurchaseOrderItem[];
  subtotal: number;
  shippingCost: number;
  tax: number;
  totalAmount: number;
  status: POStatus;
  createdAt: string;
  expectedDeliveryDate: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  notes: string;
  incoterms: 'FOB' | 'DDP' | 'EXW' | 'CIF';
  paymentTerms: string;
  aiJustification?: string;
}

export interface SimulationParameters {
  demandMultiplier: number; // 0.5 to 2.0 (default 1.0)
  leadTimeShiftDays: number; // -5 to +15 (default 0)
  targetServiceLevel: number; // 0.90 to 0.995 (default 0.95)
  holdingCostRate: number; // 0.10 to 0.40 (default 0.22)
  supplierPriceChangePercent: number; // -20% to +30% (default 0)
}

export interface SimulationResultSummary {
  totalStockoutRiskValue: number;
  totalExcessInventoryValue: number;
  averageDaysOfSupply: number;
  stockoutIncidenceRate: number; // % of SKUs hitting stockout
  totalReplenishmentCapitalNeeded: number;
  totalAnnualHoldingCost: number;
  resilienceScore: number; // 0-100
}

export interface SystemPolicySettings {
  defaultServiceLevel: number;
  criticalItemServiceLevel: number;
  defaultHoldingCostRate: number;
  defaultOrderPlacementCost: number;
  minBufferDays: number;
  autoRecommendThresholdDays: number;
  currencySymbol: string;
  aiModelName: string;
  enableGeminiReasoning: boolean;
}
