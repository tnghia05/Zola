import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSocialSearch } from "../hooks/useSocial";
import { Post, SocialSearchUser, getCurrentUserId, getUserById } from "../api";
import { FacebookNavbar } from "../components/FacebookNavbar";
import "../styles/feed.css";
import "../styles/facebook-navbar.css";

const SearchScreen = () => {
  const navigate = useNavigate();
  const { results, isLoading, error, search } = useSocialSearch();
  const [keyword, setKeyword] = useState("");
  const [type, setType] = useState<"all" | "users" | "posts">("all");
  const [currentUser, setCurrentUser] = useState<{
    _id: string;
    name: string;
    avatar?: string;
  } | null>(null);

  useEffect(() => {
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
    loadCurrentUser();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    search(keyword, type);
  };

  return (
    <div className="feed-root">
      <FacebookNavbar currentUser={currentUser} />

      <div className="feed-main-layout">
        <div className="feed-inner">
          <aside className="feed-sidebar">
            <div className="feed-nav-section-title">Menu</div>
            <div className="feed-nav-item" onClick={() => navigate("/feed")}>
              <div className="feed-nav-icon">🏠</div>
              <span>Bảng tin</span>
            </div>
            <div className="feed-nav-item" onClick={() => navigate("/conversations")}>
              <div className="feed-nav-icon">💬</div>
              <span>Tin nhắn</span>
            </div>
            <div className="feed-nav-item" onClick={() => navigate("/friends")}>
              <div className="feed-nav-icon">👥</div>
              <span>Bạn bè</span>
            </div>
            <div className="feed-nav-item feed-nav-item--active">
              <div className="feed-nav-icon">🔍</div>
              <span>Tìm kiếm</span>
            </div>
          </aside>

          <main className="feed-center">
            <section className="feed-card search-card">
              <form className="search-form" onSubmit={handleSubmit}>
                <input
                  className="search-input"
                  placeholder="Nhập tên người dùng hoặc nội dung bài viết..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                />
                <select
                  className="search-select"
                  value={type}
                  onChange={(e) => setType(e.target.value as "all" | "users" | "posts")}
                >
                  <option value="all">Tất cả</option>
                  <option value="users">Người dùng</option>
                  <option value="posts">Bài viết</option>
                </select>
                <button className="search-submit" type="submit">
                  Tìm kiếm
                </button>
              </form>
              {error && <div className="search-error">{error}</div>}
            </section>

            <section className="feed-card search-results">
              {isLoading && <div className="search-loading">Đang tìm kiếm...</div>}
              {!isLoading && results && (
                <>
                  {(type === "all" || type === "users") && (
                    <div className="search-section">
                      <h3>Người dùng</h3>
                      {results.users.length === 0 ? (
                        <p className="search-empty">Không tìm thấy người dùng phù hợp.</p>
                      ) : (
                        <div className="search-user-grid">
                          {results.users.map((user) => (
                            <UserResultCard
                              key={user._id}
                              user={user}
                              onClick={() => navigate(`/profile/${user._id}`)}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {(type === "all" || type === "posts") && (
                    <div className="search-section" style={{ marginTop: 16 }}>
                      <h3>Bài viết</h3>
                      {results.posts.length === 0 ? (
                        <p className="search-empty">Không có bài viết phù hợp.</p>
                      ) : (
                        <div className="search-post-list">
                          {results.posts.map((post) => (
                            <PostResultCard key={post._id} post={post} />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </section>
          </main>

          <aside className="feed-right" />
        </div>
      </div>
    </div>
  );
};

const UserResultCard = ({
  user,
  onClick,
}: {
  user: SocialSearchUser;
  onClick: () => void;
}) => {
  return (
    <div className="search-user-card" onClick={onClick}>
      <div className="search-user-avatar">
        {user.avatar ? (
          <img src={user.avatar} alt={user.name} />
        ) : (
          <div className="search-user-initials">
            {user.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
        )}
      </div>
      <div className="search-user-info">
        <div className="search-user-name">{user.name || user.email}</div>
        <div className="search-user-meta">
          @{user.username || "chưa có username"}
        </div>
        {user.statusMessage && (
          <div className="search-user-status">{user.statusMessage}</div>
        )}
      </div>
    </div>
  );
};

const PostResultCard = ({ post }: { post: Post }) => {
  const author = post.author || { name: `User ${post.authorId}`, _id: post.authorId };
  return (
    <article className="search-post-card">
      <div className="search-post-header">
        <div className="feed-post-author">
          <div className="feed-post-avatar">
            {author.avatar ? (
              <img src={author.avatar} alt={author.name} />
            ) : (
              <div className="feed-post-avatar-initials">
                {author.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
            )}
          </div>
          <div>
            <div className="feed-post-author-name">{author.name}</div>
            <div className="feed-post-meta">
              {new Date(post.createdAt).toLocaleString("vi-VN")}
            </div>
          </div>
        </div>
      </div>
      <div className="feed-post-content">{post.content}</div>
      {post.media && post.media.length > 0 && (
        <div className="feed-post-media">
          {post.media.slice(0, 2).map((media, idx) => (
            <div key={idx} className="feed-post-media-item">
              {media.type === "video" ? (
                <video src={media.url} controls className="feed-post-video" />
              ) : (
                <img src={media.url} alt={`media-${idx}`} className="feed-post-image" />
              )}
            </div>
          ))}
        </div>
      )}
    </article>
  );
};

export default SearchScreen;


