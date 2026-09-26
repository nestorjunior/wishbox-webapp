"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Ban, ChevronDown, Search, UserMinus, UserPlus } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { Screen } from "@/components/Screen";
import { useToast } from "@/components/Toast";
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
    isFollowing,
    followUser,
    unfollowUser,
    acceptFollowRequest,
    cancelFollowRequest,
    dispatch,
    blockUser,
  } = useWishbox();
  const [tab, setTab] = useState<Tab>("seguindo");
  const [query, setQuery] = useState("");
  const { showToast } = useToast();

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
                className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 shadow-card"
              >
                <Link
                  href={`/profile/${user.username}`}
                  className="flex min-w-0 flex-1 items-center gap-3"
                  onClick={() => {
                    dispatch({
                      type: "users/hydrate",
                      users: [user],
                    });
                  }}
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

                <ConnectionActions
                  tab={tab}
                  following={isFollowing(id)}
                  followState={followState}
                  onFollow={() => followUser(id)}
                  onUnfollow={() => unfollowUser(id)}
                  onAccept={() => acceptFollowRequest(id)}
                  onCancel={() => cancelFollowRequest(id)}
                  onBlock={async () => {
                    await blockUser(id);
                    showToast({ text: "Conta bloqueada." });
                  }}
                  onError={(error) =>
                    showToast({
                      text:
                        error instanceof Error
                          ? error.message
                          : "Não foi possível concluir a ação.",
                      tone: "warning",
                    })
                  }
                />
              </div>
            );
          })}
        </div>
      )}
      <BottomNav />
    </Screen>
  );
}

type FollowState = ReturnType<ReturnType<typeof useWishbox>["followStateForUser"]>;

function ConnectionActions({
  tab,
  following,
  followState,
  onFollow,
  onUnfollow,
  onAccept,
  onCancel,
  onBlock,
  onError,
}: {
  tab: Tab;
  following: boolean;
  followState: FollowState;
  onFollow: () => Promise<void>;
  onUnfollow: () => Promise<void>;
  onAccept: () => Promise<void>;
  onCancel: () => Promise<void>;
  onBlock: () => Promise<void>;
  onError: (error: unknown) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const run = async (action: () => Promise<void>) => {
    setMenuOpen(false);
    setBusy(true);
    try {
      await action();
    } catch (error) {
      onError(error);
    } finally {
      setBusy(false);
    }
  };

  if (tab === "solicitacoes") {
    if (followState === "PENDING_SENT") {
      return (
        <Button
          title="Solicitado"
          variant="outline"
          loading={busy}
          onClick={() => void run(onCancel)}
        />
      );
    }

    if (followState === "PENDING_RECEIVED") {
      return (
        <Button
          title="Aceitar"
          loading={busy}
          onClick={() => void run(onAccept)}
        />
      );
    }

    return null;
  }

  const showsFollowing = following;

  return (
    <div className="relative shrink-0">
      <Button
        title={showsFollowing ? "Seguindo" : "Seguir"}
        variant={showsFollowing ? "outline" : "primary"}
        icon={showsFollowing ? <UserMinus size={15} /> : <UserPlus size={15} />}
        className="pr-8"
        loading={busy}
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        aria-label={
          showsFollowing
            ? "Abrir opções do usuário seguido"
            : "Abrir opções para seguir usuário"
        }
        onClick={() => setMenuOpen((open) => !open)}
      />
      {!busy ? (
        <ChevronDown
          aria-hidden="true"
          size={14}
          className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2"
        />
      ) : null}

      {menuOpen ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-1.5 min-w-40 rounded-xl border border-border bg-card p-1.5 shadow-lg"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => void run(showsFollowing ? onUnfollow : onFollow)}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-foreground hover:bg-background"
          >
            {showsFollowing ? <UserMinus size={16} /> : <UserPlus size={16} />}
            {showsFollowing ? "Deixar de seguir" : "Seguir"}
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => void run(onBlock)}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-danger hover:bg-background"
          >
            <Ban size={16} />
            Bloquear
          </button>
        </div>
      ) : null}
    </div>
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
