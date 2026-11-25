import type { Resource } from "@/content/resources";

/**
 * Lookups for /kaynaklar. A word typed after a video ("ürün", "ÜRÜN",
 * "urun", "#ürün ") must find the same resource, so everything is compared
 * in one form: Turkish lower case, accents and ı folded to ASCII, only
 * letters and digits.
 *
 * The list is always passed in, so the search box ships only the card data
 * to the browser, not every resource's content.
 */

/** What a grid tile and the search box need. */
export type ResourceCard = Pick<Resource, "slug" | "keyword" | "aliases" | "title" | "kind" | "date" | "tone">;

export function toCard({ slug, keyword, aliases, title, kind, date, tone }: Resource): ResourceCard {
  return { slug, keyword, aliases, title, kind, date, tone };
}

export function normalizeKeyword(value: string): string {
  return value
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/ı/g, "i")
    .replace(/[^a-z0-9]+/g, "");
}

function words(resource: ResourceCard): string[] {
  return [resource.slug, resource.keyword, ...(resource.aliases ?? [])].map(normalizeKeyword).filter(Boolean);
}

/** Newest first. */
export function sortedResources<T extends ResourceCard>(list: readonly T[]): T[] {
  return [...list].sort((a, b) => b.date.localeCompare(a.date));
}

/** The resource for an address segment: its slug, or its keyword typed into the URL (/kaynaklar/ÜRÜN). */
export function findResource<T extends ResourceCard>(segment: string, list: readonly T[]): T | null {
  let decoded = segment;
  try {
    decoded = decodeURIComponent(segment);
  } catch {
    // A malformed escape stays as typed and simply matches nothing.
  }
  const bySlug = list.find((resource) => resource.slug === decoded);
  if (bySlug) return bySlug;
  const word = normalizeKeyword(decoded);
  return word ? (list.find((resource) => words(resource).includes(word)) ?? null) : null;
}

/**
 * The search box: `exact` is the resource to open when the visitor presses
 * enter, `matches` the tiles to keep while typing. Partial words match the
 * start of a keyword ("ür" → ÜRÜN), a longer form matches its keyword
 * ("ürünler" → ÜRÜN), and the title is searched as well.
 */
export function searchResources<T extends ResourceCard>(
  query: string,
  list: readonly T[],
): { exact: T | null; matches: T[] } {
  const q = normalizeKeyword(query);
  const sorted = sortedResources(list);
  if (!q) return { exact: null, matches: sorted };
  const matches = sorted.filter(
    (resource) =>
      words(resource).some((word) => word.startsWith(q) || (word.length >= 3 && q.startsWith(word))) ||
      normalizeKeyword(resource.title).includes(q),
  );
  const exact = sorted.find((resource) => words(resource).includes(q)) ?? (matches.length === 1 ? matches[0] : null);
  return { exact, matches };
}

/** Other resources for the bottom of a resource page. */
export function relatedResources<T extends ResourceCard>(current: T, list: readonly T[], count = 3): T[] {
  return sortedResources(list)
    .filter((resource) => resource.slug !== current.slug)
    .slice(0, count);
}
