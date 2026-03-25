import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { GetProfilesParams, Profile, ProfilesFacets, ProfilesResponse } from '@/api/profiles';

const getProfilesQueryMock = vi.fn();
const getProfileFacetsQueryMock = vi.fn();
const refetchProfilesMock = vi.fn();
const virtualItemsFactoryMock = vi.fn();

const createVirtualItems = (count: number) =>
  Array.from({ length: count }, (_value, index) => ({
    index,
    key: index,
    start: index * 220,
  }));

vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: ({ count }: { count: number }) => ({
    getVirtualItems: () => virtualItemsFactoryMock(count),
    getTotalSize: () => count * 220,
    measureElement: () => undefined,
  }),
}));

vi.mock('@/api/profiles', () => ({
  useGetProfilesQuery: (params: GetProfilesParams) => getProfilesQueryMock(params),
  useGetProfileFacetsQuery: () => getProfileFacetsQueryMock(),
}));

import { ProfilesPage } from './index';

const FACETS_WITH_COUNTS: ProfilesFacets = {
  nationalities: [
    { value: 'Japanese', count: 11 },
    { value: 'Canadian', count: 8 },
  ],
  hobbies: [
    { value: 'Knitting', count: 12 },
    { value: 'Chess', count: 7 },
  ],
};

const createProfile = (id: number): Profile => ({
  id: String(id),
  avatar: '',
  firstName: `User ${id}`,
  lastName: 'Test',
  age: 18 + id,
  nationality: 'Testland',
  hobbies: id % 2 === 0 ? ['Chess'] : [],
});

const createAveryProfile = (id: number): Profile => ({
  id: `avery-${id}`,
  avatar: '',
  firstName: 'Avery',
  lastName: 'Tanaka',
  age: 20 + id,
  nationality: 'Japanese',
  hobbies: ['Knitting'],
});

const createProfilesResponse = (items: Profile[], nextPage: number | null): ProfilesResponse => ({
  items,
  nextPage,
});

const createQueryResult = (data: ProfilesResponse | undefined) => ({
  data,
  error: undefined,
  isLoading: !data,
  isFetching: false,
  refetch: refetchProfilesMock,
});

describe('profiles infinite scroll', () => {
  beforeEach(() => {
    getProfilesQueryMock.mockReset();
    getProfileFacetsQueryMock.mockReset();
    refetchProfilesMock.mockReset();
    virtualItemsFactoryMock.mockReset();
    virtualItemsFactoryMock.mockImplementation((count: number) => createVirtualItems(count));

    getProfileFacetsQueryMock.mockReturnValue({
      data: FACETS_WITH_COUNTS,
    });
  });

  it('requests each next page once when virtualized list reaches the end', async () => {
    const pageTransitions: number[] = [];
    let lastRequestedPage: number | null = null;

    getProfilesQueryMock.mockImplementation(({ page }: GetProfilesParams) => {
      if (page !== lastRequestedPage) {
        pageTransitions.push(page);
        lastRequestedPage = page;
      }

      if (page === 1) {
        return createQueryResult(
          createProfilesResponse(
            Array.from({ length: 20 }, (_value, index) => createProfile(index + 1)),
            2,
          ),
        );
      }

      if (page === 2) {
        return createQueryResult(
          createProfilesResponse(
            Array.from({ length: 40 }, (_value, index) => createProfile(index + 1)),
            3,
          ),
        );
      }

      return createQueryResult(
        createProfilesResponse(
          Array.from({ length: 60 }, (_value, index) => createProfile(index + 1)),
          null,
        ),
      );
    });

    render(<ProfilesPage />);

    await screen.findByText('User 1 Test');

    await waitFor(() => {
      expect(pageTransitions).toEqual([1, 2, 3]);
    });
  });

  it('renders side filter lists and applies nationality + hobby filters with page reset', async () => {
    getProfilesQueryMock.mockImplementation(({ page }: GetProfilesParams) => {
      if (page === 1) {
        return createQueryResult(
          createProfilesResponse(
            Array.from({ length: 20 }, (_value, index) => createProfile(index + 1)),
            null,
          ),
        );
      }

      return createQueryResult(createProfilesResponse([], null));
    });

    render(<ProfilesPage />);

    await screen.findByText('Japanese');
    expect(screen.getByText('11')).not.toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /japanese/i }));
    fireEvent.click(screen.getByRole('button', { name: /knitting/i }));

    await waitFor(() => {
      const calls = getProfilesQueryMock.mock.calls
        .map(([params]) => params as GetProfilesParams)
        .filter((params) => params.nationality === 'Japanese' || params.hobby === 'Knitting');

      expect(calls.length).toBeGreaterThan(0);
      expect(calls.every((params) => params.page === 1)).toBe(true);
    });
  });

  it('search replaces current list and keeps only search result items', async () => {
    getProfilesQueryMock.mockImplementation(({ page, search }: GetProfilesParams) => {
      if (search === 'Avery Tanaka') {
        return createQueryResult(
          createProfilesResponse(
            Array.from({ length: 11 }, (_value, index) => createAveryProfile(index + 1)),
            null,
          ),
        );
      }

      if (page === 1) {
        return createQueryResult(
          createProfilesResponse(
            Array.from({ length: 20 }, (_value, index) => createProfile(index + 1)),
            null,
          ),
        );
      }

      return createQueryResult(createProfilesResponse([], null));
    });

    render(<ProfilesPage />);

    await screen.findByText('User 1 Test');

    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: 'Avery Tanaka' },
    });

    await act(async () => {
      await new Promise((resolve) => {
        window.setTimeout(resolve, 320);
      });
    });

    await waitFor(() => {
      expect(screen.getAllByText('Avery Tanaka').length).toBeGreaterThan(0);
    });

    expect(screen.getAllByText('Avery Tanaka')).toHaveLength(11);
    expect(screen.queryByText('User 1 Test')).toBeNull();

    const searchCalls = getProfilesQueryMock.mock.calls
      .map(([params]) => params as GetProfilesParams)
      .filter((params) => params.search === 'Avery Tanaka');

    expect(searchCalls.length).toBeGreaterThan(0);
    expect(searchCalls.every((params) => params.page === 1)).toBe(true);
  });

  it('loads next page when list container is not scrollable', async () => {
    const pageTransitions: number[] = [];
    let lastRequestedPage: number | null = null;

    virtualItemsFactoryMock.mockImplementation(() => []);

    getProfilesQueryMock.mockImplementation(({ page }: GetProfilesParams) => {
      if (page !== lastRequestedPage) {
        pageTransitions.push(page);
        lastRequestedPage = page;
      }

      if (page === 1) {
        return createQueryResult(
          createProfilesResponse(
            Array.from({ length: 20 }, (_value, index) => createProfile(index + 1)),
            2,
          ),
        );
      }

      return createQueryResult(
        createProfilesResponse(
          Array.from({ length: 40 }, (_value, index) => createProfile(index + 1)),
          null,
        ),
      );
    });

    render(<ProfilesPage />);

    await waitFor(() => {
      expect(pageTransitions).toEqual([1, 2]);
    });
  });
});
