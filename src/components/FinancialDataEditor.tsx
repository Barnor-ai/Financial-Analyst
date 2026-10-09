/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState } from 'react';
import { PeriodFinancialData, BudgetVsActual } from '../types';
import { 
  Calculator, ShieldAlert, CheckCircle2
} from 'lucide-react';

interface FinancialDataEditorProps {
  periods: PeriodFinancialData[];
  setPeriods: (p: PeriodFinancialData[]) => void;
  budgetPerformance: BudgetVsActual[];
  setBudgetPerformance: (b: BudgetVsActual[]) => void;
  currency: string;
}

export default function FinancialDataEditor({ 
  periods, setPeriods, budgetPerformance, setBudgetPerformance, currency 
}: FinancialDataEditorProps) {
  
  const [activeTab, setActiveTab] = useState<'is' | 'bs' | 'cf' | 'budget'>('is');
  
  const curSymbol = currency.match(/\(([^)]+)\)/)?.[1] || '$';

  // Sort periods reverse-chronologically so Current Year (most recent) is first
  const sortedPeriods = [...periods].sort((a, b) => b.period.localeCompare(a.period, undefined, { numeric: true }));
  const currPeriod = sortedPeriods[0] || periods[0];
  const prevPeriod = sortedPeriods.length > 1 ? sortedPeriods[1] : sortedPeriods[0];

  // Find their real indices in the periods array to mutate properly
  const currIdx = periods.findIndex(p => p.period === currPeriod?.period);
  const prevIdx = sortedPeriods.length > 1 
    ? periods.findIndex(p => p.period === prevPeriod?.period)
    : currIdx;

  if (!currPeriod || !prevPeriod) return null;

  const handleFieldChange = (
    targetIdx: number, 
    sheetType: 'is' | 'bs' | 'cf', 
    section: 'assets' | 'liabilities' | 'equity' | 'operatingExpenses' | null, 
    key: string, 
    value: number
  ) => {
    const updated = JSON.parse(JSON.stringify(periods));
    const target = updated[targetIdx];

    if (sheetType === 'is') {
      const is = target.incomeStatement;
      if (section === 'operatingExpenses') {
        is.operatingExpenses[key] = value;
        is.operatingExpenses.total = 
          is.operatingExpenses.salaries + 
          is.operatingExpenses.marketing + 
          is.operatingExpenses.rentAndUtilities + 
          is.operatingExpenses.depreciation + 
          is.operatingExpenses.otherOpEx;
      } else {
        is[key] = value;
      }
      is.grossProfit = is.revenue - is.cogs;
      is.operatingIncome = is.grossProfit - is.operatingExpenses.total;
      is.netIncome = is.operatingIncome - is.interestExpense - is.taxExpense;

    } else if (sheetType === 'bs') {
      const bs = target.balanceSheet;
      if (section === 'assets') {
        bs.assets[key] = value;
        bs.assets.totalCurrentAssets = 
          bs.assets.cashAndEquivalents + 
          bs.assets.accountsReceivable + 
          bs.assets.inventory + 
          bs.assets.prepaidExpenses;
        bs.assets.totalNonCurrentAssets = bs.assets.propertyPlantEquipment + bs.assets.intangibleAssets;
        bs.assets.totalAssets = bs.assets.totalCurrentAssets + bs.assets.totalNonCurrentAssets;
      } else if (section === 'liabilities') {
        bs.liabilities[key] = value;
        bs.liabilities.totalCurrentLiabilities = 
          bs.liabilities.accountsPayable + 
          bs.liabilities.shortTermDebt + 
          bs.liabilities.accruedLiabilities;
        bs.liabilities.totalNonCurrentLiabilities = bs.liabilities.longTermDebt;
        bs.liabilities.totalLiabilities = bs.liabilities.totalCurrentLiabilities + bs.liabilities.totalNonCurrentLiabilities;
      } else if (section === 'equity') {
        bs.equity[key] = value;
        bs.equity.totalEquity = bs.equity.commonStock + bs.equity.retainedEarnings;
      }

    } else if (sheetType === 'cf') {
      const cf = target.cashFlow;
      cf[key] = value;
      cf.netCashFlow = cf.operatingCashFlow + cf.investingCashFlow + cf.financingCashFlow;
      
      const priorCash = targetIdx > 0 
        ? updated[targetIdx - 1].balanceSheet.assets.cashAndEquivalents 
        : 150000;
      cf.endingCashBalance = priorCash + cf.netCashFlow;
    }

    setPeriods(updated);
  };

  const handleBudgetFieldChange = (index: number, key: 'budgeted' | 'actual', value: number) => {
    const updated = [...budgetPerformance];
    const item = { ...updated[index], [key]: value };
    
    item.variance = item.category === 'Revenue' 
      ? item.actual - item.budgeted 
      : item.budgeted - item.actual; 
      
    item.variancePercentage = item.budgeted > 0 
      ? Number(((item.variance / item.budgeted) * 100).toFixed(2))
      : 0;

    updated[index] = item;
    setBudgetPerformance(updated);
  };

  const renderLineRow = (
    label: string,
    sheetType: 'is' | 'bs' | 'cf',
    section: 'assets' | 'liabilities' | 'equity' | 'operatingExpenses' | null,
    key: string,
    currVal: number,
    prevVal: number,
    isSubtotal = false
  ) => {
    const variance = currVal - prevVal;
    const variancePercentage = prevVal === 0 ? 0 : (variance / prevVal) * 100;

    if (isSubtotal) {
      return (
        <tr className="bg-[#FAF7F2] font-semibold border-y border-[#E8E2D8]">
          <td className="py-3 px-4 text-[#0B192C] text-xs uppercase font-semibold font-mono">{label}</td>
          {/* Current Year Subtotal First */}
          <td className="py-3 px-4 text-right font-mono text-xs text-[#0B192C] font-bold">{curSymbol}{currVal.toLocaleString()}</td>
          {/* Previous Year Subtotal Second */}
          <td className="py-3 px-4 text-right font-mono text-xs text-[#0B192C]">{curSymbol}{prevVal.toLocaleString()}</td>
          <td className={`py-3 px-4 text-right font-mono text-xs font-semibold ${variance >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
            {variance >= 0 ? '+' : ''}{variance.toLocaleString()}
          </td>
          <td className={`py-3 px-4 text-right font-mono text-xs font-bold ${variance >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
            {variance >= 0 ? '+' : ''}{variancePercentage.toFixed(1)}%
          </td>
        </tr>
      );
    }

    return (
      <tr className="hover:bg-slate-50 border-b border-[#F0EBE1] transition-colors">
        <td className="py-2.5 px-4 text-slate-700 text-xs font-medium">{label}</td>
        
        {/* Current Year edit cell First */}
        <td className="py-1.5 px-4 text-right">
          <div className="inline-flex items-center bg-white border border-[#D5CDC0] rounded-lg overflow-hidden focus-within:border-[#0B192C] focus-within:ring-1 focus-within:ring-[#0B192C] transition-all">
            <span className="text-[10px] pl-2 text-slate-400 font-semibold">{curSymbol}</span>
            <input
              type="number"
              value={currVal || ''}
              onChange={(e) => handleFieldChange(currIdx, sheetType, section, key, Number(e.target.value) || 0)}
              className="w-24 px-1.5 py-1 text-xs text-right bg-transparent border-none text-[#0B192C] font-semibold font-mono focus:outline-none"
            />
          </div>
        </td>

        {/* Previous Year edit cell Second */}
        <td className="py-1.5 px-4 text-right">
          <div className="inline-flex items-center bg-white border border-[#D5CDC0] rounded-lg overflow-hidden focus-within:border-[#0B192C] focus-within:ring-1 focus-within:ring-[#0B192C] transition-all">
            <span className="text-[10px] pl-2 text-slate-400 font-semibold">{curSymbol}</span>
            <input
              type="number"
              value={prevVal || ''}
              onChange={(e) => handleFieldChange(prevIdx, sheetType, section, key, Number(e.target.value) || 0)}
              className="w-24 px-1.5 py-1 text-xs text-right bg-transparent border-none text-[#0B192C] font-semibold font-mono focus:outline-none"
            />
          </div>
        </td>

        {/* Variance Figures */}
        <td className={`py-2.5 px-4 text-right font-mono text-xs font-semibold ${variance >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
          {variance >= 0 ? '+' : ''}{variance.toLocaleString()}
        </td>

        {/* Variance Percentage */}
        <td className={`py-2.5 px-4 text-right font-mono text-xs font-bold ${variance >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
          {variance >= 0 ? '+' : ''}{variancePercentage.toFixed(1)}%
        </td>
      </tr>
    );
  };

  const currAssets = currPeriod.balanceSheet.assets.totalAssets;
  const currLiabPlusEquity = currPeriod.balanceSheet.liabilities.totalLiabilities + currPeriod.balanceSheet.equity.totalEquity;
  const prevAssets = prevPeriod.balanceSheet.assets.totalAssets;
  const prevLiabPlusEquity = prevPeriod.balanceSheet.liabilities.totalLiabilities + prevPeriod.balanceSheet.equity.totalEquity;

  const currentBSBalanced = Math.abs(currAssets - currLiabPlusEquity) < 5;
  const prevBSBalanced = Math.abs(prevAssets - prevLiabPlusEquity) < 5;

  return (
    <div className="bg-white border border-[#E8E2D8] rounded-2xl overflow-hidden shadow-[0_2px_12px_rgba(11,25,44,0.04)]" id="statement-editor-root">
      
      {/* Editor Header */}
      <div className="bg-[#FAF7F2] border-b border-[#E8E2D8] p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white rounded-xl text-[#0B192C] border border-[#E8E2D8] shadow-xs">
            <Calculator className="w-5 h-5 text-[#D4A347]" />
          </div>
          <div className="text-left">
            <h3 className="font-serif-display text-lg font-semibold text-[#0B192C]">
              Comparative Statements Ledger
            </h3>
            <p className="text-xs text-slate-500">
              Live spreadsheet edits automatically calculate accounting identities, ratios, and risk metrics.
            </p>
          </div>
        </div>

        <div className="text-xs bg-white border border-[#E8E2D8] px-3.5 py-1.5 rounded-lg text-slate-700 flex items-center gap-2">
          Comparing: <span className="text-[#0B192C] font-bold font-mono">{currPeriod.period} (Current)</span> vs <span className="text-slate-600 font-semibold font-mono">{prevPeriod.period} (Previous)</span>
        </div>
      </div>

      {/* Sheet Type Navigation Tabs */}
      <div className="bg-white border-b border-[#E8E2D8] px-5 flex gap-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('is')}
          className={`py-3.5 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all cursor-pointer shrink-0 ${
            activeTab === 'is' 
              ? 'border-[#0B192C] text-[#0B192C] font-bold' 
              : 'border-transparent text-slate-500 hover:text-[#0B192C]'
          }`}
        >
          Income Statement
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('bs')}
          className={`py-3.5 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all cursor-pointer shrink-0 ${
            activeTab === 'bs' 
              ? 'border-[#0B192C] text-[#0B192C] font-bold' 
              : 'border-transparent text-slate-500 hover:text-[#0B192C]'
          }`}
        >
          Balance Sheet
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('cf')}
          className={`py-3.5 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all cursor-pointer shrink-0 ${
            activeTab === 'cf' 
              ? 'border-[#0B192C] text-[#0B192C] font-bold' 
              : 'border-transparent text-slate-500 hover:text-[#0B192C]'
          }`}
        >
          Cash Flow Statement
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('budget')}
          className={`py-3.5 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all cursor-pointer shrink-0 ${
            activeTab === 'budget' 
              ? 'border-[#0B192C] text-[#0B192C] font-bold' 
              : 'border-transparent text-slate-500 hover:text-[#0B192C]'
          }`}
        >
          Budget vs Actual Performance
        </button>
      </div>

      {/* Tables Content */}
      <div className="p-6">
        
        {activeTab === 'is' && (
          <div className="space-y-4 overflow-x-auto">
            <table className="w-full min-w-[700px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[#E8E2D8] text-[11px] text-[#0B192C] uppercase font-mono tracking-wider font-bold bg-[#FAF7F2]">
                  <th className="py-2.5 px-4">Operating Account Details</th>
                  <th className="py-2.5 px-4 text-right font-mono">Current ({currPeriod.period})</th>
                  <th className="py-2.5 px-4 text-right font-mono">Previous ({prevPeriod.period})</th>
                  <th className="py-2.5 px-4 text-right">Variance ({curSymbol})</th>
                  <th className="py-2.5 px-4 text-right">Variance (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EBE1]">
                {renderLineRow('Gross Revenue / Billings', 'is', null, 'revenue', currPeriod.incomeStatement.revenue, prevPeriod.incomeStatement.revenue)}
                {renderLineRow('Cost of Goods Sold (COGS)', 'is', null, 'cogs', currPeriod.incomeStatement.cogs, prevPeriod.incomeStatement.cogs)}
                
                {renderLineRow('Gross Operating Income Surplus', 'is', null, 'grossProfit', currPeriod.incomeStatement.grossProfit, prevPeriod.incomeStatement.grossProfit, true)}
                
                {renderLineRow('Operating: Salaries & Payroll Outflows', 'is', 'operatingExpenses', 'salaries', currPeriod.incomeStatement.operatingExpenses.salaries, prevPeriod.incomeStatement.operatingExpenses.salaries)}
                {renderLineRow('Operating: Marketing & Customer Acquisition', 'is', 'operatingExpenses', 'marketing', currPeriod.incomeStatement.operatingExpenses.marketing, prevPeriod.incomeStatement.operatingExpenses.marketing)}
                {renderLineRow('Operating: Facility Rents & Utilities', 'is', 'operatingExpenses', 'rentAndUtilities', currPeriod.incomeStatement.operatingExpenses.rentAndUtilities, prevPeriod.incomeStatement.operatingExpenses.rentAndUtilities)}
                {renderLineRow('Operating: Depreciation & Amortization', 'is', 'operatingExpenses', 'depreciation', currPeriod.incomeStatement.operatingExpenses.depreciation, prevPeriod.incomeStatement.operatingExpenses.depreciation)}
                {renderLineRow('Operating: Other Overhead Outlays', 'is', 'operatingExpenses', 'otherOpEx', currPeriod.incomeStatement.operatingExpenses.otherOpEx, prevPeriod.incomeStatement.operatingExpenses.otherOpEx)}
                
                {renderLineRow('Total Operating Expenses (OpEx)', 'is', null, 'operatingExpensesTotal', currPeriod.incomeStatement.operatingExpenses.total, prevPeriod.incomeStatement.operatingExpenses.total, true)}
                
                {renderLineRow('Operating Profit (EBIT)', 'is', null, 'operatingIncome', currPeriod.incomeStatement.operatingIncome, prevPeriod.incomeStatement.operatingIncome, true)}
                
                {renderLineRow('Financing: Bank Interest Expense', 'is', null, 'interestExpense', currPeriod.incomeStatement.interestExpense, prevPeriod.incomeStatement.interestExpense)}
                {renderLineRow('Corporate Income Tax Accruals', 'is', null, 'taxExpense', currPeriod.incomeStatement.taxExpense, prevPeriod.incomeStatement.taxExpense)}
                
                {renderLineRow('Net Profit (After Taxes)', 'is', null, 'netIncome', currPeriod.incomeStatement.netIncome, prevPeriod.incomeStatement.netIncome, true)}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'bs' && (
          <div className="space-y-6">
            
            {/* Assets Table */}
            <div className="space-y-3 overflow-x-auto">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#0B192C] font-mono">
                Part I: Corporate Assets
              </h4>
              <table className="w-full min-w-[700px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-[#E8E2D8] text-[11px] text-[#0B192C] uppercase font-mono tracking-wider font-bold bg-[#FAF7F2]">
                    <th className="py-2.5 px-4">Asset Class</th>
                    <th className="py-2.5 px-4 text-right">Current ({currPeriod.period})</th>
                    <th className="py-2.5 px-4 text-right">Previous ({prevPeriod.period})</th>
                    <th className="py-2.5 px-4 text-right">Variance ({curSymbol})</th>
                    <th className="py-2.5 px-4 text-right">Variance (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EBE1]">
                  {renderLineRow('Current Assets: Cash & Equivalents', 'bs', 'assets', 'cashAndEquivalents', currPeriod.balanceSheet.assets.cashAndEquivalents, prevPeriod.balanceSheet.assets.cashAndEquivalents)}
                  {renderLineRow('Current Assets: Accounts Receivable (AR)', 'bs', 'assets', 'accountsReceivable', currPeriod.balanceSheet.assets.accountsReceivable, prevPeriod.balanceSheet.assets.accountsReceivable)}
                  {renderLineRow('Current Assets: Inventory Value', 'bs', 'assets', 'inventory', currPeriod.balanceSheet.assets.inventory, prevPeriod.balanceSheet.assets.inventory)}
                  {renderLineRow('Current Assets: Prepaid Expenses', 'bs', 'assets', 'prepaidExpenses', currPeriod.balanceSheet.assets.prepaidExpenses, prevPeriod.balanceSheet.assets.prepaidExpenses)}
                  
                  {renderLineRow('Total Current Assets', 'bs', 'assets', 'totalCurrentAssets', currPeriod.balanceSheet.assets.totalCurrentAssets, prevPeriod.balanceSheet.assets.totalCurrentAssets, true)}
                  
                  {renderLineRow('Non-Current Assets: Property, Plant & Equipment (PP&E)', 'bs', 'assets', 'propertyPlantEquipment', currPeriod.balanceSheet.assets.propertyPlantEquipment, prevPeriod.balanceSheet.assets.propertyPlantEquipment)}
                  {renderLineRow('Non-Current Assets: Intangible Assets & Goodwill', 'bs', 'assets', 'intangibleAssets', currPeriod.balanceSheet.assets.intangibleAssets, prevPeriod.balanceSheet.assets.intangibleAssets)}
                  
                  {renderLineRow('Total Non-Current Assets', 'bs', 'assets', 'totalNonCurrentAssets', currPeriod.balanceSheet.assets.totalNonCurrentAssets, prevPeriod.balanceSheet.assets.totalNonCurrentAssets, true)}
                  {renderLineRow('TOTAL ASSETS', 'bs', 'assets', 'totalAssets', currPeriod.balanceSheet.assets.totalAssets, prevPeriod.balanceSheet.assets.totalAssets, true)}
                </tbody>
              </table>
            </div>

            {/* Liabilities & Equity Table */}
            <div className="space-y-3 overflow-x-auto">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#0B192C] font-mono">
                Part II: Liabilities & Shareholders Equity
              </h4>
              <table className="w-full min-w-[700px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-[#E8E2D8] text-[11px] text-[#0B192C] uppercase font-mono tracking-wider font-bold bg-[#FAF7F2]">
                    <th className="py-2.5 px-4">Financing Account Class</th>
                    <th className="py-2.5 px-4 text-right">Current ({currPeriod.period})</th>
                    <th className="py-2.5 px-4 text-right">Previous ({prevPeriod.period})</th>
                    <th className="py-2.5 px-4 text-right">Variance ({curSymbol})</th>
                    <th className="py-2.5 px-4 text-right">Variance (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EBE1]">
                  {renderLineRow('Current Liab: Accounts Payable (AP)', 'bs', 'liabilities', 'accountsPayable', currPeriod.balanceSheet.liabilities.accountsPayable, prevPeriod.balanceSheet.liabilities.accountsPayable)}
                  {renderLineRow('Current Liab: Short-term Debt', 'bs', 'liabilities', 'shortTermDebt', currPeriod.balanceSheet.liabilities.shortTermDebt, prevPeriod.balanceSheet.liabilities.shortTermDebt)}
                  {renderLineRow('Current Liab: Accrued Liabilities', 'bs', 'liabilities', 'accruedLiabilities', currPeriod.balanceSheet.liabilities.accruedLiabilities, prevPeriod.balanceSheet.liabilities.accruedLiabilities)}
                  
                  {renderLineRow('Total Current Liabilities', 'bs', 'liabilities', 'totalCurrentLiabilities', currPeriod.balanceSheet.liabilities.totalCurrentLiabilities, prevPeriod.balanceSheet.liabilities.totalCurrentLiabilities, true)}
                  
                  {renderLineRow('Non-Current Liab: Long-term Debt & Notes', 'bs', 'liabilities', 'longTermDebt', currPeriod.balanceSheet.liabilities.longTermDebt, prevPeriod.balanceSheet.liabilities.longTermDebt)}
                  
                  {renderLineRow('Total Liabilities', 'bs', 'liabilities', 'totalLiabilities', currPeriod.balanceSheet.liabilities.totalLiabilities, prevPeriod.balanceSheet.liabilities.totalLiabilities, true)}
                  
                  {renderLineRow('Equity: Common Stock Capital', 'bs', 'equity', 'commonStock', currPeriod.balanceSheet.equity.commonStock, prevPeriod.balanceSheet.equity.commonStock)}
                  {renderLineRow('Equity: Retained Earnings', 'bs', 'equity', 'retainedEarnings', currPeriod.balanceSheet.equity.retainedEarnings, prevPeriod.balanceSheet.equity.retainedEarnings)}
                  
                  {renderLineRow('Total Shareholders Equity', 'bs', 'equity', 'totalEquity', currPeriod.balanceSheet.equity.totalEquity, prevPeriod.balanceSheet.equity.totalEquity, true)}
                  {renderLineRow('TOTAL LIABILITIES & EQUITY', 'bs', 'liabilities', 'totalLiabilitiesPlusEquity', currPeriod.balanceSheet.liabilities.totalLiabilities + currPeriod.balanceSheet.equity.totalEquity, prevPeriod.balanceSheet.liabilities.totalLiabilities + prevPeriod.balanceSheet.equity.totalEquity, true)}
                </tbody>
              </table>
            </div>

            {/* Balance equation check boxes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4" id="bs-checker-box">
              <div className={`p-4 rounded-xl border text-xs flex items-start gap-3 justify-between ${
                currentBSBalanced 
                  ? 'bg-emerald-50/60 border-emerald-200 text-emerald-800' 
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}>
                <div>
                  <h5 className="font-bold">Current Period ({currPeriod.period}) Balance:</h5>
                  <p className="text-slate-600 mt-1">
                    Assets: <b>{curSymbol}{currAssets.toLocaleString()}</b> | Liab & Equity: <b>{curSymbol}{currLiabPlusEquity.toLocaleString()}</b>
                  </p>
                </div>
                {currentBSBalanced ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
                )}
              </div>

              <div className={`p-4 rounded-xl border text-xs flex items-start gap-3 justify-between ${
                prevBSBalanced 
                  ? 'bg-emerald-50/60 border-emerald-200 text-emerald-800' 
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}>
                <div>
                  <h5 className="font-bold">Prior Period ({prevPeriod.period}) Balance:</h5>
                  <p className="text-slate-600 mt-1">
                    Assets: <b>{curSymbol}{prevAssets.toLocaleString()}</b> | Liab & Equity: <b>{curSymbol}{prevLiabPlusEquity.toLocaleString()}</b>
                  </p>
                </div>
                {prevBSBalanced ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
                )}
              </div>
            </div>

          </div>
        )}

        {activeTab === 'cf' && (
          <div className="space-y-4 overflow-x-auto">
            <table className="w-full min-w-[700px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[#E8E2D8] text-[11px] text-[#0B192C] uppercase font-mono tracking-wider font-bold bg-[#FAF7F2]">
                  <th className="py-2.5 px-4">Cash Activity Categorization</th>
                  <th className="py-2.5 px-4 text-right font-mono">Current ({currPeriod.period})</th>
                  <th className="py-2.5 px-4 text-right font-mono">Previous ({prevPeriod.period})</th>
                  <th className="py-2.5 px-4 text-right font-mono">Variance ({curSymbol})</th>
                  <th className="py-2.5 px-4 text-right font-mono">Variance (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EBE1]">
                {renderLineRow('Cash from Operations (OCF)', 'cf', null, 'operatingCashFlow', currPeriod.cashFlow.operatingCashFlow, prevPeriod.cashFlow.operatingCashFlow)}
                {renderLineRow('Cash used in Investing / CapEx (ICF)', 'cf', null, 'investingCashFlow', currPeriod.cashFlow.investingCashFlow, prevPeriod.cashFlow.investingCashFlow)}
                {renderLineRow('Cash from Financing / Equity / Debt (FCF)', 'cf', null, 'financingCashFlow', currPeriod.cashFlow.financingCashFlow, prevPeriod.cashFlow.financingCashFlow)}
                
                {renderLineRow('Net Cash Flow Change (OCF + ICF + FCF)', 'cf', null, 'netCashFlow', currPeriod.cashFlow.netCashFlow, prevPeriod.cashFlow.netCashFlow, true)}
                {renderLineRow('Closing Cash Balance', 'cf', null, 'endingCashBalance', currPeriod.cashFlow.endingCashBalance, prevPeriod.cashFlow.endingCashBalance, true)}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'budget' && (
          <div className="space-y-4">
            {budgetPerformance.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs">
                Budget ledger is empty.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-[#E8E2D8] text-[11px] text-[#0B192C] uppercase font-mono tracking-wider font-bold bg-[#FAF7F2]">
                      <th className="py-2.5 px-4">Budget Line Item</th>
                      <th className="py-2.5 px-4 text-right font-mono">Budget ({curSymbol})</th>
                      <th className="py-2.5 px-4 text-right font-mono">Actual ({curSymbol})</th>
                      <th className="py-2.5 px-4 text-right font-mono">Variance ({curSymbol})</th>
                      <th className="py-2.5 px-4 text-right font-mono">Variance (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0EBE1]">
                    {budgetPerformance.map((item, idx) => {
                      const isFavorable = item.variance >= 0;

                      return (
                        <tr key={item.category} className="hover:bg-slate-50 border-b border-[#F0EBE1] transition-colors">
                          <td className="py-3 px-4 text-slate-700 text-xs font-semibold">{item.category}</td>
                          
                          <td className="py-1.5 px-4 text-right">
                            <div className="inline-flex items-center bg-white border border-[#D5CDC0] rounded-lg overflow-hidden focus-within:border-[#0B192C] focus-within:ring-1 focus-within:ring-[#0B192C] transition-all">
                              <span className="text-[10px] pl-2 text-slate-400 font-semibold">{curSymbol}</span>
                              <input
                                type="number"
                                value={item.budgeted || ''}
                                onChange={(e) => handleBudgetFieldChange(idx, 'budgeted', Number(e.target.value) || 0)}
                                className="w-24 px-1.5 py-1 text-xs text-right bg-transparent border-none text-[#0B192C] font-semibold font-mono focus:outline-none"
                              />
                            </div>
                          </td>

                          <td className="py-1.5 px-4 text-right">
                            <div className="inline-flex items-center bg-white border border-[#D5CDC0] rounded-lg overflow-hidden focus-within:border-[#0B192C] focus-within:ring-1 focus-within:ring-[#0B192C] transition-all">
                              <span className="text-[10px] pl-2 text-slate-400 font-semibold">{curSymbol}</span>
                              <input
                                type="number"
                                value={item.actual || ''}
                                onChange={(e) => handleBudgetFieldChange(idx, 'actual', Number(e.target.value) || 0)}
                                className="w-24 px-1.5 py-1 text-xs text-right bg-transparent border-none text-[#0B192C] font-semibold font-mono focus:outline-none"
                              />
                            </div>
                          </td>

                          <td className={`py-3 px-4 text-right font-mono text-xs font-semibold ${isFavorable ? 'text-emerald-700' : 'text-rose-700'}`}>
                            {isFavorable ? '+' : ''}{item.variance.toLocaleString()}
                          </td>

                          <td className="py-3 px-4 text-right">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                              isFavorable 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}>
                              {item.variancePercentage >= 0 ? '+' : ''}{item.variancePercentage}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
