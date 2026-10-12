/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  TrendingUp, Sliders, Play, RefreshCw, Layers, ShieldAlert,
  ArrowUpRight, ArrowDownRight, DollarSign, CheckCircle2, Sparkles,
  BarChart3, FileSpreadsheet
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { UserProfile, PeriodFinancialData } from '../types';

interface ForecastingScenariosViewProps {
  profile: UserProfile;
  periods: PeriodFinancialData[];
  onNavigateToAnalysis?: () => void;
}

export default function ForecastingScenariosView({
  profile,
  periods,
  onNavigateToAnalysis
}: ForecastingScenariosViewProps) {
  // Scenario simulation parameters
  const [revenueGrowthPct, setRevenueGrowthPct] = useState<number>(15);
  const [cogsMarginPct, setCogsMarginPct] = useState<number>(75);
  const [opexInflationPct, setOpexInflationPct] = useState<number>(8);
  const [taxRatePct, setTaxRatePct] = useState<number>(25);
  const [activePreset, setActivePreset] = useState<'base' | 'bull' | 'bear'>('base');

  const curSymbol = profile.currency?.match(/\(([^)]+)\)/)?.[1] || '$';

  const sortedPeriods = [...periods].sort((a, b) => b.period.localeCompare(a.period, undefined, { numeric: true }));
  const currPeriod = sortedPeriods[0];
  const priorPeriod = sortedPeriods[1];

  const baseRevenue = currPeriod?.incomeStatement.revenue || 10000000;
  const baseOpex = currPeriod?.incomeStatement.operatingExpenses.total || 1500000;

  // Forecast calculations (1-Year Forward Projection)
  const projectedRevenue = Math.round(baseRevenue * (1 + revenueGrowthPct / 100));
  const projectedCogs = Math.round(projectedRevenue * (cogsMarginPct / 100));
  const projectedGrossProfit = projectedRevenue - projectedCogs;
  const projectedGrossMargin = ((projectedGrossProfit / projectedRevenue) * 100).toFixed(1);
  const projectedOpex = Math.round(baseOpex * (1 + opexInflationPct / 100));
  const projectedEbit = projectedGrossProfit - projectedOpex;
  const projectedTax = Math.max(0, Math.round(projectedEbit * (taxRatePct / 100)));
  const projectedNetIncome = projectedEbit - projectedTax;
  const projectedNetMargin = ((projectedNetIncome / projectedRevenue) * 100).toFixed(1);

  const applyPreset = (preset: 'base' | 'bull' | 'bear') => {
    setActivePreset(preset);
    if (preset === 'bull') {
      setRevenueGrowthPct(25);
      setCogsMarginPct(72);
      setOpexInflationPct(5);
      setTaxRatePct(25);
    } else if (preset === 'bear') {
      setRevenueGrowthPct(-5);
      setCogsMarginPct(78);
      setOpexInflationPct(12);
      setTaxRatePct(25);
    } else {
      setRevenueGrowthPct(15);
      setCogsMarginPct(75);
      setOpexInflationPct(8);
      setTaxRatePct(25);
    }
  };

  // Trajectory chart data
  const chartData = [
    {
      period: priorPeriod ? priorPeriod.period : 'FY2024',
      Revenue: priorPeriod ? priorPeriod.incomeStatement.revenue : Math.round(baseRevenue * 0.7),
      GrossProfit: priorPeriod ? priorPeriod.incomeStatement.grossProfit : Math.round(baseRevenue * 0.7 * 0.2),
      NetIncome: priorPeriod ? priorPeriod.incomeStatement.netIncome : Math.round(baseRevenue * 0.7 * 0.05)
    },
    {
      period: currPeriod ? currPeriod.period : 'FY2025 (Actual)',
      Revenue: baseRevenue,
      GrossProfit: currPeriod?.incomeStatement.grossProfit || (baseRevenue * 0.25),
      NetIncome: currPeriod?.incomeStatement.netIncome || (baseRevenue * 0.08)
    },
    {
      period: 'FY2026 (Projected)',
      Revenue: projectedRevenue,
      GrossProfit: projectedGrossProfit,
      NetIncome: projectedNetIncome
    }
  ];

  return (
    <div className="space-y-8 text-left animate-fade-in" id="forecasting-scenarios-root">
      
      {/* Header & Preset Switchers */}
      <div className="border-b border-[#E8E2D8] pb-5 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono font-bold tracking-[0.25em] text-[#D4A347] uppercase block mb-1">
            FORWARD-LOOKING DECISION SUPPORT
          </span>
          <h1 className="font-serif-display text-3xl sm:text-4xl font-bold text-[#0B192C]">
            Forecasting & Strategic Scenarios
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Simulate forward cash generation, stress-test margin sensitivity, and evaluate bull/bear scenarios for <span className="font-bold text-[#0B192C]">{profile.companyName}</span>.
          </p>
        </div>

        {/* Presets */}
        <div className="flex items-center gap-1.5 p-1 bg-white border border-[#E8E2D8] rounded-xl shadow-xs shrink-0">
          <span className="text-[11px] font-mono text-slate-400 px-2">Presets:</span>
          <button
            type="button"
            onClick={() => applyPreset('bear')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activePreset === 'bear' ? 'bg-rose-900 text-white' : 'text-slate-600 hover:text-rose-700'
            }`}
          >
            Conservative (Bear)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('base')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activePreset === 'base' ? 'bg-[#0B1530] text-white' : 'text-slate-600 hover:text-[#0B192C]'
            }`}
          >
            Base Case
          </button>
          <button
            type="button"
            onClick={() => applyPreset('bull')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activePreset === 'bull' ? 'bg-emerald-900 text-white' : 'text-slate-600 hover:text-emerald-700'
            }`}
          >
            Aggressive (Bull)
          </button>
        </div>
      </div>

      {/* Scenario Control Sliders Card */}
      <div className="bg-white border border-[#E8E2D8] rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="flex items-center justify-between mb-6 border-b border-[#E8E2D8] pb-4">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#D4A347]" />
            <h3 className="font-serif-display text-lg font-bold text-[#0B192C]">
              Forward Sensitivity Levers
            </h3>
          </div>
          <button
            type="button"
            onClick={() => applyPreset('base')}
            className="text-xs text-slate-500 hover:text-[#0B192C] font-semibold flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reset Drivers</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Lever 1: Revenue Growth */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-700">Revenue Growth</label>
              <span className={`text-xs font-mono font-bold ${revenueGrowthPct >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                {revenueGrowthPct >= 0 ? `+${revenueGrowthPct}%` : `${revenueGrowthPct}%`}
              </span>
            </div>
            <input
              type="range"
              min="-20"
              max="50"
              step="1"
              value={revenueGrowthPct}
              onChange={(e) => {
                setRevenueGrowthPct(Number(e.target.value));
                setActivePreset('base');
              }}
              className="w-full accent-[#0B1530] cursor-pointer"
            />
            <p className="text-[10px] text-slate-500 font-mono">Organic volume & pricing power</p>
          </div>

          {/* Lever 2: COGS / Direct Costs Margin */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-700">COGS % of Revenue</label>
              <span className="text-xs font-mono font-bold text-[#0B192C]">
                {cogsMarginPct}%
              </span>
            </div>
            <input
              type="range"
              min="50"
              max="90"
              step="1"
              value={cogsMarginPct}
              onChange={(e) => {
                setCogsMarginPct(Number(e.target.value));
                setActivePreset('base');
              }}
              className="w-full accent-[#0B1530] cursor-pointer"
            />
            <p className="text-[10px] text-slate-500 font-mono">Direct materials & procurement cost</p>
          </div>

          {/* Lever 3: OpEx Inflation */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-700">OpEx Escalation</label>
              <span className="text-xs font-mono font-bold text-[#0B192C]">
                +{opexInflationPct}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="30"
              step="1"
              value={opexInflationPct}
              onChange={(e) => {
                setOpexInflationPct(Number(e.target.value));
                setActivePreset('base');
              }}
              className="w-full accent-[#0B1530] cursor-pointer"
            />
            <p className="text-[10px] text-slate-500 font-mono">Payroll, rent, software & overheads</p>
          </div>

          {/* Lever 4: Effective Tax Rate */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-700">Effective Tax Rate</label>
              <span className="text-xs font-mono font-bold text-[#0B192C]">
                {taxRatePct}%
              </span>
            </div>
            <input
              type="range"
              min="15"
              max="40"
              step="1"
              value={taxRatePct}
              onChange={(e) => {
                setTaxRatePct(Number(e.target.value));
                setActivePreset('base');
              }}
              className="w-full accent-[#0B1530] cursor-pointer"
            />
            <p className="text-[10px] text-slate-500 font-mono">Statutory corporate tax & levies</p>
          </div>
        </div>
      </div>

      {/* KPI Comparison Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Revenue */}
        <div className="bg-white border border-[#E8E2D8] rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono font-bold uppercase text-slate-500 tracking-wider">PROJECTED REVENUE</span>
            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
              projectedRevenue >= baseRevenue ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
            }`}>
              {projectedRevenue >= baseRevenue ? 'Favorable' : 'Adverse'}
            </span>
          </div>
          <p className="text-2xl font-mono font-bold text-[#0B192C]">
            {curSymbol} {projectedRevenue.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            vs {curSymbol} {baseRevenue.toLocaleString()} base actual
          </p>
        </div>

        {/* Card 2: Gross Profit */}
        <div className="bg-white border border-[#E8E2D8] rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono font-bold uppercase text-slate-500 tracking-wider">PROJECTED GROSS PROFIT</span>
            <span className="text-[10px] font-mono font-bold text-[#0B192C] bg-[#FAF7F2] border border-[#E8E2D8] px-1.5 py-0.5 rounded">
              {projectedGrossMargin}% Margin
            </span>
          </div>
          <p className="text-2xl font-mono font-bold text-[#0B192C]">
            {curSymbol} {projectedGrossProfit.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Direct costs: {curSymbol} {projectedCogs.toLocaleString()}
          </p>
        </div>

        {/* Card 3: Operating Profit (EBIT) */}
        <div className="bg-white border border-[#E8E2D8] rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono font-bold uppercase text-slate-500 tracking-wider">PROJECTED EBIT</span>
            <span className="text-[10px] font-mono font-bold text-[#0B192C] bg-[#FAF7F2] border border-[#E8E2D8] px-1.5 py-0.5 rounded">
              OpEx: {curSymbol} {projectedOpex.toLocaleString()}
            </span>
          </div>
          <p className="text-2xl font-mono font-bold text-[#0B192C]">
            {curSymbol} {projectedEbit.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Operating margin: {((projectedEbit / projectedRevenue) * 100).toFixed(1)}%
          </p>
        </div>

        {/* Card 4: Net Income */}
        <div className="bg-white border border-[#E8E2D8] rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono font-bold uppercase text-slate-500 tracking-wider">PROJECTED NET INCOME</span>
            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
              projectedNetIncome >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
            }`}>
              {projectedNetMargin}% Net
            </span>
          </div>
          <p className="text-2xl font-mono font-bold text-[#0B192C]">
            {curSymbol} {projectedNetIncome.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Estimated tax provision: {curSymbol} {projectedTax.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Trajectory Forecast Chart */}
      <div className="bg-white border border-[#E8E2D8] rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-serif-display text-xl font-bold text-[#0B192C]">
              Multi-Year Financial Trajectory
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Historical actual performance bridged into simulated forward fiscal period.
            </p>
          </div>
          <span className="text-[10px] font-mono font-bold text-[#0B1530] bg-[#FAF7F2] border border-[#E8E2D8] px-2.5 py-1 rounded-lg">
            Simulation active: {activePreset.toUpperCase()} CASE
          </span>
        </div>

        <div className="h-72 w-full pt-4" style={{ minHeight: 280, minWidth: 0 }}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={260}>
            <LineChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0EBE1" />
              <XAxis dataKey="period" stroke="#64748B" fontSize={11} />
              <YAxis 
                stroke="#64748B" 
                fontSize={11} 
                tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`}
              />
              <Tooltip 
                formatter={(val: number) => [`${curSymbol} ${val.toLocaleString()}`, '']}
                contentStyle={{ backgroundColor: '#0B1530', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Line type="monotone" dataKey="Revenue" stroke="#0B1530" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="GrossProfit" stroke="#D4A347" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="NetIncome" stroke="#15803D" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
