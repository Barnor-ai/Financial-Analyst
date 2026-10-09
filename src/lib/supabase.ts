import { createClient } from '@supabase/supabase-js';
import { UserProfile, PeriodFinancialData, BudgetVsActual, FinancialAnalysisReport } from '../types';

const DEFAULT_SUPABASE_URL = 'https://cvalqaolnppzoviagvtw.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2YWxxYW9sbnBwem92aWFndnR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY0ODExNDEsImV4cCI6MjEwMjA1NzE0MX0._IBWO0OjXI9o2rFcdEvmKBF4UJRml5R4Mgxe5lRdBYg';

function getValidSupabaseUrl(): string {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!envUrl || typeof envUrl !== 'string') return DEFAULT_SUPABASE_URL;
  const trimmed = envUrl.trim();
  if (!trimmed || trimmed === 'undefined' || trimmed === 'null' || trimmed.startsWith('MY_')) {
    return DEFAULT_SUPABASE_URL;
  }
  
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      new URL(trimmed);
      return trimmed;
    } catch {
      return DEFAULT_SUPABASE_URL;
    }
  }
  
  if (trimmed.includes('.')) {
    const prefixed = `https://${trimmed}`;
    try {
      new URL(prefixed);
      return prefixed;
    } catch {
      return DEFAULT_SUPABASE_URL;
    }
  }
  
  return DEFAULT_SUPABASE_URL;
}

function getValidSupabaseAnonKey(): string {
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!envKey || typeof envKey !== 'string') return DEFAULT_SUPABASE_ANON_KEY;
  const trimmed = envKey.trim();
  if (!trimmed || trimmed === 'undefined' || trimmed === 'null' || trimmed.includes('...') || trimmed.length < 20) {
    return DEFAULT_SUPABASE_ANON_KEY;
  }
  return trimmed;
}

const SUPABASE_URL = getValidSupabaseUrl();
const SUPABASE_ANON_KEY = getValidSupabaseAnonKey();

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export interface SavedProject {
  id?: string;
  user_email?: string;
  company_name: string;
  profile: UserProfile;
  periods: PeriodFinancialData[];
  budget_performance: BudgetVsActual[];
  analysis_report?: FinancialAnalysisReport | null;
  updated_at?: string;
}

/**
 * Test connectivity to Supabase instance
 */
export async function testSupabaseConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const { data, error } = await supabase.from('finscope_projects').select('count', { count: 'exact', head: true });
    if (error) {
      // If table doesn't exist yet, standard auth endpoint ping check or health check
      const { data: authData, error: authErr } = await supabase.auth.getSession();
      if (authErr) {
        return { success: false, message: authErr.message };
      }
      return { success: true, message: 'Connected to Supabase Project (Table missing or RLS restricted)' };
    }
    return { success: true, message: 'Connected to Supabase Project (Table ready)' };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Connection failed' };
  }
}

/**
 * Save Financial Data state to Supabase
 */
export async function saveProjectToSupabase(
  userEmail: string | null,
  profile: UserProfile,
  periods: PeriodFinancialData[],
  budgetPerformance: BudgetVsActual[],
  analysisReport?: FinancialAnalysisReport | null
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const payload = {
      user_email: userEmail || 'guest@finscope.ai',
      company_name: profile.companyName || 'Untitled Entity',
      profile,
      periods,
      budget_performance: budgetPerformance,
      analysis_report: analysisReport || null,
      updated_at: new Date().toISOString()
    };

    // Upsert into finscope_projects table
    const { data, error } = await supabase
      .from('finscope_projects')
      .upsert(payload, { onConflict: 'user_email,company_name' })
      .select('id')
      .single();

    if (error) {
      console.warn('Supabase save error (falling back to local storage):', error.message);
      // Local storage fallback for seamless UX if table structure isn't created in user's Supabase instance
      localStorage.setItem(`finscope_cloud_backup_${userEmail || 'guest'}`, JSON.stringify(payload));
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (err: any) {
    console.error('Failed saving project to Supabase:', err);
    return { success: false, error: err?.message || 'Unknown error saving to Supabase' };
  }
}

/**
 * Load latest project for user from Supabase
 */
export async function loadLatestProjectFromSupabase(
  userEmail: string | null
): Promise<{ success: boolean; project?: SavedProject; error?: string }> {
  try {
    const email = userEmail || 'guest@finscope.ai';
    const { data, error } = await supabase
      .from('finscope_projects')
      .select('*')
      .eq('user_email', email)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn('Supabase load error:', error.message);
      const backup = localStorage.getItem(`finscope_cloud_backup_${email}`);
      if (backup) {
        return { success: true, project: JSON.parse(backup) };
      }
      return { success: false, error: error.message };
    }

    if (data) {
      return { success: true, project: data };
    }

    // Check localStorage fallback
    const backup = localStorage.getItem(`finscope_cloud_backup_${email}`);
    if (backup) {
      return { success: true, project: JSON.parse(backup) };
    }

    return { success: false, error: 'No saved project found' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to load project from Supabase' };
  }
}

/**
 * List all saved projects for user
 */
export async function listUserProjectsFromSupabase(
  userEmail: string | null
): Promise<SavedProject[]> {
  try {
    const email = userEmail || 'guest@finscope.ai';
    const { data, error } = await supabase
      .from('finscope_projects')
      .select('*')
      .eq('user_email', email)
      .order('updated_at', { ascending: false });

    if (error || !data) {
      const backup = localStorage.getItem(`finscope_cloud_backup_${email}`);
      if (backup) {
        return [JSON.parse(backup)];
      }
      return [];
    }

    return data;
  } catch (err) {
    return [];
  }
}

/**
 * Supabase Authentication Functions
 */
export async function signUpWithSupabase(email: string, password: string, companyName?: string) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          company_name: companyName || 'FinScope Firm',
        },
      },
    });
    return { data, error };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

export async function signInWithSupabase(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

export async function signInWithGoogleSupabase() {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    return { data, error };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

export async function signOutSupabase() {
  try {
    await supabase.auth.signOut();
  } catch (err) {
    console.warn('Sign out warning:', err);
  }
}

/**
 * Saved Analyses Archive helpers
 */
export async function saveAnalysisToArchive(analysisRecord: any): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('saved_analyses')
      .upsert(analysisRecord, { onConflict: 'id' });

    if (error) {
      console.warn('Supabase saved_analyses error, saving locally:', error.message);
    }
  } catch (err) {
    console.warn('Supabase archive exception, saving locally:', err);
  }

  // Also persist in local storage archive
  try {
    const existing = JSON.parse(localStorage.getItem('finscope_analyses_archive') || '[]');
    const filtered = existing.filter((a: any) => a.id !== analysisRecord.id);
    filtered.unshift(analysisRecord);
    localStorage.setItem('finscope_analyses_archive', JSON.stringify(filtered));
  } catch {
    // ignore
  }

  return true;
}

export function loadSavedAnalysesFromArchive(): any[] {
  try {
    const local = localStorage.getItem('finscope_analyses_archive');
    if (local) {
      return JSON.parse(local);
    }
  } catch {
    // ignore
  }
  return [];
}

export function deleteAnalysisFromArchive(id: string): void {
  try {
    const local = localStorage.getItem('finscope_analyses_archive');
    if (local) {
      const parsed = JSON.parse(local);
      const filtered = parsed.filter((a: any) => a.id !== id);
      localStorage.setItem('finscope_analyses_archive', JSON.stringify(filtered));
    }
  } catch {
    // ignore
  }
}


