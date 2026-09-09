import { useEffect, useState } from "react";
import { backendUserToLocalUser } from "@/lib/backend-user";
import { auth } from "@/lib/firebase";
import {
  ApiError,
  autocompleteBackendUsers,
  fetchBackendUsers,
  fetchUserLists,
} from "@/lib/api";
import type { BackendList } from "@/lib/api";
import type { GiftList, User } from "@/lib/data/types";

type ExploreList = GiftList & { owner: User };

type ExploreState = {
  term: string;
  users: User[];
  lists: ExploreList[];
  error: string | null;
};

const initialState: ExploreState = {
  term: "",
  users: [],
  lists: [],
  error: null,
};

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

function matchesSearchTerm(user: User, term: string) {
  const normalizedTerm = term.toLocaleLowerCase();
  return (
    user.name.toLocaleLowerCase().includes(normalizedTerm) ||
    user.username.toLocaleLowerCase().includes(normalizedTerm)
  );
}

export function useBackendExploreSearch(
  query: string,
  excludedUserId?: string,
) {
  const term = query.trim();
  const [state, setState] = useState<ExploreState>(initialState);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (term.length < 3) {
      setState(initialState);
      setLoading(false);
      return;
    }

    let active = true;

    const timeout = setTimeout(() => {
      void (async () => {
        const firebaseUser = auth?.currentUser;

        if (!firebaseUser) {
          if (active) {
            setState({
              term,
              users: [],
              lists: [],
              error: "Sessão indisponível para buscar usuários.",
            });
            setLoading(false);
          }
          return;
        }

        if (active) {
          setState({
            term,
            users: [],
            lists: [],
            error: null,
          });
          setLoading(true);
        }

        try {
          const token = await firebaseUser.getIdToken();

          // Use exactly the same user-search strategy as Conexões.
          let users = (
            await autocompleteBackendUsers(token, term, { limit: 20 })
          )
            .map(backendUserToLocalUser)
            .filter((user) => user.id !== excludedUserId)
            .filter((user) => matchesSearchTerm(user, term));

          // Same fallback used by Conexões.
          if (users.length === 0) {
            users = (await fetchBackendUsers(token))
              .map(backendUserToLocalUser)
              .filter((user) => user.id !== excludedUserId)
              .filter((user) => matchesSearchTerm(user, term))
              .slice(0, 20);
          }

          // IMPORTANT: failure loading one user's lists must NOT erase the
          // user-search results. The user result is independent from lists.
          const listGroups = await Promise.all(
            users.map(async (user) => {
              try {
                const result = await fetchUserLists(token, user.id, {
                  pageSize: 50,
                });

                return result.data
                  .filter((list) => !list.private)
                  .map((list) => toExploreList(list, user));
              } catch {
                return [];
              }
            }),
          );

          if (!active) return;

          setState({
            term,
            users,
            lists: listGroups.flat(),
            error: null,
          });
        } catch (error) {
          if (!active) return;

          setState({
            term,
            users: [],
            lists: [],
            error: errorMessage(error),
          });
        } finally {
          if (active) setLoading(false);
        }
      })();
    }, 120);

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [excludedUserId, term]);

  const hasCurrentTerm = term.length >= 3 && state.term === term;

  return {
    users: hasCurrentTerm ? state.users : [],
    lists: hasCurrentTerm ? state.lists : [],
    error: hasCurrentTerm ? state.error : null,
    loading: term.length >= 3 && (!hasCurrentTerm || loading),
  };
}
