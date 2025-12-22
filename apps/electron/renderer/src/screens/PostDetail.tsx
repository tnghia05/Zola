import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getPostByIdApi, Post, reactToPostApi, removeReactionApi, savePostApi, unsavePostApi, reportPostApi } from "@zola/app/api";
import { PostCard } from "@zola/app/components/PostCard.web";

export default function PostDetail() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reactionMap, setReactionMap] = useState<Record<string, any>>({});

  useEffect(() => {
    if (!postId) return;
    
    let mounted = true;
    let hasCached = false;
    
    // Try cached post first
    try {
      const raw = sessionStorage.getItem("post_detail_cache");
      const cache = raw ? JSON.parse(raw) : {};
      const cachedPost = cache?.[postId];
      if (cachedPost && mounted) {
        setPost(cachedPost);
        setReactionMap((prev) => ({ ...prev, [cachedPost._id]: cachedPost.currentUserReaction || null }));
        setLoading(false);
        hasCached = true;
      }
    } catch (err) {
      console.warn("Failed to load post_detail_cache", err);
    }

    const load = async () => {
      try {
        setLoading(true);
        const data = await getPostByIdApi(postId);
        if (mounted) {
          setPost(data);
          setReactionMap((prev) => ({ ...prev, [data._id]: data.currentUserReaction || null }));
        }
      } catch (err: any) {
        if (mounted && !hasCached) {
          setError(err?.response?.data?.error || err?.message || "Không tải được bài viết");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    
    return () => {
      mounted = false;
    };
  }, [postId]);

  const handleSelectReaction = async (id: string, type: any) => {
    await reactToPostApi(id, type);
    setReactionMap((prev) => ({ ...prev, [id]: type }));
  };

  const handleClearReaction = async (id: string) => {
    await removeReactionApi(id);
    setReactionMap((prev) => {
      const clone = { ...prev };
      delete clone[id];
      return clone;
    });
  };

  const handleSavePost = async (id: string) => {
    await savePostApi(id);
    alert("Đã lưu bài viết");
  };

  const handleUnsavePost = async (id: string) => {
    await unsavePostApi(id);
    alert("Đã bỏ lưu bài viết");
  };

  const handleReportPost = async (p: Post) => {
    const reason = prompt("Nhập lý do báo cáo:");
    if (!reason) return;
    await reportPostApi(p._id, { reason });
    alert("Đã gửi báo cáo");
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        Đang tải...
      </div>
    );
  }

  if (!post && error) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }}>
        <div>{error || "Không tìm thấy bài viết"}</div>
        <button 
          onClick={() => navigate('/feed')} 
          style={{ padding: "8px 16px", borderRadius: 6, border: "1px solid #3a3b3c", background: "#0f172a", color: "#e5e7eb", cursor: "pointer" }}
        >
          Về bảng tin
        </button>
      </div>
    );
  }

  if (!post) return null;

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "24px 16px" }}>
      <PostCard
        post={post}
        reaction={reactionMap[post._id] || null}
        onSelectReaction={handleSelectReaction}
        onClearReaction={handleClearReaction}
        onSavePost={handleSavePost}
        onUnsavePost={handleUnsavePost}
        onReportPost={handleReportPost}
      />
    </div>
  );
}

