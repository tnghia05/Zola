"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAdminPostsApi, deletePostApi, hidePostApi, restorePostApi, Post } from "@zola/app/api";

export default function AdminPostsPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    status: "all",
    authorId: "",
    search: "",
  });

  useEffect(() => {
    loadPosts();
  }, [page, filters]);

  const loadPosts = async () => {
    setIsLoading(true);
    try {
      const params: any = { page, limit: 20 };
      if (filters.status !== "all") params.status = filters.status;
      if (filters.authorId) params.authorId = filters.authorId;
      if (filters.search) params.search = filters.search;

      const data = await getAdminPostsApi(params);
      setPosts(data.items);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error("Failed to load posts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (postId: string) => {
    if (!confirm("Bạn có chắc muốn xóa vĩnh viễn post này?")) return;
    try {
      await deletePostApi(postId);
      loadPosts();
    } catch (error) {
      alert("Failed to delete post");
    }
  };

  const handleHide = async (postId: string) => {
    try {
      await hidePostApi(postId);
      loadPosts();
    } catch (error) {
      alert("Failed to hide post");
    }
  };

  const handleRestore = async (postId: string) => {
    try {
      await restorePostApi(postId);
      loadPosts();
    } catch (error) {
      alert("Failed to restore post");
    }
  };

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 24, color: "#e4e6eb" }}>
        Posts Management
      </h1>

      <div className="admin-filters">
        <input
          type="text"
          placeholder="Search posts..."
          className="admin-filter-input"
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
        <select
          className="admin-filter-select"
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="deleted">Deleted</option>
        </select>
      </div>

      {isLoading ? (
        <div className="admin-loading">Đang tải...</div>
      ) : posts.length === 0 ? (
        <div className="admin-empty">
          <div className="admin-empty-icon">📝</div>
          <div className="admin-empty-text">Không có posts nào</div>
        </div>
      ) : (
        <>
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Author</th>
                  <th>Content</th>
                  <th>Media</th>
                  <th>Engagement</th>
                  <th>Created</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => {
                  const author = (post as any).authorId || {};
                  return (
                    <tr key={post._id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          {author.avatar ? (
                            <img
                              src={author.avatar}
                              alt={author.name}
                              style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover" }}
                            />
                          ) : (
                            <div
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: "50%",
                                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "white",
                                fontWeight: 700,
                                fontSize: 12,
                              }}
                            >
                              {author.name?.charAt(0)?.toUpperCase() || "U"}
                            </div>
                          )}
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              <span style={{ fontSize: 13, fontWeight: 600 }}>{author.name || "Unknown"}</span>
                              {author.isVerified && (
                                <span className="admin-verified-badge" title="Verified">✓</span>
                              )}
                            </div>
                            <div style={{ fontSize: 12, color: "#b0b3b8" }}>{author.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {post.content || "(No content)"}
                        </div>
                      </td>
                      <td>
                        {post.media && post.media.length > 0 ? (
                          <div style={{ display: "flex", gap: 4 }}>
                            {post.media.slice(0, 2).map((m, i) => (
                              <div key={i} style={{ width: 40, height: 40, borderRadius: 4, overflow: "hidden" }}>
                                {m.type?.startsWith("image/") || m.type === "image" ? (
                                  <img src={m.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                ) : (
                                  <div style={{ width: "100%", height: "100%", background: "#3a3b3c", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>
                                    🎥
                                  </div>
                                )}
                              </div>
                            ))}
                            {post.media.length > 2 && <span style={{ fontSize: 12 }}>+{post.media.length - 2}</span>}
                          </div>
                        ) : (
                          <span style={{ color: "#b0b3b8" }}>No media</span>
                        )}
                      </td>
                      <td>
                        <div style={{ fontSize: 12 }}>
                          <div>👍 {post.likeCount || 0}</div>
                          <div>💬 {post.commentCount || 0}</div>
                        </div>
                      </td>
                      <td style={{ fontSize: 12, color: "#b0b3b8" }}>
                        {new Date(post.createdAt).toLocaleDateString("vi-VN")}
                      </td>
                      <td>
                        {post.deletedAt ? (
                          <span style={{ color: "#f02849" }}>Deleted</span>
                        ) : (
                          <span style={{ color: "#42b72a" }}>Active</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <button
                            className="admin-btn admin-btn--small admin-btn--secondary"
                            onClick={() => router.push(`/feed`)}
                          >
                            View
                          </button>
                          {post.deletedAt ? (
                            <button
                              className="admin-btn admin-btn--small admin-btn--primary"
                              onClick={() => handleRestore(post._id)}
                            >
                              Restore
                            </button>
                          ) : (
                            <button
                              className="admin-btn admin-btn--small admin-btn--secondary"
                              onClick={() => handleHide(post._id)}
                            >
                              Hide
                            </button>
                          )}
                          <button
                            className="admin-btn admin-btn--small admin-btn--danger"
                            onClick={() => handleDelete(post._id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="admin-pagination">
              <button
                className="admin-pagination-btn"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </button>
              <span className="admin-pagination-info">
                Page {page} of {totalPages}
              </span>
              <button
                className="admin-pagination-btn"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

