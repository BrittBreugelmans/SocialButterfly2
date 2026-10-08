import { useEffect, useState } from 'react'
import { onStorageFull } from '../data/repository'
import { useLanguage } from '../i18n/LanguageProvider'
import type { StorageStatus } from '../platform/persistence'

/** Full-screen message when the app starts without internet (FR-005). */
export function OfflineScreen() {
  const { t } = useLanguage()
  return (
    <main className="offline-screen" role="alert">
      <p className="offline-butterfly" aria-hidden="true">
        🦋
      </p>
      <p>{t('offline.message')}</p>
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
