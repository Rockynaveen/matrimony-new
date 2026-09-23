import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
  useProfile,
  useProfileGallery,
  useUploadProfilePhoto,
  useUploadGalleryImage,
  useDeleteGalleryImage,
  useUpdateProfile,
  useProfileVideo,
  useUploadProfileVideo,
  useDeleteProfileVideo,
} from '../../hooks/useProfile';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { isDummyImage, formatPhotoUrl } from '../../components/ui/MatchAvatar';
import {
  Upload,
  Trash2,
  Star,
  Video,
  Camera,
  Plus,
  ShieldCheck,
  ArrowLeft,
  Loader2,
  Sparkles,
  Play,
  Eye,
  X
} from 'lucide-react';

export const PhotosPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast, currentUser, updateCurrentUserAvatar } = useApp();

  // Profile and Media Data Hooks
  const { data: profileData, isLoading: isProfileLoading, refetch: refetchProfile } = useProfile();
  const { data: galleryImages = [], isLoading: isGalleryLoading, refetch: refetchGallery } = useProfileGallery();
  const { data: videoData, isLoading: isVideoLoading, refetch: refetchVideo } = useProfileVideo();

  // Mutations
  const uploadPhotoMutation = useUploadProfilePhoto();
  const uploadGalleryMutation = useUploadGalleryImage();
  const deleteGalleryMutation = useDeleteGalleryImage();
  const updateProfileMutation = useUpdateProfile();
  const uploadVideoMutation = useUploadProfileVideo();
  const deleteVideoMutation = useDeleteProfileVideo();

  // Local state
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const [isSettingPrimary, setIsSettingPrimary] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);

  // Hidden File Input Refs
  const primaryFileInputRef = useRef<HTMLInputElement | null>(null);
  const galleryFileInputRef = useRef<HTMLInputElement | null>(null);
  const videoFileInputRef = useRef<HTMLInputElement | null>(null);

  // Resolve Authentic Primary Photo (never dummy images)
  const rawAvatar = profileData?.profile_photo || currentUser?.avatar || localStorage.getItem('logged_in_avatar') || '';
  const primaryPhoto = isDummyImage(rawAvatar) ? '' : formatPhotoUrl(rawAvatar);

  // Filter authentic gallery images
  const authenticGallery = galleryImages.filter(g => g?.image && !isDummyImage(g.image));

  // Resolved Video URL
  const videoUrl = videoData?.video_url || (profileData as any)?.video_url || '';

  // Handle Primary Photo Upload
  const handlePrimaryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      showToast('Profile photo must be less than 10MB.');
      return;
    }

    try {
      const res = await uploadPhotoMutation.mutateAsync(file);
      const newUrl = res.photo_url;
      if (newUrl) {
        updateCurrentUserAvatar(newUrl);
        await refetchProfile();
        showToast('Profile picture uploaded successfully!');
      } else {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            updateCurrentUserAvatar(reader.result);
          }
        };
        reader.readAsDataURL(file);
        showToast('Profile picture updated!');
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to upload photo. Please try again.');
    } finally {
      if (primaryFileInputRef.current) primaryFileInputRef.current.value = '';
    }
  };

  // Handle Gallery Photo Upload
  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      showToast('Gallery image must be less than 10MB.');
      return;
    }

    try {
      await uploadGalleryMutation.mutateAsync({ file });
      await refetchGallery();
      showToast('New photo added to your gallery!');
    } catch (err: any) {
      showToast(err?.message || 'Failed to upload gallery photo.');
    } finally {
      if (galleryFileInputRef.current) galleryFileInputRef.current.value = '';
    }
  };

  // Handle Deleting Gallery Image
  const handleDeleteGallery = async (id: number) => {
    try {
      await deleteGalleryMutation.mutateAsync(id);
      await refetchGallery();
      showToast('Photo removed from gallery.');
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete photo.');
    }
  };

  // Set Gallery Photo as Primary Photo
  const handleSetGalleryAsPrimary = async (imageUrl: string) => {
    try {
      setIsSettingPrimary(true);
      await updateProfileMutation.mutateAsync({
        profile_photo: imageUrl
      });
      updateCurrentUserAvatar(imageUrl);
      await refetchProfile();
      showToast('Set as primary profile photo!');
    } catch (err: any) {
      showToast(err?.message || 'Failed to update primary photo.');
    } finally {
      setIsSettingPrimary(false);
    }
  };

  // Handle Video Upload
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      showToast('Video size must be under 50MB.');
      return;
    }

    try {
      await uploadVideoMutation.mutateAsync(file);
      await refetchVideo();
      await refetchProfile();
      showToast('Video introduction uploaded successfully!');
    } catch (err: any) {
      showToast(err?.message || 'Failed to upload video.');
    } finally {
      if (videoFileInputRef.current) videoFileInputRef.current.value = '';
    }
  };

  // Handle Video Delete
  const handleDeleteVideo = async () => {
    try {
      await deleteVideoMutation.mutateAsync();
      await refetchVideo();
      await refetchProfile();
      showToast('Video introduction removed.');
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete video.');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F5] py-8 pb-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => navigate('/my-profile')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8B1E3F] hover:underline mb-1 cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to My Profile
            </button>
            <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
              Photos & Media Gallery
            </h1>
            <p className="text-xs sm:text-sm text-stone-600">
              Manage your profile picture, authentic gallery photos, and video introduction.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={galleryFileInputRef}
              accept="image/*"
              onChange={handleGalleryUpload}
              className="hidden"
            />
            <Button
              variant="primary"
              onClick={() => galleryFileInputRef.current?.click()}
              disabled={uploadGalleryMutation.isPending}
              className="bg-[#8B1E3F] hover:bg-[#721733] text-white text-xs font-bold shadow-md cursor-pointer"
            >
              {uploadGalleryMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              Add Gallery Photo
            </Button>
          </div>
        </div>

        {/* Quality & Trust Banner */}
        <div className="bg-gradient-to-r from-[#8B1E3F]/10 via-[#FDF2F4] to-[#FCE7F0] border border-[#8B1E3F]/20 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white text-[#8B1E3F] shadow-2xs shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold text-stone-900">100% Privacy Protected & Watermark Secured</p>
              <p className="text-stone-600 mt-0.5">
                Profiles with genuine photos receive up to <strong>5x more responses</strong> and matching compatibility scores.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-[#8B1E3F] bg-white px-3 py-1 rounded-full border border-[#8B1E3F]/20 shrink-0">
            JPG, PNG up to 10MB
          </span>
        </div>

        {/* ── 1. PRIMARY PROFILE PICTURE ── */}
        <Card className="bg-white rounded-2xl border border-stone-200/90 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div>
              <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                Primary Profile Photo
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                This is the main photo seen by matches across Search, Recommendations, and your public profile.
              </p>
            </div>

            <input
              type="file"
              ref={primaryFileInputRef}
              accept="image/*"
              onChange={handlePrimaryUpload}
              className="hidden"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6 pt-2">
            {/* Photo Preview Container */}
            <div className="relative shrink-0">
              {primaryPhoto ? (
                <div
                  onClick={() => setPreviewPhoto(primaryPhoto)}
                  className="relative h-40 w-40 sm:h-48 sm:w-48 rounded-2xl overflow-hidden border-2 border-[#D4AF37] shadow-md group cursor-pointer"
                >
                  <img
                    src={primaryPhoto}
                    alt="Primary Profile"
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1">
                    <Eye className="h-4 w-4" /> View Full
                  </div>
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-amber-400 text-amber-950 text-[10px] font-bold shadow-xs flex items-center gap-1">
                    <Star className="h-3 w-3 fill-current" /> Primary
                  </span>
                </div>
              ) : (
                <div className="h-40 w-40 sm:h-48 sm:w-48 rounded-2xl border-2 border-dashed border-stone-300 bg-stone-50 flex flex-col items-center justify-center text-stone-400 p-4 text-center">
                  <Camera className="h-10 w-10 text-stone-300 mb-2" />
                  <span className="text-xs font-semibold text-stone-600">No Photo Uploaded</span>
                  <span className="text-[10px] text-stone-400 mt-0.5">Upload a clear portrait</span>
                </div>
              )}

              {uploadPhotoMutation.isPending && (
                <div className="absolute inset-0 bg-white/80 rounded-2xl flex flex-col items-center justify-center text-xs font-bold text-[#8B1E3F]">
                  <Loader2 className="h-6 w-6 animate-spin mb-1 text-[#8B1E3F]" />
                  Uploading...
                </div>
              )}
            </div>

            {/* Action & Info */}
            <div className="space-y-3 flex-1 text-center sm:text-left">
              <div className="space-y-1">
                <h3 className="font-bold text-stone-800 text-sm">
                  {primaryPhoto ? 'Change Your Profile Photo' : 'Upload Your Primary Photo'}
                </h3>
                <p className="text-xs text-stone-500 leading-relaxed">
                  Make sure your face is clearly visible, well-lit, and centered. Photos with sunglasses, caps, or blurry filters may not pass verification.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => primaryFileInputRef.current?.click()}
                  disabled={uploadPhotoMutation.isPending}
                  className="bg-[#8B1E3F] hover:bg-[#721733] text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  <Upload className="h-3.5 w-3.5 mr-1.5" />
                  {primaryPhoto ? 'Upload New Photo' : 'Upload Photo'}
                </Button>

                {primaryPhoto && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPreviewPhoto(primaryPhoto)}
                    className="text-xs font-medium border-stone-200 text-stone-700 hover:bg-stone-50 cursor-pointer"
                  >
                    <Eye className="h-3.5 w-3.5 mr-1.5" /> Preview
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* ── 2. GALLERY PHOTOS ── */}
        <Card className="bg-white rounded-2xl border border-stone-200/90 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div>
              <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#8B1E3F]" />
                Additional Gallery Photos ({authenticGallery.length})
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Add lifestyle, family, or travel photos to give matches a genuine look into your life.
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => galleryFileInputRef.current?.click()}
              disabled={uploadGalleryMutation.isPending}
              className="text-xs font-bold text-[#8B1E3F] border-[#8B1E3F]/30 hover:bg-[#8B1E3F]/5 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Photo
            </Button>
          </div>

          {/* Gallery Grid */}
          {authenticGallery.length === 0 ? (
            <div className="p-8 text-center border-2 border-dashed border-stone-200 rounded-2xl bg-stone-50/50 space-y-3">
              <Camera className="h-10 w-10 text-stone-300 mx-auto" />
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-stone-800">No Gallery Photos Added Yet</h3>
                <p className="text-xs text-stone-500 max-w-sm mx-auto">
                  Add up to 5 additional photos to your profile gallery. They help potential partners know you better.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => galleryFileInputRef.current?.click()}
                disabled={uploadGalleryMutation.isPending}
                className="text-xs font-semibold border-stone-300 text-stone-700 hover:bg-white cursor-pointer"
              >
                <Upload className="h-3.5 w-3.5 mr-1.5" /> Upload First Gallery Photo
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pt-2">
              {authenticGallery.map((item) => {
                const formattedUrl = formatPhotoUrl(item.image);
                const isCurrentPrimary = formattedUrl === primaryPhoto;

                return (
                  <div
                    key={item.id}
                    className="relative group rounded-xl overflow-hidden border border-stone-200 bg-stone-50 shadow-2xs flex flex-col justify-between"
                  >
                    {/* Image Thumbnail */}
                    <div
                      onClick={() => setPreviewPhoto(formattedUrl)}
                      className="relative aspect-square w-full overflow-hidden cursor-pointer bg-stone-100"
                    >
                      <img
                        src={formattedUrl}
                        alt={item.caption || 'Gallery photo'}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1">
                        <Eye className="h-4 w-4" /> View
                      </div>
                      {isCurrentPrimary && (
                        <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-amber-400 text-amber-950 text-[9px] font-bold shadow-xs">
                          Primary
                        </span>
                      )}
                    </div>

                    {/* Card Actions Footer */}
                    <div className="p-2 bg-white border-t border-stone-100 flex items-center justify-between text-xs">
                      {!isCurrentPrimary ? (
                        <button
                          type="button"
                          onClick={() => handleSetGalleryAsPrimary(formattedUrl)}
                          disabled={isSettingPrimary}
                          className="text-[11px] font-bold text-[#8B1E3F] hover:underline cursor-pointer"
                        >
                          Set Primary
                        </button>
                      ) : (
                        <span className="text-[11px] font-bold text-emerald-700">Active</span>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDeleteGallery(item.id)}
                        disabled={deleteGalleryMutation.isPending}
                        title="Remove photo"
                        className="text-stone-400 hover:text-rose-600 transition-colors p-1 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Add More Tile */}
              <button
                type="button"
                onClick={() => galleryFileInputRef.current?.click()}
                disabled={uploadGalleryMutation.isPending}
                className="aspect-square rounded-xl border-2 border-dashed border-stone-200 hover:border-[#8B1E3F]/50 bg-stone-50 hover:bg-[#8B1E3F]/5 transition-colors flex flex-col items-center justify-center text-stone-500 hover:text-[#8B1E3F] cursor-pointer"
              >
                {uploadGalleryMutation.isPending ? (
                  <Loader2 className="h-6 w-6 animate-spin text-[#8B1E3F]" />
                ) : (
                  <>
                    <Plus className="h-6 w-6 mb-1" />
                    <span className="text-xs font-bold">Add Photo</span>
                  </>
                )}
              </button>
            </div>
          )}
        </Card>

        {/* ── 3. VIDEO INTRODUCTION (OPTIONAL) ── */}
        <Card className="bg-white rounded-2xl border border-stone-200/90 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div>
              <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <Video className="h-4 w-4 text-[#8B1E3F]" />
                Video Introduction (Optional)
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Upload a 30-second self-introduction video to boost member trust & profile responses by 5x.
              </p>
            </div>

            <input
              type="file"
              ref={videoFileInputRef}
              accept="video/mp4,video/webm,video/quicktime,video/*"
              onChange={handleVideoUpload}
              className="hidden"
            />
          </div>

          {videoUrl ? (
            <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-xl bg-stone-50 border border-stone-200">
              <div className="relative h-28 w-44 rounded-lg overflow-hidden bg-black flex items-center justify-center group shrink-0">
                <button
                  type="button"
                  onClick={() => setShowVideoModal(true)}
                  className="h-10 w-10 rounded-full bg-white/90 text-[#8B1E3F] flex items-center justify-center shadow-md group-hover:scale-110 transition-transform cursor-pointer"
                >
                  <Play className="h-5 w-5 fill-current ml-0.5" />
                </button>
              </div>

              <div className="space-y-1.5 flex-1 text-center sm:text-left">
                <h4 className="font-bold text-stone-800 text-sm">Active Video Introduction</h4>
                <p className="text-xs text-stone-500">Your video is active and visible on your public profile.</p>

                <div className="flex items-center justify-center sm:justify-start gap-3 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowVideoModal(true)}
                    className="text-xs font-semibold"
                  >
                    <Play className="h-3.5 w-3.5 mr-1" /> Watch Video
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDeleteVideo}
                    disabled={deleteVideoMutation.isPending}
                    className="text-xs font-semibold text-rose-600 hover:bg-rose-50 border-rose-200"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete Video
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center border-2 border-dashed border-stone-200 rounded-xl bg-stone-50/50 space-y-3">
              <Video className="h-8 w-8 text-stone-300 mx-auto" />
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                No video intro added yet. Introduce yourself in 30 seconds to connect faster with compatible matches.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => videoFileInputRef.current?.click()}
                disabled={uploadVideoMutation.isPending}
                className="text-xs font-semibold border-stone-300 text-stone-700 hover:bg-white cursor-pointer"
              >
                {uploadVideoMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-1.5" />
                )}
                Upload 30s Video Intro
              </Button>
            </div>
          )}
        </Card>

      </div>

      {/* ── Lightbox Image Preview Modal ── */}
      {previewPhoto && (
        <div
          onClick={() => setPreviewPhoto(null)}
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in"
        >
          <div className="relative max-w-2xl max-h-[85vh] overflow-hidden rounded-2xl" onClick={e => e.stopPropagation()}>
            <img src={previewPhoto} alt="Preview" className="w-full h-auto max-h-[80vh] object-contain rounded-2xl" />
            <button
              type="button"
              onClick={() => setPreviewPhoto(null)}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 text-white hover:bg-black transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* ── Video Player Modal ── */}
      {showVideoModal && videoUrl && (
        <div
          onClick={() => setShowVideoModal(false)}
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in"
        >
          <div className="relative max-w-2xl w-full bg-black rounded-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <video src={videoUrl} controls autoPlay className="w-full h-auto max-h-[75vh]" />
            <button
              type="button"
              onClick={() => setShowVideoModal(false)}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 text-white hover:bg-black transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
