/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, UploadCloud, Building2, Plus, Globe, DollarSign, ArrowRight, X, Languages } from 'lucide-react';
import { UserProfile, BusinessEntity } from '../types';
import { SUPPORTED_CURRENCIES, SUPPORTED_COUNTRIES } from '../data';
import LanguageSelector from './LanguageSelector';

interface CompanyProfileViewProps {
  profile: UserProfile;
  setProfile: (p: UserProfile) => void;
  companies?: UserProfile[];
  onSelectCompany?: (p: UserProfile) => void;
  onAddCompany?: (newComp: UserProfile) => void;
  onSaved?: () => void;
  onNavigateToAnalysis?: () => void;
}

const INDUSTRIES = [
  'Agriculture',
  'SaaS / Technology',
  'Software as a Service (SaaS)',
  'Retail & Consumer Goods',
  'Professional Services Consulting',
  'Manufacturing & Industrial',
  'Healthcare & Pharmaceuticals',
  'Real Estate & Construction',
  'Financial Services & Fintech',
  'Hospitality & Tourism',
  'Energy & Utilities',
  'Other / General Enterprise'
];

export default function CompanyProfileView({ 
  profile, 
  setProfile, 
  companies = [],
  onSelectCompany,
  onAddCompany,
  onSaved, 
  onNavigateToAnalysis 
}: CompanyProfileViewProps) {
  const [formData, setFormData] = useState({
    companyName: profile.companyName || 'Meridian Global Enterprises',
    entityCode: profile.entityCode || 'MGE-CORP-01',
    registrationNumber: profile.registrationNumber || 'CORP-84729103-US',
    industry: profile.industry || 'Enterprise SaaS / Technology',
    location: profile.location || 'United States',
    currency: profile.currency || 'USD ($)',
    financialYearEnd: profile.financialYearEnd || 'December 31',
    reportingBasis: profile.reportingBasis || 'US GAAP',
    description: profile.description || 'Enterprise software platforms and cloud services.',
    contactEmail: profile.contactEmail || '',
    logoUrl: profile.logoUrl || null,
    logoText: profile.logoText || (profile.companyName ? profile.companyName.substring(0, 1).toUpperCase() : 'M')
  });

  const [fileName, setFileName] = useState<string>('No file chosen');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showNewEntityModal, setShowNewEntityModal] = useState(false);
  const [newEntityData, setNewEntityData] = useState({
    name: '',
    code: '',
    industry: 'SaaS / Technology',
    location: 'United States',
    currency: 'USD ($)',
    reportingBasis: 'US GAAP' as const
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const base64Url = event.target.result as string;
          setFormData(prev => ({
            ...prev,
            logoUrl: base64Url,
            logoText: file.name.substring(0, 1).toUpperCase()
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveChanges = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: UserProfile = {
      ...profile,
      companyName: formData.companyName.trim() || 'Meridian Global Enterprises',
      entityCode: formData.entityCode,
      registrationNumber: formData.registrationNumber,
      industry: formData.industry,
      location: formData.location,
      currency: formData.currency,
      financialYearEnd: formData.financialYearEnd,
      reportingBasis: formData.reportingBasis as any,
      description: formData.description,
      contactEmail: formData.contactEmail,
      logoUrl: formData.logoUrl || undefined,
      logoText: formData.companyName ? formData.companyName.trim().substring(0, 1).toUpperCase() : 'M'
    };
    setProfile(updated);
    setSavedSuccess(true);
    if (onSaved) onSaved();
    setTimeout(() => {
      setSavedSuccess(false);
    }, 3000);
  };

  const handleCreateNewEntity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEntityData.name.trim()) return;

    const newProfile: UserProfile = {
      companyName: newEntityData.name.trim(),
      entityCode: newEntityData.code.trim() || newEntityData.name.substring(0, 3).toUpperCase(),
      industry: newEntityData.industry,
      location: newEntityData.location,
      currency: newEntityData.currency,
      reportingBasis: newEntityData.reportingBasis,
      financialYearEnd: 'December 31',
      logoText: newEntityData.name.substring(0, 1).toUpperCase()
    };

    if (onAddCompany) {
      onAddCompany(newProfile);
    }
    setProfile(newProfile);
    setFormData({
      companyName: newProfile.companyName,
      entityCode: newProfile.entityCode || '',
      registrationNumber: '',
      industry: newProfile.industry,
      location: newProfile.location,
      currency: newProfile.currency,
      financialYearEnd: 'December 31',
      reportingBasis: newProfile.reportingBasis || 'IFRS',
      description: '',
      contactEmail: '',
      logoUrl: null,
      logoText: newProfile.logoText || 'E'
    });

    setShowNewEntityModal(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="w-full max-w-4xl py-2 text-left" id="company-profile-page">
      {/* Spaced Eyebrow */}
      <div className="mb-2">
        <span className="text-[11px] font-mono font-bold tracking-[0.25em] text-[#D4A347] uppercase">
          ORGANISATION & ENTITY ARCHITECTURE
        </span>
      </div>

      {/* Main Title Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif-display text-4xl sm:text-5xl font-bold text-[#0B192C] tracking-tight">
            Your business
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Configure entity legal details, accounting standards, reporting currency, and operating scope.
          </p>
        </div>

        {/* Entity Switcher & + Add Entity */}
        <div className="flex items-center gap-2">
          {companies.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-mono">Entity:</span>
              <select
                value={profile.companyName}
                onChange={(e) => {
                  const selected = companies.find(c => c.companyName === e.target.value);
                  if (selected && onSelectCompany) {
                    onSelectCompany(selected);
                    setFormData(prev => ({
                      ...prev,
                      companyName: selected.companyName,
                      entityCode: selected.entityCode || '',
                      registrationNumber: selected.registrationNumber || '',
                      industry: selected.industry,
                      location: selected.location,
                      currency: selected.currency,
                      reportingBasis: selected.reportingBasis || 'IFRS',
                      logoText: selected.companyName.substring(0, 1).toUpperCase()
                    }));
                  }
                }}
                className="px-3 py-1.5 bg-white border border-[#E8E2D8] rounded-xl text-xs font-semibold text-[#0B192C] shadow-xs cursor-pointer"
              >
                {companies.map(c => (
                  <option key={c.companyName} value={c.companyName}>
                    {c.companyName} ({c.location})
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowNewEntityModal(true)}
            className="px-3 py-1.5 bg-[#FAF7F2] hover:bg-[#EDE7DA] border border-[#E8E2D8] text-[#0B192C] text-xs font-bold rounded-xl shadow-xs flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-[#D6AE55]" />
            <span>Add Entity</span>
          </button>
        </div>
      </div>

      {/* Main Details Card */}
      <div className="bg-white border border-[#E8E2D8] rounded-2xl p-8 sm:p-10 max-w-2xl shadow-xs space-y-6">
        
        <div className="flex items-center justify-between border-b border-[#E8E2D8] pb-4">
          <div>
            <h2 className="text-base font-bold text-[#0B192C]">Entity Profile & Reporting Standard</h2>
            <p className="text-xs text-slate-500 mt-0.5">Parameters applied to ratio diagnostics and statement reconciliation.</p>
          </div>
          <span className="text-xs font-mono font-bold text-[#D6AE55] bg-[#FAF7F2] px-2.5 py-1 rounded-lg border border-[#E8E2D8]">
            {formData.reportingBasis || 'IFRS'}
          </span>
        </div>

        <form onSubmit={handleSaveChanges} className="space-y-6">
          
          {/* Logo Upload Box */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-600">Company logo</label>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl border border-[#E8E2D8] bg-[#FAF7F2] flex items-center justify-center text-slate-500 font-serif font-black text-xl shrink-0 overflow-hidden shadow-xs">
                {formData.logoUrl ? (
                  <img src={formData.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <span>{formData.logoText || 'M'}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/png, image/jpeg, image/svg+xml"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-[#0B192C] text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Choose file
                </button>
                <span className="text-xs text-slate-500 truncate max-w-[200px]">
                  {fileName}
                </span>
              </div>
            </div>
          </div>

          {/* Company Name & Entity Code */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="block text-xs font-medium text-slate-600">Entity legal name</label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                placeholder="e.g. Acme Corporation"
                className="w-full px-3.5 py-2.5 bg-white border border-[#D5CDC0] rounded-xl text-xs text-[#0B192C] font-semibold focus:outline-none focus:border-[#0B192C] focus:ring-1 focus:ring-[#0B192C] transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-600">Entity code</label>
              <input
                type="text"
                value={formData.entityCode}
                onChange={(e) => setFormData(prev => ({ ...prev, entityCode: e.target.value }))}
                placeholder="e.g. ACME-HQ-01"
                className="w-full px-3.5 py-2.5 bg-white border border-[#D5CDC0] rounded-xl text-xs font-mono text-[#0B192C] uppercase focus:outline-none focus:border-[#0B192C] transition-all"
              />
            </div>
          </div>

          {/* Industry & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-600">Industry sector</label>
              <select
                value={formData.industry}
                onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-white border border-[#D5CDC0] rounded-xl text-xs text-[#0B192C] font-medium focus:outline-none focus:border-[#0B192C] focus:ring-1 focus:ring-[#0B192C] transition-all cursor-pointer"
              >
                {INDUSTRIES.map(ind => (
                  <option key={ind} value={ind}>{ind}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-600">Operating jurisdiction</label>
              <select
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-white border border-[#D5CDC0] rounded-xl text-xs text-[#0B192C] font-medium focus:outline-none focus:border-[#0B192C] focus:ring-1 focus:ring-[#0B192C] transition-all cursor-pointer"
              >
                {SUPPORTED_COUNTRIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Currency & Reporting Basis */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-600">Reporting currency</label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-white border border-[#D5CDC0] rounded-xl text-xs text-[#0B192C] font-medium focus:outline-none focus:border-[#0B192C] focus:ring-1 focus:ring-[#0B192C] transition-all cursor-pointer"
              >
                {SUPPORTED_CURRENCIES.map(cur => (
                  <option key={cur.code} value={cur.code}>
                    {cur.code} – {cur.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-600">Accounting framework</label>
              <select
                value={formData.reportingBasis}
                onChange={(e) => setFormData(prev => ({ ...prev, reportingBasis: e.target.value as any }))}
                className="w-full px-3.5 py-2.5 bg-white border border-[#D5CDC0] rounded-xl text-xs text-[#0B192C] font-medium focus:outline-none focus:border-[#0B192C] focus:ring-1 focus:ring-[#0B192C] transition-all cursor-pointer"
              >
                <option value="IFRS">IFRS (International Standards)</option>
                <option value="US GAAP">US GAAP</option>
                <option value="Accrual Basis">Accrual Basis Accounting</option>
                <option value="Cash Basis">Cash Basis Accounting</option>
              </select>
            </div>
          </div>

          {/* User Interface Language Preference */}
          <div className="p-4 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <label className="block text-xs font-bold text-[#0B192C]">
                User Interface Language
              </label>
              <p className="text-[11px] text-slate-500">
                Switch your preferred working language across the FinScope platform.
              </p>
            </div>
            <LanguageSelector variant="compact" />
          </div>

          {/* Registration Number & Financial Year End */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-600">Tax / Company registration no.</label>
              <input
                type="text"
                value={formData.registrationNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, registrationNumber: e.target.value }))}
                placeholder="e.g. CS-84729103-GH"
                className="w-full px-3.5 py-2.5 bg-white border border-[#D5CDC0] rounded-xl text-xs font-mono text-[#0B192C] focus:outline-none focus:border-[#0B192C] transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-600">Financial year end</label>
              <input
                type="text"
                value={formData.financialYearEnd}
                onChange={(e) => setFormData(prev => ({ ...prev, financialYearEnd: e.target.value }))}
                placeholder="December 31"
                className="w-full px-3.5 py-2.5 bg-white border border-[#D5CDC0] rounded-xl text-xs text-[#0B192C] focus:outline-none focus:border-[#0B192C] transition-all"
              />
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-[#E8E2D8]">
            <div className="flex items-center gap-3">
              <button
                type="submit"
                className="px-6 py-2.5 bg-[#0B192C] hover:bg-[#162A45] active:bg-[#07111E] text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Save changes
              </button>

              {savedSuccess && (
                <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1.5 animate-fade-in">
                  <Check className="w-4 h-4" /> Changes saved to workspace
                </span>
              )}
            </div>

            {onNavigateToAnalysis && (
              <button
                type="button"
                onClick={onNavigateToAnalysis}
                className="px-4 py-2 bg-[#D6AE55] hover:bg-[#C59B42] text-[#0B1530] font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <span>Ingest Financials</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

        </form>
      </div>

      {/* Modal: Add New Entity */}
      {showNewEntityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-[#E8E2D8]">
            <div className="flex items-center justify-between border-b border-[#E8E2D8] pb-3">
              <div>
                <h3 className="font-serif-display text-lg font-bold text-[#0B192C]">Add New Subsidiary / Entity</h3>
                <p className="text-xs text-slate-500">Configure multi-entity financial intelligence.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowNewEntityModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewEntity} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-medium text-slate-700">Entity legal name</label>
                <input
                  type="text"
                  required
                  value={newEntityData.name}
                  onChange={(e) => setNewEntityData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Apex Global Corp"
                  className="w-full px-3 py-2 border border-[#E8E2D8] rounded-xl focus:outline-none focus:border-[#0B192C]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-medium text-slate-700">Entity code</label>
                  <input
                    type="text"
                    value={newEntityData.code}
                    onChange={(e) => setNewEntityData(prev => ({ ...prev, code: e.target.value }))}
                    placeholder="e.g. APEX-01"
                    className="w-full px-3 py-2 font-mono uppercase border border-[#E8E2D8] rounded-xl focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-slate-700">Currency</label>
                  <select
                    value={newEntityData.currency}
                    onChange={(e) => setNewEntityData(prev => ({ ...prev, currency: e.target.value }))}
                    className="w-full px-3 py-2 border border-[#E8E2D8] rounded-xl bg-white"
                  >
                    {SUPPORTED_CURRENCIES.map(c => (
                      <option key={c.code} value={c.code}>{c.code}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-medium text-slate-700">Industry</label>
                  <select
                    value={newEntityData.industry}
                    onChange={(e) => setNewEntityData(prev => ({ ...prev, industry: e.target.value }))}
                    className="w-full px-3 py-2 border border-[#E8E2D8] rounded-xl bg-white"
                  >
                    {INDUSTRIES.map(i => (
                      <option key={i} value={i}>{i}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-slate-700">Framework</label>
                  <select
                    value={newEntityData.reportingBasis}
                    onChange={(e) => setNewEntityData(prev => ({ ...prev, reportingBasis: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-[#E8E2D8] rounded-xl bg-white"
                  >
                    <option value="IFRS">IFRS</option>
                    <option value="US GAAP">US GAAP</option>
                    <option value="Accrual Basis">Accrual Basis</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E8E2D8]">
                <button
                  type="button"
                  onClick={() => setShowNewEntityModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#D6AE55] hover:bg-[#C59B42] text-[#0B1530] font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  Create & Select Entity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
