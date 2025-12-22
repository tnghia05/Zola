import { ChatMessage } from '../../../types/chat';
interface MessageContextMenuProps {
    message: ChatMessage;
    isOwn: boolean;
    onReply: (message: ChatMessage) => void;
    onCopy?: (message: ChatMessage) => void;
    onPinToggle?: (shouldPin: boolean) => void;
    onEdit?: () => void;
    onDelete?: () => void;
    onForward?: (message: ChatMessage) => void;
    onStar?: () => void;
    onRevoke?: () => void;
    anchorClassName?: string;
    style?: React.CSSProperties;
}
export declare const MessageContextMenu: import("react").ForwardRefExoticComponent<MessageContextMenuProps & import("react").RefAttributes<HTMLDivElement>>;
export {};
