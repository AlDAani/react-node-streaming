import { type RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import i18next from 'i18next';
import {
  type Profile,
  type ProfilesFacetEntry,
  useGetProfileFacetsQuery,
  useGetProfilesQuery,
} from '@/api/profiles';
import { getApiErrorMessage } from '@/api/utils/api-error';
import { COMMON_TRANSLATIONS } from '@/constants/i18next/common-translations';
import {
  CARD_ROW_ESTIMATE,
  CARD_ROW_GAP,
  EMPTY_FACETS,
  NEXT_PAGE_LOAD_THRESHOLD,
  PAGE_SIZE,
  SEARCH_DEBOUNCE_MS,
} from '../constants';
import { PROFILES_TRANSLATIONS } from '../constants/translations';

export type ProfileVirtualRow = {
  index: number;
  key: string | number;
  profile: Profile;
  start: number;
};

export type ProfilesFiltersSidebarModel = {
  allOptionLabel: string;
  hobbyLabel: string;
  nationalityLabel: string;
  onHobbySelect: (value: string) => void;
  onNationalitySelect: (value: string) => void;
  onSearchChange: (value: string) => void;
  searchInput: string;
  searchLabel: string;
  searchPlaceholder: string;
  selectedHobby: string;
  selectedNationality: string;
  topHobbies: ProfilesFacetEntry[];
  topNationalities: ProfilesFacetEntry[];
};

export type ProfilesStatusPanelModel = {
  emptyLabel: string;
  errorMessage: string | null;
  loadingLabel: string;
  retryLabel: string;
  showEmpty: boolean;
  showError: boolean;
  showLoading: boolean;
  onRetry: () => void;
};

export type ProfilesResultsListModel = {
  cardAgeLabel: string;
  cardHobbiesLabel: string;
  cardNationalityLabel: string;
  isLoadingMore: boolean;
  loadingLabel: string;
  measureElement: (element: HTMLElement | null) => void;
  rows: ProfileVirtualRow[];
  showResults: boolean;
  totalSize: number;
  viewportRef: RefObject<HTMLDivElement | null>;
};

export type ProfilesPageController = {
  filters: ProfilesFiltersSidebarModel;
  results: ProfilesResultsListModel;
  status: ProfilesStatusPanelModel;
  title: string;
};

export const useProfilesPageController = (): ProfilesPageController => {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearchInput, setDebouncedSearchInput] = useState('');
  const [selectedNationality, setSelectedNationality] = useState('');
  const [selectedHobby, setSelectedHobby] = useState('');

  const listViewportRef = useRef<HTMLDivElement | null>(null);
  const pendingNextPageRef = useRef<number | null>(null);
  const goToFirstPage = useCallback(() => {
    setPage((currentPage) => (currentPage === 1 ? currentPage : 1));
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearchInput(searchInput);
      goToFirstPage();
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [goToFirstPage, searchInput]);

  const debouncedSearch = debouncedSearchInput.trim();

  const queryParams = useMemo(
    () => ({
      page,
      pageSize: PAGE_SIZE,
      search: debouncedSearch || undefined,
      nationality: selectedNationality || undefined,
      hobby: selectedHobby || undefined,
    }),
    [debouncedSearch, page, selectedHobby, selectedNationality],
  );

  const {
    data: profilesData,
    error: profilesError,
    isLoading,
    isFetching,
    refetch: refetchProfiles,
  } = useGetProfilesQuery(queryParams);
  const { data: profileFacetsData } = useGetProfileFacetsQuery();

  const profiles = useMemo(() => profilesData?.items ?? [], [profilesData]);
  const nextPage = profilesData?.nextPage ?? null;
  const hasProfiles = profiles.length > 0;
  const errorMessage = profilesError
    ? getApiErrorMessage(profilesError, PROFILES_TRANSLATIONS.error)
    : null;
  const isBusy = isLoading || isFetching;

  const listVirtualizer = useVirtualizer({
    count: profiles.length,
    getScrollElement: () => listViewportRef.current,
    estimateSize: () => CARD_ROW_ESTIMATE,
    overscan: 8,
    gap: CARD_ROW_GAP,
  });

  const virtualRows = listVirtualizer.getVirtualItems();
  const lastVisibleIndex =
    virtualRows.length > 0 ? (virtualRows[virtualRows.length - 1]?.index ?? -1) : -1;

  useEffect(() => {
    pendingNextPageRef.current = null;
  }, [debouncedSearch, selectedNationality, selectedHobby]);

  useEffect(() => {
    if (pendingNextPageRef.current !== null && pendingNextPageRef.current !== nextPage) {
      pendingNextPageRef.current = null;
    }
  }, [nextPage]);

  useEffect(() => {
    const listElement = listViewportRef.current;

    if (!listElement) {
      return;
    }

    if (typeof listElement.scrollTo === 'function') {
      listElement.scrollTo({
        top: 0,
        behavior: 'auto',
      });
      return;
    }

    listElement.scrollTop = 0;
  }, [debouncedSearch, selectedHobby, selectedNationality]);

  const tryLoadNextPage = useCallback(() => {
    if (isBusy || errorMessage || !nextPage) {
      return;
    }

    if (pendingNextPageRef.current === nextPage) {
      return;
    }

    pendingNextPageRef.current = nextPage;

    setPage((currentPage) => {
      if (currentPage === nextPage) {
        return currentPage;
      }

      return nextPage;
    });
  }, [errorMessage, isBusy, nextPage]);

  useEffect(() => {
    if (!hasProfiles || isBusy || errorMessage || !nextPage || lastVisibleIndex < 0) {
      return;
    }

    const isNearListEnd = lastVisibleIndex >= profiles.length - NEXT_PAGE_LOAD_THRESHOLD;

    if (isNearListEnd) {
      tryLoadNextPage();
    }
  }, [
    errorMessage,
    hasProfiles,
    isBusy,
    lastVisibleIndex,
    nextPage,
    profiles.length,
    tryLoadNextPage,
  ]);

  useEffect(() => {
    const listElement = listViewportRef.current;

    if (!listElement || !hasProfiles || isBusy || errorMessage || !nextPage) {
      return;
    }

    const hasScrollableList = listElement.scrollHeight > listElement.clientHeight;

    if (!hasScrollableList) {
      tryLoadNextPage();
    }
  }, [errorMessage, hasProfiles, isBusy, nextPage, tryLoadNextPage]);

  const facets = profileFacetsData ?? EMPTY_FACETS;

  const topNationalities = useMemo(() => facets.nationalities.slice(0, 20), [facets.nationalities]);

  const topHobbies = useMemo(() => facets.hobbies.slice(0, 20), [facets.hobbies]);

  const handleNationalitySelect = useCallback((value: string) => {
    setSelectedNationality((currentValue) => (currentValue === value ? currentValue : value));
    goToFirstPage();
  }, [goToFirstPage]);

  const handleHobbySelect = useCallback((value: string) => {
    setSelectedHobby((currentValue) => (currentValue === value ? currentValue : value));
    goToFirstPage();
  }, [goToFirstPage]);

  const rows = useMemo<ProfileVirtualRow[]>(
    () =>
      virtualRows.flatMap((virtualRow) => {
        const profile = profiles[virtualRow.index];

        if (!profile) {
          return [];
        }

        return [
          {
            index: virtualRow.index,
            key: String(virtualRow.key),
            profile,
            start: virtualRow.start,
          },
        ];
      }),
    [profiles, virtualRows],
  );

  return {
    title: i18next.t(PROFILES_TRANSLATIONS.title),
    filters: {
      allOptionLabel: i18next.t(PROFILES_TRANSLATIONS.allOption),
      hobbyLabel: i18next.t(PROFILES_TRANSLATIONS.hobbyLabel),
      nationalityLabel: i18next.t(PROFILES_TRANSLATIONS.nationalityLabel),
      onHobbySelect: handleHobbySelect,
      onNationalitySelect: handleNationalitySelect,
      onSearchChange: setSearchInput,
      searchInput,
      searchLabel: i18next.t(PROFILES_TRANSLATIONS.searchLabel),
      searchPlaceholder: i18next.t(PROFILES_TRANSLATIONS.searchPlaceholder),
      selectedHobby,
      selectedNationality,
      topHobbies,
      topNationalities,
    },
    status: {
      emptyLabel: i18next.t(PROFILES_TRANSLATIONS.empty),
      errorMessage,
      loadingLabel: i18next.t(COMMON_TRANSLATIONS.loading),
      onRetry: () => {
        void refetchProfiles();
      },
      retryLabel: i18next.t(COMMON_TRANSLATIONS.retry),
      showEmpty: !isBusy && !errorMessage && !hasProfiles,
      showError: Boolean(errorMessage) && !hasProfiles,
      showLoading: isLoading && !hasProfiles,
    },
    results: {
      cardAgeLabel: i18next.t(PROFILES_TRANSLATIONS.cardAge),
      cardHobbiesLabel: i18next.t(PROFILES_TRANSLATIONS.cardHobbies),
      cardNationalityLabel: i18next.t(PROFILES_TRANSLATIONS.cardNationality),
      isLoadingMore: isBusy && Boolean(nextPage),
      loadingLabel: i18next.t(COMMON_TRANSLATIONS.loading),
      measureElement: listVirtualizer.measureElement as (element: HTMLElement | null) => void,
      rows,
      showResults: hasProfiles,
      totalSize: listVirtualizer.getTotalSize(),
      viewportRef: listViewportRef,
    },
  };
};
