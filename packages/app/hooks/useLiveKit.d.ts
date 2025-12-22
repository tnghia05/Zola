import { Room, RemoteTrack } from 'livekit-client';
interface UseLiveKitOptions {
    roomName?: string;
    token?: string;
    url?: string;
    autoSubscribe?: boolean;
}
export interface RemoteParticipantTracks {
    audioTrack?: RemoteTrack;
    videoTrack?: RemoteTrack;
}
export interface UseLiveKitResult {
    room: Room | null;
    localStream: MediaStream | null;
    remoteStreams: Map<string, MediaStream>;
    remoteTracks: Map<string, RemoteParticipantTracks>;
    isConnected: boolean;
    error: string | null;
    connect: () => Promise<void>;
    disconnect: () => void;
    toggleVideo: () => void;
    toggleAudio: () => void;
    isVideoEnabled: boolean;
    isAudioEnabled: boolean;
}
export declare function useLiveKit({ roomName, token, url, autoSubscribe, }: UseLiveKitOptions): UseLiveKitResult;
export {};
