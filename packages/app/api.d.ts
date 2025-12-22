export declare const API_URL: string;
export declare const api: import("axios").AxiosInstance;
export declare const setAuthToken: (token?: string) => void;
export type LoginResponse = {
    accessToken: string;
    refreshToken: string;
    user: {
        id: string;
        name: string;
        email: string;
        username: string;
    };
};
export declare const login: (email: string, password: string) => Promise<LoginResponse>;
export type Conversation = {
    _id: string;
    title?: string;
    members: string[];
    isGroup: boolean;
    lastMessageAt?: string;
    createdAt: string;
    updatedAt: string;
    __v?: number;
    lastMessageSender?: {
        _id: string;
        name: string;
        avatar?: string;
    };
    unreadCount?: {
        [userId: string]: number;
    };
    typingUsers?: Array<{
        userId: string;
        startedAt: string;
    }>;
    admins?: string[];
    groupAvatar?: string;
    groupSettings?: {
        onlyAdminsCanPost?: boolean;
        allowMemberInvites?: boolean;
    };
    pinnedMessages?: string[];
    inviteCode?: string;
    inviteCodeCreatedAt?: string;
    opponent?: {
        _id: string;
        name: string;
        avatar?: string;
    };
};
export type CallRecord = {
    _id: string;
    conversationId: string;
    initiatorId: string;
    participants: string[];
    type: 'audio' | 'video';
    callType: 'p2p' | 'sfu';
    status: string;
    metadata?: {
        roomId?: string;
        livekitRoomName?: string;
    };
    livekitRoomName?: string;
};
export declare const getConversations: () => Promise<Conversation[]>;
export type Reaction = {
    userId: string;
    emoji: string;
    createdAt: string;
};
export type ReadReceipt = {
    userId: string;
    readAt: string;
};
export type Message = {
    _id: string;
    text?: string;
    type?: 'text' | 'image' | 'file';
    imageUrl?: string;
    conversationId: string;
    senderId: string;
    createdAt: string;
    updatedAt: string;
    __v?: number;
    replyTo?: string | Message;
    reactions?: Reaction[];
    isPinned?: boolean;
    isStarred?: boolean;
    isEdited?: boolean;
    deletedAt?: string | null;
    isRevoked?: boolean;
    revokedAt?: string | null;
    revokedBy?: string | null;
    readBy?: ReadReceipt[];
};
export declare const getMessages: (conversationId: string) => Promise<Message[]>;
export declare const createMessage: (conversationId: string, text: string) => Promise<Message>;
export type CreateMessagePayload = {
    text?: string;
    type?: 'text' | 'image' | 'file';
    imageUrl?: string;
    file?: {
        url: string;
        name?: string;
        mime?: string;
        size?: number;
    };
    replyTo?: string;
};
export declare const createMessageWithPayload: (conversationId: string, payload: CreateMessagePayload) => Promise<Message>;
export declare const createConversation: (userId: string, title?: string) => Promise<Conversation>;
export declare const createGroupConversation: (memberIds: string[], title?: string) => Promise<Conversation>;
export type InitiateCallResponse = {
    success: boolean;
    call?: {
        id: string;
        roomId?: string;
        livekitRoomName?: string;
        callType?: 'p2p' | 'sfu';
        status: string;
    };
};
export declare const initiateCall: (conversationId: string, type: "audio" | "video", targetUserId?: string) => Promise<InitiateCallResponse>;
export declare const getCall: (callId: string) => Promise<CallRecord>;
export type ActiveCallResponse = {
    activeCall: {
        id: string;
        conversationId: string;
        initiatorId: string;
        participants: string[];
        type: 'video' | 'audio';
        callType: 'p2p' | 'sfu';
        status: string;
        startedAt: string;
        livekitRoomName?: string;
    } | null;
};
export declare const getActiveCallForConversation: (conversationId: string) => Promise<ActiveCallResponse>;
export declare const getLiveKitToken: (callId: string) => Promise<{
    success: boolean;
    token: string;
    roomName: string;
    url: string;
}>;
export declare const endCall: (callId: string) => Promise<{
    success: boolean;
    duration?: number;
}>;
export declare const acceptCall: (callId: string) => Promise<{
    success: boolean;
}>;
export declare const rejectCall: (callId: string) => Promise<{
    success: boolean;
}>;
export declare const uploadImageLocalOld: (file: {
    uri: string;
    name: string;
    type: string;
}) => Promise<{
    url: string;
    name?: string;
    size?: number;
    mime?: string;
}>;
export declare const uploadImageS3: (file: {
    uri: string;
    name: string;
    type: string;
}) => Promise<{
    key: string;
    presignedUrl: string;
    name?: string;
    size?: number;
    mime?: string;
}>;
export declare const uploadImageLocal: (file: {
    uri: string;
    name: string;
    type: string;
}) => Promise<{
    url: string;
    name?: string;
    size?: number;
    mime?: string;
}>;
export declare const uploadMediaApi: (file: File) => Promise<PostMedia>;
export declare const uploadChatFile: (file: File) => Promise<{
    url: string;
    name?: string;
    size?: number;
    mime?: string;
}>;
export declare const logout: (token: string) => Promise<any>;
export type RegisterResponse = {
    user: {
        _id: string;
        name?: string;
        email: string;
        role?: string;
        username?: string;
        isEmailVerified: boolean;
        avatar?: string;
        createdAt?: string;
        updatedAt?: string;
    };
    accessToken: string;
    refreshToken: string;
    message?: string;
    otp?: SendOTPResponse;
};
export type SendOTPResponse = {
    message: string;
    email?: string;
    expiresAt?: string;
    emailSent?: boolean;
    otpCreated?: boolean;
    error?: string;
    errorCode?: string;
    warning?: boolean;
};
export type VerifyOTPResponse = {
    accessToken: string;
    refreshToken: string;
    user: {
        id: string;
        name: string;
        email: string;
        username: string;
    };
};
export declare const register: (email: string, password: string, name?: string) => Promise<RegisterResponse>;
export declare const sendOTP: (email: string) => Promise<SendOTPResponse>;
export declare const verifyOTP: (email: string, otp: string) => Promise<VerifyOTPResponse>;
export declare const resendOTP: (email: string) => Promise<SendOTPResponse>;
export declare const sendVerificationOTP: (email: string) => Promise<SendOTPResponse>;
export type UpdateUsernameResponse = {
    user: {
        id: string;
        name: string;
        email: string;
        username: string;
    };
    message: string;
};
export declare const updateUsername: (username: string) => Promise<UpdateUsernameResponse>;
export type UpdateAvatarResponse = {
    user: {
        id: string;
        name: string;
        email: string;
        username: string;
        avatar?: string;
    };
    message: string;
};
export declare const updateUserAvatar: (avatarUrl: string) => Promise<UpdateAvatarResponse>;
export declare const updateUserProfile: (data: {
    avatar?: string;
    name?: string;
    username?: string;
}) => Promise<UpdateAvatarResponse>;
export declare const updateUserInfo: (avatarUrl: string) => Promise<UpdateAvatarResponse>;
export declare const getCurrentUserId: () => Promise<string | null>;
export declare const getFriends: () => Promise<{
    friendIds: string[];
    total: number;
}>;
export declare const blockUserApi: (userId: string) => Promise<{
    message: string;
    blocked: boolean;
}>;
export declare const unblockUserApi: (userId: string) => Promise<{
    message: string;
    blocked: boolean;
}>;
export declare const getBlockedUsersApi: () => Promise<{
    blockedUsers: Array<{
        _id: string;
        name: string;
        avatar?: string;
        email?: string;
        username?: string;
        blockedAt: string;
    }>;
}>;
export declare const getBlockStatusApi: (userId: string) => Promise<{
    isBlocked: boolean;
    hasBlockedYou: boolean;
}>;
export declare const unfriendUserApi: (userId: string) => Promise<{
    message: string;
}>;
export declare const getUserPhotosApi: (userId: string, type?: "authored" | "tagged") => Promise<{
    items: Array<{
        postId: string;
        media: any[];
        createdAt: string;
    }>;
}>;
export declare const updateProfileApi: (payload: {
    bio?: string;
    works?: string[];
    colleges?: string[];
    highSchools?: string[];
    currentCity?: string;
    hometown?: string;
    relationshipStatus?: string;
    phone?: string;
    instagram?: string;
    facebook?: string;
    website?: string;
    coverImage?: string;
    avatar?: string;
}) => Promise<any>;
export declare const getUserPostsApi: (userId: string, cursor?: string, limit?: number) => Promise<FeedResponse>;
export type AnalyticsEventType = "STORY_VIEW" | "STORY_REACTION" | "STORY_REPLY" | "POST_REACTION" | "POST_SAVE" | "POST_REPORT" | "SEARCH_QUERY" | "FRIEND_SUGGESTION_CLICK" | "FRIEND_REQUEST_SENT" | "FRIEND_REQUEST_ACCEPTED" | "POST_CREATE" | "STORY_CREATE" | "COMMENT_CREATE";
export declare const trackEventApi: (eventType: AnalyticsEventType, metadata?: Record<string, any>, sessionId?: string) => Promise<void>;
export declare const updateUserAvatarWithId: (userId: string, avatarUrl: string) => Promise<UpdateAvatarResponse>;
export declare const updateUserProfileWithId: (userId: string, data: {
    avatar?: string;
    name?: string;
    username?: string;
}) => Promise<UpdateAvatarResponse>;
export type ChangePasswordResponse = {
    message: string;
};
export declare const changePassword: (currentPassword: string, newPassword: string) => Promise<ChangePasswordResponse>;
export declare const updateCurrentUserProfile: (data: {
    avatar?: string;
    name?: string;
    username?: string;
}) => Promise<UpdateAvatarResponse>;
export declare const getCurrentUserProfile: () => Promise<UpdateAvatarResponse>;
export declare const uploadAvatarDirect: (file: {
    uri: string;
    name: string;
    type: string;
}) => Promise<UpdateAvatarResponse>;
export type UserProfile = {
    role?: "user" | "admin" | "manager";
    isBanned?: boolean;
    bannedAt?: string;
    bannedReason?: string;
    isVerified?: boolean;
    verifiedAt?: string;
    verifiedBy?: string;
    _id: string;
    name?: string;
    email?: string;
    username?: string;
    avatar?: string;
    onlineStatus?: string;
    lastSeen?: string;
    bio?: string;
    works?: string[];
    colleges?: string[];
    highSchools?: string[];
    currentCity?: string;
    hometown?: string;
    relationshipStatus?: string;
    phone?: string;
    instagram?: string;
    facebook?: string;
    website?: string;
    coverImage?: string;
};
export declare const getUsersByIds: (userIds: string[]) => Promise<{
    users: UserProfile[];
}>;
export type SearchUsersResponse = {
    users: Array<{
        _id: string;
        name: string;
        email: string;
        username?: string;
        avatar?: string;
    }>;
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
};
export declare const searchUsers: (query: string, page?: number, limit?: number) => Promise<SearchUsersResponse>;
export declare const createConversationWithUser: (userId: string) => Promise<Conversation>;
export type OpponentInfoResponse = {
    user: {
        _id: string;
        name: string;
        email: string;
        username?: string;
        avatar?: string;
        createdAt: string;
    };
    status: {
        isOnline: boolean;
        lastActive: string;
        lastActiveText: string;
    };
    conversation: {
        _id: string;
        isGroup: boolean;
        title?: string;
        createdAt: string;
    };
    encryption: {
        isEndToEndEncrypted: boolean;
        encryptionStatus: string;
    };
};
export declare const getOpponentInfo: (conversationId: string) => Promise<OpponentInfoResponse>;
export declare const editMessage: (messageId: string, text: string) => Promise<Message>;
export declare const deleteMessage: (messageId: string) => Promise<{
    message: string;
}>;
export declare const addReaction: (messageId: string, emoji: string) => Promise<Message>;
export declare const removeReaction: (messageId: string, emoji: string) => Promise<Message>;
export declare const pinMessage: (messageId: string) => Promise<Message>;
export declare const unpinMessage: (messageId: string) => Promise<Message>;
export declare const starMessage: (messageId: string) => Promise<Message>;
export declare const revokeMessage: (messageId: string) => Promise<Message>;
export declare const searchMessages: (query: string, conversationId?: string) => Promise<Message[]>;
export declare const markAsRead: (conversationId: string, messageId?: string) => Promise<{
    success: boolean;
}>;
export declare const addMembers: (conversationId: string, userIds: string[]) => Promise<Conversation>;
export declare const removeMember: (conversationId: string, userId: string) => Promise<Conversation>;
export declare const updateGroupInfo: (conversationId: string, data: {
    title?: string;
    avatar?: string;
}) => Promise<Conversation>;
export type InviteLinkResponse = {
    inviteCode: string;
    shareUrl: string;
};
export declare const createInviteLink: (conversationId: string) => Promise<InviteLinkResponse>;
export declare const joinConversationByInvite: (inviteCode: string) => Promise<{
    conversation: Conversation;
}>;
export declare const makeAdmin: (conversationId: string, userId: string) => Promise<Conversation>;
export declare const removeAdmin: (conversationId: string, userId: string) => Promise<Conversation>;
export declare const addGroupMembers: (conversationId: string, userIds: string[]) => Promise<Conversation>;
export declare const removeGroupMember: (conversationId: string, userId: string) => Promise<Conversation>;
export declare const makeGroupAdmin: (conversationId: string, userId: string) => Promise<Conversation>;
export declare const removeGroupAdmin: (conversationId: string, userId: string) => Promise<Conversation>;
export declare const leaveGroup: (conversationId: string) => Promise<{
    success: boolean;
    message: string;
}>;
export declare const getUnreadCount: (conversationId: string) => Promise<{
    unreadCount: number;
}>;
export declare const updateOnlineStatus: (status: "online" | "offline" | "away") => Promise<{
    user: any;
    status: string;
    lastSeen?: Date;
}>;
export declare const getOnlineUsers: (userIds: string[]) => Promise<{
    statusMap: {
        [userId: string]: {
            onlineStatus: string;
            lastSeen?: Date;
        };
    };
}>;
export declare const createMessageWithReply: (conversationId: string, text: string, replyTo?: string) => Promise<Message>;
export type ReactionType = "LIKE" | "LOVE" | "HAHA" | "WOW" | "SAD" | "ANGRY";
export type PostMedia = {
    url: string;
    type: string;
};
export type Post = {
    _id: string;
    authorId: string;
    author?: {
        _id: string;
        name: string;
        avatar?: string;
        email?: string;
        username?: string;
    };
    content: string;
    media?: PostMedia[];
    visibility: "PUBLIC" | "FRIENDS" | "ONLY_ME";
    hashtags?: string[];
    taggedUsers?: Array<{
        _id: string;
        name: string;
        avatar?: string;
        email?: string;
        username?: string;
    }>;
    sharedFrom?: string | Post;
    shareCount?: number;
    likeCount: number;
    commentCount: number;
    reactionCounts?: Partial<Record<ReactionType, number>>;
    currentUserReaction?: ReactionType | null;
    createdAt: string;
    updatedAt: string;
};
export type StoryMedia = {
    url: string;
    type: "image" | "video";
    thumbnail?: string;
    durationMs?: number;
};
export type StoryAuthorGroup = {
    authorId: string;
    author: {
        _id: string;
        name: string;
        avatar?: string;
    };
    stories: Array<{
        _id: string;
        media: StoryMedia[];
        caption?: string;
        createdAt: string;
        expiresAt: string;
        isSeen?: boolean;
    }>;
};
export type FeedResponse = {
    items: Post[];
    nextCursor?: string | null;
    hasNext: boolean;
};
export type Comment = {
    _id: string;
    postId: string;
    authorId: string;
    content: string;
    createdAt: string;
    updatedAt: string;
    author?: {
        _id: string;
        name: string;
        avatar?: string;
        email?: string;
        username?: string;
    };
};
export type CommentsResponse = {
    items: Comment[];
    nextCursor?: string | null;
    hasNext: boolean;
};
export type FriendSuggestion = {
    user: UserProfile & {
        name: string;
    };
    mutualCount: number;
    mutualFriends: Array<{
        _id: string;
        name: string;
        avatar?: string;
    }>;
};
export type NotificationsResponse = {
    items: Array<{
        _id: string;
        type: string;
        message: string;
        createdAt: string;
        isRead: boolean;
        data?: any;
    }>;
    nextCursor?: string | null;
    hasNext: boolean;
};
export type SavedPost = {
    _id: string;
    post: Post;
    savedAt: string;
};
export type SocialSearchUser = {
    _id: string;
    name: string;
    avatar?: string;
    email?: string;
    username?: string;
    statusMessage?: string;
};
export type SearchResponse = {
    posts: Post[];
    users: SocialSearchUser[];
};
export type StoryResponse = {
    items: StoryAuthorGroup[];
};
export declare const getFeed: (cursor?: string) => Promise<FeedResponse>;
export declare const createPostApi: (payload: {
    content: string;
    media?: PostMedia[];
    visibility?: "PUBLIC" | "FRIENDS" | "ONLY_ME";
    taggedUsers?: string[];
}) => Promise<Post>;
export declare const createCommentApi: (postId: string, payload: {
    content: string;
    parentId?: string;
}) => Promise<Comment>;
export declare const getPostComments: (postId: string, cursor?: string) => Promise<CommentsResponse>;
export declare const getPostsByHashtagApi: (tag: string, cursor?: string) => Promise<FeedResponse>;
export declare const getPostByIdApi: (postId: string) => Promise<Post>;
export declare const sharePostApi: (postId: string, payload: {
    content?: string;
    visibility?: "PUBLIC" | "FRIENDS" | "ONLY_ME";
}) => Promise<Post>;
export declare const createStoryApi: (payload: {
    media: StoryMedia[];
    caption?: string;
    visibility?: "FRIENDS" | "PUBLIC";
}) => Promise<any>;
export declare const getStoriesApi: () => Promise<StoryResponse>;
export declare const markStoryViewedApi: (storyId: string) => Promise<{
    ok: boolean;
}>;
export declare const deleteStoryApi: (storyId: string) => Promise<{
    ok: boolean;
}>;
export declare const savePostApi: (postId: string) => Promise<{
    ok: boolean;
}>;
export declare const unsavePostApi: (postId: string) => Promise<{
    ok: boolean;
}>;
export declare const getSavedPostsApi: (cursor?: string) => Promise<{
    items: SavedPost[];
    nextCursor?: string | null;
    hasNext: boolean;
}>;
export declare const reportPostApi: (postId: string, payload: {
    reason: string;
    details?: string;
}) => Promise<{
    ok: boolean;
}>;
export declare const getFriendSuggestionsApi: (limit?: number) => Promise<{
    suggestions: FriendSuggestion[];
}>;
export declare const sendFriendRequestApi: (targetUserId: string) => Promise<any>;
export declare const respondFriendRequestApi: (friendshipId: string, action: "accept" | "decline") => Promise<any>;
export declare const getPendingFriendRequestsApi: () => Promise<{
    received: any[];
    sent: any[];
}>;
export declare const getNotificationsApi: (cursor?: string, limit?: number) => Promise<NotificationsResponse>;
export declare const markNotificationsReadApi: (ids: string[]) => Promise<{
    ok: boolean;
}>;
export declare const getUserById: (userId: string) => Promise<UserProfile>;
export declare const searchSocialApi: (queryOrParams: string | {
    q: string;
    type?: "all" | "users" | "posts";
}) => Promise<SearchResponse>;
export declare const checkPostLikedApi: (postId: string) => Promise<{
    liked: boolean;
    type?: ReactionType | null;
}>;
export declare const reactToPostApi: (postId: string, type: ReactionType) => Promise<{
    ok: boolean;
}>;
export declare const removeReactionApi: (postId: string) => Promise<{
    ok: boolean;
}>;
export type StoryMusic = {
    title: string;
    artist: string;
    url?: string;
    thumbnail?: string;
    durationMs?: number;
    source?: "youtube" | "spotify" | "custom" | "itunes";
    startTime?: number;
    endTime?: number;
};
export type iTunesTrack = {
    trackId: number;
    trackName: string;
    artistName: string;
    previewUrl?: string;
    artworkUrl100?: string;
    artworkUrl60?: string;
    collectionName?: string;
    trackTimeMillis?: number;
};
export declare const reactToStoryApi: (storyId: string, type: ReactionType) => Promise<{
    reaction: ReactionType | null;
    reactionCounts: Record<string, number>;
}>;
export declare const removeStoryReactionApi: (storyId: string) => Promise<{
    reaction: null;
    reactionCounts: Record<string, number>;
}>;
export type StoryReply = {
    _id: string;
    storyId: string;
    authorId: string;
    author?: {
        _id: string;
        name: string;
        avatar?: string;
        username?: string;
        email?: string;
    };
    content: string;
    createdAt: string;
    updatedAt: string;
};
export type StoryRepliesResponse = {
    limit: number;
    hasNext: boolean;
    nextCursor: string | null;
    items: StoryReply[];
};
export declare const getStoryRepliesApi: (storyId: string, cursor?: string, limit?: number) => Promise<StoryRepliesResponse>;
export declare const createStoryReplyApi: (storyId: string, content: string) => Promise<StoryReply>;
export declare const searchMusicApi: (query: string) => Promise<iTunesTrack[]>;
export type Reel = {
    _id: string;
    authorId: string;
    author?: {
        _id: string;
        name: string;
        avatar?: string;
        email?: string;
        username?: string;
    };
    videoUrl: string;
    thumbnailUrl?: string;
    caption?: string;
    duration?: number;
    visibility: "PUBLIC" | "FRIENDS" | "ONLY_ME";
    hashtags?: string[];
    taggedUsers?: Array<{
        _id: string;
        name: string;
        avatar?: string;
        username?: string;
    }>;
    likeCount: number;
    commentCount: number;
    viewCount: number;
    reactionCounts?: Partial<Record<ReactionType, number>>;
    currentUserReaction?: ReactionType | null;
    createdAt: string;
    updatedAt: string;
};
export type ReelsFeedResponse = {
    items: Reel[];
    nextCursor: string | null;
    hasNext: boolean;
};
export declare const createReelApi: (payload: {
    videoUrl: string;
    thumbnailUrl?: string;
    caption?: string;
    duration?: number;
    visibility?: "PUBLIC" | "FRIENDS" | "ONLY_ME";
    taggedUsers?: string[];
}) => Promise<Reel>;
export declare const getReelsFeedApi: (cursor?: string, limit?: number) => Promise<ReelsFeedResponse>;
export declare const getReelByIdApi: (reelId: string) => Promise<Reel>;
export declare const getUserReelsApi: (userId: string, cursor?: string, limit?: number) => Promise<ReelsFeedResponse>;
export declare const likeReelApi: (reelId: string, type?: ReactionType) => Promise<{
    message: string;
    liked: boolean;
    type: ReactionType;
}>;
export declare const unlikeReelApi: (reelId: string) => Promise<{
    message: string;
    liked: boolean;
}>;
export declare const checkReelLikedApi: (reelId: string) => Promise<{
    liked: boolean;
    type?: ReactionType | null;
}>;
export declare const deleteReelApi: (reelId: string) => Promise<{
    message: string;
}>;
export declare const syncReelsFromPostsApi: () => Promise<{
    message: string;
    createdCount: number;
    totalPostsWithVideo: number;
}>;
export declare const getAdminUsersApi: (params?: {
    page?: number;
    limit?: number;
    role?: string;
    status?: string;
    search?: string;
    verified?: string;
}) => Promise<{
    items: UserProfile[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}>;
export declare const getAdminUserStatsApi: () => Promise<{
    totalUsers: number;
    activeUsers: number;
    bannedUsers: number;
    verifiedUsers: number;
    newUsersToday: number;
    newUsersThisWeek: number;
}>;
export declare const getAdminUserDetailsApi: (userId: string) => Promise<UserProfile & {
    stats: {
        postsCount: number;
        commentsCount: number;
        friendsCount: number;
        reportsCount: number;
    };
}>;
export declare const banUserApi: (userId: string, reason?: string) => Promise<{
    message: string;
    user: UserProfile;
}>;
export declare const unbanUserApi: (userId: string) => Promise<{
    message: string;
    user: UserProfile;
}>;
export declare const updateUserRoleApi: (userId: string, role: "user" | "admin" | "manager") => Promise<{
    message: string;
    user: UserProfile;
}>;
export declare const verifyUserApi: (userId: string) => Promise<{
    message: string;
    user: UserProfile;
}>;
export declare const unverifyUserApi: (userId: string) => Promise<{
    message: string;
    user: UserProfile;
}>;
export declare const getAdminPostsApi: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    authorId?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
}) => Promise<{
    items: Post[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}>;
export declare const getAdminPostStatsApi: () => Promise<{
    totalPosts: number;
    activePosts: number;
    deletedPosts: number;
    postsToday: number;
    postsThisWeek: number;
}>;
export declare const deletePostApi: (postId: string) => Promise<{
    message: string;
}>;
export declare const hidePostApi: (postId: string) => Promise<{
    message: string;
    post: Post;
}>;
export declare const restorePostApi: (postId: string) => Promise<{
    message: string;
    post: Post;
}>;
export interface PostReport {
    _id: string;
    postId: Post;
    reporterId: UserProfile;
    reason: string;
    details?: string;
    status: "PENDING" | "REVIEWING" | "RESOLVED";
    handledBy?: UserProfile;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}
export declare const getAdminReportsApi: (params?: {
    page?: number;
    limit?: number;
    status?: string;
}) => Promise<{
    items: PostReport[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}>;
export declare const getAdminReportDetailsApi: (reportId: string) => Promise<PostReport>;
export declare const handleReportApi: (reportId: string, action: "resolve" | "dismiss", notes?: string) => Promise<{
    message: string;
    report: PostReport;
}>;
export declare const bulkHandleReportsApi: (reportIds: string[], action: "resolve" | "dismiss") => Promise<{
    message: string;
    modifiedCount: number;
}>;
export declare const getAdminDashboardStatsApi: () => Promise<{
    users: {
        total: number;
        active: number;
    };
    posts: {
        total: number;
        active: number;
    };
    reports: {
        total: number;
        pending: number;
    };
    engagement: {
        postsCreated: number;
        reactionsGiven: number;
        commentsCreated: number;
    };
}>;
export declare const getAdminAnalyticsChartApi: (timeRange?: string, metric?: string) => Promise<{
    data: Array<{
        _id: string;
        count: number;
    }>;
}>;
export declare const getUserActivityStatsApi: (userId: string, timeRange?: string) => Promise<{
    posts: number;
    comments: number;
    reactions: number;
}>;
export declare const getContentStatsApi: (timeRange?: string) => Promise<{
    posts: number;
    reels: number;
    stories: number;
}>;
export declare const moderatePostApi: (postId: string, action: "approve" | "reject" | "warn") => Promise<{
    message: string;
}>;
export declare const bulkModeratePostsApi: (postIds: string[], action: "approve" | "reject" | "restore") => Promise<{
    message: string;
}>;
export declare const getModerationQueueApi: () => Promise<{
    items: Post[];
    total: number;
}>;
export interface SystemSettings {
    maintenanceMode: boolean;
    registrationEnabled: boolean;
    maxPostLength: number;
    maxMediaPerPost: number;
    allowedMediaTypes: string[];
}
export declare const getSystemSettingsApi: () => Promise<SystemSettings>;
export declare const updateSystemSettingsApi: (settings: Partial<SystemSettings>) => Promise<{
    message: string;
    settings: SystemSettings;
}>;
export declare const getSystemLogsApi: (params?: {
    page?: number;
    limit?: number;
}) => Promise<{
    items: any[];
    page: number;
    limit: number;
}>;
