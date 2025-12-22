import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
// Add request interceptor for debugging
api.interceptors.request.use((config) => {
    console.log('🔍 API Request:', {
        method: config.method?.toUpperCase(),
        url: config.url,
        baseURL: config.baseURL,
        headers: config.headers,
        data: config.data,
    });
    return config;
}, (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
});
// Add response interceptor for debugging
api.interceptors.response.use((response) => {
    console.log('✅ API Response:', {
        status: response.status,
        statusText: response.statusText,
        data: response.data,
    });
    return response;
}, (error) => {
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
});
export const setAuthToken = (token) => {
    if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    else {
        delete api.defaults.headers.common['Authorization'];
    }
};
export const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    return res.data;
};
export const getConversations = async () => {
    const res = await api.get('/conversations');
    return res.data;
};
export const getMessages = async (conversationId) => {
    const res = await api.get(`/conversations/${conversationId}/messages`);
    return res.data;
};
export const createMessage = async (conversationId, text) => {
    const res = await api.post(`/conversations/${conversationId}/messages`, { text });
    return res.data;
};
export const createMessageWithPayload = async (conversationId, payload) => {
    const res = await api.post(`/conversations/${conversationId}/messages`, payload);
    return res.data;
};
export const createConversation = async (userId, title) => {
    const res = await api.post('/conversations', {
        members: [userId],
        title: title || `Chat with ${userId}`
    });
    return res.data;
};
// Create a group conversation with multiple member IDs
export const createGroupConversation = async (memberIds, title) => {
    const unique = Array.from(new Set(memberIds.filter(Boolean)));
    const res = await api.post('/conversations', {
        members: unique,
        isGroup: true,
        title: title || `Group (${unique.length})`
    });
    return res.data;
};
export const initiateCall = async (conversationId, type, targetUserId) => {
    const payload = { conversationId, type };
    if (targetUserId) {
        payload.targetUserId = targetUserId;
    }
    const res = await api.post('/calls/initiate', payload);
    return res.data;
};
export const getCall = async (callId) => {
    const res = await api.get(`/calls/${callId}`);
    return res.data;
};
export const getActiveCallForConversation = async (conversationId) => {
    const res = await api.get(`/calls/conversation/${conversationId}/active`);
    return res.data;
};
export const getLiveKitToken = async (callId) => {
    const res = await api.post(`/calls/${callId}/livekit-token`);
    return res.data;
};
export const endCall = async (callId) => {
    const res = await api.post(`/calls/${callId}/end`);
    return res.data;
};
// ════════════════════════════════════════════════════════════
// UPLOAD IMAGE LOCAL - CLIENT-SERVER (HTTP POST over TCP)
// Multipart Form Data
// ════════════════════════════════════════════════════════════
// Upload image to local storage endpoint (updated to use correct endpoint)
export const uploadImageLocalOld = async (file) => {
    const form = new FormData();
    if (typeof window !== 'undefined') {
        const blob = await fetch(file.uri).then((r) => r.blob());
        const webFile = new File([blob], file.name, { type: file.type });
        form.append('file', webFile);
    }
    else {
        // React Native
        // @ts-ignore RN FormData file
        form.append('file', { uri: file.uri, name: file.name, type: file.type });
    }
    const res = await api.post(`/files/image`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
};
// Upload to S3 if backend provides presigned handling (optional)
export const uploadImageS3 = async (file) => {
    const form = new FormData();
    if (typeof window !== 'undefined') {
        const blob = await fetch(file.uri).then((r) => r.blob());
        const webFile = new File([blob], file.name, { type: file.type });
        form.append('file', webFile);
    }
    else {
        // React Native
        // @ts-ignore RN FormData file
        form.append('file', { uri: file.uri, name: file.name, type: file.type });
    }
    const res = await api.post(`/files/s3`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
};
// Upload to local storage
export const uploadImageLocal = async (file) => {
    const form = new FormData();
    if (typeof window !== 'undefined') {
        const blob = await fetch(file.uri).then((r) => r.blob());
        const webFile = new File([blob], file.name, { type: file.type });
        form.append('file', webFile);
    }
    else {
        // React Native
        // @ts-ignore RN FormData file
        form.append('file', { uri: file.uri, name: file.name, type: file.type });
    }
    const res = await api.post(`/uploads/image`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
};
export const logout = async (token) => {
    const res = await api.post('/auth/logout', { token });
    return res.data;
};
export const register = async (email, password, name) => {
    const res = await api.post('/auth/register', { email, password, name });
    return res.data;
};
export const sendOTP = async (email) => {
    const res = await api.post('/auth/send-otp', { email });
    return res.data;
};
export const verifyOTP = async (email, otp) => {
    const res = await api.post('/auth/verify-otp', { email, otp });
    return res.data;
};
export const resendOTP = async (email) => {
    const res = await api.post('/auth/resend-otp', { email });
    return res.data;
};
export const sendVerificationOTP = async (email) => {
    const res = await api.post('/auth/send-verification-otp', { email });
    return res.data;
};
export const updateUsername = async (username) => {
    const res = await api.patch('/users/username', { username });
    return res.data;
};
export const updateUserAvatar = async (avatarUrl) => {
    const res = await api.patch('/users/avatar', { avatar: avatarUrl });
    return res.data;
};
// Alternative avatar update endpoints to try
export const updateUserProfile = async (data) => {
    const res = await api.patch('/users/profile', data);
    return res.data;
};
export const updateUserInfo = async (avatarUrl) => {
    const res = await api.put('/users/info', { avatar: avatarUrl });
    return res.data;
};
// Get current user ID from AsyncStorage
export const getCurrentUserId = async () => {
    try {
        const userId = await AsyncStorage.getItem('user_id');
        return userId;
    }
    catch (error) {
        console.error('Error getting user ID:', error);
        return null;
    }
};
// Update avatar with user ID
export const updateUserAvatarWithId = async (userId, avatarUrl) => {
    const res = await api.patch(`/users/${userId}/avatar`, { avatar: avatarUrl });
    return res.data;
};
// Update profile with user ID
export const updateUserProfileWithId = async (userId, data) => {
    const res = await api.patch(`/users/${userId}/profile`, data);
    return res.data;
};
// Update current user profile (the correct way according to backend docs)
export const updateCurrentUserProfile = async (data) => {
    console.log('🔍 updateCurrentUserProfile - request data:', data);
    console.log('🔍 updateCurrentUserProfile - method: PATCH');
    console.log('🔍 updateCurrentUserProfile - auth header:', api.defaults.headers.common['Authorization']);
    const res = await api.patch('/users/me', data);
    return res.data;
};
// Get current user profile
export const getCurrentUserProfile = async () => {
    const res = await api.get('/users/me');
    return res.data;
};
// Cách 1: Upload avatar trực tiếp (đơn giản nhất)
export const uploadAvatarDirect = async (file) => {
    const form = new FormData();
    if (typeof window !== 'undefined') {
        const blob = await fetch(file.uri).then((r) => r.blob());
        const webFile = new File([blob], file.name, { type: file.type });
        form.append('avatar', webFile);
    }
    else {
        // React Native
        // @ts-ignore RN FormData file
        form.append('avatar', { uri: file.uri, name: file.name, type: file.type });
    }
    console.log('🔍 uploadAvatarDirect - sending file:', file.name);
    console.log('🔍 uploadAvatarDirect - auth header:', api.defaults.headers.common['Authorization']);
    const res = await api.post('/users/avatar', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
};
export const searchUsers = async (query, page = 1, limit = 20) => {
    console.log('🔍 searchUsers called with:', { query, page, limit });
    console.log('🔍 API base URL:', api.defaults.baseURL);
    console.log('🔍 Auth header:', api.defaults.headers.common['Authorization']);
    const res = await api.get('/users/search', {
        params: { q: query, page, limit }
    });
    console.log('🔍 searchUsers response:', res.data);
    return res.data;
};
// Tạo conversation với user
export const createConversationWithUser = async (userId) => {
    const res = await api.post('/conversations', {
        members: [userId]
    });
    return res.data;
};
export const getOpponentInfo = async (conversationId) => {
    const res = await api.get(`/conversations/${conversationId}/opponent`);
    return res.data;
};
// Message Actions API
export const editMessage = async (messageId, text) => {
    const res = await api.patch(`/conversations/messages/${messageId}`, { text });
    return res.data;
};
export const deleteMessage = async (messageId) => {
    const res = await api.delete(`/conversations/messages/${messageId}`);
    return res.data;
};
export const addReaction = async (messageId, emoji) => {
    const res = await api.post(`/conversations/messages/${messageId}/reactions`, { emoji });
    return res.data;
};
export const removeReaction = async (messageId, emoji) => {
    const res = await api.delete(`/conversations/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`);
    return res.data;
};
export const pinMessage = async (messageId) => {
    const res = await api.post(`/conversations/messages/${messageId}/pin`);
    return res.data;
};
export const unpinMessage = async (messageId) => {
    const res = await api.delete(`/conversations/messages/${messageId}/pin`);
    return res.data;
};
export const starMessage = async (messageId) => {
    const res = await api.post(`/conversations/messages/${messageId}/star`);
    return res.data;
};
// Revoke message for everyone
export const revokeMessage = async (messageId) => {
    const res = await api.patch(`/conversations/messages/${messageId}/revoke`, {});
    return res.data;
};
export const searchMessages = async (query, conversationId) => {
    const params = { query };
    if (conversationId) {
        params.conversationId = conversationId;
    }
    const res = await api.get(`/conversations/messages/search`, { params });
    return res.data;
};
export const markAsRead = async (conversationId, messageId) => {
    const res = await api.post(`/conversations/${conversationId}/read`, { messageId });
    return res.data;
};
// Group Management API
export const addMembers = async (conversationId, userIds) => {
    const res = await api.post(`/conversations/${conversationId}/members`, { userIds });
    return res.data;
};
export const removeMember = async (conversationId, userId) => {
    const res = await api.delete(`/conversations/${conversationId}/members/${userId}`);
    return res.data;
};
export const updateGroupInfo = async (conversationId, data) => {
    const res = await api.patch(`/conversations/${conversationId}`, data);
    return res.data;
};
export const createInviteLink = async (conversationId) => {
    const res = await api.post(`/conversations/${conversationId}/invite`);
    return res.data;
};
export const joinConversationByInvite = async (inviteCode) => {
    const res = await api.post(`/conversations/join/invite`, { inviteCode });
    return res.data;
};
export const makeAdmin = async (conversationId, userId) => {
    const res = await api.post(`/conversations/${conversationId}/admins/${userId}`);
    return res.data;
};
export const removeAdmin = async (conversationId, userId) => {
    const res = await api.delete(`/conversations/${conversationId}/admins/${userId}`);
    return res.data;
};
export const leaveGroup = async (conversationId) => {
    const res = await api.post(`/conversations/${conversationId}/leave`);
    return res.data;
};
export const getUnreadCount = async (conversationId) => {
    const res = await api.get(`/conversations/${conversationId}/unread`);
    return res.data;
};
// Online Status API
export const updateOnlineStatus = async (status) => {
    const res = await api.patch(`/users/me/status`, { status });
    return res.data;
};
export const getOnlineUsers = async (userIds) => {
    const res = await api.post(`/users/online-status`, { userIds });
    return res.data;
};
// Update createMessage to support replyTo
export const createMessageWithReply = async (conversationId, text, replyTo) => {
    const res = await api.post(`/conversations/${conversationId}/messages`, { text, replyTo });
    return res.data;
};
