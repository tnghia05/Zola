import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Post, ReactionType } from "../api";
import { useComments } from "../hooks/useSocial";
import { CommentIcon } from "./CommentIcon";
import { ShareIcon } from "./ShareIcon";

type PostWithSavedMeta = Post & { savedAt?: string };

const REACTIONS: { type: ReactionType; emoji: string; label: string }[] = [
  { type: "LIKE", emoji: "👍", label: "Thích" },
  { type: "LOVE", emoji: "❤️", label: "Yêu thích" },
  { type: "HAHA", emoji: "😆", label: "Haha" },
  { type: "WOW", emoji: "😮", label: "Wow" },
  { type: "SAD", emoji: "😢", label: "Buồn" },
  { type: "ANGRY", emoji: "😡", label: "Phẫn nộ" },
];

type Props = {
  post: PostWithSavedMeta;
  reaction?: ReactionType | null;
  onSelectReaction?: (postId: string, reaction: ReactionType) => void;
  onClearReaction?: (postId: string) => void;
  onSavePost?: (postId: string) => Promise<void> | void;
  onUnsavePost?: (postId: string) => Promise<void> | void;
  onReportPost?: (post: PostWithSavedMeta) => void;
  isSaved?: boolean;
};

export const PostCard = ({
  post,
  reaction = null,
  onSelectReaction,
  onClearReaction,
  onSavePost,
  onUnsavePost,
  onReportPost,
  isSaved = false,
}: Props) => {
  const router = useRouter();
  const [showComments, setShowComments] = useState(false);
  const { items, loadMore, createComment, isLoading, hasNext } = useComments(post._id);
  const [commentDraft, setCommentDraft] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const pickerRef = useRef<HTMLDivElement | null>(null);
  const pickerTimeout = useRef<NodeJS.Timeout | null>(null);

  const author = post.author || { name: `User ${post.authorId}`, _id: post.authorId };
  const canReact = typeof onSelectReaction === "function";
  const currentReaction = reaction;

  const handleCommentSubmit = async () => {
    const text = commentDraft.trim();
    if (!text) return;
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
    if (!menuOpen) return;
    const handleClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  const handleSave = async () => {
    if (!onSavePost) return;
    await onSavePost(post._id);
    setMenuOpen(false);
  };

  const handleUnsave = async () => {
    if (!onUnsavePost) return;
    await onUnsavePost(post._id);
    setMenuOpen(false);
  };

  const handleReport = () => {
    if (!onReportPost) return;
    onReportPost(post);
    setMenuOpen(false);
  };

  useEffect(() => {
    if (!pickerVisible) return;
    const handleClick = (event: MouseEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node)
      ) {
        setPickerVisible(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [pickerVisible]);

  const showPicker = () => {
    if (!canReact) return;
    if (pickerTimeout.current) clearTimeout(pickerTimeout.current);
    setPickerVisible(true);
  };

  const hidePicker = () => {
    if (pickerTimeout.current) clearTimeout(pickerTimeout.current);
    pickerTimeout.current = setTimeout(() => setPickerVisible(false), 150);
  };

  const handleReactionButtonClick = () => {
    if (!canReact) return;
    if (currentReaction) {
      onClearReaction?.(post._id);
    } else {
      onSelectReaction?.(post._id, "LIKE");
    }
  };

  const handleReactionSelect = (type: ReactionType) => {
    onSelectReaction?.(post._id, type);
    setPickerVisible(false);
  };

  const reactionCounts = post.reactionCounts || {};
  const totalReactions =
    post.likeCount ||
    Object.values(reactionCounts).reduce((acc, val) => acc + (val || 0), 0);
  const displayedReactions = REACTIONS.filter((r) => (reactionCounts[r.type] || 0) > 0).slice(
    0,
    3
  );

  const goToProfile = () => {
    router.push(`/profile/${author._id}`);
  };

  return (
    <article className="feed-card" style={{ marginTop: 8 }}>
      <div className="feed-post-header">
        <div className="feed-post-author">
          <div
            className="feed-post-avatar"
            onClick={goToProfile}
            style={{ cursor: "pointer" }}
          >
            {author.avatar ? (
              <img src={author.avatar} alt={author.name} />
            ) : (
              <div className="feed-post-avatar-initials">
                {author.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
            )}
          </div>
          <div>
            <span
              className="feed-post-author-name"
              onClick={goToProfile}
              style={{ cursor: "pointer" }}
            >
              {author.name}
            </span>
            <div className="feed-post-meta-wrapper">
              <span className="feed-post-meta">
                {new Date(post.createdAt).toLocaleString("vi-VN", {
                  day: "numeric",
                  month: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              {savedAtLabel && (
                <span className="feed-post-meta feed-post-meta--saved">
                  Đã lưu lúc {savedAtLabel}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="feed-post-menu" ref={menuRef}>
          <button
            className="feed-post-menu-button"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="Tùy chọn bài viết"
          >
            ⋯
          </button>
          {menuOpen && (
            <div className="feed-post-menu-dropdown">
              {isSaved ? (
                <button onClick={handleUnsave} disabled={!onUnsavePost}>
                  Bỏ lưu bài viết
                </button>
              ) : (
                onSavePost && (
                  <button onClick={handleSave}>
                    Lưu bài viết
                  </button>
                )
              )}
              {onReportPost && (
                <button className="danger" onClick={handleReport}>
                  Báo cáo bài viết
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="feed-post-content">{post.content}</div>
      {post.media && post.media.length > 0 && (
        <div className="feed-post-media">
          {post.media.map((m, i) => (
            <div key={i} className="feed-post-media-item">
              {m.type === "image" ? (
                <img src={m.url} alt="" className="feed-post-image" />
              ) : m.type === "video" ? (
                <video src={m.url} controls className="feed-post-video" />
              ) : (
                <div className="feed-post-media-placeholder">
                  <span>📎 {m.type}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <div className="feed-post-social">
        <div className="feed-post-reaction-summary">
          {displayedReactions.map((item) => (
            <span key={item.type} className="feed-post-reaction-icon">
              {item.emoji}
            </span>
          ))}
          {totalReactions > 0 && <span className="feed-post-reaction-total">{totalReactions}</span>}
        </div>
        <div className="feed-post-comment-count">
          {post.commentCount || 0} bình luận
        </div>
      </div>
      <div className="feed-post-actions">
        <div
          className={`feed-post-action-btn ${currentReaction ? "feed-post-action-btn--liked" : ""}`}
          onMouseEnter={showPicker}
          onMouseLeave={hidePicker}
        >
          <button
            className="feed-post-reaction-button"
            onClick={handleReactionButtonClick}
          >
            <span>{currentReaction ? "❤️" : "👍"}</span>
            <span>{currentReaction ? "Bạn đã thích" : "Thích"}</span>
          </button>

          {pickerVisible && (
            <div className="reaction-picker" ref={pickerRef}>
              {REACTIONS.map((item) => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => handleReactionSelect(item.type)}
                >
                  <span className="reaction-emoji">{item.emoji}</span>
                  <span className="reaction-label">{item.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          className="feed-post-action-btn"
          type="button"
          onClick={() => setShowComments((prev) => !prev)}
        >
          <CommentIcon size={18} />
          <span>Bình luận</span>
        </button>

        <button className="feed-post-action-btn" type="button">
          <ShareIcon size={18} />
          <span>Chia sẻ</span>
        </button>
      </div>

      {showComments && (
        <div className="feed-comments">
          <div>
            {items.map((comment) => (
              <div key={comment._id} className="feed-comment-item">
                <div className="feed-comment-author">
                  <strong>{comment.author?.name ?? "User"}</strong>
                  <span className="feed-post-meta">
                    {new Date(comment.createdAt).toLocaleString("vi-VN", {
                      day: "numeric",
                      month: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div className="feed-comment-content">{comment.content}</div>
              </div>
            ))}
            {hasNext && (
              <button
                className="feed-primary-button"
                type="button"
                onClick={() => loadMore()}
                disabled={isLoading}
              >
                Xem thêm bình luận
              </button>
            )}
          </div>
          <div style={{ marginTop: 12 }}>
            <input
              className="feed-comment-input"
              placeholder="Viết bình luận..."
              value={commentDraft}
              onChange={(e) => setCommentDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleCommentSubmit();
                }
              }}
            />
          </div>
        </div>
      )}
    </article>
  );
};

export default PostCard;


