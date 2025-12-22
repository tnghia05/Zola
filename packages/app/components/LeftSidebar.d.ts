import "../styles/feed.css";
interface LeftSidebarProps {
    currentUser?: {
        _id: string;
        name: string;
        avatar?: string;
    } | null;
    activeRoute?: string;
}
/**
 * Left Navigation Sidebar
 *
 * Design: GLASSMORPHIC NAVIGATION PANEL
 * - Floating glass card with backdrop blur
 * - Smooth hover transitions with lateral slide
 * - Active state with gradient background
 */
export declare const LeftSidebar: ({ currentUser, activeRoute }: LeftSidebarProps) => import("react/jsx-runtime").JSX.Element;
export {};
