import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { searchApi } from '../api/searchApi';
import type {
  CreateSavedSearchPayload,
  UpdateSavedSearchPayload,
  AiRecommendedSearchParams
} from '../types/searchTypes';

export const searchKeys = {
  all: ['search'] as const,
  filterOptions: () => [...searchKeys.all, 'filterOptions'] as const,
  savedSearches: () => [...searchKeys.all, 'savedSearches'] as const,
  recentlyViewed: () => [...searchKeys.all, 'recentlyViewed'] as const,
  aiRecommended: (params?: AiRecommendedSearchParams) => [...searchKeys.all, 'aiRecommended', params] as const,
  compatibility: (id: string | number) => [...searchKeys.all, 'compatibility', String(id)] as const,
};

// 1. Hook for filter options (Religions, Castes, Educations, Occupations, Cities, etc.)
export const useFilterOptions = () => {
  return useQuery({
    queryKey: searchKeys.filterOptions(),
    queryFn: searchApi.getFilterOptions,
    staleTime: 1000 * 60 * 30, // 30 minutes
    retry: 1
  });
};

// 2. Hook for AI Recommended Search
export const useAiRecommendedSearch = (params?: AiRecommendedSearchParams, enabled = true) => {
  return useQuery({
    queryKey: searchKeys.aiRecommended(params),
    queryFn: () => searchApi.aiRecommendedSearch(params),
    enabled,
    staleTime: 1000 * 60 * 5,
    retry: 1
  });
};

// 3. Hook for Compatibility Search
export const useCompatibilitySearch = (targetUserId: string | number | null | undefined) => {
  return useQuery({
    queryKey: searchKeys.compatibility(targetUserId || 0),
    queryFn: () => searchApi.getCompatibilitySearch(targetUserId!),
    enabled: Boolean(targetUserId && String(targetUserId) !== '0'),
    staleTime: 1000 * 60 * 15,
    retry: 1
  });
};

// 4. Hooks for Saved Searches
export const useSavedSearches = () => {
  return useQuery({
    queryKey: searchKeys.savedSearches(),
    queryFn: searchApi.getSavedSearches,
    staleTime: 1000 * 60 * 2,
    retry: 1
  });
};

export const useCreateSavedSearch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSavedSearchPayload) => searchApi.createSavedSearch(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: searchKeys.savedSearches() });
    }
  });
};

export const useUpdateSavedSearch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string | number; payload: UpdateSavedSearchPayload }) =>
      searchApi.updateSavedSearch(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: searchKeys.savedSearches() });
    }
  });
};

export const useDeleteSavedSearch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => searchApi.deleteSavedSearch(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: searchKeys.savedSearches() });
    }
  });
};

// 5. Hooks for Recently Viewed Searches
export const useRecentlyViewedSearches = (params?: { page?: number; page_size?: number }) => {
  return useQuery({
    queryKey: searchKeys.recentlyViewed(),
    queryFn: () => searchApi.getRecentlyViewedSearches(params),
    staleTime: 1000 * 60,
    retry: 1
  });
};

export const useRecordRecentlyViewed = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { profile_id?: string | number; user_id?: string | number; search_query?: string }) =>
      searchApi.recordRecentlyViewed(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: searchKeys.recentlyViewed() });
    }
  });
};

export const useClearRecentlyViewed = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: searchApi.clearRecentlyViewedSearches,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: searchKeys.recentlyViewed() });
    }
  });
};

export const useDeleteRecentlyViewedItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => searchApi.deleteRecentlyViewedItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: searchKeys.recentlyViewed() });
    }
  });
};
