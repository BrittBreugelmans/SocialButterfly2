import { useEffect, useMemo, useState } from 'react'
import { StorageFullError } from '../data/errors'
import { getSettings, setOwnerProfileUrl } from '../data/repository'
import type { Settings } from '../data/types'
import { en } from '../i18n/en'
import { useLanguage } from '../i18n/LanguageProvider'
import { nl } from '../i18n/nl'
import { pasteProfileUrl } from '../linkedin/pasteProfileUrl'
import { shortProfileUrl } from '../linkedin/profileUrl'
import { makeQr, QUIET_ZONE } from '../myQr/qr'
import { useWakeLock } from '../platform/wakeLock'

interface MyQrTabProps {
  /** Only from the offline screen (B34): shows Back, and the app shows no tab bar. */
  onBack?: () => void
}

/** My QR (F9): the owner's own LinkedIn QR, or the one-time setup of her link (B32, B33). */
export function MyQrTab({ onBack }: MyQrTabProps) {
  const { t } = useLanguage()
  const [settings, setSettings] = useState<Settings>()
  const [message, setMessage] = useState('')
  // Only while a QR is shown, never during the setup (FR-012).
  useWakeLock(Boolean(settings?.ownerProfileUrl))

  useEffect(() => {
    let cancelled = false
    void getSettings().then((loaded) => {
      if (!cancelled) setSettings(loaded)
    })
    return () => {
      cancelled = true
    }
  }, [])

  /** F4's paste rules (FR-003); only a valid link is stored. Called directly in the tap handler. */
  function pasteLink() {
    const pasting = pasteProfileUrl()
    void (async () => {
      const pasted = await pasting
      if (pasted === 'dismissed') return
      if (!pasted.ok) {
        setMessage(t(pasted.messageKey))
        return
      }
      try {
        const changing = Boolean(settings?.ownerProfileUrl)
        setSettings(await setOwnerProfileUrl(pasted.url))
        setMessage(changing ? t('myQr.changed') : '')
      } catch (err) {
        if (!(err instanceof StorageFullError)) throw err // storage full: the F0 banner shows
      }
    })()
  }

  if (!settings) return null
  const url = settings.ownerProfileUrl

  return (
    <main className={url ? 'my-qr' : 'my-qr my-qr-setup'}>
      {onBack && (
        <button type="button" className="secondary back-button" onClick={onBack}>
          {t('myQr.back')}
        </button>
      )}
      {url ? (
        <>
          <h1 className="visually-hidden">{t('tab.myQr')}</h1>
          <QrImage url={url} label={t('myQr.alt')} />
          {/* For the person scanning: both languages at once, whatever the app language (FR-010a). */}
          <p className="my-qr-caption">
            <span lang="nl">{nl['myQr.scanMe']}</span>
            <span lang="en">{en['myQr.scanMe']}</span>
          </p>
          <p className="my-qr-link">{shortProfileUrl(url)}</p>
          <button type="button" className="text-button small" onClick={pasteLink}>
            {t('myQr.change')}
          </button>
        </>
      ) : (
        <>
          <p className="butterfly" aria-hidden="true">
            🦋
          </p>
          <h1>{t('myQr.setupTitle')}</h1>
          <p className="subtitle">{t('myQr.setupHint')}</p>
          <button type="button" className="secondary" onClick={pasteLink}>
            {t('link.paste')}
          </button>
        </>
      )}
      <p role="status" className="link-message">
        {message}
      </p>
    </main>
  )
}

/** The QR as one SVG: dark brand blue on fixed white, the butterfly in the cleared centre (research R3). */
function QrImage({ url, label }: { url: string; label: string }) {
  const qr = useMemo(() => makeQr(url), [url])
  const n = qr.size + 2 * QUIET_ZONE
  const modules = useMemo(() => {
    let d = ''
    qr.dark.forEach((row, y) =>
      row.forEach((dark, x) => {
        if (dark) d += `M${x + QUIET_ZONE} ${y + QUIET_ZONE}h1v1h-1z`
      }),
    )
    return d
  }, [qr])
  const { x, y, side } = qr.badge

  return (
    <div className="my-qr-panel">
      <svg role="img" aria-label={label} viewBox={`0 0 ${n} ${n}`} shapeRendering="crispEdges">
        <rect width={n} height={n} fill="#ffffff" />
        <path d={modules} fill="#004182" />
        <rect x={x + QUIET_ZONE} y={y + QUIET_ZONE} width={side} height={side} rx={1} fill="#ffffff" />
        <Butterfly x={x + QUIET_ZONE + 0.5} y={y + QUIET_ZONE + 0.5} size={side - 1} />
      </svg>
    </div>
  )
}

/** The butterfly from public/icon.svg (F11 makes the final logo), without its white background. */
function Butterfly({ x, y, size }: { x: number; y: number; size: number }) {
  return (
    <svg x={x} y={y} width={size} height={size} viewBox="56 56 400 400" shapeRendering="auto" aria-hidden="true">
      <g fill="#0a66c2">
        <ellipse cx="176" cy="196" rx="96" ry="76" transform="rotate(-30 176 196)" />
        <ellipse cx="336" cy="196" rx="96" ry="76" transform="rotate(30 336 196)" />
        <ellipse cx="196" cy="326" rx="62" ry="50" transform="rotate(30 196 326)" opacity="0.8" />
        <ellipse cx="316" cy="326" rx="62" ry="50" transform="rotate(-30 316 326)" opacity="0.8" />
        <rect x="244" y="150" width="24" height="230" rx="12" fill="#004182" />
      </g>
      <g stroke="#004182" strokeWidth="10" strokeLinecap="round" fill="none">
        <path d="M250 150 L214 96" />
        <path d="M262 150 L298 96" />
      </g>
      <g fill="#004182">
        <circle cx="214" cy="96" r="16" />
        <circle cx="298" cy="96" r="16" />
      </g>
    </svg>
  )
}
