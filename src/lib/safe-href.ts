/**
 * Defense-in-depth URL validation for user-submitted URLs.
 * Only allows http: and https: protocols; falls back to "#" for
 * null/undefined/invalid/javascript: URIs.
 */
export function safeHref(url: string | null | undefined): string {
  if (!url) return "#";
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "https:" || parsed.protocol === "http:") return url;
  } catch {
    /* invalid URL — fall through */
  }
  return "#";
}
