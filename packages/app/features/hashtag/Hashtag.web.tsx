"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { getPostsByHashtagApi, Post } from "../../api";
import { PostCard } from "../../components/PostCard.web";
import { AppLayout } from "../../components/AppLayout";
import { FacebookNavbarWeb } from "../../components/FacebookNavbar.web";
import "../../styles/feed.css";

export default function HashtagScreen() {
  const params = useParams();
  const router = useRouter();
  const tag = params?.tag as string;
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasNext, setHasNext] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);

  useEffect(() => {
    if (!tag) return;
    loadPosts();
  }, [tag]);

  const loadPosts = async (loadMore = false) => {
    if (!tag) return;
    try {
      setIsLoading(true);
      const res = await getPostsByHashtagApi(tag, loadMore ? cursor || undefined : undefined);
      if (loadMore) {
        setPosts((prev) => [...prev, ...res.items]);
      } else {
        setPosts(res.items);
      }
      setHasNext(res.hasNext);
      setCursor(res.nextCursor || null);
    } catch (error) {
      console.error("Failed to load posts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const decodedTag = tag ? decodeURIComponent(tag) : "";

  return (
    <AppLayout>
      <FacebookNavbarWeb />
      <div className="feed-root">
        <div className="feed-main-layout">
          <div className="feed-inner" style={{ maxWidth: 680, margin: "0 auto", padding: "var(--spacing-lg) var(--spacing-md)" }}>
            <div style={{ marginBottom: "var(--spacing-xl)" }}>
              <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: "var(--spacing-sm)", color: "var(--text-primary)" }}>
                #{decodedTag}
              </h1>
              <p style={{ color: "var(--text-secondary)", fontSize: 15 }}>
                {posts.length} {posts.length === 1 ? "bài viết" : "bài viết"}
              </p>
            </div>

            {isLoading && posts.length === 0 ? (
              <div style={{ textAlign: "center", padding: "var(--spacing-xl)", color: "var(--text-secondary)" }}>
                Đang tải...
              </div>
            ) : posts.length === 0 ? (
              <div style={{ textAlign: "center", padding: "var(--spacing-xl)", color: "var(--text-secondary)" }}>
                Không có bài viết nào với hashtag này
              </div>
            ) : (
              <>
                {posts.map((post) => (
                  <PostCard
                    key={post._id}
                    post={post}
                    onSelectReaction={async (postId, reaction) => {
                      // TODO: Implement reaction
                    }}
                    onClearReaction={async (postId) => {
                      // TODO: Implement clear reaction
                    }}
                  />
                ))}
                {hasNext && (
                  <button
                    className="feed-primary-button"
                    onClick={() => loadPosts(true)}
                    disabled={isLoading}
                    style={{ marginTop: "var(--spacing-lg)", width: "100%" }}
                  >
                    {isLoading ? "Đang tải..." : "Xem thêm"}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

