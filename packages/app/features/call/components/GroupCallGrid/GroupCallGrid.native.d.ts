export type ParticipantVideo = {
    participantId: string;
    stream: MediaStream;
    isLocal?: boolean;
    label?: string;
};
type GroupCallGridProps = {
    participants: ParticipantVideo[];
};
export declare function GroupCallGrid({ participants }: GroupCallGridProps): import("react/jsx-runtime").JSX.Element;
export {};
