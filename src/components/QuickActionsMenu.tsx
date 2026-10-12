/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Zap, Upload, FileSpreadsheet, Target, CheckCircle2, 
  TrendingUp, FileText, ChevronDown, Sparkles, X 
} from 'lucide-react';

export type QuickActionType = 
  | 'upload_statements'
  | 'upload_management_accounts'
  | 'upload_budget'
  | 'upload_actuals'
  | 'start_health_review'
  | 'generate_variance_report'
  | 'open_previous_report';

interface QuickActionsMenuProps {
  onAction: (action: QuickActionType) => void;
  hasDataUploaded: boolean;
  totalSavedReports: number;
}

export default function QuickActionsMenu({
  onAction,
  hasDataUploaded,
  totalSavedReports
}: QuickActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const actionItems: {
    id: QuickActionType;
    label: string;
    description: string;
    icon: React.ElementType;
    badge?: string;
  }[] = [
    {
      id: 'upload_statements',
      label: 'Upload Financial Statements',
      description: 'Ingest Balance Sheet, P&L, and Cash Flow (CSV, XLSX, PDF)',
      icon: Upload
    },
    {
      id: 'upload_management_accounts',
      label: 'Upload Management Accounts',
      description: 'Monthly or quarterly departmental performance statements',
      icon: FileSpreadsheet
    },
    {
      id: 'upload_budget',
      label: 'Upload Budget',
      description: 'Set category-level targets and operating expense plans',
      icon: Target
    },
    {
      id: 'upload_actuals',
      label: 'Upload Actual Results',
      description: 'Import latest actuals ledger to update variances',
      icon: FileSpreadsheet
    },
    {
      id: 'start_health_review',
      label: 'Start Financial Health Review',
      description: 'Examine executive KPIs, solvency, and DuPont levers',
      icon: CheckCircle2,
      badge: hasDataUploaded ? 'Ready' : undefined
    },
    {
      id: 'generate_variance_report',
      label: 'Generate Variance Report',
      description: 'Audit budget vs actual movements and emerging risks',
      icon: TrendingUp,
      badge: hasDataUploaded ? 'Ready' : undefined
    },
    {
      id: 'open_previous_report',
      label: 'Open Previous Report',
      description: 'Retrieve saved analyses from the report library',
      icon: FileText,
      badge: `${totalSavedReports}`
    }
  ];

  return (
    <div className="relative inline-block text-left" ref={menuRef} id="quick-action-menu-root">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="px-3.5 py-2 bg-[#0B1530] hover:bg-[#162A45] text-white text-xs font-semibold rounded-xl border border-[#162A45] shadow-xs transition-all flex items-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#D6AE55]"
        id="quick-actions-trigger"
        aria-expanded={isOpen}
      >
        <Zap className="w-3.5 h-3.5 text-[#D6AE55]" />
        <span>Quick Actions</span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-300 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-[#E8E2D8] rounded-2xl shadow-xl z-50 p-2 text-left animate-fade-in">
          <div className="px-3 py-2 border-b border-[#E8E2D8] flex items-center justify-between">
            <div>
              <p className="text-[10px] font-mono uppercase font-bold tracking-wider text-[#D4A347]">
                CFO SHORTCUTS
              </p>
              <h4 className="text-xs font-bold text-[#0B192C]">Quick Action Menu</h4>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="py-1 divide-y divide-[#F0EBE1] max-h-96 overflow-y-auto">
            {actionItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onAction(item.id);
                    setIsOpen(false);
                  }}
                  className="w-full px-3 py-2.5 text-left hover:bg-[#FAF7F2] rounded-xl transition-colors flex items-start gap-3 cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#FAF7F2] group-hover:bg-[#0B1530] text-[#0B1530] group-hover:text-[#D6AE55] border border-[#E8E2D8] flex items-center justify-center shrink-0 transition-colors mt-0.5">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-[#0B192C] group-hover:text-[#0B1530]">
                        {item.label}
                      </span>
                      {item.badge && (
                        <span className="text-[10px] font-mono font-bold text-[#0B1530] bg-[#FAF7F2] border border-[#E8E2D8] px-1.5 py-0.2 rounded shrink-0">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug mt-0.5 truncate">
                      {item.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
