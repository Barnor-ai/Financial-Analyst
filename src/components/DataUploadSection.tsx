/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  UploadCloud, Check, AlertCircle, AlertTriangle, RefreshCw, FileText, X, 
  Sparkles, CheckCircle2, ChevronRight, ChevronDown, FileSpreadsheet, Layers,
  Plus, Trash2, Save, Download, ArrowRight, ShieldCheck, ShieldAlert,
  FileCode, History, Eye, BookOpen, Building2, Calculator, Info
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { 
  UserProfile, PeriodFinancialData, FinancialStatementType, 
  AccountLineItem, AccountClassification, MappingTemplate, 
  UploadedFileRecord, ArithmeticDiscrepancy 
} from '../types';
import { 
  parseRawStatementText, parseTableRows, SAMPLE_FINANCIAL_STATEMENTS 
} from '../utils/statementParser';
import { 
  detectArithmeticDiscrepancies, convertPeriodsToLineItems, 
  convertLineItemsToPeriods, DEFAULT_MAPPING_TEMPLATES, 
  validateFinancialStatements 
} from '../utils/financialEngine';
import { 
  getStoredUploadRecords, saveUploadRecord, getCustomMappingTemplates, 
  saveCustomMappingTemplate, createSampleUploadRecord 
} from '../utils/uploadRecords';
import { SAMPLE_FINANCIAL_PERIODS, SUPPORTED_CURRENCIES } from '../data';

export type UploadCategoryType = 
  | 'statements' 
  | 'management_accounts' 
  | 'budget' 
  | 'actuals'
  | 'trial_balance'
  | 'cash_flow'
  | 'balance_sheet'
  | 'schedules';

interface DataUploadSectionProps {
  profile: UserProfile;
  setProfile: (p: UserProfile) => void;
  onDataLoaded: (periods: PeriodFinancialData[]) => void;
  onInitializeBlank: (companyName: string) => void;
  periodsUploaded: boolean;
  onTriggerAnalysis: () => void;
  defaultCategory?: UploadCategoryType;
}

export default function DataUploadSection({ 
  profile, 
  setProfile, 
  onDataLoaded, 
  onInitializeBlank, 
  periodsUploaded: _periodsUploaded, 
  onTriggerAnalysis,
  defaultCategory = 'statements'
}: DataUploadSectionProps) {
  // Workflow step: 1: Source & Upload, 2: Review & Classification, 3: Quality & Audit, 4: Audit Archive
  const [workflowStep, setWorkflowStep] = useState<'upload' | 'review' | 'validate' | 'archive'>('upload');

  // Statement Type & Category Selection (8 supported financial statements)
  const [statementType, setStatementType] = useState<FinancialStatementType>('comparative');
  const [uploadCategory, setUploadCategory] = useState<UploadCategoryType>(defaultCategory);
  const [reportTitle, setReportTitle] = useState('FY2025 Financial Review');
  const [reportPeriod, setReportPeriod] = useState('Annually');
  const [periodLabel, setPeriodLabel] = useState('Jan - Dec 2025');

  // Upload state
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileTextContent, setFileTextContent] = useState<string>('');
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [fileMimeType, setFileMimeType] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrStatusText, setOcrStatusText] = useState<string>('');
  const [processError, setProcessError] = useState<string | null>(null);
  const [processSuccess, setProcessSuccess] = useState<string | null>(null);
  const [uploadMethod, setUploadMethod] = useState<'file' | 'manual'>('file');

  // Active Multi-Period Financial Data
  const [currentPeriods, setCurrentPeriods] = useState<PeriodFinancialData[]>(SAMPLE_FINANCIAL_PERIODS);
  
  // Editable Line Items Grid State
  const [lineItems, setLineItems] = useState<AccountLineItem[]>(() => convertPeriodsToLineItems(SAMPLE_FINANCIAL_PERIODS));
  const [activeFilterCategory, setActiveFilterCategory] = useState<'all' | 'income_statement' | 'balance_sheet' | 'cash_flow' | 'unmapped'>('all');
  const [selectedCurrency, setSelectedCurrency] = useState(profile.currency || 'USD ($)');

  // Reusable Account-Mapping Templates
  const [availableTemplates, setAvailableTemplates] = useState<MappingTemplate[]>(DEFAULT_MAPPING_TEMPLATES);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(DEFAULT_MAPPING_TEMPLATES[0].id);
  const [newTemplateName, setNewTemplateName] = useState<string>('');
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);

  // Audit Records & Upload History
  const [uploadRecords, setUploadRecords] = useState<UploadedFileRecord[]>([]);
  const [selectedRecordForPreview, setSelectedRecordForPreview] = useState<UploadedFileRecord | null>(null);

  // Arithmetic Discrepancies
  const [discrepancies, setDiscrepancies] = useState<ArithmeticDiscrepancy[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const curSymbol = selectedCurrency.match(/\(([^)]+)\)/)?.[1] || selectedCurrency.split(' ')[0] || '$';

  // Load custom templates and upload history on mount
  useEffect(() => {
    const customTpls = getCustomMappingTemplates();
    if (customTpls.length > 0) {
      setAvailableTemplates([...DEFAULT_MAPPING_TEMPLATES, ...customTpls]);
    }
    const records = getStoredUploadRecords();
    if (records.length === 0) {
      const demoRec = createSampleUploadRecord(SAMPLE_FINANCIAL_PERIODS, selectedCurrency);
      setUploadRecords([demoRec]);
    } else {
      setUploadRecords(records);
    }
  }, []);

  // Recalculate discrepancies whenever periods update
  useEffect(() => {
    if (currentPeriods && currentPeriods.length > 0) {
      const allDisc: ArithmeticDiscrepancy[] = [];
      for (const p of currentPeriods) {
        allDisc.push(...detectArithmeticDiscrepancies(p, curSymbol));
      }
      setDiscrepancies(allDisc);
    }
  }, [currentPeriods, curSymbol]);

  // Drag & Drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  // Main file processing router
  const processFile = (selectedFile: File) => {
    setFile(selectedFile);
    setProcessError(null);
    setProcessSuccess(null);
    setFileBase64(null);
    setFileMimeType(null);
    setIsProcessing(true);
    setOcrStatusText(`Reading ${selectedFile.name}...`);
    
    const fileName = selectedFile.name.toLowerCase();
    const fileExtension = fileName.substring(fileName.lastIndexOf('.'));
    
    // 1. EXCEL SPREADSHEETS (.xlsx, .xls, .ods)
    if (['.xlsx', '.xls', '.ods'].includes(fileExtension)) {
      setOcrStatusText('Analyzing Excel workbook sheets & formulas...');
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const buffer = e.target?.result as ArrayBuffer;
          const workbook = XLSX.read(buffer, { type: 'array' });
          
          let parsedLocalPeriods: PeriodFinancialData[] = [];
          const sheetTexts: string[] = [];

          workbook.SheetNames.forEach(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            const rows: (string | number)[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            if (rows && rows.length > 0) {
              const periodsFromSheet = parseTableRows(rows, profile.industry || 'General');
              if (periodsFromSheet.length > parsedLocalPeriods.length) {
                parsedLocalPeriods = periodsFromSheet;
              }
            }
            const csv = XLSX.utils.sheet_to_csv(worksheet);
            if (csv.trim()) {
              sheetTexts.push(`--- SHEET: ${sheetName} ---\n${csv}`);
            }
          });
          
          const fullExtracted = sheetTexts.join('\n\n');
          setFileTextContent(fullExtracted);

          if (parsedLocalPeriods.length > 0) {
            const sorted = [...parsedLocalPeriods].sort((a, b) => b.period.localeCompare(a.period, undefined, { numeric: true }));
            setCurrentPeriods(sorted);
            const lineItemsExtracted = convertPeriodsToLineItems(sorted);
            setLineItems(lineItemsExtracted);
            setProcessSuccess(
              `Excel workbook parsed successfully: ${sorted.length} comparative period(s) detected (${sorted.map(p => p.period).join(', ')}). Proceeding to review screen.`
            );
            recordUploadedFile(selectedFile, fullExtracted, sorted, 'completed', 'Excel workbooks multi-sheet extraction complete.');
            setTimeout(() => setWorkflowStep('review'), 800);
          } else {
            setProcessSuccess(`Excel workbook "${selectedFile.name}" read (${workbook.SheetNames.length} sheets). Ready for forensic extraction.`);
          }
        } catch (err: any) {
          console.error('Excel parse error:', err);
          setProcessError(`Could not read Excel file: ${err.message || 'Corrupted or unsupported format'}. Please try CSV format or Manual Data Entry.`);
        } finally {
          setIsProcessing(false);
        }
      };
      reader.onerror = () => {
        setIsProcessing(false);
        setProcessError('Failed to read Excel workbook.');
      };
      reader.readAsArrayBuffer(selectedFile);

    // 2. PDF DOCUMENTS (Including Scanned PDFs via OCR)
    } else if (fileExtension === '.pdf') {
      setOcrStatusText('Scanning PDF document structure and tables...');
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const dataUrl = e.target?.result as string;
          const base64Data = dataUrl.split(',')[1] || '';
          setFileBase64(base64Data);
          setFileMimeType('application/pdf');
          setFileTextContent(`[PDF Document: ${selectedFile.name}]`);
          
          setOcrStatusText('Running Optical Character Recognition (OCR) on PDF pages...');
          
          // Trigger server OCR parsing
          const res = await fetch('/api/parse-file', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileBase64: base64Data,
              fileMimeType: 'application/pdf',
              fileName: selectedFile.name,
              profile,
              reportTitle,
              reportPeriod
            })
          });

          if (res.ok) {
            const data = await res.json();
            if (data.periods && Array.isArray(data.periods) && data.periods.length > 0) {
              const sorted = [...data.periods].sort((a: any, b: any) => b.period.localeCompare(a.period, undefined, { numeric: true }));
              setCurrentPeriods(sorted);
              setLineItems(convertPeriodsToLineItems(sorted));
              setProcessSuccess(`PDF and OCR tables extracted: ${sorted.length} periods mapped (${sorted.map((p: any) => p.period).join(', ')}). Review figures below.`);
              recordUploadedFile(selectedFile, `[Extracted from PDF ${selectedFile.name}]`, sorted, 'ocr_processed', 'Scanned PDF extracted via multimodal OCR.');
              setTimeout(() => setWorkflowStep('review'), 800);
              return;
            }
          }
          
          // Clear error report if OCR could not process
          setProcessError(
            `Document could not be processed: The PDF does not contain recognizable financial statements or OCR text tables. Please verify that the PDF has legible text or upload an Excel workbook, CSV, or use Manual Data Entry.`
          );
        } catch (err: any) {
          console.error('PDF OCR error:', err);
          setProcessError(`PDF processing failed: ${err.message || 'Unreadable document'}. Please upload an Excel workbook, CSV, or use Manual Data Entry.`);
        } finally {
          setIsProcessing(false);
        }
      };
      reader.onerror = () => {
        setIsProcessing(false);
        setProcessError('Failed to read PDF document stream.');
      };
      reader.readAsDataURL(selectedFile);

    // 3. IMAGES / SCANNED STATEMENTS (.png, .jpg, .jpeg)
    } else if (['.png', '.jpg', '.jpeg', '.webp'].includes(fileExtension)) {
      setOcrStatusText('Running high-resolution Optical Character Recognition (OCR) on statement image...');
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const dataUrl = e.target?.result as string;
          const mime = selectedFile.type || 'image/jpeg';
          const base64Data = dataUrl.split(',')[1] || '';
          setFileBase64(base64Data);
          setFileMimeType(mime);
          setFileTextContent(`[Image Statement: ${selectedFile.name}]`);

          const res = await fetch('/api/parse-file', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileBase64: base64Data,
              fileMimeType: mime,
              fileName: selectedFile.name,
              profile
            })
          });

          if (res.ok) {
            const data = await res.json();
            if (data.periods && Array.isArray(data.periods) && data.periods.length > 0) {
              const sorted = [...data.periods].sort((a: any, b: any) => b.period.localeCompare(a.period, undefined, { numeric: true }));
              setCurrentPeriods(sorted);
              setLineItems(convertPeriodsToLineItems(sorted));
              setProcessSuccess(`Statement image OCR extracted: ${sorted.length} period(s) captured.`);
              recordUploadedFile(selectedFile, `[Image Scan: ${selectedFile.name}]`, sorted, 'ocr_processed', 'Scanned image extracted via OCR.');
              setTimeout(() => setWorkflowStep('review'), 800);
              return;
            }
          }
          setProcessError(`Document could not be processed: Scanned image was illegible or lacked tabular financial rows. Please upload clear scans, PDF, or Excel.`);
        } catch (err: any) {
          setProcessError(`OCR parsing error: ${err.message || 'Image could not be parsed'}.`);
        } finally {
          setIsProcessing(false);
        }
      };
      reader.onerror = () => {
        setIsProcessing(false);
        setProcessError('Failed to read image stream.');
      };
      reader.readAsDataURL(selectedFile);

    // 4. CSV, TXT (Direct Tabular Format)
    } else {
      setOcrStatusText('Reading CSV line items and delimiter mappings...');
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          setFileTextContent(text || '');
          if (text) {
            const parsed = parseRawStatementText(text, profile.industry || 'General');
            if (parsed.length > 0) {
              const sorted = [...parsed].sort((a, b) => b.period.localeCompare(a.period, undefined, { numeric: true }));
              setCurrentPeriods(sorted);
              setLineItems(convertPeriodsToLineItems(sorted));
              setProcessSuccess(`CSV parsed: ${sorted.length} period(s) extracted (${sorted.map(p => p.period).join(', ')}).`);
              recordUploadedFile(selectedFile, text, sorted, 'completed', 'CSV statement parsed cleanly.');
              setTimeout(() => setWorkflowStep('review'), 800);
            } else {
              setProcessError('CSV loaded, but no valid financial line items (Revenue, COGS, Assets, Liabilities) could be identified. Please review CSV headers.');
            }
          }
        } catch (err: any) {
          setProcessError(`Failed to parse CSV: ${err.message || 'Invalid format'}`);
        } finally {
          setIsProcessing(false);
        }
      };
      reader.onerror = () => {
        setIsProcessing(false);
        setProcessError('Error reading uploaded CSV text file.');
      };
      reader.readAsText(selectedFile);
    }
  };

  // Records an original uploaded file and its normalized data snapshot
  const recordUploadedFile = (
    uploadedFile: File, 
    rawPreview: string, 
    normalized: PeriodFinancialData[], 
    status: 'completed' | 'ocr_processed' | 'needs_review' | 'failed',
    message: string
  ) => {
    const detectedPeriods = normalized.map(p => p.period);
    const validationRes = validateFinancialStatements(normalized[0]);
    const detectedDiscs = detectArithmeticDiscrepancies(normalized[0], curSymbol);

    const record: UploadedFileRecord = {
      id: `rec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      fileName: uploadedFile.name,
      fileSize: uploadedFile.size,
      mimeType: uploadedFile.type || 'text/plain',
      uploadTimestamp: new Date().toISOString(),
      category: statementType,
      periodsDetected: detectedPeriods,
      currency: selectedCurrency,
      rawContentPreview: rawPreview.substring(0, 10000),
      status,
      processingMessage: message,
      validationScore: validationRes.overallScore,
      discrepancies: detectedDiscs,
      normalizedDataSnapshot: normalized
    };

    const updatedRecords = saveUploadRecord(record);
    setUploadRecords(updatedRecords);
  };

  // Re-sync periods from modified line items
  const syncLineItemsToPeriods = (updatedItems: AccountLineItem[]) => {
    setLineItems(updatedItems);
    const periodKeys = currentPeriods.map(p => p.period);
    const updatedPeriods = convertLineItemsToPeriods(updatedItems, periodKeys);
    setCurrentPeriods(updatedPeriods);
  };

  // Handle line item field changes
  const handleLineItemChange = (
    id: string, 
    field: keyof AccountLineItem, 
    value: any, 
    periodKey?: string
  ) => {
    const updated = lineItems.map(item => {
      if (item.id !== id) return item;

      if (field === 'values' && periodKey) {
        const numVal = typeof value === 'number' ? value : parseFloat(value) || 0;
        return {
          ...item,
          values: {
            ...item.values,
            [periodKey]: numVal
          }
        };
      }

      if (field === 'normalBalance') {
        // Toggling normal balance inverts sign or classification expectation
        return {
          ...item,
          normalBalance: value as 'debit' | 'credit'
        };
      }

      return {
        ...item,
        [field]: value
      };
    });

    syncLineItemsToPeriods(updated);
  };

  // Add new custom account line item
  const handleAddLineItem = () => {
    const periodKeys = currentPeriods.map(p => p.period);
    const defaultVals: { [key: string]: number } = {};
    periodKeys.forEach(pk => { defaultVals[pk] = 0; });

    const newItem: AccountLineItem = {
      id: `acc-custom-${Date.now()}`,
      code: `${Math.floor(1000 + Math.random() * 8999)}`,
      description: 'New Account Line Item',
      classification: 'unmapped',
      statementType: 'income_statement',
      normalBalance: 'debit',
      department: 'Corporate',
      costCentre: 'CC-GEN-01',
      entityUnit: profile.companyName || 'Parent Entity',
      values: defaultVals,
      isUnmapped: true
    };

    const updated = [...lineItems, newItem];
    syncLineItemsToPeriods(updated);
  };

  // Delete account line item
  const handleDeleteLineItem = (id: string) => {
    const updated = lineItems.filter(it => it.id !== id);
    syncLineItemsToPeriods(updated);
  };

  // Apply reusable mapping template
  const handleApplyTemplate = (templateId: string) => {
    const tpl = availableTemplates.find(t => t.id === templateId);
    if (!tpl) return;

    setSelectedTemplateId(templateId);

    const updated = lineItems.map(item => {
      const lowerDesc = item.description.toLowerCase();
      const codeKey = item.code.trim();

      // Check if template mappings match either code or account description pattern
      let matchedClassification: AccountClassification | null = null;
      if (tpl.mappings[codeKey]) {
        matchedClassification = tpl.mappings[codeKey] as AccountClassification;
      } else {
        for (const [pattern, classification] of Object.entries(tpl.mappings)) {
          if (lowerDesc.includes(pattern.toLowerCase())) {
            matchedClassification = classification as AccountClassification;
            break;
          }
        }
      }

      if (matchedClassification) {
        return {
          ...item,
          classification: matchedClassification,
          isUnmapped: false
        };
      }
      return item;
    });

    syncLineItemsToPeriods(updated);
    setProcessSuccess(`Applied mapping template "${tpl.name}". Classifications refreshed.`);
  };

  // Save current classifications as a custom reusable template
  const handleSaveAsCustomTemplate = () => {
    if (!newTemplateName.trim()) return;

    const newMappings: { [key: string]: AccountClassification } = {};
    lineItems.forEach(item => {
      if (item.classification !== 'unmapped') {
        newMappings[item.code] = item.classification;
        const mainWord = item.description.toLowerCase().split(' ')[0];
        if (mainWord && mainWord.length > 2) {
          newMappings[mainWord] = item.classification;
        }
      }
    });

    const customTpl: MappingTemplate = {
      id: `tpl-custom-${Date.now()}`,
      name: newTemplateName.trim(),
      framework: 'Custom',
      description: `Custom mapping template created for ${profile.companyName || 'Organization'}`,
      isDefault: false,
      mappings: newMappings,
      createdAt: new Date().toISOString()
    };

    const updatedTpls = saveCustomMappingTemplate(customTpl);
    setAvailableTemplates([...DEFAULT_MAPPING_TEMPLATES, ...updatedTpls]);
    setSelectedTemplateId(customTpl.id);
    setNewTemplateName('');
    setShowSaveTemplateModal(false);
    setProcessSuccess(`Custom mapping template "${customTpl.name}" saved! Available for all future uploads.`);
  };

  // Add a new period column (e.g. FY2026, Q1 2025)
  const handleAddPeriod = (newPeriodName: string) => {
    if (!newPeriodName.trim()) return;
    const clean = newPeriodName.trim();
    if (currentPeriods.some(p => p.period === clean)) return;

    const baseline = currentPeriods[0];
    const newPeriodData: PeriodFinancialData = {
      period: clean,
      incomeStatement: { ...baseline.incomeStatement },
      balanceSheet: { ...baseline.balanceSheet },
      cashFlow: { ...baseline.cashFlow }
    };

    const updatedPeriods = [newPeriodData, ...currentPeriods];
    setCurrentPeriods(updatedPeriods);
    setLineItems(convertPeriodsToLineItems(updatedPeriods));
    setProcessSuccess(`Added comparative reporting period "${clean}".`);
  };

  // Finalize review and proceed to analysis
  const handleFinalizeAndProceed = () => {
    // Update company profile currency and basis if changed
    setProfile({
      ...profile,
      currency: selectedCurrency
    });

    // Notify parent app of updated periods
    onDataLoaded(currentPeriods);
  };

  // Filter line items
  const filteredLineItems = lineItems.filter(item => {
    if (activeFilterCategory === 'all') return true;
    if (activeFilterCategory === 'unmapped') return item.classification === 'unmapped' || item.isUnmapped;
    return item.statementType === activeFilterCategory;
  });

  const unmappedCount = lineItems.filter(it => it.classification === 'unmapped' || it.isUnmapped).length;

  return (
    <div className="w-full max-w-6xl py-2 text-left animate-fade-in" id="upload-statement-view">
      
      {/* Eyebrow & Main Title matching FinScope brand identity */}
      <div className="mb-2">
        <span className="text-[11px] font-mono font-bold tracking-[0.25em] text-[#D4A347] uppercase">
          FINANCIAL STATEMENTS & MANAGEMENT ACCOUNTS
        </span>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-serif-display text-3xl sm:text-4xl font-bold text-[#0B192C] tracking-tight">
            Financial Data Upload & Review Studio
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Enterprise workflow supporting PDF, Scanned OCR, Excel workbooks, CSV, and interactive manual entry with transparent arithmetic reconciliation.
          </p>
        </div>

        {/* Global Currency & Entity Selector Header */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5 bg-white border border-[#E8E2D8] rounded-xl px-3 py-1.5 shadow-xs">
            <span className="text-xs text-slate-500 font-mono">Currency:</span>
            <select
              value={selectedCurrency}
              onChange={(e) => {
                setSelectedCurrency(e.target.value);
                setProfile({ ...profile, currency: e.target.value });
              }}
              className="text-xs font-bold text-[#0B192C] bg-transparent border-none outline-none cursor-pointer"
            >
              {SUPPORTED_CURRENCIES.map(c => (
                <option key={c.code} value={c.code}>{c.code} - {c.name}</option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => setWorkflowStep(workflowStep === 'archive' ? 'upload' : 'archive')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs ${
              workflowStep === 'archive'
                ? 'bg-[#0B1530] text-white border-[#0B1530]'
                : 'bg-white text-slate-700 hover:text-[#0B192C] border-[#E8E2D8]'
            }`}
          >
            <History className="w-3.5 h-3.5 text-[#D4A347]" />
            <span>Upload Archive ({uploadRecords.length})</span>
          </button>
        </div>
      </div>

      {/* Guided Workflow Stepper Bar */}
      <div className="bg-white border border-[#E8E2D8] rounded-2xl p-3 shadow-xs mb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          
          <button
            type="button"
            onClick={() => setWorkflowStep('upload')}
            className={`flex items-center gap-3 p-2.5 rounded-xl text-left transition-colors cursor-pointer ${
              workflowStep === 'upload' 
                ? 'bg-[#FAF7F2] border border-[#E8E2D8]' 
                : 'hover:bg-[#FAF7F2]'
            }`}
          >
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono text-xs font-bold shrink-0 ${
              workflowStep === 'upload' ? 'bg-[#0B1530] text-white' : 'bg-[#E8E2D8] text-slate-700'
            }`}>
              1
            </div>
            <div>
              <div className="text-xs font-bold text-[#0B192C]">Upload & Stream</div>
              <div className="text-[10px] text-slate-500">PDF, Excel, CSV, Manual</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setWorkflowStep('review')}
            className={`flex items-center gap-3 p-2.5 rounded-xl text-left transition-colors cursor-pointer ${
              workflowStep === 'review' 
                ? 'bg-[#FAF7F2] border border-[#E8E2D8]' 
                : 'hover:bg-[#FAF7F2]'
            }`}
          >
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono text-xs font-bold shrink-0 ${
              workflowStep === 'review' ? 'bg-[#0B1530] text-white' : 'bg-[#E8E2D8] text-slate-700'
            }`}>
              2
            </div>
            <div>
              <div className="text-xs font-bold text-[#0B192C] flex items-center gap-1.5">
                <span>Editable Review</span>
                {unmappedCount > 0 && (
                  <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 text-[9px] font-bold rounded">
                    {unmappedCount}
                  </span>
                )}
              </div>
              <div className="text-[10px] text-slate-500">Classify & Edit Accounts</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setWorkflowStep('validate')}
            className={`flex items-center gap-3 p-2.5 rounded-xl text-left transition-colors cursor-pointer ${
              workflowStep === 'validate' 
                ? 'bg-[#FAF7F2] border border-[#E8E2D8]' 
                : 'hover:bg-[#FAF7F2]'
            }`}
          >
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono text-xs font-bold shrink-0 ${
              workflowStep === 'validate' ? 'bg-[#0B1530] text-white' : 'bg-[#E8E2D8] text-slate-700'
            }`}>
              3
            </div>
            <div>
              <div className="text-xs font-bold text-[#0B192C] flex items-center gap-1.5">
                <span>Quality & Audits</span>
                {discrepancies.length > 0 && (
                  <span className="px-1.5 py-0.2 bg-red-100 text-red-800 text-[9px] font-bold rounded">
                    {discrepancies.length}
                  </span>
                )}
              </div>
              <div className="text-[10px] text-slate-500">Discrepancy Reporting</div>
            </div>
          </button>

          <button
            type="button"
            onClick={handleFinalizeAndProceed}
            className="flex items-center gap-3 p-2.5 rounded-xl text-left bg-[#D6AE55] hover:bg-[#C59B42] text-[#0B1530] transition-colors cursor-pointer group shadow-xs"
          >
            <div className="w-7 h-7 rounded-lg bg-[#0B1530] text-white flex items-center justify-center font-mono text-xs font-bold shrink-0">
              4
            </div>
            <div className="flex-1">
              <div className="text-xs font-bold flex items-center justify-between">
                <span>Start CFO Analysis</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </div>
              <div className="text-[10px] opacity-80">Generate Executive Report</div>
            </div>
          </button>

        </div>
      </div>

      {/* ======================================================== */}
      {/* STEP 1: UPLOAD & STREAM SELECTION                        */}
      {/* ======================================================== */}
      {workflowStep === 'upload' && (
        <div className="space-y-6">
          
          {/* Statement Stream Selector (8 Types) */}
          <div className="bg-white border border-[#E8E2D8] rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E8E2D8] pb-3">
              <div>
                <h3 className="text-sm font-bold text-[#0B192C]">Select Financial Statement Category</h3>
                <p className="text-xs text-slate-500">Choose the accounting document type you are uploading</p>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-mono">Upload Mode:</span>
                <div className="flex items-center bg-[#FAF7F2] p-1 rounded-xl border border-[#E8E2D8]">
                  <button
                    type="button"
                    onClick={() => setUploadMethod('file')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      uploadMethod === 'file' ? 'bg-[#0B1530] text-white' : 'text-slate-600'
                    }`}
                  >
                    File Upload
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUploadMethod('manual');
                      setWorkflowStep('review');
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                      uploadMethod === 'manual' ? 'bg-[#0B1530] text-white' : 'text-slate-600'
                    }`}
                  >
                    <Calculator className="w-3 h-3" />
                    <span>Manual Entry</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { type: 'pnl', label: 'Profit or Loss (P&L)', desc: 'Revenue, COGS, OpEx, Net Income' },
                { type: 'balance_sheet', label: 'Financial Position', desc: 'Assets, Liabilities, Equity' },
                { type: 'cash_flow', label: 'Cash Flows', desc: 'Operating, Investing, Financing' },
                { type: 'trial_balance', label: 'Trial Balance', desc: 'Dr / Cr ledger accounts' },
                { type: 'management_accounts', label: 'Monthly Mgmt Accounts', desc: 'Variance & run rates' },
                { type: 'comparative', label: 'Comparative Statements', desc: 'Multi-year side-by-side' },
                { type: 'supporting_schedules', label: 'Supporting Schedules', desc: 'Fixed assets, debt, AR/AP' },
                { type: 'general_ledger', label: 'General Ledger Summary', desc: 'Normalized subledger summaries' }
              ].map(cat => (
                <button
                  key={cat.type}
                  type="button"
                  onClick={() => {
                    setStatementType(cat.type as FinancialStatementType);
                    setReportTitle(`${cat.label} ${profile.companyName || ''}`);
                  }}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    statementType === cat.type
                      ? 'border-[#0B1530] bg-[#FAF7F2] shadow-xs ring-1 ring-[#0B1530]'
                      : 'border-[#E8E2D8] bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="text-xs font-bold text-[#0B192C]">{cat.label}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5 truncate">{cat.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Main Upload Zone */}
          <div className="bg-white border border-[#E8E2D8] rounded-2xl p-8 sm:p-10 shadow-[0_2px_12px_rgba(11,25,44,0.03)] space-y-6">
            
            {/* Metadata Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-600">Report Title</label>
                <input
                  type="text"
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-xs font-semibold text-[#0B192C] focus:outline-none focus:border-[#0B1530]"
                  placeholder="e.g. FY2025 Audited Financial Statements"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-600">Reporting Frequency</label>
                <select
                  value={reportPeriod}
                  onChange={(e) => setReportPeriod(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-xs font-semibold text-[#0B192C] focus:outline-none focus:border-[#0B1530] cursor-pointer"
                >
                  <option value="Annually">Annually (Full-Year)</option>
                  <option value="Quarterly">Quarterly (Q1 - Q4)</option>
                  <option value="Monthly">Monthly Management Accounts</option>
                  <option value="Year-to-Date">Year-to-Date (YTD)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-600">Period Span Label</label>
                <input
                  type="text"
                  value={periodLabel}
                  onChange={(e) => setPeriodLabel(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-xs font-semibold text-[#0B192C] focus:outline-none focus:border-[#0B1530]"
                  placeholder="e.g. Jan - Dec 2025"
                />
              </div>
            </div>

            {/* Drag & Drop Box */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[220px] ${
                dragActive
                  ? 'border-[#0B1530] bg-[#FAF7F2]'
                  : 'border-[#D4CBBF] hover:border-[#0B1530] bg-[#FAF7F2]/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".xlsx,.xls,.csv,.txt,.pdf,.png,.jpg,.jpeg"
                onChange={handleFileChange}
              />

              <div className="w-14 h-14 rounded-2xl bg-white border border-[#E8E2D8] text-[#0B1530] flex items-center justify-center shadow-xs mb-4">
                <UploadCloud className="w-7 h-7 text-[#D4A347]" />
              </div>

              <div className="space-y-1.5 max-w-md">
                <p className="text-sm sm:text-base font-bold text-[#0B192C]">
                  Click to select file, or drag and drop statement here
                </p>
                <p className="text-xs text-slate-500">
                  Supports <span className="font-semibold text-slate-700">PDF (including scanned PDFs via OCR)</span>, <span className="font-semibold text-slate-700">Excel (.xlsx, .xls)</span>, and <span className="font-semibold text-slate-700">CSV</span>
                </p>
              </div>

              {file && (
                <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-[#E8E2D8] rounded-xl shadow-xs">
                  <FileText className="w-4 h-4 text-[#D4A347]" />
                  <span className="text-xs font-bold text-[#0B192C] truncate max-w-xs">{file.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono">({Math.round(file.size / 1024)} KB)</span>
                </div>
              )}
            </div>

            {/* Processing / OCR Live Status Indicator */}
            {isProcessing && (
              <div className="bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl p-4 flex items-center gap-3 animate-pulse">
                <RefreshCw className="w-5 h-5 text-[#D4A347] animate-spin shrink-0" />
                <div>
                  <div className="text-xs font-bold text-[#0B192C]">Document Processing in Progress</div>
                  <div className="text-xs text-slate-600">{ocrStatusText}</div>
                </div>
              </div>
            )}

            {/* Error Message with Remediation Advice */}
            {processError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 text-red-900">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <span className="font-bold block">Document Processing Alert</span>
                  <span>{processError}</span>
                  <div className="pt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setUploadMethod('manual');
                        setWorkflowStep('review');
                      }}
                      className="px-2.5 py-1 bg-red-100 hover:bg-red-200 font-bold rounded-lg text-[11px] transition-colors cursor-pointer"
                    >
                      Switch to Manual Data Entry
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentPeriods(SAMPLE_FINANCIAL_PERIODS);
                        setLineItems(convertPeriodsToLineItems(SAMPLE_FINANCIAL_PERIODS));
                        setWorkflowStep('review');
                      }}
                      className="px-2.5 py-1 bg-white border border-red-300 font-semibold rounded-lg text-[11px] transition-colors cursor-pointer"
                    >
                      Load Standard Enterprise Template
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Success Notification */}
            {processSuccess && !isProcessing && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between gap-3 text-emerald-900">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span className="text-xs font-medium">{processSuccess}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setWorkflowStep('review')}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer shrink-0"
                >
                  Review Line Items
                </button>
              </div>
            )}

            {/* Direct Quick Jump */}
            <div className="pt-2 flex items-center justify-between border-t border-[#E8E2D8]">
              <button
                type="button"
                onClick={() => {
                  setLineItems(convertPeriodsToLineItems(SAMPLE_FINANCIAL_PERIODS));
                  setCurrentPeriods(SAMPLE_FINANCIAL_PERIODS);
                  setWorkflowStep('review');
                }}
                className="text-xs text-slate-500 hover:text-[#0B192C] font-semibold flex items-center gap-1 cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5 text-[#D4A347]" />
                <span>Test with Built-in Enterprise Template</span>
              </button>

              <button
                type="button"
                onClick={() => setWorkflowStep('review')}
                className="px-5 py-2.5 bg-[#0B1530] hover:bg-[#122338] text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 cursor-pointer transition-colors"
              >
                <span>Proceed to Editable Review</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* STEP 2: EDITABLE REVIEW & CLASSIFICATION STUDIO         */}
      {/* ======================================================== */}
      {workflowStep === 'review' && (
        <div className="space-y-6">
          
          {/* Review Toolbar & Reusable Mapping Template Selector */}
          <div className="bg-white border border-[#E8E2D8] rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#E8E2D8] pb-4">
              <div>
                <h3 className="text-base font-bold text-[#0B192C]">
                  Editable Financial Statement Line Items Review
                </h3>
                <p className="text-xs text-slate-600">
                  Verify account descriptions, codes, signs (Dr/Cr), amounts across periods, category mappings, and organizational cost centres.
                </p>
              </div>

              {/* Reusable Template Selector */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-500 font-mono">Mapping Template:</span>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => handleApplyTemplate(e.target.value)}
                  className="px-3 py-1.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-xs font-semibold text-[#0B192C] focus:outline-none cursor-pointer"
                >
                  {availableTemplates.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.framework})
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => setShowSaveTemplateModal(true)}
                  className="px-3 py-1.5 bg-white border border-[#E8E2D8] text-slate-700 hover:text-[#0B192C] text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                  title="Save current mapping as reusable template"
                >
                  <Save className="w-3.5 h-3.5 text-[#D4A347]" />
                  <span>Save as Template</span>
                </button>
              </div>
            </div>

            {/* Filter Tabs & Period Management */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              
              {/* Category Filter */}
              <div className="flex items-center gap-1 bg-[#FAF7F2] p-1 rounded-xl border border-[#E8E2D8] overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setActiveFilterCategory('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                    activeFilterCategory === 'all' ? 'bg-[#0B1530] text-white shadow-xs' : 'text-slate-600'
                  }`}
                >
                  All Accounts ({lineItems.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilterCategory('income_statement')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                    activeFilterCategory === 'income_statement' ? 'bg-[#0B1530] text-white shadow-xs' : 'text-slate-600'
                  }`}
                >
                  P&L / Income Statement
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilterCategory('balance_sheet')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                    activeFilterCategory === 'balance_sheet' ? 'bg-[#0B1530] text-white shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Balance Sheet
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilterCategory('cash_flow')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                    activeFilterCategory === 'cash_flow' ? 'bg-[#0B1530] text-white shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Cash Flow
                </button>
                {unmappedCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveFilterCategory('unmapped')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer bg-amber-100 text-amber-900 ${
                      activeFilterCategory === 'unmapped' ? 'ring-2 ring-amber-500' : ''
                    }`}
                  >
                    Unmapped ({unmappedCount})
                  </button>
                )}
              </div>

              {/* Action Buttons: Add Account & Add Period */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAddLineItem}
                  className="px-3 py-1.5 bg-[#FAF7F2] hover:bg-[#EFE8DD] text-[#0B192C] font-semibold text-xs rounded-xl border border-[#E8E2D8] flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-[#D4A347]" />
                  <span>Add Line Item</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const nextYear = prompt('Enter new reporting period label (e.g. FY2026 or Q1 2025):');
                    if (nextYear) handleAddPeriod(nextYear);
                  }}
                  className="px-3 py-1.5 bg-[#FAF7F2] hover:bg-[#EFE8DD] text-[#0B192C] font-semibold text-xs rounded-xl border border-[#E8E2D8] flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-[#D4A347]" />
                  <span>Add Period Column</span>
                </button>
              </div>

            </div>
          </div>

          {/* Editable Grid Table */}
          <div className="bg-white border border-[#E8E2D8] rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#FAF7F2] border-b border-[#E8E2D8] text-slate-700 font-mono text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-3 w-16">Code</th>
                    <th className="py-3 px-3 min-w-[200px]">Account Description</th>
                    <th className="py-3 px-3 min-w-[150px]">Classification</th>
                    <th className="py-3 px-3 w-20 text-center">Dr / Cr</th>
                    {currentPeriods.map((p, idx) => (
                      <th key={p.period} className="py-3 px-3 min-w-[130px] text-right">
                        {p.period} {idx === 0 && <span className="text-[#D4A347] font-bold">(Current)</span>}
                      </th>
                    ))}
                    <th className="py-3 px-3 min-w-[120px]">Department</th>
                    <th className="py-3 px-3 min-w-[110px]">Cost Centre</th>
                    <th className="py-3 px-3 min-w-[110px]">Entity Unit</th>
                    <th className="py-3 px-2 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E2D8]">
                  {filteredLineItems.map((item) => (
                    <tr 
                      key={item.id} 
                      className={`hover:bg-[#FAF7F2]/60 transition-colors ${
                        item.classification === 'unmapped' ? 'bg-amber-50/50' : ''
                      }`}
                    >
                      {/* Account Code */}
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          value={item.code}
                          onChange={(e) => handleLineItemChange(item.id, 'code', e.target.value)}
                          className="w-full px-2 py-1 bg-white border border-[#E8E2D8] rounded-md font-mono text-xs text-[#0B192C] focus:outline-none focus:border-[#0B1530]"
                        />
                      </td>

                      {/* Account Description */}
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleLineItemChange(item.id, 'description', e.target.value)}
                          className="w-full px-2 py-1 bg-white border border-[#E8E2D8] rounded-md font-medium text-xs text-[#0B192C] focus:outline-none focus:border-[#0B1530]"
                        />
                      </td>

                      {/* Classification Dropdown */}
                      <td className="py-2.5 px-3">
                        <select
                          value={item.classification}
                          onChange={(e) => handleLineItemChange(item.id, 'classification', e.target.value as AccountClassification)}
                          className={`w-full px-2 py-1 bg-white border rounded-md text-xs font-semibold focus:outline-none cursor-pointer ${
                            item.classification === 'unmapped'
                              ? 'border-amber-400 text-amber-900 bg-amber-50'
                              : 'border-[#E8E2D8] text-[#0B192C]'
                          }`}
                        >
                          <optgroup label="Income Statement">
                            <option value="revenue">Revenue / Turnover</option>
                            <option value="cogs">Cost of Goods Sold (COGS)</option>
                            <option value="opex_salaries">OpEx: Salaries & Wages</option>
                            <option value="opex_marketing">OpEx: Marketing & Sales</option>
                            <option value="opex_rent">OpEx: Rent & Utilities</option>
                            <option value="opex_depreciation">OpEx: Depreciation & Amort</option>
                            <option value="opex_other">OpEx: Other G&A</option>
                            <option value="interest_expense">Interest & Finance Expense</option>
                            <option value="tax_expense">Income Tax Expense</option>
                            <option value="growth_levy">Growth & Sustainability Levy</option>
                          </optgroup>
                          <optgroup label="Balance Sheet: Assets">
                            <option value="asset_cash">Asset: Cash & Equivalents</option>
                            <option value="asset_ar">Asset: Accounts Receivable</option>
                            <option value="asset_inventory">Asset: Inventories</option>
                            <option value="asset_prepaid">Asset: Prepaid Expenses</option>
                            <option value="asset_ppe">Asset: Net PP&E</option>
                            <option value="asset_intangible">Asset: Intangible Assets</option>
                          </optgroup>
                          <optgroup label="Balance Sheet: Liabilities">
                            <option value="liability_ap">Liability: Accounts Payable</option>
                            <option value="liability_st_debt">Liability: Short-Term Debt</option>
                            <option value="liability_accrued">Liability: Accrued Liabilities</option>
                            <option value="liability_lt_debt">Liability: Long-Term Debt</option>
                          </optgroup>
                          <optgroup label="Balance Sheet: Equity">
                            <option value="equity_stock">Equity: Common Stock</option>
                            <option value="equity_retained">Equity: Retained Earnings</option>
                          </optgroup>
                          <optgroup label="Cash Flows">
                            <option value="cf_operating">Cash Flow: Operating</option>
                            <option value="cf_investing">Cash Flow: Investing</option>
                            <option value="cf_financing">Cash Flow: Financing</option>
                          </optgroup>
                          <option value="unmapped">⚠️ Unmapped (Manual review)</option>
                        </select>
                      </td>

                      {/* Debit / Credit Sign Toggle */}
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            const newBalance = item.normalBalance === 'debit' ? 'credit' : 'debit';
                            handleLineItemChange(item.id, 'normalBalance', newBalance);
                          }}
                          className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold cursor-pointer uppercase ${
                            item.normalBalance === 'debit'
                              ? 'bg-blue-100 text-blue-900 border border-blue-200'
                              : 'bg-purple-100 text-purple-900 border border-purple-200'
                          }`}
                          title="Click to toggle Debit vs Credit normal balance"
                        >
                          {item.normalBalance === 'debit' ? 'Dr' : 'Cr'}
                        </button>
                      </td>

                      {/* Amounts per Period */}
                      {currentPeriods.map((p) => (
                        <td key={p.period} className="py-2.5 px-3 text-right">
                          <input
                            type="number"
                            value={item.values[p.period] ?? 0}
                            onChange={(e) => handleLineItemChange(item.id, 'values', e.target.value, p.period)}
                            className="w-full text-right px-2 py-1 bg-white border border-[#E8E2D8] rounded-md font-mono text-xs font-semibold text-[#0B192C] focus:outline-none focus:border-[#0B1530]"
                          />
                        </td>
                      ))}

                      {/* Department */}
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          value={item.department}
                          onChange={(e) => handleLineItemChange(item.id, 'department', e.target.value)}
                          className="w-full px-2 py-1 bg-white border border-[#E8E2D8] rounded-md text-xs text-slate-700 focus:outline-none"
                        />
                      </td>

                      {/* Cost Centre */}
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          value={item.costCentre}
                          onChange={(e) => handleLineItemChange(item.id, 'costCentre', e.target.value)}
                          className="w-full px-2 py-1 bg-white border border-[#E8E2D8] rounded-md text-xs font-mono text-slate-700 focus:outline-none"
                        />
                      </td>

                      {/* Entity Unit */}
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          value={item.entityUnit}
                          onChange={(e) => handleLineItemChange(item.id, 'entityUnit', e.target.value)}
                          className="w-full px-2 py-1 bg-white border border-[#E8E2D8] rounded-md text-xs text-slate-700 focus:outline-none"
                        />
                      </td>

                      {/* Row Delete */}
                      <td className="py-2.5 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteLineItem(item.id)}
                          className="p-1 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                          title="Delete line item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bottom Summary Bar */}
            <div className="bg-[#FAF7F2] p-4 border-t border-[#E8E2D8] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs text-slate-600 flex items-center gap-2">
                <span>Showing {filteredLineItems.length} of {lineItems.length} accounts.</span>
                {unmappedCount > 0 ? (
                  <span className="font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                    {unmappedCount} accounts require classification
                  </span>
                ) : (
                  <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded flex items-center gap-1">
                    <Check className="w-3 h-3" /> All accounts mapped
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setWorkflowStep('upload')}
                  className="px-4 py-2 border border-[#E8E2D8] bg-white text-slate-700 hover:text-[#0B192C] font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Back to Upload
                </button>
                <button
                  type="button"
                  onClick={() => setWorkflowStep('validate')}
                  className="px-5 py-2.5 bg-[#0B1530] hover:bg-[#122338] text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <span>Review Quality & Discrepancies</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* STEP 3: QUALITY & ARITHMETIC DISCREPANCIES AUDIT        */}
      {/* ======================================================== */}
      {workflowStep === 'validate' && (
        <div className="space-y-6">
          
          {/* Quality Audit Top Banner */}
          <div className="bg-white border border-[#E8E2D8] rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E8E2D8] pb-4">
              <div>
                <h3 className="text-base font-bold text-[#0B192C]">
                  Statement Totals, Equilibrium & Integrity Audit
                </h3>
                <p className="text-xs text-slate-600">
                  Forensic reconciliation across reporting periods. <span className="font-bold text-[#0B192C]">FinScope never silently alters figures to force balancing.</span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-bold font-mono ${
                  discrepancies.length === 0 
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}>
                  {discrepancies.length === 0 ? '✓ Balanced (100% Score)' : `${discrepancies.length} Discrepancies Detected`}
                </span>
              </div>
            </div>

            {/* Arithmetic Discrepancies Alert Panel */}
            {discrepancies.length > 0 ? (
              <div className="space-y-3">
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-900">
                  <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />
                  <div className="text-xs">
                    <span className="font-bold block">Accounting Equilibrium Notice</span>
                    <span>
                      The accounts below exhibit differences between reported line items and calculated identities. These figures have NOT been altered; review them below before proceeding.
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {discrepancies.map(disc => (
                    <div 
                      key={disc.id} 
                      className="p-4 bg-white border border-red-200 rounded-xl shadow-xs space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-red-900 font-mono uppercase">{disc.statement} ({disc.period})</span>
                        <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded font-bold font-mono text-[10px]">
                          Diff: {curSymbol}{Math.abs(disc.difference).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-slate-700">{disc.message}</p>
                      <div className="bg-[#FAF7F2] p-2.5 rounded-lg border border-[#E8E2D8] text-[11px] text-slate-600">
                        <span className="font-bold text-[#0B192C]">Resolution Tip: </span>
                        {disc.resolutionTip}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-900">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <div className="text-xs">
                  <span className="font-bold block">Perfect Accounting Reconciliation</span>
                  <span>
                    Total Assets equal Liabilities plus Equity across all reporting periods. All subtotals and cross-statement identities reconcile cleanly.
                  </span>
                </div>
              </div>
            )}

            {/* Multi-Period Comparative Summary Table */}
            <div className="border border-[#E8E2D8] rounded-xl overflow-hidden mt-4">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#FAF7F2] border-b border-[#E8E2D8] text-slate-700 font-mono text-[11px] uppercase">
                  <tr>
                    <th className="py-2.5 px-3">Reconciliation Metric</th>
                    {currentPeriods.map(p => (
                      <th key={p.period} className="py-2.5 px-3 text-right font-mono">{p.period}</th>
                    ))}
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E2D8]">
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-[#0B192C]">Total Assets</td>
                    {currentPeriods.map(p => (
                      <td key={p.period} className="py-2.5 px-3 text-right font-mono font-bold text-[#0B192C]">
                        {curSymbol}{(p.balanceSheet.assets.totalAssets || 0).toLocaleString()}
                      </td>
                    ))}
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">Verified</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-[#0B192C]">Total Liabilities + Equity</td>
                    {currentPeriods.map(p => {
                      const totalLiabEq = (p.balanceSheet.liabilities.totalLiabilities || 0) + (p.balanceSheet.equity.totalEquity || 0);
                      const isBalanced = Math.abs((p.balanceSheet.assets.totalAssets || 0) - totalLiabEq) <= 1;
                      return (
                        <td key={p.period} className={`py-2.5 px-3 text-right font-mono font-bold ${
                          isBalanced ? 'text-[#0B192C]' : 'text-red-700'
                        }`}>
                          {curSymbol}{totalLiabEq.toLocaleString()}
                        </td>
                      );
                    })}
                    <td className="py-2.5 px-3 text-center">
                      {currentPeriods.every(p => Math.abs((p.balanceSheet.assets.totalAssets || 0) - ((p.balanceSheet.liabilities.totalLiabilities || 0) + (p.balanceSheet.equity.totalEquity || 0))) <= 1) ? (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">Equilibrium</span>
                      ) : (
                        <span className="px-2 py-0.5 bg-red-100 text-red-800 text-[10px] font-bold rounded">Variance</span>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-[#0B192C]">Gross Profit (Rev - COGS)</td>
                    {currentPeriods.map(p => (
                      <td key={p.period} className="py-2.5 px-3 text-right font-mono text-[#0B192C]">
                        {curSymbol}{(p.incomeStatement.grossProfit || 0).toLocaleString()}
                      </td>
                    ))}
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">Verified</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-[#0B192C]">Operating Income (EBIT)</td>
                    {currentPeriods.map(p => (
                      <td key={p.period} className="py-2.5 px-3 text-right font-mono text-[#0B192C]">
                        {curSymbol}{(p.incomeStatement.operatingIncome || 0).toLocaleString()}
                      </td>
                    ))}
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">Verified</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-[#0B192C]">Net Income</td>
                    {currentPeriods.map(p => (
                      <td key={p.period} className="py-2.5 px-3 text-right font-mono font-bold text-[#0B192C]">
                        {curSymbol}{(p.incomeStatement.netIncome || 0).toLocaleString()}
                      </td>
                    ))}
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">Verified</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 flex items-center justify-between border-t border-[#E8E2D8]">
              <button
                type="button"
                onClick={() => setWorkflowStep('review')}
                className="px-4 py-2 border border-[#E8E2D8] bg-white text-slate-700 hover:text-[#0B192C] font-semibold text-xs rounded-xl cursor-pointer"
              >
                Back to Line Items Editor
              </button>

              <button
                type="button"
                onClick={handleFinalizeAndProceed}
                className="px-6 py-2.5 bg-[#D6AE55] hover:bg-[#C59B42] text-[#0B1530] font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 cursor-pointer transition-colors group"
              >
                <span>Accept Data & Run Executive Diagnostic</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>

          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* STEP 4: AUDIT ARCHIVE & ORIGINAL UPLOAD RECORDS         */}
      {/* ======================================================== */}
      {workflowStep === 'archive' && (
        <div className="space-y-6">
          
          <div className="bg-white border border-[#E8E2D8] rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#E8E2D8] pb-4">
              <div>
                <h3 className="text-base font-bold text-[#0B192C]">
                  Original Upload Records & Normalized Financial Data Archive
                </h3>
                <p className="text-xs text-slate-600">
                  Permanent audit record of raw uploaded files, processing notes, and normalized datasets used for CFO calculations.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setWorkflowStep('upload')}
                className="px-3 py-1.5 bg-[#0B1530] text-white text-xs font-semibold rounded-xl cursor-pointer"
              >
                Upload New Document
              </button>
            </div>

            {/* Records List Table */}
            <div className="border border-[#E8E2D8] rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#FAF7F2] border-b border-[#E8E2D8] text-slate-700 font-mono text-[11px] uppercase">
                  <tr>
                    <th className="py-2.5 px-3">File Name</th>
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Periods</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E2D8]">
                  {uploadRecords.map(rec => (
                    <tr key={rec.id} className="hover:bg-[#FAF7F2]/50">
                      <td className="py-2.5 px-3 font-semibold text-[#0B192C]">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-[#D4A347]" />
                          <span>{rec.fileName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">({Math.round(rec.fileSize / 1024)} KB)</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-500">
                        {new Date(rec.uploadTimestamp).toLocaleDateString()} {new Date(rec.uploadTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-2.5 px-3 uppercase font-mono text-[11px] text-slate-600">
                        {rec.category}
                      </td>
                      <td className="py-2.5 px-3 font-mono">
                        {rec.periodsDetected.join(', ')}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          rec.status === 'completed' || rec.status === 'ocr_processed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {rec.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => setSelectedRecordForPreview(rec)}
                          className="px-2.5 py-1 bg-white border border-[#E8E2D8] hover:bg-[#FAF7F2] text-xs font-semibold rounded-lg cursor-pointer"
                        >
                          Inspect Record
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCurrentPeriods(rec.normalizedDataSnapshot);
                            setLineItems(convertPeriodsToLineItems(rec.normalizedDataSnapshot));
                            setWorkflowStep('review');
                          }}
                          className="px-2.5 py-1 bg-[#0B1530] text-white text-xs font-semibold rounded-lg cursor-pointer"
                        >
                          Load into Studio
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>

          {/* Record Inspection Modal */}
          {selectedRecordForPreview && (
            <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
              <div className="bg-white border border-[#E8E2D8] rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-[85vh] flex flex-col">
                <div className="flex items-center justify-between border-b border-[#E8E2D8] pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Eye className="w-5 h-5 text-[#D4A347]" />
                    <h4 className="text-sm font-bold text-[#0B192C]">
                      File Record: {selectedRecordForPreview.fileName}
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedRecordForPreview(null)}
                    className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4 overflow-y-auto custom-scrollbar flex-1 pr-1 text-xs">
                  <div className="grid grid-cols-2 gap-3 bg-[#FAF7F2] p-3 rounded-xl border border-[#E8E2D8]">
                    <div>
                      <span className="text-slate-500 font-mono block text-[10px]">FILE SIZE & MIME</span>
                      <span className="font-bold text-[#0B192C]">{Math.round(selectedRecordForPreview.fileSize / 1024)} KB · {selectedRecordForPreview.mimeType}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-mono block text-[10px]">RECORDING TIMESTAMP</span>
                      <span className="font-bold text-[#0B192C]">{new Date(selectedRecordForPreview.uploadTimestamp).toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-mono block text-[10px]">EXTRACTED PERIODS</span>
                      <span className="font-bold text-[#0B192C]">{selectedRecordForPreview.periodsDetected.join(', ')}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-mono block text-[10px]">PROCESSING LOG</span>
                      <span className="font-bold text-[#0B192C]">{selectedRecordForPreview.processingMessage}</span>
                    </div>
                  </div>

                  {/* Raw Content Snapshot */}
                  <div>
                    <h5 className="font-bold text-[#0B192C] mb-1 font-mono uppercase text-[11px]">
                      Raw Upload File Content Snapshot:
                    </h5>
                    <pre className="p-3 bg-[#0B1530] text-emerald-400 font-mono text-[11px] rounded-xl overflow-x-auto max-h-40">
                      {selectedRecordForPreview.rawContentPreview || 'No raw text representation captured.'}
                    </pre>
                  </div>

                  {/* Normalized JSON Dataset */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <h5 className="font-bold text-[#0B192C] font-mono uppercase text-[11px]">
                        Normalized Financial Data Used for Analysis:
                      </h5>
                      <button
                        type="button"
                        onClick={() => {
                          const jsonStr = JSON.stringify(selectedRecordForPreview.normalizedDataSnapshot, null, 2);
                          navigator.clipboard.writeText(jsonStr);
                          alert('Normalized JSON copied to clipboard!');
                        }}
                        className="text-[11px] text-[#D4A347] font-semibold hover:underline cursor-pointer"
                      >
                        Copy JSON
                      </button>
                    </div>
                    <pre className="p-3 bg-slate-900 text-slate-200 font-mono text-[11px] rounded-xl overflow-x-auto max-h-48">
                      {JSON.stringify(selectedRecordForPreview.normalizedDataSnapshot, null, 2)}
                    </pre>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#E8E2D8] flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedRecordForPreview(null)}
                    className="px-4 py-2 border border-[#E8E2D8] text-slate-700 text-xs font-semibold rounded-xl cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentPeriods(selectedRecordForPreview.normalizedDataSnapshot);
                      setLineItems(convertPeriodsToLineItems(selectedRecordForPreview.normalizedDataSnapshot));
                      setSelectedRecordForPreview(null);
                      setWorkflowStep('review');
                    }}
                    className="px-4 py-2 bg-[#0B1530] text-white text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Load into Review Studio
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* Save Custom Template Modal */}
      {showSaveTemplateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E8E2D8] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E8E2D8] pb-3">
              <h4 className="text-sm font-bold text-[#0B192C]">Save Custom Mapping Template</h4>
              <button
                type="button"
                onClick={() => setShowSaveTemplateModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Save your current accounts mapping so returning users can classify new financial statements automatically with 1 click.
            </p>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-700">Template Name</label>
              <input
                type="text"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                placeholder="e.g. Acme Chart of Accounts 2025"
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-xs font-semibold text-[#0B192C] focus:outline-none focus:border-[#0B1530]"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowSaveTemplateModal(false)}
                className="px-4 py-2 border border-[#E8E2D8] text-slate-700 text-xs font-semibold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveAsCustomTemplate}
                disabled={!newTemplateName.trim()}
                className="px-4 py-2 bg-[#0B1530] disabled:opacity-50 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Save Template
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
