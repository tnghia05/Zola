import type { Socket } from 'socket.io-client';
import type { Message } from '../api';

interface ChatSocketHandlers {
  onMessageCreated?: (message: Message) => void;
  onMessageUpdated?: (message: Message) => void;
  onMessageDeleted?: (messageId: string) => void;
  onMessagePinned?: (data: { messageId: string; action: 'pin' | 'unpin' }) => void;
  onMessageReaction?: (data: {
    messageId: string;
    action: 'add' | 'remove';
    reaction?: { emoji: string; userId: string; createdAt?: string };
  }) => void;
  onMessageRevoked?: (data: {
    messageId: string;
    conversationId?: string;
    revokedBy?: string;
    revokedAt?: string;
  }) => void;
  onMessageRead?: (data: { messageId: string; conversationId?: string; userId: string; readAt?: string }) => void;
  onTypingStarted?: (userId: string) => void;
  onTypingStopped?: (userId: string) => void;
}

export function registerChatSocket(
  socket: Socket | null,
  conversationId: string,
  handlers: ChatSocketHandlers,
): () => void {
  if (!socket) return () => undefined;

  const messageCreated = (payload: Message | { conversationId: string; message: Message }) => {
    // Handle both formats:
    // 1. Direct message object (backend format)
    // 2. Wrapped format { conversationId, message }
    let message: Message;
    let payloadConversationId: string;
    
    if ('conversationId' in payload && 'message' in payload) {
      // Wrapped format
      message = payload.message;
      payloadConversationId = payload.conversationId;
    } else {
      // Direct message object
      message = payload as Message;
      payloadConversationId = String(message.conversationId);
    }
    
    if (payloadConversationId === conversationId) {
      console.log('📨 Socket received message for current conversation:', message._id);
      handlers.onMessageCreated?.(message);
    } else {
      console.log('⚠️ Socket received message for different conversation:', payloadConversationId, 'current:', conversationId);
    }
  };

  const messageUpdated = (payload: Message | { conversationId: string; message: Message }) => {
    // Handle both formats
    let message: Message;
    let payloadConversationId: string;
    
    if ('conversationId' in payload && 'message' in payload) {
      message = payload.message;
      payloadConversationId = payload.conversationId;
    } else {
      message = payload as Message;
      payloadConversationId = String(message.conversationId);
    }
    
    if (payloadConversationId === conversationId) {
      handlers.onMessageUpdated?.(message);
    }
  };

  const messageDeleted = (payload: { conversationId: string; messageId: string } | { messageId: string; conversationId?: string }) => {
    // Handle both formats
    const messageId = payload.messageId;
    const payloadConversationId = payload.conversationId;
    
    if (!payloadConversationId || payloadConversationId === conversationId) {
      handlers.onMessageDeleted?.(messageId);
    }
  };

  const typingStarted = (payload: { conversationId: string; userId: string }) => {
    if (payload.conversationId === conversationId) {
      handlers.onTypingStarted?.(payload.userId);
    }
  };

  const typingStopped = (payload: { conversationId: string; userId: string }) => {
    if (payload.conversationId === conversationId) {
      handlers.onTypingStopped?.(payload.userId);
    }
  };

  const messagePinned = (data: { messageId: string; action: 'pin' | 'unpin' }) => {
    handlers.onMessagePinned?.(data);
  };

  const messageReaction = (data: {
    messageId: string;
    reaction?: { emoji: string; userId: string; createdAt?: string };
    action: 'add' | 'remove';
  }) => {
    if (!data?.messageId) return;
    handlers.onMessageReaction?.(data);
  };

  const messageRevoked = (data: {
    messageId: string;
    conversationId?: string;
    revokedBy?: string;
    revokedAt?: string;
  }) => {
    if (!data?.messageId) return;
    if (data.conversationId && data.conversationId !== conversationId) {
      return;
    }
    handlers.onMessageRevoked?.(data);
  };

  const messageRead = (data: { messageId: string; conversationId?: string; userId: string; readAt?: string }) => {
    if (!data?.messageId) return;
    if (data.conversationId && data.conversationId !== conversationId) {
      return;
    }
    handlers.onMessageRead?.(data);
  };

  socket.on('message:new', messageCreated);
  socket.on('newMessage', messageCreated);
  socket.on('chatMessage', messageCreated);
  socket.on('message:update', messageUpdated);
  socket.on('message:edited', messageUpdated);
  socket.on('message:delete', messageDeleted);
  socket.on('message:deleted', messageDeleted);
  socket.on('message:pinned', messagePinned);
  socket.on('message:reaction', messageReaction);
  socket.on('message:revoked', messageRevoked);
  socket.on('message:read', messageRead);
  socket.on('typing:start', typingStarted);
  socket.on('typing:stop', typingStopped);

  return () => {
    socket.off('message:new', messageCreated);
    socket.off('newMessage', messageCreated);
    socket.off('chatMessage', messageCreated);
    socket.off('message:update', messageUpdated);
    socket.off('message:edited', messageUpdated);
    socket.off('message:delete', messageDeleted);
    socket.off('message:deleted', messageDeleted);
    socket.off('message:pinned', messagePinned);
    socket.off('message:reaction', messageReaction);
    socket.off('message:revoked', messageRevoked);
    socket.off('message:read', messageRead);
    socket.off('typing:start', typingStarted);
    socket.off('typing:stop', typingStopped);
  };
}
