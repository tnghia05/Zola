"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createPortal } from "react-dom";
import "../styles/floating-chat.css";
export const MinimizedChatIcon = ({ userId, userName, userAvatar, isOnline, unreadCount = 0, onClick, index, }) => {
    return createPortal(_jsx("div", { className: "minimized-chat-icon", style: { bottom: `${20 + index * 64}px` }, onClick: onClick, title: userName, children: _jsxs("div", { className: "minimized-chat-avatar", children: [userAvatar ? (_jsx("img", { src: userAvatar, alt: userName })) : (_jsx("div", { className: "minimized-chat-avatar-fallback", children: userName?.charAt(0)?.toUpperCase() || "U" })), isOnline && _jsx("span", { className: "minimized-chat-online-dot" }), unreadCount > 0 && (_jsx("span", { className: "minimized-chat-badge", children: unreadCount > 9 ? "9+" : unreadCount }))] }) }), document.body);
};
