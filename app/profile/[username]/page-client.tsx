// "use client";

// import { useEffect, useState } from "react";
// import { useParams } from "next/navigation";
// import { UserMinus, UserPlus } from "lucide-react";
// import { ListCard } from "@/components/Cards";
// import { FormHeader } from "@/components/FormHeader";
// import { Screen } from "@/components/Screen";
// import { Avatar, Button, EmptyState } from "@/components/ui";
// import { auth } from "@/lib/firebase";
// import { ApiError, fetchUserListDetail, fetchUserLists } from "@/lib/api";
// import { toLocalProduct, useWishbox } from "@/store/wishbox-store";
// import type { GiftList } from "@/lib/data";

// export default function ProfilePage() {
//   const { username } = useParams<{ username: string }>();
//   const {
//     me,
//     userByUsername,
//     listsOf,
//     productsOf,
//     isConnected,
//     followStateForUser,
//     followUser,
//     unfollowUser,
//     acceptFollowRequest,
//     cancelFollowRequest,
//     dispatch,
//   } = useWishbox();
//   const user = userByUsername(String(username));
//   const userId = user?.id;
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [busy, setBusy] = useState(false);

//   const canViewPrivateLists = Boolean(
//     user && (user.id === me?.id || user.privacy === "public" || isConnected(user.id)),
//   );

//   useEffect(() => {
//     if (!userId) return;
//     let active = true;

//     void (async () => {
//       const firebaseUser = auth?.currentUser;
//       if (!firebaseUser) return;

//       try {
//         setLoading(true);
//         setError(null);
//         const token = await firebaseUser.getIdToken();
//         const response = await fetchUserLists(token, userId, { pageSize: 50 });
//         if (!active) return;

//         const lists: GiftList[] = response.data.map((list) => ({
//           id: list.id,
//           ownerId: list.ownerId,
//           name: list.name,
//           description: list.description ?? "",
//           emoji: "🎁",
//           tint: "lilac",
//           privacy: list.private
//             ? list.listType === "collaborative"
//               ? "guests"
//               : "private"
//             : "public",
//           paused: false,
//           category: "personalizada",
//           members: (list.members ?? []).map((member) => ({
//             userId: member.userId,
//             role: member.role,
//           })),
//           inviteMessage: list.inviteMessage,
//         }));

//         const details = await Promise.all(
//           lists.map((list) => fetchUserListDetail(token, userId, list.id, { itemsPageSize: 100 })),
//         );
//         const products = details.flatMap((detail, index) =>
//           (detail.items?.data ?? [])
//             .filter((entry) => entry.item)
//             .map((entry) => toLocalProduct(entry.item!, lists[index]!.id)),
//         );

//         if (!active) return;
//         dispatch({ type: "lists/hydrate", lists });
//         dispatch({ type: "products/hydrate", products });
//       } catch (requestError) {
//         if (active) {
//           setError(
//             requestError instanceof ApiError
//               ? requestError.message
//               : "Não foi possível carregar as listas agora.",
//           );
//         }
//       } finally {
//         if (active) setLoading(false);
//       }
//     })();

//     return () => {
//       active = false;
//     };
//   }, [dispatch, userId]);

//   if (!user) {
//     return (
//       <Screen>
//         <FormHeader />
//         <EmptyState emoji="🤔" title="Perfil não encontrado" />
//       </Screen>
//     );
//   }

//   const lists = listsOf(user.id, !canViewPrivateLists);
//   const followState = followStateForUser(user.id);
//   const isMe = user.id === me?.id;

//   return (
//     <Screen>
//       <FormHeader />

//       <div className="flex items-center gap-3">
//         <Avatar photo={user.photo} emoji={user.emoji} tint={user.tint} size={64} />
//         <div className="min-w-0 flex-1">
//           <h1 className="truncate text-lg font-extrabold text-foreground">{user.name}</h1>
//           <p className="truncate text-sm text-muted">@{user.username}</p>
//         </div>
//       </div>
//       {user.bio ? <p className="text-sm leading-6 text-muted">{user.bio}</p> : null}

//       {!isMe ? (
//         <div className="flex gap-2">
//           {followState === "ACCEPTED" ? (
//             <Button
//               title="Deixar de seguir"
//               icon={<UserMinus size={16} />}
//               variant="outline"
//               loading={busy}
//               onClick={async () => {
//                 setBusy(true);
//                 await unfollowUser(user.id).finally(() => setBusy(false));
//               }}
//             />
//           ) : followState === "PENDING_SENT" ? (
//             <Button
//               title="Cancelar solicitação"
//               variant="outline"
//               loading={busy}
//               onClick={async () => {
//                 setBusy(true);
//                 await cancelFollowRequest(user.id).finally(() => setBusy(false));
//               }}
//             />
//           ) : followState === "PENDING_RECEIVED" ? (
//             <Button
//               title="Aceitar solicitação"
//               loading={busy}
//               onClick={async () => {
//                 setBusy(true);
//                 await acceptFollowRequest(user.id).finally(() => setBusy(false));
//               }}
//             />
//           ) : (
//             <Button
//               title="Seguir"
//               icon={<UserPlus size={16} />}
//               loading={busy}
//               onClick={async () => {
//                 setBusy(true);
//                 await followUser(user.id).finally(() => setBusy(false));
//               }}
//             />
//           )}
//         </div>
//       ) : null}

//       {loading ? (
//         <p className="text-sm text-muted">Carregando listas…</p>
//       ) : error ? (
//         <EmptyState emoji="⚠️" title="Não foi possível carregar" description={error} />
//       ) : lists.length === 0 ? (
//         <EmptyState emoji="🎁" title="Nenhuma lista pública" />
//       ) : (
//         <div className="grid grid-cols-2 gap-4">
//           {lists.map((list) => (
//             <ListCard key={list.id} list={list} count={productsOf(list.id).length} />
//           ))}
//         </div>
//       )}
//     </Screen>
//   );
// }

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
Ban,
ChevronDown,
MessageCircle,
UserMinus,
UserPlus,
} from "lucide-react";
import { ListCard } from "@/components/Cards";
import { FormHeader } from "@/components/FormHeader";
import { Screen } from "@/components/Screen";
import { Avatar, Button, Card, EmptyState } from "@/components/ui";
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
const [menuOpen, setMenuOpen] = useState(false);

const canViewPrivateLists = Boolean(
user &&
(user.id === me?.id ||
user.privacy === "public" ||
isConnected(user.id)),
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

    const response = await fetchUserLists(token, userId, {
      pageSize: 50,
    });

    if (!active) return;

    /*
     * Mantém o mesmo comportamento do Mobile:
     * somente listas públicas ficam disponíveis para quem
     * não pode visualizar conteúdo privado.
     */
    const visibleLists = response.data.filter(
      (list) =>
        !list.private ||
        (canViewPrivateLists &&
          (list.ownerId === userId ||
            (list.listType === "collaborative" &&
              (list.members ?? []).some(
                (member) => member.userId === userId,
              )))),
    );

    const lists: GiftList[] = visibleLists.map((list) => ({
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
      lists.map((list) =>
        fetchUserListDetail(token, userId, list.id, {
          itemsPageSize: 100,
        }),
      ),
    );

    const products = details.flatMap((detail, index) =>
      (detail.items?.data ?? [])
        .filter((entry) => entry.item)
        .map((entry) =>
          toLocalProduct(entry.item!, lists[index]!.id),
        ),
    );

    if (!active) return;

    dispatch({
      type: "lists/hydrate",
      lists,
    });

    dispatch({
      type: "products/hydrate",
      products,
    });
  } catch (requestError) {
    if (active) {
      setError(
        requestError instanceof ApiError
          ? requestError.status === 403
            ? "As listas privadas não estão disponíveis para você. As listas públicas continuam visíveis."
            : requestError.message
          : "Não foi possível carregar as listas públicas deste perfil.",
      );
    }
  } finally {
    if (active) {
      setLoading(false);
    }
  }
})();

return () => {
  active = false;
};

}, [dispatch, userId, canViewPrivateLists]);

if (!user) {
return (
<Screen>
<FormHeader />

    <EmptyState
      emoji="🔍"
      title="Perfil não encontrado"
    />
  </Screen>
);

}

const followState = followStateForUser(user.id);
const isMe = user.id === me?.id;

const lists = listsOf(user.id).filter(
(list) =>
(canViewPrivateLists || list.privacy === "public") &&
(!list.paused || isMe),
);

const profileListCount = user.listsCount ?? lists.length;
const followersCount = user.followersCount ?? 0;

const handleFollowAction = async () => {
if (busy) return;

setBusy(true);

try {
  if (followState === "ACCEPTED") {
    await unfollowUser(user.id);
  } else if (followState === "PENDING_SENT") {
    await cancelFollowRequest(user.id);
  } else if (followState === "PENDING_RECEIVED") {
    await acceptFollowRequest(user.id);
  } else {
    await followUser(user.id);
  }
} finally {
  setBusy(false);
  setMenuOpen(false);
}

};

return (
<Screen>
<FormHeader />

  {/* Perfil */}
  <Card
    className="relative"
  >
    <div className="flex items-center gap-3">
      <Avatar
        photo={user.photo}
        emoji={user.emoji}
        tint={user.tint}
        size={56}
      />

      <div className="min-w-0 flex-1">
        <h1 className="truncate text-lg font-extrabold text-foreground">
          {user.name}
        </h1>

        <p className="truncate text-sm text-muted">
          @{user.username}
        </p>

        <div className="mt-1 flex items-center gap-2 text-sm">
          <span className="text-foreground">
            {profileListCount}{" "}
            {profileListCount === 1 ? "lista" : "listas"}
          </span>

          <span className="text-muted">•</span>

          <span className="text-foreground">
            {followersCount} seguidores
          </span>
        </div>
      </div>
    </div>

    {user.bio ? (
      <p className="mt-3 text-sm leading-6 text-muted">
        {user.bio}
      </p>
    ) : null}

    {!isMe ? (
      <div className="mt-3 flex gap-2">
        {followState === "ACCEPTED" ? (
          <div className="relative flex-1">
            <Button
              title="Seguindo"
              variant="outline"
              icon={<ChevronDown size={14} />}
              loading={busy}
              onClick={() => setMenuOpen((open) => !open)}
            />

            {menuOpen ? (
              <div className="absolute left-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-xl border border-border bg-card p-1.5 shadow-lg">
                <button
                  type="button"
                  onClick={() => void handleFollowAction()}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-primary transition-opacity hover:opacity-80"
                >
                  <UserMinus size={16} />
                  Deixar de seguir
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    dispatch({
                      type: "user/block",
                      userId: user.id,
                    });
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-destructive transition-opacity hover:opacity-80"
                >
                  <Ban size={16} />
                  Bloquear
                </button>
              </div>
            ) : null}
          </div>
        ) : (
          <Button
            title={
              followState === "PENDING_SENT"
                ? "Solicitado"
                : followState === "PENDING_RECEIVED"
                  ? "Permitir seguir"
                  : "Seguir"
            }
            variant={
              followState === "none"
                ? "primary"
                : "outline"
            }
            icon={
              followState === "none" ? (
                <UserPlus size={15} />
              ) : undefined
            }
            loading={busy}
            onClick={() => void handleFollowAction()}
          />
        )}

        <Button
          title="Mensagem"
          variant="outline"
          icon={<MessageCircle size={15} />}
          onClick={() => {
            window.location.href = `/messages?u=${encodeURIComponent(
              user.id,
            )}`;
          }}
        />
      </div>
    ) : null}
  </Card>

  {/* Listas públicas */}
  {loading ? (
    <EmptyState
      emoji="⏳"
      title="Carregando listas"
    />
  ) : error ? (
    <EmptyState
      emoji="⚠️"
      title="Não foi possível carregar as listas"
      description={error}
    />
  ) : lists.length === 0 ? (
    <EmptyState
      emoji="🎁"
      title="Nenhuma lista pública"
    />
  ) : (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-foreground">
          Listas públicas
        </h2>

        <span className="text-sm text-muted">
          {lists.length}{" "}
          {lists.length === 1 ? "lista" : "listas"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {lists.map((list) => (
          <ListCard
            key={list.id}
            list={list}
            count={productsOf(list.id).length}
          />
        ))}
      </div>
    </section>
  )}
</Screen>

);
}