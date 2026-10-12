/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  TrendingUp, TrendingDown, AlertTriangle, ShieldAlert, CheckCircle2, 
  Filter, Search, Layers, ChevronRight, ArrowUpRight, ArrowDownRight, 
  HelpCircle, DollarSign, Target, Activity, Flame
} from 'lucide-react';
import { 
  UserProfile, PeriodFinancialData, BudgetVsActual, 
  EmergingRiskItem, VarianceAnalysisItem, DuPontBreakdown 
} from '../types';
import { 
  calculateEnhancedVariances, detectEmergingRisks, calculateDuPont, 
  calculatePercentageChange, safeDiv 
} from '../utils/financialEngine';

interface VarianceInvestigationHubProps {
  profile: UserProfile;
  periods: PeriodFinancialData[];
  budgetPerformance?: BudgetVsActual[];
  onOpenDataEditor?: () => void;
}

export default function VarianceInvestigationHub({
  profile,
  periods,
  budgetPerformance = [],
  onOpenDataEditor
}: VarianceInvestigationHubProps) {
  const [activeTab, setActiveTab] = useState<'budget' | 'risks' | 'dupont' | 'yoy'>('budget');
  const [filterMode, setFilterMode] = useState<'all' | 'significant' | 'unfavorable'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const curSymbol = profile.currency?.match(/\(([^)]+)\)/)?.[1] || profile.currency?.split(' ')[0] || '$';
  
  // Reverse chronological periods
  const sortedPeriods = [...periods].sort((a, b) => b.period.localeCompare(a.period, undefined, { numeric: true }));
  const currPeriod = sortedPeriods[0];
  const priorPeriod = sortedPeriods.length > 1 ? sortedPeriods[1] : null;

  if (!currPeriod) {
    return (
      <div className="bg-white border border-[#E8E2D8] rounded-2xl p-10 text-center max-w-lg mx-auto">
        <p className="text-slate-600">No period loaded for variance investigation.</p>
      </div>
    );
  }

  // 1. Enhanced Budget Variances
  const varianceItems: VarianceAnalysisItem[] = calculateEnhancedVariances(budgetPerformance, currPeriod);

  // 2. Emerging Risks
  const emergingRisks: EmergingRiskItem[] = detectEmergingRisks(currPeriod, priorPeriod, budgetPerformance);

  // 3. DuPont Breakdown
  const dupont: DuPontBreakdown = calculateDuPont(currPeriod);

  // Filter variance items
  const filteredVariances = varianceItems.filter(item => {
    if (searchTerm && !item.category.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (filterMode === 'significant') return item.isSignificant;
    if (filterMode === 'unfavorable') return !item.isFavorable;
    return true;
  });

  return (
    <div className="space-y-6 text-left animate-fade-in" id="variance-investigation-hub">
      
      {/* Header Banner */}
      <div className="border-b border-[#E8E2D8] pb-5 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="mb-2">
            <span className="text-[11px] font-mono font-bold tracking-[0.25em] text-[#D4A347] uppercase">
              MANAGEMENT DECISION SUPPORT & VARIANCE AUDIT
            </span>
          </div>
          <h1 className="font-serif-display text-3xl sm:text-4xl font-bold text-[#0B192C] tracking-tight">
            Variance Investigation & Emerging Risks
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
            Evaluate budget execution, track cost overruns, investigate material variances, and review early warning signals for <span className="font-bold text-[#0B192C]">{profile.companyName}</span>.
          </p>
        </div>

        {/* Sub-view Switcher Tabs */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#E8E2D8] shadow-xs shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('budget')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'budget' ? 'bg-[#0B1530] text-white' : 'text-slate-600 hover:text-[#0B192C]'
            }`}
          >
            <Target className="w-3.5 h-3.5 text-[#D6AE55]" />
            <span>Budget vs Actual</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('risks')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'risks' ? 'bg-[#0B1530] text-white' : 'text-slate-600 hover:text-[#0B192C]'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            <span>Emerging Risks ({emergingRisks.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('dupont')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'dupont' ? 'bg-[#0B1530] text-white' : 'text-slate-600 hover:text-[#0B192C]'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-[#D6AE55]" />
            <span>DuPont Analysis</span>
          </button>
        </div>
      </div>

      {/* TAB 1: BUDGET VS ACTUAL INVESTIGATION */}
      {activeTab === 'budget' && (
        <div className="space-y-4">
          
          {/* Controls Bar: Search & Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-[#E8E2D8] shadow-xs">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-mono">Filter:</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setFilterMode('all')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    filterMode === 'all' ? 'bg-[#0B192C] text-white' : 'bg-[#FAF7F2] text-slate-700 hover:bg-[#E8E2D8]'
                  }`}
                >
                  All Categories ({varianceItems.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('significant')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    filterMode === 'significant' ? 'bg-[#0B192C] text-white' : 'bg-[#FAF7F2] text-slate-700 hover:bg-[#E8E2D8]'
                  }`}
                >
                  Significant (&gt;5%)
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('unfavorable')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    filterMode === 'unfavorable' ? 'bg-rose-700 text-white' : 'bg-[#FAF7F2] text-rose-700 hover:bg-rose-50'
                  }`}
                >
                  Unfavorable Overruns
                </button>
              </div>
            </div>

            {onOpenDataEditor && (
              <button
                type="button"
                onClick={onOpenDataEditor}
                className="text-xs text-[#0B192C] hover:text-[#D6AE55] font-semibold underline underline-offset-4 cursor-pointer"
              >
                Edit Budget Targets
              </button>
            )}
          </div>

          {/* Variance Table */}
          <div className="bg-white rounded-2xl border border-[#E8E2D8] overflow-hidden shadow-xs">
            <div className="px-6 py-4 bg-[#FAF7F2] border-b border-[#E8E2D8] flex items-center justify-between">
              <div>
                <h3 className="font-serif-display text-base font-bold text-[#0B192C]">
                  Operational Budget Execution Ledger ({currPeriod.period})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Green indicates favorable performance (surplus revenue or expense savings); Rose indicates adverse variance.
                </p>
              </div>
              <span className="text-xs font-mono text-slate-500">
                Currency: {profile.currency}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-[#E8E2D8] bg-[#FAF7F2] text-slate-600 font-mono text-[11px]">
                    <th className="py-3 px-4">Cost / Revenue Line</th>
                    <th className="py-3 px-4 text-right">Budgeted</th>
                    <th className="py-3 px-4 text-right">Actual Result</th>
                    <th className="py-3 px-4 text-right">Variance ($)</th>
                    <th className="py-3 px-4 text-right">Variance (%)</th>
                    <th className="py-3 px-4 text-center">Impact</th>
                    <th className="py-3 px-4">Root Cause Tag</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E2D8]">
                  {filteredVariances.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        No variances matching current filter.
                      </td>
                    </tr>
                  ) : (
                    filteredVariances.map((item, idx) => {
                      const isFav = item.isFavorable;
                      return (
                        <tr key={idx} className="hover:bg-[#FAF7F2]/50 transition-colors">
                          <td className="py-3.5 px-4 font-semibold text-[#0B192C]">
                            {item.category}
                            {item.isSignificant && (
                              <span className="ml-2 text-[10px] font-mono text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                                Material
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-right text-slate-600">
                            {curSymbol} {item.budgeted.toLocaleString()}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-right text-[#0B192C]">
                            {curSymbol} {item.actual.toLocaleString()}
                          </td>
                          <td className={`py-3.5 px-4 font-mono font-bold text-right ${
                            isFav ? 'text-emerald-700' : 'text-rose-700'
                          }`}>
                            {item.variance >= 0 ? '+' : '-'}{curSymbol} {Math.abs(item.variance).toLocaleString()}
                          </td>
                          <td className={`py-3.5 px-4 font-mono font-bold text-right ${
                            isFav ? 'text-emerald-700' : 'text-rose-700'
                          }`}>
                            {item.variancePercentage >= 0 ? '+' : ''}{item.variancePercentage.toFixed(1)}%
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] ${
                              isFav ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}>
                              {isFav ? 'Favorable (F)' : 'Unfavorable (U)'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-500 uppercase text-[10px]">
                            {item.rootCauseTag?.replace('_', ' ')}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: EMERGING RISKS & EARLY WARNINGS */}
      {activeTab === 'risks' && (
        <div className="space-y-4">
          <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#E8E2D8] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-600" />
              <div>
                <h4 className="text-sm font-bold text-[#0B192C]">Early Warning Financial Health Radar</h4>
                <p className="text-xs text-slate-600">
                  Algorithmic screening across liquidity constraints, margin dilution, leverage covenants, and working capital cycles.
                </p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-slate-500">
              {emergingRisks.length} Signal(s) Active
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {emergingRisks.map(risk => {
              const isCrit = risk.severity === 'critical';
              const isHigh = risk.severity === 'high';
              const isMed = risk.severity === 'medium';
              return (
                <div
                  key={risk.id}
                  className={`bg-white p-6 rounded-2xl border transition-all shadow-xs space-y-4 ${
                    isCrit ? 'border-rose-300 ring-1 ring-rose-200' :
                    isHigh ? 'border-amber-300' : 'border-[#E8E2D8]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                          isCrit ? 'bg-rose-100 text-rose-800' :
                          isHigh ? 'bg-amber-100 text-amber-800' :
                          isMed ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {risk.severity} Severity
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          · {risk.category}
                        </span>
                      </div>
                      <h4 className="font-serif-display text-base font-bold text-[#0B192C] mt-1.5">
                        {risk.title}
                      </h4>
                    </div>

                    <div className="text-right shrink-0 font-mono">
                      <div className="text-xs font-bold text-[#0B192C]">{risk.observedValue}</div>
                      <div className="text-[10px] text-slate-400">Benchmark: {risk.threshold}</div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {risk.explanation}
                  </p>

                  <div className="pt-3 border-t border-[#E8E2D8] bg-[#FAF7F2] -mx-6 -mb-6 p-4 rounded-b-2xl">
                    <span className="text-[10px] font-mono uppercase text-[#D6AE55] font-bold block mb-1">
                      Recommended CFO Action Playbook
                    </span>
                    <p className="text-xs text-[#0B192C] font-medium">
                      {risk.cfoAction}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: DUPONT 3-STAGE ANALYSIS */}
      {activeTab === 'dupont' && (
        <div className="space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E8E2D8] shadow-xs space-y-6">
            <div>
              <span className="text-[10px] font-mono uppercase text-[#D6AE55] font-bold tracking-wider">
                DUPONT FORMULA DECOMPOSITION
              </span>
              <h3 className="font-serif-display text-2xl font-bold text-[#0B192C] mt-1">
                Return on Equity (ROE) Breakdown
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
                Decomposes how efficiently the business translates revenue, asset utilization, and balance sheet leverage into shareholder returns.
              </p>
            </div>

            {/* DuPont 3-Pillar Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Pillar 1: Net Margin */}
              <div className="p-5 bg-[#FAF7F2] rounded-2xl border border-[#E8E2D8] space-y-2">
                <span className="text-[10px] font-mono text-slate-500 uppercase">Pillar 1: Profitability</span>
                <h4 className="text-xs font-bold text-slate-700">Net Profit Margin</h4>
                <div className="text-3xl font-serif-display font-bold text-[#0B192C]">
                  {dupont.netProfitMargin.toFixed(1)}%
                </div>
                <p className="text-[11px] text-slate-500">
                  Formula: Net Income / Total Revenue. Measures operational conversion after all operating costs, tax, and depreciation.
                </p>
              </div>

              {/* Pillar 2: Asset Turnover */}
              <div className="p-5 bg-[#FAF7F2] rounded-2xl border border-[#E8E2D8] space-y-2">
                <span className="text-[10px] font-mono text-slate-500 uppercase">Pillar 2: Efficiency</span>
                <h4 className="text-xs font-bold text-slate-700">Asset Turnover</h4>
                <div className="text-3xl font-serif-display font-bold text-[#0B192C]">
                  {dupont.assetTurnover.toFixed(2)}x
                </div>
                <p className="text-[11px] text-slate-500">
                  Formula: Revenue / Total Assets. Measures how intensely commercial assets generate top-line gross billings.
                </p>
              </div>

              {/* Pillar 3: Financial Leverage */}
              <div className="p-5 bg-[#FAF7F2] rounded-2xl border border-[#E8E2D8] space-y-2">
                <span className="text-[10px] font-mono text-slate-500 uppercase">Pillar 3: Leverage</span>
                <h4 className="text-xs font-bold text-slate-700">Equity Multiplier</h4>
                <div className="text-3xl font-serif-display font-bold text-[#0B192C]">
                  {dupont.equityMultiplier.toFixed(2)}x
                </div>
                <p className="text-[11px] text-slate-500">
                  Formula: Total Assets / Total Equity. Measures the degree of debt financing supporting the asset base.
                </p>
              </div>

            </div>

            {/* Composite ROE Result */}
            <div className="p-6 bg-[#0B1530] text-white rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-mono text-[#D6AE55] uppercase tracking-wider">
                  Resulting Composite Metric
                </span>
                <h4 className="font-serif-display text-2xl font-bold text-white mt-0.5">
                  Return on Equity: {dupont.roe.toFixed(1)}%
                </h4>
                <p className="text-xs text-slate-300 mt-1 font-mono">
                  {dupont.formulaDisplay}
                </p>
              </div>

              <div className="text-right sm:border-l sm:border-[#162A45] sm:pl-6">
                <span className="text-xs text-slate-400">Benchmark Rating</span>
                <div className="text-sm font-bold text-emerald-400 mt-0.5">
                  {dupont.roe >= 15 ? 'Top Quartile Returns' : dupont.roe >= 10 ? 'Healthy Yield' : 'Moderate'}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
