/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { 
  SUPPORTED_LANGUAGES, 
  SupportedLanguageCode, 
  setInterfaceLanguage 
} from '../i18n';

interface LanguageSelectorProps {
  variant?: 'compact' | 'expanded' | 'minimal' | 'dark';
  className?: string;
  onLanguageChange?: (lang: SupportedLanguageCode) => void;
  // If provided, operates as an independent selector (e.g. for report language selection)
  customSelectedLanguage?: SupportedLanguageCode;
}

export default function LanguageSelector({
  variant = 'compact',
  className = '',
  onLanguageChange,
  customSelectedLanguage
}: LanguageSelectorProps) {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLangCode = (customSelectedLanguage || i18n.language || 'en') as SupportedLanguageCode;
  const currentLang = SUPPORTED_LANGUAGES.find(l => l.code === currentLangCode) || SUPPORTED_LANGUAGES[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectLanguage = (code: SupportedLanguageCode) => {
    if (customSelectedLanguage !== undefined) {
      // Controlled mode (e.g., report language selection)
      onLanguageChange?.(code);
    } else {
      // Interface language switch
      setInterfaceLanguage(code);
      onLanguageChange?.(code);
    }
    setIsOpen(false);
  };

  const isDark = variant === 'dark';

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer border ${
          isDark
            ? 'bg-[#0F1E33] hover:bg-[#162A45] text-slate-200 border-[#1E3758]'
            : variant === 'minimal'
            ? 'bg-transparent hover:bg-slate-100 text-slate-600 border-transparent'
            : 'bg-white hover:bg-[#FAF7F2] text-[#0B192C] border-[#E8E2D8] shadow-xs'
        }`}
        aria-label="Select language"
        title="Change language / تغيير اللغة"
      >
        <span className="text-sm leading-none">{currentLang.flag}</span>
        <span className="font-medium truncate max-w-[100px]">
          {variant === 'expanded' ? currentLang.nativeName : currentLang.name}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div 
          className="absolute z-50 mt-1.5 right-0 w-48 bg-white rounded-2xl border border-[#E8E2D8] shadow-xl py-1.5 overflow-hidden animate-scale-in text-left"
          dir="ltr"
        >
          <div className="px-3 py-1.5 border-b border-[#F0EBE1] flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
              Languages · اللغات
            </span>
            <Globe className="w-3.5 h-3.5 text-[#D6AE55]" />
          </div>

          <div className="max-h-64 overflow-y-auto custom-scrollbar p-1 space-y-0.5">
            {SUPPORTED_LANGUAGES.map(lang => {
              const isSelected = lang.code === currentLangCode;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleSelectLanguage(lang.code)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl transition-colors cursor-pointer text-left ${
                    isSelected 
                      ? 'bg-[#0B1530] text-white font-bold' 
                      : 'hover:bg-[#FAF7F2] text-[#0B192C]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base leading-none">{lang.flag}</span>
                    <div className="flex flex-col">
                      <span className="leading-tight">{lang.nativeName}</span>
                      <span className={`text-[10px] ${isSelected ? 'text-slate-300' : 'text-slate-400'} font-mono`}>
                        {lang.name} {lang.isRTL ? '(RTL)' : ''}
                      </span>
                    </div>
                  </div>

                  {isSelected && <Check className="w-4 h-4 text-[#D6AE55] shrink-0" />}
                </button>
              );
            })}
          </div>

          <div className="px-3 py-1.5 bg-[#FAF7F2] border-t border-[#F0EBE1] text-[9px] text-slate-500 font-mono text-center">
            Zero data loss on language switch
          </div>
        </div>
      )}
    </div>
  );
}
