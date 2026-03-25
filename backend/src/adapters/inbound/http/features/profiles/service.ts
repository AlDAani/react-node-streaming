import type { ProfilesReadPort } from '@/application/ports/out';
import { ListProfileFacetsUseCase } from '@/application/usecases/profiles/list-profile-facets';
import { ListProfilesUseCase } from '@/application/usecases/profiles/list-profiles';
import type { IListProfilesParams } from './schemas';

export class ProfilesService {
  private readonly listProfilesUseCase: ListProfilesUseCase;

  private readonly listProfileFacetsUseCase: ListProfileFacetsUseCase;

  constructor(profiles: ProfilesReadPort) {
    this.listProfilesUseCase = new ListProfilesUseCase(profiles);
    this.listProfileFacetsUseCase = new ListProfileFacetsUseCase(profiles);
  }

  listProfiles(params: IListProfilesParams) {
    return this.listProfilesUseCase.execute(params);
  }

  listFacets(top: number) {
    return this.listProfileFacetsUseCase.execute(top);
  }
}
