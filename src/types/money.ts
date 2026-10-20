export type TransactionType = "credit" | "debit"
export type TransactionStatus = "pending" | "successful" | "failed"

export type Transaction = {
  id: string
  amountKobo: number
  type: TransactionType
  status: TransactionStatus
  description: string
  counterparty: string
  channel: string
  reference: string
  createdAt: string
  /** Present while an optimistic debit awaits server confirmation */
  optimistic?: boolean
  idempotencyKey?: string
}

export type SendMoneyRecipient = {
  accountName: string
  accountNumber: string
  bankCode: string
  bankName: string
}

export type SendMoneyPayload = {
  recipient: SendMoneyRecipient
  amountKobo: number
  narration: string
  idempotencyKey: string
}
