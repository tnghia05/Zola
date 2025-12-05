import { useEffect, useState, useRef } from "react";
import { getNotificationsApi, markNotificationsReadApi } from "../api";
import "../styles/feed.css";

export const NotificationsDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
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
      const unread = (data.items || []).filter((n: any) => !n.isRead).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error("Failed to load notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkRead = async (ids: string[]) => {
    try {
      await markNotificationsReadApi(ids);
      setNotifications((prev) =>
        prev.map((n) => (ids.includes(n._id) ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - ids.length));
    } catch (error) {
      console.error("Failed to mark read:", error);
    }
  };

  const formatNotificationText = (notif: any) => {
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

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Vừa xong";
    if (minutes < 60) return `${minutes} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    if (days < 7) return `${days} ngày trước`;
    return date.toLocaleDateString("vi-VN");
  };

  return (
    <div className="notifications-wrapper" ref={dropdownRef}>
      <button
        className="feed-icon-button notifications-button"
        onClick={() => setIsOpen(!isOpen)}
        title="Thông báo"
      >
        🔔
        {unreadCount > 0 && (
          <span className="notifications-badge">{unreadCount}</span>
        )}
      </button>
      {isOpen && (
        <div className="notifications-dropdown">
          <div className="notifications-header">
            <h3>Thông báo</h3>
            {unreadCount > 0 && (
              <button
                className="notifications-mark-all-read"
                onClick={() => {
                  const unreadIds = notifications
                    .filter((n) => !n.isRead)
                    .map((n) => n._id);
                  if (unreadIds.length > 0) handleMarkRead(unreadIds);
                }}
              >
                Đánh dấu tất cả đã đọc
              </button>
            )}
          </div>
          <div className="notifications-list">
            {isLoading && (
              <div style={{ padding: 20, textAlign: "center" }}>Đang tải...</div>
            )}
            {!isLoading && notifications.length === 0 && (
              <div style={{ padding: 20, textAlign: "center", opacity: 0.7 }}>
                Không có thông báo nào.
              </div>
            )}
            {notifications.map((notif) => (
              <div
                key={notif._id}
                className={`notification-item ${!notif.isRead ? "notification-item--unread" : ""}`}
                onClick={() => {
                  if (!notif.isRead) handleMarkRead([notif._id]);
                  // TODO: Navigate to post/profile
                }}
              >
                <div className="notification-avatar">
                  {notif.actor?.avatar ? (
                    <img src={notif.actor.avatar} alt={notif.actor.name} />
                  ) : (
                    <div className="notification-avatar-initials">
                      {notif.actor?.name?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                  )}
                </div>
                <div className="notification-content">
                  <div className="notification-text">
                    {formatNotificationText(notif)}
                  </div>
                  <div className="notification-time">
                    {formatTime(notif.createdAt)}
                  </div>
                </div>
                {!notif.isRead && <div className="notification-dot" />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

