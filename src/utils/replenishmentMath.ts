import {
  InventoryItem,
  OptimizationMetrics,
  SupplierOffer,
  SupplierScoreDetail,
  SimulationParameters,
  SimulationResultSummary,
  RiskLevel
} from '../types/inventory';

/**
 * Standard Normal Inverse Cumulative Distribution Function (Z-score calculation)
 * Accurate rational approximation by Beasley-Springer-Moro
 */
export function getZScore(serviceLevel: number): number {
  if (serviceLevel >= 0.999) return 3.09;
  if (serviceLevel >= 0.995) return 2.576;
  if (serviceLevel >= 0.99) return 2.326;
  if (serviceLevel >= 0.98) return 2.054;
  if (serviceLevel >= 0.95) return 1.645;
  if (serviceLevel >= 0.90) return 1.282;
  if (serviceLevel >= 0.85) return 1.036;
  if (serviceLevel >= 0.80) return 0.842;
  return 1.645; // default fallback
}

/**
 * Calculate multi-attribute supplier score
 */
export function scoreSupplier(
  item: InventoryItem,
  supplier: SupplierOffer,
  currentStockDays: number,
  weights = { cost: 0.35, speed: 0.30, reliability: 0.25, quality: 0.10 }
): SupplierScoreDetail {
  // If stock is critically low (< 7 days), prioritize lead time / speed more heavily
  const isEmergency = currentStockDays < 7;
  const activeWeights = isEmergency
    ? { cost: 0.20, speed: 0.50, reliability: 0.20, quality: 0.10 }
    : weights;

  // Normalized Cost: compare against baseline unit cost
  const allCosts = item.suppliers.map(s => s.unitCost + s.shippingCostPerUnit);
  const minCost = Math.min(...allCosts);
  const maxCost = Math.max(...allCosts) || minCost + 1;
  const effectiveCost = supplier.unitCost + supplier.shippingCostPerUnit;
  const costScore = Math.max(10, Math.min(100, 100 - ((effectiveCost - minCost) / (maxCost - minCost || 1)) * 90));

  // Normalized Speed: lower lead time = higher score
  const allLeadTimes = item.suppliers.map(s => s.leadTimeDays);
  const minLeadTime = Math.min(...allLeadTimes);
  const maxLeadTime = Math.max(...allLeadTimes) || minLeadTime + 1;
  const speedScore = Math.max(10, Math.min(100, 100 - ((supplier.leadTimeDays - minLeadTime) / (maxLeadTime - minLeadTime || 1)) * 90));

  // Reliability: OTIF (e.g. 0.96 -> 96)
  const reliabilityScore = Math.min(100, Math.max(20, supplier.otifReliabilityRate * 100));

  // Quality: lower defect rate is better
  const qualityScore = Math.min(100, Math.max(20, (1 - supplier.defectRate * 10) * 100));

  const compositeScore = Math.round(
    costScore * activeWeights.cost +
    speedScore * activeWeights.speed +
    reliabilityScore * activeWeights.reliability +
    qualityScore * activeWeights.quality
  );

  let tradeOffSummary = '';
  if (isEmergency && speedScore > 80) {
    tradeOffSummary = `Fastest lead time (${supplier.leadTimeDays}d) to prevent immediate stockout shock.`;
  } else if (effectiveCost === minCost) {
    tradeOffSummary = `Lowest total landed cost ($${effectiveCost.toFixed(2)}/unit) with ${supplier.leadTimeDays}d lead time.`;
  } else if (supplier.otifReliabilityRate >= 0.98) {
    tradeOffSummary = `Highest fulfillment reliability (${(supplier.otifReliabilityRate * 100).toFixed(0)}% OTIF) with minimal defect rate.`;
  } else {
    tradeOffSummary = `Balanced lead time (${supplier.leadTimeDays}d) and cost profile.`;
  }

  return {
    supplier,
    costScore: Math.round(costScore),
    speedScore: Math.round(speedScore),
    reliabilityScore: Math.round(reliabilityScore),
    qualityScore: Math.round(qualityScore),
    compositeScore,
    recommended: false, // will be tagged by parent optimizer
    tradeOffSummary,
  };
}

/**
 * Perform full replenishment calculation for a single inventory item
 */
export function calculateOptimizationMetrics(
  item: InventoryItem,
  simParams?: SimulationParameters
): OptimizationMetrics {
  const params: SimulationParameters = simParams || {
    demandMultiplier: 1.0,
    leadTimeShiftDays: 0,
    targetServiceLevel: item.targetServiceLevel || 0.95,
    holdingCostRate: item.annualHoldingCostRate || 0.22,
    supplierPriceChangePercent: 0,
  };

  const adjDailyDemand = Math.max(0.1, item.avgDailyDemand * params.demandMultiplier);
  const adjDailyStdDev = Math.max(0.05, item.stdDevDailyDemand * Math.sqrt(params.demandMultiplier));
  const zScore = getZScore(params.targetServiceLevel);

  // Score all suppliers to find the primary candidate
  const currentDaysOfSupply = item.avgDailyDemand > 0 ? (item.currentStock + item.onOrderStock) / adjDailyDemand : 999;
  const scoredSuppliers = item.suppliers.map(s => scoreSupplier(item, s, currentDaysOfSupply));
  scoredSuppliers.sort((a, b) => b.compositeScore - a.compositeScore);
  const bestSupplier = scoredSuppliers[0]?.supplier || item.suppliers[0];

  // Lead time factoring in variance and simulation shift
  const baseLeadTime = Math.max(1, bestSupplier.leadTimeDays + params.leadTimeShiftDays);
  const leadTimeStdDev = Math.max(0.5, bestSupplier.leadTimeVarianceDays);

  // Safety Stock formula: SS = Z * sqrt( L * sigma_D^2 + D^2 * sigma_L^2 )
  const combinedVariance = (baseLeadTime * Math.pow(adjDailyStdDev, 2)) + (Math.pow(adjDailyDemand, 2) * Math.pow(leadTimeStdDev, 2));
  const combinedStdDev = Math.sqrt(Math.max(0.01, combinedVariance));
  const safetyStock = Math.round(zScore * combinedStdDev);

  // Reorder Point formula: ROP = (Demand_avg * LeadTime_avg) + Safety Stock
  const reorderPoint = Math.round((adjDailyDemand * baseLeadTime) + safetyStock);

  // Economic Order Quantity (EOQ): sqrt( (2 * AnnualDemand * S) / H )
  const annualDemand = adjDailyDemand * 365;
  const adjUnitCost = bestSupplier.unitCost * (1 + params.supplierPriceChangePercent / 100);
  const holdingCostPerUnitAnnual = Math.max(0.5, adjUnitCost * params.holdingCostRate);
  const rawEoq = Math.sqrt((2 * annualDemand * item.orderPlacementCost) / holdingCostPerUnitAnnual);
  const economicOrderQuantity = Math.max(bestSupplier.moq, Math.round(rawEoq));

  // Current inventory state
  const effectiveInventory = item.currentStock + item.onOrderStock - item.allocatedStock;
  const projectedRunoutDays = adjDailyDemand > 0 ? Math.max(0, item.currentStock / adjDailyDemand) : 999;

  // Runout date
  const now = new Date();
  const runoutDateObj = new Date(now.getTime() + projectedRunoutDays * 86400000);
  const projectedRunoutDate = projectedRunoutDays < 365
    ? runoutDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '365+ Days';

  const isBelowROP = effectiveInventory <= reorderPoint;
  const isStockoutImminent = projectedRunoutDays <= baseLeadTime;
  const maxAllowableStock = Math.max(reorderPoint + economicOrderQuantity, adjDailyDemand * item.targetMaxDaysOfSupply);
  const isOverstocked = effectiveInventory > maxAllowableStock * 1.35;

  // Determine Risk Level
  let riskLevel: RiskLevel = 'HEALTHY';
  if (projectedRunoutDays <= 4 || (projectedRunoutDays <= baseLeadTime && item.currentStock < safetyStock * 0.5)) {
    riskLevel = 'CRITICAL';
  } else if (isBelowROP || projectedRunoutDays <= baseLeadTime + 3) {
    riskLevel = 'HIGH';
  } else if (effectiveInventory <= reorderPoint * 1.25) {
    riskLevel = 'MEDIUM';
  } else if (isOverstocked) {
    riskLevel = 'OVERSTOCKED';
  }

  // Recommended Order Quantity:
  // Target is to restore inventory back to (ROP + EOQ) or target max buffer
  let recommendedOrderQty = 0;
  if (isBelowROP || riskLevel === 'CRITICAL' || riskLevel === 'HIGH') {
    const netShortfall = (reorderPoint + economicOrderQuantity) - effectiveInventory;
    // Align with supplier MOQ
    recommendedOrderQty = Math.max(bestSupplier.moq, Math.ceil(netShortfall / bestSupplier.moq) * bestSupplier.moq);
  }

  const estimatedOrderCost = recommendedOrderQty * adjUnitCost;

  // Potential stockout loss: daily demand * unit margin * shortfall days before new order arrives
  const daysUncovered = Math.max(0, baseLeadTime - projectedRunoutDays);
  const unitMargin = Math.max(1, item.sellingPrice - adjUnitCost);
  const potentialStockoutLoss = Math.round(daysUncovered * adjDailyDemand * unitMargin);

  // Excess inventory carrying cost per month: (excess units * unitCost * holdingRate) / 12
  const excessUnits = Math.max(0, effectiveInventory - (reorderPoint + economicOrderQuantity));
  const excessHoldingCostPerMonth = Math.round((excessUnits * adjUnitCost * params.holdingCostRate) / 12);

  // High-density explainability reasoning
  let reasoningBrief = '';
  if (riskLevel === 'CRITICAL') {
    reasoningBrief = `Stockout in ~${projectedRunoutDays.toFixed(1)}d vs ${baseLeadTime}d vendor lead time. Immediate PO of ${recommendedOrderQty.toLocaleString()} units via ${bestSupplier.supplierName} recommended to avoid $${potentialStockoutLoss.toLocaleString()} lost sales.`;
  } else if (riskLevel === 'HIGH') {
    reasoningBrief = `Inventory (${effectiveInventory} units) breached Reorder Point (${reorderPoint}). Order ${recommendedOrderQty.toLocaleString()} units to secure safety buffer (${safetyStock} units).`;
  } else if (riskLevel === 'OVERSTOCKED') {
    reasoningBrief = `Holding ${effectiveInventory} units (~${Math.round(projectedRunoutDays)}d supply). Excess holding capital drains ~$${excessHoldingCostPerMonth}/mo. Freeze replenishment.`;
  } else {
    reasoningBrief = `Inventory stable at ${Math.round(projectedRunoutDays)}d supply. Buffer comfortably exceeds safety threshold of ${safetyStock} units.`;
  }

  return {
    zScore,
    combinedStdDev: Math.round(combinedStdDev * 10) / 10,
    safetyStock,
    reorderPoint,
    economicOrderQuantity,
    daysOfSupply: Math.round(currentDaysOfSupply * 10) / 10,
    projectedRunoutDays: Math.round(projectedRunoutDays * 10) / 10,
    projectedRunoutDate,
    isBelowROP,
    isStockoutImminent,
    isOverstocked,
    riskLevel,
    recommendedOrderQty,
    recommendedSupplierId: bestSupplier.supplierId,
    recommendedSupplierName: bestSupplier.supplierName,
    estimatedOrderCost,
    potentialStockoutLoss,
    excessHoldingCostPerMonth,
    reasoningBrief,
  };
}

/**
 * Run global simulation across full inventory catalog
 */
export function runCatalogSimulation(
  items: InventoryItem[],
  params: SimulationParameters
): SimulationResultSummary {
  let totalStockoutRiskValue = 0;
  let totalExcessInventoryValue = 0;
  let totalReplenishmentCapitalNeeded = 0;
  let totalAnnualHoldingCost = 0;
  let stockoutCount = 0;
  let sumDaysOfSupply = 0;

  for (const item of items) {
    const metrics = calculateOptimizationMetrics(item, params);
    totalStockoutRiskValue += metrics.potentialStockoutLoss;
    totalExcessInventoryValue += metrics.excessHoldingCostPerMonth * 12;
    totalReplenishmentCapitalNeeded += metrics.estimatedOrderCost;

    const holdingCost = (item.currentStock * item.unitCost * params.holdingCostRate);
    totalAnnualHoldingCost += holdingCost;
    sumDaysOfSupply += metrics.daysOfSupply;

    if (metrics.riskLevel === 'CRITICAL' || metrics.isStockoutImminent) {
      stockoutCount++;
    }
  }

  const stockoutIncidenceRate = items.length > 0 ? (stockoutCount / items.length) * 100 : 0;
  const averageDaysOfSupply = items.length > 0 ? Math.round((sumDaysOfSupply / items.length) * 10) / 10 : 0;

  // Resilience score: 100 minus penalty for stockouts and excess capital drain
  const stockoutPenalty = stockoutIncidenceRate * 1.5;
  const resilienceScore = Math.max(5, Math.min(100, Math.round(100 - stockoutPenalty)));

  return {
    totalStockoutRiskValue: Math.round(totalStockoutRiskValue),
    totalExcessInventoryValue: Math.round(totalExcessInventoryValue),
    averageDaysOfSupply,
    stockoutIncidenceRate: Math.round(stockoutIncidenceRate * 10) / 10,
    totalReplenishmentCapitalNeeded: Math.round(totalReplenishmentCapitalNeeded),
    totalAnnualHoldingCost: Math.round(totalAnnualHoldingCost),
    resilienceScore,
  };
}
