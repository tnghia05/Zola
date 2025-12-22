export declare class CallPopupManager {
    private callWindow;
    private callUrl;
    constructor();
    private isElectron;
    openCallWindow(callId: string, conversationId: string, isIncoming?: boolean, options?: {
        callType?: 'p2p' | 'sfu';
        livekitRoomName?: string;
    }): (Window & typeof globalThis) | null;
    closeCallWindow(): void;
    private endCall;
}
