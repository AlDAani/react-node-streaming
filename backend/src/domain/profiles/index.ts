import {
  DEFAULT_PROFILE_TOTAL,
  FIRST_NAMES,
  HOBBIES,
  LAST_NAMES,
  NATIONALITIES,
} from './constants';
import type { IProfile } from './types';

function createAvatar(firstName: string, lastName: string, index: number): string {
  const initials = `${firstName[0]}${lastName[0]}`;
  const hue = (index * 37) % 360;
  const accentHue = (hue + 28) % 360;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="88" height="88" viewBox="0 0 88 88" role="img" aria-label="${initials}">
      <defs>
        <linearGradient id="gradient-${index}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="hsl(${hue} 76% 71%)" />
          <stop offset="100%" stop-color="hsl(${accentHue} 68% 58%)" />
        </linearGradient>
      </defs>
      <rect width="88" height="88" rx="24" fill="url(#gradient-${index})" />
      <circle cx="69" cy="19" r="11" fill="rgb(255 255 255 / 0.18)" />
      <circle cx="20" cy="73" r="16" fill="rgb(255 255 255 / 0.12)" />
      <text x="44" y="52" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="rgb(255 255 255 / 0.96)">${initials}</text>
    </svg>
  `.trim();

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export function createProfiles(total = DEFAULT_PROFILE_TOTAL): IProfile[] {
  return Array.from({ length: total }, (_, index) => {
    const firstName = FIRST_NAMES[index % FIRST_NAMES.length];
    const lastName = LAST_NAMES[(index * 3) % LAST_NAMES.length];
    const nationality = NATIONALITIES[(index * 7) % NATIONALITIES.length];
    const hobbiesCount = index % 11;
    const hobbies: string[] = [];

    for (let hobbyIndex = 0; hobbyIndex < hobbiesCount; hobbyIndex += 1) {
      hobbies.push(HOBBIES[(index + hobbyIndex * 5) % HOBBIES.length]);
    }

    return {
      id: `profile-${String(index + 1).padStart(4, '0')}`,
      avatar: createAvatar(firstName, lastName, index),
      first_name: firstName,
      last_name: lastName,
      age: 18 + (index % 48),
      nationality,
      hobbies,
    };
  });
}

export * from './constants';
export type {
  IFacetEntry,
  IListProfilesQuery,
  IListProfilesResult,
  IProfile,
  IProfileFacets,
} from './types';
