/**
 * TypeScript definitions for Identity Verification Feature
 */

export type VerificationStatusCode =
  | 'NOT_VERIFIED'
  | 'PENDING'
  | 'VERIFIED'
  | 'REJECTED'
  | 'FAILED'
  | 'UNKNOWN';

export interface DocumentTypeOption {
  value: string;
  label: string;
  description?: string;
}

export const DEFAULT_DOCUMENT_TYPES: DocumentTypeOption[] = [
  { value: 'Aadhaar', label: 'Aadhaar Card', description: 'UIDAI standard identity proof' },
  { value: 'Passport', label: 'Passport', description: 'Government issued international travel passport' },
  { value: 'Driving License', label: 'Driving License', description: 'State transport authority issued license' },
  { value: 'PAN Card', label: 'PAN Card', description: 'Permanent Account Number card' },
  { value: 'Voter ID', label: 'Voter ID', description: 'Election Commission of India ID' }
];

/**
 * Raw response from GET /api/identity/verification/status
 */
export interface RawVerificationStatusResponse {
  status?: string | null;
  verification_status?: string | null;
  is_verified?: boolean | null;
  rejection_reason?: string | null;
  reason?: string | null;
  document_type?: string | null;
  document_url?: string | null;
  id_document_url?: string | null;
  live_face_url?: string | null;
  live_photo_url?: string | null;
  submitted_at?: string | null;
  verified_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  message?: string | null;
  details?: Record<string, any> | null;
  [key: string]: any;
}

/**
 * Normalized UI state after parsing backend status
 */
export interface NormalizedVerificationState {
  code: VerificationStatusCode;
  rawStatus: string;
  isVerified: boolean;
  documentType: string | null;
  rejectionReason: string | null;
  submittedAt: string | null;
  verifiedAt: string | null;
  documentUrl: string | null;
  liveFaceUrl: string | null;
  message: string | null;
}

/**
 * Payload sent to POST /api/identity/verify/document-upload
 */
export interface IdentityDocumentUploadPayload {
  document_type: string;
  pdf_password?: string;
  document_file: File;
  live_face_file: File;
}

/**
 * Response from POST /api/identity/verify/document-upload
 */
export interface IdentityVerificationUploadResponse {
  success?: boolean;
  message?: string;
  status?: string;
  verification_id?: string | number;
  data?: any;
}

/**
 * Form validation errors
 */
export interface IdentityFormValidationErrors {
  document_type?: string;
  document_file?: string;
  live_face_file?: string;
  pdf_password?: string;
}
