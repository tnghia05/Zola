import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState, useRef } from "react";
import { getNotificationsApi, markNotificationsReadApi, respondFriendRequestApi } from "../api";
import { BellIcon } from "./Icons";
import "../styles/feed.css";
export const NotificationsDropdown = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [processingIds, setProcessingIds] = useState(new Set());
    const dropdownRef = useRef(null);
    useEffect(() => {
        loadNotifications();
        const interval = setInterval(loadNotifications, 30000); // Refresh every 30s
        return () => clearInterval(interval);
    }, []);
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);
    const loadNotifications = async () => {
        try {
            setIsLoading(true);
            const data = await getNotificationsApi(undefined, 20);
            setNotifications(data.items || []);
            const unread = (data.items || []).filter((n) => !n.isRead).length;
            setUnreadCount(unread);
        }
        catch (error) {
            console.error("Failed to load notifications:", error);
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleMarkRead = async (ids) => {
        try {
            await markNotificationsReadApi(ids);
            setNotifications((prev) => prev.map((n) => (ids.includes(n._id) ? { ...n, isRead: true } : n)));
            setUnreadCount((prev) => Math.max(0, prev - ids.length));
        }
        catch (error) {
            console.error("Failed to mark read:", error);
        }
    };
    const formatNotificationText = (notif) => {
        const actor = notif.actor?.name || "Ai đó";
        switch (notif.type) {
            case "POST_LIKED":
                return `${actor} đã thích bài viết của bạn`;
            case "POST_COMMENTED":
                return `${actor} đã bình luận bài viết của bạn`;
            case "FRIEND_REQUEST":
                return `${actor} đã gửi lời mời kết bạn`;
            case "FRIEND_ACCEPTED":
                return `${actor} đã chấp nhận lời mời kết bạn`;
            default:
                return notif.message || "Thông báo mới";
        }
    };
    const formatTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        if (minutes < 1)
            return "Vừa xong";
        if (minutes < 60)
            return `${minutes} phút trước`;
        if (hours < 24)
            return `${hours} giờ trước`;
        if (days < 7)
            return `${days} ngày trước`;
        return date.toLocaleDateString("vi-VN");
    };
    const handleRespondFriendRequest = async (notif, action) => {
        if (!notif.entityId) {
            console.error("No friendshipId in notification");
            return;
        }
        const friendshipId = notif.entityId;
        const processingKey = `${friendshipId}-${action}`;
        try {
            setProcessingIds((prev) => new Set(prev).add(processingKey));
            await respondFriendRequestApi(friendshipId, action);
            // Remove notification after successful response
            setNotifications((prev) => prev.filter((n) => n._id !== notif._id));
            setUnreadCount((prev) => Math.max(0, prev - 1));
            // Reload notifications to get updated state
            await loadNotifications();
        }
        catch (error) {
            console.error("Failed to respond to friend request:", error);
            alert(error?.response?.data?.error || error?.message || "Không thể xử lý yêu cầu kết bạn");
        }
        finally {
            setProcessingIds((prev) => {
                const next = new Set(prev);
                next.delete(processingKey);
                return next;
            });
        }
    };
    return (_jsxs("div", { className: "notifications-wrapper", ref: dropdownRef, children: [_jsxs("button", { className: "feed-icon-button notifications-button", onClick: () => setIsOpen(!isOpen), title: "Th\u00F4ng b\u00E1o", children: [_jsx(BellIcon, { size: 20, color: "currentColor" }), unreadCount > 0 && (_jsx("span", { className: "notifications-badge", children: unreadCount }))] }), isOpen && (_jsxs("div", { className: "notifications-dropdown", children: [_jsxs("div", { className: "notifications-header", children: [_jsx("h3", { children: "Th\u00F4ng b\u00E1o" }), unreadCount > 0 && (_jsx("button", { className: "notifications-mark-all-read", onClick: () => {
                                    const unreadIds = notifications
                                        .filter((n) => !n.isRead)
                                        .map((n) => n._id);
                                    if (unreadIds.length > 0)
                                        handleMarkRead(unreadIds);
                                }, children: "\u0110\u00E1nh d\u1EA5u t\u1EA5t c\u1EA3 \u0111\u00E3 \u0111\u1ECDc" }))] }), _jsxs("div", { className: "notifications-list", children: [isLoading && (_jsx("div", { style: { padding: 20, textAlign: "center" }, children: "\u0110ang t\u1EA3i..." })), !isLoading && notifications.length === 0 && (_jsx("div", { style: { padding: 20, textAlign: "center", opacity: 0.7 }, children: "Kh\u00F4ng c\u00F3 th\u00F4ng b\u00E1o n\u00E0o." })), notifications.map((notif) => {
                                const isFriendRequest = notif.type === "FRIEND_REQUEST";
                                const friendshipId = notif.entityId;
                                const isProcessingAccept = processingIds.has(`${friendshipId}-accept`);
                                const isProcessingDecline = processingIds.has(`${friendshipId}-decline`);
                                const isProcessing = isProcessingAccept || isProcessingDecline;
                                return (_jsxs("div", { className: `notification-item ${!notif.isRead ? "notification-item--unread" : ""}`, onClick: (e) => {
                                        // Don't mark as read if clicking on action buttons
                                        if (e.target.closest('.notification-actions')) {
                                            return;
                                        }
                                        if (!notif.isRead)
                                            handleMarkRead([notif._id]);
                                        // TODO: Navigate to post/profile
                                    }, children: [_jsx("div", { className: "notification-avatar", children: notif.actor?.avatar ? (_jsx("img", { src: notif.actor.avatar, alt: notif.actor.name })) : (_jsx("div", { className: "notification-avatar-initials", children: notif.actor?.name?.charAt(0)?.toUpperCase() || "U" })) }), _jsxs("div", { className: "notification-content", children: [_jsx("div", { className: "notification-text", children: formatNotificationText(notif) }), _jsx("div", { className: "notification-time", children: formatTime(notif.createdAt) }), isFriendRequest && friendshipId && (_jsxs("div", { className: "notification-actions", onClick: (e) => e.stopPropagation(), children: [_jsx("button", { className: "notification-action-btn notification-action-accept", onClick: () => handleRespondFriendRequest(notif, "accept"), disabled: isProcessing, children: isProcessingAccept ? "Đang xử lý..." : "Kết bạn" }), _jsx("button", { className: "notification-action-btn notification-action-decline", onClick: () => handleRespondFriendRequest(notif, "decline"), disabled: isProcessing, children: isProcessingDecline ? "Đang xử lý..." : "Từ chối" })] }))] }), !notif.isRead && _jsx("div", { className: "notification-dot" })] }, notif._id));
                            })] })] }))] }));
};
