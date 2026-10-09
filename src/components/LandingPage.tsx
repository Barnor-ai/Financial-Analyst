/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  FileText, 
  Gauge, 
  ShieldAlert, 
  TrendingUp, 
  Sparkles, 
  ArrowRight,
  ChevronRight,
  Download
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  onSignIn: () => void;
  onExploreDemo?: () => void;
}

export default function LandingPage({ onGetStarted, onSignIn, onExploreDemo }: LandingPageProps) {
  return (
    <div className="min-h-screen flex flex-col bg-[#0B1530]" id="landing-page-root">
      
      {/* Top Navigation Bar (Matches Video Frame 00:00 - 00:26) */}
      <header className="w-full max-w-7xl mx-auto px-6 sm:px-10 py-6 flex items-center justify-between z-10" id="landing-header">
        <div className="flex items-center gap-3 cursor-pointer" onClick={onGetStarted}>
          <div className="w-9 h-9 bg-[#D6AE55] rounded-xl flex items-center justify-center shadow-md font-serif font-black text-xl text-[#0B1530]">
            F
          </div>
          <span className="text-white font-serif-display font-bold text-2xl tracking-tight">
            FinScope
          </span>
        </div>

        <div className="flex items-center gap-5 sm:gap-7">
          <button
            type="button"
            onClick={onSignIn}
            className="text-slate-300 hover:text-white text-xs sm:text-sm font-medium transition-colors cursor-pointer"
            id="landing-signin-btn"
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={onGetStarted}
            className="px-4 sm:px-5 py-2 sm:py-2.5 bg-[#D6AE55] hover:bg-[#C59B42] active:bg-[#B88E35] text-[#0B1530] text-xs sm:text-sm font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer group"
            id="landing-getstarted-btn"
          >
            <span>Get started</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </header>

      {/* Hero Section (Deep Navy Canvas) */}
      <section className="relative w-full max-w-7xl mx-auto px-6 sm:px-10 pt-12 sm:pt-20 pb-20 sm:pb-32 flex flex-col items-start justify-center text-left">
        {/* Ambient subtle glow */}
        <div className="absolute top-10 left-1/3 w-96 h-96 bg-[#162A45]/30 rounded-full blur-3xl pointer-events-none -z-0" />

        <div className="relative z-10 max-w-3xl">
          {/* Eyebrow */}
          <div className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.25em] text-[#D6AE55] mb-5 font-mono">
            AI FINANCIAL ANALYST
          </div>

          {/* Main Headline */}
          <h1 className="font-serif-display text-4xl sm:text-6xl md:text-7xl font-bold text-white leading-[1.12] tracking-tight mb-7">
            Your financial statements, read by a{' '}
            <span className="text-[#D6AE55] italic font-['Newsreader',_'Lora',_Georgia,_serif] font-normal tracking-tight inline-block">
              senior consultant.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-2xl mb-10 font-normal">
            Upload an income statement, balance sheet or cash flow report. FinScope returns a full executive briefing in minutes — ratios, trends, red flags, a 1-10 risk score and strategic advice.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={onGetStarted}
              className="px-6 py-3.5 bg-[#D6AE55] hover:bg-[#C59B42] active:bg-[#B88E35] text-[#0B1530] text-sm sm:text-base font-bold rounded-xl transition-all shadow-[0_4px_20px_rgba(214,174,85,0.25)] flex items-center gap-2 cursor-pointer group"
              id="hero-start-btn"
            >
              <span>Start free analysis</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>

            {onExploreDemo && (
              <button
                type="button"
                onClick={onExploreDemo}
                className="px-5 py-3.5 bg-[#122338] hover:bg-[#1A3352] border border-[#1E3758] text-slate-200 text-sm sm:text-base font-semibold rounded-xl transition-all flex items-center gap-2 cursor-pointer"
                id="hero-demo-btn"
              >
                <span>Explore sample analysis</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Feature Cards Grid (Warm Cream Background #F8F4EB - Matches Video Frame 00:26) */}
      <section className="w-full bg-[#F8F4EB] py-16 sm:py-24 border-t border-slate-800/40 flex-1 text-left">
        <div className="max-w-7xl mx-auto px-6 sm:px-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Card 1: Upload anything */}
            <div className="bg-white p-7 sm:p-8 rounded-2xl border border-[#E8E2D8] shadow-[0_2px_12px_rgba(11,25,44,0.03)] hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-xl bg-[#FAF7F2] border border-[#E8E2D8] flex items-center justify-center text-[#D6AE55] mb-5">
                <FileText className="w-5 h-5 text-[#D6AE55]" />
              </div>
              <h3 className="font-serif-display text-xl font-bold text-[#0B192C] mb-2 tracking-tight">
                Upload anything
              </h3>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                PDF, Excel or CSV — management accounts to audited statements.
              </p>
            </div>

            {/* Card 2: Instant ratios */}
            <div className="bg-white p-7 sm:p-8 rounded-2xl border border-[#E8E2D8] shadow-[0_2px_12px_rgba(11,25,44,0.03)] hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-xl bg-[#FAF7F2] border border-[#E8E2D8] flex items-center justify-center text-[#D6AE55] mb-5">
                <Gauge className="w-5 h-5 text-[#D6AE55]" />
              </div>
              <h3 className="font-serif-display text-xl font-bold text-[#0B192C] mb-2 tracking-tight">
                Instant ratios
              </h3>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                Gross & net margin, current, quick, D/E, ROA, ROE, operating margin, cash conversion.
              </p>
            </div>

            {/* Card 3: Risk score 1–10 */}
            <div className="bg-white p-7 sm:p-8 rounded-2xl border border-[#E8E2D8] shadow-[0_2px_12px_rgba(11,25,44,0.03)] hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-xl bg-[#FAF7F2] border border-[#E8E2D8] flex items-center justify-center text-[#D6AE55] mb-5">
                <ShieldAlert className="w-5 h-5 text-[#D6AE55]" />
              </div>
              <h3 className="font-serif-display text-xl font-bold text-[#0B192C] mb-2 tracking-tight">
                Risk score 1–10
              </h3>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                Liquidity, solvency and operational red flags surfaced and explained.
              </p>
            </div>

            {/* Card 4: Trend detection */}
            <div className="bg-white p-7 sm:p-8 rounded-2xl border border-[#E8E2D8] shadow-[0_2px_12px_rgba(11,25,44,0.03)] hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-xl bg-[#FAF7F2] border border-[#E8E2D8] flex items-center justify-center text-[#D6AE55] mb-5">
                <TrendingUp className="w-5 h-5 text-[#D6AE55]" />
              </div>
              <h3 className="font-serif-display text-xl font-bold text-[#0B192C] mb-2 tracking-tight">
                Trend detection
              </h3>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                Monthly & yearly patterns, budget vs actual variance.
              </p>
            </div>

            {/* Card 5: AI advisor chat */}
            <div className="bg-white p-7 sm:p-8 rounded-2xl border border-[#E8E2D8] shadow-[0_2px_12px_rgba(11,25,44,0.03)] hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-xl bg-[#FAF7F2] border border-[#E8E2D8] flex items-center justify-center text-[#D6AE55] mb-5">
                <Sparkles className="w-5 h-5 text-[#D6AE55]" />
              </div>
              <h3 className="font-serif-display text-xl font-bold text-[#0B192C] mb-2 tracking-tight">
                AI advisor chat
              </h3>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                Ask follow-up questions and get investor-style commentary.
              </p>
            </div>

            {/* Card 6: Export anywhere */}
            <div className="bg-white p-7 sm:p-8 rounded-2xl border border-[#E8E2D8] shadow-[0_2px_12px_rgba(11,25,44,0.03)] hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-xl bg-[#FAF7F2] border border-[#E8E2D8] flex items-center justify-center text-[#D6AE55] mb-5">
                <Download className="w-5 h-5 text-[#D6AE55]" />
              </div>
              <h3 className="font-serif-display text-xl font-bold text-[#0B192C] mb-2 tracking-tight">
                Export anywhere
              </h3>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                Download the full report as PDF, Excel or Word.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Footer (Matches Video Frame 00:26) */}
      <footer className="w-full bg-[#F8F4EB] border-t border-[#E8E2D8] py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>© 2026 FinScope</div>
          <div className="text-slate-400">Powered by FinScope AI</div>
        </div>
      </footer>
    </div>
  );
}
