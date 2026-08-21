export type LocalCodexBookmark = {
  slug: string;
  collection: string;
  createdAt: string;
};

const STORAGE_KEY = "lorewise-codex-bookmarks";

export function readLocalCodexBookmarks(): LocalCodexBookmark[] {
  if (typeof window === "undefined") return [];
  try {
    const value = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]") as unknown;
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is LocalCodexBookmark => Boolean(
      item && typeof item === "object"
      && typeof (item as LocalCodexBookmark).slug === "string"
      && typeof (item as LocalCodexBookmark).collection === "string"
      && typeof (item as LocalCodexBookmark).createdAt === "string",
    ));
  } catch {
    return [];
  }
}

export function saveLocalCodexBookmark(slug: string, collection: string) {
  if (typeof window === "undefined") return;
  const bookmark: LocalCodexBookmark = {
    slug,
    collection: collection.trim().slice(0, 40) || "Preferiti",
    createdAt: new Date().toISOString(),
  };
  const next = [bookmark, ...readLocalCodexBookmarks().filter((item) => item.slug !== slug)];
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("lorewise-codex-bookmarks-changed"));
}

export function removeLocalCodexBookmark(slug: string) {
  if (typeof window === "undefined") return;
  const next = readLocalCodexBookmarks().filter((item) => item.slug !== slug);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("lorewise-codex-bookmarks-changed"));
}
