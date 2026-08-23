import { GoogleGenAI } from '@google/genai';

// Initialize server-side Gemini client
const apiKey = process.env.GEMINI_API_KEY || '';

let aiClient: GoogleGenAI | null = null;
if (apiKey) {
  aiClient = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export async function generateInventoryRiskExplanation(payload: {
  sku: string;
  name: string;
  category: string;
  currentStock: number;
  avgDailyDemand: number;
  daysOfSupply: number;
  projectedRunoutDays: number;
  safetyStock: number;
  reorderPoint: number;
  recommendedOrderQty: number;
  recommendedSupplierName: string;
  leadTimeDays: number;
  potentialStockoutLoss: number;
  riskLevel: string;
  recentSalesTrend: string;
}): Promise<string> {
  if (!aiClient) {
    return generateFallbackRiskExplanation(payload);
  }

  try {
    const prompt = `You are ReStock AI's Senior Supply Chain & Procurement Intelligence Engine.
Analyze the following SKU state and produce a concise, professional, highly actionable procurement brief.

SKU Details:
- Item: ${payload.name} (${payload.sku})
- Category: ${payload.category}
- Risk Level: ${payload.riskLevel}
- Current On-Hand: ${payload.currentStock} units
- Daily Demand Velocity: ${payload.avgDailyDemand} units/day
- Current Days of Supply: ${payload.daysOfSupply} days
- Projected Run-out Window: ${payload.projectedRunoutDays} days
- Safety Stock Threshold: ${payload.safetyStock} units
- Reorder Point (ROP): ${payload.reorderPoint} units
- Recommended Order: ${payload.recommendedOrderQty} units via ${payload.recommendedSupplierName} (${payload.leadTimeDays}d lead time)
- Estimated Financial Stockout Exposure: $${payload.potentialStockoutLoss.toLocaleString()}
- Demand Trend: ${payload.recentSalesTrend}

Provide:
1. Root Cause Analysis (why this risk emerged)
2. Supplier & Quantity Justification (why this specific quantity & vendor)
3. Action Plan (exact step for the procurement manager to execute today)

Keep the response crisp, authoritative, formatted with clear markdown bullet points, under 180 words. Avoid generic SaaS buzzwords.`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        temperature: 0.2,
      },
    });

    return response.text || generateFallbackRiskExplanation(payload);
  } catch (err) {
    console.error('Error generating risk explanation via Gemini:', err);
    return generateFallbackRiskExplanation(payload);
  }
}

export async function generateSupplierNegotiationMemo(payload: {
  sku: string;
  name: string;
  supplierName: string;
  currentUnitCost: number;
  leadTimeDays: number;
  moq: number;
  targetOrderQty: number;
  otifReliability: number;
  defectRate: number;
}): Promise<string> {
  if (!aiClient) {
    return generateFallbackNegotiationMemo(payload);
  }

  try {
    const prompt = `You are a Chief Procurement Officer at an enterprise enterprise organization.
Draft a concise, data-driven supplier negotiation brief and email template for our buyer negotiating with ${payload.supplierName}.

Context:
- Product: ${payload.name} (${payload.sku})
- Planned Order Volume: ${payload.targetOrderQty} units
- Current Quoted Price: $${payload.currentUnitCost.toFixed(2)}/unit
- Lead Time: ${payload.leadTimeDays} days
- Supplier MOQ: ${payload.moq} units
- Historical Reliability: ${(payload.otifReliability * 100).toFixed(1)}% OTIF, ${(payload.defectRate * 100).toFixed(2)}% defect rate

Provide:
1. Leverage Points & Target Benchmarks (Target: 4-6% price reduction or 3-day lead time acceleration)
2. Professional Ready-to-Send Email Script for the Buyer.`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        temperature: 0.3,
      },
    });

    return response.text || generateFallbackNegotiationMemo(payload);
  } catch (err) {
    console.error('Error generating negotiation memo via Gemini:', err);
    return generateFallbackNegotiationMemo(payload);
  }
}

function generateFallbackRiskExplanation(payload: any): string {
  return `### **Autonomous Risk Diagnostic**
* **Root Cause**: Demand run-rate of **${payload.avgDailyDemand} units/day** has outpaced buffer replenishment. Current on-hand (${payload.currentStock} units) falls below the safety buffer (${payload.safetyStock} units), yielding a critical stockout horizon of **${payload.projectedRunoutDays} days**.
* **Replenishment Rationale**: Recommended order of **${payload.recommendedOrderQty} units** via **${payload.recommendedSupplierName}** satisfies the ${payload.leadTimeDays}-day delivery window while optimizing Economic Order Quantity (EOQ) and avoiding an estimated **$${payload.potentialStockoutLoss.toLocaleString()}** in lost revenue.
* **Immediate Recommendation**: Approve Purchase Order immediately with priority dispatch to ensure arrival prior to runway exhaustion.`;
}

function generateFallbackNegotiationMemo(payload: any): string {
  return `### **Negotiation Strategy for ${payload.supplierName}**
* **Target Pricing**: Propose **$${(payload.currentUnitCost * 0.94).toFixed(2)}/unit** (6% discount) backed by our commitment for a consolidated **${payload.targetOrderQty} unit** volume.
* **Lead Time Objective**: Request expedited dispatch within **${Math.max(2, payload.leadTimeDays - 3)} business days** given our high order frequency and ${(payload.otifReliability * 100).toFixed(0)}% OTIF partnership history.
* **Email Template**:
> "Dear ${payload.supplierName} Account Team,\n> We are preparing our PO for ${payload.targetOrderQty} units of ${payload.name} (${payload.sku}). Given our scaling commitment and repeat volume, we request a rate of $${(payload.currentUnitCost * 0.94).toFixed(2)}/unit and guaranteed dispatch within ${Math.max(2, payload.leadTimeDays - 3)} days. Please confirm so we can release the PO today."`;
}
