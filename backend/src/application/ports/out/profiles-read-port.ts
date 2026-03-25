import type {
  IListProfilesQuery,
  IListProfilesResult,
  IProfileFacets,
} from '../../../domain/profiles';

export interface ProfilesReadPort {
  list(query: IListProfilesQuery): IListProfilesResult;
  getFacets(top: number): IProfileFacets;
  count(): number;
}
