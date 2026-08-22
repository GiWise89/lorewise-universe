export type ProfileCompletionSource = {
  displayName?: string | null;
  username?: string | null;
};

export type RequiredProfileField = "displayName" | "username";

export const requiredProfileLabels: Record<RequiredProfileField, string> = {
  displayName: "nome pubblico",
  username: "nickname",
};

export function profileCompletion(profile: ProfileCompletionSource) {
  const missingProfileFields: RequiredProfileField[] = [];
  if (!profile.displayName?.trim()) missingProfileFields.push("displayName");
  if (!profile.username?.trim()) missingProfileFields.push("username");
  return { profileComplete: missingProfileFields.length === 0, missingProfileFields };
}
