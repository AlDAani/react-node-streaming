import type { Profile } from '@/api/profiles';

export const getDisplayHobbies = (hobbies: string[]) => {
  const preview = hobbies.slice(0, 2);
  const hiddenCount = Math.max(hobbies.length - preview.length, 0);

  return {
    preview,
    hiddenCount,
  };
};

export const getDisplayName = (profile: Profile) => {
  const value = `${profile.firstName} ${profile.lastName}`.trim();

  return value || profile.id;
};
