import type { ProfilesReadPort } from '../../ports/out';

export class ListProfileFacetsUseCase {
  constructor(private readonly profiles: ProfilesReadPort) {}

  execute(top: number) {
    return this.profiles.getFacets(top);
  }
}
