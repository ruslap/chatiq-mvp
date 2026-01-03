"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Language, getBrowserLanguage, useTranslation as useTranslationUtil } from "@/lib/i18n";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('uk');

  useEffect(() => {
    // Load saved language from localStorage or use browser language
    const saved = localStorage.getItem('chtq_language') as Language;
    const lang = saved || getBrowserLanguage();
    setLanguageState(lang);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('chtq_language', lang);
  };

  const toggleLanguage = () => {
    setLanguage(language === 'uk' ? 'en' : 'uk');
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

export function useTranslation(lang: Language) {
  return useTranslationUtil(lang);
}
