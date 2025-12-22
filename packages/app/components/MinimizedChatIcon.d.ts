import "../styles/floating-chat.css";
interface MinimizedChatIconProps {
    userId: string;
    userName: string;
    userAvatar?: string;
    isOnline?: boolean;
    unreadCount?: number;
    onClick: () => void;
    index: number;
}
export declare const MinimizedChatIcon: ({ userId, userName, userAvatar, isOnline, unreadCount, onClick, index, }: MinimizedChatIconProps) => import("react").ReactPortal;
export {};
