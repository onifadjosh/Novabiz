import type { TransactionStatus, TransactionType } from "@/types/money"

export function formatTxDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export function formatTxTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-NG", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function channelLabel(channel: string): string {
  const map: Record<string, string> = {
    pos: "POS",
    qr: "QR",
    nip: "NIP",
    ussd: "USSD",
    wallet: "Wallet",
    transfer: "Transfer",
  }
  return map[channel] ?? channel.toUpperCase()
}

export function statusLabel(status: TransactionStatus, optimistic?: boolean): string {
  if (optimistic) return "Sending"
  if (status === "successful") return "Successful"
  if (status === "pending") return "Pending"
  return "Failed"
}

export function typeLabel(type: TransactionType): string {
  return type === "credit" ? "Credit" : "Debit"
}

export function signedAmountPrefix(type: TransactionType): string {
  return type === "credit" ? "+" : "−"
}

/** Escape-safe display: we never dangerouslySetInnerHTML; truncate long text. */
export function displayText(value: string, max = 48): string {
  const trimmed = value.trim()
  if (trimmed.length <= max) return trimmed
  return `${trimmed.slice(0, max - 1)}…`
}
