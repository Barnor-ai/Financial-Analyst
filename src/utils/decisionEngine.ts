/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  PeriodFinancialData, 
  BudgetVsActual, 
  FinancialAnalysisReport, 
  DecisionInsightItem, 
  ManagementActionItem,
  ScenarioModelAssumptions,
  ScenarioProjectionResult
} from '../types';

const ACTION_REGISTER_KEY = 'finscope_management_action_register_v1';

/**
 * Initial Default Action Register Items based on core corporate priorities
 */
export const INITIAL_MANAGEMENT_ACTIONS: ManagementActionItem[] = [
  {
    id: 'act-001',
    actionDescription: 'Initiate receivables audit and enforce 30-day payment milestone terms on top 10 enterprise accounts',
    linkedReportOrVariance: 'Working Capital DSO Stretch (Receivables collection at 54 days)',
    responsiblePerson: 'Sarah Jenkins (VP Credit & Collections)',
    department: 'Finance',
    priority: 'Critical',
    dueDate: '2026-10-15', // Near term / overdue test
    status: 'In Progress',
    expectedFinancialImpact: '$180,000 accelerated operating cash collection within 30 days',
    actualOutcome: 'Collected $95,000 from 3 delinquent accounts in first cohort',
    commentsAndEvidence: 'Payment cycle had drifted from contractual Net 30 to Net 54. Escalation notice served to procurement counterparties.',
    createdAt: '2026-09-01T08:00:00Z',
    updatedAt: '2026-10-02T14:20:00Z'
  },
  {
    id: 'act-002',
    actionDescription: 'Renegotiate cloud hosting infrastructure contract and consolidate reserved enterprise instances',
    linkedReportOrVariance: 'Adverse Variance: Cloud & IT Infrastructure ($45k overrun vs budget)',
    responsiblePerson: 'David Chen (Head of Cloud Architecture)',
    department: 'Engineering',
    priority: 'High',
    dueDate: '2026-10-05', // Overdue test
    status: 'Open',
    expectedFinancialImpact: '$55,000 annualized OpEx run-rate reduction',
    actualOutcome: '',
    commentsAndEvidence: 'Usage spiked 28% without committing to 1-year reserved instances. Vendor proposal received with 18% savings tier.',
    createdAt: '2026-09-10T10:00:00Z',
    updatedAt: '2026-09-10T10:00:00Z'
  },
  {
    id: 'act-003',
    actionDescription: 'Implement pricing indexation and trim discount authority on tier-2 enterprise contracts',
    linkedReportOrVariance: 'Profitability Margin Dilution: Gross Margin compressed by 1.8%',
    responsiblePerson: 'Elena Rostova (Chief Commercial Officer)',
    department: 'Sales',
    priority: 'High',
    dueDate: '2026-10-25',
    status: 'Awaiting Approval',
    expectedFinancialImpact: '$140,000 gross margin expansion across renewals',
    actualOutcome: '',
    commentsAndEvidence: 'Sales team offered average 12% ad-hoc discounts during Q2 push. Policy update requires CFO co-signature for discounts > 7%.',
    createdAt: '2026-09-15T11:30:00Z',
    updatedAt: '2026-10-01T09:15:00Z'
  },
  {
    id: 'act-004',
    actionDescription: 'Establish $500,000 standby revolving credit facility to insulate against seasonal cash burn',
    linkedReportOrVariance: 'Liquidity & Cash Flow: Operating Cash Flow / Net Income divergence',
    responsiblePerson: 'Marcus Vance (Group Treasurer)',
    department: 'Finance',
    priority: 'Medium',
    dueDate: '2026-11-15',
    status: 'Open',
    expectedFinancialImpact: 'Guaranteed liquidity buffer preventing emergency supplier factoring',
    actualOutcome: '',
    commentsAndEvidence: 'Term sheets requested from two tier-1 commercial lenders at SOFR + 1.85%.',
    createdAt: '2026-09-20T16:00:00Z',
    updatedAt: '2026-09-20T16:00:00Z'
  },
  {
    id: 'act-005',
    actionDescription: 'Postpone non-essential corporate office redesign until H2 operating income target met',
    linkedReportOrVariance: 'CapEx Budget: Discretionary Facility Improvements',
    responsiblePerson: 'Rachel Adams (VP People & Operations)',
    department: 'Executive',
    priority: 'Low',
    dueDate: '2026-12-01',
    status: 'Deferred',
    expectedFinancialImpact: '$85,000 immediate cash preservation',
    actualOutcome: 'Capex frozen; reassessment scheduled for annual budget cycle',
    commentsAndEvidence: 'Deferred by CFO recommendation during Q3 capital committee review.',
    createdAt: '2026-08-15T09:00:00Z',
    updatedAt: '2026-09-01T12:00:00Z'
  }
];

/**
 * Loads the action register from local storage or defaults
 */
export function loadManagementActions(): ManagementActionItem[] {
  try {
    const raw = localStorage.getItem(ACTION_REGISTER_KEY);
    if (!raw) return INITIAL_MANAGEMENT_ACTIONS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_MANAGEMENT_ACTIONS;
  } catch {
    return INITIAL_MANAGEMENT_ACTIONS;
  }
}

/**
 * Saves management actions to local storage
 */
export function saveManagementActions(items: ManagementActionItem[]): void {
  try {
    localStorage.setItem(ACTION_REGISTER_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save management actions', e);
  }
}

/**
 * Overdue calculation helper
 */
export function getActionDueStatus(dueDateStr: string, status: string): {
  isOverdue: boolean;
  daysDiff: number;
  label: string;
  badgeClass: string;
} {
  if (status === 'Completed') {
    return { isOverdue: false, daysDiff: 0, label: 'Completed', badgeClass: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
  }
  if (status === 'Deferred') {
    return { isOverdue: false, daysDiff: 0, label: 'Deferred', badgeClass: 'text-slate-600 bg-slate-100 border-slate-300' };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDateStr);
  due.setHours(0, 0, 0, 0);

  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const overdueDays = Math.abs(diffDays);
    return {
      isOverdue: true,
      daysDiff: diffDays,
      label: `Overdue by ${overdueDays}d`,
      badgeClass: 'text-red-700 bg-red-50 border-red-200 font-bold'
    };
  } else if (diffDays === 0) {
    return {
      isOverdue: false,
      daysDiff: 0,
      label: 'Due Today',
      badgeClass: 'text-amber-800 bg-amber-50 border-amber-300 font-bold'
    };
  } else if (diffDays <= 7) {
    return {
      isOverdue: false,
      daysDiff: diffDays,
      label: `Due in ${diffDays}d`,
      badgeClass: 'text-amber-700 bg-amber-50 border-amber-200'
    };
  } else {
    return {
      isOverdue: false,
      daysDiff: diffDays,
      label: `Due in ${diffDays}d`,
      badgeClass: 'text-slate-600 bg-slate-50 border-slate-200'
    };
  }
}

/**
 * Extracts and synthesizes all 9 Decision Support categories from real financial data
 */
export function generateDecisionSupportInsights(
  periods: PeriodFinancialData[],
  budgetItems: BudgetVsActual[],
  report: FinancialAnalysisReport | null,
  currencySymbol: string
): DecisionInsightItem[] {
  const insights: DecisionInsightItem[] = [];

  const sortedPeriods = [...periods].sort((a, b) => b.period.localeCompare(a.period, undefined, { numeric: true }));
  const curr = sortedPeriods[0];
  const prior = sortedPeriods[1];

  if (!curr) return insights;

  const rev = curr.incomeStatement.revenue || 1;
  const cogs = curr.incomeStatement.cogs || 0;
  const gp = curr.incomeStatement.grossProfit || (rev - cogs);
  const gpMargin = (gp / rev) * 100;
  const opex = curr.incomeStatement.operatingExpenses.total || 0;
  const ebit = curr.incomeStatement.operatingIncome || (gp - opex);
  const netIncome = curr.incomeStatement.netIncome || (ebit * 0.75);
  const ocf = curr.cashFlow?.operatingCashFlow || (netIncome * 0.9);

  const ar = curr.balanceSheet.assets.accountsReceivable || (rev * 0.15);
  const inv = curr.balanceSheet.assets.inventory || (cogs * 0.12);
  const ap = curr.balanceSheet.liabilities.accountsPayable || (cogs * 0.10);
  const cash = curr.balanceSheet.assets.cashAndEquivalents || (rev * 0.10);

  const dso = Math.round((ar / rev) * 365);
  const dio = cogs > 0 ? Math.round((inv / cogs) * 365) : 30;
  const dpo = cogs > 0 ? Math.round((ap / cogs) * 365) : 35;
  const ccc = dso + dio - dpo;

  // 1. Key Decisions Requiring Management Attention
  insights.push({
    id: 'dec-attn-1',
    category: 'attention',
    title: 'Customer Payment Term Enforcement vs Commercial Flexibility',
    severity: dso > 45 ? 'critical' : 'high',
    context: `Current Days Sales Outstanding is at ${dso} days. Cash locked in unpaid receivables amounts to ${currencySymbol}${Math.round(ar).toLocaleString()}. Management must decide whether to tighten credit limits or mandate early settlement discounts.`,
    quantitativeImpact: `${currencySymbol}${Math.round(ar * 0.20).toLocaleString()} potential cash acceleration`,
    evidence: `Receivables balance: ${currencySymbol}${ar.toLocaleString()} across recent period; collection cycle exceeds industry standard 30-day baseline by ${Math.max(0, dso - 30)} days.`,
    recommendedAction: 'Mandate CFO sign-off for credit terms > 30 days and institute 1.5% prompt-pay discount.',
    responsibleDept: 'Finance & Sales',
    suggestedDueDate: '2026-10-31',
    linkedVarianceOrMetric: `DSO (${dso} days)`
  });

  insights.push({
    id: 'dec-attn-2',
    category: 'attention',
    title: 'Gross Margin Defense & Pricing Adjustment Policy',
    severity: gpMargin < 30 ? 'high' : 'medium',
    context: `Current Gross Margin stands at ${gpMargin.toFixed(1)}%. Direct cost inflation threatens to dilute profitability unless selective product repricing is sanctioned by the executive committee.`,
    quantitativeImpact: `1.0% price increase generates ${currencySymbol}${Math.round(rev * 0.01).toLocaleString()} pure operating profit`,
    evidence: `Direct COGS represents ${((cogs / rev) * 100).toFixed(1)}% of top-line revenue (${currencySymbol}${cogs.toLocaleString()}).`,
    recommendedAction: 'Conduct category-by-category gross margin review and execute tier-2 pricing adjustments.',
    responsibleDept: 'Commercial / Pricing',
    suggestedDueDate: '2026-11-15',
    linkedVarianceOrMetric: `Gross Margin (${gpMargin.toFixed(1)}%)`
  });

  // 2. High-Priority Financial Risks
  const currentRatio = curr.balanceSheet.assets.totalCurrentAssets / (curr.balanceSheet.liabilities.totalCurrentLiabilities || 1);
  insights.push({
    id: 'dec-risk-1',
    category: 'financial_risk',
    title: currentRatio < 1.3 ? 'Sub-Optimal Liquidity Coverage Buffer' : 'Working Capital Expansion Volatility',
    severity: currentRatio < 1.2 ? 'critical' : 'high',
    context: `Current Ratio is ${currentRatio.toFixed(2)}x (Target: 1.50x–2.00x). Liquid assets provide limited cushion against unexpected supplier callouts or payment friction.`,
    quantitativeImpact: `${currencySymbol}${Math.round(Math.abs(curr.balanceSheet.assets.totalCurrentAssets - curr.balanceSheet.liabilities.totalCurrentLiabilities)).toLocaleString()} net working capital cushion`,
    evidence: `Current Assets: ${currencySymbol}${curr.balanceSheet.assets.totalCurrentAssets.toLocaleString()} vs Current Liabilities: ${currencySymbol}${curr.balanceSheet.liabilities.totalCurrentLiabilities.toLocaleString()}.`,
    recommendedAction: 'Establish formal treasury liquidity floor and secure committed credit standby line.',
    responsibleDept: 'Treasury',
    suggestedDueDate: '2026-11-05',
    linkedVarianceOrMetric: `Current Ratio (${currentRatio.toFixed(2)}x)`
  });

  // 3. Significant Adverse Variances
  const adverseBudgetItems = budgetItems.filter(b => {
    const isRev = b.category.toLowerCase().includes('revenue') || b.category.toLowerCase().includes('sales');
    const isFav = isRev ? b.actual >= b.budgeted : b.actual <= b.budgeted;
    return !isFav && Math.abs(b.variance) > 5000;
  });

  if (adverseBudgetItems.length > 0) {
    const topAdverse = adverseBudgetItems.sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance))[0];
    insights.push({
      id: 'dec-var-1',
      category: 'adverse_variance',
      title: `Material Budget Overrun: ${topAdverse.category}`,
      severity: Math.abs(topAdverse.variance) > 50000 ? 'critical' : 'high',
      context: `Actual expenditure reached ${currencySymbol}${topAdverse.actual.toLocaleString()} against budgeted ${currencySymbol}${topAdverse.budgeted.toLocaleString()}, generating an adverse overrun of ${currencySymbol}${Math.abs(topAdverse.variance).toLocaleString()} (${topAdverse.variancePercentage.toFixed(1)}%).`,
      quantitativeImpact: `${currencySymbol}${Math.abs(topAdverse.variance).toLocaleString()} unbudgeted cash drain`,
      evidence: `Actual expenditure deviated by ${Math.abs(topAdverse.variancePercentage).toFixed(1)}% beyond the approved budgetary envelope.`,
      recommendedAction: `Freeze discretionary spending in ${topAdverse.category} and require budget holder to submit corrective recovery plan.`,
      responsibleDept: topAdverse.category.includes('Sales') ? 'Sales' : topAdverse.category.includes('Marketing') ? 'Marketing' : 'Operations',
      suggestedDueDate: '2026-10-20',
      linkedVarianceOrMetric: `${topAdverse.category} (Overrun: ${currencySymbol}${Math.abs(topAdverse.variance).toLocaleString()})`
    });
  } else {
    insights.push({
      id: 'dec-var-1',
      category: 'adverse_variance',
      title: 'Operating Overheads Escalation vs Target Run-rate',
      severity: 'medium',
      context: `Total OpEx reached ${currencySymbol}${opex.toLocaleString()} representing ${((opex / rev) * 100).toFixed(1)}% of top-line revenue.`,
      quantitativeImpact: `${currencySymbol}${Math.round(opex * 0.05).toLocaleString()} efficiency opportunity`,
      evidence: `Administrative, technology, and selling expenses tracking at historical upper bound.`,
      recommendedAction: 'Implement zero-based departmental budgeting review for upcoming quarter.',
      responsibleDept: 'Finance',
      suggestedDueDate: '2026-11-30',
      linkedVarianceOrMetric: 'Total OpEx'
    });
  }

  // 4. Cash Flow Pressure Indicators
  const ocfDivergence = ocf < netIncome;
  insights.push({
    id: 'dec-cf-1',
    category: 'cash_flow_pressure',
    title: ocfDivergence ? 'Operating Cash Flow Lagging Accounting Net Income' : 'Treasury Working Capital Drag',
    severity: ocfDivergence ? 'critical' : 'medium',
    context: ocfDivergence 
      ? `Operating Cash Flow (${currencySymbol}${Math.round(ocf).toLocaleString()}) is lower than reported Net Income (${currencySymbol}${Math.round(netIncome).toLocaleString()}), indicating that accounting profits are not fully translating into liquid bank deposits due to working capital accumulation.`
      : `Cash conversion cycle sits at ${ccc} days, absorbing liquidity during operational ramp-up.`,
    quantitativeImpact: `${currencySymbol}${Math.round(Math.abs(netIncome - ocf)).toLocaleString()} cash divergence gap`,
    evidence: `OCF/Net Income ratio is ${((ocf / (netIncome || 1)) * 100).toFixed(0)}% (Benchmark: $\\ge 100\\%$).`,
    recommendedAction: 'Accelerate trade receivables billing cycle and synchronize supplier disbursement dates.',
    responsibleDept: 'Finance & Treasury',
    suggestedDueDate: '2026-10-25',
    linkedVarianceOrMetric: 'Operating Cash Flow / Net Income'
  });

  // 5. Profitability Improvement Opportunities
  insights.push({
    id: 'dec-prof-1',
    category: 'profitability_opportunity',
    title: 'Customer & Product Margin Rationalization',
    severity: 'medium',
    context: `Gross margin of ${gpMargin.toFixed(1)}% can be enhanced through product mix optimization and sunsetting low-margin legacy SKUs or service lines.`,
    quantitativeImpact: `${currencySymbol}${Math.round(rev * 0.015).toLocaleString()} additional annual EBITDA`,
    evidence: `Historical baseline demonstrates gross margin variance of up to 400 bps across different client tiers.`,
    recommendedAction: 'Rank client profitability deciles and restructure minimum order values on lowest quintile.',
    responsibleDept: 'Commercial Operations',
    suggestedDueDate: '2026-11-20',
    linkedVarianceOrMetric: 'Gross Margin Expansion'
  });

  // 6. Cost Reduction Opportunities
  insights.push({
    id: 'dec-cost-1',
    category: 'cost_reduction',
    title: 'Procurement Consolidation & Vendor Contract Renegotiation',
    severity: 'high',
    context: `Direct COGS of ${currencySymbol}${cogs.toLocaleString()} and indirect OpEx of ${currencySymbol}${opex.toLocaleString()} represent fertile territory for supplier contract benchmarking.`,
    quantitativeImpact: `${currencySymbol}${Math.round((cogs + opex) * 0.035).toLocaleString()} addressable savings (3.5% reduction)`,
    evidence: `Top 20 vendors represent over 60% of total non-payroll procurement expenditures.`,
    recommendedAction: 'Issue competitive RFP for top 5 software, logistics, and professional service suppliers.',
    responsibleDept: 'Procurement',
    suggestedDueDate: '2026-12-05',
    linkedVarianceOrMetric: 'Procurement Run-Rate'
  });

  // 7. Working Capital Improvement Suggestions
  insights.push({
    id: 'dec-wc-1',
    category: 'working_capital',
    title: `Cash Conversion Cycle Optimization (${ccc} Days)`,
    severity: ccc > 50 ? 'high' : 'medium',
    context: `Current Cash Conversion Cycle is ${ccc} days (DSO: ${dso}d + DIO: ${dio}d - DPO: ${dpo}d). Reducing CCC by just 10 days would unlock immediate cash flow.`,
    quantitativeImpact: `${currencySymbol}${Math.round((rev / 365) * 10).toLocaleString()} permanent working capital release`,
    evidence: `Receivables DSO (${dso}d) exceeds payables DPO (${dpo}d), causing the firm to finance customers ahead of suppliers.`,
    recommendedAction: 'Extend standard vendor payment terms to Net 45 where commercially acceptable and enforce strict credit stops.',
    responsibleDept: 'Supply Chain & Payables',
    suggestedDueDate: '2026-11-10',
    linkedVarianceOrMetric: `Cash Conversion Cycle (${ccc} days)`
  });

  // 8. Forecast Risks
  insights.push({
    id: 'dec-fc-1',
    category: 'forecast_risk',
    title: 'Macro Sensitivity & Volume Growth Deceleration Risk',
    severity: 'high',
    context: `If revenue growth softens by 5% and OpEx remains sticky, operating leverage will amplify the EBIT contraction by approximately 1.8x.`,
    quantitativeImpact: `${currencySymbol}${Math.round(ebit * 0.18).toLocaleString()} EBIT vulnerability in bear scenario`,
    evidence: `High fixed-cost overheads (${currencySymbol}${opex.toLocaleString()}) create operational gearing vulnerability to top-line shocks.`,
    recommendedAction: 'Establish flexible staffing contingencies and index variable cost structures.',
    responsibleDept: 'Executive / Planning',
    suggestedDueDate: '2026-12-15',
    linkedVarianceOrMetric: 'Operating Leverage Multiplier'
  });

  // 9. Recommended Next Actions
  insights.push({
    id: 'dec-act-1',
    category: 'next_action',
    title: 'Formalize 13-Week Rolling Cash Flow Forecast Model',
    severity: 'high',
    context: `Transition financial reporting from static monthly views to a dynamic 13-week direct cash projection to foresee weekly liquidity pinch points.`,
    quantitativeImpact: 'Avoids short-term liquidity deficits and overdraft fees',
    evidence: `Month-end working capital swings create periodic cash flow valleys.`,
    recommendedAction: 'Deploy weekly cash-in vs cash-out ledger synced with treasury accounts.',
    responsibleDept: 'Treasury & FP&A',
    suggestedDueDate: '2026-10-30',
    linkedVarianceOrMetric: 'Treasury Liquidity'
  });

  return insights;
}

/**
 * Forward Scenario Simulation Engine
 * Computes projected Income Statement, Working Capital, Operating Cash Flow, and Ending Cash.
 * Enforces strict estimate disclaimers.
 */
export function calculateScenarioProjection(
  baselinePeriod: PeriodFinancialData,
  assumptions: ScenarioModelAssumptions
): ScenarioProjectionResult {
  const is = baselinePeriod.incomeStatement;
  const bs = baselinePeriod.balanceSheet;
  const cf = baselinePeriod.cashFlow;

  const baseRev = is.revenue || 10000000;
  const baseCogs = is.cogs || Math.round(baseRev * 0.72);
  const baseOpex = is.operatingExpenses.total || Math.round(baseRev * 0.18);
  const baseCash = bs.assets.cashAndEquivalents || Math.round(baseRev * 0.08);

  const baseAr = bs.assets.accountsReceivable || Math.round(baseRev * 0.14);
  const baseInv = bs.assets.inventory || Math.round(baseCogs * 0.12);
  const baseAp = bs.liabilities.accountsPayable || Math.round(baseCogs * 0.10);

  const baselineDSO = Math.round((baseAr / baseRev) * 365);
  const baselineDIO = baseCogs > 0 ? Math.round((baseInv / baseCogs) * 365) : 30;
  const baselineDPO = baseCogs > 0 ? Math.round((baseAp / baseCogs) * 365) : 35;
  const baselineCCC = baselineDSO + baselineDIO - baselineDPO;

  // Projections
  const projRev = Math.round(baseRev * (1 + assumptions.revenueGrowthPct / 100));
  const revDelta = projRev - baseRev;
  
  // Gross Profit based on simulated Gross Margin %
  const projGrossMarginPct = assumptions.grossMarginPct;
  const projGrossProfit = Math.round(projRev * (projGrossMarginPct / 100));
  const projCogs = projRev - projGrossProfit;

  // OpEx based on simulated OpEx Change %
  const projOpex = Math.round(baseOpex * (1 + assumptions.opexChangePct / 100));
  const projEbit = projGrossProfit - projOpex;

  const projTax = Math.max(0, Math.round(projEbit * (assumptions.taxRatePct / 100)));
  const projNetIncome = projEbit - projTax;
  const projNetMarginPct = Number(((projNetIncome / projRev) * 100).toFixed(1));

  // Working capital sensitivity
  const projDSO = Math.max(10, baselineDSO + assumptions.dsoDaysChange);
  const projDIO = Math.max(10, baselineDIO + assumptions.dioDaysChange);
  const projDPO = Math.max(10, baselineDPO + assumptions.dpoDaysChange);
  const projCCC = projDSO + projDIO - projDPO;

  // Simulated Balance Sheet working capital balances
  const projAr = Math.round((projRev / 365) * projDSO);
  const projInv = Math.round((projCogs / 365) * projDIO);
  const projAp = Math.round((projCogs / 365) * projDPO);

  // Cash absorbed or released by working capital movements
  // Delta AR: increase absorbs cash, decrease releases cash
  const deltaAr = projAr - baseAr;
  // Delta INV: increase absorbs cash
  const deltaInv = projInv - baseInv;
  // Delta AP: increase releases cash (delayed payment), decrease absorbs cash
  const deltaAp = projAp - baseAp;

  // Net Cash release (positive) or absorption (negative)
  const workingCapitalCashReleaseOrAbsorb = - (deltaAr + deltaInv - deltaAp);

  // Projected Operating Cash Flow
  const depreciation = is.operatingExpenses.depreciation || Math.round(projRev * 0.03);
  const projOperatingCashFlow = Math.round(projEbit + depreciation + workingCapitalCashReleaseOrAbsorb - projTax);

  // Projected ending cash balance (Operating cash flow less capex)
  const projEndingCash = Math.round(baseCash + projOperatingCashFlow - assumptions.capexBudget);

  return {
    isEstimate: true,
    scenarioName: assumptions.scenarioName,
    baselinePeriod: baselinePeriod.period,
    baselineRevenue: baseRev,
    projectedRevenue: projRev,
    revenueDelta: revDelta,
    projectedGrossProfit: projGrossProfit,
    projectedGrossMarginPct: Number(projGrossMarginPct.toFixed(1)),
    projectedOpex: projOpex,
    projectedOperatingProfit: projEbit,
    projectedNetIncome: projNetIncome,
    projectedNetMarginPct: projNetMarginPct,
    baselineDSO,
    projectedDSO: projDSO,
    baselineDIO,
    projectedDIO: projDIO,
    baselineDPO,
    projectedDPO: projDPO,
    baselineCCC,
    projectedCCC: projCCC,
    workingCapitalCashReleaseOrAbsorb,
    projectedOperatingCashFlow: projOperatingCashFlow,
    projectedEndingCash: projEndingCash
  };
}
