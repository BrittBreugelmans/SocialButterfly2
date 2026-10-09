/**
 * Reads the clipboard after a tap on "Paste LinkedIn link" (T5, research R1 in
 * specs/004-link-profile). iOS shows its own "Paste" bubble; the owner taps it.
 *
 * Call it directly in the tap handler, before any await: iOS refuses actions that do not
 * follow a tap closely (lesson from F2).
 */
export function readClipboardText(): Promise<string | 'dismissed' | 'unsupported'> {
  if (typeof navigator.clipboard?.readText !== 'function') return Promise.resolve('unsupported')
  return navigator.clipboard.readText().then(
    (text) => text,
    () => 'dismissed' as const, // bubble dismissed or pasting refused: nothing to do
  )
}
