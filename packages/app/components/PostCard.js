import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// @ts-nocheck
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useComments } from "../hooks/useSocial";
import { CommentIcon } from "./CommentIcon";
import { ShareIcon } from "./ShareIcon";
const REACTIONS = [
    { type: "LIKE", emoji: "👍", label: "Thích" },
    { type: "LOVE", emoji: "❤️", label: "Yêu thích" },
    { type: "HAHA", emoji: "😆", label: "Haha" },
    { type: "WOW", emoji: "😮", label: "Wow" },
    { type: "SAD", emoji: "😢", label: "Buồn" },
    { type: "ANGRY", emoji: "😡", label: "Phẫn nộ" },
];
export const PostCard = ({ post, reaction = null, onSelectReaction, onClearReaction, onSavePost, onUnsavePost, onReportPost, isSaved = false, }) => {
    const navigate = useNavigate();
    const [showComments, setShowComments] = useState(false);
    const { items, loadMore, createComment, isLoading, hasNext } = useComments(post._id);
    const [commentDraft, setCommentDraft] = useState("");
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);
    const [pickerVisible, setPickerVisible] = useState(false);
    const pickerRef = useRef(null);
    const pickerTimeout = useRef(null);
    const author = post.author || { name: `User ${post.authorId}`, _id: post.authorId };
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
    return (_jsxs("article", { className: "feed-card", style: { marginTop: 8 }, children: [_jsxs("div", { className: "feed-post-header", children: [_jsxs("div", { className: "feed-post-author", children: [_jsx("div", { className: "feed-post-avatar", onClick: () => navigate(`/profile/${author._id}`), style: { cursor: "pointer" }, children: author.avatar ? (_jsx("img", { src: author.avatar, alt: author.name })) : (_jsx("div", { className: "feed-post-avatar-initials", children: author.name?.charAt(0)?.toUpperCase() || "U" })) }), _jsxs("div", { children: [_jsx("span", { className: "feed-post-author-name", onClick: () => navigate(`/profile/${author._id}`), style: { cursor: "pointer" }, children: author.name }), _jsxs("div", { className: "feed-post-meta-wrapper", children: [_jsx("span", { className: "feed-post-meta", children: new Date(post.createdAt).toLocaleString("vi-VN", {
                                                    day: "numeric",
                                                    month: "numeric",
                                                    year: "numeric",
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                }) }), savedAtLabel && (_jsxs("span", { className: "feed-post-meta feed-post-meta--saved", children: ["\u0110\u00E3 l\u01B0u l\u00FAc ", savedAtLabel] }))] })] })] }), _jsxs("div", { className: "feed-post-menu", ref: menuRef, children: [_jsx("button", { className: "feed-post-menu-button", onClick: () => setMenuOpen((prev) => !prev), "aria-label": "T\u00F9y ch\u1ECDn b\u00E0i vi\u1EBFt", children: "\u22EF" }), menuOpen && (_jsxs("div", { className: "feed-post-menu-dropdown", children: [isSaved ? (_jsx("button", { onClick: handleUnsave, disabled: !onUnsavePost, children: "B\u1ECF l\u01B0u b\u00E0i vi\u1EBFt" })) : (onSavePost && (_jsx("button", { onClick: handleSave, children: "L\u01B0u b\u00E0i vi\u1EBFt" }))), onReportPost && (_jsx("button", { className: "danger", onClick: handleReport, children: "B\u00E1o c\u00E1o b\u00E0i vi\u1EBFt" }))] }))] })] }), _jsx("div", { className: "feed-post-content", children: post.content }), post.media && post.media.length > 0 && (_jsx("div", { className: "feed-post-media", children: post.media.map((m, i) => (_jsx("div", { className: "feed-post-media-item", children: m.type === "image" ? (_jsx("img", { src: m.url, alt: "", className: "feed-post-image" })) : m.type === "video" ? (_jsx("video", { src: m.url, controls: true, className: "feed-post-video" })) : (_jsx("div", { className: "feed-post-media-placeholder", children: _jsxs("span", { children: ["\uD83D\uDCCE ", m.type] }) })) }, i))) })), _jsxs("div", { className: "feed-post-social", children: [_jsxs("div", { className: "feed-post-reaction-summary", children: [displayedReactions.map((item) => (_jsx("span", { className: "feed-post-reaction-icon", children: item.emoji }, item.type))), totalReactions > 0 && _jsx("span", { className: "feed-post-reaction-total", children: totalReactions })] }), _jsxs("div", { className: "feed-post-comment-count", children: [post.commentCount || 0, " b\u00ECnh lu\u1EADn"] })] }), _jsxs("div", { className: "feed-post-actions", children: [_jsxs("div", { className: `feed-post-action-btn ${currentReaction ? "feed-post-action-btn--liked" : ""}`, onMouseEnter: showPicker, onMouseLeave: hidePicker, children: [_jsxs("button", { className: "feed-post-reaction-button", onClick: handleReactionButtonClick, disabled: !canReact, children: [_jsx("span", { children: currentReaction
                                            ? REACTIONS.find((r) => r.type === currentReaction)?.emoji || "👍"
                                            : "👍" }), _jsx("span", { children: currentReaction ? "Đã bày tỏ cảm xúc" : "Thích" })] }), pickerVisible && (_jsx("div", { className: "reaction-picker", ref: pickerRef, onMouseEnter: showPicker, onMouseLeave: hidePicker, children: REACTIONS.map((item) => (_jsxs("button", { onClick: () => handleReactionSelect(item.type), children: [_jsx("span", { className: "reaction-emoji", children: item.emoji }), _jsx("span", { className: "reaction-label", children: item.label })] }, item.type))) }))] }), _jsxs("button", { className: "feed-post-action-btn", onClick: () => setShowComments((v) => !v), children: [_jsx(CommentIcon, { size: 20, color: "currentColor" }), _jsx("span", { children: "B\u00ECnh lu\u1EADn" })] }), _jsxs("button", { className: "feed-post-action-btn", disabled: true, children: [_jsx(ShareIcon, { size: 24, color: "white" }), _jsx("span", { children: "Chia s\u1EBB" })] })] }), showComments && (_jsxs("div", { className: "feed-comments", children: [_jsxs("div", { children: [items.map((c) => {
                                const commentAuthor = c.author || { name: `User ${c.authorId}`, _id: c.authorId };
                                return (_jsxs("div", { className: "feed-comment-item", children: [_jsxs("div", { className: "feed-comment-author", children: [_jsx("span", { onClick: () => navigate(`/profile/${commentAuthor._id}`), style: { cursor: "pointer", fontWeight: 600 }, children: commentAuthor.name }), _jsx("span", { style: { opacity: 0.6, marginLeft: 8 }, children: new Date(c.createdAt).toLocaleTimeString("vi-VN", {
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    }) })] }), _jsx("div", { className: "feed-comment-content", children: c.content })] }, c._id));
                            }), hasNext && (_jsx("button", { className: "feed-post-action-btn", onClick: () => loadMore(), disabled: isLoading, children: "Xem th\u00EAm b\u00ECnh lu\u1EADn" }))] }), _jsx("div", { style: { marginTop: 8 }, children: _jsx("input", { value: commentDraft, onChange: (e) => setCommentDraft(e.target.value), placeholder: "Vi\u1EBFt b\u00ECnh lu\u1EADn...", className: "feed-comment-input", onKeyDown: (e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleCommentSubmit();
                                }
                            } }) })] }))] }));
};
export default PostCard;
