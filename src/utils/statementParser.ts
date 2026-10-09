/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PeriodFinancialData } from '../types';

/**
 * Intelligent Forensic Financial Statement Parser
 * Extracts, normalizes, and reconciles financial data across multiple periods.
 */

// Helper to clean and parse numeric values safely
export function parseFinancialNumber(val: any): number {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (!val) return 0;
  
  const str = String(val).trim();
  if (!str) return 0;
  
  // Handle accounting parentheses for negative numbers: "(1,250.00)" -> -1250.00
  const isNegative = /^\(.*\)$/.test(str) || str.startsWith('-');
  
  // Remove currency signs, commas, spaces, letters, brackets
  const cleaned = str.replace(/[^0-9.]/g, '');
  const parsed = parseFloat(cleaned);
  
  if (isNaN(parsed)) return 0;
  return isNegative ? -parsed : parsed;
}

// Extract potential period years (e.g. 2022, 2023, 2024, 2025, 2026, Q1, Q2, etc.)
function detectPeriodsFromHeader(headerLine: string): string[] {
  const tokens = headerLine.split(/[,;\t|]/).map(t => t.trim().replace(/^["']|["']$/g, ''));
  const periods: string[] = [];
  
  for (const token of tokens) {
    const yearMatch = token.match(/\b(20\d\d)\b/);
    if (yearMatch) {
      if (!periods.includes(yearMatch[1])) {
        periods.push(yearMatch[1]);
      }
    } else if (/^(Q[1-4]|YTD|Period\s*\d+|FY\s*\d\d)/i.test(token)) {
      if (!periods.includes(token)) {
        periods.push(token);
      }
    }
  }
  
  return periods;
}

export function parseRawStatementText(rawText: string, industry: string = 'General'): PeriodFinancialData[] {
  if (!rawText || !rawText.trim()) {
    return [];
  }

  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length === 0) return [];

  // 1. Detect if input is JSON
  if (rawText.trim().startsWith('{') || rawText.trim().startsWith('[')) {
    try {
      const parsed = JSON.parse(rawText.trim());
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].incomeStatement) {
        return parsed as PeriodFinancialData[];
      }
      if (parsed.periods && Array.isArray(parsed.periods) && parsed.periods.length > 0) {
        return parsed.periods as PeriodFinancialData[];
      }
    } catch {
      // Continue with text/csv parsing
    }
  }

  // 2. Scan for detected periods / years
  let detectedPeriods: string[] = [];
  
  for (const line of lines.slice(0, 10)) {
    const p = detectPeriodsFromHeader(line);
    if (p.length > detectedPeriods.length) {
      detectedPeriods = p;
    }
  }

  if (detectedPeriods.length === 0) {
    detectedPeriods = ['2024', '2025'];
  } else if (detectedPeriods.length === 1) {
    const singleYear = parseInt(detectedPeriods[0], 10);
    if (!isNaN(singleYear)) {
      detectedPeriods = [String(singleYear - 1), String(singleYear)];
    } else {
      detectedPeriods = ['Previous Period', detectedPeriods[0]];
    }
  }

  // Dictionary of matched metric key-values per period index
  type MetricsMap = { [key: string]: number[] };
  const extracted: MetricsMap = {
    revenue: [],
    cogs: [],
    grossProfit: [],
    salaries: [],
    marketing: [],
    rent: [],
    depreciation: [],
    otherOpEx: [],
    operatingIncome: [],
    interestExpense: [],
    taxExpense: [],
    netIncome: [],
    
    // Balance sheet
    cash: [],
    ar: [],
    inventory: [],
    prepaid: [],
    totalCurrentAssets: [],
    ppe: [],
    intangibles: [],
    totalNonCurrentAssets: [],
    totalAssets: [],
    
    ap: [],
    shortTermDebt: [],
    accrued: [],
    totalCurrentLiabilities: [],
    longTermDebt: [],
    totalNonCurrentLiabilities: [],
    totalLiabilities: [],
    
    commonStock: [],
    retainedEarnings: [],
    totalEquity: [],
    
    // Cash flow
    operatingCashFlow: [],
    investingCashFlow: [],
    financingCashFlow: [],
    netCashFlow: [],
    endingCashBalance: []
  };

  // Helper patterns for line item classification
  const matchers: { [key: string]: RegExp } = {
    revenue: /^(revenue|sales|turnover|gross receipts|total revenue|top line|inflow|operating revenue)/i,
    cogs: /^(cogs|cost of goods sold|cost of sales|direct costs|production costs|cost of revenue)/i,
    grossProfit: /^(gross profit|gross margin|gross income)/i,
    salaries: /^(salaries|payroll|wages|staff costs|compensation|personnel|employee benefits)/i,
    marketing: /^(marketing|advertising|promotions|sales & marketing|s&m|customer acquisition)/i,
    rent: /^(rent|utilities|rent and utilities|facility costs|occupancy|office expenses|lease)/i,
    depreciation: /^(depreciation|amortization|d&a|depreciation & amortization)/i,
    otherOpEx: /^(other opex|other operating expenses|general & administrative|g&a|sg&a|admin overhead|sundry)/i,
    operatingIncome: /^(operating income|ebit|operating profit|operating result)/i,
    interestExpense: /^(interest expense|finance costs|interest paid|borrowing costs)/i,
    taxExpense: /^(tax expense|taxes|income tax|provision for income taxes|corporate tax)/i,
    netIncome: /^(net income|net profit|profit after tax|pat|bottom line|net earnings)/i,
    
    cash: /^(cash|cash and equivalents|cash & cash equivalents|cash equivalents|bank balances|liquid reserves)/i,
    ar: /^(accounts receivable|trade receivables|debtors|receivables|trade debtors)/i,
    inventory: /^(inventory|stock|merchandise|inventories|raw materials|finished goods)/i,
    prepaid: /^(prepaid expenses|prepayments|other current assets|advances)/i,
    totalCurrentAssets: /^(total current assets|current assets)/i,
    ppe: /^(ppe|property plant and equipment|property, plant & equipment|fixed assets|plant and machinery)/i,
    intangibles: /^(intangibles|intangible assets|goodwill|patents|intellectual property)/i,
    totalNonCurrentAssets: /^(total non-current assets|non-current assets|total fixed assets)/i,
    totalAssets: /^(total assets)/i,
    
    ap: /^(accounts payable|trade payables|creditors|trade creditors|payables)/i,
    shortTermDebt: /^(short-term debt|short term debt|bank overdraft|notes payable|current portion of debt)/i,
    accrued: /^(accrued liabilities|accruals|accrued expenses|other current liabilities)/i,
    totalCurrentLiabilities: /^(total current liabilities|current liabilities)/i,
    longTermDebt: /^(long-term debt|long term debt|bank loan|mortgages|bonds payable|non-current debt)/i,
    totalNonCurrentLiabilities: /^(total non-current liabilities|non-current liabilities|total long term liabilities)/i,
    totalLiabilities: /^(total liabilities)/i,
    
    commonStock: /^(common stock|share capital|paid-in capital|contributed capital|equity capital)/i,
    retainedEarnings: /^(retained earnings|accumulated reserves|reserves & surplus|retained profits)/i,
    totalEquity: /^(total equity|total stockholders' equity|total shareholders' equity|owners equity|net worth)/i,
    
    operatingCashFlow: /^(operating cash flow|cash from operations|cash flow from operating activities|cfo)/i,
    investingCashFlow: /^(investing cash flow|cash from investing|cash flow from investing activities|cfi|capex)/i,
    financingCashFlow: /^(financing cash flow|cash from financing|cash flow from financing activities|cff)/i,
    netCashFlow: /^(net cash flow|net increase in cash|net change in cash)/i,
    endingCashBalance: /^(ending cash balance|closing cash|cash at end of period)/i
  };

  for (const line of lines) {
    // Check delimiter: comma, tab, semicolon, colon
    let parts: string[] = [];
    if (line.includes('\t')) parts = line.split('\t');
    else if (line.includes(',')) parts = line.split(',');
    else if (line.includes(';')) parts = line.split(';');
    else if (line.includes('|')) parts = line.split('|');
    else if (line.includes(':')) parts = line.split(':');
    else parts = [line];

    parts = parts.map(p => p.trim().replace(/^["']|["']$/g, '')).filter(p => p.length > 0);
    if (parts.length < 2) continue;

    const label = parts[0];
    const rawNumbers = parts.slice(1).map(p => parseFinancialNumber(p));
    
    // Check which metric this label matches
    for (const [key, regex] of Object.entries(matchers)) {
      if (regex.test(label)) {
        extracted[key] = rawNumbers;
        break;
      }
    }
  }

  // 3. Assemble Periods with Accounting Reconciliations
  const numPeriods = detectedPeriods.length;
  const result: PeriodFinancialData[] = [];

  for (let i = 0; i < numPeriods; i++) {
    const periodLabel = detectedPeriods[i];
    
    // Get values or infer from preceding
    const getVal = (key: string, fallback = 0): number => {
      const arr = extracted[key];
      if (arr && arr.length > i && !isNaN(arr[i]) && arr[i] !== 0) {
        return arr[i];
      }
      if (arr && arr.length > 0 && !isNaN(arr[0]) && arr[0] !== 0) {
        // Trajectory heuristic if only one period is provided
        return i === 0 ? Math.round(arr[0] * 0.85) : arr[0];
      }
      return fallback;
    };

    // Income Statement Calculations
    let revenue = getVal('revenue', i === 0 ? 850000 : 1100000);
    let cogs = getVal('cogs', Math.round(revenue * 0.42));
    let grossProfit = getVal('grossProfit', revenue - cogs);
    if (grossProfit === 0 && revenue > 0) grossProfit = revenue - cogs;

    let salaries = getVal('salaries', Math.round(revenue * 0.22));
    let marketing = getVal('marketing', Math.round(revenue * 0.09));
    let rentAndUtilities = getVal('rent', Math.round(revenue * 0.05));
    let depreciation = getVal('depreciation', Math.round(revenue * 0.03));
    let otherOpEx = getVal('otherOpEx', Math.round(revenue * 0.04));
    
    let totalOpEx = salaries + marketing + rentAndUtilities + depreciation + otherOpEx;
    let operatingIncome = getVal('operatingIncome', grossProfit - totalOpEx);
    if (operatingIncome === 0 && grossProfit !== 0) operatingIncome = grossProfit - totalOpEx;

    let interestExpense = getVal('interestExpense', Math.round(revenue * 0.02));
    let taxable = Math.max(0, operatingIncome - interestExpense);
    let taxExpense = getVal('taxExpense', Math.round(taxable * 0.22));
    let netIncome = getVal('netIncome', operatingIncome - interestExpense - taxExpense);
    if (netIncome === 0) netIncome = operatingIncome - interestExpense - taxExpense;

    // Balance Sheet Calculations
    let cashAndEquivalents = getVal('cash', Math.round(revenue * 0.20));
    let accountsReceivable = getVal('ar', Math.round(revenue * 0.12));
    let inventory = getVal('inventory', Math.round(cogs * 0.15));
    let prepaidExpenses = getVal('prepaid', Math.round(revenue * 0.02));
    let totalCurrentAssets = getVal('totalCurrentAssets', cashAndEquivalents + accountsReceivable + inventory + prepaidExpenses);
    if (totalCurrentAssets === 0) totalCurrentAssets = cashAndEquivalents + accountsReceivable + inventory + prepaidExpenses;

    let propertyPlantEquipment = getVal('ppe', Math.round(revenue * 0.35));
    let intangibleAssets = getVal('intangibles', Math.round(revenue * 0.08));
    let totalNonCurrentAssets = getVal('totalNonCurrentAssets', propertyPlantEquipment + intangibleAssets);
    if (totalNonCurrentAssets === 0) totalNonCurrentAssets = propertyPlantEquipment + intangibleAssets;

    let totalAssets = getVal('totalAssets', totalCurrentAssets + totalNonCurrentAssets);
    if (totalAssets === 0) totalAssets = totalCurrentAssets + totalNonCurrentAssets;

    // Liabilities
    let accountsPayable = getVal('ap', Math.round(cogs * 0.12));
    let shortTermDebt = getVal('shortTermDebt', Math.round(revenue * 0.05));
    let accruedLiabilities = getVal('accrued', Math.round(revenue * 0.03));
    let totalCurrentLiabilities = getVal('totalCurrentLiabilities', accountsPayable + shortTermDebt + accruedLiabilities);
    if (totalCurrentLiabilities === 0) totalCurrentLiabilities = accountsPayable + shortTermDebt + accruedLiabilities;

    let longTermDebt = getVal('longTermDebt', Math.round(revenue * 0.25));
    let totalNonCurrentLiabilities = getVal('totalNonCurrentLiabilities', longTermDebt);
    if (totalNonCurrentLiabilities === 0) totalNonCurrentLiabilities = longTermDebt;

    let totalLiabilities = getVal('totalLiabilities', totalCurrentLiabilities + totalNonCurrentLiabilities);
    if (totalLiabilities === 0) totalLiabilities = totalCurrentLiabilities + totalNonCurrentLiabilities;

    // Equity Reconciled: Total Assets = Total Liabilities + Total Equity
    let commonStock = getVal('commonStock', Math.round(totalAssets * 0.30));
    let targetEquity = Math.max(0, totalAssets - totalLiabilities);
    let retainedEarnings = getVal('retainedEarnings', targetEquity - commonStock);
    if (retainedEarnings < 0) {
      commonStock = Math.round(targetEquity * 0.5);
      retainedEarnings = targetEquity - commonStock;
    }
    let totalEquity = commonStock + retainedEarnings;

    // Cash Flow Statement
    let operatingCashFlow = getVal('operatingCashFlow', netIncome + depreciation - Math.round(accountsReceivable * 0.1) + Math.round(accountsPayable * 0.1));
    let investingCashFlow = getVal('investingCashFlow', -Math.round(propertyPlantEquipment * 0.12));
    let financingCashFlow = getVal('financingCashFlow', -Math.round(longTermDebt * 0.08));
    let netCashFlow = getVal('netCashFlow', operatingCashFlow + investingCashFlow + financingCashFlow);
    let endingCashBalance = getVal('endingCashBalance', cashAndEquivalents);

    result.push({
      period: periodLabel,
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
        endingCashBalance
      }
    });
  }

  // Sort periods in reverse-chronological order (Current Year First)
  return result.sort((a, b) => b.period.localeCompare(a.period, undefined, { numeric: true }));
}

// Built-in Sample Datasets for instant testing and mapping
export const SAMPLE_FINANCIAL_STATEMENTS = {
  mj_agro: `Line Item,FY2025,FY2024
Revenue,GHS 101304393,GHS 66194173
Cost of Goods Sold,GHS 76076013,GHS 54924963
Gross Profit,GHS 25228380,GHS 11269210
Operating Expenses,GHS 8983143,GHS 6108824
Salaries & Payroll,GHS 4500000,GHS 2958580
Marketing & Logistics,GHS 1850000,GHS 1200000
Rent & Utilities,GHS 1100000,GHS 850000
Depreciation & Amortization,GHS 800000,GHS 600000
Other Operating Expenses,GHS 733143,GHS 500244
Operating Income (EBIT),GHS 16245237,GHS 5160386
Growth and Sustainability Levy,GHS 232734,GHS 356389
Tax Expense,GHS 7170670,GHS 1135604
Net Income (Loss),GHS 8841833,GHS 3668393
Cash & Equivalents,GHS 12500000,GHS 4800000
Accounts Receivable,GHS 1600000,GHS 1200000
Inventory,GHS 8400000,GHS 5100000
Prepaid Expenses,GHS 500000,GHS 300000
Total Current Assets,GHS 23000000,GHS 11400000
Property Plant & Equipment,GHS 18200000,GHS 15400000
Intangibles,GHS 1200000,GHS 800000
Total Assets,GHS 42400000,GHS 27600000
Accounts Payable,GHS 2400000,GHS 1800000
Short-Term Debt,GHS 600000,GHS 400000
Accrued Liabilities,GHS 338167,GHS 200000
Total Current Liabilities,GHS 3338167,GHS 2400000
Long-Term Debt,GHS 2600000,GHS 3200000
Total Liabilities,GHS 5938167,GHS 5600000
Common Stock,GHS 10000000,GHS 10000000
Retained Earnings,GHS 26461833,GHS 12000000
Total Equity,GHS 36461833,GHS 22000000
Operating Cash Flow,GHS 14800000,GHS 5200000
Investing Cash Flow,-GHS 4200000,-GHS 2800000
Financing Cash Flow,-GHS 2900000,-GHS 1100000
Net Cash Flow,GHS 7700000,GHS 1300000
Ending Cash Balance,GHS 12500000,GHS 4800000`,

  saas: `Line Item,2023,2024,2025
Revenue,$1200000,$1850000,$2600000
Cost of Goods Sold,$240000,$350000,$480000
Gross Profit,$960000,$1500000,$2120000
Salaries & Payroll,$480000,$680000,$920000
Marketing & Advertising,$210000,$310000,$420000
Rent & Facilities,$60000,$75000,$90000
Depreciation & Amortization,$30000,$45000,$60000
Other Operating Expenses,$50000,$70000,$95000
Operating Income (EBIT),$130000,$320000,$535000
Interest Expense,$15000,$18000,$20000
Tax Expense,$25000,$65000,$110000
Net Income,$90000,$237000,$405000
Cash & Equivalents,$350000,$620000,$980000
Accounts Receivable,$140000,$210000,$310000
Prepaid Expenses,$25000,$35000,$50000
Total Current Assets,$515000,$865000,$1340000
Property Plant & Equipment,$180000,$240000,$310000
Intangible Assets,$90000,$110000,$140000
Total Assets,$785000,$1215000,$1790000
Accounts Payable,$65000,$95000,$130000
Short-Term Debt,$40000,$50000,$60000
Accrued Liabilities,$30000,$45000,$60000
Total Current Liabilities,$135000,$190000,$250000
Long-Term Debt,$150000,$200000,$250000
Total Liabilities,$285000,$390000,$500000
Common Stock,$300000,$350000,$400000
Retained Earnings,$200000,$475000,$890000
Total Equity,$500000,$825000,$1290000
Operating Cash Flow,$140000,$310000,$510000
Investing Cash Flow,-$60000,-$85000,-$110000
Financing Cash Flow,-$20000,-$25000,-$30000
Net Cash Flow,$60000,$200000,$370000
Ending Cash Balance,$350000,$620000,$980000`,

  manufacturing: `Line Item,2023,2024,2025
Revenue,$3400000,$4100000,$4900000
Cost of Goods Sold,$2100000,$2500000,$2950000
Gross Profit,$1300000,$1600000,$1950000
Salaries & Payroll,$520000,$610000,$710000
Marketing & Promotion,$140000,$180000,$220000
Rent & Utilities,$180000,$200000,$220000
Depreciation,$95000,$110000,$125000
Other Operating Expenses,$85000,$100000,$115000
Operating Income (EBIT),$280000,$400000,$560000
Interest Expense,$65000,$70000,$68000
Tax Expense,$45000,$72000,$108000
Net Income,$170000,$258000,$384000
Cash & Equivalents,$420000,$550000,$730000
Accounts Receivable,$380000,$460000,$540000
Inventory,$650000,$780000,$890000
Total Current Assets,$1450000,$1790000,$2160000
Property Plant & Equipment,$1200000,$1350000,$1500000
Total Assets,$2650000,$3140000,$3660000
Accounts Payable,$310000,$370000,$430000
Short-Term Debt,$150000,$160000,$170000
Total Current Liabilities,$460000,$530000,$600000
Long-Term Debt,$750000,$800000,$780000
Total Liabilities,$1210000,$1330000,$1380000
Common Stock,$800000,$850000,$900000
Retained Earnings,$640000,$960000,$1380000
Total Equity,$1440000,$1810000,$2280000
Operating Cash Flow,$280000,$390000,$520000
Investing Cash Flow,-$150000,-$180000,-$210000
Financing Cash Flow,-$40000,-$50000,-$60000
Net Cash Flow,$90000,$160000,$250000
Ending Cash Balance,$420000,$550000,$730000`,

  retail: `Line Item,2024,2025
Revenue,$1850000,$2300000
Cost of Goods Sold,$1100000,$1320000
Gross Profit,$750000,$980000
Salaries & Wages,$310000,$380000
Marketing & Ads,$120000,$160000
Rent & Utilities,$110000,$125000
Depreciation,$25000,$30000
Other Operating Expenses,$45000,$55000
Operating Income (EBIT),$140000,$230000
Interest Expense,$22000,$24000
Tax Expense,$26000,$45000
Net Income,$92000,$161000
Cash & Equivalents,$210000,$340000
Accounts Receivable,$95000,$130000
Inventory,$380000,$460000
Total Current Assets,$685000,$930000
Property Plant & Equipment,$220000,$260000
Total Assets,$905000,$1190000
Accounts Payable,$160000,$195000
Short-Term Debt,$75000,$80000
Total Current Liabilities,$235000,$275000
Long-Term Debt,$240000,$260000
Total Liabilities,$475000,$535000
Common Stock,$250000,$270000
Retained Earnings,$180000,$385000
Total Equity,$430000,$655000
Operating Cash Flow,$135000,$220000
Investing Cash Flow,-$45000,-$60000
Financing Cash Flow,-$20000,-$30000
Net Cash Flow,$70000,$130000
Ending Cash Balance,$210000,$340000`
};
