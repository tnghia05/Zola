import { TypingUser } from '../types/chat';
interface UseTypingStatusResult {
    typingUsers: TypingUser[];
    handleInputChange: (value: string) => void;
    notifyMessageSent: () => void;
}
export declare function useTypingStatus(conversationId?: string, selfUserId?: string): UseTypingStatusResult;
export {};
