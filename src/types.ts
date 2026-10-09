/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// User & Organization Roles in Multi-Tenant Architecture
export type UserRole = 'owner' | 'admin' | 'analyst' | 'viewer';

export interface Organisation {
  id: string;
  name: string;
  slug: string;
  country: string;
  currency: string;
  plan: 'starter' | 'professional' | 'enterprise';
  createdAt: string;
}

export interface OrganisationMember {
  id: string;
  organisationId: string;
  userId: string;
  email: string;
  name?: string;
  role: UserRole;
  joinedAt: string;
}

// User Configuration / Company Profile
export interface UserProfile {
  id?: string;
  companyName: string;
  registrationNumber?: string;
  industry: string;
  location: string;
  currency: string;
  financialYearEnd?: string;
  reportingBasis?: 'IFRS' | 'US GAAP' | 'Accrual Basis' | 'Cash Basis';
  description?: string;
  contactEmail?: string;
  logoUrl?: string;
  logoText?: string;
  isArchived?: boolean;
}

// Income Statement Item
export interface IncomeStatement {
  revenue: number;
  cogs: number;
  grossProfit: number;
  operatingExpenses: {
    salaries: number;
    marketing: number;
    rentAndUtilities: number;
    depreciation: number;
    otherOpEx: number;
    total: number;
  };
  operatingIncome: number; // EBIT
  growthLevy?: number; // Growth and Sustainability Levy (where applicable)
  interestExpense: number;
  taxExpense: number;
  netIncome: number;
}

// Balance Sheet Item
export interface BalanceSheet {
  assets: {
    cashAndEquivalents: number;
    accountsReceivable: number;
    inventory: number;
    prepaidExpenses: number;
    totalCurrentAssets: number;
    propertyPlantEquipment: number;
    intangibleAssets: number;
    totalNonCurrentAssets: number;
    totalAssets: number;
  };
  liabilities: {
    accountsPayable: number;
    shortTermDebt: number;
    accruedLiabilities: number;
    totalCurrentLiabilities: number;
    longTermDebt: number;
    totalNonCurrentLiabilities: number;
    totalLiabilities: number;
  };
  equity: {
    commonStock: number;
    retainedEarnings: number;
    totalEquity: number;
  };
}

// Cash Flow Statement Item
export interface CashFlowStatement {
  operatingCashFlow: number;
  investingCashFlow: number;
  financingCashFlow: number;
  netCashFlow: number;
  endingCashBalance: number;
}

// Budget vs Actual Performance
export interface BudgetVsActual {
  category: string;
  budgeted: number;
  actual: number;
  variance: number;
  variancePercentage: number;
}

// Financial Statement Data Model per Period
export interface PeriodFinancialData {
  period: string; // e.g. '2025', '2024', 'FY2025', 'Q4 2025'
  incomeStatement: IncomeStatement;
  balanceSheet: BalanceSheet;
  cashFlow: CashFlowStatement;
}

// Line Item Consultant Commentary ("Why the numbers moved")
export interface LineItemCommentary {
  lineItem: string;
  why: string;
  driverType?: 'positive' | 'neutral' | 'negative' | 'caution';
}

// Comprehensive Financial Ratios computed deterministically
export interface FinancialRatios {
  // Profitability
  grossProfitMargin: number;
  netProfitMargin: number;
  operatingMargin: number;
  ebitda: number;
  ebitdaMargin: number;
  returnOnAssets: number;
  returnOnEquity: number;
  
  // Liquidity
  currentRatio: number;
  quickRatio: number;
  cashRatio: number;
  workingCapital: number;
  
  // Efficiency
  daysSalesOutstanding: number; // DSO (Receivable days)
  daysInventoryOutstanding: number; // DIO (Inventory days)
  daysPayablesOutstanding: number; // DPO (Payable days)
  cashConversionCycle: number; // CCC
  assetTurnover: number;
  inventoryTurnover: number;
  receivablesTurnover: number;
  
  // Solvency & Leverage
  debtToEquityRatio: number;
  debtToAssetsRatio: number;
  equityRatio: number;
  interestCoverageRatio: number | string;
  
  // Structural Score
  altmanZScore: number;
  riskScore: number; // 1 to 10
}

// Saved Analysis Record in Archive
export interface SavedAnalysisRecord {
  id: string;
  companyId?: string;
  companyName: string;
  reportTitle: string; // e.g. "FY2025"
  periodLabel: string; // e.g. "Annually · Jan - Dec 2025"
  periodFrequency: string; // e.g. "Annually"
  analysisType: string; // e.g. "Comprehensive", "Profitability"
  status: 'completed' | 'draft' | 'in_review';
  riskScore: number; // e.g. 4.0
  riskScoreText?: string; // e.g. "Risk 4/10"
  currency: string;
  periods: PeriodFinancialData[];
  budgetPerformance?: BudgetVsActual[];
  analysisReport?: FinancialAnalysisReport | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

// AI Consulting Narrative Briefing
export interface FinancialAnalysisReport {
  executiveSummary: string;
  financialHealthScore: number; // 1 to 10
  profitabilityAnalysis: string;
  liquidityAnalysis: string;
  cashFlowAnalysis: string;
  debtAndRiskAnalysis: string;
  revenueDrivers?: string;
  costDrivers?: string;
  marginCommentary?: string;
  keyTakeaways?: string[];
  lineItemExplanations?: Record<string, string>;
  ratiosAnalysisTable: {
    ratioName: string;
    values: { [period: string]: string | number };
    benchmark: string;
    status: 'optimal' | 'warning' | 'critical';
  }[];
  redFlags: string[];
  recommendations: string[];
  strategicAdvice: string[];
  conclusion: string;
}

// Chatbot messages
export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}
