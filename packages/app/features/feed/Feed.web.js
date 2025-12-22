"use client";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
import { useFeed, useStories } from "../../hooks/useSocial";
import { useAnalytics } from "../../hooks/useAnalytics";
import { disconnectSocket } from "../../socket";
import { logout, setAuthToken, getCurrentUserId, getUserById, getConversations, getFriends, getOnlineUsers, } from "../../api";
import { AppLayout } from "../../components/AppLayout";
import { LeftSidebar } from "../../components/LeftSidebar.web";
import { RightSidebar } from "../../components/RightSidebar";
import { FacebookNavbarWeb } from "../../components/FacebookNavbar.web";
import { CreatePostModal } from "../../components/CreatePostModal";
import { CreateStoryModal } from "../../components/CreateStoryModal";
import { CreateReelModal } from "../../components/CreateReelModal";
import { ReportPostModal } from "../../components/ReportPostModal";
import { StoriesBar } from "../../components/StoriesBar";
import { StoryViewer } from "../../components/StoryViewer";
import { PostCard } from "../../components/PostCard.web";
import { FloatingChatWindow } from "../../components/FloatingChatWindow";
import { MinimizedChatIcon } from "../../components/MinimizedChatIcon";
import { ChatWindowsProvider, useChatWindows } from "../../contexts/ChatWindowsContext";
import { ReelIcon } from "../../components/Icons";
import "../../styles/feed.css";
const FeedScreenContent = () => {
    const { items, hasNext, isLoading, createPost, loadMore, reactionMap, selectReaction, clearReaction, savePost, reportPost, } = useFeed();
    const { trackEvent } = useAnalytics();
    const { stories, isLoading: isLoadingStories, createStory, markStorySeen, deleteStory, } = useStories();
    const [draft, setDraft] = useState("");
    const [contacts, setContacts] = useState([]);
    const [groupChats, setGroupChats] = useState([]);
    const [isLoadingContacts, setIsLoadingContacts] = useState(true);
    const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);
    const [isCreateStoryModalOpen, setIsCreateStoryModalOpen] = useState(false);
    const [isCreateReelModalOpen, setIsCreateReelModalOpen] = useState(false);
    const [viewerState, setViewerState] = useState(null);
    const listRef = useRef(null);
    const [reportingPost, setReportingPost] = useState(null);
    const [isReporting, setIsReporting] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
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
                    window.__currentUserId = mapped._id;
                }
            }
            catch (error) {
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
                const friendProfiles = await Promise.all(friendIds.slice(0, 20).map(async (id) => {
                    try {
                        const user = await getUserById(id);
                        return {
                            _id: user._id,
                            name: user.name || user.email || "User",
                            avatar: user.avatar,
                        };
                    }
                    catch {
                        return null;
                    }
                }));
                // Get online status
                const validFriends = friendProfiles.filter(Boolean);
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
                            if (a.isOnline && !b.isOnline)
                                return -1;
                            if (!a.isOnline && b.isOnline)
                                return 1;
                            return a.name.localeCompare(b.name);
                        });
                        setContacts(contactsWithStatus);
                    }
                    catch {
                        setContacts(validFriends);
                    }
                }
                // Load conversations (groups only)
                const conversations = await getConversations();
                const groups = conversations
                    .filter((c) => c.isGroup)
                    .map((c) => ({
                    _id: c._id,
                    name: c.title || "Nhóm chat",
                    avatar: c.avatar,
                    lastActive: c.lastMessage?.createdAt
                        ? formatLastActive(new Date(c.lastMessage.createdAt))
                        : undefined,
                }));
                setGroupChats(groups);
            }
            catch (error) {
                console.error("Failed to load contacts/chats:", error);
            }
            finally {
                setIsLoadingContacts(false);
            }
        };
        loadContactsAndChats();
    }, []);
    // Helper to format last active time
    const formatLastActive = (date) => {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        if (diffMins < 1)
            return "Vừa xong";
        if (diffMins < 60)
            return `${diffMins} phút trước`;
        if (diffHours < 24)
            return `${diffHours} giờ trước`;
        if (diffDays < 7)
            return `${diffDays} ngày trước`;
        return date.toLocaleDateString("vi-VN");
    };
    // Infinite scroll with window scroll (like desktop)
    useEffect(() => {
        const onScroll = () => {
            if (!hasNext || isLoading)
                return;
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
        if (!viewerState)
            return;
        const group = stories[viewerState.groupIndex];
        if (!group || !group.stories[viewerState.storyIndex]) {
            setViewerState(null);
        }
    }, [stories, viewerState]);
    const handleCreatePost = async (content, media, visibility, taggedUsers) => {
        await createPost(content, media, visibility, taggedUsers);
    };
    const handleCreateStory = async (payload) => {
        await createStory(payload);
        setIsCreateStoryModalOpen(false);
    };
    const openStory = (groupIndex, storyIndex = 0) => {
        setViewerState({ groupIndex, storyIndex });
    };
    const computePointer = (pointer, direction) => {
        let groupIndex = pointer.groupIndex;
        let storyIndex = pointer.storyIndex;
        while (true) {
            const group = stories[groupIndex];
            if (!group)
                return null;
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
            if (!prev)
                return prev;
            const next = computePointer(prev, 1);
            return next ?? null;
        });
    };
    const goPrevStory = () => {
        setViewerState((prev) => {
            if (!prev)
                return prev;
            const prevPointer = computePointer(prev, -1);
            return prevPointer ?? null;
        });
    };
    const handleStoryDelete = async (storyId) => {
        await deleteStory(storyId);
        setViewerState(null);
    };
    const handleLogout = async () => {
        try {
            const token = window.localStorage.getItem("auth_token");
            if (token) {
                await logout(token);
            }
        }
        catch (error) {
            console.error("Logout error:", error);
        }
        finally {
            window.localStorage.removeItem("auth_token");
            window.localStorage.removeItem("user_id");
            window.localStorage.removeItem("user_data");
            setAuthToken();
            disconnectSocket();
            window.location.href = "/login";
        }
    };
    const { chatWindows, openChat, closeChat, minimizeChat, restoreChat, minimizedChats } = useChatWindows();
    const handleContactClick = (userId) => {
        // Find contact info
        const contact = contacts.find((c) => c._id === userId);
        if (contact) {
            openChat(userId, contact.name, contact.avatar, contact.isOnline);
        }
        else {
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
    const handleGroupClick = (groupId) => {
        // Navigate to group chat
        window.location.href = `/chat?conversationId=${groupId}`;
    };
    const handleCreateGroup = () => {
        // Navigate to create group or open modal
        window.location.href = "/chat?newGroup=true";
    };
    const handleSavePost = async (postId) => {
        try {
            await savePost(postId);
            window.alert("Đã lưu bài viết vào mục Lưu trữ.");
        }
        catch (error) {
            window.alert(error?.response?.data?.error || "Không thể lưu bài viết.");
        }
    };
    const handleReportSubmit = async (payload) => {
        if (!reportingPost)
            return;
        setIsReporting(true);
        try {
            await reportPost(reportingPost._id, payload);
            window.alert("Đã gửi báo cáo. Cảm ơn bạn!");
            setReportingPost(null);
        }
        catch (error) {
            window.alert(error?.response?.data?.error || "Không thể gửi báo cáo.");
        }
        finally {
            setIsReporting(false);
        }
    };
    const header = _jsx(FacebookNavbarWeb, { currentUser: currentUser, onLogout: handleLogout });
    const leftSidebar = _jsx(LeftSidebar, { currentUser: currentUser, activeRoute: "/feed" });
    const rightSidebar = (_jsx(RightSidebar, { contacts: contacts, groupChats: groupChats, isLoading: isLoadingContacts, onContactClick: handleContactClick, onGroupClick: handleGroupClick, onCreateGroup: handleCreateGroup }));
    const mainContent = (_jsxs(_Fragment, { children: [_jsx(StoriesBar, { currentUser: currentUser, groups: stories, loading: isLoadingStories, onCreateStory: () => setIsCreateStoryModalOpen(true), onSelectStory: openStory }), _jsxs("section", { className: "feed-card", children: [_jsxs("div", { className: "feed-create-header", children: [currentUser ? (_jsx("div", { className: "feed-avatar-circle", children: currentUser.avatar ? (_jsx("img", { src: currentUser.avatar, alt: currentUser.name })) : (_jsx("div", { className: "feed-avatar-initials", children: currentUser.name?.charAt(0)?.toUpperCase() || "U" })) })) : (_jsx("div", { className: "feed-avatar-circle", children: "U" })), _jsx("input", { className: "feed-create-input", value: draft, onChange: (e) => setDraft(e.target.value), onFocus: () => setIsCreatePostModalOpen(true), placeholder: currentUser ? `Nghĩ gì thế, ${currentUser.name}?` : "Nghĩ gì thế hôm nay?" })] }), _jsx("div", { style: { display: "flex", gap: "8px", padding: "8px 16px", borderTop: "1px solid #3a3b3c" }, children: _jsxs("button", { onClick: () => setIsCreateReelModalOpen(true), style: {
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
                            }, onMouseEnter: (e) => (e.currentTarget.style.background = "#3a3b3c"), onMouseLeave: (e) => (e.currentTarget.style.background = "transparent"), children: [_jsx(ReelIcon, { size: 20, color: "#f02849" }), _jsx("span", { children: "Reel" })] }) })] }), _jsxs("section", { ref: listRef, style: { paddingBottom: 24, flex: 1, minHeight: 0 }, children: [items.map((post) => (_jsx(PostCard, { post: post, reaction: reactionMap[post._id] || null, onSelectReaction: (id, type) => selectReaction(id, type), onClearReaction: (id) => clearReaction(id), onSavePost: handleSavePost, onReportPost: (p) => setReportingPost(p) }, post._id))), isLoading && (_jsx("div", { style: { padding: 16, textAlign: "center" }, children: "\u0110ang t\u1EA3i..." })), !isLoading && items.length === 0 && (_jsx("div", { style: { padding: 16, textAlign: "center", opacity: 0.7 }, children: "Ch\u01B0a c\u00F3 b\u00E0i vi\u1EBFt n\u00E0o. H\u00E3y l\u00E0 ng\u01B0\u1EDDi \u0111\u1EA7u ti\u00EAn \u0111\u0103ng nh\u00E9!" }))] })] }));
    return (_jsxs(_Fragment, { children: [_jsx(AppLayout, { header: header, leftSidebar: leftSidebar, rightSidebar: rightSidebar, children: mainContent }), _jsx(CreatePostModal, { isOpen: isCreatePostModalOpen, onClose: () => {
                    setIsCreatePostModalOpen(false);
                    setDraft("");
                }, onSubmit: handleCreatePost, currentUser: currentUser }), _jsx(CreateReelModal, { isOpen: isCreateReelModalOpen, onClose: () => setIsCreateReelModalOpen(false), onSubmit: async () => {
                    // Refresh feed or navigate to reels page
                    window.location.href = "/reels";
                }, currentUser: currentUser }), _jsx(CreateStoryModal, { isOpen: isCreateStoryModalOpen, onClose: () => setIsCreateStoryModalOpen(false), onSubmit: handleCreateStory, currentUser: currentUser }), _jsx(StoryViewer, { groups: stories, state: viewerState, onClose: () => setViewerState(null), onNext: goNextStory, onPrev: goPrevStory, onStorySeen: markStorySeen, onDeleteStory: handleStoryDelete, currentUserId: currentUser?._id }), _jsx(ReportPostModal, { isOpen: !!reportingPost, post: reportingPost, onClose: () => setReportingPost(null), onSubmit: handleReportSubmit, isSubmitting: isReporting }), chatWindows
                .filter((chat) => !minimizedChats.has(chat.userId))
                .map((chat) => (_jsx(FloatingChatWindow, { userId: chat.userId, userName: chat.userName, userAvatar: chat.userAvatar, isOnline: chat.isOnline, onClose: () => closeChat(chat.userId), onMinimize: () => minimizeChat(chat.userId) }, chat.id))), Array.from(minimizedChats).map((userId, index) => {
                const chat = chatWindows.find((w) => w.userId === userId);
                if (!chat)
                    return null;
                return (_jsx(MinimizedChatIcon, { userId: chat.userId, userName: chat.userName, userAvatar: chat.userAvatar, isOnline: chat.isOnline, onClick: () => {
                        // Restore chat window by removing from minimized
                        restoreChat(userId);
                    }, index: index }, `minimized-${chat.id}`));
            })] }));
};
const FeedScreen = () => {
    return (_jsx(ChatWindowsProvider, { children: _jsx(FeedScreenContent, {}) }));
};
export default FeedScreen;
