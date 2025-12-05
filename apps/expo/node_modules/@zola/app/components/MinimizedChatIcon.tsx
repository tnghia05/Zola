"use client";

import { createPortal } from "react-dom";
import "../styles/floating-chat.css";

interface MinimizedChatIconProps {
  userId: string;
  userName: string;
  userAvatar?: string;
  isOnline?: boolean;
  unreadCount?: number;
  onClick: () => void;
  index: number; // For positioning multiple icons
}

export const MinimizedChatIcon = ({
  userId,
  userName,
  userAvatar,
  isOnline,
  unreadCount = 0,
  onClick,
  index,
}: MinimizedChatIconProps) => {
  return createPortal(
    <div
      className="minimized-chat-icon"
      style={{ bottom: `${20 + index * 64}px` }}
      onClick={onClick}
      title={userName}
    >
      <div className="minimized-chat-avatar">
        {userAvatar ? (
          <img src={userAvatar} alt={userName} />
        ) : (
          <div className="minimized-chat-avatar-fallback">
            {userName?.charAt(0)?.toUpperCase() || "U"}
          </div>
        )}
        {isOnline && <span className="minimized-chat-online-dot" />}
        {unreadCount > 0 && (
          <span className="minimized-chat-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>
        )}
      </div>
    </div>,
    document.body
  );
};

