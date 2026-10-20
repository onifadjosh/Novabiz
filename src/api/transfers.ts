import type { SendMoneyPayload, Transaction } from "@/types/money"
import { getMockFailureRate, mockDelay } from "./mockConfig"

export class TransferApiError extends Error {
  readonly code: "NETWORK" | "INSUFFICIENT_FUNDS" | "DUPLICATE" | "REJECTED"

  constructor(
    code: TransferApiError["code"],
    message: string,
  ) {
    super(message)
    this.name = "TransferApiError"
    this.code = code
  }
}

/** In-memory idempotency store for the mock API (survives retries in-session). */
const idempotencyCache = new Map<string, Transaction>()

export type TransferSuccess = {
  transaction: Transaction
}

/**
 * Mock POST /api/transfers.
 * Honours Idempotency-Key: retries with the same key return the same result
 * without double-debiting.
 */
export async function postTransfer(
  payload: SendMoneyPayload,
): Promise<TransferSuccess> {
  await mockDelay()

  const cached = idempotencyCache.get(payload.idempotencyKey)
  if (cached) {
    return { transaction: cached }
  }

  if (Math.random() < getMockFailureRate()) {
    throw new TransferApiError(
      "NETWORK",
      "Transfer timed out on the NIP rail. Your balance has been restored.",
    )
  }

  if (payload.amountKobo <= 0) {
    throw new TransferApiError("REJECTED", "Amount must be greater than zero.")
  }

  const now = new Date().toISOString()
  const reference = `NBZ${now.slice(2, 10).replace(/-/g, "")}${Math.floor(Math.random() * 90 + 10)}`

  const transaction: Transaction = {
    id: `txn_live_${payload.idempotencyKey.slice(0, 8)}`,
    amountKobo: payload.amountKobo,
    type: "debit",
    status: "successful",
    description: `Send money — ${payload.recipient.accountName}`,
    counterparty: payload.recipient.accountName,
    channel: "transfer",
    reference,
    createdAt: now,
    idempotencyKey: payload.idempotencyKey,
  }

  idempotencyCache.set(payload.idempotencyKey, transaction)
  return { transaction }
}
