import type { Socket } from 'socket.io-client';
import type { Message } from '../api';
interface ChatSocketHandlers {
    onMessageCreated?: (message: Message) => void;
    onMessageUpdated?: (message: Message) => void;
    onMessageDeleted?: (messageId: string) => void;
    onMessagePinned?: (data: {
        messageId: string;
        action: 'pin' | 'unpin';
    }) => void;
    onMessageReaction?: (data: {
        messageId: string;
        action: 'add' | 'remove';
        reaction?: {
            emoji: string;
            userId: string;
            createdAt?: string;
        };
    }) => void;
    onMessageRevoked?: (data: {
        messageId: string;
        conversationId?: string;
        revokedBy?: string;
        revokedAt?: string;
    }) => void;
    onMessageRead?: (data: {
        messageId: string;
        conversationId?: string;
        userId: string;
        readAt?: string;
    }) => void;
    onTypingStarted?: (userId: string) => void;
    onTypingStopped?: (userId: string) => void;
}
export declare function registerChatSocket(socket: Socket | null, conversationId: string, handlers: ChatSocketHandlers): () => void;
export {};
