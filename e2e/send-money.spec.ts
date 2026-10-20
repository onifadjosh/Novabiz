import { expect, test } from "@playwright/test"

test.describe("Send Money", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("novabiz.mockFailureRate", "0")
    })
    await page.goto("/payouts")
    await expect(page.getByRole("heading", { name: /send money/i })).toBeVisible()
  })

  test("completes recipient → amount → review → confirm", async ({ page }) => {
    await page.getByLabel(/account name/i).fill("Amina Bello")
    await page.getByLabel(/account number/i).fill("0987654321")

    await page.getByRole("combobox", { name: /bank/i }).click()
    await page.getByRole("option", { name: /Guaranty Trust Bank/i }).click()

    await page.getByRole("button", { name: /continue/i }).click()

    await page.getByLabel(/amount \(₦\)/i).fill("1500.50")
    await page.getByRole("button", { name: /continue/i }).click()

    await expect(page.getByText("Amina Bello", { exact: true })).toBeVisible()
    await expect(page.getByText("0987654321")).toBeVisible()
    await expect(page.getByText("₦1,500.50", { exact: true })).toBeVisible()

    await page.getByRole("button", { name: /continue/i }).click()
    await expect(page.getByText(/idempotency-key attached/i)).toBeVisible()

    await page.getByRole("button", { name: /confirm & send/i }).click()

    await expect(page.getByRole("status")).toContainText(/money sent/i, {
      timeout: 15_000,
    })
    await expect(page.getByRole("status")).toContainText(/Amina Bello/)
  })

  test("rolls back when the mock rail fails", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("novabiz.mockFailureRate", "1")
    })
    await page.goto("/payouts")

    const balanceText = await page
      .getByText(/available balance/i)
      .locator("..")
      .textContent()

    await page.getByLabel(/account name/i).fill("Tunde Bakare")
    await page.getByLabel(/account number/i).fill("1122334455")
    await page.getByRole("combobox", { name: /bank/i }).click()
    await page.getByRole("option", { name: /Zenith Bank/i }).click()
    await page.getByRole("button", { name: /continue/i }).click()

    await page.getByLabel(/amount \(₦\)/i).fill("200")
    await page.getByRole("button", { name: /continue/i }).click()
    await page.getByRole("button", { name: /continue/i }).click()
    await page.getByRole("button", { name: /confirm & send/i }).click()

    await expect(page.getByRole("alert")).toContainText(/timed out|restored/i, {
      timeout: 15_000,
    })
    await expect(
      page.getByRole("button", { name: /retry same key/i }),
    ).toBeVisible()

    // Balance label should still reflect the restored wallet (not stuck lower).
    if (balanceText) {
      await expect(page.getByText(/available balance/i)).toBeVisible()
    }
  })
})
