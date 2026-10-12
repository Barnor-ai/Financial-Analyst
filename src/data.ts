/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserProfile, PeriodFinancialData, FinancialAnalysisReport, BudgetVsActual, BusinessEntity, SavedAnalysisRecord } from './types';

export const SUPPORTED_CURRENCIES = [
  { code: 'USD ($)', name: 'US Dollar' },
  { code: 'EUR (€)', name: 'Euro' },
  { code: 'GBP (£)', name: 'British Pound' },
  { code: 'CAD ($)', name: 'Canadian Dollar' },
  { code: 'AUD ($)', name: 'Australian Dollar' },
  { code: 'SGD ($)', name: 'Singapore Dollar' },
  { code: 'CHF (Fr)', name: 'Swiss Franc' },
  { code: 'JPY (¥)', name: 'Japanese Yen' },
  { code: 'GHS (GH₵)', name: 'Ghana Cedi' },
  { code: 'NGN (₦)', name: 'Nigerian Naira' },
  { code: 'KES (KSh)', name: 'Kenyan Shilling' },
  { code: 'ZAR (R)', name: 'South African Rand' },
  { code: 'INR (₹)', name: 'Indian Rupee' },
  { code: 'AED (د.إ)', name: 'UAE Dirham' }
];

export const GLOBAL_CURRENCIES = SUPPORTED_CURRENCIES.map(c => c.code);

export const SUPPORTED_COUNTRIES = [
  'United States',
  'United Kingdom',
  'Canada',
  'Germany',
  'France',
  'Switzerland',
  'Singapore',
  'Australia',
  'Japan',
  'Ghana',
  'Nigeria',
  'Kenya',
  'South Africa',
  'United Arab Emirates',
  'India'
];

export const INDUSTRY_SECTORS = [
  'Enterprise SaaS / Technology',
  'Manufacturing & Industrial',
  'E-Commerce & Retail',
  'Healthcare & Life Sciences',
  'Financial Services & Fintech',
  'Supply Chain & Logistics',
  'Energy & Infrastructure',
  'Professional Services & Advisory',
  'Agriculture & Agribusiness',
  'Consumer Goods & FMCG',
  'Hospitality & Real Estate'
];

/**
 * Standard Demonstration Entity: Meridian Global Enterprises Inc.
 * Professional multi-period enterprise model illustrating SaaS / Corporate financials:
 * - Revenue: $101.3M (+53.0%)
 * - Net Income: $8.84M (+141.0%)
 * - Accounts Receivable: $1.6M
 * - Current Ratio: 6.89
 * - Equity Ratio: 86.0%
 * - Gross Margin: 24.9%
 * - Risk Assessment: 4.0 / 10
 */
export const SAMPLE_COMPANY_PROFILE: UserProfile = {
  companyName: 'Meridian Global Enterprises',
  entityCode: 'MGE-CORP-01',
  registrationNumber: 'CORP-84729103-US',
  industry: 'Enterprise SaaS / Technology',
  location: 'United States',
  currency: 'USD ($)',
  financialYearEnd: 'December 31',
  reportingBasis: 'US GAAP',
  description: 'Global multi-segment enterprise providing digital workflow software, infrastructure services, and hardware solutions.',
  logoText: 'M'
};

export const SAMPLE_FINANCIAL_PERIODS: PeriodFinancialData[] = [
  {
    period: 'FY2025',
    incomeStatement: {
      revenue: 101304393,
      cogs: 76076013,
      grossProfit: 25228380,
      operatingExpenses: {
        salaries: 4500000,
        marketing: 1850000,
        rentAndUtilities: 1100000,
        depreciation: 800000,
        otherOpEx: 733143,
        total: 8983143
      },
      operatingIncome: 16245237,
      growthLevy: 232734,
      interestExpense: 0,
      taxExpense: 7170670,
      netIncome: 8841833
    },
    balanceSheet: {
      assets: {
        cashAndEquivalents: 12500000,
        accountsReceivable: 1600000,
        inventory: 8400000,
        prepaidExpenses: 500000,
        totalCurrentAssets: 23000000,
        propertyPlantEquipment: 18200000,
        intangibleAssets: 1200000,
        totalNonCurrentAssets: 19400000,
        totalAssets: 42400000
      },
      liabilities: {
        accountsPayable: 2400000,
        shortTermDebt: 600000,
        accruedLiabilities: 338167,
        totalCurrentLiabilities: 3338167,
        longTermDebt: 2600000,
        totalNonCurrentLiabilities: 2600000,
        totalLiabilities: 5938167
      },
      equity: {
        commonStock: 10000000,
        retainedEarnings: 26461833,
        totalEquity: 36461833
      }
    },
    cashFlow: {
      operatingCashFlow: 14800000,
      investingCashFlow: -4200000,
      financingCashFlow: -2900000,
      netCashFlow: 7700000,
      endingCashBalance: 12500000
    }
  },
  {
    period: 'FY2024',
    incomeStatement: {
      revenue: 66194173,
      cogs: 54924963,
      grossProfit: 11269210,
      operatingExpenses: {
        salaries: 2958580,
        marketing: 1200000,
        rentAndUtilities: 850000,
        depreciation: 600000,
        otherOpEx: 500244,
        total: 6108824
      },
      operatingIncome: 5160386,
      growthLevy: 356389,
      interestExpense: 0,
      taxExpense: 1135604,
      netIncome: 3668393
    },
    balanceSheet: {
      assets: {
        cashAndEquivalents: 4800000,
        accountsReceivable: 1200000,
        inventory: 5100000,
        prepaidExpenses: 300000,
        totalCurrentAssets: 11400000,
        propertyPlantEquipment: 15400000,
        intangibleAssets: 800000,
        totalNonCurrentAssets: 16200000,
        totalAssets: 27600000
      },
      liabilities: {
        accountsPayable: 1800000,
        shortTermDebt: 400000,
        accruedLiabilities: 200000,
        totalCurrentLiabilities: 2400000,
        longTermDebt: 3200000,
        totalNonCurrentLiabilities: 3200000,
        totalLiabilities: 5600000
      },
      equity: {
        commonStock: 10000000,
        retainedEarnings: 12000000,
        totalEquity: 22000000
      }
    },
    cashFlow: {
      operatingCashFlow: 5200000,
      investingCashFlow: -2800000,
      financingCashFlow: -1100000,
      netCashFlow: 1300000,
      endingCashBalance: 4800000
    }
  }
];

export const SAMPLE_ANALYSIS_REPORT: FinancialAnalysisReport = {
  executiveSummary: "Meridian Global Enterprises achieved exceptional profitability in FY2025, with net income more than doubling to $8.84M from $3.67M in the prior year (+141.0%). This stellar performance was underpinned by a commercial expansion of top-line revenue growth (+53.0%) and significant margin expansion at both the gross and operating levels. The company demonstrated textbook operating leverage, with profits expanding at nearly triple the rate of top-line sales.",
  financialHealthScore: 7, // Risk score 4.0 / 10
  profitabilityAnalysis: "Gross margin expanded by 740 basis points to 24.9%, driven by high-margin software subscriptions (+91.6%) and enterprise license expansion (+110.8%). Operating margins surged to 16.0% from 7.8% as revenue growth vastly outpaced overhead escalations.",
  liquidityAnalysis: "Liquidity remains robust with a Current Ratio of 6.89 and Quick Ratio of 4.37. Net working capital stands at $19.66M, supported by substantial ending cash reserves of $12.5M.",
  cashFlowAnalysis: "Operating cash flow expanded nearly threefold to $14.8M. Capital investments in infrastructure (-$4.2M) and debt amortisation (-$2.9M) were fully funded by internal operating cash generation.",
  debtAndRiskAnalysis: "Financial leverage is highly conservative. Debt-to-Equity is 0.16 (total debt of $3.2M vs $36.46M book equity). Equity ratio stands at 86.0%, providing substantial solvency cushion.",
  revenueDrivers: "Revenue expansion was broad-based across core operating units. The largest contributor was the Enterprise Subscriptions division (+91.6%), followed by Professional Services (+81.8%) and Software Licensing (+110.8%). While legacy hardware sales showed slight moderation (-4.7%), high-margin recurring segments delivered 53.0% overall top-line acceleration.",
  costDrivers: "Cost of Goods Sold (COGS) rose by 38.5%, a rate significantly below revenue growth (+53.0%), which drove gross margin expansion. Operating expenses increased by a disciplined 47.1%, primarily reflecting strategic investments in technical talent (salaries +52.1%) and customer acquisition logistics.",
  marginCommentary: "Profit margins showed dramatic structural improvement. Gross margin expanded by 740 basis points, from 17.5% in 2024 to 24.9% in 2025. Consequently, net profit margin climbed from 5.5% to 8.7%, despite a higher effective tax drag, confirming pricing power and cost discipline.",
  keyTakeaways: [
    "Accelerated revenue growth of 53.0% to $101.3M.",
    "Gross margin expansion of 740 bps from 17.5% to 24.9%.",
    "Net income more than doubled, increasing by 141.0% to $8.84M.",
    "Strong operating leverage with operating profit expanding 152.1%."
  ],
  lineItemExplanations: {
    revenue: "Why: Revenue saw a remarkable 53.0% increase, driven by strong growth in enterprise cloud subscriptions (+91.6%), platform integrations (+81.8%) and premium recurring tiers (+110.8%).",
    cogs: "Why: COGS increased by 38.5% due to higher service delivery volumes. The slower growth rate relative to revenue highlights improved cloud hosting efficiencies and favorable product mix towards high-margin software.",
    grossProfit: "Why: Gross profit surged by 118.5%, directly reflecting top-line growth outpacing direct cost of delivery.",
    operatingExpenses: "Why: Operating expenses grew by 47.1%, primarily due to targeted head count expansion (+52.1%) and customer acquisition programs (+54.2%) to support global scaling.",
    operatingIncome: "Why: Operating income grew by 152.1%, far outstripping revenue growth and proving operating leverage.",
    growthLevy: "Why: Government and municipal levies adjusted proportionally with higher taxable earnings.",
    taxExpense: "Why: Corporate tax charge grew alongside the significant rise in pre-tax operating earnings.",
    netIncome: "Why: Despite higher tax provisions, net income expanded by 141.0%, boosting retained earnings and total balance sheet equity."
  },
  ratiosAnalysisTable: [
    { ratioName: 'Gross Profit Margin', values: { 'FY2025': '24.9%', 'FY2024': '17.0%' }, benchmark: '20.0%', status: 'optimal' },
    { ratioName: 'Operating Margin', values: { 'FY2025': '16.0%', 'FY2024': '7.8%' }, benchmark: '12.0%', status: 'optimal' },
    { ratioName: 'Net Profit Margin', values: { 'FY2025': '8.7%', 'FY2024': '5.5%' }, benchmark: '7.0%', status: 'optimal' },
    { ratioName: 'Current Ratio', values: { 'FY2025': '6.89', 'FY2024': '4.75' }, benchmark: '2.00', status: 'optimal' },
    { ratioName: 'Equity Ratio', values: { 'FY2025': '86.0%', 'FY2024': '79.7%' }, benchmark: '50.0%', status: 'optimal' },
    { ratioName: 'Debt-to-Equity Ratio', values: { 'FY2025': '0.16', 'FY2024': '0.25' }, benchmark: '0.80', status: 'optimal' }
  ],
  redFlags: [
    'Effective tax drag rose due to statutory adjustments on higher pre-tax profits; optimize cross-jurisdictional credits.',
    'Marketing and acquisition spend escalated by 54.2%; institute cohort-level CAC/LTV payback guardrails.',
    'Working capital cash conversion cycle should be actively tracked as accounts receivable scale to $1.6M.'
  ],
  recommendations: [
    'Lock in enterprise multi-year subscription commitments to protect forward operating margins.',
    'Deploy non-operating surplus liquidity into short-duration yield instruments or high-ROI product R&D.',
    'Formalize credit terms on trade debtors to maintain current collection efficiency (DSO ~ 5.8 days).'
  ],
  strategicAdvice: [
    'Expand direct sales coverage across Tier-1 enterprise accounts to drive recurring net retention.',
    'Leverage strong balance sheet equity (86%) for accretive bolt-on technology acquisitions.',
    'Maintain conservative debt profile given current macroeconomic cost-of-capital environment.'
  ],
  conclusion: 'Meridian Global Enterprises demonstrates outstanding commercial execution and operating leverage in FY2025. With robust cash balances, minimal debt exposure, and widening margins, the business is exceptionally well-positioned for sustainable global growth.'
};

export const SAMPLE_BUDGET_PERFORMANCE: BudgetVsActual[] = [
  { category: 'Revenue', budgeted: 95000000, actual: 101304393, variance: 6304393, variancePercentage: 6.6 },
  { category: 'Cost of Sales (COGS)', budgeted: 71250000, actual: 76076013, variance: 4826013, variancePercentage: 6.8 },
  { category: 'Salaries & Payroll', budgeted: 4800000, actual: 4500000, variance: -300000, variancePercentage: -6.3 },
  { category: 'Marketing & Promos', budgeted: 1600000, actual: 1850000, variance: 250000, variancePercentage: 15.6 },
  { category: 'Facilities & Utilities', budgeted: 1200000, actual: 1100000, variance: -100000, variancePercentage: -8.3 },
  { category: 'Administrative Overheads', budgeted: 1500000, actual: 1533143, variance: 33143, variancePercentage: 2.2 }
];

export const DEFAULT_BUSINESS_ENTITIES: BusinessEntity[] = [
  {
    id: 'ent-meridian-global',
    organisationId: 'org-enterprise-holdings',
    name: 'Meridian Global Enterprises',
    code: 'MGE-CORP-01',
    industry: 'Enterprise SaaS / Technology',
    currency: 'USD ($)',
    reportingBasis: 'US GAAP',
    location: 'United States',
    financialYearEnd: 'December 31',
    registrationNumber: 'CORP-84729103-US',
    description: 'Global multi-segment enterprise providing digital workflow software, infrastructure services, and hardware solutions.',
    createdAt: '2025-01-15T08:00:00Z'
  },
  {
    id: 'ent-apex-global-us',
    organisationId: 'org-apex-group',
    name: 'Apex Global Corp',
    code: 'APEX-US-HQ',
    industry: 'Enterprise SaaS / Technology',
    currency: 'USD ($)',
    reportingBasis: 'US GAAP',
    location: 'United States',
    financialYearEnd: 'December 31',
    registrationNumber: 'DE-7829103-LLC',
    description: 'B2B enterprise SaaS cloud software and analytics subscriptions.',
    createdAt: '2025-03-20T10:00:00Z'
  },
  {
    id: 'ent-summit-industrial',
    organisationId: 'org-enterprise-holdings',
    name: 'Summit Industrial Solutions',
    code: 'SIS-EU-02',
    industry: 'Manufacturing & Industrial',
    currency: 'EUR (€)',
    reportingBasis: 'IFRS',
    location: 'Germany',
    financialYearEnd: 'December 31',
    registrationNumber: 'DE-92817264-HRB',
    description: 'Precision industrial equipment, supply-chain components, and engineering services.',
    createdAt: '2025-06-10T09:30:00Z'
  }
];

export function createEmptyComparativePeriods(year: string = '2025'): PeriodFinancialData[] {
  const prevYear = String(Number(year) - 1 || 2024);
  const currentYear = year;

  return [
    {
      period: currentYear,
      incomeStatement: {
        revenue: 0,
        cogs: 0,
        grossProfit: 0,
        operatingExpenses: { salaries: 0, marketing: 0, rentAndUtilities: 0, depreciation: 0, otherOpEx: 0, total: 0 },
        operatingIncome: 0,
        growthLevy: 0,
        interestExpense: 0,
        taxExpense: 0,
        netIncome: 0
      },
      balanceSheet: {
        assets: { cashAndEquivalents: 0, accountsReceivable: 0, inventory: 0, prepaidExpenses: 0, totalCurrentAssets: 0, propertyPlantEquipment: 0, intangibleAssets: 0, totalNonCurrentAssets: 0, totalAssets: 0 },
        liabilities: { accountsPayable: 0, shortTermDebt: 0, accruedLiabilities: 0, totalCurrentLiabilities: 0, longTermDebt: 0, totalNonCurrentLiabilities: 0, totalLiabilities: 0 },
        equity: { commonStock: 0, retainedEarnings: 0, totalEquity: 0 }
      },
      cashFlow: { operatingCashFlow: 0, investingCashFlow: 0, financingCashFlow: 0, netCashFlow: 0, endingCashBalance: 0 }
    },
    {
      period: prevYear,
      incomeStatement: {
        revenue: 0,
        cogs: 0,
        grossProfit: 0,
        operatingExpenses: { salaries: 0, marketing: 0, rentAndUtilities: 0, depreciation: 0, otherOpEx: 0, total: 0 },
        operatingIncome: 0,
        growthLevy: 0,
        interestExpense: 0,
        taxExpense: 0,
        netIncome: 0
      },
      balanceSheet: {
        assets: { cashAndEquivalents: 0, accountsReceivable: 0, inventory: 0, prepaidExpenses: 0, totalCurrentAssets: 0, propertyPlantEquipment: 0, intangibleAssets: 0, totalNonCurrentAssets: 0, totalAssets: 0 },
        liabilities: { accountsPayable: 0, shortTermDebt: 0, accruedLiabilities: 0, totalCurrentLiabilities: 0, longTermDebt: 0, totalNonCurrentLiabilities: 0, totalLiabilities: 0 },
        equity: { commonStock: 0, retainedEarnings: 0, totalEquity: 0 }
      },
      cashFlow: { operatingCashFlow: 0, investingCashFlow: 0, financingCashFlow: 0, netCashFlow: 0, endingCashBalance: 0 }
    }
  ];
}

export function createEmptyBudget(): BudgetVsActual[] {
  return [
    { category: 'Revenue', budgeted: 0, actual: 0, variance: 0, variancePercentage: 0 },
    { category: 'Cost of Sales (COGS)', budgeted: 0, actual: 0, variance: 0, variancePercentage: 0 },
    { category: 'Salaries & Payroll', budgeted: 0, actual: 0, variance: 0, variancePercentage: 0 },
    { category: 'Marketing & Promos', budgeted: 0, actual: 0, variance: 0, variancePercentage: 0 },
    { category: 'Facilities & Utilities', budgeted: 0, actual: 0, variance: 0, variancePercentage: 0 },
    { category: 'Administrative Overheads', budgeted: 0, actual: 0, variance: 0, variancePercentage: 0 }
  ];
}

export const SAMPLE_SAVED_REPORTS: SavedAnalysisRecord[] = [
  {
    id: 'rep-fy2025-mge',
    companyName: 'Meridian Global Enterprises',
    organizationId: 'org-enterprise-holdings',
    reportTitle: 'FY2025 Comprehensive CFO Financial Health Assessment',
    periodLabel: 'Annually · Jan - Dec 2025',
    periodFrequency: 'Annually',
    financialYear: '2025',
    reportCategory: 'Financial Health Assessment',
    department: 'Corporate Finance & Treasury',
    branch: 'North America HQ',
    costCentre: 'CC-100 Corporate',
    tags: ['board-pack', 'audit-ready', 'fy2025-close', 'ebitda-expansion'],
    reportLanguage: 'English',
    isFavorite: true,
    isArchived: false,
    availableExportFormats: ['PDF', 'Word', 'Excel'],
    versions: [
      {
        versionNumber: 2,
        updatedAt: '2026-08-30T14:20:00Z',
        updatedBy: 'sarah.cfo@meridian.com',
        changeSummary: 'Updated working capital reconciliation, debtor days sensitivity, and DuPont multiplier'
      },
      {
        versionNumber: 1,
        updatedAt: '2026-08-29T10:30:00Z',
        updatedBy: 'analyst@finscope.ai',
        changeSummary: 'Initial automated generation from US GAAP audited trial balance'
      }
    ],
    analysisType: 'Comprehensive Health & Solvency',
    status: 'completed',
    riskScore: 4.0,
    riskScoreText: 'Risk 4.0/10 (Low-Moderate)',
    currency: 'USD ($)',
    periods: SAMPLE_FINANCIAL_PERIODS,
    analysisReport: SAMPLE_ANALYSIS_REPORT,
    budgetPerformance: SAMPLE_BUDGET_PERFORMANCE,
    createdAt: '2026-08-29T10:30:00Z',
    updatedAt: '2026-08-30T14:20:00Z',
    createdBy: 'sarah.cfo@meridian.com'
  },
  {
    id: 'rep-fy2024-audited',
    companyName: 'Meridian Global Enterprises',
    organizationId: 'org-enterprise-holdings',
    reportTitle: 'FY2024 Audited Management Accounts Review',
    periodLabel: 'Annually · Jan - Dec 2024',
    periodFrequency: 'Annually',
    financialYear: '2024',
    reportCategory: 'Management Account Review',
    department: 'Finance & Accounting',
    branch: 'North America HQ',
    costCentre: 'CC-100 Corporate',
    tags: ['audited', 'statutory', 'pwc-signed', 'historical'],
    reportLanguage: 'English',
    isFavorite: false,
    isArchived: false,
    availableExportFormats: ['PDF', 'Word', 'Excel'],
    versions: [
      {
        versionNumber: 1,
        updatedAt: '2025-03-15T09:00:00Z',
        updatedBy: 'auditor@pwc.com',
        changeSummary: 'Final statutory signed audit accounts and board clearance'
      }
    ],
    analysisType: 'Audited Financial Review',
    status: 'completed',
    riskScore: 4.8,
    riskScoreText: 'Risk 4.8/10 (Moderate)',
    currency: 'USD ($)',
    periods: [SAMPLE_FINANCIAL_PERIODS[1]],
    analysisReport: {
      ...SAMPLE_ANALYSIS_REPORT,
      executiveSummary: 'FY2024 concluded with steady revenue generation of $66.2M and operating profit of $6.44M. Liquidity was conservatively managed with zero default risk.',
      financialHealthScore: 6
    },
    budgetPerformance: SAMPLE_BUDGET_PERFORMANCE,
    createdAt: '2025-03-15T09:00:00Z',
    updatedAt: '2025-03-15T09:00:00Z',
    createdBy: 'auditor@pwc.com'
  },
  {
    id: 'rep-q3-2025-bva',
    companyName: 'Meridian Global Enterprises',
    organizationId: 'org-enterprise-holdings',
    reportTitle: 'Q3 2025 Budget vs Actual Variance Investigation',
    periodLabel: 'Quarterly · Q3 2025',
    periodFrequency: 'Quarterly',
    financialYear: '2025',
    reportCategory: 'Budget vs Actual Analysis',
    department: 'Sales & Marketing',
    branch: 'North America HQ',
    costCentre: 'CC-250 Sales Operations',
    tags: ['variance-alert', 'opex-overrun', 'q3-review', 'board-prep'],
    reportLanguage: 'English',
    isFavorite: true,
    isArchived: false,
    availableExportFormats: ['PDF', 'Word', 'Excel'],
    versions: [
      {
        versionNumber: 1,
        updatedAt: '2025-10-04T16:45:00Z',
        updatedBy: 'james.controller@meridian.com',
        changeSummary: 'Root-cause analysis on $1.2M marketing and personnel expense overrun'
      }
    ],
    analysisType: 'Variance Deep-Dive',
    status: 'completed',
    riskScore: 5.2,
    riskScoreText: 'Risk 5.2/10 (Elevated)',
    currency: 'USD ($)',
    periods: SAMPLE_FINANCIAL_PERIODS,
    analysisReport: {
      ...SAMPLE_ANALYSIS_REPORT,
      executiveSummary: 'Q3 performance highlighted an adverse operating expense variance of +$1.2M against allocated budget, primarily driven by expedited digital campaign rollout.',
      financialHealthScore: 5
    },
    budgetPerformance: SAMPLE_BUDGET_PERFORMANCE,
    createdAt: '2025-10-04T16:45:00Z',
    updatedAt: '2025-10-04T16:45:00Z',
    createdBy: 'james.controller@meridian.com'
  },
  {
    id: 'rep-cashflow-2025',
    companyName: 'Meridian Global Enterprises',
    organizationId: 'org-enterprise-holdings',
    reportTitle: 'FY2025 Liquidity Stress Test & Cash Conversion Assessment',
    periodLabel: 'Annually · Jan - Dec 2025',
    periodFrequency: 'Annually',
    financialYear: '2025',
    reportCategory: 'Cash Flow & Liquidity',
    department: 'Corporate Finance & Treasury',
    branch: 'Global Consolidated',
    costCentre: 'CC-120 Treasury',
    tags: ['liquidity', 'working-capital', 'cash-conversion-cycle', 'treasury'],
    reportLanguage: 'English',
    isFavorite: false,
    isArchived: false,
    availableExportFormats: ['PDF', 'Excel'],
    versions: [
      {
        versionNumber: 1,
        updatedAt: '2026-09-02T11:15:00Z',
        updatedBy: 'sarah.cfo@meridian.com',
        changeSummary: 'Liquidity buffer stress scenarios under 30-day debtor delay assumptions'
      }
    ],
    analysisType: 'Cash Flow Diagnostic',
    status: 'completed',
    riskScore: 3.5,
    riskScoreText: 'Risk 3.5/10 (Optimal)',
    currency: 'USD ($)',
    periods: SAMPLE_FINANCIAL_PERIODS,
    analysisReport: {
      ...SAMPLE_ANALYSIS_REPORT,
      executiveSummary: 'Cash generation of $14.8M operating cash flow comfortably outpaced Capex requirements of $4.2M, maintaining high solvency cushion.',
      financialHealthScore: 8
    },
    budgetPerformance: SAMPLE_BUDGET_PERFORMANCE,
    createdAt: '2026-09-02T11:15:00Z',
    updatedAt: '2026-09-02T11:15:00Z',
    createdBy: 'sarah.cfo@meridian.com'
  },
  {
    id: 'rep-apex-saas-2025',
    companyName: 'Apex Global Corp',
    organizationId: 'org-apex-group',
    reportTitle: 'Apex Global Corp FY2025 SaaS Unit Economics & Margins',
    periodLabel: 'Annually · Jan - Dec 2025',
    periodFrequency: 'Annually',
    financialYear: '2025',
    reportCategory: 'Management Account Review',
    department: 'Software Engineering & Cloud',
    branch: 'US West Hub',
    costCentre: 'CC-400 Software Engineering',
    tags: ['saas-metrics', 'gross-margin', 'arr-growth', 'subscription'],
    reportLanguage: 'English',
    isFavorite: false,
    isArchived: false,
    availableExportFormats: ['PDF', 'Word', 'Excel'],
    versions: [
      {
        versionNumber: 1,
        updatedAt: '2026-07-12T08:30:00Z',
        updatedBy: 'elena.fpna@apex.com',
        changeSummary: 'Consolidated subscription ARR cohort review and gross margin waterfall'
      }
    ],
    analysisType: 'SaaS Margin Review',
    status: 'completed',
    riskScore: 3.2,
    riskScoreText: 'Risk 3.2/10 (Prime)',
    currency: 'USD ($)',
    periods: [
      {
        period: 'FY2025',
        incomeStatement: {
          revenue: 42500000,
          cogs: 9350000,
          grossProfit: 33150000,
          operatingExpenses: { salaries: 14200000, marketing: 8500000, rentAndUtilities: 1200000, depreciation: 800000, otherOpEx: 950000, total: 25650000 },
          operatingIncome: 7500000,
          growthLevy: 0,
          interestExpense: 120000,
          taxExpense: 1549800,
          netIncome: 5830200
        },
        balanceSheet: {
          assets: { cashAndEquivalents: 18400000, accountsReceivable: 4100000, inventory: 0, prepaidExpenses: 650000, totalCurrentAssets: 23150000, propertyPlantEquipment: 2400000, intangibleAssets: 5100000, totalNonCurrentAssets: 7500000, totalAssets: 30650000 },
          liabilities: { accountsPayable: 1850000, shortTermDebt: 0, accruedLiabilities: 1200000, totalCurrentLiabilities: 3050000, longTermDebt: 2100000, totalNonCurrentLiabilities: 2100000, totalLiabilities: 5150000 },
          equity: { commonStock: 12000000, retainedEarnings: 13500000, totalEquity: 25500000 }
        },
        cashFlow: { operatingCashFlow: 8900000, investingCashFlow: -1800000, financingCashFlow: -500000, netCashFlow: 6600000, endingCashBalance: 18400000 }
      }
    ],
    analysisReport: {
      ...SAMPLE_ANALYSIS_REPORT,
      executiveSummary: 'Apex Global Corp delivered stellar 78.0% gross margins with $5.83M net profit, maintaining $18.4M in cash reserves.',
      financialHealthScore: 8
    },
    budgetPerformance: SAMPLE_BUDGET_PERFORMANCE,
    createdAt: '2026-07-12T08:30:00Z',
    updatedAt: '2026-07-12T08:30:00Z',
    createdBy: 'elena.fpna@apex.com'
  },
  {
    id: 'rep-emea-cost-centre',
    companyName: 'Meridian Global Enterprises',
    organizationId: 'org-enterprise-holdings',
    reportTitle: 'EMEA Operations Q2 2025 Branch Cost Performance & Freight',
    periodLabel: 'Quarterly · Q2 2025',
    periodFrequency: 'Quarterly',
    financialYear: '2025',
    reportCategory: 'Variance Investigation',
    department: 'EMEA Operations',
    branch: 'EMEA Operations',
    costCentre: 'CC-310 Logistics',
    tags: ['emea', 'branch-accounting', 'freight-variance', 'logistics'],
    reportLanguage: 'French',
    isFavorite: false,
    isArchived: true, // Demonstrates Archive filter!
    availableExportFormats: ['PDF', 'Word', 'Excel'],
    versions: [
      {
        versionNumber: 1,
        updatedAt: '2025-07-19T14:10:00Z',
        updatedBy: 'pierre.emea@meridian.com',
        changeSummary: 'Branch cost center performance and EUR exchange drag reconciliation'
      }
    ],
    analysisType: 'Branch Ledger Audit',
    status: 'in_review',
    riskScore: 6.1,
    riskScoreText: 'Risk 6.1/10 (Elevated Cost Risk)',
    currency: 'EUR (€)',
    periods: SAMPLE_FINANCIAL_PERIODS,
    analysisReport: {
      ...SAMPLE_ANALYSIS_REPORT,
      executiveSummary: 'EMEA logistical branch costs rose 14.2% above initial plan due to cross-border transit tariffs and fuel surcharges.',
      financialHealthScore: 5
    },
    budgetPerformance: SAMPLE_BUDGET_PERFORMANCE,
    createdAt: '2025-07-19T14:10:00Z',
    updatedAt: '2025-07-19T14:10:00Z',
    createdBy: 'pierre.emea@meridian.com'
  }
];
