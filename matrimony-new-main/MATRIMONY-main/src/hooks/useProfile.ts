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
  ProfileGalleryImage,
} from '../types/profile.types';

/** Consistent query-key factory */
export const profileKeys = {
  all: ['profile'] as const,
  detail: () => [...profileKeys.all, 'detail'] as const,
  byId: (id?: string | number | null) => [...profileKeys.all, 'byId', id] as const,
  byMemberId: (memberId?: string | number | null) => [...profileKeys.all, 'byMemberId', memberId] as const,
  video: () => [...profileKeys.all, 'video'] as const,
  gallery: () => [...profileKeys.all, 'gallery'] as const,
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
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
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
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
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

// ─── POST /api/link/profile/video ───────────────────────────

export function useLinkProfileVideo() {
  const queryClient = useQueryClient();

  return useMutation<{ success: boolean; message?: string; video_url?: string }, Error, { videoUrl: string; videoType?: string }>({
    mutationFn: ({ videoUrl, videoType }) => profileService.linkProfileVideo(videoUrl, videoType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
    },
  });
}

// ─── POST /api/upload/profile/photo ─────────────────────────

export function useUploadProfilePhoto() {
  const queryClient = useQueryClient();

  return useMutation<{ photo_url?: string; message?: string }, Error, File | Blob>({
    mutationFn: (file) => profileService.uploadProfilePhoto(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
    },
  });
}

// ─── GET /api/profile/gallery ───────────────────────────────

export function useProfileGallery(
  options?: Omit<UseQueryOptions<ProfileGalleryImage[], Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<ProfileGalleryImage[], Error>({
    queryKey: profileKeys.gallery(),
    queryFn: () => profileService.getGallery(),
    staleTime: 2 * 60 * 1000,
    retry: false,
    ...options,
  });
}

// ─── POST /api/upload/profile/gallery ───────────────────────

export function useUploadGalleryImage() {
  const queryClient = useQueryClient();

  return useMutation<ProfileGalleryImage, Error, { file: File | Blob; caption?: string }>({
    mutationFn: ({ file, caption }) => profileService.uploadGalleryImage(file, caption),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.gallery() });
    },
  });
}

// ─── DELETE /api/profile/gallery/{image_id} ─────────────────

export function useDeleteGalleryImage() {
  const queryClient = useQueryClient();

  return useMutation<{ success: boolean; message?: string }, Error, number>({
    mutationFn: (imageId) => profileService.deleteGalleryImage(imageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.gallery() });
    },
  });
}

// ─── GET /api/profile/{userId}/ ─────────────────────────────

export function useProfileById(userId?: string | number | null) {
  return useQuery<ProfileOutAPI | null, Error>({
    queryKey: profileKeys.byId(userId),
    queryFn: () => (userId ? profileService.getProfileById(userId) : Promise.resolve(null)),
    enabled: Boolean(userId),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

// ─── GET /api/profile/by-member-id/{memberId}/ ──────────────

export function useProfileByMemberId(memberId?: string | number | null) {
  return useQuery<ProfileOutAPI | null, Error>({
    queryKey: profileKeys.byMemberId(memberId),
    queryFn: () => (memberId ? profileService.getProfileByMemberId(memberId) : Promise.resolve(null)),
    enabled: Boolean(memberId),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

