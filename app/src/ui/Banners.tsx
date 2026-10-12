import { useEffect, useState } from 'react'
import { onStorageFull } from '../data/repository'
import { useLanguage } from '../i18n/LanguageProvider'
import type { StorageStatus } from '../platform/persistence'
import { Logo } from './Logo'

/** Full-screen message when the app starts without internet (FR-005). My QR still works (F9, B34). */
export function OfflineScreen({ onShowMyQr }: { onShowMyQr: () => void }) {
  const { t } = useLanguage()
  return (
    <main className="offline-screen" role="alert">
      <Logo />
      <p>{t('offline.message')}</p>
      <button type="button" className="secondary" onClick={onShowMyQr}>
        {t('offline.showMyQr')}
      </button>
    </main>
  )
}

interface BannersProps {
  online: boolean
  standalone: boolean
  storageStatus: StorageStatus | 'checking'
}

/** Non-blocking messages above the start screen. None of them stops the owner from using the app. */
export function Banners({ online, standalone, storageStatus }: BannersProps) {
  const { t } = useLanguage()
  const [storageFull, setStorageFull] = useState(false)

  useEffect(() => onStorageFull(() => setStorageFull(true)), [])

  return (
    <div className="banners">
      {!online && (
        <p className="banner banner-warning" role="status">
          {t('offline.banner')}
        </p>
      )}
      {(storageStatus === 'not-persisted' || storageStatus === 'unsupported') && (
        <p className="banner banner-warning" role="status">
          {t('storage.notPersisted')}
        </p>
      )}
      {storageFull && (
        <div className="banner banner-error" role="alert">
          <p>{t('storage.full')}</p>
          <button type="button" className="banner-dismiss" onClick={() => setStorageFull(false)}>
            {t('banner.dismiss')}
          </button>
        </div>
      )}
      {!standalone && (
        <p className="banner banner-info" role="note">
          {t('install.hint')}
        </p>
      )}
    </div>
  )
}
