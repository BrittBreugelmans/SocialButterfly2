import { useEffect, useRef, useState } from 'react'

interface FlutterProps {
  /** Called once when the butterfly is gone (animation end, 1.5 s fallback, or page hidden). */
  onDone(): void
}

/** Longest the butterfly may stay (FR-015); the CSS animation itself takes 1.2 s. */
const MAX_MS = 1500

function prefersReducedMotion() {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * The butterfly after adding a contact (F11, wiki M7). Decorative and never blocks input:
 * pointer-events none, removed after 1.5 s at most. Nothing under iOS "Reduce Motion" (FR-018).
 */
export function Flutter({ onDone }: FlutterProps) {
  const [reduced] = useState(prefersReducedMotion)
  const image = useRef<HTMLImageElement>(null)
  const done = useRef(false)
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone

  function finish() {
    if (done.current) return
    done.current = true
    onDoneRef.current()
  }

  useEffect(() => {
    if (reduced) {
      finish()
      return
    }
    const timer = window.setTimeout(finish, MAX_MS)
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') finish()
    }
    // A native listener: React's onAnimationEnd depends on browser detection.
    const img = image.current
    img?.addEventListener('animationend', finish)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.clearTimeout(timer)
      img?.removeEventListener('animationend', finish)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [reduced])

  if (reduced) return null
  return (
    <div className="flutter" aria-hidden="true">
      <img ref={image} src="/logo.svg" alt="" draggable={false} />
    </div>
  )
}
