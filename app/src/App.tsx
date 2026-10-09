import { useCallback, useEffect, useLayoutEffect, useState } from 'react'
import { getNoteStep, getSettings, listEvents } from './data/repository'
import type { Event } from './data/types'
import { useDailyChoice } from './events/useDailyChoice'
import { useOnline } from './platform/online'
import { requestPersistentStorage, type StorageStatus } from './platform/persistence'
import { isStandalone } from './platform/standalone'
import { AddByNameForm, type SavedByName } from './ui/AddByNameForm'
import { Banners, OfflineScreen } from './ui/Banners'
import { ContextChoice } from './ui/ContextChoice'
import { NewEventForm } from './ui/NewEventForm'
import { NoteStep } from './ui/NoteStep'
import { StartScreen } from './ui/StartScreen'

type Screen = 'choice' | 'newEvent' | 'start' | 'addByName' | 'noteStep'

export function App() {
  const online = useOnline()
  // FR-005: full screen only when the app starts offline; a later drop shows a banner.
  const [offlineAtStart, setOfflineAtStart] = useState(() => !navigator.onLine)
  const [standalone] = useState(isStandalone)
  const [storageStatus, setStorageStatus] = useState<StorageStatus | 'checking'>('checking')

  // F1: which screen is shown, and the active Event for the context bar.
  const { status, recheck } = useDailyChoice()
  const [screen, setScreen] = useState<Screen>('start')
  const [activeEvent, setActiveEvent] = useState<Event | undefined | 'loading'>('loading')

  // F2: the open note step, and whether an unfinished one was looked for on start (B18).
  const [noteStep, setNoteStep] = useState<SavedByName>()
  const [noteStepChecked, setNoteStepChecked] = useState(false)

  useEffect(() => {
    if (online) setOfflineAtStart(false)
  }, [online])

  // Ask iOS to keep the data on every start (FR-007).
  useEffect(() => {
    let cancelled = false
    void requestPersistentStorage().then((result) => {
      if (!cancelled) setStorageStatus(result)
    })
    return () => {
      cancelled = true
    }
  }, [])

  // F1 (B13): on the first opening of a new day, show the choice. A layout effect switches the
  // screen before it is painted, so the start screen never flashes first.
  useLayoutEffect(() => {
    if (status === 'choose') setScreen('choice')
  }, [status])

  // F2 (B18): once the daily choice is settled, bring back a note step that iOS interrupted
  // today. Until this check is done nothing is shown, so the start screen does not flash first.
  useEffect(() => {
    if (status !== 'ready' || noteStepChecked) return
    let cancelled = false
    void getNoteStep().then((step) => {
      if (cancelled) return
      if (step) {
        setNoteStep({ ...step, alreadyMetToday: false, opened: true })
        setScreen('noteStep')
      }
      setNoteStepChecked(true)
    })
    return () => {
      cancelled = true
    }
  }, [status, noteStepChecked])

  // Load the active Event whenever the start screen or the quick mode form is shown (FR-008, F2 FR-002).
  useEffect(() => {
    if ((screen !== 'start' && screen !== 'addByName') || status === 'loading') return
    let cancelled = false
    setActiveEvent('loading')
    void Promise.all([getSettings(), listEvents()]).then(([settings, events]) => {
      if (!cancelled) setActiveEvent(events.find((e) => e.id === settings.activeEventId))
    })
    return () => {
      cancelled = true
    }
  }, [screen, status])

  // After a choice: back to the start screen, and re-read Settings so the daily check is current.
  const contextChosen = useCallback(() => {
    recheck()
    setScreen('start')
  }, [recheck])

  if (offlineAtStart) return <OfflineScreen />

  //Banners -> meldingen komen bovenaan
  //StartScreen -> titel, taalknop en versienummer

  return (
    <>
      <Banners online={online} standalone={standalone} storageStatus={storageStatus} />
      {status === 'loading' || (status === 'ready' && !noteStepChecked) ? null : screen === 'choice' ? (
        <ContextChoice onNewEvent={() => setScreen('newEvent')} onDone={contextChosen} />
      ) : screen === 'newEvent' ? (
        <NewEventForm onSaved={contextChosen} onBack={() => setScreen('choice')} />
      ) : screen === 'addByName' ? (
        <AddByNameForm
          activeEvent={activeEvent}
          onSaved={(result) => {
            setNoteStep(result)
            setScreen('noteStep')
          }}
          onBack={() => setScreen('start')}
        />
      ) : screen === 'noteStep' && noteStep ? (
        <NoteStep
          key={noteStep.encounter.id}
          {...noteStep}
          onDone={() => {
            setNoteStep(undefined)
            setScreen('start')
          }}
        />
      ) : (
        <StartScreen
          storageStatus={storageStatus}
          activeEvent={activeEvent}
          onChangeContext={() => setScreen('choice')}
          onAddByName={() => setScreen('addByName')}
        />
      )}
    </>
  )
}
