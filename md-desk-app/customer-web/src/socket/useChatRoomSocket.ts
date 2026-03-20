import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
const SOCKET_URL = (() => {
  try {
    return new URL(API_BASE).origin;
  } catch {
    return 'http://localhost:3000';
  }
})();

export function useChatRoomSocket(token: string | null, roomId: string | null) {
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!token || !roomId) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      return;
    }
    const socket = io(SOCKET_URL, {
      path: '/socket.io',
      auth: { token },
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    const join = () => {
      socket.emit('chat:join', { roomId }, () => {});
    };
    socket.on('connect', join);
    if (socket.connected) join();

    const onMsg = () => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', roomId] });
      queryClient.invalidateQueries({ queryKey: ['chat-rooms'] });
    };
    socket.on('chat:message', onMsg);
    socket.on('chat:read', onMsg);

    return () => {
      socket.emit('chat:leave', { roomId });
      socket.off('connect', join);
      socket.off('chat:message', onMsg);
      socket.off('chat:read', onMsg);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, roomId, queryClient]);
}
