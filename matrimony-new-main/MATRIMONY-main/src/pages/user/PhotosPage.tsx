import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Upload, Trash2, Star, Video } from 'lucide-react';

export const PhotosPage: React.FC = () => {
  const { showToast } = useApp();
  const [photos, setPhotos] = useState([
    '/images/profiles/profile_1.jpg',
    '/images/profiles/profile_3.jpg'
  ]);
  const [primaryIndex, setPrimaryIndex] = useState(0);

  const handleUpload = () => {
    showToast('New photo uploaded & submitted for AI moderation scan!');
    setPhotos([...photos, '/images/profiles/profile_5.jpg']);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground">Photos & Media Gallery</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Manage profile photography, video introduction, and privacy settings.</p>
        </div>
        <Button variant="primary" onClick={handleUpload}>
          <Upload className="h-4 w-4 mr-2" /> Upload New Photo
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {photos.map((url, idx) => (
          <Card key={idx} className="overflow-hidden relative group">
            <img src={url} className="w-full h-64 object-cover" />
            
            {idx === primaryIndex && (
              <Badge variant="gold" className="absolute top-3 left-3 bg-amber-400 text-amber-950 font-bold shadow-md">
                <Star className="h-3 w-3 mr-1 fill-current" /> Primary Photo
              </Badge>
            )}

            <div className="p-3 flex items-center justify-between bg-white border-t border-border">
              {idx !== primaryIndex ? (
                <button
                  onClick={() => {
                    setPrimaryIndex(idx);
                    showToast('Set as primary profile picture!');
                  }}
                  className="text-xs font-semibold text-[#8B1E3F] hover:underline"
                >
                  Set Primary
                </button>
              ) : (
                <span className="text-xs font-semibold text-emerald-700">Active Avatar</span>
              )}

              <button
                onClick={() => {
                  setPhotos(photos.filter((_, i) => i !== idx));
                  showToast('Photo removed');
                }}
                className="text-xs text-destructive hover:underline p-1"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </Card>
        ))}
      </div>

      {/* Video Intro Box */}
      <Card className="p-6 bg-muted/20 space-y-4">
        <h3 className="font-serif text-xl font-bold text-foreground flex items-center gap-2">
          <Video className="h-5 w-5 text-[#8B1E3F]" /> Video Introduction (Optional)
        </h3>
        <p className="text-xs text-muted-foreground">Upload a 30-second self-introduction video to boost member trust & profile responses by 5x.</p>
        <Button variant="outline" size="sm" onClick={() => showToast('Video recorder opened simulation')}>
          <Upload className="h-3.5 w-3.5 mr-2" /> Upload 30s Video Intro
        </Button>
      </Card>

    </div>
  );
};
