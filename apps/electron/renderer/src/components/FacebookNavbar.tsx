import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { NotificationsDropdown } from "./NotificationsDropdown";
import { disconnectSocket } from "../socket";
import { logout, setAuthToken } from "../api";

interface FacebookNavbarProps {
  currentUser?: {
    _id: string;
    name: string;
    avatar?: string;
  } | null;
}

/**
 * Facebook Desktop Header Design
 *
 * Design Philosophy: STRICT FACEBOOK DESKTOP CLONE
 * - Fixed 56px height header
 * - Dark theme (#242526 surface color)
 * - 3-section layout: Left (Logo + Search), Center (Navigation), Right (Actions + Profile)
 * - Clean, minimalist aesthetic matching Facebook's desktop interface
 */
export const FacebookNavbar = ({ currentUser }: FacebookNavbarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      if (token) {
        await logout(token);
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user_id");
      localStorage.removeItem("user_data");
      setAuthToken();
      disconnectSocket();
      window.location.href = "/login";
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="fb-navbar">
      {/* LEFT SECTION - Logo & Search */}
      <div className="fb-navbar-left">
        {/* Logo - Gradient Circle */}
        <div
          className="fb-logo"
          onClick={() => navigate("/feed")}
          role="button"
          tabIndex={0}
        >
          <span className="fb-logo-text">D</span>
        </div>

        {/* Search Bar - Hidden on mobile, visible on xl */}
        <form onSubmit={handleSearch} className="fb-search-wrapper">
          <svg
            className="fb-search-icon"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="currentColor"
          >
            <path d="M10.743 10.743a6 6 0 1 1-1.06-1.06l4.158 4.157a.75.75 0 1 1-1.06 1.061l-4.158-4.158zM11.5 6a5.5 5.5 0 1 0-11 0 5.5 5.5 0 0 0 11 0z" />
          </svg>
          <input
            type="text"
            className="fb-search-input"
            placeholder="Search Facebook"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>
      </div>

      {/* CENTER SECTION - Navigation Tabs */}
      <div className="fb-navbar-center">
        <button
          className={`fb-nav-tab ${isActive("/feed") || isActive("/") ? "fb-nav-tab--active" : ""}`}
          onClick={() => navigate("/feed")}
          title="Home"
        >
          <svg width="28" height="28" viewBox="0 0 28 28" fill="currentColor">
            <path d="M25.825 12.29C25.824 12.289 25.823 12.288 25.821 12.286L15.027 2.937C14.752 2.675 14.392 2.527 13.989 2.521 13.608 2.527 13.248 2.675 13.001 2.912L2.175 12.29C1.756 12.658 1.629 13.245 1.868 13.759 2.079 14.215 2.567 14.479 3.069 14.479L5 14.479 5 23.729C5 24.695 5.784 25.479 6.75 25.479L11 25.479C11.552 25.479 12 25.031 12 24.479L12 18.309C12 18.126 12.148 17.979 12.33 17.979L15.67 17.979C15.852 17.979 16 18.126 16 18.309L16 24.479C16 25.031 16.448 25.479 17 25.479L21.25 25.479C22.217 25.479 23 24.695 23 23.729L23 14.479 24.931 14.479C25.433 14.479 25.921 14.215 26.132 13.759 26.371 13.245 26.244 12.658 25.825 12.29"></path>
          </svg>
        </button>

        <button
          className={`fb-nav-tab ${isActive("/reels") || isActive("/video") ? "fb-nav-tab--active" : ""}`}
          onClick={() => navigate("/reels")}
          title="Video"
          aria-label="Video"
        >
          <svg width="28" height="28" viewBox="0 0 28 28" fill="currentColor">
            <path d="M8.75 25.25C8.336 25.25 8 24.914 8 24.5 8 24.086 8.336 23.75 8.75 23.75L19.25 23.75C19.664 23.75 20 24.086 20 24.5 20 24.914 19.664 25.25 19.25 25.25L8.75 25.25ZM17.163 12.846 12.055 15.923C11.591 16.202 11 15.869 11 15.327L11 9.172C11 8.631 11.591 8.297 12.055 8.576L17.163 11.654C17.612 11.924 17.612 12.575 17.163 12.846ZM21.75 20.25C22.992 20.25 24 19.242 24 18L24 6.5C24 5.258 22.992 4.25 21.75 4.25L6.25 4.25C5.008 4.25 4 5.258 4 6.5L4 18C4 19.242 5.008 20.25 6.25 20.25L21.75 20.25ZM21.75 21.75 6.25 21.75C4.179 21.75 2.5 20.071 2.5 18L2.5 6.5C2.5 4.429 4.179 2.75 6.25 2.75L21.75 2.75C23.821 2.75 25.5 4.429 25.5 6.5L25.5 18C25.5 20.071 23.821 21.75 21.75 21.75Z"></path>
          </svg>
        </button>

        <button
          className={`fb-nav-tab ${isActive("/saved") ? "fb-nav-tab--active" : ""}`}
          onClick={() => navigate("/saved")}
          title="Marketplace"
        >
          <svg width="28" height="28" viewBox="0 0 28 28" fill="currentColor">
            <path d="M17.5 23.979 21.25 23.979C21.386 23.979 21.5 23.864 21.5 23.729L21.5 13.979C21.5 13.427 21.949 13.979 22.5 13.979L24.33 13.979 14.017 4.046 3.672 13.979 5.5 13.979C6.052 13.979 5.5 13.427 5.5 13.979L5.5 23.729C5.5 23.864 5.615 23.979 5.75 23.979L9.5 23.979 9.5 17.729C9.5 16.66 10.364 15.979 11.5 15.979L15.5 15.979C16.636 15.979 17.5 16.66 17.5 17.729L17.5 23.979ZM21.25 25.479 17 25.479C16.448 25.479 16 25.031 16 24.479L16 18.329C16 18.135 15.844 17.979 15.65 17.979L11.35 17.979C11.156 17.979 11 18.135 11 18.329L11 24.479C11 25.031 10.552 25.479 10 25.479L5.75 25.479C4.784 25.479 4 24.695 4 23.729L4 15.479 2.5 15.479C1.817 15.479 1.265 14.782 1.408 14.113 1.464 13.853 1.596 13.611 1.792 13.417L13.768 1.92C14.001 1.69 14.322 1.562 14.655 1.562 14.988 1.562 15.309 1.69 15.541 1.92L27.518 13.417C27.714 13.611 27.846 13.853 27.902 14.113 28.045 14.782 27.493 15.479 26.81 15.479L25.5 15.479 25.5 23.729C25.5 24.695 24.716 25.479 23.75 25.479L21.25 25.479Z"></path>
          </svg>
        </button>

        <button
          className={`fb-nav-tab ${isActive("/friends") ? "fb-nav-tab--active" : ""}`}
          onClick={() => navigate("/friends")}
          title="Groups"
        >
          <svg width="28" height="28" viewBox="0 0 28 28" fill="currentColor">
            <path d="M25.5 14C25.5 7.649 20.351 2.5 14 2.5 7.649 2.5 2.5 7.649 2.5 14 2.5 20.351 7.649 25.5 14 25.5 20.351 25.5 25.5 20.351 25.5 14ZM27 14C27 21.18 21.18 27 14 27 6.82 27 1 21.18 1 14 1 6.82 6.82 1 14 1 21.18 1 27 6.82 27 14ZM7.479 14 7.631 14C7.933 14 8.102 14.338 7.934 14.591 7.334 15.491 6.983 16.568 6.983 17.724L6.983 18.221C6.983 18.342 6.99 18.461 7.004 18.578 7.03 18.802 6.862 19 6.637 19L6.123 19C5.228 19 4.5 18.25 4.5 17.327 4.5 15.492 5.727 14 7.479 14ZM20.521 14C22.274 14 23.5 15.491 23.5 17.327 23.5 18.25 22.772 19 21.878 19L21.364 19C21.139 19 20.971 18.802 20.997 18.578 21.011 18.461 21.017 18.342 21.017 18.221L21.017 17.724C21.017 16.568 20.667 15.491 20.067 14.591 19.899 14.338 20.068 14 20.369 14L20.521 14ZM8.25 13C7.147 13 6.25 11.991 6.25 10.75 6.25 9.384 7.035 8.5 8.25 8.5 9.465 8.5 10.25 9.384 10.25 10.75 10.25 11.991 9.353 13 8.25 13ZM19.75 13C18.647 13 17.75 11.991 17.75 10.75 17.75 9.384 18.535 8.5 19.75 8.5 20.965 8.5 21.75 9.384 21.75 10.75 21.75 11.991 20.853 13 19.75 13ZM15.172 13.5C17.558 13.5 19.5 15.395 19.5 17.724L19.5 18.221C19.5 19.202 18.683 20 17.677 20L10.323 20C9.317 20 8.5 19.202 8.5 18.221L8.5 17.724C8.5 15.395 10.442 13.5 12.828 13.5L15.172 13.5ZM16.75 9.75C16.75 11.483 15.517 12.5 14 12.5 12.484 12.5 11.25 11.483 11.25 9.75 11.25 8.017 12.484 7 14 7 15.517 7 16.75 8.017 16.75 9.75Z"></path>
          </svg>
        </button>

        <button
          className={`fb-nav-tab ${isActive("/settings") ? "fb-nav-tab--active" : ""}`}
          onClick={() => navigate("/settings")}
          title="Gaming"
        >
          <svg width="28" height="28" viewBox="0 0 28 28" fill="currentColor">
            <path d="M23.5 9.5H10.25a.75.75 0 00-.75.75v7c0 .414.336.75.75.75H17v5.5H4.5v-19h19v5zm0 14v-1.25a.75.75 0 00-.75-.75H18a.75.75 0 00-.75.75V24a1 1 0 001 1h4.5a1 1 0 001-1zM3.5 23.25v-19c0-1.079.914-2 2-2h17c1.079 0 2 .914 2 2v19c0 1.079-.914 2-2 2h-17c-1.079 0-2-.914-2-2z"></path>
          </svg>
        </button>
      </div>

      {/* RIGHT SECTION - Actions & Profile */}
      <div className="fb-navbar-right">
        {/* Menu Icon */}
        <button
          className="fb-icon-button"
          title="Menu"
          onClick={() => navigate("/settings")}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path d="M2.5 6.5a1 1 0 000 2h15a1 1 0 000-2h-15zm0 5a1 1 0 000 2h15a1 1 0 000-2h-15z"></path>
          </svg>
        </button>

        {/* Messenger Icon */}
        <button
          className="fb-icon-button"
          title="Messenger"
          onClick={() => navigate("/conversations")}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 0C4.477 0 0 4.145 0 9.25c0 2.9 1.434 5.483 3.675 7.184v3.316a.75.75 0 001.193.593l3.427-2.569a11.08 11.08 0 001.705.13c5.523 0 10-4.145 10-9.25S15.523 0 10 0zm1.061 12.44l-2.56-2.73-5.003 2.73 5.503-5.842 2.622 2.73 4.94-2.73-5.502 5.841z"></path>
          </svg>
        </button>

        {/* Notifications */}
        <div className="fb-notifications-wrapper">
          <NotificationsDropdown />
        </div>

        {/* Profile Menu */}
        <div className="fb-profile-menu">
          <button
            className="fb-profile-button"
            onClick={() => navigate("/profile")}
            title={currentUser?.name || "Profile"}
          >
            {currentUser?.avatar ? (
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="fb-profile-avatar"
              />
            ) : (
              <div className="fb-profile-avatar fb-profile-avatar-initials">
                {currentUser?.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
            )}
          </button>
        </div>

        {/* Logout Button */}
        <button
          className="fb-icon-button"
          title="Logout"
          onClick={handleLogout}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path d="M3 3a1 1 0 011-1h6a1 1 0 110 2H5v12h5a1 1 0 110 2H4a1 1 0 01-1-1V3zm11.293 3.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L15.586 11H9a1 1 0 110-2h6.586l-1.293-1.293a1 1 0 010-1.414z"></path>
          </svg>
        </button>
      </div>
    </header>
  );
};
