/**
 * Suggest a short Latin company slug from a Persian/Latin display name.
 * Keeps letters, digits, and hyphens only. Empty when nothing usable remains.
 */
export function suggestCompanySlug(name: string): string {
  const trimmed = name.trim().toLowerCase();
  if (!trimmed) return "";

  const latinized = trimmed
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return latinized.slice(0, 80);
}
