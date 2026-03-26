import assert from 'node:assert/strict';
import test from 'node:test';
import { InMemoryProfilesReadAdapter } from '../../../../../adapters/outbound/in-memory/profiles-read-adapter';
import { ProfilesService } from './service';

test('ProfilesService returns paginated profile results', () => {
  const profiles = new InMemoryProfilesReadAdapter();
  const service = new ProfilesService(profiles);

  const result = service.listProfiles({
    offset: 0,
    limit: 5,
    search: '',
    nationality: '',
    hobby: '',
    ageMin: null,
    ageMax: null,
  });

  assert.equal(result.items.length, 5);
  assert.equal(result.total > 0, true);
  assert.equal(result.hasMore, true);
});

test('ProfilesService returns top facets', () => {
  const profiles = new InMemoryProfilesReadAdapter();
  const service = new ProfilesService(profiles);

  const facets = service.listFacets(20);

  assert.equal(Array.isArray(facets.hobbies), true);
  assert.equal(Array.isArray(facets.nationalities), true);
  assert.equal(facets.hobbies.length <= 20, true);
  assert.equal(facets.nationalities.length <= 20, true);
});
