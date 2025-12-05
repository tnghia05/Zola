import { useState, useRef, useEffect } from "react";
import { sharePostApi } from "../api";
import "../styles/feed.css";

interface SharePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  onShareSuccess?: () => void;
  currentUser: {
    _id: string;
    name: string;
    avatar?: string;
  } | null;
}

export const SharePostModal = ({
  isOpen,
  onClose,
  postId,
  onShareSuccess,
  currentUser,
}: SharePostModalProps) => {
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState<"PUBLIC" | "FRIENDS" | "ONLY_ME">("PUBLIC");
  const [isSharing, setIsSharing] = useState(false);
  const [showVisibilityMenu, setShowVisibilityMenu] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const visibilityMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setContent("");
      setShowVisibilityMenu(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!showVisibilityMenu) return;
    const handleClick = (event: MouseEvent) => {
      if (
        visibilityMenuRef.current &&
        !visibilityMenuRef.current.contains(event.target as Node)
      ) {
        setShowVisibilityMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showVisibilityMenu]);

  const handleShare = async () => {
    try {
      setIsSharing(true);
      await sharePostApi(postId, {
        content: content.trim() || undefined,
        visibility,
      });
      onShareSuccess?.();
      onClose();
    } catch (error) {
      console.error("Failed to share post:", error);
      alert("Lỗi khi chia sẻ bài viết");
    } finally {
      setIsSharing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="create-post-modal-overlay" onClick={onClose}>
      <div className="create-post-modal" onClick={(e) => e.stopPropagation()}>
        <div className="create-post-modal-header">
          <h2>Chia sẻ bài viết</h2>
          <button className="create-post-modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="create-post-modal-body">
          <div className="create-post-modal-user">
            {currentUser ? (
              <>
                <div className="create-post-modal-avatar">
                  {currentUser.avatar ? (
                    <img src={currentUser.avatar} alt={currentUser.name} />
                  ) : (
                    <div className="create-post-modal-avatar-initials">
                      {currentUser.name?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                  )}
                </div>
                <div className="create-post-modal-user-info">
                  <div className="create-post-modal-user-name">{currentUser.name}</div>
                  <div className="create-post-modal-privacy-wrapper" ref={visibilityMenuRef}>
                    <button
                      className="create-post-modal-privacy"
                      onClick={() => setShowVisibilityMenu(!showVisibilityMenu)}
                    >
                      {visibility === "PUBLIC" ? (
                        <>
                          <span>🌐</span> Công khai
                        </>
                      ) : visibility === "FRIENDS" ? (
                        <>
                          <span>👥</span> Bạn bè
                        </>
                      ) : (
                        <>
                          <span>🔒</span> Chỉ mình tôi
                        </>
                      )}
                      <span>▼</span>
                    </button>
                    {showVisibilityMenu && (
                      <div className="create-post-modal-privacy-menu">
                        <button
                          onClick={() => {
                            setVisibility("PUBLIC");
                            setShowVisibilityMenu(false);
                          }}
                          className={visibility === "PUBLIC" ? "active" : ""}
                        >
                          <span>🌐</span>
                          <div>
                            <div>Công khai</div>
                            <div className="create-post-modal-privacy-menu-desc">
                              Mọi người đều có thể xem
                            </div>
                          </div>
                        </button>
                        <button
                          onClick={() => {
                            setVisibility("FRIENDS");
                            setShowVisibilityMenu(false);
                          }}
                          className={visibility === "FRIENDS" ? "active" : ""}
                        >
                          <span>👥</span>
                          <div>
                            <div>Bạn bè</div>
                            <div className="create-post-modal-privacy-menu-desc">
                              Chỉ bạn bè có thể xem
                            </div>
                          </div>
                        </button>
                        <button
                          onClick={() => {
                            setVisibility("ONLY_ME");
                            setShowVisibilityMenu(false);
                          }}
                          className={visibility === "ONLY_ME" ? "active" : ""}
                        >
                          <span>🔒</span>
                          <div>
                            <div>Chỉ mình tôi</div>
                            <div className="create-post-modal-privacy-menu-desc">
                              Chỉ bạn có thể xem
                            </div>
                          </div>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div>Loading...</div>
            )}
          </div>

          <textarea
            ref={textareaRef}
            className="create-post-modal-textarea"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Viết gì đó về bài viết này..."
            rows={4}
          />
        </div>

        <div className="create-post-modal-footer">
          <button
            className="create-post-modal-submit"
            onClick={handleShare}
            disabled={isSharing}
          >
            {isSharing ? "Đang chia sẻ..." : "Chia sẻ"}
          </button>
        </div>
      </div>
    </div>
  );
};

