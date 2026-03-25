import type { ProfilesReadPort } from '@/application/ports/out';
import {
  createProfiles,
  DEFAULT_FACETS_LIMIT,
  type IFacetEntry,
  type IListProfilesQuery,
  type IListProfilesResult,
  type IProfile,
  type IProfileFacets,
} from '../../../domain/profiles';

interface IStoredProfile {
  profile: IProfile;
  fullNameLower: string;
  nationalityLower: string;
  hobbiesLower: Set<string>;
}

function toFacetEntries(input: Map<string, number>): IFacetEntry[] {
  return [...input.entries()]
    .sort((left, right) => {
      if (right[1] !== left[1]) {
        return right[1] - left[1];
      }

      return left[0].localeCompare(right[0]);
    })
    .map(([value, count]) => ({ value, count }));
}

export class InMemoryProfilesReadAdapter implements ProfilesReadPort {
  private profiles: IProfile[];
  private storedProfiles: IStoredProfile[];
  private nationalityIndex: Map<string, IStoredProfile[]>;
  private hobbyIndex: Map<string, IStoredProfile[]>;
  private profilesCount: number;
  private facetCache: IProfileFacets;

  constructor(seedProfiles: IProfile[] = createProfiles()) {
    this.profiles = seedProfiles;
    this.storedProfiles = seedProfiles.map((profile) => ({
      profile,
      fullNameLower: `${profile.first_name} ${profile.last_name}`.toLowerCase(),
      nationalityLower: profile.nationality.toLowerCase(),
      hobbiesLower: new Set(profile.hobbies.map((entry) => entry.toLowerCase())),
    }));
    this.nationalityIndex = new Map();
    this.hobbyIndex = new Map();
    this.buildSearchIndexes();
    this.profilesCount = seedProfiles.length;
    this.facetCache = this.buildFacetCache(seedProfiles);
  }

  list({ cursor, limit, search, nationality, hobby, ageMin, ageMax }: IListProfilesQuery): IListProfilesResult {
    const normalizedSearch = search.trim().toLowerCase();
    const normalizedNationality = nationality.trim().toLowerCase();
    const normalizedHobby = hobby.trim().toLowerCase();
    const hasActiveFilters =
      normalizedSearch !== '' ||
      normalizedNationality !== '' ||
      normalizedHobby !== '' ||
      ageMin !== null ||
      ageMax !== null;

    if (!hasActiveFilters) {
      const items = this.profiles.slice(cursor, cursor + limit);
      const nextCursor = cursor + items.length;

      return {
        items,
        total: this.profilesCount,
        nextCursor: nextCursor < this.profilesCount ? nextCursor : null,
        hasMore: nextCursor < this.profilesCount,
      };
    }

    let candidates = this.storedProfiles;

    if (normalizedNationality) {
      candidates = this.nationalityIndex.get(normalizedNationality) ?? [];
    }

    if (normalizedHobby) {
      const hobbyCandidates = this.hobbyIndex.get(normalizedHobby) ?? [];

      if (candidates === this.storedProfiles) {
        candidates = hobbyCandidates;
      } else if (candidates.length <= hobbyCandidates.length) {
        const hobbyIds = new Set(hobbyCandidates.map((entry) => entry.profile.id));
        candidates = candidates.filter((entry) => hobbyIds.has(entry.profile.id));
      } else {
        const candidateIds = new Set(candidates.map((entry) => entry.profile.id));
        candidates = hobbyCandidates.filter((entry) => candidateIds.has(entry.profile.id));
      }
    }

    const items: IProfile[] = [];
    let totalMatches = 0;

    for (const storedProfile of candidates) {
      const { profile } = storedProfile;

      if (ageMin !== null && profile.age < ageMin) {
        continue;
      }

      if (ageMax !== null && profile.age > ageMax) {
        continue;
      }

      if (normalizedNationality && storedProfile.nationalityLower !== normalizedNationality) {
        continue;
      }

      if (normalizedHobby && !storedProfile.hobbiesLower.has(normalizedHobby)) {
        continue;
      }

      if (normalizedSearch && !storedProfile.fullNameLower.includes(normalizedSearch)) {
        continue;
      }

      const matchIndex = totalMatches;
      totalMatches += 1;

      if (matchIndex >= cursor && items.length < limit) {
        items.push(profile);
      }
    }

    const nextCursor = cursor + items.length;

    return {
      items,
      total: totalMatches,
      nextCursor: nextCursor < totalMatches ? nextCursor : null,
      hasMore: nextCursor < totalMatches,
    };
  }

  getFacets(top = DEFAULT_FACETS_LIMIT): IProfileFacets {
    return {
      hobbies: this.facetCache.hobbies.slice(0, top),
      nationalities: this.facetCache.nationalities.slice(0, top),
    };
  }

  count(): number {
    return this.profilesCount;
  }

  private buildSearchIndexes(): void {
    for (const storedProfile of this.storedProfiles) {
      const nationalityBucket = this.nationalityIndex.get(storedProfile.nationalityLower) ?? [];
      nationalityBucket.push(storedProfile);
      this.nationalityIndex.set(storedProfile.nationalityLower, nationalityBucket);

      for (const hobbyLower of storedProfile.hobbiesLower) {
        const hobbyBucket = this.hobbyIndex.get(hobbyLower) ?? [];
        hobbyBucket.push(storedProfile);
        this.hobbyIndex.set(hobbyLower, hobbyBucket);
      }
    }
  }

  private buildFacetCache(seedProfiles: IProfile[]): IProfileFacets {
    const hobbiesMap = new Map<string, number>();
    const nationalitiesMap = new Map<string, number>();

    for (const profile of seedProfiles) {
      nationalitiesMap.set(profile.nationality, (nationalitiesMap.get(profile.nationality) ?? 0) + 1);
      for (const hobbyEntry of profile.hobbies) {
        hobbiesMap.set(hobbyEntry, (hobbiesMap.get(hobbyEntry) ?? 0) + 1);
      }
    }

    return {
      hobbies: toFacetEntries(hobbiesMap),
      nationalities: toFacetEntries(nationalitiesMap),
    };
  }
}
