import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useApp } from './AppContext';

interface WebSocketContextType {
  isConnected: boolean;
  sendMessage: (msg: object) => void;
  lastEvent: any;
}

const WebSocketContext = createContext<WebSocketContextType>({
  isConnected: false,
  sendMessage: () => {},
  lastEvent: null,
});

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<any>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const heartbeatTimer = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimer = useRef<NodeJS.Timeout | null>(null);

  const queryClient = useQueryClient();
  const { showToast, isAuthenticated } = useApp();

  const connect = useCallback(() => {
    const token = localStorage.getItem('access_token');
    if (!token || !isAuthenticated) {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      setIsConnected(false);
      return;
    }

    // Resolve base WS URL
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'https://matrimony-production-4b00.up.railway.app/api';
    let wsHost = 'matrimony-production-4b00.up.railway.app';
    let protocol = 'wss:';

    try {
      const parsed = new URL(apiBase.startsWith('http') ? apiBase : `https://${apiBase}`);
      wsHost = parsed.host;
      protocol = parsed.protocol === 'https:' ? 'wss:' : 'ws:';
    } catch {
      // fallback to railway
    }

    const wsUrl = `${protocol}//${wsHost}/ws/events/?token=${token}`;

    try {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setIsConnected(true);
        // Setup 30s Heartbeat as per Section 18.2 / 23.2
        if (heartbeatTimer.current) clearInterval(heartbeatTimer.current);
        heartbeatTimer.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'heartbeat' }));
          }
        }, 30000);
      };

      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          setLastEvent(data);

          // Central WebSocket Event Bus Router (Section 19)
          switch (data.type) {
            case 'ai_recommendations_updated':
              queryClient.invalidateQueries({ queryKey: ['recommendations'] });
              break;

            case 'interest_received':
              queryClient.invalidateQueries({ queryKey: ['receivedInterests'] });
              showToast(data.message || 'You received a new interest expression!');
              break;

            case 'interest_accepted':
              queryClient.invalidateQueries({ queryKey: ['sentInterests'] });
              showToast(data.message || 'Your interest was accepted!');
              break;

            case 'new_notification':
              queryClient.invalidateQueries({ queryKey: ['notifications'] });
              if (data.title || data.message) {
                showToast(`${data.title ? data.title + ': ' : ''}${data.message || ''}`);
              }
              break;

            case 'new_chat_message':
            case 'chat_message':
              queryClient.invalidateQueries({ queryKey: ['conversations'] });
              break;

            case 'user_status':
              // updates presence store if needed
              break;

            default:
              break;
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

        // Auto-reconnect with 3s backoff if user is still logged in
        if (localStorage.getItem('access_token')) {
          if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
          reconnectTimer.current = setTimeout(connect, 3000);
        }
      };

      socketRef.current = ws;
    } catch (err) {
      console.debug('[WebSocket] Connection failed:', err);
    }
  }, [isAuthenticated, queryClient, showToast]);

  useEffect(() => {
    connect();
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      if (heartbeatTimer.current) clearInterval(heartbeatTimer.current);
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    };
  }, [connect]);

  const sendMessage = useCallback((msg: object) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(msg));
    }
  }, []);

  return (
    <WebSocketContext.Provider value={{ isConnected, sendMessage, lastEvent }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => useContext(WebSocketContext);
export default WebSocketProvider;
