import "../styles/feed.css";
interface LeftSidebarProps {
    currentUser?: {
        _id: string;
        name: string;
        avatar?: string;
    } | null;
    activeRoute?: string;
}
export declare const LeftSidebar: ({ currentUser, activeRoute }: LeftSidebarProps) => import("react/jsx-runtime").JSX.Element;
export {};
