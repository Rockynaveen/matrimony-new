// ──────────────────────────────────────────────────────────────
// privacyApi.ts — Handles /api/privacy/reports/ and privacy endpoints
// ──────────────────────────────────────────────────────────────

import { axiosClient } from './axiosClient';
import type { UserReportOut, UserReportCreateIn, PhotoRequestOut } from '../types/apiTypes';

export const privacyApi = {
  /**
   * GET /api/privacy/reports/
   * Returns list of filed privacy and safety reports.
   */
  getPrivacyReports: async (): Promise<UserReportOut[]> => {
    const response = await axiosClient.get<UserReportOut[]>('/privacy/reports/');
    if (response.status >= 200 && response.status < 300) {
      return Array.isArray(response.data) ? response.data : [];
    }
    return [];
  },

  /**
   * POST /api/privacy/reports/
   * Submit a new privacy or abuse report.
   * Body: { reporter_id, reported_user_id, reason, description }
   */
  createPrivacyReport: async (payload: UserReportCreateIn): Promise<UserReportOut> => {
    const apiPayload = {
      reporter_id: typeof payload.reporter_id === 'number' ? payload.reporter_id : 0,
      reported_user_id: typeof payload.reported_user_id === 'number' ? payload.reported_user_id : (parseInt(String(payload.reported_user_id), 10) || 0),
      reason: payload.reason || 'General Safety Report',
      description: payload.description || ''
    };
    const response = await axiosClient.post<UserReportOut>('/privacy/reports/', apiPayload);
    if (response.status >= 200 && response.status < 300) {
      return response.data;
    }
    const msg = (response.data as any)?.message || (response.data as any)?.detail || 'Failed to submit privacy report.';
    throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
  },

  /**
   * GET /api/privacy/reports/{report_id}
   */
  getPrivacyReportById: async (reportId: number | string): Promise<UserReportOut> => {
    const response = await axiosClient.get<UserReportOut>(`/privacy/reports/${reportId}`);
    if (response.status >= 200 && response.status < 300) {
      return response.data;
    }
    const msg = (response.data as any)?.message || (response.data as any)?.detail || `Report #${reportId} not found.`;
    throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
  },

  /**
   * DELETE /api/privacy/reports/{report_id}
   */
  deletePrivacyReport: async (reportId: number | string): Promise<any> => {
    const response = await axiosClient.delete(`/privacy/reports/${reportId}`);
    if (response.status >= 200 && response.status < 300) {
      return response.data;
    }
    const msg = (response.data as any)?.message || (response.data as any)?.detail || 'Failed to delete report.';
    throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
  },

  /**
   * POST /api/privacy/reports/{report_id}/resolve
   * Mark a privacy report as resolved.
   */
  resolvePrivacyReport: async (reportId: number | string): Promise<UserReportOut> => {
    const response = await axiosClient.post<UserReportOut>(`/privacy/reports/${reportId}/resolve`);
    if (response.status >= 200 && response.status < 300) {
      return response.data;
    }
    const msg = (response.data as any)?.message || (response.data as any)?.detail || 'Failed to resolve report.';
    throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
  },

  /**
   * GET /api/privacy/photo-requests/
   * Returns list of photo access requests.
   */
  getPhotoRequests: async (): Promise<PhotoRequestOut[]> => {
    const response = await axiosClient.get<any>('/privacy/photo-requests/');
    if (response.status >= 200 && response.status < 300) {
      const data = response.data;
      if (Array.isArray(data)) return data;
      if (Array.isArray(data?.data)) return data.data;
      if (Array.isArray(data?.results)) return data.results;
      return [];
    }
    return [];
  },

  /**
   * POST /api/privacy/photo-requests/
   * Submit a new photo access request.
   * Body schema (PhotoAccessRequestCreateIn): { requester_id: int, profile_owner_id: int }
   */
  createPhotoRequest: async (payload: { requester_id?: number; profile_owner_id: number }): Promise<PhotoRequestOut> => {
    const profileOwnerId = Math.trunc(Number(payload.profile_owner_id) || 0);
    if (!profileOwnerId || profileOwnerId <= 0) {
      throw new Error('Invalid recipient user ID for photo access request.');
    }

    const storedUserStr = localStorage.getItem('logged_in_user_id') || localStorage.getItem('user_id');
    const defaultRequesterId = storedUserStr ? parseInt(storedUserStr, 10) : 1;
    const requesterId = payload.requester_id && payload.requester_id > 0 ? payload.requester_id : defaultRequesterId;

    const cleanPayload = {
      requester_id: requesterId,
      profile_owner_id: profileOwnerId
    };

    const response = await axiosClient.post<PhotoRequestOut>('/privacy/photo-requests/', cleanPayload);
    if (response.status >= 200 && response.status < 300) {
      return response.data;
    }
    const msg = (response.data as any)?.message || (response.data as any)?.detail || 'Failed to submit photo access request.';
    throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
  },

  /**
   * POST /api/privacy/photo-requests/{request_id}/approve
   * Approve a photo access request.
   */
  approvePhotoRequest: async (requestId: number | string): Promise<PhotoRequestOut> => {
    const numericReqId = Math.trunc(Number(requestId) || 0);
    const response = await axiosClient.post<PhotoRequestOut>(`/privacy/photo-requests/${numericReqId}/approve`);
    if (response.status >= 200 && response.status < 300) {
      return response.data;
    }
    const msg = (response.data as any)?.message || (response.data as any)?.detail || 'Failed to approve photo access request.';
    throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
  },

  /**
   * POST /api/privacy/photo-requests/{request_id}/reject
   * Reject a photo access request.
   */
  rejectPhotoRequest: async (requestId: number | string): Promise<any> => {
    const numericReqId = Math.trunc(Number(requestId) || 0);
    const response = await axiosClient.post<any>(`/privacy/photo-requests/${numericReqId}/reject`);
    if (response.status >= 200 && response.status < 300) {
      return response.data;
    }
    const msg = (response.data as any)?.message || (response.data as any)?.detail || 'Failed to reject photo access request.';
    throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
  }
};
