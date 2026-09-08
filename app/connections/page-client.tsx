"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { Screen } from "@/components/Screen";
import { Avatar, Button, EmptyState } from "@/components/ui";
import { cn } from "@/lib/cn";
import { useWishbox } from "@/store/wishbox-store";
import { useBackendUserSearch } from "@/hooks/use-backend-user-search";

type Tab = "seguindo" | "seguidores" | "solicitacoes";

export default function ConnectionsPage() {
  const {
    state,
    userById,
    followStateForUser,
    followUser,
    unfollowUser,
    acceptFollowRequest,
    cancelFollowRequest,
    rejectFollowRequest,
  } = useWishbox();
  const [tab, setTab] = useState<Tab>("seguindo");
  const [query, setQuery] = useState("");

  const { users: searchedUsers, loading, error } = useBackendUserSearch(
    query,
    state.backendUser?.id,
  );

  const acceptedIds = useMemo(
    () =>
      (tab === "seguindo"
        ? state.following
        : tab === "seguidores"
          ? state.followers
          : state.pendingReceived
      ).map((entry) => entry.userId),
    [state.following, state.followers, state.pendingReceived, tab],
  );

  const searchTerm = query.trim().toLowerCase();
  const remoteUsersById = useMemo(
    () => new Map(searchedUsers.map((user) => [user.id, user])),
    [searchedUsers],
  );

  const ids = searchTerm
    ? searchedUsers.map((user) => user.id)
    : acceptedIds;

  return (
    <Screen header>
      <div className="flex h-[46px] items-center gap-2 rounded-md border border-border bg-card px-3.5">
        <Search size={16} className="text-muted" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar por nome ou @usuário"
          className="h-full flex-1 bg-transparent text-sm text-foreground placeholder:text-muted focus:outline-none"
        />
      </div>

      <div className="flex gap-1 rounded-md border border-border bg-background p-1">
        <TabButton
          active={tab === "seguindo"}
          label={`Seguindo (${state.following.length})`}
          onClick={() => setTab("seguindo")}
        />
        <TabButton
          active={tab === "seguidores"}
          label={`Seguidores (${state.followers.length})`}
          onClick={() => setTab("seguidores")}
        />
        <TabButton
          active={tab === "solicitacoes"}
          label={`Solicitações (${state.pendingReceived.length})`}
          onClick={() => setTab("solicitacoes")}
        />
      </div>

      {loading ? (
        <EmptyState emoji="⏳" title="Buscando usuários" description="Aguarde um instante." />
      ) : error ? (
        <EmptyState emoji="⚠️" title="Não foi possível buscar" description={error} />
      ) : ids.length === 0 ? (
        <EmptyState
          emoji="👋"
          title="Nada por aqui ainda"
          description="Encontre pessoas pela busca acima."
        />
      ) : (
        <div className="flex flex-col gap-2.5">
          {ids.map((id) => {
            const user = remoteUsersById.get(id) ?? userById(id);
            if (!user) return null;

            const followState = followStateForUser(id);

            return (
              <div
                key={id}
                className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 shadow-[0_6px_14px_-2px_rgba(27,27,51,0.06)]"
              >
                <Link
                  href={`/profile/${user.username}`}
                  className="flex min-w-0 flex-1 items-center gap-3"
                >
                  <Avatar photo={user.photo} emoji={user.emoji} tint={user.tint} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-foreground">
                      {user.name}
                    </p>
                    <p className="truncate text-xs text-muted">
                      @{user.username}
                    </p>
                  </div>
                </Link>

                {followState === "ACCEPTED" ? (
                  <Button
                    title="Deixar de seguir"
                    variant="outline"
                    className="shrink-0"
                    onClick={() => void unfollowUser(id)}
                  />
                ) : followState === "PENDING_SENT" ? (
                  <Button
                    title="Cancelar"
                    variant="outline"
                    className="shrink-0"
                    onClick={() => void cancelFollowRequest(id)}
                  />
                ) : followState === "PENDING_RECEIVED" ? (
                  <div className="flex shrink-0 gap-1.5">
                    <Button
                      title="Aceitar"
                      onClick={() => void acceptFollowRequest(id)}
                    />
                    <Button
                      title="Recusar"
                      variant="outline"
                      onClick={() => void rejectFollowRequest(id)}
                    />
                  </div>
                ) : (
                  <Button
                    title="Seguir"
                    className="shrink-0"
                    onClick={() => void followUser(id)}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
      <BottomNav />
    </Screen>
  );
}

function TabButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-1 rounded-sm py-2.5 text-xs font-semibold",
        active ? "bg-card text-primary shadow-sm" : "text-muted",
      )}
    >
      {label}
    </button>
  );
}
