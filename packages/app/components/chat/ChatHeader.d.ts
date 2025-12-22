import { ReactNode } from 'react';
interface ActiveCallInfo {
    id: string;
    type: 'video' | 'audio';
    callType: 'p2p' | 'sfu';
    livekitRoomName?: string;
}
interface ChatHeaderProps {
    title: string;
    subtitle?: string;
    avatar?: string;
    statusDotColor?: string;
    actions?: ReactNode;
    onVideoCall?: () => void;
    onAudioCall?: () => void;
    onToggleInfo?: () => void;
    isInfoVisible?: boolean;
    activeCall?: ActiveCallInfo | null;
    onJoinCall?: (callId: string, callType: string, livekitRoomName?: string) => void;
}
export declare function ChatHeader({ title, subtitle, avatar, statusDotColor, actions, onVideoCall, onAudioCall, onToggleInfo, isInfoVisible, activeCall, onJoinCall, }: ChatHeaderProps): import("react/jsx-runtime").JSX.Element;
export {};
