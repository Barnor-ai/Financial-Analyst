/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PeriodFinancialData, BudgetVsActual, FinancialRatios, UserProfile, FinancialAnalysisReport } from './types';
import { calculateFinancialRatios } from './utils/financialEngine';

// Backward compatibility ratio calculation export
export function calculateRatios(data: PeriodFinancialData): FinancialRatios {
  return calculateFinancialRatios(data);
}

// Global currencies including comprehensive Africa-focused and global representation
export const SUPPORTED_CURRENCIES = [
  { code: 'GHS (GH₵)', symbol: 'GH₵', name: 'Ghanaian Cedi' },
  { code: 'USD ($)', symbol: '$', name: 'US Dollar' },
  { code: 'EUR (€)', symbol: '€', name: 'Euro' },
  { code: 'GBP (£)', symbol: '£', name: 'British Pound' },
  { code: 'ZAR (R)', symbol: 'R', name: 'South African Rand' },
  { code: 'NGN (₦)', symbol: '₦', name: 'Nigerian Naira' },
  { code: 'KES (KSh)', symbol: 'KSh', name: 'Kenyan Shilling' },
  { code: 'EGP (E£)', symbol: 'E£', name: 'Egyptian Pound' },
  { code: 'XOF (CFA)', symbol: 'CFA', name: 'West African CFA Franc' },
  { code: 'CAD ($)', symbol: '$', name: 'Canadian Dollar' },
  { code: 'AUD ($)', symbol: '$', name: 'Australian Dollar' },
  { code: 'CHF (CHF)', symbol: 'CHF', name: 'Swiss Franc' },
  { code: 'AED (DH)', symbol: 'DH', name: 'Emirati Dirham' }
];

export const SUPPORTED_COUNTRIES = [
  'Ghana', 'Nigeria', 'South Africa', 'Kenya', 'Egypt', 'Morocco', 
  'United States', 'United Kingdom', 'Canada', 'Germany', 'France', 
  'United Arab Emirates', 'Singapore', 'Australia'
];

/**
 * Flagship Reference Company: M/J Agro
 * Exactly matching the figures and ratios presented in the reference video:
 * - Revenue: GHS 101M (+53.0%)
 * - Net Income: GHS 8.8M (+141.0%)
 * - Accounts Receivable: GHS 1.6M
 * - Current Ratio: 6.89
 * - Equity Ratio: 86.0%
 * - Gross Margin: 24.9%
 * - Avg Risk Score: 4.0 (Risk 4/10)
 */
export const MJ_AGRO_PROFILE: UserProfile = {
  companyName: 'M/J Agro',
  industry: 'Agriculture',
  location: 'Ghana',
  currency: 'GHS (GH₵)',
  financialYearEnd: 'December 31',
  reportingBasis: 'IFRS',
  description: 'Agricultural commodities, agro-fertilisers, seed distribution and farm input supplies.',
  logoText: 'M'
};

export const MJ_AGRO_PERIODS: PeriodFinancialData[] = [
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

export const MJ_AGRO_ANALYSIS: FinancialAnalysisReport = {
  executiveSummary: "M/J Agro achieved exceptional profitability in FY2025, with net income more than doubling to GHS 8.84M from GHS 3.67M in the prior year. This stellar performance was underpinned by a commercial avalanche of top-line revenue growth and significant margin expansion at both the gross and operating levels. The company demonstrated remarkable operating leverage, with profits growing at a much faster rate than sales, indicating an efficient and scalable business model.",
  financialHealthScore: 7, // Risk score 4.0 / 10
  profitabilityAnalysis: "Gross margin expanded by 740 basis points to 24.9%, driven by high-margin agro-fertilisers (+91.6%) and seed sales (+110.8%). Operating margins surged to 16.0% from 7.8% as revenue growth vastly outpaced overhead increases.",
  liquidityAnalysis: "Liquidity remains robust with a Current Ratio of 6.89 and Quick Ratio of 4.37. Working capital stands at GHS 19.66M, supported by substantial ending cash reserves of GHS 12.5M.",
  cashFlowAnalysis: "Operating cash flow expanded nearly threefold to GHS 14.8M. Capital investments in PP&E (-GHS 4.2M) and debt amortisation (-GHS 2.9M) were fully funded by internal operating cash generation.",
  debtAndRiskAnalysis: "Financial leverage is low and conservative. Debt-to-Equity is 0.16 (total debt of GHS 3.2M vs GHS 36.46M book equity). Equity ratio stands at 86.0%.",
  revenueDrivers: "Revenue expansion was broad-based, highlighting strong market penetration and demand. The largest contributor was the Agro-fertiliser division (+91.6%), followed by Farm inputs (+81.8%) and Agro-seed sales (+110.8%). While commodity sales showed slight softening (-4.7%), the higher-margin inputs segment delivered a 53.0% overall growth. This diversification reduces dependency on a single product line and signals a healthy commercial pipeline.",
  costDrivers: "Cost of Goods Sold (COGS) rose by 38.5%, a rate significantly below revenue growth, which was key to the margin improvement. Key efficiencies came from bulk fertiliser purchasing discounts, better supply-chain management, or a shift towards selling higher-margin products. Operating expenses increased by a controlled 47.1%, largely driven by necessary investments in staffing (salaries +52.1%) and logistics (fuel +131.5%) to support the expanded operations.",
  marginCommentary: "Profit margins showed dramatic improvement. Gross margin expanded by a remarkable 740 basis points, from 17.5% in 2024 to 24.9% in 2025. This was the primary engine of the profit surge. Consequently, net profit margin also saw a healthy increase, climbing from 5.5% to 8.7%, despite a higher effective tax drag. This demonstrates the company's demand-driven pricing power and cost discipline.",
  keyTakeaways: [
    "Explosive revenue growth of 53.0% to GHS 101M.",
    "Significant gross margin expansion from 17.5% to 24.9%.",
    "Net income more than doubled, increasing by 141.0% to GHS 8.8M.",
    "Strong operating leverage, with operating profit growing 152.1%."
  ],
  lineItemExplanations: {
    revenue: "Why: Revenue saw a remarkable 53.0% increase, driven by strong performance in Agro-fertiliser sales (+91.6%), Farm inputs sales (+81.8%) and Agro-seed sales (+110.8%). Commodity sales saw a modest decline of -4.7% due to lower prices.",
    cogs: "Why: COGS increased by 38.5% due to higher sales volume. The slower growth rate relative to revenue suggests improved purchasing efficiency, better cost control on direct inputs, or a favorable shift in product mix towards higher margin lines.",
    grossProfit: "Why: Gross profit surged by an impressive 118.5%. This was a direct result of revenue growing much faster than the cost of sales, leading to a substantial improvement in gross margin from 17.5% to 24.9%.",
    operatingExpenses: "Why: Operating expenses grew by 47.1%, primarily due to higher salaries (+52.1%), fuel costs (+131.5%), and administrative and depreciation (+78.2%) to support the expanded scale of operations. The increase is proportional to the business growth.",
    operatingIncome: "Why: Operating income grew by 152.1%, far outstripping revenue growth. This highlights strong operating leverage, where the company effectively controlled both direct and operating costs relative to revenue.",
    growthLevy: "Why: This government levy increased in direct proportion to pre-tax profit, reflecting the company's higher profitability.",
    taxExpense: "Why: The tax charge more than tripled, driven by the significant rise in profitability. The effective tax rate based on pre-tax profit also increased from 27.5% to 37.4%, representing a material cash tax drag.",
    netIncome: "Why: Despite a much larger tax bill, net income more than doubled, showcasing a year of outstanding profitability and successful execution. This strong bottom-line result significantly boosted retained earnings and overall equity."
  },
  ratiosAnalysisTable: [
    { ratioName: 'Gross Profit Margin', values: { 'FY2025': '24.9%', 'FY2024': '17.0%' }, benchmark: '18.0%', status: 'optimal' },
    { ratioName: 'Operating Margin', values: { 'FY2025': '16.0%', 'FY2024': '7.8%' }, benchmark: '10.0%', status: 'optimal' },
    { ratioName: 'Net Profit Margin', values: { 'FY2025': '8.7%', 'FY2024': '5.5%' }, benchmark: '6.0%', status: 'optimal' },
    { ratioName: 'Current Ratio', values: { 'FY2025': '6.89', 'FY2024': '4.75' }, benchmark: '2.00', status: 'optimal' },
    { ratioName: 'Equity Ratio', values: { 'FY2025': '86.0%', 'FY2024': '79.7%' }, benchmark: '50.0%', status: 'optimal' },
    { ratioName: 'Debt-to-Equity Ratio', values: { 'FY2025': '0.16', 'FY2024': '0.25' }, benchmark: '0.80', status: 'optimal' }
  ],
  redFlags: [
    'Effective tax rate jumped to 37.4% of pre-tax income due to statutory tax revisions and growth levies.',
    'Fuel and logistics expenses escalated 131.5%, which requires freight price hedging.',
    'Inventory accumulation increased to GHS 8.4M; monitor aging to prevent perishable spoilage.'
  ],
  recommendations: [
    'Lock in forward supply agreements for bulk fertiliser to lock in advantageous margins for FY2026.',
    'Deploy excess cash reserves into high-yield treasury bills or capital equipment discount financing.',
    'Formalize credit terms on accounts receivable to maintain current collection efficiency (DSO ~ 5.8 days).'
  ],
  strategicAdvice: [
    'Establish regional distribution hubs to mitigate third-party haulage surges.',
    'Explore value-added seed processing packaging to extend the high-margin product line.',
    'Maintain conservative debt profile given volatile macro interest rate climate.'
  ],
  conclusion: 'M/J Agro demonstrates textbook commercial execution and operating leverage in FY2025. With robust cash balances, minimal debt exposure, and widening margins, the business is exceptionally well-positioned for sustainable regional expansion.'
};

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
