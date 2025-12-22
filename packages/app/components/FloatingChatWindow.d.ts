import "../styles/floating-chat.css";
interface FloatingChatWindowProps {
    userId: string;
    userName: string;
    userAvatar?: string;
    isOnline?: boolean;
    onClose: () => void;
    onMinimize?: () => void;
}
export declare const FloatingChatWindow: ({ userId, userName, userAvatar, isOnline, onClose, onMinimize, }: FloatingChatWindowProps) => import("react").ReactPortal;
export {};
