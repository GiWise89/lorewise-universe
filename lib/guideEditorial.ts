export type ScheduledGuide = {
  vipFrom: string;
  publicAt: string;
};

export type ScheduledGuideEditorialNews<T extends ScheduledGuide> = {
  current: T | null;
  next: T | null;
  latestPublic: T | null;
};

export function getScheduledGuideEditorialNews<T extends ScheduledGuide>(guides: T[], now = new Date()): ScheduledGuideEditorialNews<T> {
  const instant = now.getTime();
  const scheduled = [...guides].sort((left, right) => Date.parse(left.vipFrom) - Date.parse(right.vipFrom));
  const current = scheduled.find((guide) => Date.parse(guide.vipFrom) <= instant && instant < Date.parse(guide.publicAt)) ?? null;
  const next = scheduled.find((guide) => Date.parse(guide.vipFrom) > instant) ?? null;
  const latestPublic = scheduled.filter((guide) => Date.parse(guide.publicAt) <= instant).at(-1) ?? null;
  return { current, next, latestPublic };
}
