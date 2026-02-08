import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { translations, defaultLocale, getTranslation } from '../i18n'

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [locale, setLocale] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('bvmt-locale') || defaultLocale
    }
    return defaultLocale
  })

  const isRTL = locale === 'ar'

  useEffect(() => {
    localStorage.setItem('bvmt-locale', locale)
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr'
    document.documentElement.lang = locale
  }, [locale, isRTL])

  const t = useCallback((key) => {
    return getTranslation(locale, key)
  }, [locale])

  const toggleLanguage = useCallback(() => {
    setLocale(prev => prev === 'fr' ? 'ar' : 'fr')
  }, [])

  const value = {
    locale,
    setLocale,
    t,
    isRTL,
    toggleLanguage,
    translations: translations[locale]
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

export { LanguageContext }
