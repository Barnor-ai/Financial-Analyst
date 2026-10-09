# FinScope — AI Financial Statement Analysis SaaS

> **Your financial statements, read by a senior consultant.**

FinScope is a professional, multi-tenant financial statement analysis platform built for businesses, accountants, finance directors, consultants, and analysts. Upload income statements, balance sheets, and cash flow reports in PDF, Excel (`.xlsx`, `.xls`), CSV, or image format, and receive deterministic financial ratios, year-over-year variance analysis, vertical and horizontal breakdowns, and an executive briefing delivered with senior management consulting precision.

---

## 1. Product Features

- **Consultant-Grade P&L Analysis**: Year-over-year profitability analysis comparing Current vs. Prior periods with dollar variance, percentage movements, common-size (% of revenue) vertical calculations, and inline empirical *"Why the numbers moved"* callout commentaries.
- **Executive Consulting Briefing**: Automated executive narrative synthesizing Revenue Drivers, Cost Drivers, Margin Commentary, and Key Takeaways.
- **Automated Financial Ratios Matrix**: Deterministic calculation of Gross Margin, Operating Margin, Net Margin, Current Ratio, Quick Ratio, Cash Ratio, Debt-to-Equity, Debt-to-Assets, Equity Ratio, Return on Equity (ROE), Return on Assets (ROA), Working Capital, DSO, DIO, DPO, and Cash Conversion Cycle (CCC).
- **Altman Z-Score & 1–10 Risk Score**: Structural bankruptcy and solvency assessment calibrated specifically for private and emerging commercial enterprises.
- **Multi-Tenant Architecture**: Workspace isolation per customer organization with role-based permissions (`Owner`, `Administrator`, `Analyst`, `Viewer`).
- **Multi-Company Management**: Manage and switch between multiple legal entities (e.g. *M/J Agro*, *Apex Global Corp*) within a single tenant account.
- **Universal Financial Document Ingestion**: Ingests multi-sheet Excel files, audited PDFs, scanned statements, and CSVs with balance sheet validation (`Assets = Liabilities + Equity`).
- **Reports Archive & Exporters**: Interactive historical report repository with real Excel (`.xlsx`) workbook generation and print-ready PDF export layouts.
- **AI Finance Advisor Chatbot**: Grounded conversational financial advisor answering follow-up questions in an investor-ready consulting format.

---

## 2. Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Vite
- **Data Visualization**: Recharts (interactive Bar, Donut/Pie, and Multi-period Trend charts)
- **Document Processing**: XLSX (SheetJS), Canvas OCR pipeline, Gemini 3.7 multimodal parsing
- **Deterministic Math Engine**: Pure TypeScript implementation of certified financial formulas and accounting identities
- **Backend**: Express on Node.js / tsx runtime with Vite middleware
- **AI Provider**: Google GenAI SDK (`@google/genai`) with server-side API proxying
- **Database & Auth**: Supabase (PostgreSQL with Row Level Security, Supabase Auth, and Storage)
- **Deployment**: Netlify (SPA production bundle) / Google Cloud Run container

---

## 3. Local Development Setup

### Prerequisites

- Node.js version 20+
- npm or yarn

### Installation

1. Clone or export the repository:
   ```bash
   git clone https://github.com/your-org/finscope.git
   cd finscope
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
   Populate `.env` with your API keys:
   - `GEMINI_API_KEY`: Your Google AI Studio API key
   - `VITE_SUPABASE_URL`: Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase public anonymous key

4. Run the development server:
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:3000`.

5. Type check and lint:
   ```bash
   npm run lint
   ```

6. Build for production:
   ```bash
   npm run build
   ```

---

## 4. Supabase Database & Migration Guide

FinScope uses Supabase PostgreSQL with Row Level Security (RLS) to enforce strict tenant isolation across organizations.

### Step-by-Step Database Setup

1. Log into your [Supabase Dashboard](https://supabase.com/dashboard) and open your project.
2. Navigate to **SQL Editor** (`/sql/new`).
3. Open `supabase/migrations/20260101000000_multi_tenant_financial_saas.sql` (or `src/lib/supabase_schema.sql`).
4. Paste the entire SQL script and click **Run**.
5. The migration creates the following tables:
   - `organisations`: Tenant records, company default currency and billing plan.
   - `organisation_memberships`: Role-based member assignments (`owner`, `admin`, `analyst`, `viewer`).
   - `user_profiles`: User preferences and active organization context.
   - `company_profiles`: Client entities analysed (e.g. *M/J Agro*).
   - `financial_documents`: Tracked metadata of uploaded PDF, Excel, and CSV files.
   - `financial_statements`: Structured period datasets (Income Statement, Balance Sheet, Cash Flow).
   - `saved_analyses`: Historical report archive with risk scores and status.
   - `subscriptions`: Commercial licensing and user entitlements.
   - `audit_logs`: Tenant-scoped activity trails.
6. Verify that **Row Level Security (RLS)** is marked enabled on all tables in **Table Editor**.

---

## 5. Netlify Deployment Instructions

FinScope is pre-configured for instant continuous deployment via Netlify:

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Upgrade FinScope to multi-tenant financial SaaS"
   git push origin main
   ```

2. **Connect to Netlify**:
   - In the Netlify dashboard, click **Add new site** -> **Import an existing project**.
   - Select your GitHub repository.

3. **Build Settings**:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - *Note*: `netlify.toml` in the repository root automatically configures the SPA redirect rule `/* -> /index.html 200`.

4. **Environment Variables**:
   In Netlify under **Site configuration** -> **Environment variables**, set:
   - `GEMINI_API_KEY` = your server-side API key
   - `VITE_SUPABASE_URL` = `https://your-project.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `eyJ...`

5. **Deploy**:
   Click **Deploy site**. Once deployed, configure your custom domain and HTTPS.

---

## 6. Security Considerations & Tenant Isolation

- **Client-Safe Secrets**: Privileged service-role keys are never exposed in Vite client code. Only publishable anonymous keys (`VITE_SUPABASE_ANON_KEY`) are bundled.
- **Row Level Security**: All database queries are filtered by `get_user_organisations()` so no tenant can ever read, edit, or delete another organization's records.
- **Deterministic Math**: Financial computations (EBIT, Gross Margin, Net Margin, Current Ratio, Quick Ratio, Debt-to-Equity, Altman Z-Score) are executed by certified TypeScript algorithms. AI models provide structured advisory narrative explanations without altering arithmetic figures.
- **Private Buckets**: Uploaded financial statements and documents are stored in private Supabase Storage buckets accessible only through signed session tokens.

---

## 7. License

Apache-2.0 License. Built with Google AI Studio.
