// @ts-nocheck
import React from "react";
import { useNavigate } from "react-router-dom";
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
export const LeftSidebar = ({ currentUser, activeRoute = "/" }: LeftSidebarProps) => {
  const navigate = useNavigate();

  return (
    <>
      {currentUser && (
        <div
          className="feed-nav-item feed-nav-item--user"
          onClick={() => navigate(`/profile/${currentUser._id}`)}
        >
          <div className="feed-nav-avatar">
            {currentUser.avatar ? (
              <img src={currentUser.avatar} alt={currentUser.name} />
            ) : (
              <div className="feed-nav-avatar-initials">
                {currentUser.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
            )}
          </div>
          <span className="feed-nav-user-name">{currentUser.name}</span>
        </div>
      )}

      <div className="feed-nav-section-title">Menu</div>

      <div
        className={`feed-nav-item ${activeRoute === "/" || activeRoute === "/feed" ? "feed-nav-item--active" : ""}`}
        onClick={() => navigate("/feed")}
      >
        <div className="feed-nav-icon">🏠</div>
        <span>Bảng tin</span>
      </div>

      <div
        className={`feed-nav-item ${activeRoute === "/conversations" ? "feed-nav-item--active" : ""}`}
        onClick={() => navigate("/conversations")}
      >
        <div className="feed-nav-icon">💬</div>
        <span>Tin nhắn</span>
      </div>

      <div
        className={`feed-nav-item ${activeRoute === "/friends" ? "feed-nav-item--active" : ""}`}
        onClick={() => navigate("/friends")}
      >
        <div className="feed-nav-icon">👥</div>
        <span>Bạn bè</span>
      </div>

      <div
        className={`feed-nav-item ${activeRoute === "/search" ? "feed-nav-item--active" : ""}`}
        onClick={() => navigate("/search")}
      >
        <div className="feed-nav-icon">🔍</div>
        <span>Tìm kiếm</span>
      </div>

      <div
        className={`feed-nav-item ${activeRoute === "/saved" ? "feed-nav-item--active" : ""}`}
        onClick={() => navigate("/saved")}
      >
        <div className="feed-nav-icon">🔖</div>
        <span>Bài viết đã lưu</span>
      </div>
    </>
  );
};
