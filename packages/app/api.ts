import axios from 'axios';

// Use Vercel proxy for web to avoid CORS issues
// Direct backend URL has CORS restrictions on Vercel domain
const DIRECT_BACKEND_URL = 'https://backend36.dev';
const isWeb = typeof window !== 'undefined';
const isLocalhost = isWeb && window?.location?.hostname && /^(localhost|127\.|192\.168\.|10\.|172\.(1[6-9]|2\d|3[0-1]))$/.test(window.location.hostname);
// Force use proxy for LAN IPs to avoid CORS issues
const isLAN = isWeb && window?.location?.hostname && /^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[0-1]))$/.test(window.location.hostname);
// Check if using ngrok tunnel
const isNgrok = isWeb && window?.location?.hostname && window.location.hostname.includes('ngrok');
// Always use direct backend for development (proxy only works in production)
const isProduction = isWeb && window?.location?.hostname && !window.location.hostname.includes('localhost') && !window.location.hostname.match(/^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[0-1]))/) && !isNgrok && !window.location.hostname.includes('ngrok');
export const API_URL = isWeb ? (isProduction ? '/api' : DIRECT_BACKEND_URL) : DIRECT_BACKEND_URL;

// Debug logging
if (isWeb && window?.location?.hostname) {
	console.log('🌐 Web environment detected');
	console.log('🔍 window.location.hostname:', window.location.hostname);
	console.log('🔍 isLocalhost:', isLocalhost);
	console.log('🔍 isLAN:', isLAN);
	console.log('🔍 isNgrok:', isNgrok);
	console.log('🔍 isProduction:', isProduction);
	console.log('🔍 API_URL:', API_URL);
}

export const api = axios.create({
	baseURL: API_URL,
	withCredentials: true,
});

// Rehydrate auth header from localStorage on web reload
if (typeof window !== "undefined") {
	const token = window.localStorage.getItem("auth_token");
	if (token) {
		api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
	}
}

// Add request interceptor for debugging
api.interceptors.request.use(
	(config) => {
		// Ensure token is set from localStorage on each request
		if (typeof window !== "undefined") {
			const token = window.localStorage.getItem("auth_token");
			if (token && !config.headers.Authorization) {
				config.headers.Authorization = `Bearer ${token}`;
			}
		}
		const authHeader =
      typeof config.headers.Authorization === "string"
        ? config.headers.Authorization.substring(0, 30) + "..."
        : config.headers.Authorization
        ? String(config.headers.Authorization)
        : "none";

    console.log('🔍 API Request:', {
			method: config.method?.toUpperCase(),
			url: config.url,
			baseURL: config.baseURL,
			hasAuth: !!config.headers.Authorization,
			authHeader,
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
			statusText: response.statusText,
			data: response.data,
		});
		return response;
	},
	(error) => {
		console.error('❌ Response Error:', {
			status: error.response?.status,
			statusText: error.response?.statusText,
			data: error.response?.data,
			config: {
				method: error.config?.method?.toUpperCase(),
				url: error.config?.url,
				data: error.config?.data,
			}
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
	// New fields
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
	createdAt: string;
	updatedAt: string;
	__v?: number;
	// New fields
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

export const getMessages = async (conversationId: string) => {
	const res = await api.get<Message[]>(`/conversations/${conversationId}/messages`);
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

// Create a group conversation with multiple member IDs
export const createGroupConversation = async (memberIds: string[], title?: string) => {
  const unique = Array.from(new Set(memberIds.filter(Boolean)));
  const res = await api.post<Conversation>('/conversations', {
    members: unique,
    isGroup: true,
    title: title || `Group (${unique.length})`
  });
  return res.data;
};

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

export const initiateCall = async (
	conversationId: string,
	type: 'audio' | 'video',
	targetUserId?: string
) => {
	const payload: Record<string, any> = { conversationId, type };
	if (targetUserId) {
		payload.targetUserId = targetUserId;
	}
	const res = await api.post<InitiateCallResponse>('/calls/initiate', payload);
	return res.data;
};

export const getCall = async (callId: string) => {
	const res = await api.get<CallRecord>(`/calls/${callId}`);
	return res.data;
};

export const getLiveKitToken = async (callId: string) => {
	const res = await api.post<{ success: boolean; token: string; roomName: string; url: string }>(
		`/calls/${callId}/livekit-token`
	);
	return res.data;
};

export const endCall = async (callId: string) => {
	const res = await api.post<{ success: boolean; duration?: number }>(`/calls/${callId}/end`);
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
// ════════════════════════════════════════════════════════════
// UPLOAD IMAGE LOCAL - CLIENT-SERVER (HTTP POST over TCP)
// Multipart Form Data
// ════════════════════════════════════════════════════════════
// Upload image to local storage endpoint (updated to use correct endpoint)
export const uploadImageLocalOld = async (file: { uri: string; name: string; type: string }) => {
  const form = new FormData();
  if (typeof window !== 'undefined') {
    const blob = await fetch(file.uri).then((r) => r.blob());
    const webFile = new File([blob], file.name, { type: file.type });
    form.append('file', webFile);
  } else {
    // React Native
    // @ts-ignore RN FormData file
    form.append('file', { uri: file.uri, name: file.name, type: file.type });
  }
  const res = await api.post<{ url: string; name?: string; size?: number; mime?: string }>(`/files/image`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

// Upload to S3 if backend provides presigned handling (optional)
export const uploadImageS3 = async (file: { uri: string; name: string; type: string }) => {
  const form = new FormData();
  if (typeof window !== 'undefined') {
    const blob = await fetch(file.uri).then((r) => r.blob());
    const webFile = new File([blob], file.name, { type: file.type });
    form.append('file', webFile);
  } else {
    // React Native
    // @ts-ignore RN FormData file
    form.append('file', { uri: file.uri, name: file.name, type: file.type });
  }
  const res = await api.post<{ key: string; presignedUrl: string; name?: string; size?: number; mime?: string }>(`/files/s3`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

// Upload to local storage
export const uploadImageLocal = async (file: { uri: string; name: string; type: string }) => {
  const form = new FormData();
  if (typeof window !== 'undefined') {
    const blob = await fetch(file.uri).then((r) => r.blob());
    const webFile = new File([blob], file.name, { type: file.type });
    form.append('file', webFile);
  } else {
    // React Native
    // @ts-ignore RN FormData file
    form.append('file', { uri: file.uri, name: file.name, type: file.type });
  }
  const res = await api.post<{ url: string; name?: string; size?: number; mime?: string }>(`/uploads/image`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

// Upload media cho mạng xã hội (ảnh/video) - dùng chung với desktop
export const uploadMediaApi = async (file: File): Promise<PostMedia> => {
  const formData = new FormData();
  formData.append('file', file);

  const res = await api.post<{
    url: string;
    name: string;
    size: number;
    mime: string;
  }>('/uploads/s3/public', formData, {
    // Để browser tự set Content-Type + boundary
  });

  return {
    url: res.data.url,
    type: res.data.mime.startsWith('image/') ? 'image' : 'video',
  };
};

// Web helper: upload File object directly (chat attachments)
export const uploadChatFile = async (file: File) => {
  const form = new FormData();
  form.append('file', file);
  const res = await api.post<{ url: string; name?: string; size?: number; mime?: string }>(
    `/uploads/s3/public`,
    form,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    },
  );
  return res.data;
};

export const logout = async (token: string) => {
	const res = await api.post('/auth/logout', { token });
	return res.data;
};

// ════════════════════════════════════════════════════════════
// REGISTRATION & OTP AUTHENTICATION
// ════════════════════════════════════════════════════════════

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

// ════════════════════════════════════════════════════════════
// USER PROFILE MANAGEMENT
// ════════════════════════════════════════════════════════════

export type UpdateUsernameResponse = {
	user: { id: string; name: string; email: string; username: string };
	message: string;
};

export const updateUsername = async (username: string) => {
	const res = await api.patch<UpdateUsernameResponse>('/users/username', { username });
	return res.data;
};

export type UpdateAvatarResponse = {
	user: { id: string; name: string; email: string; username: string; avatar?: string };
	message: string;
};

export const updateUserAvatar = async (avatarUrl: string) => {
	const res = await api.patch<UpdateAvatarResponse>('/users/avatar', { avatar: avatarUrl });
	return res.data;
};

// Alternative avatar update endpoints to try
export const updateUserProfile = async (data: { avatar?: string; name?: string; username?: string }) => {
	const res = await api.patch<UpdateAvatarResponse>('/users/profile', data);
	return res.data;
};

export const updateUserInfo = async (avatarUrl: string) => {
	const res = await api.put<UpdateAvatarResponse>('/users/info', { avatar: avatarUrl });
	return res.data;
};

// Get current user ID – web version dùng localStorage
export const getCurrentUserId = async (): Promise<string | null> => {
	try {
		if (typeof window === 'undefined') return null;
		const userId = window.localStorage.getItem('user_id');
		return userId;
	} catch (error) {
		console.error('Error getting user ID from localStorage:', error);
		return null;
	}
};
// Bạn bè cho trang cá nhân / friends page
export const getFriends = async () => {
  const res = await api.get<{ friendIds: string[]; total: number }>("/social/friends");
  return res.data;
};

export const blockUserApi = async (userId: string) => {
  const res = await api.post<{ message: string; blocked: boolean }>(`/users/${userId}/block`);
  return res.data;
};

export const unblockUserApi = async (userId: string) => {
  const res = await api.delete<{ message: string; blocked: boolean }>(`/users/${userId}/block`);
  return res.data;
};

export const getBlockedUsersApi = async () => {
  const res = await api.get<{ blockedUsers: Array<{
    _id: string;
    name: string;
    avatar?: string;
    email?: string;
    username?: string;
    blockedAt: string;
  }> }>("/users/blocked");
  return res.data;
};

export const getBlockStatusApi = async (userId: string) => {
  const res = await api.get<{ isBlocked: boolean; hasBlockedYou: boolean }>(`/users/${userId}/block-status`);
  return res.data;
};

export const unfriendUserApi = async (userId: string) => {
  const res = await api.delete<{ message: string }>(`/social/friends/${userId}`);
  return res.data;
};

// Photos from posts (author or tagged)
export const getUserPhotosApi = async (
  userId: string,
  type: "authored" | "tagged" = "authored"
) => {
  try {
    const res = await api.get<{ items: Array<{ postId: string; media: any[]; createdAt: string }> }>(
      `/social/users/${userId}/photos`,
      { params: { type } }
    );
    return res.data;
  } catch (error: any) {
    // Nếu backend chưa có route /photos (404), trả về rỗng để frontend fallback sang posts
    if (error?.response?.status === 404) {
      return { items: [] };
    }
    throw error;
  }
};

export const updateProfileApi = async (payload: {
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
}) => {
  const res = await api.patch(`/users/me/profile`, payload);
  return res.data;
};

// Feed bài viết của 1 user (trang profile)
export const getUserPostsApi = async (
  userId: string,
  cursor?: string,
  limit: number = 20
) => {
  const params: any = { limit };
  if (cursor) params.cursor = cursor;

  const res = await api.get<FeedResponse>(`/social/users/${userId}/posts`, { params });
  return res.data;
};
// Analytics (cho useAnalytics)
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
    await api.post("/analytics/track", { eventType, metadata, sessionId });
  } catch (error) {
    console.error("[Analytics] Failed to track event:", error);
  }
};

// Update avatar with user ID
export const updateUserAvatarWithId = async (userId: string, avatarUrl: string) => {
	const res = await api.patch<UpdateAvatarResponse>(`/users/${userId}/avatar`, { avatar: avatarUrl });
	return res.data;
};

// Update profile with user ID
export const updateUserProfileWithId = async (userId: string, data: { avatar?: string; name?: string; username?: string }) => {
	const res = await api.patch<UpdateAvatarResponse>(`/users/${userId}/profile`, data);
	return res.data;
};

// Change Password
export type ChangePasswordResponse = {
	message: string;
};

export const changePassword = async (currentPassword: string, newPassword: string) => {
	const res = await api.post<ChangePasswordResponse>('/auth/change-password', {
		currentPassword,
		newPassword,
	});
	return res.data;
};

// Update current user profile (the correct way according to backend docs)
export const updateCurrentUserProfile = async (data: { avatar?: string; name?: string; username?: string }) => {
	console.log('🔍 updateCurrentUserProfile - request data:', data);
	console.log('🔍 updateCurrentUserProfile - method: PATCH');
	console.log('🔍 updateCurrentUserProfile - auth header:', api.defaults.headers.common['Authorization']);
	
	const res = await api.patch<UpdateAvatarResponse>('/users/me', data);
	return res.data;
};

// Get current user profile
export const getCurrentUserProfile = async () => {
	const res = await api.get<UpdateAvatarResponse>('/users/me');
	return res.data;
};

// Cách 1: Upload avatar trực tiếp (đơn giản nhất)
export const uploadAvatarDirect = async (file: { uri: string; name: string; type: string }) => {
	const form = new FormData();
	if (typeof window !== 'undefined') {
		const blob = await fetch(file.uri).then((r) => r.blob());
		const webFile = new File([blob], file.name, { type: file.type });
		form.append('avatar', webFile);
	} else {
		// React Native
		// @ts-ignore RN FormData file
		form.append('avatar', { uri: file.uri, name: file.name, type: file.type });
	}
	
	console.log('🔍 uploadAvatarDirect - sending file:', file.name);
	console.log('🔍 uploadAvatarDirect - auth header:', api.defaults.headers.common['Authorization']);
	
	const res = await api.post<UpdateAvatarResponse>('/users/avatar', form, {
		headers: { 'Content-Type': 'multipart/form-data' },
	});
	return res.data;
};

// ===== User helpers used by chat side panel =====
export type UserProfile = {
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

export const getUsersByIds = async (userIds: string[]) => {
	const res = await api.post<{ users: UserProfile[] }>(`/users/by-ids`, { userIds });
	return res.data;
};

// Tìm kiếm users
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

export const searchUsers = async (query: string, page: number = 1, limit: number = 20) => {
  console.log('🔍 searchUsers called with:', { query, page, limit });
  console.log('🔍 API base URL:', api.defaults.baseURL);
  console.log('🔍 Auth header:', api.defaults.headers.common['Authorization']);
  
  const res = await api.get<SearchUsersResponse>('/users/search', {
    params: { q: query, page, limit }
  });
  
  console.log('🔍 searchUsers response:', res.data);
  return res.data;
};

// Tạo conversation với user
export const createConversationWithUser = async (userId: string) => {
  const res = await api.post<Conversation>('/conversations', {
    members: [userId]
  });
  return res.data;
};

// Lấy thông tin người đối diện trong cuộc trò chuyện
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

// Message Actions API
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

// Revoke message for everyone
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

// Group Management API
export const addMembers = async (conversationId: string, userIds: string[]) => {
  const res = await api.post<Conversation>(`/conversations/${conversationId}/members`, { userIds });
  return res.data;
};

export const removeMember = async (conversationId: string, userId: string) => {
  const res = await api.delete<Conversation>(`/conversations/${conversationId}/members/${userId}`);
  return res.data;
};

export const updateGroupInfo = async (conversationId: string, data: { title?: string; avatar?: string }) => {
  const res = await api.patch<Conversation>(`/conversations/${conversationId}`, data);
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

export const makeAdmin = async (conversationId: string, userId: string) => {
  const res = await api.post<Conversation>(`/conversations/${conversationId}/admins/${userId}`);
  return res.data;
};

export const removeAdmin = async (conversationId: string, userId: string) => {
  const res = await api.delete<Conversation>(`/conversations/${conversationId}/admins/${userId}`);
  return res.data;
};

// Backwards-compatible aliases for desktop code
export const addGroupMembers = addMembers;
export const removeGroupMember = removeMember;
export const makeGroupAdmin = makeAdmin;
export const removeGroupAdmin = removeAdmin;

export const leaveGroup = async (conversationId: string) => {
  const res = await api.post<{ success: boolean; message: string }>(`/conversations/${conversationId}/leave`);
  return res.data;
};

export const getUnreadCount = async (conversationId: string) => {
  const res = await api.get<{ unreadCount: number }>(`/conversations/${conversationId}/unread`);
  return res.data;
};

// Online Status API
export const updateOnlineStatus = async (status: "online" | "offline" | "away") => {
  const res = await api.patch<{ user: any; status: string; lastSeen?: Date }>(`/users/me/status`, { status });
  return res.data;
};

export const getOnlineUsers = async (userIds: string[]) => {
  const res = await api.post<{ statusMap: { [userId: string]: { onlineStatus: string; lastSeen?: Date } } }>(`/users/online-status`, { userIds });
  return res.data;
};

// Update createMessage to support replyTo
export const createMessageWithReply = async (conversationId: string, text: string, replyTo?: string) => {
  const res = await api.post<Message>(`/conversations/${conversationId}/messages`, { text, replyTo });
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
  user: UserProfile & { name: string };
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

export const getFeed = async (cursor?: string) => {
  const params: any = {};
  if (cursor) params.cursor = cursor;
  const res = await api.get<FeedResponse>("/social/posts/feed", { params });
  return res.data;
};

export const createPostApi = async (payload: {
  content: string;
  media?: PostMedia[];
  visibility?: "PUBLIC" | "FRIENDS" | "ONLY_ME";
  taggedUsers?: string[];
}) => {
  const res = await api.post<Post>("/social/posts", payload);
  return res.data;
};

export const createCommentApi = async (postId: string, payload: { content: string; parentId?: string }) => {
  const res = await api.post<Comment>(`/social/posts/${postId}/comments`, payload);
  return res.data;
};

export const getPostComments = async (postId: string, cursor?: string) => {
  const params: any = {};
  if (cursor) params.cursor = cursor;
  const res = await api.get<CommentsResponse>(`/social/posts/${postId}/comments`, { params });
  return res.data;
};

export const getPostsByHashtagApi = async (tag: string, cursor?: string) => {
  const params: any = {};
  if (cursor) params.cursor = cursor;
  const res = await api.get<FeedResponse>(`/social/hashtags/${encodeURIComponent(tag)}/posts`, { params });
  return res.data;
};

export const sharePostApi = async (postId: string, payload: { content?: string; visibility?: "PUBLIC" | "FRIENDS" | "ONLY_ME" }) => {
  const res = await api.post<Post>(`/social/posts/${postId}/share`, payload);
  return res.data;
};

export const createStoryApi = async (payload: {
  media: StoryMedia[];
  caption?: string;
  visibility?: "FRIENDS" | "PUBLIC";
}) => {
  const res = await api.post("/social/stories", payload);
  return res.data;
};

export const getStoriesApi = async () => {
  const res = await api.get<StoryResponse>("/social/stories");
  return res.data;
};

export const markStoryViewedApi = async (storyId: string) => {
  const res = await api.post<{ ok: boolean }>(`/social/stories/${storyId}/view`, {});
  return res.data;
};

export const deleteStoryApi = async (storyId: string) => {
  const res = await api.delete<{ ok: boolean }>(`/social/stories/${storyId}`);
  return res.data;
};

export const savePostApi = async (postId: string) => {
  const res = await api.post<{ ok: boolean }>(`/social/posts/${postId}/save`, {});
  return res.data;
};

export const unsavePostApi = async (postId: string) => {
  const res = await api.delete<{ ok: boolean }>(`/social/posts/${postId}/save`);
  return res.data;
};

export const getSavedPostsApi = async (cursor?: string) => {
  const params: any = {};
  if (cursor) params.cursor = cursor;
  const res = await api.get<{ items: SavedPost[]; nextCursor?: string | null; hasNext: boolean }>(
    "/social/posts/saved",
    { params }
  );
  return res.data;
};

export const reportPostApi = async (postId: string, payload: { reason: string; details?: string }) => {
  const res = await api.post<{ ok: boolean }>(`/social/posts/${postId}/report`, payload);
  return res.data;
};

export const getFriendSuggestionsApi = async (limit = 6) => {
  const res = await api.get<{ suggestions: FriendSuggestion[] }>("/social/friends/suggestions", {
    params: { limit },
  });
  return res.data;
};

export const sendFriendRequestApi = async (targetUserId: string) => {
  const res = await api.post("/social/friends/requests", { targetUserId });
  return res.data;
};

export const getNotificationsApi = async (cursor?: string, limit: number = 20) => {
  const params: any = { limit };
  if (cursor) params.cursor = cursor;
  const res = await api.get<NotificationsResponse>("/social/notifications", { params });
  return res.data;
};

export const markNotificationsReadApi = async (ids: string[]) => {
  const res = await api.post<{ ok: boolean }>("/social/notifications/read", { ids });
  return res.data;
};

export const getUserById = async (userId: string) => {
  const res = await api.get<UserProfile>(`/users/${userId}`);
  return res.data;
};

export const searchSocialApi = async (
  queryOrParams: string | { q: string; type?: "all" | "users" | "posts" }
) => {
  const params =
    typeof queryOrParams === "string"
      ? { q: queryOrParams }
      : { q: queryOrParams.q, type: queryOrParams.type };
  const res = await api.get<SearchResponse>("/social/search", { params });
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

// Story Music Types
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

// Story Reactions & Replies
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

// Music Search
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
