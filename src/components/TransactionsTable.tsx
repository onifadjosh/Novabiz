import { ArrowDownLeft, ArrowUpRight } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { formatKobo } from "@/lib/money"
import {
  channelLabel,
  displayText,
  formatTxDate,
  formatTxTime,
  signedAmountPrefix,
  statusLabel,
  typeLabel,
} from "@/lib/transactionDisplay"
import type { Transaction } from "@/types/money"
import { cn } from "@/lib/utils"

type Props = {
  transactions: Transaction[]
  status: "idle" | "loading" | "succeeded" | "failed"
  emptyMessage?: string
}

export default function TransactionsTable({
  transactions,
  status,
  emptyMessage = "No transactions yet.",
}: Props) {
  if (status === "loading" || status === "idle") {
    return <TableSkeleton />
  }

  if (status === "failed") {
    return (
      <div
        className="rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-8 text-center text-sm text-destructive"
        role="alert"
      >
        Couldn’t load transactions. Refresh the page to try again.
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border px-4 py-12 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    )
  }

  return (
    <>
      {/* Desktop / tablet table */}
      <div className="hidden overflow-hidden rounded-xl border border-border md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <caption className="sr-only">
              Transaction list with date, description, channel, type, status,
              and amount
            </caption>
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th
                  scope="col"
                  className="px-4 py-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase"
                >
                  Date
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase"
                >
                  Description
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase"
                >
                  Channel
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase"
                >
                  Type
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase"
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-right text-xs font-semibold tracking-wide text-muted-foreground uppercase"
                >
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr
                  key={tx.id}
                  className="border-b border-border last:border-b-0 transition-colors hover:bg-muted/30"
                >
                  <td className="px-4 py-3 align-middle whitespace-nowrap">
                    <div className="font-medium text-foreground">
                      {formatTxDate(tx.createdAt)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatTxTime(tx.createdAt)}
                    </div>
                  </td>
                  <td className="max-w-[240px] px-4 py-3 align-middle">
                    <div className="truncate font-medium text-foreground">
                      {displayText(tx.description, 56)}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {displayText(tx.counterparty, 40)}
                      <span className="text-muted-foreground/50"> · </span>
                      <span className="font-mono text-[11px]">
                        {tx.reference}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 align-middle whitespace-nowrap">
                    <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                      {channelLabel(tx.channel)}
                    </span>
                  </td>
                  <td className="px-4 py-3 align-middle whitespace-nowrap">
                    <TypePill type={tx.type} />
                  </td>
                  <td className="px-4 py-3 align-middle whitespace-nowrap">
                    <StatusBadge
                      status={tx.status}
                      optimistic={tx.optimistic}
                    />
                  </td>
                  <td className="px-4 py-3 align-middle text-right whitespace-nowrap">
                    <span
                      className={cn(
                        "font-semibold tabular-nums",
                        tx.type === "credit"
                          ? "text-emerald-700"
                          : "text-foreground",
                        tx.status === "failed" && "text-muted-foreground line-through",
                      )}
                    >
                      {signedAmountPrefix(tx.type)}
                      {formatKobo(tx.amountKobo)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <ul className="space-y-2 md:hidden">
        {transactions.map((tx) => (
          <li
            key={tx.id}
            className="rounded-xl border border-border bg-card p-3.5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-2.5">
                <TypeIcon type={tx.type} />
                <div className="min-w-0 space-y-1">
                  <p className="truncate text-sm font-medium">
                    {displayText(tx.description, 42)}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {displayText(tx.counterparty, 28)} ·{" "}
                    {channelLabel(tx.channel)}
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    <StatusBadge
                      status={tx.status}
                      optimistic={tx.optimistic}
                    />
                    <span className="text-[11px] text-muted-foreground">
                      {formatTxDate(tx.createdAt)} · {formatTxTime(tx.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
              <p
                className={cn(
                  "shrink-0 text-sm font-semibold tabular-nums",
                  tx.type === "credit" ? "text-emerald-700" : "text-foreground",
                  tx.status === "failed" &&
                    "text-muted-foreground line-through",
                )}
              >
                {signedAmountPrefix(tx.type)}
                {formatKobo(tx.amountKobo)}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}

function TypePill({ type }: { type: Transaction["type"] }) {
  const credit = type === "credit"
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium",
        credit
          ? "bg-emerald-50 text-emerald-800"
          : "bg-slate-100 text-slate-700",
      )}
    >
      {credit ? (
        <ArrowDownLeft className="size-3" aria-hidden />
      ) : (
        <ArrowUpRight className="size-3" aria-hidden />
      )}
      {typeLabel(type)}
    </span>
  )
}

function TypeIcon({ type }: { type: Transaction["type"] }) {
  const credit = type === "credit"
  return (
    <div
      aria-hidden
      className={cn(
        "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full",
        credit ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-700",
      )}
    >
      {credit ? (
        <ArrowDownLeft className="size-4" />
      ) : (
        <ArrowUpRight className="size-4" />
      )}
    </div>
  )
}

function StatusBadge({
  status,
  optimistic,
}: {
  status: Transaction["status"]
  optimistic?: boolean
}) {
  const label = statusLabel(status, optimistic)

  if (optimistic || status === "pending") {
    return (
      <Badge
        variant="secondary"
        className="rounded-md bg-amber-50 text-amber-800"
      >
        {label}
      </Badge>
    )
  }

  if (status === "failed") {
    return (
      <Badge variant="destructive" className="rounded-md">
        {label}
      </Badge>
    )
  }

  return (
    <Badge
      variant="secondary"
      className="rounded-md bg-emerald-50 text-emerald-800"
    >
      {label}
    </Badge>
  )
}

function TableSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <div className="space-y-0 divide-y divide-border">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-4 py-3.5"
          >
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 flex-1" />
            <Skeleton className="hidden h-6 w-14 sm:block" />
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-24" />
          </div>
        ))}
      </div>
    </div>
  )
}
