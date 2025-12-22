import { PostCard } from "@zola/app/components/PostCard.web";
import type { ReactionType } from "@zola/app/api";

interface ProfilePostsTabProps {
  user: any;
  isSelf: boolean;
  posts: any[];
  isLoading: boolean;
  postReactions: Record<string, ReactionType | null>;
  handleSelectReaction: (postId: string, reaction: ReactionType) => Promise<void>;
  handleClearReaction: (postId: string) => Promise<void>;
}

export const ProfilePostsTab = ({
  user,
  isSelf,
  posts,
  isLoading,
  postReactions,
  handleSelectReaction,
  handleClearReaction,
}: ProfilePostsTabProps) => {
  return (
    <>
      {isSelf && (
        <div className="profile-create-post-card">
          <div className="profile-create-post-header">
            <div className="profile-create-post-avatar">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} />
              ) : (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", color: "white", fontWeight: 700 }}>
                  {user.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
              )}
            </div>
            <div className="profile-create-post-input">
              {user.name ? `Bạn đang nghĩ gì, ${user.name}?` : "Bạn đang nghĩ gì?"}
            </div>
          </div>
        </div>
      )}

      <div className="profile-posts-container">
        {posts.map((post) => (
          <PostCard
            key={post._id}
            post={post}
            reaction={postReactions[post._id] || null}
            onSelectReaction={handleSelectReaction}
            onClearReaction={handleClearReaction}
          />
        ))}
        {isLoading && (
          <div style={{ textAlign: "center", padding: "16px", color: "#B0B3B8" }}>
            Đang tải...
          </div>
        )}
        {!isLoading && posts.length === 0 && (
          <div style={{ textAlign: "center", padding: "32px", color: "#B0B3B8" }}>
            {isSelf ? "Bạn chưa có bài viết nào." : "Người dùng này chưa có bài viết nào."}
          </div>
        )}
      </div>
    </>
  );
};

