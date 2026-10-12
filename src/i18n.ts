/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { en } from './locales/en';
import { fr } from './locales/fr';
import { es } from './locales/es';
import { pt } from './locales/pt';
import { ar } from './locales/ar';
import { zh } from './locales/zh';

export type SupportedLanguageCode = 'en' | 'fr' | 'es' | 'pt' | 'ar' | 'zh';

export interface LanguageMeta {
  code: SupportedLanguageCode;
  name: string;
  nativeName: string;
  flag: string;
  isRTL: boolean;
}

export const SUPPORTED_LANGUAGES: LanguageMeta[] = [
  { code: 'en', name: 'English', nativeName: 'English (US/UK)', flag: '🇺🇸', isRTL: false },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', isRTL: false },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', isRTL: false },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷', isRTL: false },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', isRTL: true },
  { code: 'zh', name: 'Chinese', nativeName: '中文 (简体)', flag: '🇨🇳', isRTL: false }
];

export type NumberFormatStyle = 'standard' | 'european' | 'swiss' | 'space';

export interface NumberFormatOption {
  id: NumberFormatStyle;
  label: string;
  example: string;
  thousandSep: string;
  decimalSep: string;
}

export const NUMBER_FORMAT_OPTIONS: NumberFormatOption[] = [
  { id: 'standard', label: 'Standard Anglo-American (1,234,567.89)', example: '1,234,567.89', thousandSep: ',', decimalSep: '.' },
  { id: 'european', label: 'Continental European (1.234.567,89)', example: '1.234.567,89', thousandSep: '.', decimalSep: ',' },
  { id: 'swiss', label: 'Swiss / Liechtenstein (1\'234\'567.89)', example: '1\'234\'567.89', thousandSep: '\'', decimalSep: '.' },
  { id: 'space', label: 'International SI / Space (1 234 567,89)', example: '1 234 567,89', thousandSep: ' ', decimalSep: ',' }
];

export interface StandardFinancialTerm {
  key: string;
  category: 'Statement of Financial Position' | 'Statement of Profit or Loss' | 'Statement of Cash Flows' | 'Key Metrics';
  english: string;
  defaultTranslations: Record<SupportedLanguageCode, string>;
}

export const STANDARD_FINANCIAL_GLOSSARY: StandardFinancialTerm[] = [
  {
    key: 'balance_sheet',
    category: 'Statement of Financial Position',
    english: 'Statement of Financial Position (Balance Sheet)',
    defaultTranslations: {
      en: 'Statement of Financial Position (Balance Sheet)',
      fr: 'État de la situation financière (Bilan)',
      es: 'Estado de Situación Financiera (Balance General)',
      pt: 'Balanço Patrimonial',
      ar: 'قائمة المركز المالي (الميزانية العمومية)',
      zh: '资产负债表 (财务状况表)'
    }
  },
  {
    key: 'income_statement',
    category: 'Statement of Profit or Loss',
    english: 'Statement of Profit or Loss (Income Statement)',
    defaultTranslations: {
      en: 'Statement of Profit or Loss (Income Statement)',
      fr: 'Compte de résultat',
      es: 'Estado de Resultados (Pérdidas y Ganancias)',
      pt: 'Demonstração do Resultado do Exercício (DRE)',
      ar: 'قائمة الدخل (الأرباح والخسائر)',
      zh: '利润表 (损益表)'
    }
  },
  {
    key: 'cash_flow',
    category: 'Statement of Cash Flows',
    english: 'Statement of Cash Flows',
    defaultTranslations: {
      en: 'Statement of Cash Flows',
      fr: 'Tableau des flux de trésorerie',
      es: 'Estado de Flujos de Efectivo',
      pt: 'Demonstração dos Fluxos de Caixa (DFC)',
      ar: 'قائمة التدفقات النقدية',
      zh: '现金流量表'
    }
  },
  {
    key: 'gross_profit',
    category: 'Statement of Profit or Loss',
    english: 'Gross Profit',
    defaultTranslations: {
      en: 'Gross Profit',
      fr: 'Marge brute',
      es: 'Beneficio bruto',
      pt: 'Lucro bruto',
      ar: 'إجمالي الربح',
      zh: '毛利润'
    }
  },
  {
    key: 'operating_income',
    category: 'Statement of Profit or Loss',
    english: 'Operating Profit (EBIT)',
    defaultTranslations: {
      en: 'Operating Profit (EBIT)',
      fr: 'Résultat d\'exploitation (EBIT)',
      es: 'Beneficio operativo (EBIT)',
      pt: 'Lucro operacional (EBIT)',
      ar: 'الربح التشغيلي (EBIT)',
      zh: '营业利润 (EBIT)'
    }
  },
  {
    key: 'ebitda',
    category: 'Key Metrics',
    english: 'EBITDA (Earnings Before Interest, Taxes, Depreciation & Amortization)',
    defaultTranslations: {
      en: 'EBITDA',
      fr: 'EBITDA (EBE)',
      es: 'EBITDA',
      pt: 'EBITDA (LAJIDA)',
      ar: 'الأرباح قبل الفوائد والضرائب والإهلاك (EBITDA)',
      zh: '息税折旧摊销前利润 (EBITDA)'
    }
  },
  {
    key: 'working_capital',
    category: 'Key Metrics',
    english: 'Working Capital',
    defaultTranslations: {
      en: 'Working Capital',
      fr: 'Fonds de roulement net (BFR)',
      es: 'Capital de trabajo',
      pt: 'Capital de giro',
      ar: 'رأس المال العامل',
      zh: '营运资金'
    }
  },
  {
    key: 'retained_earnings',
    category: 'Statement of Financial Position',
    english: 'Retained Earnings',
    defaultTranslations: {
      en: 'Retained Earnings',
      fr: 'Report à nouveau / Réserves',
      es: 'Resultados acumulados / Reservas',
      pt: 'Lucros acumulados',
      ar: 'الأرباح المبقاة (المحتجزة)',
      zh: '未分配利润'
    }
  }
];

const STORAGE_KEY_LOCALE = 'finscope_user_locale';
const STORAGE_KEY_ORG_LOCALE = 'finscope_org_default_locale';
const STORAGE_KEY_REPORT_LOCALE = 'finscope_report_locale';
const STORAGE_KEY_NUMBER_FORMAT = 'finscope_number_format';
const STORAGE_KEY_GLOSSARY_OVERRIDES = 'finscope_glossary_overrides';

/**
 * Detect reasonable default language
 */
function detectInitialLanguage(): SupportedLanguageCode {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_LOCALE) as SupportedLanguageCode;
    if (saved && SUPPORTED_LANGUAGES.some(l => l.code === saved)) {
      return saved;
    }
    const navLang = navigator.language?.toLowerCase() || '';
    if (navLang.startsWith('fr')) return 'fr';
    if (navLang.startsWith('es')) return 'es';
    if (navLang.startsWith('pt')) return 'pt';
    if (navLang.startsWith('ar')) return 'ar';
    if (navLang.startsWith('zh')) return 'zh';
  } catch {
    // ignore
  }
  return 'en';
}

const initialLang = detectInitialLanguage();

// Synchronize document direction and lang attribute
export function applyDocumentDirection(lang: string) {
  if (typeof document !== 'undefined') {
    const isRTL = lang === 'ar';
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }
}

applyDocumentDirection(initialLang);

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      fr: { translation: fr },
      es: { translation: es },
      pt: { translation: pt },
      ar: { translation: ar },
      zh: { translation: zh }
    },
    lng: initialLang,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

/**
 * Change interface language dynamically without losing unsaved state or refreshing
 */
export function setInterfaceLanguage(code: SupportedLanguageCode): void {
  i18n.changeLanguage(code);
  applyDocumentDirection(code);
  try {
    localStorage.setItem(STORAGE_KEY_LOCALE, code);
  } catch {
    // ignore
  }
}

/**
 * Get organization's default reporting language
 */
export function getOrgReportingLanguage(): SupportedLanguageCode {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_ORG_LOCALE) as SupportedLanguageCode;
    if (saved && SUPPORTED_LANGUAGES.some(l => l.code === saved)) return saved;
  } catch {
    // ignore
  }
  return 'en';
}

export function setOrgReportingLanguage(code: SupportedLanguageCode): void {
  try {
    localStorage.setItem(STORAGE_KEY_ORG_LOCALE, code);
  } catch {
    // ignore
  }
}

/**
 * Get independently selectable report generation language
 */
export function getReportGenerationLanguage(): SupportedLanguageCode {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_REPORT_LOCALE) as SupportedLanguageCode;
    if (saved && SUPPORTED_LANGUAGES.some(l => l.code === saved)) return saved;
  } catch {
    // ignore
  }
  return (i18n.language as SupportedLanguageCode) || 'en';
}

export function setReportGenerationLanguage(code: SupportedLanguageCode): void {
  try {
    localStorage.setItem(STORAGE_KEY_REPORT_LOCALE, code);
  } catch {
    // ignore
  }
}

/**
 * Number format settings (separated from language)
 */
export function getNumberFormatPreference(): NumberFormatStyle {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_NUMBER_FORMAT) as NumberFormatStyle;
    if (saved && NUMBER_FORMAT_OPTIONS.some(o => o.id === saved)) return saved;
  } catch {
    // ignore
  }
  return 'standard';
}

export function setNumberFormatPreference(style: NumberFormatStyle): void {
  try {
    localStorage.setItem(STORAGE_KEY_NUMBER_FORMAT, style);
  } catch {
    // ignore
  }
}

/**
 * Format a number using selected number style, completely independent of interface language
 */
export function formatLocaleNumber(
  value: number | undefined | null,
  options?: {
    decimals?: number;
    style?: NumberFormatStyle;
  }
): string {
  if (value === undefined || value === null || isNaN(value)) {
    return '0.00';
  }

  const decimals = options?.decimals !== undefined ? options.decimals : 2;
  const style = options?.style || getNumberFormatPreference();

  const isNeg = value < 0;
  const absVal = Math.abs(value);
  const parts = absVal.toFixed(decimals).split('.');
  let integerPart = parts[0];
  const decimalPart = parts[1];

  let thousandSep = ',';
  let decimalSep = '.';

  if (style === 'european') {
    thousandSep = '.';
    decimalSep = ',';
  } else if (style === 'swiss') {
    thousandSep = '\'';
    decimalSep = '.';
  } else if (style === 'space') {
    thousandSep = ' ';
    decimalSep = ',';
  }

  // Insert thousand separators
  integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, thousandSep);

  const formatted = decimals > 0 ? `${integerPart}${decimalSep}${decimalPart}` : integerPart;
  return isNeg ? `-${formatted}` : formatted;
}

/**
 * Format currency amount with ISO symbol or code and localized separators
 */
export function formatLocaleCurrency(
  value: number | undefined | null,
  currencyCodeOrSymbol: string = '$',
  decimals: number = 0
): string {
  if (value === undefined || value === null || isNaN(value)) {
    return `${currencyCodeOrSymbol}0`;
  }

  // Extract clean symbol if formatted as "USD ($)"
  const symbol = currencyCodeOrSymbol.match(/\(([^)]+)\)/)?.[1] || currencyCodeOrSymbol;
  const formattedNum = formatLocaleNumber(value, { decimals });
  return `${symbol}${formattedNum}`;
}

/**
 * Localized date formatter
 */
export function formatLocaleDate(dateStr: string, locale?: string): string {
  try {
    const loc = locale || i18n.language || 'en';
    const date = new Date(dateStr);
    return date.toLocaleDateString(loc === 'zh' ? 'zh-CN' : loc === 'ar' ? 'ar-SA' : loc, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

/**
 * Glossary Terminology Overrides
 */
export function getGlossaryOverrides(): Record<string, Record<string, string>> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_GLOSSARY_OVERRIDES);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return {};
}

export function saveGlossaryOverride(termKey: string, lang: SupportedLanguageCode, customValue: string): void {
  try {
    const current = getGlossaryOverrides();
    if (!current[lang]) current[lang] = {};
    if (customValue.trim()) {
      current[lang][termKey] = customValue.trim();
    } else {
      delete current[lang][termKey];
    }
    localStorage.setItem(STORAGE_KEY_GLOSSARY_OVERRIDES, JSON.stringify(current));
  } catch (e) {
    console.error('Failed to save glossary override', e);
  }
}

export function resetGlossaryOverrides(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_GLOSSARY_OVERRIDES);
  } catch {
    // ignore
  }
}

export function getEffectiveTerm(termKey: string, lang: SupportedLanguageCode): string {
  const overrides = getGlossaryOverrides();
  if (overrides[lang]?.[termKey]) {
    return overrides[lang][termKey];
  }
  const item = STANDARD_FINANCIAL_GLOSSARY.find(g => g.key === termKey);
  if (item && item.defaultTranslations[lang]) {
    return item.defaultTranslations[lang];
  }
  return termKey;
}

export default i18n;
