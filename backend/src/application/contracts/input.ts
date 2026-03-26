export interface IJobPayload {
  input: string;
  clientId: number | null;
}

export interface IListProfilesParams {
  offset: number;
  limit: number;
  search: string;
  nationality: string;
  hobby: string;
  ageMin: number | null;
  ageMax: number | null;
}
