import { useEffect, useState } from "react";
import { backendUserToLocalUser } from "@/lib/backend-user";
import { auth } from "@/lib/firebase";
import { ApiError, autocompleteBackendUsers, fetchBackendUsers } from "@/lib/api";
import type { User } from "@/lib/data/types";

type SearchState = {
  term: string;
  users: User[];
  error: string | null;
  loading: boolean;
};

const initialState: SearchState = {
  term: "",
  users: [],
  error: null,
  loading: false,
};

function getSearchErrorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message;
  return "Não foi possível buscar usuários agora.";
}

function matchesSearchTerm(user: User, term: string) {
  const normalizedTerm = term.toLocaleLowerCase();
  return (
    user.name.toLocaleLowerCase().includes(normalizedTerm) ||
    user.username.toLocaleLowerCase().includes(normalizedTerm)
  );
}

export function useBackendUserSearch(query: string, excludedUserId?: string) {
  const term = query.trim();
  const [state, setState] = useState<SearchState>(initialState);

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
              error: "Sessão indisponível para buscar usuários.",
              loading: false,
            });
          }
          return;
        }

        if (active) {
          setState({
            term,
            users: [],
            error: null,
            loading: true,
          });
        }

        try {
          const token = await firebaseUser.getIdToken();
          let users = (await autocompleteBackendUsers(token, term, { limit: 20 })).map(
            backendUserToLocalUser
          );

          if (users.length === 0) {
            users = (await fetchBackendUsers(token))
              .map(backendUserToLocalUser)
              .filter((user) => matchesSearchTerm(user, term))
              .slice(0, 20);
          }

          if (!active) return;

          setState({
            term,
            users: users
              .filter((user) => user.id !== excludedUserId)
              .filter((user) => matchesSearchTerm(user, term)),
            error: null,
            loading: false,
          });
        } catch (error) {
          if (!active) return;
          setState({
            term,
            users: [],
            error: getSearchErrorMessage(error),
            loading: false,
          });
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
    error: hasCurrentTerm ? state.error : null,
    loading: term.length >= 3 && (!hasCurrentTerm || state.loading),
  };
}
