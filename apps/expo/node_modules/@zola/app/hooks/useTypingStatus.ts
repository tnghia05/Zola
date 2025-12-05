import { useCallback, useEffect, useRef, useState } from 'react';
import { getSocket } from '../socket';
import { TypingUser } from '../types/chat';

interface UseTypingStatusResult {
  typingUsers: TypingUser[];
  handleInputChange: (value: string) => void;
  notifyMessageSent: () => void;
}

export function useTypingStatus(
  conversationId?: string,
  selfUserId?: string,
): UseTypingStatusResult {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!conversationId) return;
    const socket = getSocket();
    if (!socket) return;

    const handleTypingStart = (payload: { conversationId: string; userId: string; userName?: string }) => {
      if (payload.conversationId !== conversationId) return;
      if (payload.userId === selfUserId) return;
      setTypingUsers((prev) => {
        const exists = prev.some((item) => item.userId === payload.userId);
        if (exists) return prev;
        return [...prev, { userId: payload.userId, name: payload.userName }];
      });
    };

    const handleTypingStop = (payload: { conversationId: string; userId: string }) => {
      if (payload.conversationId !== conversationId) return;
      setTypingUsers((prev) => prev.filter((item) => item.userId !== payload.userId));
    };

    socket.on('typing:start', handleTypingStart);
    socket.on('typing:stop', handleTypingStop);

    return () => {
      socket.off('typing:start', handleTypingStart);
      socket.off('typing:stop', handleTypingStop);
    };
  }, [conversationId, selfUserId]);

  const emitStop = useCallback(() => {
    if (!conversationId) return;
    const socket = getSocket();
    if (!socket) return;
    socket.emit('typing:stop', { conversationId });
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, [conversationId]);

  const handleInputChange = useCallback(
    (value: string) => {
      if (!conversationId) return;
      const socket = getSocket();
      if (!socket) return;

      if (value.trim().length > 0) {
        socket.emit('typing:start', { conversationId });
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
          emitStop();
        }, 3000);
      } else {
        emitStop();
      }
    },
    [conversationId, emitStop],
  );

  const notifyMessageSent = useCallback(() => {
    emitStop();
  }, [emitStop]);

  return { typingUsers, handleInputChange, notifyMessageSent };
}
