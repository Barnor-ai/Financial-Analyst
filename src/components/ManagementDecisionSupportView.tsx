/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Briefcase, AlertOctagon, TrendingUp, TrendingDown, DollarSign,
  ShieldAlert, Clock, CheckCircle2, AlertTriangle, ArrowRight,
  Filter, Plus, Search, Calendar, User, Building2, FileText,
  Sliders, RefreshCw, BarChart3, ChevronRight, X, Sparkles,
  Layers, ArrowUpRight, ArrowDownRight, Edit3, Trash2, Check,
  Info, ExternalLink, Download
} from 'lucide-react';
import { 
  UserProfile, 
  PeriodFinancialData, 
  BudgetVsActual, 
  FinancialAnalysisReport,
  ManagementActionItem,
  ActionStatus,
  ActionPriority,
  DecisionInsightItem,
  DecisionCategory,
  ScenarioModelAssumptions,
  ScenarioProjectionResult
} from '../types';
import { 
  loadManagementActions, 
  saveManagementActions, 
  getActionDueStatus, 
  generateDecisionSupportInsights,
  calculateScenarioProjection,
  INITIAL_MANAGEMENT_ACTIONS
} from '../utils/decisionEngine';

interface ManagementDecisionSupportViewProps {
  profile: UserProfile;
  periods: PeriodFinancialData[];
  budgetPerformance?: BudgetVsActual[];
  analysis?: FinancialAnalysisReport | null;
  onNavigateToVariance?: () => void;
  onNavigateToReports?: () => void;
}

type SubTabMode = 'decision_intelligence' | 'action_register' | 'scenario_planner';

export default function ManagementDecisionSupportView({
  profile,
  periods,
  budgetPerformance = [],
  analysis = null,
  onNavigateToVariance,
  onNavigateToReports
}: ManagementDecisionSupportViewProps) {
  const [subTab, setSubTab] = useState<SubTabMode>('decision_intelligence');
  
  // Currency symbol
  const curSymbol = profile.currency?.match(/\(([^)]+)\)/)?.[1] || '$';

  // Management Actions State
  const [actions, setActions] = useState<ManagementActionItem[]>(() => loadManagementActions());
  const [actionSearch, setActionSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [departmentFilter, setDepartmentFilter] = useState<string>('All');
  const [showOverdueOnly, setShowOverdueOnly] = useState<boolean>(false);

  // New / Edit Action Modal
  const [isActionModalOpen, setIsActionModalOpen] = useState<boolean>(false);
  const [editingActionId, setEditingActionId] = useState<string | null>(null);
  const [modalForm, setModalForm] = useState<Omit<ManagementActionItem, 'id' | 'createdAt' | 'updatedAt'>>({
    actionDescription: '',
    linkedReportOrVariance: '',
    responsiblePerson: '',
    department: 'Finance',
    priority: 'High',
    dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    status: 'Open',
    expectedFinancialImpact: '',
    actualOutcome: '',
    commentsAndEvidence: ''
  });

  // Category filter for Decision Intelligence
  const [selectedDecisionCategory, setSelectedDecisionCategory] = useState<string>('All');

  // Scenario Planner State
  const sortedPeriods = useMemo(() => {
    return [...periods].sort((a, b) => b.period.localeCompare(a.period, undefined, { numeric: true }));
  }, [periods]);
  const baselinePeriod = sortedPeriods[0];

  const defaultAssumptions: ScenarioModelAssumptions = {
    scenarioName: 'CFO Base Model 2026',
    revenueGrowthPct: 12,
    grossMarginPct: baselinePeriod 
      ? Number(((baselinePeriod.incomeStatement.grossProfit / (baselinePeriod.incomeStatement.revenue || 1)) * 100).toFixed(1))
      : 28,
    opexChangePct: 6,
    dsoDaysChange: -5, // accelerate collection by 5 days
    dioDaysChange: -2,
    dpoDaysChange: 4,  // stretch payables by 4 days
    taxRatePct: 24,
    capexBudget: baselinePeriod ? Math.round(baselinePeriod.incomeStatement.revenue * 0.03) : 250000
  };

  const [scenarioAssumptions, setScenarioAssumptions] = useState<ScenarioModelAssumptions>(defaultAssumptions);
  const [selectedScenarioPreset, setSelectedScenarioPreset] = useState<'base' | 'growth' | 'stress' | 'cash_crunch'>('base');

  // Save actions to localStorage whenever changed
  useEffect(() => {
    saveManagementActions(actions);
  }, [actions]);

  // Generate deterministic Decision Intelligence Insights
  const decisionInsights = useMemo(() => {
    return generateDecisionSupportInsights(periods, budgetPerformance, analysis, curSymbol);
  }, [periods, budgetPerformance, analysis, curSymbol]);

  // Filtered Decision Insights
  const filteredInsights = useMemo(() => {
    if (selectedDecisionCategory === 'All') return decisionInsights;
    return decisionInsights.filter(i => i.category === selectedDecisionCategory);
  }, [decisionInsights, selectedDecisionCategory]);

  // Calculate Action Register Overdue and Statistics
  const actionStats = useMemo(() => {
    let overdueCount = 0;
    let openCount = 0;
    let inProgressCount = 0;
    let awaitingApprovalCount = 0;
    let completedCount = 0;
    let deferredCount = 0;

    actions.forEach(a => {
      const { isOverdue } = getActionDueStatus(a.dueDate, a.status);
      if (isOverdue) overdueCount++;
      if (a.status === 'Open') openCount++;
      if (a.status === 'In Progress') inProgressCount++;
      if (a.status === 'Awaiting Approval') awaitingApprovalCount++;
      if (a.status === 'Completed') completedCount++;
      if (a.status === 'Deferred') deferredCount++;
    });

    return {
      total: actions.length,
      overdueCount,
      openCount,
      inProgressCount,
      awaitingApprovalCount,
      completedCount,
      deferredCount
    };
  }, [actions]);

  // Filtered Actions for Register
  const filteredActions = useMemo(() => {
    return actions.filter(a => {
      if (showOverdueOnly) {
        const { isOverdue } = getActionDueStatus(a.dueDate, a.status);
        if (!isOverdue) return false;
      }
      if (statusFilter !== 'All' && a.status !== statusFilter) return false;
      if (priorityFilter !== 'All' && a.priority !== priorityFilter) return false;
      if (departmentFilter !== 'All' && a.department !== departmentFilter) return false;
      if (actionSearch.trim()) {
        const q = actionSearch.toLowerCase();
        const matches = 
          a.actionDescription.toLowerCase().includes(q) ||
          a.responsiblePerson.toLowerCase().includes(q) ||
          a.linkedReportOrVariance.toLowerCase().includes(q) ||
          a.department.toLowerCase().includes(q) ||
          (a.commentsAndEvidence && a.commentsAndEvidence.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }, [actions, showOverdueOnly, statusFilter, priorityFilter, departmentFilter, actionSearch]);

  // Scenario Projection Output
  const projectionResult: ScenarioProjectionResult | null = useMemo(() => {
    if (!baselinePeriod) return null;
    return calculateScenarioProjection(baselinePeriod, scenarioAssumptions);
  }, [baselinePeriod, scenarioAssumptions]);

  // Handlers for Action Register
  const handleOpenAddModal = (initialData?: Partial<ManagementActionItem>) => {
    setEditingActionId(null);
    setModalForm({
      actionDescription: initialData?.actionDescription || '',
      linkedReportOrVariance: initialData?.linkedReportOrVariance || '',
      responsiblePerson: initialData?.responsiblePerson || '',
      department: initialData?.department || 'Finance',
      priority: initialData?.priority || 'High',
      dueDate: initialData?.dueDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      status: initialData?.status || 'Open',
      expectedFinancialImpact: initialData?.expectedFinancialImpact || '',
      actualOutcome: initialData?.actualOutcome || '',
      commentsAndEvidence: initialData?.commentsAndEvidence || ''
    });
    setIsActionModalOpen(true);
  };

  const handleOpenEditModal = (action: ManagementActionItem) => {
    setEditingActionId(action.id);
    setModalForm({
      actionDescription: action.actionDescription,
      linkedReportOrVariance: action.linkedReportOrVariance,
      responsiblePerson: action.responsiblePerson,
      department: action.department,
      priority: action.priority,
      dueDate: action.dueDate,
      status: action.status,
      expectedFinancialImpact: action.expectedFinancialImpact,
      actualOutcome: action.actualOutcome || '',
      commentsAndEvidence: action.commentsAndEvidence
    });
    setIsActionModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalForm.actionDescription.trim()) return;

    const now = new Date().toISOString();

    if (editingActionId) {
      setActions(prev => prev.map(a => {
        if (a.id === editingActionId) {
          return {
            ...a,
            ...modalForm,
            updatedAt: now
          };
        }
        return a;
      }));
    } else {
      const newAction: ManagementActionItem = {
        id: `act-${Date.now().toString(36)}`,
        ...modalForm,
        createdAt: now,
        updatedAt: now
      };
      setActions(prev => [newAction, ...prev]);
    }

    setIsActionModalOpen(false);
  };

  const handleDeleteAction = (id: string) => {
    if (confirm('Are you sure you want to remove this action from the register?')) {
      setActions(prev => prev.filter(a => a.id !== id));
    }
  };

  const handleQuickStatusChange = (id: string, newStatus: ActionStatus) => {
    setActions(prev => prev.map(a => {
      if (a.id === id) {
        return {
          ...a,
          status: newStatus,
          updatedAt: new Date().toISOString()
        };
      }
      return a;
    }));
  };

  // Convert Insight to Action Register
  const handleConvertInsightToAction = (insight: DecisionInsightItem) => {
    handleOpenAddModal({
      actionDescription: insight.recommendedAction,
      linkedReportOrVariance: `${insight.title} (${insight.linkedVarianceOrMetric || insight.category})`,
      department: insight.responsibleDept.split('/')[0].trim() || 'Finance',
      priority: insight.severity === 'critical' ? 'Critical' : insight.severity === 'high' ? 'High' : 'Medium',
      dueDate: insight.suggestedDueDate,
      expectedFinancialImpact: insight.quantitativeImpact,
      commentsAndEvidence: `${insight.context} Evidence: ${insight.evidence}`
    });
    setSubTab('action_register');
  };

  // Preset Scenario Presets
  const applyScenarioPreset = (preset: 'base' | 'growth' | 'stress' | 'cash_crunch') => {
    setSelectedScenarioPreset(preset);
    if (!baselinePeriod) return;
    const baseRev = baselinePeriod.incomeStatement.revenue || 1;
    const baseGp = baselinePeriod.incomeStatement.grossProfit || (baseRev * 0.28);
    const standardGpPct = Number(((baseGp / baseRev) * 100).toFixed(1));

    if (preset === 'growth') {
      setScenarioAssumptions({
        scenarioName: 'Aggressive Growth Case',
        revenueGrowthPct: 22,
        grossMarginPct: Math.min(85, standardGpPct + 2.5),
        opexChangePct: 10,
        dsoDaysChange: -8, // 8-day DSO collection speedup
        dioDaysChange: -4,
        dpoDaysChange: 2,
        taxRatePct: 24,
        capexBudget: Math.round(baseRev * 0.04)
      });
    } else if (preset === 'stress') {
      setScenarioAssumptions({
        scenarioName: 'Severe Stagflation / Downturn',
        revenueGrowthPct: -8,
        grossMarginPct: Math.max(15, standardGpPct - 3.5),
        opexChangePct: 8, // sticky overhead inflation
        dsoDaysChange: 12, // customer collections slow by 12 days
        dioDaysChange: 10, // inventory sits on shelves
        dpoDaysChange: -5, // suppliers demand early payment
        taxRatePct: 24,
        capexBudget: Math.round(baseRev * 0.015)
      });
    } else if (preset === 'cash_crunch') {
      setScenarioAssumptions({
        scenarioName: 'Working Capital Squeeze',
        revenueGrowthPct: 5,
        grossMarginPct: standardGpPct,
        opexChangePct: 4,
        dsoDaysChange: 15, // customers delay paying
        dioDaysChange: 14, // inventory piles up
        dpoDaysChange: -10, // supplier credit terms slashed
        taxRatePct: 24,
        capexBudget: Math.round(baseRev * 0.02)
      });
    } else {
      setScenarioAssumptions(defaultAssumptions);
    }
  };

  // Export Action Register to CSV
  const handleExportActionsCSV = () => {
    const headers = [
      'ID',
      'Action Description',
      'Linked Report / Variance',
      'Responsible Person',
      'Department',
      'Priority',
      'Due Date',
      'Status',
      'Expected Financial Impact',
      'Actual Outcome',
      'Comments & Evidence'
    ];

    const rows = actions.map(a => [
      `"${a.id}"`,
      `"${a.actionDescription.replace(/"/g, '""')}"`,
      `"${a.linkedReportOrVariance.replace(/"/g, '""')}"`,
      `"${a.responsiblePerson.replace(/"/g, '""')}"`,
      `"${a.department}"`,
      `"${a.priority}"`,
      `"${a.dueDate}"`,
      `"${a.status}"`,
      `"${(a.expectedFinancialImpact || '').replace(/"/g, '""')}"`,
      `"${(a.actualOutcome || '').replace(/"/g, '""')}"`,
      `"${(a.commentsAndEvidence || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `FinScope_Action_Register_${profile.companyName.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 text-left animate-fade-in" id="management-decision-support-root">
      
      {/* Module Header & High-Level Navigation */}
      <div className="border-b border-[#E8E2D8] pb-5 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono font-bold tracking-[0.25em] text-[#D4A347] uppercase block mb-1">
            PHASE 7 · MANAGEMENT DECISION SUPPORT & ACTION REGISTER
          </span>
          <h1 className="font-serif-display text-2xl sm:text-3xl lg:text-4xl font-bold text-[#0B192C]">
            CFO Decision Support Workspace
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
            Translate financial findings and variances into executive decisions, prioritize interventions, assign accountability in the action register, and stress-test forward scenarios for <span className="font-bold text-[#0B192C]">{profile.companyName}</span>.
          </p>
        </div>

        {/* View Mode Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-white border border-[#E8E2D8] rounded-xl shadow-xs shrink-0">
          <button
            type="button"
            onClick={() => setSubTab('decision_intelligence')}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              subTab === 'decision_intelligence'
                ? 'bg-[#0B1530] text-white shadow-xs'
                : 'text-slate-600 hover:text-[#0B192C] hover:bg-[#FAF7F2]'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-[#D6AE55]" />
            <span>Decision Intelligence</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('action_register')}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 relative ${
              subTab === 'action_register'
                ? 'bg-[#0B1530] text-white shadow-xs'
                : 'text-slate-600 hover:text-[#0B192C] hover:bg-[#FAF7F2]'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-[#D6AE55]" />
            <span>Action Register</span>
            {actionStats.overdueCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-red-500 text-white text-[10px] font-mono font-black rounded-full">
                {actionStats.overdueCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setSubTab('scenario_planner')}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              subTab === 'scenario_planner'
                ? 'bg-[#0B1530] text-white shadow-xs'
                : 'text-slate-600 hover:text-[#0B192C] hover:bg-[#FAF7F2]'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-[#D6AE55]" />
            <span>Scenario Planner</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUB-VIEW 1: EXECUTIVE DECISION INTELLIGENCE                              */}
      {/* ========================================================================= */}
      {subTab === 'decision_intelligence' && (
        <div className="space-y-6">
          
          {/* Executive Overview Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E8E2D8] shadow-xs">
              <span className="text-[10px] font-mono uppercase text-slate-400 block">Critical Decisions</span>
              <div className="text-2xl font-bold font-serif-display text-rose-700 mt-1">
                {decisionInsights.filter(i => i.severity === 'critical').length} Urgent
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">Requiring board/CFO resolution</p>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E8E2D8] shadow-xs">
              <span className="text-[10px] font-mono uppercase text-slate-400 block">Identified Opportunities</span>
              <div className="text-2xl font-bold font-serif-display text-emerald-800 mt-1">
                {decisionInsights.filter(i => i.category === 'profitability_opportunity' || i.category === 'cost_reduction' || i.category === 'working_capital').length} Areas
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">Margin & working capital gains</p>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E8E2D8] shadow-xs">
              <span className="text-[10px] font-mono uppercase text-slate-400 block">Action Register Backlog</span>
              <div className="text-2xl font-bold font-serif-display text-[#0B192C] mt-1">
                {actionStats.openCount + actionStats.inProgressCount} Active
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {actionStats.overdueCount > 0 ? (
                  <span className="text-red-600 font-bold">{actionStats.overdueCount} overdue actions</span>
                ) : (
                  'All items on track'
                )}
              </p>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E8E2D8] shadow-xs">
              <span className="text-[10px] font-mono uppercase text-slate-400 block">Baseline Period</span>
              <div className="text-xl font-bold font-mono text-[#0B192C] mt-1 truncate">
                {baselinePeriod?.period || 'Current'}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">{profile.reportingBasis || 'IFRS'} Standard</p>
            </div>
          </div>

          {/* Decision Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
            <span className="text-xs font-mono text-slate-400 shrink-0">Focus Area:</span>
            {[
              { id: 'All', label: 'All Insights (9)' },
              { id: 'attention', label: '1. Key Decisions Requiring Attention' },
              { id: 'financial_risk', label: '2. High-Priority Risks' },
              { id: 'adverse_variance', label: '3. Adverse Variances' },
              { id: 'cash_flow_pressure', label: '4. Cash Flow Pressure' },
              { id: 'profitability_opportunity', label: '5. Profitability Opportunities' },
              { id: 'cost_reduction', label: '6. Cost Reduction' },
              { id: 'working_capital', label: '7. Working Capital' },
              { id: 'forecast_risk', label: '8. Forecast Risks' },
              { id: 'next_action', label: '9. Recommended Actions' }
            ].map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedDecisionCategory(cat.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap cursor-pointer transition-colors ${
                  selectedDecisionCategory === cat.id
                    ? 'bg-[#0B1530] text-white shadow-xs'
                    : 'bg-white border border-[#E8E2D8] text-slate-600 hover:text-[#0B192C]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Insight Cards Grid */}
          <div className="space-y-4">
            {filteredInsights.map(insight => {
              const isCrit = insight.severity === 'critical';
              const isHigh = insight.severity === 'high';

              return (
                <div 
                  key={insight.id}
                  className={`bg-white border rounded-2xl p-6 transition-all shadow-xs ${
                    isCrit ? 'border-red-300 ring-1 ring-red-100' : isHigh ? 'border-amber-200' : 'border-[#E8E2D8]'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      
                      {/* Badge Row */}
                      <div className="flex items-center gap-2 flex-wrap text-xs">
                        <span className={`px-2 py-0.5 font-mono text-[10px] font-bold rounded uppercase ${
                          isCrit 
                            ? 'bg-red-100 text-red-800' 
                            : isHigh 
                            ? 'bg-amber-100 text-amber-800' 
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {insight.severity} Priority
                        </span>
                        
                        <span className="text-slate-400">·</span>
                        
                        <span className="font-mono text-slate-500 capitalize">
                          {insight.category.replace(/_/g, ' ')}
                        </span>

                        {insight.linkedVarianceOrMetric && (
                          <>
                            <span className="text-slate-400">·</span>
                            <span className="font-mono text-[#0B1530] font-semibold bg-[#FAF7F2] px-2 py-0.5 rounded border border-[#E8E2D8]">
                              {insight.linkedVarianceOrMetric}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="font-serif-display text-lg font-bold text-[#0B192C]">
                        {insight.title}
                      </h3>

                      {/* Context & Description */}
                      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                        {insight.context}
                      </p>

                      {/* Quantitative Impact Box */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        <div className="p-3 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-xs">
                          <span className="text-[10px] font-mono uppercase text-slate-400 block">Financial Consequence / Impact</span>
                          <span className="font-bold text-[#0B192C] font-mono text-sm mt-0.5 block">
                            {insight.quantitativeImpact}
                          </span>
                        </div>

                        <div className="p-3 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-xs">
                          <span className="text-[10px] font-mono uppercase text-slate-400 block">Supporting Empirical Evidence</span>
                          <span className="text-slate-600 mt-0.5 block leading-tight">
                            {insight.evidence}
                          </span>
                        </div>
                      </div>

                      {/* Recommendation Box */}
                      <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-900 mt-2 flex items-start gap-2.5">
                        <Sparkles className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                        <div>
                          <strong className="font-bold">Recommended Executive Directive: </strong>
                          <span>{insight.recommendedAction}</span>
                          <div className="flex items-center gap-3 text-[11px] text-amber-800 mt-1 font-mono">
                            <span>Responsible Dept: <strong>{insight.responsibleDept}</strong></span>
                            <span>·</span>
                            <span>Target Horizon: <strong>{insight.suggestedDueDate}</strong></span>
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* Action Side-Button */}
                    <div className="shrink-0 flex flex-col gap-2 pt-2 md:pt-0">
                      <button
                        type="button"
                        onClick={() => handleConvertInsightToAction(insight)}
                        className="px-4 py-2.5 bg-[#0B1530] hover:bg-[#122338] text-white text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5 text-[#D6AE55]" />
                        <span>Log in Action Register</span>
                      </button>

                      {onNavigateToVariance && (
                        <button
                          type="button"
                          onClick={onNavigateToVariance}
                          className="px-4 py-2 bg-white hover:bg-[#FAF7F2] text-[#0B192C] border border-[#E8E2D8] text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                        >
                          <span>Inspect Variances</span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 2: MANAGEMENT ACTION REGISTER                                   */}
      {/* ========================================================================= */}
      {subTab === 'action_register' && (
        <div className="space-y-6">
          
          {/* Action Register Control Bar */}
          <div className="bg-white border border-[#E8E2D8] rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-serif-display text-lg font-bold text-[#0B192C]">
                  Executive Action & Accountability Register
                </h3>
                <p className="text-xs text-slate-500">
                  Track governance decisions, assign departmental ownership, establish deadlines, and record verified outcomes.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleExportActionsCSV}
                  className="px-3.5 py-2 bg-white hover:bg-[#FAF7F2] text-slate-700 text-xs font-semibold rounded-xl border border-[#E8E2D8] flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenAddModal()}
                  className="px-4 py-2 bg-[#D6AE55] hover:bg-[#C59B42] text-[#0B1530] text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Action Item</span>
                </button>
              </div>
            </div>

            {/* Quick Filter / Search Ribbon */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-3 border-t border-[#E8E2D8]">
              {/* Search */}
              <div className="relative lg:col-span-2">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search actions, owners, reports..."
                  value={actionSearch}
                  onChange={e => setActionSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl focus:outline-hidden focus:border-[#D6AE55]"
                />
              </div>

              {/* Status Filter */}
              <div>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl focus:outline-hidden focus:border-[#D6AE55]"
                >
                  <option value="All">All Statuses</option>
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Awaiting Approval">Awaiting Approval</option>
                  <option value="Completed">Completed</option>
                  <option value="Deferred">Deferred</option>
                </select>
              </div>

              {/* Priority Filter */}
              <div>
                <select
                  value={priorityFilter}
                  onChange={e => setPriorityFilter(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl focus:outline-hidden focus:border-[#D6AE55]"
                >
                  <option value="All">All Priorities</option>
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              {/* Overdue Toggle */}
              <button
                type="button"
                onClick={() => setShowOverdueOnly(!showOverdueOnly)}
                className={`w-full px-3 py-2 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                  showOverdueOnly 
                    ? 'bg-red-700 text-white border-red-700 shadow-xs' 
                    : 'bg-[#FAF7F2] text-slate-700 border-[#E8E2D8] hover:bg-white'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Overdue Only ({actionStats.overdueCount})</span>
              </button>
            </div>
          </div>

          {/* Action Items List Table / Cards */}
          <div className="bg-white border border-[#E8E2D8] rounded-2xl shadow-xs overflow-hidden">
            {filteredActions.length > 0 ? (
              <div className="divide-y divide-[#E8E2D8]">
                {filteredActions.map(action => {
                  const dueStatus = getActionDueStatus(action.dueDate, action.status);

                  return (
                    <div key={action.id} className="p-5 hover:bg-[#FAF7F2]/50 transition-colors">
                      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                        
                        {/* Left Main Content */}
                        <div className="space-y-2 flex-1">
                          
                          {/* Top Tag Row */}
                          <div className="flex items-center gap-2 flex-wrap text-xs">
                            {/* Priority Badge */}
                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                              action.priority === 'Critical' 
                                ? 'bg-red-100 text-red-800' 
                                : action.priority === 'High' 
                                ? 'bg-amber-100 text-amber-800' 
                                : 'bg-slate-100 text-slate-700'
                            }`}>
                              {action.priority} Priority
                            </span>

                            {/* Status Selector Dropdown */}
                            <select
                              value={action.status}
                              onChange={e => handleQuickStatusChange(action.id, e.target.value as ActionStatus)}
                              className={`px-2 py-0.5 text-xs font-semibold rounded border cursor-pointer ${
                                action.status === 'Completed'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                  : action.status === 'In Progress'
                                  ? 'bg-sky-50 text-sky-800 border-sky-300'
                                  : action.status === 'Awaiting Approval'
                                  ? 'bg-purple-50 text-purple-800 border-purple-300'
                                  : action.status === 'Deferred'
                                  ? 'bg-slate-100 text-slate-600 border-slate-300'
                                  : 'bg-amber-50 text-amber-800 border-amber-300'
                              }`}
                            >
                              <option value="Open">Status: Open</option>
                              <option value="In Progress">Status: In Progress</option>
                              <option value="Awaiting Approval">Status: Awaiting Approval</option>
                              <option value="Completed">Status: Completed</option>
                              <option value="Deferred">Status: Deferred</option>
                            </select>

                            {/* Due Date & Overdue Tag */}
                            <span className={`px-2 py-0.5 text-xs rounded border flex items-center gap-1 ${dueStatus.badgeClass}`}>
                              <Clock className="w-3 h-3" />
                              <span>{action.dueDate} ({dueStatus.label})</span>
                            </span>

                            <span className="text-slate-400">·</span>

                            {/* Department */}
                            <span className="font-mono text-slate-600 text-xs">
                              Dept: <strong className="text-[#0B192C]">{action.department}</strong>
                            </span>
                          </div>

                          {/* Action Description */}
                          <h4 className="font-serif-display text-base sm:text-lg font-bold text-[#0B192C]">
                            {action.actionDescription}
                          </h4>

                          {/* Linked Report / Variance */}
                          {action.linkedReportOrVariance && (
                            <div className="flex items-center gap-1.5 text-xs text-slate-600">
                              <span className="text-slate-400 font-mono text-[10px] uppercase">Linked Trigger:</span>
                              <span className="font-semibold text-[#0B1530] bg-[#FAF7F2] px-2 py-0.5 rounded border border-[#E8E2D8]">
                                {action.linkedReportOrVariance}
                              </span>
                            </div>
                          )}

                          {/* Impact & Outcome Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                            <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#E8E2D8] text-xs">
                              <span className="text-[10px] font-mono uppercase text-slate-400 block">Expected Financial Impact</span>
                              <span className="font-semibold text-[#0B192C] mt-0.5 block">
                                {action.expectedFinancialImpact || 'To be quantified'}
                              </span>
                            </div>

                            <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#E8E2D8] text-xs">
                              <span className="text-[10px] font-mono uppercase text-slate-400 block">Actual Outcome / Progress</span>
                              <span className={`mt-0.5 block ${action.actualOutcome ? 'text-emerald-800 font-medium' : 'text-slate-400 italic'}`}>
                                {action.actualOutcome || 'Pending execution results'}
                              </span>
                            </div>
                          </div>

                          {/* Supporting Evidence / Notes */}
                          {action.commentsAndEvidence && (
                            <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
                              <strong className="text-slate-700">Governance Notes & Evidence: </strong>
                              {action.commentsAndEvidence}
                            </p>
                          )}

                          {/* Responsible Person */}
                          <div className="flex items-center gap-2 text-xs text-slate-500 pt-1 font-mono">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span>Assigned Owner: <strong className="text-[#0B192C]">{action.responsiblePerson || 'Unassigned'}</strong></span>
                          </div>

                        </div>

                        {/* Right Quick Controls */}
                        <div className="flex lg:flex-col items-center gap-2 shrink-0 pt-2 lg:pt-0">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(action)}
                            className="p-2 text-slate-500 hover:text-[#0B192C] hover:bg-[#FAF7F2] rounded-lg transition-colors cursor-pointer border border-[#E8E2D8]"
                            title="Edit action item"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteAction(action.id)}
                            className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer border border-rose-200"
                            title="Delete action item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-12 text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-slate-300 mx-auto" />
                <h4 className="font-bold text-sm text-[#0B192C]">No Actions Match Current Filter</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Try adjusting the status or search keyword, or log a new intervention from the Decision Intelligence tab.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter('All');
                    setPriorityFilter('All');
                    setShowOverdueOnly(false);
                    setActionSearch('');
                  }}
                  className="px-4 py-2 bg-[#FAF7F2] hover:bg-white text-xs font-semibold text-[#0B192C] border border-[#E8E2D8] rounded-xl cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 3: FORECAST & SCENARIO PLANNING MODULE                          */}
      {/* ========================================================================= */}
      {subTab === 'scenario_planner' && (
        <div className="space-y-6">

          {/* Mandatory Estimate Disclaimer Banner */}
          <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex items-start gap-3 text-amber-950 shadow-xs">
            <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <span className="font-bold font-mono uppercase tracking-wider text-amber-900 block">
                STATUTORY ESTIMATE & PROJECTION NOTICE
              </span>
              <p className="leading-relaxed">
                Scenario outputs and sensitivity curves displayed in this workspace are <strong>mathematical estimates and exploratory forward-looking simulations</strong> based on user-configured levers. They do <strong>not</strong> constitute guaranteed corporate outcomes, audited financial statements, or committed forecasts.
              </p>
            </div>
          </div>

          {/* Scenario Planner Header & Preset Selection */}
          <div className="bg-white border border-[#E8E2D8] rounded-2xl p-6 shadow-xs space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E8E2D8] pb-5">
              <div>
                <h3 className="font-serif-display text-xl font-bold text-[#0B192C]">
                  Multi-Factor Financial Scenario Simulator
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Simulate concurrent shifts in revenue growth, gross margins, overheads, and working capital cash velocity.
                </p>
              </div>

              {/* Scenario Presets */}
              <div className="flex items-center gap-1.5 p-1 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl shrink-0">
                <span className="text-[11px] font-mono text-slate-400 px-2">Presets:</span>
                <button
                  type="button"
                  onClick={() => applyScenarioPreset('stress')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    selectedScenarioPreset === 'stress' ? 'bg-rose-900 text-white' : 'text-slate-600 hover:text-rose-700'
                  }`}
                >
                  Stagflation Bear
                </button>
                <button
                  type="button"
                  onClick={() => applyScenarioPreset('cash_crunch')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    selectedScenarioPreset === 'cash_crunch' ? 'bg-amber-800 text-white' : 'text-slate-600 hover:text-amber-800'
                  }`}
                >
                  Working Capital Squeeze
                </button>
                <button
                  type="button"
                  onClick={() => applyScenarioPreset('base')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    selectedScenarioPreset === 'base' ? 'bg-[#0B1530] text-white' : 'text-slate-600 hover:text-[#0B192C]'
                  }`}
                >
                  Base Case
                </button>
                <button
                  type="button"
                  onClick={() => applyScenarioPreset('growth')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    selectedScenarioPreset === 'growth' ? 'bg-emerald-800 text-white' : 'text-slate-600 hover:text-emerald-800'
                  }`}
                >
                  Bull Expansion
                </button>
              </div>
            </div>

            {/* Assumption Control Sliders */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Lever 1: Revenue Growth */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-700">Revenue Growth</label>
                  <span className={`text-xs font-mono font-bold ${scenarioAssumptions.revenueGrowthPct >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {scenarioAssumptions.revenueGrowthPct >= 0 ? `+${scenarioAssumptions.revenueGrowthPct}%` : `${scenarioAssumptions.revenueGrowthPct}%`}
                  </span>
                </div>
                <input
                  type="range"
                  min="-25"
                  max="40"
                  step="1"
                  value={scenarioAssumptions.revenueGrowthPct}
                  onChange={e => setScenarioAssumptions({ ...scenarioAssumptions, revenueGrowthPct: Number(e.target.value) })}
                  className="w-full accent-[#0B1530] cursor-pointer"
                />
                <p className="text-[10px] text-slate-500 font-mono">Organic demand & pricing elasticity</p>
              </div>

              {/* Lever 2: Gross Margin % */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-700">Target Gross Margin</label>
                  <span className="text-xs font-mono font-bold text-[#0B192C]">
                    {scenarioAssumptions.grossMarginPct}%
                  </span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="65"
                  step="0.5"
                  value={scenarioAssumptions.grossMarginPct}
                  onChange={e => setScenarioAssumptions({ ...scenarioAssumptions, grossMarginPct: Number(e.target.value) })}
                  className="w-full accent-[#0B1530] cursor-pointer"
                />
                <p className="text-[10px] text-slate-500 font-mono">Input costs & product margin mix</p>
              </div>

              {/* Lever 3: OpEx Inflation */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-700">OpEx Escalation</label>
                  <span className={`text-xs font-mono font-bold ${scenarioAssumptions.opexChangePct > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                    {scenarioAssumptions.opexChangePct >= 0 ? `+${scenarioAssumptions.opexChangePct}%` : `${scenarioAssumptions.opexChangePct}%`}
                  </span>
                </div>
                <input
                  type="range"
                  min="-15"
                  max="25"
                  step="1"
                  value={scenarioAssumptions.opexChangePct}
                  onChange={e => setScenarioAssumptions({ ...scenarioAssumptions, opexChangePct: Number(e.target.value) })}
                  className="w-full accent-[#0B1530] cursor-pointer"
                />
                <p className="text-[10px] text-slate-500 font-mono">Payroll, rent, technology & SG&A</p>
              </div>

              {/* Lever 4: DSO Collection Shift (Days) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-700">Collection Period (DSO Shift)</label>
                  <span className={`text-xs font-mono font-bold ${scenarioAssumptions.dsoDaysChange <= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {scenarioAssumptions.dsoDaysChange > 0 ? `+${scenarioAssumptions.dsoDaysChange} days` : `${scenarioAssumptions.dsoDaysChange} days`}
                  </span>
                </div>
                <input
                  type="range"
                  min="-20"
                  max="25"
                  step="1"
                  value={scenarioAssumptions.dsoDaysChange}
                  onChange={e => setScenarioAssumptions({ ...scenarioAssumptions, dsoDaysChange: Number(e.target.value) })}
                  className="w-full accent-[#0B1530] cursor-pointer"
                />
                <p className="text-[10px] text-slate-500 font-mono">Customer collection acceleration</p>
              </div>

            </div>

            {/* Working Capital Levers Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 border-t border-[#E8E2D8]">
              {/* Inventory Holding DIO */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-700">Inventory Holding (DIO Shift)</label>
                  <span className="text-xs font-mono font-bold text-[#0B192C]">
                    {scenarioAssumptions.dioDaysChange >= 0 ? `+${scenarioAssumptions.dioDaysChange}d` : `${scenarioAssumptions.dioDaysChange}d`}
                  </span>
                </div>
                <input
                  type="range"
                  min="-15"
                  max="20"
                  step="1"
                  value={scenarioAssumptions.dioDaysChange}
                  onChange={e => setScenarioAssumptions({ ...scenarioAssumptions, dioDaysChange: Number(e.target.value) })}
                  className="w-full accent-[#0B1530] cursor-pointer"
                />
                <p className="text-[10px] text-slate-500 font-mono">Supply chain stock turnover buffer</p>
              </div>

              {/* Payables Stretch DPO */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-700">Payables Stretch (DPO Shift)</label>
                  <span className="text-xs font-mono font-bold text-[#0B192C]">
                    {scenarioAssumptions.dpoDaysChange >= 0 ? `+${scenarioAssumptions.dpoDaysChange}d` : `${scenarioAssumptions.dpoDaysChange}d`}
                  </span>
                </div>
                <input
                  type="range"
                  min="-15"
                  max="20"
                  step="1"
                  value={scenarioAssumptions.dpoDaysChange}
                  onChange={e => setScenarioAssumptions({ ...scenarioAssumptions, dpoDaysChange: Number(e.target.value) })}
                  className="w-full accent-[#0B1530] cursor-pointer"
                />
                <p className="text-[10px] text-slate-500 font-mono">Supplier credit terms utilization</p>
              </div>

              {/* CapEx Budget */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-700">Annual CapEx Envelope</label>
                  <span className="text-xs font-mono font-bold text-[#0B192C]">
                    {curSymbol}{scenarioAssumptions.capexBudget.toLocaleString()}
                  </span>
                </div>
                <input
                  type="range"
                  min="50000"
                  max="1000000"
                  step="25000"
                  value={scenarioAssumptions.capexBudget}
                  onChange={e => setScenarioAssumptions({ ...scenarioAssumptions, capexBudget: Number(e.target.value) })}
                  className="w-full accent-[#0B1530] cursor-pointer"
                />
                <p className="text-[10px] text-slate-500 font-mono">Discretionary capital investments</p>
              </div>
            </div>
          </div>

          {/* Scenario Comparison & Projected P&L / Cash Statement */}
          {projectionResult && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Projected Profitability Statement */}
              <div className="lg:col-span-2 bg-white border border-[#E8E2D8] rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-[#E8E2D8] pb-3">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-[#D6AE55]" />
                    <h4 className="font-serif-display font-bold text-base text-[#0B192C]">
                      Projected Income Statement ({scenarioAssumptions.scenarioName})
                    </h4>
                  </div>
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-mono font-bold rounded">
                    ESTIMATE ONLY
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-[#E8E2D8] text-slate-400 font-mono text-[10px] uppercase">
                        <th className="py-2 text-left">P&L Metric</th>
                        <th className="py-2 text-right">Actual Baseline ({projectionResult.baselinePeriod})</th>
                        <th className="py-2 text-right">Projected Scenario</th>
                        <th className="py-2 text-right">Delta ($ / %)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8E2D8] font-mono">
                      <tr>
                        <td className="py-2.5 font-sans font-bold text-[#0B192C]">Gross Revenue</td>
                        <td className="py-2.5 text-right">{curSymbol}{projectionResult.baselineRevenue.toLocaleString()}</td>
                        <td className="py-2.5 text-right font-bold text-[#0B192C]">{curSymbol}{projectionResult.projectedRevenue.toLocaleString()}</td>
                        <td className={`py-2.5 text-right font-bold ${projectionResult.revenueDelta >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {projectionResult.revenueDelta >= 0 ? '+' : ''}{curSymbol}{projectionResult.revenueDelta.toLocaleString()} ({scenarioAssumptions.revenueGrowthPct}%)
                        </td>
                      </tr>

                      <tr>
                        <td className="py-2.5 font-sans font-bold text-[#0B192C]">Gross Profit</td>
                        <td className="py-2.5 text-right">
                          {curSymbol}{Math.round(projectionResult.baselineRevenue * 0.28).toLocaleString()}
                        </td>
                        <td className="py-2.5 text-right font-bold text-[#0B192C]">{curSymbol}{projectionResult.projectedGrossProfit.toLocaleString()}</td>
                        <td className="py-2.5 text-right text-slate-600 font-bold">
                          Margin: {projectionResult.projectedGrossMarginPct}%
                        </td>
                      </tr>

                      <tr>
                        <td className="py-2.5 font-sans text-slate-700">Total Operating Expenses (OpEx)</td>
                        <td className="py-2.5 text-right">
                          {curSymbol}{Math.round(projectionResult.baselineRevenue * 0.18).toLocaleString()}
                        </td>
                        <td className="py-2.5 text-right font-bold text-slate-700">{curSymbol}{projectionResult.projectedOpex.toLocaleString()}</td>
                        <td className="py-2.5 text-right text-slate-500">
                          {scenarioAssumptions.opexChangePct >= 0 ? `+${scenarioAssumptions.opexChangePct}%` : `${scenarioAssumptions.opexChangePct}%`}
                        </td>
                      </tr>

                      <tr className="bg-[#FAF7F2]/60 font-bold">
                        <td className="py-2.5 font-sans text-[#0B192C]">Operating Income (EBIT)</td>
                        <td className="py-2.5 text-right">
                          {curSymbol}{Math.round(projectionResult.baselineRevenue * 0.10).toLocaleString()}
                        </td>
                        <td className="py-2.5 text-right text-[#0B192C]">{curSymbol}{projectionResult.projectedOperatingProfit.toLocaleString()}</td>
                        <td className={`py-2.5 text-right ${projectionResult.projectedOperatingProfit > 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {((projectionResult.projectedOperatingProfit / projectionResult.projectedRevenue) * 100).toFixed(1)}% EBIT Margin
                        </td>
                      </tr>

                      <tr className="bg-amber-50/40 font-bold">
                        <td className="py-2.5 font-sans text-amber-900">Projected Net Income</td>
                        <td className="py-2.5 text-right">
                          {curSymbol}{Math.round(projectionResult.baselineRevenue * 0.075).toLocaleString()}
                        </td>
                        <td className="py-2.5 text-right text-amber-900">{curSymbol}{projectionResult.projectedNetIncome.toLocaleString()}</td>
                        <td className="py-2.5 text-right text-amber-800">
                          {projectionResult.projectedNetMarginPct}% Net Margin
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Scenario Action Conversion */}
                <div className="pt-2 flex items-center justify-between border-t border-[#E8E2D8]">
                  <span className="text-[11px] text-slate-500 italic">
                    Want to protect or execute this plan?
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      handleOpenAddModal({
                        actionDescription: `Execute Strategic Financial Plan: ${scenarioAssumptions.scenarioName}`,
                        linkedReportOrVariance: `Scenario Plan: Growth ${scenarioAssumptions.revenueGrowthPct}%, Margin ${scenarioAssumptions.grossMarginPct}%`,
                        department: 'Executive',
                        priority: 'High',
                        expectedFinancialImpact: `${curSymbol}${projectionResult.projectedNetIncome.toLocaleString()} projected net profit`,
                        commentsAndEvidence: `Simulation based on DSO ${projectionResult.projectedDSO}d, OpEx ${scenarioAssumptions.opexChangePct}%.`
                      });
                      setSubTab('action_register');
                    }}
                    className="px-3.5 py-1.5 bg-[#0B1530] hover:bg-[#122338] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#D6AE55]" />
                    <span>Create Action from Scenario</span>
                  </button>
                </div>
              </div>

              {/* Working Capital & Cash Generation Waterfall Card */}
              <div className="bg-white border border-[#E8E2D8] rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-[#E8E2D8] pb-3">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-700" />
                    <h4 className="font-serif-display font-bold text-base text-[#0B192C]">
                      Working Capital & Cash Flow
                    </h4>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold rounded">
                    LIQUIDITY
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  {/* Working capital metrics */}
                  <div className="grid grid-cols-3 gap-2 text-center bg-[#FAF7F2] p-3 rounded-xl border border-[#E8E2D8]">
                    <div>
                      <span className="text-[10px] text-slate-400 font-mono uppercase block">DSO</span>
                      <span className="font-mono font-bold text-[#0B192C]">{projectionResult.projectedDSO}d</span>
                      <span className="text-[9px] text-slate-500 block">({projectionResult.baselineDSO}d base)</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-mono uppercase block">DIO</span>
                      <span className="font-mono font-bold text-[#0B192C]">{projectionResult.projectedDIO}d</span>
                      <span className="text-[9px] text-slate-500 block">({projectionResult.baselineDIO}d base)</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-mono uppercase block">DPO</span>
                      <span className="font-mono font-bold text-[#0B192C]">{projectionResult.projectedDPO}d</span>
                      <span className="text-[9px] text-slate-500 block">({projectionResult.baselineDPO}d base)</span>
                    </div>
                  </div>

                  {/* Cash Conversion Cycle */}
                  <div className="p-3 bg-white border border-[#E8E2D8] rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-slate-400 block">Projected Cash Conversion Cycle</span>
                      <span className="font-bold text-sm text-[#0B192C]">{projectionResult.projectedCCC} Days</span>
                    </div>
                    <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                      projectionResult.projectedCCC < projectionResult.baselineCCC ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {projectionResult.projectedCCC - projectionResult.baselineCCC >= 0 ? '+' : ''}{projectionResult.projectedCCC - projectionResult.baselineCCC}d delta
                    </span>
                  </div>

                  {/* Working Capital Release / Absorption */}
                  <div className="p-3 bg-white border border-[#E8E2D8] rounded-xl space-y-1">
                    <span className="text-[10px] font-mono uppercase text-slate-400 block">Working Capital Cash Effect</span>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#0B192C]">
                        {projectionResult.workingCapitalCashReleaseOrAbsorb >= 0 ? 'Cash Released' : 'Cash Absorbed'}
                      </span>
                      <span className={`font-mono font-bold ${
                        projectionResult.workingCapitalCashReleaseOrAbsorb >= 0 ? 'text-emerald-700' : 'text-rose-700'
                      }`}>
                        {projectionResult.workingCapitalCashReleaseOrAbsorb >= 0 ? '+' : ''}{curSymbol}{projectionResult.workingCapitalCashReleaseOrAbsorb.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500">
                      Impact of customer collection speed and vendor terms.
                    </p>
                  </div>

                  {/* Operating Cash Flow */}
                  <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-1">
                    <span className="text-[10px] font-mono uppercase text-emerald-800 block">Projected Operating Cash Flow</span>
                    <div className="text-xl font-bold font-mono text-emerald-900">
                      {curSymbol}{projectionResult.projectedOperatingCashFlow.toLocaleString()}
                    </div>
                    <p className="text-[10px] text-emerald-700">
                      EBIT + Depreciation + Working Capital effect - Taxes
                    </p>
                  </div>

                  {/* Projected Cash Balance after CapEx */}
                  <div className="p-3 bg-[#0B1530] text-white rounded-xl space-y-1">
                    <span className="text-[10px] font-mono uppercase text-slate-400 block">Estimated Year-End Cash Position</span>
                    <div className="text-xl font-bold font-mono text-[#D6AE55]">
                      {curSymbol}{projectionResult.projectedEndingCash.toLocaleString()}
                    </div>
                    <p className="text-[10px] text-slate-300">
                      After funding {curSymbol}{scenarioAssumptions.capexBudget.toLocaleString()} CapEx.
                    </p>
                  </div>

                </div>
              </div>

            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT MANAGEMENT ACTION ITEM                                 */}
      {/* ========================================================================= */}
      {isActionModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-[#E8E2D8] shadow-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 animate-scale-in text-left">
            
            <div className="flex items-center justify-between border-b border-[#E8E2D8] pb-4">
              <div>
                <h3 className="font-serif-display text-xl font-bold text-[#0B192C]">
                  {editingActionId ? 'Edit Management Action Item' : 'Create New Management Action Item'}
                </h3>
                <p className="text-xs text-slate-500">
                  Document the intervention, assign ownership, and define the expected financial outcome.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsActionModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-4 text-xs">
              
              {/* Action Description */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">Action Description *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="e.g., Audit customer payment terms and enforce 30-day billing milestones..."
                  value={modalForm.actionDescription}
                  onChange={e => setModalForm({ ...modalForm, actionDescription: e.target.value })}
                  className="w-full p-3 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl focus:outline-hidden focus:border-[#D6AE55]"
                />
              </div>

              {/* Linked Report / Variance */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">Linked Financial Finding / Variance</label>
                <input
                  type="text"
                  placeholder="e.g., Working Capital DSO Stretch or Cloud IT Budget Overrun"
                  value={modalForm.linkedReportOrVariance}
                  onChange={e => setModalForm({ ...modalForm, linkedReportOrVariance: e.target.value })}
                  className="w-full p-2.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl focus:outline-hidden focus:border-[#D6AE55]"
                />
              </div>

              {/* Owner & Department */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">Responsible Person *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Sarah Jenkins (VP Credit)"
                    value={modalForm.responsiblePerson}
                    onChange={e => setModalForm({ ...modalForm, responsiblePerson: e.target.value })}
                    className="w-full p-2.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl focus:outline-hidden focus:border-[#D6AE55]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">Department *</label>
                  <select
                    value={modalForm.department}
                    onChange={e => setModalForm({ ...modalForm, department: e.target.value })}
                    className="w-full p-2.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl focus:outline-hidden focus:border-[#D6AE55]"
                  >
                    <option value="Finance">Finance / Treasury</option>
                    <option value="Executive">Executive / Board</option>
                    <option value="Sales">Sales / Commercial</option>
                    <option value="Operations">Operations / Supply Chain</option>
                    <option value="Procurement">Procurement</option>
                    <option value="Engineering">Engineering / IT</option>
                    <option value="HR">Human Resources</option>
                  </select>
                </div>
              </div>

              {/* Priority, Due Date & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">Priority</label>
                  <select
                    value={modalForm.priority}
                    onChange={e => setModalForm({ ...modalForm, priority: e.target.value as ActionPriority })}
                    className="w-full p-2.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl focus:outline-hidden focus:border-[#D6AE55]"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">Due Date *</label>
                  <input
                    type="date"
                    required
                    value={modalForm.dueDate}
                    onChange={e => setModalForm({ ...modalForm, dueDate: e.target.value })}
                    className="w-full p-2.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl focus:outline-hidden focus:border-[#D6AE55]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">Status</label>
                  <select
                    value={modalForm.status}
                    onChange={e => setModalForm({ ...modalForm, status: e.target.value as ActionStatus })}
                    className="w-full p-2.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl focus:outline-hidden focus:border-[#D6AE55]"
                  >
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Awaiting Approval">Awaiting Approval</option>
                    <option value="Completed">Completed</option>
                    <option value="Deferred">Deferred</option>
                  </select>
                </div>
              </div>

              {/* Expected Impact & Actual Outcome */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">Expected Financial Impact</label>
                  <input
                    type="text"
                    placeholder="e.g., $150,000 cash recovery within 30 days"
                    value={modalForm.expectedFinancialImpact}
                    onChange={e => setModalForm({ ...modalForm, expectedFinancialImpact: e.target.value })}
                    className="w-full p-2.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl focus:outline-hidden focus:border-[#D6AE55]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">Actual Outcome</label>
                  <input
                    type="text"
                    placeholder="e.g., Collected $85,000; terms updated"
                    value={modalForm.actualOutcome}
                    onChange={e => setModalForm({ ...modalForm, actualOutcome: e.target.value })}
                    className="w-full p-2.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl focus:outline-hidden focus:border-[#D6AE55]"
                  />
                </div>
              </div>

              {/* Comments & Supporting Evidence */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">Comments and Supporting Evidence</label>
                <textarea
                  rows={2}
                  placeholder="Supporting audit trails, agreement references, or board rationale..."
                  value={modalForm.commentsAndEvidence}
                  onChange={e => setModalForm({ ...modalForm, commentsAndEvidence: e.target.value })}
                  className="w-full p-3 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl focus:outline-hidden focus:border-[#D6AE55]"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E8E2D8]">
                <button
                  type="button"
                  onClick={() => setIsActionModalOpen(false)}
                  className="px-4 py-2 bg-[#FAF7F2] hover:bg-white text-slate-600 font-semibold rounded-xl border border-[#E8E2D8] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#D6AE55] hover:bg-[#C59B42] text-[#0B1530] font-bold rounded-xl shadow-xs cursor-pointer transition-colors"
                >
                  {editingActionId ? 'Save Changes' : 'Create Action Item'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
