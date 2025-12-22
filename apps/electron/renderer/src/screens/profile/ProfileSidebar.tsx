import { useNavigate } from "react-router-dom";

interface ProfileSidebarProps {
  user: any;
  isSelf: boolean;
  userPhotos: Array<{ url: string; postId: string }>;
  displayFriends: any[];
  friends: any[];
  setShowEditProfile: (show: boolean) => void;
}

export const ProfileSidebar = ({
  user,
  isSelf,
  userPhotos,
  displayFriends,
  friends,
  setShowEditProfile,
}: ProfileSidebarProps) => {
  const navigate = useNavigate();

  return (
    <div className="profile-left-column" style={{ width: "360px", flexShrink: 0, position: "sticky", top: "80px", height: "fit-content" }}>
      <div className="profile-intro-card">
        <h3>Giới thiệu</h3>
        {user.bio && <div className="profile-intro-item">"{user.bio}"</div>}
        <div className="profile-intro-item">
          {user.currentCity ? `Sống tại ${user.currentCity}` : "Chưa cập nhật nơi ở"}
        </div>
        <div className="profile-intro-item">
          {user.hometown ? `Đến từ ${user.hometown}` : "Chưa cập nhật quê quán"}
        </div>
        <div className="profile-intro-item">
          {user.relationshipStatus ? user.relationshipStatus : "Chưa cập nhật tình trạng"}
        </div>
        {user.works && user.works.length > 0 && (
          <div className="profile-intro-item">
            🏢 Làm việc tại:
            <ul style={{ margin: "6px 0 0 14px", padding: 0 }}>
              {user.works.map((w: string, idx: number) => (
                <li key={idx}>{w}</li>
              ))}
            </ul>
          </div>
        )}
        {user.colleges && user.colleges.length > 0 && (
          <div className="profile-intro-item">
            🎓 Đại học / Cao đẳng:
            <ul style={{ margin: "6px 0 0 14px", padding: 0 }}>
              {user.colleges.map((c: string, idx: number) => (
                <li key={idx}>{c}</li>
              ))}
            </ul>
          </div>
        )}
        {user.highSchools && user.highSchools.length > 0 && (
          <div className="profile-intro-item">
            🏫 Trung học:
            <ul style={{ margin: "6px 0 0 14px", padding: 0 }}>
              {user.highSchools.map((h: string, idx: number) => (
                <li key={idx}>{h}</li>
              ))}
            </ul>
          </div>
        )}
        {user.phone && (
          <div className="profile-intro-item">
            📞 {user.phone}
          </div>
        )}
        {user.instagram && (
          <div className="profile-intro-item">📸 Instagram: {user.instagram}</div>
        )}
        {user.facebook && (
          <div className="profile-intro-item">📘 Facebook: {user.facebook}</div>
        )}
        {user.website && (
          <div className="profile-intro-item">🔗 Website: {user.website}</div>
        )}
        {isSelf && (
          <button
            style={{ width: "100%", padding: "8px", background: "#3A3B3C", color: "#E4E6EB", borderRadius: "6px", border: "none", fontWeight: 600, marginTop: "16px", cursor: "pointer" }}
            onClick={() => setShowEditProfile(true)}
          >
            Chỉnh sửa chi tiết
          </button>
        )}
      </div>

      <div className="profile-photos-card">
        <div className="profile-card-header">
          <h3>Ảnh</h3>
          {userPhotos.length > 0 && (
            <button className="profile-card-link">Xem tất cả ảnh</button>
          )}
        </div>
        {userPhotos.length > 0 ? (
          <div className="profile-photos-grid">
            {userPhotos.map((photo, index) => (
              <div key={`${photo.postId}-${index}`} className="profile-photo-item">
                <img src={photo.url} alt={`Photo ${index + 1}`} className="profile-photo-img" />
              </div>
            ))}
          </div>
        ) : (
          <div className="profile-widget-empty">
            {isSelf ? "Bạn chưa có ảnh nào" : "Chưa có ảnh"}
          </div>
        )}
      </div>

      <div className="profile-friends-card">
        <div className="profile-card-header">
          <div>
            <h3>Bạn bè</h3>
            <p className="profile-friends-count">{friends.length} người bạn</p>
          </div>
          {displayFriends.length > 0 && (
            <button className="profile-card-link" onClick={() => navigate("/friends")}>
              Xem tất cả bạn bè
            </button>
          )}
        </div>
        {displayFriends.length > 0 ? (
          <div className="profile-friends-grid">
            {displayFriends.map((friend) => (
              <div
                key={friend._id}
                className="profile-friend-item"
                onClick={() => navigate(`/profile/${friend._id}`)}
                style={{ cursor: "pointer" }}
              >
                <div className="profile-friend-avatar">
                  {friend.avatar ? (
                    <img src={friend.avatar} alt={friend.name} className="profile-friend-img" />
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)", color: "white", fontWeight: 700, fontSize: "24px" }}>
                      {friend.name?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                  )}
                </div>
                <div className="profile-friend-name">{friend.name || friend.email || "User"}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="profile-widget-empty">
            {isSelf ? "Bạn chưa có bạn bè nào" : "Chưa có bạn bè"}
          </div>
        )}
      </div>
    </div>
  );
};

