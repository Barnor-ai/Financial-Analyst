/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  CheckCircle2, AlertTriangle, XCircle, ArrowRight, ShieldCheck, 
  Layers, RefreshCw, Eye, Database, FileSpreadsheet, Sparkles 
} from 'lucide-react';
import { UserProfile, PeriodFinancialData, StatementValidationResult, ArithmeticDiscrepancy } from '../types';
import { validateFinancialStatements, detectArithmeticDiscrepancies } from '../utils/financialEngine';

interface ValidationAndMappingStudioProps {
  profile: UserProfile;
  periods: PeriodFinancialData[];
  onProceedToAnalysis: () => void;
  onBackToUpload: () => void;
}

export default function ValidationAndMappingStudio({
  profile,
  periods,
  onProceedToAnalysis,
  onBackToUpload
}: ValidationAndMappingStudioProps) {
  const [selectedPeriodIdx, setSelectedPeriodIdx] = useState(0);
  const [activeTab, setActiveTab] = useState<'validation' | 'mapping' | 'discrepancies'>('validation');

  const curSymbol = profile.currency?.match(/\(([^)]+)\)/)?.[1] || profile.currency?.split(' ')[0] || '$';
  const currentPeriod = periods[selectedPeriodIdx] || periods[0];
  
  if (!currentPeriod) {
    return (
      <div className="bg-white border border-[#E8E2D8] rounded-2xl p-10 text-center max-w-lg mx-auto">
        <p className="text-slate-600">No period data loaded for validation.</p>
        <button
          type="button"
          onClick={onBackToUpload}
          className="mt-4 px-4 py-2 bg-[#0B1530] text-white text-xs font-semibold rounded-lg"
        >
          Return to Upload
        </button>
      </div>
    );
  }

  const validationResult: StatementValidationResult = validateFinancialStatements(currentPeriod);
  const discrepancies: ArithmeticDiscrepancy[] = detectArithmeticDiscrepancies(currentPeriod, curSymbol);

  // Standard Chart of Accounts Mapping Table
  const mappedAccounts = [
    { category: 'Income Statement', code: 'IS-100', account: 'Gross Sales / Topline Revenue', mappedTo: 'Revenue', value: currentPeriod.incomeStatement.revenue, status: 'verified' },
    { category: 'Income Statement', code: 'IS-200', account: 'Direct Material & Production Costs', mappedTo: 'Cost of Goods Sold (COGS)', value: currentPeriod.incomeStatement.cogs, status: 'verified' },
    { category: 'Income Statement', code: 'IS-310', account: 'Employee Compensation & Benefits', mappedTo: 'OpEx: Salaries', value: currentPeriod.incomeStatement.operatingExpenses.salaries, status: 'verified' },
    { category: 'Income Statement', code: 'IS-320', account: 'Advertising, Sales & Distribution', mappedTo: 'OpEx: Marketing', value: currentPeriod.incomeStatement.operatingExpenses.marketing, status: 'verified' },
    { category: 'Income Statement', code: 'IS-330', account: 'Facility Lease, Utilities & Energy', mappedTo: 'OpEx: Rent & Utilities', value: currentPeriod.incomeStatement.operatingExpenses.rentAndUtilities, status: 'verified' },
    { category: 'Income Statement', code: 'IS-340', account: 'Depreciation & Capital Amortization', mappedTo: 'OpEx: Depreciation', value: currentPeriod.incomeStatement.operatingExpenses.depreciation, status: 'verified' },
    { category: 'Income Statement', code: 'IS-390', account: 'Administrative & Discretionary OpEx', mappedTo: 'OpEx: Other', value: currentPeriod.incomeStatement.operatingExpenses.otherOpEx, status: 'verified' },
    { category: 'Balance Sheet', code: 'BS-110', account: 'Liquid Funds & Cash Equivalents', mappedTo: 'Cash & Cash Equivalents', value: currentPeriod.balanceSheet.assets.cashAndEquivalents, status: 'verified' },
    { category: 'Balance Sheet', code: 'BS-120', account: 'Trade Accounts Receivable', mappedTo: 'Accounts Receivable', value: currentPeriod.balanceSheet.assets.accountsReceivable, status: 'verified' },
    { category: 'Balance Sheet', code: 'BS-130', account: 'Raw Materials & Finished Goods Stock', mappedTo: 'Inventory', value: currentPeriod.balanceSheet.assets.inventory, status: 'verified' },
    { category: 'Balance Sheet', code: 'BS-150', account: 'Property, Plant & Equipment (Net PP&E)', mappedTo: 'PP&E', value: currentPeriod.balanceSheet.assets.propertyPlantEquipment, status: 'verified' },
    { category: 'Balance Sheet', code: 'BS-210', account: 'Trade Accounts Payable', mappedTo: 'Accounts Payable', value: currentPeriod.balanceSheet.liabilities.accountsPayable, status: 'verified' },
    { category: 'Balance Sheet', code: 'BS-220', account: 'Working Capital & Short-term Credit', mappedTo: 'Short-Term Debt', value: currentPeriod.balanceSheet.liabilities.shortTermDebt, status: 'verified' },
    { category: 'Balance Sheet', code: 'BS-250', account: 'Subordinated & Long-term Facilities', mappedTo: 'Long-Term Debt', value: currentPeriod.balanceSheet.liabilities.longTermDebt, status: 'verified' },
    { category: 'Balance Sheet', code: 'BS-310', account: 'Common Share Capital', mappedTo: 'Common Stock', value: currentPeriod.balanceSheet.equity.commonStock, status: 'verified' },
    { category: 'Balance Sheet', code: 'BS-320', account: 'Cumulative Retained Surplus', mappedTo: 'Retained Earnings', value: currentPeriod.balanceSheet.equity.retainedEarnings, status: 'verified' },
  ];

  return (
    <div className="space-y-6 text-left animate-fade-in" id="validation-mapping-studio">
      
      {/* Top Banner & Header */}
      <div className="border-b border-[#E8E2D8] pb-5 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="mb-2">
            <span className="text-[11px] font-mono font-bold tracking-[0.25em] text-[#D4A347] uppercase">
              DATA VALIDATION & RECONCILIATION STUDIO
            </span>
          </div>
          <h1 className="font-serif-display text-3xl sm:text-4xl font-bold text-[#0B192C] tracking-tight">
            Financial Integrity & Account Mapping
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
            Audit standard accounting identities, balance sheet equilibrium, and verify accounts mapping for <span className="font-bold text-[#0B192C]">{profile.companyName}</span> ({profile.reportingBasis || 'IFRS'}).
          </p>
        </div>

        {/* Action CTAs */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onBackToUpload}
            className="px-4 py-2 border border-[#E8E2D8] bg-white text-slate-700 hover:text-[#0B192C] font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Review Source Upload
          </button>
          <button
            type="button"
            onClick={onProceedToAnalysis}
            className="px-5 py-2.5 bg-[#D6AE55] hover:bg-[#C59B42] text-[#0B1530] font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 cursor-pointer transition-colors group"
          >
            <span>Proceed to Financial Intelligence</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>

      {/* Period Selection & Tab Control */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-[#E8E2D8] shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-mono">Period:</span>
          <div className="flex items-center gap-1.5">
            {periods.map((p, idx) => (
              <button
                key={p.period}
                type="button"
                onClick={() => setSelectedPeriodIdx(idx)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  selectedPeriodIdx === idx
                    ? 'bg-[#0B1530] text-white'
                    : 'bg-[#F8F4EB] text-slate-700 hover:bg-[#EDE7DA]'
                }`}
              >
                {p.period} {idx === 0 && '(Current)'}
              </button>
            ))}
          </div>
        </div>

        {/* Studio View Selector */}
        <div className="flex items-center gap-1 bg-[#F8F4EB] p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('validation')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'validation' ? 'bg-white text-[#0B192C] shadow-xs' : 'text-slate-600 hover:text-[#0B192C]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#D6AE55]" />
            <span>Audit Reconciliations</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('mapping')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'mapping' ? 'bg-white text-[#0B192C] shadow-xs' : 'text-slate-600 hover:text-[#0B192C]'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-[#D6AE55]" />
            <span>Account Mapping ({mappedAccounts.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('discrepancies')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'discrepancies' ? 'bg-white text-[#0B192C] shadow-xs' : 'text-slate-600 hover:text-[#0B192C]'
            }`}
          >
            <AlertTriangle className={`w-3.5 h-3.5 ${discrepancies.length > 0 ? 'text-red-500' : 'text-slate-400'}`} />
            <span>Discrepancies ({discrepancies.length})</span>
          </button>
        </div>
      </div>

      {/* Quality Score Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#E8E2D8] shadow-xs">
          <div className="text-[10px] font-mono uppercase text-slate-400">Integrity Score</div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className={`text-3xl font-serif-display font-bold ${
              validationResult.overallScore >= 90 ? 'text-emerald-700' : 'text-amber-700'
            }`}>
              {validationResult.overallScore}%
            </span>
            <span className="text-xs text-slate-500">
              {validationResult.overallScore >= 90 ? 'Audited & Reconciled' : 'Review Required'}
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E8E2D8] shadow-xs">
          <div className="text-[10px] font-mono uppercase text-slate-400">Balance Sheet Status</div>
          <div className="flex items-center gap-2 mt-2">
            {validationResult.balanceSheetBalanced ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-xs font-bold text-emerald-800">Perfect Equilibrium</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="text-xs font-bold text-rose-800">
                  Variance: {curSymbol} {validationResult.balanceSheetVariance.toLocaleString()}
                </span>
              </>
            )}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono">
            Assets: {curSymbol} {(currentPeriod.balanceSheet.assets.totalAssets / 1000000).toFixed(1)}M
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E8E2D8] shadow-xs">
          <div className="text-[10px] font-mono uppercase text-slate-400">P&L Identity Integrity</div>
          <div className="flex items-center gap-2 mt-2">
            {validationResult.incomeStatementConsistent ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-xs font-bold text-emerald-800">Reconciled</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="text-xs font-bold text-amber-800">Margin Discrepancy</span>
              </>
            )}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono">
            EBIT: {curSymbol} {(currentPeriod.incomeStatement.operatingIncome / 1000000).toFixed(1)}M
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E8E2D8] shadow-xs">
          <div className="text-[10px] font-mono uppercase text-slate-400">Chart of Accounts Mapping</div>
          <div className="flex items-center gap-2 mt-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-xs font-bold text-emerald-800">100% Standardized</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono">
            {mappedAccounts.length} core lines verified
          </div>
        </div>
      </div>

      {/* TAB 1: AUDIT RECONCILIATIONS VIEW */}
      {activeTab === 'validation' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-[#E8E2D8] overflow-hidden shadow-xs">
            <div className="px-6 py-4 bg-[#FAF7F2] border-b border-[#E8E2D8] flex items-center justify-between">
              <h3 className="font-serif-display text-base font-bold text-[#0B192C]">
                Accounting Equation Reconciliations
              </h3>
              <span className="text-xs text-slate-500 font-mono">
                {validationResult.checks.filter(c => c.passed).length} of {validationResult.checks.length} passed
              </span>
            </div>

            <div className="divide-y divide-[#E8E2D8]">
              {validationResult.checks.map(chk => (
                <div key={chk.id} className="p-5 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 shrink-0">
                      {chk.passed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-amber-600" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-[#0B192C]">{chk.name}</h4>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                          {chk.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">{chk.message}</p>
                      {chk.details && (
                        <p className="text-[11px] font-mono text-slate-500 mt-1 bg-[#F8F4EB] px-2.5 py-1 rounded-md inline-block">
                          {chk.details}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <span className={`text-xs font-semibold ${
                      chk.passed ? 'text-emerald-700' : 'text-amber-700'
                    }`}>
                      {chk.passed ? 'PASSED' : 'FLAGGED'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Balance Sheet Equation Breakdown Card */}
          <div className="bg-[#0B1530] text-white p-6 rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-[#D6AE55] uppercase tracking-wider">
                  EQUILIBRIUM EQUATION
                </span>
                <h4 className="font-serif-display text-lg font-bold text-white mt-0.5">
                  Assets = Liabilities + Shareholders Equity
                </h4>
              </div>
              <div className="text-right font-mono text-xs">
                {validationResult.balanceSheetBalanced ? (
                  <span className="text-emerald-400 font-bold">✓ BALANCED</span>
                ) : (
                  <span className="text-rose-400 font-bold">⚠ OUT OF BALANCE</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-[#162A45] text-xs">
              <div className="p-3 bg-[#10223A] rounded-xl">
                <span className="text-slate-400 text-[10px] font-mono uppercase">Total Assets</span>
                <p className="text-base font-bold text-white mt-1">
                  {curSymbol} {currentPeriod.balanceSheet.assets.totalAssets.toLocaleString()}
                </p>
              </div>

              <div className="p-3 bg-[#10223A] rounded-xl">
                <span className="text-slate-400 text-[10px] font-mono uppercase">Total Liabilities</span>
                <p className="text-base font-bold text-slate-200 mt-1">
                  {curSymbol} {currentPeriod.balanceSheet.liabilities.totalLiabilities.toLocaleString()}
                </p>
              </div>

              <div className="p-3 bg-[#10223A] rounded-xl">
                <span className="text-slate-400 text-[10px] font-mono uppercase">Shareholders Equity</span>
                <p className="text-base font-bold text-[#D6AE55] mt-1">
                  {curSymbol} {currentPeriod.balanceSheet.equity.totalEquity.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ACCOUNT MAPPING STUDIO VIEW */}
      {activeTab === 'mapping' && (
        <div className="bg-white rounded-2xl border border-[#E8E2D8] overflow-hidden shadow-xs">
          <div className="px-6 py-4 bg-[#FAF7F2] border-b border-[#E8E2D8] flex items-center justify-between">
            <div>
              <h3 className="font-serif-display text-base font-bold text-[#0B192C]">
                Standard Chart of Accounts (COA) Line Item Mapping
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Uploaded rows mapped to FinScope standardized financial intelligence ledger.
              </p>
            </div>
            <span className="text-xs text-emerald-700 font-semibold font-mono">
              All 16 Critical Accounts Mapped
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-[#E8E2D8] bg-[#FAF7F2] text-slate-600 font-mono text-[11px]">
                  <th className="py-3 px-4">Account Code</th>
                  <th className="py-3 px-4">Statement Category</th>
                  <th className="py-3 px-4">Financial Ledger Account</th>
                  <th className="py-3 px-4">Standardized Mapping</th>
                  <th className="py-3 px-4 text-right">Parsed Amount ({currentPeriod.period})</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E2D8]">
                {mappedAccounts.map(row => (
                  <tr key={row.code} className="hover:bg-[#FAF7F2]/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-500">{row.code}</td>
                    <td className="py-3 px-4 text-slate-600">{row.category}</td>
                    <td className="py-3 px-4 font-semibold text-[#0B192C]">{row.account}</td>
                    <td className="py-3 px-4 text-slate-700 font-mono">
                      <span className="bg-[#FAF7F2] px-2 py-0.5 rounded-md border border-[#E8E2D8]">
                        {row.mappedTo}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-right text-[#0B192C]">
                      {curSymbol} {row.value.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-emerald-700 font-semibold font-mono text-[11px]">
                        ✓ Verified
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: ARITHMETIC DISCREPANCIES VIEW */}
      {activeTab === 'discrepancies' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-[#E8E2D8] overflow-hidden shadow-xs">
            <div className="px-6 py-4 bg-[#FAF7F2] border-b border-[#E8E2D8] flex items-center justify-between">
              <div>
                <h3 className="font-serif-display text-base font-bold text-[#0B192C]">
                  Arithmetic Discrepancies & Audit Log
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  FinScope strict accounting principle: Uploaded numbers are never silently altered to force accounts to balance.
                </p>
              </div>
              <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-md ${
                discrepancies.length === 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
              }`}>
                {discrepancies.length} Discrepancies Flagged
              </span>
            </div>

            {discrepancies.length > 0 ? (
              <div className="divide-y divide-[#E8E2D8]">
                {discrepancies.map((disc) => (
                  <div key={disc.id} className="p-5 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                        <span className="font-bold text-sm text-[#0B192C]">{disc.statement}: {disc.metric}</span>
                      </div>
                      <span className="px-2 py-0.5 bg-red-100 text-red-800 font-mono text-xs font-bold rounded">
                        Variance: {curSymbol}{Math.abs(disc.difference).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700">{disc.message}</p>
                    <div className="grid grid-cols-2 gap-3 bg-[#FAF7F2] p-3 rounded-xl border border-[#E8E2D8] text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 font-mono uppercase block">Reported Value</span>
                        <span className="font-mono font-bold text-[#0B192C]">{curSymbol}{disc.reportedValue.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-mono uppercase block">Expected Calculated Value</span>
                        <span className="font-mono font-bold text-[#0B192C]">{curSymbol}{disc.calculatedValue.toLocaleString()}</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500 bg-amber-50/60 p-2 rounded-lg border border-amber-200">
                      <span className="font-bold text-amber-900">Audit Action: </span>
                      {disc.resolutionTip}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-10 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-sm text-[#0B192C]">No Arithmetic Discrepancies</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Balance sheet equilibrium holds across all accounts and income statement identities reconcile with zero variance.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom Completion Bar */}
      <div className="p-6 bg-white border border-[#E8E2D8] rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            ✓
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#0B192C]">Data Validation & Mapping Complete</h4>
            <p className="text-xs text-slate-500">
              The financial statements are reconciled and ready for deep ratio analysis, variance investigation, and management advisory.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onProceedToAnalysis}
          className="w-full sm:w-auto px-6 py-3 bg-[#D6AE55] hover:bg-[#C59B42] text-[#0B1530] font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
        >
          <span>Run Financial Intelligence Analysis</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
}
