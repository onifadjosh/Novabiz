import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit"

import { postTransfer, TransferApiError } from "@/api/transfers"
import type { SendMoneyPayload, Transaction } from "@/types/money"
import type { TodaySnapshot, WalletSnapshot } from "@/types/user"

export type WalletState = {
  walletId: string | null
  availableBalanceKobo: number
  ledgerBalanceKobo: number
  pendingCreditKobo: number
  pendingDebitKobo: number
  todayInflowKobo: number
  todayOutflowKobo: number
  todayDate: string | null
  transactions: Transaction[]
  transactionsStatus: "idle" | "loading" | "succeeded" | "failed"
  sendStatus: "idle" | "submitting" | "succeeded" | "failed"
  sendError: string | null
  lastOptimisticId: string | null
  hydrated: boolean
}

const initialState: WalletState = {
  walletId: null,
  availableBalanceKobo: 0,
  ledgerBalanceKobo: 0,
  pendingCreditKobo: 0,
  pendingDebitKobo: 0,
  todayInflowKobo: 0,
  todayOutflowKobo: 0,
  todayDate: null,
  transactions: [],
  transactionsStatus: "idle",
  sendStatus: "idle",
  sendError: null,
  lastOptimisticId: null,
  hydrated: false,
}

function buildOptimisticTx(payload: SendMoneyPayload): Transaction {
  return {
    id: `optimistic_${payload.idempotencyKey}`,
    amountKobo: payload.amountKobo,
    type: "debit",
    status: "pending",
    description: `Send money — ${payload.recipient.accountName}`,
    counterparty: payload.recipient.accountName,
    channel: "transfer",
    reference: `PENDING-${payload.idempotencyKey.slice(0, 8).toUpperCase()}`,
    createdAt: new Date().toISOString(),
    optimistic: true,
    idempotencyKey: payload.idempotencyKey,
  }
}

export const loadWalletFromUserData = createAsyncThunk(
  "wallet/loadWalletFromUserData",
  async () => {
    const data = (await import("@/data/user_data.json")).default
    await new Promise((r) => setTimeout(r, 200))
    return {
      wallet: data.wallet as WalletSnapshot,
      today: data.today as TodaySnapshot,
    }
  },
)

export const loadTransactions = createAsyncThunk(
  "wallet/loadTransactions",
  async () => {
    const data = (await import("@/data/transactions.json")).default
    await new Promise((r) => setTimeout(r, 250))
    return data as Transaction[]
  },
)

export const sendMoney = createAsyncThunk<
  Transaction,
  SendMoneyPayload,
  { state: { wallet: WalletState }; rejectValue: string }
>(
  "wallet/sendMoney",
  async (payload, { rejectWithValue }) => {
    try {
      const { transaction } = await postTransfer(payload)
      return transaction
    } catch (err) {
      if (err instanceof TransferApiError) {
        return rejectWithValue(err.message)
      }
      return rejectWithValue("Something went wrong sending money.")
    }
  },
  {
    condition: (_, { getState }) =>
      getState().wallet.sendStatus !== "submitting",
  },
)

const walletSlice = createSlice({
  name: "wallet",
  initialState,
  reducers: {
    clearSendStatus(state) {
      state.sendStatus = "idle"
      state.sendError = null
      state.lastOptimisticId = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadWalletFromUserData.fulfilled, (state, action) => {
        const { wallet, today } = action.payload
        state.walletId = wallet.id
        state.availableBalanceKobo = wallet.availableBalanceKobo
        state.ledgerBalanceKobo = wallet.ledgerBalanceKobo
        state.pendingCreditKobo = wallet.pendingCreditKobo
        state.pendingDebitKobo = wallet.pendingDebitKobo
        state.todayInflowKobo = today.inflowKobo
        state.todayOutflowKobo = today.outflowKobo
        state.todayDate = today.date
        state.hydrated = true
      })
      .addCase(loadTransactions.pending, (state) => {
        state.transactionsStatus = "loading"
      })
      .addCase(loadTransactions.fulfilled, (state, action: PayloadAction<Transaction[]>) => {
        // Preserve any optimistic rows already at the front.
        const optimistic = state.transactions.filter((t) => t.optimistic)
        const incomingIds = new Set(action.payload.map((t) => t.id))
        const keptOptimistic = optimistic.filter((t) => !incomingIds.has(t.id))
        state.transactions = [...keptOptimistic, ...action.payload]
        state.transactionsStatus = "succeeded"
      })
      .addCase(loadTransactions.rejected, (state) => {
        state.transactionsStatus = "failed"
      })
      .addCase(sendMoney.pending, (state, action) => {
        const payload = action.meta.arg
        const optimistic = buildOptimisticTx(payload)

        state.availableBalanceKobo -= payload.amountKobo
        state.todayOutflowKobo += payload.amountKobo
        state.transactions = [optimistic, ...state.transactions]
        state.sendStatus = "submitting"
        state.sendError = null
        state.lastOptimisticId = optimistic.id
      })
      .addCase(sendMoney.fulfilled, (state, action) => {
        const confirmed = action.payload
        const key = confirmed.idempotencyKey
        state.transactions = state.transactions.map((tx) =>
          tx.idempotencyKey === key || tx.id === state.lastOptimisticId
            ? { ...confirmed, optimistic: false }
            : tx,
        )
        state.sendStatus = "succeeded"
        state.lastOptimisticId = null
      })
      .addCase(sendMoney.rejected, (state, action) => {
        const payload = action.meta.arg
        const optimisticId = `optimistic_${payload.idempotencyKey}`

        state.availableBalanceKobo += payload.amountKobo
        state.todayOutflowKobo = Math.max(
          0,
          state.todayOutflowKobo - payload.amountKobo,
        )

        state.transactions = state.transactions.map((tx) =>
          tx.id === optimisticId
            ? {
                ...tx,
                status: "failed" as const,
                optimistic: false,
                reference: tx.reference.replace("PENDING-", "FAILED-"),
              }
            : tx,
        )

        state.sendStatus = "failed"
        state.sendError =
          action.payload ?? action.error.message ?? "Transfer failed"
        state.lastOptimisticId = null
      })
  },
})

export const { clearSendStatus } = walletSlice.actions
export default walletSlice.reducer
