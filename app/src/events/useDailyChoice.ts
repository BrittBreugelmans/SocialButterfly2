import { useCallback, useEffect, useState } from 'react'
import { todayLocal } from '../data/dates'
import { getSettings } from '../data/repository'
import { needsDailyChoice } from './choice'

export type DailyChoiceStatus = 'loading' | 'choose' | 'ready'

/**
 * Decides whether the owner must choose an Event or casual networking (FR-005, B13).
 * Checks on start and when the app comes back to the foreground; never while it is in use,
 * so the choice does not pop up at midnight during a conversation (research R1).
 */
export function useDailyChoice(): { status: DailyChoiceStatus; recheck(): void } {
  const [status, setStatus] = useState<DailyChoiceStatus>('loading')

  const recheck = useCallback(() => {
    getSettings()
      .then((settings) => setStatus(needsDailyChoice(settings, todayLocal()) ? 'choose' : 'ready'))
      .catch(() => setStatus('choose'))
  }, [])

  useEffect(() => {
    recheck()
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') recheck()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [recheck])

  return { status, recheck }
}
