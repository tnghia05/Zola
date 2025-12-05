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
export const AppLayout = ({
  children,
  leftSidebar,
  rightSidebar,
  header,
  hideSidebars = false,
}: AppLayoutProps) => {
  // Web monorepo không dùng react-router-dom, nên để logic ẩn sidebar
  // cho từng page quyết định qua prop hideSidebars.
  const shouldHideSidebars = hideSidebars;

  return (
    <div className="feed-root">
      {header}

      <div className="feed-main-layout">
        <div className={`feed-inner ${shouldHideSidebars ? 'feed-inner--full-width' : ''}`}>
          {/* Left Sidebar - Conditionally rendered */}
          {!shouldHideSidebars && leftSidebar && (
            <aside className="feed-sidebar feed-sidebar--left">
              {leftSidebar}
            </aside>
          )}

          {/* Main Content - Expands to full width when sidebars hidden */}
          <main className={`feed-center ${shouldHideSidebars ? 'feed-center--full-width' : ''}`}>
            {children}
          </main>

          {/* Right Sidebar - Conditionally rendered */}
          {!shouldHideSidebars && rightSidebar && (
            <aside className="feed-right feed-right--sidebar">
              {rightSidebar}
            </aside>
          )}
        </div>
      </div>
    </div>
  );
};
