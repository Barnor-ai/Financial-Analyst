/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  FileText, Plus, ChevronRight, CheckCircle2, ShieldAlert, 
  Trash2, Copy, Download, Search, AlertCircle
} from 'lucide-react';
import { SavedAnalysisRecord } from '../types';

interface ReportsViewProps {
  reports: SavedAnalysisRecord[];
  onOpenReport: (report: SavedAnalysisRecord) => void;
  onNewAnalysis: () => void;
  onDeleteReport?: (id: string) => void;
}

export default function ReportsView({
  reports,
  onOpenReport,
  onNewAnalysis,
  onDeleteReport
}: ReportsViewProps) {
  const [filter, setFilter] = useState<'all' | 'completed' | 'draft'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [reportToDelete, setReportToDelete] = useState<SavedAnalysisRecord | null>(null);

  const filtered = reports.filter(r => {
    const matchesFilter = filter === 'all' || r.status === filter;
    const matchesSearch = !searchQuery || 
      r.reportTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.companyName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-8 animate-fade-in text-left pb-12" id="reports-archive-view">
      
      {/* Top Header matching exact screenshot (Video Frame 01:54) */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E8E2D8] pb-6">
        <div>
          <div className="mb-2">
            <span className="text-[11px] font-mono font-bold tracking-[0.25em] text-[#D4A347] uppercase">
              REPORTS
            </span>
          </div>
          <h1 className="font-serif-display text-4xl sm:text-5xl font-bold text-[#0B192C] tracking-tight">
            All analyses
          </h1>
        </div>

        {/* Filter controls and + New button */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 p-1 bg-white border border-[#E8E2D8] rounded-xl shadow-xs">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                filter === 'all' ? 'bg-[#0B192C] text-white' : 'text-slate-600 hover:text-[#0B192C]'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setFilter('completed')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                filter === 'completed' ? 'bg-[#0B192C] text-white' : 'text-slate-600 hover:text-[#0B192C]'
              }`}
            >
              Completed
            </button>
          </div>

          <button
            type="button"
            onClick={onNewAnalysis}
            className="px-4 py-2 bg-[#D6AE55] hover:bg-[#C59B42] text-[#0B192C] font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New</span>
          </button>
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white border border-[#E8E2D8] rounded-2xl p-12 text-center max-w-md mx-auto shadow-xs space-y-3">
            <FileText className="w-8 h-8 text-[#D4A347] mx-auto" />
            <h3 className="font-serif-display text-lg font-bold text-[#0B192C]">No analyses found</h3>
            <p className="text-xs text-slate-500">Create a new financial statement analysis to begin.</p>
            <button
              type="button"
              onClick={onNewAnalysis}
              className="px-4 py-2 bg-[#0B192C] text-white text-xs font-semibold rounded-lg hover:bg-[#162A45] cursor-pointer"
            >
              Start New Analysis
            </button>
          </div>
        ) : (
          filtered.map(report => (
            <div
              key={report.id}
              className="bg-white border border-[#E8E2D8] rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
            >
              <div 
                className="flex-1 cursor-pointer"
                onClick={() => onOpenReport(report)}
              >
                <div className="flex items-center gap-3">
                  <h3 className="text-base font-bold text-[#0B192C] group-hover:text-[#D4A347] transition-colors">
                    {report.reportTitle}
                  </h3>
                  {report.companyName && (
                    <span className="text-xs font-mono text-slate-500">
                      · {report.companyName}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 font-mono mt-1">
                  {report.periodLabel} · {new Date(report.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {report.status}
                </span>

                <span className="px-2.5 py-1 text-[11px] font-semibold font-mono rounded-lg bg-slate-100 text-slate-700">
                  {report.riskScoreText || `Risk ${report.riskScore.toFixed(0)}/10`}
                </span>

                {onDeleteReport && (
                  <button
                    type="button"
                    onClick={() => setReportToDelete(report)}
                    className="p-2 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer rounded-lg hover:bg-rose-50"
                    title="Delete Report"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => onOpenReport(report)}
                  className="p-2 text-slate-400 group-hover:text-[#0B192C] transition-colors cursor-pointer"
                  title="Open Report"
                >
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {reportToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl border border-[#E8E2D8]">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertCircle className="w-5 h-5" />
              <h3 className="font-bold text-base text-[#0B192C]">Delete Analysis?</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to permanently delete <b>{reportToDelete.reportTitle}</b>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReportToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteReport) onDeleteReport(reportToDelete.id);
                  setReportToDelete(null);
                }}
                className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg cursor-pointer shadow-xs"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
