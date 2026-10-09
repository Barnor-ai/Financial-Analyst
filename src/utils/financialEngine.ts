/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PeriodFinancialData, FinancialRatios } from '../types';

/**
 * Safe division helper preventing NaN, Infinity, or misleading zero/negative percentage outputs.
 */
export function safeDiv(num: number, den: number, multiplier = 1): number {
  if (!den || den === 0 || isNaN(den) || !isFinite(den)) return 0;
  if (isNaN(num) || !isFinite(num)) return 0;
  const res = (num / den) * multiplier;
  return Number(res.toFixed(2));
}

/**
 * Compute Percentage Change between Current and Prior period
 * Handles negative and zero prior period bases carefully as per Financial Consulting standards.
 */
export function calculatePercentageChange(current: number, prior: number): number {
  if (prior === 0) {
    if (current === 0) return 0;
    return current > 0 ? 100 : -100;
  }
  // Standard percentage change formula: (Current - Prior) / |Prior| * 100
  const change = (current - prior) / Math.abs(prior) * 100;
  return Number(change.toFixed(1));
}

/**
 * Full deterministic calculation of Financial Ratios
 */
export function calculateFinancialRatios(
  currentData: PeriodFinancialData,
  priorData?: PeriodFinancialData | null
): FinancialRatios {
  const is = currentData.incomeStatement;
  const bs = currentData.balanceSheet;

  // Averages if prior period is available
  const avgAR = priorData ? (bs.assets.accountsReceivable + priorData.balanceSheet.assets.accountsReceivable) / 2 : bs.assets.accountsReceivable;
  const avgInventory = priorData ? (bs.assets.inventory + priorData.balanceSheet.assets.inventory) / 2 : bs.assets.inventory;
  const avgAP = priorData ? (bs.liabilities.accountsPayable + priorData.balanceSheet.liabilities.accountsPayable) / 2 : bs.liabilities.accountsPayable;

  // 1. Profitability
  const gpMargin = safeDiv(is.grossProfit, is.revenue, 100);
  const npMargin = safeDiv(is.netIncome, is.revenue, 100);
  const opMargin = safeDiv(is.operatingIncome, is.revenue, 100);
  
  const depreciation = is.operatingExpenses.depreciation || 0;
  const ebitda = is.operatingIncome + depreciation;
  const ebitdaMargin = safeDiv(ebitda, is.revenue, 100);
  
  const roa = safeDiv(is.netIncome, bs.assets.totalAssets, 100);
  const roe = safeDiv(is.netIncome, bs.equity.totalEquity, 100);

  // 2. Liquidity
  const currentRatio = safeDiv(bs.assets.totalCurrentAssets, bs.liabilities.totalCurrentLiabilities);
  const quickRatio = safeDiv(bs.assets.totalCurrentAssets - bs.assets.inventory, bs.liabilities.totalCurrentLiabilities);
  const cashRatio = safeDiv(bs.assets.cashAndEquivalents, bs.liabilities.totalCurrentLiabilities);
  const workingCapital = bs.assets.totalCurrentAssets - bs.liabilities.totalCurrentLiabilities;

  // 3. Efficiency
  const dso = is.revenue > 0 ? safeDiv(avgAR, is.revenue, 365) : 0;
  const dio = is.cogs > 0 ? safeDiv(avgInventory, is.cogs, 365) : 0;
  const dpo = is.cogs > 0 ? safeDiv(avgAP, is.cogs, 365) : 0;
  const cashConversionCycle = Number((dso + dio - dpo).toFixed(1));
  
  const assetTurnover = safeDiv(is.revenue, bs.assets.totalAssets);
  const inventoryTurnover = safeDiv(is.cogs, avgInventory);
  const receivablesTurnover = safeDiv(is.revenue, avgAR);

  // 4. Solvency & Leverage
  const totalDebt = (bs.liabilities.shortTermDebt || 0) + (bs.liabilities.longTermDebt || 0);
  const debtToEquityRatio = safeDiv(totalDebt > 0 ? totalDebt : bs.liabilities.totalLiabilities, bs.equity.totalEquity);
  const debtToAssetsRatio = safeDiv(totalDebt > 0 ? totalDebt : bs.liabilities.totalLiabilities, bs.assets.totalAssets);
  const equityRatio = safeDiv(bs.equity.totalEquity, bs.assets.totalAssets, 100);
  const interestCoverageRatio = is.interestExpense > 0 
    ? Number((is.operatingIncome / is.interestExpense).toFixed(2)) 
    : 'N/A';

  // 5. Altman Z-Score for Emerging / Private Enterprises (Z'-Score)
  // Z' = 0.717*X1 + 0.847*X2 + 3.107*X3 + 0.420*X4 + 0.998*X5
  const totalAssets = bs.assets.totalAssets || 1;
  const x1 = workingCapital / totalAssets;
  const x2 = bs.equity.retainedEarnings / totalAssets;
  const x3 = is.operatingIncome / totalAssets;
  const x4 = bs.liabilities.totalLiabilities > 0 ? bs.equity.totalEquity / bs.liabilities.totalLiabilities : 1;
  const x5 = is.revenue / totalAssets;

  const altmanZScore = Number((0.717 * x1 + 0.847 * x2 + 3.107 * x3 + 0.420 * x4 + 0.998 * x5).toFixed(2));

  // 6. Calibrated 1-10 Risk Score (1 = pristine, 10 = critical danger)
  // Invert Altman Z-score & factor in liquidity and solvency
  let baseRisk = 5.0;

  if (altmanZScore >= 2.9) {
    baseRisk = 2.5; // Safe Zone
  } else if (altmanZScore >= 1.23) {
    baseRisk = 4.0; // Grey / Moderate Zone
  } else {
    baseRisk = 7.5; // Distress Zone
  }

  // Adjustments based on key ratios
  if (currentRatio < 1.0) baseRisk += 1.5;
  if (currentRatio > 2.0) baseRisk -= 0.5;
  if (debtToEquityRatio > 2.0) baseRisk += 1.0;
  if (npMargin < 0) baseRisk += 1.5;
  if (npMargin > 15) baseRisk -= 1.0;

  const riskScore = Math.min(10, Math.max(1, Number(baseRisk.toFixed(1))));

  return {
    grossProfitMargin: gpMargin,
    netProfitMargin: npMargin,
    operatingMargin: opMargin,
    ebitda,
    ebitdaMargin,
    returnOnAssets: roa,
    returnOnEquity: roe,
    currentRatio,
    quickRatio,
    cashRatio,
    workingCapital,
    daysSalesOutstanding: dso,
    daysInventoryOutstanding: dio,
    daysPayablesOutstanding: dpo,
    cashConversionCycle,
    assetTurnover,
    inventoryTurnover,
    receivablesTurnover,
    debtToEquityRatio,
    debtToAssetsRatio,
    equityRatio,
    interestCoverageRatio,
    altmanZScore,
    riskScore
  };
}

/**
 * Generate empirical "Why:" narrative explanations for line items
 * matching the high-end management consulting voice seen in the reference video.
 */
export function generateLineItemExplanations(
  current: PeriodFinancialData,
  prior: PeriodFinancialData
): Record<string, string> {
  const isCurr = current.incomeStatement;
  const isPrior = prior.incomeStatement;

  const revChangePct = calculatePercentageChange(isCurr.revenue, isPrior.revenue);
  const cogsChangePct = calculatePercentageChange(isCurr.cogs, isPrior.cogs);
  const gpChangePct = calculatePercentageChange(isCurr.grossProfit, isPrior.grossProfit);
  const opexChangePct = calculatePercentageChange(isCurr.operatingExpenses.total, isPrior.operatingExpenses.total);
  const ebitChangePct = calculatePercentageChange(isCurr.operatingIncome, isPrior.operatingIncome);
  const netIncomeChangePct = calculatePercentageChange(isCurr.netIncome, isPrior.netIncome);

  const currGpMargin = safeDiv(isCurr.grossProfit, isCurr.revenue, 100);
  const priorGpMargin = safeDiv(isPrior.grossProfit, isPrior.revenue, 100);
  const gpMarginDelta = (currGpMargin - priorGpMargin).toFixed(1);

  const currNpMargin = safeDiv(isCurr.netIncome, isCurr.revenue, 100);
  const priorNpMargin = safeDiv(isPrior.netIncome, isPrior.revenue, 100);

  return {
    revenue: revChangePct >= 0
      ? `Revenue saw a remarkable ${revChangePct > 0 ? '+' : ''}${revChangePct}% increase, driven by expanded market share and strong commercial demand across primary trading segments. Sales volume expansion contributed directly to operational scaling.`
      : `Revenue contracted by ${revChangePct}%, reflecting softer market demand, customer churn, or seasonal volume downswings. Management attention is advised on top-line retention.`,
    cogs: cogsChangePct < revChangePct
      ? `COGS increased by ${cogsChangePct > 0 ? '+' : ''}${cogsChangePct}%, growing slower than revenue. This favorable divergence suggests improved purchasing efficiency, better supplier terms, and positive product mix shift.`
      : `COGS grew by ${cogsChangePct > 0 ? '+' : ''}${cogsChangePct}%, outpacing top-line expansion and exerting downward pressure on initial unit margins due to input cost inflation.`,
    grossProfit: gpChangePct >= 0
      ? `Gross profit surged by ${gpChangePct > 0 ? '+' : ''}${gpChangePct}%. This was a direct result of revenue outgrowing cost of sales, expanding gross margin from ${priorGpMargin}% to ${currGpMargin}% (${Number(gpMarginDelta) >= 0 ? '+' : ''}${gpMarginDelta}% pts).`
      : `Gross profit declined by ${gpChangePct}%, compressing gross margin to ${currGpMargin}%. Price concessions or input escalations impacted trading surplus.`,
    operatingExpenses: opexChangePct <= revChangePct
      ? `Operating expenses grew by ${opexChangePct > 0 ? '+' : ''}${opexChangePct}%, maintained well within revenue growth bounds. Administrative discipline and fixed-cost absorption created positive operational leverage.`
      : `Operating expenses increased by ${opexChangePct > 0 ? '+' : ''}${opexChangePct}%, driven by investments in headcount, marketing, and distribution to support business expansion.`,
    operatingIncome: ebitChangePct >= 0
      ? `Operating income grew by ${ebitChangePct > 0 ? '+' : ''}${ebitChangePct}%, significantly outperforming top-line growth. Strong operating leverage demonstrates an efficient and scalable corporate cost structure.`
      : `Operating income fell by ${ebitChangePct}%, as fixed overhead absorption was strained by cost pressures.`,
    growthLevy: isCurr.growthLevy 
      ? `Growth and Sustainability Levy adjusted to pre-tax profit movements, reflecting fiscal statutory requirements.`
      : `Corporate regulatory statutory contributions remained aligned with standard operating compliance schedules.`,
    taxExpense: `Income tax expense tracked taxable pre-tax income, reflecting statutory rates and seasonal tax provisions.`,
    netIncome: netIncomeChangePct >= 0
      ? `Net income expanded by ${netIncomeChangePct > 0 ? '+' : ''}${netIncomeChangePct}%, achieving net profit margin of ${currNpMargin}% (vs ${priorNpMargin}% prior). Strong bottom-line results reinforced retained earnings and book equity.`
      : `Net income contracted by ${netIncomeChangePct}%, reducing final net profit margin to ${currNpMargin}%. Overhead control and margin defense are recommended.`
  };
}
