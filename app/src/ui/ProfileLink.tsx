import { useState } from 'react'
import { StorageFullError } from '../data/errors'
import { linkProfileUrl } from '../data/repository'
import type { Person } from '../data/types'
import { useLanguage } from '../i18n/LanguageProvider'
import { normalizeProfileUrl, shortProfileUrl } from '../linkedin/profileUrl'
import { readClipboardText } from '../platform/clipboard'
import { MergeQuestion } from './MergeQuestion'

interface ProfileLinkControlProps {
  /** The Person as it is now. */
  person: Person
  /** Offer "Paste another link" when a link is stored (note step: yes; detail screen: no). */
  allowReplace: boolean
  /** A line to show on arrival, e.g. "Merged with …" after a merge (F4). */
  initialMessage?: string
  onLinked(person: Person): void
  /** The owner chose Merge (B21). The parent merges: the note step also passes its note draft. */
  onMerge(other: Person): Promise<void>
}

/**
 * "Paste LinkedIn link" with F4's rules (F4 FR-001–FR-004), shared by the note step and the
 * Person detail (F7 research R10).
 */
export function ProfileLinkControl({
  person,
  allowReplace,
  initialMessage,
  onLinked,
  onMerge,
}: ProfileLinkControlProps) {
  const { t } = useLanguage()
  const [message, setMessage] = useState(initialMessage ?? '')
  // The Person that already has the pasted link: shown in the merge question (B21).
  const [other, setOther] = useState<Person>()
  const [merging, setMerging] = useState(false)

  /** The clipboard is read first, in the tap handler itself, so iOS shows its "Paste" bubble (F4 R1). */
  function paste() {
    const reading = readClipboardText()
    void (async () => {
      const text = await reading
      if (text === 'dismissed') return // the owner tapped next to the iOS bubble
      if (text === 'unsupported') {
        setMessage(t('link.unsupported'))
        return
      }
      const normalized = normalizeProfileUrl(text)
      if (!normalized.ok) {
        setMessage(t(normalized.reason === 'shortLink' ? 'link.shortLink' : 'link.invalid'))
        return
      }
      try {
        const result = await linkProfileUrl(person.id, normalized.url)
        setMessage('')
        if (result.status === 'conflict') setOther(result.other)
        else onLinked(result.person)
      } catch (err) {
        if (!(err instanceof StorageFullError)) throw err // storage full: the F0 banner shows
      }
    })()
  }

  async function merge(into: Person) {
    setMerging(true)
    try {
      await onMerge(into)
      setOther(undefined)
    } catch (err) {
      if (!(err instanceof StorageFullError)) throw err
    } finally {
      setMerging(false)
    }
  }

  const showButton = !person.profileUrl || allowReplace

  return (
    <>
      {other ? (
        <MergeQuestion
          other={other}
          busy={merging}
          onMerge={() => void merge(other)}
          onCancel={() => setOther(undefined)}
        />
      ) : (
        showButton && (
          <button type="button" className="secondary" onClick={paste}>
            {t(person.profileUrl ? 'link.pasteAgain' : 'link.paste')}
          </button>
        )
      )}
      {person.profileUrl && (
        <p className="link-linked">
          {t('link.linked')} <strong>{shortProfileUrl(person.profileUrl)}</strong>
        </p>
      )}
      <p role="status" className="link-message">
        {message}
      </p>
    </>
  )
}
