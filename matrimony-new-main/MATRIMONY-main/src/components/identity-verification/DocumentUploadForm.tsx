import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  Camera,
  Lock,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  X,
  CreditCard,
  Car,
  FileText,
  UserCheck,
  Check,
  Image as ImageIcon,
  ArrowRight
} from 'lucide-react';
import { Input } from '../ui/Input';
import { Alert, AlertDescription } from '../ui/Alert';
import type {
  IdentityDocumentUploadPayload,
  IdentityFormValidationErrors
} from '../../types/identityVerification.types';

export interface DocumentUploadFormProps {
  onSubmit: (payload: IdentityDocumentUploadPayload) => Promise<boolean>;
  isSubmitting: boolean;
  serverError?: string | null;
  serverSuccess?: string | null;
  onClearError?: () => void;
}

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB matching mockup
const ALLOWED_DOC_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
const ALLOWED_DOC_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png'];
const ALLOWED_FACE_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];
const ALLOWED_FACE_EXTENSIONS = ['.jpg', '.jpeg', '.png'];

const GOVT_ID_OPTIONS = [
  { id: 'Aadhaar', label: 'Aadhaar Card', icon: CreditCard },
  { id: 'PAN Card', label: 'PAN Card', icon: FileText },
  { id: 'Passport', label: 'Passport', icon: CreditCard },
  { id: 'Driving License', label: 'Driving License', icon: Car },
  { id: 'Voter ID', label: 'Voter ID', icon: UserCheck }
];

export const DocumentUploadForm: React.FC<DocumentUploadFormProps> = ({
  onSubmit,
  isSubmitting,
  serverError,
  serverSuccess,
  onClearError
}) => {
  const [documentType, setDocumentType] = useState<string>('Aadhaar');
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentPreview, setDocumentPreview] = useState<string | null>(null);

  const [liveFaceFile, setLiveFaceFile] = useState<File | null>(null);
  const [facePreview, setFacePreview] = useState<string | null>(null);
  const [photoMethod, setPhotoMethod] = useState<'upload' | 'camera'>('upload');

  const [pdfPassword, setPdfPassword] = useState<string>('');
  const [errors, setErrors] = useState<IdentityFormValidationErrors>({});
  const [isDocDragging, setIsDocDragging] = useState<boolean>(false);
  const [isFaceDragging, setIsFaceDragging] = useState<boolean>(false);

  // Camera handling
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const docInputRef = useRef<HTMLInputElement | null>(null);
  const faceInputRef = useRef<HTMLInputElement | null>(null);

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
        document_file: 'File size exceeds 5 MB limit.'
      }));
      return;
    }

    setDocumentFile(file);
    if (file.type.startsWith('image/')) {
      setDocumentPreview(URL.createObjectURL(file));
    } else {
      setDocumentPreview(null);
    }

    setErrors(prev => {
      const next = { ...prev };
      delete next.document_file;
      return next;
    });
  };

  const handleLiveFaceFile = (file: File) => {
    if (onClearError) onClearError();
    const ext = `.${file.name.split('.').pop()?.toLowerCase()}`;
    const isValidType = ALLOWED_FACE_TYPES.includes(file.type) || ALLOWED_FACE_EXTENSIONS.includes(ext);

    if (!isValidType) {
      setErrors(prev => ({
        ...prev,
        live_face_file: 'Please upload a valid photo (JPG or PNG).'
      }));
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrors(prev => ({
        ...prev,
        live_face_file: 'Photo size exceeds 5 MB limit.'
      }));
      return;
    }

    setLiveFaceFile(file);
    setFacePreview(URL.createObjectURL(file));

    setErrors(prev => {
      const next = { ...prev };
      delete next.live_face_file;
      return next;
    });
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Camera access is not supported on this device. Please upload a photo.');
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
    if (!documentType.trim()) newErrors.document_type = 'Please select a government ID type.';
    if (!documentFile) newErrors.document_file = 'Please upload your government ID document.';
    if (!liveFaceFile) newErrors.live_face_file = 'Please upload or capture your verification photo.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (!documentFile || !liveFaceFile) return;

    const payload: IdentityDocumentUploadPayload = {
      document_type: documentType,
      pdf_password: pdfPassword.trim() || 'N',
      document_file: documentFile,
      live_face_file: liveFaceFile
    };

    const success = await onSubmit(payload);
    if (success) {
      setDocumentFile(null);
      setDocumentPreview(null);
      setLiveFaceFile(null);
      setFacePreview(null);
      setPdfPassword('');
      setErrors({});
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {serverError && (
        <Alert variant="destructive" className="rounded-xl border-rose-200 bg-rose-50 text-rose-900">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs font-medium">{serverError}</AlertDescription>
        </Alert>
      )}

      {serverSuccess && (
        <Alert variant="success" className="rounded-xl border-emerald-200 bg-emerald-50 text-emerald-900">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription className="text-xs font-medium">{serverSuccess}</AlertDescription>
        </Alert>
      )}

      {/* Main Form White Card */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-stone-200/90 shadow-2xs p-6 sm:p-8 space-y-7">
        
        {/* Section Heading */}
        <div className="space-y-1">
          <h2 className="text-lg sm:text-xl font-bold text-stone-900">
            Upload a Government ID
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 font-normal">
            Please upload a clear and valid document to verify your identity. This helps us maintain a safe and genuine community.
          </p>
        </div>

        {/* 1. Government ID Type Selector (5 Options Grid) */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3">
          {GOVT_ID_OPTIONS.map(opt => {
            const isSelected = documentType === opt.id;
            const Icon = opt.icon;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  setDocumentType(opt.id);
                  if (errors.document_type) {
                    setErrors(prev => {
                      const next = { ...prev };
                      delete next.document_type;
                      return next;
                    });
                  }
                }}
                className={`flex flex-col items-center justify-center p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer text-center select-none ${
                  isSelected
                    ? 'border-[#8B1E3F] bg-[#FFF5F7] text-[#8B1E3F] shadow-xs'
                    : 'border-stone-200 bg-stone-50/60 hover:bg-stone-100/80 text-stone-700'
                }`}
              >
                <div
                  className={`h-9 w-9 rounded-lg flex items-center justify-center mb-2 transition-colors ${
                    isSelected ? 'bg-rose-100 text-[#8B1E3F]' : 'bg-stone-100 text-stone-600'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <span className={`text-xs ${isSelected ? 'font-bold text-[#8B1E3F]' : 'font-medium text-stone-800'}`}>
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>

        {errors.document_type && (
          <p className="text-xs text-rose-600 font-medium">{errors.document_type}</p>
        )}

        {/* 2. Drag & Drop Upload Zone for ID Document */}
        <div>
          <input
            ref={docInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/*"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) handleDocumentFile(file);
            }}
          />

          {!documentFile ? (
            <div
              onDragOver={e => {
                e.preventDefault();
                setIsDocDragging(true);
              }}
              onDragLeave={e => {
                e.preventDefault();
                setIsDocDragging(false);
              }}
              onDrop={e => {
                e.preventDefault();
                setIsDocDragging(false);
                const file = e.dataTransfer.files?.[0];
                if (file) handleDocumentFile(file);
              }}
              onClick={() => docInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center transition-all cursor-pointer ${
                isDocDragging
                  ? 'border-[#8B1E3F] bg-rose-50/70 scale-[0.99]'
                  : 'border-stone-300 hover:border-[#8B1E3F]/70 bg-stone-50/40 hover:bg-rose-50/20'
              }`}
            >
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="h-14 w-14 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-[#8B1E3F]">
                  <UploadCloud className="h-7 w-7 text-[#8B1E3F]" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-stone-800">
                    Drag &amp; Drop your file here
                  </p>
                  <p className="text-xs text-stone-400 font-medium">or</p>
                </div>
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    docInputRef.current?.click();
                  }}
                  className="px-6 py-2 rounded-xl text-xs font-bold text-white bg-[#8B1E3F] hover:bg-[#721833] shadow-xs cursor-pointer transition-all"
                >
                  Choose File
                </button>
                <p className="text-[11px] text-stone-400 font-normal pt-1">
                  Accepted formats: JPG, PNG, PDF | Max size: 5 MB
                </p>
              </div>
            </div>
          ) : (
            /* Selected Document File Card */
            <div className="flex items-center justify-between p-4 bg-[#FFF5F7] border border-rose-200/90 rounded-2xl">
              <div className="flex items-center gap-3.5 min-w-0 pr-2">
                {documentPreview ? (
                  <div className="h-12 w-12 rounded-xl overflow-hidden border border-rose-200 shrink-0 shadow-2xs">
                    <img src={documentPreview} alt="Document" className="h-full w-full object-cover" />
                  </div>
                ) : (
                  <div className="h-12 w-12 rounded-xl bg-rose-100 text-[#8B1E3F] flex items-center justify-center shrink-0">
                    <FileText className="h-6 w-6 text-[#8B1E3F]" />
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold text-stone-900 truncate max-w-[220px] sm:max-w-xs">
                      {documentFile.name}
                    </p>
                    <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full shrink-0">
                      <Check className="h-3 w-3 mr-0.5" /> Ready
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 font-medium">
                    {formatFileSize(documentFile.size)} • {documentType}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => docInputRef.current?.click()}
                  className="text-xs font-semibold text-[#8B1E3F] hover:underline px-2 py-1 cursor-pointer"
                >
                  Change
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDocumentFile(null);
                    setDocumentPreview(null);
                  }}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors cursor-pointer"
                  title="Remove file"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {errors.document_file && (
            <p className="text-xs text-rose-600 font-medium mt-1.5">{errors.document_file}</p>
          )}

          {/* If PDF, show password input if protected */}
          {documentFile?.name.toLowerCase().endsWith('.pdf') && (
            <div className="mt-3 p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-1">
              <label className="text-xs font-semibold text-stone-700">
                PDF Password (Optional)
              </label>
              <Input
                type="password"
                placeholder="Enter password if your PDF is password-protected"
                value={pdfPassword}
                onChange={e => setPdfPassword(e.target.value)}
                className="text-xs h-9 bg-white"
              />
            </div>
          )}
        </div>

        {/* 3. Verification Photo / Live Selfie Section */}
        <div className="pt-2 border-t border-stone-100 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-stone-900">
                Live Face / Selfie Verification
              </h3>
              <p className="text-xs text-stone-500 font-normal">
                Upload a clear frontal photo or take a quick webcam selfie to match your ID.
              </p>
            </div>

            {/* Toggle Photo Method */}
            <div className="inline-flex rounded-xl bg-stone-100 p-0.5 border border-stone-200 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  setPhotoMethod('upload');
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  photoMethod === 'upload'
                    ? 'bg-white text-[#8B1E3F] shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Upload Photo
              </button>
              <button
                type="button"
                onClick={() => {
                  setPhotoMethod('camera');
                  startCamera();
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  photoMethod === 'camera'
                    ? 'bg-white text-[#8B1E3F] shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Live Camera
              </button>
            </div>
          </div>

          <input
            ref={faceInputRef}
            type="file"
            accept="image/jpeg,image/png,image/jpg"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) handleLiveFaceFile(file);
            }}
          />

          {/* Camera View Mode */}
          {photoMethod === 'camera' && isCameraActive && (
            <div className="relative rounded-2xl overflow-hidden border-2 border-[#8B1E3F] bg-stone-950 p-2 text-center space-y-3">
              <div className="relative max-w-sm mx-auto aspect-[4/3] rounded-xl overflow-hidden bg-black">
                <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover scale-x-[-1]" />
                <div className="absolute inset-0 border-2 border-white/30 rounded-xl pointer-events-none" />
              </div>
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="px-5 py-2 bg-[#8B1E3F] hover:bg-[#721833] text-white text-xs font-bold rounded-xl shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Camera className="h-4 w-4" /> Capture Selfie
                </button>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="px-3 py-2 bg-white/20 hover:bg-white/30 text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {cameraError && photoMethod === 'camera' && (
            <p className="text-xs text-rose-600 font-medium">{cameraError}</p>
          )}

          {/* Face Photo Dropzone or Preview */}
          {!liveFaceFile ? (
            photoMethod === 'upload' && (
              <div
                onDragOver={e => {
                  e.preventDefault();
                  setIsFaceDragging(true);
                }}
                onDragLeave={e => {
                  e.preventDefault();
                  setIsFaceDragging(false);
                }}
                onDrop={e => {
                  e.preventDefault();
                  setIsFaceDragging(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleLiveFaceFile(file);
                }}
                onClick={() => faceInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
                  isFaceDragging
                    ? 'border-[#8B1E3F] bg-rose-50/70 scale-[0.99]'
                    : 'border-stone-300 hover:border-[#8B1E3F]/70 bg-stone-50/40 hover:bg-rose-50/20'
                }`}
              >
                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="h-10 w-10 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-[#8B1E3F]">
                    <ImageIcon className="h-5 w-5 text-[#8B1E3F]" />
                  </div>
                  <p className="text-xs font-bold text-stone-800">
                    Upload a clear face photo or selfie
                  </p>
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      faceInputRef.current?.click();
                    }}
                    className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-[#8B1E3F] hover:bg-[#721833] shadow-xs cursor-pointer"
                  >
                    Select Photo
                  </button>
                  <p className="text-[10px] text-stone-400 font-normal">
                    JPG or PNG • Max 5 MB
                  </p>
                </div>
              </div>
            )
          ) : (
            /* Selected Face Photo Preview */
            <div className="flex items-center justify-between p-4 bg-[#FFF5F7] border border-rose-200/90 rounded-2xl">
              <div className="flex items-center gap-3.5 min-w-0 pr-2">
                {facePreview && (
                  <div className="h-12 w-12 rounded-xl overflow-hidden border border-rose-200 shrink-0 shadow-2xs">
                    <img src={facePreview} alt="Selfie" className="h-full w-full object-cover" />
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold text-stone-900 truncate max-w-[220px] sm:max-w-xs">
                      {liveFaceFile.name}
                    </p>
                    <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full shrink-0">
                      <Check className="h-3 w-3 mr-0.5" /> Ready
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 font-medium">
                    {formatFileSize(liveFaceFile.size)} • Verification Selfie
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => faceInputRef.current?.click()}
                  className="text-xs font-semibold text-[#8B1E3F] hover:underline px-2 py-1 cursor-pointer"
                >
                  Change
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLiveFaceFile(null);
                    setFacePreview(null);
                  }}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors cursor-pointer"
                  title="Remove selfie"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {errors.live_face_file && (
            <p className="text-xs text-rose-600 font-medium mt-1.5">{errors.live_face_file}</p>
          )}
        </div>

        {/* 4. Encryption Security Pill Note */}
        <div className="flex items-center justify-center gap-2 p-3 bg-[#FFF5F7] border border-rose-100/80 rounded-xl text-xs text-stone-600 font-medium text-center">
          <Lock className="h-4 w-4 text-[#8B1E3F] shrink-0" />
          <span>Your documents are encrypted and will be used only for verification purposes.</span>
        </div>

      </div>

      {/* 5. Bottom Action Button: Proceed to Next */}
      <div className="flex justify-center pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-[#8B1E3F] hover:bg-[#721833] text-white px-12 py-3.5 rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all inline-flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" /> Submitting...
            </>
          ) : (
            <>
              Proceed to Next <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>

    </form>
  );
};
