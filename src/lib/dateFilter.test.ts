import { describe, expect, it } from "vitest"

import { isValidDateRange, isWithinDateRange, toDateKey } from "./dateFilter"

describe("dateFilter", () => {
  it("extracts YYYY-MM-DD from ISO timestamps", () => {
    expect(toDateKey("2026-10-20T08:12:44.200Z")).toBe("2026-10-20")
  })

  it("filters inclusively by from/to", () => {
    const mid = "2026-10-15T12:00:00.000Z"
    expect(isWithinDateRange(mid, "2026-10-15", "2026-10-15")).toBe(true)
    expect(isWithinDateRange(mid, "2026-10-16", "")).toBe(false)
    expect(isWithinDateRange(mid, "", "2026-10-14")).toBe(false)
    expect(isWithinDateRange(mid, "2026-10-01", "2026-10-31")).toBe(true)
  })

  it("treats inverted ranges as invalid", () => {
    expect(isValidDateRange("2026-10-20", "2026-10-10")).toBe(false)
    expect(isValidDateRange("2026-10-10", "2026-10-20")).toBe(true)
    expect(isValidDateRange("", "2026-10-20")).toBe(true)
  })
})
