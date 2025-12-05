import { useEffect, useRef, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getUserPostsApi, getUserById, getFriends, getUsersByIds } from "../api";
import { useComments } from "../hooks/useSocial";
import { AppLayout } from "../components/AppLayout";
import { FacebookNavbar } from "../components/FacebookNavbar";
import "../styles/feed.css";
import "../styles/facebook-navbar.css";

const Profile = () => {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const currentUserId = localStorage.getItem("user_id");
  const isSelf = userId === currentUserId || !userId;
  const targetUserId = userId || currentUserId || "";

  const [user, setUser] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [hasNext, setHasNext] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!targetUserId) return;
    loadUser();
    loadPosts();
    loadFriends();
  }, [targetUserId]);

  const loadUser = async () => {
    try {
      const data = await getUserById(targetUserId);
      setUser(data);
    } catch (error) {
      console.error("Failed to load user:", error);
    }
  };

  const loadPosts = async (cursor?: string) => {
    try {
      setIsLoading(true);
      const data = await getUserPostsApi(targetUserId, cursor);
      if (cursor) {
        setPosts((prev) => [...prev, ...data.items]);
      } else {
        setPosts(data.items);
      }
      setHasNext(data.hasNext);
      setNextCursor(data.nextCursor);
    } catch (error) {
      console.error("Failed to load posts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFriends = async () => {
    try {
      // Only load friends if viewing self or current user
      if (isSelf) {
        const data = await getFriends();
        if (data.friendIds && data.friendIds.length > 0) {
          const users = await getUsersByIds(data.friendIds);
          setFriends(users.users || []);
        }
      }
    } catch (error) {
      console.error("Failed to load friends:", error);
    }
  };

  // Extract photos from posts
  const userPhotos = useMemo(() => {
    const photos: { url: string; postId: string }[] = [];
    posts.forEach((post) => {
      if (post.media && Array.isArray(post.media)) {
        post.media.forEach((media: any) => {
          if (media.type === "image" || media.url) {
            photos.push({ url: media.url, postId: post._id });
          }
        });
      }
    });
    return photos.slice(0, 9); // Limit to 9 photos
  }, [posts]);

  // Get first 9 friends
  const displayFriends = useMemo(() => {
    return friends.slice(0, 9);
  }, [friends]);

  useEffect(() => {
    const onScroll = () => {
      if (!hasNext || isLoading) return;
      // Use window scroll instead of container scroll
      const scrollPosition = window.innerHeight + window.scrollY;
      const threshold = document.documentElement.scrollHeight - 200;
      if (scrollPosition >= threshold) {
        if (nextCursor) loadPosts(nextCursor);
      }
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [hasNext, isLoading, nextCursor]);

  if (!user) {
    return (
      <div className="feed-root">
        <div style={{ padding: 40, textAlign: "center" }}>Đang tải...</div>
      </div>
    );
  }

  // Header Component - Facebook Desktop Style
  const header = <FacebookNavbar currentUser={user ? { _id: user._id, name: user.name, avatar: user.avatar } : null} />;

  return (
    <AppLayout header={header} hideSidebars={true}>
      {/* Full-width Profile Container */}
      <div className="profile-container">
        {/* Cover Image - Full Width, 350px height */}
        {user.coverImage ? (
          <img
            src={user.coverImage}
            alt="Cover"
            className="profile-cover"
          />
        ) : (
          <div className="profile-cover-gradient" />
        )}

        {/* Profile Header Section */}
        <div className="profile-header">
          {/* Avatar and Action Buttons Row */}
          <div className="profile-avatar-wrapper">
            {/* Avatar - 168px x 168px, -84px margin top */}
            <div className="profile-avatar">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} />
              ) : (
                <span className="profile-avatar-initials">
                  {user.name?.charAt(0)?.toUpperCase() || "U"}
                </span>
              )}
            </div>

            {/* Action Buttons */}
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
                  <button className="profile-action-btn profile-action-btn--primary">
                    <span>👤</span>
                    <span>Thêm bạn bè</span>
                  </button>
                  <button className="profile-action-btn profile-action-btn--secondary">
                    <span>💬</span>
                    <span>Nhắn tin</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Name and Info */}
          <div className="profile-info">
            <h1 className="profile-name">
              {user.name || "Người dùng"}
            </h1>
            {user.email && (
              <p className="profile-email">{user.email}</p>
            )}
          </div>

          {/* Tabs */}
          <div className="profile-tabs-wrapper">
            <div className="profile-tabs">
              <button className="profile-tab profile-tab--active">
                Bài viết
              </button>
              <button className="profile-tab">
                Giới thiệu
              </button>
              <button className="profile-tab">
                Bạn bè
              </button>
              <button className="profile-tab">
                Ảnh
              </button>
            </div>
          </div>
        </div>

        {/* 2-Column Layout: Left Intro + Right Posts */}
        <div className="profile-content flex flex-row items-start gap-4">
          {/* LEFT COLUMN - Sticky Intro, Photos, Friends */}
          <div className="profile-left-column w-[360px] flex-shrink-0 sticky bottom-4 self-start h-fit z-10">
            {/* INTRO CARD */}
            <div className="profile-intro-card">
              <h3>Giới thiệu</h3>
              <div className="profile-intro-item">
                Sống tại <span>Đà Nẵng</span>
              </div>
              <div className="profile-intro-item">
                Tham gia <span>Tháng 11, 2024</span>
              </div>
              {user.email && (
                <div className="profile-intro-item">
                  Email: <span>{user.email}</span>
                </div>
              )}
              {isSelf && (
                <button
                  className="w-full py-2 bg-[#3A3B3C] hover:bg-[#4E4F50] text-[#E4E6EB] rounded-md font-semibold transition-colors mt-4"
                >
                  Chỉnh sửa chi tiết
                </button>
              )}
            </div>

            {/* PHOTOS CARD - Dynamic */}
            <div className="profile-photos-card">
              <div className="profile-card-header">
                <h3>Ảnh</h3>
                {userPhotos.length > 0 && (
                  <button className="profile-card-link">
                    Xem tất cả ảnh
                  </button>
                )}
              </div>
              {userPhotos.length > 0 ? (
                <div className="profile-photos-grid">
                  {userPhotos.map((photo, index) => (
                    <div key={`${photo.postId}-${index}`} className="profile-photo-item">
                      <img
                        src={photo.url}
                        alt={`Photo ${index + 1}`}
                        className="profile-photo-img"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="profile-widget-empty">
                  {isSelf ? "Bạn chưa có ảnh nào" : "Chưa có ảnh"}
                </div>
              )}
            </div>

            {/* FRIENDS CARD - Dynamic */}
            <div className="profile-friends-card">
              <div className="profile-card-header">
                <div>
                  <h3>Bạn bè</h3>
                  <p className="profile-friends-count">
                    {friends.length} người bạn
                  </p>
                </div>
                {displayFriends.length > 0 && (
                  <button
                    className="profile-card-link"
                    onClick={() => navigate("/friends")}
                  >
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
                    >
                      <div className="profile-friend-avatar">
                        {friend.avatar ? (
                          <img
                            src={friend.avatar}
                            alt={friend.name}
                            className="profile-friend-img"
                          />
                        ) : (
                          <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-bold text-2xl">
                            {friend.name?.charAt(0)?.toUpperCase() || "U"}
                          </div>
                        )}
                      </div>
                      <div className="profile-friend-name">
                        {friend.name || friend.email || "User"}
                      </div>
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

          {/* RIGHT COLUMN - Feed Stream */}
          <div className="profile-right-column flex-1 min-w-0" ref={listRef}>
            {/* Create Post Card (only for self) */}
            {isSelf && (
              <div className="profile-create-post-card">
                <div className="profile-create-post-header">
                  <div className="profile-create-post-avatar">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} />
                    ) : (
                      <div className="flex items-center justify-center w-full h-full text-white font-bold">
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

            {/* Posts List */}
            <div className="profile-posts-container">
              {posts.map((post) => (
                <PostCard key={post._id} post={post} />
              ))}
              {isLoading && (
                <div className="text-center py-4 text-[#B0B3B8]">
                  Đang tải...
                </div>
              )}
              {!isLoading && posts.length === 0 && (
                <div className="text-center py-8 text-[#B0B3B8]">
                  {isSelf
                    ? "Bạn chưa có bài viết nào."
                    : "Người dùng này chưa có bài viết nào."}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

const PostCard = ({ post }: { post: any }) => {
  const navigate = useNavigate();
  const [showComments, setShowComments] = useState(false);
  const { items, loadMore, createComment, isLoading, hasNext } = useComments(
    post._id
  );
  const [commentDraft, setCommentDraft] = useState("");

  const handleCommentSubmit = async () => {
    const text = commentDraft.trim();
    if (!text) return;
    await createComment(text);
    setCommentDraft("");
  };

  const author = post.author || { name: `User ${post.authorId}`, _id: post.authorId };

  return (
    <article className="feed-card">
      <div className="feed-post-header">
        <div className="feed-post-author">
          <div
            className="feed-post-avatar"
            onClick={() => navigate(`/profile/${author._id}`)}
            style={{ cursor: "pointer" }}
          >
            {author.avatar ? (
              <img src={author.avatar} alt={author.name} />
            ) : (
              <div className="feed-post-avatar-initials">
                {author.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
            )}
          </div>
          <div>
            <div
              className="feed-post-author-name"
              onClick={() => navigate(`/profile/${author._id}`)}
              style={{ cursor: "pointer" }}
            >
              {author.name}
            </div>
            <div className="feed-post-meta">
              {new Date(post.createdAt).toLocaleString("vi-VN", {
                day: "numeric",
                month: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        </div>
      </div>
      <div className="feed-post-content">{post.content}</div>
      {post.media && post.media.length > 0 && (
        <div className="feed-post-media">
          {post.media.map((m: any, i: number) => (
            <div key={i} className="feed-post-media-item">
              <img src={m.url} alt="" className="feed-post-image" />
            </div>
          ))}
        </div>
      )}
      <div className="feed-post-social">
        <div className="feed-post-reaction-summary">
          <span className="feed-post-reaction-total">👍 {post.likeCount || 0}</span>
        </div>
        <span className="feed-post-comment-count">
          {post.commentCount || 0} bình luận
        </span>
      </div>
      <div className="feed-post-actions">
        <button className="feed-post-action-btn">
          <span>👍</span>
          <span>Thích</span>
        </button>
        <button
          className="feed-post-action-btn"
          onClick={() => setShowComments((v) => !v)}
        >
          <span>💬</span>
          <span>Bình luận</span>
        </button>
      </div>

      {showComments && (
        <div className="feed-comments">
          {items.map((c) => {
            const commentAuthor = c.author || {
              name: `User ${c.authorId}`,
              _id: c.authorId,
            };
            return (
              <div key={c._id} className="feed-comment-item">
                <div className="feed-comment-author">
                  <span
                    onClick={() => navigate(`/profile/${commentAuthor._id}`)}
                    style={{
                      cursor: "pointer",
                      fontWeight: 600,
                      color: "var(--text-primary)",
                    }}
                  >
                    {commentAuthor.name}
                  </span>
                  <span
                    style={{
                      opacity: 0.6,
                      marginLeft: 8,
                      fontSize: "12px",
                    }}
                  >
                    {new Date(c.createdAt).toLocaleTimeString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div className="feed-comment-content">{c.content}</div>
              </div>
            );
          })}
          {hasNext && (
            <button
              onClick={() => loadMore()}
              disabled={isLoading}
              className="px-3 py-2 text-sm font-semibold text-purple-500 hover:bg-[#3A3B3C] hover:bg-opacity-30 rounded-lg transition-colors"
            >
              Xem thêm bình luận
            </button>
          )}
          <div style={{ marginTop: "12px" }}>
            <input
              value={commentDraft}
              onChange={(e) => setCommentDraft(e.target.value)}
              placeholder="Viết bình luận..."
              className="feed-comment-input"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleCommentSubmit();
                }
              }}
            />
          </div>
        </div>
      )}
    </article>
  );
};

export default Profile;
