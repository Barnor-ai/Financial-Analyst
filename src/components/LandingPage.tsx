/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  FileText, 
  Gauge, 
  ShieldAlert, 
  TrendingUp, 
  Sparkles, 
  ArrowRight,
  ChevronRight,
  Download,
  Building2,
  CheckCircle2,
  Layers,
  FileSpreadsheet
} from 'lucide-react';
import LanguageSelector from './LanguageSelector';

interface LandingPageProps {
  onGetStarted: () => void;
  onSignIn: () => void;
  onExploreDemo?: () => void;
}

export default function LandingPage({ onGetStarted, onSignIn, onExploreDemo }: LandingPageProps) {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col bg-[#0B1530]" id="landing-page-root">
      
      {/* Top Navigation Bar */}
      <header className="w-full max-w-7xl mx-auto px-6 sm:px-10 py-6 flex items-center justify-between z-10" id="landing-header">
        <div className="flex items-center gap-3 cursor-pointer" onClick={onGetStarted}>
          <div className="w-9 h-9 bg-[#D6AE55] rounded-xl flex items-center justify-center shadow-md font-serif font-black text-xl text-[#0B1530]">
            F
          </div>
          <div className="flex flex-col text-left">
            <span className="text-white font-serif-display font-bold text-2xl tracking-tight leading-none">
              {t('common.appName', 'FinScope')}
            </span>
            <span className="text-[10px] text-[#D6AE55] font-mono tracking-wider mt-0.5 uppercase">
              {t('common.tagline', 'Financial clarity. Better decisions.')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-5">
          {/* Language Selector in public header */}
          <LanguageSelector variant="dark" />

          <button
            type="button"
            onClick={onSignIn}
            className="text-slate-300 hover:text-white text-xs sm:text-sm font-medium transition-colors cursor-pointer"
            id="landing-signin-btn"
          >
            {t('landing.signIn', 'Sign in')}
          </button>
          <button
            type="button"
            onClick={onGetStarted}
            className="px-4 sm:px-5 py-2 sm:py-2.5 bg-[#D6AE55] hover:bg-[#C59B42] active:bg-[#B88E35] text-[#0B1530] text-xs sm:text-sm font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer group"
            id="landing-getstarted-btn"
          >
            <span>{t('landing.startFree', 'Get started')}</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative w-full max-w-7xl mx-auto px-6 sm:px-10 pt-12 sm:pt-18 pb-16 sm:pb-24 flex flex-col items-start justify-center text-left">
        {/* Subtle ambient glow */}
        <div className="absolute top-10 left-1/3 w-96 h-96 bg-[#162A45]/30 rounded-full blur-3xl pointer-events-none -z-0" />

        <div className="relative z-10 max-w-3xl">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#122338] border border-[#1E3758] rounded-lg text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em] text-[#D6AE55] mb-6 font-mono">
            <span>CFO DECISION SUPPORT SAAS</span>
          </div>

          {/* Core Product Positioning Headline */}
          <h1 className="font-serif-display text-4xl sm:text-6xl md:text-7xl font-bold text-white leading-[1.1] tracking-tight mb-6">
            Financial clarity.{' '}
            <span className="text-[#D6AE55] italic font-['Newsreader',_'Lora',_Georgia,_serif] font-normal tracking-tight inline-block">
              Better decisions.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-2xl mb-8 font-normal">
            Transform raw financial statements, management accounts, and budgets into actionable executive intelligence. Evaluate financial health, investigate significant variances, detect emerging risks, and generate board-level CFO recommendations in minutes.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={onGetStarted}
              className="px-6 py-3.5 bg-[#D6AE55] hover:bg-[#C59B42] active:bg-[#B88E35] text-[#0B1530] text-sm sm:text-base font-bold rounded-xl transition-all shadow-[0_4px_20px_rgba(214,174,85,0.25)] flex items-center gap-2 cursor-pointer group"
              id="hero-start-btn"
            >
              <span>Launch CFO Workspace</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>

            {onExploreDemo && (
              <button
                type="button"
                onClick={onExploreDemo}
                className="px-5 py-3.5 bg-[#122338] hover:bg-[#1A3352] border border-[#1E3758] text-slate-200 text-sm sm:text-base font-semibold rounded-xl transition-all flex items-center gap-2 cursor-pointer"
                id="hero-demo-btn"
              >
                <span>Explore sample analysis (Meridian Global)</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Primary Workflow Walkthrough */}
      <section className="w-full bg-[#10223A] py-12 border-t border-[#1E3758] text-left">
        <div className="max-w-7xl mx-auto px-6 sm:px-10">
          <div className="mb-8">
            <span className="text-[10px] font-mono uppercase font-bold text-[#D6AE55] tracking-wider">
              STRUCTURED WORKFLOW
            </span>
            <h2 className="font-serif-display text-2xl sm:text-3xl font-bold text-white mt-1">
              From Raw Statements to Boardroom Action
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="p-4 bg-[#0B1530] rounded-xl border border-[#1E3758] space-y-2">
              <span className="text-xs font-mono font-bold text-[#D6AE55]">01. Entity Scope</span>
              <h4 className="text-xs font-bold text-white">Create Organisation & Entity</h4>
              <p className="text-[11px] text-slate-400 leading-normal">
                Multi-entity hierarchy with customizable reporting basis (IFRS, US GAAP) and currencies.
              </p>
            </div>

            <div className="p-4 bg-[#0B1530] rounded-xl border border-[#1E3758] space-y-2">
              <span className="text-xs font-mono font-bold text-[#D6AE55]">02. Ingest</span>
              <h4 className="text-xs font-bold text-white">Upload Accounts & Budgets</h4>
              <p className="text-[11px] text-slate-400 leading-normal">
                Import Excel, CSV, PDF statements or paste management accounts directly.
              </p>
            </div>

            <div className="p-4 bg-[#0B1530] rounded-xl border border-[#1E3758] space-y-2">
              <span className="text-xs font-mono font-bold text-[#D6AE55]">03. Validate & Map</span>
              <h4 className="text-xs font-bold text-white">Audit Accounting Equilibrium</h4>
              <p className="text-[11px] text-slate-400 leading-normal">
                Assets = Liabilities + Equity checks, subtotal reconciliations, and chart of accounts mapping.
              </p>
            </div>

            <div className="p-4 bg-[#0B1530] rounded-xl border border-[#1E3758] space-y-2">
              <span className="text-xs font-mono font-bold text-[#D6AE55]">04. Diagnose</span>
              <h4 className="text-xs font-bold text-white">Investigate Variances & Risks</h4>
              <p className="text-[11px] text-slate-400 leading-normal">
                Favorable/unfavorable budget overruns, DuPont 3-stage ROE, and early warning signals.
              </p>
            </div>

            <div className="p-4 bg-[#0B1530] rounded-xl border border-[#1E3758] space-y-2">
              <span className="text-xs font-mono font-bold text-[#D6AE55]">05. Deliver</span>
              <h4 className="text-xs font-bold text-white">Export & Archive Library</h4>
              <p className="text-[11px] text-slate-400 leading-normal">
                Download multi-tab Excel workbooks, Word memos, and board-ready PDF briefs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards Grid (Warm Cream Background #F8F4EB) */}
      <section className="w-full bg-[#F8F4EB] py-16 sm:py-24 border-t border-[#E8E2D8] flex-1 text-left">
        <div className="max-w-7xl mx-auto px-6 sm:px-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Card 1: Multi-Entity & Universal Ingestion */}
            <div className="bg-white p-7 sm:p-8 rounded-2xl border border-[#E8E2D8] shadow-xs hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-xl bg-[#FAF7F2] border border-[#E8E2D8] flex items-center justify-center text-[#D6AE55] mb-5">
                <FileText className="w-5 h-5 text-[#D6AE55]" />
              </div>
              <h3 className="font-serif-display text-xl font-bold text-[#0B192C] mb-2 tracking-tight">
                Universal Statement Ingestion
              </h3>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                PDF, Excel (.xlsx), CSV, and raw management accounts — from fast-moving startups to audited global enterprises.
              </p>
            </div>

            {/* Card 2: Instant Ratios & DuPont ROE */}
            <div className="bg-white p-7 sm:p-8 rounded-2xl border border-[#E8E2D8] shadow-xs hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-xl bg-[#FAF7F2] border border-[#E8E2D8] flex items-center justify-center text-[#D6AE55] mb-5">
                <Gauge className="w-5 h-5 text-[#D6AE55]" />
              </div>
              <h3 className="font-serif-display text-xl font-bold text-[#0B192C] mb-2 tracking-tight">
                Comprehensive Ratios & DuPont
              </h3>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                Gross & net margins, current, quick, cash ratio, DSO, DIO, DPO, CCC, Altman Z'-Score, and 3-stage DuPont ROE breakdown.
              </p>
            </div>

            {/* Card 3: Variance Investigation */}
            <div className="bg-white p-7 sm:p-8 rounded-2xl border border-[#E8E2D8] shadow-xs hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-xl bg-[#FAF7F2] border border-[#E8E2D8] flex items-center justify-center text-[#D6AE55] mb-5">
                <TrendingUp className="w-5 h-5 text-[#D6AE55]" />
              </div>
              <h3 className="font-serif-display text-xl font-bold text-[#0B192C] mb-2 tracking-tight">
                Variance Investigation Hub
              </h3>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                Automated budget vs actual variance with favorable/unfavorable classification, materiality flags, and root-cause tagging.
              </p>
            </div>

            {/* Card 4: Early Warnings Radar */}
            <div className="bg-white p-7 sm:p-8 rounded-2xl border border-[#E8E2D8] shadow-xs hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-xl bg-[#FAF7F2] border border-[#E8E2D8] flex items-center justify-center text-[#D6AE55] mb-5">
                <ShieldAlert className="w-5 h-5 text-[#D6AE55]" />
              </div>
              <h3 className="font-serif-display text-xl font-bold text-[#0B192C] mb-2 tracking-tight">
                Emerging Risks & Radar
              </h3>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                Algorithmic early warning flags for working capital drag, DSO blowout, margin squeeze, and solvency covenants.
              </p>
            </div>

            {/* Card 5: AI CFO Advisory */}
            <div className="bg-white p-7 sm:p-8 rounded-2xl border border-[#E8E2D8] shadow-xs hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-xl bg-[#FAF7F2] border border-[#E8E2D8] flex items-center justify-center text-[#D6AE55] mb-5">
                <Sparkles className="w-5 h-5 text-[#D6AE55]" />
              </div>
              <h3 className="font-serif-display text-xl font-bold text-[#0B192C] mb-2 tracking-tight">
                Board-Ready Management Commentary
              </h3>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                Executive briefing commentary, revenue drivers, cost inflation audits, and actionable 30/60/90-day CFO playbooks.
              </p>
            </div>

            {/* Card 6: Multi-Format Export */}
            <div className="bg-white p-7 sm:p-8 rounded-2xl border border-[#E8E2D8] shadow-xs hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-xl bg-[#FAF7F2] border border-[#E8E2D8] flex items-center justify-center text-[#D6AE55] mb-5">
                <Download className="w-5 h-5 text-[#D6AE55]" />
              </div>
              <h3 className="font-serif-display text-xl font-bold text-[#0B192C] mb-2 tracking-tight">
                Export to Excel, Word & PDF
              </h3>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                Download multi-tab Excel workbooks (.xlsx), editable Word board reports (.doc), and printable PDF presentations.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full bg-[#F8F4EB] border-t border-[#E8E2D8] py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span>© 2026 FinScope SaaS</span>
            <span>·</span>
            <span className="font-medium text-[#0B192C]">Financial clarity. Better decisions.</span>
          </div>
          <div className="text-slate-400">Built for CFOs, Finance Directors & Advisory Teams</div>
        </div>
      </footer>
    </div>
  );
}
