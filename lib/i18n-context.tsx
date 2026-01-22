'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { Language, detectLanguage, getTranslations, translations } from './i18n'

interface I18nContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: typeof translations.de
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('de')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Check localStorage first, then browser language
    const savedLang = localStorage.getItem('language') as Language | null
    if (savedLang && (savedLang === 'de' || savedLang === 'en')) {
      setLanguageState(savedLang)
    } else {
      const detectedLang = detectLanguage()
      setLanguageState(detectedLang)
    }
  }, [])

  useEffect(() => {
    if (!mounted) return
    localStorage.setItem('language', language)
    document.documentElement.lang = language
  }, [language, mounted])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
  }

  const t = getTranslations(language)

  // Always provide context, even before mounted
  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider')
  }
  return context
}
