import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// @ts-nocheck
import { useNavigate } from "react-router-dom";
import { HomeIcon, MessengerIcon, FriendsIcon, SearchIcon, BookmarkIcon } from "./Icons";
import "../styles/feed.css";
/**
 * Left Navigation Sidebar
 *
 * Design: GLASSMORPHIC NAVIGATION PANEL
 * - Floating glass card with backdrop blur
 * - Smooth hover transitions with lateral slide
 * - Active state with gradient background
 */
export const LeftSidebar = ({ currentUser, activeRoute = "/" }) => {
    const navigate = useNavigate();
    return (_jsxs(_Fragment, { children: [currentUser && (_jsxs("div", { className: "feed-nav-item feed-nav-item--user", onClick: () => navigate(`/profile/${currentUser._id}`), children: [_jsx("div", { className: "feed-nav-avatar", children: currentUser.avatar ? (_jsx("img", { src: currentUser.avatar, alt: currentUser.name })) : (_jsx("div", { className: "feed-nav-avatar-initials", children: currentUser.name?.charAt(0)?.toUpperCase() || "U" })) }), _jsx("span", { className: "feed-nav-user-name", children: currentUser.name })] })), _jsx("div", { className: "feed-nav-section-title", children: "Menu" }), _jsxs("div", { className: `feed-nav-item ${activeRoute === "/" || activeRoute === "/feed" ? "feed-nav-item--active" : ""}`, onClick: () => navigate("/feed"), children: [_jsx("div", { className: "feed-nav-icon", children: _jsx(HomeIcon, { size: 24, color: "currentColor" }) }), _jsx("span", { children: "B\u1EA3ng tin" })] }), _jsxs("div", { className: `feed-nav-item ${activeRoute === "/conversations" ? "feed-nav-item--active" : ""}`, onClick: () => navigate("/conversations"), children: [_jsx("div", { className: "feed-nav-icon", children: _jsx(MessengerIcon, { size: 24, color: "currentColor" }) }), _jsx("span", { children: "Tin nh\u1EAFn" })] }), _jsxs("div", { className: `feed-nav-item ${activeRoute === "/friends" ? "feed-nav-item--active" : ""}`, onClick: () => navigate("/friends"), children: [_jsx("div", { className: "feed-nav-icon", children: _jsx(FriendsIcon, { size: 24, color: "currentColor" }) }), _jsx("span", { children: "B\u1EA1n b\u00E8" })] }), _jsxs("div", { className: `feed-nav-item ${activeRoute === "/search" ? "feed-nav-item--active" : ""}`, onClick: () => navigate("/search"), children: [_jsx("div", { className: "feed-nav-icon", children: _jsx(SearchIcon, { size: 24, color: "currentColor" }) }), _jsx("span", { children: "T\u00ECm ki\u1EBFm" })] }), _jsxs("div", { className: `feed-nav-item ${activeRoute === "/saved" ? "feed-nav-item--active" : ""}`, onClick: () => navigate("/saved"), children: [_jsx("div", { className: "feed-nav-icon", children: _jsx(BookmarkIcon, { size: 24, color: "currentColor" }) }), _jsx("span", { children: "B\u00E0i vi\u1EBFt \u0111\u00E3 l\u01B0u" })] })] }));
};
