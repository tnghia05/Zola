import "../styles/feed.css";

interface FriendSuggestion {
  user: {
    _id: string;
    name?: string;
    avatar?: string;
  };
  mutualCount: number;
  mutualFriends: { name?: string }[];
}

interface RightSidebarProps {
  friendSuggestions?: FriendSuggestion[];
  isLoading?: boolean;
  sentRequests?: Record<string, boolean>;
  onSendRequest?: (userId: string) => void;
}

/**
 * Right Sidebar - Friend Suggestions Panel
 *
 * Design: MINIMALIST SUGGESTION CARDS
 * - Clean, card-based layout with subtle hover effects
 * - Mutual friends metadata for social proof
 * - Gradient action buttons with glow on hover
 */
export const RightSidebar = ({
  friendSuggestions = [],
  isLoading = false,
  sentRequests = {},
  onSendRequest,
}: RightSidebarProps) => {
  return (
    <div className="feed-card">
      <div className="feed-right-card-title">Gợi ý bạn bè</div>

      {isLoading && (
        <div style={{ opacity: 0.7 }}>Đang tải...</div>
      )}

      {!isLoading && friendSuggestions.length === 0 && (
        <p className="feed-right-text">Không có gợi ý nào lúc này.</p>
      )}

      <div className="suggestion-list">
        {friendSuggestions.map((suggestion) => (
          <div key={suggestion.user._id} className="suggestion-item">
            <div className="suggestion-avatar">
              {suggestion.user.avatar ? (
                <img src={suggestion.user.avatar} alt={suggestion.user.name} />
              ) : (
                <div className="suggestion-avatar-initials">
                  {suggestion.user.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
              )}
            </div>

            <div className="suggestion-info">
              <div className="suggestion-name">{suggestion.user.name}</div>
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

            {onSendRequest && (
              <button
                className="suggestion-btn"
                onClick={() => onSendRequest(suggestion.user._id)}
                disabled={sentRequests[suggestion.user._id]}
              >
                {sentRequests[suggestion.user._id] ? "Đã gửi" : "Kết bạn"}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
