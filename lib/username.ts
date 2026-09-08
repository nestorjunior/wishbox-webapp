export function normalizeUsername(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/^@+/, "")
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 30);
}

export function isValidUsername(value: string) {
  return /^[a-z0-9_]{3,30}$/.test(value);
}
