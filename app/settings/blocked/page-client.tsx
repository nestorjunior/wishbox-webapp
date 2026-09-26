"use client";

import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { FormHeader } from "@/components/FormHeader";
import { Screen } from "@/components/Screen";
import { useToast } from "@/components/Toast";
import { Avatar, Button, EmptyState } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { useWishbox } from "@/store/wishbox-store";

export default function BlockedAccountsPage() {
  const { state, userById, unblockUser } = useWishbox();
  const { showToast } = useToast();
  const [busyUserId, setBusyUserId] = useState<string | null>(null);

  const unblock = async (userId: string) => {
    if (busyUserId) return;
    try {
      setBusyUserId(userId);
      await unblockUser(userId);
      showToast({ text: "Conta desbloqueada." });
    } catch (error) {
      showToast({
        text:
          error instanceof ApiError
            ? error.message
            : "Não foi possível desbloquear esta conta.",
        tone: "warning",
      });
    } finally {
      setBusyUserId(null);
    }
  };

  return (
    <Screen>
      <FormHeader back="/settings" />
      <h1 className="text-xl font-extrabold text-foreground">Contas bloqueadas</h1>
      <section className="overflow-hidden rounded-lg border border-border bg-card shadow-card">
        {state.blocked.length === 0 ? (
          <EmptyState
            emoji="🛡️"
            title="Nenhuma conta bloqueada"
            description="As pessoas que você bloquear aparecerão aqui."
          />
        ) : (
          <div className="flex flex-col divide-y divide-border">
            {state.blocked.map((userId) => {
              const user = userById(userId);
              return (
                <div
                  key={userId}
                  className="flex items-center gap-3 px-5 py-4"
                >
                  <Avatar
                    photo={user?.photo}
                    emoji={user?.emoji ?? "👤"}
                    tint={user?.tint ?? "lilac"}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-foreground">
                      {user?.name ?? "Conta bloqueada"}
                    </p>
                    {user ? (
                      <p className="truncate text-xs text-muted">@{user.username}</p>
                    ) : null}
                  </div>
                  <Button
                    title="Desbloquear"
                    variant="outline"
                    loading={busyUserId === userId}
                    disabled={busyUserId !== null}
                    onClick={() => void unblock(userId)}
                  />
                </div>
              );
            })}
          </div>
        )}
      </section>
      <div className="rounded-lg border border-border bg-card p-5 text-xs leading-5 text-muted shadow-card">
        <ShieldCheck size={18} className="mb-2 text-primary" />
        Contas bloqueadas não devem conseguir interagir com seu perfil. As regras
        de acesso são aplicadas pelo servidor.
      </div>
    </Screen>
  );
}
