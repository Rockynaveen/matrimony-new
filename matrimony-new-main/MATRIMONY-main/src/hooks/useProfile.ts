// ──────────────────────────────────────────────────────────────
// Profile TanStack Query Hooks
// Wraps profileService calls in useQuery / useMutation hooks.
// ──────────────────────────────────────────────────────────────

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query';

import { profileService } from '../services/profile.service';
import type {
  ProfileOutAPI,
  ProfileCreateRequest,
  ProfileUpdateRequest,
  BasicProfileUpdateRequest,
  ProfileVideoAPI,
  ProfileVideoUploadResponse,
  ProfileVideoDeleteResponse,
} from '../types/profile.types';

/** Consistent query-key factory */
export const profileKeys = {
  all: ['profile'] as const,
  detail: () => [...profileKeys.all, 'detail'] as const,
  video: () => [...profileKeys.all, 'video'] as const,
};

// ─── GET /api/profile/get/ ──────────────────────────────────────

export function useProfile(
  options?: Omit<UseQueryOptions<ProfileOutAPI | null, Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<ProfileOutAPI | null, Error>({
    queryKey: profileKeys.detail(),
    queryFn: () => profileService.getProfile(),
    staleTime: 5 * 60 * 1000,   // 5 mins
    retry: false,
    ...options,
  });
}

// ─── POST /api/profile/create/ ────────────────────────────

export function useCreateProfile() {
  const queryClient = useQueryClient();

  return useMutation<ProfileOutAPI, Error, ProfileCreateRequest>({
    mutationFn: (payload) => profileService.createProfile(payload),
    onSuccess: (data) => {
      queryClient.setQueryData(profileKeys.detail(), data);
    },
  });
}

// ─── PUT /api/profile/update/ ─────────────────────────────

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation<ProfileOutAPI, Error, ProfileUpdateRequest>({
    mutationFn: (payload) => profileService.updateProfile(payload),
    onSuccess: (data) => {
      queryClient.setQueryData(profileKeys.detail(), data);
    },
  });
}

// ─── PATCH /api/profile/basic/update/ ───────────────────────

export function useUpdateBasicProfile() {
  const queryClient = useQueryClient();

  return useMutation<Record<string, any>, Error, BasicProfileUpdateRequest>({
    mutationFn: (payload) => profileService.updateBasicProfile(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
    },
  });
}

// ─── GET /api/get/profile/video ─────────────────────────────

export function useProfileVideo(
  options?: Omit<UseQueryOptions<ProfileVideoAPI | null, Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<ProfileVideoAPI | null, Error>({
    queryKey: profileKeys.video(),
    queryFn: () => profileService.getProfileVideo(),
    staleTime: 2 * 60 * 1000,
    retry: false,
    ...options,
  });
}

// ─── POST /api/upload/profile/video ─────────────────────────

export function useUploadProfileVideo() {
  const queryClient = useQueryClient();

  return useMutation<ProfileVideoUploadResponse, Error, File | Blob | string>({
    mutationFn: (input) => profileService.uploadProfileVideo(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
    },
  });
}

// ─── PUT /api/update/profile/video ──────────────────────────

export function useUpdateProfileVideo() {
  const queryClient = useQueryClient();

  return useMutation<ProfileVideoUploadResponse, Error, File | Blob | string>({
    mutationFn: (input) => profileService.updateProfileVideo(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
    },
  });
}

// ─── DELETE /api/delete/profile/video ───────────────────────

export function useDeleteProfileVideo() {
  const queryClient = useQueryClient();

  return useMutation<ProfileVideoDeleteResponse, Error, void>({
    mutationFn: () => profileService.deleteProfileVideo(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
    },
  });
}

