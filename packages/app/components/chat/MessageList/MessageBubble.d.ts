import { ChatMessage } from '../../../types/chat';
interface MessageBubbleProps {
    message: ChatMessage;
    isOwn: boolean;
    senderName?: string;
    senderAvatar?: string;
    onReply?: (message: ChatMessage) => void;
    onReact?: (messageId: string, emoji: string) => void;
    onTogglePin?: (messageId: string, shouldPin: boolean) => void;
    onEdit?: (message: ChatMessage) => void;
    onDelete?: (message: ChatMessage) => void;
    onForward?: (message: ChatMessage) => void;
    onStar?: (message: ChatMessage) => void;
    onRevoke?: (message: ChatMessage) => void;
}
export declare function MessageBubble({ message, isOwn, senderName, senderAvatar, onReply, onReact, onTogglePin, onEdit, onDelete, onForward, onStar, onRevoke, }: MessageBubbleProps): import("react/jsx-runtime").JSX.Element;
export {};
