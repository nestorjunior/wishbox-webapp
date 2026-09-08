import type { User } from "@/lib/data/types";
import type { BackendUser } from "@/lib/api";
import { normalizeUsername } from "@/lib/username";

const tintPalette: User["tint"][] = ["lilac", "mint", "rose", "cream", "sky", "peach"];

function hashText(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) | 0;
  }
  return Math.abs(hash);
}

function fallbackUsername(user: Pick<BackendUser, "id" | "email" | "username">) {
  const emailLocalPart = (user.email ?? "").split("@")[0] ?? "";
  const normalized = normalizeUsername(user.username ?? emailLocalPart);
  if (normalized) return normalized;

  return `user${user.id.slice(0, 8).toLowerCase()}`;
}

function fallbackName(user: Pick<BackendUser, "displayName">, username: string) {
  return user.displayName?.trim() || username;
}

export function backendUserToLocalUser(user: Partial<BackendUser> & { id: string }): User {
  const username = fallbackUsername({
    id: user.id,
    email: user.email ?? "",
    username: user.username,
  });
  const tint = tintPalette[hashText(user.id) % tintPalette.length] ?? "lilac";

  return {
    id: user.id,
    name: fallbackName({ displayName: user.displayName }, username),
    username,
    email: user.email ?? "",
    bio: user.bio ?? "",
    birthday: "",
    emoji: "👤",
    photo: user.avatarPath || undefined,
    showBirthYear: user.showBirthYear ?? true,
    followersCount: user.followersCount,
    listsCount: user.listsCount,
    address: user.address ?? "",
    city: user.cityState ?? "",
    zip: user.zipCode ?? "",
    tint,
    privacy: user.private ? "private" : "public",
  };
}
