import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { privacyApi } from '../api/privacyApi';
import type { UserReportOut, UserReportCreateIn, PhotoRequestOut } from '../types/apiTypes';

export const privacyKeys = {
  all: ['privacy'] as const,
  reports: () => [...privacyKeys.all, 'reports'] as const,
  reportDetail: (id: number | string) => [...privacyKeys.reports(), id] as const,
  photoRequests: () => [...privacyKeys.all, 'photoRequests'] as const,
};

/**
 * GET /api/privacy/reports/
 * Hook to fetch privacy and safety reports.
 */
export function usePrivacyReports() {
  return useQuery<UserReportOut[], Error>({
    queryKey: privacyKeys.reports(),
    queryFn: () => privacyApi.getPrivacyReports(),
    staleTime: 30 * 1000,
    retry: 1,
  });
}

/**
 * GET /api/privacy/reports/{report_id}
 * Hook to fetch a single report by report_id.
 */
export function usePrivacyReportDetail(reportId: number | string | null) {
  return useQuery<UserReportOut, Error>({
    queryKey: privacyKeys.reportDetail(reportId || 0),
    queryFn: () => privacyApi.getPrivacyReportById(reportId!),
    enabled: Boolean(reportId),
    staleTime: 30 * 1000,
    retry: 1,
  });
}

/**
 * POST /api/privacy/reports/
 * Hook to create a new privacy report.
 */
export function useCreatePrivacyReport() {
  const queryClient = useQueryClient();

  return useMutation<UserReportOut, Error, UserReportCreateIn>({
    mutationFn: (payload) => privacyApi.createPrivacyReport(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: privacyKeys.reports() });
    },
  });
}

/**
 * DELETE /api/privacy/reports/{report_id}
 * Hook to delete a privacy report by report_id.
 */
export function useDeletePrivacyReport() {
  const queryClient = useQueryClient();

  return useMutation<any, Error, number | string>({
    mutationFn: (reportId) => privacyApi.deletePrivacyReport(reportId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: privacyKeys.reports() });
    },
  });
}

/**
 * POST /api/privacy/reports/{report_id}/resolve
 * Hook to mark a privacy report as resolved by report_id.
 */
export function useResolvePrivacyReport() {
  const queryClient = useQueryClient();

  return useMutation<UserReportOut, Error, number | string>({
    mutationFn: (reportId) => privacyApi.resolvePrivacyReport(reportId),
    onSuccess: (_, reportId) => {
      queryClient.invalidateQueries({ queryKey: privacyKeys.reports() });
      queryClient.invalidateQueries({ queryKey: privacyKeys.reportDetail(reportId) });
    },
  });
}

/**
 * GET /api/privacy/photo-requests/
 */
export function usePhotoRequests() {
  return useQuery<PhotoRequestOut[], Error>({
    queryKey: privacyKeys.photoRequests(),
    queryFn: () => privacyApi.getPhotoRequests(),
    staleTime: 60 * 1000,
  });
}

/**
 * POST /api/privacy/photo-requests/
 * Hook to submit a new photo access request.
 */
export function useCreatePhotoRequest() {
  const queryClient = useQueryClient();

  return useMutation<PhotoRequestOut, Error, { requester_id?: number; profile_owner_id: number }>({
    mutationFn: (payload) => privacyApi.createPhotoRequest(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: privacyKeys.photoRequests() });
    },
  });
}

/**
 * POST /api/privacy/photo-requests/{request_id}/approve
 * Hook to approve a photo access request by request_id.
 */
export function useApprovePhotoRequest() {
  const queryClient = useQueryClient();

  return useMutation<PhotoRequestOut, Error, number | string>({
    mutationFn: (requestId) => privacyApi.approvePhotoRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: privacyKeys.photoRequests() });
    },
  });
}
