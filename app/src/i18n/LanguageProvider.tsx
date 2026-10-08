import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { StorageFullError } from '../data/errors'
import { getSettings, updateSettings } from '../data/repository'
import type { Language } from '../data/types'
import { en } from './en'
import { nl, type TextKey } from './nl'

const dictionaries: Record<Language, Record<TextKey, string>> = { nl, en }

interface LanguageContextValue {
  language: Language
  setLanguage(language: Language): Promise<void>
  t(key: TextKey, params?: Record<string, string | number>): string
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Dutch until Settings are loaded (open question #8).
  const [language, setLanguageState] = useState<Language>('nl')
  const chosenThisSession = useRef(false)

  useEffect(() => {
    let cancelled = false
    getSettings()
      .then((settings) => {
        if (!cancelled && !chosenThisSession.current) setLanguageState(settings.language)
      })
      .catch(() => {
        // Keep the default language if Settings cannot be read.
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    document.documentElement.lang = language
  }, [language])

  const setLanguage = useCallback(async (next: Language) => {
    chosenThisSession.current = true
    setLanguageState(next)
    try {
      await updateSettings({ language: next })
    } catch (error) {
      // Storage full: keep the choice for this session; the storage.full banner shows (FR-016).
      if (!(error instanceof StorageFullError)) throw error
    }
  }, [])

  const t = useCallback(
    (key: TextKey, params?: Record<string, string | number>) => {
      const text = dictionaries[language][key]
      if (!params) return text
      return text.replace(/\{(\w+)\}/g, (match, name: string) =>
        name in params ? String(params[name]) : match,
      )
    },
    [language],
  )

  const value = useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t])
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext)
  if (!context) throw new Error('useLanguage must be used inside LanguageProvider')
  return context
}
