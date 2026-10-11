import { useEffect, useState } from 'react'
import { listDismissals, listEncounters, listPersons, onDataChanged } from '../data/repository'
import { countOpenActions } from './actions'

/**
 * The number of open Actions for the badge (F8 FR-012). Recounted after every write anywhere in
 * the app (research R4); several writes in a row lead to one recount. Undefined until loaded.
 */
export function useOpenActionCount(): number | undefined {
  const [count, setCount] = useState<number>()

  useEffect(() => {
    let active = true
    let pending = false

    async function load() {
      const [persons, encounters, dismissals] = await Promise.all([listPersons(), listEncounters(), listDismissals()])
      if (active) setCount(countOpenActions(persons, encounters, dismissals))
    }

    function schedule() {
      if (pending) return
      pending = true
      queueMicrotask(() => {
        pending = false
        void load()
      })
    }

    void load()
    const unsubscribe = onDataChanged(schedule)
    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  return count
}
