import { useCallback, useEffect, useLayoutEffect, useState } from 'react'
import { getSettings, listEvents } from './data/repository'
import type { Event } from './data/types'
import { useDailyChoice } from './events/useDailyChoice'
import { useOnline } from './platform/online'
import { requestPersistentStorage, type StorageStatus } from './platform/persistence'
import { isStandalone } from './platform/standalone'
import { Banners, OfflineScreen } from './ui/Banners'
import { ContextChoice } from './ui/ContextChoice'
import { NewEventForm } from './ui/NewEventForm'
import { StartScreen } from './ui/StartScreen'

type Screen = 'choice' | 'newEvent' | 'start'

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

  // Load the active Event whenever the start screen is shown (FR-008).
  useEffect(() => {
    if (screen !== 'start' || status === 'loading') return
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
      {status === 'loading' ? null : screen === 'choice' ? (
        <ContextChoice onNewEvent={() => setScreen('newEvent')} onDone={contextChosen} />
      ) : screen === 'newEvent' ? (
        <NewEventForm onSaved={contextChosen} onBack={() => setScreen('choice')} />
      ) : (
        <StartScreen
          storageStatus={storageStatus}
          activeEvent={activeEvent}
          onChangeContext={() => setScreen('choice')}
        />
      )}
    </>
  )
}
