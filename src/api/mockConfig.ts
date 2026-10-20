/** Simulated network latency range (ms). */
export const MOCK_LATENCY_MS = { min: 600, max: 1400 } as const

/**
 * Probability that a transfer request fails after the optimistic UI has updated.
 * Toggle via `localStorage.setItem('novabiz.mockFailureRate', '0.5')` then reload,
 * or call `setMockFailureRate(0.5)` from the console.
 */
const STORAGE_KEY = "novabiz.mockFailureRate"
const DEFAULT_FAILURE_RATE = 0.25

export function getMockFailureRate(): number {
  if (typeof localStorage === "undefined") return DEFAULT_FAILURE_RATE
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw == null) return DEFAULT_FAILURE_RATE
  const parsed = Number.parseFloat(raw)
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1) {
    return DEFAULT_FAILURE_RATE
  }
  return parsed
}

export function setMockFailureRate(rate: number): void {
  localStorage.setItem(STORAGE_KEY, String(rate))
}

export function mockDelay(): Promise<void> {
  const { min, max } = MOCK_LATENCY_MS
  const ms = min + Math.floor(Math.random() * (max - min + 1))
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}
