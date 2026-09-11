import { axiosClient } from '../api/axiosClient';
import type {
  RawVerificationStatusResponse,
  NormalizedVerificationState,
  VerificationStatusCode,
  IdentityDocumentUploadPayload,
  IdentityVerificationUploadResponse
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
export function normalizeVerificationStatus(rawStatus?: string | null, isVerified?: boolean | null): VerificationStatusCode {
  if (isVerified === true) {
    return 'VERIFIED';
  }

  if (!rawStatus || typeof rawStatus !== 'string') {
    return 'NOT_VERIFIED';
  }

  const normalized = rawStatus.trim().toLowerCase().replace(/[\s_-]+/g, '');

  switch (normalized) {
    case 'notverified':
    case 'notsubmitted':
    case 'unverified':
    case 'none':
    case '':
      return 'NOT_VERIFIED';

    case 'pending':
    case 'underreview':
    case 'inreview':
    case 'submitted':
    case 'processing':
    case 'queued':
      return 'PENDING';

    case 'verified':
    case 'approved':
    case 'completed':
    case 'success':
      return 'VERIFIED';

    case 'rejected':
    case 'declined':
    case 'denied':
      return 'REJECTED';

    case 'failed':
    case 'error':
    case 'invalid':
      return 'FAILED';

    default:
      return 'UNKNOWN';
  }
}

export const identityVerificationService = {
  /**
   * GET /api/identity/verification/status
   * Fetches the current identity verification status for the authenticated user
   */
  async getVerificationStatus(): Promise<NormalizedVerificationState> {
    try {
      const response = await axiosClient.get<RawVerificationStatusResponse>('/identity/verification/status');
      
      const rawData = response.data || {};
      const rawStatus = rawData.status || rawData.verification_status || (rawData.is_verified ? 'Verified' : 'Not Verified');
      const isVerified = Boolean(rawData.is_verified || String(rawStatus).toLowerCase() === 'verified');
      const statusCode = normalizeVerificationStatus(rawStatus, isVerified);

      return {
        code: statusCode,
        rawStatus: String(rawStatus),
        isVerified,
        documentType: rawData.document_type || null,
        rejectionReason: rawData.rejection_reason || rawData.reason || null,
        submittedAt: rawData.submitted_at || rawData.created_at || null,
        verifiedAt: rawData.verified_at || null,
        documentUrl: rawData.document_url || rawData.id_document_url || null,
        liveFaceUrl: rawData.live_face_url || rawData.live_photo_url || null,
        message: rawData.message || null
      };
    } catch (err: any) {
      const status = err?.status || err?.response?.status || 500;
      const message = err?.message || err?.response?.data?.message || 'Unable to retrieve verification status.';
      
      // If 404 or unverified, gracefully return NOT_VERIFIED state instead of throwing hard error
      if (status === 404) {
        return {
          code: 'NOT_VERIFIED',
          rawStatus: 'Not Verified',
          isVerified: false,
          documentType: null,
          rejectionReason: null,
          submittedAt: null,
          verifiedAt: null,
          documentUrl: null,
          liveFaceUrl: null,
          message: 'No verification record found. Please verify your identity.'
        };
      }

      throw new IdentityVerificationServiceError(message, status, err?.response?.data);
    }
  },

  /**
   * POST /api/identity/verify/document-upload
   * Uploads the user's government ID document and live face image
   */
  async uploadIdentityDocument(payload: IdentityDocumentUploadPayload): Promise<IdentityVerificationUploadResponse> {
    try {
      const formData = new FormData();
      formData.append('document_type', payload.document_type);
      
      // Default to "N" if no password is provided as required by backend API spec
      const pdfPassword = payload.pdf_password?.trim() ? payload.pdf_password.trim() : 'N';
      formData.append('pdf_password', pdfPassword);

      formData.append('document_file', payload.document_file);
      formData.append('live_face_file', payload.live_face_file);

      // Using axiosClient.postForm (which sends FormData without setting Content-Type, allowing browser boundary generation)
      const response = await axiosClient.postForm<IdentityVerificationUploadResponse>(
        '/identity/verify/document-upload',
        formData
      );

      if (response.status >= 200 && response.status < 300) {
        return {
          success: true,
          message: response.data?.message || 'Identity documents submitted successfully.',
          status: response.data?.status || 'Pending',
          verification_id: response.data?.verification_id,
          data: response.data
        };
      }

      const errorMsg = response.data?.message || `Server returned status ${response.status}`;
      throw new IdentityVerificationServiceError(errorMsg, response.status, response.data);
    } catch (err: any) {
      const status = err?.status || err?.response?.status || 500;
      let userFriendlyMessage = 'Unable to submit your verification right now. Please check your documents and try again.';

      if (status === 400) {
        userFriendlyMessage = err?.data?.message || err?.message || 'Invalid document format or details. Please check your files.';
      } else if (status === 401) {
        userFriendlyMessage = 'Your session has expired. Please log in again to continue verification.';
      } else if (status === 403) {
        userFriendlyMessage = 'Access denied. You do not have permission to verify this profile.';
      } else if (status === 413) {
        userFriendlyMessage = 'The uploaded file is too large. Please upload files under 10MB.';
      } else if (status === 422) {
        userFriendlyMessage = err?.data?.message || err?.message || 'Validation error: Please ensure document type and files are valid.';
      } else if (status >= 500) {
        userFriendlyMessage = 'Verification service is temporarily unavailable. Please try again in a few moments.';
      }

      throw new IdentityVerificationServiceError(userFriendlyMessage, status, err?.data || err?.response?.data);
    }
  }
};
