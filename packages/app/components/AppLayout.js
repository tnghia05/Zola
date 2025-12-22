import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import "../styles/feed.css";
/**
 * Conditional Layout Component
 *
 * Design Philosophy: ADAPTIVE BRUTALISM
 * - On Feed: 3-column holy grail layout with glassmorphic sidebars
 * - On Profile: Full-width immersive experience, sidebars fade away
 * - Smooth transitions between states
 */
export const AppLayout = ({ children, leftSidebar, rightSidebar, header, hideSidebars = false, }) => {
    // Web monorepo không dùng react-router-dom, nên để logic ẩn sidebar
    // cho từng page quyết định qua prop hideSidebars.
    const shouldHideSidebars = hideSidebars;
    return (_jsxs("div", { className: "feed-root", children: [header, _jsx("div", { className: "feed-main-layout", children: _jsxs("div", { className: `feed-inner ${shouldHideSidebars ? 'feed-inner--full-width' : ''}`, children: [!shouldHideSidebars && leftSidebar && (_jsx("aside", { className: "feed-sidebar feed-sidebar--left", children: leftSidebar })), _jsx("main", { className: `feed-center ${shouldHideSidebars ? 'feed-center--full-width' : ''}`, children: children }), !shouldHideSidebars && rightSidebar && (_jsx("aside", { className: "feed-right feed-right--sidebar", children: rightSidebar }))] }) })] }));
};
