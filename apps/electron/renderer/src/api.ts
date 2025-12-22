import axios, { type AxiosRequestHeaders } from 'axios';

// For Electron, always use direct backend URL
const DIRECT_BACKEND_URL = 'https://backend36.dev';
export const API_URL = DIRECT_BACKEND_URL;

// LocalStorage wrapper (replaces AsyncStorage)
const storage = {
  getItem: (key: string): Promise<string | null> => {
    try {
      return Promise.resolve(localStorage.getItem(key));
    } catch (error) {
      console.error('Error getting item from storage:', error);
      return Promise.resolve(null);
    }
  },
  setItem: (key: string, value: string): Promise<void> => {
    try {
      localStorage.setItem(key, value);
      return Promise.resolve();
    } catch (error) {
      console.error('Error setting item in storage:', error);
      return Promise.resolve();
    }
  },
  removeItem: (key: string): Promise<void> => {
    try {
      localStorage.removeItem(key);
      return Promise.resolve();
    } catch (error) {
      console.error('Error removing item from storage:', error);
      return Promise.resolve();
    }
  },
};

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Add request interceptor for auth + debugging
api.interceptors.request.use(
  (config) => {
    // Always try to attach latest token from localStorage
    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        if (!config.headers) {
          config.headers = {} as AxiosRequestHeaders;
        }
        (config.headers as AxiosRequestHeaders).Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('❌ Error reading auth_token from localStorage:', error);
    }

    console.log('🔍 API Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      hasAuthHeader: !!(config.headers as any)?.Authorization,
    });
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', {
      status: response.status,
      url: response.config.url,
    });
    return response;
  },
  (error) => {
    console.error('❌ Response Error:', {
      status: error.response?.status,
      url: error.config?.url,
    });
    return Promise.reject(error);
  }
);

export const setAuthToken = (token?: string) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  user: { id: string; name: string; email: string; username: string };
};

export const login = async (email: string, password: string) => {
  const res = await api.post<LoginResponse>('/auth/login', { email, password });
  return res.data;
};

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
  opponent?: {
    _id: string;
    name: string;
    avatar?: string;
    username?: string;
  };
  unreadCount?: { [userId: string]: number };
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
};

export const getConversations = async () => {
  const res = await api.get<Conversation[]>('/conversations');
  return res.data;
};

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
  sender?: {
    _id: string;
    name: string;
    avatar?: string;
  };
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

export type MessagesResponse = {
  messages: Message[];
  pagination: {
    limit: number;
    skip: number;
    total: number;
    hasMore: boolean;
  };
};

export const getMessages = async (
  conversationId: string,
  options?: { limit?: number; skip?: number }
): Promise<MessagesResponse | Message[]> => {
  const params: any = {};
  if (options?.limit) params.limit = options.limit;
  if (options?.skip) params.skip = options.skip;
  const res = await api.get<MessagesResponse | Message[]>(`/conversations/${conversationId}/messages`, { params });
  return res.data;
};

export const createMessage = async (conversationId: string, text: string) => {
  const res = await api.post<Message>(`/conversations/${conversationId}/messages`, { text });
  return res.data;
};

export type CreateMessagePayload = {
  text?: string;
  type?: 'text' | 'image' | 'file';
  imageUrl?: string;
  file?: { url: string; name?: string; mime?: string; size?: number };
  replyTo?: string;
};

export const createMessageWithPayload = async (conversationId: string, payload: CreateMessagePayload) => {
  const res = await api.post<Message>(`/conversations/${conversationId}/messages`, payload);
  return res.data;
};

export const createConversation = async (userId: string, title?: string) => {
  const res = await api.post<Conversation>('/conversations', { 
    members: [userId],
    title: title || `Chat with ${userId}`
  });
  return res.data;
};

export const createGroupConversation = async (memberIds: string[], title?: string) => {
  const unique = Array.from(new Set(memberIds.filter(Boolean)));
  const res = await api.post<Conversation>('/conversations', {
    members: unique,
    isGroup: true,
    title: title || `Group (${unique.length})`
  });
  return res.data;
};

export const uploadImageLocal = async (file: File) => {
  const form = new FormData();
  form.append('file', file);
  const res = await api.post<{ url: string; name?: string; size?: number; mime?: string }>(`/uploads/image`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const logout = async (token: string) => {
  const res = await api.post('/auth/logout', { token });
  return res.data;
};

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
  user: { id: string; name: string; email: string; username: string };
};

export const register = async (email: string, password: string, name?: string) => {
  const res = await api.post<RegisterResponse>('/auth/register', { email, password, name });
  return res.data;
};

export const sendOTP = async (email: string) => {
  const res = await api.post<SendOTPResponse>('/auth/send-otp', { email });
  return res.data;
};

export const verifyOTP = async (email: string, otp: string) => {
  const res = await api.post<VerifyOTPResponse>('/auth/verify-otp', { email, otp });
  return res.data;
};

export const resendOTP = async (email: string) => {
  const res = await api.post<SendOTPResponse>('/auth/resend-otp', { email });
  return res.data;
};

export const sendVerificationOTP = async (email: string) => {
  const res = await api.post<SendOTPResponse>('/auth/send-verification-otp', { email });
  return res.data;
};

export type UpdateUsernameResponse = {
  user: { id: string; name: string; email: string; username: string };
  message: string;
};

export const updateUsername = async (username: string) => {
  const res = await api.patch<UpdateUsernameResponse>('/users/username', { username });
  return res.data;
};

export const getCurrentUserId = async (): Promise<string | null> => {
  try {
    const userId = await storage.getItem('user_id');
    return userId;
  } catch (error) {
    console.error('Error getting user ID:', error);
    return null;
  }
};

export const searchUsers = async (query: string, page: number = 1, limit: number = 20) => {
  const res = await api.get<{
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
  }>('/users/search', {
    params: { q: query, page, limit }
  });
  return res.data;
};

export const createConversationWithUser = async (userId: string) => {
  const res = await api.post<Conversation>('/conversations', {
    members: [userId]
  });
  return res.data;
};

export const addGroupMembers = async (conversationId: string, userIds: string[]) => {
  const res = await api.post<Conversation>(`/conversations/${conversationId}/members`, { userIds });
  return res.data;
};

export const removeGroupMember = async (conversationId: string, userId: string) => {
  const res = await api.delete<Conversation>(`/conversations/${conversationId}/members/${userId}`);
  return res.data;
};

export const leaveGroup = async (conversationId: string) => {
  const res = await api.post<{ success: boolean }>(`/conversations/${conversationId}/leave`);
  return res.data;
};

export const makeGroupAdmin = async (conversationId: string, userId: string) => {
  const res = await api.post<Conversation>(`/conversations/${conversationId}/admins/${userId}`);
  return res.data;
};

export const removeGroupAdmin = async (conversationId: string, userId: string) => {
  const res = await api.delete<Conversation>(`/conversations/${conversationId}/admins/${userId}`);
  return res.data;
};

export const updateGroupInfo = async (conversationId: string, payload: { title?: string; avatar?: string }) => {
  const res = await api.patch<Conversation>(`/conversations/${conversationId}`, payload);
  return res.data;
};

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

export const getOpponentInfo = async (conversationId: string) => {
  const res = await api.get<OpponentInfoResponse>(`/conversations/${conversationId}/opponent`);
  return res.data;
};

export const editMessage = async (messageId: string, text: string) => {
  const res = await api.patch<Message>(`/conversations/messages/${messageId}`, { text });
  return res.data;
};

export const deleteMessage = async (messageId: string) => {
  const res = await api.delete<{ message: string }>(`/conversations/messages/${messageId}`);
  return res.data;
};

export const addReaction = async (messageId: string, emoji: string) => {
  const res = await api.post<Message>(`/conversations/messages/${messageId}/reactions`, { emoji });
  return res.data;
};

export const removeReaction = async (messageId: string, emoji: string) => {
  const res = await api.delete<Message>(`/conversations/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`);
  return res.data;
};

export const pinMessage = async (messageId: string) => {
  const res = await api.post<Message>(`/conversations/messages/${messageId}/pin`);
  return res.data;
};

export const unpinMessage = async (messageId: string) => {
  const res = await api.delete<Message>(`/conversations/messages/${messageId}/pin`);
  return res.data;
};

export const starMessage = async (messageId: string) => {
  const res = await api.post<Message>(`/conversations/messages/${messageId}/star`);
  return res.data;
};

export const revokeMessage = async (messageId: string) => {
  const res = await api.patch<Message>(`/conversations/messages/${messageId}/revoke`, {});
  return res.data;
};

export const searchMessages = async (query: string, conversationId?: string) => {
  const params: any = { query };
  if (conversationId) {
    params.conversationId = conversationId;
  }
  const res = await api.get<Message[]>(`/conversations/messages/search`, { params });
  return res.data;
};

export const markAsRead = async (conversationId: string, messageId?: string) => {
  const res = await api.post<{ success: boolean }>(`/conversations/${conversationId}/read`, { messageId });
  return res.data;
};


export type InviteLinkResponse = {
  inviteCode: string;
  shareUrl: string;
};

export const createInviteLink = async (conversationId: string) => {
  const res = await api.post<InviteLinkResponse>(`/conversations/${conversationId}/invite`);
  return res.data;
};

export const joinConversationByInvite = async (inviteCode: string) => {
  const res = await api.post<{ conversation: Conversation }>(`/conversations/join/invite`, { inviteCode });
  return res.data;
};


export const getUnreadCount = async (conversationId: string) => {
  const res = await api.get<{ unreadCount: number }>(`/conversations/${conversationId}/unread`);
  return res.data;
};

export const updateOnlineStatus = async (status: "online" | "offline" | "away") => {
  const res = await api.patch<{ user: any; status: string; lastSeen?: Date }>(`/users/me/status`, { status });
  return res.data;
};

export const getOnlineUsers = async (userIds: string[]) => {
  const res = await api.post<{ statusMap: { [userId: string]: { onlineStatus: string; lastSeen?: Date } } }>(`/users/online-status`, { userIds });
  return res.data;
};

export type UserProfile = {
  _id: string;
  name?: string;
  email?: string;
  username?: string;
  avatar?: string;
  onlineStatus?: string;
  lastSeen?: string;
};

export const getUsersByIds = async (userIds: string[]) => {
  const res = await api.post<{ users: UserProfile[] }>(`/users/by-ids`, { userIds });
  return res.data;
};

export const getUserById = async (userId: string) => {
  const res = await api.get<UserProfile>(`/users/${userId}`);
  return res.data;
};

// ===== Social (Feed) APIs =====
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
  visibility: "PUBLIC" | "FRIENDS";
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

export type StoryMusic = {
  title: string;
  artist: string;
  url?: string;
  thumbnail?: string;
  durationMs?: number;
  source?: "youtube" | "spotify" | "custom" | "itunes";
  startTime?: number; // Start time in seconds for 30s segment
  endTime?: number; // End time in seconds for 30s segment
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

export type StoryItem = {
  _id: string;
  caption?: string;
  media: StoryMedia[];
  music?: StoryMusic;
  visibility: "FRIENDS" | "PUBLIC";
  createdAt: string;
  expiresAt: string;
  viewCount: number;
  hasSeen: boolean;
  reactionCounts?: Record<string, number>;
  userReaction?: ReactionType | null;
};

export type StoryAuthorGroup = {
  author: {
    _id: string;
    name?: string;
    avatar?: string;
    username?: string;
    email?: string;
  };
  stories: StoryItem[];
};

export type Comment = {
  _id: string;
  postId: string;
  authorId: string;
  author?: {
    _id: string;
    name: string;
    avatar?: string;
    email?: string;
    username?: string;
  };
  parentId?: string | null;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export type FeedResponse = {
  limit: number;
  hasNext: boolean;
  nextCursor: string | null;
  items: Post[];
};

export type CommentsResponse = {
  limit: number;
  hasNext: boolean;
  nextCursor: string | null;
  items: Comment[];
};

export type NotificationItem = {
  _id: string;
  userId: string;
  actorId?: string;
  actor?: {
    _id: string;
    name: string;
    avatar?: string;
    email?: string;
    username?: string;
  };
  type: "POST_LIKED" | "POST_COMMENTED" | "FRIEND_REQUEST" | "FRIEND_ACCEPTED";
  entityId?: string;
  entityType?: string;
  message?: string;
  isRead: boolean;
  createdAt: string;
};

export type NotificationsResponse = {
  limit: number;
  hasNext: boolean;
  nextCursor: string | null;
  items: NotificationItem[];
};

export type SocialSearchUser = {
  _id: string;
  name?: string;
  avatar?: string;
  username?: string;
  email?: string;
  statusMessage?: string;
  onlineStatus?: string;
};

export type SearchResponse = {
  query: string;
  type: string;
  users: SocialSearchUser[];
  posts: Post[];
  limits: {
    users: number;
    posts: number;
  };
};

export const getFeed = async (cursor?: string, limit: number = 10) => {
  const params: any = { limit };
  if (cursor) params.cursor = cursor;
  const res = await api.get<FeedResponse>("/social/posts/feed", { params });
  return res.data;
};

export const getStoriesApi = async () => {
  const res = await api.get<{ items: StoryAuthorGroup[] }>("/social/stories");
  return res.data.items;
};

export const createPostApi = async (payload: {
  content: string;
  media?: PostMedia[];
  visibility?: "PUBLIC" | "FRIENDS";
}) => {
  const res = await api.post<Post>("/social/posts", payload);
  return res.data;
};

export const createStoryApi = async (payload: {
  media: StoryMedia[];
  caption?: string;
  visibility?: "FRIENDS" | "PUBLIC";
  music?: StoryMusic;
}) => {
  const res = await api.post("/social/stories", payload);
  return res.data;
};

export const searchMusicApi = async (query: string): Promise<iTunesTrack[]> => {
  try {
    const response = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&limit=20`
    );
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error("Failed to search music:", error);
    return [];
  }
};

export const uploadMediaApi = async (file: File): Promise<PostMedia> => {
  const formData = new FormData();
  formData.append("file", file);
  
  try {
    const res = await api.post<{
      url: string;
      name: string;
      size: number;
      mime: string;
    }>("/uploads/s3/public", formData, {
      headers: {
        // Don't set Content-Type - let browser set it with boundary
      },
      timeout: 60000, // 60 seconds timeout for large files
    });
    
    return {
      url: res.data.url,
      type: res.data.mime.startsWith("image/") ? "image" : "video",
    };
  } catch (error: any) {
    console.error("Upload error:", error);
    const errorMessage = error?.response?.data?.error || error?.message || "Lỗi không xác định";
    throw new Error(`Lỗi khi upload ${file.name}: ${errorMessage}`);
  }
};

export const likePostApi = async (postId: string) => {
  const res = await api.post<{ ok: boolean }>(`/social/posts/${postId}/like`);
  return res.data;
};

export const unlikePostApi = async (postId: string) => {
  const res = await api.delete<{ ok: boolean }>(
    `/social/posts/${postId}/like`
  );
  return res.data;
};

export const markStoryViewedApi = async (storyId: string) => {
  const res = await api.post<{ ok: boolean }>(`/social/stories/${storyId}/view`);
  return res.data;
};

export const deleteStoryApi = async (storyId: string) => {
  const res = await api.delete<{ ok: boolean }>(`/social/stories/${storyId}`);
  return res.data;
};

export const reactToStoryApi = async (storyId: string, type: ReactionType) => {
  const res = await api.post<{ reaction: ReactionType | null; reactionCounts: Record<string, number> }>(
    `/social/stories/${storyId}/reactions`,
    { type }
  );
  return res.data;
};

export const removeStoryReactionApi = async (storyId: string) => {
  const res = await api.delete<{ reaction: null; reactionCounts: Record<string, number> }>(
    `/social/stories/${storyId}/reactions`
  );
  return res.data;
};

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

export const getStoryRepliesApi = async (
  storyId: string,
  cursor?: string,
  limit: number = 20
) => {
  const params: any = { limit };
  if (cursor) params.cursor = cursor;
  const res = await api.get<StoryRepliesResponse>(`/social/stories/${storyId}/replies`, {
    params,
  });
  return res.data;
};

export const createStoryReplyApi = async (storyId: string, content: string) => {
  const res = await api.post<StoryReply>(`/social/stories/${storyId}/replies`, { content });
  return res.data;
};

// Analytics
export type AnalyticsEventType =
  | "STORY_VIEW"
  | "STORY_REACTION"
  | "STORY_REPLY"
  | "POST_REACTION"
  | "POST_SAVE"
  | "POST_REPORT"
  | "SEARCH_QUERY"
  | "FRIEND_SUGGESTION_CLICK"
  | "FRIEND_REQUEST_SENT"
  | "FRIEND_REQUEST_ACCEPTED"
  | "POST_CREATE"
  | "STORY_CREATE"
  | "COMMENT_CREATE";

export const trackEventApi = async (
  eventType: AnalyticsEventType,
  metadata?: Record<string, any>,
  sessionId?: string
) => {
  try {
    await api.post("/analytics/track", {
      eventType,
      metadata,
      sessionId,
    });
  } catch (error) {
    console.error("[Analytics] Failed to track event:", error);
  }
};

export const searchSocialApi = async (params: {
  q: string;
  type?: "all" | "users" | "posts";
  limit?: number;
  usersLimit?: number;
  postsLimit?: number;
}) => {
  const res = await api.get<SearchResponse>("/social/search", { params });
  return res.data;
};

export const getPostComments = async (
  postId: string,
  cursor?: string,
  limit: number = 20
) => {
  const params: any = { limit };
  if (cursor) params.cursor = cursor;
  const res = await api.get<CommentsResponse>(
    `/social/posts/${postId}/comments`,
    { params }
  );
  return res.data;
};

export const createCommentApi = async (postId: string, payload: {
  content: string;
  parentId?: string;
}) => {
  const res = await api.post<Comment>(
    `/social/posts/${postId}/comments`,
    payload
  );
  return res.data;
};

export const getFriends = async () => {
  const res = await api.get<{ friendIds: string[]; total: number }>(
    "/social/friends"
  );
  return res.data;
};

export type FriendSuggestion = {
  user: UserProfile;
  mutualCount: number;
  mutualFriends: Array<{
    _id: string;
    name: string;
    avatar?: string;
  }>;
};

export const getPendingFriendRequestsApi = async () => {
  const res = await api.get<{
    sent: Array<{
      _id: string;
      userId: string;
      user?: {
        _id: string;
        name: string;
        avatar?: string;
        email?: string;
        username?: string;
      };
      createdAt: string;
    }>;
    received: Array<{
      _id: string;
      userId: string;
      user?: {
        _id: string;
        name: string;
        avatar?: string;
        email?: string;
        username?: string;
      };
      createdAt: string;
    }>;
  }>("/social/friends/requests");
  return res.data;
};

export const getFriendSuggestionsApi = async (limit = 6) => {
  const res = await api.get<{ suggestions: FriendSuggestion[] }>(
    "/social/friends/suggestions",
    { params: { limit } }
  );
  return res.data;
};

export const sendFriendRequestApi = async (targetUserId: string) => {
  const res = await api.post("/social/friends/requests", { targetUserId });
  return res.data;
};

export const respondFriendRequestApi = async (
  friendshipId: string,
  action: "accept" | "decline"
) => {
  const res = await api.post(`/social/friends/${friendshipId}/respond`, {
    action,
  });
  return res.data;
};

export const getNotificationsApi = async (
  cursor?: string,
  limit: number = 20
) => {
  const params: any = { limit };
  if (cursor) params.cursor = cursor;
  const res = await api.get<NotificationsResponse>("/social/notifications", {
    params,
  });
  return res.data;
};

export const markNotificationsReadApi = async (ids: string[]) => {
  const res = await api.post<{ ok: boolean }>("/social/notifications/read", {
    ids,
  });
  return res.data;
};

export const getUserPostsApi = async (
  userId: string,
  cursor?: string,
  limit: number = 20
) => {
  const params: any = { limit };
  if (cursor) params.cursor = cursor;
  const res = await api.get<FeedResponse>(
    `/social/users/${userId}/posts`,
    { params }
  );
  return res.data;
};

export const checkPostLikedApi = async (postId: string) => {
  const res = await api.get<{ liked: boolean; type?: ReactionType | null }>(
    `/social/posts/${postId}/liked`
  );
  return res.data;
};

export const reactToPostApi = async (postId: string, type: ReactionType) => {
  const res = await api.post<{ ok: boolean }>(`/social/posts/${postId}/reactions`, { type });
  return res.data;
};

export const removeReactionApi = async (postId: string) => {
  const res = await api.delete<{ ok: boolean }>(`/social/posts/${postId}/reactions`);
  return res.data;
};

export type SavedPost = Post & { savedAt?: string };

export type SavedPostsResponse = {
  items: SavedPost[];
  hasNext: boolean;
  nextCursor: string | null;
};

export const getSavedPostsApi = async (cursor?: string, limit: number = 10) => {
  const params: Record<string, any> = { limit };
  if (cursor) params.cursor = cursor;
  const res = await api.get<SavedPostsResponse>("/social/posts/saved", { params });
  return res.data;
};

export const savePostApi = async (postId: string) => {
  await api.post(`/social/posts/${postId}/save`);
};

export const unsavePostApi = async (postId: string) => {
  await api.delete(`/social/posts/${postId}/save`);
};

export const reportPostApi = async (
  postId: string,
  payload: { reason: string; details?: string }
) => {
  const res = await api.post<{ ok: boolean }>(`/social/posts/${postId}/report`, payload);
  return res.data;
};

// Call APIs
export type Call = {
  _id: string;
  conversationId: string;
  initiatorId: string;
  participants: string[];
  type: 'video' | 'audio';
  callType?: 'p2p' | 'sfu';
  status: 'initiated' | 'active' | 'ended';
  startedAt: string;
  endedAt?: string;
  duration?: number;
  metadata?: {
    roomId?: string;
    sdpOffer?: string;
    sdpAnswer?: string;
    livekitRoomName?: string;
  };
};

// Call API functions
export const initiateCall = async (conversationId: string, type: 'video' | 'audio', targetUserId?: string) => {
  const res = await api.post<{ success: boolean; call: { id: string; roomId: string; livekitRoomName?: string; callType?: 'p2p' | 'sfu'; status: string } }>('/calls/initiate', {
    conversationId,
    type,
    targetUserId,
  });
  console.log('[API] initiateCall response:', res.data);
  console.log('[API] Call ID from response:', res.data.call?.id);
  return res.data;
};

export const getLiveKitToken = async (callId: string) => {
  const res = await api.post<{ success: boolean; token: string; roomName: string; url: string }>(`/calls/${callId}/livekit-token`);
  return res.data;
};

export const getCall = async (callId: string) => {
  console.log('[API] getCall - Requesting callId:', callId);
  console.log('[API] getCall - Full URL:', `/calls/${callId}`);
  try {
    const res = await api.get<Call>(`/calls/${callId}`);
    console.log('[API] getCall - Success:', res.data);
    return res.data;
  } catch (error: any) {
    console.error('[API] getCall - Error:', error);
    console.error('[API] getCall - Error response:', error.response?.data);
    console.error('[API] getCall - Error status:', error.response?.status);
    throw error;
  }
};

export const endCall = async (callId: string) => {
  const res = await api.post<{ success: boolean; duration: number }>(`/calls/${callId}/end`);
  return res.data;
};

export const acceptCall = async (callId: string) => {
  const res = await api.post<{ success: boolean }>(`/calls/${callId}/accept`);
  return res.data;
};

export const rejectCall = async (callId: string) => {
  const res = await api.post<{ success: boolean }>(`/calls/${callId}/reject`);
  return res.data;
};

export const createMessageWithReply = async (conversationId: string, text: string, replyTo?: string) => {
  const res = await api.post<Message>(`/conversations/${conversationId}/messages`, { text, replyTo });
  return res.data;
};

