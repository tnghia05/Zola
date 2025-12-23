import axios from 'axios';

// ============================================
// CRITICAL: API URL CONFIGURATION
// ============================================
const DIRECT_BACKEND_URL = 'https://backend36.dev';

// IMMEDIATE Electron detection - runs FIRST before anything else
const _isElectron = (() => {
	if (typeof window === 'undefined') return false;
	// Check for electronAPI first (most reliable)
	if ((window as any).electronAPI) return true;
	// Check process.type (Electron-specific)
	if ((window as any).process?.type === 'renderer') return true;
	const p = window.location?.protocol || '';
	const h = window.location?.hostname || '';
	const ua = (window.navigator?.userAgent || '').toLowerCase();
	// Electron uses app:// or file:// protocol, or hostname is 'renderer'
	return p === 'app:' || p === 'file:' || h === 'renderer' || ua.includes('electron');
})();

// FOR ELECTRON: ALWAYS use direct backend - NO PROXY
// Only use /api proxy for production Vercel web (https:// with real hostname)
const _isVercelProd = typeof window !== 'undefined' && 
	!_isElectron &&
	window.location?.protocol === 'https:' &&
	window.location?.hostname &&
	!window.location.hostname.includes('localhost') &&
	!/^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[0-1]))/.test(window.location.hostname);

export const API_URL = _isVercelProd ? '/api' : DIRECT_BACKEND_URL;

// Log configuration
if (typeof window !== 'undefined') {
	console.log('📡 [API] Config:', { 
		protocol: window.location?.protocol,
		hostname: window.location?.hostname,
		isElectron: _isElectron, 
		isVercelProd: _isVercelProd,
		API_URL 
	});
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

// Runtime Electron detection function (called at request time, not module load time)
function isRunningInElectron(): boolean {
	if (typeof window === 'undefined') return false;
	try {
		// Check multiple indicators at runtime
		const ua = window.navigator?.userAgent || '';
		const protocol = window.location?.protocol || '';
		return (
			ua.toLowerCase().includes('electron') ||
			protocol === 'app:' ||
			protocol === 'file:' ||
			!!(window as any).electronAPI ||
			!!(window as any).process?.type
		);
	} catch {
		return false;
	}
}

// Add request interceptor for debugging
api.interceptors.request.use(
	(config) => {
		// CRITICAL: Override baseURL at runtime for Electron apps
		// This ensures the correct URL is used even if module was bundled with wrong value
		if (typeof window !== "undefined") {
			const inElectron = isRunningInElectron();
			if (inElectron && (config.baseURL === '/api' || !config.baseURL?.startsWith('http'))) {
				console.log('🔄 [Electron] Overriding baseURL from', config.baseURL, 'to', DIRECT_BACKEND_URL);
				config.baseURL = DIRECT_BACKEND_URL;
			}
			
			// Ensure token is set from localStorage on each request
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

export const getActiveCallForConversation = async (conversationId: string) => {
	const res = await api.get<ActiveCallResponse>(`/calls/conversation/${conversationId}/active`);
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

// Single post detail
export const getPostByIdApi = async (postId: string) => {
  const res = await api.get<Post>(`/social/posts/${postId}`);
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

export const respondFriendRequestApi = async (friendshipId: string, action: "accept" | "decline") => {
  const res = await api.post(`/social/friends/${friendshipId}/respond`, { action });
  return res.data;
};

export const getPendingFriendRequestsApi = async () => {
  const res = await api.get<{ received: any[]; sent: any[] }>("/social/friends/requests/pending");
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

// Reel Types
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

// Reel APIs
export const createReelApi = async (payload: {
  videoUrl: string;
  thumbnailUrl?: string;
  caption?: string;
  duration?: number;
  visibility?: "PUBLIC" | "FRIENDS" | "ONLY_ME";
  taggedUsers?: string[];
}) => {
  const res = await api.post<Reel>("/reels", payload);
  return res.data;
};

export const getReelsFeedApi = async (cursor?: string, limit: number = 10) => {
  const params: any = { limit };
  if (cursor) params.cursor = cursor;
  const res = await api.get<ReelsFeedResponse>("/reels", { params });
  return res.data;
};

export const getReelByIdApi = async (reelId: string) => {
  const res = await api.get<Reel>(`/reels/${reelId}`);
  return res.data;
};

export const getUserReelsApi = async (userId: string, cursor?: string, limit: number = 20) => {
  const params: any = { limit };
  if (cursor) params.cursor = cursor;
  const res = await api.get<ReelsFeedResponse>(`/reels/users/${userId}`, { params });
  return res.data;
};

export const likeReelApi = async (reelId: string, type: ReactionType = "LIKE") => {
  const res = await api.post<{ message: string; liked: boolean; type: ReactionType }>(
    `/reels/${reelId}/like`,
    { type }
  );
  return res.data;
};

export const unlikeReelApi = async (reelId: string) => {
  const res = await api.delete<{ message: string; liked: boolean }>(`/reels/${reelId}/like`);
  return res.data;
};

export const checkReelLikedApi = async (reelId: string) => {
  const res = await api.get<{ liked: boolean; type?: ReactionType | null }>(
    `/reels/${reelId}/liked`
  );
  return res.data;
};

export const deleteReelApi = async (reelId: string) => {
  const res = await api.delete<{ message: string }>(`/reels/${reelId}`);
  return res.data;
};

export const syncReelsFromPostsApi = async () => {
  const res = await api.post<{ message: string; createdCount: number; totalPostsWithVideo: number }>(
    "/reels/sync"
  );
  return res.data;
};

// ==========================================
// ADMIN APIs
// ==========================================

// Users Management
export const getAdminUsersApi = async (params?: {
  page?: number;
  limit?: number;
  role?: string;
  status?: string;
  search?: string;
  verified?: string;
}) => {
  const res = await api.get<{
    items: UserProfile[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>("/admin/users", { params });
  return res.data;
};

export const getAdminUserStatsApi = async () => {
  const res = await api.get<{
    totalUsers: number;
    activeUsers: number;
    bannedUsers: number;
    verifiedUsers: number;
    newUsersToday: number;
    newUsersThisWeek: number;
  }>("/admin/users/stats");
  return res.data;
};

export const getAdminUserDetailsApi = async (userId: string) => {
  const res = await api.get<UserProfile & { stats: { postsCount: number; commentsCount: number; friendsCount: number; reportsCount: number } }>(
    `/admin/users/${userId}`
  );
  return res.data;
};

export const banUserApi = async (userId: string, reason?: string) => {
  const res = await api.patch<{ message: string; user: UserProfile }>(`/admin/users/${userId}/ban`, { reason });
  return res.data;
};

export const unbanUserApi = async (userId: string) => {
  const res = await api.patch<{ message: string; user: UserProfile }>(`/admin/users/${userId}/unban`);
  return res.data;
};

export const updateUserRoleApi = async (userId: string, role: "user" | "admin" | "manager") => {
  const res = await api.patch<{ message: string; user: UserProfile }>(`/admin/users/${userId}/role`, { role });
  return res.data;
};

export const verifyUserApi = async (userId: string) => {
  const res = await api.patch<{ message: string; user: UserProfile }>(`/admin/users/${userId}/verify`);
  return res.data;
};

export const unverifyUserApi = async (userId: string) => {
  const res = await api.patch<{ message: string; user: UserProfile }>(`/admin/users/${userId}/unverify`);
  return res.data;
};

// Posts Management
export const getAdminPostsApi = async (params?: {
  page?: number;
  limit?: number;
  status?: string;
  authorId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}) => {
  const res = await api.get<{
    items: Post[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>("/admin/posts", { params });
  return res.data;
};

export const getAdminPostStatsApi = async () => {
  const res = await api.get<{
    totalPosts: number;
    activePosts: number;
    deletedPosts: number;
    postsToday: number;
    postsThisWeek: number;
  }>("/admin/posts/stats");
  return res.data;
};

export const deletePostApi = async (postId: string) => {
  const res = await api.delete<{ message: string }>(`/admin/posts/${postId}`);
  return res.data;
};

export const hidePostApi = async (postId: string) => {
  const res = await api.patch<{ message: string; post: Post }>(`/admin/posts/${postId}/hide`);
  return res.data;
};

export const restorePostApi = async (postId: string) => {
  const res = await api.patch<{ message: string; post: Post }>(`/admin/posts/${postId}/restore`);
  return res.data;
};

// Reports Management
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

export const getAdminReportsApi = async (params?: {
  page?: number;
  limit?: number;
  status?: string;
}) => {
  const res = await api.get<{
    items: PostReport[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>("/admin/reports", { params });
  return res.data;
};

export const getAdminReportDetailsApi = async (reportId: string) => {
  const res = await api.get<PostReport>(`/admin/reports/${reportId}`);
  return res.data;
};

export const handleReportApi = async (reportId: string, action: "resolve" | "dismiss", notes?: string) => {
  const res = await api.patch<{ message: string; report: PostReport }>(
    `/admin/reports/${reportId}/handle`,
    { action, notes }
  );
  return res.data;
};

export const bulkHandleReportsApi = async (reportIds: string[], action: "resolve" | "dismiss") => {
  const res = await api.post<{ message: string; modifiedCount: number }>("/admin/reports/bulk-handle", {
    reportIds,
    action,
  });
  return res.data;
};

// Analytics
export const getAdminDashboardStatsApi = async () => {
  const res = await api.get<{
    users: { total: number; active: number };
    posts: { total: number; active: number };
    reports: { total: number; pending: number };
    engagement: { postsCreated: number; reactionsGiven: number; commentsCreated: number };
  }>("/admin/dashboard/stats");
  return res.data;
};

export const getAdminAnalyticsChartApi = async (timeRange?: string, metric?: string) => {
  const res = await api.get<{ data: Array<{ _id: string; count: number }> }>("/admin/analytics/chart", {
    params: { timeRange, metric },
  });
  return res.data;
};

export const getUserActivityStatsApi = async (userId: string, timeRange?: string) => {
  const res = await api.get<{ posts: number; comments: number; reactions: number }>(
    `/admin/analytics/users/${userId}`,
    { params: { timeRange } }
  );
  return res.data;
};

export const getContentStatsApi = async (timeRange?: string) => {
  const res = await api.get<{ posts: number; reels: number; stories: number }>("/admin/analytics/content", {
    params: { timeRange },
  });
  return res.data;
};

// Content Moderation
export const moderatePostApi = async (postId: string, action: "approve" | "reject" | "warn") => {
  const res = await api.patch<{ message: string }>(`/admin/moderation/posts/${postId}`, { action });
  return res.data;
};

export const bulkModeratePostsApi = async (postIds: string[], action: "approve" | "reject" | "restore") => {
  const res = await api.post<{ message: string }>("/admin/moderation/posts/bulk", { postIds, action });
  return res.data;
};

export const getModerationQueueApi = async () => {
  const res = await api.get<{ items: Post[]; total: number }>("/admin/moderation/queue");
  return res.data;
};

// Settings
export interface SystemSettings {
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  maxPostLength: number;
  maxMediaPerPost: number;
  allowedMediaTypes: string[];
}

export const getSystemSettingsApi = async () => {
  const res = await api.get<SystemSettings>("/admin/settings");
  return res.data;
};

export const updateSystemSettingsApi = async (settings: Partial<SystemSettings>) => {
  const res = await api.patch<{ message: string; settings: SystemSettings }>("/admin/settings", settings);
  return res.data;
};

export const getSystemLogsApi = async (params?: { page?: number; limit?: number }) => {
  const res = await api.get<{ items: any[]; page: number; limit: number }>("/admin/logs", { params });
  return res.data;
};
