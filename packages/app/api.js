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
api.interceptors.request.use((config) => {
    // Ensure token is set from localStorage on each request
    if (typeof window !== "undefined") {
        const token = window.localStorage.getItem("auth_token");
        if (token && !config.headers.Authorization) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    const authHeader = typeof config.headers.Authorization === "string"
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
export const acceptCall = async (callId) => {
    const res = await api.post(`/calls/${callId}/accept`);
    return res.data;
};
export const rejectCall = async (callId) => {
    const res = await api.post(`/calls/${callId}/reject`);
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
// Upload media cho mạng xã hội (ảnh/video) - dùng chung với desktop
export const uploadMediaApi = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/uploads/s3/public', formData, {
    // Để browser tự set Content-Type + boundary
    });
    return {
        url: res.data.url,
        type: res.data.mime.startsWith('image/') ? 'image' : 'video',
    };
};
// Web helper: upload File object directly (chat attachments)
export const uploadChatFile = async (file) => {
    const form = new FormData();
    form.append('file', file);
    const res = await api.post(`/uploads/s3/public`, form, {
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
// Get current user ID – web version dùng localStorage
export const getCurrentUserId = async () => {
    try {
        if (typeof window === 'undefined')
            return null;
        const userId = window.localStorage.getItem('user_id');
        return userId;
    }
    catch (error) {
        console.error('Error getting user ID from localStorage:', error);
        return null;
    }
};
// Bạn bè cho trang cá nhân / friends page
export const getFriends = async () => {
    const res = await api.get("/social/friends");
    return res.data;
};
export const blockUserApi = async (userId) => {
    const res = await api.post(`/users/${userId}/block`);
    return res.data;
};
export const unblockUserApi = async (userId) => {
    const res = await api.delete(`/users/${userId}/block`);
    return res.data;
};
export const getBlockedUsersApi = async () => {
    const res = await api.get("/users/blocked");
    return res.data;
};
export const getBlockStatusApi = async (userId) => {
    const res = await api.get(`/users/${userId}/block-status`);
    return res.data;
};
export const unfriendUserApi = async (userId) => {
    const res = await api.delete(`/social/friends/${userId}`);
    return res.data;
};
// Photos from posts (author or tagged)
export const getUserPhotosApi = async (userId, type = "authored") => {
    try {
        const res = await api.get(`/social/users/${userId}/photos`, { params: { type } });
        return res.data;
    }
    catch (error) {
        // Nếu backend chưa có route /photos (404), trả về rỗng để frontend fallback sang posts
        if (error?.response?.status === 404) {
            return { items: [] };
        }
        throw error;
    }
};
export const updateProfileApi = async (payload) => {
    const res = await api.patch(`/users/me/profile`, payload);
    return res.data;
};
// Feed bài viết của 1 user (trang profile)
export const getUserPostsApi = async (userId, cursor, limit = 20) => {
    const params = { limit };
    if (cursor)
        params.cursor = cursor;
    const res = await api.get(`/social/users/${userId}/posts`, { params });
    return res.data;
};
export const trackEventApi = async (eventType, metadata, sessionId) => {
    try {
        await api.post("/analytics/track", { eventType, metadata, sessionId });
    }
    catch (error) {
        console.error("[Analytics] Failed to track event:", error);
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
export const changePassword = async (currentPassword, newPassword) => {
    const res = await api.post('/auth/change-password', {
        currentPassword,
        newPassword,
    });
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
export const getUsersByIds = async (userIds) => {
    const res = await api.post(`/users/by-ids`, { userIds });
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
// Backwards-compatible aliases for desktop code
export const addGroupMembers = addMembers;
export const removeGroupMember = removeMember;
export const makeGroupAdmin = makeAdmin;
export const removeGroupAdmin = removeAdmin;
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
export const getFeed = async (cursor) => {
    const params = {};
    if (cursor)
        params.cursor = cursor;
    const res = await api.get("/social/posts/feed", { params });
    return res.data;
};
export const createPostApi = async (payload) => {
    const res = await api.post("/social/posts", payload);
    return res.data;
};
export const createCommentApi = async (postId, payload) => {
    const res = await api.post(`/social/posts/${postId}/comments`, payload);
    return res.data;
};
export const getPostComments = async (postId, cursor) => {
    const params = {};
    if (cursor)
        params.cursor = cursor;
    const res = await api.get(`/social/posts/${postId}/comments`, { params });
    return res.data;
};
export const getPostsByHashtagApi = async (tag, cursor) => {
    const params = {};
    if (cursor)
        params.cursor = cursor;
    const res = await api.get(`/social/hashtags/${encodeURIComponent(tag)}/posts`, { params });
    return res.data;
};
// Single post detail
export const getPostByIdApi = async (postId) => {
    const res = await api.get(`/social/posts/${postId}`);
    return res.data;
};
export const sharePostApi = async (postId, payload) => {
    const res = await api.post(`/social/posts/${postId}/share`, payload);
    return res.data;
};
export const createStoryApi = async (payload) => {
    const res = await api.post("/social/stories", payload);
    return res.data;
};
export const getStoriesApi = async () => {
    const res = await api.get("/social/stories");
    return res.data;
};
export const markStoryViewedApi = async (storyId) => {
    const res = await api.post(`/social/stories/${storyId}/view`, {});
    return res.data;
};
export const deleteStoryApi = async (storyId) => {
    const res = await api.delete(`/social/stories/${storyId}`);
    return res.data;
};
export const savePostApi = async (postId) => {
    const res = await api.post(`/social/posts/${postId}/save`, {});
    return res.data;
};
export const unsavePostApi = async (postId) => {
    const res = await api.delete(`/social/posts/${postId}/save`);
    return res.data;
};
export const getSavedPostsApi = async (cursor) => {
    const params = {};
    if (cursor)
        params.cursor = cursor;
    const res = await api.get("/social/posts/saved", { params });
    return res.data;
};
export const reportPostApi = async (postId, payload) => {
    const res = await api.post(`/social/posts/${postId}/report`, payload);
    return res.data;
};
export const getFriendSuggestionsApi = async (limit = 6) => {
    const res = await api.get("/social/friends/suggestions", {
        params: { limit },
    });
    return res.data;
};
export const sendFriendRequestApi = async (targetUserId) => {
    const res = await api.post("/social/friends/requests", { targetUserId });
    return res.data;
};
export const respondFriendRequestApi = async (friendshipId, action) => {
    const res = await api.post(`/social/friends/${friendshipId}/respond`, { action });
    return res.data;
};
export const getPendingFriendRequestsApi = async () => {
    const res = await api.get("/social/friends/requests/pending");
    return res.data;
};
export const getNotificationsApi = async (cursor, limit = 20) => {
    const params = { limit };
    if (cursor)
        params.cursor = cursor;
    const res = await api.get("/social/notifications", { params });
    return res.data;
};
export const markNotificationsReadApi = async (ids) => {
    const res = await api.post("/social/notifications/read", { ids });
    return res.data;
};
export const getUserById = async (userId) => {
    const res = await api.get(`/users/${userId}`);
    return res.data;
};
export const searchSocialApi = async (queryOrParams) => {
    const params = typeof queryOrParams === "string"
        ? { q: queryOrParams }
        : { q: queryOrParams.q, type: queryOrParams.type };
    const res = await api.get("/social/search", { params });
    return res.data;
};
export const checkPostLikedApi = async (postId) => {
    const res = await api.get(`/social/posts/${postId}/liked`);
    return res.data;
};
export const reactToPostApi = async (postId, type) => {
    const res = await api.post(`/social/posts/${postId}/reactions`, { type });
    return res.data;
};
export const removeReactionApi = async (postId) => {
    const res = await api.delete(`/social/posts/${postId}/reactions`);
    return res.data;
};
// Story Reactions & Replies
export const reactToStoryApi = async (storyId, type) => {
    const res = await api.post(`/social/stories/${storyId}/reactions`, { type });
    return res.data;
};
export const removeStoryReactionApi = async (storyId) => {
    const res = await api.delete(`/social/stories/${storyId}/reactions`);
    return res.data;
};
export const getStoryRepliesApi = async (storyId, cursor, limit = 20) => {
    const params = { limit };
    if (cursor)
        params.cursor = cursor;
    const res = await api.get(`/social/stories/${storyId}/replies`, {
        params,
    });
    return res.data;
};
export const createStoryReplyApi = async (storyId, content) => {
    const res = await api.post(`/social/stories/${storyId}/replies`, { content });
    return res.data;
};
// Music Search
export const searchMusicApi = async (query) => {
    try {
        const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&limit=20`);
        const data = await response.json();
        return data.results || [];
    }
    catch (error) {
        console.error("Failed to search music:", error);
        return [];
    }
};
// Reel APIs
export const createReelApi = async (payload) => {
    const res = await api.post("/reels", payload);
    return res.data;
};
export const getReelsFeedApi = async (cursor, limit = 10) => {
    const params = { limit };
    if (cursor)
        params.cursor = cursor;
    const res = await api.get("/reels", { params });
    return res.data;
};
export const getReelByIdApi = async (reelId) => {
    const res = await api.get(`/reels/${reelId}`);
    return res.data;
};
export const getUserReelsApi = async (userId, cursor, limit = 20) => {
    const params = { limit };
    if (cursor)
        params.cursor = cursor;
    const res = await api.get(`/reels/users/${userId}`, { params });
    return res.data;
};
export const likeReelApi = async (reelId, type = "LIKE") => {
    const res = await api.post(`/reels/${reelId}/like`, { type });
    return res.data;
};
export const unlikeReelApi = async (reelId) => {
    const res = await api.delete(`/reels/${reelId}/like`);
    return res.data;
};
export const checkReelLikedApi = async (reelId) => {
    const res = await api.get(`/reels/${reelId}/liked`);
    return res.data;
};
export const deleteReelApi = async (reelId) => {
    const res = await api.delete(`/reels/${reelId}`);
    return res.data;
};
export const syncReelsFromPostsApi = async () => {
    const res = await api.post("/reels/sync");
    return res.data;
};
// ==========================================
// ADMIN APIs
// ==========================================
// Users Management
export const getAdminUsersApi = async (params) => {
    const res = await api.get("/admin/users", { params });
    return res.data;
};
export const getAdminUserStatsApi = async () => {
    const res = await api.get("/admin/users/stats");
    return res.data;
};
export const getAdminUserDetailsApi = async (userId) => {
    const res = await api.get(`/admin/users/${userId}`);
    return res.data;
};
export const banUserApi = async (userId, reason) => {
    const res = await api.patch(`/admin/users/${userId}/ban`, { reason });
    return res.data;
};
export const unbanUserApi = async (userId) => {
    const res = await api.patch(`/admin/users/${userId}/unban`);
    return res.data;
};
export const updateUserRoleApi = async (userId, role) => {
    const res = await api.patch(`/admin/users/${userId}/role`, { role });
    return res.data;
};
export const verifyUserApi = async (userId) => {
    const res = await api.patch(`/admin/users/${userId}/verify`);
    return res.data;
};
export const unverifyUserApi = async (userId) => {
    const res = await api.patch(`/admin/users/${userId}/unverify`);
    return res.data;
};
// Posts Management
export const getAdminPostsApi = async (params) => {
    const res = await api.get("/admin/posts", { params });
    return res.data;
};
export const getAdminPostStatsApi = async () => {
    const res = await api.get("/admin/posts/stats");
    return res.data;
};
export const deletePostApi = async (postId) => {
    const res = await api.delete(`/admin/posts/${postId}`);
    return res.data;
};
export const hidePostApi = async (postId) => {
    const res = await api.patch(`/admin/posts/${postId}/hide`);
    return res.data;
};
export const restorePostApi = async (postId) => {
    const res = await api.patch(`/admin/posts/${postId}/restore`);
    return res.data;
};
export const getAdminReportsApi = async (params) => {
    const res = await api.get("/admin/reports", { params });
    return res.data;
};
export const getAdminReportDetailsApi = async (reportId) => {
    const res = await api.get(`/admin/reports/${reportId}`);
    return res.data;
};
export const handleReportApi = async (reportId, action, notes) => {
    const res = await api.patch(`/admin/reports/${reportId}/handle`, { action, notes });
    return res.data;
};
export const bulkHandleReportsApi = async (reportIds, action) => {
    const res = await api.post("/admin/reports/bulk-handle", {
        reportIds,
        action,
    });
    return res.data;
};
// Analytics
export const getAdminDashboardStatsApi = async () => {
    const res = await api.get("/admin/dashboard/stats");
    return res.data;
};
export const getAdminAnalyticsChartApi = async (timeRange, metric) => {
    const res = await api.get("/admin/analytics/chart", {
        params: { timeRange, metric },
    });
    return res.data;
};
export const getUserActivityStatsApi = async (userId, timeRange) => {
    const res = await api.get(`/admin/analytics/users/${userId}`, { params: { timeRange } });
    return res.data;
};
export const getContentStatsApi = async (timeRange) => {
    const res = await api.get("/admin/analytics/content", {
        params: { timeRange },
    });
    return res.data;
};
// Content Moderation
export const moderatePostApi = async (postId, action) => {
    const res = await api.patch(`/admin/moderation/posts/${postId}`, { action });
    return res.data;
};
export const bulkModeratePostsApi = async (postIds, action) => {
    const res = await api.post("/admin/moderation/posts/bulk", { postIds, action });
    return res.data;
};
export const getModerationQueueApi = async () => {
    const res = await api.get("/admin/moderation/queue");
    return res.data;
};
export const getSystemSettingsApi = async () => {
    const res = await api.get("/admin/settings");
    return res.data;
};
export const updateSystemSettingsApi = async (settings) => {
    const res = await api.patch("/admin/settings", settings);
    return res.data;
};
export const getSystemLogsApi = async (params) => {
    const res = await api.get("/admin/logs", { params });
    return res.data;
};
