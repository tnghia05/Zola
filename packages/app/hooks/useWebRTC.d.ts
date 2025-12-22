export type FilterType = 'none' | 'beauty' | 'warm' | 'cool' | 'party' | 'birthday';
interface UseWebRTCOptions {
    callId: string;
    conversationId: string;
    isInitiator: boolean;
    localUserId: string;
    remoteUserId: string;
    videoDeviceId?: string;
    audioDeviceId?: string;
}
interface UseWebRTCResult {
    localStream: MediaStream | null;
    remoteStream: MediaStream | null;
    isConnected: boolean;
    error: string | null;
    startCall: () => Promise<void>;
    endCall: () => void;
    toggleVideo: () => void;
    toggleAudio: () => void;
    isVideoEnabled: boolean;
    isAudioEnabled: boolean;
    applyFilter: (filter: FilterType) => Promise<void>;
    currentFilter: FilterType;
    startScreenShare: () => Promise<void>;
    stopScreenShare: () => Promise<void>;
    isScreenSharing: boolean;
    localVideoRef: React.RefObject<HTMLVideoElement | null>;
    remoteVideoRef: React.RefObject<HTMLVideoElement | null>;
}
export declare function useWebRTC({ callId, conversationId: _conversationId, isInitiator, localUserId: _localUserId, remoteUserId, videoDeviceId, audioDeviceId, }: UseWebRTCOptions): UseWebRTCResult;
export {};
