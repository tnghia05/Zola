"use client";

import { useEffect, useRef, useState } from "react";
import { useFeed, useStories } from "../../hooks/useSocial";
import { useAnalytics } from "../../hooks/useAnalytics";
import { disconnectSocket } from "../../socket";
import {
  logout,
  setAuthToken,
  getCurrentUserId,
  getUserById,
  Post,
  getConversations,
  getFriends,
  getOnlineUsers,
} from "../../api";
import { AppLayout } from "../../components/AppLayout";
import { LeftSidebar } from "../../components/LeftSidebar.web";
import { RightSidebar } from "../../components/RightSidebar";
import { FacebookNavbarWeb } from "../../components/FacebookNavbar.web";
import { CreatePostModal } from "../../components/CreatePostModal";
import { CreateStoryModal } from "../../components/CreateStoryModal";
import { CreateReelModal } from "../../components/CreateReelModal";
import { ReportPostModal } from "../../components/ReportPostModal";
import { StoriesBar } from "../../components/StoriesBar";
import { StoryViewer, StoryPointer } from "../../components/StoryViewer";
import { PostCard } from "../../components/PostCard.web";
import { FloatingChatWindow } from "../../components/FloatingChatWindow";
import { MinimizedChatIcon } from "../../components/MinimizedChatIcon";
import { ChatWindowsProvider, useChatWindows } from "../../contexts/ChatWindowsContext";
import { ReelIcon } from "../../components/Icons";
import "../../styles/feed.css";

const FeedScreenContent = () => {
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
  const [draft, setDraft] = useState("");
  const [contacts, setContacts] = useState<{
    _id: string;
    name: string;
    avatar?: string;
    isOnline?: boolean;
    lastActive?: string;
  }[]>([]);
  const [groupChats, setGroupChats] = useState<{
    _id: string;
    name: string;
    avatar?: string;
    lastActive?: string;
  }[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(true);
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);
  const [isCreateStoryModalOpen, setIsCreateStoryModalOpen] = useState(false);
  const [isCreateReelModalOpen, setIsCreateReelModalOpen] = useState(false);
  const [viewerState, setViewerState] = useState<StoryPointer | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const [reportingPost, setReportingPost] = useState<Post | null>(null);
  const [isReporting, setIsReporting] = useState(false);
  const [currentUser, setCurrentUser] = useState<{
    _id: string;
    name: string;
    avatar?: string;
  } | null>(null);

  // Load current user for navbar & create post
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

  // Load contacts (friends) and group chats for sidebar
  useEffect(() => {
    const loadContactsAndChats = async () => {
      setIsLoadingContacts(true);
      try {
        // Load friends list
        const friendsData = await getFriends();
        const friendIds = friendsData.friendIds || [];
        
        // Load friend profiles
        const friendProfiles = await Promise.all(
          friendIds.slice(0, 20).map(async (id) => {
            try {
              const user = await getUserById(id);
              return {
                _id: user._id,
                name: user.name || user.email || "User",
                avatar: user.avatar,
              };
            } catch {
              return null;
            }
          })
        );
        
        // Get online status
        const validFriends = friendProfiles.filter(Boolean) as typeof contacts;
        if (validFriends.length > 0) {
          try {
            const onlineData = await getOnlineUsers(validFriends.map(f => f._id));
            const statusMap = onlineData.statusMap || {};
            
            const contactsWithStatus = validFriends.map(friend => {
              const status = statusMap[friend._id];
              return {
                ...friend,
                isOnline: status?.onlineStatus === "online",
                lastActive: status?.lastSeen 
                  ? formatLastActive(new Date(status.lastSeen))
                  : undefined,
              };
            });
            // Sort: online first, then by name
            contactsWithStatus.sort((a, b) => {
              if (a.isOnline && !b.isOnline) return -1;
              if (!a.isOnline && b.isOnline) return 1;
              return a.name.localeCompare(b.name);
            });
            setContacts(contactsWithStatus);
          } catch {
            setContacts(validFriends);
          }
        }
        
        // Load conversations (groups only)
        const conversations = await getConversations();
        const groups = conversations
          .filter((c: any) => c.isGroup)
          .map((c: any) => ({
            _id: c._id,
            name: c.title || "Nhóm chat",
            avatar: c.avatar,
            lastActive: c.lastMessage?.createdAt 
              ? formatLastActive(new Date(c.lastMessage.createdAt))
              : undefined,
          }));
        setGroupChats(groups);
      } catch (error) {
        console.error("Failed to load contacts/chats:", error);
      } finally {
        setIsLoadingContacts(false);
      }
    };
    
    loadContactsAndChats();
  }, []);

  // Helper to format last active time
  const formatLastActive = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString("vi-VN");
  };

  // Infinite scroll with window scroll (like desktop)
  useEffect(() => {
    const onScroll = () => {
      if (!hasNext || isLoading) return;
      const scrollPosition = window.innerHeight + window.scrollY;
      const threshold = document.documentElement.scrollHeight - 200;
      if (scrollPosition >= threshold) {
        loadMore();
      }
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [hasNext, isLoading, loadMore]);

  // Reset story viewer if stories list changes
  useEffect(() => {
    if (!viewerState) return;
    const group = stories[viewerState.groupIndex];
    if (!group || !group.stories[viewerState.storyIndex]) {
      setViewerState(null);
    }
  }, [stories, viewerState]);

  const handleCreatePost = async (content: string, media: any[], visibility?: "PUBLIC" | "FRIENDS" | "ONLY_ME", taggedUsers?: string[]) => {
    await createPost(content, media, visibility, taggedUsers);
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
      const token = window.localStorage.getItem("auth_token");
      if (token) {
        await logout(token);
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      window.localStorage.removeItem("auth_token");
      window.localStorage.removeItem("user_id");
      window.localStorage.removeItem("user_data");
      setAuthToken();
      disconnectSocket();
      window.location.href = "/login";
    }
  };

  const { chatWindows, openChat, closeChat, minimizeChat, restoreChat, minimizedChats } = useChatWindows();

  const handleContactClick = (userId: string) => {
    // Find contact info
    const contact = contacts.find((c) => c._id === userId);
    if (contact) {
      openChat(userId, contact.name, contact.avatar, contact.isOnline);
    } else {
      // Fallback: try to get user info
      getUserById(userId)
        .then((user) => {
          openChat(userId, user.name || user.email || "User", user.avatar);
        })
        .catch(() => {
          openChat(userId, "User");
        });
    }
  };

  const handleGroupClick = (groupId: string) => {
    // Navigate to group chat
    window.location.href = `/chat?conversationId=${groupId}`;
  };

  const handleCreateGroup = () => {
    // Navigate to create group or open modal
    window.location.href = "/chat?newGroup=true";
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

  const header = <FacebookNavbarWeb currentUser={currentUser} onLogout={handleLogout} />;
  const leftSidebar = <LeftSidebar currentUser={currentUser} activeRoute="/feed" />;
  const rightSidebar = (
    <RightSidebar
      contacts={contacts}
      groupChats={groupChats}
      isLoading={isLoadingContacts}
      onContactClick={handleContactClick}
      onGroupClick={handleGroupClick}
      onCreateGroup={handleCreateGroup}
    />
  );

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
        <div style={{ display: "flex", gap: "8px", padding: "8px 16px", borderTop: "1px solid #3a3b3c" }}>
          <button
            onClick={() => setIsCreateReelModalOpen(true)}
            style={{
              flex: 1,
              padding: "8px",
              background: "transparent",
              border: "none",
              color: "#e4e6eb",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#3a3b3c")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <ReelIcon size={20} color="#f02849" />
            <span>Reel</span>
          </button>
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
      <CreateReelModal
        isOpen={isCreateReelModalOpen}
        onClose={() => setIsCreateReelModalOpen(false)}
        onSubmit={async () => {
          // Refresh feed or navigate to reels page
          window.location.href = "/reels";
        }}
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

      {/* Floating Chat Windows */}
      {chatWindows
        .filter((chat) => !minimizedChats.has(chat.userId))
        .map((chat) => (
          <FloatingChatWindow
            key={chat.id}
            userId={chat.userId}
            userName={chat.userName}
            userAvatar={chat.userAvatar}
            isOnline={chat.isOnline}
            onClose={() => closeChat(chat.userId)}
            onMinimize={() => minimizeChat(chat.userId)}
          />
        ))}

      {/* Minimized Chat Icons */}
      {Array.from(minimizedChats).map((userId, index) => {
        const chat = chatWindows.find((w) => w.userId === userId);
        if (!chat) return null;
        return (
          <MinimizedChatIcon
            key={`minimized-${chat.id}`}
            userId={chat.userId}
            userName={chat.userName}
            userAvatar={chat.userAvatar}
            isOnline={chat.isOnline}
            onClick={() => {
              // Restore chat window by removing from minimized
              restoreChat(userId);
            }}
            index={index}
          />
        );
      })}
    </>
  );
};

const FeedScreen = () => {
  return (
    <ChatWindowsProvider>
      <FeedScreenContent />
    </ChatWindowsProvider>
  );
};

export default FeedScreen;


