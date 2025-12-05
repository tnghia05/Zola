import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getMessages,
  createMessage,
  createMessageWithPayload,
  Message,
  markAsRead,
  CreateMessagePayload,
  addReaction,
  removeReaction,
  pinMessage,
  unpinMessage,
  editMessage,
  deleteMessage,
  revokeMessage,
  starMessage,
  ReadReceipt,
} from '../api';
import { ChatMessage, SendMessagePayload } from '../types/chat';
import { getSocket } from '../socket';
import { registerChatSocket } from '../services/chatSocket';

const DEFAULT_PAGE_SIZE = 40;

interface UseChatMessagesResult {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  currentUserId: string | null;
  hasMore: boolean;
  sendMessage: (payload: SendMessagePayload) => Promise<void>;
  reload: () => Promise<void>;
  loadOlder: () => Promise<void>;
  markConversationAsRead: () => Promise<void>;
  reactToMessage: (messageId: string, emoji: string) => Promise<void>;
  togglePinMessage: (messageId: string, shouldPin: boolean) => Promise<void>;
  editMessageContent: (messageId: string, text: string) => Promise<void>;
  deleteMessageById: (messageId: string) => Promise<void>;
  revokeMessageById: (messageId: string) => Promise<void>;
  starMessageById: (messageId: string) => Promise<void>;
}

const toChatMessage = (message: Message): ChatMessage => ({
  ...message,
});

const sortMessages = (msgs: ChatMessage[]) =>
  [...msgs].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

export function useChatMessages(conversationId?: string): UseChatMessagesResult {
  const [allMessages, setAllMessages] = useState<ChatMessage[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loadedSkip, setLoadedSkip] = useState(0);

  useEffect(() => {
    const storedUserId = localStorage.getItem('user_id');
    if (storedUserId) {
      setCurrentUserId(storedUserId);
    }
  }, []);

  useEffect(() => {
    setLoadedSkip(0);
    setAllMessages([]);
  }, [conversationId]);

  const loadMessages = useCallback(async (skip: number = 0) => {
    if (!conversationId) {
      setAllMessages([]);
      setHasMore(false);
      return;
    }

    try {
      if (skip === 0) {
        setLoading(true);
      } else {
        setLoadingOlder(true);
      }
      setError(null);
      const data = await getMessages(conversationId, { limit: DEFAULT_PAGE_SIZE, skip });
      
      // Handle both old format (array) and new format (object with messages and pagination)
      let messages: Message[];
      let hasMoreData = false;
      
      if (Array.isArray(data)) {
        // Old format: direct array
        messages = data;
        hasMoreData = messages.length >= DEFAULT_PAGE_SIZE;
      } else {
        // New format: object with messages and pagination
        messages = data.messages || [];
        hasMoreData = data.pagination?.hasMore || false;
      }
      
      const newMessages = messages.map(toChatMessage);
      
      if (skip === 0) {
        // Initial load - replace all messages
        setAllMessages(sortMessages(newMessages));
      } else {
        // Loading older - prepend to existing messages
        setAllMessages((prev) => sortMessages([...newMessages, ...prev]));
      }
      
      setHasMore(hasMoreData);
      setLoadedSkip(skip + newMessages.length);
    } catch (err) {
      console.error('❌ Failed to load messages:', err);
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      setLoading(false);
      setLoadingOlder(false);
    }
  }, [conversationId]);

  useEffect(() => {
    loadMessages(0);
  }, [loadMessages]);

  const applyMessageUpdate = useCallback(
    (messageId: string, updater: (message: ChatMessage) => ChatMessage | null) => {
      setAllMessages((prev) => {
        const next = prev
          .map((msg) => (msg._id === messageId ? updater(msg) : msg))
          .filter((msg): msg is ChatMessage => msg !== null);
        return sortMessages(next);
      });
    },
    [],
  );

  useEffect(() => {
    if (!conversationId) return;
    const socket = getSocket();
    if (!socket) {
      console.warn('⚠️ Socket not available, cannot join room');
      return;
    }

    const joinRoom = () => {
      console.log(`📱 Joining conversation room: conv:${conversationId}`);
      socket.emit('conversation:join', conversationId);
    };

    // Join conversation room để nhận realtime messages
    if (socket.connected) {
      joinRoom();
    } else {
      console.log('⏳ Socket not connected yet, waiting for connect...');
      // Nếu chưa connect, đợi connect rồi join
      const onConnect = () => {
        console.log(`✅ Socket connected, joining room: conv:${conversationId}`);
        joinRoom();
        socket.off('connect', onConnect);
      };
      socket.on('connect', onConnect);
      
      // Cleanup listener on unmount
      return () => {
        socket.off('connect', onConnect);
      };
    }

    const unsubscribe = registerChatSocket(socket, conversationId, {
      onMessageCreated: (message) => {
        console.log('📨 New message received via socket:', message._id);
        setAllMessages((prev) => {
          const exists = prev.some((item) => item._id === message._id);
          if (exists) {
            console.log('⚠️ Message already exists, skipping:', message._id);
            return prev;
          }
          console.log('✅ Adding new message to list');
          return sortMessages([...prev, toChatMessage(message)]);
        });
      },
      onMessageUpdated: (message) => {
        setAllMessages((prev) =>
          sortMessages(
            prev.map((item) => (item._id === message._id ? toChatMessage(message) : item)),
          ),
        );
      },
      onMessageDeleted: (messageId) => {
        setAllMessages((prev) => prev.filter((item) => item._id !== messageId));
      },
      onMessagePinned: (data) => {
        console.log(`📌 Socket: Message ${data.messageId} ${data.action}ed`);
        // Reload messages to get updated pin status
        loadMessages();
      },
      onMessageReaction: (data) => {
        if (!data.reaction) return;
        const reaction = data.reaction!;
        applyMessageUpdate(data.messageId, (msg) => {
          const current = msg.reactions ?? [];
          if (data.action === 'remove') {
            return {
              ...msg,
              reactions: current.filter(
                (existing) =>
                  !(existing.userId === reaction.userId && existing.emoji === reaction.emoji),
              ),
            };
          }
          const exists = current.some(
            (existing) => existing.userId === reaction.userId && existing.emoji === reaction.emoji,
          );
          if (exists) {
            return msg;
          }
          return {
            ...msg,
            reactions: [
              ...current,
              {
                emoji: reaction.emoji,
                userId: reaction.userId,
                createdAt: reaction.createdAt ?? new Date().toISOString(),
              },
            ],
          };
        });
      },
      onMessageRevoked: (payload) => {
        applyMessageUpdate(payload.messageId, (msg) => ({
          ...msg,
          isRevoked: true,
          revokedAt: payload.revokedAt ?? new Date().toISOString(),
          revokedBy: payload.revokedBy,
          text: null as any,
          imageUrl: undefined,
        }));
      },
      onMessageRead: (payload) => {
        if (!payload.userId) return;
        applyMessageUpdate(payload.messageId, (msg) => {
          const alreadyRead = msg.readBy?.some((entry) => entry.userId === payload.userId);
          if (alreadyRead) {
            return msg;
          }
          const nextRead: ReadReceipt[] = [
            ...(msg.readBy ?? []),
            {
              userId: payload.userId,
              readAt: payload.readAt ?? new Date().toISOString(),
            },
          ];
          return { ...msg, readBy: nextRead };
        });
      },
    });

    return () => {
      unsubscribe();
    };
  }, [conversationId, loadMessages]);

  const markConversationAsRead = useCallback(async () => {
    if (!conversationId) return;
    try {
      await markAsRead(conversationId);
    } catch (err) {
      console.warn('⚠️ Failed to mark conversation as read:', err);
    }
  }, [conversationId]);

  const sendMessage = useCallback(
    async (payload: SendMessagePayload) => {
      if (!conversationId) {
        console.warn('sendMessage called without conversationId');
        return;
      }

      const content = payload.text?.trim() ?? '';
      if (!content && !payload.imageUrl) {
        return;
      }

      const now = new Date().toISOString();
      const localId = `local-${Date.now()}`;
      const optimisticMessage: ChatMessage = {
        _id: localId,
        localId,
        pending: true,
        text: content,
        imageUrl: payload.imageUrl,
        type: payload.imageUrl ? 'image' : 'text',
        conversationId,
        senderId: currentUserId ?? 'me',
        createdAt: now,
        updatedAt: now,
      } as ChatMessage;

      setAllMessages((prev) => sortMessages([...prev, optimisticMessage]));

      try {
        let response: Message;
        if (payload.imageUrl) {
          const data: CreateMessagePayload = {
            text: payload.text,
            imageUrl: payload.imageUrl,
            replyTo: payload.replyTo,
          };
          response = await createMessageWithPayload(conversationId, data);
        } else {
          response = await createMessage(conversationId, content);
        }

        setAllMessages((prev) =>
          sortMessages(
            prev.map((msg) => (msg.localId === localId ? toChatMessage(response) : msg)),
          ),
        );
      } catch (err) {
        console.error('❌ Failed to send message:', err);
        const messageError = err instanceof Error ? err.message : 'Failed to send message';
        setAllMessages((prev) =>
          prev.map((msg) =>
            msg.localId === localId ? { ...msg, pending: false, error: messageError } : msg,
          ),
        );
        setError(messageError);
      }
    },
    [conversationId, currentUserId],
  );

  const loadOlder = useCallback(async () => {
    if (!hasMore || loadingOlder || !conversationId) return;
    await loadMessages(loadedSkip);
  }, [hasMore, loadingOlder, conversationId, loadedSkip, loadMessages]);

  const reactToMessage = useCallback(
    async (messageId: string, emoji: string) => {
      const target = allMessages.find((msg) => msg._id === messageId);
      const alreadyReacted = target?.reactions?.some(
        (reaction) => reaction.emoji === emoji && reaction.userId === currentUserId,
      );

      if (alreadyReacted) {
        applyMessageUpdate(messageId, (msg) => ({
          ...msg,
          reactions: (msg.reactions ?? []).filter(
            (reaction) => !(reaction.emoji === emoji && reaction.userId === currentUserId),
          ),
        }));

        try {
          await removeReaction(messageId, emoji);
        } catch (err) {
          console.error('❌ Failed to remove reaction:', err);
          loadMessages();
        }
        return;
      }

      applyMessageUpdate(messageId, (msg) => ({
        ...msg,
        reactions: [
          ...(msg.reactions ?? []),
          { emoji, userId: currentUserId ?? 'me', createdAt: new Date().toISOString() },
        ],
      }));

      try {
        await addReaction(messageId, emoji);
      } catch (err) {
        console.error('❌ Failed to add reaction:', err);
        await removeReaction(messageId, emoji).catch(() => undefined);
        loadMessages();
      }
    },
    [allMessages, applyMessageUpdate, currentUserId, loadMessages],
  );

  const togglePinMessage = useCallback(
    async (messageId: string, shouldPin: boolean) => {
      console.log(`📌 Toggling pin for message ${messageId}, shouldPin: ${shouldPin}`);
      applyMessageUpdate(messageId, (msg) => ({ ...msg, isPinned: shouldPin }));
      try {
        let response: Message;
        if (shouldPin) {
          console.log(`📌 Pinning message ${messageId}...`);
          response = await pinMessage(messageId);
        } else {
          console.log(`📌 Unpinning message ${messageId}...`);
          response = await unpinMessage(messageId);
        }
        console.log(`✅ Pin toggle successful, response:`, response);
        // Update message from response
        applyMessageUpdate(messageId, () => toChatMessage(response));
        // Also reload to ensure consistency
        await loadMessages();
      } catch (err) {
        console.error('❌ Failed to toggle pin:', err);
        // Revert on error
        applyMessageUpdate(messageId, (msg) => ({ ...msg, isPinned: !shouldPin }));
      }
    },
    [applyMessageUpdate, loadMessages],
  );

  const editMessageContent = useCallback(
    async (messageId: string, text: string) => {
      applyMessageUpdate(messageId, (msg) => ({ ...msg, text, isEdited: true }));
      try {
        await editMessage(messageId, text);
      } catch (err) {
        console.error('❌ Failed to edit message:', err);
        loadMessages();
      }
    },
    [applyMessageUpdate, loadMessages],
  );

  const deleteMessageById = useCallback(
    async (messageId: string) => {
      const previous = allMessages;
      applyMessageUpdate(messageId, () => null);
      try {
        await deleteMessage(messageId);
      } catch (err) {
        console.error('❌ Failed to delete message:', err);
        setAllMessages(previous);
      }
    },
    [allMessages, applyMessageUpdate],
  );

  const revokeMessageById = useCallback(
    async (messageId: string) => {
      applyMessageUpdate(messageId, (msg) => ({
        ...msg,
        isRevoked: true,
        revokedAt: new Date().toISOString(),
        revokedBy: currentUserId ?? undefined,
        text: null as any,
        imageUrl: undefined,
      }));
      try {
        const response = await revokeMessage(messageId);
        applyMessageUpdate(messageId, () => toChatMessage(response));
      } catch (err) {
        console.error('❌ Failed to revoke message:', err);
        loadMessages();
      }
    },
    [applyMessageUpdate, currentUserId, loadMessages],
  );

  const starMessageById = useCallback(
    async (messageId: string) => {
      applyMessageUpdate(messageId, (msg) => ({ ...msg, isStarred: true }));
      try {
        const response = await starMessage(messageId);
        applyMessageUpdate(messageId, () => toChatMessage(response));
      } catch (err) {
        console.error('❌ Failed to star message:', err);
        loadMessages();
      }
    },
    [applyMessageUpdate, loadMessages],
  );

  const sortedMessages = sortMessages(allMessages);

  return useMemo(
    () => ({
      messages: sortedMessages,
      loading,
      error,
      currentUserId,
      hasMore,
      sendMessage,
      reload: () => loadMessages(0),
      loadOlder,
      markConversationAsRead,
      reactToMessage,
      togglePinMessage,
      editMessageContent,
      deleteMessageById,
      revokeMessageById,
      starMessageById,
    }),
    [
      sortedMessages,
      loading,
      error,
      currentUserId,
      hasMore,
      sendMessage,
      loadMessages,
      loadOlder,
      markConversationAsRead,
      reactToMessage,
      togglePinMessage,
      editMessageContent,
      deleteMessageById,
      revokeMessageById,
      starMessageById,
    ],
  );
}
