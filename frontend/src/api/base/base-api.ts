import { createApi } from '@reduxjs/toolkit/query/react';
import { API_TAG_TYPES } from '@/api/constants/tag-types';
import { baseQuery } from './base-query';

export const baseApi = createApi({
  reducerPath: 'presightApi',
  baseQuery,
  tagTypes: [...API_TAG_TYPES],
  endpoints: () => ({}),
});
