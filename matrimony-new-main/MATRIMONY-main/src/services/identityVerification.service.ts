import { axiosClient } from '../api/axiosClient';
import type {
  IdentityVerificationStatusOut,
  DocumentUploadVerificationOut,
  NormalizedVerificationState,
  VerificationStatusCode,
  IdentityDocumentUploadPayload
} from '../types/identityVerification.types';

export class IdentityVerificationServiceError extends Error {
  status: number;
  data?: any;

  constructor(message: string, status = 500, data?: any) {
    super(message);
    this.name = 'IdentityVerificationServiceError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Normalizes any backend status representation to a standardized VerificationStatusCode
 */
export function normalizeVerificationStatus(
  rawStatus?: string | null,
  isVerified?: boolean | null,
  adminStatus?: string | null
): VerificationStatusCode {
  if (isVerified === true) {
    return 'VERIFIED';
  }

  const statusStr = (rawStatus || adminStatus || '').trim().toLowerCase().replace(/[\s_-]+/g, '');

  switch (statusStr) {
    case 'verified':
    case 'approved':
    case 'completed':
    case 'success':
      return 'VERIFIED';

    case 'pending':
    case 'underreview':
    case 'inreview':
    case 'submitted':
    case 'processing':
    case 'queued':
      return 'PENDING';

    case 'rejected':
    case 'declined':
    case 'denied':
      return 'REJECTED';

    case 'failed':
    case 'error':
    case 'invalid':
      return 'FAILED';

    case 'notverified':
    case 'notsubmitted':
    case 'unverified':
    case 'unsubmitted':
    case 'none':
    case '':
      return 'NOT_VERIFIED';

    default:
      return 'UNKNOWN';
  }
}

export const identityVerificationService = {
  /**
   * GET /api/identity/verification/status
   * Retrieves authenticated user's verification history and status
   */
  async getVerificationStatus(): Promise<NormalizedVerificationState> {
    try {
      const response = await axiosClient.get<IdentityVerificationStatusOut>('/identity/verification/status');
      const data = response.data || { is_identity_verified: false, verifications: [] };

      const isVerified = Boolean(data.is_identity_verified || data.badge_granted);
      const adminStatus = data.admin_review_status || 'UNSUBMITTED';
      const latestVerification = Array.isArray(data.verifications) && data.verifications.length > 0
        ? data.verifications[0]
        : null;

      const rawStatus = latestVerification?.status || adminStatus;
      const statusCode = normalizeVerificationStatus(rawStatus, isVerified, adminStatus);

      return {
        code: statusCode,
        rawStatus: String(rawStatus),
        isVerified,
        isAdminConfirmed: Boolean(data.is_admin_confirmed),
        badgeGranted: Boolean(data.badge_granted),
        adminReviewStatus: data.admin_review_status || null,
        adminReviewMessage: data.admin_review_message || null,
        documentType: latestVerification?.document_type || null,
        extractedName: latestVerification?.verified_name || null,
        maskedId: latestVerification?.document_number_masked || null,
        faceMatchScore: latestVerification?.face_match_score || null,
        submittedAt: latestVerification?.created_at || null,
        verifiedAt: latestVerification?.verified_at || null,
        documentUrl: null,
        liveFaceUrl: latestVerification?.image_source || null,
        message: data.admin_review_message || null,
        history: data.verifications || []
      };
    } catch (err: any) {
      const status = err?.status || err?.response?.status || 500;
      const message = err?.message || err?.response?.data?.message || 'Unable to retrieve verification status.';

      // If 404, gracefully return NOT_VERIFIED state
      if (status === 404) {
        return {
          code: 'NOT_VERIFIED',
          rawStatus: 'UNSUBMITTED',
          isVerified: false,
          isAdminConfirmed: false,
          badgeGranted: false,
          adminReviewStatus: 'UNSUBMITTED',
          adminReviewMessage: null,
          documentType: null,
          extractedName: null,
          maskedId: null,
          faceMatchScore: null,
          submittedAt: null,
          verifiedAt: null,
          documentUrl: null,
          liveFaceUrl: null,
          message: 'No verification record found. Please verify your identity.',
          history: []
        };
      }

      throw new IdentityVerificationServiceError(message, status, err?.response?.data);
    }
  },

  /**
   * POST /api/identity/verify/document-upload
   * Uploads Government ID Document + Live Face Photo to Railway OCR & Face Matching Engine
   */
  async uploadIdentityDocument(payload: IdentityDocumentUploadPayload): Promise<DocumentUploadVerificationOut> {
    try {
      const formData = new FormData();
      // Required parameters matching Railway OpenAPI: document_type, document_file, live_face_file
      formData.append('document_type', payload.document_type);
      formData.append('document_file', payload.document_file);
      formData.append('live_face_file', payload.live_face_file);

      // Using axiosClient.postForm which sends FormData with Authorization header and correct boundaries
      const response = await axiosClient.postForm<DocumentUploadVerificationOut>(
        '/identity/verify/document-upload',
        formData
      );

      if (response.status >= 200 && response.status < 300 && response.data) {
        return response.data;
      }

      const errorMsg = (response.data as any)?.message || `Server returned status ${response.status}`;
      throw new IdentityVerificationServiceError(errorMsg, response.status, response.data);
    } catch (err: any) {
      const status = err?.status || err?.response?.status || 500;
      const respData = err?.data || err?.response?.data || {};
      let userFriendlyMessage = respData?.message || err?.message || 'Verification submission failed.';

      if (status === 400) {
        userFriendlyMessage = respData?.message || 'Invalid document format or details. Please ensure the document is clear and readable.';
      } else if (status === 401) {
        userFriendlyMessage = 'Your session has expired. Please log in again to complete verification.';
      } else if (status === 413) {
        userFriendlyMessage = 'The uploaded file is too large. Please upload files under 10MB.';
      } else if (status === 422) {
        userFriendlyMessage = respData?.message || 'Validation error: Please ensure document type and files are valid.';
      } else if (status >= 500) {
        userFriendlyMessage = 'Verification service is temporarily unavailable. Please try again in a few moments.';
      }

      throw new IdentityVerificationServiceError(userFriendlyMessage, status, respData);
    }
  }
};
