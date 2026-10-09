-- ==============================================================================
-- FINSCOPE MULTI-TENANT FINANCIAL ANALYSIS SAAS DATABASE SCHEMA
-- Migration: 20260101000000_multi_tenant_financial_saas.sql
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ORGANISATIONS (Tenants)
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

-- 3. ORGANISATION MEMBERSHIPS (Role-Based Access Control)
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

-- 4. USER PROFILES
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL,
    email TEXT NOT NULL,
    full_name TEXT,
    current_organisation_id UUID REFERENCES organisations(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. COMPANY PROFILES (Entities analysed under an Organisation)
CREATE TABLE IF NOT EXISTS company_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    registration_number TEXT,
    industry TEXT DEFAULT 'Agriculture',
    location TEXT DEFAULT 'Ghana',
    currency TEXT DEFAULT 'GHS (GH₵)',
    financial_year_end TEXT DEFAULT 'December 31',
    reporting_basis TEXT DEFAULT 'IFRS' CHECK (reporting_basis IN ('IFRS', 'US GAAP', 'Accrual Basis', 'Cash Basis')),
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

-- 6. FINANCIAL DOCUMENTS (Uploaded statements: PDF, Excel, CSV)
CREATE TABLE IF NOT EXISTS financial_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    company_id UUID REFERENCES company_profiles(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    storage_path TEXT,
    status TEXT DEFAULT 'processed' CHECK (status IN ('uploaded', 'processing', 'processed', 'error')),
    uploaded_by UUID,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. FINANCIAL STATEMENTS & PERIODS
CREATE TABLE IF NOT EXISTS financial_statements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES company_profiles(id) ON DELETE CASCADE,
    period TEXT NOT NULL, -- e.g. 'FY2025', 'FY2024'
    statement_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_company_period UNIQUE (company_id, period)
);

-- 8. SAVED ANALYSES & REPORTS (Archive)
CREATE TABLE IF NOT EXISTS saved_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    company_id UUID REFERENCES company_profiles(id) ON DELETE SET NULL,
    company_name TEXT NOT NULL DEFAULT 'M/J Agro',
    report_title TEXT NOT NULL, -- e.g. 'FY2025'
    period_label TEXT NOT NULL, -- e.g. 'Annually · Jan - Dec 2025'
    period_frequency TEXT DEFAULT 'Annually',
    analysis_type TEXT DEFAULT 'Comprehensive',
    status TEXT DEFAULT 'completed' CHECK (status IN ('draft', 'completed', 'in_review')),
    risk_score NUMERIC(3,1) DEFAULT 4.0,
    risk_score_text TEXT DEFAULT 'Risk 4/10',
    currency TEXT DEFAULT 'GHS (GH₵)',
    periods JSONB NOT NULL DEFAULT '[]'::jsonb,
    budget_performance JSONB DEFAULT '[]'::jsonb,
    analysis_report JSONB,
    created_by TEXT NOT NULL DEFAULT 'analyst',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_saved_analyses_org ON saved_analyses(organisation_id);

-- 9. ORGANISATION INVITATIONS
CREATE TABLE IF NOT EXISTS organisation_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'analyst' CHECK (role IN ('admin', 'analyst', 'viewer')),
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE UNIQUE,
    plan TEXT NOT NULL DEFAULT 'professional',
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'trialing', 'past_due', 'canceled')),
    billing_interval TEXT DEFAULT 'monthly' CHECK (billing_interval IN ('monthly', 'annually')),
    current_period_start TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    current_period_end TIMESTAMPTZ DEFAULT (timezone('utc'::text, now()) + interval '30 days'),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11. AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    user_id UUID,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id UUID,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 12. COMPATIBILITY TABLE: finscope_projects (For single-tenant backward compatibility)
CREATE TABLE IF NOT EXISTS finscope_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email TEXT NOT NULL DEFAULT 'guest@finscope.ai',
    company_name TEXT NOT NULL DEFAULT 'M/J Agro',
    profile JSONB NOT NULL DEFAULT '{}'::jsonb,
    periods JSONB NOT NULL DEFAULT '[]'::jsonb,
    budget_performance JSONB NOT NULL DEFAULT '[]'::jsonb,
    analysis_report JSONB,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_user_company UNIQUE (user_email, company_name)
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS across all tables
ALTER TABLE organisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organisation_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE organisation_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE finscope_projects ENABLE ROW LEVEL SECURITY;

-- Helper security function: Get current user organisations
CREATE OR REPLACE FUNCTION get_user_organisations()
RETURNS TABLE (org_id UUID) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT organisation_id 
    FROM organisation_memberships 
    WHERE user_id = auth.uid();
END;
$$;

-- Policies for organisations
CREATE POLICY "Users can view organisations they belong to"
ON organisations FOR SELECT
USING (id IN (SELECT get_user_organisations()));

CREATE POLICY "Owners and Admins can update their organisation"
ON organisations FOR UPDATE
USING (
    id IN (
        SELECT organisation_id 
        FROM organisation_memberships 
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
);

-- Policies for company_profiles
CREATE POLICY "Members can view company profiles in their organisation"
ON company_profiles FOR SELECT
USING (organisation_id IN (SELECT get_user_organisations()));

CREATE POLICY "Owners, Admins, and Analysts can insert/update company profiles"
ON company_profiles FOR ALL
USING (
    organisation_id IN (
        SELECT organisation_id 
        FROM organisation_memberships 
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'analyst')
    )
);

-- Policies for saved_analyses
CREATE POLICY "Members can view analyses in their organisation"
ON saved_analyses FOR SELECT
USING (organisation_id IN (SELECT get_user_organisations()));

CREATE POLICY "Owners, Admins, and Analysts can modify analyses in their organisation"
ON saved_analyses FOR ALL
USING (
    organisation_id IN (
        SELECT organisation_id 
        FROM organisation_memberships 
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'analyst')
    )
);

-- Fallback policy for finscope_projects (Public/authenticated user access)
CREATE POLICY "Allow authenticated user project persistence"
ON finscope_projects FOR ALL
USING (true)
WITH CHECK (true);
