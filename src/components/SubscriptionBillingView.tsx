/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  CreditCard, CheckCircle2, ShieldCheck, Zap, Building2, 
  Sparkles, ArrowRight, Download, Receipt, ExternalLink
} from 'lucide-react';
import { UserProfile } from '../types';

interface SubscriptionBillingViewProps {
  profile: UserProfile;
}

export default function SubscriptionBillingView({ profile }: SubscriptionBillingViewProps) {
  const [billingCycle, setBillingCycle] = useState<'annual' | 'monthly'>('annual');

  const plans = [
    {
      name: 'Growth CFO',
      tagline: 'For mid-market finance teams & consultants',
      monthlyPrice: 249,
      annualPrice: 199,
      features: [
        'Up to 3 legal entities / subsidiaries',
        'Automated Balance Sheet & P&L reconciliation',
        'Budget vs Actual variance engine',
        'Executive PDF, Word, & multi-tab Excel exports',
        'Supabase cloud sync & report library',
        'Standard email support (24h turnaround)'
      ],
      current: false,
      cta: 'Switch to Growth'
    },
    {
      name: 'Global Enterprise CFO',
      tagline: 'For holding groups, multi-currency firms & private equity',
      monthlyPrice: 599,
      annualPrice: 499,
      features: [
        'Unlimited legal entities & consolidation hierarchies',
        'Multi-currency translation & IFRS / US GAAP support',
        'Real-time DuPont ROE decomposition',
        'Early-warning emerging risk radar & playbooks',
        'Unlimited team seats & external auditor guest passes',
        'Dedicated advisory support & custom chart of accounts'
      ],
      current: true,
      cta: 'Current Plan'
    }
  ];

  const invoices = [
    { id: 'INV-2026-08', date: 'Aug 1, 2026', amount: '$499.00', status: 'Paid', plan: 'Enterprise CFO' },
    { id: 'INV-2026-07', date: 'Jul 1, 2026', amount: '$499.00', status: 'Paid', plan: 'Enterprise CFO' },
    { id: 'INV-2026-06', date: 'Jun 1, 2026', amount: '$499.00', status: 'Paid', plan: 'Enterprise CFO' }
  ];

  return (
    <div className="space-y-8 text-left animate-fade-in" id="subscription-billing-view-root">
      
      {/* Header Banner */}
      <div className="border-b border-[#E8E2D8] pb-5 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono font-bold tracking-[0.25em] text-[#D4A347] uppercase block mb-1">
            COMMERCIAL & SEAT MANAGEMENT
          </span>
          <h1 className="font-serif-display text-3xl sm:text-4xl font-bold text-[#0B192C]">
            Subscription & Billing
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Manage your FinScope SaaS tier, invoices, tax receipts, and payment method for <span className="font-bold text-[#0B192C]">{profile.companyName}</span>.
          </p>
        </div>

        {/* Billing cycle toggle */}
        <div className="flex items-center gap-2 p-1 bg-white border border-[#E8E2D8] rounded-xl shadow-xs shrink-0">
          <button
            type="button"
            onClick={() => setBillingCycle('annual')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              billingCycle === 'annual' ? 'bg-[#0B1530] text-white' : 'text-slate-600 hover:text-[#0B192C]'
            }`}
          >
            Annual (Save 20%)
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle('monthly')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              billingCycle === 'monthly' ? 'bg-[#0B1530] text-white' : 'text-slate-600 hover:text-[#0B192C]'
            }`}
          >
            Monthly
          </button>
        </div>
      </div>

      {/* Plan Tier Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {plans.map((plan, idx) => {
          const price = billingCycle === 'annual' ? plan.annualPrice : plan.monthlyPrice;
          return (
            <div 
              key={idx}
              className={`rounded-2xl p-6 sm:p-8 transition-all relative flex flex-col justify-between ${
                plan.current 
                  ? 'bg-white border-2 border-[#0B1530] shadow-md' 
                  : 'bg-white border border-[#E8E2D8] shadow-xs'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-serif-display text-xl font-bold text-[#0B192C]">
                    {plan.name}
                  </h3>
                  {plan.current && (
                    <span className="text-[10px] font-mono font-bold text-[#D6AE55] bg-[#0B1530] px-2.5 py-0.5 rounded-full">
                      ACTIVE TIER
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mb-6">
                  {plan.tagline}
                </p>

                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-mono font-black text-[#0B192C]">
                    ${price}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    / seat / month billed {billingCycle}
                  </span>
                </div>

                <div className="space-y-3 pt-4 border-t border-[#E8E2D8] mb-8">
                  {plan.features.map((feat, fIdx) => (
                    <div key={fIdx} className="flex items-start gap-2.5 text-xs text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                className={`w-full py-3 px-4 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  plan.current
                    ? 'bg-[#FAF7F2] text-[#0B192C] border border-[#E8E2D8]'
                    : 'bg-[#0B1530] hover:bg-[#162A45] text-white shadow-xs'
                }`}
              >
                <span>{plan.cta}</span>
                {!plan.current && <ArrowRight className="w-3.5 h-3.5" />}
              </button>
            </div>
          );
        })}
      </div>

      {/* Invoice History & Payment Method */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Card */}
        <div className="bg-white border border-[#E8E2D8] rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-[#D4A347]" />
            <h3 className="font-serif-display text-base font-bold text-[#0B192C]">
              Payment Method
            </h3>
          </div>
          <div className="p-4 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[#0B192C]">Corporate Mastercard ···· 8841</p>
              <p className="text-[11px] text-slate-500 font-mono">Expires 09/2028 · Primary</p>
            </div>
            <span className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
              Active
            </span>
          </div>
          <button
            type="button"
            className="w-full py-2.5 border border-[#E8E2D8] hover:bg-[#FAF7F2] rounded-xl text-xs font-semibold text-[#0B192C] transition-colors cursor-pointer"
          >
            Update Payment Details
          </button>
        </div>

        {/* Invoice Table */}
        <div className="lg:col-span-2 bg-white border border-[#E8E2D8] rounded-2xl overflow-hidden shadow-xs">
          <div className="px-6 py-4 bg-[#FAF7F2] border-b border-[#E8E2D8] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-[#0B1530]" />
              <h3 className="font-serif-display text-base font-bold text-[#0B192C]">
                Recent Invoices & Receipts
              </h3>
            </div>
          </div>
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-[#E8E2D8] text-slate-600 font-mono text-[11px]">
                <th className="py-3 px-6">Invoice ID</th>
                <th className="py-3 px-4">Billing Date</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-6 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E2D8]">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-[#FAF7F2]/50">
                  <td className="py-3 px-6 font-mono font-semibold text-[#0B192C]">{inv.id}</td>
                  <td className="py-3 px-4 text-slate-600">{inv.date}</td>
                  <td className="py-3 px-4 font-mono font-bold text-[#0B192C]">{inv.amount}</td>
                  <td className="py-3 px-4">
                    <span className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                      {inv.status}
                    </span>
                  </td>
                  <td className="py-3 px-6 text-right">
                    <button
                      type="button"
                      className="text-slate-500 hover:text-[#0B192C] text-xs font-semibold flex items-center gap-1 ml-auto cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>PDF</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
