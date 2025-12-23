import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Use Vercel proxy for web to avoid CORS issues
// Direct backend URL has CORS restrictions on Vercel domain
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

const isWeb = typeof window !== 'undefined';
const isLocalhost = isWeb && window?.location?.hostname && /^(localhost|127\.|192\.168\.|10\.|172\.(1[6-9]|2\d|3[0-1]))$/.test(window.location.hostname);
// Force use proxy for LAN IPs to avoid CORS issues
const isLAN = isWeb && window?.location?.hostname && /^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[0-1]))$/.test(window.location.hostname);
// Check if using ngrok tunnel
const isNgrok = isWeb && window?.location?.hostname && window.location.hostname.includes('ngrok');
// FOR ELECTRON: ALWAYS use direct backend - NO PROXY
// Only use /api proxy for production Vercel web (https:// with real hostname)
const isProduction = isWeb && !_isElectron && window?.location?.hostname && !window.location.hostname.includes('localhost') && !window.location.hostname.match(/^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[0-1]))/) && !isNgrok && !window.location.hostname.includes('ngrok') && window.location?.protocol === 'https:';
export const API_URL = _isElectron ? DIRECT_BACKEND_URL : (isWeb ? (isProduction ? '/api' : DIRECT_BACKEND_URL) : DIRECT_BACKEND_URL);

// Debug logging
if (isWeb && window?.location?.hostname) {
	console.log('🌐 Web environment detected');
	console.log('🔍 window.location.hostname:', window.location.hostname);
	console.log('🔍 isElectron:', _isElectron);
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

// Add request interceptor for debugging
api.interceptors.request.use(
	(config) => {
		console.log('🔍 API Request:', {
			method: config.method?.toUpperCase(),
			url: config.url,
			baseURL: config.baseURL,
			headers: config.headers,
			data: config.data,
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

// Get current user ID from AsyncStorage
export const getCurrentUserId = async (): Promise<string | null> => {
	try {
		const userId = await AsyncStorage.getItem('user_id');
		return userId;
	} catch (error) {
		console.error('Error getting user ID:', error);
		return null;
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


