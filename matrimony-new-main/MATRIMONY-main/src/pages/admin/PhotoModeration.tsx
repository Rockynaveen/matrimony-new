import React, { useState } from 'react';
import { MOCK_PHOTO_MODERATIONS } from '../../data/mockAdminData';
import { useApp } from '../../context/AppContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Check, X } from 'lucide-react';

export const PhotoModeration: React.FC = () => {
  const { showToast } = useApp();
  const [photos, setPhotos] = useState(MOCK_PHOTO_MODERATIONS);

  const handleAction = (id: string, action: string) => {
    setPhotos(prev => prev.filter(p => p.id !== id));
    showToast(`Photo ${id} ${action}`);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-foreground">AI Photo Moderation Queue</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Ensure uploaded profile photos comply with face visibility standards.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {photos.map(p => (
          <Card key={p.id} className="p-4 space-y-4">
            <div className="aspect-4/3 rounded-2xl overflow-hidden bg-muted">
              <img src={p.photoUrl} className="w-full h-full object-cover" />
            </div>

            <div className="flex items-center justify-between text-xs">
              <div>
                <h5 className="font-bold text-foreground">{p.userName}</h5>
                <span className="text-[10px] text-muted-foreground">{p.userRole}</span>
              </div>
              <Badge variant="gold">AI Passed</Badge>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-border">
              <Button size="sm" variant="primary" onClick={() => handleAction(p.id, 'Approved')} className="w-full text-xs">
                <Check className="h-3.5 w-3.5 mr-1" /> Approve Photo
              </Button>
              <Button size="sm" variant="danger" onClick={() => handleAction(p.id, 'Rejected')} className="w-full text-xs">
                <X className="h-3.5 w-3.5 mr-1" /> Reject
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
