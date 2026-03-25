export const API_TAG_TYPES = ['Profiles', 'ProfilesFacets', 'QueueJobs'] as const;

export type ApiTagType = (typeof API_TAG_TYPES)[number];
