import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  RefreshCw,
  Users,
  Star,
  Lock,
  Heart,
  Check
} from 'lucide-react';
import { DocumentUploadForm } from './DocumentUploadForm';
import { useIdentityVerification } from '../../hooks/useIdentityVerification';
import { Button } from '../ui/Button';

export const IdentityVerification: React.FC = () => {
  const navigate = useNavigate();
  const {
    status,
    isLoading,
    isSubmitting,
    error,
    successMessage,
    fetchStatus,
    submitVerification,
    resetError
  } = useIdentityVerification(true);

  const isVerified = status?.code === 'VERIFIED';
  const isPending = status?.code === 'PENDING';

  // Determine current active step for the 4-step stepper
  // 1: Upload Document, 2: Verify Details, 3: Under Review, 4: Completed
  const activeStep = isVerified ? 4 : isPending ? 3 : 1;

  const STEPS = [
    { num: 1, label: 'Upload Document' },
    { num: 2, label: 'Verify Details' },
    { num: 3, label: 'Under Review' },
    { num: 4, label: 'Completed' }
  ];

  return (
    <div className="min-h-screen bg-[#FAF7F5] text-stone-900 pb-20 font-sans antialiased">
      {/* Centered full-width content container (NO SIDEBAR) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* ── 1. Romantic Hero Header Banner ── */}
        <div className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden border border-rose-100/80 shadow-xs bg-[#FDF2F4]">
          <div className="flex flex-col md:flex-row items-center justify-between min-h-[140px] sm:min-h-[160px] md:min-h-[185px] relative">
            
            {/* Background Image: Wedding Rings & Petals */}
            <div className="absolute inset-0 w-full h-full pointer-events-none select-none">
              <img
                src="/images/matches_romantic_banner.jpg"
                alt=""
                className="w-full h-full object-cover object-right md:object-[center_right]"
              />
            </div>

            {/* Left Header Copy */}
            <div className="relative z-10 p-6 sm:p-8 md:p-10 max-w-xl space-y-1.5">
              <p className="text-[11px] sm:text-xs font-extrabold uppercase tracking-widest text-[#8B1E3F]">
                PROFILE VERIFICATION
              </p>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-extrabold tracking-tight text-[#8B1E3F]">
                Let's Verify <span className="font-serif italic font-bold text-[#E5A910]">Your Identity</span>
              </h1>
              <p className="text-xs sm:text-sm text-stone-600 font-medium pt-0.5">
                A verified profile builds trust and helps you get better matches.
              </p>
            </div>

            {/* Center Romantic Cursive Tagline */}
            <div className="hidden lg:flex relative z-10 pr-24 items-center justify-center pointer-events-none -rotate-3">
              <div className="font-['Caveat',_cursive] text-2xl lg:text-3xl text-[#8B1E3F] leading-tight text-center select-none font-semibold">
                <span>Safe</span><br />
                <span>Genuine</span><br />
                <span>Meaningful ♡</span>
              </div>
            </div>

          </div>
        </div>

        {/* ── 2. Stepper Progress Card ── */}
        <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs p-5 sm:p-6">
          <div className="max-w-3xl mx-auto flex items-center justify-between relative">
            
            {/* Connecting line behind circles */}
            <div className="absolute top-4 left-6 right-6 h-0.5 bg-stone-200 -z-0" />
            <div
              className="absolute top-4 left-6 h-0.5 bg-[#8B1E3F] -z-0 transition-all duration-500"
              style={{
                width:
                  activeStep === 1
                    ? '0%'
                    : activeStep === 2
                    ? '33%'
                    : activeStep === 3
                    ? '66%'
                    : '100%'
              }}
            />

            {STEPS.map(s => {
              const isPast = activeStep > s.num;
              const isCurrent = activeStep === s.num;

              return (
                <div key={s.num} className="flex flex-col items-center relative z-10 space-y-2">
                  <div
                    className={`h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-2xs ${
                      isPast
                        ? 'bg-[#8B1E3F] text-white'
                        : isCurrent
                        ? 'bg-[#8B1E3F] text-white ring-4 ring-rose-100 scale-105'
                        : 'bg-stone-100 text-stone-500 border border-stone-200'
                    }`}
                  >
                    {isPast ? <Check className="h-4 w-4" /> : s.num}
                  </div>
                  <span
                    className={`text-xs text-center font-medium ${
                      isCurrent
                        ? 'font-bold text-[#8B1E3F]'
                        : isPast
                        ? 'text-stone-800'
                        : 'text-stone-400'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
              );
            })}

          </div>
        </div>

        {/* ── 3. Two-Column Layout: Verification Form + Why Verify Sidebar ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* ── Left Column: Form or Status Card (lg: 8 cols) ── */}
          <div className="lg:col-span-8 space-y-6">
            {isLoading ? (
              <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center space-y-3 shadow-2xs">
                <RefreshCw className="h-7 w-7 animate-spin mx-auto text-[#8B1E3F]" />
                <p className="text-sm font-semibold text-stone-700">Loading verification status...</p>
              </div>
            ) : isVerified ? (
              /* Verified Completed State Card */
              <div className="bg-white rounded-2xl sm:rounded-3xl border border-emerald-200/90 p-8 sm:p-12 text-center space-y-6 shadow-2xs">
                <div className="h-20 w-20 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border-2 border-emerald-200 shadow-xs">
                  <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                </div>

                <div className="space-y-2 max-w-lg mx-auto">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-100/80 px-3 py-1 rounded-full">
                    ✓ 100% Verified Profile
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">
                    Your Profile is Verified!
                  </h2>
                  <p className="text-xs sm:text-sm text-stone-600 font-normal leading-relaxed">
                    Your government identity document has been verified. The official verified trust badge is now visible on your profile card to prospective matches.
                  </p>
                </div>

                <div className="pt-2">
                  <Button
                    variant="primary"
                    onClick={() => navigate('/matches')}
                    className="bg-[#8B1E3F] hover:bg-[#721833] text-white px-10 py-3.5 text-sm font-bold shadow-md inline-flex items-center gap-2 rounded-xl cursor-pointer"
                  >
                    Explore Matches <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : isPending ? (
              /* Under Review State Card */
              <div className="bg-white rounded-2xl sm:rounded-3xl border border-amber-200/90 p-8 sm:p-12 text-center space-y-6 shadow-2xs">
                <div className="h-20 w-20 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border-2 border-amber-200 shadow-xs">
                  <Clock className="h-10 w-10 text-amber-600 animate-pulse" />
                </div>

                <div className="space-y-2 max-w-lg mx-auto">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 bg-amber-100/80 px-3 py-1 rounded-full">
                    Under Review
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">
                    Documents Submitted
                  </h2>
                  <p className="text-xs sm:text-sm text-stone-600 font-normal leading-relaxed">
                    Your government ID document and verification selfie have been securely received. Our safety team typically verifies submissions within 2 to 4 hours.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={fetchStatus}
                    className="px-6 py-2.5 text-xs font-bold text-stone-700 border-stone-300 rounded-xl hover:bg-stone-50 cursor-pointer"
                  >
                    <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                    Refresh Status
                  </Button>

                  <Button
                    variant="primary"
                    onClick={() => navigate('/matches')}
                    className="bg-[#8B1E3F] hover:bg-[#721833] text-white px-8 py-2.5 text-xs font-bold rounded-xl shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                  >
                    Go to Matches <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ) : (
              /* Document & Photo Upload Form (Step 1 & 2) */
              <DocumentUploadForm
                onSubmit={submitVerification}
                isSubmitting={isSubmitting}
                serverError={error}
                serverSuccess={successMessage}
                onClearError={resetError}
              />
            )}
          </div>

          {/* ── Right Column: "Why Verify?" & Security Cards (lg: 4 cols) ── */}
          <div className="lg:col-span-4 space-y-5">
            
            {/* 1. Why Verify? Card */}
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-stone-200/90 shadow-2xs p-6 sm:p-7 space-y-6">
              <h3 className="font-serif font-bold text-xl text-[#8B1E3F]">
                Why Verify?
              </h3>

              <div className="space-y-4">
                {/* Item 1 */}
                <div className="flex items-start gap-3.5">
                  <div className="h-10 w-10 rounded-full bg-[#FFF5F7] border border-rose-100 flex items-center justify-center shrink-0 text-[#8B1E3F]">
                    <ShieldCheck className="h-5 w-5 text-[#8B1E3F]" />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-stone-900">
                      Builds Trust
                    </h4>
                    <p className="text-xs text-stone-500 font-normal">
                      Verified profiles get more responses.
                    </p>
                  </div>
                </div>

                {/* Item 2 */}
                <div className="flex items-start gap-3.5">
                  <div className="h-10 w-10 rounded-full bg-[#FFF5F7] border border-rose-100 flex items-center justify-center shrink-0 text-[#8B1E3F]">
                    <Users className="h-5 w-5 text-[#8B1E3F]" />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-stone-900">
                      Safer Community
                    </h4>
                    <p className="text-xs text-stone-500 font-normal">
                      Helps us keep fake profiles away.
                    </p>
                  </div>
                </div>

                {/* Item 3 */}
                <div className="flex items-start gap-3.5">
                  <div className="h-10 w-10 rounded-full bg-[#FFF5F7] border border-rose-100 flex items-center justify-center shrink-0 text-[#8B1E3F]">
                    <Star className="h-5 w-5 text-[#8B1E3F]" />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-stone-900">
                      Better Matches
                    </h4>
                    <p className="text-xs text-stone-500 font-normal">
                      Connect with genuine people.
                    </p>
                  </div>
                </div>

                {/* Item 4 */}
                <div className="flex items-start gap-3.5">
                  <div className="h-10 w-10 rounded-full bg-[#FFF5F7] border border-rose-100 flex items-center justify-center shrink-0 text-[#8B1E3F]">
                    <Lock className="h-5 w-5 text-[#8B1E3F]" />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-stone-900">
                      Your Privacy Matters
                    </h4>
                    <p className="text-xs text-stone-500 font-normal">
                      Your data is safe and secure with us.
                    </p>
                  </div>
                </div>
              </div>

              {/* Romantic Quote Box */}
              <div className="pt-5 border-t border-stone-100 text-center space-y-2">
                <p className="font-serif italic text-stone-700 text-sm sm:text-base leading-snug">
                  "Trust is the beginning of every beautiful relationship."
                </p>
                <div className="flex justify-center text-[#E5A910]">
                  <Heart className="h-5 w-5 text-[#E5A910] stroke-[1.5]" />
                </div>
              </div>
            </div>

            {/* 2. Trust Card: 100% Secure & Private */}
            <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs p-4 sm:p-5 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-center shrink-0 text-[#9C7A4A]">
                <ShieldCheck className="h-6 w-6 text-[#9C7A4A]" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-sm font-bold text-stone-900">
                  100% Secure &amp; Private
                </h4>
                <p className="text-xs text-stone-500 font-normal">
                  Verified by Vivah
                </p>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
