import { useState, useRef, useEffect } from "react";
import { uploadMediaApi, getFriends, getUsersByIds, UserProfile } from "../api";
import "../styles/feed.css";

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (content: string, media: any[], visibility?: "PUBLIC" | "FRIENDS" | "ONLY_ME", taggedUsers?: string[]) => Promise<void>;
  currentUser: {
    _id: string;
    name: string;
    avatar?: string;
  } | null;
}

export const CreatePostModal = ({
  isOpen,
  onClose,
  onSubmit,
  currentUser,
}: CreatePostModalProps) => {
  const [content, setContent] = useState("");
  const [selectedMedia, setSelectedMedia] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [visibility, setVisibility] = useState<"PUBLIC" | "FRIENDS" | "ONLY_ME">("PUBLIC");
  const [showVisibilityMenu, setShowVisibilityMenu] = useState(false);
  const [taggedUsers, setTaggedUsers] = useState<UserProfile[]>([]);
  const [friends, setFriends] = useState<UserProfile[]>([]);
  const [showTagMenu, setShowTagMenu] = useState(false);
  const [tagSearchQuery, setTagSearchQuery] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const visibilityMenuRef = useRef<HTMLDivElement>(null);
  const tagMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal closes
      setContent("");
      setSelectedMedia([]);
      mediaPreviews.forEach((url) => URL.revokeObjectURL(url));
      setMediaPreviews([]);
      setShowVisibilityMenu(false);
      setTaggedUsers([]);
      setShowTagMenu(false);
      setTagSearchQuery("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } else {
      // Load friends when modal opens
      const loadFriends = async () => {
        try {
          const friendsData = await getFriends();
          if (friendsData.friendIds && friendsData.friendIds.length > 0) {
            const usersData = await getUsersByIds(friendsData.friendIds);
            setFriends(usersData.users || []);
          }
        } catch (error) {
          console.error("Failed to load friends:", error);
        }
      };
      loadFriends();
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

  useEffect(() => {
    if (!showTagMenu) return;
    const handleClick = (event: MouseEvent) => {
      if (
        tagMenuRef.current &&
        !tagMenuRef.current.contains(event.target as Node)
      ) {
        setShowTagMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showTagMenu]);

  const filteredFriends = friends.filter((friend) =>
    (friend.name || "").toLowerCase().includes(tagSearchQuery.toLowerCase()) ||
    friend.username?.toLowerCase().includes(tagSearchQuery.toLowerCase())
  ).filter((friend) => !taggedUsers.some((tagged) => tagged._id === friend._id));

  const handleTagFriend = (friend: UserProfile) => {
    if (!taggedUsers.some((tagged) => tagged._id === friend._id)) {
      setTaggedUsers([...taggedUsers, friend]);
    }
    setTagSearchQuery("");
    setShowTagMenu(false);
  };

  const handleRemoveTagged = (userId: string) => {
    setTaggedUsers(taggedUsers.filter((user) => user._id !== userId));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validate files
    const validFiles: File[] = [];
    for (const file of files) {
      // Check file size (max 20MB)
      if (file.size > 20 * 1024 * 1024) {
        alert(`File ${file.name} quá lớn (tối đa 20MB)`);
        continue;
      }
      
      // Check file type
      if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
        alert(`File ${file.name} không phải ảnh hoặc video`);
        continue;
      }
      
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    const limitedFiles = validFiles.slice(0, 4);
    setSelectedMedia(limitedFiles);

    const previews = limitedFiles.map((file) => URL.createObjectURL(file));
    setMediaPreviews(previews);
  };

  const removeMedia = (index: number) => {
    const newMedia = selectedMedia.filter((_, i) => i !== index);
    const newPreviews = mediaPreviews.filter((_, i) => i !== index);
    setSelectedMedia(newMedia);
    setMediaPreviews(newPreviews);
    URL.revokeObjectURL(mediaPreviews[index]);
  };

  const handleSubmit = async () => {
    if (!content.trim() && selectedMedia.length === 0) return;

    setIsUploading(true);
    try {
      const uploadedMedia = [];
      for (const file of selectedMedia) {
        try {
          const media = await uploadMediaApi(file);
          uploadedMedia.push(media);
        } catch (error: any) {
          console.error("Failed to upload media:", error);
          const errorMsg = error?.message || `Lỗi khi upload ${file.name}`;
          alert(errorMsg);
          // Stop uploading if one fails
          throw error;
        }
      }

      await onSubmit(content, uploadedMedia, visibility, taggedUsers.map((u) => u._id));
      onClose();
    } catch (error) {
      console.error("Failed to create post:", error);
      alert("Lỗi khi đăng bài");
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="create-post-modal-overlay" onClick={onClose}>
      <div className="create-post-modal" onClick={(e) => e.stopPropagation()}>
        <div className="create-post-modal-header">
          <h2>Tạo bài viết</h2>
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
            placeholder={`${currentUser?.name || "Bạn"} ơi, bạn đang nghĩ gì thế?`}
            rows={4}
          />

          {mediaPreviews.length > 0 && (
            <div className="create-post-modal-media-preview">
              {mediaPreviews.map((preview, index) => (
                <div key={index} className="create-post-modal-media-item">
                  <img src={preview} alt={`Preview ${index + 1}`} />
                  <button
                    className="create-post-modal-media-remove"
                    onClick={() => removeMedia(index)}
                    type="button"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="create-post-modal-actions">
            <div className="create-post-modal-actions-label">
              Thêm vào bài viết của bạn
            </div>
            <div className="create-post-modal-actions-buttons">
              <button
                className="create-post-modal-action-btn"
                onClick={() => fileInputRef.current?.click()}
                type="button"
                title="Ảnh/Video"
              >
                <span className="create-post-modal-action-icon">📷</span>
                <span>Ảnh/Video</span>
              </button>
              <div className="create-post-modal-action-wrapper" ref={tagMenuRef}>
                <button
                  className="create-post-modal-action-btn"
                  type="button"
                  title="Gắn thẻ bạn bè"
                  onClick={() => setShowTagMenu(!showTagMenu)}
                >
                  <span className="create-post-modal-action-icon">👤</span>
                  <span>Gắn thẻ bạn bè</span>
                </button>
                {showTagMenu && (
                  <div className="create-post-modal-tag-menu">
                    <input
                      type="text"
                      placeholder="Tìm bạn bè..."
                      value={tagSearchQuery}
                      onChange={(e) => setTagSearchQuery(e.target.value)}
                      className="create-post-modal-tag-search"
                      autoFocus
                    />
                    <div className="create-post-modal-tag-list">
                      {filteredFriends.length === 0 ? (
                        <div className="create-post-modal-tag-empty">
                          {tagSearchQuery ? "Không tìm thấy bạn bè" : "Không có bạn bè nào"}
                        </div>
                      ) : (
                        filteredFriends.slice(0, 10).map((friend) => (
                          <button
                            key={friend._id}
                            type="button"
                            className="create-post-modal-tag-item"
                            onClick={() => handleTagFriend(friend)}
                          >
                            <div className="create-post-modal-tag-avatar">
                              {friend.avatar ? (
                                <img src={friend.avatar} alt={friend.name} />
                              ) : (
                                <div className="create-post-modal-tag-avatar-initials">
                                  {friend.name?.charAt(0)?.toUpperCase() || "U"}
                                </div>
                              )}
                            </div>
                            <div className="create-post-modal-tag-info">
                              <div className="create-post-modal-tag-name">{friend.name}</div>
                              {friend.username && (
                                <div className="create-post-modal-tag-username">@{friend.username}</div>
                              )}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              {taggedUsers.length > 0 && (
                <div className="create-post-modal-tagged-list">
                  {taggedUsers.map((user) => (
                    <div key={user._id} className="create-post-modal-tagged-item">
                      <span>@{user.name}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTagged(user._id)}
                        className="create-post-modal-tagged-remove"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <button
                className="create-post-modal-action-btn"
                type="button"
                title="Cảm xúc"
                disabled
              >
                <span className="create-post-modal-action-icon">😊</span>
                <span>Cảm xúc</span>
              </button>
              <button
                className="create-post-modal-action-btn"
                type="button"
                title="Vị trí"
                disabled
              >
                <span className="create-post-modal-action-icon">📍</span>
                <span>Vị trí</span>
              </button>
              <button
                className="create-post-modal-action-btn"
                type="button"
                title="GIF"
                disabled
              >
                <span className="create-post-modal-action-icon">GIF</span>
                <span>GIF</span>
              </button>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={handleFileSelect}
            style={{ display: "none" }}
          />
        </div>

        <div className="create-post-modal-footer">
          <button
            className="create-post-modal-submit"
            onClick={handleSubmit}
            disabled={isUploading || (!content.trim() && selectedMedia.length === 0)}
          >
            {isUploading ? "Đang đăng..." : "Đăng"}
          </button>
        </div>
      </div>
    </div>
  );
};

