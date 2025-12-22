import "../styles/feed.css";
interface Contact {
    _id: string;
    name: string;
    avatar?: string;
    isOnline?: boolean;
    lastActive?: string;
}
interface GroupChat {
    _id: string;
    name: string;
    avatar?: string;
    lastActive?: string;
}
interface RightSidebarProps {
    contacts?: Contact[];
    groupChats?: GroupChat[];
    isLoading?: boolean;
    onContactClick?: (userId: string) => void;
    onGroupClick?: (groupId: string) => void;
    onCreateGroup?: () => void;
}
/**
 * Right Sidebar - Contacts & Group Chats Panel
 *
 * Design: Facebook Messenger Style
 * - Contacts list with online status indicators
 * - Group chats section
 * - Dark theme with subtle hover effects
 */
export declare const RightSidebar: ({ contacts, groupChats, isLoading, onContactClick, onGroupClick, onCreateGroup, }: RightSidebarProps) => import("react/jsx-runtime").JSX.Element;
export {};
