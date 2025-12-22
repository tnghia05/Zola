export interface CallHistoryRecord {
    callId: string;
    conversationId: string;
    callerId: string;
    callerName: string;
    callType: 'video' | 'audio';
    duration: number;
    startTime: Date;
    endTime: Date;
    status: 'answered' | 'missed' | 'declined';
}
export declare class CallHistoryService {
    private static readonly STORAGE_KEY;
    static saveCall(call: CallHistoryRecord): Promise<void>;
    static getCallHistory(): Promise<CallHistoryRecord[]>;
    static getCallHistoryByConversation(conversationId: string): Promise<CallHistoryRecord[]>;
    static clearCallHistory(): Promise<void>;
    static updateCallStatus(callId: string, status: 'answered' | 'missed' | 'declined', duration?: number): Promise<void>;
}
