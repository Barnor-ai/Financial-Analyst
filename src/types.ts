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

// User Configuration / Company Profile / Business Entity
export interface UserProfile {
  id?: string;
  organisationId?: string;
  companyName: string;
  entityCode?: string;
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

export interface BusinessEntity {
  id: string;
  organisationId: string;
  name: string;
  code: string;
  industry: string;
  currency: string;
  reportingBasis: 'IFRS' | 'US GAAP' | 'Accrual Basis' | 'Cash Basis';
  location: string;
  financialYearEnd: string;
  registrationNumber?: string;
  description?: string;
  createdAt: string;
}

// Data Validation & Account Mapping Types
export interface ValidationCheck {
  id: string;
  name: string;
  category: 'reconciliation' | 'integrity' | 'completeness';
  passed: boolean;
  message: string;
  details?: string;
  diff?: number;
}

export interface StatementValidationResult {
  isValid: boolean;
  overallScore: number; // 0 - 100
  balanceSheetBalanced: boolean;
  balanceSheetVariance: number;
  incomeStatementConsistent: boolean;
  cashFlowReconciled: boolean;
  checks: ValidationCheck[];
  mappedAccountsCount: number;
  unmappedAccountsCount: number;
  totalAssets: number;
  totalLiabilitiesAndEquity: number;
}

// Emerging Risks & Early Warnings
export interface EmergingRiskItem {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  category: 'Liquidity' | 'Profitability' | 'Solvency' | 'Operations' | 'Compliance' | 'Cash Flow';
  metric: string;
  observedValue: string;
  threshold: string;
  explanation: string;
  cfoAction: string;
}

// DuPont 3-Stage Breakdown
export interface DuPontBreakdown {
  roe: number; // ROE %
  netProfitMargin: number; // Net Margin %
  assetTurnover: number; // Asset Turnover x
  equityMultiplier: number; // Financial Leverage (Assets / Equity) x
  formulaDisplay: string;
}

// Enhanced Variance Analysis Item
export interface VarianceAnalysisItem {
  category: string;
  statement: 'income_statement' | 'balance_sheet' | 'operating_expenses';
  budgeted: number;
  actual: number;
  variance: number; // actual - budgeted
  variancePercentage: number;
  isFavorable: boolean;
  isSignificant: boolean; // variance > materiality threshold
  rootCauseTag?: string; // 'volume', 'pricing', 'cost_inflation', 'timing'
  driverNote?: string;
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
  profitBeforeTax?: number;
  profitAfterTax?: number;
  revenueGrowth?: number;
  cogsToRevenue?: number;
  opexToRevenue?: number;
  salariesToRevenue?: number;
  marketingToRevenue?: number;
  rentToRevenue?: number;
  depreciationToRevenue?: number;
  
  // Liquidity & Working Capital
  currentRatio: number;
  quickRatio: number;
  cashRatio: number;
  workingCapital: number;
  daysSalesOutstanding: number; // DSO (Receivable days)
  daysInventoryOutstanding: number; // DIO (Inventory days)
  daysPayablesOutstanding: number; // DPO (Payable days)
  cashConversionCycle: number; // CCC
  
  // Efficiency
  assetTurnover: number;
  inventoryTurnover: number;
  receivablesTurnover: number;
  payablesTurnover?: number;
  revenuePerEmployee?: number;
  
  // Solvency & Leverage
  debtToEquityRatio: number;
  debtToAssetsRatio: number;
  equityRatio: number;
  interestCoverageRatio: number | string;
  financialLeverageMultiplier?: number; // DuPont leverage (Assets / Equity)
  
  // Cash Flow & Quality
  cashFlowToNetIncome?: number; // Quality of earnings ratio
  netCashMovement?: number;
  
  // Structural Score
  altmanZScore: number;
  riskScore: number; // 1 to 10
}

// Configurable Scoring Model Types
export interface HealthScoreWeights {
  profitability: number;
  liquidity: number;
  solvency: number;
  efficiency: number;
  cashFlow: number;
}

export interface HealthScoreMetric {
  name: string;
  value: string;
  benchmark: string;
  numerator: string;
  denominator: string;
  status: 'optimal' | 'warning' | 'critical';
  impact: string;
}

export interface HealthScoreComponent {
  category: 'Profitability' | 'Liquidity' | 'Solvency' | 'Efficiency' | 'Cash Flow';
  score: number; // 0 - 100
  weightedScore: number;
  weightPercent: number;
  status: 'optimal' | 'warning' | 'critical';
  summary: string;
  metrics: HealthScoreMetric[];
}

export interface HealthScoreBreakdown {
  overallScore: number; // 0 - 100
  scoreOutOfTen: number; // 1.0 - 10.0
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  riskRating: 'Low' | 'Moderate' | 'Elevated' | 'High' | 'Severe';
  weights: HealthScoreWeights;
  components: HealthScoreComponent[];
  methodologyDescription: string;
  disclaimer: string;
}

export interface FinancialHealthAssessmentData {
  overallSummary: string;
  mainStrengths: string[];
  mainWeaknesses: string[];
  emergingRisks: import('./types').EmergingRiskItem[];
  keyPeriodChanges: string[];
  immediatePriorities: string[]; // 30-60 day actions
  mediumTermOpportunities: string[]; // 90-180 day initiatives
  healthScore: HealthScoreBreakdown;
  ratios: FinancialRatios;
  priorRatios?: FinancialRatios | null;
}

export interface ReportVersionItem {
  versionNumber: number;
  updatedAt: string;
  updatedBy: string;
  changeSummary: string;
}

export interface SavedSearchFilter {
  id: string;
  name: string;
  query: string;
  category: string;
  entity: string;
  status: string;
  sortBy: string;
  dateRange?: string;
}

// Saved Analysis Record in Archive (Phase 9 Enterprise Library Specification)
export interface SavedAnalysisRecord {
  id: string;
  companyId?: string;
  companyName: string;
  organizationId?: string; // Tenant separation for organisation-scoped search
  reportTitle: string; // e.g. "FY2025 Annual Review"
  periodLabel: string; // e.g. "Annually · Jan - Dec 2025"
  periodFrequency: string; // e.g. "Annually"
  financialYear?: string; // e.g. "2025"
  reportCategory?: string; // e.g. "Financial Health Assessment", "Management Account Review", "Budget vs Actual Analysis"
  department?: string; // e.g. "Global Operations", "Finance & Accounting", "Sales & Marketing"
  branch?: string; // e.g. "North America HQ", "EMEA Operations", "APAC Hub"
  costCentre?: string; // e.g. "CC-100 Corporate", "CC-400 Software Engineering"
  tags?: string[]; // e.g. ["board-pack", "audit-ready", "q4-close"]
  reportLanguage?: string; // e.g. "English", "French", "Spanish", "Portuguese", "Arabic", "Chinese"
  isFavorite?: boolean; // Pinned / favourite report
  isArchived?: boolean; // Archived state
  availableExportFormats?: ('PDF' | 'Word' | 'Excel')[];
  versions?: ReportVersionItem[];
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

// ==========================================
// PHASE 4: GUIDED FINANCIAL DATA UPLOAD & REVIEW
// ==========================================

export type FinancialStatementType =
  | 'pnl'                  // Statement of Profit or Loss
  | 'balance_sheet'        // Statement of Financial Position
  | 'cash_flow'            // Statement of Cash Flows
  | 'trial_balance'        // Trial Balance
  | 'management_accounts'  // Monthly Management Accounts
  | 'comparative'          // Comparative Financial Statements
  | 'supporting_schedules' // Supporting Schedules
  | 'general_ledger';      // General Ledger Summaries

export type AccountClassification =
  | 'revenue'
  | 'cogs'
  | 'opex_salaries'
  | 'opex_marketing'
  | 'opex_rent'
  | 'opex_depreciation'
  | 'opex_other'
  | 'growth_levy'
  | 'interest_expense'
  | 'tax_expense'
  | 'asset_cash'
  | 'asset_ar'
  | 'asset_inventory'
  | 'asset_prepaid'
  | 'asset_ppe'
  | 'asset_intangible'
  | 'liability_ap'
  | 'liability_st_debt'
  | 'liability_accrued'
  | 'liability_lt_debt'
  | 'equity_stock'
  | 'equity_retained'
  | 'cf_operating'
  | 'cf_investing'
  | 'cf_financing'
  | 'unmapped';

export interface AccountLineItem {
  id: string;
  code: string;
  description: string;
  classification: AccountClassification;
  statementType: 'income_statement' | 'balance_sheet' | 'cash_flow';
  normalBalance: 'debit' | 'credit';
  department: string;
  costCentre: string;
  entityUnit: string;
  values: { [period: string]: number };
  isUnmapped?: boolean;
  notes?: string;
}

export interface MappingTemplate {
  id: string;
  name: string;
  framework: 'IFRS' | 'US GAAP' | 'Standard Corporate' | 'Custom';
  description: string;
  isDefault?: boolean;
  mappings: { [accountPatternOrCode: string]: AccountClassification };
  createdAt: string;
}

export interface ArithmeticDiscrepancy {
  id: string;
  period: string;
  statement: 'Statement of Financial Position' | 'Statement of Profit or Loss' | 'Statement of Cash Flows';
  metric: string;
  reportedValue: number;
  calculatedValue: number;
  difference: number;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  resolutionTip: string;
}

export interface UploadedFileRecord {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadTimestamp: string;
  category: FinancialStatementType;
  periodsDetected: string[];
  currency: string;
  rawContentPreview?: string;
  status: 'completed' | 'ocr_processed' | 'needs_review' | 'failed';
  processingMessage?: string;
  validationScore: number;
  discrepancies: ArithmeticDiscrepancy[];
  normalizedDataSnapshot: PeriodFinancialData[];
}

// ==========================================
// PHASE 7: MANAGEMENT DECISION SUPPORT & ACTION REGISTER
// ==========================================

export type ActionStatus = 'Open' | 'In Progress' | 'Awaiting Approval' | 'Completed' | 'Deferred';
export type ActionPriority = 'Critical' | 'High' | 'Medium' | 'Low';

export interface ManagementActionItem {
  id: string;
  actionDescription: string;
  linkedReportOrVariance: string;
  responsiblePerson: string;
  department: string;
  priority: ActionPriority;
  dueDate: string; // YYYY-MM-DD
  status: ActionStatus;
  expectedFinancialImpact: string;
  actualOutcome?: string;
  commentsAndEvidence: string;
  createdAt: string;
  updatedAt: string;
}

export type DecisionCategory = 
  | 'attention' 
  | 'financial_risk' 
  | 'adverse_variance' 
  | 'cash_flow_pressure' 
  | 'profitability_opportunity' 
  | 'cost_reduction' 
  | 'working_capital' 
  | 'forecast_risk' 
  | 'next_action';

export interface DecisionInsightItem {
  id: string;
  category: DecisionCategory;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  context: string;
  quantitativeImpact: string;
  evidence: string;
  recommendedAction: string;
  responsibleDept: string;
  suggestedDueDate: string;
  linkedVarianceOrMetric?: string;
}

export interface ScenarioModelAssumptions {
  scenarioName: string;
  revenueGrowthPct: number;
  grossMarginPct: number;
  opexChangePct: number;
  dsoDaysChange: number; // Days Sales Outstanding (Collection Period)
  dioDaysChange: number; // Days Inventory Outstanding
  dpoDaysChange: number; // Days Payables Outstanding
  taxRatePct: number;
  capexBudget: number;
}

export interface ScenarioProjectionResult {
  isEstimate: true;
  scenarioName: string;
  baselinePeriod: string;
  baselineRevenue: number;
  projectedRevenue: number;
  revenueDelta: number;
  projectedGrossProfit: number;
  projectedGrossMarginPct: number;
  projectedOpex: number;
  projectedOperatingProfit: number;
  projectedNetIncome: number;
  projectedNetMarginPct: number;
  
  // Working Capital & Cash metrics
  baselineDSO: number;
  projectedDSO: number;
  baselineDIO: number;
  projectedDIO: number;
  baselineDPO: number;
  projectedDPO: number;
  baselineCCC: number;
  projectedCCC: number;
  workingCapitalCashReleaseOrAbsorb: number;
  projectedOperatingCashFlow: number;
  projectedEndingCash: number;
}
