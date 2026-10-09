/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Building2, Upload, TrendingUp, LayoutGrid, FileText, Settings, 
  LogOut, Menu, X, CheckCircle2, ChevronRight, Calculator
} from 'lucide-react';
import { UserProfile, PeriodFinancialData, BudgetVsActual, FinancialAnalysisReport, SavedAnalysisRecord } from './types';
import { 
  MJ_AGRO_PROFILE, MJ_AGRO_PERIODS, MJ_AGRO_ANALYSIS, 
  createEmptyComparativePeriods, createEmptyBudget 
} from './data';
import { 
  saveProjectToSupabase, loadLatestProjectFromSupabase, testSupabaseConnection, 
  supabase, signOutSupabase, saveAnalysisToArchive, loadSavedAnalysesFromArchive,
  deleteAnalysisFromArchive 
} from './lib/supabase';

import LoginScreen from './components/LoginScreen';
import LandingPage from './components/LandingPage';
import CompanyProfileView from './components/CompanyProfileView';
import DataUploadSection from './components/DataUploadSection';
import ProfitabilityAnalysisView from './components/ProfitabilityAnalysisView';
import FinancialDataEditor from './components/FinancialDataEditor';
import FinancialHealthDashboard from './components/FinancialHealthDashboard';
import ReportsView from './components/ReportsView';
import FinancialAdvisorChat from './components/FinancialAdvisorChat';
import SettingsView from './components/SettingsView';

type NavigationTab = 'profile' | 'new-analysis' | 'profitability' | 'dashboard' | 'reports' | 'settings';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authView, setAuthView] = useState<'landing' | 'auth'>('landing');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  
  // Supabase Sync State
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [syncMessage, setSyncMessage] = useState<string>('Supabase Cloud Connected');
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  
  // Active Company Profile & Multi-company list
  const [profile, setProfile] = useState<UserProfile>(MJ_AGRO_PROFILE);
  const [companies, setCompanies] = useState<UserProfile[]>([
    MJ_AGRO_PROFILE,
    {
      companyName: 'Apex Global Corp',
      industry: 'SaaS / Technology',
      location: 'United States',
      currency: 'USD ($)',
      financialYearEnd: 'December 31',
      reportingBasis: 'US GAAP',
      logoText: 'A'
    }
  ]);

  // Financial Statements Data Model (Defaulted to M/J Agro from reference video)
  const [periods, setPeriods] = useState<PeriodFinancialData[]>(MJ_AGRO_PERIODS);
  const [budgetPerformance, setBudgetPerformance] = useState<BudgetVsActual[]>(createEmptyBudget());
  const [analysis, setAnalysis] = useState<FinancialAnalysisReport | null>(MJ_AGRO_ANALYSIS);

  // Saved Analyses Archive
  const [savedReports, setSavedReports] = useState<SavedAnalysisRecord[]>([
    {
      id: 'rep-fy2025',
      companyName: 'M/J Agro',
      reportTitle: 'FY2025',
      periodLabel: 'Annually · Jan - Dec 2025',
      periodFrequency: 'Annually',
      analysisType: 'Comprehensive Profitability',
      status: 'completed',
      riskScore: 4.0,
      riskScoreText: 'Risk 4/10',
      currency: 'GHS (GH₵)',
      periods: MJ_AGRO_PERIODS,
      analysisReport: MJ_AGRO_ANALYSIS,
      createdAt: '2026-08-29T10:30:00Z',
      updatedAt: '2026-08-29T10:30:00Z',
      createdBy: 'baricanovdiet@gmail.com'
    }
  ]);

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
      setSavedReports(archived);
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
    setPeriods(newPeriods);
    setAnalysis(null);
    setActiveTab('profitability'); // Navigate to Profitability view

    // Auto-create a saved report record
    const newReportRecord: SavedAnalysisRecord = {
      id: `rep-${Date.now()}`,
      companyName: profile.companyName || 'M/J Agro',
      reportTitle: newPeriods[0]?.period || 'New Analysis',
      periodLabel: `Annually · Jan - Dec ${newPeriods[0]?.period.replace(/\D/g, '') || '2025'}`,
      periodFrequency: 'Annually',
      analysisType: 'Comprehensive Profitability',
      status: 'completed',
      riskScore: 4.0,
      riskScoreText: 'Risk 4/10',
      currency: profile.currency,
      periods: newPeriods,
      analysisReport: analysis || MJ_AGRO_ANALYSIS,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: userEmail || 'analyst'
    };

    setSavedReports(prev => [newReportRecord, ...prev]);
    saveAnalysisToArchive(newReportRecord);
  };

  const handleInitializeBlank = (companyName: string) => {
    const updatedProfile = {
      ...profile,
      companyName: companyName || 'M/J Agro'
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
      industry: 'Agriculture',
      location: 'Ghana',
      currency: 'GHS (GH₵)',
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
    setActiveTab('profitability');
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
            setUserEmail('baricanovdiet@gmail.com');
            setProfile(MJ_AGRO_PROFILE);
            setPeriods(MJ_AGRO_PERIODS);
            setAnalysis(MJ_AGRO_ANALYSIS);
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

  // Sidebar navigation menu items matching reference UI exactly
  const navItems = [
    { id: 'profile' as NavigationTab, label: 'Company profile', icon: Building2 },
    { id: 'new-analysis' as NavigationTab, label: 'New analysis', icon: Upload },
    { id: 'profitability' as NavigationTab, label: 'Profitability', icon: TrendingUp },
    { id: 'dashboard' as NavigationTab, label: 'Dashboard', icon: LayoutGrid },
    { id: 'reports' as NavigationTab, label: 'Reports', icon: FileText },
    { id: 'settings' as NavigationTab, label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#F8F4EB] flex antialiased text-[#0B192C]">
      
      {/* Mobile Top App Bar */}
      <div className="lg:hidden fixed top-0 inset-x-0 bg-[#0B1530] text-white z-40 px-4 py-3 flex items-center justify-between border-b border-[#162A45]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#D6AE55] text-[#0B1530] font-serif font-black text-lg flex items-center justify-center shadow-xs">
            F
          </div>
          <span className="font-serif-display text-lg font-bold text-white tracking-tight">FinScope</span>
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

      {/* Fixed Left Sidebar Navigation (Matching Video Frame 01:00) */}
      <aside 
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-[#0B1530] flex flex-col justify-between p-6 transition-transform duration-200 ease-in-out shrink-0 border-r border-[#10223A] ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        id="app-sidebar"
      >
        {/* Top: Logo & Navigation List */}
        <div className="space-y-8">
          
          {/* Logo Branding */}
          <div className="flex items-center gap-3 pt-2">
            <div className="w-9 h-9 rounded-xl bg-[#D6AE55] text-[#0B1530] font-serif font-black text-xl flex items-center justify-center shadow-xs">
              F
            </div>
            <span className="font-serif-display text-2xl font-bold text-white tracking-tight">
              FinScope
            </span>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1.5" aria-label="Sidebar Navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer group ${
                    isActive
                      ? 'bg-[#122338] text-[#D6AE55] border border-[#1E3758]/60 shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-[#0F1E33]'
                  }`}
                  id={`nav-${item.id}`}
                >
                  <Icon className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? 'text-[#D6AE55]' : 'text-slate-400 group-hover:text-slate-200'
                  }`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>

        </div>

        {/* Bottom: Active Company Pill & Sign out */}
        <div className="pt-6 border-t border-[#13253D] space-y-3">
          {profile.companyName && (
            <div className="px-3.5 py-2.5 bg-[#0F1E33] border border-[#162A45] rounded-xl text-left">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Active Company</p>
              <p className="text-xs font-bold text-white truncate mt-0.5">{profile.companyName}</p>
            </div>
          )}

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-[#0F1E33] transition-colors cursor-pointer text-left"
            id="nav-signout"
          >
            <LogOut className="w-4 h-4 shrink-0 text-slate-400" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Workspace (Warm Cream Canvas #F8F4EB) */}
      <main className="flex-1 min-w-0 flex flex-col p-6 sm:p-10 lg:p-14 mt-14 lg:mt-0 overflow-y-auto">
        <div className="max-w-6xl w-full mx-auto">
          
          {/* TAB 1: Company Profile (Matches Video Frame 01:03) */}
          {activeTab === 'profile' && (
            <CompanyProfileView
              profile={profile}
              setProfile={setProfile}
              companies={companies}
              onSelectCompany={(comp) => setProfile(comp)}
              onSaved={handleSaveToSupabase}
              onNavigateToAnalysis={() => setActiveTab('new-analysis')}
            />
          )}

          {/* TAB 2: New Analysis (Upload matching Video Frame 01:09) */}
          {activeTab === 'new-analysis' && (
            <DataUploadSection 
              profile={profile}
              setProfile={setProfile}
              onDataLoaded={handleDataLoaded}
              onInitializeBlank={handleInitializeBlank}
              periodsUploaded={periods.length > 0}
              onTriggerAnalysis={() => setActiveTab('profitability')}
            />
          )}

          {/* TAB 3: Profitability Analysis (Matches Video Frame 01:17 - 01:46) */}
          {activeTab === 'profitability' && (
            <div className="space-y-6">
              {/* Toggle bar between Consultant Report and Live Ledger Editor */}
              <div className="flex items-center justify-between pb-2">
                <span className="text-xs text-slate-500 font-mono">
                  View Mode:
                </span>
                <div className="flex items-center gap-1 p-1 bg-white border border-[#E8E2D8] rounded-xl shadow-xs">
                  <button
                    type="button"
                    onClick={() => setProfitabilitySubView('report')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                      profitabilitySubView === 'report' ? 'bg-[#0B1530] text-white' : 'text-slate-600 hover:text-[#0B192C]'
                    }`}
                  >
                    Consultant Report
                  </button>
                  <button
                    type="button"
                    onClick={() => setProfitabilitySubView('raw_editor')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                      profitabilitySubView === 'raw_editor' ? 'bg-[#0B1530] text-white' : 'text-slate-600 hover:text-[#0B192C]'
                    }`}
                  >
                    <Calculator className="w-3.5 h-3.5 text-[#D6AE55]" />
                    <span>Comparative Ledger Editor</span>
                  </button>
                </div>
              </div>

              {profitabilitySubView === 'report' ? (
                <ProfitabilityAnalysisView
                  profile={profile}
                  periods={periods}
                  analysis={analysis}
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

          {/* TAB 4: Dashboard (Matches Video Frame 01:00 - 01:02) */}
          {activeTab === 'dashboard' && (
            <FinancialHealthDashboard 
              profile={profile}
              periods={periods}
              analysis={analysis}
              currency={profile.currency}
              onNavigateToNewAnalysis={() => setActiveTab('new-analysis')}
              onNavigateToProfitability={() => setActiveTab('profitability')}
            />
          )}

          {/* TAB 5: Reports (All Analyses Archive - Matches Video Frame 01:54) */}
          {activeTab === 'reports' && (
            <ReportsView
              reports={savedReports}
              onOpenReport={handleOpenSavedReport}
              onNewAnalysis={() => setActiveTab('new-analysis')}
              onDeleteReport={handleDeleteSavedReport}
            />
          )}

          {/* TAB 6: Settings (Matches Video Frame 02:04 - 02:17) */}
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
