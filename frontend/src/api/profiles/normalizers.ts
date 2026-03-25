import type {
  GetProfilesParams,
  Profile,
  ProfilesFacetEntry,
  ProfilesFacets,
  ProfilesResponse,
} from './types';

const asRecord = (value: unknown): Record<string, unknown> =>
  typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};

const asStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : [];

const asFacetEntries = (value: unknown): ProfilesFacetEntry[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      if (typeof entry === 'string') {
        return {
          value: entry,
          count: 0,
        };
      }

      const record = asRecord(entry);
      if (typeof record.value !== 'string') {
        return null;
      }

      return {
        value: record.value,
        count: typeof record.count === 'number' ? record.count : 0,
      };
    })
    .filter((entry): entry is ProfilesFacetEntry => entry !== null);
};

const parseProfile = (value: unknown, index: number): Profile => {
  const record = asRecord(value);

  return {
    id: String(record.id ?? index),
    avatar: String(record.avatar ?? ''),
    firstName: String(record.first_name ?? record.firstName ?? ''),
    lastName: String(record.last_name ?? record.lastName ?? ''),
    age: Number(record.age ?? 0),
    nationality: String(record.nationality ?? '-'),
    hobbies: asStringArray(record.hobbies),
  };
};

const getNextPage = (record: Record<string, unknown>, params: GetProfilesParams): number | null => {
  const metaRecord = asRecord(record.meta);
  const paginationRecord = asRecord(metaRecord.pagination);

  if (typeof paginationRecord.nextCursor === 'number' && paginationRecord.nextCursor >= 0) {
    return Math.floor(paginationRecord.nextCursor / params.pageSize) + 1;
  }

  if (paginationRecord.hasMore === true) {
    return params.page + 1;
  }

  if (typeof record.nextPage === 'number') {
    return record.nextPage;
  }

  if (typeof record.page === 'number' && typeof record.totalPages === 'number') {
    return record.page < record.totalPages ? record.page + 1 : null;
  }

  if (record.hasMore === true && typeof record.page === 'number') {
    return record.page + 1;
  }

  return null;
};

export const normalizeProfilesResponse = (
  payload: unknown,
  params: GetProfilesParams,
): ProfilesResponse => {
  const record = asRecord(payload);
  const data = Array.isArray(record.data) ? record.data : record.items;

  return {
    items: Array.isArray(data) ? data.map((entry, index) => parseProfile(entry, index)) : [],
    nextPage: getNextPage(record, params),
  };
};

export const normalizeProfileFacets = (payload: unknown): ProfilesFacets => {
  const record = asRecord(payload);
  const dataRecord = asRecord(record.data);

  return {
    nationalities: asFacetEntries(dataRecord.nationalities || record.nationalities),
    hobbies: asFacetEntries(dataRecord.hobbies || record.hobbies),
  };
};
