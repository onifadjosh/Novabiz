import { NavLink, useLocation } from "react-router-dom"
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronsUpDown,
  CircleHelp,
  FileText,
  LayoutGrid,
  ScanLine,
  Settings2,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { useAppSelector } from "@/store"
import {
  selectMerchantDisplay,
  selectTerminalStatusLabel,
  selectUserStatus,
} from "@/store/selectors"

const navItems = [
  { title: "Overview", to: "/", icon: LayoutGrid },
  { title: "Inward Collections", to: "/collections", icon: ArrowDownLeft },
  { title: "Outward Payouts", to: "/payouts", icon: ArrowUpRight },
  { title: "Terminals & QR", to: "/terminals", icon: ScanLine },
  { title: "Settlements", to: "/settlements", icon: FileText },
  { title: "Settings", to: "/settings", icon: Settings2 },
] as const

export default function AppSidebar() {
  const { pathname } = useLocation()
  const userStatus = useAppSelector(selectUserStatus)
  const merchant = useAppSelector(selectMerchantDisplay)
  const terminals = useAppSelector(selectTerminalStatusLabel)

  return (
    <Sidebar collapsible="icon" className="border-sidebar-border">
      <SidebarHeader className="gap-3 px-3 pt-3 pb-2">
        <div className="flex items-center gap-2.5 px-1">
          <div
            aria-hidden
            className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#0b1f3a] text-sm font-semibold text-white"
          >
            N
          </div>
          <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-[15px] font-semibold tracking-tight text-foreground">
                NovaBiz
              </span>
              <Badge
                variant="secondary"
                className="h-5 rounded-md px-1.5 text-[10px] font-semibold tracking-wide text-muted-foreground"
              >
                CORE
              </Badge>
            </div>
            <p className="truncate text-xs text-muted-foreground">
              FirstBank Merchant Suite
            </p>
          </div>
        </div>

        <button
          type="button"
          className="flex w-full items-center gap-2.5 rounded-xl border border-border bg-background px-2.5 py-2 text-left transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:border-0 group-data-[collapsible=icon]:p-0"
          aria-label="Switch merchant account"
          disabled={userStatus === "loading" || !merchant}
        >
          <div
            aria-hidden
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700"
          >
            {merchant?.initials ?? "…"}
          </div>
          <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-sm font-semibold text-foreground">
              {merchant?.businessName ?? "Loading merchant…"}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {merchant?.subtitle ?? "—"}
            </p>
          </div>
          <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground group-data-[collapsible=icon]:hidden" />
        </button>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="px-3 py-1">
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {navItems.map((item) => {
                const isActive =
                  item.to === "/"
                    ? pathname === "/"
                    : item.to === "/collections"
                      ? pathname.startsWith("/collections") ||
                        pathname.startsWith("/activity")
                      : pathname.startsWith(item.to)

                return (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip={item.title}
                      render={<NavLink to={item.to} />}
                      className={cn(
                        "h-10 rounded-lg px-3 text-[13px] font-medium text-muted-foreground",
                        "hover:bg-muted hover:text-foreground",
                        "data-active:bg-[#0b1f3a] data-active:text-white data-active:hover:bg-[#0b1f3a] data-active:hover:text-white",
                      )}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="gap-2 px-3 pb-3">
        <div className="flex items-center gap-2 rounded-xl bg-muted/70 px-3 py-2.5 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2">
          <span
            aria-hidden
            className={cn(
              "size-2 shrink-0 rounded-full",
              terminals && terminals.activeCount > 0
                ? "bg-emerald-500"
                : "bg-muted-foreground/40",
            )}
          />
          <span className="min-w-0 flex-1 truncate text-xs font-medium text-foreground group-data-[collapsible=icon]:hidden">
            {terminals?.label ?? "Loading terminals…"}
          </span>
          <span className="shrink-0 text-[10px] font-semibold tracking-wide text-muted-foreground group-data-[collapsible=icon]:hidden">
            {terminals?.syncLabel ?? "—"}
          </span>
        </div>

        <SidebarSeparator className="mx-0" />

        <div className="flex items-center justify-between gap-2 px-1 text-xs text-muted-foreground group-data-[collapsible=icon]:justify-center">
          <span className="group-data-[collapsible=icon]:hidden">
            NovaBiz Core v2.8
          </span>
          <a
            href="#support"
            className="inline-flex items-center gap-1 rounded-md px-1 py-0.5 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="group-data-[collapsible=icon]:hidden">Support</span>
            <CircleHelp className="size-3.5" />
          </a>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
