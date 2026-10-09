/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { Check, UploadCloud, Building2, Plus, Globe, DollarSign } from 'lucide-react';
import { UserProfile } from '../types';
import { SUPPORTED_CURRENCIES, SUPPORTED_COUNTRIES } from '../data';

interface CompanyProfileViewProps {
  profile: UserProfile;
  setProfile: (p: UserProfile) => void;
  companies?: UserProfile[];
  onSelectCompany?: (p: UserProfile) => void;
  onAddCompany?: (name: string) => void;
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
    companyName: profile.companyName || 'M/J Agro',
    registrationNumber: profile.registrationNumber || '',
    industry: profile.industry || 'Agriculture',
    location: profile.location || 'Ghana',
    currency: profile.currency || 'GHS (GH₵)',
    financialYearEnd: profile.financialYearEnd || 'December 31',
    reportingBasis: profile.reportingBasis || 'IFRS',
    description: profile.description || 'Agricultural inputs, agro-fertilisers, seed distribution and farm supplies.',
    contactEmail: profile.contactEmail || '',
    logoUrl: profile.logoUrl || null,
    logoText: profile.logoText || (profile.companyName ? profile.companyName.substring(0, 1).toUpperCase() : 'M')
  });

  const [fileName, setFileName] = useState<string>('No file chosen');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showNewCompanyModal, setShowNewCompanyModal] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
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
      companyName: formData.companyName.trim() || 'M/J Agro',
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

  return (
    <div className="w-full max-w-4xl py-2 text-left" id="company-profile-page">
      {/* Spaced Eyebrow matching Video Frame 01:03 */}
      <div className="mb-2">
        <span className="text-[11px] font-mono font-bold tracking-[0.25em] text-[#D4A347] uppercase">
          COMPANY PROFILE
        </span>
      </div>

      {/* Main Serif Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h1 className="font-serif-display text-4xl sm:text-5xl font-bold text-[#0B192C] tracking-tight">
          Your business
        </h1>

        {companies.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-mono">Switch Company:</span>
            <select
              value={profile.companyName}
              onChange={(e) => {
                const selected = companies.find(c => c.companyName === e.target.value);
                if (selected && onSelectCompany) {
                  onSelectCompany(selected);
                  setFormData(prev => ({
                    ...prev,
                    companyName: selected.companyName,
                    industry: selected.industry,
                    location: selected.location,
                    currency: selected.currency,
                    logoText: selected.companyName.substring(0, 1).toUpperCase()
                  }));
                }
              }}
              className="px-3 py-1.5 bg-white border border-[#E8E2D8] rounded-xl text-xs font-semibold text-[#0B192C] shadow-xs"
            >
              {companies.map(c => (
                <option key={c.companyName} value={c.companyName}>
                  {c.companyName} ({c.location})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Main White Card matching Video Frame 01:03 */}
      <div className="bg-white border border-[#E8E2D8] rounded-2xl p-8 sm:p-10 max-w-2xl shadow-[0_2px_12px_rgba(11,25,44,0.03)] space-y-6">
        
        <div>
          <h2 className="text-base font-bold text-[#0B192C]">Details</h2>
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

          {/* Company Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-600">Company name</label>
            <input
              type="text"
              value={formData.companyName}
              onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
              placeholder="e.g. M/J Agro"
              className="w-full px-3.5 py-2.5 bg-white border border-[#D5CDC0] rounded-xl text-xs text-[#0B192C] font-semibold focus:outline-none focus:border-[#0B192C] focus:ring-1 focus:ring-[#0B192C] transition-all"
            />
          </div>

          {/* Industry & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-600">Industry</label>
              <select
                value={formData.industry}
                onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-white border border-[#D5CDC0] rounded-xl text-xs text-[#0B192C] font-medium focus:outline-none focus:border-[#0B192C] focus:ring-1 focus:ring-[#0B192C] transition-all"
              >
                {INDUSTRIES.map(ind => (
                  <option key={ind} value={ind}>{ind}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-600">Location</label>
              <select
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-white border border-[#D5CDC0] rounded-xl text-xs text-[#0B192C] font-medium focus:outline-none focus:border-[#0B192C] focus:ring-1 focus:ring-[#0B192C] transition-all"
              >
                {SUPPORTED_COUNTRIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Currency */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-600">Currency</label>
            <select
              value={formData.currency}
              onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
              className="w-full px-3.5 py-2.5 bg-white border border-[#D5CDC0] rounded-xl text-xs text-[#0B192C] font-medium focus:outline-none focus:border-[#0B192C] focus:ring-1 focus:ring-[#0B192C] transition-all"
            >
              {SUPPORTED_CURRENCIES.map(cur => (
                <option key={cur.code} value={cur.code}>
                  {cur.code} – {cur.name}
                </option>
              ))}
            </select>
          </div>

          {/* Save Button (Matches Video Navy Button) */}
          <div className="flex items-center gap-3 pt-2">
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

        </form>
      </div>

    </div>
  );
}
