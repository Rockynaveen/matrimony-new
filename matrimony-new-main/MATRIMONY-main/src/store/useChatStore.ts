import { create } from 'zustand';

interface ChatStoreState {
  activeChatUserId: string | null;
  isCallModalOpen: boolean;
  activeCallType: 'audio' | 'video' | null;
  activeCallTarget: {
    id: string;
    name: string;
    avatar?: string;
  } | null;

  // Actions
  setActiveChatUserId: (id: string | null) => void;
  startCall: (target: { id: string; name: string; avatar?: string }, type: 'audio' | 'video') => void;
  endCall: () => void;
}

export const useChatStore = create<ChatStoreState>((set) => ({
  activeChatUserId: 'MAT-1001',
  isCallModalOpen: false,
  activeCallType: null,
  activeCallTarget: null,

  setActiveChatUserId: (id: string | null) => set({ activeChatUserId: id }),

  startCall: (target, type) =>
    set({
      isCallModalOpen: true,
      activeCallType: type,
      activeCallTarget: target
    }),

  endCall: () =>
    set({
      isCallModalOpen: false,
      activeCallType: null,
      activeCallTarget: null
    })
}));
