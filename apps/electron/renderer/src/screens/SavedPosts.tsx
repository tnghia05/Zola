import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getCurrentUserId,
  getUserById,
  Post,
  ReactionType,
  SavedPost,
  reportPostApi,
} from "@zola/app/api";
import { useSavedPosts } from "@zola/app/hooks/useSocial";
import { AppLayout } from "@zola/app/components/AppLayout";
import { FacebookNavbarWeb } from "@zola/app/components/FacebookNavbar.web";
import { PostCard } from "@zola/app/components/PostCard.web";
import { ReportPostModal } from "@zola/app/components/ReportPostModal";
import "@zola/app/styles/feed.css";
import "@zola/app/styles/facebook-navbar.css";

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

  const header = (
    <FacebookNavbarWeb
      currentUser={currentUser}
      onLogout={() => {
        if (typeof window !== "undefined") {
          localStorage.removeItem("auth_token");
          localStorage.removeItem("user_id");
          navigate("/login");
        }
      }}
    />
  );

  return (
    <>
      <AppLayout header={header} hideSidebars={true}>
        <div className="feed-root">
          <section className="saved-header" style={{ padding: "20px", borderBottom: "1px solid #3a3b3c" }}>
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Bài viết đã lưu</h2>
            <p style={{ color: "#b0b3b8" }}>Những bài viết bạn đã lưu sẽ xuất hiện tại đây.</p>
          </section>
          <section ref={listRef} style={{ padding: "20px", flex: 1, minHeight: 0 }}>
            {items.map((saved: SavedPost) => {
              const post = saved.post as Post;
              return (
              <PostCard
                  key={post._id}
                  post={post}
                  reaction={reactionMap[post._id] || null}
                  onSelectReaction={(id: string, type: ReactionType) => selectReaction(id, type)}
                  onClearReaction={(id: string) => clearReaction(id)}
                  onUnsavePost={handleUnsave}
                  onReportPost={(p: Post) => setReportingPost(p)}
                  isSaved
                />
              );
            })}
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
        </div>
      </AppLayout>

      <ReportPostModal
        isOpen={!!reportingPost}
        post={reportingPost}
        onClose={() => setReportingPost(null)}
        onSubmit={handleReportSubmit}
        isSubmitting={isReporting}
      />
    </>
  );
};

export default SavedPosts;

