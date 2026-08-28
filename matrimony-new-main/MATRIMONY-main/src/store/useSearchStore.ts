import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface SearchFilterState {
  gender: string;
  ageMin: number;
  ageMax: number;
  religion: string;
  caste: string;
  location: string;
  profession: string;
  education: string;
  verifiedOnly: boolean;
  maritalStatus: string;
  keyword: string;
}

export const initialSearchFilter: SearchFilterState = {
  gender: 'Female',
  ageMin: 22,
  ageMax: 35,
  religion: 'All',
  caste: 'All',
  location: 'All',
  profession: 'All',
  education: 'All',
  verifiedOnly: false,
  maritalStatus: 'All',
  keyword: ''
};

interface SearchStore {
  searchFilter: SearchFilterState;
  setSearchFilter: (filterOrFn: SearchFilterState | ((prev: SearchFilterState) => SearchFilterState)) => void;
  updateSearchFilter: (partial: Partial<SearchFilterState>) => void;
  resetSearchFilter: () => void;
}

export const useSearchStore = create<SearchStore>()(
  persist(
    (set) => ({
      searchFilter: initialSearchFilter,

      setSearchFilter: (filterOrFn) =>
        set((state) => ({
          searchFilter:
            typeof filterOrFn === 'function' ? filterOrFn(state.searchFilter) : filterOrFn
        })),

      updateSearchFilter: (partial) =>
        set((state) => ({
          searchFilter: {
            ...state.searchFilter,
            ...partial
          }
        })),

      resetSearchFilter: () =>
        set({
          searchFilter: initialSearchFilter
        })
    }),
    {
      name: 'vivah_search_filters',
      storage: createJSONStorage(() => localStorage)
    }
  )
);
