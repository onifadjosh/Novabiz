/**
 * Format integer kobo as Naira (e.g. 100050 → ₦1,000.50).
 * Uses integer arithmetic + Intl grouping — no floating-point divide.
 */
export function formatKobo(kobo: number): string {
  if (!Number.isInteger(kobo)) {
    throw new Error(`formatKobo expects an integer kobo amount, got ${kobo}`)
  }

  const negative = kobo < 0
  const abs = Math.abs(kobo)
  const wholeNaira = Math.trunc(abs / 100)
  const fractionKobo = abs % 100
  const grouped = new Intl.NumberFormat("en-NG").format(wholeNaira)

  return `${negative ? "-" : ""}₦${grouped}.${fractionKobo.toString().padStart(2, "0")}`
}

/**
 * Parse a user-entered Naira string (e.g. "1000.50", "1,000.50") into kobo.
 * Rejects invalid input; final conversion is integer-only.
 */
export function parseNairaToKobo(input: string): number | null {
  const cleaned = input.replace(/,/g, "").trim()
  if (!cleaned) return null
  if (!/^\d+(\.\d{0,2})?$/.test(cleaned)) return null

  const [nairaPart, koboPart = ""] = cleaned.split(".")
  const naira = Number.parseInt(nairaPart || "0", 10)
  if (!Number.isFinite(naira)) return null
  const kobo = Number.parseInt((koboPart + "00").slice(0, 2), 10)
  return naira * 100 + kobo
}

export function createIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  return `idem_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
}
