interface DesktopChatProps {
    conversationId: string;
    conversationName?: string;
    isGroup?: boolean;
    groupAvatar?: string;
    groupMemberCount?: number;
    memberIds?: string[];
    onTypingStart?: () => void;
    onTypingStop?: () => void;
    onToggleInfo?: () => void;
    isInfoVisible?: boolean;
}
export declare function DesktopChat({ conversationId, conversationName, isGroup, groupAvatar, groupMemberCount, memberIds, onTypingStart, onTypingStop, onToggleInfo, isInfoVisible, }: DesktopChatProps): import("react/jsx-runtime").JSX.Element;
export {};
