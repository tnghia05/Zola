import { ActiveCallResponse } from '../api';
type ActiveCall = ActiveCallResponse['activeCall'];
interface UseActiveCallResult {
    activeCall: ActiveCall;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}
export declare function useActiveCall(conversationId: string | undefined): UseActiveCallResult;
export {};
