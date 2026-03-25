import assert from 'node:assert/strict';
import test from 'node:test';
import { createProfiles } from '../../../domain/profiles';
import { InMemoryProfilesReadAdapter } from './profiles-read-adapter';

test('createProfiles creates deterministic list', () => {
  const profiles = createProfiles(3);
  assert.equal(profiles.length, 3);
  assert.equal(profiles[0]?.id, 'profile-0001');
  assert.equal(typeof profiles[0]?.avatar, 'string');
});

test('ProfileRepository list supports filters and pagination', () => {
  const repository = new InMemoryProfilesReadAdapter(createProfiles(50));
  const list = repository.list({
    cursor: 0,
    limit: 5,
    search: 'avery',
    nationality: '',
    hobby: '',
    ageMin: null,
    ageMax: null,
  });

  assert.equal(list.items.length > 0 && list.items.length <= 5, true);
  assert.equal(list.total >= list.items.length, true);
  assert.equal(typeof list.hasMore, 'boolean');
});

test('ProfileRepository list uses fast path when filters are empty', () => {
  const repository = new InMemoryProfilesReadAdapter(createProfiles(12));
  const list = repository.list({
    cursor: 5,
    limit: 4,
    search: '',
    nationality: '',
    hobby: '',
    ageMin: null,
    ageMax: null,
  });

  assert.deepEqual(
    list.items.map((profile) => profile.id),
    ['profile-0006', 'profile-0007', 'profile-0008', 'profile-0009'],
  );
  assert.equal(list.total, 12);
  assert.equal(list.nextCursor, 9);
  assert.equal(list.hasMore, true);
});

test('ProfileRepository list supports case-insensitive exact filters and age ranges', () => {
  const repository = new InMemoryProfilesReadAdapter(createProfiles(80));
  const list = repository.list({
    cursor: 0,
    limit: 10,
    search: '',
    nationality: 'canadian',
    hobby: 'cycling',
    ageMin: 18,
    ageMax: 35,
  });

  assert.equal(list.total > 0, true);
  assert.equal(
    list.items.every(
      (profile) =>
        profile.nationality.toLowerCase() === 'canadian' &&
        profile.hobbies.some((entry) => entry.toLowerCase() === 'cycling') &&
        profile.age >= 18 &&
        profile.age <= 35,
    ),
    true,
  );
});

test('ProfileRepository list returns empty page when cursor is beyond total', () => {
  const repository = new InMemoryProfilesReadAdapter(createProfiles(10));
  const list = repository.list({
    cursor: 99,
    limit: 5,
    search: '',
    nationality: '',
    hobby: '',
    ageMin: null,
    ageMax: null,
  });

  assert.deepEqual(list.items, []);
  assert.equal(list.total, 10);
  assert.equal(list.nextCursor, null);
  assert.equal(list.hasMore, false);
});

test('ProfileRepository facets are capped and sorted', () => {
  const repository = new InMemoryProfilesReadAdapter(createProfiles(60));
  const facets = repository.getFacets(5);
  assert.equal(facets.hobbies.length <= 5, true);
  assert.equal(facets.nationalities.length <= 5, true);
  assert.equal(facets.hobbies.every((entry, index, items) => {
    const nextEntry = items[index + 1];

    if (!nextEntry) {
      return true;
    }

    return (
      entry.count > nextEntry.count ||
      (entry.count === nextEntry.count && entry.value.localeCompare(nextEntry.value) <= 0)
    );
  }), true);
});

test('ProfileRepository facets remain stable across repeated calls and limits', () => {
  const repository = new InMemoryProfilesReadAdapter(createProfiles(60));
  const first = repository.getFacets(3);
  const second = repository.getFacets(3);
  const expanded = repository.getFacets(6);

  assert.deepEqual(first, second);
  assert.deepEqual(expanded.hobbies.slice(0, 3), first.hobbies);
  assert.deepEqual(expanded.nationalities.slice(0, 3), first.nationalities);
});
