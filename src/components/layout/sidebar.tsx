"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store";
import { NAV_ITEMS, SIDEBAR_WIDTH, SIDEBAR_COLLAPSED_WIDTH } from "@/lib/constants";
import type { NavItem } from "@/types";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Gamepad2,
  Shield,
  Target,
  Users,
  BarChart3,
  Menu,
  ChevronLeft,
  Swords,
  Lightbulb,
  Home,
  TrendingUp,
} from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Gamepad2,
  Shield,
  Target,
  Users,
  BarChart3,
  Lightbulb,
  Home,
  TrendingUp,
};

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useAppStore();

  const width = sidebarCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH;

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen border-r border-[var(--color-card-border)] bg-[var(--color-card)] transition-all duration-300 hidden md:flex flex-col",
        width === SIDEBAR_WIDTH ? "w-[280px]" : "w-[72px]"
      )}
    >
      {/* Logo */}
      <div className={cn(
        "flex h-16 items-center border-b border-[var(--color-card-border)] px-4",
        sidebarCollapsed ? "justify-center" : "justify-between"
      )}>
        {!sidebarCollapsed && (
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-accent)]">
              <Swords className="h-5 w-5 text-[var(--color-background)]" />
            </div>
            <span className="text-xl font-bold text-[var(--color-foreground)]">
              DotaVision
            </span>
          </Link>
        )}
        {sidebarCollapsed && (
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-accent)]">
            <Swords className="h-5 w-5 text-[var(--color-background)]" />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3">
        {NAV_ITEMS.map((item) => {
          const Icon = iconMap[item.icon];
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                  : "text-[var(--color-foreground-muted)] hover:bg-[var(--color-background-tertiary)] hover:text-[var(--color-foreground)]",
                sidebarCollapsed && "justify-center"
              )}
            >
              {Icon && <Icon className={cn("h-5 w-5 flex-shrink-0", isActive && "text-[var(--color-accent)]")} />}
              {!sidebarCollapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse Button */}
      <div className="border-t border-[var(--color-card-border)] p-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          className={cn("w-full", sidebarCollapsed ? "justify-center" : "justify-start")}
        >
          <ChevronLeft className={cn("h-4 w-4", sidebarCollapsed && "rotate-180")} />
          {!sidebarCollapsed && <span className="ml-2">Collapse</span>}
        </Button>
      </div>
    </aside>
  );
}

// Mobile Navigation with bottom nav bar for mobile
const MOBILE_NAV_ITEMS = [
  { id: "dashboard", label: "Home", href: "/", icon: "Home" },
  { id: "live", label: "Live", href: "/live", icon: "Swords" },
  { id: "peers", label: "Peers", href: "/peers", icon: "Users" },
  { id: "analytics", label: "Trends", href: "/analytics", icon: "TrendingUp" },
  { id: "insights", label: "Insights", href: "/insights", icon: "Lightbulb" },
] as const;

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-[var(--color-card-border)] bg-[var(--color-card)]/80 px-4 py-2 backdrop-blur-lg md:hidden">
      {MOBILE_NAV_ITEMS.map((item) => {
        const Icon = iconMap[item.icon];
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.id}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-1 rounded-lg p-2 text-xs transition-colors",
              isActive
                ? "text-[var(--color-accent)] bg-[var(--color-accent)]/10"
                : "text-[var(--color-foreground-muted)] hover:text-[var(--color-foreground)]"
            )}
          >
            {Icon && <Icon className="h-5 w-5" />}
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
