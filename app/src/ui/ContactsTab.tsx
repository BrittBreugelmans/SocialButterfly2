import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { getSettings, listEncounters, listEvents, listPersons } from '../data/repository'
import type { Encounter, Event, Person } from '../data/types'
import { useLanguage } from '../i18n/LanguageProvider'
import { buildContactRows, defaultView, type ContactView } from '../people/contacts'
import { ContactList } from './ContactList'
import { PersonDetail } from './PersonDetail'

interface ContactsTabProps {
  /** The empty list's "Add someone": switch to the Add tab. */
  onAddSomeone(): void
}

interface ContactData {
  persons: Person[]
  encounters: Encounter[]
  events: Event[]
}

async function loadData(): Promise<ContactData> {
  const [persons, encounters, events] = await Promise.all([listPersons(), listEncounters(), listEvents()])
  return { persons, encounters, events }
}

/**
 * The Contacts tab: loads everything once and builds the list in memory (research R3). View,
 * search and scroll position survive opening a Person (research R5).
 */
export function ContactsTab({ onAddSomeone }: ContactsTabProps) {
  const { t } = useLanguage()
  const [data, setData] = useState<ContactData>()
  const [view, setView] = useState<ContactView>()
  const [query, setQuery] = useState('')
  const [personId, setPersonId] = useState<string>()
  // A status line on the list, e.g. "Jan Peeters is deleted."; cleared on the next change.
  const [message, setMessage] = useState<string>()
  // Where the list was scrolled when a Person was opened; restored on Back.
  const listScroll = useRef<number | undefined>(undefined)

  // First load: the data and the default view (the active Event, or all contacts, FR-003).
  useEffect(() => {
    let cancelled = false
    void Promise.all([loadData(), getSettings()]).then(([loaded, settings]) => {
      if (cancelled) return
      setData(loaded)
      setView(defaultView(settings.activeEventId))
    })
    return () => {
      cancelled = true
    }
  }, [])

  const reload = useCallback(async () => {
    setData(await loadData())
  }, [])

  // Back from a Person: put the list where it was before it is painted.
  useLayoutEffect(() => {
    if (personId !== undefined || listScroll.current === undefined) return
    window.scrollTo(0, listScroll.current)
    listScroll.current = undefined
  }, [personId])

  const rows = useMemo(
    () => (data && view ? buildContactRows(data.persons, data.encounters, view, query) : []),
    [data, view, query],
  )

  const open = useCallback((id: string) => {
    setMessage(undefined)
    listScroll.current = window.scrollY
    setPersonId(id)
    window.scrollTo(0, 0)
  }, [])

  const back = useCallback(() => {
    setPersonId(undefined)
    void reload() // in the background: the rows already in state are shown first
  }, [reload])

  const replaced = useCallback(
    (id: string) => {
      setPersonId(id)
      void reload()
    },
    [reload],
  )

  const deleted = useCallback(
    (name: string) => {
      setMessage(t('contacts.deleted', { name }))
      // Drop the row at once, so it does not show for a moment before the reload.
      setData((current) => current && { ...current, persons: current.persons.filter((p) => p.id !== personId) })
      setPersonId(undefined)
      void reload()
    },
    [personId, reload, t],
  )

  // Nothing until the first load is done, so the empty message never flashes.
  if (!data || !view) return null

  if (personId !== undefined) {
    return (
      <PersonDetail
        key={personId}
        personId={personId}
        events={data.events}
        onBack={back}
        onChanged={() => void reload()}
        onPersonReplaced={replaced}
        onDeleted={deleted}
      />
    )
  }

  return (
    <ContactList
      rows={rows}
      events={data.events}
      view={view}
      onViewChange={(next) => {
        setMessage(undefined)
        setView(next)
      }}
      query={query}
      onQueryChange={(next) => {
        setMessage(undefined)
        setQuery(next)
      }}
      onOpen={open}
      onAddSomeone={onAddSomeone}
      message={message}
    />
  )
}
