"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getCurrentUserId, getUserById, searchSocialApi, getUserPostsApi } from "@zola/app/api";
import { FacebookNavbarWeb } from "@zola/app/components/FacebookNavbar.web";
import { SearchIcon, FriendsIcon, CommentIcon } from "@zola/app/components/Icons";
import "@zola/app/styles/feed.css";
import "@zola/app/styles/facebook-navbar.css";
const FILTERS = [
    { id: "all", label: "Tất cả", icon: _jsx(SearchIcon, { size: 20, color: "currentColor" }) },
    { id: "users", label: "Mọi người", icon: _jsx(FriendsIcon, { size: 20, color: "currentColor" }) },
    { id: "posts", label: "Bài viết", icon: _jsx(CommentIcon, { size: 20, color: "currentColor" }) },
];
const SearchScreen = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialQuery = searchParams.get("q") || "";
    const [keyword, setKeyword] = useState(initialQuery);
    const [activeFilter, setActiveFilter] = useState("all");
    const [results, setResults] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    useEffect(() => {
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
            catch (err) {
                console.error("Failed to load current user:", err);
            }
        };
        loadCurrentUser();
    }, []);
    const doSearch = useCallback(async (q, type) => {
        const trimmed = q.trim();
        if (!trimmed) {
            setError("Nhập từ khóa để tìm kiếm.");
            setResults(null);
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            // 1. Search users and posts by content
            const res = await searchSocialApi(trimmed);
            // 2. Also fetch posts from users found in search results
            const userPosts = [];
            if (res.users && res.users.length > 0) {
                const userPostPromises = res.users.map(async (user) => {
                    try {
                        const postsRes = await getUserPostsApi(user._id, undefined, 5);
                        return postsRes.items || [];
                    }
                    catch {
                        return [];
                    }
                });
                const allUserPosts = await Promise.all(userPostPromises);
                allUserPosts.forEach((posts) => userPosts.push(...posts));
            }
            // 3. Merge posts and remove duplicates
            const existingPostIds = new Set(res.posts.map((p) => p._id));
            const uniqueUserPosts = userPosts.filter((p) => !existingPostIds.has(p._id));
            setResults({
                users: res.users,
                posts: [...res.posts, ...uniqueUserPosts],
            });
        }
        catch (err) {
            console.error("Failed to search", err);
            setError(err?.response?.data?.error || err?.message || "Không thể tìm kiếm lúc này");
        }
        finally {
            setIsLoading(false);
        }
    }, []);
    // Auto search when URL has query
    useEffect(() => {
        if (initialQuery) {
            doSearch(initialQuery, activeFilter);
        }
    }, [initialQuery]);
    const handleSubmit = (e) => {
        e.preventDefault();
        if (keyword.trim()) {
            router.push(`/search?q=${encodeURIComponent(keyword.trim())}`);
            doSearch(keyword, activeFilter);
        }
    };
    const handleFilterChange = (filter) => {
        setActiveFilter(filter);
    };
    // Filter results based on active filter
    const filteredUsers = activeFilter === "posts" ? [] : (results?.users || []);
    const filteredPosts = activeFilter === "users" ? [] : (results?.posts || []);
    return (_jsxs("div", { className: "feed-root", children: [_jsx(FacebookNavbarWeb, {}), _jsx("div", { className: "feed-main-layout", children: _jsxs("div", { className: "feed-inner search-page-inner", children: [_jsxs("aside", { className: "search-filter-sidebar", children: [_jsxs("div", { className: "search-filter-header", children: [_jsx("h2", { children: "K\u1EBFt qu\u1EA3 t\u00ECm ki\u1EBFm" }), keyword && _jsxs("p", { className: "search-filter-query", children: ["\"", keyword, "\""] })] }), _jsxs("div", { className: "search-filter-section", children: [_jsx("h3", { children: "B\u1ED9 l\u1ECDc" }), _jsx("div", { className: "search-filter-list", children: FILTERS.map((filter) => (_jsxs("button", { className: `search-filter-item ${activeFilter === filter.id ? "search-filter-item--active" : ""}`, onClick: () => handleFilterChange(filter.id), children: [_jsx("span", { className: "search-filter-icon", children: filter.icon }), _jsx("span", { className: "search-filter-label", children: filter.label })] }, filter.id))) })] })] }), _jsxs("main", { className: "search-results-main", children: [_jsx("div", { className: "search-input-bar", children: _jsxs("form", { className: "search-form-inline", onSubmit: handleSubmit, children: [_jsxs("div", { className: "search-input-wrapper", children: [_jsx("span", { className: "search-input-icon", children: _jsx(SearchIcon, { size: 18, color: "currentColor" }) }), _jsx("input", { className: "search-input-field", placeholder: "T\u00ECm ki\u1EBFm tr\u00EAn Zola...", value: keyword, onChange: (e) => setKeyword(e.target.value) })] }), _jsx("button", { className: "search-submit-btn", type: "submit", children: "T\u00ECm ki\u1EBFm" })] }) }), error && _jsx("div", { className: "search-error-banner", children: error }), isLoading && (_jsxs("div", { className: "search-loading-state", children: [_jsx("div", { className: "search-loading-spinner" }), _jsx("span", { children: "\u0110ang t\u00ECm ki\u1EBFm..." })] })), !isLoading && results && (_jsxs("div", { className: "search-results-container", children: [filteredUsers.length > 0 && (_jsxs("div", { className: "search-results-section", children: [_jsx("h3", { className: "search-results-section-title", children: "M\u1ECDi ng\u01B0\u1EDDi" }), _jsx("div", { className: "search-users-list", children: filteredUsers.map((user) => (_jsxs("div", { className: "search-user-item", onClick: () => router.push(`/profile/${user._id}`), children: [_jsx("div", { className: "search-user-avatar-large", children: user.avatar ? (_jsx("img", { src: user.avatar, alt: user.name })) : (_jsx("div", { className: "search-user-initials-large", children: user.name?.charAt(0)?.toUpperCase() || "U" })) }), _jsxs("div", { className: "search-user-details", children: [_jsx("div", { className: "search-user-name-main", children: user.name || user.email }), user.username && (_jsxs("div", { className: "search-user-username", children: ["@", user.username] }))] }), _jsx("button", { className: "search-user-action-btn", onClick: (e) => {
                                                                    e.stopPropagation();
                                                                    router.push(`/profile/${user._id}`);
                                                                }, children: "Xem trang c\u00E1 nh\u00E2n" })] }, user._id))) })] })), filteredPosts.length > 0 && (_jsxs("div", { className: "search-results-section", children: [_jsx("h3", { className: "search-results-section-title", children: "B\u00E0i vi\u1EBFt" }), _jsx("div", { className: "search-posts-list", children: filteredPosts.map((post) => (_jsx(PostResultCard, { post: post }, post._id))) })] })), filteredUsers.length === 0 && filteredPosts.length === 0 && (_jsxs("div", { className: "search-no-results", children: [_jsx("div", { className: "search-no-results-icon", children: _jsx(SearchIcon, { size: 48, color: "currentColor" }) }), _jsx("h3", { children: "Kh\u00F4ng t\u00ECm th\u1EA5y k\u1EBFt qu\u1EA3" }), _jsx("p", { children: "Th\u1EED t\u00ECm ki\u1EBFm v\u1EDBi t\u1EEB kh\u00F3a kh\u00E1c ho\u1EB7c thay \u0111\u1ED5i b\u1ED9 l\u1ECDc." })] }))] })), !isLoading && !results && !error && (_jsxs("div", { className: "search-initial-state", children: [_jsx("div", { className: "search-initial-icon", children: _jsx(SearchIcon, { size: 48, color: "currentColor" }) }), _jsx("h3", { children: "T\u00ECm ki\u1EBFm tr\u00EAn Zola" }), _jsx("p", { children: "T\u00ECm b\u1EA1n b\u00E8, b\u00E0i vi\u1EBFt v\u00E0 nhi\u1EC1u n\u1ED9i dung kh\u00E1c..." })] }))] })] }) })] }));
};
const PostResultCard = ({ post }) => {
    const router = useRouter();
    const author = post.author || { name: `User ${post.authorId}`, _id: post.authorId };
    return (_jsxs("article", { className: "search-post-item", onClick: () => router.push(`/post/${post._id}`), children: [_jsxs("div", { className: "search-post-author-row", children: [_jsx("div", { className: "search-post-author-avatar", children: author.avatar ? (_jsx("img", { src: author.avatar, alt: author.name })) : (_jsx("div", { className: "search-post-author-initials", children: author.name?.charAt(0)?.toUpperCase() || "U" })) }), _jsxs("div", { className: "search-post-author-info", children: [_jsx("span", { className: "search-post-author-name", onClick: (e) => {
                                    e.stopPropagation();
                                    router.push(`/profile/${author._id}`);
                                }, children: author.name }), _jsx("span", { className: "search-post-date", children: new Date(post.createdAt).toLocaleString("vi-VN") })] })] }), _jsx("div", { className: "search-post-content", children: post.content }), post.media && post.media.length > 0 && (_jsx("div", { className: "search-post-media-grid", children: post.media.slice(0, 4).map((media, idx) => (_jsxs("div", { className: "search-post-media-thumb", children: [media.type === "video" ? (_jsx("video", { src: media.url, className: "search-post-video-thumb" })) : (_jsx("img", { src: media.url, alt: `media-${idx}`, className: "search-post-img-thumb" })), post.media.length > 4 && idx === 3 && (_jsxs("div", { className: "search-post-media-more", children: ["+", post.media.length - 4] }))] }, idx))) })), _jsxs("div", { className: "search-post-stats", children: [_jsxs("span", { children: ["\u2764\uFE0F ", post.reactionsCount || 0] }), _jsxs("span", { children: ["\uD83D\uDCAC ", post.commentsCount || 0] })] })] }));
};
export default SearchScreen;
