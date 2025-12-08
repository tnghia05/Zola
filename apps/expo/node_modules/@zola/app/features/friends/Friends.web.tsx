"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getFriends,
  getPendingFriendRequestsApi,
  sendFriendRequestApi,
  respondFriendRequestApi,
  searchUsers,
  getUsersByIds,
  getCurrentUserId,
  getUserById,
} from "@zola/app/api";
import { useFriendSuggestions } from "@zola/app/hooks/useSocial";
import { FacebookNavbarWeb } from "@zola/app/components/FacebookNavbar.web";
import { HomeIcon, MessengerIcon, FriendsIcon } from "@zola/app/components/Icons";
import "@zola/app/styles/feed.css";
import "@zola/app/styles/facebook-navbar.css";

const FriendsScreen = () => {
  const router = useRouter();
  const [friends, setFriends] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"friends" | "requests" | "search">("friends");
  const { items: suggestions, isLoading: suggestionsLoading, reload: reloadSuggestions } =
    useFriendSuggestions(8);
  const [sentSuggestionIds, setSentSuggestionIds] = useState<Record<string, boolean>>({});
  const [currentUser, setCurrentUser] = useState<{
    _id: string;
    name: string;
    avatar?: string;
  } | null>(null);

  useEffect(() => {
    loadFriends();
    loadPendingRequests();
    loadCurrentUser();
  }, []);

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

  const loadFriends = async () => {
    try {
      const data = await getFriends();
      if (data.friendIds && data.friendIds.length > 0) {
        const users = await getUsersByIds(data.friendIds);
        setFriends(users.users || []);
      } else {
        setFriends([]);
      }
    } catch (error) {
      console.error("Failed to load friends:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPendingRequests = async () => {
    try {
      const data = await getPendingFriendRequestsApi();
      setPendingRequests(data.received || []);
    } catch (error) {
      console.error("Failed to load pending requests:", error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const data = await searchUsers(searchQuery, 1, 20);
      setSearchResults(data.users || []);
      setActiveTab("search");
    } catch (error) {
      console.error("Search failed:", error);
    }
  };

  const handleSendRequest = async (userId: string) => {
    try {
      await sendFriendRequestApi(userId);
      alert("Đã gửi lời mời kết bạn!");
      setSentSuggestionIds((prev) => ({ ...prev, [userId]: true }));
      reloadSuggestions();
    } catch (error: any) {
      alert(error.response?.data?.error || "Lỗi khi gửi lời mời");
    }
  };

  const handleRespondRequest = async (friendshipId: string, action: "accept" | "decline") => {
    try {
      await respondFriendRequestApi(friendshipId, action);
      if (action === "accept") {
        loadFriends();
      }
      loadPendingRequests();
    } catch (error) {
      console.error("Failed to respond:", error);
    }
  };

  return (
    <div className="feed-root">
      <FacebookNavbarWeb />

      <div className="feed-main-layout">
        <div className="feed-inner">
          {/* LEFT SIDEBAR MENU giống Desktop */}
          <aside className="feed-sidebar">
            <div className="feed-nav-section-title">Menu</div>
            <div className="feed-nav-item" onClick={() => router.push("/feed")}>
              <div className="feed-nav-icon">
                <HomeIcon size={24} color="currentColor" />
              </div>
              <span>Bảng tin</span>
            </div>
            <div className="feed-nav-item" onClick={() => router.push("/conversations")}>
              <div className="feed-nav-icon">
                <MessengerIcon size={24} color="currentColor" />
              </div>
              <span>Tin nhắn</span>
            </div>
            <div className="feed-nav-item feed-nav-item--active">
              <div className="feed-nav-icon">
                <FriendsIcon size={24} color="currentColor" />
              </div>
              <span>Bạn bè</span>
            </div>
          </aside>

          {/* CENTER: Friends content */}
          <main className="feed-main">
            <div className="feed-header">
              <h2>Bạn bè</h2>
            </div>

            <div className="friends-tabs">
              <button
                className={`friends-tab ${activeTab === "friends" ? "active" : ""}`}
                onClick={() => setActiveTab("friends")}
              >
                Bạn bè ({friends.length})
              </button>
              <button
                className={`friends-tab ${activeTab === "requests" ? "active" : ""}`}
                onClick={() => setActiveTab("requests")}
              >
                Lời mời ({pendingRequests.length})
              </button>
              <button
                className={`friends-tab ${activeTab === "search" ? "active" : ""}`}
                onClick={() => setActiveTab("search")}
              >
                Tìm kiếm
              </button>
            </div>

            {activeTab === "search" && (
              <div className="friends-search">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm người dùng..."
                  className="friends-search-input"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSearch();
                  }}
                />
                <button className="friends-search-btn" onClick={handleSearch}>
                  Tìm
                </button>
              </div>
            )}

            <div className="friends-list">
              {isLoading && <div style={{ padding: 20 }}>Đang tải...</div>}

              {activeTab === "friends" && (
                <>
                  {friends.length === 0 && !isLoading && (
                    <div style={{ padding: 20, opacity: 0.7, textAlign: "center" }}>
                      Bạn chưa có bạn bè nào.
                    </div>
                  )}
                  {friends.map((friend) => (
                    <div key={friend._id} className="friend-item">
                      <div className="friend-avatar">
                        {friend.avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={friend.avatar} alt={friend.name} />
                        ) : (
                          <div className="friend-avatar-initials">
                            {friend.name?.charAt(0)?.toUpperCase() || "U"}
                          </div>
                        )}
                      </div>
                      <div className="friend-info">
                        <div className="friend-name">{friend.name || "Người dùng"}</div>
                        <div className="friend-email">{friend.email}</div>
                      </div>
                      <button
                        className="friend-action-btn"
                        onClick={() => router.push(`/profile/${friend._id}`)}
                      >
                        Xem trang
                      </button>
                    </div>
                  ))}
                </>
              )}

              {activeTab === "requests" && (
                <>
                  {pendingRequests.length === 0 && !isLoading && (
                    <div style={{ padding: 20, opacity: 0.7, textAlign: "center" }}>
                      Không có lời mời nào.
                    </div>
                  )}
                  {pendingRequests.map((req) => (
                    <div key={req._id} className="friend-item">
                      <div className="friend-avatar">
                        {req.user?.avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={req.user.avatar} alt={req.user.name} />
                        ) : (
                          <div className="friend-avatar-initials">
                            {req.user?.name?.charAt(0)?.toUpperCase() || "U"}
                          </div>
                        )}
                      </div>
                      <div className="friend-info">
                        <div className="friend-name">{req.user?.name || "Người dùng"}</div>
                        <div className="friend-email">{req.user?.email}</div>
                      </div>
                      <div className="friend-actions">
                        <button
                          className="friend-action-btn friend-action-btn--accept"
                          onClick={() => handleRespondRequest(req._id, "accept")}
                        >
                          Chấp nhận
                        </button>
                        <button
                          className="friend-action-btn friend-action-btn--decline"
                          onClick={() => handleRespondRequest(req._id, "decline")}
                        >
                          Từ chối
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {activeTab === "search" && (
                <>
                  {searchResults.length === 0 && searchQuery && (
                    <div style={{ padding: 20, opacity: 0.7, textAlign: "center" }}>
                      Không tìm thấy kết quả.
                    </div>
                  )}
                  {searchResults.map((user) => (
                    <div key={user._id} className="friend-item">
                      <div className="friend-avatar">
                        {user.avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={user.avatar} alt={user.name} />
                        ) : (
                          <div className="friend-avatar-initials">
                            {user.name?.charAt(0)?.toUpperCase() || "U"}
                          </div>
                        )}
                      </div>
                      <div className="friend-info">
                        <div className="friend-name">{user.name || "Người dùng"}</div>
                        <div className="friend-email">{user.email}</div>
                      </div>
                      <div className="friend-actions">
                        <button
                          className="friend-action-btn"
                          disabled={sentSuggestionIds[user._id]}
                          onClick={() => handleSendRequest(user._id)}
                        >
                          {sentSuggestionIds[user._id] ? "Đã gửi lời mời" : "Kết bạn"}
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </main>

          {/* RIGHT PANEL: Friend suggestions giống Desktop */}
          <aside className="feed-right-panel">
            <div className="feed-right-card">
              <h3>Gợi ý bạn bè</h3>
              {suggestionsLoading && <p style={{ opacity: 0.7 }}>Đang tải...</p>}
              {!suggestionsLoading && suggestions.length === 0 && (
                <p style={{ opacity: 0.7 }}>Không có gợi ý nào.</p>
              )}
              <div className="suggestion-list">
                {suggestions.map((suggestion) => (
                  <div key={suggestion.user._id} className="suggestion-item">
                    <div className="suggestion-avatar">
                      {suggestion.user.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={suggestion.user.avatar} alt={suggestion.user.name} />
                      ) : (
                        <div className="suggestion-avatar-initials">
                          {suggestion.user.name?.charAt(0)?.toUpperCase() || "U"}
                        </div>
                      )}
                    </div>
                    <div className="suggestion-info">
                      <div className="suggestion-name">
                        {suggestion.user.name || suggestion.user.email}
                      </div>
                      <div className="suggestion-mutual">
                        {suggestion.mutualCount} bạn chung
                      </div>
                      {suggestion.mutualFriends.length > 0 && (
                        <div className="suggestion-mutual-list">
                          {suggestion.mutualFriends
                            .map((mf) => mf.name)
                            .slice(0, 2)
                            .join(", ")}
                          {suggestion.mutualCount > 2 ? "..." : ""}
                        </div>
                      )}
                    </div>
                    <button
                      className="suggestion-btn"
                      disabled={sentSuggestionIds[suggestion.user._id]}
                      onClick={() => handleSendRequest(suggestion.user._id)}
                    >
                      {sentSuggestionIds[suggestion.user._id] ? "Đã gửi" : "Kết bạn"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default FriendsScreen;


