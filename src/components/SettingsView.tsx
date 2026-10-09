/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Cloud, ShieldCheck, Trash2, Check, RefreshCw, Key, Users, 
  CreditCard, Building2, UserPlus, AlertCircle, LogOut
} from 'lucide-react';
import { UserProfile, OrganisationMember, UserRole } from '../types';

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
  const [activeTab, setActiveTab] = useState<'admin' | 'team' | 'billing'>('admin');
  const [resetConfirm, setResetConfirm] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('analyst');
  const [inviteSuccess, setInviteSuccess] = useState(false);

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
