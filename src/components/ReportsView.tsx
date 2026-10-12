/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  FileText, Plus, ChevronRight, CheckCircle2, ShieldAlert, 
  Trash2, Download, Search, AlertCircle, FileSpreadsheet, Printer, 
  Building2, X, Filter, Star, Archive, RotateCcw, Copy, 
  Clock, GitCompare, History, Eye, ArrowUpDown, Bookmark,
  Layers, ChevronDown, ChevronUp, Share2, Tag, Globe, SlidersHorizontal,
  Info, Sparkles, Check, ExternalLink
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { SavedAnalysisRecord, ReportVersionItem, SavedSearchFilter, PeriodFinancialData } from '../types';
import { calculateFinancialRatios } from '../utils/financialEngine';

interface ReportsViewProps {
  reports: SavedAnalysisRecord[];
  onOpenReport: (report: SavedAnalysisRecord) => void;
  onNewAnalysis: () => void;
  onDeleteReport?: (id: string) => void;
  onDuplicateReport?: (report: SavedAnalysisRecord) => void;
  onToggleFavorite?: (id: string) => void;
  onToggleArchive?: (id: string) => void;
  activeEntityName?: string;
  userEmail?: string | null;
}

export default function ReportsView({
  reports,
  onOpenReport,
  onNewAnalysis,
  onDeleteReport,
  onDuplicateReport,
  onToggleFavorite,
  onToggleArchive,
  activeEntityName = 'Meridian Global Enterprises',
  userEmail
}: ReportsViewProps) {
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'favorites' | 'active' | 'archived'>('all');
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [languageFilter, setLanguageFilter] = useState<string>('all');
  const [orgScopeOnly, setOrgScopeOnly] = useState<boolean>(true);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title' | 'period' | 'risk_desc' | 'risk_asc'>('newest');

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  // Modal States
  const [previewReport, setPreviewReport] = useState<SavedAnalysisRecord | null>(null);
  const [versionReport, setVersionReport] = useState<SavedAnalysisRecord | null>(null);
  const [reportToDelete, setReportToDelete] = useState<SavedAnalysisRecord | null>(null);
  
  // Comparison State
  const [isCompareMode, setIsCompareMode] = useState<boolean>(false);
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [showComparisonModal, setShowComparisonModal] = useState<boolean>(false);

  // Saved Search Presets State
  const [savedPresets, setSavedPresets] = useState<SavedSearchFilter[]>([
    {
      id: 'preset-1',
      name: 'Board-Pack Reviews',
      query: 'board-pack',
      category: 'Financial Health Assessment',
      entity: 'all',
      status: 'completed',
      sortBy: 'newest'
    },
    {
      id: 'preset-2',
      name: 'Variance Alerts',
      query: 'variance',
      category: 'Budget vs Actual Analysis',
      entity: 'all',
      status: 'all',
      sortBy: 'risk_desc'
    },
    {
      id: 'preset-3',
      name: 'FY2025 Audits',
      query: '2025',
      category: 'all',
      entity: 'all',
      status: 'completed',
      sortBy: 'period'
    }
  ]);
  const [showSavePresetInput, setShowSavePresetInput] = useState<boolean>(false);
  const [newPresetName, setNewPresetName] = useState<string>('');

  // Extract distinct metadata for filter dropdowns
  const distinctEntities = useMemo(() => Array.from(new Set(reports.map(r => r.companyName).filter(Boolean))), [reports]);
  const distinctCategories = useMemo(() => Array.from(new Set(reports.map(r => r.reportCategory || r.analysisType).filter(Boolean))), [reports]);
  const distinctDepartments = useMemo(() => Array.from(new Set(reports.map(r => r.department).filter(Boolean))), [reports]);
  const distinctYears = useMemo(() => Array.from(new Set(reports.map(r => r.financialYear || r.periodLabel?.match(/\d{4}/)?.[0]).filter(Boolean))), [reports]);
  const distinctLanguages = useMemo(() => Array.from(new Set(reports.map(r => r.reportLanguage || 'English').filter(Boolean))), [reports]);

  // Recent reports (top 3 newest created/updated)
  const recentReports = useMemo(() => {
    return [...reports]
      .filter(r => !r.isArchived)
      .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
      .slice(0, 3);
  }, [reports]);

  // Filter and Sort Engine
  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      // Archive / Favorite tab check
      if (activeTab === 'favorites' && !r.isFavorite) return false;
      if (activeTab === 'archived' && !r.isArchived) return false;
      if (activeTab === 'active' && r.isArchived) return false;
      if (activeTab === 'all' && r.isArchived) return false; // In 'all' view, hide archived by default

      // Organisation-scoped filtering (multi-tenant boundary)
      if (orgScopeOnly && activeEntityName && r.companyName) {
        // If current entity scope is enforced, only show matches for active company or group
        if (r.companyName !== activeEntityName && r.companyName !== 'Meridian Global Enterprises') {
          // Allow if organisationId matches or standard corporate tenant
          if (r.organizationId && r.organizationId !== 'org-enterprise-holdings') return false;
        }
      }

      // Entity filter
      if (entityFilter !== 'all' && r.companyName !== entityFilter) return false;

      // Category filter
      if (categoryFilter !== 'all' && (r.reportCategory || r.analysisType) !== categoryFilter) return false;

      // Status filter
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;

      // Department filter
      if (departmentFilter !== 'all' && r.department !== departmentFilter) return false;

      // Year filter
      if (yearFilter !== 'all') {
        const year = r.financialYear || r.periodLabel?.match(/\d{4}/)?.[0];
        if (year !== yearFilter) return false;
      }

      // Language filter
      if (languageFilter !== 'all') {
        const lang = r.reportLanguage || 'English';
        if (lang !== languageFilter) return false;
      }

      // Full-text search across all specified fields:
      // Report title, Entity, Reporting period, Financial year, Report type/category,
      // Department, Branch, Project/cost centre, Created by, Keywords/tags, Status
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;

      const searchableString = [
        r.reportTitle,
        r.companyName,
        r.periodLabel,
        r.periodFrequency,
        r.financialYear,
        r.reportCategory,
        r.analysisType,
        r.department,
        r.branch,
        r.costCentre,
        r.createdBy,
        r.status,
        r.reportLanguage,
        r.riskScoreText,
        r.analysisReport?.executiveSummary,
        ...(r.tags || [])
      ].filter(Boolean).join(' ').toLowerCase();

      return searchableString.includes(q);
    }).sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortBy === 'title') {
        return a.reportTitle.localeCompare(b.reportTitle);
      }
      if (sortBy === 'period') {
        return (b.periodLabel || '').localeCompare(a.periodLabel || '', undefined, { numeric: true });
      }
      if (sortBy === 'risk_desc') {
        return (b.riskScore || 0) - (a.riskScore || 0);
      }
      if (sortBy === 'risk_asc') {
        return (a.riskScore || 0) - (b.riskScore || 0);
      }
      return 0;
    });
  }, [
    reports, activeTab, orgScopeOnly, activeEntityName, entityFilter,
    categoryFilter, statusFilter, departmentFilter, yearFilter, languageFilter,
    searchQuery, sortBy
  ]);

  // Paginated records
  const totalPages = Math.ceil(filteredReports.length / itemsPerPage) || 1;
  const paginatedReports = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredReports.slice(start, start + itemsPerPage);
  }, [filteredReports, currentPage, itemsPerPage]);

  // Reset all filters & search
  const handleResetFilters = () => {
    setSearchQuery('');
    setActiveTab('all');
    setEntityFilter('all');
    setCategoryFilter('all');
    setStatusFilter('all');
    setDepartmentFilter('all');
    setYearFilter('all');
    setLanguageFilter('all');
    setSortBy('newest');
    setCurrentPage(1);
  };

  // Apply a saved preset
  const handleApplyPreset = (preset: SavedSearchFilter) => {
    setSearchQuery(preset.query);
    setCategoryFilter(preset.category);
    setEntityFilter(preset.entity);
    setStatusFilter(preset.status);
    if (preset.sortBy) setSortBy(preset.sortBy as any);
    setCurrentPage(1);
  };

  // Save current filters as preset
  const handleSaveCurrentAsPreset = () => {
    if (!newPresetName.trim()) return;
    const newPreset: SavedSearchFilter = {
      id: `preset-${Date.now()}`,
      name: newPresetName.trim(),
      query: searchQuery,
      category: categoryFilter,
      entity: entityFilter,
      status: statusFilter,
      sortBy: sortBy
    };
    setSavedPresets(prev => [...prev, newPreset]);
    setNewPresetName('');
    setShowSavePresetInput(false);
  };

  // Compare selection toggle
  const handleToggleCompareSelection = (id: string) => {
    setSelectedForCompare(prev => {
      if (prev.includes(id)) {
        return prev.filter(x => x !== id);
      }
      if (prev.length >= 2) {
        return [prev[1], id];
      }
      return [...prev, id];
    });
  };

  // Direct quick Excel export for a saved report
  const handleQuickExportExcel = (e: React.MouseEvent, record: SavedAnalysisRecord) => {
    e.stopPropagation();
    if (!record.periods || record.periods.length === 0) return;

    try {
      const wb = XLSX.utils.book_new();
      const curr = record.periods[0];
      const is = curr.incomeStatement;
      const bs = curr.balanceSheet;
      const cf = curr.cashFlow;

      // Sheet 1: Executive Summary & Diagnostic Score
      const summaryRows = [
        ['FINSCOPE ENTERPRISE REPORT ARCHIVE'],
        ['Report Title:', record.reportTitle],
        ['Entity / Company:', record.companyName],
        ['Reporting Period:', record.periodLabel],
        ['Financial Year:', record.financialYear || '2025'],
        ['Report Category:', record.reportCategory || record.analysisType],
        ['Department / Branch:', `${record.department || 'Consolidated'} · ${record.branch || 'HQ'}`],
        ['Cost Centre:', record.costCentre || 'N/A'],
        ['Risk Diagnostic Score:', `${record.riskScore} / 10 (${record.riskScoreText || 'Calibrated'})`],
        ['Currency:', record.currency],
        ['Language:', record.reportLanguage || 'English'],
        ['Created By:', record.createdBy],
        ['Archived On:', new Date(record.createdAt).toLocaleDateString()],
        [''],
        ['EXECUTIVE COMMENTARY'],
        [record.analysisReport?.executiveSummary || 'No summary available.'],
        [''],
        ['CORE PERFORMANCE HIGHLIGHTS'],
        ['Total Revenue', is.revenue],
        ['Cost of Goods Sold (COGS)', is.cogs],
        ['Gross Profit', is.grossProfit],
        ['Gross Profit Margin', is.revenue > 0 ? `${((is.grossProfit / is.revenue) * 100).toFixed(2)}%` : '0%'],
        ['Operating Profit (EBIT)', is.operatingIncome],
        ['Operating Margin', is.revenue > 0 ? `${((is.operatingIncome / is.revenue) * 100).toFixed(2)}%` : '0%'],
        ['Net Income', is.netIncome],
        ['Net Margin', is.revenue > 0 ? `${((is.netIncome / is.revenue) * 100).toFixed(2)}%` : '0%']
      ];
      const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Executive Summary');

      // Sheet 2: Income Statement Breakdown
      const isRows = [
        ['STATEMENT OF PROFIT OR LOSS', record.periodLabel],
        ['Account Line Item', 'Amount (' + record.currency + ')'],
        ['Gross Revenue', is.revenue],
        ['Cost of Sales (COGS)', is.cogs],
        ['Gross Profit', is.grossProfit],
        ['Salaries & Personnel', is.operatingExpenses.salaries],
        ['Marketing & Advertising', is.operatingExpenses.marketing],
        ['Rent & Facilities', is.operatingExpenses.rentAndUtilities],
        ['Depreciation & Amortisation', is.operatingExpenses.depreciation],
        ['Other Operating Expenses', is.operatingExpenses.otherOpEx],
        ['Total Operating Expenses', is.operatingExpenses.total],
        ['Operating Income (EBIT)', is.operatingIncome],
        ['Interest Expense', is.interestExpense],
        ['Tax Provision', is.taxExpense],
        ['Net Profit After Tax', is.netIncome]
      ];
      const wsIS = XLSX.utils.aoa_to_sheet(isRows);
      XLSX.utils.book_append_sheet(wb, wsIS, 'Income Statement');

      // Sheet 3: Balance Sheet Breakdown (if populated)
      if (bs) {
        const bsRows = [
          ['STATEMENT OF FINANCIAL POSITION', record.periodLabel],
          ['Line Item', 'Amount (' + record.currency + ')'],
          ['Cash & Cash Equivalents', bs.assets.cashAndEquivalents],
          ['Accounts Receivable (Trade Debtors)', bs.assets.accountsReceivable],
          ['Inventory', bs.assets.inventory],
          ['Prepaid Expenses', bs.assets.prepaidExpenses],
          ['Total Current Assets', bs.assets.totalCurrentAssets],
          ['Property, Plant & Equipment', bs.assets.propertyPlantEquipment],
          ['Intangible Assets', bs.assets.intangibleAssets],
          ['Total Non-Current Assets', bs.assets.totalNonCurrentAssets],
          ['TOTAL ASSETS', bs.assets.totalAssets],
          [''],
          ['Accounts Payable (Trade Creditors)', bs.liabilities.accountsPayable],
          ['Short-term Debt', bs.liabilities.shortTermDebt],
          ['Accrued Liabilities', bs.liabilities.accruedLiabilities],
          ['Total Current Liabilities', bs.liabilities.totalCurrentLiabilities],
          ['Long-term Debt', bs.liabilities.longTermDebt],
          ['Total Liabilities', bs.liabilities.totalLiabilities],
          [''],
          ['Common Stock / Contributed Equity', bs.equity.commonStock],
          ['Retained Earnings', bs.equity.retainedEarnings],
          ['TOTAL EQUITY', bs.equity.totalEquity]
        ];
        const wsBS = XLSX.utils.aoa_to_sheet(bsRows);
        XLSX.utils.book_append_sheet(wb, wsBS, 'Balance Sheet');
      }

      // Sheet 4: Cash Flows
      if (cf) {
        const cfRows = [
          ['STATEMENT OF CASH FLOWS', record.periodLabel],
          ['Cash Flow Segment', 'Amount (' + record.currency + ')'],
          ['Cash Generated from Operating Activities', cf.operatingCashFlow],
          ['Cash Used in Investing Activities', cf.investingCashFlow],
          ['Cash Flows from Financing Activities', cf.financingCashFlow],
          ['Net Cash Movement', cf.netCashFlow],
          ['Ending Cash Balance', cf.endingCashBalance]
        ];
        const wsCF = XLSX.utils.aoa_to_sheet(cfRows);
        XLSX.utils.book_append_sheet(wb, wsCF, 'Cash Flow');
      }

      XLSX.writeFile(wb, `${record.companyName.replace(/\s+/g, '_')}_${record.reportTitle.replace(/\s+/g, '_')}.xlsx`);
    } catch (err) {
      console.error('Quick Excel export error:', err);
    }
  };

  // Direct quick Word export for a saved report
  const handleQuickExportWord = (e: React.MouseEvent, record: SavedAnalysisRecord) => {
    e.stopPropagation();
    const rep = record.analysisReport;
    const curr = record.periods?.[0];
    const is = curr?.incomeStatement;
    
    let docHtml = `<html><head><meta charset="utf-8"><title>${record.reportTitle}</title><style>
      body { font-family: 'Segoe UI', Calibri, Arial, sans-serif; margin: 40px; color: #0B192C; line-height: 1.6; }
      h1 { color: #0B1530; border-bottom: 3px solid #D6AE55; padding-bottom: 8px; font-size: 24pt; }
      h2 { color: #0B1530; border-bottom: 1px solid #E8E2D8; padding-bottom: 4px; margin-top: 24px; font-size: 16pt; }
      .meta { background-color: #FAF7F2; padding: 12px; border-left: 4px solid #D6AE55; margin-bottom: 20px; font-size: 10pt; }
      .score { font-size: 14pt; font-weight: bold; color: #0B1530; background: #FAF7F2; padding: 8px 12px; border-radius: 6px; display: inline-block; }
      table { width: 100%; border-collapse: collapse; margin-top: 14px; font-size: 10.5pt; }
      th, td { border: 1px solid #E8E2D8; padding: 8px 12px; text-align: left; }
      th { background-color: #0B192C; color: white; }
      .text-right { text-align: right; }
      .font-mono { font-family: Consolas, monospace; }
      .footer { margin-top: 40px; font-size: 9pt; color: #888; border-top: 1px solid #E8E2D8; padding-top: 10px; }
    </style></head><body>`;
    
    docHtml += `<h1>FINSCOPE EXECUTIVE FINANCIAL REPORT</h1>`;
    docHtml += `<div class="meta">
      <p><b>Report Title:</b> ${record.reportTitle} &nbsp;|&nbsp; <b>Entity:</b> ${record.companyName} &nbsp;|&nbsp; <b>Period:</b> ${record.periodLabel}</p>
      <p><b>Category:</b> ${record.reportCategory || record.analysisType} &nbsp;|&nbsp; <b>Department:</b> ${record.department || 'Consolidated'} &nbsp;|&nbsp; <b>Cost Centre:</b> ${record.costCentre || 'N/A'}</p>
      <p><b>Created By:</b> ${record.createdBy} &nbsp;|&nbsp; <b>Date:</b> ${new Date(record.createdAt).toLocaleDateString()} &nbsp;|&nbsp; <b>Language:</b> ${record.reportLanguage || 'English'}</p>
    </div>`;

    docHtml += `<p class="score">Diagnostic Risk Score: ${record.riskScore}/10 (${record.riskScoreText || 'Calibrated'})</p>`;

    if (rep?.executiveSummary) {
      docHtml += `<h2>Executive Diagnostic Summary</h2><p>${rep.executiveSummary.replace(/\n/g, '<br/>')}</p>`;
    }

    if (is) {
      docHtml += `<h2>Statement of Profit or Loss (${record.currency})</h2>`;
      docHtml += `<table>
        <tr><th>Financial Account Item</th><th class="text-right">Period Amount</th></tr>
        <tr><td>Gross Revenue</td><td class="text-right font-mono">${is.revenue.toLocaleString()}</td></tr>
        <tr><td>Cost of Goods Sold (COGS)</td><td class="text-right font-mono">${is.cogs.toLocaleString()}</td></tr>
        <tr><td><b>Gross Profit</b></td><td class="text-right font-mono"><b>${is.grossProfit.toLocaleString()}</b></td></tr>
        <tr><td>Total Operating Expenses</td><td class="text-right font-mono">${is.operatingExpenses.total.toLocaleString()}</td></tr>
        <tr><td><b>Operating Income (EBIT)</b></td><td class="text-right font-mono"><b>${is.operatingIncome.toLocaleString()}</b></td></tr>
        <tr><td>Tax Expense</td><td class="text-right font-mono">${is.taxExpense.toLocaleString()}</td></tr>
        <tr><td><b>Net Income (Profit After Tax)</b></td><td class="text-right font-mono"><b>${is.netIncome.toLocaleString()}</b></td></tr>
      </table>`;
    }

    if (rep?.redFlags && rep.redFlags.length > 0) {
      docHtml += `<h2>Identified Financial Risks & Guardrails</h2><ul>${rep.redFlags.map(r => `<li>${r}</li>`).join('')}</ul>`;
    }

    if (rep?.recommendations && rep.recommendations.length > 0) {
      docHtml += `<h2>Strategic Recommendations</h2><ul>${rep.recommendations.map(r => `<li>${r}</li>`).join('')}</ul>`;
    }

    docHtml += `<div class="footer"><p>Generated by FinScope Financial Health Engine · Confidential Corporate Document · Organisation: ${record.companyName}</p></div>`;
    docHtml += `</body></html>`;

    const blob = new Blob([docHtml], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${record.companyName.replace(/\s+/g, '_')}_${record.reportTitle.replace(/\s+/g, '_')}.doc`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Direct quick PDF print for a saved report
  const handleQuickExportPDF = (e: React.MouseEvent, record: SavedAnalysisRecord) => {
    e.stopPropagation();
    setPreviewReport(record);
    // Timeout to allow preview modal to mount then trigger window.print
    setTimeout(() => {
      window.print();
    }, 400);
  };

  // Comparison computation between 2 selected reports
  const comparisonData = useMemo(() => {
    if (selectedForCompare.length < 2) return null;
    const r1 = reports.find(r => r.id === selectedForCompare[0]);
    const r2 = reports.find(r => r.id === selectedForCompare[1]);
    if (!r1 || !r2) return null;

    const p1 = r1.periods?.[0];
    const p2 = r2.periods?.[0];
    if (!p1 || !p2) return null;

    const is1 = p1.incomeStatement;
    const is2 = p2.incomeStatement;

    const ratios1 = calculateFinancialRatios(p1);
    const ratios2 = calculateFinancialRatios(p2);

    const calcMetric = (val1: number, val2: number, isPercent = false, lowerIsBetter = false) => {
      const diff = val2 - val1;
      const pct = val1 !== 0 ? (diff / Math.abs(val1)) * 100 : 0;
      let favourable = diff > 0;
      if (lowerIsBetter) favourable = diff < 0;
      return { val1, val2, diff, pct, favourable, isPercent };
    };

    return {
      report1: r1,
      report2: r2,
      metrics: [
        { label: 'Gross Revenue', ...calcMetric(is1.revenue, is2.revenue) },
        { label: 'Gross Profit', ...calcMetric(is1.grossProfit, is2.grossProfit) },
        { label: 'Gross Margin %', ...calcMetric(ratios1.grossProfitMargin, ratios2.grossProfitMargin, true) },
        { label: 'Operating Profit (EBIT)', ...calcMetric(is1.operatingIncome, is2.operatingIncome) },
        { label: 'Operating Margin %', ...calcMetric(ratios1.operatingMargin, ratios2.operatingMargin, true) },
        { label: 'Net Income', ...calcMetric(is1.netIncome, is2.netIncome) },
        { label: 'Net Profit Margin %', ...calcMetric(ratios1.netProfitMargin, ratios2.netProfitMargin, true) },
        { label: 'Current Ratio', ...calcMetric(ratios1.currentRatio, ratios2.currentRatio) },
        { label: 'Debt-to-Equity Ratio', ...calcMetric(ratios1.debtToEquityRatio, ratios2.debtToEquityRatio, false, true) },
        { label: 'Diagnostic Risk Score', ...calcMetric(r1.riskScore, r2.riskScore, false, true) }
      ]
    };
  }, [selectedForCompare, reports]);

  return (
    <div className="space-y-8 animate-fade-in text-left pb-16" id="reports-archive-view">
      
      {/* =========================================================================
          TOP HEADER & ORGANIZATION SCOPE INDICATOR
          ========================================================================= */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-[#E8E2D8] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-mono font-bold tracking-[0.25em] text-[#D4A347] uppercase">
              PHASE 9 · SEARCHABLE REPORTS LIBRARY & AUDIT REPOSITORY
            </span>
            <span className="text-slate-300">·</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Organisation-Scoped
            </span>
          </div>

          <h1 className="font-serif-display text-4xl sm:text-5xl font-bold text-[#0B192C] tracking-tight">
            Searchable Reports Library
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
            Instant full-text retrieval, multi-dimensional filter chips, side-by-side period comparisons, 
            version histories, and export packages for all board packs, assessments, and variance audits.
          </p>

          {/* Active Organization Boundary Badge */}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-600 font-mono">
            <span className="text-slate-400">Current Scope:</span>
            <span className="bg-[#FAF7F2] border border-[#E8E2D8] px-2.5 py-1 rounded-lg font-bold text-[#0B192C] flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-[#D4A347]" />
              {activeEntityName}
            </span>
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-500 hover:text-[#0B192C] transition-colors ml-2">
              <input
                type="checkbox"
                checked={orgScopeOnly}
                onChange={(e) => setOrgScopeOnly(e.target.checked)}
                className="rounded border-[#E8E2D8] text-[#0B192C] focus:ring-[#D6AE55] w-3.5 h-3.5"
              />
              <span className="text-[11px]">Strict Tenant Boundary (isolate other company datasets)</span>
            </label>
          </div>
        </div>

        {/* Action Buttons: Compare Mode + New Analysis */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              setIsCompareMode(!isCompareMode);
              if (isCompareMode) setSelectedForCompare([]);
            }}
            className={`px-3.5 py-2 text-xs font-semibold rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
              isCompareMode 
                ? 'bg-[#0B192C] text-white border-[#0B192C] shadow-xs' 
                : 'bg-white text-slate-700 border-[#E8E2D8] hover:border-[#0B192C]'
            }`}
          >
            <GitCompare className="w-4 h-4 text-[#D4A347]" />
            <span>{isCompareMode ? 'Exit Compare Mode' : 'Compare 2 Reports'}</span>
            {selectedForCompare.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-[#D4A347] text-[#0B192C] rounded-full text-[10px] font-bold">
                {selectedForCompare.length}/2
              </span>
            )}
          </button>

          {isCompareMode && selectedForCompare.length === 2 && (
            <button
              type="button"
              onClick={() => setShowComparisonModal(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer animate-pulse"
            >
              <GitCompare className="w-4 h-4" />
              <span>Launch Side-by-Side</span>
            </button>
          )}

          <button
            type="button"
            onClick={onNewAnalysis}
            className="px-4 py-2 bg-[#D6AE55] hover:bg-[#C59B42] text-[#0B1530] font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Analysis</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          RECENT REPORTS QUICK ACCESS CAROUSEL (Top 3)
          ========================================================================= */}
      {recentReports.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#D4A347]" />
              Recent Reports & Live Audits
            </h2>
            <span className="text-[11px] text-slate-400 font-mono">Fast access to latest modified files</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {recentReports.map(report => (
              <div
                key={`recent-${report.id}`}
                className="bg-white border border-[#E8E2D8] hover:border-[#0B192C] rounded-2xl p-4 shadow-xs transition-all flex flex-col justify-between group cursor-pointer"
                onClick={() => onOpenReport(report)}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[10px] font-mono font-bold text-[#D4A347] uppercase tracking-wider truncate">
                      {report.reportCategory || report.analysisType}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#FAF7F2] border border-[#E8E2D8] text-slate-600">
                      {report.periodLabel?.split('·')[0]?.trim() || report.financialYear || '2025'}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-[#0B192C] group-hover:text-[#D4A347] transition-colors line-clamp-1">
                    {report.reportTitle}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">
                    {report.companyName} {report.department ? `· ${report.department}` : ''}
                  </p>
                </div>

                <div className="mt-3.5 pt-3 border-t border-[#E8E2D8]/70 flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-slate-700">
                    {report.riskScoreText || `Risk ${report.riskScore.toFixed(1)}/10`}
                  </span>

                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewReport(report);
                      }}
                      className="p-1 text-slate-400 hover:text-[#0B192C] rounded hover:bg-slate-100 transition-colors"
                      title="Quick Preview"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenReport(report)}
                      className="text-[11px] font-bold text-[#0B192C] group-hover:text-[#D4A347] flex items-center gap-0.5"
                    >
                      <span>Open</span>
                      <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          SEARCH BAR & MULTI-DIMENSIONAL FILTER CONTROLS
          ========================================================================= */}
      <div className="space-y-3.5 bg-white p-4.5 rounded-2xl border border-[#E8E2D8] shadow-xs">
        
        {/* Main Search Input & Category Pills */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          
          {/* Full-text input with clear button */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search title, entity, period, year, category, department, cost centre, tags, author..."
              className="w-full pl-10 pr-9 py-2.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-xs text-[#0B192C] placeholder:text-slate-400 focus:outline-none focus:border-[#D6AE55] focus:bg-white transition-all font-sans"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                title="Clear Search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status / Scope Filter Tabs */}
          <div className="flex items-center gap-1 p-1 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl shrink-0">
            <button
              type="button"
              onClick={() => { setActiveTab('all'); setCurrentPage(1); }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                activeTab === 'all' ? 'bg-[#0B192C] text-white shadow-xs' : 'text-slate-600 hover:text-[#0B192C]'
              }`}
            >
              All ({reports.filter(r => !r.isArchived).length})
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('favorites'); setCurrentPage(1); }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                activeTab === 'favorites' ? 'bg-[#0B192C] text-white shadow-xs' : 'text-slate-600 hover:text-[#0B192C]'
              }`}
            >
              <Star className="w-3 h-3 text-[#D4A347] fill-[#D4A347]" />
              <span>Favourites ({reports.filter(r => r.isFavorite).length})</span>
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('archived'); setCurrentPage(1); }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                activeTab === 'archived' ? 'bg-[#0B192C] text-white shadow-xs' : 'text-slate-600 hover:text-[#0B192C]'
              }`}
            >
              <Archive className="w-3 h-3 text-slate-400" />
              <span>Archive ({reports.filter(r => r.isArchived).length})</span>
            </button>
          </div>
        </div>

        {/* Filter Dropdowns Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-2 border-t border-[#E8E2D8]/70">
          
          {/* Entity Dropdown */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Entity</label>
            <select
              value={entityFilter}
              onChange={(e) => { setEntityFilter(e.target.value); setCurrentPage(1); }}
              className="w-full px-2.5 py-1.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-xs text-[#0B192C] font-medium focus:outline-none focus:border-[#D6AE55] cursor-pointer"
            >
              <option value="all">All Entities</option>
              {distinctEntities.map(e => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
          </div>

          {/* Report Category */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
              className="w-full px-2.5 py-1.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-xs text-[#0B192C] font-medium focus:outline-none focus:border-[#D6AE55] cursor-pointer truncate"
            >
              <option value="all">All Categories</option>
              {distinctCategories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Financial Year */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Year</label>
            <select
              value={yearFilter}
              onChange={(e) => { setYearFilter(e.target.value); setCurrentPage(1); }}
              className="w-full px-2.5 py-1.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-xs text-[#0B192C] font-medium focus:outline-none focus:border-[#D6AE55] cursor-pointer"
            >
              <option value="all">All Years</option>
              {distinctYears.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {/* Department */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Department</label>
            <select
              value={departmentFilter}
              onChange={(e) => { setDepartmentFilter(e.target.value); setCurrentPage(1); }}
              className="w-full px-2.5 py-1.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-xs text-[#0B192C] font-medium focus:outline-none focus:border-[#D6AE55] cursor-pointer truncate"
            >
              <option value="all">All Departments</option>
              {distinctDepartments.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="w-full px-2.5 py-1.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-xs text-[#0B192C] font-medium focus:outline-none focus:border-[#D6AE55] cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="in_review">In Review</option>
              <option value="draft">Draft</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Sort Order</label>
            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value as any); setCurrentPage(1); }}
              className="w-full px-2.5 py-1.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-xs text-[#0B192C] font-medium focus:outline-none focus:border-[#D6AE55] cursor-pointer truncate"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="title">Title (A-Z)</option>
              <option value="period">Period (Desc)</option>
              <option value="risk_desc">Highest Risk First</option>
              <option value="risk_asc">Lowest Risk First</option>
            </select>
          </div>
        </div>

        {/* Saved Search Presets Bar & Active Filter Chips */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs">
          
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase flex items-center gap-1">
              <Bookmark className="w-3 h-3 text-[#D4A347]" />
              Saved Presets:
            </span>

            {savedPresets.map(preset => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleApplyPreset(preset)}
                className="px-2.5 py-1 rounded-lg bg-[#FAF7F2] hover:bg-white text-slate-700 hover:text-[#0B192C] border border-[#E8E2D8] text-[11px] font-medium transition-colors cursor-pointer"
              >
                {preset.name}
              </button>
            ))}

            {!showSavePresetInput ? (
              <button
                type="button"
                onClick={() => setShowSavePresetInput(true)}
                className="text-[11px] text-[#D4A347] hover:text-[#C59B42] font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Save Current View</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  placeholder="Preset label..."
                  className="px-2 py-0.5 text-xs bg-white border border-[#D6AE55] rounded-md focus:outline-none w-32"
                />
                <button
                  type="button"
                  onClick={handleSaveCurrentAsPreset}
                  className="px-2 py-0.5 bg-[#0B192C] text-white rounded text-[11px] font-bold"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setShowSavePresetInput(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Reset Filters button if any filter is active */}
          {(searchQuery || entityFilter !== 'all' || categoryFilter !== 'all' || statusFilter !== 'all' || departmentFilter !== 'all' || yearFilter !== 'all' || activeTab !== 'all') && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-[11px] font-mono text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer ml-auto"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset All Filters ({filteredReports.length} results)</span>
            </button>
          )}
        </div>

      </div>

      {/* Compare Mode Notification Bar */}
      {isCompareMode && (
        <div className="bg-[#FAF7F2] border-2 border-dashed border-[#D6AE55] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <GitCompare className="w-5 h-5 text-[#D4A347] shrink-0" />
            <div>
              <p className="text-xs font-bold text-[#0B192C]">
                Side-by-Side Comparison Mode Active
              </p>
              <p className="text-[11px] text-slate-500">
                Select any two reports using the checkboxes below to generate automated period-over-period variance metrics.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-slate-600">
              Selected: {selectedForCompare.length} / 2
            </span>
            {selectedForCompare.length === 2 && (
              <button
                type="button"
                onClick={() => setShowComparisonModal(true)}
                className="px-4 py-2 bg-[#0B192C] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#162A45] cursor-pointer"
              >
                Compare Selected Now
              </button>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          REPORTS LIST & CARDS
          ========================================================================= */}
      <div className="space-y-3">
        {paginatedReports.length === 0 ? (
          <div className="bg-white border border-[#E8E2D8] rounded-2xl p-12 text-center max-w-lg mx-auto shadow-xs space-y-3.5">
            <FileText className="w-10 h-10 text-[#D4A347] mx-auto opacity-75" />
            <h3 className="font-serif-display text-xl font-bold text-[#0B192C]">No reports matched your criteria</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              We couldn't find any financial assessments or management reviews matching your current search terms and filter settings.
            </p>
            <div className="pt-2 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-4 py-2 bg-[#0B192C] text-white text-xs font-semibold rounded-xl hover:bg-[#162A45] cursor-pointer shadow-xs"
              >
                Reset Search & Filters
              </button>
              <button
                type="button"
                onClick={onNewAnalysis}
                className="px-4 py-2 bg-[#FAF7F2] border border-[#E8E2D8] text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                Upload New Data
              </button>
            </div>
          </div>
        ) : (
          paginatedReports.map(report => {
            const isSelected = selectedForCompare.includes(report.id);
            const isFav = !!report.isFavorite;
            const isArchived = !!report.isArchived;

            return (
              <div
                key={report.id}
                className={`bg-white border rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 group ${
                  isSelected 
                    ? 'border-[#D4A347] bg-[#FAF7F2]/50 ring-1 ring-[#D4A347]' 
                    : 'border-[#E8E2D8] hover:border-[#0B192C]'
                }`}
              >
                
                {/* Left Block: Checkbox (if compare mode) + Star + Title & Metadata */}
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  
                  {/* Compare mode selector */}
                  {isCompareMode && (
                    <div className="pt-1">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleCompareSelection(report.id)}
                        className="w-4 h-4 rounded border-[#E8E2D8] text-[#0B192C] focus:ring-[#D6AE55] cursor-pointer"
                      />
                    </div>
                  )}

                  {/* Favorite / Pin Star Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onToggleFavorite) onToggleFavorite(report.id);
                    }}
                    className="pt-1 text-slate-300 hover:text-[#D4A347] transition-colors cursor-pointer"
                    title={isFav ? "Remove favourite" : "Pin as favourite"}
                  >
                    <Star className={`w-4 h-4 ${isFav ? 'text-[#D4A347] fill-[#D4A347]' : ''}`} />
                  </button>

                  <div 
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => onOpenReport(report)}
                  >
                    
                    {/* Top pill row */}
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-[10px] font-mono font-bold tracking-wider uppercase px-2 py-0.5 rounded-md bg-[#FAF7F2] text-[#D4A347] border border-[#E8E2D8]">
                        {report.reportCategory || report.analysisType || 'Comprehensive Analysis'}
                      </span>

                      {report.status && (
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md uppercase ${
                          report.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : report.status === 'in_review'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {report.status === 'completed' ? 'Completed' : report.status === 'in_review' ? 'In Review' : 'Draft'}
                        </span>
                      )}

                      {report.reportLanguage && report.reportLanguage !== 'English' && (
                        <span className="text-[10px] font-mono text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Globe className="w-2.5 h-2.5" />
                          {report.reportLanguage}
                        </span>
                      )}

                      {isArchived && (
                        <span className="text-[10px] font-mono text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                          Archived
                        </span>
                      )}
                    </div>

                    {/* Report Title */}
                    <h3 className="text-base font-bold text-[#0B192C] group-hover:text-[#D4A347] transition-colors truncate">
                      {report.reportTitle}
                    </h3>

                    {/* Unboxed Metadata Line with middots */}
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 font-mono mt-1">
                      <span className="font-semibold text-slate-700">{report.companyName}</span>
                      <span aria-hidden="true">·</span>
                      <span>{report.periodLabel}</span>
                      <span aria-hidden="true">·</span>
                      <span>{report.currency}</span>
                      {report.department && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>{report.department}</span>
                        </>
                      )}
                      {report.costCentre && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-slate-400">{report.costCentre}</span>
                        </>
                      )}
                    </div>

                    {/* Tags row + Author & Timestamp */}
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {report.tags && report.tags.map(tag => (
                        <span key={tag} className="text-[10px] font-mono bg-slate-50 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                          #{tag}
                        </span>
                      ))}

                      <span className="text-[11px] text-slate-400 font-mono ml-auto lg:ml-0">
                        Updated {new Date(report.updatedAt || report.createdAt).toLocaleDateString()} by {report.createdBy}
                      </span>

                      {report.versions && report.versions.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setVersionReport(report);
                          }}
                          className="text-[10px] font-mono text-[#D4A347] hover:underline flex items-center gap-0.5 cursor-pointer ml-1"
                        >
                          <History className="w-3 h-3" />
                          <span>v{report.versions.length}</span>
                        </button>
                      )}
                    </div>

                  </div>
                </div>

                {/* Right Block: Score + Export Formats + Action Menu */}
                <div className="flex items-center gap-2.5 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-[#E8E2D8]/70 justify-between lg:justify-end">
                  
                  {/* Risk Score Pill */}
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-slate-700 bg-[#FAF7F2] border border-[#E8E2D8] px-2.5 py-1 rounded-lg block">
                      {report.riskScoreText || `Risk ${report.riskScore.toFixed(1)}/10`}
                    </span>
                    <span className="text-[9px] font-mono text-slate-400 uppercase mt-0.5 block">
                      {report.riskScore <= 3.5 ? 'Prime' : report.riskScore <= 5.5 ? 'Moderate' : 'Elevated'}
                    </span>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center gap-1">
                    
                    {/* Quick Preview Button */}
                    <button
                      type="button"
                      onClick={() => setPreviewReport(report)}
                      className="p-2 text-slate-400 hover:text-[#0B192C] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                      title="Preview Report Modal"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {/* Export Excel (.xlsx) */}
                    <button
                      type="button"
                      onClick={(e) => handleQuickExportExcel(e, report)}
                      className="p-2 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                      title="Download Excel Workbook (.xlsx)"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                    </button>

                    {/* Export Word (.doc) */}
                    <button
                      type="button"
                      onClick={(e) => handleQuickExportWord(e, report)}
                      className="p-2 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                      title="Download Word Report (.doc)"
                    >
                      <FileText className="w-4 h-4" />
                    </button>

                    {/* Print / PDF */}
                    <button
                      type="button"
                      onClick={(e) => handleQuickExportPDF(e, report)}
                      className="p-2 text-slate-400 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                      title="Print or Save PDF"
                    >
                      <Printer className="w-4 h-4" />
                    </button>

                    {/* Duplicate Analysis */}
                    {onDuplicateReport && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDuplicateReport(report);
                        }}
                        className="p-2 text-slate-400 hover:text-[#D4A347] hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                        title="Duplicate Analysis (Create Copy)"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    )}

                    {/* Archive / Unarchive */}
                    {onToggleArchive && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleArchive(report.id);
                        }}
                        className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title={isArchived ? "Unarchive Report" : "Archive Report"}
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                    )}

                    {/* Delete button */}
                    {onDeleteReport && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setReportToDelete(report);
                        }}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete Report"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}

                    {/* Open in Workspace Arrow */}
                    <button
                      type="button"
                      onClick={() => onOpenReport(report)}
                      className="px-2.5 py-1.5 ml-1 bg-[#FAF7F2] hover:bg-[#0B192C] text-[#0B192C] hover:text-white border border-[#E8E2D8] rounded-lg transition-all cursor-pointer flex items-center gap-1 text-xs font-semibold"
                      title="Open Report in Workspace"
                    >
                      <span>Open</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                  </div>

                </div>

              </div>
            );
          })
        )}
      </div>

      {/* =========================================================================
          PAGINATION BAR
          ========================================================================= */}
      {filteredReports.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#E8E2D8] text-xs font-mono text-slate-500">
          <div>
            Showing <span className="font-bold text-[#0B192C]">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
            <span className="font-bold text-[#0B192C]">{Math.min(currentPage * itemsPerPage, filteredReports.length)}</span> of{' '}
            <span className="font-bold text-[#0B192C]">{filteredReports.length}</span> saved analyses
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-slate-400">Per page:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-white border border-[#E8E2D8] rounded-md px-2 py-0.5 text-xs text-[#0B192C] cursor-pointer"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="px-2.5 py-1 bg-white border border-[#E8E2D8] rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:border-[#0B192C] transition-colors cursor-pointer"
              >
                Prev
              </button>

              <span className="px-2 font-bold text-[#0B192C]">
                {currentPage} / {totalPages}
              </span>

              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="px-2.5 py-1 bg-white border border-[#E8E2D8] rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:border-[#0B192C] transition-colors cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 1: PREVIEW REPORT MODAL (In-situ Inspection)
          ========================================================================= */}
      {previewReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-[#E8E2D8] max-h-[90vh] overflow-y-auto text-left animate-scale-up">
            
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-[#E8E2D8] pb-5">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-mono font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-[#FAF7F2] text-[#D4A347] border border-[#E8E2D8]">
                    {previewReport.reportCategory || previewReport.analysisType}
                  </span>
                  <span className="text-xs font-mono text-slate-500">
                    {previewReport.periodLabel}
                  </span>
                </div>
                <h2 className="font-serif-display text-2xl sm:text-3xl font-bold text-[#0B192C]">
                  {previewReport.reportTitle}
                </h2>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  {previewReport.companyName} · Currency: {previewReport.currency} · Author: {previewReport.createdBy}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setPreviewReport(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Diagnostic Score Card */}
            <div className="bg-[#FAF7F2] border border-[#E8E2D8] rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                  Diagnostic Financial Health Assessment
                </span>
                <div className="text-xl font-bold text-[#0B192C] font-serif-display mt-0.5">
                  {previewReport.riskScoreText || `Overall Risk: ${previewReport.riskScore.toFixed(1)}/10`}
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Calibrated across Profitability, Working Capital Liquidity, Solvency Leverage, and Cash Flow Quality.
                </p>
              </div>

              <div className="text-right shrink-0">
                <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-xl bg-white border border-[#E8E2D8] text-slate-800 shadow-xs">
                  Status: {previewReport.status.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Executive Summary */}
            {previewReport.analysisReport?.executiveSummary && (
              <div className="space-y-2">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
                  Executive Briefing & Findings
                </h3>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-white border border-[#E8E2D8] p-4 rounded-xl">
                  {previewReport.analysisReport.executiveSummary}
                </p>
              </div>
            )}

            {/* Statement of Profit or Loss Snapshot */}
            {previewReport.periods?.[0] && (
              <div className="space-y-2">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
                  Key Financial Line Items ({previewReport.currency})
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-[#FAF7F2] border border-[#E8E2D8] p-3 rounded-xl">
                    <span className="text-[10px] font-mono text-slate-500 uppercase block">Total Revenue</span>
                    <span className="text-sm font-mono font-bold text-[#0B192C]">
                      {previewReport.periods[0].incomeStatement.revenue.toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-[#FAF7F2] border border-[#E8E2D8] p-3 rounded-xl">
                    <span className="text-[10px] font-mono text-slate-500 uppercase block">Gross Profit</span>
                    <span className="text-sm font-mono font-bold text-[#0B192C]">
                      {previewReport.periods[0].incomeStatement.grossProfit.toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-[#FAF7F2] border border-[#E8E2D8] p-3 rounded-xl">
                    <span className="text-[10px] font-mono text-slate-500 uppercase block">Operating Profit</span>
                    <span className="text-sm font-mono font-bold text-[#0B192C]">
                      {previewReport.periods[0].incomeStatement.operatingIncome.toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-[#FAF7F2] border border-[#E8E2D8] p-3 rounded-xl">
                    <span className="text-[10px] font-mono text-slate-500 uppercase block">Net Profit</span>
                    <span className="text-sm font-mono font-bold text-emerald-800">
                      {previewReport.periods[0].incomeStatement.netIncome.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Recommendations preview */}
            {previewReport.analysisReport?.recommendations && previewReport.analysisReport.recommendations.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
                  Prescriptive Recommendations
                </h3>
                <ul className="space-y-1.5 text-xs text-slate-700 bg-[#FAF7F2] p-4 rounded-xl border border-[#E8E2D8]">
                  {previewReport.analysisReport.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <ChevronRight className="w-3.5 h-3.5 text-[#D4A347] shrink-0 mt-0.5" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Modal Footer Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#E8E2D8]">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => handleQuickExportExcel(e, previewReport)}
                  className="px-3 py-2 text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 rounded-xl cursor-pointer flex items-center gap-1.5"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Download Excel</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => handleQuickExportWord(e, previewReport)}
                  className="px-3 py-2 text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100 rounded-xl cursor-pointer flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Download Word</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-2 text-xs font-semibold bg-purple-50 text-purple-800 border border-purple-200 hover:bg-purple-100 rounded-xl cursor-pointer flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print View</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewReport(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const rep = previewReport;
                    setPreviewReport(null);
                    onOpenReport(rep);
                  }}
                  className="px-4 py-2 bg-[#0B192C] hover:bg-[#162A45] text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <span>Open Full Analysis</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: SIDE-BY-SIDE REPORT COMPARISON MODAL
          ========================================================================= */}
      {showComparisonModal && comparisonData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-[#E8E2D8] max-h-[90vh] overflow-y-auto text-left animate-scale-up">
            
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-[#E8E2D8] pb-5">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-mono font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-[#FAF7F2] text-[#D4A347] border border-[#E8E2D8]">
                    SIDE-BY-SIDE PERIOD & ENTITY VARIANCE
                  </span>
                </div>
                <h2 className="font-serif-display text-2xl sm:text-3xl font-bold text-[#0B192C]">
                  Comparative Financial Analysis
                </h2>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  Benchmarking: <b>{comparisonData.report1.reportTitle}</b> ({comparisonData.report1.periodLabel}) vs <b>{comparisonData.report2.reportTitle}</b> ({comparisonData.report2.periodLabel})
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowComparisonModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Comparison Table */}
            <div className="border border-[#E8E2D8] rounded-2xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#FAF7F2] border-b border-[#E8E2D8] font-mono text-slate-600">
                  <tr>
                    <th className="p-3 font-bold">Financial Metric</th>
                    <th className="p-3 font-bold text-right truncate">{comparisonData.report1.reportTitle}</th>
                    <th className="p-3 font-bold text-right truncate">{comparisonData.report2.reportTitle}</th>
                    <th className="p-3 font-bold text-right">Variance ($/pts)</th>
                    <th className="p-3 font-bold text-right">Variance (%)</th>
                    <th className="p-3 font-bold text-center">Impact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E2D8]">
                  {comparisonData.metrics.map(m => (
                    <tr key={m.label} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-medium text-[#0B192C]">{m.label}</td>
                      <td className="p-3 text-right font-mono">
                        {m.isPercent ? `${m.val1.toFixed(1)}%` : m.val1.toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-mono">
                        {m.isPercent ? `${m.val2.toFixed(1)}%` : m.val2.toLocaleString()}
                      </td>
                      <td className={`p-3 text-right font-mono font-bold ${m.favourable ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {m.diff > 0 ? '+' : ''}{m.isPercent ? `${m.diff.toFixed(1)}%` : m.diff.toLocaleString()}
                      </td>
                      <td className={`p-3 text-right font-mono font-bold ${m.favourable ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {m.pct > 0 ? '+' : ''}{m.pct.toFixed(1)}%
                      </td>
                      <td className="p-3 text-center">
                        <span className={`inline-block text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                          m.favourable ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {m.favourable ? 'Favourable' : 'Adverse'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 pt-2 border-t border-[#E8E2D8]">
              <button
                type="button"
                onClick={() => setShowComparisonModal(false)}
                className="px-4 py-2 bg-[#0B192C] text-white text-xs font-semibold rounded-xl hover:bg-[#162A45] cursor-pointer"
              >
                Close Comparison
              </button>
            </div>

          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: REPORT VERSION HISTORY MODAL
          ========================================================================= */}
      {versionReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-[#E8E2D8] text-left">
            <div className="flex items-start justify-between gap-4 border-b border-[#E8E2D8] pb-4">
              <div>
                <span className="text-[10px] font-mono font-bold text-[#D4A347] uppercase tracking-wider block">
                  AUDIT TRAIL & REVISION LOG
                </span>
                <h3 className="font-serif-display text-xl font-bold text-[#0B192C] mt-0.5">
                  Version History
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5 truncate">
                  {versionReport.reportTitle}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setVersionReport(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {(versionReport.versions || [
                {
                  versionNumber: 1,
                  updatedAt: versionReport.createdAt,
                  updatedBy: versionReport.createdBy,
                  changeSummary: 'Initial published financial statement assessment'
                }
              ]).map((v, idx) => (
                <div key={idx} className="bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl p-3.5 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-[#0B192C] bg-white px-2 py-0.5 rounded border border-[#E8E2D8]">
                      Version {v.versionNumber}
                    </span>
                    <span className="font-mono text-slate-400 text-[11px]">
                      {new Date(v.updatedAt).toLocaleDateString()} {new Date(v.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 font-medium pt-1">
                    {v.changeSummary}
                  </p>
                  <p className="text-[11px] font-mono text-slate-400">
                    Modified by: {v.updatedBy}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-[#E8E2D8]">
              <button
                type="button"
                onClick={() => setVersionReport(null)}
                className="px-4 py-2 bg-[#0B192C] text-white text-xs font-semibold rounded-xl hover:bg-[#162A45] cursor-pointer"
              >
                Close Audit Log
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 4: DELETE CONFIRMATION MODAL
          ========================================================================= */}
      {reportToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-xl border border-[#E8E2D8]">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <h3 className="font-bold text-base text-[#0B192C]">Permanent Report Deletion</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to permanently delete <b>{reportToDelete.reportTitle}</b>? 
              Under statutory retention governance, deleted analyses cannot be restored.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReportToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteReport) onDeleteReport(reportToDelete.id);
                  setReportToDelete(null);
                }}
                className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl cursor-pointer shadow-xs"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
