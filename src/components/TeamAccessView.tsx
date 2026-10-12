/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Users, Shield, UserPlus, Mail, Lock, CheckCircle2, 
  Trash2, Building2, KeyRound, AlertCircle 
} from 'lucide-react';
import { UserProfile } from '../types';

interface TeamAccessViewProps {
  profile: UserProfile;
  currentUserEmail: string | null;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'CFO / Owner' | 'Finance Director' | 'Financial Analyst' | 'External Auditor';
  status: 'Active' | 'Invited';
  lastActive: string;
}

export default function TeamAccessView({
  profile,
  currentUserEmail
}: TeamAccessViewProps) {
  const [members, setMembers] = useState<TeamMember[]>([
    {
      id: 'usr-1',
      name: 'Executive Lead',
      email: currentUserEmail || 'cfo@finscope.ai',
      role: 'CFO / Owner',
      status: 'Active',
      lastActive: 'Just now'
    },
    {
      id: 'usr-2',
      name: 'Senior Controller',
      email: 'controller@meridian.com',
      role: 'Finance Director',
      status: 'Active',
      lastActive: '2 hours ago'
    },
    {
      id: 'usr-3',
      name: 'Advisory Partner',
      email: 'auditor@deloitte.com',
      role: 'External Auditor',
      status: 'Invited',
      lastActive: 'Pending accept'
    }
  ]);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<TeamMember['role']>('Financial Analyst');
  const [inviteSuccess, setInviteSuccess] = useState(false);

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    const newMember: TeamMember = {
      id: `usr-${Date.now()}`,
      name: inviteEmail.split('@')[0],
      email: inviteEmail.trim(),
      role: inviteRole,
      status: 'Invited',
      lastActive: 'Pending accept'
    };
    setMembers(prev => [...prev, newMember]);
    setInviteEmail('');
    setInviteSuccess(true);
    setTimeout(() => setInviteSuccess(false), 4000);
  };

  const handleRemoveMember = (id: string) => {
    setMembers(prev => prev.filter(m => m.id !== id));
  };

  return (
    <div className="space-y-8 text-left animate-fade-in" id="team-access-view-root">
      
      {/* Header Banner */}
      <div className="border-b border-[#E8E2D8] pb-5">
        <span className="text-[10px] font-mono font-bold tracking-[0.25em] text-[#D4A347] uppercase block mb-1">
          GOVERNANCE & PERMISSIONS
        </span>
        <h1 className="font-serif-display text-3xl sm:text-4xl font-bold text-[#0B192C]">
          Team & Access Control
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Manage workspace permissions, assign finance roles, and grant auditor access for <span className="font-bold text-[#0B192C]">{profile.companyName}</span>.
        </p>
      </div>

      {/* Invite Member Card */}
      <div className="bg-white border border-[#E8E2D8] rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <UserPlus className="w-4 h-4 text-[#D4A347]" />
          <h3 className="font-serif-display text-lg font-bold text-[#0B192C]">
            Invite Colleague or External Auditor
          </h3>
        </div>

        {inviteSuccess && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Invitation dispatched with secure link. Member added to team roster.</span>
          </div>
        )}

        <form onSubmit={handleSendInvite} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-1">
            <label className="block text-xs font-medium text-slate-600 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="colleague@company.com"
              className="w-full px-3.5 py-2.5 bg-white border border-[#D5CDC0] rounded-xl text-xs text-[#0B192C] focus:outline-none focus:border-[#0B192C] transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Access Role</label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as any)}
              className="w-full px-3.5 py-2.5 bg-white border border-[#D5CDC0] rounded-xl text-xs text-[#0B192C] focus:outline-none focus:border-[#0B192C] cursor-pointer"
            >
              <option value="CFO / Owner">CFO / Owner (Full admin & export)</option>
              <option value="Finance Director">Finance Director (Edit & model)</option>
              <option value="Financial Analyst">Financial Analyst (Upload & analyze)</option>
              <option value="External Auditor">External Auditor (Read-only verified reports)</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full px-4 py-2.5 bg-[#0B1530] hover:bg-[#162A45] text-white text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-xs flex items-center justify-center gap-2"
            >
              <Mail className="w-3.5 h-3.5 text-[#D6AE55]" />
              <span>Send Invitation</span>
            </button>
          </div>
        </form>
      </div>

      {/* Team Roster Table */}
      <div className="bg-white border border-[#E8E2D8] rounded-2xl overflow-hidden shadow-xs">
        <div className="px-6 py-4 bg-[#FAF7F2] border-b border-[#E8E2D8] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#0B1530]" />
            <h3 className="font-serif-display text-base font-bold text-[#0B192C]">
              Active Members & Invited Analysts ({members.length})
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-500 uppercase">
            Organisation: {profile.companyName}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-[#E8E2D8] bg-[#FAF7F2] text-slate-600 font-mono text-[11px]">
                <th className="py-3 px-6">User / Colleague</th>
                <th className="py-3 px-4">Role & Privileges</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Activity</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E2D8]">
              {members.map((member) => (
                <tr key={member.id} className="hover:bg-[#FAF7F2]/50 transition-colors">
                  <td className="py-3.5 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#0B1530] text-[#D6AE55] font-mono font-bold text-xs flex items-center justify-center shrink-0">
                        {member.name.substring(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-[#0B192C]">{member.name}</p>
                        <p className="text-[11px] text-slate-500 font-mono">{member.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-700">
                    <span className="inline-flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-[#D4A347]" />
                      <span>{member.role}</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                      member.status === 'Active' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {member.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                    {member.lastActive}
                  </td>
                  <td className="py-3.5 px-6 text-right">
                    {member.role !== 'CFO / Owner' && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(member.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                        title="Revoke access"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
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
