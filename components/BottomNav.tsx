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
  { href: "/settings", label: "Ajustes", icon: Settings },
] as const;

/**
 * Barra de navegação inferior compartilhada pelas telas autenticadas,
 * espelhando as abas do app mobile (Listas, Reservados, Adicionar, Conexões, Ajustes).
 */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky bottom-0 -mx-4 -mb-24 mt-2 flex h-20 items-center justify-around border-t border-border bg-card px-4">
      {items.map((item) => {
        const { href, label, icon: Icon } = item;
        const active = pathname === href;

        if ("isAction" in item && item.isAction) {
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              className="flex size-11 items-center justify-center rounded-full bg-primary text-white"
            >
              <Icon size={22} />
            </Link>
          );
        }

        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-col items-center gap-1 text-xs font-bold",
              active ? "text-primary" : "text-muted font-medium",
            )}
          >
            <Icon size={20} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
