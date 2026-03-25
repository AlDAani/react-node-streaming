import { type ProfilesFacets } from '@/api/profiles';

export const PAGE_SIZE = 20;
export const NEXT_PAGE_LOAD_THRESHOLD = 4;
export const SEARCH_DEBOUNCE_MS = 250;
export const CARD_ROW_ESTIMATE = 150;
export const CARD_ROW_GAP = 16;
export const EMPTY_FACETS: ProfilesFacets = {
  nationalities: [],
  hobbies: [],
};
