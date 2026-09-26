"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gift, ListChecks, Plus, Settings, Users } from "lucide-react";
import { cn } from "@/lib/cn";

const items = [
  { href: "/", label: "Listas", icon: ListChecks },
  { href: "/reserved", label: "Reservados", icon: Gift },
  { href: "/add-product", label: "Adicionar", icon: Plus, isAction: true },
  { href: "/connections", label: "Conexões", icon: Users },
  { href: "/settings", label: "Configurações", icon: Settings },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex h-[60px] w-full max-w-app items-center justify-between px-4">
        {items.map((item) => {
          const { href, label, icon: Icon } = item;
          const active = pathname === href;

          if ("isAction" in item && item.isAction) {
            return (
              <Link
                key={href}
                href={href}
                aria-label={label}
                className="flex min-w-[52px] flex-col items-center gap-0.5 text-[10px] font-medium text-primary transition-opacity hover:opacity-80 sm:min-w-[64px]"
              >
                <span className="flex size-9 items-center justify-center rounded-full bg-primary text-white shadow-primary-compact transition-transform hover:scale-105">
                  <Icon size={20} strokeWidth={2} />
                </span>
                <span>{label}</span>
              </Link>
            );
          }

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex min-w-[52px] flex-col items-center gap-0.5 text-[10px] transition-opacity hover:opacity-70 sm:min-w-[64px]",
                active
                  ? "font-bold text-primary"
                  : "font-medium text-muted",
              )}
            >
              <span
                className={cn(
                  "flex size-8 items-center justify-center rounded-md transition-colors",
                  active && "bg-primary-soft",
                )}
              >
                <Icon size={18} strokeWidth={2} />
              </span>
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
