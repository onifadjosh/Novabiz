import { configureStore } from "@reduxjs/toolkit"
import { render, type RenderOptions } from "@testing-library/react"
import type { ReactElement, ReactNode } from "react"
import { Provider } from "react-redux"
import { MemoryRouter } from "react-router-dom"

import userReducer from "@/store/userSlice"
import walletReducer, { type WalletState } from "@/store/walletSlice"

type Options = Omit<RenderOptions, "wrapper"> & {
  route?: string
  wallet?: Partial<WalletState>
}

export function renderWithProviders(
  ui: ReactElement,
  { route = "/payouts", wallet, ...options }: Options = {},
) {
  const store = configureStore({
    reducer: {
      user: userReducer,
      wallet: walletReducer,
    },
    preloadedState: {
      user: {
        merchant: {
          id: "mrc_test",
          businessName: "HIMER Stores",
          tradingName: "HIMER Stores",
          branch: "Osogbo Flagship",
          kycTier: 2,
          verificationStatus: "verified",
          bvnLast4: "4821",
          ninLast4: "7390",
          email: "ops@himerstores.ng",
          phone: "+2348012345678",
          address: "Osogbo",
          currency: "NGN",
          createdAt: "2024-03-12T09:15:00.000Z",
        },
        terminals: {
          activeCount: 4,
          totalCount: 4,
          syncPercent: 100,
          items: [],
        },
        preferences: {
          locale: "en-NG",
          timezone: "Africa/Lagos",
          theme: "system",
        },
        status: "succeeded" as const,
        error: null,
      },
      wallet: {
        walletId: "wlt_test",
        availableBalanceKobo: 5_000_000,
        ledgerBalanceKobo: 5_000_000,
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
        ...wallet,
      },
    },
  })

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <Provider store={store}>
        <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
      </Provider>
    )
  }

  return {
    store,
    ...render(ui, { wrapper: Wrapper, ...options }),
  }
}
