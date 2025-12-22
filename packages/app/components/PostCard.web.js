import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUserId, getUserById } from "../api";
import { useComments } from "../hooks/useSocial";
import { CommentIcon } from "./CommentIcon";
import { ShareIcon } from "./ShareIcon";
import { SharePostModal } from "./SharePostModal";
import { ReactionLikeIcon, ReactionLoveIcon, ReactionHahaIcon, ReactionWowIcon, ReactionSadIcon, ReactionAngryIcon, } from "./ReactionIcons";
const REACTIONS = [
    { type: "LIKE", emoji: "👍", label: "Thích", IconComponent: ReactionLikeIcon },
    { type: "LOVE", emoji: "❤️", label: "Yêu thích", IconComponent: ReactionLoveIcon },
    { type: "HAHA", emoji: "😆", label: "Haha", IconComponent: ReactionHahaIcon },
    { type: "WOW", emoji: "😮", label: "Wow", IconComponent: ReactionWowIcon },
    { type: "SAD", emoji: "😢", label: "Buồn", IconComponent: ReactionSadIcon },
    { type: "ANGRY", emoji: "😡", label: "Phẫn nộ", IconComponent: ReactionAngryIcon },
];
export const PostCard = ({ post, reaction = null, onSelectReaction, onClearReaction, onSavePost, onUnsavePost, onReportPost, isSaved = false, }) => {
    const router = useRouter();
    const [showComments, setShowComments] = useState(false);
    const { items, loadMore, createComment, isLoading, hasNext } = useComments(post._id);
    const [commentDraft, setCommentDraft] = useState("");
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);
    const [pickerVisible, setPickerVisible] = useState(false);
    const pickerRef = useRef(null);
    const pickerTimeout = useRef(null);
    const [showShareModal, setShowShareModal] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const author = post.author || { name: `User ${post.authorId}`, _id: post.authorId };
    const goToPost = () => {
        try {
            const raw = sessionStorage.getItem("post_detail_cache");
            const cache = raw ? JSON.parse(raw) : {};
            cache[post._id] = post;
            sessionStorage.setItem("post_detail_cache", JSON.stringify(cache));
        }
        catch (err) {
            console.warn("post_detail_cache failed", err);
        }
        router.push(`/post/${post._id}`);
    };
    const canReact = typeof onSelectReaction === "function";
    const currentReaction = reaction;
    const handleCommentSubmit = async () => {
        const text = commentDraft.trim();
        if (!text)
            return;
        await createComment(text);
        setCommentDraft("");
    };
    const savedAtLabel = post.savedAt
        ? new Date(post.savedAt).toLocaleString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
            day: "numeric",
            month: "numeric",
            year: "numeric",
        })
        : null;
    useEffect(() => {
        if (!menuOpen)
            return;
        const handleClick = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [menuOpen]);
    const handleSave = async () => {
        if (!onSavePost)
            return;
        await onSavePost(post._id);
        setMenuOpen(false);
    };
    const handleUnsave = async () => {
        if (!onUnsavePost)
            return;
        await onUnsavePost(post._id);
        setMenuOpen(false);
    };
    const handleReport = () => {
        if (!onReportPost)
            return;
        onReportPost(post);
        setMenuOpen(false);
    };
    useEffect(() => {
        if (!pickerVisible)
            return;
        const handleClick = (event) => {
            if (pickerRef.current &&
                !pickerRef.current.contains(event.target)) {
                setPickerVisible(false);
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [pickerVisible]);
    const showPicker = () => {
        if (!canReact)
            return;
        if (pickerTimeout.current)
            clearTimeout(pickerTimeout.current);
        setPickerVisible(true);
    };
    const hidePicker = () => {
        if (pickerTimeout.current)
            clearTimeout(pickerTimeout.current);
        pickerTimeout.current = setTimeout(() => setPickerVisible(false), 150);
    };
    const handleReactionButtonClick = () => {
        if (!canReact)
            return;
        if (currentReaction) {
            onClearReaction?.(post._id);
        }
        else {
            onSelectReaction?.(post._id, "LIKE");
        }
    };
    const handleReactionSelect = (type) => {
        onSelectReaction?.(post._id, type);
        setPickerVisible(false);
    };
    const reactionCounts = post.reactionCounts || {};
    const totalReactions = post.likeCount ||
        Object.values(reactionCounts).reduce((acc, val) => acc + (val || 0), 0);
    const displayedReactions = REACTIONS.filter((r) => (reactionCounts[r.type] || 0) > 0).slice(0, 3);
    const goToProfile = () => {
        router.push(`/profile/${author._id}`);
    };
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
            catch (error) {
                console.error("Failed to load current user:", error);
            }
        };
        if (showShareModal) {
            loadCurrentUser();
        }
    }, [showShareModal]);
    return (_jsxs("article", { className: "feed-card", style: { marginTop: 8 }, children: [_jsxs("div", { className: "feed-post-header", onClick: goToPost, style: { cursor: "pointer" }, children: [_jsxs("div", { className: "feed-post-author", children: [_jsx("div", { className: "feed-post-avatar", onClick: goToProfile, style: { cursor: "pointer" }, children: author.avatar ? (_jsx("img", { src: author.avatar, alt: author.name })) : (_jsx("div", { className: "feed-post-avatar-initials", children: author.name?.charAt(0)?.toUpperCase() || "U" })) }), _jsxs("div", { children: [_jsxs("span", { className: "feed-post-author-name", onClick: goToProfile, style: { cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }, children: [author.name, author.isVerified && (_jsx("span", { style: {
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    width: 16,
                                                    height: 16,
                                                    borderRadius: "50%",
                                                    background: "#1877f2",
                                                    color: "white",
                                                    fontSize: 10,
                                                    fontWeight: 700,
                                                    lineHeight: 1,
                                                }, title: "Verified", children: "\u2713" }))] }), _jsxs("div", { className: "feed-post-meta-wrapper", children: [_jsx("span", { className: "feed-post-meta", children: new Date(post.createdAt).toLocaleString("vi-VN", {
                                                    day: "numeric",
                                                    month: "numeric",
                                                    year: "numeric",
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                }) }), post.visibility && (_jsx("span", { className: "feed-post-visibility-icon", title: post.visibility === "PUBLIC" ? "Công khai" :
                                                    post.visibility === "FRIENDS" ? "Bạn bè" :
                                                        "Chỉ mình tôi", children: post.visibility === "PUBLIC" ? "🌐" :
                                                    post.visibility === "FRIENDS" ? "👥" :
                                                        "🔒" })), post.taggedUsers && post.taggedUsers.length > 0 && (_jsxs("span", { className: "feed-post-tagged-info", children: ["c\u00F9ng v\u1EDBi", " ", post.taggedUsers.map((user, i) => (_jsxs("span", { children: [_jsx("a", { href: `/profile/${user._id}`, onClick: (e) => {
                                                                    e.preventDefault();
                                                                    router.push(`/profile/${user._id}`);
                                                                }, className: "feed-post-tagged-link", children: user.name }), i < post.taggedUsers.length - 1 && ", "] }, user._id)))] })), savedAtLabel && (_jsxs("span", { className: "feed-post-meta feed-post-meta--saved", children: ["\u0110\u00E3 l\u01B0u l\u00FAc ", savedAtLabel] }))] })] })] }), _jsxs("div", { className: "feed-post-menu", ref: menuRef, children: [_jsx("button", { className: "feed-post-menu-button", onClick: (e) => {
                                    e.stopPropagation();
                                    setMenuOpen((prev) => !prev);
                                }, "aria-label": "T\u00F9y ch\u1ECDn b\u00E0i vi\u1EBFt", children: "\u22EF" }), menuOpen && (_jsxs("div", { className: "feed-post-menu-dropdown", children: [isSaved ? (_jsx("button", { onClick: handleUnsave, disabled: !onUnsavePost, children: "B\u1ECF l\u01B0u b\u00E0i vi\u1EBFt" })) : (onSavePost && (_jsx("button", { onClick: handleSave, children: "L\u01B0u b\u00E0i vi\u1EBFt" }))), onReportPost && (_jsx("button", { className: "danger", onClick: handleReport, children: "B\u00E1o c\u00E1o b\u00E0i vi\u1EBFt" }))] }))] })] }), post.sharedFrom && (_jsxs(_Fragment, { children: [post.content && post.content !== "Đã chia sẻ bài viết" && (_jsx("div", { className: "feed-post-content", style: { marginBottom: "var(--spacing-md)" }, children: post.content.split(/(#\w+)/g).map((part, i) => {
                            if (part.startsWith('#')) {
                                const tag = part.substring(1);
                                return (_jsx("a", { href: `/hashtag/${encodeURIComponent(tag)}`, onClick: (e) => {
                                        e.preventDefault();
                                        router.push(`/hashtag/${encodeURIComponent(tag)}`);
                                    }, className: "feed-post-hashtag", children: part }, i));
                            }
                            return _jsx("span", { children: part }, i);
                        }) })), _jsx("div", { className: "feed-post-shared-container", onClick: () => {
                            if (typeof post.sharedFrom === 'object' && post.sharedFrom !== null && post.sharedFrom._id) {
                                // Có thể navigate đến post gốc nếu cần
                            }
                        }, style: { cursor: 'pointer' }, children: typeof post.sharedFrom === 'object' && post.sharedFrom !== null ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "feed-post-shared-header", children: [_jsx("div", { className: "feed-post-avatar", onClick: (e) => {
                                                e.stopPropagation();
                                                if (post.sharedFrom.authorId) {
                                                    router.push(`/profile/${post.sharedFrom.authorId}`);
                                                }
                                            }, style: { cursor: 'pointer' }, children: post.sharedFrom.author && post.sharedFrom.author.avatar ? (_jsx("img", { src: post.sharedFrom.author.avatar, alt: post.sharedFrom.author.name })) : (_jsx("div", { className: "feed-post-avatar-initials", children: post.sharedFrom.author?.name?.charAt(0)?.toUpperCase() || "U" })) }), _jsxs("div", { className: "feed-post-shared-header-info", children: [_jsx("div", { className: "feed-post-author-name", onClick: (e) => {
                                                        e.stopPropagation();
                                                        if (post.sharedFrom.authorId) {
                                                            router.push(`/profile/${post.sharedFrom.authorId}`);
                                                        }
                                                    }, style: { cursor: 'pointer' }, children: post.sharedFrom.author?.name || "User" }), _jsx("div", { className: "feed-post-meta", children: new Date(post.sharedFrom.createdAt).toLocaleDateString("vi-VN", {
                                                        day: "numeric",
                                                        month: "long",
                                                    }) })] })] }), post.sharedFrom.content && (_jsx("div", { className: "feed-post-shared-content", children: post.sharedFrom.content.split(/(#\w+)/g).map((part, i) => {
                                        if (part.startsWith('#')) {
                                            const tag = part.substring(1);
                                            return (_jsx("a", { href: `/hashtag/${encodeURIComponent(tag)}`, onClick: (e) => {
                                                    e.stopPropagation();
                                                    router.push(`/hashtag/${encodeURIComponent(tag)}`);
                                                }, className: "feed-post-hashtag", children: part }, i));
                                        }
                                        return _jsx("span", { children: part }, i);
                                    }) })), post.sharedFrom.media && post.sharedFrom.media.length > 0 && (_jsx("div", { className: "feed-post-media", children: post.sharedFrom.media.map((m, i) => (_jsx("div", { className: "feed-post-media-item", children: m.type === "image" ? (_jsx("img", { src: m.url, alt: "", className: "feed-post-image" })) : m.type === "video" ? (_jsx("video", { src: m.url, controls: true, className: "feed-post-video" })) : null }, i))) }))] })) : (_jsx("div", { className: "feed-post-shared-placeholder", children: "\uD83D\uDCE4 \u0110\u00E3 chia s\u1EBB b\u00E0i vi\u1EBFt" })) })] })), !post.sharedFrom && (_jsx("div", { className: "feed-post-content", onClick: goToPost, style: { cursor: "pointer" }, children: post.content.split(/(#\w+)/g).map((part, i) => {
                    if (part.startsWith('#')) {
                        const tag = part.substring(1);
                        return (_jsx("a", { href: `/hashtag/${encodeURIComponent(tag)}`, onClick: (e) => {
                                e.preventDefault();
                                router.push(`/hashtag/${encodeURIComponent(tag)}`);
                            }, className: "feed-post-hashtag", children: part }, i));
                    }
                    return _jsx("span", { children: part }, i);
                }) })), post.media && post.media.length > 0 && (_jsx("div", { className: "feed-post-media", onClick: goToPost, style: { cursor: "pointer" }, children: post.media.map((m, i) => (_jsx("div", { className: "feed-post-media-item", children: m.type === "image" ? (_jsx("img", { src: m.url, alt: "", className: "feed-post-image" })) : m.type === "video" ? (_jsx("video", { src: m.url, controls: true, className: "feed-post-video" })) : (_jsx("div", { className: "feed-post-media-placeholder", children: _jsxs("span", { children: ["\uD83D\uDCCE ", m.type] }) })) }, i))) })), _jsxs("div", { className: "feed-post-social", children: [_jsxs("div", { className: "feed-post-reaction-summary", children: [displayedReactions.map((item) => (_jsx("span", { className: "feed-post-reaction-icon", children: _jsx(item.IconComponent, { size: 20 }) }, item.type))), totalReactions > 0 && _jsx("span", { className: "feed-post-reaction-total", children: totalReactions })] }), _jsxs("div", { className: "feed-post-comment-count", children: [post.commentCount || 0, " b\u00ECnh lu\u1EADn"] })] }), _jsxs("div", { className: "feed-post-actions", children: [_jsxs("div", { className: `feed-post-action-btn ${currentReaction ? "feed-post-action-btn--liked" : ""}`, onMouseEnter: showPicker, onMouseLeave: hidePicker, children: [_jsx("button", { className: "feed-post-reaction-button", onClick: handleReactionButtonClick, children: (() => {
                                    const currentReactionData = currentReaction
                                        ? REACTIONS.find(r => r.type === currentReaction)
                                        : null;
                                    const IconComponent = currentReactionData?.IconComponent || ReactionLikeIcon;
                                    const label = currentReactionData?.label || "Thích";
                                    return (_jsxs(_Fragment, { children: [_jsx("span", { className: "feed-post-reaction-btn-icon", children: _jsx(IconComponent, { size: 18 }) }), _jsx("span", { children: label })] }));
                                })() }), pickerVisible && (_jsx("div", { className: "reaction-picker reaction-picker--svg", ref: pickerRef, children: REACTIONS.map((item) => (_jsx("button", { type: "button", onClick: () => handleReactionSelect(item.type), title: item.label, children: _jsx("span", { className: "reaction-emoji", children: _jsx(item.IconComponent, { size: 32 }) }) }, item.type))) }))] }), _jsxs("button", { className: "feed-post-action-btn", type: "button", onClick: () => setShowComments((prev) => !prev), children: [_jsx(CommentIcon, { size: 18 }), _jsx("span", { children: "B\u00ECnh lu\u1EADn" })] }), _jsxs("button", { className: "feed-post-action-btn", type: "button", onClick: () => setShowShareModal(true), children: [_jsx(ShareIcon, { size: 18 }), _jsxs("span", { children: ["Chia s\u1EBB ", post.shareCount ? `(${post.shareCount})` : ""] })] })] }), showComments && (_jsxs("div", { className: "feed-comments", children: [_jsxs("div", { children: [items.map((comment) => (_jsxs("div", { className: "feed-comment-item", children: [_jsxs("div", { className: "feed-comment-author", children: [_jsx("strong", { children: comment.author?.name ?? "User" }), _jsx("span", { className: "feed-post-meta", children: new Date(comment.createdAt).toLocaleString("vi-VN", {
                                                    day: "numeric",
                                                    month: "numeric",
                                                    year: "numeric",
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                }) })] }), _jsx("div", { className: "feed-comment-content", children: comment.content })] }, comment._id))), hasNext && (_jsx("button", { className: "feed-primary-button", type: "button", onClick: () => loadMore(), disabled: isLoading, children: "Xem th\u00EAm b\u00ECnh lu\u1EADn" }))] }), _jsx("div", { style: { marginTop: 12 }, children: _jsx("input", { className: "feed-comment-input", placeholder: "Vi\u1EBFt b\u00ECnh lu\u1EADn...", value: commentDraft, onChange: (e) => setCommentDraft(e.target.value), onKeyDown: (e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleCommentSubmit();
                                }
                            } }) })] })), showShareModal && (_jsx(SharePostModal, { isOpen: showShareModal, onClose: () => setShowShareModal(false), postId: post._id, onShareSuccess: () => {
                    // Refresh or update post
                    window.location.reload();
                }, currentUser: currentUser }))] }));
};
export default PostCard;
