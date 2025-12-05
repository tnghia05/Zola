import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getCurrentUserId,
  getUserById,
  Post,
  reportPostApi,
} from "../api";
import { useSavedPosts } from "../hooks/useSocial";
import { FacebookNavbar } from "../components/FacebookNavbar";
import { PostCard } from "../components/PostCard";
import { ReportPostModal } from "../components/ReportPostModal";
import "../styles/feed.css";
import "../styles/facebook-navbar.css";

const SavedPosts = () => {
  const navigate = useNavigate();
  const {
    items,
    hasNext,
    isLoading,
    loadMore,
    unsave,
    reactionMap,
    selectReaction,
    clearReaction,
  } = useSavedPosts();
  const [currentUser, setCurrentUser] = useState<{
    _id: string;
    name: string;
    avatar?: string;
  } | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const [reportingPost, setReportingPost] = useState<Post | null>(null);
  const [isReporting, setIsReporting] = useState(false);

  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const userId = await getCurrentUserId();
        if (userId) {
          const user = await getUserById(userId);
          const mappedUser = {
            _id: user._id,
            name: user.name || user.email || "User",
            avatar: user.avatar,
          };
          setCurrentUser(mappedUser);
          (window as any).__currentUserId = mappedUser._id;
        }
      } catch (error) {
        console.error("Failed to load current user:", error);
      }
    };
    loadCurrentUser();
  }, []);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const onScroll = () => {
      if (!hasNext || isLoading) return;
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 200) {
        loadMore();
      }
    };
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, [hasNext, isLoading, loadMore]);

  const handleUnsave = async (postId: string) => {
    try {
      await unsave(postId);
    } catch (error: any) {
      window.alert(error?.response?.data?.error || "Không thể bỏ lưu bài viết.");
    }
  };

  const handleReportSubmit = async (payload: { reason: string; details?: string }) => {
    if (!reportingPost) return;
    setIsReporting(true);
    try {
      await reportPostApi(reportingPost._id, payload);
      window.alert("Đã gửi báo cáo.");
      setReportingPost(null);
    } catch (error: any) {
      window.alert(error?.response?.data?.error || "Không thể gửi báo cáo.");
    } finally {
      setIsReporting(false);
    }
  };

  return (
    <div className="feed-root">
      <FacebookNavbar currentUser={currentUser} />

      <div className="feed-main-layout">
        <div className="feed-inner">
          <aside className="feed-sidebar">
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
            <div className="feed-nav-item" onClick={() => navigate("/feed")}>
              <div className="feed-nav-icon">🏠</div>
              <span>Bảng tin</span>
            </div>
            <div className="feed-nav-item" onClick={() => navigate("/friends")}>
              <div className="feed-nav-icon">👥</div>
              <span>Bạn bè</span>
            </div>
            <div className="feed-nav-item" onClick={() => navigate("/search")}>
              <div className="feed-nav-icon">🔍</div>
              <span>Tìm kiếm</span>
            </div>
            <div className="feed-nav-item feed-nav-item--active">
              <div className="feed-nav-icon">🔖</div>
              <span>Bài viết đã lưu</span>
            </div>
          </aside>

          <main className="feed-center">
            <section className="saved-header">
              <h2>Bài viết đã lưu</h2>
              <p>Những bài viết bạn đã lưu sẽ xuất hiện tại đây.</p>
            </section>
            <section ref={listRef} style={{ paddingBottom: 24, flex: 1, minHeight: 0 }}>
              {items.map((post) => (
                <PostCard
                  key={post._id}
                  post={post}
                  reaction={reactionMap[post._id] || null}
                  onSelectReaction={(id, type) => selectReaction(id, type)}
                  onClearReaction={(id) => clearReaction(id)}
                  onUnsavePost={handleUnsave}
                  onReportPost={(p) => setReportingPost(p)}
                  isSaved
                />
              ))}
              {isLoading && (
                <div style={{ padding: 16, textAlign: "center" }}>
                  Đang tải...
                </div>
              )}
              {!isLoading && items.length === 0 && (
                <div style={{ padding: 16, textAlign: "center", opacity: 0.7 }}>
                  Bạn chưa lưu bài viết nào.
                </div>
              )}
            </section>
          </main>
        </div>
      </div>

      <ReportPostModal
        isOpen={!!reportingPost}
        post={reportingPost}
        onClose={() => setReportingPost(null)}
        onSubmit={handleReportSubmit}
        isSubmitting={isReporting}
      />
    </div>
  );
};

export default SavedPosts;

