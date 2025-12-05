import { useRouter, usePathname } from "next/navigation";
import "../styles/feed.css";

interface LeftSidebarProps {
  currentUser?: {
    _id: string;
    name: string;
    avatar?: string;
  } | null;
  activeRoute?: string;
}

export const LeftSidebar = ({ currentUser, activeRoute = "/feed" }: LeftSidebarProps) => {
  const router = useRouter();
  const pathname = usePathname();

  const navigate = (path: string) => {
    router.push(path);
  };

  const isActive = (path: string) =>
    pathname === path ||
    (path === "/feed" && (pathname === "/" || activeRoute === "/feed"));

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
        className={`feed-nav-item ${isActive("/feed") ? "feed-nav-item--active" : ""}`}
        onClick={() => navigate("/feed")}
      >
        <div className="feed-nav-icon">
          <svg width="24" height="24" viewBox="0 0 28 28" fill="currentColor">
            <path d="M25.825 12.29C25.824 12.289 25.823 12.288 25.821 12.286L15.027 2.937C14.752 2.675 14.392 2.527 13.989 2.521 13.608 2.527 13.248 2.675 13.001 2.912L2.175 12.29C1.756 12.658 1.629 13.245 1.868 13.759 2.079 14.215 2.567 14.479 3.069 14.479L5 14.479 5 23.729C5 24.695 5.784 25.479 6.75 25.479L11 25.479C11.552 25.479 12 25.031 12 24.479L12 18.309C12 18.126 12.148 17.979 12.33 17.979L15.67 17.979C15.852 17.979 16 18.126 16 18.309L16 24.479C16 25.031 16.448 25.479 17 25.479L21.25 25.479C22.217 25.479 23 24.695 23 23.729L23 14.479 24.931 14.479C25.433 14.479 25.921 14.215 26.132 13.759 26.371 13.245 26.244 12.658 25.825 12.29"></path>
          </svg>
        </div>
        <span>Bảng tin</span>
      </div>

      <div
        className={`feed-nav-item ${isActive("/conversations") ? "feed-nav-item--active" : ""}`}
        onClick={() => navigate("/conversations")}
      >
        <div className="feed-nav-icon">
          <svg width="24" height="24" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 0C4.477 0 0 4.145 0 9.25c0 2.9 1.434 5.483 3.675 7.184v3.316a.75.75 0 001.193.593l3.427-2.569a11.08 11.08 0 001.705.13c5.523 0 10-4.145 10-9.25S15.523 0 10 0zm1.061 12.44l-2.56-2.73-5.003 2.73 5.503-5.842 2.622 2.73 4.94-2.73-5.502 5.841z"></path>
          </svg>
        </div>
        <span>Tin nhắn</span>
      </div>

      <div
        className={`feed-nav-item ${isActive("/friends") ? "feed-nav-item--active" : ""}`}
        onClick={() => navigate("/friends")}
      >
        <div className="feed-nav-icon">
          <svg width="24" height="24" viewBox="0 0 28 28" fill="currentColor">
            <path d="M25.5 14C25.5 7.649 20.351 2.5 14 2.5 7.649 2.5 2.5 7.649 2.5 14 2.5 20.351 7.649 25.5 14 25.5 20.351 25.5 25.5 20.351 25.5 14ZM27 14C27 21.18 21.18 27 14 27 6.82 27 1 21.18 1 14 1 6.82 6.82 1 14 1 21.18 1 27 6.82 27 14ZM7.479 14 7.631 14C7.933 14 8.102 14.338 7.934 14.591 7.334 15.491 6.983 16.568 6.983 17.724L6.983 18.221C6.983 18.342 6.99 18.461 7.004 18.578 7.03 18.802 6.862 19 6.637 19L6.123 19C5.228 19 4.5 18.25 4.5 17.327 4.5 15.492 5.727 14 7.479 14ZM20.521 14C22.274 14 23.5 15.491 23.5 17.327 23.5 18.25 22.772 19 21.878 19L21.364 19C21.139 19 20.971 18.802 20.997 18.578 21.011 18.461 21.017 18.342 21.017 18.221L21.017 17.724C21.017 15.395 20.667 14.591 20.067 14.591 19.899 14.338 20.068 14 20.369 14L20.521 14ZM8.25 13C7.147 13 6.25 11.991 6.25 10.75 6.25 9.384 7.035 8.5 8.25 8.5 9.465 8.5 10.25 9.384 10.25 10.75 10.25 11.991 9.353 13 8.25 13ZM19.75 13C18.647 13 17.75 11.991 17.75 10.75 17.75 9.384 18.535 8.5 19.75 8.5 20.965 8.5 21.75 9.384 21.75 10.75 21.75 11.991 20.853 13 19.75 13ZM15.172 13.5C17.558 13.5 19.5 15.395 19.5 17.724L19.5 18.221C19.5 19.202 18.683 20 17.677 20L10.323 20C9.317 20 8.5 19.202 8.5 18.221L8.5 17.724C8.5 15.395 10.442 13.5 12.828 13.5L15.172 13.5ZM16.75 9.75C16.75 11.483 15.517 12.5 14 12.5 12.484 12.5 11.25 11.483 11.25 9.75 11.25 8.017 12.484 7 14 7 15.517 7 16.75 8.017 16.75 9.75Z"></path>
          </svg>
        </div>
        <span>Bạn bè</span>
      </div>

      <div
        className={`feed-nav-item ${isActive("/search") ? "feed-nav-item--active" : ""}`}
        onClick={() => navigate("/search")}
      >
        <div className="feed-nav-icon">
          <svg width="24" height="24" viewBox="0 0 28 28" fill="currentColor">
            <path d="M10.743 10.743a6 6 0 1 1-1.06-1.06l4.158 4.157a.75.75 0 1 1-1.06 1.061l-4.158-4.158zM11.5 6a5.5 5.5 0 1 0-11 0 5.5 5.5 0 0 0 11 0z"></path>
          </svg>
        </div>
        <span>Tìm kiếm</span>
      </div>

      <div
        className={`feed-nav-item ${isActive("/saved") ? "feed-nav-item--active" : ""}`}
        onClick={() => navigate("/saved")}
      >
        <div className="feed-nav-icon">
          <svg width="24" height="24" viewBox="0 0 28 28" fill="currentColor">
            <path d="M19.5 2.5h-11C7.567 2.5 6.75 3.317 6.75 4.25v19.5c0 .933.817 1.75 1.75 1.75h11c.933 0 1.75-.817 1.75-1.75V4.25c0-.933-.817-1.75-1.75-1.75zm0 21.25h-11V4.25h11v19.5zM14 18.5l-4.5-2.5V4.25h9v11.75L14 18.5z"></path>
          </svg>
        </div>
        <span>Bài viết đã lưu</span>
      </div>
    </>
  );
};


