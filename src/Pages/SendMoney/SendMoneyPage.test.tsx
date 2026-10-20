import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { renderWithProviders } from "@/test/test-utils"
import SendMoneyPage from "./SendMoneyPage"

const postTransfer = vi.fn()

vi.mock("@/api/transfers", () => ({
  postTransfer: (...args: unknown[]) => postTransfer(...args),
  TransferApiError: class TransferApiError extends Error {
    code = "NETWORK" as const
    constructor(_code: string, message: string) {
      super(message)
      this.name = "TransferApiError"
    }
  },
}))

async function fillRecipient(user: ReturnType<typeof userEvent.setup>) {
  await user.type(
    screen.getByLabelText(/account name/i),
    "Chinedu Okoro",
  )
  await user.type(screen.getByLabelText(/account number/i), "0123456789")

  await user.click(screen.getByRole("combobox", { name: /bank/i }))
  const bankOption = await screen.findByRole("option", {
    name: /First Bank of Nigeria/i,
  })
  await user.click(bankOption)
}

describe("SendMoneyPage", () => {
  beforeEach(() => {
    postTransfer.mockReset()
  })

  it("validates recipient before leaving step 1", async () => {
    const user = userEvent.setup()
    renderWithProviders(<SendMoneyPage />)

    await user.click(screen.getByRole("button", { name: /continue/i }))

    expect(
      await screen.findByText(/full account name/i),
    ).toBeInTheDocument()
    expect(screen.getByText(/10 digits/i)).toBeInTheDocument()
    expect(screen.getByText(/destination bank/i)).toBeInTheDocument()
  })

  it("walks through the flow and confirms a successful send", async () => {
    postTransfer.mockResolvedValue({
      transaction: {
        id: "txn_live_ok",
        amountKobo: 25_000,
        type: "debit",
        status: "successful",
        description: "Send money — Chinedu Okoro",
        counterparty: "Chinedu Okoro",
        channel: "transfer",
        reference: "NBZOK",
        createdAt: "2026-10-20T10:00:00.000Z",
        idempotencyKey: "idem-ui-1",
      },
    })

    const user = userEvent.setup()
    renderWithProviders(<SendMoneyPage />)

    await fillRecipient(user)
    await user.click(screen.getByRole("button", { name: /continue/i }))

    await user.type(screen.getByLabelText(/amount \(₦\)/i), "250")
    await user.click(screen.getByRole("button", { name: /continue/i }))

    expect(await screen.findByText(/check the details/i)).toBeInTheDocument()
    expect(screen.getByText("Chinedu Okoro")).toBeInTheDocument()
    expect(screen.getByText("0123456789")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /continue/i }))
    expect(screen.getByText(/idempotency-key attached/i)).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /confirm & send/i }))

    await waitFor(() => {
      expect(screen.getByText(/money sent/i)).toBeInTheDocument()
    })
    expect(postTransfer).toHaveBeenCalledTimes(1)
    expect(postTransfer.mock.calls[0]?.[0]?.amountKobo).toBe(25_000)
    expect(postTransfer.mock.calls[0]?.[0]?.idempotencyKey).toBeTruthy()
  })

  it("shows failure and restores balance messaging on API error", async () => {
    const { TransferApiError } = await import("@/api/transfers")
    postTransfer.mockRejectedValue(
      new TransferApiError(
        "NETWORK",
        "Transfer timed out on the NIP rail. Your balance has been restored.",
      ),
    )

    const user = userEvent.setup()
    const { store } = renderWithProviders(<SendMoneyPage />, {
      wallet: { availableBalanceKobo: 5_000_000 },
    })

    await fillRecipient(user)
    await user.click(screen.getByRole("button", { name: /continue/i }))
    await user.type(screen.getByLabelText(/amount \(₦\)/i), "100")
    await user.click(screen.getByRole("button", { name: /continue/i }))
    await user.click(screen.getByRole("button", { name: /continue/i }))
    await user.click(screen.getByRole("button", { name: /confirm & send/i }))

    expect(
      await screen.findByText(/timed out on the nip rail/i),
    ).toBeInTheDocument()
    expect(store.getState().wallet.availableBalanceKobo).toBe(5_000_000)
    expect(screen.getByRole("button", { name: /retry same key/i })).toBeInTheDocument()
  })
})
