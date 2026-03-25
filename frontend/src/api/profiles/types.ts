export type Profile = {
  id: string;
  avatar: string;
  firstName: string;
  lastName: string;
  age: number;
  nationality: string;
  hobbies: string[];
};

export type ProfilesFacetEntry = {
  value: string;
  count: number;
};

export type ProfilesFacets = {
  nationalities: ProfilesFacetEntry[];
  hobbies: ProfilesFacetEntry[];
};

export type ProfilesResponse = {
  items: Profile[];
  nextPage: number | null;
};

export type GetProfilesParams = {
  page: number;
  pageSize: number;
  search?: string;
  nationality?: string;
  hobby?: string;
};
