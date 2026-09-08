"use client";

import Link from "next/link";
import { Bell, Gift, MessageCircle, Search } from "lucide-react";
import { useWishbox } from "@/store/wishbox-store";

export function AppHeader() {
  const { state } = useWishbox();
  const unread = state.notifications.filter(
    (notification) => !notification.read,
  ).length;

  return (
    <header className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div className="flex size-[42px] items-center justify-center rounded-[13px] bg-primary-soft">
          <Gift size={20} className="text-primary" />
        </div>
        <span className="text-2xl font-extrabold tracking-wide text-primary">
          WISHBOX
        </span>
      </div>
      <div className="flex gap-2.5">
        <Link
          href="/notifications"
          aria-label="Notificações"
          className="relative flex size-12 items-center justify-center rounded-2xl border border-(--color-border) bg-(--color-card)"
        >
          <Bell size={22} className="text-(--foreground)" />
          {unread > 0 ? (
            <span className="absolute top-2 right-[9px] size-2 rounded-full bg-primary" />
          ) : null}
        </Link>
        <Link
          href="/messages"
          aria-label="Mensagens"
          className="flex size-12 items-center justify-center rounded-2xl border border-(--color-border) bg-(--color-card)"
        >
          <MessageCircle size={22} className="text-(--foreground)" />
        </Link>
        <Link
          href="/explore"
          aria-label="Buscar"
          className="flex size-12 items-center justify-center rounded-2xl border border-(--color-border) bg-(--color-card)"
        >
          <Search size={22} className="text-(--foreground)" />
        </Link>
      </div>
    </header>
  );
}
