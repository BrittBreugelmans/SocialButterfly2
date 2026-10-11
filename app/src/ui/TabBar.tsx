import type { ReactNode } from 'react'
import { useLanguage } from '../i18n/LanguageProvider'
import type { TextKey } from '../i18n/nl'

export type Tab = 'add' | 'contacts' | 'actions' | 'myQr' | 'settings'

// Simple line icons drawn inline: no icon library (research R2, constitution X).
const ICONS: Record<Tab, ReactNode> = {
  add: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8M8 12h8" />
    </>
  ),
  contacts: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5" />
      <path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.8c2 .7 3.2 2.5 3.5 5.2" />
    </>
  ),
  actions: (
    <>
      <rect x="4" y="3.5" width="16" height="17" rx="2.5" />
      <path d="M8 9l1.5 1.5L12.5 7.5M8 15.5l1.5 1.5 3-3M15 9.5h2M15 16h2" />
    </>
  ),
  myQr: (
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1" />
      <path d="M14 14h2.5v2.5H14zM18 18h2.5v2.5H18zM18 14h2.5M14 20.5h2" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1" />
    </>
  ),
}

const TABS: { tab: Tab; label: TextKey }[] = [
  { tab: 'add', label: 'tab.add' },
  { tab: 'contacts', label: 'tab.contacts' },
  { tab: 'actions', label: 'tab.actions' },
  { tab: 'myQr', label: 'tab.myQr' },
  { tab: 'settings', label: 'tab.settings' },
]

/** Tabs that can show a count, and the name VoiceOver reads with it. */
const BADGE_LABELS: Partial<Record<Tab, TextKey>> = { actions: 'tab.actionsCount' }

interface TabBarProps {
  tab: Tab
  onChange(tab: Tab): void
  /** Counts shown as a badge, e.g. open Actions (F8 FR-012). Nothing at 0. */
  badges?: Partial<Record<Tab, number>>
}

/** The bottom tab bar (B26). Shown only on the five tab screens (FR-001c). */
export function TabBar({ tab, onChange, badges }: TabBarProps) {
  const { t } = useLanguage()
  return (
    <nav className="tab-bar" aria-label={t('tabs.label')}>
      {TABS.map((item) => {
        const badgeLabel = BADGE_LABELS[item.tab]
        const count = badgeLabel ? (badges?.[item.tab] ?? 0) : 0
        return (
          <button
            key={item.tab}
            type="button"
            aria-current={item.tab === tab ? 'page' : undefined}
            // The badge is hidden from VoiceOver; the count is read once in the name instead.
            aria-label={badgeLabel && count > 0 ? t(badgeLabel, { count }) : undefined}
            onClick={() => {
              if (item.tab !== tab) onChange(item.tab)
            }}
          >
            <svg
              aria-hidden="true"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {ICONS[item.tab]}
            </svg>
            {count > 0 && (
              <span className="tab-badge" aria-hidden="true">
                {count > 99 ? '99+' : count}
              </span>
            )}
            <span>{t(item.label)}</span>
          </button>
        )
      })}
    </nav>
  )
}
