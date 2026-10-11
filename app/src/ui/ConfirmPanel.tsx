import { useEffect, useId, useRef } from 'react'
import { useLanguage } from '../i18n/LanguageProvider'

interface ConfirmPanelProps {
  text: string
  /** Extra line under the text, e.g. that the note goes too. */
  detail?: string
  confirmLabel: string
  /** True while deleting, so a second tap does nothing. */
  busy: boolean
  onConfirm(): void
  onCancel(): void
}

/** An in-page confirmation before anything is deleted (FR-014, FR-014a, research R9). */
export function ConfirmPanel({ text, detail, confirmLabel, busy, onConfirm, onCancel }: ConfirmPanelProps) {
  const { t } = useLanguage()
  const id = useId()
  const panel = useRef<HTMLDivElement>(null)

  // Move focus to the question, so it is read out and in view.
  useEffect(() => {
    panel.current?.focus()
  }, [])

  return (
    <div ref={panel} className="confirm-panel" role="alertdialog" aria-labelledby={id} tabIndex={-1}>
      <p id={id}>{text}</p>
      {detail && <p className="confirm-detail">{detail}</p>}
      <button type="button" className="danger" disabled={busy} onClick={onConfirm}>
        {confirmLabel}
      </button>
      <button type="button" className="secondary" disabled={busy} onClick={onCancel}>
        {t('link.cancel')}
      </button>
    </div>
  )
}
