import { useEffect, useState } from 'react'
import { useOnline } from './platform/online'
import { requestPersistentStorage, type StorageStatus } from './platform/persistence'
import { isStandalone } from './platform/standalone'
import { Banners, OfflineScreen } from './ui/Banners'
import { StartScreen } from './ui/StartScreen'

export function App() {
  const online = useOnline()
  // FR-005: full screen only when the app starts offline; a later drop shows a banner.
  const [offlineAtStart, setOfflineAtStart] = useState(() => !navigator.onLine)
  const [standalone] = useState(isStandalone)
  const [storageStatus, setStorageStatus] = useState<StorageStatus | 'checking'>('checking')

  useEffect(() => {
    if (online) setOfflineAtStart(false)
  }, [online])

  // Ask iOS to keep the data on every start (FR-007).
  useEffect(() => {
    let cancelled = false
    void requestPersistentStorage().then((status) => {
      if (!cancelled) setStorageStatus(status)
    })
    return () => {
      cancelled = true
    }
  }, [])

  if (offlineAtStart) return <OfflineScreen />

  return (
    <>
      <Banners online={online} standalone={standalone} storageStatus={storageStatus} />
      <StartScreen storageStatus={storageStatus} />
    </>
  )
}
