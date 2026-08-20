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
    const response = await axiosClient.get<PhotoRequestOut[]>('/privacy/photo-requests/');
    if (response.status >= 200 && response.status < 300) {
      return Array.isArray(response.data) ? response.data : [];
    }
    return [];
  },

  /**
   * POST /api/privacy/photo-requests/
   * Submit a new photo access request.
   */
  createPhotoRequest: async (payload: { requester_id?: number; profile_owner_id: number }): Promise<PhotoRequestOut> => {
    const apiPayload = {
      requester_id: payload.requester_id ?? 0,
      profile_owner_id: payload.profile_owner_id
    };
    const response = await axiosClient.post<PhotoRequestOut>('/privacy/photo-requests/', apiPayload);
    if (response.status >= 200 && response.status < 300) {
      return response.data;
    }
    const msg = (response.data as any)?.message || (response.data as any)?.detail || 'Failed to send photo access request.';
    throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
  },

  /**
   * POST /api/privacy/photo-requests/{request_id}/approve
   * Approve a photo access request.
   */
  approvePhotoRequest: async (requestId: number | string): Promise<PhotoRequestOut> => {
    const response = await axiosClient.post<PhotoRequestOut>(`/privacy/photo-requests/${requestId}/approve`);
    if (response.status >= 200 && response.status < 300) {
      return response.data;
    }
    const msg = (response.data as any)?.message || (response.data as any)?.detail || 'Failed to approve photo request.';
    throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
  },

  /**
   * POST /api/privacy/photo-requests/{request_id}/reject
   */
  rejectPhotoRequest: async (requestId: number | string): Promise<any> => {
    const response = await axiosClient.post(`/privacy/photo-requests/${requestId}/reject`);
    return response.data;
  }
};
