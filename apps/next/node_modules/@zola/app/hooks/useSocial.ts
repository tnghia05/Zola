import { useCallback, useEffect, useState } from "react";
import {
  Comment,
  CommentsResponse,
  FeedResponse,
  NotificationsResponse,
  Post,
  StoryAuthorGroup,
  StoryMedia,
  SearchResponse,
  FriendSuggestion,
  checkPostLikedApi,
  createCommentApi,
  createPostApi,
  createStoryApi,
  getFeed,
  getNotificationsApi,
  getPostComments,
  getStoriesApi,
  getFriendSuggestionsApi,
  searchSocialApi,
  markStoryViewedApi,
  markNotificationsReadApi,
  deleteStoryApi,
  savePostApi,
  reportPostApi,
  getSavedPostsApi,
  unsavePostApi,
  SavedPost,
  ReactionType,
  reactToPostApi,
  removeReactionApi,
} from "../api";

export const useFeed = () => {
  const [items, setItems] = useState<Post[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasNext, setHasNext] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMore = useCallback(
    async (reset = false) => {
      if (isLoading) return;
      if (!hasNext && !reset) return;

      setIsLoading(true);
      setError(null);
      try {
        const res: FeedResponse = await getFeed(reset ? undefined : cursor || undefined);
        setHasNext(res.hasNext);
        setCursor(res.nextCursor);
        setItems((prev) => (reset ? res.items : [...prev, ...res.items]));
      } catch (err: any) {
        console.error("Failed to load feed", err);
        setError(err?.message || "Failed to load feed");
      } finally {
        setIsLoading(false);
      }
    },
    [cursor, hasNext, isLoading]
  );

  useEffect(() => {
    loadMore(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Listen for real-time updates
  useEffect(() => {
    const socket = (window as any).__socket;
    if (!socket) return;

    const handleNewPost = (post: Post) => {
      setItems((prev) => {
        if (prev.some((p) => p._id === post._id)) return prev;
        return [post, ...prev];
      });
    };

    const handleReactionUpdate = (data: {
      postId: string;
      total: number;
      reactionCounts?: Record<string, number>;
      reaction?: ReactionType | null;
      userId?: string;
    }) => {
      setItems((prev) =>
        prev.map((p) =>
          p._id === data.postId
            ? {
                ...p,
                likeCount: data.total ?? p.likeCount,
                reactionCounts: data.reactionCounts ?? p.reactionCounts,
              }
            : p
        )
      );

      if (
        data.userId &&
        (window as any).__currentUserId &&
        data.userId === (window as any).__currentUserId
      ) {
        setReactionMap((prev) => ({ ...prev, [data.postId]: data.reaction ?? null }));
      }
    };

    socket.on("social:post:new", handleNewPost);
    socket.on("social:post:reaction", handleReactionUpdate);

    return () => {
      socket.off("social:post:new", handleNewPost);
      socket.off("social:post:reaction", handleReactionUpdate);
    };
  }, []);

  const createPost = useCallback(
    async (content: string, media: any[] = [], visibility: "PUBLIC" | "FRIENDS" = "PUBLIC") => {
      const post = await createPostApi({ content, media, visibility });
      setItems((prev) => [post, ...prev]);
    },
    []
  );

  const [reactionMap, setReactionMap] = useState<Record<string, ReactionType | null>>({});

  const checkLiked = useCallback(async (postId: string) => {
    try {
      const { liked, type } = await checkPostLikedApi(postId);
      setReactionMap((prev) => ({ ...prev, [postId]: liked ? type || "LIKE" : null }));
      return liked;
    } catch (error) {
      console.error("Failed to check liked status", error);
      return false;
    }
  }, []);

  useEffect(() => {
    // Check liked status for all posts when items change
    items.forEach((post) => {
      if (reactionMap[post._id] === undefined) {
        checkLiked(post._id);
      }
    });
  }, [items, checkLiked]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateReactionCounts = useCallback(
    (postId: string, nextReaction: ReactionType | null, prevReaction: ReactionType | null) => {
      setItems((prev) =>
        prev.map((post) => {
          if (post._id !== postId) return post;
          const counts: Partial<Record<ReactionType, number>> = { ...(post.reactionCounts || {}) };
          if (prevReaction) {
            counts[prevReaction] = Math.max(0, (counts[prevReaction] || 0) - 1);
          }
          if (nextReaction) {
            counts[nextReaction] = (counts[nextReaction] || 0) + 1;
          }
          const likeCount = Object.values(counts).reduce((acc, val) => acc + (val || 0), 0);
          return { ...post, reactionCounts: counts, likeCount };
        })
      );
    },
    []
  );

  const selectReaction = useCallback(
    async (postId: string, reaction: ReactionType) => {
      const prev = reactionMap[postId] || null;
      setReactionMap((prevMap) => ({ ...prevMap, [postId]: reaction }));
      updateReactionCounts(postId, reaction, prev);
      try {
        await reactToPostApi(postId, reaction);
      } catch (error) {
        console.error("Failed to react", error);
        setReactionMap((prevMap) => ({ ...prevMap, [postId]: prev }));
        updateReactionCounts(postId, prev, reaction);
      }
    },
    [reactionMap, updateReactionCounts]
  );

  const clearReaction = useCallback(
    async (postId: string) => {
      const prev = reactionMap[postId] || null;
      if (!prev) return;
      setReactionMap((prevMap) => ({ ...prevMap, [postId]: null }));
      updateReactionCounts(postId, null, prev);
      try {
        await removeReactionApi(postId);
      } catch (error) {
        console.error("Failed to remove reaction", error);
        setReactionMap((prevMap) => ({ ...prevMap, [postId]: prev }));
        updateReactionCounts(postId, prev, null);
      }
    },
    [reactionMap, updateReactionCounts]
  );

  const savePost = useCallback(async (postId: string) => {
    await savePostApi(postId);
  }, []);

  const reportPost = useCallback(
    async (postId: string, payload: { reason: string; details?: string }) => {
      await reportPostApi(postId, payload);
    },
    []
  );

  return {
    items,
    hasNext,
    isLoading,
    error,
    loadMore,
    createPost,
    reactionMap,
    selectReaction,
    clearReaction,
    savePost,
    reportPost,
  };
};

export const useStories = () => {
  const [stories, setStories] = useState<StoryAuthorGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStories = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getStoriesApi();
      setStories(data.items ?? []);
    } catch (err: any) {
      console.error("Failed to load stories", err);
      setError(err?.message || "Không thể tải stories");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStories();
  }, [loadStories]);

  useEffect(() => {
    const socket = (window as any).__socket;
    if (!socket) return;

    const handleStoryNew = (payload: {
      author: StoryAuthorGroup["author"];
      story: StoryAuthorGroup["stories"][number];
    }) => {
      setStories((prev) => {
        const next = [...prev];
        const index = next.findIndex((g) => g.author._id === payload.author._id);
        if (index >= 0) {
          const group = next[index];
          const updatedStories = [
            payload.story,
            ...group.stories.filter((s) => s._id !== payload.story._id),
          ];
          next[index] = { ...group, stories: updatedStories };
          return next;
        }
        return [{ author: payload.author, stories: [payload.story] }, ...prev];
      });
    };

    const handleStoryDeleted = (payload: { storyId: string; authorId: string }) => {
      setStories((prev) =>
        prev
          .map((group) =>
            group.author._id === payload.authorId
              ? {
                  ...group,
                  stories: group.stories.filter((story) => story._id !== payload.storyId),
                }
              : group
          )
          .filter((group) => group.stories.length > 0)
      );
    };

    const handleStoryViewed = (payload: {
      storyId: string;
      viewCount: number;
      viewerId: string;
    }) => {
      setStories((prev) =>
        prev.map((group) => ({
          ...group,
          stories: group.stories.map((story) =>
            story._id === payload.storyId
              ? { ...story, viewCount: payload.viewCount }
              : story
          ),
        }))
      );
    };

    socket.on("social:story:new", handleStoryNew);
    socket.on("social:story:deleted", handleStoryDeleted);
    socket.on("social:story:viewed", handleStoryViewed);

    return () => {
      socket.off("social:story:new", handleStoryNew);
      socket.off("social:story:deleted", handleStoryDeleted);
      socket.off("social:story:viewed", handleStoryViewed);
    };
  }, []);

  const createStory = useCallback(
    async (payload: {
      media: StoryMedia[];
      caption?: string;
      visibility?: "FRIENDS" | "PUBLIC";
      music?: StoryMusic;
    }) => {
      await createStoryApi(payload);
      await loadStories();
    },
    [loadStories]
  );

  const markStorySeen = useCallback(async (storyId: string) => {
    setStories((prev) =>
      prev.map((group) => ({
        ...group,
        stories: group.stories.map((story) =>
          story._id === storyId
            ? { ...story, hasSeen: true, viewCount: story.viewCount + (story.hasSeen ? 0 : 1) }
            : story
        ),
      }))
    );
    try {
      await markStoryViewedApi(storyId);
    } catch (err) {
      console.error("Failed to mark story viewed", err);
    }
  }, []);

  const deleteStory = useCallback(async (storyId: string) => {
    await deleteStoryApi(storyId);
    setStories((prev) =>
      prev
        .map((group) => ({
          ...group,
          stories: group.stories.filter((story) => story._id !== storyId),
        }))
        .filter((group) => group.stories.length > 0)
    );
  }, []);

  return { stories, isLoading, error, reloadStories: loadStories, createStory, markStorySeen, deleteStory };
};

export const useSocialSearch = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(
    async (keyword: string, type: "all" | "users" | "posts" = "all") => {
      const trimmed = keyword.trim();
      setQuery(trimmed);
      if (!trimmed) {
        setError("Nhập từ khóa để tìm kiếm.");
        setResults(null);
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const res = await searchSocialApi({ q: trimmed, type });
        setResults(res);
      } catch (err: any) {
        console.error("Failed to search", err);
        setError(err?.response?.data?.error || err?.message || "Không thể tìm kiếm lúc này");
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return { query, results, isLoading, error, search };
};

export const useFriendSuggestions = (limit = 6) => {
  const [items, setItems] = useState<FriendSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getFriendSuggestionsApi(limit);
      setItems(res.suggestions || []);
    } catch (error) {
      console.error("Failed to load friend suggestions", error);
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const socket = (window as any).__socket;
    if (!socket) return;
    const handleRefresh = () => load();
    socket.on("social:suggestions:refresh", handleRefresh);
    return () => {
      socket.off("social:suggestions:refresh", handleRefresh);
    };
  }, [load]);

  return { items, isLoading, reload: load };
};

export const useComments = (postId: string) => {
  const [items, setItems] = useState<Comment[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasNext, setHasNext] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState(false);

  const loadMore = useCallback(
    async (reset = false) => {
      if (isLoading) return;
      if (!hasNext && !reset) return;
      setIsLoading(true);
      try {
        const res: CommentsResponse = await getPostComments(
          postId,
          reset ? undefined : cursor || undefined
        );
        setHasNext(res.hasNext);
        setCursor(res.nextCursor);
        setItems((prev) => (reset ? res.items : [...prev, ...res.items]));
      } finally {
        setIsLoading(false);
      }
    },
    [cursor, hasNext, isLoading, postId]
  );

  const createComment = useCallback(
    async (content: string) => {
      const comment = await createCommentApi(postId, { content });
      setItems((prev) => [comment, ...prev]);
    },
    [postId]
  );

  return { items, hasNext, isLoading, loadMore, createComment };
};

export const useSavedPosts = () => {
  const [items, setItems] = useState<SavedPost[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasNext, setHasNext] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState(false);
  const [reactionMap, setReactionMap] = useState<Record<string, ReactionType | null>>({});

  const loadMore = useCallback(
    async (reset = false) => {
      if (isLoading) return;
      if (!hasNext && !reset) return;
      setIsLoading(true);
      try {
        const res = await getSavedPostsApi(reset ? undefined : cursor || undefined);
        setHasNext(res.hasNext);
        setCursor(res.nextCursor);
        setItems((prev) => (reset ? res.items : [...prev, ...res.items]));
        const map: Record<string, ReactionType | null> = {};
        res.items.forEach((post) => {
          map[post._id] = post.currentUserReaction || null;
        });
        setReactionMap((prevMap) => (reset ? map : { ...prevMap, ...map }));
      } catch (error) {
        console.error("Failed to load saved posts", error);
      } finally {
        setIsLoading(false);
      }
    },
    [cursor, hasNext, isLoading]
  );

  useEffect(() => {
    loadMore(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const updateReactionCounts = useCallback(
    (postId: string, nextReaction: ReactionType | null, prevReaction: ReactionType | null) => {
      setItems((prev) =>
        prev.map((post) => {
          if (post._id !== postId) return post;
          const counts: Partial<Record<ReactionType, number>> = { ...(post.reactionCounts || {}) };
          if (prevReaction) {
            counts[prevReaction] = Math.max(0, (counts[prevReaction] || 0) - 1);
          }
          if (nextReaction) {
            counts[nextReaction] = (counts[nextReaction] || 0) + 1;
          }
          const likeCount = Object.values(counts).reduce((acc, val) => acc + (val || 0), 0);
          return { ...post, reactionCounts: counts, likeCount };
        })
      );
    },
    []
  );

  const selectReaction = useCallback(
    async (postId: string, reaction: ReactionType) => {
      const prev = reactionMap[postId] || null;
      setReactionMap((prevMap) => ({ ...prevMap, [postId]: reaction }));
      updateReactionCounts(postId, reaction, prev);
      try {
        await reactToPostApi(postId, reaction);
      } catch (error) {
        console.error("Failed to react", error);
        setReactionMap((prevMap) => ({ ...prevMap, [postId]: prev }));
        updateReactionCounts(postId, prev, reaction);
      }
    },
    [reactionMap, updateReactionCounts]
  );

  const clearReaction = useCallback(
    async (postId: string) => {
      const prev = reactionMap[postId] || null;
      if (!prev) return;
      setReactionMap((prevMap) => ({ ...prevMap, [postId]: null }));
      updateReactionCounts(postId, null, prev);
      try {
        await removeReactionApi(postId);
      } catch (error) {
        console.error("Failed to remove reaction", error);
        setReactionMap((prevMap) => ({ ...prevMap, [postId]: prev }));
        updateReactionCounts(postId, prev, null);
      }
    },
    [reactionMap, updateReactionCounts]
  );

  const unsave = useCallback(async (postId: string) => {
    await unsavePostApi(postId);
    setItems((prev) => prev.filter((post) => post._id !== postId));
  }, []);

  return {
    items,
    hasNext,
    isLoading,
    loadMore,
    unsave,
    reactionMap,
    selectReaction,
    clearReaction,
  };
};

export const useSocialNotifications = () => {
  const [items, setItems] = useState<NotificationsResponse["items"]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasNext, setHasNext] = useState<boolean>(true);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const load = useCallback(
    async (reset = false) => {
      const res: NotificationsResponse = await getNotificationsApi(
        reset ? undefined : cursor || undefined
      );
      setHasNext(res.hasNext);
      setCursor(res.nextCursor);
      setItems((prev) => (reset ? res.items : [...prev, ...res.items]));
      const unread = (reset ? res.items : [...items, ...res.items]).filter(
        (n) => !n.isRead
      ).length;
      setUnreadCount(unread);
    },
    [cursor, items]
  );

  useEffect(() => {
    load(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const markAllRead = useCallback(async () => {
    const ids = items.filter((n) => !n.isRead).map((n) => n._id);
    if (ids.length === 0) return;
    await markNotificationsReadApi(ids);
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  }, [items]);

  return { items, hasNext, unreadCount, load, markAllRead };
};


