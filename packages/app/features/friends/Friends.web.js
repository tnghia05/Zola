"use client";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getFriends, getPendingFriendRequestsApi, sendFriendRequestApi, respondFriendRequestApi, searchUsers, getUsersByIds, getCurrentUserId, getUserById, } from "@zola/app/api";
import { useFriendSuggestions } from "@zola/app/hooks/useSocial";
import { FacebookNavbarWeb } from "@zola/app/components/FacebookNavbar.web";
import { HomeIcon, MessengerIcon, FriendsIcon } from "@zola/app/components/Icons";
import "@zola/app/styles/feed.css";
import "@zola/app/styles/facebook-navbar.css";
const FriendsScreen = () => {
    const router = useRouter();
    const [friends, setFriends] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("friends");
    const { items: suggestions, isLoading: suggestionsLoading, reload: reloadSuggestions } = useFriendSuggestions(8);
    const [sentSuggestionIds, setSentSuggestionIds] = useState({});
    const [currentUser, setCurrentUser] = useState(null);
    useEffect(() => {
        loadFriends();
        loadPendingRequests();
        loadCurrentUser();
    }, []);
    const loadCurrentUser = async () => {
        try {
            const userId = await getCurrentUserId();
            if (userId) {
                const user = await getUserById(userId);
                setCurrentUser({
                    _id: user._id,
                    name: user.name || user.email || "User",
                    avatar: user.avatar,
                });
            }
        }
        catch (error) {
            console.error("Failed to load current user:", error);
        }
    };
    const loadFriends = async () => {
        try {
            const data = await getFriends();
            if (data.friendIds && data.friendIds.length > 0) {
                const users = await getUsersByIds(data.friendIds);
                setFriends(users.users || []);
            }
            else {
                setFriends([]);
            }
        }
        catch (error) {
            console.error("Failed to load friends:", error);
        }
        finally {
            setIsLoading(false);
        }
    };
    const loadPendingRequests = async () => {
        try {
            const data = await getPendingFriendRequestsApi();
            setPendingRequests(data.received || []);
        }
        catch (error) {
            console.error("Failed to load pending requests:", error);
        }
    };
    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }
        try {
            const data = await searchUsers(searchQuery, 1, 20);
            setSearchResults(data.users || []);
            setActiveTab("search");
        }
        catch (error) {
            console.error("Search failed:", error);
        }
    };
    const handleSendRequest = async (userId) => {
        try {
            await sendFriendRequestApi(userId);
            alert("Đã gửi lời mời kết bạn!");
            setSentSuggestionIds((prev) => ({ ...prev, [userId]: true }));
            reloadSuggestions();
        }
        catch (error) {
            alert(error.response?.data?.error || "Lỗi khi gửi lời mời");
        }
    };
    const handleRespondRequest = async (friendshipId, action) => {
        try {
            await respondFriendRequestApi(friendshipId, action);
            if (action === "accept") {
                loadFriends();
            }
            loadPendingRequests();
        }
        catch (error) {
            console.error("Failed to respond:", error);
        }
    };
    return (_jsxs("div", { className: "feed-root", children: [_jsx(FacebookNavbarWeb, {}), _jsx("div", { className: "feed-main-layout", children: _jsxs("div", { className: "feed-inner", children: [_jsxs("aside", { className: "feed-sidebar", children: [_jsx("div", { className: "feed-nav-section-title", children: "Menu" }), _jsxs("div", { className: "feed-nav-item", onClick: () => router.push("/feed"), children: [_jsx("div", { className: "feed-nav-icon", children: _jsx(HomeIcon, { size: 24, color: "currentColor" }) }), _jsx("span", { children: "B\u1EA3ng tin" })] }), _jsxs("div", { className: "feed-nav-item", onClick: () => router.push("/conversations"), children: [_jsx("div", { className: "feed-nav-icon", children: _jsx(MessengerIcon, { size: 24, color: "currentColor" }) }), _jsx("span", { children: "Tin nh\u1EAFn" })] }), _jsxs("div", { className: "feed-nav-item feed-nav-item--active", children: [_jsx("div", { className: "feed-nav-icon", children: _jsx(FriendsIcon, { size: 24, color: "currentColor" }) }), _jsx("span", { children: "B\u1EA1n b\u00E8" })] })] }), _jsxs("main", { className: "feed-main", children: [_jsx("div", { className: "feed-header", children: _jsx("h2", { children: "B\u1EA1n b\u00E8" }) }), _jsxs("div", { className: "friends-tabs", children: [_jsxs("button", { className: `friends-tab ${activeTab === "friends" ? "active" : ""}`, onClick: () => setActiveTab("friends"), children: ["B\u1EA1n b\u00E8 (", friends.length, ")"] }), _jsxs("button", { className: `friends-tab ${activeTab === "requests" ? "active" : ""}`, onClick: () => setActiveTab("requests"), children: ["L\u1EDDi m\u1EDDi (", pendingRequests.length, ")"] }), _jsx("button", { className: `friends-tab ${activeTab === "search" ? "active" : ""}`, onClick: () => setActiveTab("search"), children: "T\u00ECm ki\u1EBFm" })] }), activeTab === "search" && (_jsxs("div", { className: "friends-search", children: [_jsx("input", { type: "text", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), placeholder: "T\u00ECm ki\u1EBFm ng\u01B0\u1EDDi d\u00F9ng...", className: "friends-search-input", onKeyDown: (e) => {
                                                if (e.key === "Enter")
                                                    handleSearch();
                                            } }), _jsx("button", { className: "friends-search-btn", onClick: handleSearch, children: "T\u00ECm" })] })), _jsxs("div", { className: "friends-list", children: [isLoading && _jsx("div", { style: { padding: 20 }, children: "\u0110ang t\u1EA3i..." }), activeTab === "friends" && (_jsxs(_Fragment, { children: [friends.length === 0 && !isLoading && (_jsx("div", { style: { padding: 20, opacity: 0.7, textAlign: "center" }, children: "B\u1EA1n ch\u01B0a c\u00F3 b\u1EA1n b\u00E8 n\u00E0o." })), friends.map((friend) => (_jsxs("div", { className: "friend-item", children: [_jsx("div", { className: "friend-avatar", children: friend.avatar ? (
                                                            // eslint-disable-next-line @next/next/no-img-element
                                                            _jsx("img", { src: friend.avatar, alt: friend.name })) : (_jsx("div", { className: "friend-avatar-initials", children: friend.name?.charAt(0)?.toUpperCase() || "U" })) }), _jsxs("div", { className: "friend-info", children: [_jsx("div", { className: "friend-name", children: friend.name || "Người dùng" }), _jsx("div", { className: "friend-email", children: friend.email })] }), _jsx("button", { className: "friend-action-btn", onClick: () => router.push(`/profile/${friend._id}`), children: "Xem trang" })] }, friend._id)))] })), activeTab === "requests" && (_jsxs(_Fragment, { children: [pendingRequests.length === 0 && !isLoading && (_jsx("div", { style: { padding: 20, opacity: 0.7, textAlign: "center" }, children: "Kh\u00F4ng c\u00F3 l\u1EDDi m\u1EDDi n\u00E0o." })), pendingRequests.map((req) => (_jsxs("div", { className: "friend-item", children: [_jsx("div", { className: "friend-avatar", children: req.user?.avatar ? (
                                                            // eslint-disable-next-line @next/next/no-img-element
                                                            _jsx("img", { src: req.user.avatar, alt: req.user.name })) : (_jsx("div", { className: "friend-avatar-initials", children: req.user?.name?.charAt(0)?.toUpperCase() || "U" })) }), _jsxs("div", { className: "friend-info", children: [_jsx("div", { className: "friend-name", children: req.user?.name || "Người dùng" }), _jsx("div", { className: "friend-email", children: req.user?.email })] }), _jsxs("div", { className: "friend-actions", children: [_jsx("button", { className: "friend-action-btn friend-action-btn--accept", onClick: () => handleRespondRequest(req._id, "accept"), children: "Ch\u1EA5p nh\u1EADn" }), _jsx("button", { className: "friend-action-btn friend-action-btn--decline", onClick: () => handleRespondRequest(req._id, "decline"), children: "T\u1EEB ch\u1ED1i" })] })] }, req._id)))] })), activeTab === "search" && (_jsxs(_Fragment, { children: [searchResults.length === 0 && searchQuery && (_jsx("div", { style: { padding: 20, opacity: 0.7, textAlign: "center" }, children: "Kh\u00F4ng t\u00ECm th\u1EA5y k\u1EBFt qu\u1EA3." })), searchResults.map((user) => (_jsxs("div", { className: "friend-item", children: [_jsx("div", { className: "friend-avatar", children: user.avatar ? (
                                                            // eslint-disable-next-line @next/next/no-img-element
                                                            _jsx("img", { src: user.avatar, alt: user.name })) : (_jsx("div", { className: "friend-avatar-initials", children: user.name?.charAt(0)?.toUpperCase() || "U" })) }), _jsxs("div", { className: "friend-info", children: [_jsx("div", { className: "friend-name", children: user.name || "Người dùng" }), _jsx("div", { className: "friend-email", children: user.email })] }), _jsx("div", { className: "friend-actions", children: _jsx("button", { className: "friend-action-btn", disabled: sentSuggestionIds[user._id], onClick: () => handleSendRequest(user._id), children: sentSuggestionIds[user._id] ? "Đã gửi lời mời" : "Kết bạn" }) })] }, user._id)))] }))] })] }), _jsx("aside", { className: "feed-right-panel", children: _jsxs("div", { className: "feed-right-card", children: [_jsx("h3", { children: "G\u1EE3i \u00FD b\u1EA1n b\u00E8" }), suggestionsLoading && _jsx("p", { style: { opacity: 0.7 }, children: "\u0110ang t\u1EA3i..." }), !suggestionsLoading && suggestions.length === 0 && (_jsx("p", { style: { opacity: 0.7 }, children: "Kh\u00F4ng c\u00F3 g\u1EE3i \u00FD n\u00E0o." })), _jsx("div", { className: "suggestion-list", children: suggestions.map((suggestion) => (_jsxs("div", { className: "suggestion-item", children: [_jsx("div", { className: "suggestion-avatar", children: suggestion.user.avatar ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    _jsx("img", { src: suggestion.user.avatar, alt: suggestion.user.name })) : (_jsx("div", { className: "suggestion-avatar-initials", children: suggestion.user.name?.charAt(0)?.toUpperCase() || "U" })) }), _jsxs("div", { className: "suggestion-info", children: [_jsx("div", { className: "suggestion-name", children: suggestion.user.name || suggestion.user.email }), _jsxs("div", { className: "suggestion-mutual", children: [suggestion.mutualCount, " b\u1EA1n chung"] }), suggestion.mutualFriends.length > 0 && (_jsxs("div", { className: "suggestion-mutual-list", children: [suggestion.mutualFriends
                                                                    .map((mf) => mf.name)
                                                                    .slice(0, 2)
                                                                    .join(", "), suggestion.mutualCount > 2 ? "..." : ""] }))] }), _jsx("button", { className: "suggestion-btn", disabled: sentSuggestionIds[suggestion.user._id], onClick: () => handleSendRequest(suggestion.user._id), children: sentSuggestionIds[suggestion.user._id] ? "Đã gửi" : "Kết bạn" })] }, suggestion.user._id))) })] }) })] }) })] }));
};
export default FriendsScreen;
