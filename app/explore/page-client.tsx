"use client";

import { useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { ListCard } from "@/components/Cards";
import { FormHeader } from "@/components/FormHeader";
import { Screen } from "@/components/Screen";
import { Avatar, EmptyState } from "@/components/ui";
import { useBackendExploreSearch } from "@/hooks/use-backend-explore-search";
import { useWishbox } from "@/store/wishbox-store";

export default function ExplorePage() {
  const { backendUser } = useWishbox();
  const [query, setQuery] = useState("");
  const { users, lists, error, loading } = useBackendExploreSearch(query, backendUser?.id);

  return (
    <Screen>
      <FormHeader />

      <div className="flex h-[46px] items-center gap-2 rounded-md border border-border bg-card px-3.5">
        <Search size={16} className="text-muted" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar pessoas ou listas"
          className="h-full flex-1 bg-transparent text-sm text-foreground placeholder:text-muted focus:outline-none"
        />
      </div>

      {loading ? (
        <p className="text-sm text-muted">Buscando…</p>
      ) : error ? (
        <EmptyState emoji="⚠️" title="Não foi possível buscar" description={error} />
      ) : !query.trim() ? (
        <EmptyState emoji="🔍" title="Busque pessoas ou listas" description="Digite um nome ou @usuário." />
      ) : users.length === 0 && lists.length === 0 ? (
        <EmptyState emoji="🤔" title="Nada encontrado" />
      ) : (
        <div className="flex flex-col gap-6">
          {users.length > 0 ? (
            <section className="flex flex-col gap-2">
              <h2 className="text-sm font-bold text-foreground">Pessoas</h2>
              {users.map((user) => (
                <Link
                  key={user.id}
                  href={`/profile/${user.username}`}
                  className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 shadow-[0_6px_14px_-2px_rgba(27,27,51,0.06)]"
                >
                  <Avatar photo={user.photo} emoji={user.emoji} tint={user.tint} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-foreground">{user.name}</p>
                    <p className="truncate text-xs text-muted">@{user.username}</p>
                  </div>
                </Link>
              ))}
            </section>
          ) : null}

          {lists.length > 0 ? (
            <section className="flex flex-col gap-2">
              <h2 className="text-sm font-bold text-foreground">Listas</h2>
              <div className="grid grid-cols-2 gap-4">
                {lists.map((list) => (
                  <ListCard key={list.id} list={list} count={0} />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}
    </Screen>
  );
}
