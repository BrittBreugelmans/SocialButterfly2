import { readClipboardText } from '../platform/clipboard'
import { normalizeProfileUrl } from './profileUrl'

export type PasteProfileUrlResult =
  | { ok: true; url: string }
  | { ok: false; messageKey: 'link.invalid' | 'link.shortLink' | 'link.unsupported' }
  /** The owner tapped next to the iOS bubble, or iOS refused the paste: nothing to do. */
  | 'dismissed'

/**
 * "Paste LinkedIn link" with F4's rules (F4 FR-001–FR-004): read the clipboard, normalize the
 * profile link, or say which message to show. Shared by F4/F7 and My QR (F9 research R6).
 *
 * Call it directly in the tap handler: the clipboard is read before any await (F4 R1).
 */
export function pasteProfileUrl(): Promise<PasteProfileUrlResult> {
  const reading = readClipboardText()
  return reading.then((text): PasteProfileUrlResult => {
    if (text === 'dismissed') return 'dismissed'
    if (text === 'unsupported') return { ok: false, messageKey: 'link.unsupported' }
    const normalized = normalizeProfileUrl(text)
    if (normalized.ok) return { ok: true, url: normalized.url }
    return { ok: false, messageKey: normalized.reason === 'shortLink' ? 'link.shortLink' : 'link.invalid' }
  })
}
