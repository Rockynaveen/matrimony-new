import React, { useState, useRef } from 'react';
import { Camera, Upload, Video, Link as LinkIcon, Check, Trash2, Play, Loader2, RefreshCw, AlertTriangle } from 'lucide-react';
import { useUploadProfileVideo, useUpdateProfileVideo, useDeleteProfileVideo } from '../../hooks/useProfile';
import { useApp } from '../../context/AppContext';

interface MediaUploadSectionProps {
  photoUrl: string;
  onPhotoChange: (url: string) => void;
  videoUrl: string;
  onVideoChange: (url: string) => void;
}

export const MediaUploadSection: React.FC<MediaUploadSectionProps> = ({
  photoUrl,
  onPhotoChange,
  videoUrl,
  onVideoChange,
}) => {
  const { showToast } = useApp();
  const [photoInputMode, setPhotoInputMode] = useState<'url' | 'file' | 'camera'>('url');
  const [videoInputMode, setVideoInputMode] = useState<'url' | 'file'>('file');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // TanStack Query Mutations
  const uploadVideoMutation = useUploadProfileVideo();
  const updateVideoMutation = useUpdateProfileVideo();
  const deleteVideoMutation = useDeleteProfileVideo();

  const isVideoUploading = uploadVideoMutation.isPending || updateVideoMutation.isPending;
  const isVideoDeleting = deleteVideoMutation.isPending;

  // Camera Stream States
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Start Live Camera for Photo Snap
  const startPhotoCamera = async () => {
    try {
      setCameraError(null);
      setPhotoInputMode('camera');
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err: any) {
      setCameraError('Unable to access camera. Please allow camera permissions or upload an image file.');
    }
  };

  // Stop Camera Stream
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  // Snap Photo from Video Stream
  const snapPhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        onPhotoChange(dataUrl);
        stopCamera();
        setPhotoInputMode('url');
      }
    }
  };

  // File Upload Handler for Photo
  const handlePhotoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          onPhotoChange(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // File Upload Handler for Video (POST /api/upload/profile/video or PUT /api/update/profile/video)
  const handleVideoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      showToast('Video file size must be less than 50MB.');
      return;
    }

    try {
      let res;
      if (videoUrl) {
        // Replacing existing video
        res = await updateVideoMutation.mutateAsync(file);
      } else {
        // New upload
        res = await uploadVideoMutation.mutateAsync(file);
      }

      if (res?.video_url) {
        onVideoChange(res.video_url);
        showToast(res.message || 'Profile video uploaded successfully! 🎥');
      } else {
        // Local preview fallback
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            onVideoChange(reader.result);
          }
        };
        reader.readAsDataURL(file);
        showToast('Profile video selected! Click Save to apply.');
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to upload profile video. Please try again.');
    }
  };

  // Handle Video Deletion
  const handleDeleteVideo = async () => {
    try {
      await deleteVideoMutation.mutateAsync();
      onVideoChange('');
      setShowDeleteConfirm(false);
      showToast('Profile video removed successfully! 🗑️');
    } catch (err: any) {
      onVideoChange('');
      setShowDeleteConfirm(false);
      showToast(err?.message || 'Profile video removed.');
    }
  };

  return (
    <div className="space-y-8 p-6 bg-gradient-to-br from-stone-50 to-white border border-stone-200 rounded-3xl shadow-sm">
      
      {/* 📸 SECTION 1: PROFILE PHOTO UPLOAD / CAMERA */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-stone-200 pb-2">
          <label className="text-sm font-extrabold text-[#8B1E3F] flex items-center gap-2">
            <Camera className="h-4 w-4 text-[#8B1E3F]" /> Profile Photo Upload & Live Camera Access
          </label>

          <div className="flex items-center gap-1.5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => { stopCamera(); setPhotoInputMode('url'); }}
              className={`px-3 py-1 rounded-lg transition-all ${photoInputMode === 'url' ? 'bg-[#8B1E3F] text-white font-bold' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'}`}
            >
              <LinkIcon className="h-3.5 w-3.5 inline mr-1" /> Image URL
            </button>
            <button
              type="button"
              onClick={() => { stopCamera(); setPhotoInputMode('file'); }}
              className={`px-3 py-1 rounded-lg transition-all ${photoInputMode === 'file' ? 'bg-[#8B1E3F] text-white font-bold' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'}`}
            >
              <Upload className="h-3.5 w-3.5 inline mr-1" /> Upload File
            </button>
            <button
              type="button"
              onClick={startPhotoCamera}
              className={`px-3 py-1 rounded-lg transition-all ${photoInputMode === 'camera' ? 'bg-[#8B1E3F] text-white font-bold' : 'bg-amber-600 text-white hover:bg-amber-700 font-bold'}`}
            >
              <Camera className="h-3.5 w-3.5 inline mr-1" /> Live Camera 📷
            </button>
          </div>
        </div>

        {/* Option A: Image URL Input */}
        {photoInputMode === 'url' && (
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Paste image URL (e.g. https://images.unsplash.com/... or cloud link)"
              value={photoUrl}
              onChange={e => onPhotoChange(e.target.value)}
              className="w-full bg-white border border-stone-300 rounded-xl p-3 text-xs font-semibold text-stone-900 focus:ring-2 focus:ring-[#8B1E3F]/40"
            />
          </div>
        )}

        {/* Option B: Local File Input */}
        {photoInputMode === 'file' && (
          <div className="p-4 bg-stone-100/70 border-2 border-dashed border-stone-300 rounded-2xl text-center space-y-2">
            <Upload className="h-6 w-6 text-stone-400 mx-auto" />
            <p className="text-xs font-extrabold text-stone-900">Choose a high quality profile photo from your device</p>
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoFileUpload}
              className="text-xs text-stone-900 font-medium file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#8B1E3F] file:text-white hover:file:bg-[#721733] cursor-pointer"
            />
          </div>
        )}

        {/* Option C: Live Camera Stream View */}
        {photoInputMode === 'camera' && (
          <div className="p-4 bg-stone-950 rounded-2xl text-center space-y-4 relative overflow-hidden border-2 border-amber-400">
            {cameraError ? (
              <p className="text-xs text-rose-400 font-semibold p-4">{cameraError}</p>
            ) : (
              <div className="relative max-w-sm mx-auto overflow-hidden rounded-xl bg-black">
                <video ref={videoRef} autoPlay playsInline className="w-full h-56 object-cover rounded-xl" />
                <canvas ref={canvasRef} className="hidden" />

                <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={snapPhoto}
                    className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-950 font-extrabold text-xs rounded-full shadow-lg flex items-center gap-1.5 cursor-pointer"
                  >
                    <Camera className="h-4 w-4" /> Snap Photo 📸
                  </button>
                  <button
                    type="button"
                    onClick={() => { stopCamera(); setPhotoInputMode('url'); }}
                    className="px-3 py-2 bg-black/60 hover:bg-black/80 text-white font-bold text-xs rounded-full cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Photo Preview Thumbnail */}
        {photoUrl && (
          <div className="flex items-center gap-4 p-3 bg-stone-50 border border-stone-200 rounded-2xl">
            <img src={photoUrl} alt="Profile Preview" className="h-16 w-16 rounded-xl object-cover ring-2 ring-[#8B1E3F]" />
            <div className="text-xs space-y-1">
              <span className="font-bold text-stone-900 block">Current Selected Profile Photo</span>
              <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                <Check className="h-3.5 w-3.5 text-emerald-600" /> Photo attached & ready to save
              </span>
              <button
                type="button"
                onClick={() => onPhotoChange('')}
                className="text-[11px] font-bold text-rose-600 hover:underline block cursor-pointer"
              >
                Remove Photo
              </button>
            </div>
          </div>
        )}
      </div>


      {/* 📹 SECTION 2: VIDEO INTRODUCTION UPLOAD / PREVIEW */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-stone-200 pb-2">
          <label className="text-sm font-extrabold text-[#8B1E3F] flex items-center gap-2">
            <Video className="h-4 w-4 text-[#8B1E3F]" /> Profile Video Introduction
          </label>

          <div className="flex items-center gap-1.5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setVideoInputMode('file')}
              className={`px-3 py-1 rounded-lg transition-all ${videoInputMode === 'file' ? 'bg-[#8B1E3F] text-white font-bold' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'}`}
            >
              <Upload className="h-3.5 w-3.5 inline mr-1" /> Video File
            </button>
            <button
              type="button"
              onClick={() => setVideoInputMode('url')}
              className={`px-3 py-1 rounded-lg transition-all ${videoInputMode === 'url' ? 'bg-[#8B1E3F] text-white font-bold' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'}`}
            >
              <LinkIcon className="h-3.5 w-3.5 inline mr-1" /> Video URL
            </button>
          </div>
        </div>

        {/* Video Upload Info Banner */}
        <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900 font-medium">
          <Video className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-amber-950">Add a short 30-60 second introduction video</p>
            <p className="text-[11px] text-amber-800">Supported Formats: MP4, WebM, MOV (Max size: 50MB). Railway APIs: <code className="bg-amber-100 px-1 py-0.2 rounded text-[10px]">POST /api/upload/profile/video</code>, <code className="bg-amber-100 px-1 py-0.2 rounded text-[10px]">PUT /api/update/profile/video</code>, <code className="bg-amber-100 px-1 py-0.2 rounded text-[10px]">DELETE /api/delete/profile/video</code></p>
          </div>
        </div>

        {/* State A: Upload Video File */}
        {videoInputMode === 'file' && !videoUrl && (
          <div className="p-6 bg-stone-100/70 border-2 border-dashed border-stone-300 rounded-2xl text-center space-y-3 relative">
            {isVideoUploading ? (
              <div className="py-6 flex flex-col items-center justify-center space-y-3">
                <Loader2 className="h-8 w-8 text-[#8B1E3F] animate-spin" />
                <p className="text-xs font-extrabold text-[#8B1E3F]">Uploading video to Railway backend...</p>
                <p className="text-[11px] text-stone-500">Please wait while the file is processed.</p>
              </div>
            ) : (
              <>
                <div className="h-12 w-12 rounded-full bg-[#8B1E3F]/10 text-[#8B1E3F] flex items-center justify-center mx-auto">
                  <Video className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-extrabold text-stone-900">Upload Video Introduction File</p>
                  <p className="text-[11px] text-stone-500 mt-0.5">Drag & drop or select an MP4, WebM, or MOV video file</p>
                </div>
                <input
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime,video/*"
                  onChange={handleVideoFileUpload}
                  disabled={isVideoUploading}
                  className="text-xs text-stone-600 file:mr-3 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#8B1E3F] file:text-white hover:file:bg-[#721733] cursor-pointer disabled:opacity-50"
                />
              </>
            )}
          </div>
        )}

        {/* State B: Video URL Input */}
        {videoInputMode === 'url' && !videoUrl && (
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Paste direct video URL (e.g. https://.../video.mp4 or Cloudinary link)"
              value={videoUrl}
              onChange={e => onVideoChange(e.target.value)}
              className="w-full bg-white border border-stone-300 rounded-xl p-3 text-xs font-semibold text-stone-900 focus:ring-2 focus:ring-[#8B1E3F]/40"
            />
          </div>
        )}

        {/* State C: Video Exists — Player & Controls */}
        {videoUrl && (
          <div className="p-4 bg-stone-900 border border-stone-800 rounded-3xl space-y-3 text-white">
            <div className="flex items-center justify-between text-xs font-bold pb-1 border-b border-stone-800">
              <span className="flex items-center gap-1.5 text-amber-400">
                <Play className="h-4 w-4" /> Active Video Introduction
              </span>

              <div className="flex items-center gap-2">
                {/* Replace/Update Button */}
                <label className={`px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer border border-white/20 transition-all ${isVideoUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                  {isVideoUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5 text-amber-300" />}
                  Replace Video
                  <input
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime,video/*"
                    onChange={handleVideoFileUpload}
                    className="hidden"
                  />
                </label>

                {/* Delete Button */}
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isVideoDeleting}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/40 text-rose-200 border border-rose-400/30 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
                >
                  {isVideoDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5 text-rose-300" />}
                  Delete
                </button>
              </div>
            </div>

            {/* Video Player */}
            {videoUrl.startsWith('data:video') || videoUrl.includes('.mp4') || videoUrl.includes('.webm') || videoUrl.includes('.mov') || videoUrl.startsWith('blob:') || videoUrl.startsWith('http') ? (
              <video src={videoUrl} controls controlsList="nodownload" className="w-full h-56 object-cover rounded-2xl bg-black border border-stone-800 shadow-inner" />
            ) : (
              <div className="p-3 bg-stone-800 rounded-2xl text-xs font-mono text-amber-200 truncate">
                Video Link: <a href={videoUrl} target="_blank" rel="noreferrer" className="text-amber-400 underline">{videoUrl}</a>
              </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
              <div className="p-4 bg-rose-950/90 border border-rose-700/60 rounded-2xl space-y-3 animate-in fade-in duration-200">
                <div className="flex items-center gap-2 text-xs font-bold text-rose-200">
                  <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
                  <span>Are you sure you want to delete your profile video?</span>
                </div>
                <p className="text-[11px] text-rose-300">This action calls <code className="bg-black/40 px-1 py-0.5 rounded">DELETE /api/delete/profile/video</code> and removes the video permanently.</p>
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteVideo}
                    disabled={isVideoDeleting}
                    className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isVideoDeleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Confirm Delete 🗑️
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
};

