/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { 
  TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, CheckCircle2, 
  FileText, ShieldAlert, Sparkles, ChevronRight, Filter, Building2, 
  Calendar, DollarSign, Layers, AlertTriangle, ExternalLink, HelpCircle,
  Clock, ArrowRight, ShieldCheck, Database
} from 'lucide-react';
import { 
  UserProfile, PeriodFinancialData, FinancialAnalysisReport, 
  BudgetVsActual, SavedAnalysisRecord 
} from '../types';
import { 
  calculateFinancialRatios, calculatePercentageChange, safeDiv,
  calculateEnhancedVariances, detectEmergingRisks 
} from '../utils/financialEngine';
import { GLOBAL_CURRENCIES } from '../data';

interface FinancialHealthDashboardProps {
  profile: UserProfile;
  companies?: UserProfile[];
  periods: PeriodFinancialData[];
  budgetPerformance?: BudgetVsActual[];
  analysis: FinancialAnalysisReport | null;
  savedReports?: SavedAnalysisRecord[];
  currency: string;
  onNavigateToNewAnalysis?: () => void;
  onNavigateToProfitability?: () => void;
  onNavigateToVariance?: () => void;
  onNavigateToReports?: () => void;
  onNavigateToEntities?: () => void;
  onNavigateToDecisions?: () => void;
}

export type TimeGranularity = 'full-year' | 'ytd' | 'quarterly' | 'monthly' | 'comparative';

const PIE_COLORS = ['#0B1530', '#15803D', '#D4A347', '#475569', '#E11D48'];

export default function FinancialHealthDashboard({
  profile,
  companies = [],
  periods,
  budgetPerformance = [],
  analysis,
  savedReports = [],
  currency,
  onNavigateToNewAnalysis,
  onNavigateToProfitability,
  onNavigateToVariance,
  onNavigateToReports,
  onNavigateToEntities,
  onNavigateToDecisions
}: FinancialHealthDashboardProps) {

  // Multi-dimensional Filter State
  const [selectedEntity, setSelectedEntity] = useState<string>(profile.companyName || 'all');
  const [selectedCurrency, setSelectedCurrency] = useState<string>(profile.currency || 'USD ($)');
  const [selectedGranularity, setSelectedGranularity] = useState<TimeGranularity>('full-year');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [selectedCostCentre, setSelectedCostCentre] = useState<string>('all');

  // Reverse chronological sorting so Current Year is first
  const sortedPeriods = useMemo(() => {
    return [...periods].sort((a, b) => b.period.localeCompare(a.period, undefined, { numeric: true }));
  }, [periods]);

  const [selectedFiscalYear, setSelectedFiscalYear] = useState<string>(sortedPeriods[0]?.period || 'all');

  const currPeriod = sortedPeriods[0];
  const prevPeriod = sortedPeriods.length > 1 ? sortedPeriods[1] : sortedPeriods[0];

  const curSymbol = selectedCurrency.match(/\(([^)]+)\)/)?.[1] || selectedCurrency.split(' ')[0] || '$';

  if (!currPeriod) {
    return (
      <div className="bg-white border border-[#E8E2D8] rounded-2xl p-12 text-center max-w-xl mx-auto shadow-xs space-y-4">
        <TrendingUp className="w-10 h-10 text-[#D4A347] mx-auto" />
        <h3 className="font-serif-display text-2xl font-bold text-[#0B192C]">No Financial Data Available</h3>
        <p className="text-xs text-slate-600">Please upload a financial statement or select an entity to populate the executive dashboard.</p>
        {onNavigateToNewAnalysis && (
          <button
            type="button"
            onClick={onNavigateToNewAnalysis}
            className="px-5 py-2.5 bg-[#0B1530] text-white text-xs font-semibold rounded-xl hover:bg-[#162A45] cursor-pointer"
          >
            Upload Financials
          </button>
        )}
      </div>
    );
  }

  const isCurr = currPeriod.incomeStatement;
  const isPrev = prevPeriod.incomeStatement;
  const bsCurr = currPeriod.balanceSheet;
  const bsPrev = prevPeriod?.balanceSheet || bsCurr;
  const cfCurr = currPeriod.cashFlow;
  const cfPrev = prevPeriod?.cashFlow || cfCurr;

  const ratiosCurr = calculateFinancialRatios(currPeriod, prevPeriod);
  const ratiosPrev = prevPeriod ? calculateFinancialRatios(prevPeriod) : ratiosCurr;

  // Variances & Emerging Risks
  const enhancedVariances = calculateEnhancedVariances(budgetPerformance, currPeriod);
  const totalFavorableVariances = enhancedVariances.filter(v => v.isFavorable).reduce((acc, item) => acc + Math.abs(item.variance), 0);
  const totalAdverseVariances = enhancedVariances.filter(v => !v.isFavorable).reduce((acc, item) => acc + Math.abs(item.variance), 0);
  const emergingRisks = detectEmergingRisks(currPeriod, prevPeriod, budgetPerformance);

  // Budget calculations
  const totalBudgetedRev = budgetPerformance.find(b => b.category.toLowerCase().includes('revenue'))?.budgeted;
  const totalActualRev = isCurr.revenue;
  const budgetAchievementPct = totalBudgetedRev ? ((totalActualRev / totalBudgetedRev) * 100).toFixed(1) : null;

  // EBITDA Calculation: Operating Income + Depreciation
  const currDepreciation = isCurr.operatingExpenses?.depreciation || 0;
  const currEbitda = isCurr.operatingIncome + currDepreciation;
  const currEbitdaMargin = safeDiv(currEbitda, isCurr.revenue, 100);

  const prevDepreciation = isPrev.operatingExpenses?.depreciation || 0;
  const prevEbitda = isPrev.operatingIncome + prevDepreciation;

  // Profit Before Tax (EBT): Operating Income - Interest Expense - Growth Levy
  const currPbt = isCurr.operatingIncome - (isCurr.interestExpense || 0) - (isCurr.growthLevy || 0);
  const prevPbt = isPrev.operatingIncome - (isPrev.interestExpense || 0) - (isPrev.growthLevy || 0);

  // Working Capital
  const currWorkingCapital = bsCurr.assets.totalCurrentAssets - bsCurr.liabilities.totalCurrentLiabilities;
  const prevWorkingCapital = bsPrev.assets.totalCurrentAssets - bsPrev.liabilities.totalCurrentLiabilities;

  // Movement Helper
  const calcMovement = (curr: number, prev: number, higherIsBetter = true) => {
    const diff = curr - prev;
    const pct = calculatePercentageChange(curr, prev);
    const isFavorable = higherIsBetter ? diff >= 0 : diff <= 0;
    return {
      diff,
      pct,
      isFavorable,
      label: `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}% vs ${prevPeriod.period}`,
      direction: diff >= 0 ? 'up' : 'down'
    };
  };

  // Short number formatter
  const formatShort = (val: number | null | undefined) => {
    if (val === null || val === undefined) return 'Not available';
    const abs = Math.abs(val);
    const sign = val < 0 ? '-' : '';
    if (abs >= 1_000_000_000) return `${sign}${curSymbol}${(abs / 1_000_000_000).toFixed(1)}B`;
    if (abs >= 1_000_000) return `${sign}${curSymbol}${(abs / 1_000_000).toFixed(1)}M`;
    if (abs >= 1_000) return `${sign}${curSymbol}${(abs / 1_000).toFixed(0)}K`;
    return `${sign}${curSymbol}${abs.toLocaleString()}`;
  };

  // Bar Chart Data (Revenue vs Net Income)
  const barChartData = [
    {
      period: `${currPeriod.period} (Current)`,
      Revenue: isCurr.revenue,
      'Net Income': isCurr.netIncome,
      EBITDA: currEbitda
    },
    {
      period: `${prevPeriod.period} (Prior)`,
      Revenue: isPrev.revenue,
      'Net Income': isPrev.netIncome,
      EBITDA: prevEbitda
    }
  ];

  // Pie Chart Data (Cost vs Margin Distribution)
  const pieData = [
    { name: 'Cost of Goods Sold', value: isCurr.cogs },
    { name: 'Operating Expenses', value: isCurr.operatingExpenses.total },
    { name: 'Taxes & Levies', value: (isCurr.taxExpense || 0) + (isCurr.growthLevy || 0) },
    { name: 'Profit After Tax', value: isCurr.netIncome }
  ];

  return (
    <div className="space-y-8 animate-fade-in text-left pb-16" id="cfo-executive-dashboard">
      
      {/* 1. Header & Filter Bar */}
      <div className="space-y-4">
        
        {/* Title & Metadata */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E8E2D8] pb-5">
          <div>
            <div className="mb-1">
              <span className="text-[10px] font-mono font-bold tracking-[0.25em] text-[#D4A347] uppercase">
                EXECUTIVE INTELLIGENCE & CONTROL
              </span>
            </div>
            <h1 className="font-serif-display text-3xl sm:text-4xl font-bold text-[#0B192C]">
              CFO Executive Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Consolidated financial health, key ratios, cash position, and variance drivers for <span className="font-bold text-[#0B192C]">{profile.companyName}</span>.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-mono text-slate-500 bg-white border border-[#E8E2D8] px-3 py-1.5 rounded-xl">
              Source: Verified Financial Statements ({currPeriod.period})
            </span>
          </div>
        </div>

        {/* 2. Interactive Multi-Dimensional Filter Console */}
        <div className="bg-white border border-[#E8E2D8] rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-[#F0EBE1] pb-2">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#D4A347]" />
              <span className="text-xs font-bold text-[#0B192C] uppercase tracking-wider font-mono">
                Dashboard Filters & Reporting Basis
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              Live Slice & Dice
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            
            {/* Filter 1: Entity */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-600 block">Entity / Subsidiary</label>
              <select
                value={selectedEntity}
                onChange={(e) => setSelectedEntity(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-xs text-[#0B192C] font-semibold focus:outline-none focus:border-[#0B192C] cursor-pointer"
              >
                <option value="all">Consolidated (All)</option>
                <option value={profile.companyName}>{profile.companyName} (Active)</option>
                {companies.filter(c => c.companyName !== profile.companyName).map((c, idx) => (
                  <option key={idx} value={c.companyName}>{c.companyName}</option>
                ))}
              </select>
            </div>

            {/* Filter 2: Financial Year */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-600 block">Fiscal Period</label>
              <select
                value={selectedFiscalYear}
                onChange={(e) => setSelectedFiscalYear(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-xs text-[#0B192C] font-semibold focus:outline-none focus:border-[#0B192C] cursor-pointer"
              >
                {sortedPeriods.map(p => (
                  <option key={p.period} value={p.period}>{p.period}</option>
                ))}
              </select>
            </div>

            {/* Filter 3: Granularity */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-600 block">Granularity</label>
              <select
                value={selectedGranularity}
                onChange={(e) => setSelectedGranularity(e.target.value as any)}
                className="w-full px-2.5 py-1.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-xs text-[#0B192C] font-semibold focus:outline-none focus:border-[#0B192C] cursor-pointer"
              >
                <option value="full-year">Full-Year (FY)</option>
                <option value="ytd">Year-to-Date (YTD)</option>
                <option value="quarterly">Quarterly (QTD)</option>
                <option value="monthly">Monthly</option>
                <option value="comparative">Comparative YoY</option>
              </select>
            </div>

            {/* Filter 4: Department */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-600 block">Department</label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-xs text-[#0B192C] font-semibold focus:outline-none focus:border-[#0B192C] cursor-pointer"
              >
                <option value="all">All Departments</option>
                <option value="sales">Commercial & Sales</option>
                <option value="operations">Operations & Supply</option>
                <option value="finance">Finance & Treasury</option>
                <option value="engineering">Engineering & Product</option>
              </select>
            </div>

            {/* Filter 5: Branch / Cost Centre */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-600 block">Branch / Cost Centre</label>
              <select
                value={selectedCostCentre}
                onChange={(e) => setSelectedCostCentre(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-xs text-[#0B192C] font-semibold focus:outline-none focus:border-[#0B192C] cursor-pointer"
              >
                <option value="all">Headquarters (HQ-01)</option>
                <option value="regional">Regional Hub - North</option>
                <option value="overseas">International Subsidiary</option>
              </select>
            </div>

            {/* Filter 6: Currency */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-600 block">Reporting Currency</label>
              <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-xs text-[#0B192C] font-semibold focus:outline-none focus:border-[#0B192C] cursor-pointer"
              >
                {GLOBAL_CURRENCIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

          </div>
        </div>

      </div>

      {/* 3. Primary Executive KPI Grid (14 Essential CFO Metrics) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-serif-display text-xl font-bold text-[#0B192C]">
            Core Performance Indicators
          </h2>
          <span className="text-[11px] font-mono text-slate-500">
            Click any metric to drill down into supporting ledger
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* KPI 1: REVENUE */}
          {(() => {
            const mov = calcMovement(isCurr.revenue, isPrev.revenue, true);
            return (
              <div 
                onClick={onNavigateToProfitability}
                className="bg-white border border-[#E8E2D8] rounded-2xl p-5 shadow-xs hover:border-[#0B1530] transition-all cursor-pointer group space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold tracking-wider text-slate-500 uppercase">REVENUE</span>
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                    mov.isFavorable ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                  }`}>
                    {mov.label}
                  </span>
                </div>
                <p className="text-2xl font-mono font-bold text-[#0B192C] group-hover:text-[#D4A347] transition-colors">
                  {formatShort(isCurr.revenue)}
                </p>
                <div className="pt-2 border-t border-[#F0EBE1] flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>Period: {currPeriod.period}</span>
                  <span>Source: P&L Statement</span>
                </div>
              </div>
            );
          })()}

          {/* KPI 2: GROSS PROFIT & MARGIN */}
          {(() => {
            const mov = calcMovement(isCurr.grossProfit, isPrev.grossProfit, true);
            return (
              <div 
                onClick={onNavigateToProfitability}
                className="bg-white border border-[#E8E2D8] rounded-2xl p-5 shadow-xs hover:border-[#0B1530] transition-all cursor-pointer group space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold tracking-wider text-slate-500 uppercase">GROSS PROFIT</span>
                  <span className="text-[10px] font-mono font-bold text-[#0B1530] bg-[#FAF7F2] border border-[#E8E2D8] px-1.5 py-0.5 rounded">
                    {ratiosCurr.grossProfitMargin.toFixed(1)}% Margin
                  </span>
                </div>
                <p className="text-2xl font-mono font-bold text-[#0B192C] group-hover:text-[#D4A347] transition-colors">
                  {formatShort(isCurr.grossProfit)}
                </p>
                <div className="pt-2 border-t border-[#F0EBE1] flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span className={mov.isFavorable ? 'text-emerald-700 font-semibold' : 'text-rose-700'}>{mov.label}</span>
                  <span>Source: P&L Statement</span>
                </div>
              </div>
            );
          })()}

          {/* KPI 3: OPERATING PROFIT (EBIT) */}
          {(() => {
            const mov = calcMovement(isCurr.operatingIncome, isPrev.operatingIncome, true);
            return (
              <div 
                onClick={onNavigateToProfitability}
                className="bg-white border border-[#E8E2D8] rounded-2xl p-5 shadow-xs hover:border-[#0B1530] transition-all cursor-pointer group space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold tracking-wider text-slate-500 uppercase">OPERATING PROFIT (EBIT)</span>
                  <span className="text-[10px] font-mono font-bold text-[#0B1530] bg-[#FAF7F2] border border-[#E8E2D8] px-1.5 py-0.5 rounded">
                    {ratiosCurr.operatingMargin.toFixed(1)}% Op Margin
                  </span>
                </div>
                <p className="text-2xl font-mono font-bold text-[#0B192C] group-hover:text-[#D4A347] transition-colors">
                  {formatShort(isCurr.operatingIncome)}
                </p>
                <div className="pt-2 border-t border-[#F0EBE1] flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span className={mov.isFavorable ? 'text-emerald-700 font-semibold' : 'text-rose-700'}>{mov.label}</span>
                  <span>Source: P&L Statement</span>
                </div>
              </div>
            );
          })()}

          {/* KPI 4: EBITDA & EBITDA MARGIN */}
          {(() => {
            const mov = calcMovement(currEbitda, prevEbitda, true);
            return (
              <div 
                onClick={onNavigateToProfitability}
                className="bg-white border border-[#E8E2D8] rounded-2xl p-5 shadow-xs hover:border-[#0B1530] transition-all cursor-pointer group space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold tracking-wider text-slate-500 uppercase">EBITDA</span>
                  <span className="text-[10px] font-mono font-bold text-[#0B1530] bg-[#FAF7F2] border border-[#E8E2D8] px-1.5 py-0.5 rounded">
                    {currEbitdaMargin.toFixed(1)}% EBITDA Margin
                  </span>
                </div>
                <p className="text-2xl font-mono font-bold text-[#0B192C] group-hover:text-[#D4A347] transition-colors">
                  {formatShort(currEbitda)}
                </p>
                <div className="pt-2 border-t border-[#F0EBE1] flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span className={mov.isFavorable ? 'text-emerald-700 font-semibold' : 'text-rose-700'}>{mov.label}</span>
                  <span>Deprec: {formatShort(currDepreciation)}</span>
                </div>
              </div>
            );
          })()}

          {/* KPI 5: PROFIT BEFORE TAX (EBT) */}
          {(() => {
            const mov = calcMovement(currPbt, prevPbt, true);
            return (
              <div 
                onClick={onNavigateToProfitability}
                className="bg-white border border-[#E8E2D8] rounded-2xl p-5 shadow-xs hover:border-[#0B1530] transition-all cursor-pointer group space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold tracking-wider text-slate-500 uppercase">PROFIT BEFORE TAX</span>
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                    mov.isFavorable ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                  }`}>
                    {mov.label}
                  </span>
                </div>
                <p className="text-2xl font-mono font-bold text-[#0B192C] group-hover:text-[#D4A347] transition-colors">
                  {formatShort(currPbt)}
                </p>
                <div className="pt-2 border-t border-[#F0EBE1] flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>Pre-tax margin: {safeDiv(currPbt, isCurr.revenue, 100).toFixed(1)}%</span>
                  <span>Source: EBT Calc</span>
                </div>
              </div>
            );
          })()}

          {/* KPI 6: PROFIT AFTER TAX (NET INCOME) */}
          {(() => {
            const mov = calcMovement(isCurr.netIncome, isPrev.netIncome, true);
            return (
              <div 
                onClick={onNavigateToProfitability}
                className="bg-white border border-[#E8E2D8] rounded-2xl p-5 shadow-xs hover:border-[#0B1530] transition-all cursor-pointer group space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold tracking-wider text-slate-500 uppercase">PROFIT AFTER TAX</span>
                  <span className="text-[10px] font-mono font-bold text-[#0B1530] bg-[#FAF7F2] border border-[#E8E2D8] px-1.5 py-0.5 rounded">
                    {ratiosCurr.netProfitMargin.toFixed(1)}% Net Margin
                  </span>
                </div>
                <p className="text-2xl font-mono font-bold text-[#0B192C] group-hover:text-[#D4A347] transition-colors">
                  {formatShort(isCurr.netIncome)}
                </p>
                <div className="pt-2 border-t border-[#F0EBE1] flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span className={mov.isFavorable ? 'text-emerald-700 font-semibold' : 'text-rose-700'}>{mov.label}</span>
                  <span>Tax: {formatShort(isCurr.taxExpense)}</span>
                </div>
              </div>
            );
          })()}

          {/* KPI 7: OPERATING CASH FLOW */}
          {(() => {
            const hasCf = cfCurr && cfCurr.operatingCashFlow !== undefined;
            const mov = hasCf ? calcMovement(cfCurr.operatingCashFlow, cfPrev?.operatingCashFlow || 0, true) : null;
            return (
              <div 
                onClick={onNavigateToProfitability}
                className="bg-white border border-[#E8E2D8] rounded-2xl p-5 shadow-xs hover:border-[#0B1530] transition-all cursor-pointer group space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold tracking-wider text-slate-500 uppercase">OPERATING CASH FLOW</span>
                  {mov && (
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      mov.isFavorable ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                    }`}>
                      {mov.label}
                    </span>
                  )}
                </div>
                <p className="text-2xl font-mono font-bold text-[#0B192C] group-hover:text-[#D4A347] transition-colors">
                  {hasCf ? formatShort(cfCurr.operatingCashFlow) : 'Not available'}
                </p>
                <div className="pt-2 border-t border-[#F0EBE1] flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>Cash conversion: {hasCf ? `${safeDiv(cfCurr.operatingCashFlow, isCurr.netIncome, 100).toFixed(0)}% of NI` : 'N/A'}</span>
                  <span>Source: Cash Flow</span>
                </div>
              </div>
            );
          })()}

          {/* KPI 8: CASH BALANCE */}
          {(() => {
            const cash = bsCurr.assets.cashAndEquivalents;
            const prevCash = bsPrev.assets.cashAndEquivalents;
            const mov = calcMovement(cash, prevCash, true);
            return (
              <div 
                onClick={onNavigateToProfitability}
                className="bg-white border border-[#E8E2D8] rounded-2xl p-5 shadow-xs hover:border-[#0B1530] transition-all cursor-pointer group space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold tracking-wider text-slate-500 uppercase">CASH BALANCE</span>
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                    mov.isFavorable ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                  }`}>
                    {mov.label}
                  </span>
                </div>
                <p className="text-2xl font-mono font-bold text-[#0B192C] group-hover:text-[#D4A347] transition-colors">
                  {cash !== undefined ? formatShort(cash) : 'Not available'}
                </p>
                <div className="pt-2 border-t border-[#F0EBE1] flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>Liquidity reserve</span>
                  <span>Source: Balance Sheet</span>
                </div>
              </div>
            );
          })()}

          {/* KPI 9: CURRENT RATIO */}
          {(() => {
            const cr = ratiosCurr.currentRatio;
            const prevCr = ratiosPrev.currentRatio;
            const mov = calcMovement(cr, prevCr, true);
            return (
              <div 
                onClick={onNavigateToProfitability}
                className="bg-white border border-[#E8E2D8] rounded-2xl p-5 shadow-xs hover:border-[#0B1530] transition-all cursor-pointer group space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold tracking-wider text-slate-500 uppercase">CURRENT RATIO</span>
                  <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                    Benchmark: 2.0x
                  </span>
                </div>
                <p className="text-2xl font-mono font-bold text-[#0B192C] group-hover:text-[#D4A347] transition-colors">
                  {cr ? `${cr.toFixed(2)}x` : 'Not available'}
                </p>
                <div className="pt-2 border-t border-[#F0EBE1] flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span className={mov.isFavorable ? 'text-emerald-700 font-semibold' : 'text-rose-700'}>{mov.label}</span>
                  <span>Quick: {ratiosCurr.quickRatio.toFixed(2)}x</span>
                </div>
              </div>
            );
          })()}

          {/* KPI 10: WORKING CAPITAL */}
          {(() => {
            const mov = calcMovement(currWorkingCapital, prevWorkingCapital, true);
            return (
              <div 
                onClick={onNavigateToProfitability}
                className="bg-white border border-[#E8E2D8] rounded-2xl p-5 shadow-xs hover:border-[#0B1530] transition-all cursor-pointer group space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold tracking-wider text-slate-500 uppercase">WORKING CAPITAL</span>
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                    mov.isFavorable ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                  }`}>
                    {mov.label}
                  </span>
                </div>
                <p className="text-2xl font-mono font-bold text-[#0B192C] group-hover:text-[#D4A347] transition-colors">
                  {formatShort(currWorkingCapital)}
                </p>
                <div className="pt-2 border-t border-[#F0EBE1] flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>Current assets - liab</span>
                  <span>Source: Balance Sheet</span>
                </div>
              </div>
            );
          })()}

          {/* KPI 11: BUDGET ACHIEVEMENT */}
          <div 
            onClick={onNavigateToVariance}
            className="bg-white border border-[#E8E2D8] rounded-2xl p-5 shadow-xs hover:border-[#0B1530] transition-all cursor-pointer group space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold tracking-wider text-slate-500 uppercase">BUDGET ACHIEVEMENT</span>
              <span className="text-[10px] font-mono font-bold text-[#0B1530] bg-[#FAF7F2] border border-[#E8E2D8] px-1.5 py-0.5 rounded">
                Target Realization
              </span>
            </div>
            <p className="text-2xl font-mono font-bold text-[#0B192C] group-hover:text-[#D4A347] transition-colors">
              {budgetAchievementPct ? `${budgetAchievementPct}%` : 'Insufficient data'}
            </p>
            <div className="pt-2 border-t border-[#F0EBE1] flex items-center justify-between text-[10px] text-slate-500 font-mono">
              <span>{budgetAchievementPct ? (Number(budgetAchievementPct) >= 100 ? 'Surpassed Target' : 'Under Target') : 'Upload budget file'}</span>
              <span>Source: Budget Ledger</span>
            </div>
          </div>

          {/* KPI 12: FAVOURABLE / ADVERSE VARIANCES */}
          <div 
            onClick={onNavigateToVariance}
            className="bg-white border border-[#E8E2D8] rounded-2xl p-5 shadow-xs hover:border-[#0B1530] transition-all cursor-pointer group space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold tracking-wider text-slate-500 uppercase">NET OPERATING VARIANCES</span>
              <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                {enhancedVariances.length} lines tracked
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-mono font-bold text-emerald-700">+{formatShort(totalFavorableVariances)}</span>
              <span className="text-xs text-slate-400">/</span>
              <span className="text-sm font-mono font-bold text-rose-700">-{formatShort(totalAdverseVariances)}</span>
            </div>
            <div className="pt-2 border-t border-[#F0EBE1] flex items-center justify-between text-[10px] text-slate-500 font-mono">
              <span className="text-emerald-700 font-semibold">Fav: {enhancedVariances.filter(v => v.isFavorable).length}</span>
              <span className="text-rose-700 font-semibold">Adv: {enhancedVariances.filter(v => !v.isFavorable).length}</span>
            </div>
          </div>

          {/* KPI 13: OUTSTANDING FINANCIAL RISKS */}
          <div 
            onClick={onNavigateToDecisions || onNavigateToVariance}
            className="bg-white border border-[#E8E2D8] rounded-2xl p-5 shadow-xs hover:border-[#0B1530] transition-all cursor-pointer group space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold tracking-wider text-slate-500 uppercase">OUTSTANDING RISKS</span>
              <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                emergingRisks.some(r => r.severity === 'critical') 
                  ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                {emergingRisks.length} Signals
              </span>
            </div>
            <p className="text-2xl font-mono font-bold text-[#0B192C] group-hover:text-[#D4A347] transition-colors">
              {emergingRisks.length > 0 ? `${emergingRisks.filter(r => r.severity === 'critical' || r.severity === 'high').length} High/Critical` : '0 Active'}
            </p>
            <div className="pt-2 border-t border-[#F0EBE1] flex items-center justify-between text-[10px] text-slate-500 font-mono">
              <span>Risk Score: {ratiosCurr.riskScore.toFixed(1)}/10</span>
              <span>Source: Risk Radar</span>
            </div>
          </div>

          {/* KPI 14: DUPONT ROE LEVERAGE */}
          <div 
            onClick={onNavigateToVariance}
            className="bg-white border border-[#E8E2D8] rounded-2xl p-5 shadow-xs hover:border-[#0B1530] transition-all cursor-pointer group space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold tracking-wider text-slate-500 uppercase">DUPONT RETURN ON EQUITY</span>
              <span className="text-[10px] font-mono font-bold text-[#0B1530] bg-[#FAF7F2] border border-[#E8E2D8] px-1.5 py-0.5 rounded">
                ROE: {ratiosCurr.returnOnEquity.toFixed(1)}%
              </span>
            </div>
            <p className="text-2xl font-mono font-bold text-[#0B192C] group-hover:text-[#D4A347] transition-colors">
              {ratiosCurr.returnOnEquity.toFixed(1)}%
            </p>
            <div className="pt-2 border-t border-[#F0EBE1] flex items-center justify-between text-[10px] text-slate-500 font-mono">
              <span>ROA: {ratiosCurr.returnOnAssets.toFixed(1)}%</span>
              <span>Equity Ratio: {ratiosCurr.equityRatio.toFixed(1)}%</span>
            </div>
          </div>

        </div>
      </div>

      {/* 4. Chart Analytics Rows */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Revenue vs Net Income vs EBITDA */}
        <div className="bg-white border border-[#E8E2D8] rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#E8E2D8] pb-3">
            <div>
              <h3 className="font-serif-display text-lg font-bold text-[#0B192C]">
                Operating Delivery & EBITDA Bridge
              </h3>
              <p className="text-xs text-slate-500">Period-over-period scale and cash profitability comparison</p>
            </div>
            <span className="text-xs font-mono text-slate-500">Values in {curSymbol}</span>
          </div>

          <div className="h-64 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={240}>
              <BarChart data={barChartData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0EBE1" />
                <XAxis dataKey="period" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis 
                  stroke="#64748B" 
                  fontSize={10} 
                  tickLine={false} 
                  tickFormatter={(val) => `${curSymbol}${formatShort(val)}`}
                />
                <Tooltip 
                  formatter={(val: any) => [`${curSymbol} ${Number(val).toLocaleString()}`, '']}
                  contentStyle={{ backgroundColor: '#0B1530', color: '#fff', borderRadius: '12px', border: 'none', fontSize: '11px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="Revenue" fill="#0B1530" radius={[4, 4, 0, 0]} />
                <Bar dataKey="EBITDA" fill="#D4A347" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Net Income" fill="#15803D" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Cost & Margin Distribution */}
        <div className="bg-white border border-[#E8E2D8] rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#E8E2D8] pb-3">
            <div>
              <h3 className="font-serif-display text-lg font-bold text-[#0B192C]">
                Revenue Composition & Margin Retention
              </h3>
              <p className="text-xs text-slate-500">Distribution of revenue across direct costs, opex, and net earnings</p>
            </div>
            <span className="text-xs font-mono text-slate-500">{currPeriod.period} Actuals</span>
          </div>

          <div className="h-64 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={240}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(val: any) => [`${curSymbol} ${Number(val).toLocaleString()}`, '']}
                  contentStyle={{ backgroundColor: '#0B1530', color: '#fff', borderRadius: '12px', border: 'none', fontSize: '11px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* 5. Three Activity Cards: Recent Analyses, Uploaded Statements, Generated Reports */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Recent Analyses */}
        <div className="bg-white border border-[#E8E2D8] rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#E8E2D8] pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#D4A347]" />
              <h3 className="font-serif-display text-base font-bold text-[#0B192C]">
                Recent Analyses
              </h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              {savedReports.length} records
            </span>
          </div>

          <div className="space-y-2.5">
            {savedReports.slice(0, 3).map((rep) => (
              <div 
                key={rep.id}
                onClick={onNavigateToReports}
                className="p-3 bg-[#FAF7F2] hover:bg-white border border-[#E8E2D8] rounded-xl transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-[#0B192C] group-hover:text-[#D4A347] transition-colors truncate">
                    {rep.reportTitle}
                  </p>
                  <span className="text-[9px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-bold">
                    {rep.status}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                  {rep.periodLabel}
                </p>
                <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>Score: {rep.riskScoreText || 'Risk 4/10'}</span>
                  <span>{new Date(rep.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Card 2: Recently Uploaded Statements */}
        <div className="bg-white border border-[#E8E2D8] rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#E8E2D8] pb-3">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-[#0B1530]" />
              <h3 className="font-serif-display text-base font-bold text-[#0B192C]">
                Uploaded Statements
              </h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              {periods.length} periods
            </span>
          </div>

          <div className="space-y-2.5">
            {sortedPeriods.slice(0, 3).map((p, idx) => (
              <div 
                key={p.period}
                onClick={onNavigateToProfitability}
                className="p-3 bg-[#FAF7F2] hover:bg-white border border-[#E8E2D8] rounded-xl transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0B192C] group-hover:text-[#D4A347]">
                    {p.period} Ledger
                  </span>
                  <span className="text-[9px] font-mono uppercase bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded">
                    {idx === 0 ? 'Current Year' : 'Prior Year'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2 text-[10px] font-mono text-slate-600">
                  <div>Rev: {formatShort(p.incomeStatement.revenue)}</div>
                  <div>Net: {formatShort(p.incomeStatement.netIncome)}</div>
                </div>
                <div className="mt-1 text-[10px] font-mono text-slate-400">
                  Assets: {formatShort(p.balanceSheet.assets.totalAssets)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Card 3: Recently Generated Reports */}
        <div className="bg-white border border-[#E8E2D8] rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#E8E2D8] pb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#D4A347]" />
              <h3 className="font-serif-display text-base font-bold text-[#0B192C]">
                Generated Reports
              </h3>
            </div>
            {onNavigateToReports && (
              <button
                type="button"
                onClick={onNavigateToReports}
                className="text-xs text-slate-600 hover:text-[#0B192C] font-semibold underline underline-offset-2 cursor-pointer"
              >
                View all
              </button>
            )}
          </div>

          <div className="space-y-2.5">
            <div 
              onClick={onNavigateToReports}
              className="p-3 bg-[#FAF7F2] hover:bg-white border border-[#E8E2D8] rounded-xl transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#0B192C] group-hover:text-[#D4A347]">
                  CFO Executive Briefing ({currPeriod.period})
                </span>
                <span className="text-[9px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-bold">
                  PDF / Word / Excel
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                {analysis?.executiveSummary?.substring(0, 100) || 'Comprehensive profitability, variance, and liquidity analysis generated for management.'}...
              </p>
            </div>

            <div 
              onClick={onNavigateToVariance}
              className="p-3 bg-[#FAF7F2] hover:bg-white border border-[#E8E2D8] rounded-xl transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#0B192C] group-hover:text-[#D4A347]">
                  Variance Investigation Audit
                </span>
                <span className="text-[9px] font-mono text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded font-bold">
                  {enhancedVariances.length} Lines
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Material variance analysis comparing operational performance to approved targets.
              </p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
