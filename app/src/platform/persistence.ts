export type StorageStatus = 'persisted' | 'not-persisted' | 'unsupported'

/**
 * Asks iOS to keep the app's data permanently and reports the result (FR-007, research R2).
 * Called on every app start: being granted automatically is not documented by Apple.
 */
export async function requestPersistentStorage(): Promise<StorageStatus> {
  const storage = typeof navigator === 'undefined' ? undefined : navigator.storage
  if (!storage || typeof storage.persist !== 'function' || typeof storage.persisted !== 'function') {
    return 'unsupported'
  }
  try {
    await storage.persist()
    return (await storage.persisted()) ? 'persisted' : 'not-persisted'
  } catch {
    return 'not-persisted'
  }
}
