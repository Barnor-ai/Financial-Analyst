/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Building2, Upload, TrendingUp, LayoutGrid, FileText, Settings, 
  LogOut, Menu, X, CheckCircle2, ChevronRight, ChevronLeft, Calculator, 
  ShieldCheck, Target, Sliders, Users, CreditCard, Activity, Sparkles,
  ArrowRight, Search, Briefcase
} from 'lucide-react';
import { UserProfile, PeriodFinancialData, BudgetVsActual, FinancialAnalysisReport, SavedAnalysisRecord } from './types';
import { 
  SAMPLE_COMPANY_PROFILE, SAMPLE_FINANCIAL_PERIODS, SAMPLE_ANALYSIS_REPORT, SAMPLE_BUDGET_PERFORMANCE,
  SAMPLE_SAVED_REPORTS, createEmptyComparativePeriods, createEmptyBudget 
} from './data';
import { generateReportFromFinancials } from './utils/financialEngine';
import { 
  saveProjectToSupabase, loadLatestProjectFromSupabase, testSupabaseConnection, 
  supabase, signOutSupabase, saveAnalysisToArchive, loadSavedAnalysesFromArchive,
  deleteAnalysisFromArchive 
} from './lib/supabase';

import LoginScreen from './components/LoginScreen';
import LandingPage from './components/LandingPage';
import CompanyProfileView from './components/CompanyProfileView';
import DataUploadSection, { UploadCategoryType } from './components/DataUploadSection';
import ValidationAndMappingStudio from './components/ValidationAndMappingStudio';
import ProfitabilityAnalysisView from './components/ProfitabilityAnalysisView';
import FinancialDataEditor from './components/FinancialDataEditor';
import FinancialHealthDashboard from './components/FinancialHealthDashboard';
import ReportsView from './components/ReportsView';
import FinancialAdvisorChat from './components/FinancialAdvisorChat';
import SettingsView from './components/SettingsView';
import GuidedWorkflowBar, { WorkflowStepId } from './components/GuidedWorkflowBar';
import QuickActionsMenu, { QuickActionType } from './components/QuickActionsMenu';
import ForecastingScenariosView from './components/ForecastingScenariosView';
import TeamAccessView from './components/TeamAccessView';
import SubscriptionBillingView from './components/SubscriptionBillingView';
import VarianceInvestigationHub from './components/VarianceInvestigationHub';
import FinancialHealthAssessmentEngine from './components/FinancialHealthAssessmentEngine';
import ManagementDecisionSupportView from './components/ManagementDecisionSupportView';
import LanguageSelector from './components/LanguageSelector';

export type NavigationTab = 
  | 'dashboard'
  | 'decisions'
  | 'financial-health'
  | 'new-analysis'
  | 'budget-actual'
  | 'variance'
  | 'forecasting'
  | 'reports'
  | 'entities'
  | 'uploads'
  | 'team'
  | 'billing'
  | 'settings'
  // Backward compatibility alias keys
  | 'profile'
  | 'validate'
  | 'profitability';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authView, setAuthView] = useState<'landing' | 'auth'>('landing');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [uploadCategory, setUploadCategory] = useState<UploadCategoryType>('statements');
  const [varianceSubTab, setVarianceSubTab] = useState<'budget' | 'risks' | 'dupont' | 'yoy'>('budget');
  
  // Supabase Sync State
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [syncMessage, setSyncMessage] = useState<string>('Supabase Cloud Connected');
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  
  // Active Company Profile & Multi-company list
  const [profile, setProfile] = useState<UserProfile>(SAMPLE_COMPANY_PROFILE);
  const [companies, setCompanies] = useState<UserProfile[]>([
    SAMPLE_COMPANY_PROFILE,
    {
      companyName: 'Apex Global Corp',
      industry: 'Enterprise SaaS / Technology',
      location: 'United States',
      currency: 'USD ($)',
      financialYearEnd: 'December 31',
      reportingBasis: 'US GAAP',
      logoText: 'A'
    }
  ]);

  // Financial Statements Data Model (Defaulted to standard enterprise demo model)
  const [periods, setPeriods] = useState<PeriodFinancialData[]>(SAMPLE_FINANCIAL_PERIODS);
  const [budgetPerformance, setBudgetPerformance] = useState<BudgetVsActual[]>(SAMPLE_BUDGET_PERFORMANCE);
  const [analysis, setAnalysis] = useState<FinancialAnalysisReport | null>(SAMPLE_ANALYSIS_REPORT);
  const [isGuidedModeActive, setIsGuidedModeActive] = useState<boolean>(true);

  // Saved Analyses Archive (Phase 9 Searchable Reports Library)
  const [savedReports, setSavedReports] = useState<SavedAnalysisRecord[]>(SAMPLE_SAVED_REPORTS);

  // Profitability Sub-View (Table Report vs Raw Data Editor)
  const [profitabilitySubView, setProfitabilitySubView] = useState<'report' | 'raw_editor'>('report');

  // Active Tab: Defaults to 'profile' upon login as in user video
  const [activeTab, setActiveTab] = useState<NavigationTab>('profile');

  // Supabase Auth Listener on Mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) {
        setUserEmail(session.user.email);
        setIsLoggedIn(true);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user?.email) {
        setUserEmail(session.user.email);
        setIsLoggedIn(true);
      }
    });

    // Load local archive if present
    const archived = loadSavedAnalysesFromArchive();
    if (archived && archived.length > 0) {
      const existingIds = new Set(archived.map((a: any) => a.id));
      const merged = [...archived, ...SAMPLE_SAVED_REPORTS.filter(s => !existingIds.has(s.id))];
      setSavedReports(merged);
    }

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Supabase initial test on login
  useEffect(() => {
    if (isLoggedIn && userEmail) {
      testSupabaseConnection().then((res) => {
        setSyncMessage(res.message);
      });
    }
  }, [isLoggedIn, userEmail]);

  const handleSaveToSupabase = async () => {
    setIsSyncing(true);
    setSyncStatus('idle');
    const res = await saveProjectToSupabase(userEmail, profile, periods, budgetPerformance, analysis);
    setIsSyncing(false);
    if (res.success) {
      setSyncStatus('success');
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLastSavedAt(timeStr);
      setSyncMessage(`Saved (${timeStr})`);
    } else {
      setSyncStatus('error');
      setSyncMessage(res.error || 'Saved locally');
    }
  };

  const handleDataLoaded = (newPeriods: PeriodFinancialData[]) => {
    // Enforce Current Year First
    const sorted = [...newPeriods].sort((a, b) => b.period.localeCompare(a.period, undefined, { numeric: true }));
    setPeriods(sorted);
    
    // Generate immediate bespoke diagnostic commentary for the uploaded financials
    const initialReport = generateReportFromFinancials(profile, sorted);
    setAnalysis(initialReport);
    // Route to Validate & Map studio so the user can inspect accounting equilibrium
    setActiveTab('validate');

    // Auto-create a saved report record with uploaded numbers
    const newReportRecord: SavedAnalysisRecord = {
      id: `rep-${Date.now()}`,
      companyName: profile.companyName || 'Corporate Client',
      reportTitle: sorted[0]?.period || 'New Analysis',
      periodLabel: `Annually · Jan - Dec ${sorted[0]?.period.replace(/\D/g, '') || '2025'}`,
      periodFrequency: 'Annually',
      analysisType: 'Comprehensive Profitability',
      status: 'completed',
      riskScore: initialReport.financialHealthScore ? Number((10 - initialReport.financialHealthScore).toFixed(1)) : 4.0,
      riskScoreText: `Risk ${initialReport.financialHealthScore ? (10 - initialReport.financialHealthScore).toFixed(1) : '4'}/10`,
      currency: profile.currency,
      periods: sorted,
      analysisReport: initialReport,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: userEmail || 'analyst'
    };

    setSavedReports(prev => [newReportRecord, ...prev]);
    saveAnalysisToArchive(newReportRecord);

    // Asynchronously enrich with full server-side Gemini consultant analysis
    fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profile,
        periods: sorted,
        budgetPerformance
      })
    })
      .then(res => res.ok ? res.json() : null)
      .then(aiReport => {
        if (aiReport && aiReport.executiveSummary) {
          setAnalysis(prev => ({
            ...(prev || initialReport),
            ...aiReport
          }));
        }
      })
      .catch(err => {
        console.warn('Background AI analysis enrichment notice:', err);
      });
  };

  const handleInitializeBlank = (companyName: string) => {
    const updatedProfile = {
      ...profile,
      companyName: companyName || 'New Enterprise Entity'
    };
    setProfile(updatedProfile);
    setPeriods(createEmptyComparativePeriods());
    setBudgetPerformance(createEmptyBudget());
    setAnalysis(null);
    setActiveTab('profitability');
  };

  const handleResetWorkspace = () => {
    setPeriods(createEmptyComparativePeriods());
    setBudgetPerformance(createEmptyBudget());
    setAnalysis(null);
    setSavedReports([]);
    setProfile({
      companyName: '',
      industry: 'Enterprise SaaS / Technology',
      location: 'United States',
      currency: 'USD ($)',
      logoText: '?'
    });
  };

  const handleLogin = (email: string) => {
    setUserEmail(email);
    setIsLoggedIn(true);
    setActiveTab('profile'); // Always land on Company Profile upon login as in video
  };

  const handleLogout = () => {
    signOutSupabase();
    setUserEmail(null);
    setIsLoggedIn(false);
    setAuthView('landing');
    setActiveTab('profile');
  };

  const handleOpenSavedReport = (record: SavedAnalysisRecord) => {
    if (record.periods && record.periods.length > 0) {
      setPeriods(record.periods);
    }
    if (record.analysisReport) {
      setAnalysis(record.analysisReport);
    }
    if (record.budgetPerformance && record.budgetPerformance.length > 0) {
      setBudgetPerformance(record.budgetPerformance);
    }
    if (record.companyName) {
      setProfile(prev => ({
        ...prev,
        companyName: record.companyName,
        currency: record.currency || prev.currency
      }));
    }
    // Route to appropriate view based on category or default
    if (record.reportCategory === 'Budget vs Actual Analysis' || record.reportCategory === 'Variance Investigation') {
      setActiveTab('budget-actual');
    } else if (record.reportCategory === 'Financial Health Assessment') {
      setActiveTab('financial-health');
    } else {
      setActiveTab('profitability');
    }
  };

  const handleDuplicateSavedReport = (record: SavedAnalysisRecord) => {
    const copy: SavedAnalysisRecord = {
      ...record,
      id: `rep-copy-${Date.now()}`,
      reportTitle: `${record.reportTitle} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: userEmail || 'analyst@finscope.ai'
    };
    setSavedReports(prev => [copy, ...prev]);
    saveAnalysisToArchive(copy);
  };

  const handleToggleFavoriteReport = (id: string) => {
    setSavedReports(prev => prev.map(r => {
      if (r.id === id) {
        const updated = { ...r, isFavorite: !r.isFavorite, updatedAt: new Date().toISOString() };
        saveAnalysisToArchive(updated);
        return updated;
      }
      return r;
    }));
  };

  const handleToggleArchiveReport = (id: string) => {
    setSavedReports(prev => prev.map(r => {
      if (r.id === id) {
        const updated = { ...r, isArchived: !r.isArchived, updatedAt: new Date().toISOString() };
        saveAnalysisToArchive(updated);
        return updated;
      }
      return r;
    }));
  };

  const handleDeleteSavedReport = (id: string) => {
    setSavedReports(prev => prev.filter(r => r.id !== id));
    deleteAnalysisFromArchive(id);
  };

  // Rendering Gate: Session validation
  if (!isLoggedIn) {
    if (authView === 'landing') {
      return (
        <LandingPage
          onGetStarted={() => setAuthView('auth')}
          onSignIn={() => setAuthView('auth')}
          onExploreDemo={() => {
            setUserEmail('analyst@finscope.ai');
            setProfile(SAMPLE_COMPANY_PROFILE);
            setPeriods(SAMPLE_FINANCIAL_PERIODS);
            setBudgetPerformance(SAMPLE_BUDGET_PERFORMANCE);
            setAnalysis(SAMPLE_ANALYSIS_REPORT);
            setIsLoggedIn(true);
            setActiveTab('dashboard');
          }}
        />
      );
    }
    return (
      <LoginScreen
        onLogin={handleLogin}
        onBackToHome={() => setAuthView('landing')}
      />
    );
  }

  // Professional CFO SaaS Navigation Items
  const navItems = [
    { id: 'dashboard' as NavigationTab, label: 'Executive Dashboard', icon: LayoutGrid, section: 'Core Intelligence' },
    { id: 'decisions' as NavigationTab, label: 'Decision Support & Actions', icon: Briefcase, section: 'Core Intelligence' },
    { id: 'financial-health' as NavigationTab, label: 'Financial Health', icon: Activity, section: 'Core Intelligence' },
    { id: 'new-analysis' as NavigationTab, label: 'New Analysis', icon: Upload, section: 'Analysis Engine' },
    { id: 'budget-actual' as NavigationTab, label: 'Budget vs Actual', icon: Target, section: 'Analysis Engine' },
    { id: 'variance' as NavigationTab, label: 'Variance Analysis', icon: TrendingUp, section: 'Analysis Engine' },
    { id: 'forecasting' as NavigationTab, label: 'Forecasting & Scenarios', icon: Sliders, section: 'Analysis Engine' },
    { id: 'reports' as NavigationTab, label: 'Reports Library', icon: FileText, section: 'Archive & Reporting' },
    { id: 'entities' as NavigationTab, label: 'Entities & Companies', icon: Building2, section: 'Enterprise' },
    { id: 'uploads' as NavigationTab, label: 'Data Uploads', icon: Calculator, section: 'Enterprise' },
    { id: 'team' as NavigationTab, label: 'Team & Access', icon: Users, section: 'Administration' },
    { id: 'billing' as NavigationTab, label: 'Subscription & Billing', icon: CreditCard, section: 'Administration' },
    { id: 'settings' as NavigationTab, label: 'Settings', icon: Settings, section: 'Administration' },
  ];

        {/* Quick Action Handler */}
        const handleQuickAction = (action: QuickActionType) => {
          if (action === 'upload_statements') {
            setUploadCategory('statements');
            setActiveTab('new-analysis');
          } else if (action === 'upload_management_accounts') {
            setUploadCategory('management_accounts');
            setActiveTab('new-analysis');
          } else if (action === 'upload_budget') {
            setUploadCategory('budget');
            setActiveTab('new-analysis');
          } else if (action === 'upload_actuals') {
            setUploadCategory('actuals');
            setActiveTab('new-analysis');
          } else if (action === 'start_health_review') {
            setActiveTab('dashboard');
          } else if (action === 'generate_variance_report') {
            setActiveTab('variance');
          } else if (action === 'open_previous_report') {
            setActiveTab('reports');
          }
        };

        // Breadcrumb Title Formatter
        const getPageDetails = () => {
          switch (activeTab) {
            case 'dashboard':
              return { title: 'Executive Dashboard', subtitle: 'Real-time financial vitals, revenue composition, and solvency metrics' };
            case 'decisions':
              return { title: 'Management Decision Support & Action Register', subtitle: 'Executive attention priorities, adverse variances, liquidity pressures, action tracking, and scenario simulations' };
            case 'financial-health':
              return { title: 'Financial Health & Ratios Matrix', subtitle: 'Liquidity, profitability margins, equity cushion, and debt ratios' };
            case 'new-analysis':
              return { title: 'New Financial Analysis', subtitle: 'Upload and parse financial statements, management accounts, or budgets' };
            case 'budget-actual':
              return { title: 'Budget vs Actual Execution', subtitle: 'Compare budgeted operational line items against realized performance' };
            case 'variance':
              return { title: 'Variance Analysis & Emerging Risks', subtitle: 'Investigate material variances, root causes, and early warning flags' };
            case 'forecasting':
              return { title: 'Forecasting & Strategic Scenarios', subtitle: 'Dynamic forward projections, revenue sensitivities, and stress-tests' };
            case 'reports':
              return { title: 'Reports & Analyses Library', subtitle: 'Searchable repository of previous financial analyses and exportable memos' };
            case 'entities':
            case 'profile':
              return { title: 'Entities & Multi-Company Structure', subtitle: 'Manage subsidiaries, reporting currencies, and accounting frameworks' };
            case 'uploads':
              return { title: 'Data Uploads & Ledger Central', subtitle: 'Interactive comparative financial statement ledger editor and reconciliations' };
            case 'team':
              return { title: 'Team & Role Access Control', subtitle: 'Invite finance team members, controllers, and external auditors' };
            case 'billing':
              return { title: 'Subscription & Billing', subtitle: 'SaaS plan tiers, enterprise seats, payment methods, and invoices' };
            case 'settings':
              return { title: 'Workspace Settings', subtitle: 'Supabase cloud synchronization, workspace defaults, and security sessions' };
            default:
              return { title: 'Financial Analysis', subtitle: 'CFO intelligence workspace' };
          }
        };

        const pageDetails = getPageDetails();

        return (
          <div className="min-h-screen bg-[#F8F4EB] flex antialiased text-[#0B192C]">
            
            {/* Mobile Top App Bar */}
            <div className="lg:hidden fixed top-0 inset-x-0 bg-[#0B1530] text-white z-40 px-4 py-3 flex items-center justify-between border-b border-[#162A45]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#D6AE55] text-[#0B1530] font-serif font-black text-lg flex items-center justify-center shadow-xs">
                  F
                </div>
                <div>
                  <span className="font-serif-display text-lg font-bold text-white tracking-tight leading-none block">
                    FinScope
                  </span>
                  <span className="text-[9px] text-[#D6AE55] font-mono tracking-wider block">
                    Financial clarity. Better decisions.
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
                className="p-2 text-slate-300 hover:text-white cursor-pointer"
                aria-label="Toggle menu"
              >
                {mobileSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>

            {/* Backdrop for mobile drawer */}
            {mobileSidebarOpen && (
              <div 
                onClick={() => setMobileSidebarOpen(false)}
                className="lg:hidden fixed inset-0 bg-black/60 z-40"
              />
            )}

            {/* Fixed / Collapsible Left Sidebar Navigation */}
            <aside 
              className={`fixed lg:sticky top-0 left-0 z-50 h-screen bg-[#0B1530] flex flex-col justify-between transition-all duration-200 ease-in-out shrink-0 border-r border-[#10223A] ${
                sidebarCollapsed ? 'lg:w-20 p-3' : 'lg:w-64 p-5'
              } ${mobileSidebarOpen ? 'translate-x-0 w-64 p-5' : '-translate-x-full lg:translate-x-0'}`}
              id="app-sidebar"
            >
              {/* Top: Logo & Navigation List */}
              <div className="space-y-5 overflow-y-auto custom-scrollbar pr-1">
                
                {/* Logo Branding, Tagline & Collapse Toggle */}
                <div className="pt-2 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#D6AE55] text-[#0B1530] font-serif font-black text-xl flex items-center justify-center shadow-xs shrink-0">
                      F
                    </div>
                    {(!sidebarCollapsed || mobileSidebarOpen) && (
                      <div>
                        <span className="font-serif-display text-xl font-bold text-white tracking-tight leading-none block">
                          FinScope
                        </span>
                        <span className="text-[10px] text-[#D6AE55] font-mono tracking-wider uppercase block mt-0.5">
                          CFO Intelligence
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Desktop Collapse / Expand Button */}
                  <button
                    type="button"
                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    className="hidden lg:flex p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#122338] transition-colors cursor-pointer"
                    title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                    aria-label="Toggle sidebar width"
                  >
                    {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                  </button>
                </div>

                {(!sidebarCollapsed || mobileSidebarOpen) && (
                  <p className="text-[10px] text-slate-400 font-mono italic">
                    Financial clarity. Better decisions.
                  </p>
                )}

                {/* Navigation Items */}
                <nav className="space-y-1" aria-label="Sidebar Navigation">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id || 
                      (item.id === 'entities' && activeTab === 'profile') ||
                      (item.id === 'variance' && (activeTab === 'profitability' || activeTab === 'validate')) ||
                      (item.id === 'uploads' && activeTab === 'new-analysis' && uploadCategory === 'statements');
                    
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setActiveTab(item.id);
                          setMobileSidebarOpen(false);
                        }}
                        title={sidebarCollapsed && !mobileSidebarOpen ? item.label : undefined}
                        className={`w-full flex items-center gap-3 px-3 py-2.2 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer group ${
                          isActive
                            ? 'bg-[#122338] text-[#D6AE55] border border-[#1E3758]/60 shadow-xs'
                            : 'text-slate-300 hover:text-white hover:bg-[#0F1E33]'
                        }`}
                        id={`nav-${item.id}`}
                      >
                        <Icon className={`w-4 h-4 shrink-0 transition-colors ${
                          isActive ? 'text-[#D6AE55]' : 'text-slate-400 group-hover:text-slate-200'
                        }`} />
                        {(!sidebarCollapsed || mobileSidebarOpen) && (
                          <span className="truncate">{item.label}</span>
                        )}
                      </button>
                    );
                  })}
                </nav>

              </div>

              {/* Bottom: Active Company Pill & Sign out */}
              <div className="pt-4 border-t border-[#13253D] space-y-2 shrink-0">
                {profile.companyName && (!sidebarCollapsed || mobileSidebarOpen) && (
                  <div className="px-3 py-2 bg-[#0F1E33] border border-[#162A45] rounded-xl text-left">
                    <p className="text-[9px] text-slate-400 uppercase tracking-wider font-mono">Active Company</p>
                    <p className="text-xs font-bold text-white truncate mt-0.5">{profile.companyName}</p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleLogout}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-[#0F1E33] transition-colors cursor-pointer text-left ${
                    sidebarCollapsed && !mobileSidebarOpen ? 'justify-center' : ''
                  }`}
                  id="nav-signout"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4 shrink-0 text-slate-400" />
                  {(!sidebarCollapsed || mobileSidebarOpen) && <span>Sign out</span>}
                </button>
              </div>
            </aside>

            {/* Main Content Workspace (Warm Cream Canvas #F8F4EB) */}
            <main className="flex-1 min-w-0 flex flex-col p-6 sm:p-10 lg:p-12 mt-14 lg:mt-0 overflow-y-auto">
              <div className="max-w-6xl w-full mx-auto space-y-6">
                
                {/* Top Hierarchy Bar: Breadcrumb + Entity Badge + Quick Actions */}
                <div className="bg-white border border-[#E8E2D8] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left">
                  <div className="space-y-1">
                    {/* Breadcrumbs */}
                    <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                      <span className="text-[#0B1530] font-semibold">{profile.companyName || 'Corporate Entity'}</span>
                      <span className="text-slate-300">/</span>
                      <span className="text-[#D4A347] font-semibold">{pageDetails.title}</span>
                    </div>
                    <h2 className="font-serif-display text-xl sm:text-2xl font-bold text-[#0B192C]">
                      {pageDetails.title}
                    </h2>
                    <p className="text-xs text-slate-500 max-w-xl">
                      {pageDetails.subtitle}
                    </p>
                  </div>

                  {/* Right Header Controls: Language Selector + Quick Actions Menu + Entity Selector */}
                  <div className="flex items-center gap-2 shrink-0">
                    <LanguageSelector variant="compact" />

                    <QuickActionsMenu
                      onAction={handleQuickAction}
                      hasDataUploaded={periods.length > 0}
                      totalSavedReports={savedReports.length}
                    />

                    <button
                      type="button"
                      onClick={() => setActiveTab('entities')}
                      className="px-3 py-2 bg-[#FAF7F2] hover:bg-white text-[#0B192C] text-xs font-semibold rounded-xl border border-[#E8E2D8] transition-colors flex items-center gap-1.5 cursor-pointer"
                      title="Switch active entity"
                    >
                      <Building2 className="w-3.5 h-3.5 text-[#D4A347]" />
                      <span className="hidden sm:inline">Entity:</span>
                      <span className="font-bold truncate max-w-[120px]">{profile.companyName || 'Default'}</span>
                    </button>
                  </div>
                </div>

                {/* CFO Guided Workflow Stepper Bar */}
                <GuidedWorkflowBar
                  currentStep={
                    activeTab === 'entities' || activeTab === 'profile' ? 'entity' :
                    activeTab === 'new-analysis' ? 'upload' :
                    activeTab === 'validate' ? 'validate' :
                    activeTab === 'variance' || activeTab === 'budget-actual' || activeTab === 'financial-health' || activeTab === 'forecasting' || activeTab === 'dashboard' || activeTab === 'decisions' ? 'analysis' : 'reports'
                  }
                  onSelectStep={(step: WorkflowStepId) => {
                    if (step === 'entity') setActiveTab('entities');
                    else if (step === 'upload') setActiveTab('new-analysis');
                    else if (step === 'validate') setActiveTab('validate');
                    else if (step === 'analysis') setActiveTab('variance');
                    else if (step === 'reports') setActiveTab('reports');
                  }}
                  entityName={profile.companyName}
                  hasDataUploaded={periods.length > 0}
                  hasValidated={true}
                  isGuidedModeActive={isGuidedModeActive}
                  onToggleGuidedMode={() => setIsGuidedModeActive(!isGuidedModeActive)}
                />

                {/* ROUTE 1: Executive Dashboard */}
                {activeTab === 'dashboard' && (
                  <FinancialHealthDashboard 
                    profile={profile}
                    companies={companies}
                    periods={periods}
                    budgetPerformance={budgetPerformance}
                    analysis={analysis}
                    savedReports={savedReports}
                    currency={profile.currency}
                    onNavigateToNewAnalysis={() => setActiveTab('new-analysis')}
                    onNavigateToProfitability={() => setActiveTab('financial-health')}
                    onNavigateToVariance={() => setActiveTab('budget-actual')}
                    onNavigateToReports={() => setActiveTab('reports')}
                    onNavigateToEntities={() => setActiveTab('entities')}
                    onNavigateToDecisions={() => setActiveTab('decisions')}
                  />
                )}

                {/* ROUTE 1.5: Management Decision Support & Action Register */}
                {activeTab === 'decisions' && (
                  <ManagementDecisionSupportView
                    profile={profile}
                    periods={periods}
                    budgetPerformance={budgetPerformance}
                    analysis={analysis}
                    onNavigateToVariance={() => setActiveTab('variance')}
                    onNavigateToReports={() => setActiveTab('reports')}
                  />
                )}

                {/* ROUTE 2: CFO Financial Health Assessment Engine */}
                {activeTab === 'financial-health' && (
                  <FinancialHealthAssessmentEngine
                    profile={profile}
                    periods={periods}
                    analysis={analysis}
                    budgetPerformance={budgetPerformance}
                    onNavigateToEdit={() => setActiveTab('uploads')}
                    onNavigateToUpload={() => setActiveTab('new-analysis')}
                  />
                )}

                {/* ROUTE 3: New Analysis (Upload Wizard) */}
                {activeTab === 'new-analysis' && (
                  <DataUploadSection 
                    profile={profile}
                    setProfile={setProfile}
                    onDataLoaded={handleDataLoaded}
                    onInitializeBlank={handleInitializeBlank}
                    periodsUploaded={periods.length > 0}
                    onTriggerAnalysis={() => setActiveTab('validate')}
                    defaultCategory={uploadCategory}
                  />
                )}

                {/* ROUTE 4: Budget vs Actual */}
                {activeTab === 'budget-actual' && (
                  <div className="space-y-6">
                    <VarianceInvestigationHub
                      profile={profile}
                      periods={periods}
                      budgetPerformance={budgetPerformance}
                      onOpenDataEditor={() => setActiveTab('uploads')}
                    />
                  </div>
                )}

                {/* ROUTE 5: Variance Analysis */}
                {(activeTab === 'variance' || activeTab === 'profitability') && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between pb-2">
                      <span className="text-xs text-slate-500 font-mono">
                        Investigation View Mode:
                      </span>
                      <div className="flex items-center gap-1 p-1 bg-white border border-[#E8E2D8] rounded-xl shadow-xs">
                        <button
                          type="button"
                          onClick={() => setProfitabilitySubView('report')}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                            profitabilitySubView === 'report' ? 'bg-[#0B1530] text-white' : 'text-slate-600 hover:text-[#0B192C]'
                          }`}
                        >
                          CFO Intelligence Report
                        </button>
                        <button
                          type="button"
                          onClick={() => setProfitabilitySubView('raw_editor')}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                            profitabilitySubView === 'raw_editor' ? 'bg-[#0B1530] text-white' : 'text-slate-600 hover:text-[#0B192C]'
                          }`}
                        >
                          <Calculator className="w-3.5 h-3.5 text-[#D6AE55]" />
                          <span>Ledger & Budget Editor</span>
                        </button>
                      </div>
                    </div>

                    {profitabilitySubView === 'report' ? (
                      <ProfitabilityAnalysisView
                        profile={profile}
                        periods={periods}
                        analysis={analysis}
                        budgetPerformance={budgetPerformance}
                        defaultSubTab="pnl"
                        onNavigateToEdit={() => setProfitabilitySubView('raw_editor')}
                        onNavigateToUpload={() => setActiveTab('new-analysis')}
                      />
                    ) : (
                      <FinancialDataEditor
                        periods={periods}
                        setPeriods={setPeriods}
                        budgetPerformance={budgetPerformance}
                        setBudgetPerformance={setBudgetPerformance}
                        currency={profile.currency}
                      />
                    )}
                  </div>
                )}

                {/* ROUTE 5.5: Data Validation Studio */}
                {activeTab === 'validate' && (
                  <ValidationAndMappingStudio
                    profile={profile}
                    periods={periods}
                    onProceedToAnalysis={() => setActiveTab('variance')}
                    onBackToUpload={() => setActiveTab('new-analysis')}
                  />
                )}

                {/* ROUTE 6: Forecasting & Scenarios */}
                {activeTab === 'forecasting' && (
                  <ForecastingScenariosView
                    profile={profile}
                    periods={periods}
                    onNavigateToAnalysis={() => setActiveTab('variance')}
                  />
                )}

                {/* ROUTE 7: Reports Library (Phase 9 Searchable Archive) */}
                {activeTab === 'reports' && (
                  <ReportsView
                    reports={savedReports}
                    onOpenReport={handleOpenSavedReport}
                    onNewAnalysis={() => setActiveTab('new-analysis')}
                    onDeleteReport={handleDeleteSavedReport}
                    onDuplicateReport={handleDuplicateSavedReport}
                    onToggleFavorite={handleToggleFavoriteReport}
                    onToggleArchive={handleToggleArchiveReport}
                    activeEntityName={profile.companyName}
                    userEmail={userEmail}
                  />
                )}

                {/* ROUTE 8: Entities & Companies */}
                {(activeTab === 'entities' || activeTab === 'profile') && (
                  <CompanyProfileView
                    profile={profile}
                    setProfile={setProfile}
                    companies={companies}
                    onSelectCompany={(comp) => setProfile(comp)}
                    onAddCompany={(newComp) => setCompanies(prev => [...prev, newComp])}
                    onSaved={handleSaveToSupabase}
                    onNavigateToAnalysis={() => setActiveTab('new-analysis')}
                  />
                )}

                {/* ROUTE 9: Data Uploads Ledger Central */}
                {activeTab === 'uploads' && (
                  <div className="space-y-6">
                    <FinancialDataEditor
                      periods={periods}
                      setPeriods={setPeriods}
                      budgetPerformance={budgetPerformance}
                      setBudgetPerformance={setBudgetPerformance}
                      currency={profile.currency}
                    />
                  </div>
                )}

                {/* ROUTE 10: Team & Access */}
                {activeTab === 'team' && (
                  <TeamAccessView
                    profile={profile}
                    currentUserEmail={userEmail}
                  />
                )}

                {/* ROUTE 11: Subscription & Billing */}
                {activeTab === 'billing' && (
                  <SubscriptionBillingView
                    profile={profile}
                  />
                )}

                {/* ROUTE 12: Settings */}
                {activeTab === 'settings' && (
                  <SettingsView 
                    profile={profile}
                    userEmail={userEmail}
                    syncMessage={syncMessage}
                    isSyncing={isSyncing}
                    onSaveToSupabase={handleSaveToSupabase}
                    onLoadFromSupabase={() => {}}
                    onResetWorkspace={handleResetWorkspace}
                    onSignOutEverywhere={handleLogout}
                  />
                )}

              </div>
            </main>
          </div>
        );
}
