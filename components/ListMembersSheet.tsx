"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Eye, LockKeyhole, Pencil, Search, X } from "lucide-react";
import { Avatar } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { useBackendUserSearch } from "@/hooks/use-backend-user-search";
import { addListMember, ApiError, fetchListMembers } from "@/lib/api";
import type { GiftList, ListRole, User } from "@/lib/data";
import { auth } from "@/lib/firebase";
import { useWishbox } from "@/store/wishbox-store";

const errorMessage = (error: unknown) =>
  error instanceof ApiError
    ? error.message
    : "Não foi possível convidar essas pessoas agora.";

type Selection = { user: User; role: "viewer" | "editor" };

export function ListMembersSheet({ list, visible, onClose }: { list: GiftList; visible: boolean; onClose: () => void }) {
  const { backendUser, dispatch } = useWishbox();
  const { showToast } = useToast();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Record<string, Selection>>({});
  const [submitting, setSubmitting] = useState(false);
  const { users, loading, error } = useBackendUserSearch(query, backendUser?.id, true);
  const memberIds = useMemo(() => new Set((list.members ?? []).map((member) => member.userId)), [list.members]);
  const candidates = users.filter((user) => !memberIds.has(user.id));
  const selections = Object.values(selected);

  useEffect(() => {
    if (!visible) return;
    const firebaseUser = auth?.currentUser;
    if (!firebaseUser) return;
    void firebaseUser.getIdToken().then((token) => fetchListMembers(token, list.id)).then((members) => {
      dispatch({ type: "list/set-members", id: list.id, members: members.map(({ userId, role }) => ({ userId, role })) });
    }).catch(() => undefined);
  }, [dispatch, list.id, visible]);

  const close = () => {
    setQuery("");
    setSelected({});
    onClose();
  };

  const toggle = (user: User) => setSelected((current) => {
    if (current[user.id]) {
      const next = { ...current };
      delete next[user.id];
      return next;
    }
    return { ...current, [user.id]: { user, role: "viewer" } };
  });

  const setRole = (userId: string, role: "viewer" | "editor") =>
    setSelected((current) => ({ ...current, [userId]: { ...current[userId], role } }));

  const submit = async () => {
    const firebaseUser = auth?.currentUser;
    if (selections.length === 0) {
      close();
      return;
    }
    if (!firebaseUser || submitting) return;
    setSubmitting(true);
    try {
      const token = await firebaseUser.getIdToken();
      const members = await Promise.all(selections.map(({ user, role }) => addListMember(token, list.id, user.id, role)));
      members.forEach((member) => dispatch({ type: "list/set-member", id: list.id, userId: member.userId, role: member.role as ListRole }));
      showToast({ text: selections.length === 1 ? "Pessoa convidada para a lista." : `${selections.length} pessoas convidadas para a lista.` });
      close();
    } catch (requestError) {
      showToast({ text: errorMessage(requestError), tone: "warning" });
    } finally {
      setSubmitting(false);
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-end justify-center">
      <button type="button" aria-label="Fechar" onClick={close} className="absolute inset-0 bg-[rgba(20,20,28,0.72)]" />
      <section role="dialog" aria-modal="true" aria-labelledby="invite-title" className="relative flex h-[71vh] max-h-[640px] min-h-[520px] w-full max-w-[960px] flex-col rounded-t-xl bg-background px-[18px] pt-3 pb-5 shadow-xl">
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-border" />
        <div className="flex items-center justify-between">
          <h2 id="invite-title" className="text-[17px] font-bold">Convidar pessoas</h2>
          <button type="button" aria-label="Fechar" onClick={close} className="p-1 text-muted"><X size={19} /></button>
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-xl bg-primary-soft/50 px-3 py-3 text-muted">
          <LockKeyhole size={14} className="shrink-0" />
          <p className="text-xs leading-5">Esta lista é especial: só quem você convidar consegue ver. Selecione os amigos e escolha se cada um pode apenas ver ou também editar.</p>
        </div>

        <label className="mt-4 flex items-center gap-2 rounded-xl border border-border bg-card px-3 shadow-sm">
          <Search size={17} className="text-muted" />
          <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Selecionar amigos" className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none" />
        </label>

        {selections.length > 0 ? (
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {selections.map(({ user }) => (
              <button key={user.id} type="button" onClick={() => toggle(user)} className="flex shrink-0 items-center gap-1.5 rounded-full bg-background py-1 pr-2 pl-1 text-xs font-semibold">
                <Avatar photo={user.photo} emoji={user.emoji} tint={user.tint} size={22} />{user.name.split(" ")[0]}<X size={12} className="text-muted" />
              </button>
            ))}
          </div>
        ) : null}

        <div className="mt-3 min-h-0 flex-1 overflow-y-auto">
          {query.trim().length > 0 && query.trim().length < 3 ? <p className="py-8 text-center text-sm text-muted">Digite pelo menos 3 caracteres para encontrar amigos.</p> : null}
          {loading ? <p className="py-8 text-center text-sm text-muted">Buscando amigos...</p> : null}
          {error ? <p className="py-8 text-center text-sm text-danger">{error}</p> : null}
          {!loading && (query.trim().length === 0 || query.trim().length >= 3) && candidates.length === 0 && !error ? <p className="py-8 text-center text-sm text-muted">Nenhuma pessoa encontrada.</p> : null}
          {candidates.map((user) => {
            const selection = selected[user.id];
            return (
              <div key={user.id} className="flex items-center gap-3 py-2">
                <button type="button" aria-label={`${selection ? "Desmarcar" : "Selecionar"} ${user.name}`} onClick={() => toggle(user)} className={`flex size-5 shrink-0 items-center justify-center rounded-md border ${selection ? "border-muted bg-background" : "border-border"}`}>
                  {selection ? <Check size={14} /> : null}
                </button>
                <Avatar photo={user.photo} emoji={user.emoji} tint={user.tint} size={38} />
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{user.name}</p><p className="truncate text-xs text-muted">@{user.username}</p></div>
                {selection ? <div className="flex rounded-xl bg-background p-0.5 text-xs">
                  <button type="button" onClick={() => setRole(user.id, "viewer")} className={`flex items-center gap-1 rounded-lg px-2.5 py-2 ${selection.role === "viewer" ? "bg-card shadow-sm" : "text-muted"}`}><Eye size={14} /> Ver</button>
                  <button type="button" onClick={() => setRole(user.id, "editor")} className={`flex items-center gap-1 rounded-lg px-2.5 py-2 ${selection.role === "editor" ? "bg-card shadow-sm" : "text-muted"}`}><Pencil size={14} /> Editar</button>
                </div> : null}
              </div>
            );
          })}
        </div>

        <button type="button" disabled={submitting} onClick={() => void submit()} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-white shadow-primary disabled:opacity-50">
          <Check size={16} /> {submitting ? "Convidando..." : "Concluir"}
        </button>
      </section>
    </div>
  );
}
