import { ChatMessage } from '../../../types/chat';
interface MessageListProps {
    messages: ChatMessage[];
    currentUserId: string | null;
    loading?: boolean;
    hasMore?: boolean;
    opponentName?: string;
    opponentAvatar?: string;
    onReply?: (message: ChatMessage) => void;
    onLoadMore?: () => void;
    onReact?: (messageId: string, emoji: string) => void;
    onTogglePin?: (messageId: string, shouldPin: boolean) => void;
    onScrollToMessage?: (messageId: string) => void;
    focusMessageId?: string | null;
    onFocusHandled?: () => void;
    onEdit?: (message: ChatMessage) => void;
    onDelete?: (message: ChatMessage) => void;
    onForward?: (message: ChatMessage) => void;
    onStar?: (message: ChatMessage) => void;
    onRevoke?: (message: ChatMessage) => void;
}
export declare function MessageList({ messages, currentUserId, loading, hasMore, opponentName, opponentAvatar, onReply, onLoadMore, onReact, onTogglePin, onScrollToMessage, focusMessageId, onFocusHandled, onEdit, onDelete, onForward, onStar, onRevoke, }: MessageListProps): import("react/jsx-runtime").JSX.Element;
export {};
