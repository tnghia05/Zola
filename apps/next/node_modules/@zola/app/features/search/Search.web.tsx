"use client";

import { useState, useEffect, FormEvent, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Post, SearchResponse, getCurrentUserId, getUserById, searchSocialApi, getUserPostsApi } from "@zola/app/api";
import { FacebookNavbarWeb } from "@zola/app/components/FacebookNavbar.web";
import "@zola/app/styles/feed.css";
import "@zola/app/styles/facebook-navbar.css";

type FilterType = "all" | "users" | "posts";

interface FilterItem {
  id: FilterType;
  label: string;
  icon: string;
}

const FILTERS: FilterItem[] = [
  { id: "all", label: "Tất cả", icon: "🔍" },
  { id: "users", label: "Mọi người", icon: "👥" },
  { id: "posts", label: "Bài viết", icon: "📝" },
];

const SearchScreen = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [keyword, setKeyword] = useState(initialQuery);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
      } catch (err) {
        console.error("Failed to load current user:", err);
      }
    };
    loadCurrentUser();
  }, []);

  const doSearch = useCallback(async (q: string, type: FilterType) => {
    const trimmed = q.trim();
    if (!trimmed) {
      setError("Nhập từ khóa để tìm kiếm.");
      setResults(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      // 1. Search users and posts by content
      const res = await searchSocialApi(trimmed);
      
      // 2. Also fetch posts from users found in search results
      const userPosts: Post[] = [];
      if (res.users && res.users.length > 0) {
        const userPostPromises = res.users.map(async (user) => {
          try {
            const postsRes = await getUserPostsApi(user._id, undefined, 5);
            return postsRes.items || [];
          } catch {
            return [];
          }
        });
        const allUserPosts = await Promise.all(userPostPromises);
        allUserPosts.forEach((posts) => userPosts.push(...posts));
      }

      // 3. Merge posts and remove duplicates
      const existingPostIds = new Set(res.posts.map((p) => p._id));
      const uniqueUserPosts = userPosts.filter((p) => !existingPostIds.has(p._id));
      
      setResults({
        users: res.users,
        posts: [...res.posts, ...uniqueUserPosts],
      });
    } catch (err: any) {
      console.error("Failed to search", err);
      setError(err?.response?.data?.error || err?.message || "Không thể tìm kiếm lúc này");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto search when URL has query
  useEffect(() => {
    if (initialQuery) {
      doSearch(initialQuery, activeFilter);
    }
  }, [initialQuery]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (keyword.trim()) {
      router.push(`/search?q=${encodeURIComponent(keyword.trim())}`);
      doSearch(keyword, activeFilter);
    }
  };

  const handleFilterChange = (filter: FilterType) => {
    setActiveFilter(filter);
  };

  // Filter results based on active filter
  const filteredUsers = activeFilter === "posts" ? [] : (results?.users || []);
  const filteredPosts = activeFilter === "users" ? [] : (results?.posts || []);

  return (
    <div className="feed-root">
      <FacebookNavbarWeb />

      <div className="feed-main-layout">
        <div className="feed-inner search-page-inner">
          {/* Left Sidebar - Filter Panel */}
          <aside className="search-filter-sidebar">
            <div className="search-filter-header">
              <h2>Kết quả tìm kiếm</h2>
              {keyword && <p className="search-filter-query">"{keyword}"</p>}
            </div>

            <div className="search-filter-section">
              <h3>Bộ lọc</h3>
              <div className="search-filter-list">
                {FILTERS.map((filter) => (
                  <button
                    key={filter.id}
                    className={`search-filter-item ${activeFilter === filter.id ? "search-filter-item--active" : ""}`}
                    onClick={() => handleFilterChange(filter.id)}
                  >
                    <span className="search-filter-icon">{filter.icon}</span>
                    <span className="search-filter-label">{filter.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Main Content - Search Results */}
          <main className="search-results-main">
            {/* Search Input Bar */}
            <div className="search-input-bar">
              <form className="search-form-inline" onSubmit={handleSubmit}>
                <div className="search-input-wrapper">
                  <span className="search-input-icon">🔍</span>
                  <input
                    className="search-input-field"
                    placeholder="Tìm kiếm trên Zola..."
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                  />
                </div>
                <button className="search-submit-btn" type="submit">
                  Tìm kiếm
                </button>
              </form>
            </div>

            {error && <div className="search-error-banner">{error}</div>}

            {isLoading && (
              <div className="search-loading-state">
                <div className="search-loading-spinner" />
                <span>Đang tìm kiếm...</span>
              </div>
            )}

            {!isLoading && results && (
              <div className="search-results-container">
                {/* Users Section */}
                {filteredUsers.length > 0 && (
                  <div className="search-results-section">
                    <h3 className="search-results-section-title">Mọi người</h3>
                    <div className="search-users-list">
                      {filteredUsers.map((user) => (
                        <div
                          key={user._id}
                          className="search-user-item"
                          onClick={() => router.push(`/profile/${user._id}`)}
                        >
                          <div className="search-user-avatar-large">
                            {user.avatar ? (
                              <img src={user.avatar} alt={user.name} />
                            ) : (
                              <div className="search-user-initials-large">
                                {user.name?.charAt(0)?.toUpperCase() || "U"}
                              </div>
                            )}
                          </div>
                          <div className="search-user-details">
                            <div className="search-user-name-main">{user.name || user.email}</div>
                            {user.username && (
                              <div className="search-user-username">@{user.username}</div>
                            )}
                          </div>
                          <button
                            className="search-user-action-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/profile/${user._id}`);
                            }}
                          >
                            Xem trang cá nhân
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Posts Section */}
                {filteredPosts.length > 0 && (
                  <div className="search-results-section">
                    <h3 className="search-results-section-title">Bài viết</h3>
                    <div className="search-posts-list">
                      {filteredPosts.map((post) => (
                        <PostResultCard key={post._id} post={post} />
                      ))}
                    </div>
                  </div>
                )}

                {/* No Results */}
                {filteredUsers.length === 0 && filteredPosts.length === 0 && (
                  <div className="search-no-results">
                    <div className="search-no-results-icon">🔍</div>
                    <h3>Không tìm thấy kết quả</h3>
                    <p>Thử tìm kiếm với từ khóa khác hoặc thay đổi bộ lọc.</p>
                  </div>
                )}
              </div>
            )}

            {/* Initial State */}
            {!isLoading && !results && !error && (
              <div className="search-initial-state">
                <div className="search-initial-icon">🔍</div>
                <h3>Tìm kiếm trên Zola</h3>
                <p>Tìm bạn bè, bài viết và nhiều nội dung khác...</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

const PostResultCard = ({ post }: { post: Post }) => {
  const router = useRouter();
  const author = post.author || { name: `User ${post.authorId}`, _id: post.authorId };

  return (
    <article className="search-post-item" onClick={() => router.push(`/post/${post._id}`)}>
      <div className="search-post-author-row">
        <div className="search-post-author-avatar">
          {author.avatar ? (
            <img src={author.avatar} alt={author.name} />
          ) : (
            <div className="search-post-author-initials">
              {author.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
          )}
        </div>
        <div className="search-post-author-info">
          <span
            className="search-post-author-name"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/profile/${author._id}`);
            }}
          >
            {author.name}
          </span>
          <span className="search-post-date">
            {new Date(post.createdAt).toLocaleString("vi-VN")}
          </span>
        </div>
      </div>

      <div className="search-post-content">{post.content}</div>

      {post.media && post.media.length > 0 && (
        <div className="search-post-media-grid">
          {post.media.slice(0, 4).map((media, idx) => (
            <div key={idx} className="search-post-media-thumb">
              {media.type === "video" ? (
                <video src={media.url} className="search-post-video-thumb" />
              ) : (
                <img src={media.url} alt={`media-${idx}`} className="search-post-img-thumb" />
              )}
              {post.media!.length > 4 && idx === 3 && (
                <div className="search-post-media-more">+{post.media!.length - 4}</div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="search-post-stats">
        <span>❤️ {post.reactionsCount || 0}</span>
        <span>💬 {post.commentsCount || 0}</span>
      </div>
    </article>
  );
};

export default SearchScreen;
