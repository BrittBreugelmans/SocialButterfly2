// The owner's QR code for My QR (F9, research R1–R2). Made on the device with uqr (B32).
// Pure: no DOM, no network.

import { encode } from 'uqr'

/** The light border around the code, in modules. */
export const QUIET_ZONE = 4

/** Largest share of the QR width the butterfly badge may cover (research R2). */
const BADGE_SHARE = 0.22

export interface QrCode {
  /** Modules per side, without quiet zone. */
  size: number
  /** dark[y][x]; the butterfly area is already cleared to light. */
  dark: boolean[][]
  /** The cleared centre square, in modules: top-left corner and side. */
  badge: { x: number; y: number; side: number }
}

/**
 * Encodes `text` at error correction level H (about 30% may be covered) and clears a centred
 * square for the butterfly.
 */
export function makeQr(text: string): QrCode {
  const { size, data } = encode(text, { ecc: 'H', border: 0 })
  let side = Math.floor(size * BADGE_SHARE)
  // Same parity as size, so the badge sits exactly in the middle.
  if (side % 2 !== size % 2) side -= 1
  const start = (size - side) / 2
  const end = start + side
  const dark = data.map((row, y) =>
    row.map((isDark, x) => isDark && !(x >= start && x < end && y >= start && y < end)),
  )
  return { size, dark, badge: { x: start, y: start, side } }
}
