import { ChatMessage, SendMessagePayload } from '../types/chat';
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
export declare function useChatMessages(conversationId?: string): UseChatMessagesResult;
export {};
