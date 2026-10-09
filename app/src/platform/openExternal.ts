/**
 * Opens a LinkedIn URL in a new window: the LinkedIn app, Safari or a browser view, depending on
 * iOS (research R1 in specs/003-add-by-name). Returns false when the opening was blocked.
 *
 * Call it in the same tap handler, right after the save, so Safari still treats it as a tap.
 * The 'noopener' feature is not passed: with it, window.open always returns null and a block
 * could not be detected. The opener is cleared by hand instead.
 */
export function openLinkedIn(url: string): boolean {
  try {
    const opened = window.open(url, '_blank')
    if (!opened) return false
    opened.opener = null
    return true
  } catch {
    return false
  }
}
