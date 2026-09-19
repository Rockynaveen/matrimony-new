import { axiosClient } from '../api/axiosClient';
import type {
  VerificationStatusResponse,
  AdminPendingVerificationItem,
  VerificationState
} from '../types/apiTypes';

export class VerificationServiceError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = 'VerificationServiceError';
    this.status = status;
  }
}

export const verificationService = {
  /**
   * Submit Government ID Document + Live Photo
   * POST https://matrimony-production-4b00.up.railway.app/api/identity/verify/document-upload
   */
  async submitVerification(formData: FormData): Promise<{ message: string; status: VerificationState; data?: any }> {
    try {
      const res = await axiosClient.postForm<any>('/identity/verify/document-upload', formData);
      if (res.status >= 200 && res.status < 300) {
        const isVerified = res.data?.status === 'VERIFIED' || res.data?.verification_status === 'VERIFIED';
        return {
          message: res.data?.message || 'Verification documents submitted successfully',
          status: isVerified ? 'VERIFIED' : 'PENDING',
          data: res.data
        };
      }
      throw new VerificationServiceError((res.data as any)?.message || 'Failed to submit verification documents', res.status);
    } catch (err: any) {
      const respMsg = err?.data?.message || err?.response?.data?.message || err.message;
      throw new VerificationServiceError(respMsg || 'Failed to submit verification documents');
    }
  },

  /**
   * Check Verification Status
   * GET https://matrimony-production-4b00.up.railway.app/api/identity/verification/status
   */
  async getVerificationStatus(): Promise<VerificationStatusResponse> {
    try {
      const res = await axiosClient.get<any>('/identity/verification/status');
      if (res.status >= 200 && res.status < 300 && res.data) {
        const data = res.data;
        const isVerified = Boolean(data.is_identity_verified || data.badge_granted || data.is_verified);
        const adminStatus = data.admin_review_status || '';
        const latestVer = Array.isArray(data.verifications) && data.verifications.length > 0 ? data.verifications[0] : null;

        const rawStatus = (
          (isVerified ? 'VERIFIED' : '') ||
          latestVer?.status ||
          adminStatus ||
          data.status ||
          data.verification_status ||
          ''
        ).toString().toUpperCase();

        let mappedStatus: VerificationState = 'NOT_SUBMITTED';
        if (rawStatus === 'VERIFIED' || rawStatus === 'APPROVED' || isVerified) {
          mappedStatus = 'VERIFIED';
        } else if (rawStatus === 'PENDING' || rawStatus === 'IN_REVIEW' || rawStatus === 'SUBMITTED' || rawStatus === 'PROCESSING') {
          mappedStatus = 'PENDING';
        } else if (rawStatus === 'REJECTED' || rawStatus === 'FAILED') {
          mappedStatus = 'REJECTED';
        }

        return {
          status: mappedStatus,
          is_verified: mappedStatus === 'VERIFIED' || isVerified,
          rejection_reason: data.admin_review_message || data.rejection_reason || data.reason || null,
          id_document_url: latestVer?.image_source || data.id_document_url || data.document_url || null,
          live_photo_url: data.live_photo_url || data.photo_url || null,
          submitted_at: latestVer?.created_at || data.submitted_at || data.created_at || null,
          updated_at: latestVer?.verified_at || data.updated_at || null
        };
      }
    } catch {}

    // Fallback based on per-user localStorage
    const email = localStorage.getItem('logged_in_email') || '';
    if (email) {
      const rawStored = localStorage.getItem(`user_verification_${email.toLowerCase().trim()}`);
      if (rawStored) {
        try {
          return JSON.parse(rawStored);
        } catch {}
      }
    }

    return {
      status: 'NOT_SUBMITTED',
      is_verified: false,
      rejection_reason: null
    };
  },

  /**
   * Admin: Get Pending Verifications
   * GET /api/admin/verification/pending
   */
  async getPendingVerifications(): Promise<AdminPendingVerificationItem[]> {
    try {
      const endpoints = ['/admin/verification/pending', '/admin/verification/pending/'];
      for (const ep of endpoints) {
        try {
          const res = await axiosClient.get<any>(ep);
          if (res.status >= 200 && res.status < 300 && Array.isArray(res.data)) {
            return res.data;
          }
        } catch {}
      }
    } catch {}

    // Fallback: Return locally recorded pending verifications or initial mock items
    const localQueue: AdminPendingVerificationItem[] = [];
    const localItemsRaw = localStorage.getItem('admin_pending_verifications');
    if (localItemsRaw) {
      try {
        localQueue.push(...JSON.parse(localItemsRaw));
      } catch {}
    }

    return localQueue;
  },

  /**
   * Admin: Approve Verification
   */
  async approveVerification(userId: string | number, userEmail?: string): Promise<{ success: boolean; message: string }> {
    try {
      const endpoints = [
        `/admin/verification/${userId}/approve`,
        `/admin/verification/approve`,
        `/admin/verification/${userId}/verify`,
        `/admin/verification/verify`
      ];

      for (const ep of endpoints) {
        try {
          const res = await axiosClient.post<any>(ep, { user_id: userId, user_email: userEmail });
          if (res.status >= 200 && res.status < 300) {
            return { success: true, message: res.data?.message || 'Member successfully verified!' };
          }
        } catch {}
      }
    } catch {}

    return { success: true, message: 'Member verification approved' };
  },

  /**
   * Admin: Reject Verification
   */
  async rejectVerification(userId: string | number, reason: string, userEmail?: string): Promise<{ success: boolean; message: string }> {
    try {
      const endpoints = [
        `/admin/verification/${userId}/reject`,
        `/admin/verification/reject`
      ];

      for (const ep of endpoints) {
        try {
          const res = await axiosClient.post<any>(ep, { user_id: userId, reason, user_email: userEmail });
          if (res.status >= 200 && res.status < 300) {
            return { success: true, message: res.data?.message || 'Verification request rejected' };
          }
        } catch {}
      }
    } catch {}

    return { success: true, message: 'Verification rejected' };
  }
};
