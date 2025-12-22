interface ProfilePhotosTabProps {
  user: any;
  isSelf: boolean;
  photosAuthored: Array<{ postId: string; url: string }>;
  photosTagged: Array<{ postId: string; url: string }>;
  activePhotoTab: "authored" | "tagged";
  setActivePhotoTab: (tab: "authored" | "tagged") => void;
}

export const ProfilePhotosTab = ({
  user,
  isSelf,
  photosAuthored,
  photosTagged,
  activePhotoTab,
  setActivePhotoTab,
}: ProfilePhotosTabProps) => {
  return (
    <div className="profile-photos-tab">
      <div style={{ marginBottom: "12px", display: "flex", gap: 12, alignItems: "center" }}>
        <span style={{ fontWeight: 700 }}>Ảnh</span>
        <div style={{ display: "flex", gap: 8, background: "#242526", padding: "4px", borderRadius: 999 }}>
          <button
            className={`profile-tab-mini ${activePhotoTab === "authored" ? "profile-tab-mini--active" : ""}`}
            onClick={() => setActivePhotoTab("authored")}
          >
            Ảnh của {isSelf ? "bạn" : "họ"}
          </button>
          <button
            className={`profile-tab-mini ${activePhotoTab === "tagged" ? "profile-tab-mini--active" : ""}`}
            onClick={() => setActivePhotoTab("tagged")}
          >
            Ảnh có mặt {isSelf ? "bạn" : "họ"}
          </button>
        </div>
      </div>

      {activePhotoTab === "authored" && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Ảnh của {isSelf ? "bạn" : user.name || "người này"}</div>
          {photosAuthored.length > 0 ? (
            <div className="profile-photos-grid">
              {photosAuthored.map((photo) => (
                <div key={`${photo.postId}-${photo.url}`} className="profile-photo-item">
                  <img src={photo.url} alt="photo" className="profile-photo-img" />
                </div>
              ))}
            </div>
          ) : (
            <div className="profile-widget-empty">Chưa có ảnh</div>
          )}
        </div>
      )}

      {activePhotoTab === "tagged" && (
        <div>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Ảnh có mặt {isSelf ? "bạn" : user.name || "người này"}</div>
          {photosTagged.length > 0 ? (
            <div className="profile-photos-grid">
              {photosTagged.map((photo) => (
                <div key={`${photo.postId}-${photo.url}`} className="profile-photo-item">
                  <img src={photo.url} alt="photo" className="profile-photo-img" />
                </div>
              ))}
            </div>
          ) : (
            <div className="profile-widget-empty">Chưa có ảnh được tag</div>
          )}
        </div>
      )}
    </div>
  );
};

