export type ScheduledEditorialEntry = {
  publishedAt: string;
};

export function editorialReleaseInstant(publishedAt: string) {
  return Date.parse(`${publishedAt}T00:00:00+02:00`);
}

export function getReleasedEditorialEntries<T extends ScheduledEditorialEntry>(entries: T[], now = new Date()): T[] {
  const instant = now.getTime();
  return [...entries]
    .filter((entry) => editorialReleaseInstant(entry.publishedAt) <= instant)
    .sort((left, right) => editorialReleaseInstant(right.publishedAt) - editorialReleaseInstant(left.publishedAt));
}
