import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import {
  ArrowDownLeft,
  ArrowUpRight,
  Send,
  Wallet,
} from "lucide-react"

import PaginationControls from "@/components/PaginationControls"
import TransactionsTable from "@/components/TransactionsTable"
import { Button } from "@/components/ui/button"
import { usePagination } from "@/hooks/usePagination"
import { formatKobo } from "@/lib/money"
import { useAppSelector } from "@/store"
import {
  selectAvailableBalanceKobo,
  selectMerchantDisplay,
  selectTodayDate,
  selectTodayInflowKobo,
  selectTodayOutflowKobo,
  selectTransactions,
  selectTransactionsStatus,
  selectWalletHydrated,
} from "@/store/selectors"
import { cn } from "@/lib/utils"

const PAGE_SIZE = 10

export default function Overview() {
  const merchant = useAppSelector(selectMerchantDisplay)
  const hydrated = useAppSelector(selectWalletHydrated)
  const balanceKobo = useAppSelector(selectAvailableBalanceKobo)
  const inflowKobo = useAppSelector(selectTodayInflowKobo)
  const outflowKobo = useAppSelector(selectTodayOutflowKobo)
  const todayDate = useAppSelector(selectTodayDate)
  const transactions = useAppSelector(selectTransactions)
  const txStatus = useAppSelector(selectTransactionsStatus)

  const pagination = usePagination(transactions, PAGE_SIZE)
  const netKobo = inflowKobo - outflowKobo

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Dashboard
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
          <p className="text-sm text-muted-foreground">
            {merchant
              ? `${merchant.businessName} · ${merchant.branch}`
              : "Loading merchant…"}
          </p>
        </div>
        <Button
          render={<Link to="/payouts" />}
          className="h-10 gap-2 bg-[#0b1f3a] hover:bg-[#0b1f3a]/80"
        >
          <Send className="size-4" />
          Send Money
        </Button>
      </header>

      <section
        aria-label="Balance summary"
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        <SummaryCard
          label="Available balance"
          value={hydrated ? formatKobo(balanceKobo) : "—"}
          loading={!hydrated}
          icon={<Wallet className="size-4" />}
          emphasize
        />
        <SummaryCard
          label="Today's inflow"
          hint={todayDate ?? undefined}
          value={hydrated ? formatKobo(inflowKobo) : "—"}
          loading={!hydrated}
          icon={<ArrowDownLeft className="size-4" />}
          tone="credit"
        />
        <SummaryCard
          label="Today's outflow"
          hint={todayDate ?? undefined}
          value={hydrated ? formatKobo(outflowKobo) : "—"}
          loading={!hydrated}
          icon={<ArrowUpRight className="size-4" />}
          tone="debit"
        />
        <SummaryCard
          label="Today's net"
          hint={todayDate ?? undefined}
          value={
            hydrated
              ? `${netKobo >= 0 ? "+" : "−"}${formatKobo(Math.abs(netKobo))}`
              : "—"
          }
          loading={!hydrated}
          tone={netKobo >= 0 ? "credit" : "debit"}
        />
      </section>

      <section aria-label="Recent transactions" className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold tracking-tight">
              Recent transactions
            </h2>
            <p className="text-xs text-muted-foreground">
              Newest first · {PAGE_SIZE} per page
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            render={<Link to="/activity" />}
            className="h-8"
          >
            View all activity
          </Button>
        </div>

        <TransactionsTable
          transactions={pagination.pageItems}
          status={txStatus}
          emptyMessage="No transactions yet. Collections and payouts will show up here."
        />

        {txStatus === "succeeded" && (
          <PaginationControls
            page={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            rangeStart={pagination.rangeStart}
            rangeEnd={pagination.rangeEnd}
            hasPrev={pagination.hasPrev}
            hasNext={pagination.hasNext}
            onPrev={pagination.prev}
            onNext={pagination.next}
            onGoTo={pagination.goTo}
          />
        )}
      </section>
    </div>
  )
}

function SummaryCard({
  label,
  hint,
  value,
  loading,
  emphasize,
  tone,
  icon,
}: {
  label: string
  hint?: string
  value: string
  loading?: boolean
  emphasize?: boolean
  tone?: "credit" | "debit"
  icon?: ReactNode
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-4",
        emphasize &&
          "border-[#0b1f3a]/15 bg-[#0b1f3a]/[0.03] sm:col-span-2 xl:col-span-1",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          {hint && (
            <p className="text-[11px] text-muted-foreground/80">{hint}</p>
          )}
        </div>
        {icon && (
          <div
            aria-hidden
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-lg",
              tone === "credit" && "bg-emerald-50 text-emerald-700",
              tone === "debit" && "bg-slate-100 text-slate-600",
              !tone && "bg-[#0b1f3a]/10 text-[#0b1f3a]",
            )}
          >
            {icon}
          </div>
        )}
      </div>
      <p
        className={cn(
          "mt-3 tabular-nums tracking-tight",
          emphasize
            ? "text-2xl font-semibold sm:text-[1.75rem]"
            : "text-xl font-semibold",
          tone === "credit" && "text-emerald-700",
          tone === "debit" && !emphasize && "text-foreground",
          loading && "animate-pulse text-muted-foreground",
        )}
      >
        {value}
      </p>
    </div>
  )
}
