import React from 'react';
import { IdentityVerification } from '../../components/identity-verification/IdentityVerification';

/**
 * Legacy VerificationPage replaced by unified IdentityVerification component
 * connecting directly to POST /api/identity/verify/document-upload
 */
export const VerificationPage: React.FC = () => {
  return <IdentityVerification />;
};

export default VerificationPage;
