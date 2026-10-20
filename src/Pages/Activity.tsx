import { useEffect, useId, useMemo, useState } from "react"
import { Link } from "react-router-dom"

import PaginationControls from "@/components/PaginationControls"
import TransactionsTable from "@/components/TransactionsTable"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { usePagination } from "@/hooks/usePagination"
import { isValidDateRange, isWithinDateRange } from "@/lib/dateFilter"
import { useAppSelector } from "@/store"
import {
  selectMerchantDisplay,
  selectTransactions,
  selectTransactionsStatus,
} from "@/store/selectors"
import type { TransactionStatus, TransactionType } from "@/types/money"

const PAGE_SIZE = 20

type TypeFilter = "all" | TransactionType
type StatusFilter = "all" | TransactionStatus

export default function ActivityPage() {
  const merchant = useAppSelector(selectMerchantDisplay)
  const transactions = useAppSelector(selectTransactions)
  const txStatus = useAppSelector(selectTransactionsStatus)
  const filtersId = useId()

  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")

  const rangeValid = isValidDateRange(fromDate, toDate)

  const filtered = useMemo(() => {
    if (!rangeValid) return []
    return transactions.filter((tx) => {
      if (typeFilter !== "all" && tx.type !== typeFilter) return false
      if (statusFilter !== "all" && tx.status !== statusFilter) return false
      if (!isWithinDateRange(tx.createdAt, fromDate, toDate)) return false
      return true
    })
  }, [transactions, typeFilter, statusFilter, fromDate, toDate, rangeValid])

  const pagination = usePagination(filtered, PAGE_SIZE)

  useEffect(() => {
    pagination.reset()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when filters change
  }, [typeFilter, statusFilter, fromDate, toDate])

  const hasActiveFilters =
    typeFilter !== "all" ||
    statusFilter !== "all" ||
    fromDate !== "" ||
    toDate !== ""

  function clearFilters() {
    setTypeFilter("all")
    setStatusFilter("all")
    setFromDate("")
    setToDate("")
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Ledger
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            All activity
          </h1>
          <p className="text-sm text-muted-foreground">
            {merchant
              ? `${merchant.businessName} · full transaction history`
              : "Loading…"}
          </p>
        </div>
        <Button variant="outline" render={<Link to="/" />} className="h-10">
          Back to Overview
        </Button>
      </header>

      <section
        aria-labelledby={`${filtersId}-heading`}
        className="rounded-xl border border-border bg-card p-3 sm:p-4"
      >
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2
            id={`${filtersId}-heading`}
            className="text-sm font-semibold text-foreground"
          >
            Filters
          </h2>
          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8"
              onClick={clearFilters}
            >
              Clear filters
            </Button>
          )}
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <Label
              htmlFor={`${filtersId}-from`}
              className="text-xs text-muted-foreground"
            >
              From date
            </Label>
            <Input
              id={`${filtersId}-from`}
              type="date"
              value={fromDate}
              max={toDate || undefined}
              onChange={(e) => setFromDate(e.target.value)}
              className="h-9 w-[160px]"
              aria-invalid={!rangeValid}
              aria-describedby={
                !rangeValid ? `${filtersId}-range-err` : undefined
              }
            />
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor={`${filtersId}-to`}
              className="text-xs text-muted-foreground"
            >
              To date
            </Label>
            <Input
              id={`${filtersId}-to`}
              type="date"
              value={toDate}
              min={fromDate || undefined}
              onChange={(e) => setToDate(e.target.value)}
              className="h-9 w-[160px]"
              aria-invalid={!rangeValid}
              aria-describedby={
                !rangeValid ? `${filtersId}-range-err` : undefined
              }
            />
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor={`${filtersId}-type`}
              className="text-xs text-muted-foreground"
            >
              Type
            </Label>
            <Select
              value={typeFilter}
              onValueChange={(v) => v && setTypeFilter(v as TypeFilter)}
            >
              <SelectTrigger
                id={`${filtersId}-type`}
                className="h-9 w-[140px]"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="credit">Credit</SelectItem>
                <SelectItem value="debit">Debit</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor={`${filtersId}-status`}
              className="text-xs text-muted-foreground"
            >
              Status
            </Label>
            <Select
              value={statusFilter}
              onValueChange={(v) => v && setStatusFilter(v as StatusFilter)}
            >
              <SelectTrigger
                id={`${filtersId}-status`}
                className="h-9 w-[160px]"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="successful">Successful</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <p
            className="pb-2 text-xs text-muted-foreground sm:ml-auto"
            aria-live="polite"
          >
            {rangeValid
              ? `${filtered.length.toLocaleString("en-NG")} matching · newest first`
              : "Fix the date range to see results"}
          </p>
        </div>

        {!rangeValid && (
          <p
            id={`${filtersId}-range-err`}
            className="mt-2 text-xs text-destructive"
            role="alert"
          >
            “From” date must be on or before “To” date.
          </p>
        )}
      </section>

      <section aria-label="Transaction activity" className="space-y-3">
        <TransactionsTable
          transactions={pagination.pageItems}
          status={txStatus}
          emptyMessage={
            rangeValid
              ? "No transactions match these filters."
              : "Adjust the date range to view transactions."
          }
        />

        {txStatus === "succeeded" && rangeValid && filtered.length > 0 && (
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
