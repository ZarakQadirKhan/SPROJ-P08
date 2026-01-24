import React, { createContext, useContext, useState } from 'react'
import enTranslations from '../translations/en.json'
import urTranslations from '../translations/ur.json'

const LanguageContext = createContext()

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('en')

  const translations = {
    en: enTranslations,
    ur: urTranslations
  }

  const t = translations[language]

  const value = {
    language,
    setLanguage,
    t
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
