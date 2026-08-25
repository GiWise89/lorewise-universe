export type ScheduledEditorialEntry = {
  publishedAt: string;
};

export function editorialReleaseInstant(publishedAt: string) {
  const timeZoneName = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Rome",
    timeZoneName: "longOffset",
  }).formatToParts(new Date(`${publishedAt}T12:00:00Z`)).find((part) => part.type === "timeZoneName")?.value;
  const offset = timeZoneName?.match(/GMT([+-]\d{2}:\d{2})/)?.[1] ?? "+01:00";
  return Date.parse(`${publishedAt}T00:00:00${offset}`);
}

export function getReleasedEditorialEntries<T extends ScheduledEditorialEntry>(entries: T[], now = new Date()): T[] {
  const instant = now.getTime();
  return [...entries]
    .filter((entry) => editorialReleaseInstant(entry.publishedAt) <= instant)
    .sort((left, right) => editorialReleaseInstant(right.publishedAt) - editorialReleaseInstant(left.publishedAt));
}
