import { useMemo, useState } from "react"

export function usePagination<T>(items: T[], pageSize: number) {
  const [page, setPage] = useState(1)

  const totalItems = items.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))

  // Clamp if the list shrinks (e.g. after filters).
  const currentPage = Math.min(page, totalPages)

  const pageItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return items.slice(start, start + pageSize)
  }, [items, currentPage, pageSize])

  function goTo(next: number) {
    setPage(Math.min(totalPages, Math.max(1, next)))
  }

  function next() {
    goTo(currentPage + 1)
  }

  function prev() {
    goTo(currentPage - 1)
  }

  function reset() {
    setPage(1)
  }

  const rangeStart = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const rangeEnd = Math.min(currentPage * pageSize, totalItems)

  return {
    page: currentPage,
    pageSize,
    totalPages,
    totalItems,
    pageItems,
    rangeStart,
    rangeEnd,
    goTo,
    next,
    prev,
    reset,
    hasPrev: currentPage > 1,
    hasNext: currentPage < totalPages,
  }
}
