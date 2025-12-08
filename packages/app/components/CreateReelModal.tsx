import { useState, useRef, useEffect } from "react";
import { uploadMediaApi, getFriends, getUsersByIds, UserProfile, createReelApi } from "../api";
import { ReelIcon, FriendsIcon, GlobeIcon, LockIcon } from "./Icons";
import "../styles/feed.css";

interface CreateReelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: () => Promise<void> | void;
  currentUser: {
    _id: string;
    name: string;
    avatar?: string;
  } | null;
}

export const CreateReelModal = ({
  isOpen,
  onClose,
  onSubmit,
  currentUser,
}: CreateReelModalProps) => {
  const [caption, setCaption] = useState("");
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [visibility, setVisibility] = useState<"PUBLIC" | "FRIENDS" | "ONLY_ME">("PUBLIC");
  const [showVisibilityMenu, setShowVisibilityMenu] = useState(false);
  const [taggedUsers, setTaggedUsers] = useState<UserProfile[]>([]);
  const [friends, setFriends] = useState<UserProfile[]>([]);
  const [showTagMenu, setShowTagMenu] = useState(false);
  const [tagSearchQuery, setTagSearchQuery] = useState("");
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const videoElementRef = useRef<HTMLVideoElement>(null);
  const captionRef = useRef<HTMLTextAreaElement>(null);
  const visibilityMenuRef = useRef<HTMLDivElement>(null);
  const tagMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && captionRef.current) {
      captionRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal closes
      setCaption("");
      setSelectedVideo(null);
      if (videoPreview) URL.revokeObjectURL(videoPreview);
      if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
      setVideoPreview(null);
      setThumbnailPreview(null);
      setShowVisibilityMenu(false);
      setTaggedUsers([]);
      setShowTagMenu(false);
      setTagSearchQuery("");
      setVideoDuration(0);
      setUploadProgress(0);
      if (videoInputRef.current) {
        videoInputRef.current.value = "";
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

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      alert("Vui lòng chọn file video");
      return;
    }

    // Check file size (max 100MB)
    if (file.size > 100 * 1024 * 1024) {
      alert("Video không được vượt quá 100MB");
      return;
    }

    setSelectedVideo(file);
    const videoUrl = URL.createObjectURL(file);
    setVideoPreview(videoUrl);

    // Load video to get duration and generate thumbnail
    const video = document.createElement("video");
    video.src = videoUrl;
    video.onloadedmetadata = () => {
      setVideoDuration(video.duration);
      // Generate thumbnail at 1 second
      video.currentTime = Math.min(1, video.duration / 2);
      video.onseeked = () => {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0);
          const thumbnailUrl = canvas.toDataURL("image/jpeg");
          setThumbnailPreview(thumbnailUrl);
        }
      };
    };
  };

  const handleRemoveVideo = () => {
    setSelectedVideo(null);
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
      setVideoPreview(null);
    }
    if (thumbnailPreview) {
      URL.revokeObjectURL(thumbnailPreview);
      setThumbnailPreview(null);
    }
    setVideoDuration(0);
    if (videoInputRef.current) {
      videoInputRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    if (!selectedVideo) {
      alert("Vui lòng chọn video");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Upload video
      const videoResult = await uploadMediaApi(selectedVideo);
      setUploadProgress(50);

      // Upload thumbnail if available
      let thumbnailUrl = "";
      if (thumbnailPreview) {
        // Convert data URL to blob
        const response = await fetch(thumbnailPreview);
        const blob = await response.blob();
        const thumbnailFile = new File([blob], "thumbnail.jpg", { type: "image/jpeg" });
        const thumbnailResult = await uploadMediaApi(thumbnailFile);
        thumbnailUrl = thumbnailResult.url;
      }
      setUploadProgress(75);

      // Create reel
      await createReelApi({
        videoUrl: videoResult.url,
        thumbnailUrl: thumbnailUrl || videoResult.url, // Fallback to video URL if no thumbnail
        caption: caption.trim(),
        duration: videoDuration,
        visibility,
        taggedUsers: taggedUsers.map((u) => u._id),
      });

      setUploadProgress(100);

      // Call onSubmit callback if provided
      if (onSubmit) {
        await onSubmit();
      }

      // Close modal and reset
      onClose();
    } catch (error: any) {
      console.error("Failed to create reel:", error);
      alert(error.response?.data?.error || "Không thể đăng reel. Vui lòng thử lại.");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const filteredFriends = friends.filter(
    (friend) =>
      friend.name?.toLowerCase().includes(tagSearchQuery.toLowerCase()) ||
      friend.username?.toLowerCase().includes(tagSearchQuery.toLowerCase()) ||
      friend.email?.toLowerCase().includes(tagSearchQuery.toLowerCase())
  );

  const handleTagUser = (user: UserProfile) => {
    if (!taggedUsers.find((u) => u._id === user._id)) {
      setTaggedUsers([...taggedUsers, user]);
    }
    setTagSearchQuery("");
    setShowTagMenu(false);
  };

  const handleRemoveTag = (userId: string) => {
    setTaggedUsers(taggedUsers.filter((u) => u._id !== userId));
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel" style={{ maxWidth: 600 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Tạo Reel</div>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          {/* Video Preview/Upload */}
          <div style={{ marginBottom: "16px" }}>
            {videoPreview ? (
              <div style={{ position: "relative", width: "100%", background: "#000", borderRadius: "8px", overflow: "hidden" }}>
                <video
                  ref={videoElementRef}
                  src={videoPreview}
                  controls
                  style={{ width: "100%", maxHeight: "400px", display: "block" }}
                />
                <button
                  onClick={handleRemoveVideo}
                  style={{
                    position: "absolute",
                    top: "8px",
                    right: "8px",
                    background: "rgba(0,0,0,0.7)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "50%",
                    width: "32px",
                    height: "32px",
                    cursor: "pointer",
                    fontSize: "18px",
                  }}
                >
                  ×
                </button>
                {videoDuration > 0 && (
                  <div style={{ position: "absolute", bottom: "8px", left: "8px", background: "rgba(0,0,0,0.7)", color: "#fff", padding: "4px 8px", borderRadius: "4px", fontSize: "12px" }}>
                    {Math.floor(videoDuration / 60)}:{(Math.floor(videoDuration % 60)).toString().padStart(2, "0")}
                  </div>
                )}
              </div>
            ) : (
              <div
                onClick={() => videoInputRef.current?.click()}
                style={{
                  border: "2px dashed #3a3b3c",
                  borderRadius: "8px",
                  padding: "60px 20px",
                  textAlign: "center",
                  cursor: "pointer",
                  background: "#242526",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#2a2b2c")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#242526")}
              >
                <div style={{ marginBottom: "12px", display: "flex", justifyContent: "center" }}>
                  <ReelIcon size={48} color="#0966FF" />
                </div>
                <div style={{ color: "#e4e6eb", fontSize: "16px", fontWeight: 600, marginBottom: "4px" }}>
                  Chọn video để đăng
                </div>
                <div style={{ color: "#b0b3b8", fontSize: "14px" }}>
                  Tối đa 100MB
                </div>
              </div>
            )}
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              style={{ display: "none" }}
              onChange={handleVideoSelect}
            />
          </div>

          {/* Caption */}
          <div style={{ marginBottom: "16px" }}>
            <textarea
              ref={captionRef}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Viết chú thích..."
              maxLength={2200}
              style={{
                width: "100%",
                minHeight: "100px",
                padding: "12px",
                background: "#3a3b3c",
                border: "1px solid #4a4b4c",
                borderRadius: "8px",
                color: "#e4e6eb",
                fontSize: "15px",
                fontFamily: "inherit",
                resize: "vertical",
              }}
            />
            <div style={{ textAlign: "right", color: "#b0b3b8", fontSize: "12px", marginTop: "4px" }}>
              {caption.length}/2200
            </div>
          </div>

          {/* Tagged Users */}
          {taggedUsers.length > 0 && (
            <div style={{ marginBottom: "16px", display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {taggedUsers.map((user) => (
                <div
                  key={user._id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "#3a3b3c",
                    padding: "6px 12px",
                    borderRadius: "20px",
                    fontSize: "14px",
                  }}
                >
                  <span style={{ color: "#e4e6eb" }}>@{user.name || user.username || user.email}</span>
                  <button
                    onClick={() => handleRemoveTag(user._id)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#b0b3b8",
                      cursor: "pointer",
                      fontSize: "16px",
                      padding: 0,
                      width: "20px",
                      height: "20px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Tag Friends */}
          <div style={{ marginBottom: "16px", position: "relative" }}>
            <input
              type="text"
              value={tagSearchQuery}
              onChange={(e) => {
                setTagSearchQuery(e.target.value);
                setShowTagMenu(true);
              }}
              onFocus={() => setShowTagMenu(true)}
              placeholder="Gắn thẻ bạn bè..."
              style={{
                width: "100%",
                padding: "10px 12px",
                background: "#3a3b3c",
                border: "1px solid #4a4b4c",
                borderRadius: "8px",
                color: "#e4e6eb",
                fontSize: "14px",
              }}
            />
            {showTagMenu && filteredFriends.length > 0 && (
              <div
                ref={tagMenuRef}
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  marginTop: "4px",
                  background: "#242526",
                  border: "1px solid #3a3b3c",
                  borderRadius: "8px",
                  maxHeight: "200px",
                  overflowY: "auto",
                  zIndex: 1000,
                }}
              >
                {filteredFriends.map((friend) => (
                  <div
                    key={friend._id}
                    onClick={() => handleTagUser(friend)}
                    style={{
                      padding: "12px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#3a3b3c")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    {friend.avatar ? (
                      <img
                        src={friend.avatar}
                        alt={friend.name || ""}
                        style={{ width: "40px", height: "40px", borderRadius: "50%" }}
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
                        }}
                      >
                        {friend.name?.charAt(0)?.toUpperCase() || "U"}
                      </div>
                    )}
                    <div>
                      <div style={{ color: "#e4e6eb", fontSize: "14px", fontWeight: 600 }}>
                        {friend.name || friend.username || friend.email}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Visibility */}
          <div style={{ marginBottom: "16px", position: "relative" }}>
            <button
              onClick={() => setShowVisibilityMenu(!showVisibilityMenu)}
              style={{
                width: "100%",
                padding: "10px 12px",
                background: "#3a3b3c",
                border: "1px solid #4a4b4c",
                borderRadius: "8px",
                color: "#e4e6eb",
                fontSize: "14px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {visibility === "PUBLIC" && <><GlobeIcon size={16} color="currentColor" /> Công khai</>}
                {visibility === "FRIENDS" && <><FriendsIcon size={16} color="currentColor" /> Bạn bè</>}
                {visibility === "ONLY_ME" && <><LockIcon size={16} color="currentColor" /> Chỉ mình tôi</>}
              </span>
              <span>▼</span>
            </button>
            {showVisibilityMenu && (
              <div
                ref={visibilityMenuRef}
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  marginTop: "4px",
                  background: "#242526",
                  border: "1px solid #3a3b3c",
                  borderRadius: "8px",
                  overflow: "hidden",
                  zIndex: 1000,
                }}
              >
                {[
                  { value: "PUBLIC", label: "Công khai", desc: "Mọi người có thể xem", Icon: GlobeIcon },
                  { value: "FRIENDS", label: "Bạn bè", desc: "Chỉ bạn bè có thể xem", Icon: FriendsIcon },
                  { value: "ONLY_ME", label: "Chỉ mình tôi", desc: "Chỉ bạn có thể xem", Icon: LockIcon },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setVisibility(option.value as any);
                      setShowVisibilityMenu(false);
                    }}
                    style={{
                      width: "100%",
                      padding: "12px",
                      background: visibility === option.value ? "#3a3b3c" : "transparent",
                      border: "none",
                      color: "#e4e6eb",
                      fontSize: "14px",
                      textAlign: "left",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                    }}
                    onMouseEnter={(e) => {
                      if (visibility !== option.value) {
                        e.currentTarget.style.background = "#3a3b3c";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (visibility !== option.value) {
                        e.currentTarget.style.background = "transparent";
                      }
                    }}
                  >
                    <span style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}>
                      <option.Icon size={16} color="currentColor" /> {option.label}
                    </span>
                    <span style={{ fontSize: "12px", color: "#b0b3b8" }}>{option.desc}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div style={{ marginBottom: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span style={{ color: "#e4e6eb", fontSize: "14px" }}>Đang tải lên...</span>
                <span style={{ color: "#b0b3b8", fontSize: "14px" }}>{uploadProgress}%</span>
              </div>
              <div
                style={{
                  width: "100%",
                  height: "8px",
                  background: "#3a3b3c",
                  borderRadius: "4px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${uploadProgress}%`,
                    height: "100%",
                    background: "#2374e1",
                    transition: "width 0.3s",
                  }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="modal-button modal-button--secondary" onClick={onClose} disabled={isUploading}>
            Hủy
          </button>
          <button
            className="modal-button modal-button--primary"
            onClick={handleSubmit}
            disabled={!selectedVideo || isUploading}
          >
            {isUploading ? "Đang đăng..." : "Đăng Reel"}
          </button>
        </div>
      </div>
    </div>
  );
};

