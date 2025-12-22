import type { Message } from '../api';
export type ChatMessage = Message & {
    localId?: string;
    pending?: boolean;
    error?: string;
};
export interface SendMessagePayload {
    text?: string;
    imageUrl?: string;
    type?: 'text' | 'image' | 'file';
    file?: {
        url: string;
        name?: string;
        mime?: string;
        size?: number;
    };
    replyTo?: string;
}
export interface OpponentInfo {
    conversationId: string;
    userId?: string;
    name: string;
    avatar?: string;
    status?: string;
    lastSeen?: string;
}
export interface TypingUser {
    userId: string;
    name?: string;
}
