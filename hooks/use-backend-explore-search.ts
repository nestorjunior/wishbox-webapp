import { useEffect, useState } from "react";
import { backendUserToLocalUser } from "@/lib/backend-user";
import { auth } from "@/lib/firebase";
import { ApiError, fetchUserLists, searchBackendUsers } from "@/lib/api";
import type { GiftList, User } from "@/lib/data/types";
import type { BackendList } from "@/lib/api";

type ExploreList = GiftList & { owner: User };

type ExploreState = {
  term: string;
  users: User[];
  lists: ExploreList[];
  error: string | null;
};

const initialState: ExploreState = { term: "", users: [], lists: [], error: null };

function toExploreList(list: BackendList, owner: User): ExploreList {
  return {
    id: list.id,
    ownerId: list.ownerId,
    name: list.name,
    description: list.description ?? "",
    emoji: "🎁",
    tint: "lilac",
    privacy: list.private ? "private" : "public",
    paused: false,
    category: "personalizada",
    owner,
  };
}

function errorMessage(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : "Não foi possível buscar pessoas e listas agora.";
}

export function useBackendExploreSearch(query: string, excludedUserId?: string) {
  const term = query.trim().toLowerCase();
  const [state, setState] = useState<ExploreState>(initialState);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!term) return;
    let active = true;
    const timeout = setTimeout(() => {
      void (async () => {
        const firebaseUser = auth?.currentUser;
        if (!firebaseUser) {
          if (active) setState({ term, users: [], lists: [], error: "Sessão indisponível." });
          return;
        }

        setLoading(true);
        try {
          const token = await firebaseUser.getIdToken();
          const response = await searchBackendUsers(token, term, { pageSize: 50 });
          const users = response.data
            .filter((user) => user.id !== excludedUserId)
            .map(backendUserToLocalUser);
          const listGroups = await Promise.all(
            users.map(async (user) => {
              const result = await fetchUserLists(token, user.id, { pageSize: 50 });
              return result.data
                .filter((list) => !list.private)
                .map((list) => toExploreList(list, user));
            })
          );

          if (active) setState({ term, users, lists: listGroups.flat(), error: null });
        } catch (error) {
          if (active) setState({ term, users: [], lists: [], error: errorMessage(error) });
        } finally {
          if (active) setLoading(false);
        }
      })();
    }, 250);

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [excludedUserId, term]);

  const current = state.term === term;
  return {
    users: current ? state.users : [],
    lists: current ? state.lists : [],
    error: current ? state.error : null,
    loading: Boolean(term) && (!current || loading),
  };
}
