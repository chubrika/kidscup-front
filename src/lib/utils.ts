/**
 * URL-safe slug from a string (e.g. "Under 12" → "under-12").
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}
