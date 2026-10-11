import { useEffect, useId, useRef, useState, type MouseEvent } from 'react'
import { DuplicateProfileUrlError, StorageFullError } from '../data/errors'
import { addByName, findPersonByProfileUrl, findSameNamePersons, type SameNameMatch } from '../data/repository'
import type { Event, Person } from '../data/types'
import { useLanguage } from '../i18n/LanguageProvider'
import { nameFromProfileUrl, normalizeProfileUrl, shortProfileUrl } from '../linkedin/profileUrl'
import { normalizeName } from '../people/nameMatch'
import { CameraError, startQrScanner } from '../platform/camera'
import type { SavedByName } from './AddByNameForm'
import { ContextBar } from './ContextBar'
import { SameNameQuestion } from './SameNameQuestion'

interface AddByQrProps {
  /** The active Event, undefined during casual networking, or 'loading' while it is read. */
  activeEvent: Event | undefined | 'loading'
  onSaved(result: SavedByName): void
  onAddByName(): void
  onBack(): void
}

/** Only Persons without a profile link can be "the same person" for a scan (F5 US2 scenario 4). */
async function sameNameWithoutLink(name: string): Promise<SameNameMatch[]> {
  return (await findSameNamePersons(name)).filter((match) => match.person.profileUrl === undefined)
}

/**
 * F5: scan a LinkedIn QR code, confirm the name, and one tap opens the profile and saves (B20).
 * A Person with the scanned link is reused (B8, B19); a same-name Person without a link triggers
 * F2's question (B15).
 */
export function AddByQr({ activeEvent, onSaved, onAddByName, onBack }: AddByQrProps) {
  const { t } = useLanguage()
  const id = useId()
  const videoRef = useRef<HTMLVideoElement>(null)

  // Scanning
  const [phase, setPhase] = useState<'scanning' | 'confirm'>('scanning')
  const [scanRound, setScanRound] = useState(0) // a new round restarts the camera
  const [paused, setPaused] = useState(false)
  const [cameraError, setCameraError] = useState<CameraError['reason']>()
  const [message, setMessage] = useState('')

  // Confirming
  const [url, setUrl] = useState('')
  const [known, setKnown] = useState<{ person: Person; metToday: boolean }>()
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [checked, setChecked] = useState<{ key: string; matches: SameNameMatch[] }>()
  const [question, setQuestion] = useState<SameNameMatch[]>()
  const [saving, setSaving] = useState(false)
  const savingRef = useRef(false)

  /** A profile code was read: look up who it is and show the confirmation. */
  async function found(profileUrl: string) {
    const person = await findPersonByProfileUrl(profileUrl)
    if (person) {
      const match = (await findSameNamePersons(person.name)).find((m) => m.person.id === person.id)
      setKnown({ person, metToday: match?.metToday ?? false })
      setName(person.name)
      setCompany(person.company ?? '')
    } else {
      setKnown(undefined)
      setName(nameFromProfileUrl(profileUrl))
      setCompany('')
    }
    setUrl(profileUrl)
    setMessage('')
    setPhase('confirm')
  }

  // The camera runs only while scanning; every way out stops it (FR-002).
  useEffect(() => {
    if (phase !== 'scanning' || !videoRef.current) return
    let stop: (() => void) | undefined
    let done = false
    let lastRefused = ''
    setPaused(false)
    setCameraError(undefined)

    const onCode = (text: string) => {
      if (done) return
      const result = normalizeProfileUrl(text)
      if (!result.ok) {
        // The same wrong code is read many times per second; show the message once.
        if (text !== lastRefused) {
          lastRefused = text
          setMessage(t(result.reason === 'shortLink' ? 'qr.shortLink' : 'qr.notProfile'))
        }
        return
      }
      done = true
      stop?.()
      void found(result.url)
    }

    startQrScanner(videoRef.current, onCode).then(
      (stopCamera) => {
        if (done) stopCamera()
        else stop = stopCamera
      },
      (err: unknown) => {
        if (!done) setCameraError(err instanceof CameraError ? err.reason : 'unavailable')
      },
    )

    // The app goes to the background: stop the camera; "Scan again" restarts it.
    const onVisibilityChange = () => {
      if (document.visibilityState !== 'hidden' || done) return
      done = true
      stop?.()
      setPaused(true)
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      done = true
      stop?.()
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
    // One camera per scanning round; "Scan again" starts a new round.
  }, [phase, scanRound])

  // Same-name check while the name is edited (only for a new Person), as in F2 (B20).
  const key = normalizeName(name)
  const blank = key === ''
  useEffect(() => {
    if (phase !== 'confirm' || known || key === '') return
    let cancelled = false
    void sameNameWithoutLink(key).then((matches) => {
      if (!cancelled) setChecked({ key, matches })
    })
    return () => {
      cancelled = true
    }
  }, [phase, known, key])
  const ready = known !== undefined || blank || checked?.key === key

  /** Runs one save at a time; storage full keeps the screen (the F0 banner explains). */
  async function busy(work: () => Promise<void>) {
    if (savingRef.current) return
    savingRef.current = true
    setSaving(true)
    try {
      await work()
    } catch (err) {
      // Someone else got this link in the meantime: look it up again.
      if (err instanceof DuplicateProfileUrlError) await found(url)
      else if (!(err instanceof StorageFullError)) throw err
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }

  async function save(existingPersonId: string | undefined, linkOpened: boolean) {
    const result = await addByName({ name, company, existingPersonId, profileUrl: url })
    onSaved({ ...result, opened: linkOpened && !result.alreadyMetToday })
  }

  function scanAgain() {
    setQuestion(undefined)
    setMessage('')
    setPhase('scanning')
    setScanRound((round) => round + 1)
  }

  /** "Save and open LinkedIn": the link opens the profile; the save starts on the same tap. */
  function confirm(event: MouseEvent<HTMLAnchorElement>) {
    if (savingRef.current || (!known && blank)) {
      event.preventDefault()
      return
    }
    if (known) {
      void busy(() => save(known.person.id, true))
      return
    }
    if (!ready) {
      // Tapped before the name check finished: check and save first (F2 research R1 fallback).
      event.preventDefault()
      void busy(async () => {
        const matches = await sameNameWithoutLink(name)
        if (matches.length > 0) setQuestion(matches)
        else await save(undefined, false)
      })
      return
    }
    if (checked && checked.matches.length > 0) {
      event.preventDefault()
      setQuestion(checked.matches)
      return
    }
    void busy(() => save(undefined, true))
  }

  if (phase === 'scanning') {
    return (
      <main className="event-form-screen qr-screen">
        <h1>{t('qr.title')}</h1>
        {cameraError ? (
          <div className="note-info qr-camera-error">
            <p>{t(cameraError === 'denied' ? 'qr.cameraDenied' : 'qr.cameraUnavailable')}</p>
            <button type="button" onClick={onAddByName}>
              {t('start.addByName')}
            </button>
          </div>
        ) : (
          <>
            <video ref={videoRef} className="qr-video" playsInline muted autoPlay />
            {paused ? (
              <button type="button" onClick={scanAgain}>
                {t('qr.scanAgain')}
              </button>
            ) : (
              <p className="qr-hint">{t('qr.hint')}</p>
            )}
          </>
        )}
        <p role="status" className="qr-message">
          {message}
        </p>
        <button type="button" className="secondary" onClick={onBack}>
          {t('add.back')}
        </button>
      </main>
    )
  }

  if (question) {
    return (
      <SameNameQuestion
        matches={question}
        newPersonUrl={url}
        linkFor={() => url}
        busy={saving}
        onPick={(match, linkOpened) => void busy(() => save(match.person.id, linkOpened))}
        onNewPerson={() => void busy(() => save(undefined, true))}
        onBack={() => setQuestion(undefined)}
      />
    )
  }

  return (
    <main className="event-form-screen">
      <h1>{t('qr.confirmTitle')}</h1>
      <ContextBar event={activeEvent} />

      {known ? (
        <>
          <p className="note-info">{t('qr.known', { name: known.person.name })}</p>
          <p className="qr-known">
            <strong>{known.person.name}</strong>
            {known.person.company && ` · ${known.person.company}`}
          </p>
        </>
      ) : (
        <form className="event-form" onSubmit={(e) => e.preventDefault()}>
          <label htmlFor={`${id}-name`}>{t('add.name')}</label>
          <input
            id={`${id}-name`}
            value={name}
            maxLength={100}
            placeholder={t('add.namePlaceholder')}
            autoComplete="off"
            autoCapitalize="words"
            onChange={(e) => setName(e.target.value)}
          />
          <label htmlFor={`${id}-company`}>{t('add.company')}</label>
          <input
            id={`${id}-company`}
            value={company}
            maxLength={100}
            placeholder={t('add.companyPlaceholder')}
            autoComplete="off"
            autoCapitalize="words"
            onChange={(e) => setCompany(e.target.value)}
          />
        </form>
      )}

      <p className="qr-link">{shortProfileUrl(url)}</p>

      {known?.metToday ? (
        // Already met today: no LinkedIn, straight to today's note step (B19).
        <button type="button" disabled={saving} onClick={() => void busy(() => save(known.person.id, false))}>
          {t('qr.saveMetToday')}
        </button>
      ) : (
        <a
          className="button-link"
          href={url}
          target="_blank"
          rel="noopener"
          aria-disabled={saving || (!known && blank)}
          aria-busy={!ready}
          onClick={confirm}
        >
          {t('qr.save')}
        </a>
      )}
      <button type="button" className="secondary" onClick={scanAgain}>
        {t('qr.scanAgain')}
      </button>
      <button type="button" className="secondary" onClick={onBack}>
        {t('add.back')}
      </button>
    </main>
  )
}
