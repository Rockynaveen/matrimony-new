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
  Lock,
  Check,
  ChevronRight,
  UserCheck,
  User
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

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

  // Bind live camera stream to video DOM element whenever camera is active
  useEffect(() => {
    if (isCameraActive && mediaStreamRef.current && videoRef.current) {
      const video = videoRef.current;
      video.srcObject = mediaStreamRef.current;
      
      const playVideo = async () => {
        try {
          await video.play();
        } catch (e) {
          console.warn('Auto-play error:', e);
        }
      };

      if (video.readyState >= 1) {
        playVideo();
      } else {
        video.onloadedmetadata = playVideo;
      }
    }
  }, [isCameraActive]);

  // Cleanup camera stream on unmount
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

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 1280, min: 640 }, height: { ideal: 720, min: 480 } },
          audio: false
        });
      } catch {
        // Fallback for basic video stream if resolution constraints fail
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
      }

      mediaStreamRef.current = stream;
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
    if (!videoRef.current) {
      showToast('Camera feed not ready');
      return;
    }
    const video = videoRef.current;

    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;

    if (width === 0 || height === 0) {
      showToast('Camera feed is initializing. Please wait a second.');
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Flip horizontal canvas to match mirrored selfie view
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `live_photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
        setPhotoFile(file);
        setPhotoPreview(dataUrl);
        stopCamera();
        showToast('✓ Live selfie photo captured clearly!');
      } else {
        // Fallback if toBlob fails
        fetch(dataUrl)
          .then(res => res.blob())
          .then(blob => {
            const file = new File([blob], `live_photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
            setPhotoFile(file);
            setPhotoPreview(dataUrl);
            stopCamera();
            showToast('✓ Live selfie photo captured clearly!');
          });
      }
    }, 'image/jpeg', 0.9);
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

  const rejectionReason = onboardingStatus.rejection_reason || 'Document or photo did not meet clarity requirements.';

  // Determine current active step (1, 2, or 3)
  const currentStep = verificationStatus === 'VERIFIED' ? 3 : (idFile && photoFile) ? 3 : photoFile ? 2 : idFile ? 2 : 1;

  return (
    <div className="min-h-screen bg-transparent text-black pb-16 font-sans antialiased">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Header with Crisp Black Title */}
        <div className="pb-3 border-b border-slate-200">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-black">
            Identity Verification
          </h1>
          <p className="text-xs font-semibold text-slate-700 mt-0.5">
            Verify your government ID & selfie to receive your green verified badge and double your match connections.
          </p>
        </div>

        {/* Stepper Progress Bar */}
        {verificationStatus !== 'VERIFIED' && verificationStatus !== 'PENDING' && (
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm">
            <div className="flex items-center justify-between max-w-md mx-auto relative">
              {/* Step 1 */}
              <div className="flex flex-col items-center gap-1.5 relative z-10">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                  idFile
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-[#C44569] text-white ring-4 ring-[#C44569]/15'
                }`}>
                  {idFile ? <Check className="h-4 w-4 stroke-[3]" /> : '1'}
                </div>
                <span className="text-[11px] font-bold text-black">Govt ID</span>
              </div>

              {/* Connecting Line 1 */}
              <div className={`flex-1 h-0.5 mx-2 transition-colors duration-300 ${idFile ? 'bg-emerald-500' : 'bg-slate-200'}`} />

              {/* Step 2 */}
              <div className="flex flex-col items-center gap-1.5 relative z-10">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                  photoFile
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : idFile
                    ? 'bg-[#C44569] text-white ring-4 ring-[#C44569]/15'
                    : 'bg-slate-100 text-slate-400 border border-slate-300'
                }`}>
                  {photoFile ? <Check className="h-4 w-4 stroke-[3]" /> : '2'}
                </div>
                <span className="text-[11px] font-bold text-black">Live Selfie</span>
              </div>

              {/* Connecting Line 2 */}
              <div className={`flex-1 h-0.5 mx-2 transition-colors duration-300 ${photoFile ? 'bg-emerald-500' : 'bg-slate-200'}`} />

              {/* Step 3 */}
              <div className="flex flex-col items-center gap-1.5 relative z-10">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                  (idFile && photoFile)
                    ? 'bg-[#C44569] text-white ring-4 ring-[#C44569]/15'
                    : 'bg-slate-100 text-slate-400 border border-slate-300'
                }`}>
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <span className="text-[11px] font-bold text-black">Verified Badge</span>
              </div>
            </div>
          </div>
        )}

        {/* State View 1: VERIFIED / APPROVED */}
        {verificationStatus === 'VERIFIED' && (
          <div className="bg-white rounded-2xl border border-emerald-200 p-8 sm:p-10 text-center space-y-6 shadow-sm">
            <div className="relative mx-auto h-20 w-20 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center ring-8 ring-emerald-50/80 border border-emerald-200">
              <ShieldCheck className="h-10 w-10 text-emerald-600" />
              <div className="absolute -bottom-1 -right-1 bg-emerald-600 text-white rounded-full p-1 shadow-xs">
                <Check className="h-3.5 w-3.5 stroke-[3]" />
              </div>
            </div>

            <div className="space-y-2 max-w-md mx-auto">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full border border-emerald-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Verified Member Profile
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-black">
                Your Profile is Verified!
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                Your identity documents have been approved by our verification team. Prospective matches can now see your green verified badge with confidence.
              </p>
            </div>

            {/* Unlocked Benefits Checklist */}
            <div className="bg-emerald-50/60 rounded-2xl p-5 max-w-md mx-auto text-left space-y-2.5 border border-emerald-200/80 text-xs">
              <div className="flex items-center gap-2 text-emerald-950 font-bold">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Green Verified Shield Badge displayed on search cards</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-950 font-bold">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Full access to contact unlocks & direct messaging</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-950 font-bold">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Top placement in match recommendations</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => navigate('/matches')}
                className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-[#C83259] to-[#E11D48] hover:from-[#A82547] hover:to-[#BE123C] text-white font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center gap-2 mx-auto cursor-pointer"
              >
                Explore Your Matches <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* State View 2: PENDING ADMIN REVIEW */}
        {verificationStatus === 'PENDING' && (
          <div className="bg-white rounded-2xl border border-amber-300/80 p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
              <div className="h-14 w-14 rounded-2xl bg-amber-100/80 text-amber-800 flex items-center justify-center shrink-0 shadow-xs border border-amber-200">
                <Clock className="h-7 w-7 text-amber-700 animate-pulse" />
              </div>

              <div className="space-y-2.5 flex-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  <Clock className="h-3.5 w-3.5 text-amber-700" /> Pending Admin Review
                </div>

                <h2 className="text-xl sm:text-2xl font-bold text-black">
                  Documents Under Review
                </h2>

                <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                  Your Government ID and selfie have been submitted securely. Our team verifies submissions within <strong>2 to 4 hours</strong>. You can continue browsing matches while we process your request.
                </p>

                {/* Submitted Files Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center gap-3">
                    <FileText className="h-5 w-5 text-[#C44569] shrink-0" />
                    <div>
                      <span className="font-bold text-black block">Government ID</span>
                      <span className="text-[11px] text-emerald-700 font-bold">✓ Attached & Submitted</span>
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center gap-3">
                    <Camera className="h-5 w-5 text-[#C44569] shrink-0" />
                    <div>
                      <span className="font-bold text-black block">Live Selfie Photo</span>
                      <span className="text-[11px] text-emerald-700 font-bold">✓ Attached & Submitted</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
              <button
                onClick={handleRefreshStatus}
                disabled={isRefreshing}
                className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-black font-bold text-xs transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                Check Latest Status
              </button>

              <button
                onClick={() => navigate('/matches')}
                className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-[#C83259] to-[#E11D48] hover:from-[#A82547] hover:to-[#BE123C] text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                Proceed to Matches <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* State View 3: REJECTED or NOT_SUBMITTED */}
        {(verificationStatus === 'NOT_SUBMITTED' || verificationStatus === 'REJECTED') && (
          <form onSubmit={handleFormSubmit} className="space-y-6">

            {/* Rejection Alert Box */}
            {verificationStatus === 'REJECTED' && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
                  <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
                  <span>Verification Request Requires Attention</span>
                </div>
                <p className="text-xs text-rose-900 leading-relaxed pl-7 font-semibold">
                  <strong>Reason:</strong> {rejectionReason}
                </p>
                <p className="text-[11px] text-rose-700 pl-7 font-medium">
                  Please upload a clear copy of your ID document and retake your selfie photo below.
                </p>
              </div>
            )}

            {/* Step 1: Government ID Selection & Upload */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-7 space-y-5 shadow-sm hover:border-[#C44569]/30 transition-colors">
              <div className="flex items-center justify-between gap-4 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-[#C44569] text-white flex items-center justify-center shrink-0 shadow-xs">
                    <FileText className="h-5 w-5 stroke-[2.2]" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-black">
                      Government ID Document <span className="text-rose-600 font-black">*</span>
                    </h2>
                    <p className="text-[11px] font-semibold text-slate-600 mt-0.5">
                      Select your document type and upload a clear front copy.
                    </p>
                  </div>
                </div>

                {idFile && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
                    <Check className="h-3.5 w-3.5 text-emerald-600 stroke-[3]" /> Attached
                  </span>
                )}
              </div>

              {/* ID Type Pills */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-black">Select Document Type:</label>
                <div className="flex flex-wrap gap-2">
                  {GOVT_ID_TYPES.map(type => {
                    const isSelected = idType === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setIdType(type)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-rose-50 text-[#C44569] border-[#C44569] shadow-xs'
                            : 'bg-slate-50 text-black border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {type}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ID File Upload Dropzone / Attached Box */}
              {!idFile ? (
                <label className="border-2 border-dashed border-slate-300 hover:border-[#C44569] bg-slate-50/50 hover:bg-slate-50 rounded-2xl p-7 flex flex-col items-center justify-center cursor-pointer transition-all space-y-2.5 text-center group">
                  <div className="h-12 w-12 rounded-xl bg-rose-50 text-[#C44569] flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Upload className="h-6 w-6 stroke-[2.2]" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-black block">
                      Click to upload {idType}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium mt-0.5 block">
                      Supports PNG, JPG, or PDF up to 10MB
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
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5 min-w-0">
                    {idPreview ? (
                      <img src={idPreview} alt="ID Preview" className="h-14 w-14 rounded-xl object-cover border border-slate-300 shrink-0" />
                    ) : (
                      <div className="h-14 w-14 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                        <FileText className="h-7 w-7" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <h5 className="font-bold text-xs text-black truncate">{idFile.name}</h5>
                      <span className="text-[11px] text-slate-600 font-semibold block">
                        {idType} • {(idFile.size / (1024 * 1024)).toFixed(2)} MB
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => { setIdFile(null); setIdPreview(null); }}
                    className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-xl border border-rose-200 transition-all cursor-pointer shrink-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Replace
                  </button>
                </div>
              )}
            </div>

            {/* Step 2: Live Selfie Photo Capture */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-7 space-y-5 shadow-sm hover:border-[#C44569]/30 transition-colors">
              <div className="flex items-center justify-between gap-4 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-[#C44569] text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Camera className="h-5 w-5 stroke-[2.2]" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-black">
                      Live Selfie Photo <span className="text-rose-600 font-black">*</span>
                    </h2>
                    <p className="text-[11px] font-semibold text-slate-600 mt-0.5">
                      Capture a quick selfie to verify your profile photo authenticity.
                    </p>
                  </div>
                </div>

                {photoFile && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
                    <Check className="h-3.5 w-3.5 text-emerald-600 stroke-[3]" /> Captured
                  </span>
                )}
              </div>

              {/* Camera Feed / Capture Box */}
              <div className="space-y-4">
                {isCameraActive ? (
                  <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-[4/3] max-w-md mx-auto border-2 border-[#C44569] shadow-lg">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover scale-x-[-1]"
                    />
                    {/* Face Oval Guideline Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-44 h-56 rounded-full border-2 border-dashed border-rose-300/80 bg-black/10 backdrop-blur-2xs flex flex-col items-center justify-center text-center p-4">
                        <span className="text-[10px] font-bold text-white bg-black/60 px-3 py-1 rounded-full">
                          Position face inside frame
                        </span>
                      </div>
                    </div>
                    {/* Capture Actions */}
                    <div className="absolute bottom-4 inset-x-0 flex justify-center gap-3 z-10">
                      <button
                        type="button"
                        onClick={capturePhoto}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-1.5 transition-all"
                      >
                        <Camera className="h-4 w-4" /> Capture Selfie
                      </button>
                      <button
                        type="button"
                        onClick={stopCamera}
                        className="px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white border border-white/40 font-bold text-xs rounded-xl cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : photoPreview ? (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-4 max-w-md mx-auto">
                    <div className="flex items-center gap-3.5">
                      <img
                        src={photoPreview}
                        alt="Captured Selfie"
                        className="h-20 w-20 rounded-xl object-cover border-2 border-rose-400 shadow-xs shrink-0"
                      />
                      <div>
                        <h5 className="font-bold text-xs text-black">Live Selfie Ready</h5>
                        <span className="text-[11px] text-emerald-700 font-bold block">✓ Quality Verified</span>
                        <span className="text-[10px] text-slate-500 font-semibold">Ready for submission</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={startCamera}
                        className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-black transition-all cursor-pointer shadow-xs"
                      >
                        <RefreshCw className="h-3 w-3" /> Retake
                      </button>
                      <button
                        type="button"
                        onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                        className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-xl border border-rose-200 transition-all cursor-pointer"
                      >
                        <Trash2 className="h-3 w-3" /> Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 max-w-md mx-auto text-center py-2">
                    {cameraError && (
                      <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2 text-left font-medium">
                        <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                        <span>{cameraError}</span>
                      </div>
                    )}

                    <div className="flex flex-col items-center justify-center p-6 sm:p-8 border-2 border-dashed border-slate-200 bg-slate-50/60 rounded-2xl space-y-4">
                      <div className="h-16 w-16 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-[#C44569] shadow-xs">
                        <Camera className="h-8 w-8" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-black">Take Live Camera Selfie</h4>
                        <p className="text-xs text-slate-500 max-w-xs mx-auto">
                          Click below to activate your live camera and capture a real-time selfie.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={startCamera}
                        className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-[#C83259] to-[#E11D48] hover:from-[#A82547] hover:to-[#BE123C] text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg cursor-pointer transition-all flex items-center justify-center gap-2"
                      >
                        <Camera className="h-4 w-4" />
                        <span>Open Live Camera</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-slate-700 font-semibold">
                <Lock className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>
                  Protected by 256-bit SSL encryption. ID documents remain strictly confidential.
                </span>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto shrink-0 justify-end">
                <button
                  type="submit"
                  disabled={!idFile || !photoFile || isSubmitting}
                  className="w-full sm:w-auto px-8 py-2.5 rounded-xl bg-gradient-to-r from-[#C83259] to-[#E11D48] hover:from-[#A82547] hover:to-[#BE123C] disabled:opacity-50 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" /> Verifying...
                    </>
                  ) : (
                    <>
                      Submit Verification <span className="font-extrabold text-sm">→</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </form>
        )}
      </div>
    </div>
  );
};
