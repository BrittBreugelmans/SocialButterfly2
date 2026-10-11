/**
 * The back camera for reading QR codes (F5, research R1–R2 in specs/005-add-by-qr).
 * Frames only live in memory for decoding; nothing is stored or sent (FR-003).
 */

export class CameraError extends Error {
  constructor(readonly reason: 'denied' | 'unavailable') {
    super(`Camera ${reason}`)
    this.name = 'CameraError'
  }
}

const DECODE_INTERVAL_MS = 200 // about 5 decodes per second: fast enough, saves battery
const MAX_SIDE = 720 // frames are scaled down before decoding

/**
 * Shows the back camera in `video` and calls `onCode` with the text of each QR code it reads.
 * Resolves with `stop()`, which stops the loop and the camera; safe to call more than once.
 */
export async function startQrScanner(video: HTMLVideoElement, onCode: (text: string) => void): Promise<() => void> {
  if (typeof navigator.mediaDevices?.getUserMedia !== 'function') throw new CameraError('unavailable')

  let stream: MediaStream
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
  } catch (err) {
    const name = (err as { name?: string }).name
    throw new CameraError(name === 'NotAllowedError' || name === 'SecurityError' ? 'denied' : 'unavailable')
  }

  let stopped = false
  let frame = 0
  const stop = () => {
    if (stopped) return
    stopped = true
    cancelAnimationFrame(frame)
    stream.getTracks().forEach((track) => track.stop())
    video.srcObject = null
  }

  try {
    // Needed on iOS to show the stream inside the page.
    video.playsInline = true
    video.muted = true
    video.srcObject = stream
    await video.play()
    // Loaded only here, so the rest of the app starts as fast as before (research R1).
    const { default: jsQR } = await import('jsqr')

    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) throw new CameraError('unavailable')
    let lastDecode = 0

    const tick = (time: number) => {
      if (stopped) return
      if (time - lastDecode >= DECODE_INTERVAL_MS && video.videoWidth > 0) {
        lastDecode = time
        const scale = Math.min(1, MAX_SIDE / Math.max(video.videoWidth, video.videoHeight))
        canvas.width = Math.round(video.videoWidth * scale)
        canvas.height = Math.round(video.videoHeight * scale)
        context.drawImage(video, 0, 0, canvas.width, canvas.height)
        const image = context.getImageData(0, 0, canvas.width, canvas.height)
        const result = jsQR(image.data, image.width, image.height, { inversionAttempts: 'dontInvert' })
        if (result?.data) onCode(result.data)
      }
      if (!stopped) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
  } catch (err) {
    stop()
    throw err instanceof CameraError ? err : new CameraError('unavailable')
  }
  return stop
}
