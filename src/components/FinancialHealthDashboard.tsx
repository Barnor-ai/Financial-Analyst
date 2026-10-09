/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { 
  Plus, TrendingUp, TrendingDown, ArrowUpRight, CheckCircle2, 
  FileText, ShieldAlert, Sparkles, ChevronRight
} from 'lucide-react';
import { UserProfile, PeriodFinancialData, FinancialAnalysisReport, BudgetVsActual } from '../types';
import { calculateFinancialRatios, calculatePercentageChange, safeDiv } from '../utils/financialEngine';

interface FinancialHealthDashboardProps {
  profile: UserProfile;
  periods: PeriodFinancialData[];
  budgetPerformance?: BudgetVsActual[];
  analysis: FinancialAnalysisReport | null;
  setAnalysis?: (a: FinancialAnalysisReport | null) => void;
  currency: string;
  onNavigateToNewAnalysis?: () => void;
  onNavigateToProfitability?: () => void;
}

const PIE_COLORS = ['#0B192C', '#15803D', '#D4A347', '#64748B'];

export default function FinancialHealthDashboard({
  profile,
  periods,
  analysis,
  currency,
  onNavigateToNewAnalysis,
  onNavigateToProfitability
}: FinancialHealthDashboardProps) {

  const curSymbol = profile.currency?.match(/\(([^)]+)\)/)?.[1] || profile.currency?.split(' ')[0] || 'GH₵';

  // Reverse chronological sorting so Current Year is first
  const sortedPeriods = [...periods].sort((a, b) => b.period.localeCompare(a.period, undefined, { numeric: true }));
  const currPeriod = sortedPeriods[0];
  const prevPeriod = sortedPeriods.length > 1 ? sortedPeriods[1] : sortedPeriods[0];

  if (!currPeriod) {
    return (
      <div className="bg-white border border-[#E8E2D8] rounded-2xl p-12 text-center max-w-xl mx-auto shadow-xs space-y-4">
        <TrendingUp className="w-10 h-10 text-[#D4A347] mx-auto" />
        <h3 className="font-serif-display text-2xl font-bold text-[#0B192C]">No Financial Analysis Available</h3>
        <p className="text-xs text-slate-600">Please upload a financial statement or initialize a dataset to view the dashboard.</p>
        <button
          type="button"
          onClick={onNavigateToNewAnalysis}
          className="px-5 py-2.5 bg-[#0B192C] text-white text-xs font-semibold rounded-lg hover:bg-[#162A45] cursor-pointer"
        >
          Create First Analysis
        </button>
      </div>
    );
  }

  const isCurr = currPeriod.incomeStatement;
  const isPrev = prevPeriod.incomeStatement;
  const bsCurr = currPeriod.balanceSheet;

  const ratiosCurr = calculateFinancialRatios(currPeriod, prevPeriod);

  // Formatter for short numbers: e.g. 101304393 -> "101M", 8841833 -> "8.8M", 1600000 -> "1.6M"
  const formatShort = (val: number) => {
    const abs = Math.abs(val);
    if (abs >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(1)}B`;
    if (abs >= 1_000_000) return `${(val / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)}M`;
    if (abs >= 1_000) return `${(val / 1_000).toFixed(0)}K`;
    return val.toLocaleString();
  };

  const revGrowth = calculatePercentageChange(isCurr.revenue, isPrev.revenue);
  const netIncomeGrowth = calculatePercentageChange(isCurr.netIncome, isPrev.netIncome);

  // 1. Revenue vs Net Income Bar Chart data
  const barChartData = [
    {
      period: 'Previous',
      Revenue: isPrev.revenue,
      'Net Income': isPrev.netIncome
    },
    {
      period: 'Current',
      Revenue: isCurr.revenue,
      'Net Income': isCurr.netIncome
    }
  ];

  // 2. Revenue Composition Pie Chart data
  const pieData = [
    { name: 'Cost of Goods Sold', value: isCurr.cogs },
    { name: 'Net Profit', value: isCurr.netIncome },
    { name: 'Operating Expenses', value: isCurr.operatingExpenses.total },
    { name: 'Taxes & Levies', value: (isCurr.taxExpense || 0) + (isCurr.growthLevy || 0) }
  ];

  // 3. Trend Analysis Line Chart data (chronological)
  const lineChartData = [...periods]
    .sort((a, b) => a.period.localeCompare(b.period, undefined, { numeric: true }))
    .map(p => ({
      period: p.period,
      Revenue: p.incomeStatement.revenue,
      'Gross Profit': p.incomeStatement.grossProfit,
      'Net Income': p.incomeStatement.netIncome
    }));

  return (
    <div className="space-y-8 animate-fade-in text-left pb-12" id="dashboard-viewport">
      
      {/* Dashboard Top Header (Matches Video Frame 01:00) */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E8E2D8] pb-6">
        <div>
          <div className="mb-2">
            <span className="text-[11px] font-mono font-bold tracking-[0.25em] text-[#D4A347] uppercase">
              DASHBOARD
            </span>
          </div>
          <h1 className="font-serif-display text-4xl sm:text-5xl font-bold text-[#0B192C] tracking-tight">
            Financial overview
          </h1>
          <p className="text-xs text-slate-500 mt-2 font-mono">
            {profile.companyName || 'Company'} · {currPeriod.period} · Annually · Jan - Dec {currPeriod.period.replace(/\D/g, '') || '2025'}
          </p>
        </div>

        {onNavigateToNewAnalysis && (
          <button
            type="button"
            onClick={onNavigateToNewAnalysis}
            className="px-4 py-2.5 bg-[#D6AE55] hover:bg-[#C59B42] text-[#0B192C] font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 cursor-pointer transition-colors shrink-0"
            id="dash-new-analysis-btn"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New analysis</span>
          </button>
        )}
      </div>

      {/* Row 1: 6 Primary KPI Cards (Exact match to Video Frame 01:00) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        
        {/* Card 1: REVENUE */}
        <div className="bg-white border border-[#E8E2D8] rounded-2xl p-4 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold tracking-wider text-slate-500 uppercase">
              REVENUE
            </span>
            <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
              +{revGrowth}%
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-bold font-mono text-[#0B192C]">
            {curSymbol} {formatShort(isCurr.revenue)}
          </p>
        </div>

        {/* Card 2: NET INCOME */}
        <div className="bg-white border border-[#E8E2D8] rounded-2xl p-4 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold tracking-wider text-slate-500 uppercase">
              NET INCOME
            </span>
            <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
              +{netIncomeGrowth}%
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-bold font-mono text-[#0B192C]">
            {curSymbol} {formatShort(isCurr.netIncome)}
          </p>
        </div>

        {/* Card 3: ACCOUNTS RECEIVABLE */}
        <div className="bg-white border border-[#E8E2D8] rounded-2xl p-4 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold tracking-wider text-slate-500 uppercase">
              ACCOUNTS RECEIVABLE
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-bold font-mono text-[#0B192C]">
            {curSymbol} {formatShort(bsCurr.assets.accountsReceivable)}
          </p>
        </div>

        {/* Card 4: CURRENT RATIO */}
        <div className="bg-white border border-[#E8E2D8] rounded-2xl p-4 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold tracking-wider text-slate-500 uppercase">
              CURRENT RATIO
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-bold font-mono text-[#0B192C]">
            {ratiosCurr.currentRatio.toFixed(2)}
          </p>
        </div>

        {/* Card 5: EQUITY RATIO */}
        <div className="bg-white border border-[#E8E2D8] rounded-2xl p-4 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold tracking-wider text-slate-500 uppercase">
              EQUITY RATIO
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-bold font-mono text-[#0B192C]">
            {ratiosCurr.equityRatio.toFixed(1)}%
          </p>
        </div>

        {/* Card 6: GROSS MARGIN */}
        <div className="bg-white border border-[#E8E2D8] rounded-2xl p-4 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold tracking-wider text-slate-500 uppercase">
              GROSS MARGIN
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-bold font-mono text-[#0B192C]">
            {ratiosCurr.grossProfitMargin.toFixed(1)}%
          </p>
        </div>

      </div>

      {/* Row 2: Secondary Metric Cards (Total reports, Completed, Avg risk score) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-[#E8E2D8] rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono text-slate-500 uppercase">Total reports</span>
            <p className="text-2xl font-bold font-mono text-[#0B192C] mt-1">1</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#FAF7F2] border border-[#E8E2D8] flex items-center justify-center text-[#D4A347]">
            <FileText className="w-5 h-5 text-[#D4A347]" />
          </div>
        </div>

        <div className="bg-white border border-[#E8E2D8] rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono text-slate-500 uppercase">Completed</span>
            <p className="text-2xl font-bold font-mono text-[#0B192C] mt-1">1</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-[#E8E2D8] rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono text-slate-500 uppercase">Avg risk score</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-mono text-[#0B192C]">
                {ratiosCurr.riskScore.toFixed(1)}
              </span>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-[#FAF7F2] border border-[#E8E2D8] text-slate-700">
                Risk {ratiosCurr.riskScore.toFixed(0)}/10
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#FAF7F2] border border-[#E8E2D8] flex items-center justify-center text-[#0B192C]">
            <ShieldAlert className="w-5 h-5 text-[#D4A347]" />
          </div>
        </div>
      </div>

      {/* Row 3: Charts (Revenue vs Net Income + Revenue Composition) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Revenue vs Net Income */}
        <div className="bg-white border border-[#E8E2D8] rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#E8E2D8] pb-3">
            <h3 className="font-serif-display text-lg font-bold text-[#0B192C]">
              Revenue vs Net Income
            </h3>
            <span className="text-xs font-mono text-slate-500">Current vs Previous</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
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
                  contentStyle={{ backgroundColor: '#0B192C', color: '#fff', borderRadius: '8px', border: 'none', fontSize: '11px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="Revenue" fill="#0B192C" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Net Income" fill="#D4A347" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Revenue Composition */}
        <div className="bg-white border border-[#E8E2D8] rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#E8E2D8] pb-3">
            <h3 className="font-serif-display text-lg font-bold text-[#0B192C]">
              Revenue Composition
            </h3>
            <span className="text-xs font-mono text-slate-500">P&L Breakdown</span>
          </div>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
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
                  contentStyle={{ backgroundColor: '#0B192C', color: '#fff', borderRadius: '8px', border: 'none', fontSize: '11px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Row 4: Trend Analysis Line Chart */}
      <div className="bg-white border border-[#E8E2D8] rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#E8E2D8] pb-3">
          <h3 className="font-serif-display text-lg font-bold text-[#0B192C]">
            Trend analysis
          </h3>
          <span className="text-xs font-mono text-slate-500">Multi-period trajectory</span>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineChartData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
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
                contentStyle={{ backgroundColor: '#0B192C', color: '#fff', borderRadius: '8px', border: 'none', fontSize: '11px' }}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
              <Line type="monotone" dataKey="Revenue" stroke="#0B192C" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="Gross Profit" stroke="#15803D" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="Net Income" stroke="#D4A347" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 5: Recent reports (Matches Video Frame 01:00) */}
      <div className="bg-white border border-[#E8E2D8] rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#E8E2D8] pb-3">
          <h3 className="font-serif-display text-lg font-bold text-[#0B192C]">
            Recent reports
          </h3>
          <span className="text-xs font-mono text-slate-500">Completed & Saved</span>
        </div>

        <div className="divide-y divide-slate-100">
          <div 
            onClick={onNavigateToProfitability}
            className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#FAF7F2] px-3 rounded-xl transition-colors cursor-pointer group"
          >
            <div>
              <p className="text-sm font-bold text-[#0B192C] group-hover:text-[#D4A347] transition-colors">
                {currPeriod.period}
              </p>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Annually · Jan - Dec {currPeriod.period.replace(/\D/g, '') || '2025'} · Aug 29, 2026
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                completed
              </span>
              <span className="px-2.5 py-1 text-[11px] font-semibold font-mono rounded-lg bg-slate-100 text-slate-700">
                Risk 4/10
              </span>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
