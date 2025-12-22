import { ReactNode } from "react";
import "../styles/feed.css";
interface AppLayoutProps {
    children: ReactNode;
    leftSidebar?: ReactNode;
    rightSidebar?: ReactNode;
    header: ReactNode;
    hideSidebars?: boolean;
}
/**
 * Conditional Layout Component
 *
 * Design Philosophy: ADAPTIVE BRUTALISM
 * - On Feed: 3-column holy grail layout with glassmorphic sidebars
 * - On Profile: Full-width immersive experience, sidebars fade away
 * - Smooth transitions between states
 */
export declare const AppLayout: ({ children, leftSidebar, rightSidebar, header, hideSidebars, }: AppLayoutProps) => import("react/jsx-runtime").JSX.Element;
export {};
