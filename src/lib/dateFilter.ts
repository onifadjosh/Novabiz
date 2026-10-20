/** Calendar day key (YYYY-MM-DD) from an ISO timestamp. */
export function toDateKey(isoOrDate: string): string {
  return isoOrDate.slice(0, 10)
}

/**
 * Inclusive date-range check against a transaction `createdAt` ISO string.
 * Empty `from` / `to` means unbounded on that side.
 */
export function isWithinDateRange(
  createdAt: string,
  from: string,
  to: string,
): boolean {
  const day = toDateKey(createdAt)
  if (from && day < from) return false
  if (to && day > to) return false
  return true
}

export function isValidDateRange(from: string, to: string): boolean {
  if (!from || !to) return true
  return from <= to
}
