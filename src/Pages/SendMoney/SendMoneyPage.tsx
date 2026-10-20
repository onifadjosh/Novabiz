import { useEffect, useId, useMemo, useRef, useState } from "react"
import { Check, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"

import { NIGERIAN_BANKS } from "@/data/banks"
import { createIdempotencyKey, formatKobo, parseNairaToKobo } from "@/lib/money"
import { useAppDispatch, useAppSelector } from "@/store"
import { clearSendStatus, sendMoney } from "@/store/walletSlice"
import type { SendMoneyRecipient } from "@/types/money"
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
import { cn } from "@/lib/utils"

type Step = "recipient" | "amount" | "review" | "confirm"

const STEPS: Step[] = ["recipient", "amount", "review", "confirm"]

const stepLabels: Record<Step, string> = {
  recipient: "Recipient",
  amount: "Amount",
  review: "Review",
  confirm: "Confirm",
}

const emptyRecipient: SendMoneyRecipient = {
  accountName: "",
  accountNumber: "",
  bankCode: "",
  bankName: "",
}

export default function SendMoneyPage() {
  const dispatch = useAppDispatch()
  const balanceKobo = useAppSelector((s) => s.wallet.availableBalanceKobo)
  const sendStatus = useAppSelector((s) => s.wallet.sendStatus)
  const sendError = useAppSelector((s) => s.wallet.sendError)

  const [step, setStep] = useState<Step>("recipient")
  const [recipient, setRecipient] = useState<SendMoneyRecipient>(emptyRecipient)
  const [amountInput, setAmountInput] = useState("")
  const [narration, setNarration] = useState("")
  const [recipientErrors, setRecipientErrors] = useState<Record<string, string>>(
    {},
  )
  const [amountError, setAmountError] = useState<string | null>(null)
  const [idempotencyKey, setIdempotencyKey] = useState(() =>
    createIdempotencyKey(),
  )

  const formId = useId()
  const stepPanelRef = useRef<HTMLDivElement>(null)
  const isFirstStepFocus = useRef(true)
  const amountKobo = useMemo(
    () => parseNairaToKobo(amountInput),
    [amountInput],
  )

  useEffect(() => {
    return () => {
      dispatch(clearSendStatus())
    }
  }, [dispatch])

  useEffect(() => {
    if (isFirstStepFocus.current) {
      isFirstStepFocus.current = false
      return
    }
    stepPanelRef.current?.focus()
  }, [step])

  function validateRecipient(): boolean {
    const next: Record<string, string> = {}
    if (recipient.accountName.trim().length < 2) {
      next.accountName = "Enter the recipient’s full account name."
    }
    if (!/^\d{10}$/.test(recipient.accountNumber)) {
      next.accountNumber = "NUBAN account number must be 10 digits."
    }
    if (!recipient.bankCode) {
      next.bankCode = "Select a destination bank."
    }
    setRecipientErrors(next)
    return Object.keys(next).length === 0
  }

  function validateAmount(): boolean {
    if (amountKobo == null || amountKobo <= 0) {
      setAmountError("Enter a valid amount greater than ₦0.00.")
      return false
    }
    if (amountKobo < 100) {
      setAmountError("Minimum send amount is ₦1.00.")
      return false
    }
    if (amountKobo > balanceKobo) {
      setAmountError(
        `Insufficient balance. Available: ${formatKobo(balanceKobo)}.`,
      )
      return false
    }
    setAmountError(null)
    return true
  }

  function goNext() {
    if (step === "recipient" && !validateRecipient()) return
    if (step === "amount" && !validateAmount()) return
    const idx = STEPS.indexOf(step)
    if (idx < STEPS.length - 1) {
      setStep(STEPS[idx + 1]!)
    }
  }

  function goBack() {
    const idx = STEPS.indexOf(step)
    if (idx > 0) {
      dispatch(clearSendStatus())
      setStep(STEPS[idx - 1]!)
    }
  }

  async function handleConfirm() {
    if (amountKobo == null) return
    if (sendStatus === "submitting") return

    await dispatch(
      sendMoney({
        recipient,
        amountKobo,
        narration:
          narration.trim() || `Transfer to ${recipient.accountName}`,
        idempotencyKey,
      }),
    )
  }

  function handleRetry() {
    // Same Idempotency-Key — mock API will not double-send if the first
    // attempt actually succeeded server-side.
    void handleConfirm()
  }

  function handleSendAnother() {
    dispatch(clearSendStatus())
    setIdempotencyKey(createIdempotencyKey())
    setRecipient(emptyRecipient)
    setAmountInput("")
    setNarration("")
    setRecipientErrors({})
    setAmountError(null)
    setStep("recipient")
  }

  function onBankChange(code: string | null) {
    if (!code) return
    const bank = NIGERIAN_BANKS.find((b) => b.code === code)
    setRecipient((r) => ({
      ...r,
      bankCode: code,
      bankName: bank?.name ?? "",
    }))
  }

  const stepIndex = STEPS.indexOf(step)

  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 p-4 sm:p-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Send Money</h1>
        <p className="text-sm text-muted-foreground" aria-live="polite">
          Available balance{" "}
          <span className="font-medium text-foreground tabular-nums">
            {formatKobo(balanceKobo)}
          </span>
        </p>
      </header>

      <nav aria-label="Send money steps" className="flex gap-2">
        <ol className="flex w-full gap-2">
          {STEPS.map((s, i) => (
            <li key={s} className="flex flex-1 flex-col gap-1.5">
              <div
                className={cn(
                  "h-1.5 rounded-full",
                  i <= stepIndex ? "bg-[#0b1f3a]" : "bg-muted",
                )}
                aria-hidden
              />
              <span
                className={cn(
                  "text-[11px] font-medium",
                  i === stepIndex ? "text-foreground" : "text-muted-foreground",
                )}
                {...(i === stepIndex ? { "aria-current": "step" as const } : {})}
              >
                {stepLabels[s]}
              </span>
            </li>
          ))}
        </ol>
      </nav>
      <p className="sr-only" aria-live="polite">
        Step {stepIndex + 1} of {STEPS.length}: {stepLabels[step]}
      </p>

      <div
        ref={stepPanelRef}
        tabIndex={-1}
        className="rounded-xl border border-border bg-card p-4 outline-none sm:p-5"
        aria-live="polite"
        aria-labelledby={`${formId}-step-title`}
      >
        <h2 id={`${formId}-step-title`} className="sr-only">
          {stepLabels[step]}
        </h2>
        {step === "recipient" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={`${formId}-name`}>Account name</Label>
              <Input
                id={`${formId}-name`}
                autoComplete="name"
                value={recipient.accountName}
                aria-invalid={!!recipientErrors.accountName}
                aria-describedby={
                  recipientErrors.accountName
                    ? `${formId}-name-err`
                    : undefined
                }
                onChange={(e) =>
                  setRecipient((r) => ({
                    ...r,
                    accountName: e.target.value,
                  }))
                }
                placeholder="e.g. Chinedu Okoro"
                className="h-10"
              />
              {recipientErrors.accountName && (
                <p
                  id={`${formId}-name-err`}
                  className="text-xs text-destructive"
                  role="alert"
                >
                  {recipientErrors.accountName}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor={`${formId}-account`}>Account number</Label>
              <Input
                id={`${formId}-account`}
                inputMode="numeric"
                autoComplete="off"
                maxLength={10}
                value={recipient.accountNumber}
                aria-invalid={!!recipientErrors.accountNumber}
                aria-describedby={
                  recipientErrors.accountNumber
                    ? `${formId}-account-err`
                    : undefined
                }
                onChange={(e) =>
                  setRecipient((r) => ({
                    ...r,
                    accountNumber: e.target.value.replace(/\D/g, "").slice(0, 10),
                  }))
                }
                placeholder="10-digit NUBAN"
                className="h-10"
              />
              {recipientErrors.accountNumber && (
                <p
                  id={`${formId}-account-err`}
                  className="text-xs text-destructive"
                  role="alert"
                >
                  {recipientErrors.accountNumber}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor={`${formId}-bank`}>Bank</Label>
              <Select
                value={recipient.bankCode || null}
                onValueChange={onBankChange}
              >
                <SelectTrigger
                  id={`${formId}-bank`}
                  className="h-10 w-full"
                  aria-invalid={!!recipientErrors.bankCode}
                  aria-describedby={
                    recipientErrors.bankCode
                      ? `${formId}-bank-err`
                      : undefined
                  }
                >
                  <SelectValue placeholder="Select bank" />
                </SelectTrigger>
                <SelectContent align="start" className="w-(--anchor-width)">
                  {NIGERIAN_BANKS.map((bank) => (
                    <SelectItem key={bank.code} value={bank.code}>
                      {bank.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {recipientErrors.bankCode && (
                <p
                  id={`${formId}-bank-err`}
                  className="text-xs text-destructive"
                  role="alert"
                >
                  {recipientErrors.bankCode}
                </p>
              )}
            </div>
          </div>
        )}

        {step === "amount" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={`${formId}-amount`}>Amount (₦)</Label>
              <Input
                id={`${formId}-amount`}
                inputMode="decimal"
                value={amountInput}
                aria-invalid={!!amountError}
                aria-describedby={
                  amountError ? `${formId}-amount-err` : `${formId}-amount-hint`
                }
                onChange={(e) => {
                  const v = e.target.value.replace(/[^\d.]/g, "")
                  const parts = v.split(".")
                  const next =
                    parts.length > 2
                      ? `${parts[0]}.${parts.slice(1).join("").slice(0, 2)}`
                      : parts.length === 2
                        ? `${parts[0]}.${parts[1]!.slice(0, 2)}`
                        : v
                  setAmountInput(next)
                }}
                placeholder="0.00"
                className="h-12 text-lg"
              />
              <p
                id={`${formId}-amount-hint`}
                className="text-xs text-muted-foreground"
              >
                {amountKobo != null
                  ? `You will send ${formatKobo(amountKobo)}`
                  : "Enter amount in Naira"}
              </p>
              {amountError && (
                <p
                  id={`${formId}-amount-err`}
                  className="text-xs text-destructive"
                  role="alert"
                >
                  {amountError}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor={`${formId}-narration`}>
                Narration <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id={`${formId}-narration`}
                value={narration}
                maxLength={80}
                onChange={(e) => setNarration(e.target.value)}
                placeholder="What is this for?"
                className="h-10"
              />
            </div>
          </div>
        )}

        {step === "review" && amountKobo != null && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Check the details before confirming. This debit will leave your
              NovaBiz wallet over NIP.
            </p>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-4 border-b border-border pb-2">
                <dt className="text-muted-foreground">Recipient</dt>
                <dd className="text-right font-medium">
                  {recipient.accountName}
                </dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-border pb-2">
                <dt className="text-muted-foreground">Account</dt>
                <dd className="text-right font-medium tabular-nums">
                  {recipient.accountNumber}
                </dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-border pb-2">
                <dt className="text-muted-foreground">Bank</dt>
                <dd className="text-right font-medium">{recipient.bankName}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-border pb-2">
                <dt className="text-muted-foreground">Amount</dt>
                <dd className="text-right text-base font-semibold">
                  {formatKobo(amountKobo)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Narration</dt>
                <dd className="max-w-[60%] text-right font-medium break-words">
                  {narration.trim() || `Transfer to ${recipient.accountName}`}
                </dd>
              </div>
            </dl>
          </div>
        )}

        {step === "confirm" && amountKobo != null && (
          <div className="space-y-4">
            {sendStatus === "succeeded" ? (
              <div
                className="flex flex-col items-center gap-2 py-6 text-center"
                role="status"
              >
                <div className="flex size-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <Check className="size-6" />
                </div>
                <p className="font-semibold">Money sent</p>
                <p className="text-sm text-muted-foreground">
                  {formatKobo(amountKobo)} to {recipient.accountName}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSendAnother}
                  className="mt-2 h-10"
                >
                  Send another
                </Button>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Confirm to debit{" "}
                  <strong className="text-foreground">
                    {formatKobo(amountKobo)}
                  </strong>{" "}
                  from your wallet. The UI updates immediately; if the rail
                  fails, your balance is restored.
                </p>
                <div className="rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
                  <p className="font-medium text-foreground">
                    Idempotency-Key attached
                  </p>
                  <p className="mt-0.5">
                    Used on submit/retry so a double-tap cannot debit twice.
                    The value is hidden in the UI.
                  </p>
                  <code
                    aria-hidden
                    className="mt-2 block select-none truncate font-mono text-[11px] text-foreground blur-[5px]"
                    title="Hidden for security"
                  >
                    {idempotencyKey}
                  </code>
                </div>

                {sendStatus === "failed" && sendError && (
                  <div
                    className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
                    role="alert"
                  >
                    {sendError}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={goBack}
          disabled={step === "recipient" || sendStatus === "submitting"}
          className="h-10"
        >
          <ChevronLeft className="size-4" />
          Back
        </Button>

        {step !== "confirm" && (
          <Button type="button" onClick={goNext} className="h-10 bg-[#0b1f3a] hover:bg-[#0b1f3a]/80">
            Continue
            <ChevronRight className="size-4" />
          </Button>
        )}

        {step === "confirm" && sendStatus !== "succeeded" && (
          <div className="flex gap-2">
            {sendStatus === "failed" && (
              <Button
                type="button"
                variant="outline"
                onClick={handleRetry}
                className="h-10"
              >
                Retry same key
              </Button>
            )}
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={sendStatus === "submitting"}
              className="h-10 bg-[#0b1f3a] hover:bg-[#0b1f3a]/80"
              aria-busy={sendStatus === "submitting"}
            >
              {sendStatus === "submitting" ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Sending…
                </>
              ) : (
                "Confirm & send"
              )}
            </Button>
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Tip: set failure rate in DevTools —{" "}
        <code className="rounded bg-muted px-1">
          localStorage.setItem(&apos;novabiz.mockFailureRate&apos;,&apos;0.8&apos;)
        </code>{" "}
        then reload to exercise rollback.
      </p>
    </div>
  )
}
