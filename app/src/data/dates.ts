// Local dates as YYYY-MM-DD (research R2 in specs/002-events).
// Never use new Date().toISOString() for "today": that is UTC, which is still "yesterday"
// just after midnight in Belgium.

function format(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

/** Today's date in the phone's local time, as YYYY-MM-DD. */
export function todayLocal(): string {
  return format(new Date())
}

/** Adds days to a YYYY-MM-DD date. Uses calendar days, so daylight saving cannot shift the day. */
export function addDaysLocal(date: string, days: number): string {
  const [year, month, day] = date.split('-').map(Number) as [number, number, number]
  return format(new Date(year, month - 1, day + days))
}

/** Turns a YYYY-MM-DD date into a Date at local midnight. */
export function parseLocalDate(date: string): Date {
  const [year, month, day] = date.split('-').map(Number) as [number, number, number]
  return new Date(year, month - 1, day)
}
