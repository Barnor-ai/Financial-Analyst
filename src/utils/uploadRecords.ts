/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UploadedFileRecord, PeriodFinancialData, FinancialStatementType, ArithmeticDiscrepancy } from '../types';

const STORAGE_KEY = 'finscope_upload_records_v1';
const TEMPLATES_KEY = 'finscope_custom_mapping_templates_v1';

/**
 * Retrieves all stored original file upload records
 */
export function getStoredUploadRecords(): UploadedFileRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to load upload records:', e);
    return [];
  }
}

/**
 * Saves a new upload record to localStorage and returns updated list
 */
export function saveUploadRecord(record: UploadedFileRecord): UploadedFileRecord[] {
  try {
    const existing = getStoredUploadRecords();
    const updated = [record, ...existing.filter(r => r.id !== record.id)].slice(0, 50); // retain last 50
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.warn('Failed to save upload record:', e);
    return [record];
  }
}

/**
 * Deletes an upload record
 */
export function deleteUploadRecord(id: string): UploadedFileRecord[] {
  try {
    const existing = getStoredUploadRecords();
    const updated = existing.filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.warn('Failed to delete upload record:', e);
    return [];
  }
}

/**
 * Retrieves user custom mapping templates
 */
export function getCustomMappingTemplates(): import('../types').MappingTemplate[] {
  try {
    const raw = localStorage.getItem(TEMPLATES_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to load custom mapping templates:', e);
    return [];
  }
}

/**
 * Saves a custom mapping template
 */
export function saveCustomMappingTemplate(tpl: import('../types').MappingTemplate): import('../types').MappingTemplate[] {
  try {
    const existing = getCustomMappingTemplates();
    const updated = [tpl, ...existing.filter(t => t.id !== tpl.id)];
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.warn('Failed to save custom mapping template:', e);
    return [tpl];
  }
}

/**
 * Creates an initial demo upload record for default enterprise financials
 */
export function createSampleUploadRecord(samplePeriods: PeriodFinancialData[], currency: string = 'USD ($)'): UploadedFileRecord {
  return {
    id: 'rec-demo-enterprise-01',
    fileName: 'Annual_Audited_Statements_FY2025.xlsx',
    fileSize: 245760, // 240 KB
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    uploadTimestamp: new Date().toISOString(),
    category: 'comparative',
    periodsDetected: samplePeriods.map(p => p.period),
    currency,
    rawContentPreview: `Line Item,FY2025,FY2024\nRevenue,101304393,66194173\nCost of Goods Sold,76076013,54924963\nGross Profit,25228380,11269210\nOperating Expenses,6791656,3685324\nOperating Income,18436724,7583886\nTotal Assets,85420100,54210000\nTotal Liabilities,42100000,28500000\nTotal Equity,43320100,25710000`,
    status: 'completed',
    processingMessage: 'Processed via Excel multi-sheet forensic extractor. 2 periods reconciled.',
    validationScore: 98,
    discrepancies: [],
    normalizedDataSnapshot: samplePeriods
  };
}
