import { useNavigate } from "react-router-dom";

interface ProfileFriendsTabProps {
  user: any;
  isSelf: boolean;
  friends: any[];
  activeFriendsTab: "all" | "recent" | "birthdays" | "college" | "city" | "hometown" | "following";
  setActiveFriendsTab: (tab: "all" | "recent" | "birthdays" | "college" | "city" | "hometown" | "following") => void;
  friendsSearchQuery: string;
  setFriendsSearchQuery: (query: string) => void;
}

export const ProfileFriendsTab = ({
  user,
  isSelf,
  friends,
  activeFriendsTab,
  setActiveFriendsTab,
  friendsSearchQuery,
  setFriendsSearchQuery,
}: ProfileFriendsTabProps) => {
  const navigate = useNavigate();

  let filteredFriends = friends;
  
  // Filter by search query
  if (friendsSearchQuery.trim()) {
    const query = friendsSearchQuery.toLowerCase();
    filteredFriends = friends.filter(
      (f) =>
        f.name?.toLowerCase().includes(query) ||
        f.email?.toLowerCase().includes(query) ||
        f.username?.toLowerCase().includes(query)
    );
  }
  
  // Filter by sub-tab (simplified - can be enhanced with backend)
  if (activeFriendsTab === "recent") {
    filteredFriends = [...filteredFriends].reverse();
  } else if (activeFriendsTab === "college" && user.colleges && user.colleges.length > 0) {
    filteredFriends = filteredFriends; // Placeholder
  } else if (activeFriendsTab === "city" && user.currentCity) {
    filteredFriends = filteredFriends; // Placeholder
  } else if (activeFriendsTab === "hometown" && user.hometown) {
    filteredFriends = filteredFriends; // Placeholder
  }

  return (
    <div className="profile-friends-tab">
      <div style={{ marginBottom: "16px" }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: "16px" }}>Bạn bè</h2>
        
        {/* Sub-tabs */}
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: "16px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 4, background: "#242526", padding: "4px", borderRadius: 999, flexWrap: "wrap" }}>
            {[
              { key: "all", label: "Tất cả bạn bè" },
              { key: "recent", label: "Đã thêm gần đây" },
              { key: "birthdays", label: "Sinh nhật" },
              { key: "college", label: "Đại học" },
              { key: "city", label: "Tỉnh/Thành phố hiện tại" },
              { key: "hometown", label: "Quê quán" },
              { key: "following", label: "Đang theo dõi" },
            ].map((tab) => (
              <button
                key={tab.key}
                className={`profile-tab-mini ${activeFriendsTab === tab.key ? "profile-tab-mini--active" : ""}`}
                onClick={() => setActiveFriendsTab(tab.key as any)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          
          {/* Search and action buttons */}
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginLeft: "auto" }}>
            <input
              type="text"
              placeholder="Tìm kiếm"
              value={friendsSearchQuery}
              onChange={(e) => setFriendsSearchQuery(e.target.value)}
              style={{
                padding: "8px 12px",
                background: "#3a3b3c",
                border: "none",
                borderRadius: 20,
                color: "#e4e6eb",
                fontSize: 14,
                width: 200,
              }}
            />
            {isSelf && (
              <>
                <button
                  className="profile-action-btn profile-action-btn--secondary"
                  style={{ fontSize: 14, padding: "8px 16px" }}
                  onClick={() => navigate("/friends/requests")}
                >
                  Lời mời kết bạn
                </button>
                <button
                  className="profile-action-btn profile-action-btn--secondary"
                  style={{ fontSize: 14, padding: "8px 16px" }}
                  onClick={() => navigate("/friends/find")}
                >
                  Tìm bạn bè
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Friends list */}
      {filteredFriends.length > 0 ? (
        <div className="profile-friends-list" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
          {filteredFriends.map((friend) => (
            <div
              key={friend._id}
              className="profile-friend-card"
              onClick={() => navigate(`/profile/${friend._id}`)}
              style={{
                cursor: "pointer",
                background: "#242526",
                borderRadius: 8,
                overflow: "hidden",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div className="profile-friend-avatar" style={{ width: "100%", aspectRatio: "1", overflow: "hidden" }}>
                {friend.avatar ? (
                  <img
                    src={friend.avatar}
                    alt={friend.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "100%",
                      height: "100%",
                      background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                      color: "white",
                      fontWeight: 700,
                      fontSize: "48px",
                    }}
                  >
                    {friend.name?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                )}
              </div>
              <div style={{ padding: "12px" }}>
                <div className="profile-friend-name" style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>
                  {friend.name || friend.email || "User"}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="profile-widget-empty" style={{ padding: "40px", textAlign: "center" }}>
          {friendsSearchQuery.trim()
            ? "Không tìm thấy bạn bè nào"
            : isSelf
            ? "Bạn chưa có bạn bè nào"
            : "Chưa có bạn bè"}
        </div>
      )}
    </div>
  );
};

