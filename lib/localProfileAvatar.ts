type LocalProfileAvatar = {
  userId: string;
  username: string;
  contentType: string;
  bytes: Uint8Array;
  updatedAt: string;
};

type LocalProfileAvatarStore = Map<string, LocalProfileAvatar>;

const globalStore = globalThis as typeof globalThis & {
  __lorewiseLocalProfileAvatars?: LocalProfileAvatarStore;
};

const avatars = globalStore.__lorewiseLocalProfileAvatars ??= new Map<string, LocalProfileAvatar>();

export function saveLocalProfileAvatar(input: Omit<LocalProfileAvatar, "updatedAt">) {
  const avatar = { ...input, updatedAt: new Date().toISOString() };
  avatars.set(input.userId, avatar);
  return avatar;
}

export function removeLocalProfileAvatar(userId: string) {
  return avatars.delete(userId);
}

export function localProfileAvatarForUser(userId: string) {
  return avatars.get(userId) ?? null;
}

export function localProfileAvatarForUsername(username: string) {
  const normalized = username.trim().toLocaleLowerCase("it");
  return [...avatars.values()].find((avatar) => avatar.username === normalized) ?? null;
}

export function updateLocalProfileAvatarUsername(userId: string, username: string) {
  const avatar = avatars.get(userId);
  if (avatar) avatar.username = username.trim().toLocaleLowerCase("it");
}
