import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useApp } from './AppContext';

export interface WebSocketContextType {
  isConnected: boolean;
  sendMessage: (msg: object) => void;
  sendInterest: (toUserId: number | string, message?: string) => void;
  sendChatMessage: (roomId: number | string, message: string, extra?: any) => void;
  requestAiMatches: () => void;
  lastEvent: any;
}

const WebSocketContext = createContext<WebSocketContextType>({
  isConnected: false,
  sendMessage: () => {},
  sendInterest: () => {},
  sendChatMessage: () => {},
  requestAiMatches: () => {},
  lastEvent: null,
});

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<any>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const heartbeatTimer = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimer = useRef<NodeJS.Timeout | null>(null);
  const endpointIndexRef = useRef(0);

  const queryClient = useQueryClient();
  const { showToast, isAuthenticated } = useApp();

  const retryCount = useRef(0);

  // Common Django Channels WebSocket endpoints
  const candidateEndpoints = [
    '/ws/events/',
    '/ws/',
    '/ws/notifications/',
    '/ws/chat/'
  ];

  const connect = useCallback(() => {
    const token = localStorage.getItem('access_token');
    if (!token || !isAuthenticated) {
      if (socketRef.current) {
        try { socketRef.current.close(); } catch {}
        socketRef.current = null;
      }
      setIsConnected(false);
      return;
    }

    // Resolve WebSocket Host from configured backend URL
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'https://matrimony-production-4b00.up.railway.app/api';
    let wsHost = 'matrimony-production-4b00.up.railway.app';
    let protocol = 'wss:';

    try {
      const parsed = new URL(apiBase.startsWith('http') ? apiBase : `https://${apiBase}`);
      wsHost = parsed.host;
      protocol = parsed.protocol === 'https:' ? 'wss:' : 'ws:';
    } catch {
      wsHost = 'matrimony-production-4b00.up.railway.app';
      protocol = 'wss:';
    }

    // Select candidate endpoint (rotating on repeated failures)
    const currentPath = candidateEndpoints[endpointIndexRef.current % candidateEndpoints.length];
    const wsUrl = `${protocol}//${wsHost}${currentPath}?token=${encodeURIComponent(token)}`;

    try {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setIsConnected(true);
        retryCount.current = 0;
        console.log(`[WebSocket] Connected to Django socket at ${currentPath}`);

        // Setup 25s Heartbeat Ping for Django Channels
        if (heartbeatTimer.current) clearInterval(heartbeatTimer.current);
        heartbeatTimer.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            try {
              ws.send(JSON.stringify({ type: 'heartbeat', action: 'ping' }));
            } catch {}
          }
        }, 25000);
      };

      ws.onmessage = (e) => {
        try {
          const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
          setLastEvent(data);

          const eventType = String(data.type || data.action || data.event || '').toLowerCase();

          // ─────────────────────────────────────────────────────────
          // 1. AI Matching & Recommendations
          // ─────────────────────────────────────────────────────────
          if (
            eventType.includes('ai_match') ||
            eventType.includes('recommendation') ||
            eventType.includes('matching') ||
            eventType === 'new_match'
          ) {
            queryClient.invalidateQueries({ queryKey: ['recommendations'] });
            queryClient.invalidateQueries({ queryKey: ['matches'] });
            if (data.message) {
              showToast(data.message);
            }
          }

          // ─────────────────────────────────────────────────────────
          // 2. Send Interest & Receiver Interest Events
          // ─────────────────────────────────────────────────────────
          else if (
            eventType.includes('interest')
          ) {
            queryClient.invalidateQueries({ queryKey: ['receivedInterests'] });
            queryClient.invalidateQueries({ queryKey: ['sentInterests'] });
            queryClient.invalidateQueries({ queryKey: ['interests'] });
            queryClient.invalidateQueries({ queryKey: ['recommendations'] });
            queryClient.invalidateQueries({ queryKey: ['matches'] });
            queryClient.invalidateQueries({ queryKey: ['notifications'] });

            const isReceived = eventType.includes('received') || eventType.includes('receive') || eventType.includes('incoming');
            const isAccepted = eventType.includes('accepted') || eventType.includes('accept');
            const isSent = eventType.includes('sent') || eventType.includes('send');

            const alertMsg = data.message ||
              (isReceived
                ? `You received a new interest expression${data.sender_name ? ` from ${data.sender_name}` : ''}!`
                : (isAccepted
                  ? `Your interest was accepted${data.recipient_name ? ` by ${data.recipient_name}` : ''}!`
                  : (isSent ? 'Interest sent successfully!' : 'Interest status updated.')));

            showToast(alertMsg);
          }

          // ─────────────────────────────────────────────────────────
          // 3. Chat Messages, Rooms & Activity
          // ─────────────────────────────────────────────────────────
          else if (
            eventType.includes('chat') ||
            eventType.includes('message')
          ) {
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
            queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
            const roomId = data.room_id || data.roomId || data.conversation_id;
            if (roomId) {
              queryClient.invalidateQueries({ queryKey: ['chat', 'messages', String(roomId)] });
            }
            if (data.sender_name && !data.is_me) {
              showToast(`New message from ${data.sender_name}`);
            }
          }

          // ─────────────────────────────────────────────────────────
          // 4. Notifications & Alerts
          // ─────────────────────────────────────────────────────────
          else if (
            eventType.includes('notification') ||
            eventType.includes('alert')
          ) {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            if (data.title || data.message) {
              showToast(`${data.title ? data.title + ': ' : ''}${data.message || ''}`);
            }
          }

          // ─────────────────────────────────────────────────────────
          // 5. User Online Status & Presence
          // ─────────────────────────────────────────────────────────
          else if (
            eventType.includes('status') ||
            eventType.includes('presence')
          ) {
            queryClient.invalidateQueries({ queryKey: ['chat', 'onlineStatus'] });
          }
        } catch (err) {
          console.debug('[WebSocket] Message parse error:', err);
        }
      };

      ws.onerror = () => {
        setIsConnected(false);
      };

      ws.onclose = () => {
        setIsConnected(false);
        if (heartbeatTimer.current) clearInterval(heartbeatTimer.current);

        // Advance candidate endpoint if not connected yet
        endpointIndexRef.current += 1;
        retryCount.current += 1;

        // Auto-reconnect with exponential backoff if user is still logged in
        if (localStorage.getItem('access_token')) {
          if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
          const backoff = Math.min(retryCount.current * 3000, 30000);
          reconnectTimer.current = setTimeout(connect, backoff);
        }
      };

      socketRef.current = ws;
    } catch (err) {
      console.debug('[WebSocket] Connection attempt failed:', err);
    }
  }, [isAuthenticated, queryClient, showToast]);

  useEffect(() => {
    connect();
    return () => {
      if (socketRef.current) {
        try { socketRef.current.close(); } catch {}
        socketRef.current = null;
      }
      if (heartbeatTimer.current) clearInterval(heartbeatTimer.current);
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    };
  }, [connect]);

  // General Send Message over WebSocket
  const sendMessage = useCallback((msg: object) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      try {
        socketRef.current.send(JSON.stringify(msg));
      } catch (err) {
        console.warn('[WebSocket] Send failed:', err);
      }
    }
  }, []);

  // Dedicated Send Interest Helper over WebSocket
  const sendInterest = useCallback((toUserId: number | string, message?: string) => {
    sendMessage({
      type: 'send_interest',
      action: 'send_interest',
      to_user: Number(toUserId),
      message: message || 'Hi, I am interested in your profile.'
    });
  }, [sendMessage]);

  // Dedicated Chat Message Helper over WebSocket
  const sendChatMessage = useCallback((roomId: number | string, message: string, extra?: any) => {
    sendMessage({
      type: 'chat_message',
      action: 'send_message',
      room_id: Number(roomId),
      message,
      content: message,
      timestamp: new Date().toISOString(),
      ...(extra || {})
    });
  }, [sendMessage]);

  // Dedicated AI Matching Helper over WebSocket
  const requestAiMatches = useCallback(() => {
    sendMessage({
      type: 'get_ai_recommendations',
      action: 'ai_matching'
    });
  }, [sendMessage]);

  return (
    <WebSocketContext.Provider
      value={{
        isConnected,
        sendMessage,
        sendInterest,
        sendChatMessage,
        requestAiMatches,
        lastEvent
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => useContext(WebSocketContext);
export default WebSocketProvider;
