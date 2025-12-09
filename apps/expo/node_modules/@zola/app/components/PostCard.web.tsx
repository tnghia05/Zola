import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Post, ReactionType, getCurrentUserId, getUserById } from "../api";
import { useComments } from "../hooks/useSocial";
import { CommentIcon } from "./CommentIcon";
import { ShareIcon } from "./ShareIcon";
import { SharePostModal } from "./SharePostModal";
import {
  ReactionLikeIcon,
  ReactionLoveIcon,
  ReactionHahaIcon,
  ReactionWowIcon,
  ReactionSadIcon,
  ReactionAngryIcon,
} from "./ReactionIcons";

type PostWithSavedMeta = Post & { savedAt?: string };

const REACTIONS: { type: ReactionType; emoji: string; label: string; IconComponent: React.FC<{ size?: number; className?: string }> }[] = [
  { type: "LIKE", emoji: "👍", label: "Thích", IconComponent: ReactionLikeIcon },
  { type: "LOVE", emoji: "❤️", label: "Yêu thích", IconComponent: ReactionLoveIcon },
  { type: "HAHA", emoji: "😆", label: "Haha", IconComponent: ReactionHahaIcon },
  { type: "WOW", emoji: "😮", label: "Wow", IconComponent: ReactionWowIcon },
  { type: "SAD", emoji: "😢", label: "Buồn", IconComponent: ReactionSadIcon },
  { type: "ANGRY", emoji: "😡", label: "Phẫn nộ", IconComponent: ReactionAngryIcon },
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
  const [showShareModal, setShowShareModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<{
    _id: string;
    name: string;
    avatar?: string;
  } | null>(null);

  const author = post.author || { name: `User ${post.authorId}`, _id: post.authorId };
  const goToPost = () => {
    try {
      const raw = sessionStorage.getItem("post_detail_cache");
      const cache = raw ? JSON.parse(raw) : {};
      cache[post._id] = post;
      sessionStorage.setItem("post_detail_cache", JSON.stringify(cache));
    } catch (err) {
      console.warn("post_detail_cache failed", err);
    }
    router.push(`/post/${post._id}`);
  };
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
      } catch (error) {
        console.error("Failed to load current user:", error);
      }
    };
    if (showShareModal) {
      loadCurrentUser();
    }
  }, [showShareModal]);

  return (
    <article className="feed-card" style={{ marginTop: 8 }}>
      <div className="feed-post-header" onClick={goToPost} style={{ cursor: "pointer" }}>
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
              style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}
            >
              {author.name}
              {(author as any).isVerified && (
                <span
                  style={{
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
                  }}
                  title="Verified"
                >
                  ✓
                </span>
              )}
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
              {post.visibility && (
                <span className="feed-post-visibility-icon" title={
                  post.visibility === "PUBLIC" ? "Công khai" :
                  post.visibility === "FRIENDS" ? "Bạn bè" :
                  "Chỉ mình tôi"
                }>
                  {post.visibility === "PUBLIC" ? "🌐" :
                   post.visibility === "FRIENDS" ? "👥" :
                   "🔒"}
                </span>
              )}
              {post.taggedUsers && post.taggedUsers.length > 0 && (
                <span className="feed-post-tagged-info">
                  cùng với{" "}
                  {post.taggedUsers.map((user, i) => (
                    <span key={user._id}>
                      <a
                        href={`/profile/${user._id}`}
                        onClick={(e) => {
                          e.preventDefault();
                          router.push(`/profile/${user._id}`);
                        }}
                        className="feed-post-tagged-link"
                      >
                        {user.name}
                      </a>
                      {i < post.taggedUsers!.length - 1 && ", "}
                    </span>
                  ))}
                </span>
              )}
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
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((prev) => !prev);
            }}
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
      {post.sharedFrom && (
        <>
          {/* Hiển thị comment của người share (nếu có và khác default) */}
          {post.content && post.content !== "Đã chia sẻ bài viết" && (
            <div className="feed-post-content" style={{ marginBottom: "var(--spacing-md)" }}>
              {post.content.split(/(#\w+)/g).map((part, i) => {
                if (part.startsWith('#')) {
                  const tag = part.substring(1);
                  return (
                    <a
                      key={i}
                      href={`/hashtag/${encodeURIComponent(tag)}`}
                      onClick={(e) => {
                        e.preventDefault();
                        router.push(`/hashtag/${encodeURIComponent(tag)}`);
                      }}
                      className="feed-post-hashtag"
                    >
                      {part}
                    </a>
                  );
                }
                return <span key={i}>{part}</span>;
              })}
            </div>
          )}
          
          {/* Hiển thị bài viết gốc được share - giống Facebook */}
          <div 
            className="feed-post-shared-container"
            onClick={() => {
              if (typeof post.sharedFrom === 'object' && post.sharedFrom !== null && (post.sharedFrom as any)._id) {
                // Có thể navigate đến post gốc nếu cần
              }
            }}
            style={{ cursor: 'pointer' }}
          >
            {typeof post.sharedFrom === 'object' && post.sharedFrom !== null ? (
              <>
                {/* Header với avatar + tên + thời gian */}
                <div className="feed-post-shared-header">
                  <div 
                    className="feed-post-avatar"
                    onClick={(e) => {
                      e.stopPropagation();
                      if ((post.sharedFrom as any).authorId) {
                        router.push(`/profile/${(post.sharedFrom as any).authorId}`);
                      }
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    {post.sharedFrom.author && (post.sharedFrom.author as any).avatar ? (
                      <img src={(post.sharedFrom.author as any).avatar} alt={(post.sharedFrom.author as any).name} />
                    ) : (
                      <div className="feed-post-avatar-initials">
                        {(post.sharedFrom.author as any)?.name?.charAt(0)?.toUpperCase() || "U"}
                      </div>
                    )}
                  </div>
                  <div className="feed-post-shared-header-info">
                    <div 
                      className="feed-post-author-name"
                      onClick={(e) => {
                        e.stopPropagation();
                        if ((post.sharedFrom as any).authorId) {
                          router.push(`/profile/${(post.sharedFrom as any).authorId}`);
                        }
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      {(post.sharedFrom.author as any)?.name || "User"}
                    </div>
                    <div className="feed-post-meta">
                      {new Date(post.sharedFrom.createdAt).toLocaleDateString("vi-VN", {
                        day: "numeric",
                        month: "long",
                      })}
                    </div>
                  </div>
                </div>
                
                {/* Content */}
                {post.sharedFrom.content && (
                  <div className="feed-post-shared-content">
                    {post.sharedFrom.content.split(/(#\w+)/g).map((part: string, i: number) => {
                      if (part.startsWith('#')) {
                        const tag = part.substring(1);
                        return (
                          <a
                            key={i}
                            href={`/hashtag/${encodeURIComponent(tag)}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/hashtag/${encodeURIComponent(tag)}`);
                            }}
                            className="feed-post-hashtag"
                          >
                            {part}
                          </a>
                        );
                      }
                      return <span key={i}>{part}</span>;
                    })}
                  </div>
                )}
                
                {/* Media */}
                {post.sharedFrom.media && post.sharedFrom.media.length > 0 && (
                  <div className="feed-post-media">
                    {post.sharedFrom.media.map((m: any, i: number) => (
                      <div key={i} className="feed-post-media-item">
                        {m.type === "image" ? (
                          <img src={m.url} alt="" className="feed-post-image" />
                        ) : m.type === "video" ? (
                          <video src={m.url} controls className="feed-post-video" />
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="feed-post-shared-placeholder">
                📤 Đã chia sẻ bài viết
              </div>
            )}
          </div>
        </>
      )}
      
      {/* Hiển thị content bình thường nếu không phải shared post */}
      {!post.sharedFrom && (
        <div className="feed-post-content" onClick={goToPost} style={{ cursor: "pointer" }}>
          {post.content.split(/(#\w+)/g).map((part, i) => {
            if (part.startsWith('#')) {
              const tag = part.substring(1);
              return (
                <a
                  key={i}
                  href={`/hashtag/${encodeURIComponent(tag)}`}
                  onClick={(e) => {
                    e.preventDefault();
                    router.push(`/hashtag/${encodeURIComponent(tag)}`);
                  }}
                  className="feed-post-hashtag"
                >
                  {part}
                </a>
              );
            }
            return <span key={i}>{part}</span>;
          })}
        </div>
      )}
      {post.media && post.media.length > 0 && (
        <div className="feed-post-media" onClick={goToPost} style={{ cursor: "pointer" }}>
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
              <item.IconComponent size={20} />
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
            {(() => {
              const currentReactionData = currentReaction 
                ? REACTIONS.find(r => r.type === currentReaction) 
                : null;
              const IconComponent = currentReactionData?.IconComponent || ReactionLikeIcon;
              const label = currentReactionData?.label || "Thích";
              return (
                <>
                  <span className="feed-post-reaction-btn-icon">
                    <IconComponent size={18} />
                  </span>
                  <span>{label}</span>
                </>
              );
            })()}
          </button>

          {pickerVisible && (
            <div className="reaction-picker reaction-picker--svg" ref={pickerRef}>
              {REACTIONS.map((item) => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => handleReactionSelect(item.type)}
                  title={item.label}
                >
                  <span className="reaction-emoji">
                    <item.IconComponent size={32} />
                  </span>
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

        <button 
          className="feed-post-action-btn" 
          type="button"
          onClick={() => setShowShareModal(true)}
        >
          <ShareIcon size={18} />
          <span>Chia sẻ {post.shareCount ? `(${post.shareCount})` : ""}</span>
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

      {showShareModal && (
        <SharePostModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          postId={post._id}
          onShareSuccess={() => {
            // Refresh or update post
            window.location.reload();
          }}
          currentUser={currentUser}
        />
      )}
    </article>
  );
};

export default PostCard;


