/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Cloud, ShieldCheck, Trash2, Check, RefreshCw, Key, Users, 
  CreditCard, Building2, UserPlus, AlertCircle, LogOut,
  Globe, Languages, BookOpen, Sparkles, CheckCircle2, Info
} from 'lucide-react';
import { UserProfile, OrganisationMember, UserRole } from '../types';
import { 
  SUPPORTED_LANGUAGES, 
  SupportedLanguageCode, 
  setInterfaceLanguage,
  getOrgReportingLanguage,
  setOrgReportingLanguage,
  NUMBER_FORMAT_OPTIONS,
  NumberFormatStyle,
  getNumberFormatPreference,
  setNumberFormatPreference,
  STANDARD_FINANCIAL_GLOSSARY,
  getGlossaryOverrides,
  saveGlossaryOverride,
  resetGlossaryOverrides
} from '../i18n';

interface SettingsViewProps {
  profile: UserProfile;
  userEmail: string | null;
  syncMessage: string;
  isSyncing: boolean;
  onSaveToSupabase: () => void;
  onLoadFromSupabase: () => void;
  onResetWorkspace: () => void;
  onSignOutEverywhere?: () => void;
}

export default function SettingsView({
  profile,
  userEmail,
  syncMessage,
  isSyncing,
  onSaveToSupabase,
  onLoadFromSupabase,
  onResetWorkspace,
  onSignOutEverywhere
}: SettingsViewProps) {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<'admin' | 'team' | 'billing' | 'localization'>('admin');
  const [resetConfirm, setResetConfirm] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('analyst');
  const [inviteSuccess, setInviteSuccess] = useState(false);

  // Localization settings state
  const currentLang = (i18n.language || 'en') as SupportedLanguageCode;
  const [orgLang, setOrgLang] = useState<SupportedLanguageCode>(() => getOrgReportingLanguage());
  const [numberFormat, setNumberFormat] = useState<NumberFormatStyle>(() => getNumberFormatPreference());
  const [glossaryEdits, setGlossaryEdits] = useState<Record<string, string>>(() => {
    const overrides = getGlossaryOverrides();
    return { ...(overrides[currentLang] || {}) };
  });
  const [glossarySaveSuccess, setGlossarySaveSuccess] = useState(false);

  const [teamMembers, setTeamMembers] = useState<OrganisationMember[]>([
    {
      id: '1',
      organisationId: 'org-1',
      userId: 'u-1',
      email: userEmail || 'baricanovdiet@gmail.com',
      role: 'owner',
      joinedAt: '2026-08-15'
    },
    {
      id: '2',
      organisationId: 'org-1',
      userId: 'u-2',
      email: 'analyst.team@finscope.ai',
      role: 'analyst',
      joinedAt: '2026-09-01'
    }
  ]);

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    const newMember: OrganisationMember = {
      id: String(Date.now()),
      organisationId: 'org-1',
      userId: `u-${Date.now()}`,
      email: inviteEmail,
      role: inviteRole,
      joinedAt: new Date().toISOString().split('T')[0]
    };
    setTeamMembers(prev => [...prev, newMember]);
    setInviteEmail('');
    setInviteSuccess(true);
    setTimeout(() => {
      setInviteSuccess(false);
      setInviteModalOpen(false);
    }, 1500);
  };

  const handleRemoveMember = (id: string) => {
    setTeamMembers(prev => prev.filter(m => m.id !== id));
  };

  return (
    <div className="w-full max-w-4xl py-2 space-y-8 text-left pb-12" id="settings-page">
      
      {/* Spaced Eyebrow matching Video Frame 02:04 */}
      <div className="mb-2">
        <span className="text-[11px] font-mono font-bold tracking-[0.25em] text-[#D4A347] uppercase">
          SETTINGS
        </span>
      </div>

      {/* Main Serif Title */}
      <h1 className="font-serif-display text-4xl sm:text-5xl font-bold text-[#0B192C] tracking-tight mb-8">
        Admin & security
      </h1>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E8E2D8] pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('admin')}
          className={`py-2 px-4 text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors cursor-pointer ${
            activeTab === 'admin'
              ? 'bg-[#0B192C] text-white'
              : 'text-slate-600 hover:text-[#0B192C] hover:bg-white'
          }`}
        >
          Security & Integrations
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('team')}
          className={`py-2 px-4 text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors cursor-pointer ${
            activeTab === 'team'
              ? 'bg-[#0B192C] text-white'
              : 'text-slate-600 hover:text-[#0B192C] hover:bg-white'
          }`}
        >
          Team & Access (SaaS)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('billing')}
          className={`py-2 px-4 text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors cursor-pointer ${
            activeTab === 'billing'
              ? 'bg-[#0B192C] text-white'
              : 'text-slate-600 hover:text-[#0B192C] hover:bg-white'
          }`}
        >
          Subscription & Limits
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('localization')}
          className={`py-2 px-4 text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'localization'
              ? 'bg-[#0B192C] text-white'
              : 'text-slate-600 hover:text-[#0B192C] hover:bg-white'
          }`}
        >
          <Globe className="w-3.5 h-3.5 text-[#D6AE55]" />
          <span>Languages & Regional</span>
        </button>
      </div>

      {/* TAB 1: Admin & Security (Exact Match to Video Frame 02:04 - 02:17) */}
      {activeTab === 'admin' && (
        <div className="space-y-6">
          
          {/* 1. Account Card */}
          <div className="bg-white border border-[#E8E2D8] rounded-2xl p-6 sm:p-8 shadow-[0_2px_12px_rgba(11,25,44,0.03)] space-y-2">
            <h3 className="text-sm font-bold text-[#0B192C]">Account</h3>
            <p className="text-xs text-slate-600 font-mono">
              Signed in as <span className="font-semibold text-[#0B192C]">{userEmail || 'baricanovdiet@gmail.com'}</span> · provider: <span className="text-slate-700">google</span>
            </p>
          </div>

          {/* 2. Sessions Card */}
          <div className="bg-white border border-[#E8E2D8] rounded-2xl p-6 sm:p-8 shadow-[0_2px_12px_rgba(11,25,44,0.03)] space-y-4">
            <div>
              <h3 className="text-sm font-bold text-[#0B192C]">Sessions</h3>
              <p className="text-xs text-slate-600 mt-1">
                Sign out from all browsers and devices where this account is active.
              </p>
            </div>
            <div>
              <button
                type="button"
                onClick={onSignOutEverywhere || onResetWorkspace}
                className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-[#D5CDC0] text-[#0B192C] text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Sign out everywhere
              </button>
            </div>
          </div>

          {/* 3. API Integrations Card */}
          <div className="bg-white border border-[#E8E2D8] rounded-2xl p-6 sm:p-8 shadow-[0_2px_12px_rgba(11,25,44,0.03)] space-y-5">
            <div>
              <h3 className="text-sm font-bold text-[#0B192C]">API Integrations</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Third-party services connected to your FinScope workspace.
              </p>
            </div>

            <div className="space-y-4 divide-y divide-slate-100 text-xs">
              
              <div className="pt-3 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-[#0B192C]">Gemini API (Server)</p>
                  <p className="text-slate-500 text-[11px]">Used for statement extraction and the AI advisor chat</p>
                </div>
                <span className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Connected
                </span>
              </div>

              <div className="pt-3 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-[#0B192C]">Google sign-in</p>
                  <p className="text-slate-500 text-[11px]">OAuth provider for fast account access</p>
                </div>
                <span className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Active
                </span>
              </div>

              <div className="pt-3 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-[#0B192C]">Encrypted storage</p>
                  <p className="text-slate-500 text-[11px]">Uploaded statements & logos are stored in private buckets</p>
                </div>
                <span className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Enabled
                </span>
              </div>

            </div>
          </div>

          {/* 4. Reset & purge Card (Exact Red Button matching Video Frame 02:04) */}
          <div className="bg-white border border-[#E8E2D8] rounded-2xl p-6 sm:p-8 shadow-[0_2px_12px_rgba(11,25,44,0.03)] space-y-4">
            <div>
              <h3 className="text-sm font-bold text-[#0B192C]">Reset & purge</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                One click wipes every company profile, analysis and uploaded file. Your chat history, downloaded reports and login will be preserved.
              </p>
            </div>

            <div>
              {resetConfirm ? (
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      onResetWorkspace();
                      setResetConfirm(false);
                    }}
                    className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    Confirm: Wipe Workspace
                  </button>
                  <button
                    type="button"
                    onClick={() => setResetConfirm(false)}
                    className="px-3 py-2 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setResetConfirm(true)}
                  className="px-4 py-2.5 bg-[#BE123C] hover:bg-[#9F1239] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
                  id="reset-app-btn"
                >
                  Reset app to zero
                </button>
              )}
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: Team & Access Management (Multi-tenant SaaS) */}
      {activeTab === 'team' && (
        <div className="bg-white border border-[#E8E2D8] rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-[#E8E2D8] pb-4">
            <div>
              <h3 className="text-base font-bold text-[#0B192C]">Organization Members</h3>
              <p className="text-xs text-slate-500">Manage multi-tenant roles: Owner, Admin, Analyst, and Viewer.</p>
            </div>
            <button
              type="button"
              onClick={() => setInviteModalOpen(true)}
              className="px-3.5 py-2 bg-[#0B192C] hover:bg-[#162A45] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <UserPlus className="w-3.5 h-3.5 text-[#D4A347]" />
              <span>Invite Member</span>
            </button>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {teamMembers.map(member => (
              <div key={member.id} className="py-3.5 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-[#0B192C] font-mono">{member.email}</p>
                  <p className="text-[11px] text-slate-500">Joined: {member.joinedAt}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                    member.role === 'owner' ? 'bg-amber-100 text-amber-800' :
                    member.role === 'admin' ? 'bg-blue-100 text-blue-800' :
                    member.role === 'analyst' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {member.role}
                  </span>
                  {member.role !== 'owner' && (
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(member.id)}
                      className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Revoke access"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Subscription & Billing */}
      {activeTab === 'billing' && (
        <div className="bg-white border border-[#E8E2D8] rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-[#E8E2D8] pb-4">
            <h3 className="text-base font-bold text-[#0B192C]">Subscription & Entitlements</h3>
            <p className="text-xs text-slate-500">Current commercial plan status and usage allowances.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-[#FAF7F2] rounded-xl border border-[#E8E2D8] space-y-1">
              <span className="text-[10px] font-mono font-bold uppercase text-slate-500">Active Plan</span>
              <p className="text-lg font-bold text-[#0B192C]">Professional Tier</p>
              <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                <Check className="w-3 h-3" /> Active
              </span>
            </div>

            <div className="p-4 bg-[#FAF7F2] rounded-xl border border-[#E8E2D8] space-y-1">
              <span className="text-[10px] font-mono font-bold uppercase text-slate-500">Company Profiles</span>
              <p className="text-lg font-bold text-[#0B192C]">1 / 10</p>
              <span className="text-[11px] text-slate-500">9 available</span>
            </div>

            <div className="p-4 bg-[#FAF7F2] rounded-xl border border-[#E8E2D8] space-y-1">
              <span className="text-[10px] font-mono font-bold uppercase text-slate-500">AI Analyses / Month</span>
              <p className="text-lg font-bold text-[#0B192C]">Unlimited</p>
              <span className="text-[11px] text-slate-500">Senior consultant model</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Global Languages, Regional Number Formatting & Terminology Glossary */}
      {activeTab === 'localization' && (
        <div className="space-y-6">

          {/* Statutory Translation Notice */}
          <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex items-start gap-3 text-amber-950 shadow-xs">
            <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <span className="font-bold font-mono uppercase tracking-wider text-amber-900 block">
                {t('common.certifiedTranslationDisclaimer', 'Translations are provided for operational and management decision support and are NOT certified by a sworn translator or statutory auditor. Financial terms can be reviewed and customized in the Terminology Glossary.')}
              </span>
              <p className="leading-relaxed text-amber-800">
                FinScope preserves exact accounting figures, account codes, and company identities without alteration. You can customize the translation of standard accounting titles below to comply with local corporate reporting requirements.
              </p>
            </div>
          </div>

          {/* Card 1: Interface & Reporting Languages */}
          <div className="bg-white p-6 sm:p-7 rounded-2xl border border-[#E8E2D8] shadow-xs space-y-6">
            <div className="border-b border-[#E8E2D8] pb-4 flex items-center justify-between">
              <div>
                <h3 className="font-serif-display text-lg font-bold text-[#0B192C]">
                  {t('settings.interfaceLanguage', 'Interface Language')}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {t('settings.interfaceLanguageDesc', 'The language used for menus, buttons, and navigation across your workspace.')}
                </p>
              </div>
              <Languages className="w-5 h-5 text-[#D6AE55]" />
            </div>

            {/* Language Selection Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {SUPPORTED_LANGUAGES.map(lang => {
                const isSelected = lang.code === currentLang;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => setInterfaceLanguage(lang.code)}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-[#0B1530] text-white border-[#0B1530] shadow-xs'
                        : 'bg-[#FAF7F2] hover:bg-white text-[#0B192C] border-[#E8E2D8]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl leading-none">{lang.flag}</span>
                      <div>
                        <span className="font-bold text-xs block leading-tight">{lang.nativeName}</span>
                        <span className={`text-[10px] font-mono ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                          {lang.name} {lang.isRTL ? '(RTL)' : ''}
                        </span>
                      </div>
                    </div>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-[#D6AE55] shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Organization Default Reporting Language */}
            <div className="pt-4 border-t border-[#E8E2D8] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-xs font-bold text-[#0B192C]">
                  {t('settings.reportingLanguage', 'Default Organization Reporting Language')}
                </h4>
                <p className="text-[11px] text-slate-500">
                  {t('settings.reportingLanguageDesc', 'The default language used when generating boardroom PDF reports and executive memos.')}
                </p>
              </div>

              <select
                value={orgLang}
                onChange={(e) => {
                  const val = e.target.value as SupportedLanguageCode;
                  setOrgLang(val);
                  setOrgReportingLanguage(val);
                }}
                className="px-3 py-2 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-xs font-semibold text-[#0B192C] cursor-pointer"
              >
                {SUPPORTED_LANGUAGES.map(l => (
                  <option key={l.code} value={l.code}>
                    {l.flag} {l.name} ({l.nativeName})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Card 2: Number Formatting Style (Independent of Language) */}
          <div className="bg-white p-6 sm:p-7 rounded-2xl border border-[#E8E2D8] shadow-xs space-y-4">
            <div className="border-b border-[#E8E2D8] pb-4">
              <h3 className="font-serif-display text-lg font-bold text-[#0B192C]">
                {t('settings.numberFormat', 'Number Formatting Style')}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {t('settings.numberFormatDesc', 'Choose thousands and decimal separators for monetary amounts and ratios.')}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {NUMBER_FORMAT_OPTIONS.map(opt => {
                const isSelected = opt.id === numberFormat;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setNumberFormat(opt.id);
                      setNumberFormatPreference(opt.id);
                    }}
                    className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-[#0B1530] text-white border-[#0B1530] shadow-xs'
                        : 'bg-[#FAF7F2] hover:bg-white text-[#0B192C] border-[#E8E2D8]'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-bold block">{opt.label}</span>
                      <span className={`text-xs font-mono font-bold mt-1 block ${isSelected ? 'text-[#D6AE55]' : 'text-slate-600'}`}>
                        Sample: ${opt.example}
                      </span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-[#D6AE55]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Card 3: Financial Terminology Review & Jurisdiction Customization */}
          <div className="bg-white p-6 sm:p-7 rounded-2xl border border-[#E8E2D8] shadow-xs space-y-4">
            <div className="border-b border-[#E8E2D8] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-serif-display text-lg font-bold text-[#0B192C]">
                  {t('settings.terminologyReviewTitle', 'Financial Terminology Review & Jurisdiction Customization')}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {t('settings.terminologyReviewDesc', 'Review standard translations for statutory accounts and customize them for your company or local GAAP requirements.')}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    resetGlossaryOverrides();
                    setGlossaryEdits({});
                    setGlossarySaveSuccess(true);
                    setTimeout(() => setGlossarySaveSuccess(false), 2000);
                  }}
                  className="px-3 py-1.5 bg-[#FAF7F2] hover:bg-slate-100 text-slate-600 text-xs font-semibold rounded-lg border border-[#E8E2D8] cursor-pointer"
                >
                  {t('settings.resetTerminology', 'Reset to System Defaults')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    Object.entries(glossaryEdits).forEach(([termKey, customVal]) => {
                      saveGlossaryOverride(termKey, currentLang, String(customVal || ''));
                    });
                    setGlossarySaveSuccess(true);
                    setTimeout(() => setGlossarySaveSuccess(false), 2500);
                  }}
                  className="px-4 py-1.5 bg-[#0B1530] hover:bg-[#162A45] text-white text-xs font-bold rounded-lg cursor-pointer shadow-xs"
                >
                  {t('settings.saveTerminology', 'Save Customizations')}
                </button>
              </div>
            </div>

            {glossarySaveSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Financial terminology customizations saved successfully for {currentLang.toUpperCase()}.</span>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[#E8E2D8] text-slate-400 font-mono text-[10px] uppercase">
                    <th className="py-2.5 text-left">{t('settings.termKey', 'Standard Accounting Concept')}</th>
                    <th className="py-2.5 text-left">{t('settings.defaultTranslation', 'Default Translation')}</th>
                    <th className="py-2.5 text-left">{t('settings.customTranslation', 'Company / Jurisdiction Customization')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E2D8]">
                  {STANDARD_FINANCIAL_GLOSSARY.map(term => {
                    const defaultTrans = term.defaultTranslations[currentLang] || term.english;
                    const customVal = glossaryEdits[term.key] || '';

                    return (
                      <tr key={term.key} className="hover:bg-[#FAF7F2]/50">
                        <td className="py-2.5 font-medium text-[#0B192C]">
                          <div>{term.english}</div>
                          <span className="text-[10px] font-mono text-slate-400">{term.category}</span>
                        </td>
                        <td className="py-2.5 text-slate-600 font-medium">
                          {defaultTrans}
                        </td>
                        <td className="py-2.5">
                          <input
                            type="text"
                            placeholder={defaultTrans}
                            value={customVal}
                            onChange={(e) => {
                              setGlossaryEdits({
                                ...glossaryEdits,
                                [term.key]: e.target.value
                              });
                            }}
                            className="w-full max-w-sm px-2.5 py-1.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-lg text-xs font-medium text-[#0B192C] focus:bg-white focus:outline-hidden focus:border-[#D6AE55]"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          </div>

        </div>
      )}

      {/* Invite Member Modal */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl border border-[#E8E2D8]">
            <h3 className="font-bold text-base text-[#0B192C]">Invite Team Member</h3>
            <form onSubmit={handleInvite} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Email Address</label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="analyst@company.com"
                  className="w-full px-3 py-2 border rounded-xl text-xs focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Permission Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 border rounded-xl text-xs focus:outline-none"
                >
                  <option value="analyst">Analyst (Upload & Generate Reports)</option>
                  <option value="admin">Administrator (Manage Team & Settings)</option>
                  <option value="viewer">Viewer (Read-Only Access)</option>
                </select>
              </div>

              {inviteSuccess && (
                <p className="text-xs text-emerald-700 font-semibold">Invitation sent!</p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setInviteModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-[#0B192C] hover:bg-[#162A45] text-white rounded-lg cursor-pointer shadow-xs"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
