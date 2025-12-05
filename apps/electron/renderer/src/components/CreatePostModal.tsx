import { useState, useRef, useEffect } from "react";
import { uploadMediaApi } from "../api";
import "../styles/feed.css";

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (content: string, media: any[], visibility?: "PUBLIC" | "FRIENDS") => Promise<void>;
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
  const [visibility, setVisibility] = useState<"PUBLIC" | "FRIENDS">("PUBLIC");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [isOpen]);

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

      await onSubmit(content, uploadedMedia, visibility);
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
                  <button
                    className="create-post-modal-privacy"
                    onClick={() =>
                      setVisibility(visibility === "PUBLIC" ? "FRIENDS" : "PUBLIC")
                    }
                  >
                    {visibility === "PUBLIC" ? (
                      <>
                        <span>🌐</span> Công khai
                      </>
                    ) : (
                      <>
                        <span>👥</span> Bạn bè
                      </>
                    )}
                    <span>▼</span>
                  </button>
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
              <button
                className="create-post-modal-action-btn"
                type="button"
                title="Gắn thẻ bạn bè"
                disabled
              >
                <span className="create-post-modal-action-icon">👤</span>
                <span>Gắn thẻ bạn bè</span>
              </button>
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

