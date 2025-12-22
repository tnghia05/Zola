import { OpponentInfo } from '../types/chat';
interface UseOpponentInfoResult {
    info: OpponentInfo | null;
    loading: boolean;
    error: string | null;
    reload: () => Promise<void>;
}
export declare function useOpponentInfo(conversationId?: string): UseOpponentInfoResult;
export {};
