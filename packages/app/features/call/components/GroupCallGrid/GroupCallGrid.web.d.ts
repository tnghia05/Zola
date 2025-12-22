import '../../styles/group-call-grid.css';
interface ParticipantVideo {
    participantId: string;
    stream: MediaStream;
    name?: string;
    avatar?: string;
}
interface GroupCallGridProps {
    participants: ParticipantVideo[];
    localStream: MediaStream | null;
    localParticipantId: string;
}
export declare function GroupCallGrid({ participants, localStream, localParticipantId }: GroupCallGridProps): import("react/jsx-runtime").JSX.Element;
export {};
