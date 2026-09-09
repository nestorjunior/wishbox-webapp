"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  type User as FirebaseAuthUser,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { backendUserToLocalUser } from "@/lib/backend-user";
import { backendNotificationToLocalNotification } from "@/lib/notifications";
import {
  ApiError,
  acceptFollow,
  createFollow,
  cancelSentFollowRequest,
  removeListEditor,
  removeListShare,
  deleteFollow,
  ensureBackendUserSession,
  fetchBackendCatalog,
  fetchBackendFollowRequests,
  fetchBackendNotifications,
  fetchBackendUser,
  fetchListEditors,
  markAllNotificationsRead,
  markNotificationRead,
  type BackendItem,
  type BackendList,
  type BackendFollowLink,
  type BackendUser,
} from "@/lib/api";
import {
  type Circle,
  type Comment,
  type GiftList,
  type ListRole,
  type Notification,
  type Privacy,
  type Product,
  type User,
} from "@/lib/data";

export type ChatMessage = {
  id: string;
  from: string;
  text: string;
  at: string;
};

type State = {
  users: User[];
  lists: GiftList[];
  products: Product[];
  following: BackendFollowLink[];
  followers: BackendFollowLink[];
  pendingReceived: BackendFollowLink[];
  pendingSent: BackendFollowLink[];
  notifications: Notification[];
  blocked: string[];
  circles: Circle[];
  reminders: { birthdays: boolean; holidays: boolean };
  darkMode: boolean;
  threads: Record<string, ChatMessage[]>;
  authed: boolean;
  backendUser: BackendUser | null;
};

type Action =
  | { type: "auth/login" }
  | { type: "auth/logout" }
  | { type: "auth/set-backend-user"; user: BackendUser }
  | { type: "users/hydrate"; users: User[] }
  | { type: "lists/hydrate"; lists: GiftList[] }
  | { type: "auth/hydrate-catalog"; lists: GiftList[]; products: Product[] }
  | {
      type: "social/hydrate";
      following: BackendFollowLink[];
      followers: BackendFollowLink[];
      pendingReceived: BackendFollowLink[];
      pendingSent: BackendFollowLink[];
    }
  | { type: "social/follow-accepted"; follow: BackendFollowLink }
  | { type: "social/follower-accepted"; follow: BackendFollowLink }
  | { type: "social/request-sent"; follow: BackendFollowLink }
  | { type: "social/request-received"; follow: BackendFollowLink }
  | { type: "social/unfollow"; userId: string }
  | { type: "social/accept-request"; userId: string }
  | { type: "social/cancel-request"; userId: string }
  | { type: "social/reject-request"; userId: string }
  | { type: "profile/update"; patch: Partial<User> }
  | { type: "notifications/hydrate"; notifications: Notification[] }
  | { type: "notifications/read-one"; id: string }
  | { type: "list/create"; list: GiftList }
  | { type: "list/update"; id: string; patch: Partial<GiftList> }
  | { type: "list/delete"; id: string }
  | { type: "list/set-member"; id: string; userId: string; role: ListRole }
  | { type: "list/remove-member"; id: string; userId: string }
  | { type: "product/create"; product: Product }
  | { type: "products/hydrate"; products: Product[] }
  | { type: "product/update"; id: string; patch: Partial<Product> }
  | { type: "product/delete"; id: string }
  | { type: "product/like"; id: string }
  | { type: "product/comment"; id: string; comment: Comment }
  | { type: "product/comment-like"; productId: string; commentId: string }
  | { type: "product/reserve"; id: string }
  | { type: "product/unreserve"; id: string }
  | { type: "product/copy"; id: string; targetListId: string; newId: string }
  | { type: "follower/remove"; userId: string }
  | { type: "user/block"; userId: string }
  | { type: "notifications/read-all" }
  | { type: "circle/create"; circle: Circle }
  | { type: "circle/update"; id: string; patch: Partial<Circle> }
  | { type: "circle/delete"; id: string }
  | { type: "circle/toggle-member"; id: string; userId: string }
  | { type: "reminders/set"; patch: Partial<State["reminders"]> }
  | { type: "appearance/set-dark-mode"; value: boolean }
  | { type: "message/send"; threadKey: string; message: ChatMessage };

const initialState: State = {
  users: [],
  lists: [],
  products: [],
  following: [],
  followers: [],
  pendingReceived: [],
  pendingSent: [],
  notifications: [],
  blocked: [],
  circles: [],
  reminders: { birthdays: true, holidays: true },
  darkMode: false,
  threads: {},
  authed: false,
  backendUser: null,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "auth/login":
      return { ...state, authed: true };
    case "auth/logout":
      return {
        ...state,
        authed: false,
        backendUser: null,
        users: [],
        lists: [],
        products: [],
        following: [],
        followers: [],
        pendingReceived: [],
        pendingSent: [],
        notifications: [],
      };
    case "auth/set-backend-user": {
      const localUser = backendUserToLocalUser(action.user);
      const users = state.users.some((user) => user.id === localUser.id)
        ? state.users.map((user) =>
            user.id === localUser.id ? { ...user, ...localUser } : user,
          )
        : [localUser, ...state.users];
      return {
        ...state,
        backendUser: action.user,
        users,
      };
    }
    case "users/hydrate":
      return {
        ...state,
        users: action.users.reduce((acc, user) => {
          const index = acc.findIndex((existing) => existing.id === user.id);
          if (index >= 0) {
            const next = [...acc];
            next[index] = { ...next[index], ...user };
            return next;
          }
          return [user, ...acc];
        }, state.users),
      };
    case "lists/hydrate": {
      const nextLists = [...state.lists];
      for (const list of action.lists) {
        const index = nextLists.findIndex(
          (existing) => existing.id === list.id,
        );
        if (index >= 0) nextLists[index] = { ...nextLists[index], ...list };
        else nextLists.push(list);
      }
      return { ...state, lists: nextLists };
    }
    case "auth/hydrate-catalog":
      return { ...state, lists: action.lists, products: action.products };
    case "social/hydrate":
      return {
        ...state,
        following: action.following,
        followers: action.followers,
        pendingReceived: action.pendingReceived,
        pendingSent: action.pendingSent,
      };
    case "social/follow-accepted": {
      const nextFollowing = state.following.filter(
        (entry) => entry.userId !== action.follow.userId,
      );
      return {
        ...state,
        following: [action.follow, ...nextFollowing],
        pendingSent: state.pendingSent.filter(
          (entry) => entry.userId !== action.follow.userId,
        ),
        pendingReceived: state.pendingReceived.filter(
          (entry) => entry.userId !== action.follow.userId,
        ),
      };
    }
    case "social/follower-accepted": {
      const nextFollowers = state.followers.filter(
        (entry) => entry.userId !== action.follow.userId,
      );
      return {
        ...state,
        followers: [action.follow, ...nextFollowers],
        pendingReceived: state.pendingReceived.filter(
          (entry) => entry.userId !== action.follow.userId,
        ),
      };
    }
    case "social/request-sent": {
      const nextPendingSent = state.pendingSent.filter(
        (entry) => entry.userId !== action.follow.userId,
      );
      return {
        ...state,
        pendingSent: [action.follow, ...nextPendingSent],
      };
    }
    case "social/request-received": {
      const nextPendingReceived = state.pendingReceived.filter(
        (entry) => entry.userId !== action.follow.userId,
      );
      return {
        ...state,
        pendingReceived: [action.follow, ...nextPendingReceived],
      };
    }
    case "social/unfollow":
      return {
        ...state,
        following: state.following.filter(
          (entry) => entry.userId !== action.userId,
        ),
      };
    case "social/accept-request":
      return {
        ...state,
        pendingReceived: state.pendingReceived.filter(
          (entry) => entry.userId !== action.userId,
        ),
        pendingSent: state.pendingSent.filter(
          (entry) => entry.userId !== action.userId,
        ),
      };
    case "social/cancel-request":
      return {
        ...state,
        pendingSent: state.pendingSent.filter(
          (entry) => entry.userId !== action.userId,
        ),
      };
    case "social/reject-request":
      return {
        ...state,
        pendingReceived: state.pendingReceived.filter(
          (entry) => entry.userId !== action.userId,
        ),
      };
    case "profile/update": {
      const currentUserId = state.backendUser?.id;
      if (!currentUserId) {
        return state;
      }

      const backendPatch: Partial<BackendUser> = {
        ...(action.patch.photo !== undefined
          ? { avatarPath: action.patch.photo || undefined }
          : {}),
        ...(action.patch.address !== undefined
          ? { address: action.patch.address || undefined }
          : {}),
        ...(action.patch.city !== undefined
          ? { cityState: action.patch.city || undefined }
          : {}),
        ...(action.patch.zip !== undefined
          ? { zipCode: action.patch.zip || undefined }
          : {}),
        ...(action.patch.privacy !== undefined
          ? { private: action.patch.privacy === "private" }
          : {}),
        ...(action.patch.showBirthYear !== undefined
          ? { showBirthYear: action.patch.showBirthYear }
          : {}),
      };

      return {
        ...state,
        backendUser: state.backendUser
          ? { ...state.backendUser, ...backendPatch }
          : state.backendUser,
        users: state.users.map((u) =>
          u.id === currentUserId
            ? {
                ...u,
                ...action.patch,
                ...(action.patch.photo !== undefined
                  ? { photo: action.patch.photo || undefined }
                  : {}),
                ...(action.patch.address !== undefined
                  ? { address: action.patch.address || undefined }
                  : {}),
                ...(action.patch.city !== undefined
                  ? { city: action.patch.city || undefined }
                  : {}),
                ...(action.patch.zip !== undefined
                  ? { zip: action.patch.zip || undefined }
                  : {}),
                ...(action.patch.privacy !== undefined
                  ? { privacy: action.patch.privacy }
                  : {}),
                ...(action.patch.showBirthYear !== undefined
                  ? { showBirthYear: action.patch.showBirthYear }
                  : {}),
              }
            : u,
        ),
      };
    }
    case "notifications/hydrate":
      return { ...state, notifications: action.notifications };
    case "notifications/read-one":
      return {
        ...state,
        notifications: state.notifications.map((notification) =>
          notification.id === action.id
            ? { ...notification, read: true }
            : notification,
        ),
      };
    case "list/create":
      return { ...state, lists: [action.list, ...state.lists] };
    case "list/update":
      return {
        ...state,
        lists: state.lists.map((l) =>
          l.id === action.id ? { ...l, ...action.patch } : l,
        ),
      };
    case "list/delete":
      return {
        ...state,
        lists: state.lists.filter((l) => l.id !== action.id),
        products: state.products.filter((p) => p.listId !== action.id),
      };
    case "list/set-member":
      return {
        ...state,
        lists: state.lists.map((l) => {
          if (l.id !== action.id) return l;
          const members = l.members ?? [];
          const exists = members.some((m) => m.userId === action.userId);
          return {
            ...l,
            members: exists
              ? members.map((m) =>
                  m.userId === action.userId ? { ...m, role: action.role } : m,
                )
              : [...members, { userId: action.userId, role: action.role }],
          };
        }),
      };
    case "list/remove-member":
      return {
        ...state,
        lists: state.lists.map((l) =>
          l.id === action.id
            ? {
                ...l,
                members: (l.members ?? []).filter(
                  (m) => m.userId !== action.userId,
                ),
              }
            : l,
        ),
      };
    case "product/create":
      return { ...state, products: [action.product, ...state.products] };
    case "products/hydrate": {
      const nextProducts = [...state.products];
      for (const product of action.products) {
        const index = nextProducts.findIndex(
          (existing) => existing.id === product.id,
        );
        if (index >= 0)
          nextProducts[index] = { ...nextProducts[index], ...product };
        else nextProducts.push(product);
      }
      return { ...state, products: nextProducts };
    }
    case "product/update":
      return {
        ...state,
        products: state.products.map((p) =>
          p.id === action.id ? { ...p, ...action.patch } : p,
        ),
      };
    case "product/delete":
      return {
        ...state,
        products: state.products.filter((p) => p.id !== action.id),
      };
    case "product/like":
      return {
        ...state,
        products: state.products.map((p) =>
          p.id === action.id
            ? { ...p, liked: !p.liked, likes: p.likes + (p.liked ? -1 : 1) }
            : p,
        ),
      };
    case "product/comment":
      return {
        ...state,
        products: state.products.map((p) =>
          p.id === action.id
            ? { ...p, comments: [...p.comments, action.comment] }
            : p,
        ),
      };
    case "product/comment-like":
      return {
        ...state,
        products: state.products.map((p) =>
          p.id === action.productId
            ? {
                ...p,
                comments: p.comments.map((c) =>
                  c.id === action.commentId
                    ? {
                        ...c,
                        liked: !c.liked,
                        likes: c.likes + (c.liked ? -1 : 1),
                      }
                    : c,
                ),
              }
            : p,
        ),
      };
    case "product/reserve": {
      const currentUserId = state.backendUser?.id;
      if (!currentUserId) {
        return state;
      }

      return {
        ...state,
        products: state.products.map((p) =>
          p.id === action.id && p.reservedBy === null
            ? { ...p, reservedBy: currentUserId }
            : p,
        ),
      };
    }
    case "product/unreserve": {
      const currentUserId = state.backendUser?.id;
      if (!currentUserId) {
        return state;
      }

      return {
        ...state,
        products: state.products.map((p) =>
          p.id === action.id && p.reservedBy === currentUserId
            ? { ...p, reservedBy: null }
            : p,
        ),
      };
    }
    case "product/copy": {
      const source = state.products.find((p) => p.id === action.id);
      if (!source) return state;
      return {
        ...state,
        products: [
          {
            ...source,
            id: action.newId,
            listId: action.targetListId,
            reservedBy: null,
            likes: 0,
            liked: false,
            comments: [],
          },
          ...state.products,
        ],
      };
    }
    case "follower/remove":
      return {
        ...state,
        followers: state.followers.filter(
          (entry) => entry.userId !== action.userId,
        ),
      };
    case "user/block":
      return {
        ...state,
        blocked: [...state.blocked, action.userId],
        followers: state.followers.filter(
          (entry) => entry.userId !== action.userId,
        ),
        following: state.following.filter(
          (entry) => entry.userId !== action.userId,
        ),
      };
    case "circle/create":
      return { ...state, circles: [action.circle, ...state.circles] };
    case "circle/update":
      return {
        ...state,
        circles: state.circles.map((c) =>
          c.id === action.id ? { ...c, ...action.patch } : c,
        ),
      };
    case "circle/delete":
      return {
        ...state,
        circles: state.circles.filter((c) => c.id !== action.id),
      };
    case "circle/toggle-member":
      return {
        ...state,
        circles: state.circles.map((c) =>
          c.id === action.id
            ? {
                ...c,
                memberIds: c.memberIds.includes(action.userId)
                  ? c.memberIds.filter((m) => m !== action.userId)
                  : [...c.memberIds, action.userId],
              }
            : c,
        ),
      };
    case "message/send":
      return {
        ...state,
        threads: {
          ...state.threads,
          [action.threadKey]: [
            ...(state.threads[action.threadKey] ?? []),
            action.message,
          ],
        },
      };
    case "reminders/set":
      return { ...state, reminders: { ...state.reminders, ...action.patch } };
    case "appearance/set-dark-mode":
      return { ...state, darkMode: action.value };
    case "notifications/read-all":
      return {
        ...state,
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
      };
    default:
      return state;
  }
}

const fallbackEmojis = ["🎁", "✨", "🧡", "🎉", "💫", "🛍️"] as const;
const fallbackTints: Product["tint"][] = [
  "lilac",
  "mint",
  "rose",
  "cream",
  "sky",
  "peach",
];

const listVisuals: Record<
  string,
  { emoji: string; tint: GiftList["tint"]; category: string }
  > = {
    aniversário: { emoji: "🎂", tint: "rose", category: "aniversario" },
    natal: { emoji: "🎄", tint: "mint", category: "natal" },
    casamento: { emoji: "💍", tint: "lilac", category: "casamento" },
    "chá de bebê": { emoji: "🍼", tint: "sky", category: "cha-de-bebe" },
    "casa nova": { emoji: "🏡", tint: "cream", category: "casa-nova" },
    formatura: { emoji: "🎓", tint: "lilac", category: "formatura" },
    viagem: { emoji: "🧳", tint: "mint", category: "viagem" },
    tecnologia: { emoji: "💻", tint: "sky", category: "tecnologia" },
    livros: { emoji: "📚", tint: "peach", category: "livros" },
    games: { emoji: "🎮", tint: "lilac", category: "games" },
  };

function toLocalList(list: BackendList): GiftList {
  const visual = listVisuals[list.name.toLowerCase()];

  return {
    id: list.id,
    ownerId: list.ownerId,
    name: list.name,
    description: list.description ?? "",
    emoji: visual?.emoji ?? "🎁",
    tint: visual?.tint ?? "lilac",
    privacy: list.private
      ? list.listType === "collaborative"
        ? "guests"
        : "private"
      : "public",
    paused: false,
    category: visual?.category ?? "personalizada",
    members: (list.members ?? []).map((member) => ({
      userId: member.userId,
      role: member.role,
    })),
    inviteMessage: list.inviteMessage,
  };
}

function parseDetailAndStore(raw?: string): { detail: string; store: string } {
  if (!raw) return { detail: "", store: "" };

  const lines = raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const storeLine = lines.find((line) =>
    line.toLowerCase().startsWith("loja:"),
  );
  const store = storeLine ? storeLine.slice(5).trim() : "";
  const detail = lines.filter((line) => line !== storeLine).join("\n");

  return { detail, store };
}

export function toLocalProduct(item: BackendItem, listId: string): Product {
  const parsed = parseDetailAndStore(item.description);
  const status = item.status;
  const fallbackTint =
    fallbackTints[(item.id.length + listId.length) % fallbackTints.length]!;
  const fallbackEmoji =
    fallbackEmojis[
      (item.id.length + item.title.length) % fallbackEmojis.length
    ]!;

  return {
    id: item.id,
    listId,
    name: item.title,
    store: parsed.store,
    detail: parsed.detail,
    price: Number(item.priceAmount ?? "0") || 0,
    link: item.externalUrl ?? "",
    note: "",
    emoji: fallbackEmoji,
    image: item.imageUrl ?? item.imageExternalUrl,
    tint: fallbackTint,
    priority:
      item.priority === "HIGH"
        ? "alta"
        : item.priority === "LOW"
          ? "baixa"
          : "media",
    quantity: 1,
    likes: 0,
    liked: false,
    comments: [],
    reservedBy: null,
    paused: status === "ARCHIVED",
    archived: false,
  };
}

type Store = {
  state: State;
  dispatch: React.Dispatch<Action>;
  authReady: boolean;
  backendUser: BackendUser | null;
  me: User | null;
  refreshSession: () => Promise<void>;
  userById: (id: string) => User | undefined;
  userByUsername: (username: string) => User | undefined;
  listById: (id: string) => GiftList | undefined;
  productById: (id: string) => Product | undefined;
  listsOf: (userId: string, onlyPublic?: boolean) => GiftList[];
  productsOf: (listId: string) => Product[];
  myLists: GiftList[];
  accessibleLists: GiftList[];
  editableLists: GiftList[];
  reserved: Product[];
  isFollowing: (userId: string) => boolean;
  isConnected: (userId: string) => boolean;
  followStateForUser: (
    userId: string,
  ) =>
    | "none"
    | "PENDING_SENT"
    | "PENDING_RECEIVED"
    | BackendFollowLink["status"];
  followIdForUser: (userId: string) => string | undefined;
  followUser: (userId: string) => Promise<void>;
  unfollowUser: (userId: string) => Promise<void>;
  acceptFollowRequest: (userId: string) => Promise<void>;
  cancelFollowRequest: (userId: string) => Promise<void>;
  rejectFollowRequest: (userId: string) => Promise<void>;
  readAllNotifications: () => Promise<void>;
  readNotification: (id: string) => Promise<void>;
  acceptListInvite: (
    notificationId: string,
    listId: string,
    role?: ListRole,
  ) => Promise<void>;
  declineListInvite: (
    notificationId: string,
    listId: string,
    role?: ListRole,
  ) => Promise<void>;
  thread: (key: string) => ChatMessage[];
  newId: (prefix: string) => string;
};

const StoreContext = createContext<Store | null>(null);

export function WishboxProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [authReady, setAuthReady] = useState(() => !auth);
  const mountedRef = useRef(true);
  const sessionGenRef = useRef(0);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", state.darkMode);
  }, [state.darkMode]);

  const syncSession = useCallback(
    async (firebaseUser: FirebaseAuthUser | null) => {
      const generation = ++sessionGenRef.current;
      const stale = () =>
        !mountedRef.current || generation !== sessionGenRef.current;

      if (!firebaseUser) {
        dispatch({ type: "auth/logout" });
        if (!stale()) setAuthReady(true);
        return;
      }

      // Block protected screens until the backend profile exists. Otherwise login
      // flips `authed` while `me` is still undefined and Home crashes.
      setAuthReady(false);
      dispatch({ type: "auth/login" });

      try {
        const backendUser = await ensureBackendUserSession(firebaseUser);
        if (stale()) return;
        dispatch({ type: "auth/set-backend-user", user: backendUser });
        setAuthReady(true);

        const token = await firebaseUser.getIdToken();
        const [catalog, socialGraph] = await Promise.all([
          fetchBackendCatalog(token),
          fetchBackendFollowRequests(token),
        ]);
        const relatedUserIds = new Set(
          [
            ...socialGraph.following,
            ...socialGraph.followers,
            ...socialGraph.requestsReceived,
            ...socialGraph.requestsSent,
          ].map((entry) => entry.userId),
        );
        const relatedUsers = await Promise.all(
          [...relatedUserIds]
            .filter((userId) => userId !== backendUser.id)
            .map((userId) => fetchBackendUser(token, userId)),
        );
        const backendNotifications = await fetchBackendNotifications(token);
        if (stale()) return;

        const localUsers = relatedUsers.map(backendUserToLocalUser);
        const userLookup = new Map(localUsers.map((user) => [user.id, user]));

        dispatch({ type: "users/hydrate", users: localUsers });

        dispatch({
          type: "social/hydrate",
          following: socialGraph.following,
          followers: socialGraph.followers,
          pendingReceived: socialGraph.requestsReceived,
          pendingSent: socialGraph.requestsSent,
        });

        dispatch({
          type: "notifications/hydrate",
          notifications: backendNotifications
            .filter((notification) => {
              if (notification.type !== "follow") return true;
              const actorId = notification.actorId;
              return Boolean(
                actorId &&
                [
                  ...socialGraph.followers,
                  ...socialGraph.requestsReceived,
                ].some((entry) => entry.userId === actorId),
              );
            })
            .map((notification) =>
              backendNotificationToLocalNotification(
                notification,
                userLookup.get(notification.actorId ?? "")?.name,
                socialGraph.requestsReceived.some(
                  (entry) => entry.userId === notification.actorId,
                ),
              ),
            ),
        });

        const mappedLists = await Promise.all(
          catalog.lists.map(async (list) => {
            const localList = toLocalList(list);
            if (list.listType !== "collaborative") return localList;

            try {
              const editorIds = await fetchListEditors(token, list.id);
              const members = new Map(
                (localList.members ?? []).map((member) => [
                  member.userId,
                  member.role,
                ]),
              );
              editorIds.forEach((userId) => members.set(userId, "edit"));

              return {
                ...localList,
                members: [...members.entries()].map(([userId, role]) => ({
                  userId,
                  role,
                })),
              };
            } catch {
              return localList;
            }
          }),
        );
        const mappedProducts = catalog.lists.flatMap((list) =>
          (catalog.itemsByList[list.id] ?? []).map((item) =>
            toLocalProduct(item, list.id),
          ),
        );

        dispatch({
          type: "auth/hydrate-catalog",
          lists: mappedLists,
          products: mappedProducts,
        });
      } catch (error) {
        if (process.env.NODE_ENV !== "production") {
          if (error instanceof ApiError) {
            console.warn("[auth] backend bootstrap failed", {
              status: error.status,
              message: error.message,
              body: error.body,
            });
          } else {
            console.warn("[auth] backend bootstrap failed", error);
          }
        }
        // Keep Firebase session alive even if backend bootstrap fails.
        // This avoids redirect loops to login when API environment is unavailable or misconfigured.
      } finally {
        if (!stale()) setAuthReady(true);
      }
    },
    [],
  );

  const refreshSession = useCallback(async () => {
    await syncSession(auth?.currentUser ?? null);
  }, [syncSession]);

  useEffect(() => {
    mountedRef.current = true;

    if (!auth) {
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      void syncSession(firebaseUser);
    });

    return () => {
      mountedRef.current = false;
      unsubscribe();
    };
  }, [syncSession]);

  const value = useMemo<Store>(() => {
    const userById = (id: string) => state.users.find((u) => u.id === id);
    const listById = (id: string) => state.lists.find((l) => l.id === id);
    const followStateForUser = (userId: string) => {
      if (state.pendingReceived.some((entry) => entry.userId === userId))
        return "PENDING_RECEIVED";
      if (state.following.some((entry) => entry.userId === userId))
        return "ACCEPTED";
      if (state.pendingSent.some((entry) => entry.userId === userId))
        return "PENDING_SENT";
      return "none";
    };
    const isConnected = (userId: string) =>
      state.following.some((entry) => entry.userId === userId) ||
      state.followers.some((entry) => entry.userId === userId);
    const followIdForUser = (userId: string) =>
      state.following.find((entry) => entry.userId === userId)?.followId ??
      state.pendingSent.find((entry) => entry.userId === userId)?.followId ??
      state.pendingReceived.find((entry) => entry.userId === userId)?.followId;

    const followUser = async (userId: string) => {
      const firebaseUser = auth?.currentUser;
      if (!firebaseUser || !state.backendUser) {
        throw new Error("Sessão indisponível para seguir usuário.");
      }

      const token = await firebaseUser.getIdToken();
      const follow = await createFollow(token, userId);
      const followLink = {
        userId: follow.followingId,
        followId: follow.id,
        status: follow.status,
      };

      dispatch({
        type:
          follow.status === "ACCEPTED"
            ? "social/follow-accepted"
            : "social/request-sent",
        follow: followLink,
      });
    };

    const unfollowUser = async (userId: string) => {
      const firebaseUser = auth?.currentUser;
      const followId = followIdForUser(userId);
      if (!firebaseUser || !followId) {
        throw new Error("Não foi possível identificar o follow para remoção.");
      }

      const token = await firebaseUser.getIdToken();
      await deleteFollow(token, followId);
      dispatch({ type: "social/unfollow", userId });
    };

    const acceptFollowRequest = async (userId: string) => {
      const firebaseUser = auth?.currentUser;
      const followId = state.pendingReceived.find(
        (entry) => entry.userId === userId,
      )?.followId;
      if (!firebaseUser || !followId) {
        throw new Error(
          "Não foi possível identificar a solicitação para aceitar.",
        );
      }

      const token = await firebaseUser.getIdToken();
      const follow = await acceptFollow(token, followId);
      dispatch({
        type: "social/follower-accepted",
        follow: {
          userId: follow.followerId,
          followId: follow.id,
          status: follow.status,
        },
      });
    };

    const cancelFollowRequest = async (userId: string) => {
      const firebaseUser = auth?.currentUser;
      const followId = state.pendingSent.find(
        (entry) => entry.userId === userId,
      )?.followId;
      if (!firebaseUser || !followId) {
        throw new Error(
          "Não foi possível identificar a solicitação para cancelar.",
        );
      }

      const token = await firebaseUser.getIdToken();
      await cancelSentFollowRequest(token, followId);
      dispatch({ type: "social/cancel-request", userId });
    };

    const rejectFollowRequest = async (userId: string) => {
      const firebaseUser = auth?.currentUser;
      const followId = state.pendingReceived.find(
        (entry) => entry.userId === userId,
      )?.followId;
      if (!firebaseUser || !followId) {
        throw new Error(
          "Não foi possível identificar a solicitação para recusar.",
        );
      }

      const token = await firebaseUser.getIdToken();
      await deleteFollow(token, followId);
      dispatch({ type: "social/reject-request", userId });
    };

    const readAllNotifications = async () => {
      const firebaseUser = auth?.currentUser;
      if (!firebaseUser) {
        throw new Error("Sessão indisponível para atualizar notificações.");
      }

      const token = await firebaseUser.getIdToken();
      await markAllNotificationsRead(token);
      dispatch({ type: "notifications/read-all" });
    };

    const readNotification = async (id: string) => {
      const firebaseUser = auth?.currentUser;
      if (!firebaseUser) {
        throw new Error("Sessão indisponível para atualizar notificações.");
      }

      const token = await firebaseUser.getIdToken();
      await markNotificationRead(token, id);
      dispatch({ type: "notifications/read-one", id });
    };

    const acceptListInvite = async (
      notificationId: string,
      listId: string,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      _role: ListRole = "view",
    ) => {
      const firebaseUser = auth?.currentUser;
      if (!firebaseUser || !state.backendUser) {
        throw new Error("Sessão indisponível para responder ao convite.");
      }

      const token = await firebaseUser.getIdToken();
      await markNotificationRead(token, notificationId);
      dispatch({ type: "notifications/read-one", id: notificationId });
      await refreshSession();
    };

    const declineListInvite = async (
      notificationId: string,
      listId: string,
      role: ListRole = "view",
    ) => {
      const firebaseUser = auth?.currentUser;
      if (!firebaseUser || !state.backendUser) {
        throw new Error("Sessão indisponível para responder ao convite.");
      }

      const token = await firebaseUser.getIdToken();
      if (role === "edit")
        await removeListEditor(token, listId, state.backendUser.id);
      else await removeListShare(token, listId, state.backendUser.id);

      await markNotificationRead(token, notificationId);
      dispatch({
        type: "list/remove-member",
        id: listId,
        userId: state.backendUser.id,
      });
      dispatch({ type: "notifications/read-one", id: notificationId });
      await refreshSession();
    };

    return {
      state,
      dispatch,
      authReady,
      backendUser: state.backendUser,
      me: state.backendUser ? backendUserToLocalUser(state.backendUser) : null,
      refreshSession,
      userById,
      userByUsername: (username) =>
        state.users.find(
          (u) => u.username.toLowerCase() === username.toLowerCase(),
        ),
      listById,
      productById: (id) => state.products.find((p) => p.id === id),
      listsOf: (userId, onlyPublic = false) =>
        state.lists.filter(
          (l) =>
            l.ownerId === userId &&
            (!onlyPublic || l.privacy === "public") &&
            (!l.paused || userId === state.backendUser?.id),
        ),
      productsOf: (listId) =>
        state.products.filter((p) => p.listId === listId && !p.archived),
      myLists: state.backendUser
        ? state.lists.filter((l) => l.ownerId === state.backendUser!.id)
        : [],
      accessibleLists: state.backendUser ? state.lists : [],
      editableLists: state.backendUser
        ? state.lists.filter(
            (list) =>
              list.ownerId === state.backendUser!.id ||
              (list.members ?? []).some(
                (member) =>
                  member.userId === state.backendUser!.id &&
                  member.role === "edit",
              ),
          )
        : [],
      reserved: state.backendUser
        ? state.products.filter((p) => p.reservedBy === state.backendUser!.id)
        : [],
      isFollowing: (userId) => followStateForUser(userId) === "ACCEPTED",
      isConnected,
      followStateForUser,
      followIdForUser,
      followUser,
      unfollowUser,
      acceptFollowRequest,
      cancelFollowRequest,
      rejectFollowRequest,
      readAllNotifications,
      readNotification,
      acceptListInvite,
      declineListInvite,
      thread: (key) => state.threads[key] ?? [],
      newId: (prefix) => `${prefix}-${Math.random().toString(36).slice(2, 9)}`,
    };
  }, [state, authReady, refreshSession]);

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

export function useWishbox() {
  const ctx = useContext(StoreContext);
  if (!ctx)
    throw new Error("useWishbox precisa estar dentro de WishboxProvider");
  return ctx;
}

export type { Privacy };