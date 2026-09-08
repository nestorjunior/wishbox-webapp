"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { UserMinus, UserPlus } from "lucide-react";
import { ListCard } from "@/components/Cards";
import { FormHeader } from "@/components/FormHeader";
import { Screen } from "@/components/Screen";
import { Avatar, Button, EmptyState } from "@/components/ui";
import { auth } from "@/lib/firebase";
import { ApiError, fetchUserListDetail, fetchUserLists } from "@/lib/api";
import { toLocalProduct, useWishbox } from "@/store/wishbox-store";
import type { GiftList } from "@/lib/data";

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const {
    me,
    userByUsername,
    listsOf,
    productsOf,
    isConnected,
    followStateForUser,
    followUser,
    unfollowUser,
    acceptFollowRequest,
    cancelFollowRequest,
    dispatch,
  } = useWishbox();
  const user = userByUsername(String(username));
  const userId = user?.id;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const canViewPrivateLists = Boolean(
    user && (user.id === me?.id || user.privacy === "public" || isConnected(user.id)),
  );

  useEffect(() => {
    if (!userId) return;
    let active = true;

    void (async () => {
      const firebaseUser = auth?.currentUser;
      if (!firebaseUser) return;

      try {
        setLoading(true);
        setError(null);
        const token = await firebaseUser.getIdToken();
        const response = await fetchUserLists(token, userId, { pageSize: 50 });
        if (!active) return;

        const lists: GiftList[] = response.data.map((list) => ({
          id: list.id,
          ownerId: list.ownerId,
          name: list.name,
          description: list.description ?? "",
          emoji: "🎁",
          tint: "lilac",
          privacy: list.private
            ? list.listType === "collaborative"
              ? "guests"
              : "private"
            : "public",
          paused: false,
          category: "personalizada",
          members: (list.members ?? []).map((member) => ({
            userId: member.userId,
            role: member.role,
          })),
          inviteMessage: list.inviteMessage,
        }));

        const details = await Promise.all(
          lists.map((list) => fetchUserListDetail(token, userId, list.id, { itemsPageSize: 100 })),
        );
        const products = details.flatMap((detail, index) =>
          (detail.items?.data ?? [])
            .filter((entry) => entry.item)
            .map((entry) => toLocalProduct(entry.item!, lists[index]!.id)),
        );

        if (!active) return;
        dispatch({ type: "lists/hydrate", lists });
        dispatch({ type: "products/hydrate", products });
      } catch (requestError) {
        if (active) {
          setError(
            requestError instanceof ApiError
              ? requestError.message
              : "Não foi possível carregar as listas agora.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [dispatch, userId]);

  if (!user) {
    return (
      <Screen>
        <FormHeader />
        <EmptyState emoji="🤔" title="Perfil não encontrado" />
      </Screen>
    );
  }

  const lists = listsOf(user.id, !canViewPrivateLists);
  const followState = followStateForUser(user.id);
  const isMe = user.id === me?.id;

  return (
    <Screen>
      <FormHeader />

      <div className="flex items-center gap-3">
        <Avatar photo={user.photo} emoji={user.emoji} tint={user.tint} size={64} />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-extrabold text-foreground">{user.name}</h1>
          <p className="truncate text-sm text-muted">@{user.username}</p>
        </div>
      </div>
      {user.bio ? <p className="text-sm leading-6 text-muted">{user.bio}</p> : null}

      {!isMe ? (
        <div className="flex gap-2">
          {followState === "ACCEPTED" ? (
            <Button
              title="Deixar de seguir"
              icon={<UserMinus size={16} />}
              variant="outline"
              loading={busy}
              onClick={async () => {
                setBusy(true);
                await unfollowUser(user.id).finally(() => setBusy(false));
              }}
            />
          ) : followState === "PENDING_SENT" ? (
            <Button
              title="Cancelar solicitação"
              variant="outline"
              loading={busy}
              onClick={async () => {
                setBusy(true);
                await cancelFollowRequest(user.id).finally(() => setBusy(false));
              }}
            />
          ) : followState === "PENDING_RECEIVED" ? (
            <Button
              title="Aceitar solicitação"
              loading={busy}
              onClick={async () => {
                setBusy(true);
                await acceptFollowRequest(user.id).finally(() => setBusy(false));
              }}
            />
          ) : (
            <Button
              title="Seguir"
              icon={<UserPlus size={16} />}
              loading={busy}
              onClick={async () => {
                setBusy(true);
                await followUser(user.id).finally(() => setBusy(false));
              }}
            />
          )}
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted">Carregando listas…</p>
      ) : error ? (
        <EmptyState emoji="⚠️" title="Não foi possível carregar" description={error} />
      ) : lists.length === 0 ? (
        <EmptyState emoji="🎁" title="Nenhuma lista pública" />
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {lists.map((list) => (
            <ListCard key={list.id} list={list} count={productsOf(list.id).length} />
          ))}
        </div>
      )}
    </Screen>
  );
}
