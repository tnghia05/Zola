import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFeed, useStories, useFriendSuggestions } from "../hooks/useSocial";
import { useAnalytics } from "../hooks/useAnalytics";
import { disconnectSocket } from "../socket";
import {
  logout,
  setAuthToken,
  getCurrentUserId,
  getUserById,
  sendFriendRequestApi,
  Post,
} from "../api";
import { AppLayout } from "../components/AppLayout";
import { LeftSidebar } from "../components/LeftSidebar";
import { RightSidebar } from "../components/RightSidebar";
import { FacebookNavbar } from "../components/FacebookNavbar";
import { CreatePostModal } from "../components/CreatePostModal";
import { CreateStoryModal } from "../components/CreateStoryModal";
import { ReportPostModal } from "../components/ReportPostModal";
import { StoriesBar } from "../components/StoriesBar";
import { StoryViewer, StoryPointer } from "../components/StoryViewer";
import { PostCard } from "../components/PostCard";
import "../styles/feed.css";
import "../styles/facebook-navbar.css";

const Feed = () => {
  const navigate = useNavigate();
  const {
    items,
    hasNext,
    isLoading,
    createPost,
    loadMore,
    reactionMap,
    selectReaction,
    clearReaction,
    savePost,
    reportPost,
  } = useFeed();
  const { trackEvent } = useAnalytics();
  const {
    stories,
    isLoading: isLoadingStories,
    createStory,
    markStorySeen,
    deleteStory,
  } = useStories();
  const {
    items: friendSuggestions,
    isLoading: isLoadingSuggestions,
    reload: reloadSuggestions,
  } = useFriendSuggestions(5);
  const [draft, setDraft] = useState("");
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);
  const [isCreateStoryModalOpen, setIsCreateStoryModalOpen] = useState(false);
  const [viewerState, setViewerState] = useState<StoryPointer | null>(null);
  const [sentRequests, setSentRequests] = useState<Record<string, boolean>>({});
  const listRef = useRef<HTMLDivElement | null>(null);
  const [reportingPost, setReportingPost] = useState<Post | null>(null);
  const [isReporting, setIsReporting] = useState(false);
  const [currentUser, setCurrentUser] = useState<{
    _id: string;
    name: string;
    avatar?: string;
  } | null>(null);

  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const userId = await getCurrentUserId();
        if (userId) {
          const user = await getUserById(userId);
          const mapped = {
            _id: user._id,
            name: user.name || user.email || "User",
            avatar: user.avatar,
          };
          setCurrentUser(mapped);
          (window as any).__currentUserId = mapped._id;
        }
      } catch (error) {
        console.error("Failed to load current user:", error);
      }
    };
    loadCurrentUser();
  }, []);

  useEffect(() => {
    const onScroll = () => {
      if (!hasNext || isLoading) return;
      // Use window scroll instead of container scroll
      const scrollPosition = window.innerHeight + window.scrollY;
      const threshold = document.documentElement.scrollHeight - 200;
      if (scrollPosition >= threshold) {
        loadMore();
      }
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [hasNext, isLoading, loadMore]);

  useEffect(() => {
    if (!viewerState) return;
    const group = stories[viewerState.groupIndex];
    if (!group || !group.stories[viewerState.storyIndex]) {
      setViewerState(null);
    }
  }, [stories, viewerState]);

  const handleCreatePost = async (content: string, media: any[], visibility?: "PUBLIC" | "FRIENDS") => {
    await createPost(content, media, visibility);
  };

  const handleCreateStory = async (payload: {
    media: any[];
    caption?: string;
    visibility?: "FRIENDS" | "PUBLIC";
  }) => {
    await createStory(payload);
    setIsCreateStoryModalOpen(false);
  };

  const openStory = (groupIndex: number, storyIndex: number = 0) => {
    setViewerState({ groupIndex, storyIndex });
  };

  const computePointer = (
    pointer: StoryPointer,
    direction: 1 | -1
  ): StoryPointer | null => {
    let groupIndex = pointer.groupIndex;
    let storyIndex = pointer.storyIndex;
    while (true) {
      const group = stories[groupIndex];
      if (!group) return null;
      storyIndex += direction;
      if (storyIndex >= 0 && storyIndex < group.stories.length) {
        return { groupIndex, storyIndex };
      }
      groupIndex += direction;
      if (groupIndex < 0 || groupIndex >= stories.length) {
        return null;
      }
      const nextGroup = stories[groupIndex];
      if (!nextGroup || nextGroup.stories.length === 0) {
        storyIndex = direction > 0 ? -1 : nextGroup?.stories.length ?? 0;
        continue;
      }
      storyIndex = direction > 0 ? 0 : nextGroup.stories.length - 1;
      return { groupIndex, storyIndex };
    }
  };

  const goNextStory = () => {
    setViewerState((prev) => {
      if (!prev) return prev;
      const next = computePointer(prev, 1);
      return next ?? null;
    });
  };

  const goPrevStory = () => {
    setViewerState((prev) => {
      if (!prev) return prev;
      const prevPointer = computePointer(prev, -1);
      return prevPointer ?? null;
    });
  };

  const handleStoryDelete = async (storyId: string) => {
    await deleteStory(storyId);
    setViewerState(null);
  };

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

  const handleSendSuggestionRequest = async (targetId: string) => {
    try {
      await sendFriendRequestApi(targetId);
      setSentRequests((prev) => ({ ...prev, [targetId]: true }));
      trackEvent("FRIEND_SUGGESTION_CLICK", {
        targetUserId: targetId,
        action: "send_request",
      });
      reloadSuggestions();
    } catch (error: any) {
      alert(error?.response?.data?.error || "Không thể gửi lời mời");
    }
  };

  const handleSavePost = async (postId: string) => {
    try {
      await savePost(postId);
      window.alert("Đã lưu bài viết vào mục Lưu trữ.");
    } catch (error: any) {
      window.alert(error?.response?.data?.error || "Không thể lưu bài viết.");
    }
  };

  const handleReportSubmit = async (payload: { reason: string; details?: string }) => {
    if (!reportingPost) return;
    setIsReporting(true);
    try {
      await reportPost(reportingPost._id, payload);
      window.alert("Đã gửi báo cáo. Cảm ơn bạn!");
      setReportingPost(null);
    } catch (error: any) {
      window.alert(error?.response?.data?.error || "Không thể gửi báo cáo.");
    } finally {
      setIsReporting(false);
    }
  };

  // Header Component - Facebook Desktop Style
  const header = <FacebookNavbar currentUser={currentUser} />;

  // Left Sidebar Component
  const leftSidebar = (
    <LeftSidebar currentUser={currentUser} activeRoute="/feed" />
  );

  // Right Sidebar Component
  const rightSidebar = (
    <RightSidebar
      friendSuggestions={friendSuggestions}
      isLoading={isLoadingSuggestions}
      sentRequests={sentRequests}
      onSendRequest={handleSendSuggestionRequest}
    />
  );

  // Main Content
  const mainContent = (
    <>
      <StoriesBar
        currentUser={currentUser}
        groups={stories}
        loading={isLoadingStories}
        onCreateStory={() => setIsCreateStoryModalOpen(true)}
        onSelectStory={openStory}
      />

      {/* Create post */}
      <section className="feed-card">
        <div className="feed-create-header">
          {currentUser ? (
            <div className="feed-avatar-circle">
              {currentUser.avatar ? (
                <img src={currentUser.avatar} alt={currentUser.name} />
              ) : (
                <div className="feed-avatar-initials">
                  {currentUser.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
              )}
            </div>
          ) : (
            <div className="feed-avatar-circle">U</div>
          )}
          <input
            className="feed-create-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onFocus={() => setIsCreatePostModalOpen(true)}
            placeholder={currentUser ? `Nghĩ gì thế, ${currentUser.name}?` : "Nghĩ gì thế hôm nay?"}
          />
        </div>
      </section>

      {/* Posts */}
      <section
        ref={listRef}
        style={{ paddingBottom: 24, flex: 1, minHeight: 0 }}
      >
        {items.map((post) => (
          <PostCard
            key={post._id}
            post={post}
            reaction={reactionMap[post._id] || null}
            onSelectReaction={(id, type) => selectReaction(id, type)}
            onClearReaction={(id) => clearReaction(id)}
            onSavePost={handleSavePost}
            onReportPost={(p) => setReportingPost(p)}
          />
        ))}
        {isLoading && (
          <div style={{ padding: 16, textAlign: "center" }}>
            Đang tải...
          </div>
        )}
        {!isLoading && items.length === 0 && (
          <div style={{ padding: 16, textAlign: "center", opacity: 0.7 }}>
            Chưa có bài viết nào. Hãy là người đầu tiên đăng nhé!
          </div>
        )}
      </section>
    </>
  );

  return (
    <>
      <AppLayout
        header={header}
        leftSidebar={leftSidebar}
        rightSidebar={rightSidebar}
      >
        {mainContent}
      </AppLayout>

      <CreatePostModal
        isOpen={isCreatePostModalOpen}
        onClose={() => {
          setIsCreatePostModalOpen(false);
          setDraft("");
        }}
        onSubmit={handleCreatePost}
        currentUser={currentUser}
      />
      <CreateStoryModal
        isOpen={isCreateStoryModalOpen}
        onClose={() => setIsCreateStoryModalOpen(false)}
        onSubmit={handleCreateStory}
        currentUser={currentUser}
      />
      <StoryViewer
        groups={stories}
        state={viewerState}
        onClose={() => setViewerState(null)}
        onNext={goNextStory}
        onPrev={goPrevStory}
        onStorySeen={markStorySeen}
        onDeleteStory={handleStoryDelete}
        currentUserId={currentUser?._id}
      />
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

export default Feed;
