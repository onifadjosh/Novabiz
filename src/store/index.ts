import { configureStore } from "@reduxjs/toolkit"
import {
  useDispatch,
  useSelector,
  type TypedUseSelectorHook,
} from "react-redux"

import userReducer, { loadUserData } from "./userSlice"
import walletReducer, {
  loadTransactions,
  loadWalletFromUserData,
} from "./walletSlice"

export const store = configureStore({
  reducer: {
    user: userReducer,
    wallet: walletReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export const useAppDispatch: () => AppDispatch = useDispatch
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector

/** Bootstrap merchant + wallet + transactions from mock JSON. */
export function bootstrapStore() {
  void store.dispatch(loadUserData())
  void store.dispatch(loadWalletFromUserData())
  void store.dispatch(loadTransactions())
}
