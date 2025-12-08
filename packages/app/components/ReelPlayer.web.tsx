"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Reel, ReactionType, likeReelApi, unlikeReelApi, checkReelLikedApi } from "../api";
import { useComments } from "../hooks/useSocial";
import { CommentIcon } from "./CommentIcon";
import { ShareIcon } from "./ShareIcon";

const REACTIONS: { type: ReactionType; emoji: string; label: string }[] = [
  { type: "LIKE", emoji: "👍", label: "Thích" },
  { type: "LOVE", emoji: "❤️", label: "Yêu thích" },
  { type: "HAHA", emoji: "😆", label: "Haha" },
  { type: "WOW", emoji: "😮", label: "Wow" },
  { type: "SAD", emoji: "😢", label: "Buồn" },
  { type: "ANGRY", emoji: "😡", label: "Phẫn nộ" },
];

type Props = {
  reel: Reel;
  isActive?: boolean;
  onLike?: (reelId: string, liked: boolean) => void;
  onComment?: (reelId: string) => void;
  onShare?: (reel: Reel) => void;
};

export const ReelPlayer = ({
  reel,
  isActive = false,
  onLike,
  onComment,
  onShare,
}: Props) => {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeType, setLikeType] = useState<ReactionType | null>(null);
  const [isLoadingLike, setIsLoadingLike] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const { items, loadMore, createComment, isLoading, hasNext } = useComments(reel._id);
  const [commentDraft, setCommentDraft] = useState("");
  const [pickerVisible, setPickerVisible] = useState(false);
  const pickerRef = useRef<HTMLDivElement | null>(null);
  const pickerTimeout = useRef<NodeJS.Timeout | null>(null);

  const author = reel.author || { name: `User ${reel.authorId}`, _id: reel.authorId };

  useEffect(() => {
    if (isActive && videoRef.current) {
      videoRef.current.play().catch(console.error);
      setIsPlaying(true);
    } else if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [isActive]);

  useEffect(() => {
    const checkLiked = async () => {
      try {
        const result = await checkReelLikedApi(reel._id);
        setIsLiked(result.liked);
        setLikeType(result.type || null);
      } catch (error) {
        console.error("Failed to check reel liked:", error);
      }
    };
    checkLiked();
  }, [reel._id]);

  const handleLike = async () => {
    if (isLoadingLike) return;
    setIsLoadingLike(true);
    try {
      if (isLiked) {
        await unlikeReelApi(reel._id);
        setIsLiked(false);
        setLikeType(null);
        onLike?.(reel._id, false);
      } else {
        await likeReelApi(reel._id, "LIKE");
        setIsLiked(true);
        setLikeType("LIKE");
        onLike?.(reel._id, true);
      }
    } catch (error) {
      console.error("Failed to like/unlike reel:", error);
    } finally {
      setIsLoadingLike(false);
    }
  };

  const handleReactionSelect = async (type: ReactionType) => {
    if (isLoadingLike) return;
    setIsLoadingLike(true);
    try {
      if (isLiked && likeType === type) {
        await unlikeReelApi(reel._id);
        setIsLiked(false);
        setLikeType(null);
        onLike?.(reel._id, false);
      } else {
        await likeReelApi(reel._id, type);
        setIsLiked(true);
        setLikeType(type);
        onLike?.(reel._id, true);
      }
      setPickerVisible(false);
    } catch (error) {
      console.error("Failed to react to reel:", error);
    } finally {
      setIsLoadingLike(false);
    }
  };

  const handleCommentSubmit = async () => {
    const text = commentDraft.trim();
    if (!text) return;
    await createComment(text);
    setCommentDraft("");
  };

  const handleVideoClick = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setPickerVisible(false);
      }
    };
    if (pickerVisible) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [pickerVisible]);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        background: "#000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Video */}
      <video
        ref={videoRef}
        src={reel.videoUrl}
        poster={reel.thumbnailUrl}
        loop
        muted={false}
        playsInline
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          cursor: "pointer",
        }}
        onClick={handleVideoClick}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Overlay UI */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "16px",
          background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
        }}
      >
        {/* Left: Author info and caption */}
        <div style={{ flex: 1, color: "#fff", marginRight: "16px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "8px",
              cursor: "pointer",
            }}
            onClick={() => router.push(`/profile/${author._id}`)}
          >
            {author.avatar ? (
              <img
                src={author.avatar}
                alt={author.name}
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  border: "2px solid #fff",
                }}
              />
            ) : (
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: "18px",
                }}
              >
                {author.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
            )}
            <div>
              <div style={{ fontWeight: 600, fontSize: "14px", display: "flex", alignItems: "center", gap: 4 }}>
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
              </div>
            </div>
          </div>
          {reel.caption && (
            <div style={{ fontSize: "14px", marginTop: "8px", lineHeight: "1.4" }}>
              {reel.caption}
            </div>
          )}
        </div>

        {/* Right: Action buttons */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            alignItems: "center",
          }}
        >
          {/* Like button */}
          <div style={{ position: "relative" }}>
            <button
              onClick={handleLike}
              disabled={isLoadingLike}
              style={{
                background: "transparent",
                border: "none",
                cursor: isLoadingLike ? "wait" : "pointer",
                padding: "8px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "4px",
              }}
              onMouseEnter={() => {
                if (pickerTimeout.current) clearTimeout(pickerTimeout.current);
                pickerTimeout.current = setTimeout(() => setPickerVisible(true), 500);
              }}
              onMouseLeave={() => {
                if (pickerTimeout.current) clearTimeout(pickerTimeout.current);
              }}
            >
              <div style={{ fontSize: "28px" }}>
                {isLiked && likeType === "LIKE" ? "👍" : "🤍"}
              </div>
              <div style={{ color: "#fff", fontSize: "12px", fontWeight: 600 }}>
                {reel.likeCount || 0}
              </div>
            </button>

            {/* Reaction picker */}
            {pickerVisible && (
              <div
                ref={pickerRef}
                style={{
                  position: "absolute",
                  bottom: "100%",
                  left: "50%",
                  transform: "translateX(-50%)",
                  marginBottom: "8px",
                  background: "#242526",
                  borderRadius: "24px",
                  padding: "8px",
                  display: "flex",
                  gap: "8px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                }}
                onMouseEnter={() => {
                  if (pickerTimeout.current) clearTimeout(pickerTimeout.current);
                }}
                onMouseLeave={() => setPickerVisible(false)}
              >
                {REACTIONS.map((reaction) => (
                  <button
                    key={reaction.type}
                    onClick={() => handleReactionSelect(reaction.type)}
                    style={{
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "32px",
                      padding: "4px",
                      borderRadius: "50%",
                      transition: "transform 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "scale(1.2)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "scale(1)";
                    }}
                    title={reaction.label}
                  >
                    {reaction.emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Comment button */}
          <button
            onClick={() => {
              setShowComments(!showComments);
              onComment?.(reel._id);
            }}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "8px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <CommentIcon />
            <div style={{ color: "#fff", fontSize: "12px", fontWeight: 600 }}>
              {reel.commentCount || 0}
            </div>
          </button>

          {/* Share button */}
          <button
            onClick={() => onShare?.(reel)}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "8px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <ShareIcon />
            <div style={{ color: "#fff", fontSize: "12px", fontWeight: 600 }}>
              Chia sẻ
            </div>
          </button>
        </div>
      </div>

      {/* Comments panel */}
      {showComments && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            bottom: 0,
            width: "400px",
            background: "#242526",
            borderLeft: "1px solid #3a3b3c",
            display: "flex",
            flexDirection: "column",
            zIndex: 10,
          }}
        >
          <div
            style={{
              padding: "16px",
              borderBottom: "1px solid #3a3b3c",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h3 style={{ margin: 0, color: "#e4e6eb", fontSize: "20px", fontWeight: 700 }}>
              Bình luận
            </h3>
            <button
              onClick={() => setShowComments(false)}
              style={{
                background: "transparent",
                border: "none",
                color: "#e4e6eb",
                fontSize: "24px",
                cursor: "pointer",
              }}
            >
              ×
            </button>
          </div>

          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "16px",
            }}
          >
            {items.map((comment) => (
              <div
                key={comment._id}
                style={{
                  marginBottom: "16px",
                  display: "flex",
                  gap: "12px",
                }}
              >
                {comment.author?.avatar ? (
                  <img
                    src={comment.author.avatar}
                    alt={comment.author.name}
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: "14px",
                    }}
                  >
                    {comment.author?.name?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ color: "#e4e6eb", fontSize: "14px", fontWeight: 600 }}>
                    {comment.author?.name || "User"}
                  </div>
                  <div style={{ color: "#b0b3b8", fontSize: "14px", marginTop: "4px" }}>
                    {comment.content}
                  </div>
                </div>
              </div>
            ))}
            {hasNext && (
              <button
                onClick={loadMore}
                disabled={isLoading}
                style={{
                  width: "100%",
                  padding: "8px",
                  background: "#3a3b3c",
                  color: "#e4e6eb",
                  border: "none",
                  borderRadius: "6px",
                  cursor: isLoading ? "wait" : "pointer",
                  marginTop: "16px",
                }}
              >
                {isLoading ? "Đang tải..." : "Tải thêm"}
              </button>
            )}
          </div>

          <div
            style={{
              padding: "16px",
              borderTop: "1px solid #3a3b3c",
            }}
          >
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                type="text"
                value={commentDraft}
                onChange={(e) => setCommentDraft(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleCommentSubmit();
                  }
                }}
                placeholder="Viết bình luận..."
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  background: "#3a3b3c",
                  border: "none",
                  borderRadius: "20px",
                  color: "#e4e6eb",
                  fontSize: "14px",
                }}
              />
              <button
                onClick={handleCommentSubmit}
                disabled={!commentDraft.trim()}
                style={{
                  padding: "8px 16px",
                  background: commentDraft.trim() ? "#2374e1" : "#3a3b3c",
                  color: "#fff",
                  border: "none",
                  borderRadius: "20px",
                  cursor: commentDraft.trim() ? "pointer" : "not-allowed",
                  fontSize: "14px",
                  fontWeight: 600,
                }}
              >
                Đăng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

