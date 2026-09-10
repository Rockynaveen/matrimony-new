// ──────────────────────────────────────────────────────────────
// TanStack Query Hooks for Profile Master Data & Location Hierarchy
// ──────────────────────────────────────────────────────────────

import { useQuery } from '@tanstack/react-query';
import { profileService } from '../services/profile.service';
import type {
  IncomeRangeItem,
  EducationItem,
  ProfessionItem,
  ReligionItem,
  CasteItem,
  LanguageItem,
  HobbyItem,
  CountryItem,
  StateItem,
  DistrictItem,
  MandalItem,
  VillageItem,
} from '../types/profile.types';

export const masterDataKeys = {
  all: ['masterData'] as const,
  incomeRanges: () => [...masterDataKeys.all, 'incomeRanges'] as const,
  educations: () => [...masterDataKeys.all, 'educations'] as const,
  professions: () => [...masterDataKeys.all, 'professions'] as const,
  religions: () => [...masterDataKeys.all, 'religions'] as const,
  castes: (religionId?: number | string | null) => [...masterDataKeys.all, 'castes', religionId] as const,
  languages: () => [...masterDataKeys.all, 'languages'] as const,
  hobbies: () => [...masterDataKeys.all, 'hobbies'] as const,
  countries: (search?: string) => [...masterDataKeys.all, 'countries', search] as const,
  states: (countryId?: number | string | null, search?: string) => [...masterDataKeys.all, 'states', countryId, search] as const,
  districts: (stateId?: number | string | null, search?: string) => [...masterDataKeys.all, 'districts', stateId, search] as const,
  mandals: (districtId?: number | string | null, search?: string) => [...masterDataKeys.all, 'mandals', districtId, search] as const,
  villages: (mandalId?: number | string | null, search?: string) => [...masterDataKeys.all, 'villages', mandalId, search] as const,
};

const STALE_TIME = 15 * 60 * 1000; // 15 mins caching for master data

export function useIncomeRanges() {
  return useQuery<IncomeRangeItem[], Error>({
    queryKey: masterDataKeys.incomeRanges(),
    queryFn: () => profileService.getIncomeRanges(),
    staleTime: STALE_TIME,
  });
}

export function useEducations() {
  return useQuery<EducationItem[], Error>({
    queryKey: masterDataKeys.educations(),
    queryFn: () => profileService.getEducations(),
    staleTime: STALE_TIME,
  });
}

export function useProfessions() {
  return useQuery<ProfessionItem[], Error>({
    queryKey: masterDataKeys.professions(),
    queryFn: () => profileService.getProfessions(),
    staleTime: STALE_TIME,
  });
}

export function useReligions() {
  return useQuery<ReligionItem[], Error>({
    queryKey: masterDataKeys.religions(),
    queryFn: () => profileService.getReligions(),
    staleTime: STALE_TIME,
  });
}

export function useCastes(religionId?: number | string | null) {
  return useQuery<CasteItem[], Error>({
    queryKey: masterDataKeys.castes(religionId),
    queryFn: () => (religionId ? profileService.getCastes(religionId) : Promise.resolve([])),
    enabled: Boolean(religionId),
    staleTime: STALE_TIME,
  });
}

export function useLanguages() {
  return useQuery<LanguageItem[], Error>({
    queryKey: masterDataKeys.languages(),
    queryFn: () => profileService.getLanguages(),
    staleTime: STALE_TIME,
  });
}

export function useHobbies() {
  return useQuery<HobbyItem[], Error>({
    queryKey: masterDataKeys.hobbies(),
    queryFn: () => profileService.getHobbies(),
    staleTime: STALE_TIME,
  });
}

export function useCountries(search?: string) {
  return useQuery<CountryItem[], Error>({
    queryKey: masterDataKeys.countries(search),
    queryFn: () => profileService.getCountries(search),
    staleTime: STALE_TIME,
  });
}

export function useStates(countryId?: number | string | null, search?: string) {
  return useQuery<StateItem[], Error>({
    queryKey: masterDataKeys.states(countryId, search),
    queryFn: () => (countryId ? profileService.getStates(countryId, search) : Promise.resolve([])),
    enabled: Boolean(countryId),
    staleTime: STALE_TIME,
  });
}

export function useDistricts(stateId?: number | string | null, search?: string) {
  return useQuery<DistrictItem[], Error>({
    queryKey: masterDataKeys.districts(stateId, search),
    queryFn: () => (stateId ? profileService.getDistricts(stateId, search) : Promise.resolve([])),
    enabled: Boolean(stateId),
    staleTime: STALE_TIME,
  });
}

export function useMandals(districtId?: number | string | null, search?: string) {
  return useQuery<MandalItem[], Error>({
    queryKey: masterDataKeys.mandals(districtId, search),
    queryFn: () => (districtId ? profileService.getMandals(districtId, search) : Promise.resolve([])),
    enabled: Boolean(districtId),
    staleTime: STALE_TIME,
  });
}

export function useVillages(mandalId?: number | string | null, search?: string) {
  return useQuery<VillageItem[], Error>({
    queryKey: masterDataKeys.villages(mandalId, search),
    queryFn: () => (mandalId ? profileService.getVillages(mandalId, search) : Promise.resolve([])),
    enabled: Boolean(mandalId),
    staleTime: STALE_TIME,
  });
}
