interface LogoProps {
  /** Width and height in CSS pixels. */
  size?: number
  className?: string
}

/** The app's logo (F11). Decorative: the screen's heading names the app. */
export function Logo({ size = 96, className }: LogoProps) {
  return (
    <img
      src="/logo.svg"
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      draggable={false}
      className={['logo', className].filter(Boolean).join(' ')}
    />
  )
}
