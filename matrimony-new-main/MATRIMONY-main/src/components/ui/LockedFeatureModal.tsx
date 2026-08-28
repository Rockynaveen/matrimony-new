import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Crown } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Badge } from './Badge';
import { useUIStore } from '../../store/useUIStore';

export const LockedFeatureModal: React.FC = () => {
  const navigate = useNavigate();
  const isLockedModalOpen = useUIStore((state) => state.isLockedModalOpen);
  const lockErrorMessage = useUIStore((state) => state.lockErrorMessage);
  const setLockModal = useUIStore((state) => state.setLockModal);

  return (
    <Modal
      isOpen={isLockedModalOpen}
      onClose={() => setLockModal(false)}
      title="🔒 Profile Locked"
    >
      <div className="space-y-5 p-1 text-stone-900">
        <div className="h-16 w-16 bg-amber-50 border border-amber-200 rounded-full flex items-center justify-center mx-auto text-amber-600 shadow-sm">
          <Lock className="h-8 w-8 text-amber-600" />
        </div>

        <div className="text-center space-y-2">
          <Badge variant="gold" className="bg-amber-100 text-amber-900 border-amber-300 font-extrabold px-3 py-1 text-xs">
            0 Credits Remaining
          </Badge>
          <h3 className="font-serif font-extrabold text-xl text-stone-900">Profile Access Restricted</h3>
          <p className="text-xs font-semibold text-stone-600 max-w-sm mx-auto leading-relaxed">
            {lockErrorMessage || 'Profile Locked. You have used all your matching profile credits. Upgrade your membership to view more profiles.'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 pt-3 border-t border-stone-100">
          <Button
            type="button"
            variant="outline"
            onClick={() => setLockModal(false)}
            className="w-full sm:w-1/2 font-bold text-xs border-stone-300"
          >
            Close
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={() => {
              setLockModal(false);
              navigate('/membership');
            }}
            className="w-full sm:w-1/2 font-extrabold text-xs bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 shadow-md hover:brightness-105"
          >
            <Crown className="h-4 w-4 mr-1 text-stone-950 fill-stone-950" /> Upgrade Membership
          </Button>
        </div>
      </div>
    </Modal>
  );
};
