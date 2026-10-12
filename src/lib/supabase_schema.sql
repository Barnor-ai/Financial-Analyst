-- ==============================================================================
-- FINSCOPE MULTI-TENANT FINANCIAL ANALYSIS SAAS DATABASE SCHEMA
-- Copy and paste this script directly into your Supabase SQL Editor
-- (https://supabase.com/dashboard/project/_/sql/new)
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ORGANISATIONS (Tenants)
CREATE TABLE IF NOT EXISTS organisations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    country TEXT DEFAULT 'Ghana',
    currency TEXT DEFAULT 'GHS (GH₵)',
    plan TEXT DEFAULT 'professional' CHECK (plan IN ('starter', 'professional', 'enterprise')),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. ORGANISATION MEMBERSHIPS (Role-Based Access Control)
CREATE TABLE IF NOT EXISTS organisation_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    user_email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'analyst' CHECK (role IN ('owner', 'admin', 'analyst', 'viewer')),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_org_user UNIQUE (organisation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_memberships_user ON organisation_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_org ON organisation_memberships(organisation_id);

-- 3. USER PROFILES
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL,
    email TEXT NOT NULL,
    full_name TEXT,
    current_organisation_id UUID REFERENCES organisations(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. COMPANY PROFILES (Entities analysed under an Organisation)
CREATE TABLE IF NOT EXISTS company_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    registration_number TEXT,
    industry TEXT DEFAULT 'Agriculture',
    location TEXT DEFAULT 'Ghana',
    currency TEXT DEFAULT 'GHS (GH₵)',
    financial_year_end TEXT DEFAULT 'December 31',
    reporting_basis TEXT DEFAULT 'IFRS',
    description TEXT,
    contact_email TEXT,
    logo_url TEXT,
    logo_text TEXT DEFAULT '🏢',
    is_archived BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_org_company UNIQUE (organisation_id, name)
);

CREATE INDEX IF NOT EXISTS idx_companies_org ON company_profiles(organisation_id);

-- 5. SAVED ANALYSES & REPORTS (Archive)
CREATE TABLE IF NOT EXISTS saved_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    company_id UUID REFERENCES company_profiles(id) ON DELETE SET NULL,
    company_name TEXT NOT NULL DEFAULT 'Meridian Global Enterprises',
    report_title TEXT NOT NULL,
    period_label TEXT NOT NULL,
    period_frequency TEXT DEFAULT 'Annually',
    analysis_type TEXT DEFAULT 'Comprehensive',
    status TEXT DEFAULT 'completed' CHECK (status IN ('draft', 'completed', 'in_review')),
    risk_score NUMERIC(3,1) DEFAULT 4.0,
    risk_score_text TEXT DEFAULT 'Risk 4/10',
    currency TEXT DEFAULT 'USD ($)',
    periods JSONB NOT NULL DEFAULT '[]'::jsonb,
    budget_performance JSONB DEFAULT '[]'::jsonb,
    analysis_report JSONB,
    created_by TEXT NOT NULL DEFAULT 'analyst',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_saved_analyses_org ON saved_analyses(organisation_id);

-- 6. LEGACY / DIRECT INTEGRATION TABLE: finscope_projects
CREATE TABLE IF NOT EXISTS finscope_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email TEXT NOT NULL DEFAULT 'guest@finscope.ai',
    company_name TEXT NOT NULL DEFAULT 'Meridian Global Enterprises',
    profile JSONB NOT NULL DEFAULT '{}'::jsonb,
    periods JSONB NOT NULL DEFAULT '[]'::jsonb,
    budget_performance JSONB NOT NULL DEFAULT '[]'::jsonb,
    analysis_report JSONB,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_user_company UNIQUE (user_email, company_name)
);

CREATE INDEX IF NOT EXISTS idx_finscope_projects_user ON finscope_projects(user_email);

-- 7. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE organisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organisation_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE finscope_projects ENABLE ROW LEVEL SECURITY;

-- 8. POLICIES
CREATE POLICY "Allow public read and write access for development" 
ON finscope_projects 
FOR ALL 
USING (true) 
WITH CHECK (true);
