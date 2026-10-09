import { parseLocalDate } from '../data/dates'
import type { Language } from '../data/types'

/** "6–8 okt. 2026" / "6–8 Oct 2026", or a single date when start and end are equal (research R8). */
export function formatDateRange(startDate: string, endDate: string, language: Language): string {
  const formatter = new Intl.DateTimeFormat(language === 'nl' ? 'nl-BE' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  const start = parseLocalDate(startDate)
  if (startDate === endDate) return formatter.format(start)
  return formatter.formatRange(start, parseLocalDate(endDate))
}
