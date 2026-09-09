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

export function useBackendExploreSearch(
  query: string,
  excludedUserId?: string,
) {
  const term = query.trim().toLowerCase();
  const [state, setState] = useState<ExploreState>(initialState);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (term.length < 3) {
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
              error: "Sessão indisponível.",
            });
          }
          return;
        }

        setLoading(true);

        try {
          const token = await firebaseUser.getIdToken();

          // Use the same user-search strategy as the Connections screen.
          let users = (
            await autocompleteBackendUsers(token, term, { limit: 20 })
          )
            .map(backendUserToLocalUser)
            .filter((user) => user.id !== excludedUserId);

          // Keep the same fallback used by Connections when autocomplete
          // does not return a result.
          if (users.length === 0) {
            users = (await fetchBackendUsers(token))
              .map(backendUserToLocalUser)
              .filter(
                (user) =>
                  user.id !== excludedUserId &&
                  (user.username.toLowerCase().includes(term) ||
                    user.name.toLowerCase().includes(term)),
              )
              .slice(0, 20);
          }

          // Loading lists must not make an otherwise valid user search fail.
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

          if (active) {
            setState({
              term,
              users,
              lists: listGroups.flat(),
              error: null,
            });
          }
        } catch (error) {
          if (active) {
            setState({
              term,
              users: [],
              lists: [],
              error: errorMessage(error),
            });
          }
        } finally {
          if (active) {
            setLoading(false);
          }
        }
      })();
    }, 250);

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [excludedUserId, term]);

  const current = state.term === term;
  const hasSearchTerm = term.length >= 3;

  return {
    users: hasSearchTerm && current ? state.users : [],
    lists: hasSearchTerm && current ? state.lists : [],
    error: hasSearchTerm && current ? state.error : null,
    loading: hasSearchTerm && (!current || loading),
  };
}
