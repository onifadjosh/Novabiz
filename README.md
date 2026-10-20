# NovaBiz Merchant Dashboard

React + TypeScript merchant dashboard for the fictional **FirstBank NovaBiz** module: wallet balance, transaction activity, and Send Money with optimistic updates.

## Quick start

```bash
npm install && npm run dev
```

App: [http://localhost:5173](http://localhost:5173)

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | Typecheck + production build |
| `npm run test` | Vitest unit/component tests (RTL) |
| `npm run test:e2e` | Playwright Send Money flow |
| `npm run test:all` | Unit + e2e |
| `npm run lint` | ESLint |

First-time Playwright browsers (if needed):

```bash
npx playwright install chromium
```

## Architecture

### State management — **Redux Toolkit**

- **`user` slice** — merchant profile, terminals, preferences (loaded from `src/data/user_data.json`).
- **`wallet` slice** — available/ledger balances, today’s inflow/outflow, transaction list, Send Money status.
- Typed hooks: `useAppDispatch` / `useAppSelector` plus selectors in `src/store/selectors.ts`.

**Why Redux (not Context-only):** Send Money needs a single source of truth for balance + feed so optimistic debits and rollbacks stay consistent across Overview, Activity, and the payout form. RTK slices keep that explicit and testable.

### Data fetching

- Bootstrap on startup via `bootstrapStore()` (`loadUserData`, `loadWalletFromUserData`, `loadTransactions`).
- JSON fixtures stand in for a backend today; `createAsyncThunk` keeps the same shape we’d use with HTTP later.
- Transfers go through `src/api/transfers.ts` (mock latency + configurable failure rate + Idempotency-Key cache).

**Why not RTK Query yet:** The mock surface is small (hydrate once + one mutation). Plain thunks keep the optimistic/rollback path obvious for the take-home. RTK Query remains a natural next step if the API grows.

### Money

- All amounts are **integer kobo**.
- Display via `formatKobo` (`Intl.NumberFormat` grouping + integer fraction) — no `kobo / 100` float paths.
- User input parsed with `parseNairaToKobo`.

### Send Money

Steps: **recipient → amount → review → confirm**.

1. On confirm, Redux **optimistically** debits the wallet and prepends a pending debit.
2. Request includes a generated **Idempotency-Key** (reused on “Retry same key”).
3. On success, the optimistic row is reconciled to `successful`.
4. On failure/timeout, **balance and today’s outflow roll back**; the row becomes `failed`.
5. The Idempotency-Key is **not shown in clear text** in the UI (blurred / explained only).

Simulate failures in DevTools:

```js
localStorage.setItem("novabiz.mockFailureRate", "0.8") // then reload
```

### UI

- Vite + React 19 + React Router
- Tailwind CSS v4 + shadcn/ui (`base-nova` / Base UI)
- Stitch used as the visual reference for the shell

## Trade-offs

| Choice | Upside | Cost |
| --- | --- | --- |
| Redux Toolkit thunks | Clear optimistic/rollback; easy to unit test | More boilerplate than local component state |
| Client-side pagination + date/type/status filters | Matches brief feed requirements without a backend | Not true server pagination; virtualization still a stretch goal |
| In-module mock API (not MSW yet) | Fast to ship Send Money + failure rate | Prefer MSW when more HTTP endpoints appear |
| Blurred Idempotency-Key | Matches “send with request” without leaking internals | Reviewers must read code/tests to inspect the key |

## Project map

```
src/
  api/           mock transfer + failure config
  data/          user_data.json, transactions.json, banks
  Pages/         Overview, Activity, SendMoney, Layout
  store/         user + wallet slices, selectors
  lib/money.ts   kobo ↔ Naira helpers
e2e/             Playwright Send Money flows
```

## Assumptions (documented for the brief)

- “Today” totals and seed balances come from `user_data.json` (aligned with the mock ledger).
- Inward Collections and `/activity` share the full activity screen (filter by type/status there).
- Terminals / Settlements / Settings remain placeholders by design (scope judgment).

## Testing notes

- **Unit:** `formatKobo` / `parseNairaToKobo` catch float-drift regressions.
- **Slice:** `sendMoney` pending/fulfilled/rejected covers optimistic debit + rollback.
- **RTL:** Send Money validation + happy path + failure alert.
- **E2E:** Full confirm success; failure path with `mockFailureRate = 1`.
