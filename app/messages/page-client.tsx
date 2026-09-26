"use client";

import { Suspense, useEffect, useState } from "react";

import { useSearchParams } from "next/navigation";

import { ChevronLeft, Plus, Search, Send, Users, X } from "lucide-react";

import { onAuthStateChanged } from "firebase/auth";

import { FormHeader } from "@/components/FormHeader";
import { Screen } from "@/components/Screen";
import { Avatar, EmptyState } from "@/components/ui";
import { useBackendUserSearch } from "@/hooks/use-backend-user-search";

import { backendUserToLocalUser } from "@/lib/backend-user";
import { auth } from "@/lib/firebase";

import {
  ApiError,
  createConversation,
  fetchConversationMessages,
  fetchConversations,
  fetchCircles,
  markConversationRead,
  sendConversationMessage,
  type BackendConversation,
  type BackendCircle,
  type BackendMessage,
} from "@/lib/api";

import { useWishbox } from "@/store/wishbox-store";

export default function MessagesPage() {
  return (
    <Suspense fallback={null}>
      <MessagesContent />
    </Suspense>
  );
}

function MessagesContent() {
  const params = useSearchParams();
  const targetUserId = params.get("u");
  const targetConversationId = params.get("conversationId");
  const sharedText = params.get("text") ?? "";

  const { backendUser } = useWishbox();

  const [conversations, setConversations] = useState<
    BackendConversation[]
  >([]);

  const [active, setActive] =
    useState<BackendConversation | null>(null);

  const [messages, setMessages] = useState<BackendMessage[]>([]);

  const [text, setText] = useState(sharedText);
  const [circles, setCircles] = useState<BackendCircle[]>([]);
  const [composing, setComposing] = useState(false);
  const [query, setQuery] = useState("");
  const [groupName, setGroupName] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const { users: searchedUsers, loading: searchingUsers } =
    useBackendUserSearch(query, backendUser?.id);

  const [loading, setLoading] = useState(Boolean(auth));

  const [sending, setSending] = useState(false);

  const [error, setError] = useState<string | null>(
    auth
      ? null
      : "Sessão indisponível para acessar as mensagens.",
  );

  useEffect(() => {
    if (!auth) {
      return;
    }

    let alive = true;

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser) {
        if (alive) {
          setError(
            "Sessão indisponível para acessar as mensagens.",
          );
          setLoading(false);
        }

        return;
      }

      void (async () => {
        try {
          setLoading(true);
          setError(null);

          const token = await firebaseUser.getIdToken();

          const [inbox, circlePage] = await Promise.all([
            fetchConversations(token, { pageSize: 100 }),
            fetchCircles(token),
          ]);

          if (!alive) return;

          setConversations(inbox.data);
          setCircles(circlePage.data);

          if (targetUserId || targetConversationId) {
            const existing = targetConversationId
              ? inbox.data.find(
                  (conversation) => conversation.id === targetConversationId,
                )
              : inbox.data.find(
                  (conversation) =>
                    conversation.type === "direct" &&
                    conversation.otherUser?.id === targetUserId,
                );

            const conversation =
              existing ??
              (targetUserId
                ? await createConversation(token, { recipientId: targetUserId })
                : null);

            if (!conversation) {
              throw new ApiError("Conversa não encontrada.", 404);
            }

            const page =
              await fetchConversationMessages(
                token,
                conversation.id,
              );

            await markConversationRead(
              token,
              conversation.id,
            );

            if (!alive) return;

            setActive(conversation);
            setMessages(page.data);
          } else {
            setActive(null);
            setMessages([]);
          }
        } catch (requestError) {
          if (alive) {
            setError(
              requestError instanceof ApiError
                ? requestError.message
                : "Não foi possível carregar as mensagens agora.",
            );
          }
        } finally {
          if (alive) {
            setLoading(false);
          }
        }
      })();
    });

    return () => {
      alive = false;
      unsubscribe();
    };
  }, [targetConversationId, targetUserId]);

  const conversationTitle = (conversation: BackendConversation) => {
    if (conversation.type === "group") {
      return conversation.name?.trim() || "Conversa em grupo";
    }
    return conversation.otherUser
      ? backendUserToLocalUser(conversation.otherUser).name
      : "Conversa direta";
  };

  const createNewConversation = async (
    input: { recipientId: string } | { recipientIds: string[]; name?: string } | { circleId: string },
  ) => {
    const firebaseUser = auth?.currentUser;
    if (!firebaseUser || sending) return;
    try {
      setSending(true);
      setError(null);
      const token = await firebaseUser.getIdToken();
      const conversation = await createConversation(token, input);
      setConversations((current) => [
        conversation,
        ...current.filter((item) => item.id !== conversation.id),
      ]);
      setActive(conversation);
      setMessages([]);
      setComposing(false);
      setQuery("");
      setGroupName("");
      setSelectedUserIds([]);
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : "Não foi possível criar a conversa agora.",
      );
    } finally {
      setSending(false);
    }
  };

  const openConversation = async (
    conversation: BackendConversation,
  ) => {
    const firebaseUser = auth?.currentUser;

    if (!firebaseUser) {
      setError(
        "Sessão indisponível para acessar as mensagens.",
      );
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const token = await firebaseUser.getIdToken();

      const page =
        await fetchConversationMessages(
          token,
          conversation.id,
        );

      await markConversationRead(
        token,
        conversation.id,
      );

      setActive(conversation);
      setMessages(page.data);

      setConversations((current) =>
        current.map((item) =>
          item.id === conversation.id
            ? {
                ...item,
                unreadCount: 0,
              }
            : item,
        ),
      );
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : "Não foi possível abrir a conversa agora.",
      );
    } finally {
      setLoading(false);
    }
  };

  const send = async () => {
    const content = text.trim();

    if (!content || !active || sending) {
      return;
    }

    const firebaseUser = auth?.currentUser;

    if (!firebaseUser) {
      setError(
        "Sessão indisponível para enviar mensagens.",
      );
      return;
    }

    try {
      setSending(true);
      setError(null);

      const token = await firebaseUser.getIdToken();

      const created =
        await sendConversationMessage(
          token,
          active.id,
          content,
        );

      setMessages((current) => [
        ...current,
        created,
      ]);

      setText("");
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : "Não foi possível enviar a mensagem agora.",
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <Screen>
      <FormHeader />

      {!active ? (
        <button
          type="button"
          onClick={() => setComposing((value) => !value)}
          className="flex w-fit items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-bold text-white"
        >
          {composing ? <X size={16} /> : <Plus size={16} />}
          {composing ? "Cancelar" : "Nova conversa"}
        </button>
      ) : null}

      {composing && !active ? (
        <section className="rounded-lg border border-border bg-card p-4">
          <h2 className="text-sm font-bold text-foreground">Iniciar conversa</h2>
          <p className="mt-1 text-xs text-muted">
            Selecione uma pessoa para um chat direto ou várias para criar um grupo.
          </p>

          {circles.length > 0 ? (
            <div className="mt-4">
              <p className="text-xs font-bold uppercase tracking-wide text-muted">Seus grupos</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {circles.map((circle) => (
                  <button
                    key={circle.id}
                    type="button"
                    disabled={sending}
                    onClick={() => void createNewConversation({ circleId: circle.id })}
                    className="flex items-center gap-2 rounded-full border border-border px-3 py-2 text-xs font-semibold"
                  >
                    <Users size={14} />
                    {circle.name}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <label className="mt-4 flex items-center gap-2 rounded-md border border-border bg-background px-3">
            <Search size={16} className="text-muted" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar pessoas"
              className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none"
            />
          </label>
          {searchingUsers ? <p className="mt-2 text-xs text-muted">Buscando…</p> : null}
          {searchedUsers.map((user) => {
            const selected = selectedUserIds.includes(user.id);
            return (
              <button
                key={user.id}
                type="button"
                onClick={() =>
                  setSelectedUserIds((current) =>
                    selected
                      ? current.filter((id) => id !== user.id)
                      : [...current, user.id],
                  )
                }
                className={`mt-2 flex w-full items-center gap-3 rounded-md border p-2.5 text-left ${selected ? "border-primary bg-primary-soft" : "border-border"}`}
              >
                <Avatar photo={user.photo} emoji={user.emoji} tint={user.tint} size={34} />
                <span className="min-w-0 flex-1 truncate text-sm font-semibold">{user.name}</span>
                <span className="text-xs font-bold text-primary">{selected ? "Selecionado" : "Selecionar"}</span>
              </button>
            );
          })}

          {selectedUserIds.length > 1 ? (
            <input
              value={groupName}
              onChange={(event) => setGroupName(event.target.value)}
              placeholder="Nome do grupo (opcional)"
              className="mt-3 h-11 w-full rounded-md border border-border bg-background px-3 text-sm outline-none"
            />
          ) : null}
          {selectedUserIds.length > 0 ? (
            <button
              type="button"
              disabled={sending}
              onClick={() =>
                void createNewConversation(
                  selectedUserIds.length === 1
                    ? { recipientId: selectedUserIds[0]! }
                    : { recipientIds: selectedUserIds, name: groupName.trim() || undefined },
                )
              }
              className="mt-3 w-full rounded-md bg-primary px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
            >
              {selectedUserIds.length === 1 ? "Iniciar conversa" : `Criar grupo com ${selectedUserIds.length} pessoas`}
            </button>
          ) : null}
        </section>
      ) : null}

      {active ? (
        <div className="flex flex-1 flex-col gap-4">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              aria-label="Voltar para conversas"
              onClick={() => {
                setActive(null);
                setMessages([]);
              }}
              className="flex size-9 items-center justify-center"
            >
              <ChevronLeft size={20} />
            </button>
            <Avatar
              photo={active.type === "direct" ? active.otherUser?.avatarPath : undefined}
              emoji={active.type === "group" ? "👥" : "👤"}
              size={36}
            />

            <div>
              <p className="text-sm font-bold text-foreground">
                {conversationTitle(active)}
              </p>
              {active.type === "group" ? (
                <p className="text-xs text-muted">
                  {active.participants.length} participantes
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto">
            {messages.map((message) => (
              <div
                key={message.id}
                className={
                  message.senderId === backendUser?.id
                    ? "ml-auto max-w-[75%] rounded-lg bg-primary px-3.5 py-2.5 text-sm text-white"
                    : "mr-auto max-w-[75%] rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm text-foreground"
                }
              >
                {active.type === "group" && message.senderId !== backendUser?.id ? (
                  <p className="mb-1 text-[10px] font-bold text-primary">
                    {active.participants.find((participant) => participant.id === message.senderId)
                      ? backendUserToLocalUser(
                          active.participants.find((participant) => participant.id === message.senderId)!,
                        ).name
                      : "Participante"}
                  </p>
                ) : null}
                {message.content}
              </div>
            ))}
          </div>

          {error ? (
            <p
              role="alert"
              className="text-xs font-medium text-(--color-danger)"
            >
              {error}
            </p>
          ) : null}

          <div className="flex items-center gap-2">
            <input
              value={text}
              onChange={(event) =>
                setText(event.target.value)
              }
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  !event.shiftKey
                ) {
                  event.preventDefault();
                  void send();
                }
              }}
              placeholder="Escreva uma mensagem"
              disabled={sending}
              className="h-11 flex-1 rounded-md border border-border bg-card px-3.5 text-sm text-foreground placeholder:text-muted focus:outline-none disabled:opacity-60"
            />

            <button
              type="button"
              aria-label="Enviar mensagem"
              disabled={
                sending || !text.trim()
              }
              onClick={() => void send()}
              className="flex size-11 items-center justify-center rounded-md bg-primary text-white disabled:opacity-60"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      ) : loading ? (
        <p className="text-sm text-muted">
          Carregando…
        </p>
      ) : error ? (
        <EmptyState
          emoji="⚠️"
          title="Não foi possível carregar"
          description={error}
        />
      ) : conversations.length === 0 ? (
        <EmptyState
          emoji="💬"
          title="Nenhuma conversa"
          description="Suas conversas aparecem aqui."
        />
      ) : (
        <div className="flex flex-col gap-2">
          {conversations.map((conversation) => {
            const otherUser = conversation.otherUser
              ? backendUserToLocalUser(conversation.otherUser)
              : undefined;

            return (
              <button
                key={conversation.id}
                type="button"
                onClick={() =>
                  void openConversation(
                    conversation,
                  )
                }
                className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 text-left shadow-card"
              >
                <Avatar
                  photo={conversation.type === "direct" ? otherUser?.photo : undefined}
                  emoji={conversation.type === "group" ? "👥" : otherUser?.emoji}
                  tint={otherUser?.tint}
                />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-foreground">
                    {conversationTitle(conversation)}
                  </p>

                  {conversation.type === "group" ? (
                    <p className="truncate text-[11px] text-muted">
                      {conversation.participants.length} participantes
                    </p>
                  ) : null}

                  <p className="truncate text-xs text-muted">
                    {conversation.lastMessage?.content ??
                      "Sem mensagens"}
                  </p>
                </div>

                {conversation.unreadCount > 0 ? (
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                    {conversation.unreadCount}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      )}
    </Screen>
  );
}
