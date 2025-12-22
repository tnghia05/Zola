import { Comment, Post, StoryAuthorGroup, StoryMedia, SearchResponse, FriendSuggestion, SavedPost, ReactionType } from "../api";
export declare const useFeed: () => {
    items: Post[];
    hasNext: boolean;
    isLoading: boolean;
    error: string | null;
    loadMore: (reset?: boolean) => Promise<void>;
    createPost: (content: string, media?: any[], visibility?: "PUBLIC" | "FRIENDS" | "ONLY_ME", taggedUsers?: string[]) => Promise<void>;
    reactionMap: Record<string, ReactionType | null>;
    selectReaction: (postId: string, reaction: ReactionType) => Promise<void>;
    clearReaction: (postId: string) => Promise<void>;
    savePost: (postId: string) => Promise<void>;
    reportPost: (postId: string, payload: {
        reason: string;
        details?: string;
    }) => Promise<void>;
};
export declare const useStories: () => {
    stories: StoryAuthorGroup[];
    isLoading: boolean;
    error: string | null;
    reloadStories: () => Promise<void>;
    createStory: (payload: {
        media: StoryMedia[];
        caption?: string;
        visibility?: "FRIENDS" | "PUBLIC";
        music?: StoryMusic;
    }) => Promise<void>;
    markStorySeen: (storyId: string) => Promise<void>;
    deleteStory: (storyId: string) => Promise<void>;
};
export declare const useSocialSearch: () => {
    query: string;
    results: SearchResponse | null;
    isLoading: boolean;
    error: string | null;
    search: (keyword: string, type?: "all" | "users" | "posts") => Promise<void>;
};
export declare const useFriendSuggestions: (limit?: number) => {
    items: FriendSuggestion[];
    isLoading: boolean;
    reload: () => Promise<void>;
};
export declare const useComments: (postId: string) => {
    items: Comment[];
    hasNext: boolean;
    isLoading: boolean;
    loadMore: (reset?: boolean) => Promise<void>;
    createComment: (content: string) => Promise<void>;
};
export declare const useSavedPosts: () => {
    items: SavedPost[];
    hasNext: boolean;
    isLoading: boolean;
    loadMore: (reset?: boolean) => Promise<void>;
    unsave: (postId: string) => Promise<void>;
    reactionMap: Record<string, ReactionType | null>;
    selectReaction: (postId: string, reaction: ReactionType) => Promise<void>;
    clearReaction: (postId: string) => Promise<void>;
};
export declare const useSocialNotifications: () => {
    items: {
        _id: string;
        type: string;
        message: string;
        createdAt: string;
        isRead: boolean;
        data?: any;
    }[];
    hasNext: boolean;
    unreadCount: number;
    load: (reset?: boolean) => Promise<void>;
    markAllRead: () => Promise<void>;
};
