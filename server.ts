/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { parseRawStatementText } from './src/utils/statementParser';

// Load env variables
dotenv.config();

const port = 3000;
const app = express();

// Increase JSON payload limit for file uploads/parsing
app.use(express.json({ limit: '15mb' }));

// Setup Gemini SDK
const geminiApiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey: geminiApiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// 1. ENDPOINT: Analyze Financial Statements
app.post('/api/analyze', async (req: Request, res: Response): Promise<void> => {
  try {
    const { profile, periods, budgetPerformance } = req.body;

    if (!periods || periods.length === 0) {
      res.status(400).json({ error: 'Financial data periods are required for analysis.' });
      return;
    }

    // Format financial data into a clean text block for Gemini
    const financialSummaryText = periods.map((p: any) => {
      const is = p.incomeStatement;
      const bs = p.balanceSheet;
      const cf = p.cashFlow;
      
      const opExpenses = is.operatingExpenses;
      
      return `
[Period: ${p.period}]
--- INCOME STATEMENT ---
Revenue: ${is.revenue}
COGS: ${is.cogs}
Gross Profit: ${is.grossProfit}
Operating Expenses:
  - Salaries: ${opExpenses.salaries}
  - Marketing: ${opExpenses.marketing}
  - Rent & Utilities: ${opExpenses.rentAndUtilities}
  - Depreciation: ${opExpenses.depreciation}
  - Other OpEx: ${opExpenses.otherOpEx}
  - Total OpEx: ${opExpenses.total}
Operating Income (EBIT): ${is.operatingIncome}
Interest Expense: ${is.interestExpense}
Tax Expense: ${is.taxExpense}
Net Income: ${is.netIncome}

--- BALANCE SHEET ---
Assets:
  - Cash & Equivalents: ${bs.assets.cashAndEquivalents}
  - Accounts Receivable: ${bs.assets.accountsReceivable}
  - Inventory: ${bs.assets.inventory}
  - Prepaid Expenses: ${bs.assets.prepaidExpenses}
  - Total Current Assets: ${bs.assets.totalCurrentAssets}
  - PP&E: ${bs.assets.propertyPlantEquipment}
  - Intangibles: ${bs.assets.intangibleAssets}
  - Total Non-Current Assets: ${bs.assets.totalNonCurrentAssets}
  - Total Assets: ${bs.assets.totalAssets}
Liabilities:
  - Accounts Payable: ${bs.liabilities.accountsPayable}
  - Short-Term Debt: ${bs.liabilities.shortTermDebt}
  - Accrued Liabilities: ${bs.liabilities.accruedLiabilities}
  - Total Current Liabilities: ${bs.liabilities.totalCurrentLiabilities}
  - Long-Term Debt: ${bs.liabilities.longTermDebt}
  - Total Non-Current Liabilities: ${bs.liabilities.totalNonCurrentLiabilities}
  - Total Liabilities: ${bs.liabilities.totalLiabilities}
Equity:
  - Common Stock: ${bs.equity.commonStock}
  - Retained Earnings: ${bs.equity.retainedEarnings}
  - Total Equity: ${bs.equity.totalEquity}

--- CASH FLOW STATEMENT ---
Operating Cash Flow: ${cf.operatingCashFlow}
Investing Cash Flow: ${cf.investingCashFlow}
Financing Cash Flow: ${cf.financingCashFlow}
Net Cash Flow: ${cf.netCashFlow}
Ending Cash Balance: ${cf.endingCashBalance}
`;
    }).join('\n\n');

    const budgetText = budgetPerformance && budgetPerformance.length > 0 
      ? `\n--- BUDGET VS ACTUAL PERFORMANCE ---\n` + budgetPerformance.map((b: any) => {
          return `- Category: ${b.category} | Budgeted: ${b.budgeted} | Actual: ${b.actual} | Variance: ${b.variance} | Var %: ${b.variancePercentage}%`;
        }).join('\n')
      : 'No dynamic budget data supplied. Please perform an evaluation based on standard operating norms.';

    const systemInstruction = `
You are a senior financial consultant and elite investment analyst (CFA & MBA format) advising a company client on its financial performance and strategic guidance.
Your goal is to perform a detailed, accurate, and practical assessment of their Income Statement, Balance Sheet, Cash Flow Statement, Financial Ratios, and Budget Performance.

Follow these strict output directives:
1. Define a Financial Health Score from 1 to 10 (1 is severe insolvency risk/extreme distress, 10 is pristine financial health).
2. Detail Profitability Analysis (revenue growth/decline, margin sustainability, cost overheads).
3. Detail Liquidity Analysis (working capital, current/quick measures).
4. Detail Cash Flow Analysis (run rates, burning cycles, cash conversion indicators).
5. Detail Debt & Risk Analysis (solvency risk, debt-to-equity posture).
6. Compare and compute key industry standard ratios and complete the ratiosAnalysisTable with benchmark values appropriate for their named industry.
7. Outline specific audit-style Red Flags (unusual patterns, discrepancies, warning signs).
8. Detail specific cost savings and Recommendations.
9. Deliver rigorous corporate level Strategic Advice to executive management (cost reductions, productivity, capital efficiency, working capital improvements).
10. Ensure the language is simple but highly professional and structured. Use bullet points for recommendations. Include financial conceptual explanations.
`;

    const prompt = `
Analyze the financial reports for:
- Company Name: ${profile.companyName}
- Industry: ${profile.industry}
- Location: ${profile.location}
- Currency: ${profile.currency}

Data periods supplied:
${financialSummaryText}

Budget Performance information:
${budgetText}

Generate a comprehensive diagnostic advisory report conforming exactly to the requested JSON structure. Make sure all narrative sections are robust, professional, and practical (at least 2-3 detailed paragraphs each of rich advisory text).
`;

    // Query Gemini
    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            executiveSummary: { 
              type: Type.STRING, 
              description: 'Executive summary sections suitable for management reports. Outline overall health, company strengths, and core themes.' 
            },
            financialHealthScore: { 
              type: Type.INTEGER, 
              description: 'A structural financial health and risk rating score from 1 to 10 (1 is severe hazard, 10 is pristine).' 
            },
            profitabilityAnalysis: { 
              type: Type.STRING, 
              description: 'Detailed analysis of margins (Gross, Operating, Net), revenue trends, and overhead issues.' 
            },
            liquidityAnalysis: { 
              type: Type.STRING, 
              description: 'Analysis of current ratio, quick ratio, operational efficiencies, and working capital cycles.' 
            },
            cashFlowAnalysis: { 
              type: Type.STRING, 
              description: 'Operating cash flow conversion, burn rate (if negative), free cash patterns, and cash problems.' 
            },
            debtAndRiskAnalysis: { 
              type: Type.STRING, 
              description: 'Debt exposure (Debt-to-Equity), leverage, insolvency risk, and financial resilience.' 
            },
            ratiosAnalysisTable: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  ratioName: { type: Type.STRING },
                  values: { 
                    type: Type.OBJECT, 
                    description: 'Mapping of period (e.g. "2023", "2024", "2025") to calculated values or strings' 
                  },
                  benchmark: { type: Type.STRING, description: 'Relevant industry standard benchmark values.' },
                  status: { type: Type.STRING, description: 'Must be "optimal", "warning", or "critical".' }
                },
                required: ['ratioName', 'values', 'benchmark', 'status']
              }
            },
            redFlags: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: 'Identified unusual patterns, bookkeeping warnings, or risk distress signs.' 
            },
            recommendations: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: 'Practical, cost-saving opportunities, operational fixes, and profit margin enhancements.' 
            },
            strategicAdvice: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: 'High-level executive strategic business plans, monetization, recapitalization, or cash expansion.' 
            },
            conclusion: { 
              type: Type.STRING, 
              description: 'Senior advisor final remarks, summary notes for directors.' 
            }
          },
          required: [
            'executiveSummary', 
            'financialHealthScore', 
            'profitabilityAnalysis', 
            'liquidityAnalysis', 
            'cashFlowAnalysis', 
            'debtAndRiskAnalysis', 
            'ratiosAnalysisTable', 
            'redFlags', 
            'recommendations', 
            'strategicAdvice', 
            'conclusion'
          ]
        }
      }
    });

    const reportContent = response.text ? JSON.parse(response.text.trim()) : null;
    if (!reportContent) {
      throw new Error('Empirical output returned empty from Gemini.');
    }

    res.json(reportContent);
  } catch (error: any) {
    console.error('Error in /api/analyze:', error);
    res.status(500).json({ 
      error: 'Financial report analysis failed.', 
      details: error.message || error 
    });
  }
});

// 2. ENDPOINT: AI Finance Chatbot Conversation
app.post('/api/chat', async (req: Request, res: Response): Promise<void> => {
  try {
    const { messages, companyProfile, currentData, currentAnalysis } = req.body;

    if (!messages || messages.length === 0) {
      res.status(400).json({ error: 'Conversation history is required.' });
      return;
    }

    // Capture the latest message
    const latestMessage = messages[messages.length - 1];

    // Compile contextual information of the company's financial status
    const financialsContext = currentData 
      ? JSON.stringify(currentData, null, 2).substring(0, 6000) 
      : 'No financial datasets uploaded yet.';
    
    const analysisContext = currentAnalysis 
      ? `Financial Health Rating: ${currentAnalysis.financialHealthScore}/10\n` +
        `Summary Highlights: ${currentAnalysis.executiveSummary.substring(0, 500)}...\n` +
        `Recommendations: ${currentAnalysis.recommendations.join('\n')}`
      : 'No analysis diagnostic report generated yet.';

    const systemInstruction = `
You are the elite AI Finance Chatbot for "FinScope", a premium diagnostic platform.
You act as a senior corporate financial consultant, investment banker, and micro-business advisor.
Provide clear, realistic, and highly practical financial coaching based on the user's specific financial statements and analysis report.

Context about the active client:
- Company Name: ${companyProfile.companyName || 'Unknown company'}
- Industry: ${companyProfile.industry || 'General enterprise'}
- Location: ${companyProfile.location || 'Global'}
- Currency: ${companyProfile.currency || 'USD'}

Client Financial Numbers Summary:
${financialsContext}

Client Diagnostic Health Metrics:
${analysisContext}

Always respond in clean, readable professional business language. Explain complex financial accounting terms if raised (e.g., EBITDA, Quick Ratio, Debt-service coverage ratio, Cash Conversion Cycle). Use bullets/lists to present actionable strategic plans where appropriate.
Keep your replies concise, expert, helpful, and highly contextualized to their exact currency and financial metrics.
`;

    // Map conversation messages to Gemini format
    const chatHistory = messages.slice(0, -1).map((m: any) => ({
      role: m.sender === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }],
    }));

    // Generate output
    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: [
        ...chatHistory,
        { role: 'user', parts: [{ text: latestMessage.text }] }
      ],
      config: {
        systemInstruction,
      }
    });

    const reply = response.text || 'I apologize; I could not process your query at this moment.';
    res.json({ reply });
  } catch (error: any) {
    console.error('Error in /api/chat:', error);
    res.status(500).json({ 
      error: 'AI Chatbot consultation failed.', 
      details: error.message || error 
    });
  }
});

// 3. ENDPOINT: Parse Raw Statements / Management Accounts (Gemini Intelligent File Parsing)
app.post('/api/parse-file', async (req: Request, res: Response): Promise<void> => {
  try {
    const { fileContent, fileBase64, fileMimeType, fileName, profile } = req.body;

    if (!fileContent && !fileBase64) {
      res.status(400).json({ error: 'No raw file data provided.' });
      return;
    }

    const systemInstruction = `
You are an expert financial forensic accountant, auditor, and data extraction engineer.
Your task is to review the uploaded financial statement document (PDF, Excel table, CSV, scanned statement, or raw text) and extract the exact numbers into a standardized structured financial model:
- Extract all data periods present in the document. Sort the periods so that the MOST RECENT / CURRENT YEAR comes first (e.g. "2025", then "2024", then "2023").
- Accurately extract line items for the Income Statement, Balance Sheet, and Cash Flow Statement.
- Do NOT make up numbers if they exist in the document. Read the actual values from the user's uploaded statement.
- If negative numbers are in parentheses (e.g., "(50,000)"), parse them as negative numbers (e.g., -50000).
- If only one period exists, extract that period and reconstruct a baseline prior period reflecting standard historical trends so comparative analysis is possible.
- Ensure basic accounting identities hold:
  * Gross Profit = Revenue - COGS
  * Total OpEx = sum of salaries, marketing, utilities, depreciation, other OpEx
  * Operating Income (EBIT) = Gross Profit - Total OpEx
  * Net Income = EBIT - Interest Expense - Tax Expense
  * Total Current Assets = Cash + Accounts Receivable + Inventory + Prepaid Expenses
  * Total Non-Current Assets = PP&E + Intangibles
  * Total Assets = Total Current Assets + Total Non-Current Assets
  * Total Liabilities = Total Current Liabilities + Total Non-Current Liabilities
  * Total Equity = Common Stock + Retained Earnings
  * Total Assets MUST equal Total Liabilities + Total Equity (Balancing sheet). If out of balance, adjust Retained Earnings so Assets = Liabilities + Equity.
  * Ending Cash Balance = Cash and cash equivalents on balance sheet.

Return structured JSON conforming to the requested schema.
`;

    const promptText = `
Please extract and structure the financial statements from this uploaded file:
- File Name: ${fileName || 'Financial Statement'}
- Client Context: ${profile?.companyName || 'Corporate Client'}, Industry: ${profile?.industry || 'General'}, Currency: ${profile?.currency || 'USD'}

Extract and populate the exact numbers into the periods array with CURRENT YEAR / MOST RECENT PERIOD FIRST.
`;

    let parsedPeriods: any[] | null = null;

    // 1. Try Gemini 3.7 Flash AI extraction (Multimodal for PDF/Images, or text for CSV/Excel)
    if (geminiApiKey) {
      try {
        const contents: any[] = [];
        
        if (fileBase64 && fileMimeType) {
          contents.push({
            inlineData: {
              mimeType: fileMimeType,
              data: fileBase64
            }
          });
        }
        
        if (fileContent) {
          contents.push({
            text: `${promptText}\n\n--- FILE TEXT CONTENT ---\n${fileContent.substring(0, 30000)}\n--- END FILE TEXT CONTENT ---`
          });
        } else {
          contents.push({
            text: promptText
          });
        }

        const response = await ai.models.generateContent({
          model: 'gemini-3.7-flash',
          contents,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                periods: {
                  type: Type.ARRAY,
                  description: 'Array of financial statements mapped per period, sorted current year first.',
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      period: { type: Type.STRING, description: 'e.g. "2025" or "2024"' },
                      incomeStatement: {
                        type: Type.OBJECT,
                        properties: {
                          revenue: { type: Type.NUMBER },
                          cogs: { type: Type.NUMBER },
                          grossProfit: { type: Type.NUMBER },
                          operatingExpenses: {
                            type: Type.OBJECT,
                            properties: {
                              salaries: { type: Type.NUMBER },
                              marketing: { type: Type.NUMBER },
                              rentAndUtilities: { type: Type.NUMBER },
                              depreciation: { type: Type.NUMBER },
                              otherOpEx: { type: Type.NUMBER },
                              total: { type: Type.NUMBER }
                            },
                            required: ['salaries', 'marketing', 'rentAndUtilities', 'depreciation', 'otherOpEx', 'total']
                          },
                          operatingIncome: { type: Type.NUMBER },
                          interestExpense: { type: Type.NUMBER },
                          taxExpense: { type: Type.NUMBER },
                          netIncome: { type: Type.NUMBER }
                        },
                        required: ['revenue', 'cogs', 'grossProfit', 'operatingExpenses', 'operatingIncome', 'interestExpense', 'taxExpense', 'netIncome']
                      },
                      balanceSheet: {
                        type: Type.OBJECT,
                        properties: {
                          assets: {
                            type: Type.OBJECT,
                            properties: {
                              cashAndEquivalents: { type: Type.NUMBER },
                              accountsReceivable: { type: Type.NUMBER },
                              inventory: { type: Type.NUMBER },
                              prepaidExpenses: { type: Type.NUMBER },
                              totalCurrentAssets: { type: Type.NUMBER },
                              propertyPlantEquipment: { type: Type.NUMBER },
                              intangibleAssets: { type: Type.NUMBER },
                              totalNonCurrentAssets: { type: Type.NUMBER },
                              totalAssets: { type: Type.NUMBER }
                            },
                            required: ['cashAndEquivalents', 'accountsReceivable', 'inventory', 'prepaidExpenses', 'totalCurrentAssets', 'propertyPlantEquipment', 'intangibleAssets', 'totalNonCurrentAssets', 'totalAssets']
                          },
                          liabilities: {
                            type: Type.OBJECT,
                            properties: {
                              accountsPayable: { type: Type.NUMBER },
                              shortTermDebt: { type: Type.NUMBER },
                              accruedLiabilities: { type: Type.NUMBER },
                              totalCurrentLiabilities: { type: Type.NUMBER },
                              longTermDebt: { type: Type.NUMBER },
                              totalNonCurrentLiabilities: { type: Type.NUMBER },
                              totalLiabilities: { type: Type.NUMBER }
                            },
                            required: ['accountsPayable', 'shortTermDebt', 'accruedLiabilities', 'totalCurrentLiabilities', 'longTermDebt', 'totalNonCurrentLiabilities', 'totalLiabilities']
                          },
                          equity: {
                            type: Type.OBJECT,
                            properties: {
                              commonStock: { type: Type.NUMBER },
                              retainedEarnings: { type: Type.NUMBER },
                              totalEquity: { type: Type.NUMBER }
                            },
                            required: ['commonStock', 'retainedEarnings', 'totalEquity']
                          }
                        },
                        required: ['assets', 'liabilities', 'equity']
                      },
                      cashFlow: {
                        type: Type.OBJECT,
                        properties: {
                          operatingCashFlow: { type: Type.NUMBER },
                          investingCashFlow: { type: Type.NUMBER },
                          financingCashFlow: { type: Type.NUMBER },
                          netCashFlow: { type: Type.NUMBER },
                          endingCashBalance: { type: Type.NUMBER }
                        },
                        required: ['operatingCashFlow', 'investingCashFlow', 'financingCashFlow', 'netCashFlow', 'endingCashBalance']
                      }
                    },
                    required: ['period', 'incomeStatement', 'balanceSheet', 'cashFlow']
                  }
                }
              },
              required: ['periods']
            }
          }
        });

        const parsed = response.text ? JSON.parse(response.text.trim()) : null;
        if (parsed && Array.isArray(parsed.periods) && parsed.periods.length > 0) {
          parsedPeriods = parsed.periods;
        }
      } catch (geminiErr) {
        console.warn('Gemini file parse warning, reverting to deterministic forensic parser:', geminiErr);
      }
    }

    // 2. Deterministic Forensic Financial Statement Parser fallback if text is available
    if ((!parsedPeriods || parsedPeriods.length === 0) && fileContent) {
      parsedPeriods = parseRawStatementText(fileContent, profile?.industry || 'General');
    }

    if (!parsedPeriods || parsedPeriods.length === 0) {
      res.status(422).json({ error: 'Could not extract financial statement periods from provided content.' });
      return;
    }

    res.json({ periods: parsedPeriods });
  } catch (error: any) {
    console.error('Error in /api/parse-file:', error);
    try {
      if (req.body.fileContent) {
        const fallback = parseRawStatementText(req.body.fileContent, req.body.profile?.industry || 'General');
        if (fallback && fallback.length > 0) {
          res.json({ periods: fallback });
          return;
        }
      }
    } catch {
      // ignore
    }
    res.status(500).json({ 
      error: 'Statement file parsing failed.', 
      details: error.message || error 
    });
  }
});

// Setup Vite Dev Server / Static files handler
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Dev server initialized with live Vite middleware.');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('Production server configured to serve build from dist/');
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Financial Analyzer Server running at http://0.0.0.0:${port}`);
  });
}

startServer();
