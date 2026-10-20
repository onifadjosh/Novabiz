import { createSelector } from "@reduxjs/toolkit"

import { merchantInitials } from "@/types/user"
import type { RootState } from "./index"

export const selectMerchant = (state: RootState) => state.user.merchant
export const selectTerminals = (state: RootState) => state.user.terminals
export const selectUserStatus = (state: RootState) => state.user.status
export const selectUserError = (state: RootState) => state.user.error

export const selectAvailableBalanceKobo = (state: RootState) =>
  state.wallet.availableBalanceKobo
export const selectTodayInflowKobo = (state: RootState) =>
  state.wallet.todayInflowKobo
export const selectTodayOutflowKobo = (state: RootState) =>
  state.wallet.todayOutflowKobo
export const selectTodayDate = (state: RootState) => state.wallet.todayDate
export const selectTransactions = (state: RootState) =>
  state.wallet.transactions
export const selectWalletHydrated = (state: RootState) => state.wallet.hydrated
export const selectTransactionsStatus = (state: RootState) =>
  state.wallet.transactionsStatus

export const selectMerchantDisplay = createSelector(
  [selectMerchant],
  (merchant) => {
    if (!merchant) return null
    const verified =
      merchant.verificationStatus === "verified" ? "Verified" : "Unverified"
    return {
      businessName: merchant.businessName,
      branch: merchant.branch,
      verifiedLabel: verified,
      subtitle: `${merchant.branch} · ${verified}`,
      initials: merchantInitials(merchant.businessName),
      email: merchant.email,
      phone: merchant.phone,
    }
  },
)

export const selectTerminalStatusLabel = createSelector(
  [selectTerminals],
  (terminals) => {
    if (!terminals) return null
    return {
      activeCount: terminals.activeCount,
      syncPercent: terminals.syncPercent,
      label: `${terminals.activeCount} POS Terminals Active`,
      syncLabel: `${terminals.syncPercent}% SYNC`,
    }
  },
)
