/**
 * TypeScript definitions for Identity Verification Feature
 * Matching Railway Backend OpenAPI Specification for:
 * POST /api/identity/verify/document-upload
 * GET /api/identity/verification/status
 */

export type BackendGovtDocumentType =
  | 'AADHAAR'
  | 'PAN'
  | 'PASSPORT'
  | 'DRIVING_LICENCE'
  | 'VOTER_ID';

export type VerificationStatusCode =
  | 'NOT_VERIFIED'
  | 'PENDING'
  | 'VERIFIED'
  | 'REJECTED'
  | 'FAILED'
  | 'UNKNOWN';

export interface DocumentTypeOption {
  value: BackendGovtDocumentType;
  label: string;
  description?: string;
  samplePlaceholder?: string;
}

export const BACKEND_DOCUMENT_TYPES: DocumentTypeOption[] = [
  {
    value: 'AADHAAR',
    label: 'Aadhaar Card',
    description: 'UIDAI standard 12-digit identity proof',
    samplePlaceholder: 'e.g. Front side of Aadhaar card showing name & photo'
  },
  {
    value: 'PAN',
    label: 'PAN Card',
    description: 'Income Tax Department Permanent Account Number',
    samplePlaceholder: 'Clear photo of PAN Card card surface'
  },
  {
    value: 'PASSPORT',
    label: 'Passport',
    description: 'Government of India issued international travel passport',
    samplePlaceholder: 'Passport front bio-data page with photo'
  },
  {
    value: 'DRIVING_LICENCE',
    label: 'Driving Licence',
    description: 'State Regional Transport Office (RTO) issued driving licence',
    samplePlaceholder: 'Clear photo of Driving Licence'
  },
  {
    value: 'VOTER_ID',
    label: 'Voter ID',
    description: 'Election Commission of India EPIC identity card',
    samplePlaceholder: 'Voter ID card front side'
  }
];

// Alias for backward compatibility
export const DEFAULT_DOCUMENT_TYPES = BACKEND_DOCUMENT_TYPES;

/**
 * Direct response from POST /api/identity/verify/document-upload
 * DocumentUploadVerificationOut schema from OpenAPI
 */
export interface DocumentUploadVerificationOut {
  success: boolean;
  status: string;
  verification_status?: string | null;
  document_status?: string | null;
  liveness_status?: string | null;
  face_match_status?: string | null;
  message: string;
  image_source?: string | null;
  document_type?: string | null;
  extracted_name?: string | null;
  dob?: string | null;
  masked_id?: string | null;
  document_valid?: boolean | null;
  liveness_passed?: boolean | null;
  face_match?: boolean | null;
  face_match_score?: number | null;
  transaction_id?: string | null;
  verified_at?: string | null;
}

/**
 * Individual item in IdentityVerificationStatusOut verifications list
 */
export interface IdentityVerificationItemOut {
  id: number;
  document_type: string;
  document_number_masked: string;
  image_source?: string | null;
  status: string;
  verified_name?: string | null;
  face_match_score?: number | null;
  verified_at?: string | null;
  created_at?: string | null;
}

/**
 * Direct response from GET /api/identity/verification/status
 * IdentityVerificationStatusOut schema from OpenAPI
 */
export interface IdentityVerificationStatusOut {
  success?: boolean;
  is_identity_verified: boolean;
  is_admin_confirmed?: boolean;
  admin_review_status?: string | null;
  admin_review_message?: string | null;
  badge_granted?: boolean;
  verifications: IdentityVerificationItemOut[];
}

/**
 * Normalized UI state after parsing backend status
 */
export interface NormalizedVerificationState {
  code: VerificationStatusCode;
  rawStatus: string;
  isVerified: boolean;
  isAdminConfirmed: boolean;
  badgeGranted: boolean;
  adminReviewStatus: string | null;
  adminReviewMessage: string | null;
  documentType: string | null;
  extractedName: string | null;
  maskedId: string | null;
  faceMatchScore: number | null;
  submittedAt: string | null;
  verifiedAt: string | null;
  documentUrl: string | null;
  liveFaceUrl: string | null;
  message: string | null;
  history: IdentityVerificationItemOut[];
}

/**
 * Payload sent to POST /api/identity/verify/document-upload
 * Exactly matching backend multipart/form-data requirements
 */
export interface IdentityDocumentUploadPayload {
  document_type: BackendGovtDocumentType;
  document_file: File;
  live_face_file: File;
}

/**
 * Form validation errors
 */
export interface IdentityFormValidationErrors {
  document_type?: string;
  document_file?: string;
  live_face_file?: string;
}
