/**
 * Classify an href before it is written onto the page.
 *
 * Markdown, frontmatter websites, and stored `source` addresses all pass
 * through here so a protocol-relative path cannot be treated as internal,
 * and `javascript:` / `data:` never become an `<a href>`.
 */

const APP_ORIGIN = "https://alltikerfi.invalid";

export type ClassifiedHref =
  | { kind: "internal"; href: string }
  | { kind: "external"; href: string }
  | { kind: "unresolved"; slug: string }
  | { kind: "blocked" };

function hasControlOrSlashTricks(href: string): boolean {
  return /[\u0000-\u001f\u007f\\]/.test(href);
}

export function classifyHref(raw: string | null | undefined): ClassifiedHref {
  if (raw == null) return { kind: "blocked" };
  const href = raw.trim();
  if (!href) return { kind: "blocked" };
  if (hasControlOrSlashTricks(href)) return { kind: "blocked" };

  // Protocol-relative looks like a path (`startsWith("/")`) but leaves the site.
  if (href.startsWith("//")) return { kind: "blocked" };

  if (href.startsWith("unresolved:")) {
    const slug = href.slice("unresolved:".length);
    if (/^[a-z0-9-]+$/.test(slug)) return { kind: "unresolved", slug };
    return { kind: "blocked" };
  }

  let url: URL;
  try {
    url = new URL(href, APP_ORIGIN);
  } catch {
    return { kind: "blocked" };
  }

  if (url.username || url.password) return { kind: "blocked" };

  if (url.protocol === "http:" || url.protocol === "https:") {
    if (url.origin === APP_ORIGIN) {
      const path = `${url.pathname}${url.search}${url.hash}`;
      if (!path.startsWith("/") || path.startsWith("//")) {
        return { kind: "blocked" };
      }
      return { kind: "internal", href: path };
    }
    return { kind: "external", href };
  }

  return { kind: "blocked" };
}

/** True when the string is a full http(s) address, suitable as a citation. */
export function isHttpUrl(raw: string): boolean {
  return classifyHref(raw).kind === "external";
}

/** Download filename with characters that would break a Content-Disposition line stripped. */
export function attachmentDisposition(slug: string, ext: string): string {
  const safe = slug.replace(/["\\;\r\n]/g, "").slice(0, 120) || "entry";
  return `attachment; filename="${safe}.${ext}"`;
}
