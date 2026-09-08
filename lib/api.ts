import type { User as FirebaseAuthUser } from "firebase/auth";
import { webStorage as AsyncStorage } from "@/lib/web-storage";

export type BackendUser = {
  id: string;
  authId: string;
  email: string;
  username?: string;
  displayName?: string;
  bio?: string;
  avatarPath?: string;
  private?: boolean;
  birthMonth?: number;
  birthDay?: number;
  birthdayVisibility?: "private" | "followers" | "public";
  gender?: string;
  showBirthYear?: boolean;
  zipCode?: string;
  address?: string;
  cityState?: string;
  followersCount?: number;
  listsCount?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type BackendFollow = {
  id: string;
  followerId: string;
  followingId: string;
  status: "PENDING" | "ACCEPTED";
  createdAt?: string;
  updatedAt?: string;
};

export type BackendFollowDirection =
  | "following"
  | "followers"
  | "requests_received"
  | "requests_sent";

export type BackendFollowLink = {
  userId: string;
  followId: string;
  status: BackendFollow["status"];
};

export type BackendNotification = {
  id: string;
  userId: string;
  actorId?: string;
  type:
    | "like"
    | "comment"
    | "reservation"
    | "follow"
    | "message"
    | "share"
    | "calendar_reminder";
  entityType?: "item" | "follow" | "conversation" | "list";
  entityId?: string;
  role?: "view" | "edit";
  content?: string;
  status?: "pending" | "accepted" | "declined";
  readAt?: string;
  createdAt: string;
};

export type BackendConversation = {
  id: string;
  otherUser: BackendUser;
  unreadCount: number;
  lastMessage?: {
    content: string;
    senderId: string;
    createdAt: string;
    sentByMe: boolean;
  };
  createdAt: string;
  updatedAt: string;
};

export type BackendMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  status: "read" | "unread";
  createdAt: string;
  updatedAt: string;
};

export type BackendCircle = {
  id: string;
  ownerId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type BackendCalendarEvent = {
  kind: "birthday" | "occasion";
  date: string;
  daysUntil: number;
  label: string;
  occasionCode?: string;
  user?: BackendUser;
};

export type BackendSocialGraph = {
  following: BackendFollowLink[];
  followers: BackendFollowLink[];
};

export type BackendListMember = {
  userId: string;
  role: "view" | "edit";
};

export type BackendList = {
  id: string;
  ownerId: string;
  name: string;
  description?: string;
  private: boolean;
  isDefault?: boolean;
  listType?: "standard" | "collaborative";
  members?: BackendListMember[];
  inviteMessage?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type BackendItem = {
  id: string;
  ownerId: string;
  title: string;
  description?: string;
  externalUrl?: string;
  priceAmount?: string;
  priceCurrency?: string;
  status: "ACTIVE" | "RESERVED" | "PURCHASED" | "ARCHIVED";
  priority?: "LOW" | "MEDIUM" | "HIGH";
  imageUrl?: string;
  imageExternalUrl?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type ItemImageUploadUrl = {
  uploadUrl: string;
  storagePath: string;
  expiresAt: string;
};

export type BackendListItem = {
  listId: string;
  itemId: string;
  position?: number;
  createdAt?: string;
};

export type BackendItemLike = {
  id: string;
  itemId: string;
  userId: string;
  createdAt: string;
};

export type BackendItemComment = {
  id: string;
  itemId: string;
  userId: string;
  parentId?: string;
  content: string;
  depth: number;
  createdAt: string;
  updatedAt?: string;
};

export type BackendPagination = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export type ApiPaginatedEnvelope<T> = {
  data: T[];
  pagination: BackendPagination;
};

type BackendListItemWithItem = BackendListItem & {
  item?: BackendItem;
};

export type BackendListDetail = BackendList & {
  items?: ApiPaginatedEnvelope<BackendListItemWithItem>;
};

export type BackendCatalog = {
  lists: BackendList[];
  itemsByList: Record<string, BackendItem[]>;
};

type ApiEnvelope<T> = { data: T };

export class ApiError extends Error {
  status: number;
  body?: unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

export type PendingSignupProfile = {
  name: string;
  username?: string;
  birthDate?: string;
  gender?: string;
  showBirthYear?: boolean;
  zipCode?: string;
  address?: string;
  cityState?: string;
};

const pendingSignupProfileKey = "wishbox:pending-signup-profile";
const profileBirthDateKey = "wishbox:profile-birth-date";
const welcomeToastKey = "wishbox:welcome-toast";

const rawBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "";
const baseUrl = rawBaseUrl.replace(/\/+$/, "");

function requireBaseUrl() {
  if (!baseUrl) {
    throw new Error("Configure NEXT_PUBLIC_API_URL para integrar com a API.");
  }
}

async function readJsonSafe(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

async function request<T>(
  path: string,
  options: {
    method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    token: string;
    body?: unknown;
  },
): Promise<T> {
  requireBaseUrl();

  const response = await fetch(`${baseUrl}${path}`, {
    method: options.method ?? "GET",
    headers: {
      Authorization: `Bearer ${options.token}`,
      "Content-Type": "application/json",
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const json = await readJsonSafe(response);

  if (!response.ok) {
    const rawMessage =
      (json as { error?: { message?: unknown } } | undefined)?.error?.message ??
      (json as { message?: unknown } | undefined)?.message ??
      (json as { error?: unknown } | undefined)?.error;

    const message =
      typeof rawMessage === "string"
        ? rawMessage
        : rawMessage && typeof rawMessage === "object"
          ? JSON.stringify(rawMessage)
          : `Erro na API (${response.status})${
              json && typeof json === "object"
                ? `: ${JSON.stringify(json)}`
                : ""
            }`;
    throw new ApiError(message, response.status, json);
  }

  return json as T;
}

export async function getCurrentUser(
  token: string,
): Promise<BackendUser | null> {
  try {
    const response = await request<ApiEnvelope<BackendUser>>("/v1/auth/me", {
      token,
    });
    return response.data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function fetchBackendUser(
  token: string,
  userId: string,
): Promise<BackendUser> {
  const response = await request<ApiEnvelope<BackendUser>>(
    `/v1/users/${encodeURIComponent(userId)}`,
    { token },
  );
  return response.data;
}

export async function createUser(
  token: string,
  input: {
    authId: string;
    email: string;
    username?: string;
    displayName?: string;
    bio?: string;
    gender?: string;
    showBirthYear?: boolean;
    zipCode?: string;
    address?: string;
    cityState?: string;
  },
): Promise<BackendUser> {
  const response = await request<ApiEnvelope<BackendUser>>("/v1/users", {
    method: "POST",
    token,
    body: input,
  });
  return response.data;
}

async function listUsersPage(
  token: string,
  page: number,
  pageSize: number,
): Promise<ApiPaginatedEnvelope<BackendUser>> {
  const response = await request<ApiPaginatedEnvelope<BackendUser>>(
    `/v1/users?page=${page}&pageSize=${pageSize}`,
    {
      method: "GET",
      token,
    },
  );
  return response;
}

export async function fetchBackendUsers(token: string): Promise<BackendUser[]> {
  const users: BackendUser[] = [];
  const pageSize = 100;
  let page = 1;
  let totalPages = 1;

  do {
    const chunk = await listUsersPage(token, page, pageSize);
    users.push(...chunk.data);
    totalPages = chunk.pagination.totalPages || 1;
    page += 1;
  } while (page <= totalPages);

  return users;
}

export async function searchBackendUsers(
  token: string,
  query: string,
  options: { page?: number; pageSize?: number } = {},
): Promise<ApiPaginatedEnvelope<BackendUser>> {
  const page = options.page ?? 1;
  const pageSize = options.pageSize ?? 20;
  const response = await request<ApiPaginatedEnvelope<BackendUser>>(
    `/v1/users/search?q=${encodeURIComponent(query)}&page=${page}&pageSize=${pageSize}`,
    {
      method: "GET",
      token,
    },
  );
  return response;
}

export type BackendAutocompleteUser = {
  id: string;
  username?: string;
  displayName?: string;
  avatarPath?: string;
  private?: boolean;
  email?: string;
};

export async function autocompleteBackendUsers(
  token: string,
  query: string,
  options: { limit?: number } = {},
): Promise<BackendAutocompleteUser[]> {
  const limit = Math.max(1, Math.min(options.limit ?? 10, 20));
  const response = await request<ApiEnvelope<BackendAutocompleteUser[]>>(
    `/v1/users/autocomplete?q=${encodeURIComponent(query)}&limit=${limit}`,
    {
      method: "GET",
      token,
    },
  );
  return response.data;
}

async function listFollowsPage(
  token: string,
  direction: BackendFollowDirection,
  page: number,
  pageSize: number,
): Promise<ApiPaginatedEnvelope<BackendFollow>> {
  const response = await request<ApiPaginatedEnvelope<BackendFollow>>(
    `/v1/follows?direction=${direction}&page=${page}&pageSize=${pageSize}`,
    {
      method: "GET",
      token,
    },
  );
  return response;
}

async function listNotificationsPage(
  token: string,
  page: number,
  pageSize: number,
  unreadOnly = false,
): Promise<ApiPaginatedEnvelope<BackendNotification>> {
  const response = await request<ApiPaginatedEnvelope<BackendNotification>>(
    `/v1/notifications?page=${page}&pageSize=${pageSize}&unreadOnly=${unreadOnly}`,
    {
      method: "GET",
      token,
    },
  );
  return response;
}

export async function fetchBackendSocialGraph(
  token: string,
): Promise<BackendSocialGraph> {
  const requests = await fetchBackendFollowRequests(token);
  return { following: requests.following, followers: requests.followers };
}

export async function fetchBackendNotifications(
  token: string,
): Promise<BackendNotification[]> {
  const notifications: BackendNotification[] = [];
  const pageSize = 100;
  let page = 1;
  let totalPages = 1;

  do {
    const chunk = await listNotificationsPage(token, page, pageSize);
    notifications.push(...chunk.data);
    totalPages = chunk.pagination.totalPages || 1;
    page += 1;
  } while (page <= totalPages);

  return notifications;
}

export type BackendFollowRequests = BackendSocialGraph & {
  requestsReceived: BackendFollowLink[];
  requestsSent: BackendFollowLink[];
};

async function fetchFollowDirection(
  token: string,
  direction: BackendFollowDirection,
): Promise<BackendFollowLink[]> {
  const pageSize = 100;
  const relations: BackendFollowLink[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const chunk = await listFollowsPage(token, direction, page, pageSize);
    relations.push(
      ...chunk.data.map((follow) => ({
        userId:
          direction === "following" || direction === "requests_sent"
            ? follow.followingId
            : follow.followerId,
        followId: follow.id,
        status: follow.status,
      })),
    );
    totalPages = chunk.pagination.totalPages || 1;
    page += 1;
  } while (page <= totalPages);

  return relations;
}

export async function fetchBackendFollowRequests(
  token: string,
): Promise<BackendFollowRequests> {
  const [following, followers, requestsReceived, requestsSent] =
    await Promise.all([
      fetchFollowDirection(token, "following"),
      fetchFollowDirection(token, "followers"),
      fetchFollowDirection(token, "requests_received"),
      fetchFollowDirection(token, "requests_sent"),
    ]);

  return { following, followers, requestsReceived, requestsSent };
}

export async function updateUser(
  token: string,
  userId: string,
  input: {
    email?: string;
    username?: string;
    displayName?: string;
    bio?: string;
    avatarPath?: string;
    private?: boolean;
    birthMonth?: number;
    birthDay?: number;
    birthdayVisibility?: "private" | "followers" | "public";
    gender?: string;
    showBirthYear?: boolean;
    zipCode?: string;
    address?: string;
    cityState?: string;
  },
): Promise<BackendUser> {
  const response = await request<ApiEnvelope<BackendUser>>(
    `/v1/users/${encodeURIComponent(userId)}`,
    {
      method: "PUT",
      token,
      body: input,
    },
  );
  return response.data;
}

export async function deleteUser(token: string, userId: string): Promise<void> {
  await request<unknown>(`/v1/users/${encodeURIComponent(userId)}`, {
    method: "DELETE",
    token,
  });
}

export async function createList(
  token: string,
  input: {
    name: string;
    description?: string;
    private?: boolean;
    listType?: "standard" | "collaborative";
  },
): Promise<BackendList> {
  const response = await request<ApiEnvelope<BackendList>>("/v1/lists", {
    method: "POST",
    token,
    body: input,
  });
  return response.data;
}

export async function updateList(
  token: string,
  listId: string,
  input: { name?: string; description?: string; private?: boolean },
): Promise<BackendList> {
  const response = await request<ApiEnvelope<BackendList>>(
    `/v1/lists/${encodeURIComponent(listId)}`,
    {
      method: "PATCH",
      token,
      body: input,
    },
  );
  return response.data;
}

export async function deleteList(token: string, listId: string): Promise<void> {
  await request<unknown>(`/v1/lists/${encodeURIComponent(listId)}`, {
    method: "DELETE",
    token,
  });
}

export async function shareListWithUser(
  token: string,
  listId: string,
  userId: string,
): Promise<void> {
  await request<unknown>(`/v1/lists/${encodeURIComponent(listId)}/shares`, {
    method: "POST",
    token,
    body: { userId },
  });
}

export async function removeListShare(
  token: string,
  listId: string,
  userId: string,
): Promise<void> {
  await request<unknown>(
    `/v1/lists/${encodeURIComponent(listId)}/shares/${encodeURIComponent(userId)}`,
    { method: "DELETE", token },
  );
}

export async function fetchListEditors(
  token: string,
  listId: string,
): Promise<string[]> {
  const response = await request<ApiEnvelope<string[]>>(
    `/v1/lists/${encodeURIComponent(listId)}/editors`,
    { token },
  );
  return response.data;
}

export async function addListEditor(
  token: string,
  listId: string,
  userId: string,
): Promise<void> {
  await request<unknown>(`/v1/lists/${encodeURIComponent(listId)}/editors`, {
    method: "POST",
    token,
    body: { userId },
  });
}

export async function removeListEditor(
  token: string,
  listId: string,
  userId: string,
): Promise<void> {
  await request<unknown>(
    `/v1/lists/${encodeURIComponent(listId)}/editors/${encodeURIComponent(userId)}`,
    { method: "DELETE", token },
  );
}

export async function createItem(
  token: string,
  input: {
    title: string;
    status: "ACTIVE" | "RESERVED" | "PURCHASED" | "ARCHIVED";
    description?: string;
    externalUrl?: string;
    priceAmount?: string;
    priceCurrency?: string;
    priority?: "LOW" | "MEDIUM" | "HIGH";
    imageExternalUrl?: string;
  },
): Promise<BackendItem> {
  const response = await request<ApiEnvelope<BackendItem>>("/v1/items", {
    method: "POST",
    token,
    body: input,
  });
  return response.data;
}

export async function fetchBackendItem(
  token: string,
  itemId: string,
): Promise<BackendItem> {
  const response = await request<ApiEnvelope<BackendItem>>(
    `/v1/items/${encodeURIComponent(itemId)}`,
    { token },
  );
  return response.data;
}

export async function updateItem(
  token: string,
  itemId: string,
  input: {
    title?: string;
    description?: string;
    externalUrl?: string;
    priceAmount?: string;
    priceCurrency?: string;
    status?: "ACTIVE" | "RESERVED" | "PURCHASED" | "ARCHIVED";
    priority?: "LOW" | "MEDIUM" | "HIGH";
    imageExternalUrl?: string;
    imageStoragePath?: string;
  },
): Promise<BackendItem> {
  const response = await request<ApiEnvelope<BackendItem>>(
    `/v1/items/${encodeURIComponent(itemId)}`,
    {
      method: "PATCH",
      token,
      body: input,
    },
  );
  return response.data;
}

export async function requestItemImageUploadUrl(
  token: string,
  itemId: string,
  contentType: "image/png" | "image/jpeg" | "image/jpg" | "image/gif",
): Promise<ItemImageUploadUrl> {
  const response = await request<ApiEnvelope<ItemImageUploadUrl>>(
    `/v1/items/${encodeURIComponent(itemId)}/image/upload-url`,
    {
      method: "POST",
      token,
      body: { contentType },
    },
  );
  return response.data;
}

export async function deleteItem(token: string, itemId: string): Promise<void> {
  await request<unknown>(`/v1/items/${encodeURIComponent(itemId)}`, {
    method: "DELETE",
    token,
  });
}

export async function likeItem(
  token: string,
  itemId: string,
): Promise<BackendItemLike> {
  const response = await request<ApiEnvelope<BackendItemLike>>(
    `/v1/items/${encodeURIComponent(itemId)}/likes`,
    { method: "POST", token },
  );
  return response.data;
}

export async function unlikeItem(token: string, itemId: string): Promise<void> {
  await request<unknown>(`/v1/items/${encodeURIComponent(itemId)}/likes`, {
    method: "DELETE",
    token,
  });
}

export async function fetchItemComments(
  token: string,
  itemId: string,
  options: { page?: number; pageSize?: number } = {},
): Promise<ApiPaginatedEnvelope<BackendItemComment>> {
  const page = options.page ?? 1;
  const pageSize = options.pageSize ?? 100;
  return request<ApiPaginatedEnvelope<BackendItemComment>>(
    `/v1/items/${encodeURIComponent(itemId)}/comments?page=${page}&pageSize=${pageSize}`,
    { token },
  );
}

export async function createItemComment(
  token: string,
  itemId: string,
  input: { content: string; parentId?: string },
): Promise<BackendItemComment> {
  const response = await request<ApiEnvelope<BackendItemComment>>(
    `/v1/items/${encodeURIComponent(itemId)}/comments`,
    { method: "POST", token, body: input },
  );
  return response.data;
}

export async function listUsers(token: string): Promise<BackendUser[]> {
  return fetchBackendUsers(token);
}

export async function listFollows(
  token: string,
  direction: "following" | "followers",
): Promise<BackendFollowLink[]> {
  const graph = await fetchBackendSocialGraph(token);
  return direction === "following" ? graph.following : graph.followers;
}

export async function createFollow(
  token: string,
  followingId: string,
): Promise<BackendFollow> {
  const response = await request<ApiEnvelope<BackendFollow>>("/v1/follows", {
    method: "POST",
    token,
    body: { followingId },
  });
  return response.data;
}

export async function createNotification(
  token: string,
  input: {
    recipientId: string;
    actorId?: string;
    type: BackendNotification["type"];
    entityType?: BackendNotification["entityType"];
    entityId?: string;
    role?: BackendNotification["role"];
    content?: string;
  },
): Promise<BackendNotification> {
  const response = await request<ApiEnvelope<BackendNotification>>(
    "/v1/notifications",
    {
      method: "POST",
      token,
      body: input,
    },
  );
  return response.data;
}

export async function acceptFollow(
  token: string,
  followId: string,
): Promise<BackendFollow> {
  const response = await request<ApiEnvelope<BackendFollow>>(
    `/v1/follows/${encodeURIComponent(followId)}/accept`,
    {
      method: "POST",
      token,
    },
  );
  return response.data;
}

export async function cancelSentFollowRequest(
  token: string,
  followId: string,
): Promise<void> {
  await request<unknown>(
    `/v1/follow-requests/sent/${encodeURIComponent(followId)}`,
    {
      method: "DELETE",
      token,
    },
  );
}

export async function deleteFollow(
  token: string,
  followId: string,
): Promise<void> {
  await request<unknown>(`/v1/follows/${encodeURIComponent(followId)}`, {
    method: "DELETE",
    token,
  });
}

export async function markAllNotificationsRead(token: string): Promise<void> {
  await request<unknown>("/v1/notifications/read-all", {
    method: "POST",
    token,
  });
}

export async function markNotificationRead(
  token: string,
  notificationId: string,
): Promise<void> {
  await request<unknown>(
    `/v1/notifications/${encodeURIComponent(notificationId)}/read`,
    {
      method: "PATCH",
      token,
    },
  );
}

export async function fetchConversations(
  token: string,
  options: { page?: number; pageSize?: number } = {},
): Promise<ApiPaginatedEnvelope<BackendConversation>> {
  const page = options.page ?? 1;
  const pageSize = options.pageSize ?? 50;
  return request<ApiPaginatedEnvelope<BackendConversation>>(
    `/v1/conversations?page=${page}&pageSize=${pageSize}`,
    { token },
  );
}

export async function fetchCircles(
  token: string,
  options: { page?: number; pageSize?: number } = {},
): Promise<ApiPaginatedEnvelope<BackendCircle>> {
  const page = options.page ?? 1;
  const pageSize = options.pageSize ?? 50;
  return request<ApiPaginatedEnvelope<BackendCircle>>(
    `/v1/circles?page=${page}&pageSize=${pageSize}`,
    { token },
  );
}

export async function fetchUpcomingCalendarEvents(
  token: string,
  days = 366,
): Promise<{ data: BackendCalendarEvent[] }> {
  return request<{ data: BackendCalendarEvent[] }>(
    `/v1/calendar/upcoming?days=${Math.min(Math.max(days, 1), 366)}`,
    { token },
  );
}

export async function createConversation(
  token: string,
  recipientId: string,
): Promise<BackendConversation> {
  const response = await request<ApiEnvelope<BackendConversation>>(
    "/v1/conversations",
    {
      method: "POST",
      token,
      body: { recipientId },
    },
  );
  return response.data;
}

export async function fetchConversationMessages(
  token: string,
  conversationId: string,
  options: { page?: number; pageSize?: number } = {},
): Promise<ApiPaginatedEnvelope<BackendMessage>> {
  const page = options.page ?? 1;
  const pageSize = options.pageSize ?? 100;
  return request<ApiPaginatedEnvelope<BackendMessage>>(
    `/v1/conversations/${encodeURIComponent(conversationId)}/messages?page=${page}&pageSize=${pageSize}`,
    { token },
  );
}

export async function sendConversationMessage(
  token: string,
  conversationId: string,
  content: string,
): Promise<BackendMessage> {
  const response = await request<ApiEnvelope<BackendMessage>>(
    `/v1/conversations/${encodeURIComponent(conversationId)}/messages`,
    { method: "POST", token, body: { content } },
  );
  return response.data;
}

export async function markConversationRead(
  token: string,
  conversationId: string,
): Promise<void> {
  await request<unknown>(
    `/v1/conversations/${encodeURIComponent(conversationId)}/read`,
    {
      method: "PATCH",
      token,
    },
  );
}

export async function addItemToList(
  token: string,
  input: { listId: string; itemId: string; position?: number },
): Promise<BackendListItem> {
  const response = await request<ApiEnvelope<BackendListItem>>(
    `/v1/lists/${encodeURIComponent(input.listId)}/items`,
    {
      method: "POST",
      token,
      body: { itemId: input.itemId, position: input.position },
    },
  );
  return response.data;
}

export async function fetchUserLists(
  token: string,
  userId: string,
  options: { page?: number; pageSize?: number } = {},
): Promise<ApiPaginatedEnvelope<BackendList>> {
  const page = options.page ?? 1;
  const pageSize = options.pageSize ?? 20;
  const response = await request<ApiPaginatedEnvelope<BackendList>>(
    `/v1/users/${encodeURIComponent(userId)}/lists?page=${page}&pageSize=${pageSize}`,
    {
      method: "GET",
      token,
    },
  );
  return response;
}

export async function fetchUserListDetail(
  token: string,
  userId: string,
  listId: string,
  options: { itemsPage?: number; itemsPageSize?: number } = {},
): Promise<BackendListDetail> {
  const itemsPage = options.itemsPage ?? 1;
  const itemsPageSize = options.itemsPageSize ?? 20;
  const response = await request<ApiEnvelope<BackendListDetail>>(
    `/v1/users/${encodeURIComponent(userId)}/lists/${encodeURIComponent(
      listId,
    )}?itemsPage=${itemsPage}&itemsPageSize=${itemsPageSize}`,
    {
      method: "GET",
      token,
    },
  );
  return response.data;
}

async function listListsPage(
  token: string,
  page: number,
  pageSize: number,
): Promise<ApiPaginatedEnvelope<BackendList>> {
  const response = await request<ApiPaginatedEnvelope<BackendList>>(
    `/v1/lists?page=${page}&pageSize=${pageSize}`,
    {
      method: "GET",
      token,
    },
  );
  return response;
}

async function getListDetailPage(
  token: string,
  listId: string,
  itemsPage: number,
  itemsPageSize: number,
): Promise<BackendListDetail> {
  const response = await request<ApiEnvelope<BackendListDetail>>(
    `/v1/lists/${encodeURIComponent(listId)}?itemsPage=${itemsPage}&itemsPageSize=${itemsPageSize}`,
    {
      method: "GET",
      token,
    },
  );
  return response.data;
}

export async function fetchBackendCatalog(
  token: string,
): Promise<BackendCatalog> {
  const pageSize = 100;
  const lists: BackendList[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const chunk = await listListsPage(token, page, pageSize);
    lists.push(...chunk.data);
    totalPages = chunk.pagination.totalPages || 1;
    page += 1;
  } while (page <= totalPages);

  const itemsByList: Record<string, BackendItem[]> = {};

  for (const list of lists) {
    const collected: BackendItem[] = [];
    let itemsPage = 1;
    let itemsTotalPages = 1;

    do {
      const detail = await getListDetailPage(
        token,
        list.id,
        itemsPage,
        pageSize,
      );
      const entries = detail.items?.data ?? [];

      const items = await Promise.all(
        entries.map((entry) => fetchBackendItem(token, entry.itemId)),
      );
      collected.push(...items);

      itemsTotalPages = detail.items?.pagination?.totalPages || 1;
      itemsPage += 1;
    } while (itemsPage <= itemsTotalPages);

    itemsByList[list.id] = collected;
  }

  return { lists, itemsByList };
}

export async function setPendingSignupProfile(
  profile: PendingSignupProfile,
): Promise<void> {
  await AsyncStorage.setItem(pendingSignupProfileKey, JSON.stringify(profile));
}

export async function consumePendingSignupProfile(): Promise<PendingSignupProfile | null> {
  const raw = await AsyncStorage.getItem(pendingSignupProfileKey);
  if (!raw) return null;

  await AsyncStorage.removeItem(pendingSignupProfileKey);

  try {
    return JSON.parse(raw) as PendingSignupProfile;
  } catch {
    return null;
  }
}

export async function clearPendingSignupProfile(): Promise<void> {
  await AsyncStorage.removeItem(pendingSignupProfileKey);
}

export async function setWelcomeToastVisible(): Promise<void> {
  await AsyncStorage.setItem(welcomeToastKey, "1");
}

export async function consumeWelcomeToastVisible(): Promise<boolean> {
  const raw = await AsyncStorage.getItem(welcomeToastKey);
  if (!raw) return false;

  await AsyncStorage.removeItem(welcomeToastKey);
  return raw === "1";
}

function inferUsernameFromEmail(email: string): string | undefined {
  const local = email.split("@")[0]?.trim().toLowerCase();
  if (!local) return undefined;
  return local.replace(/[^a-z0-9_]/g, "");
}

function normalizeBackendUsername(value?: string): string | undefined {
  const sanitized = value
    ?.trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "");
  if (!sanitized) return undefined;
  if (sanitized.length < 3) return undefined;
  return sanitized.slice(0, 30);
}

export async function ensureBackendUserSession(
  firebaseUser: FirebaseAuthUser,
): Promise<BackendUser> {
  const email = firebaseUser.email?.trim().toLowerCase();
  if (!email) {
    throw new Error(
      "Usuário autenticado sem e-mail. Não é possível sincronizar com a API.",
    );
  }

  const pendingProfile = await consumePendingSignupProfile();
  if (pendingProfile?.birthDate) {
    await AsyncStorage.setItem(profileBirthDateKey, pendingProfile.birthDate);
  }
  const bootstrapUsername =
    normalizeBackendUsername(pendingProfile?.username) ||
    normalizeBackendUsername(inferUsernameFromEmail(email)) ||
    `wb_${firebaseUser.uid.slice(0, 8).toLowerCase()}`;

  let token = await firebaseUser.getIdToken();
  let me = await getCurrentUser(token);
  if (me) return me;

  const created = await createUser(token, {
    authId: firebaseUser.uid,
    email,
    displayName: pendingProfile?.name ?? firebaseUser.displayName ?? undefined,
    username: bootstrapUsername,
    gender: pendingProfile?.gender,
    showBirthYear: pendingProfile?.showBirthYear,
    zipCode: pendingProfile?.zipCode,
    address: pendingProfile?.address,
    cityState: pendingProfile?.cityState,
  });

  const birthDigits = pendingProfile?.birthDate?.replace(/\D/g, "") ?? "";
  const profilePatch = {
    gender: pendingProfile?.gender,
    showBirthYear: pendingProfile?.showBirthYear,
    zipCode: pendingProfile?.zipCode,
    address: pendingProfile?.address,
    cityState: pendingProfile?.cityState,
    ...(birthDigits.length === 8
      ? {
          birthMonth: Number(birthDigits.slice(2, 4)),
          birthDay: Number(birthDigits.slice(0, 2)),
        }
      : {}),
  };

  const shouldPersistProfilePatch = Object.values(profilePatch).some(
    (value) => value !== undefined,
  );
  if (shouldPersistProfilePatch) {
    await updateUser(token, created.id, profilePatch);
  }

  token = await firebaseUser.getIdToken(true);
  me = await getCurrentUser(token);
  if (!me) {
    throw new Error("Usuário criado, mas não encontrado em /v1/auth/me.");
  }

  return me;
}

export async function getStoredProfileBirthDate(): Promise<string | null> {
  return AsyncStorage.getItem(profileBirthDateKey);
}

export async function setStoredProfileBirthDate(value: string): Promise<void> {
  await AsyncStorage.setItem(profileBirthDateKey, value);
}
