import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { StorageFullError } from '../data/errors'
import {
  dismissAction,
  listDismissals,
  listEncounters,
  listEvents,
  listPersons,
  undoDismissal,
} from '../data/repository'
import type { ActionType, Dismissal, Encounter, Event, Person } from '../data/types'
import { useLanguage } from '../i18n/LanguageProvider'
import { buildActionCards } from '../people/actions'
import { ACTION_LABELS, ActionCard } from './ActionCard'
import { PersonDetail } from './PersonDetail'

interface ActionsData {
  persons: Person[]
  encounters: Encounter[]
  events: Event[]
  dismissals: Dismissal[]
}

async function loadData(): Promise<ActionsData> {
  const [persons, encounters, events, dismissals] = await Promise.all([
    listPersons(),
    listEncounters(),
    listEvents(),
    listDismissals(),
  ])
  return { persons, encounters, events, dismissals }
}

/** The Actions tab: what is still open after meeting people (F8, Flow C). */
export function ActionsTab() {
  const { t } = useLanguage()
  const [data, setData] = useState<ActionsData>()
  // The Person opened from a card: F7's detail screen, inside this tab (research R7).
  const [personId, setPersonId] = useState<string>()
  const listScroll = useRef<number | undefined>(undefined)
  // The last dismissal, for the "Undo" line; cleared by the next change on the tab (FR-009).
  const [lastDismissal, setLastDismissal] = useState<{
    dismissal: Dismissal
    previous?: Dismissal
    text: string
  }>()

  const reload = useCallback(async () => {
    setData(await loadData())
  }, [])

  useEffect(() => {
    let cancelled = false
    void loadData().then((loaded) => {
      if (!cancelled) setData(loaded)
    })
    return () => {
      cancelled = true
    }
  }, [])

  // Back from a Person: put the list where it was before it is painted.
  useLayoutEffect(() => {
    if (personId !== undefined || listScroll.current === undefined) return
    window.scrollTo(0, listScroll.current)
    listScroll.current = undefined
  }, [personId])

  const cards = useMemo(
    () => (data ? buildActionCards(data.persons, data.encounters, data.dismissals) : []),
    [data],
  )

  // Any change on the tab: reload, and the Undo line goes.
  const changed = useCallback(() => {
    setLastDismissal(undefined)
    void reload()
  }, [reload])

  async function dismiss(person: Person, type: ActionType) {
    try {
      const result = await dismissAction(person.id, type)
      setLastDismissal({
        ...result,
        text: t('actions.dismissed', { action: t(ACTION_LABELS[type]), name: person.name }),
      })
      await reload()
    } catch (err) {
      if (!(err instanceof StorageFullError)) throw err
    }
  }

  async function undo() {
    if (!lastDismissal) return
    try {
      await undoDismissal(lastDismissal.dismissal.id, lastDismissal.previous)
      changed()
    } catch (err) {
      if (!(err instanceof StorageFullError)) throw err
    }
  }

  const open = useCallback((id: string) => {
    setLastDismissal(undefined)
    listScroll.current = window.scrollY
    setPersonId(id)
    window.scrollTo(0, 0)
  }, [])

  const back = useCallback(() => {
    setPersonId(undefined)
    void reload()
  }, [reload])

  // Nothing until the first load is done, so "all done" never flashes.
  if (!data) return null

  if (personId !== undefined) {
    return (
      <PersonDetail
        key={personId}
        personId={personId}
        events={data.events}
        onBack={back}
        onChanged={() => void reload()}
        onPersonReplaced={(id) => {
          setPersonId(id)
          void reload()
        }}
        onDeleted={back}
      />
    )
  }

  return (
    <main className="actions">
      <h1>{t('actions.title')}</h1>
      {lastDismissal && (
        <p role="status" className="actions-message">
          <span>{lastDismissal.text}</span>
          <button type="button" className="text-button" onClick={() => void undo()}>
            {t('actions.undo')}
          </button>
        </p>
      )}
      {cards.length === 0 ? (
        <div className="actions-empty">
          <p className="butterfly" aria-hidden="true">
            🦋
          </p>
          <p>{t('actions.empty')}</p>
        </div>
      ) : (
        cards.map((card) => (
          <ActionCard
            key={card.person.id}
            card={card}
            events={data.events}
            onOpenPerson={open}
            onChanged={changed}
            onDismiss={(type) => void dismiss(card.person, type)}
          />
        ))
      )}
    </main>
  )
}
