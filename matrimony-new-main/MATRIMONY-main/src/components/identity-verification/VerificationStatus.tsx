import React from 'react';
import {
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  RefreshCw,
  ArrowDown
} from 'lucide-react';
import { Card, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import type { NormalizedVerificationState } from '../../types/identityVerification.types';

export interface VerificationStatusProps {
  status: NormalizedVerificationState | null;
  isLoading: boolean;
  onRefresh: () => void;
  onStartVerification?: () => void;
  onTryAgain?: () => void;
}

export const VerificationStatus: React.FC<VerificationStatusProps> = ({
  status,
  isLoading,
  onRefresh,
  onStartVerification,
  onTryAgain
}) => {
  if (isLoading) {
    return (
      <Card className="border-slate-200 shadow-xs">
        <CardContent className="p-6 flex items-center justify-center gap-3 text-slate-500">
          <RefreshCw className="h-5 w-5 animate-spin text-[#8B1E3F]" />
          <span className="text-sm font-medium">Checking verification status...</span>
        </CardContent>
      </Card>
    );
  }

  const statusCode = status?.code || 'NOT_VERIFIED';

  // 1. VERIFIED State
  if (statusCode === 'VERIFIED') {
    return (
      <Card className="border-emerald-200 bg-emerald-50/40 shadow-xs overflow-hidden">
        <CardContent className="p-6 sm:p-7">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200 shadow-2xs">
                <ShieldCheck className="h-7 w-7 text-emerald-600" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="verified" className="px-3 py-0.5 text-xs font-bold">
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                    Verified
                  </Badge>
                  {status?.verifiedAt && (
                    <span className="text-[11px] text-slate-500 font-medium">
                      Verified on {new Date(status.verifiedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-slate-900 font-serif">
                  Identity Verified Successfully
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Your identity has been successfully verified. Your profile proudly features the green verified trust badge, unlocking premium match connections.
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              className="shrink-0 border-emerald-300 text-emerald-800 hover:bg-emerald-100/60"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 2. PENDING State
  if (statusCode === 'PENDING') {
    return (
      <Card className="border-amber-200 bg-amber-50/40 shadow-xs overflow-hidden">
        <CardContent className="p-6 sm:p-7">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200 shadow-2xs">
                <Clock className="h-7 w-7 text-amber-600 animate-pulse" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="gold" className="px-3 py-0.5 text-xs font-bold">
                    <Clock className="h-3.5 w-3.5 mr-1 text-amber-700" />
                    Verification Pending
                  </Badge>
                  {status?.submittedAt && (
                    <span className="text-[11px] text-slate-500 font-medium">
                      Submitted on {new Date(status.submittedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-slate-900 font-serif">
                  Documents Under Review
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Your documents have been submitted and are currently being reviewed. Our verification team typically reviews submissions within <strong>2 to 4 hours</strong>.
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              className="shrink-0 border-amber-300 text-amber-900 hover:bg-amber-100/60"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Check Status
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 3. REJECTED State
  if (statusCode === 'REJECTED') {
    return (
      <Card className="border-red-200 bg-red-50/40 shadow-xs overflow-hidden">
        <CardContent className="p-6 sm:p-7">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center shrink-0 border border-red-200 shadow-2xs">
                <XCircle className="h-7 w-7 text-red-600" />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Badge variant="danger" className="px-3 py-0.5 text-xs font-bold">
                    <AlertCircle className="h-3.5 w-3.5 mr-1 text-red-700" />
                    Verification Rejected
                  </Badge>
                </div>
                <h3 className="text-lg font-bold text-slate-900 font-serif">
                  Verification Requires Attention
                </h3>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  Your previous submission could not be verified.
                </p>
                {status?.rejectionReason && (
                  <div className="p-2.5 bg-red-100/70 border border-red-200 rounded-lg text-xs font-semibold text-red-900">
                    <strong>Reason:</strong> {status.rejectionReason}
                  </div>
                )}
              </div>
            </div>

            {onTryAgain && (
              <Button
                variant="primary"
                size="sm"
                onClick={onTryAgain}
                className="shrink-0 shadow-xs"
              >
                Try Again
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // 4. FAILED or UNKNOWN State
  if (statusCode === 'FAILED' || statusCode === 'UNKNOWN') {
    return (
      <Card className="border-slate-300 bg-slate-50/60 shadow-xs overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="h-10 w-10 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <Badge variant="outline" className="mb-1 text-slate-700">
                  Status: {status?.rawStatus || 'Unknown'}
                </Badge>
                <p className="text-xs sm:text-sm text-slate-600">
                  {status?.message || 'We could not determine your verification status. Please check your connection and try again.'}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 5. NOT_VERIFIED Default State
  return (
    <Card className="border-slate-200/90 bg-white shadow-xs overflow-hidden">
      <CardContent className="p-6 sm:p-7">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-2xl bg-[#8B1E3F]/10 text-[#8B1E3F] flex items-center justify-center shrink-0 border border-[#8B1E3F]/20 shadow-2xs">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="px-3 py-0.5 text-xs font-bold text-slate-700 bg-slate-100 border-slate-200">
                  Not Verified
                </Badge>
              </div>
              <h3 className="text-lg font-bold text-slate-900 font-serif">
                Your identity has not been verified yet
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Verify your identity with a valid Government ID and live selfie to earn the Verified Member shield badge and build high trust with potential life partners.
              </p>
            </div>
          </div>

          {onStartVerification && (
            <Button
              variant="primary"
              size="sm"
              onClick={onStartVerification}
              className="shrink-0 gap-1.5 shadow-sm"
            >
              Start Verification <ArrowDown className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
