import { create } from 'zustand';
import { matchingApi } from '../api/matchingApi';
import { useUIStore } from './useUIStore';
import { useNotificationStore } from './useNotificationStore';
import { queryClient } from '../lib/queryClient';

interface ShortlistStore {
  shortlistedIds: string[];
  setShortlistedIds: (ids: string[]) => void;
  toggleShortlist: (profileId: string, targetName?: string, targetImage?: string) => Promise<void>;
  isShortlisted: (profileId: string) => boolean;
}

export const useShortlistStore = create<ShortlistStore>((set, get) => ({
  shortlistedIds: [],

  setShortlistedIds: (ids) => set({ shortlistedIds: ids }),

  isShortlisted: (profileId) => get().shortlistedIds.includes(String(profileId)),

  toggleShortlist: async (profileId, targetName, targetImage) => {
    const idStr = String(profileId);
    const previous = get().shortlistedIds;
    const exists = previous.includes(idStr);

    // Optimistic UI update
    const updated = exists
      ? previous.filter((id) => id !== idStr)
      : [...previous, idStr];

    set({ shortlistedIds: updated });

    const numericId = parseInt(idStr.replace(/\D/g, ''), 10);
    const isNumeric = !isNaN(numericId) && numericId > 0;

    try {
      if (isNumeric) {
        if (exists) {
          await matchingApi.removeFromShortlist(numericId);
        } else {
          await matchingApi.addToShortlist({ user: numericId });
        }
        queryClient.invalidateQueries({ queryKey: ['matching'] });
      } else {
        if (exists) {
          await matchingApi.removeShortlist(idStr);
        } else {
          await matchingApi.shortlistProfile(idStr);
        }
      }

      useUIStore
        .getState()
        .showToast(exists ? 'Profile removed from shortlist' : 'Profile added to shortlist ✨');

      if (!exists) {
        useNotificationStore.getState().addNotification({
          title: 'Profile Shortlisted ⭐',
          message: `You shortlisted ${targetName || 'a profile'} to your saved matches.`,
          category: 'Matches',
          link: '/matching/shortlist',
          avatar: targetImage
        });
      }
    } catch (err: any) {
      // Rollback on failure
      set({ shortlistedIds: previous });
      useUIStore
        .getState()
        .showToast(err?.message || 'Failed to update shortlist status');
    }
  }
}));
