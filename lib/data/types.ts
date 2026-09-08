export type Tint = "lilac" | "mint" | "rose" | "cream" | "sky" | "peach";

export type Privacy = "public" | "private";

export type ListPrivacy = Privacy | "guests";

export type ListRole = "view" | "edit";

export type ListMember = { userId: string; role: ListRole };

export type User = {
  id: string;
  name: string;
  username: string;
  email: string;
  bio: string;
  birthday: string;
  emoji: string;
  photo?: string;
  showBirthYear?: boolean;
  followersCount?: number;
  listsCount?: number;
  address?: string;
  city?: string;
  zip?: string;
  tint: Tint;
  privacy: Privacy;
};

export type Comment = {
  id: string;
  userId: string;
  text: string;
  likes: number;
  liked: boolean;
  createdAt: string;
  parentId?: string;
};

export type Product = {
  id: string;
  listId: string;
  name: string;
  store: string;
  detail: string;
  price: number;
  link: string;
  note: string;
  emoji: string;
  image?: string;
  tint: Tint;
  priority: "baixa" | "media" | "alta";
  quantity: number;
  likes: number;
  liked: boolean;
  comments: Comment[];
  reservedBy: string | null;
  paused: boolean;
  archived: boolean;
};

export type GiftList = {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  emoji: string;
  cover?: number;
  tint: Tint;
  privacy: ListPrivacy;
  paused: boolean;
  category: string;
  members?: ListMember[];
  inviteMessage?: string;
};

export type Circle = {
  id: string;
  name: string;
  emoji: string;
  tint: Tint;
  memberIds: string[];
};

export type Notification = {
  id: string;
  type:
    | "follow"
    | "comment"
    | "like"
    | "reserve"
    | "reminder"
    | "share"
    | "reservation"
    | "calendar_reminder"
    | "message";
  userId?: string;
  listId?: string;
  role?: ListRole;
  text: string;
  time: string;
  read: boolean;
};

export type Holiday = {
  id: string;
  name: string;
  emoji: string;
  month: number;
  day: number;
};
