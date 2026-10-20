# AI Usage

This document records how AI was used while building the NovaBiz Merchant Dashboard, per the take-home requirements. The goal is to show directed use of AI plus judgment when output was wrong or risky for a fintech money UI.

## Tools used

| Tool | What it was used for |
| --- | --- |
| **Cursor (Composer / Agent)** | Pair-programming the app: architecture decisions, React + TypeScript implementation, mock transfer API, formatting helpers, Redux store, UI, tests, and this deliverable docs set. |
| **[Stitch](https://stitch.withgoogle.com/projects/5486592442865303577)** (Google) | Generating the merchant dashboard UI design (sidebar, overview chrome, visual hierarchy) used as the implementation reference. Project: [NovaBiz dashboard design](https://stitch.withgoogle.com/projects/5486592442865303577). |

Cursor was the primary coding environment. Stitch was used specifically for UI/design insight — not for business logic, money math, or the mock API.

## Concrete prompts and outcomes

### 1. Scaffolding Send Money with optimistic UI + Idempotency-Key

**Prompt (paraphrased):** Implement Send Money (recipient → amount → review → confirm) with optimistic UI, Idempotency-Key, and rollback on failure.

**What came back:** A multi-step flow, Redux `sendMoney` thunk with pending/fulfilled/rejected handlers, a mock transfer API that caches by Idempotency-Key, and a confirm step that displayed the raw key in the UI for “transparency.”

**Judgment:** The transport/header behavior was correct; exposing the key in clear text on a merchant screen was not.

### 2. Merchant dashboard UI from Stitch

**Prompt (paraphrased):** Match the Stitch NovaBiz dashboard design for the sidebar and overview chrome.

**What came back:** Layout structure (brand, account switcher, nav, terminal status) that we adapted onto shadcn `Sidebar` primitives and Redux-backed merchant data.

### 3. Wiring merchant data through Redux

**Prompt (paraphrased):** Load user/merchant data with Redux and supply it wherever the UI needs it (sidebar, overview balances, Send Money).

**What came back:** Separate `user` and `wallet` slices, bootstrap thunks from `user_data.json` / `transactions.json`, and selectors so the shell and dashboard read from the store instead of hard-coded copy.

**Judgment:** Kept profile/terminals in `user` and mutable money state in `wallet`, so Send Money optimistic updates don’t fight the merchant profile load.

## Where AI was wrong or risky (and how it was fixed)

### Case: Idempotency-Key rendered in plain text on Confirm

**What AI produced:** A confirm step that printed the full Idempotency-Key in a visible code block, framed as a way to “prove” retries reuse the same key.

**Why that was wrong:**

- The brief requires the key on the *request*, not as merchant-facing UI copy.
- It’s an internal correlation token — not something that should appear in screenshots, demos, or screen shares.
- Clear-text keys on a production-style dashboard set a bad security habit.

**How it was caught:** Reviewing the Confirm step before submit — the raw UUID was readable above “Confirm & send.”

**How it was fixed:** Left key generation and attach-on-submit/retry as-is in Redux and the mock API. Replaced the clear-text readout with “Idempotency-Key attached” plus a blurred, non-selectable placeholder (`blur`, `select-none`, `aria-hidden`). “Retry same key” still reuses the in-memory value; “Send another” mints a new one.
