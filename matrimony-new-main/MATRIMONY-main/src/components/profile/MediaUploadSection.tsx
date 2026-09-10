import React, { useState, useRef } from 'react';
import {
  Camera,
  Video,
  Check,
  Trash2,
  Play,
  Loader2,
  Image as ImageIcon,
  Plus
} from 'lucide-react';
import {
  useUploadProfilePhoto,
  useUploadProfileVideo,
  useUpdateProfileVideo,
  useDeleteProfileVideo,
  useLinkProfileVideo,
  useProfileGallery,
  useUploadGalleryImage,
  useDeleteGalleryImage,
} from '../../hooks/useProfile';
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
  const { showToast, updateCurrentUserAvatar } = useApp();
  const [photoInputMode, setPhotoInputMode] = useState<'url' | 'file' | 'camera'>('file');
  const [videoInputMode, setVideoInputMode] = useState<'url' | 'file'>('file');
  const [showVideoPreview, setShowVideoPreview] = useState(false);
  const [externalVideoLink, setExternalVideoLink] = useState('');
  const [isLinkingVideo, setIsLinkingVideo] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoFileInputRef = useRef<HTMLInputElement | null>(null);

  // Gallery State
  const [galleryCaption, setGalleryCaption] = useState('');
  const [deletingGalleryId, setDeletingGalleryId] = useState<number | null>(null);

  // TanStack Query Mutations & Queries
  const uploadPhotoMutation = useUploadProfilePhoto();
  const uploadVideoMutation = useUploadProfileVideo();
  const updateVideoMutation = useUpdateProfileVideo();
  const deleteVideoMutation = useDeleteProfileVideo();
  const linkVideoMutation = useLinkProfileVideo();

  const { data: galleryImages = [] } = useProfileGallery();
  const uploadGalleryMutation = useUploadGalleryImage();
  const deleteGalleryMutation = useDeleteGalleryImage();

  const isPhotoUploading = uploadPhotoMutation.isPending;
  const isVideoUploading = uploadVideoMutation.isPending || updateVideoMutation.isPending;
  const isVideoDeleting = deleteVideoMutation.isPending;
  const isGalleryUploading = uploadGalleryMutation.isPending;

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
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 480, height: 360 }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch {
      setCameraError('Unable to access camera. Please allow camera permissions.');
    }
  };

  // Stop Camera Stream
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  // Snap Photo from Video Stream & upload to API
  const snapPhoto = async () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 480;
      canvas.height = video.videoHeight || 360;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        stopCamera();
        setPhotoInputMode('file');

        canvas.toBlob(async (blob) => {
          if (blob) {
            try {
              const res = await uploadPhotoMutation.mutateAsync(blob);
              const newUrl = res.photo_url || canvas.toDataURL('image/jpeg');
              onPhotoChange(newUrl);
              updateCurrentUserAvatar(newUrl);
              showToast('Profile photo updated successfully!');
            } catch {
              const fallbackUrl = canvas.toDataURL('image/jpeg');
              onPhotoChange(fallbackUrl);
              updateCurrentUserAvatar(fallbackUrl);
              showToast('Photo captured.');
            }
          }
        }, 'image/jpeg', 0.9);
      }
    }
  };

  // File Upload Handler for Photo
  const handlePhotoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      showToast('Profile photo size must be less than 10MB.');
      return;
    }

    try {
      const res = await uploadPhotoMutation.mutateAsync(file);
      const newUrl = res.photo_url;
      if (newUrl) {
        onPhotoChange(newUrl);
        updateCurrentUserAvatar(newUrl);
        showToast('Profile photo uploaded successfully!');
      } else {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            onPhotoChange(reader.result);
            updateCurrentUserAvatar(reader.result);
          }
        };
        reader.readAsDataURL(file);
        showToast('Profile photo updated.');
      }
    } catch {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          onPhotoChange(reader.result);
          updateCurrentUserAvatar(reader.result);
        }
      };
      reader.readAsDataURL(file);
      showToast('Photo attached.');
    }
  };

  // Gallery File Upload Handler
  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      showToast('Gallery image size must be less than 10MB.');
      return;
    }

    try {
      await uploadGalleryMutation.mutateAsync({ file, caption: galleryCaption.trim() });
      setGalleryCaption('');
      showToast('Gallery image added!');
      e.target.value = '';
    } catch (err: any) {
      showToast(err?.message || 'Failed to upload gallery image.');
    }
  };

  // Gallery Image Delete Handler
  const handleDeleteGalleryItem = async (imageId: number) => {
    try {
      setDeletingGalleryId(imageId);
      await deleteGalleryMutation.mutateAsync(imageId);
      showToast('Gallery image removed.');
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete gallery image.');
    } finally {
      setDeletingGalleryId(null);
    }
  };

  // File Upload Handler for Video
  const handleVideoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      showToast('Video file size must be less than 50MB.');
      return;
    }

    try {
      let res;
      if (videoUrl) {
        res = await updateVideoMutation.mutateAsync(file);
      } else {
        res = await uploadVideoMutation.mutateAsync(file);
      }

      if (res?.video_url) {
        onVideoChange(res.video_url);
        showToast('Video uploaded successfully!');
      } else {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            onVideoChange(reader.result);
          }
        };
        reader.readAsDataURL(file);
        showToast('Video selected.');
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to upload video.');
    }
  };

  // Link Video
  const handleLinkVideoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!externalVideoLink.trim()) return;

    try {
      setIsLinkingVideo(true);
      const res = await linkVideoMutation.mutateAsync({
        videoUrl: externalVideoLink.trim(),
        videoType: externalVideoLink.includes('youtube.com') || externalVideoLink.includes('youtu.be') ? 'YOUTUBE' : 'EXTERNAL'
      });
      onVideoChange(res.video_url || externalVideoLink.trim());
      setExternalVideoLink('');
      showToast('Video linked successfully!');
    } catch {
      onVideoChange(externalVideoLink.trim());
      showToast('Video URL saved.');
    } finally {
      setIsLinkingVideo(false);
    }
  };

  // Handle Video Deletion
  const handleDeleteVideo = async () => {
    try {
      await deleteVideoMutation.mutateAsync();
      onVideoChange('');
      setShowVideoPreview(false);
      showToast('Video removed successfully.');
    } catch {
      onVideoChange('');
      setShowVideoPreview(false);
      showToast('Video removed.');
    }
  };

  return (
    <div className="space-y-4">
      {/* 2-COLUMN COMPACT MEDIA ROW: PHOTO & VIDEO */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* 📸 COMPACT PROFILE PHOTO CARD */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-2xs space-y-3">
          <div className="flex items-center gap-4">
            {/* Avatar Thumbnail */}
            <div className="relative shrink-0">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt="Profile"
                  className="h-16 w-16 rounded-full object-cover ring-2 ring-primary/25"
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground border border-border">
                  <Camera className="h-6 w-6" />
                </div>
              )}
              {isPhotoUploading && (
                <div className="absolute inset-0 bg-background/80 rounded-full flex items-center justify-center">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                </div>
              )}
            </div>

            {/* Photo Info & Action Buttons */}
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Camera className="h-3.5 w-3.5 text-primary" /> Profile Photo
                </span>
                {photoUrl && (
                  <button
                    type="button"
                    onClick={() => onPhotoChange('')}
                    className="text-[11px] text-destructive hover:underline cursor-pointer"
                  >
                    Remove
                  </button>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground truncate">
                Clear portrait photo (JPG, PNG)
              </p>

              <div className="flex items-center gap-2 pt-0.5">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handlePhotoFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isPhotoUploading}
                  className="px-2.5 py-1 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
                >
                  Upload
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (photoInputMode === 'camera') {
                      stopCamera();
                      setPhotoInputMode('file');
                    } else {
                      startPhotoCamera();
                    }
                  }}
                  className="px-2.5 py-1 text-xs font-medium rounded-md border border-input bg-background hover:bg-muted text-foreground transition-colors cursor-pointer"
                >
                  Camera
                </button>
                <button
                  type="button"
                  onClick={() => setPhotoInputMode(photoInputMode === 'url' ? 'file' : 'url')}
                  className="px-2.5 py-1 text-xs font-medium rounded-md border border-input bg-background hover:bg-muted text-foreground transition-colors cursor-pointer"
                >
                  URL
                </button>
              </div>
            </div>
          </div>

          {/* Inline URL Input */}
          {photoInputMode === 'url' && (
            <div className="pt-2 border-t border-border flex gap-2">
              <input
                type="text"
                value={photoUrl}
                onChange={e => onPhotoChange(e.target.value)}
                className="flex-1 text-xs bg-background border border-input rounded-md px-3 py-1.5 text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
              <button
                type="button"
                onClick={() => setPhotoInputMode('file')}
                className="px-2.5 py-1 text-xs rounded-md bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Done
              </button>
            </div>
          )}

          {/* Inline Live Camera Stream */}
          {photoInputMode === 'camera' && (
            <div className="pt-2 border-t border-border space-y-2">
              {cameraError ? (
                <p className="text-xs text-destructive">{cameraError}</p>
              ) : (
                <div className="relative rounded-lg overflow-hidden bg-black max-w-[260px] mx-auto">
                  <video ref={videoRef} autoPlay playsInline className="w-full h-36 object-cover" />
                  <canvas ref={canvasRef} className="hidden" />
                  <div className="absolute bottom-2 inset-x-0 flex justify-center gap-2">
                    <button
                      type="button"
                      onClick={snapPhoto}
                      disabled={isPhotoUploading}
                      className="px-3 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-md shadow-xs cursor-pointer"
                    >
                      Snap Photo
                    </button>
                    <button
                      type="button"
                      onClick={() => { stopCamera(); setPhotoInputMode('file'); }}
                      className="px-3 py-1 bg-black/70 text-white text-xs rounded-md cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 📹 COMPACT VIDEO CARD */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-2xs space-y-3">
          <div className="flex items-center gap-4">
            {/* Video Status Icon */}
            <div className="relative shrink-0">
              {videoUrl ? (
                <div className="h-16 w-16 rounded-xl bg-muted border border-border flex items-center justify-center text-primary relative overflow-hidden">
                  <Play className="h-6 w-6" />
                </div>
              ) : (
                <div className="h-16 w-16 rounded-xl bg-muted flex items-center justify-center text-muted-foreground border border-border">
                  <Video className="h-6 w-6" />
                </div>
              )}
              {isVideoUploading && (
                <div className="absolute inset-0 bg-background/80 rounded-xl flex items-center justify-center">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                </div>
              )}
            </div>

            {/* Video Content & Action Buttons */}
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Video className="h-3.5 w-3.5 text-primary" /> Video Intro <span className="text-[10px] text-muted-foreground font-normal">(Optional)</span>
                </span>
                {videoUrl && (
                  <button
                    type="button"
                    onClick={handleDeleteVideo}
                    disabled={isVideoDeleting}
                    className="text-[11px] text-destructive hover:underline cursor-pointer"
                  >
                    Delete
                  </button>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground truncate">
                {videoUrl ? 'Video introduction attached' : 'Short clip (max 50MB) or link'}
              </p>

              <div className="flex items-center gap-2 pt-0.5">
                <input
                  type="file"
                  ref={videoFileInputRef}
                  accept="video/mp4,video/webm,video/quicktime,video/*"
                  onChange={handleVideoFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => videoFileInputRef.current?.click()}
                  disabled={isVideoUploading}
                  className="px-2.5 py-1 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
                >
                  Upload
                </button>
                <button
                  type="button"
                  onClick={() => setVideoInputMode(videoInputMode === 'url' ? 'file' : 'url')}
                  className="px-2.5 py-1 text-xs font-medium rounded-md border border-input bg-background hover:bg-muted text-foreground transition-colors cursor-pointer"
                >
                  Link URL
                </button>
                {videoUrl && (
                  <button
                    type="button"
                    onClick={() => setShowVideoPreview(!showVideoPreview)}
                    className="px-2.5 py-1 text-xs font-medium rounded-md border border-input bg-background hover:bg-muted text-foreground transition-colors cursor-pointer"
                  >
                    {showVideoPreview ? 'Hide' : 'Preview'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Inline Video URL Input */}
          {videoInputMode === 'url' && !videoUrl && (
            <form onSubmit={handleLinkVideoSubmit} className="pt-2 border-t border-border flex gap-2">
              <input
                type="text"
                value={externalVideoLink}
                onChange={e => setExternalVideoLink(e.target.value)}
                className="flex-1 text-xs bg-background border border-input rounded-md px-3 py-1.5 text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
              <button
                type="submit"
                disabled={!externalVideoLink.trim() || isLinkingVideo}
                className="px-2.5 py-1 text-xs rounded-md bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
              >
                Link
              </button>
            </form>
          )}

          {/* Inline Video Player Preview */}
          {videoUrl && showVideoPreview && (
            <div className="pt-2 border-t border-border">
              <div className="rounded-lg overflow-hidden bg-black">
                {videoUrl.startsWith('data:video') || videoUrl.includes('.mp4') || videoUrl.includes('.webm') || videoUrl.includes('.mov') || videoUrl.startsWith('blob:') ? (
                  <video src={videoUrl} controls controlsList="nodownload" className="w-full h-36 object-cover" />
                ) : (
                  <iframe
                    src={videoUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                    title="Profile Video"
                    className="w-full h-36"
                    allowFullScreen
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 🖼️ COMPACT OPTIONAL GALLERY STRIP */}
      <div className="rounded-xl border border-border bg-card p-3 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold text-foreground">Profile Gallery</span>
            <span className="text-[11px] text-muted-foreground">
              ({galleryImages.length} {galleryImages.length === 1 ? 'photo' : 'photos'} added)
            </span>
          </div>

          <label className={`px-2.5 py-1 text-xs font-medium rounded-md bg-muted hover:bg-muted/80 text-foreground cursor-pointer flex items-center gap-1 transition-colors ${isGalleryUploading ? 'opacity-50 pointer-events-none' : ''}`}>
            {isGalleryUploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
            <span>Add Photo</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleGalleryUpload}
              disabled={isGalleryUploading}
              className="hidden"
            />
          </label>
        </div>

        {galleryImages.length > 0 && (
          <div className="flex items-center gap-2 pt-2.5 overflow-x-auto">
            {galleryImages.map((img) => (
              <div key={img.id} className="relative group shrink-0 h-14 w-14 rounded-lg overflow-hidden border border-border">
                <img src={img.image} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => handleDeleteGalleryItem(img.id)}
                  disabled={deletingGalleryId === img.id}
                  title="Remove image"
                  className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer"
                >
                  {deletingGalleryId === img.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5 text-rose-300" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
