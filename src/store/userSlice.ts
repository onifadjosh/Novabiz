import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"

import type {
  Merchant,
  TerminalsSnapshot,
  UserPreferences,
} from "@/types/user"

export type UserState = {
  merchant: Merchant | null
  terminals: TerminalsSnapshot | null
  preferences: UserPreferences | null
  status: "idle" | "loading" | "succeeded" | "failed"
  error: string | null
}

const initialState: UserState = {
  merchant: null,
  terminals: null,
  preferences: null,
  status: "idle",
  error: null,
}

export const loadUserData = createAsyncThunk(
  "user/loadUserData",
  async () => {
    // Simulated fetch — later swapped for a real/MSW endpoint.
    const data = (await import("@/data/user_data.json")).default
    await new Promise((r) => setTimeout(r, 200))
    return data
  },
)

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadUserData.pending, (state) => {
        state.status = "loading"
        state.error = null
      })
      .addCase(loadUserData.fulfilled, (state, action) => {
        state.status = "succeeded"
        state.merchant = action.payload.merchant
        state.terminals = action.payload.terminals
        state.preferences = action.payload.preferences
      })
      .addCase(loadUserData.rejected, (state, action) => {
        state.status = "failed"
        state.error = action.error.message ?? "Failed to load user data"
      })
  },
})

export default userSlice.reducer
