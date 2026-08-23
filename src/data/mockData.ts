import { InventoryItem, PurchaseOrder, SystemPolicySettings } from '../types/inventory';

// Generate 30 days of past dates and 30 days of future dates
export function generateDateSeries() {
  const past: string[] = [];
  const future: string[] = [];
  const now = new Date();

  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    past.push(d.toISOString().split('T')[0]);
  }
  for (let i = 1; i <= 30; i++) {
    const d = new Date(now.getTime() + i * 86400000);
    future.push(d.toISOString().split('T')[0]);
  }
  return { past, future };
}

const { past, future } = generateDateSeries();

export const INITIAL_INVENTORY_ITEMS: InventoryItem[] = [
  {
    id: 'sku-001',
    sku: 'ELC-ANC-900',
    name: 'Pro Wireless ANC Studio Headphones',
    category: 'Consumer Electronics',
    warehouse: 'CENTRAL_HUB',
    abcClass: 'A',
    velocity: 'FAST',
    currentStock: 48,
    allocatedStock: 12,
    availableStock: 36,
    onOrderStock: 0,
    unitCost: 84.50,
    sellingPrice: 199.00,
    annualHoldingCostRate: 0.22,
    orderPlacementCost: 85.00,
    targetServiceLevel: 0.98,
    targetMaxDaysOfSupply: 45,
    avgDailyDemand: 16.4,
    stdDevDailyDemand: 4.8,
    tags: ['Top Seller', 'Holiday Surge', 'High Margin'],
    lastAuditedAt: '2026-08-20',
    lastRestockedAt: '2026-07-28',
    preferredSupplierId: 'sup-apex',
    suppliers: [
      {
        supplierId: 'sup-apex',
        supplierName: 'Apex Precision Logistics',
        location: 'Chicago, IL (Domestic Air)',
        unitCost: 84.50,
        leadTimeDays: 4,
        leadTimeVarianceDays: 1,
        moq: 100,
        otifReliabilityRate: 0.98,
        defectRate: 0.006,
        shippingCostPerUnit: 3.20,
        esgScore: 88,
        paymentTerms: 'Net 30',
        tierDiscounts: [{ minQty: 500, discountPercent: 4 }, { minQty: 1000, discountPercent: 8 }]
      },
      {
        supplierId: 'sup-shenzen',
        supplierName: 'Shenzhen Pacific Dynamics',
        location: 'Shenzhen, CN (Ocean Freight)',
        unitCost: 71.00,
        leadTimeDays: 24,
        leadTimeVarianceDays: 5,
        moq: 500,
        otifReliabilityRate: 0.89,
        defectRate: 0.018,
        shippingCostPerUnit: 1.80,
        esgScore: 72,
        paymentTerms: 'Net 60',
        tierDiscounts: [{ minQty: 1000, discountPercent: 10 }]
      },
      {
        supplierId: 'sup-euro',
        supplierName: 'EuroSound Components GmbH',
        location: 'Frankfurt, DE (Express Air)',
        unitCost: 88.00,
        leadTimeDays: 6,
        leadTimeVarianceDays: 2,
        moq: 200,
        otifReliabilityRate: 0.96,
        defectRate: 0.004,
        shippingCostPerUnit: 4.50,
        esgScore: 94,
        paymentTerms: '2/10 Net 30'
      }
    ],
    historicalSales: past.map((d, idx) => {
      const base = 16 + Math.sin(idx / 3) * 5 + (idx % 7 === 5 || idx % 7 === 6 ? 6 : 0);
      const isPromo = idx === 22 || idx === 23;
      const actual = Math.round(isPromo ? base * 1.8 : base);
      return {
        date: d,
        actualDemand: actual,
        promotionalEvent: isPromo ? 'Flash Tech Promotion' : undefined
      };
    }),
    forecast30d: future.map((d, idx) => {
      const pred = Math.round(18 + Math.sin((idx + 30) / 3.5) * 6 + (idx > 10 && idx < 16 ? 8 : 0));
      return {
        date: d,
        predictedDemand: pred,
        confidenceLower: Math.max(8, Math.round(pred * 0.82)),
        confidenceUpper: Math.round(pred * 1.25),
        isSurgePredicted: idx > 10 && idx < 16,
        eventNote: idx === 12 ? 'Anticipated Back-to-School Weekend Demand Peak' : undefined
      };
    })
  },
  {
    id: 'sku-002',
    sku: 'IND-SERVO-400',
    name: 'Industrial High-Torque Servo Motor 400W',
    category: 'Industrial Hardware',
    warehouse: 'WEST_DC',
    abcClass: 'A',
    velocity: 'MEDIUM',
    currentStock: 14,
    allocatedStock: 4,
    availableStock: 10,
    onOrderStock: 0,
    unitCost: 310.00,
    sellingPrice: 580.00,
    annualHoldingCostRate: 0.18,
    orderPlacementCost: 120.00,
    targetServiceLevel: 0.99,
    targetMaxDaysOfSupply: 60,
    avgDailyDemand: 2.8,
    stdDevDailyDemand: 1.1,
    tags: ['Critical Component', 'Long Lead Time', 'High Value'],
    lastAuditedAt: '2026-08-18',
    lastRestockedAt: '2026-06-15',
    preferredSupplierId: 'sup-kinetics',
    suppliers: [
      {
        supplierId: 'sup-kinetics',
        supplierName: 'Kinetics Heavy Tech Corp',
        location: 'Nagoya, JP (Air Freight)',
        unitCost: 310.00,
        leadTimeDays: 14,
        leadTimeVarianceDays: 3,
        moq: 20,
        otifReliabilityRate: 0.97,
        defectRate: 0.002,
        shippingCostPerUnit: 18.00,
        esgScore: 91,
        paymentTerms: 'Net 45'
      },
      {
        supplierId: 'sup-detroit',
        supplierName: 'Great Lakes Precision Drive',
        location: 'Detroit, MI (Ground Truck)',
        unitCost: 345.00,
        leadTimeDays: 5,
        leadTimeVarianceDays: 1,
        moq: 15,
        otifReliabilityRate: 0.99,
        defectRate: 0.001,
        shippingCostPerUnit: 9.50,
        esgScore: 89,
        paymentTerms: 'Net 30'
      }
    ],
    historicalSales: past.map((d, idx) => ({
      date: d,
      actualDemand: Math.max(1, Math.round(2.8 + Math.cos(idx / 4) * 1.2 + (idx === 14 ? 3 : 0)))
    })),
    forecast30d: future.map((d, idx) => {
      const pred = Math.round(3.2 + Math.cos((idx + 30) / 4) * 0.9);
      return {
        date: d,
        predictedDemand: pred,
        confidenceLower: Math.max(1, Math.round(pred * 0.75)),
        confidenceUpper: Math.round(pred * 1.35)
      };
    })
  },
  {
    id: 'sku-003',
    sku: 'FNB-ORG-OAT-1L',
    name: 'Organic Barista Oat Milk 1L (Pack of 6)',
    category: 'Food & Beverage',
    warehouse: 'EAST_HUB',
    abcClass: 'B',
    velocity: 'FAST',
    currentStock: 340,
    allocatedStock: 60,
    availableStock: 280,
    onOrderStock: 200,
    unitCost: 14.20,
    sellingPrice: 28.50,
    annualHoldingCostRate: 0.28,
    orderPlacementCost: 45.00,
    targetServiceLevel: 0.95,
    targetMaxDaysOfSupply: 30,
    avgDailyDemand: 28.5,
    stdDevDailyDemand: 6.2,
    tags: ['Perishable', 'High Turnover', 'In Transit'],
    lastAuditedAt: '2026-08-22',
    lastRestockedAt: '2026-08-10',
    preferredSupplierId: 'sup-puregrain',
    suppliers: [
      {
        supplierId: 'sup-puregrain',
        supplierName: 'PureGrain Organic Dist',
        location: 'Lancaster, PA (Refrigerated Truck)',
        unitCost: 14.20,
        leadTimeDays: 3,
        leadTimeVarianceDays: 1,
        moq: 150,
        otifReliabilityRate: 0.96,
        defectRate: 0.008,
        shippingCostPerUnit: 1.10,
        esgScore: 96,
        paymentTerms: 'Net 15'
      }
    ],
    historicalSales: past.map((d, idx) => ({
      date: d,
      actualDemand: Math.round(28 + Math.sin(idx / 2) * 7 + (idx % 7 === 4 ? 8 : 0))
    })),
    forecast30d: future.map((d, idx) => {
      const pred = Math.round(30 + Math.sin((idx + 30) / 2) * 7);
      return {
        date: d,
        predictedDemand: pred,
        confidenceLower: Math.round(pred * 0.85),
        confidenceUpper: Math.round(pred * 1.2)
      };
    })
  },
  {
    id: 'sku-004',
    sku: 'APP-MERINO-CREW-L',
    name: 'Merino Wool Thermal Crewneck - Navy L',
    category: 'Apparel & Footwear',
    warehouse: 'CENTRAL_HUB',
    abcClass: 'B',
    velocity: 'SLOW',
    currentStock: 620,
    allocatedStock: 15,
    availableStock: 605,
    onOrderStock: 0,
    unitCost: 38.00,
    sellingPrice: 95.00,
    annualHoldingCostRate: 0.24,
    orderPlacementCost: 60.00,
    targetServiceLevel: 0.92,
    targetMaxDaysOfSupply: 60,
    avgDailyDemand: 4.2,
    stdDevDailyDemand: 1.8,
    tags: ['Seasonal Overstock', 'Off-Season Holding', 'Promotion Recommended'],
    lastAuditedAt: '2026-08-19',
    lastRestockedAt: '2026-05-12',
    preferredSupplierId: 'sup-alpaca',
    suppliers: [
      {
        supplierId: 'sup-alpaca',
        supplierName: 'Andean Premium Textiles',
        location: 'Lima, PE (Sea Freight)',
        unitCost: 38.00,
        leadTimeDays: 28,
        leadTimeVarianceDays: 6,
        moq: 200,
        otifReliabilityRate: 0.91,
        defectRate: 0.015,
        shippingCostPerUnit: 2.40,
        esgScore: 85,
        paymentTerms: 'Net 45'
      }
    ],
    historicalSales: past.map((d, idx) => ({
      date: d,
      actualDemand: Math.max(1, Math.round(4.2 + Math.sin(idx / 5) * 1.5))
    })),
    forecast30d: future.map((d, idx) => {
      const pred = Math.max(2, Math.round(4.5 + Math.sin((idx + 30) / 5) * 1.2));
      return {
        date: d,
        predictedDemand: pred,
        confidenceLower: Math.max(1, Math.round(pred * 0.7)),
        confidenceUpper: Math.round(pred * 1.3)
      };
    })
  },
  {
    id: 'sku-005',
    sku: 'HLT-HYALURONIC-50ML',
    name: 'Advanced Bio-Hyaluronic Serum 50ml',
    category: 'Health & Beauty',
    warehouse: 'WEST_DC',
    abcClass: 'A',
    velocity: 'FAST',
    currentStock: 32,
    allocatedStock: 8,
    availableStock: 24,
    onOrderStock: 0,
    unitCost: 18.50,
    sellingPrice: 64.00,
    annualHoldingCostRate: 0.20,
    orderPlacementCost: 55.00,
    targetServiceLevel: 0.98,
    targetMaxDaysOfSupply: 40,
    avgDailyDemand: 19.2,
    stdDevDailyDemand: 5.5,
    tags: ['Viral TikTok Trend', 'Imminent Stockout Risk', 'Fast Mover'],
    lastAuditedAt: '2026-08-23',
    lastRestockedAt: '2026-08-01',
    preferredSupplierId: 'sup-seoul-derm',
    suppliers: [
      {
        supplierId: 'sup-seoul-derm',
        supplierName: 'Seoul Derma Lab Co.',
        location: 'Seoul, KR (Express Air)',
        unitCost: 18.50,
        leadTimeDays: 5,
        leadTimeVarianceDays: 1,
        moq: 250,
        otifReliabilityRate: 0.97,
        defectRate: 0.003,
        shippingCostPerUnit: 1.50,
        esgScore: 92,
        paymentTerms: 'Net 30'
      },
      {
        supplierId: 'sup-cali-cosmo',
        supplierName: 'CaliCosmo Labs USA',
        location: 'Irvine, CA (Ground Courier)',
        unitCost: 21.00,
        leadTimeDays: 2,
        leadTimeVarianceDays: 0.5,
        moq: 100,
        otifReliabilityRate: 0.99,
        defectRate: 0.001,
        shippingCostPerUnit: 0.90,
        esgScore: 95,
        paymentTerms: '2/10 Net 30'
      }
    ],
    historicalSales: past.map((d, idx) => {
      // simulate sharp spike in the last 10 days
      const viralMultiplier = idx > 20 ? 1.9 : 1.0;
      const base = (14 + Math.cos(idx / 3) * 4) * viralMultiplier;
      return {
        date: d,
        actualDemand: Math.round(base),
        promotionalEvent: idx > 20 ? 'Influencer Campaign Viral Lift' : undefined
      };
    }),
    forecast30d: future.map((d, idx) => {
      const pred = Math.round(22 - idx * 0.15 + Math.sin(idx / 2) * 4);
      return {
        date: d,
        predictedDemand: pred,
        confidenceLower: Math.round(pred * 0.8),
        confidenceUpper: Math.round(pred * 1.3),
        isSurgePredicted: idx < 14,
        eventNote: idx === 3 ? 'High Social Media Conversion Run-rate' : undefined
      };
    })
  },
  {
    id: 'sku-006',
    sku: 'ELC-GAN-65W-BLK',
    name: 'GaN Ultra-Compact 65W Fast Charger',
    category: 'Consumer Electronics',
    warehouse: 'CENTRAL_HUB',
    abcClass: 'B',
    velocity: 'FAST',
    currentStock: 110,
    allocatedStock: 25,
    availableStock: 85,
    onOrderStock: 300,
    unitCost: 11.20,
    sellingPrice: 34.99,
    annualHoldingCostRate: 0.20,
    orderPlacementCost: 50.00,
    targetServiceLevel: 0.95,
    targetMaxDaysOfSupply: 45,
    avgDailyDemand: 14.8,
    stdDevDailyDemand: 3.6,
    tags: ['Core Accessory', 'Healthy Pipeline'],
    lastAuditedAt: '2026-08-21',
    lastRestockedAt: '2026-08-05',
    preferredSupplierId: 'sup-shenzen',
    suppliers: [
      {
        supplierId: 'sup-shenzen',
        supplierName: 'Shenzhen Pacific Dynamics',
        location: 'Shenzhen, CN',
        unitCost: 11.20,
        leadTimeDays: 16,
        leadTimeVarianceDays: 3,
        moq: 300,
        otifReliabilityRate: 0.92,
        defectRate: 0.012,
        shippingCostPerUnit: 0.85,
        esgScore: 75,
        paymentTerms: 'Net 60'
      }
    ],
    historicalSales: past.map((d, idx) => ({
      date: d,
      actualDemand: Math.round(15 + Math.sin(idx / 3) * 3)
    })),
    forecast30d: future.map((d, idx) => {
      const pred = Math.round(15.5 + Math.sin((idx + 30) / 3) * 3);
      return {
        date: d,
        predictedDemand: pred,
        confidenceLower: Math.round(pred * 0.85),
        confidenceUpper: Math.round(pred * 1.2)
      };
    })
  },
  {
    id: 'sku-007',
    sku: 'IND-VALVE-PNEU-2',
    name: '2-Inch Stainless Pneumatic Actuator Valve',
    category: 'Industrial Hardware',
    warehouse: 'EAST_HUB',
    abcClass: 'A',
    velocity: 'MEDIUM',
    currentStock: 8,
    allocatedStock: 2,
    availableStock: 6,
    onOrderStock: 0,
    unitCost: 185.00,
    sellingPrice: 380.00,
    annualHoldingCostRate: 0.19,
    orderPlacementCost: 90.00,
    targetServiceLevel: 0.98,
    targetMaxDaysOfSupply: 60,
    avgDailyDemand: 1.6,
    stdDevDailyDemand: 0.7,
    tags: ['Industrial Spec', 'Near Reorder Point'],
    lastAuditedAt: '2026-08-20',
    lastRestockedAt: '2026-07-10',
    preferredSupplierId: 'sup-valvetech',
    suppliers: [
      {
        supplierId: 'sup-valvetech',
        supplierName: 'ValveTech Hydrodynamics',
        location: 'Stuttgart, DE (Air Cargo)',
        unitCost: 185.00,
        leadTimeDays: 9,
        leadTimeVarianceDays: 2,
        moq: 25,
        otifReliabilityRate: 0.95,
        defectRate: 0.004,
        shippingCostPerUnit: 12.00,
        esgScore: 90,
        paymentTerms: 'Net 30'
      }
    ],
    historicalSales: past.map((d, idx) => ({
      date: d,
      actualDemand: Math.max(0, Math.round(1.6 + Math.cos(idx / 3) * 0.8))
    })),
    forecast30d: future.map((d, idx) => {
      const pred = Math.round(1.8 + Math.cos((idx + 30) / 3) * 0.6);
      return {
        date: d,
        predictedDemand: pred,
        confidenceLower: Math.max(0, Math.round(pred * 0.6)),
        confidenceUpper: Math.round(pred * 1.4)
      };
    })
  },
  {
    id: 'sku-008',
    sku: 'OFC-ERG-CHAIR-MESH',
    name: 'Ergonomic Breathable Mesh Task Chair',
    category: 'Office & Facilities',
    warehouse: 'SOUTH_FACILITY',
    abcClass: 'C',
    velocity: 'SLOW',
    currentStock: 85,
    allocatedStock: 5,
    availableStock: 80,
    onOrderStock: 0,
    unitCost: 95.00,
    sellingPrice: 220.00,
    annualHoldingCostRate: 0.25,
    orderPlacementCost: 110.00,
    targetServiceLevel: 0.90,
    targetMaxDaysOfSupply: 60,
    avgDailyDemand: 1.1,
    stdDevDailyDemand: 0.6,
    tags: ['Bulky Item', 'High Storage Footprint'],
    lastAuditedAt: '2026-08-15',
    lastRestockedAt: '2026-04-20',
    preferredSupplierId: 'sup-ergo',
    suppliers: [
      {
        supplierId: 'sup-ergo',
        supplierName: 'ErgoWork Solutions',
        location: 'Grand Rapids, MI',
        unitCost: 95.00,
        leadTimeDays: 7,
        leadTimeVarianceDays: 2,
        moq: 20,
        otifReliabilityRate: 0.94,
        defectRate: 0.01,
        shippingCostPerUnit: 16.00,
        esgScore: 86,
        paymentTerms: 'Net 30'
      }
    ],
    historicalSales: past.map((d, idx) => ({
      date: d,
      actualDemand: Math.max(0, Math.round(1.1 + Math.sin(idx / 4) * 0.5))
    })),
    forecast30d: future.map((d, idx) => {
      const pred = Math.max(1, Math.round(1.2 + Math.sin((idx + 30) / 4) * 0.4));
      return {
        date: d,
        predictedDemand: pred,
        confidenceLower: 0,
        confidenceUpper: Math.round(pred * 1.5)
      };
    })
  }
];

export const INITIAL_PURCHASE_ORDERS: PurchaseOrder[] = [
  {
    id: 'po-9041',
    poNumber: 'PO-2026-9041',
    supplierId: 'sup-puregrain',
    supplierName: 'PureGrain Organic Dist',
    warehouse: 'EAST_HUB',
    status: 'IN_TRANSIT',
    createdAt: '2026-08-21T10:30:00Z',
    expectedDeliveryDate: '2026-08-25T17:00:00Z',
    approvedBy: 'Sarah Chen (Lead Procurement)',
    approvedAt: '2026-08-21T11:15:00Z',
    incoterms: 'DDP',
    paymentTerms: 'Net 15',
    subtotal: 2840.00,
    shippingCost: 220.00,
    tax: 142.00,
    totalAmount: 3202.00,
    notes: 'Urgent restocking for Organic Barista Oat Milk to support weekly cafe retail distribution.',
    aiJustification: 'Autonomous trigger: Buffer breached 4-day threshold. PureGrain 3-day lead time prevents weekend stockout.',
    items: [
      {
        itemId: 'sku-003',
        sku: 'FNB-ORG-OAT-1L',
        name: 'Organic Barista Oat Milk 1L (Pack of 6)',
        quantity: 200,
        unitCost: 14.20,
        totalCost: 2840.00,
        safetyStockAtTime: 72,
        currentStockAtTime: 140
      }
    ]
  },
  {
    id: 'po-9042',
    poNumber: 'PO-2026-9042',
    supplierId: 'sup-shenzen',
    supplierName: 'Shenzhen Pacific Dynamics',
    warehouse: 'CENTRAL_HUB',
    status: 'IN_TRANSIT',
    createdAt: '2026-08-16T08:00:00Z',
    expectedDeliveryDate: '2026-09-02T12:00:00Z',
    approvedBy: 'Marcus Vance (VP Supply Chain)',
    approvedAt: '2026-08-16T09:40:00Z',
    incoterms: 'FOB',
    paymentTerms: 'Net 60',
    subtotal: 3360.00,
    shippingCost: 255.00,
    tax: 168.00,
    totalAmount: 3783.00,
    notes: 'Scheduled batch replenishment for GaN chargers to capture 10% container volume discount.',
    aiJustification: 'Volume optimization: Order 300 units aligns with EOQ (285) to lock lowest landed cost of $11.20/unit.',
    items: [
      {
        itemId: 'sku-006',
        sku: 'ELC-GAN-65W-BLK',
        name: 'GaN Ultra-Compact 65W Fast Charger',
        quantity: 300,
        unitCost: 11.20,
        totalCost: 3360.00,
        safetyStockAtTime: 44,
        currentStockAtTime: 95
      }
    ]
  },
  {
    id: 'po-9043',
    poNumber: 'PO-2026-9043',
    supplierId: 'sup-apex',
    supplierName: 'Apex Precision Logistics',
    warehouse: 'CENTRAL_HUB',
    status: 'PENDING_APPROVAL',
    createdAt: '2026-08-23T06:45:00Z',
    expectedDeliveryDate: '2026-08-27T15:00:00Z',
    incoterms: 'DDP',
    paymentTerms: 'Net 30',
    subtotal: 8450.00,
    shippingCost: 320.00,
    tax: 422.50,
    totalAmount: 9192.50,
    notes: 'CRITICAL EMERGENCY PO: Pro Wireless ANC Studio Headphones approaching stockout within 2.9 days.',
    aiJustification: 'AI Alert: Velocity spiked 45% following tech blog feature. Apex 4-day air delivery chosen over Shenzhen 24-day sea freight to save $14,600 in lost revenue.',
    items: [
      {
        itemId: 'sku-001',
        sku: 'ELC-ANC-900',
        name: 'Pro Wireless ANC Studio Headphones',
        quantity: 100,
        unitCost: 84.50,
        totalCost: 8450.00,
        safetyStockAtTime: 38,
        currentStockAtTime: 48
      }
    ]
  }
];

export const DEFAULT_POLICY_SETTINGS: SystemPolicySettings = {
  defaultServiceLevel: 0.95,
  criticalItemServiceLevel: 0.98,
  defaultHoldingCostRate: 0.22,
  defaultOrderPlacementCost: 75.00,
  minBufferDays: 7,
  autoRecommendThresholdDays: 14,
  currencySymbol: '$',
  aiModelName: 'gemini-3.7-flash',
  enableGeminiReasoning: true
};
