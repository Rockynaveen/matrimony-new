import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatApi } from '../api/chatApi';
import type {
  SendTextMessagePayload,
  CallInitiatePayload,
  CallRespondPayload,
  CallSignalPayload
} from '../types/chat.types';

export const chatKeys = {
  all: ['chat'] as const,
  conversations: () => [...chatKeys.all, 'conversations'] as const,
  messages: (roomId: number | string) => [...chatKeys.all, 'messages', String(roomId)] as const,
  activeCall: (roomId?: number | string) => [...chatKeys.all, 'activeCall', String(roomId || 'global')] as const,
};

// 1. Fetch Conversations List (GET /api/chat/conversations)
export function useConversations() {
  const hasToken = !!localStorage.getItem('access_token');
  return useQuery({
    queryKey: chatKeys.conversations(),
    queryFn: () => chatApi.getConversations(),
    enabled: hasToken,
    refetchInterval: 4000 // Background polling for new conversations every 4s
  });
}

// 2. Fetch Room Messages (GET /api/chat/conversations/{room_id})
export function useRoomMessages(roomId: number | string) {
  const hasToken = !!localStorage.getItem('access_token');
  const validId = Boolean(roomId && String(roomId) !== '0');
  return useQuery({
    queryKey: chatKeys.messages(roomId),
    queryFn: () => chatApi.getConversationMessages(roomId),
    enabled: hasToken && validId,
    refetchInterval: 3000 // Poll messages every 3s when inside active chat room
  });
}

// 3. Send Text Message (POST /api/chat/send)
export function useSendTextMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SendTextMessagePayload) => chatApi.sendTextMessage(payload),
    onSuccess: (data, variables) => {
      const roomIdStr = String(variables.room_id);

      queryClient.setQueryData<import('../types/chat.types').ChatMessageOut[]>(chatKeys.messages(roomIdStr), (old = []) => {
        const currentUserId = Number(localStorage.getItem('user_id') || 0);
        const createdMsg: import('../types/chat.types').ChatMessageOut = (data && (data.id || data.message || data.content)) ? {
          ...data,
          message: data.message || data.content || variables.message,
          content: data.content || data.message || variables.message,
          is_me: true
        } : {
          id: Date.now(),
          room_id: Number(variables.room_id),
          sender_id: currentUserId,
          receiver_id: Number(variables.room_id),
          message: variables.message,
          content: variables.message,
          created_at: new Date().toISOString(),
          timestamp: new Date().toISOString(),
          is_me: true,
          read: false
        };

        const existing = old || [];
        const msgText = String(createdMsg.message || createdMsg.content || '').trim();
        const msgTime = new Date(createdMsg.timestamp || createdMsg.created_at || 0).getTime() || Date.now();

        const isDup = existing.some(m => {
          if (String(m.id) === String(createdMsg.id)) return true;
          const text = String(m.message || m.content || '').trim();
          const t = new Date(m.timestamp || m.created_at || 0).getTime() || Number(m.id) || 0;
          if (text === msgText && Math.abs(t - msgTime) < 10000) return true;
          return false;
        });

        if (isDup) return existing;
        return [...existing, createdMsg];
      });

      queryClient.invalidateQueries({ queryKey: chatKeys.messages(variables.room_id) });
      queryClient.invalidateQueries({ queryKey: chatKeys.conversations() });
    }
  });
}

// 4. Send Message with Attachment (POST /api/chat/send-with-attachment)
export function useSendAttachmentMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roomId, file, message }: { roomId: number | string; file: File; message?: string }) =>
      chatApi.sendWithAttachment(roomId, file, message),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: chatKeys.messages(variables.roomId) });
      queryClient.invalidateQueries({ queryKey: chatKeys.conversations() });
    }
  });
}

// 5. Mark Conversation as Seen (PUT /api/chat/conversations/{room_id}/seen)
export function useMarkConversationSeen() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (roomId: number | string) => chatApi.markConversationSeen(roomId),
    onSuccess: (_, roomId) => {
      queryClient.invalidateQueries({ queryKey: chatKeys.conversations() });
      if (roomId) {
        queryClient.invalidateQueries({ queryKey: chatKeys.messages(roomId) });
      }
    }
  });
}

// 6. Delete Message for Me (DELETE /api/chat/message/{message_id})
export function useDeleteMessageForMe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ messageId, roomId }: { messageId: number | string; roomId: number | string }) =>
      chatApi.deleteMessageForMe(messageId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: chatKeys.messages(variables.roomId) });
    }
  });
}

// 7. Delete Message for Everyone (DELETE /api/chat/message/{message_id}/everyone)
export function useDeleteMessageForEveryone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ messageId, roomId }: { messageId: number | string; roomId: number | string }) =>
      chatApi.deleteMessageForEveryone(messageId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: chatKeys.messages(variables.roomId) });
    }
  });
}

// 8. Chat Heartbeat (POST /api/chat/heartbeat)
export function useChatHeartbeat(roomId?: number | string, enabled: boolean = true) {
  useEffect(() => {
    if (!enabled || !localStorage.getItem('access_token')) return;

    // Trigger initial heartbeat
    chatApi.sendHeartbeat(roomId).catch(() => {});

    // Periodic heartbeat timer every 25s
    const timer = setInterval(() => {
      chatApi.sendHeartbeat(roomId).catch(() => {});
    }, 25000);

    return () => clearInterval(timer);
  }, [roomId, enabled]);
}

// 8.5 Get User Online Status (POST /api/chat/UserOnlineStatus)
export function useGetUserOnlineStatus(userId?: number | string, enabled: boolean = true) {
  const hasToken = !!localStorage.getItem('access_token');
  const validUser = Boolean(userId && String(userId) !== '0');
  return useQuery({
    queryKey: [...chatKeys.all, 'onlineStatus', String(userId || 'me')],
    queryFn: () => chatApi.getUserOnlineStatus(userId),
    enabled: hasToken && enabled && validUser,
    staleTime: 10000,
    retry: false,
    refetchInterval: 25000
  });
}

// 9. Send Voice Message (POST /api/chat/send-voice)
export function useSendVoiceMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roomId, audioBlob }: { roomId: number | string; audioBlob: Blob | File }) =>
      chatApi.sendVoiceMessage(roomId, audioBlob),
    onSuccess: (data, variables) => {
      const roomIdStr = String(variables.roomId);
      queryClient.setQueryData<import('../types/chat.types').ChatMessageOut[]>(chatKeys.messages(roomIdStr), (old = []) => {
        if (!data) return old;
        return [...(old || []), data];
      });
      queryClient.invalidateQueries({ queryKey: chatKeys.messages(variables.roomId) });
      queryClient.invalidateQueries({ queryKey: chatKeys.conversations() });
    }
  });
}

// 10. Send Image (POST /api/chat/send-image)
export function useSendImageMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roomId, imageFile, receiverId }: { roomId: number | string; imageFile: File; receiverId?: number | string }) =>
      chatApi.sendImageMessage(roomId, imageFile, receiverId),
    onSuccess: (data, variables) => {
      const roomIdStr = String(variables.roomId);
      queryClient.setQueryData<import('../types/chat.types').ChatMessageOut[]>(chatKeys.messages(roomIdStr), (old = []) => {
        if (!data) return old;
        return [...(old || []), data];
      });
      queryClient.invalidateQueries({ queryKey: chatKeys.messages(variables.roomId) });
      queryClient.invalidateQueries({ queryKey: chatKeys.conversations() });
    }
  });
}

// 11. Send Video (POST /api/chat/send-video)
export function useSendVideoMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roomId, videoFile }: { roomId: number | string; videoFile: File }) =>
      chatApi.sendVideoMessage(roomId, videoFile),
    onSuccess: (data, variables) => {
      const roomIdStr = String(variables.roomId);
      queryClient.setQueryData<import('../types/chat.types').ChatMessageOut[]>(chatKeys.messages(roomIdStr), (old = []) => {
        if (!data) return old;
        return [...(old || []), data];
      });
      queryClient.invalidateQueries({ queryKey: chatKeys.messages(variables.roomId) });
      queryClient.invalidateQueries({ queryKey: chatKeys.conversations() });
    }
  });
}

// 12. Send Document (POST /api/chat/send-document)
export function useSendDocumentMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roomId, docFile }: { roomId: number | string; docFile: File }) =>
      chatApi.sendDocumentMessage(roomId, docFile),
    onSuccess: (data, variables) => {
      const roomIdStr = String(variables.roomId);
      queryClient.setQueryData<import('../types/chat.types').ChatMessageOut[]>(chatKeys.messages(roomIdStr), (old = []) => {
        if (!data) return old;
        return [...(old || []), data];
      });
      queryClient.invalidateQueries({ queryKey: chatKeys.messages(variables.roomId) });
      queryClient.invalidateQueries({ queryKey: chatKeys.conversations() });
    }
  });
}

// 13. Initiate Call (POST /api/chat/call/initiate)
export function useInitiateCall() {
  return useMutation({
    mutationFn: (payload: CallInitiatePayload) => chatApi.initiateCall(payload)
  });
}

// 14. Active Call Check (GET / POST /api/chat/call/active)
export function useActiveCall(roomId?: number | string, enabled: boolean = true) {
  const hasToken = !!localStorage.getItem('access_token');
  return useQuery({
    queryKey: chatKeys.activeCall(roomId),
    queryFn: () => chatApi.getActiveCall(roomId),
    enabled: hasToken && enabled,
    retry: false,
    refetchInterval: 12000 // Poll call status every 12s
  });
}

// 15. Respond to Call (POST /api/chat/call/{call_id}/respond)
export function useRespondToCall() {
  return useMutation({
    mutationFn: ({ callId, payload }: { callId: number | string; payload: CallRespondPayload }) =>
      chatApi.respondToCall(callId, payload)
  });
}

// 16 & 17. Send Call Signal (POST /api/chat/call/{call_id}/signal)
export function useSendCallSignal() {
  return useMutation({
    mutationFn: ({ callId, payload }: { callId: number | string; payload: CallSignalPayload }) =>
      chatApi.sendCallSignal(callId, payload)
  });
}

// 18. End Call (POST /api/chat/call/{call_id}/end)
export function useEndCall() {
  return useMutation({
    mutationFn: (callId: number | string) => chatApi.endCall(callId)
  });
}
