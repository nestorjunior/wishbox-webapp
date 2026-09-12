"use client";

import Link from "next/link";
import { Bell, Gift, MessageCircle, Search } from "lucide-react";
import { useWishbox } from "@/store/wishbox-store";

export function AppHeader({
  maxWidthClass = "max-w-[840px]",
}: {
  maxWidthClass?: string;
}) {
  const { state } = useWishbox();

  const unread = state.notifications.filter(
    (notification) => !notification.read,
  ).length;

  return (
    <header className="w-full border-b border-border bg-background">
      <div
        className={`mx-auto flex h-[52px] w-full ${maxWidthClass} items-center justify-between px-4`}
      >
        <Link
          href="/"
          aria-label="Wishbox"
          className="flex items-center gap-2"
        >
          <span className="flex size-8 items-center justify-center rounded-[10px] bg-primary-soft">
            <Gift size={16} strokeWidth={2.4} className="text-primary" />
          </span>

          <span className="text-[16px] font-extrabold tracking-[0.12em] text-primary">
            WISHBOX
          </span>
        </Link>

        <nav className="flex items-center gap-1" aria-label="Navegação">
          <Link
            href="/notifications"
            aria-label="Notificações"
            className="relative flex size-8 items-center justify-center rounded-full text-foreground transition-opacity hover:opacity-70"
          >
            <Bell size={19} strokeWidth={2} />

            {unread > 0 ? (
              <span
                aria-hidden="true"
                className="absolute top-[5px] right-[5px] size-[6px] rounded-full bg-primary"
              />
            ) : null}
          </Link>

          <Link
            href="/messages"
            aria-label="Mensagens"
            className="flex size-8 items-center justify-center rounded-full text-foreground transition-opacity hover:opacity-70"
          >
            <MessageCircle size={19} strokeWidth={2} />
          </Link>

          <Link
            href="/explore"
            aria-label="Buscar"
            className="flex size-8 items-center justify-center rounded-full text-foreground transition-opacity hover:opacity-70"
          >
            <Search size={19} strokeWidth={2} />
          </Link>
        </nav>
      </div>
    </header>
  );
}