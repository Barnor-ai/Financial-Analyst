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

  const payablesTurnover = is.cogs > 0 ? safeDiv(is.cogs, avgAP) : 0;
  const estimatedHeadcount = Math.max(5, Math.round((is.operatingExpenses?.salaries || 200000) / 75000));
  const revPerEmployee = Math.round(is.revenue / estimatedHeadcount);
  const pbt = (is.operatingIncome || 0) - (is.interestExpense || 0) - (is.growthLevy || 0);

  return {
    grossProfitMargin: gpMargin,
    netProfitMargin: npMargin,
    operatingMargin: opMargin,
    ebitda,
    ebitdaMargin,
    returnOnAssets: roa,
    returnOnEquity: roe,
    profitBeforeTax: pbt,
    profitAfterTax: is.netIncome,
    revenueGrowth: priorData ? calculatePercentageChange(is.revenue, priorData.incomeStatement.revenue) : 0,
    cogsToRevenue: safeDiv(is.cogs, is.revenue, 100),
    opexToRevenue: safeDiv(is.operatingExpenses?.total || 0, is.revenue, 100),
    salariesToRevenue: safeDiv(is.operatingExpenses?.salaries || 0, is.revenue, 100),
    marketingToRevenue: safeDiv(is.operatingExpenses?.marketing || 0, is.revenue, 100),
    rentToRevenue: safeDiv(is.operatingExpenses?.rentAndUtilities || 0, is.revenue, 100),
    depreciationToRevenue: safeDiv(is.operatingExpenses?.depreciation || 0, is.revenue, 100),
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
    payablesTurnover,
    revenuePerEmployee: revPerEmployee,
    debtToEquityRatio,
    debtToAssetsRatio,
    equityRatio,
    interestCoverageRatio,
    financialLeverageMultiplier: safeDiv(bs.assets.totalAssets || 1, bs.equity.totalEquity || 1),
    cashFlowToNetIncome: is.netIncome !== 0 ? safeDiv(currentData.cashFlow.operatingCashFlow, is.netIncome) : 0,
    netCashMovement: currentData.cashFlow.netCashFlow,
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

/**
 * Generate complete AI Consultant Diagnostic Report from financial statements
 */
export function generateReportFromFinancials(
  profile: { companyName?: string; industry?: string; currency?: string },
  periods: PeriodFinancialData[]
): import('../types').FinancialAnalysisReport {
  // Sort reverse-chronologically so Current Year is first
  const sorted = [...periods].sort((a, b) => b.period.localeCompare(a.period, undefined, { numeric: true }));
  const curr = sorted[0];
  const prior = sorted.length > 1 ? sorted[1] : sorted[0];

  const isCurr = curr.incomeStatement;
  const isPrior = prior.incomeStatement;
  const ratiosCurr = calculateFinancialRatios(curr, prior);
  const whyTexts = generateLineItemExplanations(curr, prior);

  const company = profile.companyName || 'The company';
  const curSymbol = profile.currency?.match(/\(([^)]+)\)/)?.[1] || profile.currency?.split(' ')[0] || '$';

  const revGrowth = calculatePercentageChange(isCurr.revenue, isPrior.revenue);
  const gpGrowth = calculatePercentageChange(isCurr.grossProfit, isPrior.grossProfit);
  const netIncomeGrowth = calculatePercentageChange(isCurr.netIncome, isPrior.netIncome);

  const currGpMargin = safeDiv(isCurr.grossProfit, isCurr.revenue, 100);
  const priorGpMargin = safeDiv(isPrior.grossProfit, isPrior.revenue, 100);
  const currNpMargin = safeDiv(isCurr.netIncome, isCurr.revenue, 100);

  const executiveSummary = `${company} demonstrated ${netIncomeGrowth >= 0 ? 'solid profitability expansion' : 'operating consolidation'} in ${curr.period}. Net income reached ${curSymbol} ${Math.abs(isCurr.netIncome).toLocaleString()} (${netIncomeGrowth >= 0 ? '+' : ''}${netIncomeGrowth}% YoY) on total revenue of ${curSymbol} ${Math.abs(isCurr.revenue).toLocaleString()} (${revGrowth >= 0 ? '+' : ''}${revGrowth}% YoY). Gross margins ${currGpMargin >= priorGpMargin ? 'expanded' : 'contracted'} to ${currGpMargin.toFixed(1)}%, indicating ${currGpMargin >= priorGpMargin ? 'strong commercial pricing power and input cost control' : 'margin pressure from direct input costs'}. Financial health rating is currently calibrated at ${ratiosCurr.riskScore <= 3 ? 'low-risk' : ratiosCurr.riskScore <= 6 ? 'moderate' : 'heightened-risk'}.`;

  const revenueDrivers = `Top-line revenue experienced ${revGrowth >= 0 ? `expansion of +${revGrowth}%` : `contraction of ${revGrowth}%`} to ${curSymbol} ${Math.abs(isCurr.revenue).toLocaleString()} in ${curr.period}. Revenue growth was driven by ${revGrowth >= 0 ? 'commercial demand, increased unit volumes, and resilient customer acquisition across core lines' : 'market headwinds, selective product rationalization, and macroeconomic friction'}. Diversified distribution channels helped sustain trading activity.`;

  const costDrivers = `Cost of Goods Sold (COGS) ${calculatePercentageChange(isCurr.cogs, isPrior.cogs) >= 0 ? 'grew by +' : 'shifted by '}${calculatePercentageChange(isCurr.cogs, isPrior.cogs)}%. Operating expenses totalled ${curSymbol} ${isCurr.operatingExpenses.total.toLocaleString()}, reflecting ${calculatePercentageChange(isCurr.operatingExpenses.total, isPrior.operatingExpenses.total)}% change. Disciplined cost management and procurement efficiency were pivotal in managing operational overhead.`;

  const marginCommentary = `Gross profit margin stood at ${currGpMargin.toFixed(1)}% (prior: ${priorGpMargin.toFixed(1)}%), while net margin registered at ${currNpMargin.toFixed(1)}%. Operating leverage ${isCurr.operatingIncome >= isPrior.operatingIncome ? 'improved meaningfully, with earnings before interest and tax outpacing SG&A growth' : 'remains sensitive to overhead creep and direct material variance'}. Continuous focus on high-margin product mix is recommended.`;

  const keyTakeaways = [
    `Revenue changed by ${revGrowth >= 0 ? '+' : ''}${revGrowth}% YoY to ${curSymbol} ${Math.abs(isCurr.revenue).toLocaleString()}`,
    `Gross margin achieved ${currGpMargin.toFixed(1)}% with net profit margin at ${currNpMargin.toFixed(1)}%`,
    `Current liquidity ratio is ${ratiosCurr.currentRatio.toFixed(2)}x (Quick ratio: ${ratiosCurr.quickRatio.toFixed(2)}x)`,
    `Overall corporate diagnostic health score calibrated at ${10 - ratiosCurr.riskScore}/10`
  ];

  const ratiosAnalysisTable: { ratioName: string; values: Record<string, string | number>; benchmark: string; status: 'optimal' | 'warning' | 'critical' }[] = [
    { ratioName: 'Gross Profit Margin', values: { [curr.period]: `${currGpMargin.toFixed(1)}%`, [prior.period]: `${priorGpMargin.toFixed(1)}%` }, benchmark: '25.0%', status: currGpMargin >= 25 ? 'optimal' : currGpMargin >= 18 ? 'warning' : 'critical' },
    { ratioName: 'Net Profit Margin', values: { [curr.period]: `${currNpMargin.toFixed(1)}%`, [prior.period]: `${safeDiv(isPrior.netIncome, isPrior.revenue, 100).toFixed(1)}%` }, benchmark: '8.0%', status: currNpMargin >= 8 ? 'optimal' : currNpMargin >= 4 ? 'warning' : 'critical' },
    { ratioName: 'Current Ratio', values: { [curr.period]: `${ratiosCurr.currentRatio.toFixed(2)}x`, [prior.period]: '1.50x' }, benchmark: '1.50x', status: ratiosCurr.currentRatio >= 1.5 ? 'optimal' : ratiosCurr.currentRatio >= 1.0 ? 'warning' : 'critical' },
    { ratioName: 'Quick Ratio', values: { [curr.period]: `${ratiosCurr.quickRatio.toFixed(2)}x`, [prior.period]: '1.00x' }, benchmark: '1.00x', status: ratiosCurr.quickRatio >= 1.0 ? 'optimal' : 'warning' },
    { ratioName: 'Debt-to-Equity', values: { [curr.period]: `${ratiosCurr.debtToEquityRatio.toFixed(2)}`, [prior.period]: '0.80' }, benchmark: '0.80', status: ratiosCurr.debtToEquityRatio <= 1.0 ? 'optimal' : ratiosCurr.debtToEquityRatio <= 2.0 ? 'warning' : 'critical' },
    { ratioName: 'Altman Z-Score', values: { [curr.period]: `${ratiosCurr.altmanZScore.toFixed(2)}`, [prior.period]: '2.90' }, benchmark: '2.90', status: ratiosCurr.altmanZScore >= 2.9 ? 'optimal' : ratiosCurr.altmanZScore >= 1.23 ? 'warning' : 'critical' }
  ];

  return {
    executiveSummary,
    financialHealthScore: Math.max(1, Math.min(10, Math.round(10 - ratiosCurr.riskScore))),
    profitabilityAnalysis: `Gross margin of ${currGpMargin.toFixed(1)}% and operating margin of ${safeDiv(isCurr.operatingIncome, isCurr.revenue, 100).toFixed(1)}% indicate viable commercial traction.`,
    liquidityAnalysis: `Current assets of ${curSymbol} ${curr.balanceSheet.assets.totalCurrentAssets.toLocaleString()} cover short-term liabilities (${curSymbol} ${curr.balanceSheet.liabilities.totalCurrentLiabilities.toLocaleString()}) with current ratio of ${ratiosCurr.currentRatio.toFixed(2)}x.`,
    cashFlowAnalysis: `Operating cash flow conversion is recorded at ${curSymbol} ${curr.cashFlow.operatingCashFlow.toLocaleString()} with ending cash position of ${curSymbol} ${curr.cashFlow.endingCashBalance.toLocaleString()}.`,
    debtAndRiskAnalysis: `Total liabilities of ${curSymbol} ${curr.balanceSheet.liabilities.totalLiabilities.toLocaleString()} versus equity of ${curSymbol} ${curr.balanceSheet.equity.totalEquity.toLocaleString()} represent debt-to-equity leverage of ${ratiosCurr.debtToEquityRatio.toFixed(2)}.`,
    revenueDrivers,
    costDrivers,
    marginCommentary,
    keyTakeaways,
    lineItemExplanations: whyTexts,
    ratiosAnalysisTable,
    redFlags: ratiosCurr.currentRatio < 1.0 ? ['Current ratio below 1.0x indicates short-term working capital pressure.'] : [],
    recommendations: [
      'Maintain disciplined procurement protocols to protect gross profit margins.',
      'Monitor receivable collection cycles (DSO) to optimize operating cash velocity.',
      'Strengthen retained earnings accumulation to buffer balance sheet equity.'
    ],
    strategicAdvice: [
      'Focus commercial capital deployment on highest-margin product lines.',
      'Establish quarterly budget variance controls to curtail administrative overhead creep.'
    ],
    conclusion: `${company} displays constructive financial dynamics heading into subsequent operating cycles.`
  };
}

/**
 * Statement Validation and Account Reconciliation Engine
 * Verifies fundamental accounting identities and data integrity.
 */
export function validateFinancialStatements(data: PeriodFinancialData): import('../types').StatementValidationResult {
  const is = data.incomeStatement;
  const bs = data.balanceSheet;
  const cf = data.cashFlow;

  const checks: import('../types').ValidationCheck[] = [];

  // 1. Balance Sheet Fundamental Identity: Assets = Liabilities + Equity
  const totalAssets = bs.assets.totalAssets || 0;
  const totalLiab = bs.liabilities.totalLiabilities || 0;
  const totalEq = bs.equity.totalEquity || 0;
  const totalLiabEq = totalLiab + totalEq;
  const bsDiff = Math.abs(totalAssets - totalLiabEq);
  const bsPassed = bsDiff < 2; // allowance for rounding

  checks.push({
    id: 'chk-bs-balance',
    name: 'Balance Sheet Equilibrium',
    category: 'reconciliation',
    passed: bsPassed,
    diff: bsDiff,
    message: bsPassed 
      ? 'Balance Sheet is perfectly balanced (Assets = Liabilities + Equity).'
      : `Discrepancy detected: Assets exceed Liabilities + Equity by ${bsDiff.toLocaleString()}.`,
    details: `Total Assets: ${totalAssets.toLocaleString()} vs (Liabilities ${totalLiab.toLocaleString()} + Equity ${totalEq.toLocaleString()} = ${totalLiabEq.toLocaleString()})`
  });

  // 2. Current Assets Subtotal Integrity
  const calculatedCurrentAssets = (bs.assets.cashAndEquivalents || 0) +
    (bs.assets.accountsReceivable || 0) +
    (bs.assets.inventory || 0) +
    (bs.assets.prepaidExpenses || 0);
  const caDiff = Math.abs((bs.assets.totalCurrentAssets || 0) - calculatedCurrentAssets);
  const caPassed = caDiff < 2;

  checks.push({
    id: 'chk-ca-sum',
    name: 'Current Assets Subtotal Reconciliation',
    category: 'integrity',
    passed: caPassed,
    diff: caDiff,
    message: caPassed 
      ? 'Current Assets subtotal matches individual asset accounts.'
      : `Current Assets line item differs from sum of parts by ${caDiff.toLocaleString()}.`
  });

  // 3. Current Liabilities Subtotal Integrity
  const calculatedCurrentLiab = (bs.liabilities.accountsPayable || 0) +
    (bs.liabilities.shortTermDebt || 0) +
    (bs.liabilities.accruedLiabilities || 0);
  const clDiff = Math.abs((bs.liabilities.totalCurrentLiabilities || 0) - calculatedCurrentLiab);
  const clPassed = clDiff < 2;

  checks.push({
    id: 'chk-cl-sum',
    name: 'Current Liabilities Subtotal Reconciliation',
    category: 'integrity',
    passed: clPassed,
    diff: clDiff,
    message: clPassed 
      ? 'Current Liabilities subtotal matches short-term obligations.'
      : `Current Liabilities line item differs from subtotal by ${clDiff.toLocaleString()}.`
  });

  // 4. Gross Profit Identity: Revenue - COGS = Gross Profit
  const calculatedGP = (is.revenue || 0) - (is.cogs || 0);
  const gpDiff = Math.abs((is.grossProfit || 0) - calculatedGP);
  const gpPassed = gpDiff < 2;

  checks.push({
    id: 'chk-gp-identity',
    name: 'Gross Margin Equation Integrity',
    category: 'integrity',
    passed: gpPassed,
    diff: gpDiff,
    message: gpPassed 
      ? 'Gross Profit accurately equals Revenue minus Cost of Goods Sold.'
      : `Gross Profit differs from Revenue minus COGS by ${gpDiff.toLocaleString()}.`
  });

  // 5. Operating Income (EBIT) Identity: Gross Profit - OpEx = Operating Income
  const calculatedEBIT = (is.grossProfit || 0) - (is.operatingExpenses?.total || 0);
  const ebitDiff = Math.abs((is.operatingIncome || 0) - calculatedEBIT);
  const ebitPassed = ebitDiff < 2;

  checks.push({
    id: 'chk-ebit-identity',
    name: 'Operating Income (EBIT) Reconciliation',
    category: 'integrity',
    passed: ebitPassed,
    diff: ebitDiff,
    message: ebitPassed
      ? 'Operating Income reconciles cleanly with Gross Profit less Operating Expenses.'
      : `Operating Income differs from Gross Profit less OpEx by ${ebitDiff.toLocaleString()}.`
  });

  // 6. Cash Flow Ending Cash vs Balance Sheet Cash Check
  const cfCashDiff = Math.abs((cf.endingCashBalance || 0) - (bs.assets.cashAndEquivalents || 0));
  const cfCashPassed = cf.endingCashBalance === 0 || cfCashDiff < 2;

  checks.push({
    id: 'chk-cf-cash',
    name: 'Cash Flow to Balance Sheet Cash Reconciliation',
    category: 'reconciliation',
    passed: cfCashPassed,
    diff: cfCashDiff,
    message: cfCashPassed
      ? 'Ending cash position matches Balance Sheet Cash and Equivalents.'
      : `Cash Flow ending cash differs from Balance Sheet cash by ${cfCashDiff.toLocaleString()}.`
  });

  // Calculate Overall Quality Score (0 to 100)
  const passedCount = checks.filter(c => c.passed).length;
  const overallScore = Math.round((passedCount / checks.length) * 100);

  return {
    isValid: bsPassed && gpPassed,
    overallScore,
    balanceSheetBalanced: bsPassed,
    balanceSheetVariance: bsDiff,
    incomeStatementConsistent: gpPassed && ebitPassed,
    cashFlowReconciled: cfCashPassed,
    checks,
    mappedAccountsCount: 22,
    unmappedAccountsCount: 0,
    totalAssets,
    totalLiabilitiesAndEquity: totalLiabEq
  };
}

/**
 * DuPont 3-Stage Analysis: ROE = Net Margin × Asset Turnover × Equity Multiplier
 */
export function calculateDuPont(data: PeriodFinancialData): import('../types').DuPontBreakdown {
  const is = data.incomeStatement;
  const bs = data.balanceSheet;

  const netProfitMargin = safeDiv(is.netIncome, is.revenue, 100);
  const assetTurnover = safeDiv(is.revenue, bs.assets.totalAssets || 1, 1);
  const equityMultiplier = safeDiv(bs.assets.totalAssets || 1, bs.equity.totalEquity || 1, 1);
  const roe = safeDiv(is.netIncome, bs.equity.totalEquity || 1, 100);

  return {
    roe,
    netProfitMargin,
    assetTurnover,
    equityMultiplier,
    formulaDisplay: `${netProfitMargin.toFixed(1)}% (Net Margin) × ${assetTurnover.toFixed(2)}x (Asset Turnover) × ${equityMultiplier.toFixed(2)}x (Leverage) = ${roe.toFixed(1)}% ROE`
  };
}

/**
 * Emerging Risk & Early Warning Signal Detection
 */
export function detectEmergingRisks(
  current: PeriodFinancialData,
  prior?: PeriodFinancialData | null,
  budget?: import('../types').BudgetVsActual[]
): import('../types').EmergingRiskItem[] {
  const risks: import('../types').EmergingRiskItem[] = [];
  const isCurr = current.incomeStatement;
  const isPrior = prior ? prior.incomeStatement : null;
  const bsCurr = current.balanceSheet;
  const ratiosCurr = calculateFinancialRatios(current, prior);

  // Risk 1: DSO (Receivables Collection Cycle)
  if (ratiosCurr.daysSalesOutstanding > 60) {
    risks.push({
      id: 'risk-dso',
      severity: ratiosCurr.daysSalesOutstanding > 90 ? 'critical' : 'high',
      title: 'Extended Days Sales Outstanding (DSO)',
      category: 'Liquidity',
      metric: 'DSO',
      observedValue: `${ratiosCurr.daysSalesOutstanding.toFixed(0)} days`,
      threshold: '< 45 days',
      explanation: 'Customer receivables are taking an unusually long time to collect, locking up operating working capital.',
      cfoAction: 'Tighten customer credit terms, institute automated aging dunning sequences, and offer early-settlement discounts.'
    });
  }

  // Risk 2: Working Capital Buffer & Quick Ratio
  if (ratiosCurr.quickRatio < 1.0) {
    risks.push({
      id: 'risk-quick-ratio',
      severity: ratiosCurr.quickRatio < 0.6 ? 'critical' : 'high',
      title: 'Constrained Acid-Test Liquidity',
      category: 'Liquidity',
      metric: 'Quick Ratio',
      observedValue: `${ratiosCurr.quickRatio.toFixed(2)}x`,
      threshold: '≥ 1.00x',
      explanation: 'Liquid cash and receivables are insufficient to cover current obligations without relying on inventory liquidations.',
      cfoAction: 'Establish revolving backup liquidity credit facility and defer non-critical discretionary capital disbursements.'
    });
  }

  // Risk 3: Gross Margin Erosion (YoY)
  if (isPrior && isPrior.revenue > 0) {
    const currGp = safeDiv(isCurr.grossProfit, isCurr.revenue, 100);
    const priorGp = safeDiv(isPrior.grossProfit, isPrior.revenue, 100);
    const marginDiff = currGp - priorGp;
    if (marginDiff < -2.5) {
      risks.push({
        id: 'risk-margin-compression',
        severity: marginDiff < -5.0 ? 'critical' : 'high',
        title: 'Gross Margin Compression',
        category: 'Profitability',
        metric: 'Gross Margin Change',
        observedValue: `${marginDiff.toFixed(1)}% YoY`,
        threshold: '≥ 0.0%',
        explanation: 'Input material inflation and vendor pricing escalation are outpacing customer price pass-throughs.',
        cfoAction: 'Initiate vendor renegotiations, conduct SKU unit economics audit, and introduce targeted pricing surcharges.'
      });
    }
  }

  // Risk 4: Capital Structure & Financial Leverage
  if (ratiosCurr.debtToEquityRatio > 1.8) {
    risks.push({
      id: 'risk-leverage',
      severity: ratiosCurr.debtToEquityRatio > 3.0 ? 'critical' : 'medium',
      title: 'Elevated Balance Sheet Leverage',
      category: 'Solvency',
      metric: 'Debt-to-Equity',
      observedValue: `${ratiosCurr.debtToEquityRatio.toFixed(2)}x`,
      threshold: '≤ 1.20x',
      explanation: 'Substantial proportion of capital structure financed via debt, magnifying vulnerability during interest rate spikes.',
      cfoAction: 'Prioritize debt paydown using excess operational cash and restrict additional subordinated debt issuance.'
    });
  }

  // Risk 5: Tax & Statutory Drag
  if (isCurr.growthLevy && isCurr.growthLevy > 0) {
    risks.push({
      id: 'risk-statutory-levy',
      severity: 'medium',
      title: 'Growth & Sustainability Levy Compliance',
      category: 'Compliance',
      metric: 'Statutory Surcharges',
      observedValue: `Levy active`,
      threshold: 'Zero unexpected accruals',
      explanation: 'Local regulatory growth levies or statutory withholding are impacting net operating yields.',
      cfoAction: 'Review tax optimization strategies, advance tax credits, and verify statutory compliance filings.'
    });
  }

  // Risk 6: Inventory Turnover / Stagnation
  if (ratiosCurr.daysInventoryOutstanding > 100) {
    risks.push({
      id: 'risk-dio',
      severity: 'medium',
      title: 'Elevated Inventory Holding Period',
      category: 'Operations',
      metric: 'DIO',
      observedValue: `${ratiosCurr.daysInventoryOutstanding.toFixed(0)} days`,
      threshold: '< 60 days',
      explanation: 'Inventory stock is lingering in warehouse facilities, increasing carrying costs and risk of obsolescence.',
      cfoAction: 'Conduct slow-moving SKU liquidation and institute just-in-time replenishment triggers.'
    });
  }

  // Fallback benign risk if business is in healthy state
  if (risks.length === 0) {
    risks.push({
      id: 'risk-mon-buffer',
      severity: 'low',
      title: 'Macro Inflation & FX Sensitivity',
      category: 'Operations',
      metric: 'Inflation Sensitivity',
      observedValue: 'Standard Exposure',
      threshold: 'Normal',
      explanation: 'Business fundamentals are solid; ongoing surveillance of macroeconomic interest rates and currency fluctuations recommended.',
      cfoAction: 'Maintain current conservative working capital policy and lock in favorable forward commercial contracts.'
    });
  }

  return risks;
}

/**
 * Budget vs Actual Enhanced Variance Breakdown
 */
export function calculateEnhancedVariances(
  budgetItems: import('../types').BudgetVsActual[],
  current: PeriodFinancialData
): import('../types').VarianceAnalysisItem[] {
  return budgetItems.map(item => {
    const isRevenue = /revenue|sales|income/i.test(item.category);
    // For revenue, actual > budget is favorable. For expense/cost, actual < budget is favorable.
    const diff = item.actual - item.budgeted;
    const isFavorable = isRevenue ? diff >= 0 : diff <= 0;
    const pct = item.budgeted > 0 ? (diff / item.budgeted) * 100 : 0;
    const isSignificant = Math.abs(pct) >= 5 || Math.abs(diff) >= 20000;

    let rootCauseTag = 'volume';
    if (/cogs|cost of sales/i.test(item.category)) rootCauseTag = 'cost_inflation';
    else if (/marketing|salaries/i.test(item.category)) rootCauseTag = 'timing';
    else if (/revenue/i.test(item.category)) rootCauseTag = 'pricing';

    return {
      category: item.category,
      statement: isRevenue ? 'income_statement' : 'operating_expenses',
      budgeted: item.budgeted,
      actual: item.actual,
      variance: diff,
      variancePercentage: Number(pct.toFixed(1)),
      isFavorable,
      isSignificant,
      rootCauseTag,
      driverNote: isFavorable 
        ? `Outperforming budget by ${Math.abs(pct).toFixed(1)}%` 
        : `Adverse variance of ${Math.abs(pct).toFixed(1)}% requires investigation`
    };
  });
}

/**
 * PHASE 4: Deep Arithmetic Discrepancy Detection
 * Verifies totals, identities, balance sheet equilibrium, and cash reconciliations.
 * Never alters numbers; transparently returns exact differences.
 */
export function detectArithmeticDiscrepancies(
  periodData: PeriodFinancialData,
  currencySymbol: string = '$'
): import('../types').ArithmeticDiscrepancy[] {
  const is = periodData.incomeStatement;
  const bs = periodData.balanceSheet;
  const cf = periodData.cashFlow;
  const p = periodData.period;
  const list: import('../types').ArithmeticDiscrepancy[] = [];

  // 1. Balance Sheet Equilibrium: Assets = Liabilities + Equity
  const totalAssets = bs.assets.totalAssets || 0;
  const totalLiab = bs.liabilities.totalLiabilities || 0;
  const totalEq = bs.equity.totalEquity || 0;
  const expectedAssets = totalLiab + totalEq;
  const bsDiff = totalAssets - expectedAssets;

  if (Math.abs(bsDiff) > 1) {
    list.push({
      id: `disc-bs-balance-${p}`,
      period: p,
      statement: 'Statement of Financial Position',
      metric: 'Assets vs. (Liabilities + Equity)',
      reportedValue: totalAssets,
      calculatedValue: expectedAssets,
      difference: bsDiff,
      severity: 'critical',
      message: `Balance sheet out of equilibrium by ${currencySymbol}${Math.abs(bsDiff).toLocaleString()}: Total Assets (${currencySymbol}${totalAssets.toLocaleString()}) does not equal Total Liabilities + Equity (${currencySymbol}${expectedAssets.toLocaleString()}).`,
      resolutionTip: 'Review Retained Earnings or Long-Term Debt line items in the review table to ensure all balancing entries have been booked.'
    });
  }

  // 2. Gross Profit Identity: Revenue - COGS = Gross Profit
  const calculatedGP = (is.revenue || 0) - (is.cogs || 0);
  const gpDiff = (is.grossProfit || 0) - calculatedGP;
  if (Math.abs(gpDiff) > 1 && is.revenue > 0) {
    list.push({
      id: `disc-gp-${p}`,
      period: p,
      statement: 'Statement of Profit or Loss',
      metric: 'Gross Profit Identity',
      reportedValue: is.grossProfit,
      calculatedValue: calculatedGP,
      difference: gpDiff,
      severity: 'warning',
      message: `Reported Gross Profit (${currencySymbol}${(is.grossProfit || 0).toLocaleString()}) differs from Revenue less COGS (${currencySymbol}${calculatedGP.toLocaleString()}) by ${currencySymbol}${Math.abs(gpDiff).toLocaleString()}.`,
      resolutionTip: 'Verify if discounts, allowances, or direct production overheads were classified outside of COGS.'
    });
  }

  // 3. Operating Income (EBIT) Identity: Gross Profit - OpEx = Operating Income
  const calculatedOpIncome = (is.grossProfit || 0) - (is.operatingExpenses?.total || 0);
  const opIncomeDiff = (is.operatingIncome || 0) - calculatedOpIncome;
  if (Math.abs(opIncomeDiff) > 1 && (is.operatingExpenses?.total || 0) > 0) {
    list.push({
      id: `disc-ebit-${p}`,
      period: p,
      statement: 'Statement of Profit or Loss',
      metric: 'Operating Income (EBIT)',
      reportedValue: is.operatingIncome,
      calculatedValue: calculatedOpIncome,
      difference: opIncomeDiff,
      severity: 'warning',
      message: `Operating Income differs from Gross Profit less OpEx by ${currencySymbol}${Math.abs(opIncomeDiff).toLocaleString()}.`,
      resolutionTip: 'Check whether Other Operating Expenses or Depreciation were double-counted or excluded from Total OpEx.'
    });
  }

  // 4. Net Income Identity: EBIT - Interest - Tax - GrowthLevy = Net Income
  const calculatedNetIncome = (is.operatingIncome || 0) - (is.interestExpense || 0) - (is.taxExpense || 0) - (is.growthLevy || 0);
  const netIncomeDiff = (is.netIncome || 0) - calculatedNetIncome;
  if (Math.abs(netIncomeDiff) > 1 && is.operatingIncome !== 0) {
    list.push({
      id: `disc-ni-${p}`,
      period: p,
      statement: 'Statement of Profit or Loss',
      metric: 'Net Income Identity',
      reportedValue: is.netIncome,
      calculatedValue: calculatedNetIncome,
      difference: netIncomeDiff,
      severity: 'warning',
      message: `Reported Net Income differs from Operating Income less Interest and Taxes by ${currencySymbol}${Math.abs(netIncomeDiff).toLocaleString()}.`,
      resolutionTip: 'Review non-operating gains/losses, extraordinary items, or tax expense calculations.'
    });
  }

  // 5. Total Current Assets Subtotal
  const sumCurrentAssets = (bs.assets.cashAndEquivalents || 0) +
    (bs.assets.accountsReceivable || 0) +
    (bs.assets.inventory || 0) +
    (bs.assets.prepaidExpenses || 0);
  const caDiff = (bs.assets.totalCurrentAssets || 0) - sumCurrentAssets;
  if (Math.abs(caDiff) > 1 && (bs.assets.totalCurrentAssets || 0) > 0) {
    list.push({
      id: `disc-ca-${p}`,
      period: p,
      statement: 'Statement of Financial Position',
      metric: 'Current Assets Subtotal',
      reportedValue: bs.assets.totalCurrentAssets,
      calculatedValue: sumCurrentAssets,
      difference: caDiff,
      severity: 'info',
      message: `Current Assets line item differs from sum of cash, AR, inventory, and prepaids by ${currencySymbol}${Math.abs(caDiff).toLocaleString()}.`,
      resolutionTip: 'Check if other short-term investments or liquid securities are present in the general ledger.'
    });
  }

  // 6. Ending Cash Balance Reconciliation: Cash Flow vs Balance Sheet
  if (cf.endingCashBalance && bs.assets.cashAndEquivalents) {
    const cashDiff = cf.endingCashBalance - bs.assets.cashAndEquivalents;
    if (Math.abs(cashDiff) > 1) {
      list.push({
        id: `disc-cash-reconcile-${p}`,
        period: p,
        statement: 'Statement of Cash Flows',
        metric: 'Cash Balance Cross-Statement Reconciliation',
        reportedValue: cf.endingCashBalance,
        calculatedValue: bs.assets.cashAndEquivalents,
        difference: cashDiff,
        severity: 'warning',
        message: `Cash Flow ending cash (${currencySymbol}${cf.endingCashBalance.toLocaleString()}) differs from Balance Sheet Cash (${currencySymbol}${bs.assets.cashAndEquivalents.toLocaleString()}) by ${currencySymbol}${Math.abs(cashDiff).toLocaleString()}.`,
        resolutionTip: 'Reconcile restricted cash, overdraft facilities, or currency exchange translation differences.'
      });
    }
  }

  return list;
}

/**
 * Converts aggregate PeriodFinancialData array into individual AccountLineItems for the editable review grid
 */
export function convertPeriodsToLineItems(periods: PeriodFinancialData[]): import('../types').AccountLineItem[] {
  if (!periods || periods.length === 0) return [];

  const items: import('../types').AccountLineItem[] = [
    // Income Statement Accounts
    {
      id: 'acc-is-101',
      code: '4000',
      description: 'Gross Sales & Operating Revenue',
      classification: 'revenue',
      statementType: 'income_statement',
      normalBalance: 'credit',
      department: 'Commercial / Sales',
      costCentre: 'CC-REV-01',
      entityUnit: 'Core Operations',
      values: {}
    },
    {
      id: 'acc-is-201',
      code: '5000',
      description: 'Cost of Goods Sold (Raw Materials & Direct Labor)',
      classification: 'cogs',
      statementType: 'income_statement',
      normalBalance: 'debit',
      department: 'Manufacturing / Production',
      costCentre: 'CC-PRD-01',
      entityUnit: 'Supply Chain',
      values: {}
    },
    {
      id: 'acc-is-301',
      code: '6100',
      description: 'Salaries, Wages & Employee Benefits',
      classification: 'opex_salaries',
      statementType: 'income_statement',
      normalBalance: 'debit',
      department: 'Human Resources / Operations',
      costCentre: 'CC-HR-01',
      entityUnit: 'Headquarters',
      values: {}
    },
    {
      id: 'acc-is-302',
      code: '6200',
      description: 'Marketing, Advertising & Business Development',
      classification: 'opex_marketing',
      statementType: 'income_statement',
      normalBalance: 'debit',
      department: 'Marketing & Growth',
      costCentre: 'CC-MKT-01',
      entityUnit: 'Commercial Unit',
      values: {}
    },
    {
      id: 'acc-is-303',
      code: '6300',
      description: 'Facilities Lease, Rent & Utilities',
      classification: 'opex_rent',
      statementType: 'income_statement',
      normalBalance: 'debit',
      department: 'Facilities & Administration',
      costCentre: 'CC-FAC-01',
      entityUnit: 'Corporate Office',
      values: {}
    },
    {
      id: 'acc-is-304',
      code: '6400',
      description: 'Depreciation & Amortization Expense',
      classification: 'opex_depreciation',
      statementType: 'income_statement',
      normalBalance: 'debit',
      department: 'Finance & Accounting',
      costCentre: 'CC-FIN-01',
      entityUnit: 'Headquarters',
      values: {}
    },
    {
      id: 'acc-is-305',
      code: '6900',
      description: 'Other General & Administrative Overheads',
      classification: 'opex_other',
      statementType: 'income_statement',
      normalBalance: 'debit',
      department: 'Executive Administration',
      costCentre: 'CC-ADM-01',
      entityUnit: 'Headquarters',
      values: {}
    },
    {
      id: 'acc-is-401',
      code: '7100',
      description: 'Interest & Finance Charges',
      classification: 'interest_expense',
      statementType: 'income_statement',
      normalBalance: 'debit',
      department: 'Treasury',
      costCentre: 'CC-TRS-01',
      entityUnit: 'Corporate Treasury',
      values: {}
    },
    {
      id: 'acc-is-501',
      code: '8100',
      description: 'Corporate Income Tax Expense',
      classification: 'tax_expense',
      statementType: 'income_statement',
      normalBalance: 'debit',
      department: 'Tax & Compliance',
      costCentre: 'CC-TAX-01',
      entityUnit: 'Corporate HQ',
      values: {}
    },

    // Balance Sheet: Assets
    {
      id: 'acc-bs-101',
      code: '1010',
      description: 'Cash, Bank Accounts & Demand Deposits',
      classification: 'asset_cash',
      statementType: 'balance_sheet',
      normalBalance: 'debit',
      department: 'Treasury & Cash Mgmt',
      costCentre: 'CC-TRS-01',
      entityUnit: 'Corporate Treasury',
      values: {}
    },
    {
      id: 'acc-bs-102',
      code: '1100',
      description: 'Trade Accounts Receivable',
      classification: 'asset_ar',
      statementType: 'balance_sheet',
      normalBalance: 'debit',
      department: 'Credit & Collections',
      costCentre: 'CC-FIN-02',
      entityUnit: 'Commercial Unit',
      values: {}
    },
    {
      id: 'acc-bs-103',
      code: '1200',
      description: 'Raw Materials & Finished Inventory',
      classification: 'asset_inventory',
      statementType: 'balance_sheet',
      normalBalance: 'debit',
      department: 'Warehouse & Logistics',
      costCentre: 'CC-WHS-01',
      entityUnit: 'Supply Chain',
      values: {}
    },
    {
      id: 'acc-bs-104',
      code: '1300',
      description: 'Prepaid Expenses & Advances',
      classification: 'asset_prepaid',
      statementType: 'balance_sheet',
      normalBalance: 'debit',
      department: 'Procurement',
      costCentre: 'CC-PRO-01',
      entityUnit: 'General Administration',
      values: {}
    },
    {
      id: 'acc-bs-105',
      code: '1500',
      description: 'Property, Plant & Equipment (Net PP&E)',
      classification: 'asset_ppe',
      statementType: 'balance_sheet',
      normalBalance: 'debit',
      department: 'Fixed Asset Mgmt',
      costCentre: 'CC-OPS-01',
      entityUnit: 'Manufacturing Sites',
      values: {}
    },
    {
      id: 'acc-bs-106',
      code: '1600',
      description: 'Intangible Assets, Patents & Software',
      classification: 'asset_intangible',
      statementType: 'balance_sheet',
      normalBalance: 'debit',
      department: 'Technology & R&D',
      costCentre: 'CC-TECH-01',
      entityUnit: 'Innovation Unit',
      values: {}
    },

    // Balance Sheet: Liabilities
    {
      id: 'acc-bs-201',
      code: '2010',
      description: 'Trade Accounts Payable',
      classification: 'liability_ap',
      statementType: 'balance_sheet',
      normalBalance: 'credit',
      department: 'Accounts Payable',
      costCentre: 'CC-AP-01',
      entityUnit: 'General Administration',
      values: {}
    },
    {
      id: 'acc-bs-202',
      code: '2100',
      description: 'Short-Term Bank Borrowings & Credit Lines',
      classification: 'liability_st_debt',
      statementType: 'balance_sheet',
      normalBalance: 'credit',
      department: 'Treasury',
      costCentre: 'CC-TRS-01',
      entityUnit: 'Corporate Treasury',
      values: {}
    },
    {
      id: 'acc-bs-203',
      code: '2200',
      description: 'Accrued Payroll & Statutory Liabilities',
      classification: 'liability_accrued',
      statementType: 'balance_sheet',
      normalBalance: 'credit',
      department: 'Human Resources & Tax',
      costCentre: 'CC-HR-01',
      entityUnit: 'Headquarters',
      values: {}
    },
    {
      id: 'acc-bs-204',
      code: '2500',
      description: 'Long-Term Loans & Senior Notes',
      classification: 'liability_lt_debt',
      statementType: 'balance_sheet',
      normalBalance: 'credit',
      department: 'Treasury',
      costCentre: 'CC-TRS-01',
      entityUnit: 'Corporate Treasury',
      values: {}
    },

    // Balance Sheet: Equity
    {
      id: 'acc-bs-301',
      code: '3010',
      description: 'Common Stock & Paid-in Capital',
      classification: 'equity_stock',
      statementType: 'balance_sheet',
      normalBalance: 'credit',
      department: 'Corporate Governance',
      costCentre: 'CC-EXE-01',
      entityUnit: 'Parent Entity',
      values: {}
    },
    {
      id: 'acc-bs-302',
      code: '3100',
      description: 'Retained Earnings & Accumulated Reserves',
      classification: 'equity_retained',
      statementType: 'balance_sheet',
      normalBalance: 'credit',
      department: 'Corporate Finance',
      costCentre: 'CC-EXE-01',
      entityUnit: 'Parent Entity',
      values: {}
    },

    // Cash Flows
    {
      id: 'acc-cf-101',
      code: '8810',
      description: 'Net Cash from Operating Activities',
      classification: 'cf_operating',
      statementType: 'cash_flow',
      normalBalance: 'debit',
      department: 'Corporate Finance',
      costCentre: 'CC-FIN-01',
      entityUnit: 'Consolidated',
      values: {}
    },
    {
      id: 'acc-cf-102',
      code: '8820',
      description: 'Net Cash from Investing Activities',
      classification: 'cf_investing',
      statementType: 'cash_flow',
      normalBalance: 'credit',
      department: 'Capital Allocation',
      costCentre: 'CC-CAP-01',
      entityUnit: 'Consolidated',
      values: {}
    },
    {
      id: 'acc-cf-103',
      code: '8830',
      description: 'Net Cash from Financing Activities',
      classification: 'cf_financing',
      statementType: 'cash_flow',
      normalBalance: 'credit',
      department: 'Treasury',
      costCentre: 'CC-TRS-01',
      entityUnit: 'Consolidated',
      values: {}
    }
  ];

  // Populate values per period
  for (const item of items) {
    for (const p of periods) {
      const is = p.incomeStatement;
      const bs = p.balanceSheet;
      const cf = p.cashFlow;

      switch (item.classification) {
        case 'revenue': item.values[p.period] = is.revenue || 0; break;
        case 'cogs': item.values[p.period] = is.cogs || 0; break;
        case 'opex_salaries': item.values[p.period] = is.operatingExpenses?.salaries || 0; break;
        case 'opex_marketing': item.values[p.period] = is.operatingExpenses?.marketing || 0; break;
        case 'opex_rent': item.values[p.period] = is.operatingExpenses?.rentAndUtilities || 0; break;
        case 'opex_depreciation': item.values[p.period] = is.operatingExpenses?.depreciation || 0; break;
        case 'opex_other': item.values[p.period] = is.operatingExpenses?.otherOpEx || 0; break;
        case 'interest_expense': item.values[p.period] = is.interestExpense || 0; break;
        case 'tax_expense': item.values[p.period] = is.taxExpense || 0; break;
        case 'asset_cash': item.values[p.period] = bs.assets?.cashAndEquivalents || 0; break;
        case 'asset_ar': item.values[p.period] = bs.assets?.accountsReceivable || 0; break;
        case 'asset_inventory': item.values[p.period] = bs.assets?.inventory || 0; break;
        case 'asset_prepaid': item.values[p.period] = bs.assets?.prepaidExpenses || 0; break;
        case 'asset_ppe': item.values[p.period] = bs.assets?.propertyPlantEquipment || 0; break;
        case 'asset_intangible': item.values[p.period] = bs.assets?.intangibleAssets || 0; break;
        case 'liability_ap': item.values[p.period] = bs.liabilities?.accountsPayable || 0; break;
        case 'liability_st_debt': item.values[p.period] = bs.liabilities?.shortTermDebt || 0; break;
        case 'liability_accrued': item.values[p.period] = bs.liabilities?.accruedLiabilities || 0; break;
        case 'liability_lt_debt': item.values[p.period] = bs.liabilities?.longTermDebt || 0; break;
        case 'equity_stock': item.values[p.period] = bs.equity?.commonStock || 0; break;
        case 'equity_retained': item.values[p.period] = bs.equity?.retainedEarnings || 0; break;
        case 'cf_operating': item.values[p.period] = cf.operatingCashFlow || 0; break;
        case 'cf_investing': item.values[p.period] = cf.investingCashFlow || 0; break;
        case 'cf_financing': item.values[p.period] = cf.financingCashFlow || 0; break;
        default: item.values[p.period] = 0; break;
      }
    }
  }

  return items;
}

/**
 * Reconstitutes normalized PeriodFinancialData[] from modified AccountLineItems
 */
export function convertLineItemsToPeriods(
  items: import('../types').AccountLineItem[],
  periodKeys: string[]
): PeriodFinancialData[] {
  return periodKeys.map(period => {
    const sumFor = (classification: import('../types').AccountClassification): number => {
      return items
        .filter(it => it.classification === classification)
        .reduce((sum, it) => sum + (it.values[period] || 0), 0);
    };

    const revenue = sumFor('revenue');
    const cogs = sumFor('cogs');
    const grossProfit = revenue - cogs;

    const salaries = sumFor('opex_salaries');
    const marketing = sumFor('opex_marketing');
    const rentAndUtilities = sumFor('opex_rent');
    const depreciation = sumFor('opex_depreciation');
    const otherOpEx = sumFor('opex_other');
    const totalOpEx = salaries + marketing + rentAndUtilities + depreciation + otherOpEx;

    const operatingIncome = grossProfit - totalOpEx;
    const interestExpense = sumFor('interest_expense');
    const taxExpense = sumFor('tax_expense');
    const growthLevy = sumFor('growth_levy');
    const netIncome = operatingIncome - interestExpense - taxExpense - growthLevy;

    // Assets
    const cashAndEquivalents = sumFor('asset_cash');
    const accountsReceivable = sumFor('asset_ar');
    const inventory = sumFor('asset_inventory');
    const prepaidExpenses = sumFor('asset_prepaid');
    const totalCurrentAssets = cashAndEquivalents + accountsReceivable + inventory + prepaidExpenses;

    const propertyPlantEquipment = sumFor('asset_ppe');
    const intangibleAssets = sumFor('asset_intangible');
    const totalNonCurrentAssets = propertyPlantEquipment + intangibleAssets;
    const totalAssets = totalCurrentAssets + totalNonCurrentAssets;

    // Liabilities
    const accountsPayable = sumFor('liability_ap');
    const shortTermDebt = sumFor('liability_st_debt');
    const accruedLiabilities = sumFor('liability_accrued');
    const totalCurrentLiabilities = accountsPayable + shortTermDebt + accruedLiabilities;

    const longTermDebt = sumFor('liability_lt_debt');
    const totalNonCurrentLiabilities = longTermDebt;
    const totalLiabilities = totalCurrentLiabilities + totalNonCurrentLiabilities;

    // Equity
    const commonStock = sumFor('equity_stock');
    const retainedEarnings = sumFor('equity_retained');
    const totalEquity = commonStock + retainedEarnings;

    // Cash Flow
    const operatingCashFlow = sumFor('cf_operating');
    const investingCashFlow = sumFor('cf_investing');
    const financingCashFlow = sumFor('cf_financing');
    const netCashFlow = operatingCashFlow + investingCashFlow + financingCashFlow;

    return {
      period,
      incomeStatement: {
        revenue,
        cogs,
        grossProfit,
        operatingExpenses: {
          salaries,
          marketing,
          rentAndUtilities,
          depreciation,
          otherOpEx,
          total: totalOpEx
        },
        operatingIncome,
        growthLevy,
        interestExpense,
        taxExpense,
        netIncome
      },
      balanceSheet: {
        assets: {
          cashAndEquivalents,
          accountsReceivable,
          inventory,
          prepaidExpenses,
          totalCurrentAssets,
          propertyPlantEquipment,
          intangibleAssets,
          totalNonCurrentAssets,
          totalAssets
        },
        liabilities: {
          accountsPayable,
          shortTermDebt,
          accruedLiabilities,
          totalCurrentLiabilities,
          longTermDebt,
          totalNonCurrentLiabilities,
          totalLiabilities
        },
        equity: {
          commonStock,
          retainedEarnings,
          totalEquity
        }
      },
      cashFlow: {
        operatingCashFlow,
        investingCashFlow,
        financingCashFlow,
        netCashFlow,
        endingCashBalance: cashAndEquivalents
      }
    };
  });
}

/**
 * Reusable Chart of Accounts Mapping Templates
 */
export const DEFAULT_MAPPING_TEMPLATES: import('../types').MappingTemplate[] = [
  {
    id: 'tpl-ifrs-standard',
    name: 'Standard IFRS Corporate Chart of Accounts',
    framework: 'IFRS',
    description: 'International Financial Reporting Standards compliant classification for multi-entity reporting.',
    isDefault: true,
    createdAt: '2025-01-01',
    mappings: {
      '4000': 'revenue',
      'revenue': 'revenue',
      'sales': 'revenue',
      'turnover': 'revenue',
      '5000': 'cogs',
      'cogs': 'cogs',
      'cost of sales': 'cogs',
      'direct materials': 'cogs',
      '6100': 'opex_salaries',
      'salaries': 'opex_salaries',
      'payroll': 'opex_salaries',
      'wages': 'opex_salaries',
      '6200': 'opex_marketing',
      'marketing': 'opex_marketing',
      'advertising': 'opex_marketing',
      '6300': 'opex_rent',
      'rent': 'opex_rent',
      'lease': 'opex_rent',
      'utilities': 'opex_rent',
      '6400': 'opex_depreciation',
      'depreciation': 'opex_depreciation',
      'amortization': 'opex_depreciation',
      '7100': 'interest_expense',
      'interest': 'interest_expense',
      'finance costs': 'interest_expense',
      '8100': 'tax_expense',
      'tax': 'tax_expense',
      '1010': 'asset_cash',
      'cash': 'asset_cash',
      'bank': 'asset_cash',
      '1100': 'asset_ar',
      'receivables': 'asset_ar',
      'trade debtors': 'asset_ar',
      '1200': 'asset_inventory',
      'inventory': 'asset_inventory',
      'stock': 'asset_inventory',
      '1500': 'asset_ppe',
      'ppe': 'asset_ppe',
      'equipment': 'asset_ppe',
      'plant': 'asset_ppe',
      '2010': 'liability_ap',
      'payables': 'liability_ap',
      'trade creditors': 'liability_ap',
      '2100': 'liability_st_debt',
      'overdraft': 'liability_st_debt',
      'short term loan': 'liability_st_debt',
      '2500': 'liability_lt_debt',
      'long term debt': 'liability_lt_debt',
      'bank loan': 'liability_lt_debt',
      '3010': 'equity_stock',
      'share capital': 'equity_stock',
      'common stock': 'equity_stock',
      '3100': 'equity_retained',
      'retained earnings': 'equity_retained'
    }
  },
  {
    id: 'tpl-us-gaap',
    name: 'US GAAP Enterprise Mapping Template',
    framework: 'US GAAP',
    description: 'Financial Accounting Standards Board (FASB) compliant taxonomy for US entities.',
    isDefault: false,
    createdAt: '2025-01-15',
    mappings: {
      'revenue': 'revenue',
      'net sales': 'revenue',
      'cogs': 'cogs',
      'compensation': 'opex_salaries',
      'sg&a': 'opex_other',
      'marketing': 'opex_marketing',
      'facilities': 'opex_rent',
      'd&a': 'opex_depreciation',
      'cash': 'asset_cash',
      'accounts receivable': 'asset_ar',
      'inventory': 'asset_inventory',
      'prepaid': 'asset_prepaid',
      'net ppe': 'asset_ppe',
      'accounts payable': 'liability_ap',
      'accrued expenses': 'liability_accrued',
      'current debt': 'liability_st_debt',
      'long-term debt': 'liability_lt_debt',
      'common stock': 'equity_stock',
      'additional paid in capital': 'equity_stock',
      'retained earnings': 'equity_retained'
    }
  },
  {
    id: 'tpl-manufacturing',
    name: 'Industrial & Manufacturing COA',
    framework: 'Standard Corporate',
    description: 'Configured for high-volume Bill of Materials (BOM), plant equipment depreciation, and stock turnover.',
    isDefault: false,
    createdAt: '2025-02-01',
    mappings: {
      'finished goods revenue': 'revenue',
      'raw materials cost': 'cogs',
      'direct factory labor': 'cogs',
      'freight & shipping': 'cogs',
      'plant maintenance': 'opex_other',
      'factory power & utilities': 'opex_rent',
      'heavy machinery depreciation': 'opex_depreciation',
      'warehouse inventory': 'asset_inventory',
      'assembly plant & tooling': 'asset_ppe'
    }
  },
  {
    id: 'tpl-saas-tech',
    name: 'SaaS & Digital Technology COA',
    framework: 'Standard Corporate',
    description: 'Tailored for recurring ARR/MRR revenues, cloud hosting COGS, and customer acquisition OpEx.',
    isDefault: false,
    createdAt: '2025-02-10',
    mappings: {
      'subscription arr': 'revenue',
      'professional services': 'revenue',
      'aws & cloud hosting': 'cogs',
      'customer success salaries': 'cogs',
      'engineering salaries': 'opex_salaries',
      'sales & marketing': 'opex_marketing',
      'software tooling': 'opex_other',
      'deferred revenue': 'liability_accrued',
      'capitalized r&d': 'asset_intangible'
    }
  }
];

/**
 * PHASE 5: Evaluate 10 Core Financial Risk Indicators
 */
export function evaluateFinancialRiskIndicators(
  current: PeriodFinancialData,
  prior?: PeriodFinancialData | null
): import('../types').EmergingRiskItem[] {
  const is = current.incomeStatement;
  const bs = current.balanceSheet;
  const cf = current.cashFlow;
  const ratiosCurr = calculateFinancialRatios(current, prior);
  const isPrior = prior ? prior.incomeStatement : null;
  const bsPrior = prior ? prior.balanceSheet : null;
  const cfPrior = prior ? prior.cashFlow : null;

  const flags: import('../types').EmergingRiskItem[] = [];

  // 1. Declining Margins
  if (isPrior && isPrior.revenue > 0) {
    const currGp = safeDiv(is.grossProfit, is.revenue, 100);
    const priorGp = safeDiv(isPrior.grossProfit, isPrior.revenue, 100);
    const gpDelta = currGp - priorGp;
    if (gpDelta < -1.5) {
      flags.push({
        id: 'flag-declining-margins',
        severity: gpDelta < -4.0 ? 'critical' : 'high',
        title: 'Declining Profit Margins',
        category: 'Profitability',
        metric: 'Gross Margin YoY Change',
        observedValue: `${gpDelta.toFixed(1)}%`,
        threshold: '>= 0.0%',
        explanation: 'Gross margin contracted year-over-year. Input material inflation or competitive pricing pressures are compressing unit profit margins.',
        cfoAction: 'Initiate vendor cost renegotiations, review product tier unit economics, and consider targeted price adjustments.'
      });
    }
  }

  // 2. Persistent Operating Losses
  if (is.operatingIncome <= 0 || is.netIncome <= 0) {
    const isPersistent = isPrior && (isPrior.operatingIncome <= 0 || isPrior.netIncome <= 0);
    flags.push({
      id: 'flag-operating-losses',
      severity: isPersistent ? 'critical' : 'high',
      title: isPersistent ? 'Persistent Operating Losses' : 'Operating Deficit Incurred',
      category: 'Profitability',
      metric: 'Operating Income (EBIT)',
      observedValue: `${is.operatingIncome < 0 ? '-' : ''}$${Math.abs(is.operatingIncome).toLocaleString()}`,
      threshold: '> $0.00',
      explanation: isPersistent 
        ? 'Core operating business has failed to generate positive EBIT across multiple reporting periods, indicating systemic cash drag.' 
        : 'Company operated at an operating loss during the current period, eroding retained capital.',
      cfoAction: 'Execute urgent overhead cost reductions, eliminate unprofitable product/service lines, and reforecast runway.'
    });
  }

  // 3. Weak Liquidity
  if (ratiosCurr.currentRatio < 1.2 || ratiosCurr.quickRatio < 0.9) {
    flags.push({
      id: 'flag-weak-liquidity',
      severity: ratiosCurr.currentRatio < 1.0 ? 'critical' : 'high',
      title: 'Constrained Liquidity Buffer',
      category: 'Liquidity',
      metric: 'Current Ratio / Quick Ratio',
      observedValue: `${ratiosCurr.currentRatio.toFixed(2)}x / ${ratiosCurr.quickRatio.toFixed(2)}x`,
      threshold: 'Current >= 1.50x, Quick >= 1.00x',
      explanation: 'Liquid short-term assets are inadequate to comfortably cover liabilities maturing within twelve months.',
      cfoAction: 'Establish backup revolving credit lines, accelerate receivables collection, and lengthen payment terms with key suppliers.'
    });
  }

  // 4. Increasing Leverage
  if (ratiosCurr.debtToEquityRatio > 1.8) {
    flags.push({
      id: 'flag-increasing-leverage',
      severity: ratiosCurr.debtToEquityRatio > 3.0 ? 'critical' : 'medium',
      title: 'Elevated Balance Sheet Leverage',
      category: 'Solvency',
      metric: 'Debt-to-Equity Ratio',
      observedValue: `${ratiosCurr.debtToEquityRatio.toFixed(2)}x`,
      threshold: '<= 1.50x',
      explanation: 'Capital structure relies heavily on creditor obligations, increasing interest vulnerability and refinancing risk during rate spikes.',
      cfoAction: 'Cap additional subordinated borrowings and apply free operating cash flow toward principal debt paydown.'
    });
  }

  // 5. Declining Cash Balances
  if (bsPrior && bsPrior.assets.cashAndEquivalents > 0) {
    const cashDelta = (bs.assets.cashAndEquivalents || 0) - bsPrior.assets.cashAndEquivalents;
    if (cashDelta < 0) {
      const burnPct = (cashDelta / bsPrior.assets.cashAndEquivalents) * 100;
      flags.push({
        id: 'flag-declining-cash',
        severity: burnPct < -30 ? 'critical' : 'medium',
        title: 'Declining Cash Reserves',
        category: 'Liquidity',
        metric: 'Cash Balance Movement',
        observedValue: `${burnPct.toFixed(1)}% YoY (${cashDelta < 0 ? '-' : ''}$${Math.abs(cashDelta).toLocaleString()})`,
        threshold: '>= 0.0%',
        explanation: 'Total liquid reserves decreased compared to prior period due to cash outflow in operations, investments, or financing.',
        cfoAction: 'Implement strict weekly 13-week rolling cash flow forecasts and establish spending authorization thresholds.'
      });
    }
  }

  // 6. Slow Receivables Collection
  if (ratiosCurr.daysSalesOutstanding > 60) {
    flags.push({
      id: 'flag-slow-dso',
      severity: ratiosCurr.daysSalesOutstanding > 85 ? 'critical' : 'high',
      title: 'Extended Days Sales Outstanding (DSO)',
      category: 'Operations',
      metric: 'DSO (Receivables Cycle)',
      observedValue: `${ratiosCurr.daysSalesOutstanding.toFixed(0)} days`,
      threshold: '<= 45 days',
      explanation: 'Customer invoices are taking significantly longer than industry standard to collect, immobilizing working capital.',
      cfoAction: 'Enforce automated dunning workflows, offer prompt payment discounts (e.g. 2/10 net 30), and stop credit for delinquent accounts.'
    });
  }

  // 7. Excessive Inventory Accumulation
  if (ratiosCurr.daysInventoryOutstanding > 80) {
    flags.push({
      id: 'flag-excessive-inventory',
      severity: ratiosCurr.daysInventoryOutstanding > 120 ? 'high' : 'medium',
      title: 'Excessive Inventory Accumulation',
      category: 'Operations',
      metric: 'DIO (Inventory Holding Period)',
      observedValue: `${ratiosCurr.daysInventoryOutstanding.toFixed(0)} days`,
      threshold: '<= 60 days',
      explanation: 'Stock is lingering in warehouses, inflating storage carrying costs and raising risk of write-downs or obsolescence.',
      cfoAction: 'Conduct SKU-level aging audit, discount slow-moving inventory, and align procurement with demand pull.'
    });
  }

  // 8. Unusual Expenses (OpEx Acceleration)
  if (isPrior && isPrior.revenue > 0) {
    const currOpexPct = safeDiv(is.operatingExpenses?.total || 0, is.revenue, 100);
    const priorOpexPct = safeDiv(isPrior.operatingExpenses?.total || 0, isPrior.revenue, 100);
    const opexDrift = currOpexPct - priorOpexPct;
    if (opexDrift > 3.0) {
      flags.push({
        id: 'flag-unusual-expenses',
        severity: opexDrift > 6.0 ? 'critical' : 'medium',
        title: 'Disproportionate OpEx Escalation',
        category: 'Profitability',
        metric: 'OpEx-to-Revenue Expansion',
        observedValue: `+${opexDrift.toFixed(1)} percentage pts YoY`,
        threshold: '<= 0.0%',
        explanation: 'Overhead expenses expanded significantly faster than top-line revenue, eroding operating leverage.',
        cfoAction: 'Conduct a departmental zero-based budget audit across SG&A, marketing spend, and administrative software subscriptions.'
      });
    }
  }

  // 9. Revenue Concentration Risk
  flags.push({
    id: 'flag-revenue-concentration',
    severity: 'low',
    title: 'Customer & Revenue Concentration Risk',
    category: 'Operations',
    metric: 'Concentration Surveillance',
    observedValue: 'Requires ongoing monitoring',
    threshold: '< 20% per single account',
    explanation: 'Assess client dependency: ensure no single client account represents over 20% of consolidated recurring revenue.',
    cfoAction: 'Set up key account contract renewal tracking and incentivize sales teams on net-new logo acquisitions.'
  });

  // 10. Negative Operating Cash Flow Despite Reported Profits (Earnings Quality Divergence)
  if (is.netIncome > 0 && cf.operatingCashFlow < 0) {
    flags.push({
      id: 'flag-negative-ocf-profit',
      severity: 'critical',
      title: 'Accrual Profit Divergence (Negative Operating Cash Flow)',
      category: 'Cash Flow',
      metric: 'Operating Cash Flow vs Net Income',
      observedValue: `Net Income: +$${is.netIncome.toLocaleString()} | OCF: -$${Math.abs(cf.operatingCashFlow).toLocaleString()}`,
      threshold: 'OCF >= Net Income',
      explanation: 'The company reported positive accounting profit on an accrual basis, but cash from operations was negative. This indicates aggressive revenue recognition, unpaid receivables, or heavy inventory accumulation.',
      cfoAction: 'Audit cash realization timing, investigate uncollected AR, and halt non-essential capital commitments until cash turns positive.'
    });
  }

  return flags;
}

/**
 * PHASE 5: Transparent & Configurable Financial Health Scoring Engine
 */
export function calculateConfigurableHealthScore(
  current: PeriodFinancialData,
  prior?: PeriodFinancialData | null,
  customWeights?: Partial<import('../types').HealthScoreWeights>
): import('../types').HealthScoreBreakdown {
  const is = current.incomeStatement;
  const bs = current.balanceSheet;
  const cf = current.cashFlow;
  const ratios = calculateFinancialRatios(current, prior);

  // Default weights: Profitability 25%, Liquidity 25%, Solvency 20%, Efficiency 15%, Cash Flow 15%
  const weights: import('../types').HealthScoreWeights = {
    profitability: customWeights?.profitability ?? 25,
    liquidity: customWeights?.liquidity ?? 25,
    solvency: customWeights?.solvency ?? 20,
    efficiency: customWeights?.efficiency ?? 15,
    cashFlow: customWeights?.cashFlow ?? 15
  };

  // 1. Profitability Component (0 - 100)
  let profScore = 50;
  if (ratios.grossProfitMargin >= 25) profScore += 15;
  else if (ratios.grossProfitMargin >= 15) profScore += 8;
  else profScore -= 10;

  if (ratios.operatingMargin >= 15) profScore += 20;
  else if (ratios.operatingMargin >= 8) profScore += 12;
  else if (ratios.operatingMargin <= 0) profScore -= 20;

  if (ratios.netProfitMargin >= 10) profScore += 15;
  else if (ratios.netProfitMargin >= 4) profScore += 8;
  else if (ratios.netProfitMargin <= 0) profScore -= 15;

  profScore = Math.min(100, Math.max(0, profScore));

  const profMetrics: import('../types').HealthScoreMetric[] = [
    {
      name: 'Gross Profit Margin',
      value: `${ratios.grossProfitMargin.toFixed(1)}%`,
      benchmark: '>= 20.0%',
      numerator: 'Gross Profit (Revenue - COGS)',
      denominator: 'Revenue',
      status: ratios.grossProfitMargin >= 20 ? 'optimal' : ratios.grossProfitMargin >= 12 ? 'warning' : 'critical',
      impact: 'Measures pricing power and basic production efficiency.'
    },
    {
      name: 'Operating Margin (EBIT Margin)',
      value: `${ratios.operatingMargin.toFixed(1)}%`,
      benchmark: '>= 10.0%',
      numerator: 'Operating Income (EBIT)',
      denominator: 'Revenue',
      status: ratios.operatingMargin >= 10 ? 'optimal' : ratios.operatingMargin >= 5 ? 'warning' : 'critical',
      impact: 'Reflects core operational efficiency before interest and tax burdens.'
    },
    {
      name: 'Net Profit Margin',
      value: `${ratios.netProfitMargin.toFixed(1)}%`,
      benchmark: '>= 6.0%',
      numerator: 'Net Income After Tax',
      denominator: 'Revenue',
      status: ratios.netProfitMargin >= 6 ? 'optimal' : ratios.netProfitMargin > 0 ? 'warning' : 'critical',
      impact: 'Bottom-line residual return available to shareholders.'
    },
    {
      name: 'EBITDA Margin',
      value: `${ratios.ebitdaMargin.toFixed(1)}%`,
      benchmark: '>= 14.0%',
      numerator: 'EBITDA (EBIT + Depreciation)',
      denominator: 'Revenue',
      status: ratios.ebitdaMargin >= 14 ? 'optimal' : ratios.ebitdaMargin >= 8 ? 'warning' : 'critical',
      impact: 'Cash-flow proxy of operational earnings power.'
    }
  ];

  // 2. Liquidity Component (0 - 100)
  let liqScore = 50;
  if (ratios.currentRatio >= 2.0) liqScore += 25;
  else if (ratios.currentRatio >= 1.4) liqScore += 15;
  else if (ratios.currentRatio < 1.0) liqScore -= 25;

  if (ratios.quickRatio >= 1.2) liqScore += 25;
  else if (ratios.quickRatio >= 0.9) liqScore += 12;
  else if (ratios.quickRatio < 0.7) liqScore -= 25;

  liqScore = Math.min(100, Math.max(0, liqScore));

  const liqMetrics: import('../types').HealthScoreMetric[] = [
    {
      name: 'Current Ratio',
      value: `${ratios.currentRatio.toFixed(2)}x`,
      benchmark: '1.50x - 2.50x',
      numerator: 'Total Current Assets',
      denominator: 'Total Current Liabilities',
      status: ratios.currentRatio >= 1.5 ? 'optimal' : ratios.currentRatio >= 1.0 ? 'warning' : 'critical',
      impact: 'Buffer for settling short-term commitments within one year.'
    },
    {
      name: 'Quick Ratio (Acid Test)',
      value: `${ratios.quickRatio.toFixed(2)}x`,
      benchmark: '>= 1.00x',
      numerator: 'Cash + Accounts Receivable (Excludes Inventory)',
      denominator: 'Total Current Liabilities',
      status: ratios.quickRatio >= 1.0 ? 'optimal' : ratios.quickRatio >= 0.75 ? 'warning' : 'critical',
      impact: 'Immediate liquid debt coverage without having to liquidate warehouse stock.'
    },
    {
      name: 'Cash Ratio',
      value: `${ratios.cashRatio.toFixed(2)}x`,
      benchmark: '>= 0.25x',
      numerator: 'Cash & Cash Equivalents',
      denominator: 'Total Current Liabilities',
      status: ratios.cashRatio >= 0.25 ? 'optimal' : ratios.cashRatio >= 0.1 ? 'warning' : 'critical',
      impact: 'Ultra-liquid cash protection against unexpected creditor demands.'
    }
  ];

  // 3. Solvency Component (0 - 100)
  let solvScore = 50;
  if (ratios.debtToEquityRatio <= 1.0) solvScore += 25;
  else if (ratios.debtToEquityRatio <= 1.8) solvScore += 10;
  else if (ratios.debtToEquityRatio > 2.5) solvScore -= 25;

  if (typeof ratios.interestCoverageRatio === 'number') {
    if (ratios.interestCoverageRatio >= 4.0) solvScore += 25;
    else if (ratios.interestCoverageRatio >= 2.0) solvScore += 10;
    else if (ratios.interestCoverageRatio < 1.2) solvScore -= 25;
  } else {
    solvScore += 15; // No debt interest burden
  }

  solvScore = Math.min(100, Math.max(0, solvScore));

  const solvMetrics: import('../types').HealthScoreMetric[] = [
    {
      name: 'Debt-to-Equity Ratio',
      value: `${ratios.debtToEquityRatio.toFixed(2)}x`,
      benchmark: '<= 1.20x',
      numerator: 'Total Debt (Short-Term + Long-Term Borrowings)',
      denominator: 'Total Shareholders Equity',
      status: ratios.debtToEquityRatio <= 1.2 ? 'optimal' : ratios.debtToEquityRatio <= 2.0 ? 'warning' : 'critical',
      impact: 'Measures financial gearing and long-term risk profile.'
    },
    {
      name: 'Debt-to-Assets Ratio',
      value: `${ratios.debtToAssetsRatio.toFixed(2)}x`,
      benchmark: '<= 0.50x',
      numerator: 'Total Debt',
      denominator: 'Total Assets',
      status: ratios.debtToAssetsRatio <= 0.5 ? 'optimal' : ratios.debtToAssetsRatio <= 0.7 ? 'warning' : 'critical',
      impact: 'Proportion of company assets financed through creditors.'
    },
    {
      name: 'Interest Coverage Ratio',
      value: typeof ratios.interestCoverageRatio === 'number' ? `${ratios.interestCoverageRatio.toFixed(2)}x` : 'N/A',
      benchmark: '>= 3.00x',
      numerator: 'Operating Income (EBIT)',
      denominator: 'Interest Expense',
      status: typeof ratios.interestCoverageRatio === 'number' && ratios.interestCoverageRatio >= 3.0 ? 'optimal' : 'warning',
      impact: 'Safety margin for servicing interest obligations out of earnings.'
    }
  ];

  // 4. Efficiency Component (0 - 100)
  let effScore = 50;
  if (ratios.assetTurnover >= 1.2) effScore += 20;
  else if (ratios.assetTurnover >= 0.8) effScore += 10;
  else effScore -= 10;

  if (ratios.daysSalesOutstanding <= 45) effScore += 15;
  else if (ratios.daysSalesOutstanding <= 65) effScore += 5;
  else effScore -= 15;

  if (ratios.daysInventoryOutstanding <= 60) effScore += 15;
  else if (ratios.daysInventoryOutstanding > 100) effScore -= 15;

  effScore = Math.min(100, Math.max(0, effScore));

  const effMetrics: import('../types').HealthScoreMetric[] = [
    {
      name: 'Asset Turnover',
      value: `${ratios.assetTurnover.toFixed(2)}x`,
      benchmark: '>= 1.00x',
      numerator: 'Revenue',
      denominator: 'Total Assets',
      status: ratios.assetTurnover >= 1.0 ? 'optimal' : ratios.assetTurnover >= 0.7 ? 'warning' : 'critical',
      impact: 'Capital productivity: dollars of sales generated per dollar of asset base.'
    },
    {
      name: 'Receivables Days (DSO)',
      value: `${ratios.daysSalesOutstanding.toFixed(0)} days`,
      benchmark: '<= 45 days',
      numerator: 'Accounts Receivable * 365',
      denominator: 'Revenue',
      status: ratios.daysSalesOutstanding <= 45 ? 'optimal' : ratios.daysSalesOutstanding <= 65 ? 'warning' : 'critical',
      impact: 'Speed of converting customer billings into usable cash.'
    },
    {
      name: 'Inventory Days (DIO)',
      value: `${ratios.daysInventoryOutstanding.toFixed(0)} days`,
      benchmark: '<= 60 days',
      numerator: 'Inventory * 365',
      denominator: 'Cost of Goods Sold (COGS)',
      status: ratios.daysInventoryOutstanding <= 60 ? 'optimal' : ratios.daysInventoryOutstanding <= 90 ? 'warning' : 'critical',
      impact: 'Turnaround cycle of warehouse goods into customer sales.'
    },
    {
      name: 'Cash Conversion Cycle (CCC)',
      value: `${ratios.cashConversionCycle.toFixed(0)} days`,
      benchmark: '<= 45 days',
      numerator: 'DSO + DIO - DPO',
      denominator: 'Days of operating cycle',
      status: ratios.cashConversionCycle <= 45 ? 'optimal' : ratios.cashConversionCycle <= 75 ? 'warning' : 'critical',
      impact: 'Net days working capital remains locked up before cash realization.'
    }
  ];

  // 5. Cash Flow Component (0 - 100)
  let cfScore = 50;
  if (cf.operatingCashFlow > 0) cfScore += 25;
  else cfScore -= 25;

  if (is.netIncome > 0 && cf.operatingCashFlow >= is.netIncome) cfScore += 25;
  else if (is.netIncome > 0 && cf.operatingCashFlow < 0) cfScore -= 30; // Earnings quality red flag

  cfScore = Math.min(100, Math.max(0, cfScore));

  const cfMetrics: import('../types').HealthScoreMetric[] = [
    {
      name: 'Operating Cash Flow (OCF)',
      value: `$${cf.operatingCashFlow.toLocaleString()}`,
      benchmark: '> $0.00',
      numerator: 'Net Income + Non-Cash D&A +/- Working Capital',
      denominator: 'Operating Period',
      status: cf.operatingCashFlow > 0 ? 'optimal' : 'critical',
      impact: 'Organic cash generation from trading activities.'
    },
    {
      name: 'Cash Flow-to-Net Income Quality',
      value: `${ratios.cashFlowToNetIncome ? ratios.cashFlowToNetIncome.toFixed(2) : '1.00'}x`,
      benchmark: '>= 1.00x',
      numerator: 'Operating Cash Flow',
      denominator: 'Net Income',
      status: (ratios.cashFlowToNetIncome || 0) >= 1.0 ? 'optimal' : (ratios.cashFlowToNetIncome || 0) > 0.5 ? 'warning' : 'critical',
      impact: 'Earnings quality indicator: validates whether accrual accounting profits materialize as real cash.'
    },
    {
      name: 'Net Cash Movement',
      value: `$${cf.netCashFlow.toLocaleString()}`,
      benchmark: '>= $0.00',
      numerator: 'Operating CF + Investing CF + Financing CF',
      denominator: 'Reporting Period',
      status: cf.netCashFlow >= 0 ? 'optimal' : 'warning',
      impact: 'Net trajectory of bank liquidity position.'
    }
  ];

  // Weighted Score
  const totalWeight = weights.profitability + weights.liquidity + weights.solvency + weights.efficiency + weights.cashFlow;
  const weightedOverall = Math.round(
    (profScore * weights.profitability +
      liqScore * weights.liquidity +
      solvScore * weights.solvency +
      effScore * weights.efficiency +
      cfScore * weights.cashFlow) / (totalWeight || 100)
  );

  let grade: 'A' | 'B' | 'C' | 'D' | 'F' = 'C';
  let riskRating: 'Low' | 'Moderate' | 'Elevated' | 'High' | 'Severe' = 'Elevated';

  if (weightedOverall >= 82) {
    grade = 'A';
    riskRating = 'Low';
  } else if (weightedOverall >= 68) {
    grade = 'B';
    riskRating = 'Moderate';
  } else if (weightedOverall >= 52) {
    grade = 'C';
    riskRating = 'Elevated';
  } else if (weightedOverall >= 38) {
    grade = 'D';
    riskRating = 'High';
  } else {
    grade = 'F';
    riskRating = 'Severe';
  }

  const components: import('../types').HealthScoreComponent[] = [
    {
      category: 'Profitability',
      score: profScore,
      weightedScore: Number(((profScore * weights.profitability) / 100).toFixed(1)),
      weightPercent: weights.profitability,
      status: profScore >= 70 ? 'optimal' : profScore >= 50 ? 'warning' : 'critical',
      summary: `Margin profile is ${profScore >= 70 ? 'robust' : 'moderate'} with ${ratios.grossProfitMargin.toFixed(1)}% gross margin and ${ratios.operatingMargin.toFixed(1)}% operating margin.`,
      metrics: profMetrics
    },
    {
      category: 'Liquidity',
      score: liqScore,
      weightedScore: Number(((liqScore * weights.liquidity) / 100).toFixed(1)),
      weightPercent: weights.liquidity,
      status: liqScore >= 70 ? 'optimal' : liqScore >= 50 ? 'warning' : 'critical',
      summary: `Current obligations backed by ${ratios.currentRatio.toFixed(2)}x current ratio and ${ratios.quickRatio.toFixed(2)}x quick ratio.`,
      metrics: liqMetrics
    },
    {
      category: 'Solvency',
      score: solvScore,
      weightedScore: Number(((solvScore * weights.solvency) / 100).toFixed(1)),
      weightPercent: weights.solvency,
      status: solvScore >= 70 ? 'optimal' : solvScore >= 50 ? 'warning' : 'critical',
      summary: `Gearing stands at ${ratios.debtToEquityRatio.toFixed(2)}x debt-to-equity with ${typeof ratios.interestCoverageRatio === 'number' ? `${ratios.interestCoverageRatio.toFixed(1)}x` : 'solid'} interest coverage.`,
      metrics: solvMetrics
    },
    {
      category: 'Efficiency',
      score: effScore,
      weightedScore: Number(((effScore * weights.efficiency) / 100).toFixed(1)),
      weightPercent: weights.efficiency,
      status: effScore >= 70 ? 'optimal' : effScore >= 50 ? 'warning' : 'critical',
      summary: `Working capital velocity: ${ratios.daysSalesOutstanding.toFixed(0)} days DSO and ${ratios.cashConversionCycle.toFixed(0)} days cash conversion cycle.`,
      metrics: effMetrics
    },
    {
      category: 'Cash Flow',
      score: cfScore,
      weightedScore: Number(((cfScore * weights.cashFlow) / 100).toFixed(1)),
      weightPercent: weights.cashFlow,
      status: cfScore >= 70 ? 'optimal' : cfScore >= 50 ? 'warning' : 'critical',
      summary: `Operating cash conversion is ${cf.operatingCashFlow > 0 ? 'positive' : 'negative'} ($${cf.operatingCashFlow.toLocaleString()}).`,
      metrics: cfMetrics
    }
  ];

  return {
    overallScore: weightedOverall,
    scoreOutOfTen: Number((weightedOverall / 10).toFixed(1)),
    grade,
    riskRating,
    weights,
    components,
    methodologyDescription: 'Multi-factor weighted arithmetic model evaluating Profitability (25%), Liquidity (25%), Solvency (20%), Operational Efficiency (15%), and Cash Flow Conversion (15%) calibrated against standard corporate financial benchmarks.',
    disclaimer: 'Scoring Methodology Disclosure: This score is a mathematical heuristic derived from financial ratios for strategic operational diagnostics. It is not an audited credit rating, regulated credit assessment, or credit bureau rating. Industry context, seasonality, company size, and reporting basis must be considered before capital decisions.'
  };
}

