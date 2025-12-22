"use client";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { getPostsByHashtagApi } from "../../api";
import { PostCard } from "../../components/PostCard.web";
import { AppLayout } from "../../components/AppLayout";
import { FacebookNavbarWeb } from "../../components/FacebookNavbar.web";
import "../../styles/feed.css";
export default function HashtagScreen() {
    const params = useParams();
    const router = useRouter();
    const tag = params?.tag;
    const [posts, setPosts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [hasNext, setHasNext] = useState(false);
    const [cursor, setCursor] = useState(null);
    useEffect(() => {
        if (!tag)
            return;
        loadPosts();
    }, [tag]);
    const loadPosts = async (loadMore = false) => {
        if (!tag)
            return;
        try {
            setIsLoading(true);
            const res = await getPostsByHashtagApi(tag, loadMore ? cursor || undefined : undefined);
            if (loadMore) {
                setPosts((prev) => [...prev, ...res.items]);
            }
            else {
                setPosts(res.items);
            }
            setHasNext(res.hasNext);
            setCursor(res.nextCursor || null);
        }
        catch (error) {
            console.error("Failed to load posts:", error);
        }
        finally {
            setIsLoading(false);
        }
    };
    const decodedTag = tag ? decodeURIComponent(tag) : "";
    return (_jsxs(AppLayout, { children: [_jsx(FacebookNavbarWeb, {}), _jsx("div", { className: "feed-root", children: _jsx("div", { className: "feed-main-layout", children: _jsxs("div", { className: "feed-inner", style: { maxWidth: 680, margin: "0 auto", padding: "var(--spacing-lg) var(--spacing-md)" }, children: [_jsxs("div", { style: { marginBottom: "var(--spacing-xl)" }, children: [_jsxs("h1", { style: { fontSize: 32, fontWeight: 700, marginBottom: "var(--spacing-sm)", color: "var(--text-primary)" }, children: ["#", decodedTag] }), _jsxs("p", { style: { color: "var(--text-secondary)", fontSize: 15 }, children: [posts.length, " ", posts.length === 1 ? "bài viết" : "bài viết"] })] }), isLoading && posts.length === 0 ? (_jsx("div", { style: { textAlign: "center", padding: "var(--spacing-xl)", color: "var(--text-secondary)" }, children: "\u0110ang t\u1EA3i..." })) : posts.length === 0 ? (_jsx("div", { style: { textAlign: "center", padding: "var(--spacing-xl)", color: "var(--text-secondary)" }, children: "Kh\u00F4ng c\u00F3 b\u00E0i vi\u1EBFt n\u00E0o v\u1EDBi hashtag n\u00E0y" })) : (_jsxs(_Fragment, { children: [posts.map((post) => (_jsx(PostCard, { post: post, onSelectReaction: async (postId, reaction) => {
                                            // TODO: Implement reaction
                                        }, onClearReaction: async (postId) => {
                                            // TODO: Implement clear reaction
                                        } }, post._id))), hasNext && (_jsx("button", { className: "feed-primary-button", onClick: () => loadPosts(true), disabled: isLoading, style: { marginTop: "var(--spacing-lg)", width: "100%" }, children: isLoading ? "Đang tải..." : "Xem thêm" }))] }))] }) }) })] }));
}
