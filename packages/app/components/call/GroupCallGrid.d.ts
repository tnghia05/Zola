import type { RemoteTrack } from 'livekit-client';
import '../../styles/group-call-grid.css';
interface ParticipantVideo {
    participantId: string;
    stream: MediaStream;
    name?: string;
    avatar?: string;
}
interface RemoteParticipantTracks {
    audioTrack?: RemoteTrack;
    videoTrack?: RemoteTrack;
}
interface GroupCallGridProps {
    participants: ParticipantVideo[];
    localStream: MediaStream | null;
    localParticipantId: string;
    remoteTracks?: Map<string, RemoteParticipantTracks>;
}
export declare function GroupCallGrid({ participants, localStream, localParticipantId, remoteTracks }: GroupCallGridProps): import("react/jsx-runtime").JSX.Element;
export {};
