import { useEffect } from 'react'

/**
 * Keeps the screen on while `active`, where the device allows it (F9 FR-012, research R4).
 * In a home-screen web app this works from iOS 18.4. Without support it does nothing and shows
 * no error (FR-013).
 */
export function useWakeLock(active: boolean): void {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator) || !navigator.wakeLock) return
    const wakeLock = navigator.wakeLock
    let sentinel: WakeLockSentinel | undefined
    let cancelled = false

    // iOS releases the lock when the page is hidden; ask again when it is visible (research R4).
    const acquire = () => {
      if (document.visibilityState !== 'visible') return
      wakeLock.request('screen').then(
        (lock) => {
          if (cancelled) void lock.release().catch(() => {})
          else sentinel = lock
        },
        () => {}, // refused (for example Low Power Mode): the screen behaves as usual
      )
    }

    acquire()
    document.addEventListener('visibilitychange', acquire)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', acquire)
      void sentinel?.release().catch(() => {})
    }
  }, [active])
}
