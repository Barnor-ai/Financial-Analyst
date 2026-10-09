/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React from 'react';
import { 
  FileSpreadsheet, FileText, Printer, FileDown 
} from 'lucide-react';
import { UserProfile, PeriodFinancialData, FinancialAnalysisReport } from '../types';
import { calculateRatios } from '../data';

interface ReportExporterProps {
  profile: UserProfile;
  periods: PeriodFinancialData[];
  analysis: FinancialAnalysisReport | null;
}

export default function ReportExporter({ profile, periods, analysis }: ReportExporterProps) {
  
  // 1. EXCEL CSV EXPORT
  const exportToExcelCSV = () => {
    let csvContent = `FinScope Corporate Financial Statements Export\n`;
    csvContent += `Company Name,${profile.companyName}\n`;
    csvContent += `Industry,${profile.industry}\n`;
    csvContent += `Operating Location,${profile.location}\n`;
    csvContent += `Reporting Currency,${profile.currency}\n`;
    csvContent += `Export Timestamp,${new Date().toLocaleString()}\n\n`;

    // A. INCOME STATEMENT
    csvContent += `INCOME STATEMENT COMPARATIVE RECORDS\n`;
    csvContent += `Account Line Category,` + periods.map(p => p.period).join(',') + `\n`;
    csvContent += `Total Revenue,` + periods.map(p => p.incomeStatement.revenue).join(',') + `\n`;
    csvContent += `Cost of Goods Sold (COGS),` + periods.map(p => p.incomeStatement.cogs).join(',') + `\n`;
    csvContent += `Gross Profit,` + periods.map(p => p.incomeStatement.grossProfit).join(',') + `\n`;
    csvContent += `OpEx: Salaries,` + periods.map(p => p.incomeStatement.operatingExpenses.salaries).join(',') + `\n`;
    csvContent += `OpEx: Marketing,` + periods.map(p => p.incomeStatement.operatingExpenses.marketing).join(',') + `\n`;
    csvContent += `OpEx: Rent & Utilities,` + periods.map(p => p.incomeStatement.operatingExpenses.rentAndUtilities).join(',') + `\n`;
    csvContent += `OpEx: Depreciation,` + periods.map(p => p.incomeStatement.operatingExpenses.depreciation).join(',') + `\n`;
    csvContent += `OpEx: Other,` + periods.map(p => p.incomeStatement.operatingExpenses.otherOpEx).join(',') + `\n`;
    csvContent += `Total Operating Expenses,` + periods.map(p => p.incomeStatement.operatingExpenses.total).join(',') + `\n`;
    csvContent += `Operating Income (EBIT),` + periods.map(p => p.incomeStatement.operatingIncome).join(',') + `\n`;
    csvContent += `Interest Expense,` + periods.map(p => p.incomeStatement.interestExpense).join(',') + `\n`;
    csvContent += `Tax Expense,` + periods.map(p => p.incomeStatement.taxExpense).join(',') + `\n`;
    csvContent += `Net Earnings,` + periods.map(p => p.incomeStatement.netIncome).join(',') + `\n\n`;

    // B. BALANCE SHEET
    csvContent += `BALANCE SHEET COMPARATIVE RECORDS\n`;
    csvContent += `Assets,` + periods.map(p => p.period).join(',') + `\n`;
    csvContent += `Cash & Equivalents,` + periods.map(p => p.balanceSheet.assets.cashAndEquivalents).join(',') + `\n`;
    csvContent += `Accounts Receivable (AR),` + periods.map(p => p.balanceSheet.assets.accountsReceivable).join(',') + `\n`;
    csvContent += `Inventory Stock,` + periods.map(p => p.balanceSheet.assets.inventory).join(',') + `\n`;
    csvContent += `Prepaid Expenses,` + periods.map(p => p.balanceSheet.assets.prepaidExpenses).join(',') + `\n`;
    csvContent += `Total Current Assets,` + periods.map(p => p.balanceSheet.assets.totalCurrentAssets).join(',') + `\n`;
    csvContent += `Fixed Assets (PP&E),` + periods.map(p => p.balanceSheet.assets.propertyPlantEquipment).join(',') + `\n`;
    csvContent += `Intangible Assets,` + periods.map(p => p.balanceSheet.assets.intangibleAssets).join(',') + `\n`;
    csvContent += `Total Non-Current Assets,` + periods.map(p => p.balanceSheet.assets.totalNonCurrentAssets).join(',') + `\n`;
    csvContent += `TOTAL ASSETS,` + periods.map(p => p.balanceSheet.assets.totalAssets).join(',') + `\n`;
    csvContent += `Liabilities & Equity,,,\n`;
    csvContent += `Accounts Payable (AP),` + periods.map(p => p.balanceSheet.liabilities.accountsPayable).join(',') + `\n`;
    csvContent += `Short-term Debt,` + periods.map(p => p.balanceSheet.liabilities.shortTermDebt).join(',') + `\n`;
    csvContent += `Accrued Liabilities,` + periods.map(p => p.balanceSheet.liabilities.accruedLiabilities).join(',') + `\n`;
    csvContent += `Total Current Liabilities,` + periods.map(p => p.balanceSheet.liabilities.totalCurrentLiabilities).join(',') + `\n`;
    csvContent += `Long-term Liabilities,` + periods.map(p => p.balanceSheet.liabilities.longTermDebt).join(',') + `\n`;
    csvContent += `Total Non-Current Liabilities,` + periods.map(p => p.balanceSheet.liabilities.totalNonCurrentLiabilities).join(',') + `\n`;
    csvContent += `TOTAL LIABILITIES,` + periods.map(p => p.balanceSheet.liabilities.totalLiabilities).join(',') + `\n`;
    csvContent += `Common Capital Stock,` + periods.map(p => p.balanceSheet.equity.commonStock).join(',') + `\n`;
    csvContent += `Retained Earnings,` + periods.map(p => p.balanceSheet.equity.retainedEarnings).join(',') + `\n`;
    csvContent += `TOTAL SHAREHOLDERS EQUITY,` + periods.map(p => p.balanceSheet.equity.totalEquity).join(',') + `\n\n`;

    // C. CASH FLOW
    csvContent += `CASH FLOW STATEMENT COMPARATIVE RECORDS\n`;
    csvContent += `Flow Activity Category,` + periods.map(p => p.period).join(',') + `\n`;
    csvContent += `Operating Cash Flow (OCF),` + periods.map(p => p.cashFlow.operatingCashFlow).join(',') + `\n`;
    csvContent += `Investing Cash Flow (ICF),` + periods.map(p => p.cashFlow.investingCashFlow).join(',') + `\n`;
    csvContent += `Financing Cash Flow (FCF),` + periods.map(p => p.cashFlow.financingCashFlow).join(',') + `\n`;
    csvContent += `Net Period Cash Flow,` + periods.map(p => p.cashFlow.netCashFlow).join(',') + `\n`;
    csvContent += `Ending Cash Balance,` + periods.map(p => p.cashFlow.endingCashBalance).join(',') + `\n\n`;

    // D. RATIOS
    csvContent += `AUTOMATED FINANCIAL RATIOS ANALYSIS\n`;
    csvContent += `Ratio Type Metrics,` + periods.map(p => p.period).join(',') + `\n`;
    csvContent += `Gross Profit Margin (%),` + periods.map(p => calculateRatios(p).grossProfitMargin).join(',') + `\n`;
    csvContent += `Net Profit Margin (%),` + periods.map(p => calculateRatios(p).netProfitMargin).join(',') + `\n`;
    csvContent += `Operating Margin (%),` + periods.map(p => calculateRatios(p).operatingMargin).join(',') + `\n`;
    csvContent += `Current Ratio (x),` + periods.map(p => calculateRatios(p).currentRatio).join(',') + `\n`;
    csvContent += `Quick Ratio (x),` + periods.map(p => calculateRatios(p).quickRatio).join(',') + `\n`;
    csvContent += `Debt-to-Equity Ratio (x),` + periods.map(p => calculateRatios(p).debtToEquityRatio).join(',') + `\n`;
    csvContent += `Return on Assets (%),` + periods.map(p => calculateRatios(p).returnOnAssets).join(',') + `\n`;
    csvContent += `Return on Equity (%),` + periods.map(p => calculateRatios(p).returnOnEquity).join(',') + `\n`;
    csvContent += `Cash Conversion Cycle (days),` + periods.map(p => calculateRatios(p).cashConversionCycle).join(',') + `\n`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${profile.companyName || 'FinScope'}_Comparative_Data.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 2. WORD DOCUMENT EXPORT (.doc format)
  const exportToWordDoc = () => {
    if (!analysis) {
      alert("Please trigger the 'Analyze Statement' review to draft your consultancy report prior to export.");
      return;
    }

    let docHtml = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>`;
    docHtml += `<head><title>FinScope Executive Advisory Report</title>`;
    docHtml += `<style>
      body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #0B192C; margin: 30px; }
      h1 { color: #0B192C; font-size: 24pt; border-bottom: 2px solid #0B192C; padding-bottom: 10px; }
      h2 { color: #0B192C; font-size: 16pt; margin-top: 20pt; }
      h3 { color: #475569; font-size: 12pt; margin-top: 15pt; }
      table { width: 100%; border-collapse: collapse; margin: 15px 0; }
      th { background-color: #FAF7F2; border: 1px solid #E8E2D8; padding: 8px; text-align: left; font-weight: bold; }
      td { border: 1px solid #E8E2D8; padding: 8px; }
      .score { font-size: 14pt; font-weight: bold; color: #0B192C; }
      .bullet-list { margin-left: 20px; }
      .footer { font-size: 10px; color: #64748b; text-align: center; margin-top: 40px; }
    </style></head><body>`;

    docHtml += `<h1>FINSCOPE EXECUTIVE FINANCIAL STUDY</h1>`;
    docHtml += `<h3>Prepared For: <b>${profile.companyName}</b></h3>`;
    docHtml += `<h3>Industry Scope: <b>${profile.industry}</b></h3>`;
    docHtml += `<h3>Operating Geolocation: <b>${profile.location}</b></h3>`;
    docHtml += `<h3>Reporting Model: AI Senior Consultant Analysis</h3>`;
    docHtml += `<h3>Exported On: ${new Date().toLocaleDateString()}</h3>`;
    docHtml += `<hr/>`;

    docHtml += `<h2>Executive Summary</h2>`;
    docHtml += `<p>${analysis.executiveSummary.replace(/\n/g, '<br/>')}</p>`;

    docHtml += `<h2>Financial Health and Risk Score</h2>`;
    docHtml += `<p class="score">Platform Diagnostic Rating: <b>${analysis.financialHealthScore} / 10</b></p>`;

    docHtml += `<h2>Comparative Profitability Analysis</h2>`;
    docHtml += `<p>${analysis.profitabilityAnalysis.replace(/\n/g, '<br/>')}</p>`;

    docHtml += `<h2>Comparative Liquidity & Capital Analysis</h2>`;
    docHtml += `<p>${analysis.liquidityAnalysis.replace(/\n/g, '<br/>')}</p>`;

    docHtml += `<h2>Cash Flow Conversion & Runway</h2>`;
    docHtml += `<p>${analysis.cashFlowAnalysis.replace(/\n/g, '<br/>')}</p>`;

    docHtml += `<h2>Solvency Profiles & Debt Exposure</h2>`;
    docHtml += `<p>${analysis.debtAndRiskAnalysis.replace(/\n/g, '<br/>')}</p>`;

    docHtml += `<h2>Key Diagnostic Financial Ratios</h2>`;
    docHtml += `<table><thead><tr><th>Metric Ratio</th>`;
    periods.forEach(p => {
      docHtml += `<th>${p.period}</th>`;
    });
    docHtml += `<th>Target Standard Benchmark</th><th>Status</th></tr></thead><tbody>`;
    analysis.ratiosAnalysisTable.forEach(row => {
      docHtml += `<tr><td><b>${row.ratioName}</b></td>`;
      periods.forEach(p => {
        docHtml += `<td>${row.values[p.period] || calculateRatios(p)[row.ratioName as keyof any] || 'N/A'}</td>`;
      });
      docHtml += `<td>${row.benchmark}</td><td><b>${row.status.toUpperCase()}</b></td></tr>`;
    });
    docHtml += `</tbody></table>`;

    docHtml += `<h2>Strategic Red Flags Identified</h2>`;
    docHtml += `<ul class="bullet-list">`;
    analysis.redFlags.forEach(flag => {
      docHtml += `<li><b>Warning Sign:</b> ${flag}</li>`;
    });
    docHtml += `</ul>`;

    docHtml += `<h2>Operational Efficiency Recommendations</h2>`;
    docHtml += `<ul class="bullet-list">`;
    analysis.recommendations.forEach(rec => {
      docHtml += `<li><b>Actionable Rec:</b> ${rec}</li>`;
    });
    docHtml += `</ul>`;

    docHtml += `<h2>Executive Strategic Advisory Plans</h2>`;
    docHtml += `<ul class="bullet-list">`;
    analysis.strategicAdvice.forEach(adv => {
      docHtml += `<li><b>Board Plan:</b> ${adv}</li>`;
    });
    docHtml += `</ul>`;

    docHtml += `<h2>Final Conclusion</h2>`;
    docHtml += `<p>${analysis.conclusion.replace(/\n/g, '<br/>')}</p>`;

    docHtml += `<div class="footer"><hr/>CONFIDENTIAL • PREPARED EXCLUSIVELY FOR FINSCOPE DIRECTORS</div>`;
    docHtml += `</body></html>`;

    const blob = new Blob([docHtml], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${profile.companyName || 'FinScope'}_Executive_Analysis.doc`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const triggerPDFPrint = () => {
    window.print();
  };

  return (
    <div className="bg-white border border-[#E8E2D8] rounded-2xl p-6 shadow-[0_2px_12px_rgba(11,25,44,0.04)] text-left" id="exporter-controls-card">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h4 className="font-serif-display text-base font-semibold text-[#0B192C] mb-1 flex items-center gap-2">
            <FileDown className="w-5 h-5 text-[#D4A347]" />
            <span>Export & Print Financial Records</span>
          </h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Acquire fully reconciled documentation suitable for executive boards, investors, lenders, or audits.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          {/* CSV Excel */}
          <button
            type="button"
            onClick={exportToExcelCSV}
            className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer flex items-center gap-2 border border-[#E8E2D8] transition-all shadow-xs"
            title="Download CSV workbook for Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#0B192C]" />
            <span>Excel Ledger (.csv)</span>
          </button>

          {/* Word Doc */}
          <button
            type="button"
            onClick={exportToWordDoc}
            disabled={!analysis}
            className={`px-4 py-2.5 border text-xs font-semibold rounded-lg cursor-pointer flex items-center gap-2 transition-all ${
              analysis 
                ? 'border-[#E8E2D8] bg-white hover:bg-slate-50 text-slate-700 shadow-xs' 
                : 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
            title="Download Board Memo Word Doc file"
          >
            <FileText className="w-4 h-4 text-[#0B192C]" />
            <span>Word Report (.doc)</span>
          </button>

          {/* Printable PDF */}
          <button
            type="button"
            onClick={triggerPDFPrint}
            className="px-4.5 py-2.5 bg-[#0B192C] hover:bg-[#162A45] text-white font-semibold rounded-lg transition-all text-xs cursor-pointer flex items-center gap-2 shadow-xs"
            title="Trigger formatted print layout directly to PDF"
          >
            <Printer className="w-4 h-4 text-white" />
            <span>Print PDF</span>
          </button>
        </div>
      </div>

      {!analysis && (
        <p className="text-xs text-slate-500 mt-3 flex items-center gap-1.5 bg-[#FAF7F2] border border-[#E8E2D8] p-3 rounded-lg">
          ℹ️ Tip: Complete the AI Advisory analysis to export full narrative reports with strategic takeaways and board memorandums.
        </p>
      )}
    </div>
  );
}
