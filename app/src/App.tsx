import { useCallback, useEffect, useLayoutEffect, useState } from 'react'
import { StorageFullError } from './data/errors'
import { getNoteStep, getSettings, listEvents, setGuestMode } from './data/repository'
import type { Event } from './data/types'
import { useDailyChoice } from './events/useDailyChoice'
import { normalizeName } from './people/nameMatch'
import { useOnline } from './platform/online'
import { requestPersistentStorage, type StorageStatus } from './platform/persistence'
import { useOpenActionCount } from './people/useOpenActionCount'
import { isStandalone } from './platform/standalone'
import { AddByNameForm, type SavedByName } from './ui/AddByNameForm'
import { AddByQr } from './ui/AddByQr'
import { Banners, OfflineScreen } from './ui/Banners'
import { ContextChoice } from './ui/ContextChoice'
import { Flutter, FLUTTER_ON } from './ui/Flutter'
import { GuestMode, type GuestInput } from './ui/GuestMode'
import { NewEventForm } from './ui/NewEventForm'
import { NoteStep } from './ui/NoteStep'
import { StartScreen } from './ui/StartScreen'
import { ActionsTab } from './ui/ActionsTab'
import { ContactsTab } from './ui/ContactsTab'
import { MyQrTab } from './ui/MyQrTab'
import { SettingsTab } from './ui/SettingsTab'
import { TabBar, type Tab } from './ui/TabBar'

type Screen = 'choice' | 'newEvent' | 'start' | 'addByName' | 'addByQr' | 'noteStep'

/** Storage full: the F0 banner shows once guest mode is off; guest mode itself keeps working (F3 R1). */
function ignoreStorageFull(error: unknown) {
  if (!(error instanceof StorageFullError)) throw error
}

export function App() {
  const online = useOnline()
  // FR-005: full screen only when the app starts offline; a later drop shows a banner.
  const [offlineAtStart, setOfflineAtStart] = useState(() => !navigator.onLine)
  // F9 (B34): My QR opened from the offline screen; the rest of the app stays blocked.
  const [qrWhileOffline, setQrWhileOffline] = useState(false)
  const [standalone] = useState(isStandalone)
  const [storageStatus, setStorageStatus] = useState<StorageStatus | 'checking'>('checking')

  // F1: which screen is shown, and the active Event for the context bar.
  const { status, recheck } = useDailyChoice()
  const [screen, setScreen] = useState<Screen>('start')
  // F7 (B26): the chosen tab while the 'start' screen (the tabs) is shown. The app opens on Add.
  const [tab, setTab] = useState<Tab>('add')
  // F8: the number of open Actions, as a badge on the Actions tab.
  const openActionCount = useOpenActionCount()
  const [activeEvent, setActiveEvent] = useState<Event | undefined | 'loading'>('loading')

  // F2: the open note step, and whether an unfinished one was looked for on start (B18).
  const [noteStep, setNoteStep] = useState<SavedByName & { message?: string }>()
  const [noteStepChecked, setNoteStepChecked] = useState(false)
  // F11 (M7): the butterfly after the note step of a new Encounter; a counter, so each one is new.
  // A note step restored after iOS closed the app (B18) cannot tell B19, so it may fly once there
  // (accepted, research R6).
  const [flutter, setFlutter] = useState(0)
  // F1 follow-up (B24): an Event created for later, shown as a line on the choice.
  const [createdNotActive, setCreatedNotActive] = useState<Event>()
  // F3: guest mode, read from Settings on start so a reload reopens it (FR-018, research R1, R5).
  const [guestMode, setGuestModeState] = useState<boolean | 'loading'>('loading')
  // F3: what the guest typed, for the quick mode form after the hand-back (research R6).
  const [guestInput, setGuestInput] = useState<GuestInput>()

  useEffect(() => {
    let cancelled = false
    getSettings()
      .then((settings) => {
        if (!cancelled) setGuestModeState(settings.guestModeOn === true)
      })
      .catch(() => {
        if (!cancelled) setGuestModeState(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (online) setOfflineAtStart(false)
  }, [online])

  // F11: leaving the start screen stops the butterfly for good; it never replays on return.
  useEffect(() => {
    if (screen !== 'start' || tab !== 'add') setFlutter(0)
  }, [screen, tab])

  // Back online while the QR is shown: stay on it, now as the My QR tab (F9 research R7).
  useEffect(() => {
    if (online && qrWhileOffline) {
      setTab('myQr')
      setQrWhileOffline(false)
    }
  }, [online, qrWhileOffline])

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
    // F3: not while guest mode is on; the owner's screens wait until she ends it (FR-018).
    if (status !== 'ready' || noteStepChecked || guestMode !== false) return
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
  }, [status, noteStepChecked, guestMode])

  // Load the active Event whenever the start screen or the quick mode form is shown (FR-008, F2 FR-002).
  // Also on a tab change: Settings can rename or delete the active Event (F10 research R8).
  useEffect(() => {
    if ((screen !== 'start' && screen !== 'addByName' && screen !== 'addByQr') || status === 'loading') return
    let cancelled = false
    setActiveEvent('loading')
    void Promise.all([getSettings(), listEvents()]).then(([settings, events]) => {
      if (!cancelled) setActiveEvent(events.find((e) => e.id === settings.activeEventId))
    })
    return () => {
      cancelled = true
    }
  }, [screen, status, tab])

  // Back to the tabs after a flow: always on the Add tab, where the flows start (F7 FR-001b).
  const toStart = useCallback(() => {
    setTab('add')
    setScreen('start')
  }, [])

  // After a choice: back to the start screen, and re-read Settings so the daily check is current.
  // F3: with a guest's name waiting, the quick mode form opens instead (research R5).
  const contextChosen = useCallback(() => {
    recheck()
    if (guestInput) setScreen('addByName')
    else toStart()
  }, [recheck, toStart, guestInput])

  // F3: the owner held the logo (B44). Nothing is saved here (FR-013).
  const endGuestMode = useCallback(
    (input: GuestInput) => {
      setGuestModeState(false)
      setGuestMode(false).catch(ignoreStorageFull)
      const named = normalizeName(input.name) !== ''
      setGuestInput(named ? input : undefined)
      if (status === 'choose') setScreen('choice')
      else if (named) setScreen('addByName')
      else toStart()
    },
    [status, toStart],
  )

  // F3: leaving the filled-in form drops the guest's input.
  const leaveAddByName = useCallback(() => {
    setGuestInput(undefined)
    toStart()
  }, [toStart])

  // F3: guest mode comes before everything else, the offline screen included (research R5).
  // While it is on, nothing of the owner is rendered: no banners, tab bar or context (FR-008).
  if (guestMode === 'loading') return null
  if (guestMode) {
    return (
      <GuestMode onExit={endGuestMode} />
    )
  }

  if (offlineAtStart) {
    return qrWhileOffline ? (
      <MyQrTab onBack={() => setQrWhileOffline(false)} />
    ) : (
      <OfflineScreen onShowMyQr={() => setQrWhileOffline(true)} />
    )
  }

  //Banners -> meldingen komen bovenaan
  //StartScreen -> titel, taalknop en versienummer

  return (
    <>
      <Banners online={online} standalone={standalone} storageStatus={storageStatus} />
      {status === 'loading' || (status === 'ready' && !noteStepChecked) ? null : screen === 'choice' ? (
        <ContextChoice
          createdNotActive={createdNotActive}
          onNewEvent={() => {
            setCreatedNotActive(undefined)
            setScreen('newEvent')
          }}
          onDone={() => {
            setCreatedNotActive(undefined)
            contextChosen()
          }}
        />
      ) : screen === 'newEvent' ? (
        <NewEventForm
          onSaved={contextChosen}
          onSavedNotActive={(event) => {
            setCreatedNotActive(event)
            setScreen('choice')
          }}
          onBack={() => setScreen('choice')}
        />
      ) : screen === 'addByQr' ? (
        <AddByQr
          activeEvent={activeEvent}
          onSaved={(result) => {
            setNoteStep(result)
            setScreen('noteStep')
          }}
          onAddByName={() => setScreen('addByName')}
          onBack={toStart}
        />
      ) : screen === 'addByName' ? (
        <AddByNameForm
          // Remount for the guest's input, so the initial values apply.
          key={guestInput ? 'guest' : 'owner'}
          activeEvent={activeEvent}
          initialName={guestInput?.name}
          initialCompany={guestInput?.company}
          onSaved={(result) => {
            setGuestInput(undefined)
            setNoteStep(result)
            setScreen('noteStep')
          }}
          onBack={leaveAddByName}
        />
      ) : screen === 'noteStep' && noteStep ? (
        <NoteStep
          // Remount after a merge (F4): another Person and maybe another Encounter.
          key={`${noteStep.person.id}:${noteStep.encounter.id}`}
          person={noteStep.person}
          encounter={noteStep.encounter}
          alreadyMetToday={noteStep.alreadyMetToday}
          opened={noteStep.opened}
          initialMessage={noteStep.message}
          onDone={() => {
            if (FLUTTER_ON && !noteStep.alreadyMetToday) setFlutter((n) => n + 1)
            setNoteStep(undefined)
            toStart()
          }}
          onMerged={({ person, encounter, message }) => setNoteStep({ ...noteStep, person, encounter, message })}
        />
      ) : (
        // F7: the tabs. Only here is the tab bar shown, never in a flow (FR-001c).
        <div className="has-tab-bar">
          {tab === 'add' ? (
            <>
              <StartScreen
                activeEvent={activeEvent}
                onChangeContext={() => setScreen('choice')}
                onAddByName={() => {
                  setGuestInput(undefined)
                  setScreen('addByName')
                }}
                onScanQr={() => {
                  setGuestInput(undefined)
                  setScreen('addByQr')
                }}
                onHandOver={() => {
                  // Shown at once; the flag is written in the background (research R1).
                  setGuestModeState(true)
                  setGuestMode(true).catch(ignoreStorageFull)
                }}
              />
              {flutter > 0 && <Flutter key={flutter} onDone={() => setFlutter(0)} />}
            </>
          ) : tab === 'contacts' ? (
            <ContactsTab onAddSomeone={() => setTab('add')} />
          ) : tab === 'actions' ? (
            <ActionsTab />
          ) : tab === 'myQr' ? (
            <MyQrTab />
          ) : (
            <SettingsTab
              storageStatus={storageStatus}
              onAllDataDeleted={() => {
                // F10 (research R6): contextChosenOn is gone, so the daily choice appears.
                recheck()
                toStart()
              }}
            />
          )}
          <TabBar tab={tab} onChange={setTab} badges={{ actions: openActionCount }} />
        </div>
      )}
    </>
  )
}
