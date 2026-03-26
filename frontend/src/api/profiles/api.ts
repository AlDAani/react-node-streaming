import { baseApi } from '@/api/base/base-api';
import { normalizeProfileFacets, normalizeProfilesResponse } from './normalizers';
import type { GetProfilesParams, ProfilesFacets, ProfilesResponse } from './types';

const buildProfilesSearchParams = (params: GetProfilesParams) => {
  const searchParams = new URLSearchParams();
  const offset = Math.max((params.page - 1) * params.pageSize, 0);

  searchParams.set('offset', String(offset));
  searchParams.set('limit', String(params.pageSize));

  if (params.search) {
    searchParams.set('search', params.search);
  }

  if (params.nationality) {
    searchParams.set('nationality', params.nationality);
  }

  if (params.hobby) {
    searchParams.set('hobby', params.hobby);
  }

  return searchParams;
};

const dedupeProfilesById = (profiles: ProfilesResponse['items']) => {
  const seen = new Set<string>();

  return profiles.filter((profile) => {
    if (seen.has(profile.id)) {
      return false;
    }

    seen.add(profile.id);
    return true;
  });
};

export const profilesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getProfiles: build.query<ProfilesResponse, GetProfilesParams>({
      query: (params) => ({
        url: `/api/profiles?${buildProfilesSearchParams(params).toString()}`,
        method: 'GET',
      }),
      transformResponse: (payload: unknown, _meta, arg) => normalizeProfilesResponse(payload, arg),
      serializeQueryArgs: ({ queryArgs }) => {
        return {
          pageSize: queryArgs.pageSize,
          search: queryArgs.search || '',
          nationality: queryArgs.nationality || '',
          hobby: queryArgs.hobby || '',
        };
      },
      merge: (currentCache, incoming, meta) => {
        if (meta.arg.page === 1) {
          currentCache.items = incoming.items;
          currentCache.nextPage = incoming.nextPage;
          return;
        }

        currentCache.items = dedupeProfilesById([...currentCache.items, ...incoming.items]);
        currentCache.nextPage = incoming.nextPage;
      },
      forceRefetch: ({ currentArg, previousArg }) => {
        if (!currentArg || !previousArg) {
          return true;
        }

        return (
          currentArg.page !== previousArg.page ||
          currentArg.pageSize !== previousArg.pageSize ||
          currentArg.search !== previousArg.search ||
          currentArg.nationality !== previousArg.nationality ||
          currentArg.hobby !== previousArg.hobby
        );
      },
      providesTags: [{ type: 'Profiles', id: 'LIST' }],
    }),
    getProfileFacets: build.query<ProfilesFacets, void>({
      query: () => ({
        url: '/api/profiles/facets',
        method: 'GET',
      }),
      transformResponse: (payload: unknown) => normalizeProfileFacets(payload),
      providesTags: [{ type: 'ProfilesFacets', id: 'ALL' }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetProfilesQuery,
  useLazyGetProfilesQuery,
  useGetProfileFacetsQuery,
  useLazyGetProfileFacetsQuery,
} = profilesApi;
