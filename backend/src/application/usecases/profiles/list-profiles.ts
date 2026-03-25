import type { ProfilesReadPort } from '../../ports/out';
import type { IListProfilesParams } from '../../contracts/input';

export class ListProfilesUseCase {
  constructor(private readonly profiles: ProfilesReadPort) {}

  execute(params: IListProfilesParams) {
    return this.profiles.list(params);
  }
}
