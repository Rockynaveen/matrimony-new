import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { ShieldCheck, ShieldAlert, Loader2 } from 'lucide-react';
import type { MatchResponseSchema } from '../../types/matching.types';
import { useUnblockProfile } from '../../hooks/useMatching';
import { useApp } from '../../context/AppContext';

import { MatchAvatar } from '../ui/MatchAvatar';

interface BlockedProfileCardProps {
  profile: MatchResponseSchema;
}

export const BlockedProfileCard: React.FC<BlockedProfileCardProps> = ({ profile }) => {
  const { showToast } = useApp();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const unblockMutation = useUnblockProfile();

  const handleUnblock = async () => {
    try {
      await unblockMutation.mutateAsync(profile.user_id);
      showToast(`${profile.first_name} has been unblocked.`);
      setIsConfirmOpen(false);
    } catch (err: any) {
      showToast(err?.message || 'Failed to unblock profile');
    }
  };

  return (
    <>
      <Card className="p-4 flex items-center justify-between gap-4 border border-stone-200/80 bg-white rounded-3xl hover:shadow-md transition-all duration-300">
        <div className="flex items-center gap-4">
          <MatchAvatar
            photo={profile.profile_photo}
            firstName={profile.first_name}
            lastName={profile.last_name}
            variant="circle"
            className="h-12 w-12 text-lg shrink-0 grayscale opacity-70"
          />
          <div>
            <h4 className="font-serif text-sm sm:text-base font-bold text-stone-700">
              {profile.first_name} {profile.last_name}
            </h4>
            <p className="text-[10px] text-stone-400 font-semibold">{profile.occupation || 'Professional'}</p>
          </div>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() => setIsConfirmOpen(true)}
          className="text-xs border-stone-200 text-stone-600 hover:bg-stone-50 hover:text-stone-900 rounded-xl"
        >
          <ShieldCheck className="h-3.5 w-3.5 mr-1 text-emerald-600" /> Unblock
        </Button>
      </Card>

      {/* Confirmation Modal */}
      <Modal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        title="Unblock User"
      >
        <div className="space-y-4 text-center">
          <div className="h-12 w-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-100">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold text-stone-900">Are you sure you want to unblock {profile.first_name}?</p>
            <p className="text-xs text-stone-500">
              Unblocking them will allow them to view your profile, send interest messages, or chat with you again.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsConfirmOpen(false)}
              className="rounded-xl px-4 text-stone-750 font-bold border-stone-200"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={unblockMutation.isPending}
              onClick={handleUnblock}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-4 font-bold"
            >
              {unblockMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
              ) : (
                <ShieldCheck className="h-3.5 w-3.5 mr-1" />
              )}
              Confirm Unblock
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
