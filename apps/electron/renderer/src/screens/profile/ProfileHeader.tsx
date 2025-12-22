import { useRef } from "react";
import { FacebookNavbarWeb } from "@zola/app/components/FacebookNavbar.web";
import { AvatarCropModal } from "@zola/app/components/AvatarCropModal";

interface ProfileHeaderProps {
  user: any;
  isSelf: boolean;
  isBlocked: boolean;
  hasBlockedYou: boolean;
  isFriend: boolean;
  friendRequestSent: boolean;
  isSendingRequest: boolean;
  isUploadingCover: boolean;
  isUploadingAvatar: boolean;
  avatarCropFile: File | null;
  coverInputRef: React.RefObject<HTMLInputElement | null>;
  avatarInputRef: React.RefObject<HTMLInputElement | null>;
  handleCoverUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleAvatarFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleAvatarCropSave: (croppedBlob: Blob) => Promise<void>;
  setAvatarCropFile: (file: File | null) => void;
  handleSendFriendRequest: () => Promise<void>;
  handleBlock: () => Promise<void>;
  handleUnblock: () => Promise<void>;
  handleUnfriend: () => Promise<void>;
  targetUserId: string;
            navigate: (path: string) => void;
  onNavigate: (path: string) => void;
}

export const ProfileHeader = ({
  user,
  isSelf,
  isBlocked,
  hasBlockedYou,
  isFriend,
  friendRequestSent,
  isSendingRequest,
  isUploadingCover,
  isUploadingAvatar,
  avatarCropFile,
  coverInputRef,
  avatarInputRef,
  handleCoverUpload,
  handleAvatarFileSelect,
  handleAvatarCropSave,
  setAvatarCropFile,
  handleSendFriendRequest,
  handleBlock,
  handleUnblock,
  handleUnfriend,
  targetUserId,
  navigate,
  onNavigate,
}: ProfileHeaderProps) => {
  const menuRef = useRef<HTMLDivElement>(null);

  return (
    <>
      {/* Cover Photo */}
      <div className="profile-cover-wrapper" style={{ position: "relative", width: "100%", zIndex: 1, marginBottom: 0 }}>
        {user.coverImage && user.coverImage.trim() !== "" ? (
          <img
            src={user.coverImage}
            alt="Cover"
            className="profile-cover"
            style={{ width: "100%", height: "350px", display: "block", objectFit: "cover" }}
          />
        ) : (
          <div className="profile-cover-gradient" style={{ width: "100%", height: "350px", position: "relative" }} />
        )}
        {isSelf && (
          <div
            className="profile-cover-edit-btn-wrapper"
            style={{
              position: "absolute",
              bottom: 16,
              right: 16,
              zIndex: 10000,
              pointerEvents: "auto",
              isolation: "isolate",
            }}
          >
            <input
              id="cover-image-input"
              type="file"
              accept="image/*"
              ref={coverInputRef}
              style={{ display: "none" }}
              onChange={handleCoverUpload}
              disabled={isUploadingCover}
            />
            <label
              htmlFor="cover-image-input"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 16px",
                background: isUploadingCover ? "rgba(200,200,200,0.9)" : "rgba(255,255,255,0.9)",
                border: "none",
                borderRadius: 8,
                color: "#050505",
                fontSize: 14,
                fontWeight: 600,
                cursor: isUploadingCover ? "wait" : "pointer",
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                pointerEvents: isUploadingCover ? "none" : "auto",
              }}
            >
              <span>📷</span>
              <span>{isUploadingCover ? "Đang tải..." : "Chỉnh sửa ảnh bìa"}</span>
            </label>
          </div>
        )}
      </div>

      <div className="profile-header">
        <div className="profile-avatar-wrapper">
          {/* Avatar with edit button */}
          <div className="profile-avatar" style={{ position: "relative" }}>
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} />
            ) : (
              <span className="profile-avatar-initials">
                {user.name?.charAt(0)?.toUpperCase() || "U"}
              </span>
            )}
            {isSelf && (
              <>
                <input
                  id="avatar-image-input"
                  type="file"
                  accept="image/*"
                  ref={avatarInputRef}
                  style={{ display: "none" }}
                  onChange={handleAvatarFileSelect}
                  disabled={isUploadingAvatar}
                />
                <label
                  htmlFor="avatar-image-input"
                  style={{
                    position: "absolute",
                    bottom: 8,
                    right: 8,
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: isUploadingAvatar ? "rgba(200,200,200,0.9)" : "#3a3b3c",
                    border: "2px solid #242526",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: isUploadingAvatar ? "wait" : "pointer",
                    fontSize: 18,
                    zIndex: 1000,
                    pointerEvents: isUploadingAvatar ? "none" : "auto",
                  }}
                >
                  {isUploadingAvatar ? "⏳" : "📷"}
                </label>
              </>
            )}
          </div>

          <div className="profile-actions">
            {isSelf ? (
              <>
                <button className="profile-action-btn profile-action-btn--primary">
                  <span>➕</span>
                  <span>Thêm vào tin</span>
                </button>
                <button className="profile-action-btn profile-action-btn--secondary">
                  <span>✏️</span>
                  <span>Chỉnh sửa trang cá nhân</span>
                </button>
              </>
            ) : (
              <>
                {hasBlockedYou ? (
                  <div style={{ padding: "8px 16px", background: "#3A3B3C", borderRadius: "8px", color: "#B0B3B8", fontSize: "14px" }}>
                    Người này đã chặn bạn
                  </div>
                ) : (
                  <>
                    <button
                      className="profile-action-btn profile-action-btn--primary"
                      onClick={handleSendFriendRequest}
                      disabled={isSendingRequest || friendRequestSent || isFriend}
                      style={{
                        opacity: (isSendingRequest || friendRequestSent || isFriend) ? 0.6 : 1,
                        cursor: (isSendingRequest || friendRequestSent || isFriend) ? "not-allowed" : "pointer",
                      }}
                    >
                      <span>👤</span>
                      <span>
                        {isSendingRequest
                          ? "Đang gửi..."
                          : friendRequestSent
                          ? "Đã gửi lời mời"
                          : isFriend
                          ? "Bạn bè"
                          : "Thêm bạn bè"}
                      </span>
                    </button>
                    <button className="profile-action-btn profile-action-btn--secondary" onClick={() => onNavigate(`/chat/${targetUserId}`)}>
                      <span>💬</span>
                      <span>Nhắn tin</span>
                    </button>
                    <div style={{ position: "relative" }}>
                      <button
                        className="profile-action-btn profile-action-btn--secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          const menu = document.getElementById(`profile-menu-${targetUserId}`);
                          if (menu) {
                            menu.style.display = menu.style.display === "block" ? "none" : "block";
                          }
                        }}
                      >
                        <span>⋯</span>
                      </button>
                      <div
                        id={`profile-menu-${targetUserId}`}
                        ref={menuRef}
                        style={{
                          display: "none",
                          position: "absolute",
                          top: "100%",
                          right: 0,
                          marginTop: "8px",
                          background: "#242526",
                          border: "1px solid #3A3B3C",
                          borderRadius: "8px",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                          zIndex: 1000,
                          minWidth: "200px",
                        }}
                      >
                        {isBlocked ? (
                          <button
                            onClick={handleUnblock}
                            style={{
                              width: "100%",
                              padding: "12px 16px",
                              background: "transparent",
                              border: "none",
                              color: "#E4E6EB",
                              textAlign: "left",
                              cursor: "pointer",
                              fontSize: "14px",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "#3A3B3C")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                          >
                            Bỏ chặn
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={handleBlock}
                              style={{
                                width: "100%",
                                padding: "12px 16px",
                                background: "transparent",
                                border: "none",
                                color: "#E4E6EB",
                                textAlign: "left",
                                cursor: "pointer",
                                fontSize: "14px",
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = "#3A3B3C")}
                              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                            >
                              Chặn
                            </button>
                            {isFriend && (
                              <button
                                onClick={handleUnfriend}
                                style={{
                                  width: "100%",
                                  padding: "12px 16px",
                                  background: "transparent",
                                  border: "none",
                                  color: "#E4E6EB",
                                  textAlign: "left",
                                  cursor: "pointer",
                                  fontSize: "14px",
                                  borderTop: "1px solid #3A3B3C",
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.background = "#3A3B3C")}
                                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                              >
                                Hủy kết bạn
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        <div className="profile-info">
          <h1 className="profile-name" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {user.name || "Người dùng"}
            {user.isVerified && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  background: "#1877f2",
                  color: "white",
                  fontSize: 12,
                  fontWeight: 700,
                  lineHeight: 1,
                }}
                title="Verified"
              >
                ✓
              </span>
            )}
          </h1>
          {user.email && <p className="profile-email">{user.email}</p>}
        </div>
      </div>

      {avatarCropFile && (
        <AvatarCropModal
          imageFile={avatarCropFile}
          onClose={() => setAvatarCropFile(null)}
          onSave={handleAvatarCropSave}
        />
      )}
    </>
  );
};

