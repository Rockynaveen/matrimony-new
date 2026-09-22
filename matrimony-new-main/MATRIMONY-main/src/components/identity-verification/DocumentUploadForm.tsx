import React, { useState, useRef, useEffect } from 'react';
import {
  UploadCloud,
  Camera,
  CheckCircle2,
  AlertCircle,
  FileText,
  Trash2,
  RefreshCw,
  CreditCard,
  Car,
  UserCheck,
  ShieldCheck,
  Check,
  Image as ImageIcon,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Button } from '../ui/Button';
import { BACKEND_DOCUMENT_TYPES } from '../../types/identityVerification.types';
import type {
  BackendGovtDocumentType,
  IdentityDocumentUploadPayload,
  IdentityFormValidationErrors,
  DocumentUploadVerificationOut
} from '../../types/identityVerification.types';

export interface DocumentUploadFormProps {
  onSubmit: (payload: IdentityDocumentUploadPayload) => Promise<DocumentUploadVerificationOut | null | boolean>;
  isSubmitting: boolean;
  serverError?: string | null;
  serverSuccess?: string | null;
  onClearError?: () => void;
  onSkipForNow?: () => void;
}

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_DOC_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
const ALLOWED_DOC_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png'];
const ALLOWED_FACE_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];
const ALLOWED_FACE_EXTENSIONS = ['.jpg', '.jpeg', '.png'];

const DOC_ICONS: Record<BackendGovtDocumentType, React.ComponentType<{ className?: string }>> = {
  AADHAAR: CreditCard,
  PAN: FileText,
  PASSPORT: CreditCard,
  DRIVING_LICENCE: Car,
  VOTER_ID: UserCheck
};

export const DocumentUploadForm: React.FC<DocumentUploadFormProps> = ({
  onSubmit,
  isSubmitting,
  serverError,
  serverSuccess,
  onClearError,
  onSkipForNow
}) => {
  const [documentType, setDocumentType] = useState<BackendGovtDocumentType>('AADHAAR');
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentPreview, setDocumentPreview] = useState<string | null>(null);

  const [liveFaceFile, setLiveFaceFile] = useState<File | null>(null);
  const [facePreview, setFacePreview] = useState<string | null>(null);
  const [photoMethod, setPhotoMethod] = useState<'camera' | 'upload'>('upload');

  const [errors, setErrors] = useState<IdentityFormValidationErrors>({});
  const [isDocDragging, setIsDocDragging] = useState<boolean>(false);
  const [isFaceDragging, setIsFaceDragging] = useState<boolean>(false);

  // Live Camera state
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const docInputRef = useRef<HTMLInputElement | null>(null);
  const faceInputRef = useRef<HTMLInputElement | null>(null);

  // Stop camera when unmounting
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const handleDocumentFile = (file: File) => {
    if (onClearError) onClearError();
    const ext = `.${file.name.split('.').pop()?.toLowerCase()}`;
    const isValidType = ALLOWED_DOC_TYPES.includes(file.type) || ALLOWED_DOC_EXTENSIONS.includes(ext);

    if (!isValidType) {
      setErrors(prev => ({
        ...prev,
        document_file: 'Please upload a valid document (JPG, PNG, or PDF).'
      }));
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrors(prev => ({
        ...prev,
        document_file: 'File size exceeds 10 MB limit.'
      }));
      return;
    }

    setDocumentFile(file);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => setDocumentPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setDocumentPreview(null);
    }

    setErrors(prev => ({ ...prev, document_file: undefined }));
  };

  const handleLiveFaceFile = (file: File) => {
    if (onClearError) onClearError();
    const ext = `.${file.name.split('.').pop()?.toLowerCase()}`;
    const isValidType = ALLOWED_FACE_TYPES.includes(file.type) || ALLOWED_FACE_EXTENSIONS.includes(ext);

    if (!isValidType) {
      setErrors(prev => ({
        ...prev,
        live_face_file: 'Please upload a valid photo (JPG, JPEG, or PNG).'
      }));
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrors(prev => ({
        ...prev,
        live_face_file: 'Face photo size exceeds 10 MB limit.'
      }));
      return;
    }

    setLiveFaceFile(file);
    const reader = new FileReader();
    reader.onload = () => setFacePreview(reader.result as string);
    reader.readAsDataURL(file);

    setErrors(prev => ({ ...prev, live_face_file: undefined }));
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        setCameraError('Camera access is not supported in this browser. Please upload a selfie photo instead.');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false
      });
      streamRef.current = stream;
      setIsCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch {
      setCameraError('Camera access was denied or is unavailable. Please choose photo upload instead.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(blob => {
      if (blob) {
        const file = new File([blob], `selfie_${Date.now()}.jpg`, { type: 'image/jpeg' });
        handleLiveFaceFile(file);
        stopCamera();
      }
    }, 'image/jpeg', 0.92);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: IdentityFormValidationErrors = {};
    if (!documentType) newErrors.document_type = 'Please select a government ID type.';
    if (!documentFile) newErrors.document_file = 'Please upload your government ID document.';
    if (!liveFaceFile) newErrors.live_face_file = 'Please upload or capture your live selfie photo.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (!documentFile || !liveFaceFile) return;

    const payload: IdentityDocumentUploadPayload = {
      document_type: documentType,
      document_file: documentFile,
      live_face_file: liveFaceFile
    };

    const res = await onSubmit(payload);
    if (res) {
      setDocumentFile(null);
      setDocumentPreview(null);
      setLiveFaceFile(null);
      setFacePreview(null);
      setErrors({});
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {serverError && (
        <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-900 flex items-start gap-3 shadow-2xs">
          <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="text-xs font-bold text-rose-950">Verification Notice</p>
            <p className="text-xs font-medium text-rose-800 leading-relaxed">{serverError}</p>
          </div>
        </div>
      )}

      {serverSuccess && (
        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-900 flex items-start gap-3 shadow-2xs">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="text-xs font-bold text-emerald-950">Submission Successful</p>
            <p className="text-xs font-medium text-emerald-800 leading-relaxed">{serverSuccess}</p>
          </div>
        </div>
      )}

      {/* ── CARD 1: Select Government ID Type ── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-2xs space-y-5">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="h-5 w-5 text-blue-600" />
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              1. Select Government ID Type
            </h2>
            <p className="text-xs text-slate-500">
              Choose the official government identity card you wish to submit for verification.
            </p>
          </div>
        </div>

        {/* Single-line Government ID Type Selector */}
        <div className="grid grid-cols-5 gap-2 sm:gap-3">
          {BACKEND_DOCUMENT_TYPES.map(doc => {
            const Icon = DOC_ICONS[doc.value] || CreditCard;
            const isSelected = documentType === doc.value;

            return (
              <button
                key={doc.value}
                type="button"
                title={`${doc.label} - ${doc.description}`}
                onClick={() => {
                  setDocumentType(doc.value);
                  if (onClearError) onClearError();
                }}
                className={`p-2 sm:p-3 rounded-xl border text-center transition-all cursor-pointer relative flex flex-col items-center justify-center gap-1.5 sm:gap-2 min-h-[80px] sm:min-h-[90px] ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/60 shadow-xs ring-2 ring-blue-600/30'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/70 bg-white'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 h-4 w-4 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-2xs">
                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                  </div>
                )}
                <div className={`p-1.5 sm:p-2 rounded-xl transition-colors ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div className="w-full px-0.5 text-center">
                  <h3 className={`text-[11px] sm:text-xs font-bold leading-tight truncate ${isSelected ? 'text-blue-950' : 'text-slate-800'}`}>
                    {doc.label}
                  </h3>
                </div>
              </button>
            );
          })}
        </div>

        {errors.document_type && (
          <p className="text-xs text-rose-600 font-semibold">{errors.document_type}</p>
        )}
      </div>

      {/* ── CARD 2: Upload Government ID File ── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-2xs space-y-5">
        <div className="flex items-center gap-2.5">
          <FileText className="h-5 w-5 text-blue-600" />
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              2. Upload {BACKEND_DOCUMENT_TYPES.find(d => d.value === documentType)?.label || 'Document'}
            </h2>
            <p className="text-xs text-slate-500">
              Ensure all 4 corners are visible, text is readable, and without flash glare (JPG, PNG, or PDF up to 10MB).
            </p>
          </div>
        </div>

        {documentFile ? (
          /* File Uploaded Preview */
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row items-center gap-4">
            {documentPreview ? (
              <img
                src={documentPreview}
                alt="Document preview"
                className="h-24 w-36 object-cover rounded-lg border border-slate-200 bg-white"
              />
            ) : (
              <div className="h-24 w-36 rounded-lg border border-slate-200 bg-white flex flex-col items-center justify-center text-slate-500">
                <FileText className="h-8 w-8 text-blue-600" />
                <span className="text-[10px] font-bold mt-1 text-slate-700">PDF Document</span>
              </div>
            )}

            <div className="flex-1 space-y-1 text-center sm:text-left min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">
                {documentFile.name}
              </p>
              <p className="text-[11px] text-slate-500 font-medium">
                Size: {formatFileSize(documentFile.size)} • Type: {documentFile.type || 'Document'}
              </p>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md mt-1">
                <Check className="h-3 w-3" /> Ready for AI OCR Verification
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                setDocumentFile(null);
                setDocumentPreview(null);
              }}
              className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
              title="Remove file"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ) : (
          /* Dropzone */
          <div
            onDragOver={e => {
              e.preventDefault();
              setIsDocDragging(true);
            }}
            onDragLeave={() => setIsDocDragging(false)}
            onDrop={e => {
              e.preventDefault();
              setIsDocDragging(false);
              if (e.dataTransfer.files?.[0]) {
                handleDocumentFile(e.dataTransfer.files[0]);
              }
            }}
            onClick={() => docInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-3 ${
              isDocDragging
                ? 'border-blue-500 bg-blue-50/50'
                : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50/60 bg-white'
            }`}
          >
            <input
              ref={docInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
              onChange={e => {
                if (e.target.files?.[0]) {
                  handleDocumentFile(e.target.files[0]);
                }
              }}
              className="hidden"
            />
            <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
              <UploadCloud className="h-6 w-6 text-blue-600" />
            </div>
            <div className="space-y-1">
              <p className="text-xs sm:text-sm font-bold text-slate-900">
                Click to browse or drag and drop your {BACKEND_DOCUMENT_TYPES.find(d => d.value === documentType)?.label}
              </p>
              <p className="text-[11px] text-slate-500">
                Supported formats: PDF, JPG, PNG (Max: 10 MB)
              </p>
            </div>
          </div>
        )}

        {errors.document_file && (
          <p className="text-xs text-rose-600 font-semibold">{errors.document_file}</p>
        )}
      </div>

      {/* ── CARD 3: Live Face Verification ── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-2xs space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <Camera className="h-5 w-5 text-blue-600" />
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                3. Live Face Verification
              </h2>
              <p className="text-xs text-slate-500">
                A live selfie is matched against the photo on your government ID to confirm genuine ownership.
              </p>
            </div>
          </div>

          {/* Toggle between Webcam and File Upload */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => {
                setPhotoMethod('upload');
                stopCamera();
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                photoMethod === 'upload'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ImageIcon className="h-3.5 w-3.5" />
              Upload Selfie
            </button>
            <button
              type="button"
              onClick={() => {
                setPhotoMethod('camera');
                startCamera();
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                photoMethod === 'camera'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Camera className="h-3.5 w-3.5" />
              Live Webcam
            </button>
          </div>
        </div>

        {liveFaceFile ? (
          /* Face Photo Preview */
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row items-center gap-4">
            {facePreview && (
              <img
                src={facePreview}
                alt="Face preview"
                className="h-24 w-24 object-cover rounded-full border-2 border-blue-600/60 shadow-xs"
              />
            )}

            <div className="flex-1 space-y-1 text-center sm:text-left min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">
                {liveFaceFile.name}
              </p>
              <p className="text-[11px] text-slate-500 font-medium">
                Size: {formatFileSize(liveFaceFile.size)} • Type: {liveFaceFile.type}
              </p>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md mt-1">
                <Check className="h-3 w-3" /> Ready for Face Match AI Check
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                setLiveFaceFile(null);
                setFacePreview(null);
              }}
              className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
              title="Remove photo"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ) : photoMethod === 'camera' ? (
          /* Live Webcam View */
          <div className="space-y-4">
            {cameraError ? (
              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-900 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-bold">Camera Unavailable</p>
                  <p className="text-xs text-amber-800">{cameraError}</p>
                  <button
                    type="button"
                    onClick={() => setPhotoMethod('upload')}
                    className="text-xs font-bold text-blue-600 underline cursor-pointer mt-1"
                  >
                    Switch to file upload instead
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative rounded-2xl overflow-hidden bg-slate-900 max-w-md mx-auto aspect-4/3 flex items-center justify-center border border-slate-700 shadow-md">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover mirror"
                />
                
                {/* Face oval guideline overlay */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-48 h-64 border-2 border-dashed border-white/70 rounded-[50%] shadow-2xl ring-1 ring-black/40" />
                </div>

                {isCameraActive && (
                  <div className="absolute bottom-4 inset-x-0 flex justify-center gap-3">
                    <Button
                      type="button"
                      onClick={capturePhoto}
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg cursor-pointer flex items-center gap-2"
                    >
                      <Camera className="h-4 w-4" /> Capture Snapshot
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Face File Upload Dropzone */
          <div
            onDragOver={e => {
              e.preventDefault();
              setIsFaceDragging(true);
            }}
            onDragLeave={() => setIsFaceDragging(false)}
            onDrop={e => {
              e.preventDefault();
              setIsFaceDragging(false);
              if (e.dataTransfer.files?.[0]) {
                handleLiveFaceFile(e.dataTransfer.files[0]);
              }
            }}
            onClick={() => faceInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-3 ${
              isFaceDragging
                ? 'border-blue-500 bg-blue-50/50'
                : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50/60 bg-white'
            }`}
          >
            <input
              ref={faceInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,image/jpeg,image/png"
              onChange={e => {
                if (e.target.files?.[0]) {
                  handleLiveFaceFile(e.target.files[0]);
                }
              }}
              className="hidden"
            />
            <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
              <Camera className="h-6 w-6 text-blue-600" />
            </div>
            <div className="space-y-1">
              <p className="text-xs sm:text-sm font-bold text-slate-900">
                Click to browse or drag and drop a clear, frontal selfie photo
              </p>
              <p className="text-[11px] text-slate-500">
                Take a selfie without sunglasses or caps in good lighting (JPG, PNG up to 10 MB)
              </p>
            </div>
          </div>
        )}

        {errors.live_face_file && (
          <p className="text-xs text-rose-600 font-semibold">{errors.live_face_file}</p>
        )}
      </div>

      {/* ── Submit Verification Action Bar ── */}
      <div className="flex items-center justify-end gap-3 pt-2 pb-8">
        <Button
          type="submit"
          disabled={isSubmitting || !documentFile || !liveFaceFile}
          isLoading={isSubmitting}
          className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white shadow-md hover:shadow-lg text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2"
        >
          <Sparkles className="h-4 w-4" />
          {isSubmitting ? 'Verifying with AI Engine...' : 'Submit Verification'}
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </form>
  );
};
