/**
 * The form of a name used to spot "the same person" (FR-006, research R3): trimmed, repeated
 * spaces collapsed, lowercase. Accents and typos are not matched (constitution X).
 */
export function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toLocaleLowerCase()
}
