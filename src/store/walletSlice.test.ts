import { configureStore } from "@reduxjs/toolkit"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { SendMoneyPayload } from "@/types/money"

const postTransfer = vi.fn()

vi.mock("@/api/transfers", () => ({
  postTransfer: (...args: unknown[]) => postTransfer(...args),
  TransferApiError: class TransferApiError extends Error {
    code: "NETWORK" | "INSUFFICIENT_FUNDS" | "DUPLICATE" | "REJECTED"
    constructor(
      code: "NETWORK" | "INSUFFICIENT_FUNDS" | "DUPLICATE" | "REJECTED",
      message: string,
    ) {
      super(message)
      this.name = "TransferApiError"
      this.code = code
    }
  },
}))

import { TransferApiError } from "@/api/transfers"
import walletReducer, { clearSendStatus, sendMoney } from "./walletSlice"

function makeStore(balanceKobo = 500_000) {
  return configureStore({
    reducer: { wallet: walletReducer },
    preloadedState: {
      wallet: {
        walletId: "wlt_test",
        availableBalanceKobo: balanceKobo,
        ledgerBalanceKobo: balanceKobo,
        pendingCreditKobo: 0,
        pendingDebitKobo: 0,
        todayInflowKobo: 0,
        todayOutflowKobo: 0,
        todayDate: "2026-10-20",
        transactions: [],
        transactionsStatus: "succeeded" as const,
        sendStatus: "idle" as const,
        sendError: null,
        lastOptimisticId: null,
        hydrated: true,
      },
    },
  })
}

const payload: SendMoneyPayload = {
  recipient: {
    accountName: "Chinedu Okoro",
    accountNumber: "0123456789",
    bankCode: "011",
    bankName: "First Bank of Nigeria",
  },
  amountKobo: 10_000,
  narration: "Test transfer",
  idempotencyKey: "idem-test-key-001",
}

describe("sendMoney optimistic update + rollback", () => {
  beforeEach(() => {
    postTransfer.mockReset()
  })

  it("optimistically debits balance and prepends a pending tx", async () => {
    postTransfer.mockResolvedValue({
      transaction: {
        id: "txn_live_ok",
        amountKobo: payload.amountKobo,
        type: "debit",
        status: "successful",
        description: "Send money — Chinedu Okoro",
        counterparty: "Chinedu Okoro",
        channel: "transfer",
        reference: "NBZOK",
        createdAt: "2026-10-20T10:00:00.000Z",
        idempotencyKey: payload.idempotencyKey,
      },
    })

    const store = makeStore()
    const pending = store.dispatch(sendMoney(payload))

    expect(store.getState().wallet.availableBalanceKobo).toBe(490_000)
    expect(store.getState().wallet.todayOutflowKobo).toBe(10_000)
    expect(store.getState().wallet.transactions[0]?.optimistic).toBe(true)
    expect(store.getState().wallet.sendStatus).toBe("submitting")

    await pending
    expect(store.getState().wallet.sendStatus).toBe("succeeded")
    expect(store.getState().wallet.transactions[0]?.status).toBe("successful")
    expect(store.getState().wallet.transactions[0]?.optimistic).toBe(false)
  })

  it("rolls balance back and marks the optimistic tx failed on network error", async () => {
    postTransfer.mockRejectedValue(
      new TransferApiError(
        "NETWORK",
        "Transfer timed out on the NIP rail. Your balance has been restored.",
      ),
    )

    const store = makeStore()
    await store.dispatch(sendMoney(payload))

    const state = store.getState().wallet
    expect(state.availableBalanceKobo).toBe(500_000)
    expect(state.todayOutflowKobo).toBe(0)
    expect(state.sendStatus).toBe("failed")
    expect(state.transactions[0]?.status).toBe("failed")
    expect(state.transactions[0]?.optimistic).toBe(false)
    expect(state.sendError).toMatch(/timed out/i)
  })

  it("clearSendStatus resets UI send flags", () => {
    const store = makeStore()
    store.dispatch(clearSendStatus())
    expect(store.getState().wallet.sendStatus).toBe("idle")
    expect(store.getState().wallet.sendError).toBeNull()
  })
})
