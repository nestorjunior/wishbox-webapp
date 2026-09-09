"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Send } from "lucide-react";
import { FormHeader } from "@/components/FormHeader";
import { Screen } from "@/components/Screen";
import { Avatar, EmptyState } from "@/components/ui";
import { backendUserToLocalUser } from "@/lib/backend-user";
import { auth } from "@/lib/firebase";
import {
  ApiError,
  createConversation,
  fetchConversationMessages,
  fetchConversations,
  markConversationRead,
  sendConversationMessage,
  type BackendConversation,
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
  const { backendUser } = useWishbox();
  const [conversations, setConversations] = useState<BackendConversation[]>([]);
  const [active, setActive] = useState<BackendConversation | null>(null);
  const [messages, setMessages] = useState<BackendMessage[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    void (async () => {
      const firebaseUser = auth?.currentUser;
      if (!firebaseUser) {
        if (alive) {
          setError("Sessão indisponível para acessar as mensagens.");
          setLoading(false);
        }
        return;
      }

      try {
        const token = await firebaseUser.getIdToken();
        const inbox = await fetchConversations(token);
        if (!alive) return;
        setConversations(inbox.data);

        if (targetUserId) {
          const existing = inbox.data.find((c) => c.otherUser.id === targetUserId);
          const conversation = existing ?? (await createConversation(token, targetUserId));
          const page = await fetchConversationMessages(token, conversation.id);
          await markConversationRead(token, conversation.id);
          if (!alive) return;
          setActive(conversation);
          setMessages(page.data);
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
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [targetUserId]);

  const openConversation = async (conversation: BackendConversation) => {
    const firebaseUser = auth?.currentUser;
    if (!firebaseUser) return;
    try {
      setLoading(true);
      setError(null);
      const token = await firebaseUser.getIdToken();
      const page = await fetchConversationMessages(token, conversation.id);
      await markConversationRead(token, conversation.id);
      setActive(conversation);
      setMessages(page.data);
      setConversations((current) =>
        current.map((item) => (item.id === conversation.id ? { ...item, unreadCount: 0 } : item)),
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
    if (!content || !active || sending) return;
    const firebaseUser = auth?.currentUser;
    if (!firebaseUser) {
      setError("Sessão indisponível para enviar mensagens.");
      return;
    }

    try {
      setSending(true);
      setError(null);
      const token = await firebaseUser.getIdToken();
      const created = await sendConversationMessage(token, active.id, content);
      setMessages((current) => [...current, created]);
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

      {active ? (
        <div className="flex flex-1 flex-col gap-4">
          <div className="flex items-center gap-2.5">
            <Avatar
              photo={active.otherUser.avatarPath}
              emoji="👤"
              size={36}
            />
            <p className="text-sm font-bold text-foreground">
              {backendUserToLocalUser(active.otherUser).name}
            </p>
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
                {message.content}
              </div>
            ))}
          </div>

          {error ? (
            <p role="alert" className="text-xs font-medium text-(--color-danger)">
              {error}
            </p>
          ) : null}

          <div className="flex items-center gap-2">
            <input
              value={text}
              onChange={(event) => setText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
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
              disabled={sending || !text.trim()}
              onClick={() => void send()}
              className="flex size-11 items-center justify-center rounded-md bg-primary text-white disabled:opacity-60"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      ) : loading ? (
        <p className="text-sm text-muted">Carregando…</p>
      ) : error ? (
        <EmptyState emoji="⚠️" title="Não foi possível carregar" description={error} />
      ) : conversations.length === 0 ? (
        <EmptyState emoji="💬" title="Nenhuma conversa" description="Suas conversas aparecem aqui." />
      ) : (
        <div className="flex flex-col gap-2">
          {conversations.map((conversation) => {
            const otherUser = backendUserToLocalUser(conversation.otherUser);
            return (
              <button
                key={conversation.id}
                type="button"
                onClick={() => void openConversation(conversation)}
                className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 text-left shadow-[0_6px_14px_-2px_rgba(27,27,51,0.06)]"
              >
                <Avatar photo={otherUser.photo} emoji={otherUser.emoji} tint={otherUser.tint} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-foreground">{otherUser.name}</p>
                  <p className="truncate text-xs text-muted">
                    {conversation.lastMessage?.content ?? "Sem mensagens"}
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