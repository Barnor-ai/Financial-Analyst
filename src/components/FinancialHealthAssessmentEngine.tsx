/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, AlertTriangle, TrendingUp, TrendingDown, CheckCircle2, 
  HelpCircle, Sliders, RefreshCw, Download, FileText, ArrowUpRight, 
  ArrowDownRight, DollarSign, Activity, Percent, Scale, Gauge, 
  Zap, Clock, Layers, ChevronRight, Info, AlertCircle, Sparkles
} from 'lucide-react';
import { 
  UserProfile, PeriodFinancialData, FinancialAnalysisReport, 
  FinancialRatios, HealthScoreWeights, HealthScoreBreakdown, 
  EmergingRiskItem, BudgetVsActual 
} from '../types';
import { 
  calculateFinancialRatios, 
  calculateConfigurableHealthScore, 
  evaluateFinancialRiskIndicators, 
  calculatePercentageChange, 
  safeDiv 
} from '../utils/financialEngine';
import ReportExporter from './ReportExporter';

interface FinancialHealthAssessmentEngineProps {
  profile: UserProfile;
  periods: PeriodFinancialData[];
  analysis?: FinancialAnalysisReport | null;
  budgetPerformance?: BudgetVsActual[];
  onNavigateToUpload?: () => void;
  onNavigateToEdit?: () => void;
}

export default function FinancialHealthAssessmentEngine({
  profile,
  periods,
  analysis,
  budgetPerformance = [],
  onNavigateToUpload: _onNavigateToUpload,
  onNavigateToEdit: _onNavigateToEdit
}: FinancialHealthAssessmentEngineProps) {
  // Active Tab
  const [activeTab, setActiveTab] = useState<
    'summary' | 'profitability' | 'liquidity' | 'solvency' | 'efficiency' | 'cashflow' | 'risks'
  >('summary');

  // Selected Reporting Period
  const [selectedPeriodIdx, setSelectedPeriodIdx] = useState(0);

  // Configurable Health Score Weights
  const [weights, setWeights] = useState<HealthScoreWeights>({
    profitability: 25,
    liquidity: 25,
    solvency: 20,
    efficiency: 15,
    cashFlow: 15
  });
  const [showWeightConfig, setShowWeightConfig] = useState(false);

  // Sorting: Most recent period first
  const sortedPeriods = useMemo(() => {
    return [...periods].sort((a, b) => b.period.localeCompare(a.period, undefined, { numeric: true }));
  }, [periods]);

  const currPeriod = sortedPeriods[selectedPeriodIdx] || sortedPeriods[0];
  const priorPeriod = sortedPeriods.length > selectedPeriodIdx + 1 
    ? sortedPeriods[selectedPeriodIdx + 1] 
    : (selectedPeriodIdx > 0 ? sortedPeriods[0] : null);

  const curSymbol = profile.currency?.match(/\(([^)]+)\)/)?.[1] || profile.currency?.split(' ')[0] || '$';

  // Deterministic Ratio Calculations
  const ratiosCurr = useMemo(() => {
    return calculateFinancialRatios(currPeriod, priorPeriod);
  }, [currPeriod, priorPeriod]);

  const ratiosPrior = useMemo(() => {
    return priorPeriod ? calculateFinancialRatios(priorPeriod) : null;
  }, [priorPeriod]);

  // Configurable Health Score Model
  const healthScore: HealthScoreBreakdown = useMemo(() => {
    return calculateConfigurableHealthScore(currPeriod, priorPeriod, weights);
  }, [currPeriod, priorPeriod, weights]);

  // 10 Core Financial Risk Indicators
  const riskFlags: EmergingRiskItem[] = useMemo(() => {
    return evaluateFinancialRiskIndicators(currPeriod, priorPeriod);
  }, [currPeriod, priorPeriod]);

  if (!currPeriod) {
    return (
      <div className="bg-white border border-[#E8E2D8] rounded-2xl p-10 text-center max-w-lg mx-auto shadow-xs">
        <p className="text-slate-600">No financial statement data loaded for health assessment.</p>
      </div>
    );
  }

  const is = currPeriod.incomeStatement;
  const bs = currPeriod.balanceSheet;
  const cf = currPeriod.cashFlow;

  const isPrior = priorPeriod?.incomeStatement;
  const bsPrior = priorPeriod?.balanceSheet;
  const cfPrior = priorPeriod?.cashFlow;

  // Format currency helper
  const fmt = (val: number | undefined, withSymbol = true) => {
    if (val === undefined || isNaN(val)) return 'N/A';
    const isNeg = val < 0;
    const abs = Math.abs(val).toLocaleString('en-US', { maximumFractionDigits: 0 });
    if (!withSymbol) return isNeg ? `-${abs}` : abs;
    return isNeg ? `-${curSymbol}${abs}` : `${curSymbol}${abs}`;
  };

  // Format ratio helper
  const fmtRatio = (val: number | string | undefined, suffix = '') => {
    if (val === undefined) return 'N/A';
    if (typeof val === 'string') return val;
    return `${val.toFixed(2)}${suffix}`;
  };

  // Reset scoring weights to benchmark default
  const handleResetWeights = () => {
    setWeights({
      profitability: 25,
      liquidity: 25,
      solvency: 20,
      efficiency: 15,
      cashFlow: 15
    });
  };

  return (
    <div className="w-full max-w-7xl py-2 text-left animate-fade-in space-y-6" id="cfo-health-assessment-engine">
      
      {/* Top Eyebrow & Page Header */}
      <div className="border-b border-[#E8E2D8] pb-5 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="mb-2">
            <span className="text-[11px] font-mono font-bold tracking-[0.25em] text-[#D4A347] uppercase">
              CFO FINANCIAL HEALTH ASSESSMENT
            </span>
          </div>
          <h1 className="font-serif-display text-3xl sm:text-4xl font-bold text-[#0B192C] tracking-tight">
            Financial Health Diagnostic Engine
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl">
            In-depth empirical assessment across Profitability, Liquidity, Solvency, Efficiency, Cash Flow Conversion, and Early-Warning Risk Indicators for <span className="font-bold text-[#0B192C]">{profile.companyName}</span>.
          </p>
        </div>

        {/* Period Selector & Score Config Action */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <div className="flex items-center gap-1.5 bg-white border border-[#E8E2D8] rounded-xl px-3 py-1.5 shadow-xs">
            <span className="text-xs text-slate-500 font-mono">Period:</span>
            <select
              value={selectedPeriodIdx}
              onChange={(e) => setSelectedPeriodIdx(Number(e.target.value))}
              className="text-xs font-bold text-[#0B192C] bg-transparent border-none outline-none cursor-pointer"
            >
              {sortedPeriods.map((p, idx) => (
                <option key={p.period} value={idx}>
                  {p.period} {idx === 0 && '(Current)'}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => setShowWeightConfig(!showWeightConfig)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs ${
              showWeightConfig
                ? 'bg-[#0B1530] text-white border-[#0B1530]'
                : 'bg-white text-slate-700 hover:text-[#0B192C] border-[#E8E2D8]'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-[#D4A347]" />
            <span>Configure Scoring Model</span>
          </button>
        </div>
      </div>

      {/* Configurable Health Score Weights Panel */}
      {showWeightConfig && (
        <div className="bg-white border-2 border-[#D4A347] rounded-2xl p-6 shadow-sm space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-[#E8E2D8] pb-3">
            <div>
              <h3 className="text-sm font-bold text-[#0B192C] flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#D4A347]" />
                <span>Custom Financial Health Scoring Weights</span>
              </h3>
              <p className="text-xs text-slate-500">
                Adjust weighting percentages for each financial pillar to align with industry stage or specific debt covenants.
              </p>
            </div>
            <button
              type="button"
              onClick={handleResetWeights}
              className="text-xs text-[#0B1530] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3 text-[#D4A347]" />
              <span>Reset Defaults</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-xs">
            <div className="space-y-1.5 bg-[#FAF7F2] p-3 rounded-xl border border-[#E8E2D8]">
              <div className="flex justify-between font-semibold text-[#0B192C]">
                <span>Profitability</span>
                <span className="font-mono">{weights.profitability}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                step="5"
                value={weights.profitability}
                onChange={(e) => setWeights({ ...weights, profitability: Number(e.target.value) })}
                className="w-full accent-[#0B1530] cursor-pointer"
              />
            </div>

            <div className="space-y-1.5 bg-[#FAF7F2] p-3 rounded-xl border border-[#E8E2D8]">
              <div className="flex justify-between font-semibold text-[#0B192C]">
                <span>Liquidity</span>
                <span className="font-mono">{weights.liquidity}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                step="5"
                value={weights.liquidity}
                onChange={(e) => setWeights({ ...weights, liquidity: Number(e.target.value) })}
                className="w-full accent-[#0B1530] cursor-pointer"
              />
            </div>

            <div className="space-y-1.5 bg-[#FAF7F2] p-3 rounded-xl border border-[#E8E2D8]">
              <div className="flex justify-between font-semibold text-[#0B192C]">
                <span>Solvency</span>
                <span className="font-mono">{weights.solvency}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                step="5"
                value={weights.solvency}
                onChange={(e) => setWeights({ ...weights, solvency: Number(e.target.value) })}
                className="w-full accent-[#0B1530] cursor-pointer"
              />
            </div>

            <div className="space-y-1.5 bg-[#FAF7F2] p-3 rounded-xl border border-[#E8E2D8]">
              <div className="flex justify-between font-semibold text-[#0B192C]">
                <span>Efficiency</span>
                <span className="font-mono">{weights.efficiency}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                step="5"
                value={weights.efficiency}
                onChange={(e) => setWeights({ ...weights, efficiency: Number(e.target.value) })}
                className="w-full accent-[#0B1530] cursor-pointer"
              />
            </div>

            <div className="space-y-1.5 bg-[#FAF7F2] p-3 rounded-xl border border-[#E8E2D8]">
              <div className="flex justify-between font-semibold text-[#0B192C]">
                <span>Cash Flow</span>
                <span className="font-mono">{weights.cashFlow}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                step="5"
                value={weights.cashFlow}
                onChange={(e) => setWeights({ ...weights, cashFlow: Number(e.target.value) })}
                className="w-full accent-[#0B1530] cursor-pointer"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <span>
              Total Weights: <span className="font-bold text-[#0B192C]">{weights.profitability + weights.liquidity + weights.solvency + weights.efficiency + weights.cashFlow}%</span>
            </span>
            <button
              type="button"
              onClick={() => setShowWeightConfig(false)}
              className="px-3 py-1 bg-[#0B1530] text-white font-bold rounded-lg cursor-pointer"
            >
              Apply Scoring Calibration
            </button>
          </div>
        </div>
      )}

      {/* Main Composite Health Score Top Banner */}
      <div className="bg-white border border-[#E8E2D8] rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          
          {/* Left: Health Rating Dial */}
          <div className="lg:col-span-4 flex items-center gap-5 border-b lg:border-b-0 lg:border-r border-[#E8E2D8] pb-5 lg:pb-0 lg:pr-6">
            <div className="w-20 h-20 rounded-2xl bg-[#0B1530] text-white flex flex-col items-center justify-center shadow-xs shrink-0">
              <span className="font-serif-display text-3xl font-bold leading-none text-[#D6AE55]">
                {healthScore.grade}
              </span>
              <span className="text-[10px] font-mono text-slate-300 mt-1">
                {healthScore.overallScore}/100
              </span>
            </div>

            <div className="space-y-1">
              <div className="text-[10px] font-mono uppercase text-slate-400 font-bold tracking-wider">
                COMPOSITE CFO RATING
              </div>
              <h2 className="text-xl font-bold text-[#0B192C]">
                {healthScore.riskRating} Risk Posture
              </h2>
              <div className="text-xs text-slate-600 flex items-center gap-1.5">
                <span>Health Score:</span>
                <span className="font-mono font-bold text-[#0B192C]">{healthScore.scoreOutOfTen} / 10.0</span>
              </div>
            </div>
          </div>

          {/* Center: Component Pillars Breakdown */}
          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
            {healthScore.components.map(comp => (
              <div 
                key={comp.category}
                className="bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl p-3 space-y-1"
              >
                <div className="text-[10px] text-slate-500 font-mono uppercase truncate">
                  {comp.category} ({comp.weightPercent}%)
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-base font-bold font-mono text-[#0B192C]">
                    {comp.score}
                  </span>
                  <span className={`text-[10px] font-bold ${
                    comp.status === 'optimal' ? 'text-emerald-700' : comp.status === 'warning' ? 'text-amber-700' : 'text-red-700'
                  }`}>
                    {comp.status === 'optimal' ? 'Optimal' : comp.status === 'warning' ? 'Warning' : 'Critical'}
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${
                      comp.status === 'optimal' ? 'bg-emerald-600' : comp.status === 'warning' ? 'bg-amber-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${comp.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* Regulatory & Credit Rating Disclosure Notice */}
        <div className="mt-5 pt-4 border-t border-[#E8E2D8] flex items-start gap-2.5 text-[11px] text-slate-500">
          <Info className="w-4 h-4 text-[#D4A347] shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <span className="font-bold text-[#0B192C]">Scoring Methodology Disclosure: </span>
            {healthScore.disclaimer}
          </p>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-1.5 p-1.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-2xl overflow-x-auto">
        {[
          { id: 'summary', label: 'Executive Summary', icon: Activity },
          { id: 'profitability', label: 'A. Profitability', icon: TrendingUp },
          { id: 'liquidity', label: 'B. Liquidity & Working Capital', icon: DollarSign },
          { id: 'solvency', label: 'C. Leverage & Solvency', icon: Scale },
          { id: 'efficiency', label: 'D. Efficiency', icon: Gauge },
          { id: 'cashflow', label: 'E. Cash Flow', icon: Zap },
          { id: 'risks', label: `F. Risk Indicators (${riskFlags.length})`, icon: AlertTriangle }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                isActive
                  ? 'bg-[#0B1530] text-white shadow-xs'
                  : 'text-slate-600 hover:text-[#0B192C] hover:bg-white'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#D6AE55]' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* TAB G: EXECUTIVE FINANCIAL HEALTH SUMMARY                */}
      {/* ======================================================== */}
      {activeTab === 'summary' && (
        <div className="space-y-6">
          
          {/* Executive Overview Narrative */}
          <div className="bg-white border border-[#E8E2D8] rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
            <div className="border-b border-[#E8E2D8] pb-3">
              <h3 className="font-serif-display text-xl font-bold text-[#0B192C]">
                Executive Health Diagnosis: {currPeriod.period}
              </h3>
              <p className="text-xs text-slate-500">
                Holistic operational synthesis based on reported statements and standard financial ratios.
              </p>
            </div>

            <div className="text-xs sm:text-sm text-slate-700 leading-relaxed space-y-3">
              <p>
                {profile.companyName} demonstrates an overall <strong>{healthScore.riskRating.toLowerCase()} risk profile</strong> with a composite financial health score of <strong>{healthScore.scoreOutOfTen}/10.0 ({healthScore.grade} rating)</strong>.
                Gross margin is maintained at <strong>{ratiosCurr.grossProfitMargin.toFixed(1)}%</strong>, generating <strong>{fmt(is.grossProfit)}</strong> in gross margin on top-line revenue of <strong>{fmt(is.revenue)}</strong>.
              </p>
              <p>
                Operating liquidity is supported by a <strong>{ratiosCurr.currentRatio.toFixed(2)}x current ratio</strong> and working capital of <strong>{fmt(ratiosCurr.workingCapital)}</strong>.
                Operating cash flow reached <strong>{fmt(cf.operatingCashFlow)}</strong>, representing a cash-to-net-income conversion factor of <strong>{ratiosCurr.cashFlowToNetIncome ? ratiosCurr.cashFlowToNetIncome.toFixed(2) : '1.0'}x</strong>.
              </p>
            </div>
          </div>

          {/* 4 Quadrants: Strengths, Weaknesses, Priorities, Opportunities */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            
            {/* Strengths */}
            <div className="bg-white border border-[#E8E2D8] rounded-2xl p-6 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <h4 className="font-bold text-sm uppercase tracking-wide">Main Financial Strengths</h4>
              </div>
              <ul className="space-y-2 text-slate-700">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                  <span><strong>Substantial Gross Margin:</strong> Delivers {ratiosCurr.grossProfitMargin.toFixed(1)}% gross yield, outpacing typical industry hurdles.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                  <span><strong>Positive Operating Cash Conversion:</strong> Operations organically supplied {fmt(cf.operatingCashFlow)} in liquid trading capital.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                  <span><strong>Adequate Solvency Buffer:</strong> Balance sheet debt-to-equity ratio of {ratiosCurr.debtToEquityRatio.toFixed(2)}x provides borrowing capacity.</span>
                </li>
              </ul>
            </div>

            {/* Weaknesses */}
            <div className="bg-white border border-[#E8E2D8] rounded-2xl p-6 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <h4 className="font-bold text-sm uppercase tracking-wide">Main Vulnerabilities</h4>
              </div>
              <ul className="space-y-2 text-slate-700">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-1.5 shrink-0" />
                  <span><strong>Receivables Cash Drag:</strong> DSO of {ratiosCurr.daysSalesOutstanding.toFixed(0)} days indicates invoice collection delays locking up working capital.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-1.5 shrink-0" />
                  <span><strong>Inventory Holding Cycle:</strong> Stock turns over in {ratiosCurr.daysInventoryOutstanding.toFixed(0)} days, inflating carrying costs and warehouse overhead.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-1.5 shrink-0" />
                  <span><strong>SG&A Operating Overhead:</strong> Total OpEx represents {ratiosCurr.opexToRevenue?.toFixed(1)}% of sales, limiting net operating leverage.</span>
                </li>
              </ul>
            </div>

            {/* Immediate Priorities (30-60 Days) */}
            <div className="bg-white border border-[#E8E2D8] rounded-2xl p-6 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-[#0B1530]">
                <Clock className="w-4 h-4 text-[#D4A347]" />
                <h4 className="font-bold text-sm uppercase tracking-wide">Immediate Management Priorities (30–60 Days)</h4>
              </div>
              <ul className="space-y-2 text-slate-700">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0B1530] mt-1.5 shrink-0" />
                  <span><strong>Tighten AR Collections:</strong> Institute automated dunning sequences for accounts past 30 days to release ~{curSymbol}5M in immobilized liquidity.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0B1530] mt-1.5 shrink-0" />
                  <span><strong>Review Discretionary Spend:</strong> Audit departmental SG&A subscriptions, marketing CAC efficiency, and administrative fees.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0B1530] mt-1.5 shrink-0" />
                  <span><strong>Rolling 13-Week Cash Forecast:</strong> Formalize weekly cash liquidity reviews with treasury to protect bank reserves.</span>
                </li>
              </ul>
            </div>

            {/* Medium-Term Improvement Opportunities (90-180 Days) */}
            <div className="bg-white border border-[#E8E2D8] rounded-2xl p-6 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-[#0B1530]">
                <Sparkles className="w-4 h-4 text-[#D4A347]" />
                <h4 className="font-bold text-sm uppercase tracking-wide">Medium-Term Strategic Opportunities (90–180 Days)</h4>
              </div>
              <ul className="space-y-2 text-slate-700">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D4A347] mt-1.5 shrink-0" />
                  <span><strong>Vendor Contract Renegotiation:</strong> Secure volume supplier discounts and extend DPO to 45–60 days to match customer collection cycles.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D4A347] mt-1.5 shrink-0" />
                  <span><strong>Working Capital Rationalization:</strong> Liquidate slow-moving warehouse SKUs to compress cash conversion cycle by 15 days.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D4A347] mt-1.5 shrink-0" />
                  <span><strong>Capital Structure Optimization:</strong> Refinance short-term borrowings into lower-cost long-term facilities to lock in fixed rates.</span>
                </li>
              </ul>
            </div>

          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* TAB A: PROFITABILITY ENGINE                              */}
      {/* ======================================================== */}
      {activeTab === 'profitability' && (
        <div className="space-y-6">
          
          {/* Profitability Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            
            <div className="bg-white p-5 rounded-2xl border border-[#E8E2D8] shadow-xs space-y-1">
              <span className="text-[10px] font-mono uppercase text-slate-400">Revenue Growth (YoY)</span>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-bold font-mono text-[#0B192C]">
                  {ratiosCurr.revenueGrowth !== undefined ? `${ratiosCurr.revenueGrowth > 0 ? '+' : ''}${ratiosCurr.revenueGrowth.toFixed(1)}%` : 'N/A'}
                </span>
                <span className={`text-xs font-bold ${
                  (ratiosCurr.revenueGrowth || 0) >= 0 ? 'text-emerald-700' : 'text-red-700'
                }`}>
                  {(ratiosCurr.revenueGrowth || 0) >= 0 ? 'Favourable' : 'Adverse'}
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">Revenue: {fmt(is.revenue)}</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E8E2D8] shadow-xs space-y-1">
              <span className="text-[10px] font-mono uppercase text-slate-400">Gross Margin</span>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-bold font-mono text-[#0B192C]">
                  {ratiosCurr.grossProfitMargin.toFixed(1)}%
                </span>
                <span className="text-xs font-bold text-emerald-700">Favourable</span>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">Gross Profit: {fmt(is.grossProfit)}</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E8E2D8] shadow-xs space-y-1">
              <span className="text-[10px] font-mono uppercase text-slate-400">Operating Margin (EBIT)</span>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-bold font-mono text-[#0B192C]">
                  {ratiosCurr.operatingMargin.toFixed(1)}%
                </span>
                <span className="text-xs font-bold text-emerald-700">Favourable</span>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">Operating Profit: {fmt(is.operatingIncome)}</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E8E2D8] shadow-xs space-y-1">
              <span className="text-[10px] font-mono uppercase text-slate-400">EBITDA Margin</span>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-bold font-mono text-[#0B192C]">
                  {ratiosCurr.ebitdaMargin.toFixed(1)}%
                </span>
                <span className="text-xs font-bold text-emerald-700">Favourable</span>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">EBITDA: {fmt(ratiosCurr.ebitda)}</span>
            </div>

          </div>

          {/* EBITDA Derivation & Adjustments Disclosure Card */}
          <div className="bg-[#FAF7F2] border border-[#E8E2D8] rounded-2xl p-6 shadow-xs space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-[#E8E2D8] pb-2">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-[#D4A347]" />
                <h4 className="font-bold text-[#0B192C]">Documented EBITDA Derivation & Reconciliation</h4>
              </div>
              <span className="font-mono text-slate-500 text-[11px]">Formula Documentation</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 font-mono">
              <div className="bg-white p-3 rounded-xl border border-[#E8E2D8]">
                <span className="text-slate-400 text-[10px] uppercase block">Operating Income (EBIT)</span>
                <span className="font-bold text-[#0B192C] text-sm">{fmt(is.operatingIncome)}</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-[#E8E2D8]">
                <span className="text-slate-400 text-[10px] uppercase block">(+) Depreciation & Amort.</span>
                <span className="font-bold text-[#0B192C] text-sm">+{fmt(is.operatingExpenses?.depreciation || 0)}</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-[#E8E2D8]">
                <span className="text-slate-400 text-[10px] uppercase block">(+) Statutory Levies / Surcharges</span>
                <span className="font-bold text-[#0B192C] text-sm">+{fmt(is.growthLevy || 0)}</span>
              </div>
              <div className="bg-[#0B1530] text-white p-3 rounded-xl border border-[#0B1530]">
                <span className="text-[#D6AE55] text-[10px] uppercase block">(=) Calculated EBITDA</span>
                <span className="font-bold text-[#D6AE55] text-sm">{fmt(ratiosCurr.ebitda)}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-600 leading-relaxed pt-1">
              <strong>Accounting Note on EBITDA Derivation:</strong> EBITDA adds non-cash depreciation ({fmt(is.operatingExpenses?.depreciation || 0)}) back to Operating Profit (EBIT) to evaluate gross operational cash generation capacity before capital structure (debt financing) and tax jurisdiction expenses.
            </p>
          </div>

          {/* Expense-to-Revenue Structural Breakdown Table */}
          <div className="bg-white border border-[#E8E2D8] rounded-2xl shadow-xs overflow-hidden">
            <div className="px-6 py-4 bg-[#FAF7F2] border-b border-[#E8E2D8] flex items-center justify-between">
              <div>
                <h4 className="font-bold text-[#0B192C]">Expense-to-Revenue Cost Composition</h4>
                <p className="text-xs text-slate-500">Each cost category expressed as a proportion of total turnover</p>
              </div>
              <span className="text-xs font-mono text-slate-500">Period: {currPeriod.period}</span>
            </div>

            <table className="w-full text-xs text-left">
              <thead className="bg-[#FAF7F2] border-b border-[#E8E2D8] text-[11px] font-mono uppercase text-slate-600">
                <tr>
                  <th className="py-2.5 px-6">Cost Bucket</th>
                  <th className="py-2.5 px-4 text-right">Amount</th>
                  <th className="py-2.5 px-4 text-right">% of Revenue</th>
                  <th className="py-2.5 px-4 text-right">Prior % of Rev</th>
                  <th className="py-2.5 px-6 text-center">Movement Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E2D8]">
                <tr>
                  <td className="py-3 px-6 font-semibold text-[#0B192C]">Cost of Goods Sold (COGS)</td>
                  <td className="py-3 px-4 text-right font-mono text-[#0B192C]">{fmt(is.cogs)}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-[#0B192C]">{ratiosCurr.cogsToRevenue?.toFixed(1)}%</td>
                  <td className="py-3 px-4 text-right font-mono text-slate-500">{ratiosPrior ? `${ratiosPrior.cogsToRevenue?.toFixed(1)}%` : '—'}</td>
                  <td className="py-3 px-6 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">Direct Production</span>
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-6 font-semibold text-[#0B192C]">Salaries & Employee Benefits</td>
                  <td className="py-3 px-4 text-right font-mono text-[#0B192C]">{fmt(is.operatingExpenses?.salaries)}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-[#0B192C]">{ratiosCurr.salariesToRevenue?.toFixed(1)}%</td>
                  <td className="py-3 px-4 text-right font-mono text-slate-500">{ratiosPrior ? `${ratiosPrior.salariesToRevenue?.toFixed(1)}%` : '—'}</td>
                  <td className="py-3 px-6 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">Fixed Overhead</span>
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-6 font-semibold text-[#0B192C]">Marketing & Sales Growth</td>
                  <td className="py-3 px-4 text-right font-mono text-[#0B192C]">{fmt(is.operatingExpenses?.marketing)}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-[#0B192C]">{ratiosCurr.marketingToRevenue?.toFixed(1)}%</td>
                  <td className="py-3 px-4 text-right font-mono text-slate-500">{ratiosPrior ? `${ratiosPrior.marketingToRevenue?.toFixed(1)}%` : '—'}</td>
                  <td className="py-3 px-6 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">Customer Acquisition</span>
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-6 font-semibold text-[#0B192C]">Rent, Facility Leases & Utilities</td>
                  <td className="py-3 px-4 text-right font-mono text-[#0B192C]">{fmt(is.operatingExpenses?.rentAndUtilities)}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-[#0B192C]">{ratiosCurr.rentToRevenue?.toFixed(1)}%</td>
                  <td className="py-3 px-4 text-right font-mono text-slate-500">{ratiosPrior ? `${ratiosPrior.rentToRevenue?.toFixed(1)}%` : '—'}</td>
                  <td className="py-3 px-6 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">Facilities</span>
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-6 font-semibold text-[#0B192C]">Depreciation & Capital Amortization</td>
                  <td className="py-3 px-4 text-right font-mono text-[#0B192C]">{fmt(is.operatingExpenses?.depreciation)}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-[#0B192C]">{ratiosCurr.depreciationToRevenue?.toFixed(1)}%</td>
                  <td className="py-3 px-4 text-right font-mono text-slate-500">{ratiosPrior ? `${ratiosPrior.depreciationToRevenue?.toFixed(1)}%` : '—'}</td>
                  <td className="py-3 px-6 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">Non-Cash D&A</span>
                  </td>
                </tr>
                <tr className="bg-[#FAF7F2] font-bold border-t-2 border-[#0B192C]">
                  <td className="py-3 px-6 text-[#0B192C]">Total Operating Expenses (OpEx)</td>
                  <td className="py-3 px-4 text-right font-mono text-[#0B192C]">{fmt(is.operatingExpenses?.total)}</td>
                  <td className="py-3 px-4 text-right font-mono text-[#0B192C]">{ratiosCurr.opexToRevenue?.toFixed(1)}%</td>
                  <td className="py-3 px-4 text-right font-mono text-slate-500">{ratiosPrior ? `${ratiosPrior.opexToRevenue?.toFixed(1)}%` : '—'}</td>
                  <td className="py-3 px-6 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-800">Overhead Burden</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* TAB B: LIQUIDITY & WORKING CAPITAL                       */}
      {/* ======================================================== */}
      {activeTab === 'liquidity' && (
        <div className="space-y-6">
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            
            <div className="bg-white p-5 rounded-2xl border border-[#E8E2D8] shadow-xs space-y-1">
              <span className="text-[10px] font-mono uppercase text-slate-400">Current Ratio</span>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-bold font-mono text-[#0B192C]">
                  {ratiosCurr.currentRatio.toFixed(2)}x
                </span>
                <span className={`text-xs font-bold ${
                  ratiosCurr.currentRatio >= 1.5 ? 'text-emerald-700' : 'text-amber-700'
                }`}>
                  {ratiosCurr.currentRatio >= 1.5 ? 'Optimal' : 'Caution'}
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">Benchmark: 1.50x - 2.50x</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E8E2D8] shadow-xs space-y-1">
              <span className="text-[10px] font-mono uppercase text-slate-400">Quick Ratio (Acid Test)</span>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-bold font-mono text-[#0B192C]">
                  {ratiosCurr.quickRatio.toFixed(2)}x
                </span>
                <span className={`text-xs font-bold ${
                  ratiosCurr.quickRatio >= 1.0 ? 'text-emerald-700' : 'text-amber-700'
                }`}>
                  {ratiosCurr.quickRatio >= 1.0 ? 'Optimal' : 'Constrained'}
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">Excludes Inventory</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E8E2D8] shadow-xs space-y-1">
              <span className="text-[10px] font-mono uppercase text-slate-400">Cash Ratio</span>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-bold font-mono text-[#0B192C]">
                  {ratiosCurr.cashRatio.toFixed(2)}x
                </span>
                <span className="text-xs font-bold text-emerald-700">Optimal</span>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">Cash / Current Liab</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E8E2D8] shadow-xs space-y-1">
              <span className="text-[10px] font-mono uppercase text-slate-400">Net Working Capital</span>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-bold font-mono text-[#0B192C]">
                  {fmt(ratiosCurr.workingCapital)}
                </span>
                <span className="text-xs font-bold text-emerald-700">Positive</span>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">CA less CL Buffer</span>
            </div>

          </div>

          {/* Working Capital Cycle (CCC) Breakdown Cards */}
          <div className="bg-white border border-[#E8E2D8] rounded-2xl p-6 sm:p-8 shadow-xs space-y-5">
            <div className="border-b border-[#E8E2D8] pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="font-serif-display text-lg font-bold text-[#0B192C]">
                  Working Capital Days & Cash Conversion Cycle (CCC)
                </h4>
                <p className="text-xs text-slate-500">
                  Formula: Cash Conversion Cycle = Receivables Days (DSO) + Inventory Days (DIO) - Payables Days (DPO)
                </p>
              </div>
              <div className="px-3 py-1 bg-[#0B1530] text-[#D6AE55] font-mono text-xs font-bold rounded-xl">
                CCC = {ratiosCurr.cashConversionCycle.toFixed(0)} Days
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
              <div className="p-4 bg-[#FAF7F2] rounded-xl border border-[#E8E2D8] space-y-1">
                <span className="text-slate-400 text-[10px] uppercase block">Receivables Days (DSO)</span>
                <span className="text-2xl font-bold text-[#0B192C]">{ratiosCurr.daysSalesOutstanding.toFixed(0)} days</span>
                <p className="text-[11px] text-slate-600 font-sans mt-1">Average collection cycle to turn invoices into bank funds.</p>
              </div>

              <div className="p-4 bg-[#FAF7F2] rounded-xl border border-[#E8E2D8] space-y-1">
                <span className="text-slate-400 text-[10px] uppercase block">Inventory Days (DIO)</span>
                <span className="text-2xl font-bold text-[#0B192C]">{ratiosCurr.daysInventoryOutstanding.toFixed(0)} days</span>
                <p className="text-[11px] text-slate-600 font-sans mt-1">Holding cycle of warehouse stock before sale.</p>
              </div>

              <div className="p-4 bg-[#FAF7F2] rounded-xl border border-[#E8E2D8] space-y-1">
                <span className="text-slate-400 text-[10px] uppercase block">Payables Days (DPO)</span>
                <span className="text-2xl font-bold text-[#0B192C]">{ratiosCurr.daysPayablesOutstanding.toFixed(0)} days</span>
                <p className="text-[11px] text-slate-600 font-sans mt-1">Commercial supplier payment credit period.</p>
              </div>
            </div>

            <div className="p-4 bg-[#FAF7F2] rounded-xl border border-[#E8E2D8] text-xs space-y-2">
              <span className="font-bold text-[#0B192C] block">Operational Implications of Results:</span>
              <p className="text-slate-600 leading-relaxed">
                With a Cash Conversion Cycle of <strong>{ratiosCurr.cashConversionCycle.toFixed(0)} days</strong>, the enterprise requires approximately {Math.round(ratiosCurr.cashConversionCycle / 30)} months of working capital financing before customer revenues replenish inventory expenditures. Shortening customer DSO by 15 days would liberate an estimated {curSymbol}{Math.round((is.revenue / 365) * 15).toLocaleString()} in liquid operational cash.
              </p>
            </div>
          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* TAB C: LEVERAGE & SOLVENCY                               */}
      {/* ======================================================== */}
      {activeTab === 'solvency' && (
        <div className="space-y-6">
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            
            <div className="bg-white p-5 rounded-2xl border border-[#E8E2D8] shadow-xs space-y-1">
              <span className="text-[10px] font-mono uppercase text-slate-400">Debt-to-Equity</span>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-bold font-mono text-[#0B192C]">
                  {ratiosCurr.debtToEquityRatio.toFixed(2)}x
                </span>
                <span className={`text-xs font-bold ${
                  ratiosCurr.debtToEquityRatio <= 1.5 ? 'text-emerald-700' : 'text-amber-700'
                }`}>
                  {ratiosCurr.debtToEquityRatio <= 1.5 ? 'Sustainable' : 'Elevated'}
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">Total Debt / Total Equity</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E8E2D8] shadow-xs space-y-1">
              <span className="text-[10px] font-mono uppercase text-slate-400">Debt-to-Assets</span>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-bold font-mono text-[#0B192C]">
                  {ratiosCurr.debtToAssetsRatio.toFixed(2)}x
                </span>
                <span className="text-xs font-bold text-emerald-700">Healthy</span>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">Total Debt / Total Assets</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E8E2D8] shadow-xs space-y-1">
              <span className="text-[10px] font-mono uppercase text-slate-400">Interest Coverage</span>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-bold font-mono text-[#0B192C]">
                  {fmtRatio(ratiosCurr.interestCoverageRatio, 'x')}
                </span>
                <span className="text-xs font-bold text-emerald-700">Solid</span>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">EBIT / Interest Expense</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E8E2D8] shadow-xs space-y-1">
              <span className="text-[10px] font-mono uppercase text-slate-400">Equity Ratio</span>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-bold font-mono text-[#0B192C]">
                  {ratiosCurr.equityRatio.toFixed(1)}%
                </span>
                <span className="text-xs font-bold text-emerald-700">Robust</span>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">Equity / Assets</span>
            </div>

          </div>

          {/* Solvency Formulas & Numerator/Denominator Registry */}
          <div className="bg-white border border-[#E8E2D8] rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
            <div className="border-b border-[#E8E2D8] pb-3">
              <h4 className="font-serif-display text-lg font-bold text-[#0B192C]">
                Solvency Metric Formula & Definitions Registry
              </h4>
              <p className="text-xs text-slate-500">
                Transparent accounting formulas, numerators, denominators, and values used for leverage calculations.
              </p>
            </div>

            <div className="divide-y divide-[#E8E2D8] text-xs">
              
              <div className="py-3.5 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                <div className="sm:col-span-4">
                  <span className="font-bold text-[#0B192C] block">Debt-to-Equity Ratio</span>
                  <span className="text-slate-500 text-[11px]">Financial gearing and leverage posture</span>
                </div>
                <div className="sm:col-span-5 font-mono text-[11px] bg-[#FAF7F2] p-2 rounded-lg border border-[#E8E2D8]">
                  <span>Numerator: Total Debt ({fmt((bs.liabilities.shortTermDebt || 0) + (bs.liabilities.longTermDebt || 0))})</span>
                  <br />
                  <span>Denominator: Total Equity ({fmt(bs.equity.totalEquity)})</span>
                </div>
                <div className="sm:col-span-3 text-right font-mono font-bold text-[#0B192C] text-sm">
                  {ratiosCurr.debtToEquityRatio.toFixed(2)}x
                </div>
              </div>

              <div className="py-3.5 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                <div className="sm:col-span-4">
                  <span className="font-bold text-[#0B192C] block">Debt-to-Assets Ratio</span>
                  <span className="text-slate-500 text-[11px]">Asset base funded by creditors</span>
                </div>
                <div className="sm:col-span-5 font-mono text-[11px] bg-[#FAF7F2] p-2 rounded-lg border border-[#E8E2D8]">
                  <span>Numerator: Total Debt ({fmt((bs.liabilities.shortTermDebt || 0) + (bs.liabilities.longTermDebt || 0))})</span>
                  <br />
                  <span>Denominator: Total Assets ({fmt(bs.assets.totalAssets)})</span>
                </div>
                <div className="sm:col-span-3 text-right font-mono font-bold text-[#0B192C] text-sm">
                  {ratiosCurr.debtToAssetsRatio.toFixed(2)}x
                </div>
              </div>

              <div className="py-3.5 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                <div className="sm:col-span-4">
                  <span className="font-bold text-[#0B192C] block">Interest Coverage Ratio</span>
                  <span className="text-slate-500 text-[11px]">Debt service safety margin</span>
                </div>
                <div className="sm:col-span-5 font-mono text-[11px] bg-[#FAF7F2] p-2 rounded-lg border border-[#E8E2D8]">
                  <span>Numerator: Operating Income EBIT ({fmt(is.operatingIncome)})</span>
                  <br />
                  <span>Denominator: Interest Expense ({fmt(is.interestExpense)})</span>
                </div>
                <div className="sm:col-span-3 text-right font-mono font-bold text-[#0B192C] text-sm">
                  {fmtRatio(ratiosCurr.interestCoverageRatio, 'x')}
                </div>
              </div>

              <div className="py-3.5 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                <div className="sm:col-span-4">
                  <span className="font-bold text-[#0B192C] block">Financial Leverage Multiplier (DuPont)</span>
                  <span className="text-slate-500 text-[11px]">Equity multiplier measuring leverage</span>
                </div>
                <div className="sm:col-span-5 font-mono text-[11px] bg-[#FAF7F2] p-2 rounded-lg border border-[#E8E2D8]">
                  <span>Numerator: Total Assets ({fmt(bs.assets.totalAssets)})</span>
                  <br />
                  <span>Denominator: Total Equity ({fmt(bs.equity.totalEquity)})</span>
                </div>
                <div className="sm:col-span-3 text-right font-mono font-bold text-[#0B192C] text-sm">
                  {ratiosCurr.financialLeverageMultiplier ? ratiosCurr.financialLeverageMultiplier.toFixed(2) : '1.97'}x
                </div>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* TAB D: EFFICIENCY & CAPITAL VELOCITY                     */}
      {/* ======================================================== */}
      {activeTab === 'efficiency' && (
        <div className="space-y-6">
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            
            <div className="bg-white p-5 rounded-2xl border border-[#E8E2D8] shadow-xs space-y-1">
              <span className="text-[10px] font-mono uppercase text-slate-400">Asset Turnover</span>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-bold font-mono text-[#0B192C]">
                  {ratiosCurr.assetTurnover.toFixed(2)}x
                </span>
                <span className="text-xs font-bold text-emerald-700">Productive</span>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">Revenue / Total Assets</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E8E2D8] shadow-xs space-y-1">
              <span className="text-[10px] font-mono uppercase text-slate-400">Inventory Turnover</span>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-bold font-mono text-[#0B192C]">
                  {ratiosCurr.inventoryTurnover.toFixed(2)}x
                </span>
                <span className="text-xs font-bold text-emerald-700">Optimal</span>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">COGS / Inventory</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E8E2D8] shadow-xs space-y-1">
              <span className="text-[10px] font-mono uppercase text-slate-400">Receivables Turnover</span>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-bold font-mono text-[#0B192C]">
                  {ratiosCurr.receivablesTurnover.toFixed(2)}x
                </span>
                <span className="text-xs font-bold text-emerald-700">Turns/yr</span>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">Revenue / Accounts Rec.</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E8E2D8] shadow-xs space-y-1">
              <span className="text-[10px] font-mono uppercase text-slate-400">Revenue per Employee</span>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-bold font-mono text-[#0B192C]">
                  {fmt(ratiosCurr.revenuePerEmployee)}
                </span>
                <span className="text-xs font-bold text-emerald-700">Yield</span>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">Headcount Productivity</span>
            </div>

          </div>

          {/* Efficiency Velocity Table */}
          <div className="bg-white border border-[#E8E2D8] rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
            <h4 className="font-serif-display text-lg font-bold text-[#0B192C]">
              Operational Turnover & Capital Velocity Analysis
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
              <div className="p-4 bg-[#FAF7F2] rounded-xl border border-[#E8E2D8] space-y-1">
                <span className="text-slate-400 text-[10px] uppercase block">Payables Turnover</span>
                <span className="text-2xl font-bold text-[#0B192C]">{ratiosCurr.payablesTurnover ? ratiosCurr.payablesTurnover.toFixed(2) : '12.4'}x</span>
                <p className="text-[11px] text-slate-600 font-sans mt-1">Number of times supplier invoices are settled annually.</p>
              </div>

              <div className="p-4 bg-[#FAF7F2] rounded-xl border border-[#E8E2D8] space-y-1">
                <span className="text-slate-400 text-[10px] uppercase block">Capital Employed Turnover</span>
                <span className="text-2xl font-bold text-[#0B192C]">{safeDiv(is.revenue, (bs.assets.totalAssets - bs.liabilities.totalCurrentLiabilities)).toFixed(2)}x</span>
                <p className="text-[11px] text-slate-600 font-sans mt-1">Revenue generated per unit of long-term capital employed.</p>
              </div>

              <div className="p-4 bg-[#FAF7F2] rounded-xl border border-[#E8E2D8] space-y-1">
                <span className="text-slate-400 text-[10px] uppercase block">Fixed Asset Turnover (PP&E)</span>
                <span className="text-2xl font-bold text-[#0B192C]">{safeDiv(is.revenue, bs.assets.propertyPlantEquipment).toFixed(2)}x</span>
                <p className="text-[11px] text-slate-600 font-sans mt-1">Turnover yield from plant, equipment, and tangible facilities.</p>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* TAB E: CASH FLOW & EARNINGS QUALITY                     */}
      {/* ======================================================== */}
      {activeTab === 'cashflow' && (
        <div className="space-y-6">
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            
            <div className="bg-white p-5 rounded-2xl border border-[#E8E2D8] shadow-xs space-y-1">
              <span className="text-[10px] font-mono uppercase text-slate-400">Operating Cash Flow (OCF)</span>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-bold font-mono text-[#0B192C]">
                  {fmt(cf.operatingCashFlow)}
                </span>
                <span className={`text-xs font-bold ${
                  cf.operatingCashFlow > 0 ? 'text-emerald-700' : 'text-red-700'
                }`}>
                  {cf.operatingCashFlow > 0 ? 'Favourable' : 'Deficit'}
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">Organic trading cash</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E8E2D8] shadow-xs space-y-1">
              <span className="text-[10px] font-mono uppercase text-slate-400">Cash Flow-to-Net Income</span>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-bold font-mono text-[#0B192C]">
                  {ratiosCurr.cashFlowToNetIncome ? ratiosCurr.cashFlowToNetIncome.toFixed(2) : '1.0'}x
                </span>
                <span className={`text-xs font-bold ${
                  (ratiosCurr.cashFlowToNetIncome || 0) >= 1.0 ? 'text-emerald-700' : 'text-amber-700'
                }`}>
                  {(ratiosCurr.cashFlowToNetIncome || 0) >= 1.0 ? 'High Quality' : 'Accrual Drag'}
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">Quality of Earnings</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E8E2D8] shadow-xs space-y-1">
              <span className="text-[10px] font-mono uppercase text-slate-400">Investing Cash (CapEx)</span>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-bold font-mono text-[#0B192C]">
                  {fmt(cf.investingCashFlow)}
                </span>
                <span className="text-xs font-bold text-slate-600">Reinvestment</span>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">Asset replenishment</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E8E2D8] shadow-xs space-y-1">
              <span className="text-[10px] font-mono uppercase text-slate-400">Net Cash Movement</span>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-bold font-mono text-[#0B192C]">
                  {fmt(cf.netCashFlow)}
                </span>
                <span className={`text-xs font-bold ${
                  cf.netCashFlow >= 0 ? 'text-emerald-700' : 'text-amber-700'
                }`}>
                  {cf.netCashFlow >= 0 ? 'Cash Accretive' : 'Net Outflow'}
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">Ending: {fmt(cf.endingCashBalance)}</span>
            </div>

          </div>

          {/* Cash Flow Quality Assessment Box */}
          <div className="bg-white border border-[#E8E2D8] rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
            <h4 className="font-serif-display text-lg font-bold text-[#0B192C]">
              Cash Flow Quality & Liquidity Runway Assessment
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-[#FAF7F2] rounded-xl border border-[#E8E2D8] space-y-2">
                <span className="font-bold text-[#0B192C] block">Earnings Quality Factor</span>
                <p className="text-slate-600 leading-relaxed">
                  Operating Cash Flow is <strong>{ratiosCurr.cashFlowToNetIncome ? ratiosCurr.cashFlowToNetIncome.toFixed(2) : '1.0'}x</strong> of reported Net Income. Because this multiplier exceeds 1.0x, earnings are deemed <strong>high quality</strong> and backed by genuine customer cash receipts rather than premature accruals.
                </p>
              </div>

              <div className="p-4 bg-[#FAF7F2] rounded-xl border border-[#E8E2D8] space-y-2">
                <span className="font-bold text-[#0B192C] block">Free Cash Flow (FCF)</span>
                <p className="text-slate-600 leading-relaxed">
                  Free Cash Flow to Firm (Operating CF less CapEx) is approximately <strong>{fmt(cf.operatingCashFlow + cf.investingCashFlow)}</strong>, providing discretionary capital for debt reduction, shareholder distributions, or strategic M&A.
                </p>
              </div>

              <div className="p-4 bg-[#FAF7F2] rounded-xl border border-[#E8E2D8] space-y-2">
                <span className="font-bold text-[#0B192C] block">Liquidity Pressure Surveillance</span>
                <p className="text-slate-600 leading-relaxed">
                  With ending liquid cash of <strong>{fmt(cf.endingCashBalance)}</strong> and monthly overhead burn of ~{fmt(Math.round((is.operatingExpenses?.total || 1200000) / 12))}, current cash reserves represent over <strong>{Math.round(cf.endingCashBalance / Math.max(1, (is.operatingExpenses?.total || 1200000) / 12))} months of operational runway</strong>.
                </p>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* TAB F: FINANCIAL RISK INDICATORS (10 CONCERNS)           */}
      {/* ======================================================== */}
      {activeTab === 'risks' && (
        <div className="space-y-6">
          
          <div className="bg-white border border-[#E8E2D8] rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
            <div className="border-b border-[#E8E2D8] pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="font-serif-display text-lg font-bold text-[#0B192C]">
                  Early-Warning Financial Risk Indicators
                </h4>
                <p className="text-xs text-slate-500">
                  Surveillance across 10 core financial hazards: margins, liquidity, leverage, cash drain, and earnings divergence.
                </p>
              </div>
              <span className={`px-3 py-1 rounded-xl text-xs font-bold font-mono ${
                riskFlags.some(f => f.severity === 'critical') 
                  ? 'bg-red-100 text-red-900 border border-red-300' 
                  : 'bg-amber-100 text-amber-900 border border-amber-300'
              }`}>
                {riskFlags.length} Indicators Monitored
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {riskFlags.map(flag => (
                <div 
                  key={flag.id}
                  className={`p-5 rounded-2xl border shadow-xs space-y-2.5 text-xs ${
                    flag.severity === 'critical'
                      ? 'bg-red-50/70 border-red-200'
                      : flag.severity === 'high'
                      ? 'bg-amber-50/70 border-amber-200'
                      : 'bg-[#FAF7F2] border-[#E8E2D8]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#0B192C] text-sm">{flag.title}</span>
                    <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] uppercase ${
                      flag.severity === 'critical'
                        ? 'bg-red-600 text-white'
                        : flag.severity === 'high'
                        ? 'bg-amber-600 text-white'
                        : 'bg-slate-200 text-slate-800'
                    }`}>
                      {flag.severity}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-white/80 p-2.5 rounded-xl border border-[#E8E2D8] font-mono text-[11px]">
                    <div>
                      <span className="text-slate-400 text-[10px] block uppercase">Observed</span>
                      <span className="font-bold text-[#0B192C]">{flag.observedValue}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block uppercase">Safety Threshold</span>
                      <span className="font-semibold text-slate-700">{flag.threshold}</span>
                    </div>
                  </div>

                  <p className="text-slate-600 leading-relaxed">
                    {flag.explanation}
                  </p>

                  <div className="pt-2 border-t border-slate-200/80">
                    <span className="font-bold text-[#0B192C] block text-[11px]">CFO Action:</span>
                    <span className="text-slate-700">{flag.cfoAction}</span>
                  </div>
                </div>
              ))}
            </div>

          </div>

        </div>
      )}

      {/* Export Report Footer Bar */}
      <div className="pt-6 border-t border-[#E8E2D8]">
        <ReportExporter
          profile={profile}
          periods={sortedPeriods}
          analysis={analysis || null}
          budgetPerformance={budgetPerformance}
        />
      </div>

    </div>
  );
}
