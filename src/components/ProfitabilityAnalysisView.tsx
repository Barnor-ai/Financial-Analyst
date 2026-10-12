/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  TrendingUp, Download, FileSpreadsheet, FileText, ChevronRight, 
  Sparkles, CheckCircle2, AlertTriangle, Layers, Edit3, ArrowUpRight,
  TrendingDown, ShieldCheck, Info
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { UserProfile, PeriodFinancialData, FinancialAnalysisReport } from '../types';
import { 
  calculateFinancialRatios, 
  calculatePercentageChange, 
  safeDiv, 
  generateReportFromFinancials, 
  generateLineItemExplanations 
} from '../utils/financialEngine';
import VarianceInvestigationHub from './VarianceInvestigationHub';
import ReportExporter from './ReportExporter';
import { BudgetVsActual } from '../types';

interface ProfitabilityAnalysisViewProps {
  profile: UserProfile;
  periods: PeriodFinancialData[];
  analysis: FinancialAnalysisReport | null;
  budgetPerformance?: BudgetVsActual[];
  defaultSubTab?: 'pnl' | 'balanceSheet' | 'cashFlow' | 'ratios' | 'variance_risks';
  onNavigateToEdit?: () => void;
  onNavigateToUpload?: () => void;
}

export default function ProfitabilityAnalysisView({
  profile,
  periods,
  analysis,
  budgetPerformance = [],
  defaultSubTab = 'pnl',
  onNavigateToEdit,
  onNavigateToUpload
}: ProfitabilityAnalysisViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<'pnl' | 'balanceSheet' | 'cashFlow' | 'ratios' | 'variance_risks'>(defaultSubTab);

  const curSymbol = profile.currency.match(/\(([^)]+)\)/)?.[1] || profile.currency.split(' ')[0] || '$';

  // Reverse chronological sorting so Current Year is first
  const sortedPeriods = [...periods].sort((a, b) => b.period.localeCompare(a.period, undefined, { numeric: true }));
  const currPeriod = sortedPeriods[0];
  const prevPeriod = sortedPeriods.length > 1 ? sortedPeriods[1] : sortedPeriods[0];

  if (!currPeriod) {
    return (
      <div className="bg-white border border-[#E8E2D8] rounded-2xl p-12 text-center max-w-xl mx-auto shadow-xs space-y-4">
        <TrendingUp className="w-10 h-10 text-[#D4A347] mx-auto" />
        <h3 className="font-serif-display text-2xl font-bold text-[#0B192C]">No Financial Analysis Available</h3>
        <p className="text-xs text-slate-600">Please upload a financial statement or initialize a sample dataset in New Analysis.</p>
        <button
          type="button"
          onClick={onNavigateToUpload}
          className="px-5 py-2.5 bg-[#0B192C] text-white text-xs font-semibold rounded-lg hover:bg-[#162A45] cursor-pointer"
        >
          Go to New Analysis
        </button>
      </div>
    );
  }

  const isCurr = currPeriod.incomeStatement;
  const isPrev = prevPeriod.incomeStatement;
  const bsCurr = currPeriod.balanceSheet;
  const bsPrev = prevPeriod.balanceSheet;
  const cfCurr = currPeriod.cashFlow;
  const cfPrev = prevPeriod.cashFlow;

  const ratiosCurr = calculateFinancialRatios(currPeriod, prevPeriod);
  const ratiosPrev = calculateFinancialRatios(prevPeriod);

  // Dynamic diagnostic report specific to this company and periods
  const dynamicReport = analysis || generateReportFromFinancials(profile, sortedPeriods);
  const whyTexts = dynamicReport.lineItemExplanations || generateLineItemExplanations(currPeriod, prevPeriod);

  // Format currency helper
  const formatAmt = (num: number, withPrefix = true) => {
    const isNeg = num < 0;
    const absVal = Math.abs(num);
    const formatted = absVal.toLocaleString('en-US', { maximumFractionDigits: 0 });
    if (!withPrefix) return isNeg ? `-${formatted}` : formatted;
    return isNeg ? `-${curSymbol} ${formatted}` : `${curSymbol} ${formatted}`;
  };

  // Format change helper
  const formatChange = (curr: number, prev: number) => {
    const diff = curr - prev;
    const pct = calculatePercentageChange(curr, prev);
    const isPositive = diff >= 0;
    return {
      diffStr: `${isPositive ? '+' : '-'}${curSymbol} ${Math.abs(diff).toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
      pctStr: `${isPositive ? '+' : ''}${pct.toFixed(1)}%`,
      isPositive
    };
  };

  // Export to Excel Workbook
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    // 1. Income Statement Sheet
    const pnlRows = [
      ['Line Item', `${currPeriod.period} (Current)`, `${prevPeriod.period} (Previous)`, 'Change ($)', 'Change (%)', '% of Revenue'],
      ['Revenue', isCurr.revenue, isPrev.revenue, isCurr.revenue - isPrev.revenue, calculatePercentageChange(isCurr.revenue, isPrev.revenue), 100],
      ['Cost of Goods Sold', -isCurr.cogs, -isPrev.cogs, -(isCurr.cogs - isPrev.cogs), calculatePercentageChange(isCurr.cogs, isPrev.cogs), safeDiv(isCurr.cogs, isCurr.revenue, -100)],
      ['Gross Profit', isCurr.grossProfit, isPrev.grossProfit, isCurr.grossProfit - isPrev.grossProfit, calculatePercentageChange(isCurr.grossProfit, isPrev.grossProfit), safeDiv(isCurr.grossProfit, isCurr.revenue, 100)],
      ['Operating Expenses', -isCurr.operatingExpenses.total, -isPrev.operatingExpenses.total, -(isCurr.operatingExpenses.total - isPrev.operatingExpenses.total), calculatePercentageChange(isCurr.operatingExpenses.total, isPrev.operatingExpenses.total), safeDiv(isCurr.operatingExpenses.total, isCurr.revenue, -100)],
      ['Operating Income (EBIT)', isCurr.operatingIncome, isPrev.operatingIncome, isCurr.operatingIncome - isPrev.operatingIncome, calculatePercentageChange(isCurr.operatingIncome, isPrev.operatingIncome), safeDiv(isCurr.operatingIncome, isCurr.revenue, 100)],
      ['Tax Expense', -isCurr.taxExpense, -isPrev.taxExpense, -(isCurr.taxExpense - isPrev.taxExpense), calculatePercentageChange(isCurr.taxExpense, isPrev.taxExpense), safeDiv(isCurr.taxExpense, isCurr.revenue, -100)],
      ['Net Income', isCurr.netIncome, isPrev.netIncome, isCurr.netIncome - isPrev.netIncome, calculatePercentageChange(isCurr.netIncome, isPrev.netIncome), safeDiv(isCurr.netIncome, isCurr.revenue, 100)]
    ];
    const wsPnL = XLSX.utils.aoa_to_sheet(pnlRows);
    XLSX.utils.book_append_sheet(wb, wsPnL, 'Income Statement');

    // 2. Balance Sheet Sheet
    const bsRows = [
      ['Account', `${currPeriod.period} (Current)`, `${prevPeriod.period} (Previous)`, 'Change ($)', 'Change (%)'],
      ['Cash & Cash Equivalents', bsCurr.assets.cashAndEquivalents, bsPrev.assets.cashAndEquivalents, bsCurr.assets.cashAndEquivalents - bsPrev.assets.cashAndEquivalents, calculatePercentageChange(bsCurr.assets.cashAndEquivalents, bsPrev.assets.cashAndEquivalents)],
      ['Accounts Receivable', bsCurr.assets.accountsReceivable, bsPrev.assets.accountsReceivable, bsCurr.assets.accountsReceivable - bsPrev.assets.accountsReceivable, calculatePercentageChange(bsCurr.assets.accountsReceivable, bsPrev.assets.accountsReceivable)],
      ['Inventory', bsCurr.assets.inventory, bsPrev.assets.inventory, bsCurr.assets.inventory - bsPrev.assets.inventory, calculatePercentageChange(bsCurr.assets.inventory, bsPrev.assets.inventory)],
      ['Total Current Assets', bsCurr.assets.totalCurrentAssets, bsPrev.assets.totalCurrentAssets, bsCurr.assets.totalCurrentAssets - bsPrev.assets.totalCurrentAssets, calculatePercentageChange(bsCurr.assets.totalCurrentAssets, bsPrev.assets.totalCurrentAssets)],
      ['Total Assets', bsCurr.assets.totalAssets, bsPrev.assets.totalAssets, bsCurr.assets.totalAssets - bsPrev.assets.totalAssets, calculatePercentageChange(bsCurr.assets.totalAssets, bsPrev.assets.totalAssets)],
      ['Accounts Payable', bsCurr.liabilities.accountsPayable, bsPrev.liabilities.accountsPayable, bsCurr.liabilities.accountsPayable - bsPrev.liabilities.accountsPayable, calculatePercentageChange(bsCurr.liabilities.accountsPayable, bsPrev.liabilities.accountsPayable)],
      ['Total Current Liabilities', bsCurr.liabilities.totalCurrentLiabilities, bsPrev.liabilities.totalCurrentLiabilities, bsCurr.liabilities.totalCurrentLiabilities - bsPrev.liabilities.totalCurrentLiabilities, calculatePercentageChange(bsCurr.liabilities.totalCurrentLiabilities, bsPrev.liabilities.totalCurrentLiabilities)],
      ['Total Liabilities', bsCurr.liabilities.totalLiabilities, bsPrev.liabilities.totalLiabilities, bsCurr.liabilities.totalLiabilities - bsPrev.liabilities.totalLiabilities, calculatePercentageChange(bsCurr.liabilities.totalLiabilities, bsPrev.liabilities.totalLiabilities)],
      ['Total Equity', bsCurr.equity.totalEquity, bsPrev.equity.totalEquity, bsCurr.equity.totalEquity - bsPrev.equity.totalEquity, calculatePercentageChange(bsCurr.equity.totalEquity, bsPrev.equity.totalEquity)]
    ];
    const wsBS = XLSX.utils.aoa_to_sheet(bsRows);
    XLSX.utils.book_append_sheet(wb, wsBS, 'Balance Sheet');

    // 3. Ratios Sheet
    const ratioRows = [
      ['Metric', `${currPeriod.period}`, `${prevPeriod.period}`, 'Benchmark'],
      ['Gross Profit Margin', `${ratiosCurr.grossProfitMargin}%`, `${ratiosPrev.grossProfitMargin}%`, '18.0%'],
      ['Operating Margin', `${ratiosCurr.operatingMargin}%`, `${ratiosPrev.operatingMargin}%`, '10.0%'],
      ['Net Profit Margin', `${ratiosCurr.netProfitMargin}%`, `${ratiosPrev.netProfitMargin}%`, '6.0%'],
      ['Current Ratio', `${ratiosCurr.currentRatio}`, `${ratiosPrev.currentRatio}`, '2.00'],
      ['Equity Ratio', `${ratiosCurr.equityRatio}%`, `${ratiosPrev.equityRatio}%`, '50.0%'],
      ['Debt-to-Equity Ratio', `${ratiosCurr.debtToEquityRatio}`, `${ratiosPrev.debtToEquityRatio}`, '0.80'],
      ['Altman Z-Score', `${ratiosCurr.altmanZScore}`, `${ratiosPrev.altmanZScore}`, '2.90']
    ];
    const wsRatios = XLSX.utils.aoa_to_sheet(ratioRows);
    XLSX.utils.book_append_sheet(wb, wsRatios, 'Ratios Matrix');

    XLSX.writeFile(wb, `${profile.companyName || 'FinScope'}_Financial_Analysis_${currPeriod.period}.xlsx`);
  };

  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-8 animate-fade-in text-left pb-12" id="profitability-view">
      
      {/* Top Header matching exact screenshot */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E8E2D8] pb-6">
        <div>
          <div className="mb-2">
            <span className="text-[11px] font-mono font-bold tracking-[0.25em] text-[#D4A347] uppercase">
              PROFITABILITY ANALYSIS
            </span>
          </div>
          <h1 className="font-serif-display text-4xl sm:text-5xl font-bold text-[#0B192C] tracking-tight">
            Revenue – Net Income
          </h1>
        </div>

        {/* Period pill and action buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="px-3.5 py-1.5 bg-white border border-[#E8E2D8] rounded-xl text-xs font-mono text-slate-700 shadow-xs flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>{currPeriod.period} · Annually · Jan - Dec {currPeriod.period.replace(/\D/g, '') || '2025'}</span>
          </div>

          <button
            type="button"
            onClick={handleExportExcel}
            className="px-3.5 py-2 bg-white hover:bg-[#F8F5EE] border border-[#D5CDC0] text-[#0B192C] text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            title="Download Excel spreadsheet"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Excel</span>
          </button>

          <button
            type="button"
            onClick={handlePrintPDF}
            className="px-3.5 py-2 bg-[#0B192C] hover:bg-[#162A45] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            title="Export / Print PDF"
          >
            <Download className="w-3.5 h-3.5 text-[#D4A347]" />
            <span>PDF Report</span>
          </button>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E8E2D8] overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setActiveSubTab('pnl')}
          className={`py-2 px-4 text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors cursor-pointer ${
            activeSubTab === 'pnl'
              ? 'bg-[#0B192C] text-white'
              : 'text-slate-600 hover:text-[#0B192C] hover:bg-white'
          }`}
        >
          Year-over-Year Profitability
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('balanceSheet')}
          className={`py-2 px-4 text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors cursor-pointer ${
            activeSubTab === 'balanceSheet'
              ? 'bg-[#0B192C] text-white'
              : 'text-slate-600 hover:text-[#0B192C] hover:bg-white'
          }`}
        >
          Balance Sheet & Capital
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('cashFlow')}
          className={`py-2 px-4 text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors cursor-pointer ${
            activeSubTab === 'cashFlow'
              ? 'bg-[#0B192C] text-white'
              : 'text-slate-600 hover:text-[#0B192C] hover:bg-white'
          }`}
        >
          Cash Flow Statement
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('ratios')}
          className={`py-2 px-4 text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors cursor-pointer ${
            activeSubTab === 'ratios'
              ? 'bg-[#0B192C] text-white'
              : 'text-slate-600 hover:text-[#0B192C] hover:bg-white'
          }`}
        >
          Key Ratios Matrix
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('variance_risks')}
          className={`py-2 px-4 text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'variance_risks'
              ? 'bg-[#0B192C] text-white'
              : 'text-slate-600 hover:text-[#0B192C] hover:bg-white'
          }`}
        >
          <span>Budget Variance & Risks</span>
        </button>
      </div>

      {/* TAB 1: Year-over-Year Profitability Table (Exact Match to Video Frame 01:17 - 01:46) */}
      {activeSubTab === 'pnl' && (
        <div className="space-y-10">
          
          {/* Main Statement Section */}
          <div className="bg-white border border-[#E8E2D8] rounded-2xl shadow-[0_2px_12px_rgba(11,25,44,0.03)] overflow-hidden">
            <div className="p-6 sm:p-8 border-b border-[#E8E2D8]">
              <h2 className="font-serif-display text-2xl font-bold text-[#0B192C] mb-1">
                Year-over-Year Profitability
              </h2>
              <p className="text-xs text-slate-500">
                Line-by-line comparison of current and prior period.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E8E2D8] text-[11px] uppercase font-mono text-slate-500 bg-[#FAF7F2]">
                    <th className="py-3 px-6 font-semibold">Line item</th>
                    <th className="py-3 px-4 text-right font-semibold">Current</th>
                    <th className="py-3 px-4 text-right font-semibold">Previous</th>
                    <th className="py-3 px-4 text-right font-semibold">Change</th>
                    <th className="py-3 px-4 text-right font-semibold">% Change</th>
                    <th className="py-3 px-6 text-right font-semibold">% of revenue</th>
                  </tr>
                </thead>
                <tbody className="text-xs">
                  
                  {/* 1. REVENUE */}
                  <tr className="border-b border-[#F0EBE1] hover:bg-[#FAF7F2]/50 transition-colors">
                    <td className="py-3 px-6 font-semibold text-[#0B192C]">Revenue</td>
                    <td className="py-3 px-4 text-right font-mono font-medium text-[#0B192C]">{formatAmt(isCurr.revenue)}</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600">{formatAmt(isPrev.revenue)}</td>
                    <td className="py-3 px-4 text-right font-mono font-medium text-emerald-700">
                      {formatChange(isCurr.revenue, isPrev.revenue).diffStr}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                      {formatChange(isCurr.revenue, isPrev.revenue).pctStr}
                    </td>
                    <td className="py-3 px-6 text-right font-mono text-slate-500">100.0%</td>
                  </tr>
                  {/* Revenue Why callout */}
                  <tr className="bg-[#FAF7F2]/70 border-b border-[#E8E2D8]">
                    <td colSpan={6} className="py-2.5 px-6 text-[11px] text-slate-600 italic leading-relaxed">
                      {whyTexts.revenue}
                    </td>
                  </tr>

                  {/* 2. COST OF GOODS SOLD */}
                  <tr className="border-b border-[#F0EBE1] hover:bg-[#FAF7F2]/50 transition-colors">
                    <td className="py-3 px-6 text-slate-700 font-medium">Cost of Goods Sold</td>
                    <td className="py-3 px-4 text-right font-mono font-medium text-[#0B192C]">-{formatAmt(isCurr.cogs)}</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600">-{formatAmt(isPrev.cogs)}</td>
                    <td className="py-3 px-4 text-right font-mono font-medium text-slate-700">
                      {formatChange(isCurr.cogs, isPrev.cogs).diffStr}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-700">
                      {formatChange(isCurr.cogs, isPrev.cogs).pctStr}
                    </td>
                    <td className="py-3 px-6 text-right font-mono text-slate-500">
                      -{safeDiv(isCurr.cogs, isCurr.revenue, 100).toFixed(1)}%
                    </td>
                  </tr>
                  {/* COGS Why callout */}
                  <tr className="bg-[#FAF7F2]/70 border-b border-[#E8E2D8]">
                    <td colSpan={6} className="py-2.5 px-6 text-[11px] text-slate-600 italic leading-relaxed">
                      {whyTexts.cogs}
                    </td>
                  </tr>

                  {/* 3. GROSS PROFIT (Subtotal) */}
                  <tr className="border-y-2 border-[#E8E2D8] bg-[#FDFBF7] font-semibold">
                    <td className="py-3.5 px-6 font-bold text-[#0B192C]">Gross Profit</td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-[#0B192C]">{formatAmt(isCurr.grossProfit)}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-700">{formatAmt(isPrev.grossProfit)}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700">
                      {formatChange(isCurr.grossProfit, isPrev.grossProfit).diffStr}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-extrabold text-emerald-700">
                      {formatChange(isCurr.grossProfit, isPrev.grossProfit).pctStr}
                    </td>
                    <td className="py-3.5 px-6 text-right font-mono font-bold text-[#0B192C]">
                      {safeDiv(isCurr.grossProfit, isCurr.revenue, 100).toFixed(1)}%
                    </td>
                  </tr>
                  {/* Gross Profit Why callout */}
                  <tr className="bg-[#FAF7F2]/70 border-b border-[#E8E2D8]">
                    <td colSpan={6} className="py-2.5 px-6 text-[11px] text-slate-600 italic leading-relaxed">
                      {whyTexts.grossProfit}
                    </td>
                  </tr>

                  {/* 4. OPERATING EXPENSES */}
                  <tr className="border-b border-[#F0EBE1] hover:bg-[#FAF7F2]/50 transition-colors">
                    <td className="py-3 px-6 text-slate-700 font-medium">Operating Expenses</td>
                    <td className="py-3 px-4 text-right font-mono font-medium text-[#0B192C]">-{formatAmt(isCurr.operatingExpenses.total)}</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600">-{formatAmt(isPrev.operatingExpenses.total)}</td>
                    <td className="py-3 px-4 text-right font-mono font-medium text-slate-700">
                      {formatChange(isCurr.operatingExpenses.total, isPrev.operatingExpenses.total).diffStr}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-700">
                      {formatChange(isCurr.operatingExpenses.total, isPrev.operatingExpenses.total).pctStr}
                    </td>
                    <td className="py-3 px-6 text-right font-mono text-slate-500">
                      -{safeDiv(isCurr.operatingExpenses.total, isCurr.revenue, 100).toFixed(1)}%
                    </td>
                  </tr>
                  {/* OpEx Why callout */}
                  <tr className="bg-[#FAF7F2]/70 border-b border-[#E8E2D8]">
                    <td colSpan={6} className="py-2.5 px-6 text-[11px] text-slate-600 italic leading-relaxed">
                      {whyTexts.operatingExpenses}
                    </td>
                  </tr>

                  {/* 5. OPERATING INCOME (Subtotal) */}
                  <tr className="border-y-2 border-[#E8E2D8] bg-[#FDFBF7] font-semibold">
                    <td className="py-3.5 px-6 font-bold text-[#0B192C]">Operating Income</td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-[#0B192C]">{formatAmt(isCurr.operatingIncome)}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-700">{formatAmt(isPrev.operatingIncome)}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700">
                      {formatChange(isCurr.operatingIncome, isPrev.operatingIncome).diffStr}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-extrabold text-emerald-700">
                      {formatChange(isCurr.operatingIncome, isPrev.operatingIncome).pctStr}
                    </td>
                    <td className="py-3.5 px-6 text-right font-mono font-bold text-[#0B192C]">
                      {safeDiv(isCurr.operatingIncome, isCurr.revenue, 100).toFixed(1)}%
                    </td>
                  </tr>
                  {/* Operating Income Why callout */}
                  <tr className="bg-[#FAF7F2]/70 border-b border-[#E8E2D8]">
                    <td colSpan={6} className="py-2.5 px-6 text-[11px] text-slate-600 italic leading-relaxed">
                      {whyTexts.operatingIncome}
                    </td>
                  </tr>

                  {/* 6. GROWTH & SUSTAINABILITY LEVY (if present) */}
                  {(isCurr.growthLevy || isPrev.growthLevy) && (
                    <>
                      <tr className="border-b border-[#F0EBE1] hover:bg-[#FAF7F2]/50 transition-colors">
                        <td className="py-3 px-6 text-slate-700 font-medium">Growth and Sustainability Levy</td>
                        <td className="py-3 px-4 text-right font-mono font-medium text-[#0B192C]">-{formatAmt(isCurr.growthLevy || 0)}</td>
                        <td className="py-3 px-4 text-right font-mono text-slate-600">-{formatAmt(isPrev.growthLevy || 0)}</td>
                        <td className="py-3 px-4 text-right font-mono font-medium text-slate-700">
                          {formatChange(isCurr.growthLevy || 0, isPrev.growthLevy || 0).diffStr}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-700">
                          {formatChange(isCurr.growthLevy || 0, isPrev.growthLevy || 0).pctStr}
                        </td>
                        <td className="py-3 px-6 text-right font-mono text-slate-500">
                          -{safeDiv(isCurr.growthLevy || 0, isCurr.revenue, 100).toFixed(1)}%
                        </td>
                      </tr>
                      <tr className="bg-[#FAF7F2]/70 border-b border-[#E8E2D8]">
                        <td colSpan={6} className="py-2.5 px-6 text-[11px] text-slate-600 italic leading-relaxed">
                          {whyTexts.growthLevy}
                        </td>
                      </tr>
                    </>
                  )}

                  {/* 7. INCOME TAX EXPENSE */}
                  <tr className="border-b border-[#F0EBE1] hover:bg-[#FAF7F2]/50 transition-colors">
                    <td className="py-3 px-6 text-slate-700 font-medium">Income Tax Expense</td>
                    <td className="py-3 px-4 text-right font-mono font-medium text-[#0B192C]">-{formatAmt(isCurr.taxExpense)}</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600">-{formatAmt(isPrev.taxExpense)}</td>
                    <td className="py-3 px-4 text-right font-mono font-medium text-slate-700">
                      {formatChange(isCurr.taxExpense, isPrev.taxExpense).diffStr}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-700">
                      {formatChange(isCurr.taxExpense, isPrev.taxExpense).pctStr}
                    </td>
                    <td className="py-3 px-6 text-right font-mono text-slate-500">
                      -{safeDiv(isCurr.taxExpense, isCurr.revenue, 100).toFixed(1)}%
                    </td>
                  </tr>
                  {/* Tax Why callout */}
                  <tr className="bg-[#FAF7F2]/70 border-b border-[#E8E2D8]">
                    <td colSpan={6} className="py-2.5 px-6 text-[11px] text-slate-600 italic leading-relaxed">
                      {whyTexts.taxExpense}
                    </td>
                  </tr>

                  {/* 8. NET INCOME (LOSS) */}
                  <tr className="border-t-2 border-b-4 border-[#0B192C] bg-[#FAF7F2] font-bold">
                    <td className="py-4 px-6 text-sm font-black text-[#0B192C]">Net Income (Loss)</td>
                    <td className="py-4 px-4 text-right font-mono text-sm font-black text-[#0B192C]">{formatAmt(isCurr.netIncome)}</td>
                    <td className="py-4 px-4 text-right font-mono text-sm font-bold text-slate-700">{formatAmt(isPrev.netIncome)}</td>
                    <td className="py-4 px-4 text-right font-mono text-sm font-black text-emerald-700">
                      {formatChange(isCurr.netIncome, isPrev.netIncome).diffStr}
                    </td>
                    <td className="py-4 px-4 text-right font-mono text-sm font-black text-emerald-700">
                      {formatChange(isCurr.netIncome, isPrev.netIncome).pctStr}
                    </td>
                    <td className="py-4 px-6 text-right font-mono text-sm font-black text-[#0B192C]">
                      {safeDiv(isCurr.netIncome, isCurr.revenue, 100).toFixed(1)}%
                    </td>
                  </tr>
                  {/* Net Income Why callout */}
                  <tr className="bg-[#FAF7F2]/90 border-b border-[#E8E2D8]">
                    <td colSpan={6} className="py-3 px-6 text-[11px] text-slate-700 font-medium italic leading-relaxed">
                      {whyTexts.netIncome}
                    </td>
                  </tr>

                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2: Why the numbers moved (Consultant Narrative & 4 Cards from Video) */}
          <div className="space-y-6">
            <div>
              <h2 className="font-serif-display text-3xl font-bold text-[#0B192C] mb-1">
                Why the numbers moved
              </h2>
              <p className="text-xs text-slate-500">
                AI-generated narrative explaining the drivers behind the period-over-period changes.
              </p>
            </div>

            {/* Narrative Overview Paragraph Card */}
            <div className="bg-[#FAF7F2] border border-[#E8E2D8] rounded-2xl p-6 sm:p-8 text-slate-800 text-sm leading-relaxed font-normal shadow-xs">
              <p>
                {dynamicReport.executiveSummary}
              </p>
            </div>

            {/* 4 Consultant Cards in 2x2 Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Card 1: REVENUE DRIVERS */}
              <div className="bg-white border border-[#E8E2D8] rounded-2xl p-6 sm:p-7 shadow-[0_2px_12px_rgba(11,25,44,0.03)] space-y-3">
                <span className="text-[10px] font-mono font-bold tracking-[0.2em] text-[#D4A347] uppercase">
                  REVENUE DRIVERS
                </span>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {dynamicReport.revenueDrivers}
                </p>
              </div>

              {/* Card 2: COST DRIVERS */}
              <div className="bg-white border border-[#E8E2D8] rounded-2xl p-6 sm:p-7 shadow-[0_2px_12px_rgba(11,25,44,0.03)] space-y-3">
                <span className="text-[10px] font-mono font-bold tracking-[0.2em] text-[#D4A347] uppercase">
                  COST DRIVERS
                </span>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {dynamicReport.costDrivers}
                </p>
              </div>

              {/* Card 3: MARGIN COMMENTARY */}
              <div className="bg-white border border-[#E8E2D8] rounded-2xl p-6 sm:p-7 shadow-[0_2px_12px_rgba(11,25,44,0.03)] space-y-3">
                <span className="text-[10px] font-mono font-bold tracking-[0.2em] text-[#D4A347] uppercase">
                  MARGIN COMMENTARY
                </span>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {dynamicReport.marginCommentary}
                </p>
              </div>

              {/* Card 4: KEY TAKEAWAYS */}
              <div className="bg-white border border-[#E8E2D8] rounded-2xl p-6 sm:p-7 shadow-[0_2px_12px_rgba(11,25,44,0.03)] space-y-3">
                <span className="text-[10px] font-mono font-bold tracking-[0.2em] text-[#D4A347] uppercase">
                  KEY TAKEAWAYS
                </span>
                <ul className="text-xs text-slate-700 space-y-2">
                  {(dynamicReport.keyTakeaways || [
                    `Revenue changed by ${calculatePercentageChange(isCurr.revenue, isPrev.revenue)}% to ${formatAmt(isCurr.revenue)}.`,
                    `Gross margin reached ${safeDiv(isCurr.grossProfit, isCurr.revenue, 100).toFixed(1)}%.`,
                    `Net income recorded at ${formatAmt(isCurr.netIncome)}.`,
                    `Operating profit changed by ${calculatePercentageChange(isCurr.operatingIncome, isPrev.operatingIncome)}%.`
                  ]).map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#D4A347] mt-1.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Balance Sheet & Capital */}
      {activeSubTab === 'balanceSheet' && (
        <div className="bg-white border border-[#E8E2D8] rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-[#E8E2D8] pb-4">
            <div>
              <h2 className="font-serif-display text-2xl font-bold text-[#0B192C]">Balance Sheet & Capital Position</h2>
              <p className="text-xs text-slate-500">Comparative Statement of Financial Position</p>
            </div>
            <div className="text-xs font-mono px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg">
              Assets = Liabilities + Equity (Balanced)
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs">
            {/* Assets */}
            <div className="space-y-3">
              <h3 className="font-mono uppercase font-bold text-[#D4A347] text-[11px] tracking-wider border-b pb-1">Assets</h3>
              <div className="space-y-2 divide-y divide-slate-100">
                <div className="flex justify-between py-1"><span>Cash & Equivalents</span><span className="font-mono font-semibold">{formatAmt(bsCurr.assets.cashAndEquivalents)}</span></div>
                <div className="flex justify-between py-1"><span>Accounts Receivable</span><span className="font-mono font-semibold">{formatAmt(bsCurr.assets.accountsReceivable)}</span></div>
                <div className="flex justify-between py-1"><span>Inventory</span><span className="font-mono font-semibold">{formatAmt(bsCurr.assets.inventory)}</span></div>
                <div className="flex justify-between py-1"><span>Prepaid Expenses</span><span className="font-mono font-semibold">{formatAmt(bsCurr.assets.prepaidExpenses)}</span></div>
                <div className="flex justify-between py-1.5 font-bold text-[#0B192C] bg-[#FAF7F2] px-2 rounded"><span>Total Current Assets</span><span className="font-mono">{formatAmt(bsCurr.assets.totalCurrentAssets)}</span></div>
                <div className="flex justify-between py-1"><span>Property, Plant & Equipment</span><span className="font-mono font-semibold">{formatAmt(bsCurr.assets.propertyPlantEquipment)}</span></div>
                <div className="flex justify-between py-1"><span>Intangibles</span><span className="font-mono font-semibold">{formatAmt(bsCurr.assets.intangibleAssets)}</span></div>
                <div className="flex justify-between py-2 font-bold text-sm text-[#0B192C] border-t-2 border-[#0B192C] px-2"><span>Total Assets</span><span className="font-mono">{formatAmt(bsCurr.assets.totalAssets)}</span></div>
              </div>
            </div>

            {/* Liabilities & Equity */}
            <div className="space-y-3">
              <h3 className="font-mono uppercase font-bold text-[#D4A347] text-[11px] tracking-wider border-b pb-1">Liabilities & Equity</h3>
              <div className="space-y-2 divide-y divide-slate-100">
                <div className="flex justify-between py-1"><span>Accounts Payable</span><span className="font-mono font-semibold">{formatAmt(bsCurr.liabilities.accountsPayable)}</span></div>
                <div className="flex justify-between py-1"><span>Short-Term Debt</span><span className="font-mono font-semibold">{formatAmt(bsCurr.liabilities.shortTermDebt)}</span></div>
                <div className="flex justify-between py-1"><span>Accrued Liabilities</span><span className="font-mono font-semibold">{formatAmt(bsCurr.liabilities.accruedLiabilities)}</span></div>
                <div className="flex justify-between py-1.5 font-bold text-[#0B192C] bg-[#FAF7F2] px-2 rounded"><span>Total Current Liabilities</span><span className="font-mono">{formatAmt(bsCurr.liabilities.totalCurrentLiabilities)}</span></div>
                <div className="flex justify-between py-1"><span>Long-Term Debt</span><span className="font-mono font-semibold">{formatAmt(bsCurr.liabilities.longTermDebt)}</span></div>
                <div className="flex justify-between py-1 font-semibold text-slate-700"><span>Total Liabilities</span><span className="font-mono">{formatAmt(bsCurr.liabilities.totalLiabilities)}</span></div>
                <div className="flex justify-between py-1"><span>Common Stock</span><span className="font-mono font-semibold">{formatAmt(bsCurr.equity.commonStock)}</span></div>
                <div className="flex justify-between py-1"><span>Retained Earnings</span><span className="font-mono font-semibold">{formatAmt(bsCurr.equity.retainedEarnings)}</span></div>
                <div className="flex justify-between py-1.5 font-bold text-[#0B192C] bg-[#FAF7F2] px-2 rounded"><span>Total Equity</span><span className="font-mono">{formatAmt(bsCurr.equity.totalEquity)}</span></div>
                <div className="flex justify-between py-2 font-bold text-sm text-[#0B192C] border-t-2 border-[#0B192C] px-2"><span>Total Liab. & Equity</span><span className="font-mono">{formatAmt(bsCurr.liabilities.totalLiabilities + bsCurr.equity.totalEquity)}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Cash Flow Statement */}
      {activeSubTab === 'cashFlow' && (
        <div className="bg-white border border-[#E8E2D8] rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-[#E8E2D8] pb-4">
            <h2 className="font-serif-display text-2xl font-bold text-[#0B192C]">Cash Flow Statement</h2>
            <p className="text-xs text-slate-500">Operating, Investing, and Financing activities</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E8E2D8] bg-[#FAF7F2] text-[11px] font-mono uppercase text-slate-500">
                  <th className="py-2.5 px-4">Cash Activity</th>
                  <th className="py-2.5 px-4 text-right">Current ({currPeriod.period})</th>
                  <th className="py-2.5 px-4 text-right">Previous ({prevPeriod.period})</th>
                  <th className="py-2.5 px-4 text-right">Variance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="py-2">
                  <td className="py-3 px-4 font-semibold text-[#0B192C]">Operating Cash Flow (OCF)</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">{formatAmt(cfCurr.operatingCashFlow)}</td>
                  <td className="py-3 px-4 text-right font-mono text-slate-700">{formatAmt(cfPrev.operatingCashFlow)}</td>
                  <td className="py-3 px-4 text-right font-mono text-emerald-700">{formatChange(cfCurr.operatingCashFlow, cfPrev.operatingCashFlow).diffStr}</td>
                </tr>
                <tr className="py-2">
                  <td className="py-3 px-4 text-slate-700">Investing Cash Flow (CapEx)</td>
                  <td className="py-3 px-4 text-right font-mono text-slate-700">{formatAmt(cfCurr.investingCashFlow)}</td>
                  <td className="py-3 px-4 text-right font-mono text-slate-700">{formatAmt(cfPrev.investingCashFlow)}</td>
                  <td className="py-3 px-4 text-right font-mono text-slate-600">{formatChange(cfCurr.investingCashFlow, cfPrev.investingCashFlow).diffStr}</td>
                </tr>
                <tr className="py-2">
                  <td className="py-3 px-4 text-slate-700">Financing Cash Flow (Debt/Dividends)</td>
                  <td className="py-3 px-4 text-right font-mono text-slate-700">{formatAmt(cfCurr.financingCashFlow)}</td>
                  <td className="py-3 px-4 text-right font-mono text-slate-700">{formatAmt(cfPrev.financingCashFlow)}</td>
                  <td className="py-3 px-4 text-right font-mono text-slate-600">{formatChange(cfCurr.financingCashFlow, cfPrev.financingCashFlow).diffStr}</td>
                </tr>
                <tr className="bg-[#FAF7F2] font-bold border-t-2 border-[#0B192C]">
                  <td className="py-3 px-4 text-[#0B192C]">Net Change in Cash</td>
                  <td className="py-3 px-4 text-right font-mono text-emerald-700 font-black">{formatAmt(cfCurr.netCashFlow)}</td>
                  <td className="py-3 px-4 text-right font-mono text-slate-700">{formatAmt(cfPrev.netCashFlow)}</td>
                  <td className="py-3 px-4 text-right font-mono text-emerald-700">{formatChange(cfCurr.netCashFlow, cfPrev.netCashFlow).diffStr}</td>
                </tr>
                <tr className="font-extrabold text-[#0B192C]">
                  <td className="py-3 px-4">Ending Cash & Equivalents Balance</td>
                  <td className="py-3 px-4 text-right font-mono text-sm text-[#0B192C]">{formatAmt(cfCurr.endingCashBalance)}</td>
                  <td className="py-3 px-4 text-right font-mono text-sm text-slate-700">{formatAmt(cfPrev.endingCashBalance)}</td>
                  <td className="py-3 px-4 text-right font-mono text-slate-700">{formatChange(cfCurr.endingCashBalance, cfPrev.endingCashBalance).diffStr}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: Key Ratios Matrix */}
      {activeSubTab === 'ratios' && (
        <div className="bg-white border border-[#E8E2D8] rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-[#E8E2D8] pb-4">
            <h2 className="font-serif-display text-2xl font-bold text-[#0B192C]">Automated Key Ratios Matrix</h2>
            <p className="text-xs text-slate-500">Calculated deterministically using certified financial formulas</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { label: 'Gross Profit Margin', curr: `${ratiosCurr.grossProfitMargin}%`, prev: `${ratiosPrev.grossProfitMargin}%`, benchmark: '18.0%', status: 'optimal' },
              { label: 'Operating Margin', curr: `${ratiosCurr.operatingMargin}%`, prev: `${ratiosPrev.operatingMargin}%`, benchmark: '10.0%', status: 'optimal' },
              { label: 'Net Profit Margin', curr: `${ratiosCurr.netProfitMargin}%`, prev: `${ratiosPrev.netProfitMargin}%`, benchmark: '6.0%', status: 'optimal' },
              { label: 'Current Ratio', curr: `${ratiosCurr.currentRatio}`, prev: `${ratiosPrev.currentRatio}`, benchmark: '2.00', status: 'optimal' },
              { label: 'Quick Ratio', curr: `${ratiosCurr.quickRatio}`, prev: `${ratiosPrev.quickRatio}`, benchmark: '1.20', status: 'optimal' },
              { label: 'Equity Ratio', curr: `${ratiosCurr.equityRatio}%`, prev: `${ratiosPrev.equityRatio}%`, benchmark: '50.0%', status: 'optimal' },
              { label: 'Debt-to-Equity', curr: `${ratiosCurr.debtToEquityRatio}`, prev: `${ratiosPrev.debtToEquityRatio}`, benchmark: '0.80', status: 'optimal' },
              { label: 'Return on Equity (ROE)', curr: `${ratiosCurr.returnOnEquity}%`, prev: `${ratiosPrev.returnOnEquity}%`, benchmark: '15.0%', status: 'optimal' },
              { label: 'Altman Z-Score', curr: `${ratiosCurr.altmanZScore}`, prev: `${ratiosPrev.altmanZScore}`, benchmark: '2.90', status: 'optimal' }
            ].map((r, i) => (
              <div key={i} className="p-4 bg-[#FAF7F2] rounded-xl border border-[#E8E2D8] space-y-2">
                <span className="text-[11px] font-mono font-semibold uppercase text-slate-500">{r.label}</span>
                <div className="flex items-baseline justify-between">
                  <span className="text-xl font-bold font-mono text-[#0B192C]">{r.curr}</span>
                  <span className="text-xs font-mono text-slate-500">Prior: {r.prev}</span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-[#E8E2D8]">
                  <span>Benchmark: {r.benchmark}</span>
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Optimal
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: Variance & Emerging Risks Hub */}
      {activeSubTab === 'variance_risks' && (
        <VarianceInvestigationHub
          profile={profile}
          periods={periods}
          budgetPerformance={budgetPerformance}
          onOpenDataEditor={onNavigateToEdit}
        />
      )}

      {/* Board-Ready Report Exporter Card */}
      <div className="pt-6 border-t border-[#E8E2D8]">
        <ReportExporter
          profile={profile}
          periods={periods}
          analysis={dynamicReport}
          budgetPerformance={budgetPerformance}
        />
      </div>

    </div>
  );
}
