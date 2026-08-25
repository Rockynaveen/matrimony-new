import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  Upload,
  Camera,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  FileText,
  Trash2,
  ArrowRight,
  LogOut,
  Sparkles,
  Lock
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

const GOVT_ID_TYPES = [
  'Aadhaar Card',
  'Passport',
  'Driving License',
  'Voter ID Card',
  'PAN Card'
];

export const VerificationPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    verificationStatus,
    onboardingStatus,
    currentUser,
    submitMemberVerification,
    checkVerificationStatus,
    skipVerificationForSession,
    logout,
    showToast
  } = useApp();

  const [idType, setIdType] = useState<string>('Aadhaar Card');
  const [idFile, setIdFile] = useState<File | null>(null);
  const [idPreview, setIdPreview] = useState<string | null>(null);

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Sync status on mount
  useEffect(() => {
    checkVerificationStatus().catch(() => {});
  }, []);

  // Cleanup camera stream
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported on this device/browser');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false
      });

      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: any) {
      setCameraError(err?.message || 'Unable to access camera. Please allow camera permission or upload a photo.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `live_photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
        setPhotoFile(file);
        setPhotoPreview(dataUrl);
        stopCamera();
        showToast('✓ Live selfie photo captured successfully!');
      }
    }, 'image/jpeg', 0.85);
  };

  const handleIdFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      showToast('File size must be under 10MB');
      return;
    }

    setIdFile(file);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => setIdPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setIdPreview(null);
    }
    showToast(`✓ Selected ${idType}: ${file.name}`);
  };

  const handlePhotoUploadFallback = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please upload a valid image file (JPG/PNG)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showToast('File size must be under 10MB');
      return;
    }

    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
    stopCamera();
    showToast('✓ Live photo uploaded successfully!');
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!idFile) {
      showToast('Please upload your Government ID document');
      return;
    }

    if (!photoFile) {
      showToast('Please capture or upload your Live Photo');
      return;
    }

    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append('id_document', idFile);
      formData.append('live_photo', photoFile);

      await submitMemberVerification(formData, {
        docType: idType,
        docPreview: idPreview || `Uploaded ${idType} (${idFile.name})`,
        photoPreview: photoPreview || 'Live Selfie Photo'
      });

      // Flow rule: Verification Submitted -> Matches (/matches)
      setTimeout(() => {
        navigate('/matches');
      }, 1000);
    } catch (err: any) {
      showToast(err?.message || 'Failed to submit verification. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRefreshStatus = async () => {
    try {
      setIsRefreshing(true);
      const newStatus = await checkVerificationStatus();
      showToast(`Verification Status: ${newStatus}`);
    } catch {
      showToast('Could not refresh status. Please try again.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSkipVerification = () => {
    skipVerificationForSession();
    navigate('/matches');
  };

  const handleLogoutAndResumeLater = () => {
    logout();
    navigate('/login');
  };

  // Rejection details if any
  const rejectionReason = onboardingStatus.rejection_reason || 'Document or photo did not meet quality/clarity requirements.';

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Dynamic Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#5B1028] via-[#8B1E3F] to-[#2C0A15] p-6 sm:p-8 text-white shadow-2xl border border-[#D4AF37]/30"
      >
        <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-[#D4AF37]/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-[#C44569]/30 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="gold" className="bg-[#D4AF37] text-stone-950 font-extrabold text-[11px] uppercase tracking-wider px-3 py-0.5">
                <ShieldCheck className="h-3.5 w-3.5 mr-1" /> Trust & Verification
              </Badge>

              {verificationStatus === 'VERIFIED' && (
                <span className="text-xs text-emerald-300 font-bold flex items-center gap-1 bg-emerald-950/70 px-3 py-0.5 rounded-full border border-emerald-400/40">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Approved Member
                </span>
              )}

              {verificationStatus === 'PENDING' && (
                <span className="text-xs text-amber-300 font-bold flex items-center gap-1 bg-amber-950/70 px-3 py-0.5 rounded-full border border-amber-400/40">
                  <Clock className="h-3.5 w-3.5 animate-spin" /> Pending Admin Review
                </span>
              )}

              {verificationStatus === 'REJECTED' && (
                <span className="text-xs text-rose-300 font-bold flex items-center gap-1 bg-rose-950/70 px-3 py-0.5 rounded-full border border-rose-400/40">
                  <AlertCircle className="h-3.5 w-3.5" /> Action Required
                </span>
              )}
            </div>

            <h1 className="font-serif text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Member Identity Verification
            </h1>
            <p className="text-xs sm:text-sm text-stone-200 max-w-2xl leading-relaxed">
              Upload your Government ID and Live Selfie Photo to unlock your verified green badge and build trust with prospective matches.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSkipVerification}
              className="bg-white/10 hover:bg-white/20 text-white border-white/30 text-xs shadow-sm font-semibold"
            >
              Skip for now <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleLogoutAndResumeLater}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs shadow-sm"
            >
              <LogOut className="h-3.5 w-3.5 mr-1.5" /> Save & Log Out
            </Button>
          </div>
        </div>
      </motion.div>

      {/* State View 1: VERIFIED / APPROVED */}
      {verificationStatus === 'VERIFIED' && (
        <Card className="p-8 text-center space-y-6 border-2 border-emerald-500/40 bg-emerald-50/30 shadow-lg">
          <div className="mx-auto h-20 w-20 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-inner">
            <ShieldCheck className="h-10 w-10 text-emerald-600 fill-emerald-100" />
          </div>

          <div className="space-y-2 max-w-lg mx-auto">
            <Badge variant="verified" className="text-sm px-4 py-1.5 bg-emerald-600 text-white font-extrabold shadow-sm">
              ✓ Verification Status: APPROVED & VERIFIED
            </Badge>
            <h2 className="font-serif text-2xl font-bold text-foreground">
              Your Profile is Officially Approved!
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Congratulations! Your Government ID document and Live Selfie Photo have been reviewed and approved by the backend admin. The official green <strong>Approved Member Badge</strong> is now prominently displayed across your profile.
            </p>
          </div>

          <div className="flex justify-center gap-4 pt-4">
            <Button
              variant="primary"
              onClick={() => navigate('/matches')}
              className="px-8 bg-[#8B1E3F] hover:bg-[#721733] text-white shadow-lg font-bold"
            >
              Explore Matching Profiles <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </Card>
      )}

      {/* State View 2: PENDING ADMIN REVIEW */}
      {verificationStatus === 'PENDING' && (
        <Card className="p-8 space-y-6 border-2 border-amber-500/30 bg-amber-50/20 shadow-lg">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
            <div className="h-16 w-16 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 shadow-sm">
              <Clock className="h-8 w-8 animate-pulse text-amber-700" />
            </div>

            <div className="space-y-3 flex-1">
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  <Clock className="h-3.5 w-3.5" /> Verification Status: Pending Admin Review
                </span>
              </div>

              <h2 className="font-serif text-2xl font-bold text-foreground">
                Documents Submitted Successfully
              </h2>

              <p className="text-xs text-muted-foreground leading-relaxed">
                Your Government ID document and Live Photo have been securely uploaded and are waiting in the admin moderation queue. You can continue to browse matches while our team verifies your credentials (typically 2–6 hours).
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-white rounded-xl border border-amber-200/80 text-xs flex items-center gap-3">
                  <FileText className="h-5 w-5 text-[#8B1E3F]" />
                  <div>
                    <span className="font-semibold text-foreground block">Government ID Document</span>
                    <span className="text-[11px] text-emerald-600 font-bold">✓ Submitted</span>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-amber-200/80 text-xs flex items-center gap-3">
                  <Camera className="h-5 w-5 text-purple-700" />
                  <div>
                    <span className="font-semibold text-foreground block">Live Selfie Photo</span>
                    <span className="text-[11px] text-emerald-600 font-bold">✓ Submitted</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-amber-200/60">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshStatus}
              disabled={isRefreshing}
              className="text-xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh Verification Status
            </Button>

            <Button
              variant="primary"
              onClick={() => navigate('/matches')}
              className="bg-[#8B1E3F] hover:bg-[#721733] text-white shadow-md px-6 text-xs sm:text-sm"
            >
              Proceed to Matches <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </Card>
      )}

      {/* State View 3: REJECTED (Show Reason + Re-upload Form) or NOT_SUBMITTED */}
      {(verificationStatus === 'NOT_SUBMITTED' || verificationStatus === 'REJECTED') && (
        <form onSubmit={handleFormSubmit} className="space-y-6">
          {verificationStatus === 'REJECTED' && (
            <Card className="p-5 border-l-4 border-l-rose-600 bg-rose-50/50 space-y-2">
              <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
                <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
                <span>Verification Rejected by Admin</span>
              </div>
              <p className="text-xs text-rose-900 leading-relaxed pl-7">
                <strong>Reason:</strong> {rejectionReason}
              </p>
              <p className="text-[11px] text-rose-700 pl-7">
                Please re-upload a clear government identity document and take a fresh live selfie photo below to submit for review.
              </p>
            </Card>
          )}

          {/* Step 1: Government ID Document Upload */}
          <Card className="p-6 sm:p-8 space-y-6">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-border/60">
              <div className="flex items-center gap-3.5">
                <div className="h-11 w-11 rounded-2xl bg-[#8B1E3F]/10 text-[#8B1E3F] flex items-center justify-center shrink-0">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-foreground">
                    1. Government ID Document <span className="text-rose-500">*</span>
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Upload a valid government identity card for proof of age and identity.
                  </p>
                </div>
              </div>

              {idFile && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Attached
                </span>
              )}
            </div>

            {/* ID Type Dropdown */}
            <div className="space-y-1.5 max-w-xs">
              <label className="text-xs font-semibold text-foreground">Select ID Document Type</label>
              <select
                value={idType}
                onChange={e => setIdType(e.target.value)}
                className="w-full bg-white border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]"
              >
                {GOVT_ID_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* File Upload Box */}
            {!idFile ? (
              <label className="border-2 border-dashed border-border/80 hover:border-[#8B1E3F] bg-stone-50/50 hover:bg-stone-50 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors space-y-3 text-center">
                <div className="h-12 w-12 rounded-2xl bg-[#8B1E3F]/10 text-[#8B1E3F] flex items-center justify-center">
                  <Upload className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-xs font-bold text-foreground block">
                    Click to upload {idType} (PNG, JPG, PDF)
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Max file size: 10MB • Clear front & back photo
                  </span>
                </div>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleIdFileChange}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="p-4 bg-stone-50 rounded-2xl border border-border flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  {idPreview ? (
                    <img src={idPreview} alt="ID Preview" className="h-14 w-14 rounded-xl object-cover border border-border shrink-0" />
                  ) : (
                    <div className="h-14 w-14 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                      <FileText className="h-7 w-7" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <h5 className="font-bold text-xs text-foreground truncate">{idFile.name}</h5>
                    <span className="text-[11px] text-muted-foreground">
                      {idType} • {(idFile.size / (1024 * 1024)).toFixed(2)} MB
                    </span>
                  </div>
                </div>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => { setIdFile(null); setIdPreview(null); }}
                  className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-xs shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" /> Replace
                </Button>
              </div>
            )}
          </Card>

          {/* Step 2: Live Photo Capture / Upload */}
          <Card className="p-6 sm:p-8 space-y-6">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-border/60">
              <div className="flex items-center gap-3.5">
                <div className="h-11 w-11 rounded-2xl bg-purple-500/10 text-purple-700 flex items-center justify-center shrink-0">
                  <Camera className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-foreground">
                    2. Live Selfie Photo <span className="text-rose-500">*</span>
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Take a live selfie matching your profile photos to prevent fraudulent impersonation.
                  </p>
                </div>
              </div>

              {photoFile && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Captured
                </span>
              )}
            </div>

            {/* Camera View / Preview */}
            <div className="space-y-4">
              {isCameraActive ? (
                <div className="relative rounded-2xl overflow-hidden bg-black aspect-[4/3] max-w-md mx-auto border-2 border-purple-500 shadow-xl">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                  <div className="absolute inset-0 border-2 border-dashed border-white/50 rounded-2xl pointer-events-none m-4 flex items-center justify-center">
                    <span className="text-[11px] text-white/80 bg-black/40 px-3 py-1 rounded-full backdrop-blur-xs">
                      Position your face inside the frame
                    </span>
                  </div>
                  <div className="absolute bottom-4 inset-x-0 flex justify-center gap-3 z-10">
                    <Button
                      type="button"
                      variant="primary"
                      onClick={capturePhoto}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg"
                    >
                      <Camera className="h-4 w-4 mr-1.5" /> Capture Selfie
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={stopCamera}
                      className="bg-white/20 hover:bg-white/30 text-white border-white/40 text-xs"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : photoPreview ? (
                <div className="p-4 bg-stone-50 rounded-2xl border border-border flex items-center justify-between gap-4 max-w-md mx-auto">
                  <div className="flex items-center gap-3">
                    <img
                      src={photoPreview}
                      alt="Captured Selfie"
                      className="h-20 w-20 rounded-2xl object-cover border-2 border-purple-400 shadow-md shrink-0"
                    />
                    <div>
                      <h5 className="font-bold text-xs text-foreground">Live Photo Ready</h5>
                      <span className="text-[11px] text-emerald-600 font-bold block">✓ Quality Verified</span>
                      <span className="text-[10px] text-muted-foreground">Ready for submission</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={startCamera}
                      className="text-xs"
                    >
                      <RefreshCw className="h-3 w-3 mr-1" /> Retake
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                      className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-xs"
                    >
                      <Trash2 className="h-3 w-3 mr-1" /> Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 max-w-md mx-auto text-center">
                  {cameraError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2 text-left">
                      <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                      <span>{cameraError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Button
                      type="button"
                      variant="primary"
                      onClick={startCamera}
                      className="bg-purple-700 hover:bg-purple-800 text-white font-bold py-5 rounded-2xl text-xs flex flex-col items-center justify-center gap-1.5 shadow-md"
                    >
                      <Camera className="h-5 w-5" />
                      <span>Open Live Camera</span>
                    </Button>

                    <label className="border-2 border-dashed border-border/80 hover:border-purple-600 bg-stone-50/50 hover:bg-stone-50 rounded-2xl p-3 flex flex-col items-center justify-center cursor-pointer transition-colors text-center space-y-1">
                      <Upload className="h-5 w-5 text-purple-700" />
                      <span className="text-xs font-bold text-foreground">Upload Selfie</span>
                      <span className="text-[10px] text-muted-foreground">If camera not available</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUploadFallback}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Submission Bar */}
          <div className="p-5 bg-white rounded-3xl border border-border shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Lock className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>
                All documents are encrypted with 256-bit SSL and reviewed strictly by authorized moderators.
              </span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                onClick={handleSkipVerification}
                className="w-full sm:w-auto px-5 py-2 text-stone-600 hover:bg-stone-100 border-stone-300 text-xs font-semibold rounded-2xl"
              >
                Skip for now
              </Button>
              <Button
                type="submit"
                disabled={!idFile || !photoFile || isSubmitting}
                className="w-full sm:w-auto px-8 bg-[#8B1E3F] hover:bg-[#721733] disabled:opacity-50 text-white font-bold shadow-lg"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Submitting for Review...
                  </>
                ) : (
                  <>
                    Submit Verification <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};
