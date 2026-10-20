export type Merchant = {
  id: string
  businessName: string
  tradingName: string
  branch: string
  kycTier: number
  verificationStatus: "verified" | "pending" | "unverified" | string
  bvnLast4: string
  ninLast4: string
  email: string
  phone: string
  address: string
  currency: string
  createdAt: string
}

export type WalletSnapshot = {
  id: string
  currency: string
  availableBalanceKobo: number
  ledgerBalanceKobo: number
  pendingCreditKobo: number
  pendingDebitKobo: number
  openingBalanceKobo: number
  asOf: string
}

export type TodaySnapshot = {
  date: string
  inflowKobo: number
  outflowKobo: number
  netKobo: number
  successfulCreditCount: number
  successfulDebitCount: number
}

export type Terminal = {
  id: string
  label: string
  status: "active" | "inactive" | string
  lastSeenAt: string
}

export type TerminalsSnapshot = {
  activeCount: number
  totalCount: number
  syncPercent: number
  items: Terminal[]
}

export type UserPreferences = {
  locale: string
  timezone: string
  theme: string
}

export type UserData = {
  merchant: Merchant
  wallet: WalletSnapshot
  today: TodaySnapshot
  terminals: TerminalsSnapshot
  preferences: UserPreferences
}

/** Initials from a business name, e.g. "HIMER Stores" → "HS". */
export function merchantInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase()
}
