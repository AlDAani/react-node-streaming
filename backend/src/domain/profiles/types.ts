export interface IProfile {
  id: string;
  avatar: string;
  first_name: string;
  last_name: string;
  age: number;
  nationality: string;
  hobbies: string[];
}

export interface IListProfilesQuery {
  offset: number;
  limit: number;
  search: string;
  nationality: string;
  hobby: string;
  ageMin: number | null;
  ageMax: number | null;
}

export interface IListProfilesResult {
  items: IProfile[];
  total: number;
  nextOffset: number | null;
  hasMore: boolean;
}

export interface IFacetEntry {
  value: string;
  count: number;
}

export interface IProfileFacets {
  hobbies: IFacetEntry[];
  nationalities: IFacetEntry[];
}
