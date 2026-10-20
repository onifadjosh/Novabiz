import { describe, expect, it } from "vitest"

import { formatKobo, parseNairaToKobo } from "./money"

describe("formatKobo", () => {
  it("formats integer kobo as Naira without float drift", () => {
    expect(formatKobo(100050)).toBe("₦1,000.50")
    expect(formatKobo(0)).toBe("₦0.00")
    expect(formatKobo(50)).toBe("₦0.50")
    expect(formatKobo(100)).toBe("₦1.00")
  })

  it("handles large merchant balances", () => {
    expect(formatKobo(337543050)).toBe("₦3,375,430.50")
  })

  it("rejects non-integer kobo (blocks naive float paths)", () => {
    expect(() => formatKobo(100050.1)).toThrow(/integer kobo/)
  })
})

describe("parseNairaToKobo", () => {
  it("parses plain and comma-grouped Naira to integer kobo", () => {
    expect(parseNairaToKobo("1000.50")).toBe(100050)
    expect(parseNairaToKobo("1,000.50")).toBe(100050)
    expect(parseNairaToKobo("0.01")).toBe(1)
    expect(parseNairaToKobo("250")).toBe(25000)
  })

  it("rejects invalid input", () => {
    expect(parseNairaToKobo("")).toBeNull()
    expect(parseNairaToKobo("12.345")).toBeNull()
    expect(parseNairaToKobo("abc")).toBeNull()
    expect(parseNairaToKobo("-10")).toBeNull()
  })
})
