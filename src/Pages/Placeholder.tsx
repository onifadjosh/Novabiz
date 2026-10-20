import { useLocation } from "react-router-dom"

const titles: Record<string, string> = {
  "/collections": "Inward Collections",
  "/payouts": "Outward Payouts",
  "/terminals": "Terminals & QR",
  "/settlements": "Settlements",
  "/settings": "Settings",
}

export default function Placeholder() {
  const { pathname } = useLocation()
  const title = titles[pathname] ?? "Page"

  return (
    <div className="flex flex-1 flex-col gap-2 p-6">
      <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
      <p className="text-sm text-muted-foreground">Coming soon.</p>
    </div>
  )
}
