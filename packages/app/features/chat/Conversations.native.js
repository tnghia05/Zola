import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, Alert, TextInput, ScrollView, Image, Dimensions, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getConversations, api, setAuthToken, logout, searchUsers, createConversationWithUser, createGroupConversation, getUnreadCount, getMessages, markAsRead, joinConversationByInvite } from '../api';
import { disconnectSocket, getSocket } from '../socket';
import { OnlineStatusBadge } from '../components/OnlineStatusBadge';
import { TypingIndicator } from '../components/TypingIndicator';
import { conversationsStyles } from '../styles/conversations.styles';
import { mobileStyles } from '../styles/conversations.mobile.styles';
import { desktopStyles } from '../styles/conversations.desktop.styles';
import { ChatComponent } from './Chat';
import { useTheme } from '../contexts/ThemeContext';
import { createThemeStyles } from '../styles/theme.styles';
import { useFocusEffect } from '@react-navigation/native';
import { ShareLinkPanel } from '../components/ShareLinkPanel';
const { width } = Dimensions.get('window');
export default function ConversationsScreen({ navigation }) {
    const { colors } = useTheme();
    const themeStyles = createThemeStyles(colors);
    const [data, setData] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [selectedTab, setSelectedTab] = useState('all');
    const [isMobile, setIsMobile] = useState(width < 768);
    const [userInfo, setUserInfo] = useState(null);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [pendingInviteConversationId, setPendingInviteConversationId] = useState(null);
    const [showChatInfo, setShowChatInfo] = useState(false);
    const [showShareLinkPanel, setShowShareLinkPanel] = useState(false);
    // Select platform-specific styles based on screen width
    const platformStyles = isMobile ? mobileStyles : desktopStyles;
    // User info state
    const [userId, setUserId] = useState(null);
    // Opponent info state
    const [opponentInfo, setOpponentInfo] = useState(null);
    // Conversation participants info state
    const [conversationParticipants, setConversationParticipants] = useState({});
    // New state for messaging features
    const [unreadCounts, setUnreadCounts] = useState({});
    const [onlineStatuses, setOnlineStatuses] = useState({});
    const [typingStatuses, setTypingStatuses] = useState({});
    const [showSearchModal, setShowSearchModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState(null);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [groupName, setGroupName] = useState('');
    // ... existing code ...
    // Call states are now handled by ChatComponent
    const load = async () => {
        setRefreshing(true);
        try {
            console.log('Loading conversations...');
            console.log('Current auth header:', api.defaults.headers.common['Authorization']);
            const res = await getConversations();
            console.log('Raw API response:', JSON.stringify(res, null, 2));
            console.log('Conversations loaded:', res);
            console.log('Conversations length:', res.length);
            console.log('First conversation:', res[0]);
            setData(res);
            if (pendingInviteConversationId) {
                const joinedConversation = res.find(conv => conv._id === pendingInviteConversationId);
                if (joinedConversation) {
                    if (isMobile) {
                        const targetUserId = joinedConversation.isGroup
                            ? undefined
                            : joinedConversation.members.find(id => id !== userId);
                        navigation.navigate('Chat', {
                            conversationId: joinedConversation._id,
                            name: joinedConversation.isGroup
                                ? (joinedConversation.title || 'Group Chat')
                                : (joinedConversation.title || 'Direct Message'),
                            targetUserId: targetUserId,
                        });
                    }
                    else {
                        setSelectedConversation(joinedConversation);
                        setShowChatInfo(true);
                    }
                    setPendingInviteConversationId(null);
                }
            }
            // Load participant info for each conversation
            await loadConversationParticipants(res);
            // Load unread counts
            await loadUnreadCounts(res);
            // Load online statuses for all users in conversations
            await loadOnlineStatuses(res);
        }
        catch (error) {
            console.error('Error loading conversations:', error);
        }
        finally {
            setRefreshing(false);
        }
    };
    // Load unread counts for all conversations
    const loadUnreadCounts = async (conversations) => {
        const counts = {};
        for (const conv of conversations) {
            try {
                const { unreadCount } = await getUnreadCount(conv._id);
                counts[conv._id] = unreadCount;
            }
            catch (error) {
                console.error(`Failed to load unread count for ${conv._id}:`, error);
                counts[conv._id] = 0;
            }
        }
        setUnreadCounts(counts);
    };
    // Load online statuses for users in conversations
    const loadOnlineStatuses = async (conversations) => {
        const allUserIds = new Set();
        conversations.forEach(conv => {
            conv.members.forEach(memberId => {
                if (memberId !== userId) {
                    allUserIds.add(memberId);
                }
            });
        });
        if (allUserIds.size > 0) {
            try {
                const { getOnlineUsers } = await import('../api');
                const { statusMap } = await getOnlineUsers(Array.from(allUserIds));
                setOnlineStatuses(statusMap);
            }
            catch (error) {
                console.error('Failed to load online statuses:', error);
            }
        }
    };
    // Load participant info for all conversations
    const loadConversationParticipants = async (conversations) => {
        const participants = {};
        for (const conversation of conversations) {
            if (!conversation.isGroup) {
                try {
                    // Get opponent info for each conversation
                    const { getOpponentInfo } = require('../api');
                    const opponent = await getOpponentInfo(conversation._id);
                    if (opponent && opponent.user) {
                        // Get last message for preview
                        let lastMessageText = 'Chưa có tin nhắn';
                        try {
                            const messages = await getMessages(conversation._id);
                            if (messages && messages.length > 0) {
                                const lastMsg = messages[messages.length - 1];
                                if (lastMsg.text) {
                                    lastMessageText = lastMsg.text;
                                }
                                else if (lastMsg.type === 'image') {
                                    lastMessageText = '📷 Image';
                                }
                                else if (lastMsg.type === 'file') {
                                    lastMessageText = '📎 File';
                                }
                            }
                        }
                        catch (error) {
                            console.log('Could not load last message:', error);
                        }
                        participants[conversation._id] = {
                            name: opponent.user.name || opponent.user.username || 'Unknown User',
                            avatar: opponent.user.avatar,
                            lastMessage: lastMessageText
                        };
                    }
                    else {
                        participants[conversation._id] = {
                            name: conversation.title || 'Direct Message',
                            avatar: undefined,
                            lastMessage: 'Chưa có tin nhắn'
                        };
                    }
                }
                catch (error) {
                    console.log('Could not fetch participant info for conversation:', conversation._id);
                    participants[conversation._id] = {
                        name: conversation.title || 'Direct Message',
                        avatar: undefined,
                        lastMessage: 'Chưa có tin nhắn'
                    };
                }
            }
            else {
                // Get last message for group
                let lastMessageText = 'Chưa có tin nhắn';
                try {
                    const messages = await getMessages(conversation._id);
                    if (messages && messages.length > 0) {
                        const lastMsg = messages[messages.length - 1];
                        if (lastMsg.text) {
                            lastMessageText = lastMsg.text;
                        }
                        else if (lastMsg.type === 'image') {
                            lastMessageText = '📷 Image';
                        }
                        else if (lastMsg.type === 'file') {
                            lastMessageText = '📎 File';
                        }
                    }
                }
                catch (error) {
                    console.log('Could not load last message:', error);
                }
                participants[conversation._id] = {
                    name: conversation.title || 'Group Chat',
                    avatar: conversation.groupAvatar,
                    lastMessage: lastMessageText
                };
            }
        }
        setConversationParticipants(participants);
    };
    const loadUserInfo = useCallback(async () => {
        try {
            const userString = await AsyncStorage.getItem('user');
            if (userString) {
                const user = JSON.parse(userString);
                console.log('🔍 Loaded user from AsyncStorage:', user);
                setUserInfo(user);
            }
            // Also check user_data for more complete info
            const userDataString = await AsyncStorage.getItem('user_data');
            if (userDataString) {
                const userData = JSON.parse(userDataString);
                console.log('🔍 Loaded user_data from AsyncStorage:', userData);
                setUserInfo(prev => ({
                    ...prev,
                    ...userData,
                    avatar: userData.avatar || prev?.avatar
                }));
            }
            // Also try to get fresh user profile from API
            try {
                const { getCurrentUserProfile } = require('../api');
                const profile = await getCurrentUserProfile();
                if (profile.user) {
                    console.log('✅ Got fresh profile from API:', profile.user);
                    setUserInfo(prev => ({
                        ...prev,
                        ...profile.user,
                        avatar: profile.user.avatar
                    }));
                    console.log('✅ Updated user info from API:', profile.user);
                }
            }
            catch (apiError) {
                console.log('⚠️ Could not fetch fresh user profile:', apiError);
            }
        }
        catch (error) {
            console.error('Failed to load user info from AsyncStorage', error);
        }
    }, []);
    // Load user ID from storage
    const loadUserId = useCallback(async () => {
        try {
            const storedUserId = await AsyncStorage.getItem('user_id');
            if (storedUserId) {
                setUserId(storedUserId);
                console.log('User ID set to:', storedUserId);
            }
            else {
                console.log('No user_id found in AsyncStorage');
                // Try to decode JWT token to get user ID
                const storedToken = await AsyncStorage.getItem('auth_token');
                if (storedToken) {
                    try {
                        const payloadB64 = storedToken.split('.')[1];
                        const payload = JSON.parse(atob(payloadB64));
                        const tokenUserId = payload.sub || payload.userId || payload.id;
                        if (tokenUserId) {
                            setUserId(tokenUserId);
                            await AsyncStorage.setItem('user_id', tokenUserId);
                            console.log('Using userId from token:', tokenUserId);
                        }
                    }
                    catch (e) {
                        console.log('Could not decode token:', e);
                    }
                }
            }
        }
        catch (error) {
            console.error('Error loading user ID:', error);
        }
    }, []);
    useFocusEffect(useCallback(() => {
        loadUserInfo();
        loadUserId(); // Load userId when screen focuses
    }, [loadUserInfo, loadUserId]));
    useEffect(() => {
        // Đợi một chút để App.tsx set token vào axios trước
        const checkAndLoad = async () => {
            const token = await AsyncStorage.getItem('auth_token');
            console.log('Token in storage:', token);
            console.log('Axios auth header:', api.defaults.headers.common['Authorization']);
            // Nếu có token nhưng axios chưa có, set lại
            if (token && !api.defaults.headers.common['Authorization']) {
                setAuthToken(token);
                console.log('Token set in axios:', api.defaults.headers.common['Authorization']);
            }
            // Load user ID first
            await loadUserId();
            let inviteCode = null;
            if (typeof window !== 'undefined') {
                const params = new URLSearchParams(window.location.search);
                inviteCode = params.get('invite');
            }
            if (inviteCode) {
                try {
                    const { conversation } = await joinConversationByInvite(inviteCode);
                    if (conversation?._id) {
                        setPendingInviteConversationId(conversation._id);
                        Alert.alert('Thành công', `Bạn đã tham gia nhóm ${conversation.title || 'mới'}.`);
                    }
                }
                catch (error) {
                    console.error('Join via invite error:', error);
                    const message = error?.response?.data?.error ||
                        error?.message ||
                        'Không thể tham gia nhóm bằng link mời.';
                    Alert.alert('Không thể tham gia', message);
                }
                finally {
                    if (typeof window !== 'undefined') {
                        window.history.replaceState({}, document.title, window.location.pathname);
                    }
                }
            }
            // Đợi một chút rồi load
            setTimeout(() => {
                load();
            }, 100);
        };
        checkAndLoad();
    }, []);
    // Socket listeners for real-time updates
    useEffect(() => {
        const socket = getSocket();
        if (!socket)
            return;
        // Listen for conversation updates
        const handleConversationUpdate = async (data) => {
            setData((prev) => {
                const updated = prev.map(conv => {
                    if (conv._id === data.conversationId) {
                        return { ...conv, lastMessageAt: data.lastMessageAt.toISOString() };
                    }
                    return conv;
                });
                // Sort by lastMessageAt
                return updated.sort((a, b) => {
                    const aTime = new Date(a.lastMessageAt || a.createdAt).getTime();
                    const bTime = new Date(b.lastMessageAt || b.createdAt).getTime();
                    return bTime - aTime;
                });
            });
            // Reload conversation data
            load();
        };
        // Listen for typing indicators
        const handleTypingStart = (data) => {
            setTypingStatuses((prev) => {
                const current = prev[data.conversationId] || [];
                if (!current.includes(data.userId)) {
                    return { ...prev, [data.conversationId]: [...current, data.userId] };
                }
                return prev;
            });
        };
        const handleTypingStop = (data) => {
            setTypingStatuses((prev) => {
                const current = prev[data.conversationId] || [];
                return { ...prev, [data.conversationId]: current.filter(id => id !== data.userId) };
            });
        };
        // Listen for online status updates
        const handleUserStatus = (data) => {
            setOnlineStatuses((prev) => ({
                ...prev,
                [data.userId]: {
                    onlineStatus: data.status,
                    lastSeen: data.lastSeen
                }
            }));
        };
        // Listen for new messages (to update last message and unread count)
        const handleNewMessage = async (message) => {
            // Update conversation last message
            setData((prev) => {
                const updated = prev.map(conv => {
                    if (conv._id === message.conversationId) {
                        return { ...conv, lastMessageAt: new Date().toISOString() };
                    }
                    return conv;
                });
                return updated.sort((a, b) => {
                    const aTime = new Date(a.lastMessageAt || a.createdAt).getTime();
                    const bTime = new Date(b.lastMessageAt || b.createdAt).getTime();
                    return bTime - aTime;
                });
            });
            // Update unread count if not current conversation
            const currentConvId = selectedConversation?._id;
            if (message.conversationId !== currentConvId) {
                setUnreadCounts((prev) => ({
                    ...prev,
                    [message.conversationId]: (prev[message.conversationId] || 0) + 1
                }));
            }
            // Update last message preview
            if (message.conversationId && message.text) {
                setConversationParticipants((prev) => ({
                    ...prev,
                    [message.conversationId]: {
                        ...prev[message.conversationId],
                        lastMessage: message.text
                    }
                }));
            }
        };
        socket.on('conversation:update', handleConversationUpdate);
        socket.on('typing:start', handleTypingStart);
        socket.on('typing:stop', handleTypingStop);
        socket.on('user:status', handleUserStatus);
        socket.on('message:new', handleNewMessage);
        return () => {
            socket.off('conversation:update', handleConversationUpdate);
            socket.off('typing:start', handleTypingStart);
            socket.off('typing:stop', handleTypingStop);
            socket.off('user:status', handleUserStatus);
            socket.off('message:new', handleNewMessage);
        };
    }, [userId, selectedConversation]);
    // Socket setup is now handled by ChatComponent
    // Listen for screen size changes
    useEffect(() => {
        const subscription = Dimensions.addEventListener('change', ({ window }) => {
            setIsMobile(window.width < 768);
        });
        return () => subscription?.remove();
    }, []);
    const onRefresh = useCallback(() => {
        load();
    }, []);
    // Load opponent info when conversation is selected
    const loadOpponentInfo = async (conversation) => {
        if (!conversation || !userId)
            return;
        try {
            // For 1-1 chats, get the other participant's info
            if (!conversation.isGroup) {
                const otherParticipantId = conversation.members.find(id => id !== userId);
                if (otherParticipantId) {
                    // Try to get user info from API
                    try {
                        const { getOpponentInfo } = require('../api');
                        const opponent = await getOpponentInfo(conversation._id);
                        if (opponent && opponent.user) {
                            setOpponentInfo({
                                name: opponent.user.name || opponent.user.username || 'Unknown User',
                                avatar: opponent.user.avatar,
                                status: 'Hoạt động 5 phút trước'
                            });
                            return;
                        }
                    }
                    catch (error) {
                        console.log('Could not fetch opponent info from API:', error);
                    }
                    // Fallback: use conversation title or generic name
                    setOpponentInfo({
                        name: conversation.title || 'Direct Message',
                        avatar: undefined,
                        status: 'Hoạt động 5 phút trước'
                    });
                }
            }
            else {
                // For group chats, use group info
                setOpponentInfo({
                    name: conversation.title || 'Group Chat',
                    avatar: undefined,
                    status: `${conversation.members.length} thành viên`
                });
            }
        }
        catch (error) {
            console.error('Error loading opponent info:', error);
            // Fallback
            setOpponentInfo({
                name: conversation.title || 'Direct Message',
                avatar: undefined,
                status: 'Hoạt động 5 phút trước'
            });
        }
    };
    // Chat functionality is now handled by ChatComponent
    const handleLogout = async () => {
        try {
            const token = await AsyncStorage.getItem('auth_token');
            if (token) {
                await logout(token);
            }
            await AsyncStorage.removeItem('auth_token');
            await AsyncStorage.removeItem('user_id');
            await AsyncStorage.removeItem('user_data');
            await AsyncStorage.removeItem('user');
            setAuthToken();
            disconnectSocket();
            navigation.navigate('Login');
        }
        catch (error) {
            console.error('Logout error:', error);
            // Vẫn thực hiện logout local dù có lỗi API
            await AsyncStorage.removeItem('auth_token');
            await AsyncStorage.removeItem('user_id');
            await AsyncStorage.removeItem('user_data');
            await AsyncStorage.removeItem('user');
            setAuthToken();
            disconnectSocket();
            navigation.navigate('Login');
        }
    };
    const formatTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
        if (diffInMinutes < 1)
            return 'Vừa xong';
        if (diffInMinutes < 60)
            return `${diffInMinutes} phút`;
        if (diffInMinutes < 1440)
            return `${Math.floor(diffInMinutes / 60)} giờ`;
        if (diffInMinutes < 10080)
            return `${Math.floor(diffInMinutes / 1440)} ngày`;
        return date.toLocaleDateString('vi-VN');
    };
    const getFilteredConversations = () => {
        let filtered = data.filter(conversation => (conversation.title || 'Untitled').toLowerCase().includes(searchText.toLowerCase()));
        switch (selectedTab) {
            case 'unread':
                // For now, show all conversations as we don't have unread count in API
                return filtered;
            case 'groups':
                return filtered.filter(conversation => conversation.isGroup);
            default:
                return filtered;
        }
    };
    // ... existing functions ...
    // Tìm kiếm users
    const handleSearchUsers = async (query) => {
        if (!query.trim()) {
            setSearchResults([]);
            setSearchError(null);
            return;
        }
        setIsSearching(true);
        setSearchError(null);
        try {
            console.log('Searching for:', query);
            const response = await searchUsers(query);
            console.log('Search response:', response);
            setSearchResults(response.users);
        }
        catch (error) {
            console.error('Search error:', error);
            console.error('Error response:', error.response?.data);
            console.error('Error status:', error.response?.status);
            let errorMessage = 'Không thể tìm kiếm người dùng';
            if (error.response?.status === 401) {
                errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
            }
            else if (error.response?.status === 400) {
                errorMessage = 'Truy vấn tìm kiếm không hợp lệ.';
            }
            else if (error.response?.data?.error) {
                errorMessage = error.response.data.error;
            }
            setSearchError(errorMessage);
            setSearchResults([]);
        }
        finally {
            setIsSearching(false);
        }
    };
    // ... existing functions ...
    // Toggle user selection
    const toggleUserSelection = (userId) => {
        setSelectedUsers(prev => {
            if (prev.includes(userId)) {
                return prev.filter(id => id !== userId);
            }
            else {
                return [...prev, userId];
            }
        });
    };
    // Render search modal
    const renderSearchModal = () => {
        if (!showSearchModal)
            return null;
        const hasSelectedUsers = selectedUsers.length > 0;
        const isGroupMode = selectedUsers.length >= 2;
        // Get selected users data
        const selectedUsersData = searchResults.filter(u => selectedUsers.includes(u._id));
        const overlayStyles = [
            themeStyles.modalOverlay,
            {
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 9999,
                justifyContent: 'flex-start',
                paddingTop: isMobile ? 80 : 120,
                paddingBottom: isMobile ? 40 : 80,
                backgroundColor: 'rgba(15, 23, 42, 0.45)',
            },
        ];
        return (_jsx(View, { style: overlayStyles, children: _jsxs(View, { style: [themeStyles.modalContainer, { maxHeight: '85%', maxWidth: isMobile ? '95%' : 500, zIndex: 10000 }], children: [_jsxs(View, { style: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }, children: [_jsx(Text, { style: [themeStyles.modalTitle, { fontSize: 20, fontWeight: '600' }], children: isGroupMode ? 'Tạo nhóm mới' : hasSelectedUsers ? 'Chọn thành viên' : 'Tạo chat mới' }), _jsx(TouchableOpacity, { style: { padding: 8, borderRadius: 20, backgroundColor: colors.surface }, onPress: () => {
                                    setShowSearchModal(false);
                                    setSearchQuery('');
                                    setSearchResults([]);
                                    setSearchError(null);
                                    setSelectedUsers([]);
                                    setGroupName('');
                                }, children: _jsx(Text, { style: [themeStyles.text, { fontSize: 20, color: colors.textSecondary }], children: "\u2715" }) })] }), _jsx(View, { style: { marginBottom: 16 }, children: _jsx(TextInput, { style: [themeStyles.input, { fontSize: 15, paddingVertical: 12 }], placeholder: "T\u00ECm ki\u1EBFm theo t\u00EAn, email ho\u1EB7c username...", placeholderTextColor: colors.inputPlaceholder, value: searchQuery, onChangeText: setSearchQuery, autoFocus: true }) }), hasSelectedUsers && (_jsxs(View, { style: { marginBottom: 16 }, children: [_jsx(View, { style: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 }, children: _jsxs(Text, { style: [themeStyles.text, { fontSize: 14, fontWeight: '500', color: colors.textSecondary }], children: ["\u0110\u00E3 ch\u1ECDn (", selectedUsers.length, ")"] }) }), _jsx(ScrollView, { horizontal: true, showsHorizontalScrollIndicator: false, style: { marginBottom: 8 }, children: _jsx(View, { style: { flexDirection: 'row', gap: 8 }, children: selectedUsersData.map((user) => (_jsxs(View, { style: {
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            backgroundColor: colors.primary + '15',
                                            padding: 8,
                                            borderRadius: 20,
                                            borderWidth: 1,
                                            borderColor: colors.primary + '40',
                                            gap: 8
                                        }, children: [user.avatar ? (_jsx(Image, { source: { uri: user.avatar }, style: { width: 24, height: 24, borderRadius: 12 } })) : (_jsx(View, { style: {
                                                    width: 24,
                                                    height: 24,
                                                    borderRadius: 12,
                                                    backgroundColor: colors.primary,
                                                    justifyContent: 'center',
                                                    alignItems: 'center'
                                                }, children: _jsx(Text, { style: { color: colors.buttonText, fontSize: 12, fontWeight: '600' }, children: user.name.charAt(0).toUpperCase() }) })), _jsx(Text, { style: {
                                                    color: colors.text,
                                                    fontSize: 13,
                                                    fontWeight: '500',
                                                    maxWidth: 100
                                                }, numberOfLines: 1, children: user.name }), _jsx(TouchableOpacity, { onPress: () => toggleUserSelection(user._id), style: {
                                                    width: 20,
                                                    height: 20,
                                                    borderRadius: 10,
                                                    backgroundColor: colors.textSecondary + '30',
                                                    justifyContent: 'center',
                                                    alignItems: 'center'
                                                }, children: _jsx(Text, { style: { color: colors.text, fontSize: 12 }, children: "\u2715" }) })] }, user._id))) }) }), selectedUsers.length === 1 && (_jsx(Text, { style: [themeStyles.text, { fontSize: 12, color: colors.textSecondary, fontStyle: 'italic' }], children: "\uD83D\uDCA1 Ch\u1ECDn th\u00EAm ng\u01B0\u1EDDi \u0111\u1EC3 t\u1EA1o nh\u00F3m" }))] })), isGroupMode && (_jsxs(View, { style: { marginBottom: 16 }, children: [_jsx(Text, { style: [themeStyles.text, { fontSize: 14, fontWeight: '500', marginBottom: 8, color: colors.textSecondary }], children: "T\u00EAn nh\u00F3m (t\u00F9y ch\u1ECDn)" }), _jsx(TextInput, { style: [themeStyles.input, { fontSize: 15, paddingVertical: 12 }], placeholder: "Nh\u1EADp t\u00EAn nh\u00F3m...", placeholderTextColor: colors.inputPlaceholder, value: groupName, onChangeText: setGroupName })] })), !hasSelectedUsers && searchQuery && searchResults.length > 0 && (_jsx(View, { style: { marginBottom: 12, padding: 12, backgroundColor: colors.surface, borderRadius: 8, borderWidth: 1, borderColor: colors.border }, children: _jsx(Text, { style: [themeStyles.text, { fontSize: 13, color: colors.textSecondary, lineHeight: 18 }], children: "\uD83D\uDCA1 Ch\u1ECDn user \u0111\u1EC3 t\u1EA1o chat 1-1, ho\u1EB7c ch\u1ECDn nhi\u1EC1u user \u0111\u1EC3 t\u1EA1o nh\u00F3m" }) })), _jsx(View, { style: [conversationsStyles.searchResults, { maxHeight: 300, marginBottom: 16 }], children: isSearching ? (_jsx(View, { style: conversationsStyles.loadingContainer, children: _jsx(Text, { style: conversationsStyles.loadingText, children: "\u0110ang t\u00ECm..." }) })) : searchError ? (_jsx(View, { style: conversationsStyles.errorContainer, children: _jsx(Text, { style: conversationsStyles.errorText, children: searchError }) })) : searchResults.length === 0 && searchQuery ? (_jsx(View, { style: conversationsStyles.noResultsContainer, children: _jsx(Text, { style: conversationsStyles.noResultsText, children: "Kh\u00F4ng t\u00ECm th\u1EA5y ng\u01B0\u1EDDi d\u00F9ng n\u00E0o" }) })) : searchResults.length > 0 ? (_jsx(FlatList, { data: searchResults, keyExtractor: (item) => item._id, renderItem: ({ item }) => {
                                const isSelected = selectedUsers.includes(item._id);
                                return (_jsxs(TouchableOpacity, { style: [
                                        conversationsStyles.searchResultItem,
                                        {
                                            backgroundColor: isSelected ? colors.primary + '15' : colors.surface,
                                            borderWidth: 1,
                                            borderColor: isSelected ? colors.primary + '40' : colors.border,
                                            borderRadius: 12,
                                            padding: 12,
                                            marginBottom: 8
                                        }
                                    ], onPress: () => {
                                        toggleUserSelection(item._id);
                                    }, children: [_jsx(View, { style: {
                                                width: 24,
                                                height: 24,
                                                borderRadius: 12,
                                                borderWidth: 2,
                                                borderColor: isSelected ? colors.primary : colors.border,
                                                backgroundColor: isSelected ? colors.primary : 'transparent',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                marginRight: 12
                                            }, children: isSelected && (_jsx(Text, { style: { color: colors.buttonText, fontSize: 14, fontWeight: 'bold' }, children: "\u2713" })) }), _jsx(View, { style: conversationsStyles.searchResultAvatar, children: item.avatar ? (_jsx(Image, { source: { uri: item.avatar }, style: conversationsStyles.searchResultAvatarImage })) : (_jsx(View, { style: conversationsStyles.searchResultDefaultAvatar, children: _jsx(Text, { style: conversationsStyles.searchResultDefaultAvatarText, children: item.name.charAt(0).toUpperCase() }) })) }), _jsxs(View, { style: [conversationsStyles.searchResultInfo, { flex: 1 }], children: [_jsx(Text, { style: [conversationsStyles.searchResultName, { fontWeight: '500' }], children: item.name }), _jsx(Text, { style: [conversationsStyles.searchResultEmail, { fontSize: 12 }], children: item.email }), item.username && (_jsxs(Text, { style: [conversationsStyles.searchResultUsername, { fontSize: 12 }], children: ["@", item.username] }))] })] }));
                            } })) : null }), hasSelectedUsers && (_jsxs(View, { style: {
                            flexDirection: 'row',
                            gap: 12,
                            paddingTop: 16,
                            borderTopWidth: 1,
                            borderTopColor: colors.border
                        }, children: [selectedUsers.length > 1 ? (_jsx(TouchableOpacity, { style: {
                                    flex: 1,
                                    backgroundColor: colors.primary,
                                    padding: 16,
                                    borderRadius: 12,
                                    alignItems: 'center',
                                    shadowColor: colors.primary,
                                    shadowOffset: { width: 0, height: 2 },
                                    shadowOpacity: 0.2,
                                    shadowRadius: 4,
                                    elevation: 3
                                }, onPress: handleCreateGroup, children: _jsx(Text, { style: { color: colors.buttonText, fontSize: 16, fontWeight: '600' }, children: groupName.trim() ? `Tạo nhóm "${groupName.trim()}"` : 'Tạo nhóm' }) })) : (_jsx(TouchableOpacity, { style: {
                                    flex: 1,
                                    backgroundColor: colors.primary,
                                    padding: 16,
                                    borderRadius: 12,
                                    alignItems: 'center',
                                    shadowColor: colors.primary,
                                    shadowOffset: { width: 0, height: 2 },
                                    shadowOpacity: 0.2,
                                    shadowRadius: 4,
                                    elevation: 3
                                }, onPress: () => {
                                    const user = searchResults.find(u => u._id === selectedUsers[0]);
                                    if (user) {
                                        handleCreateConversation(user);
                                    }
                                }, children: _jsx(Text, { style: { color: colors.buttonText, fontSize: 16, fontWeight: '600' }, children: "T\u1EA1o chat" }) })), _jsx(TouchableOpacity, { style: {
                                    paddingHorizontal: 20,
                                    paddingVertical: 16,
                                    borderRadius: 12,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderWidth: 1,
                                    borderColor: colors.border,
                                    backgroundColor: colors.surface
                                }, onPress: () => {
                                    setSelectedUsers([]);
                                    setGroupName('');
                                }, children: _jsx(Text, { style: { color: colors.text, fontSize: 16, fontWeight: '500' }, children: "H\u1EE7y" }) })] }))] }) }));
    };
    // ... existing code ...
    // Tạo conversation với user
    const handleCreateConversation = async (user) => {
        try {
            const conversation = await createConversationWithUser(user._id);
            console.log('Created conversation:', conversation);
            // Đóng modal tìm kiếm
            setShowSearchModal(false);
            setSearchQuery('');
            setSearchResults([]);
            setSelectedUsers([]);
            setGroupName('');
            // Chọn conversation mới
            setSelectedConversation(conversation);
            setShowChatInfo(true);
            // Load opponent info for new conversation
            await loadOpponentInfo(conversation);
            // Messages loading is now handled by ChatComponent
            // Refresh danh sách conversations
            await load();
        }
        catch (error) {
            console.error('Error creating conversation:', error);
            Alert.alert('Lỗi', 'Không thể tạo cuộc trò chuyện');
        }
    };
    // Tạo nhóm mới
    const handleCreateGroup = async () => {
        if (selectedUsers.length < 2) {
            Alert.alert('Lỗi', 'Vui lòng chọn ít nhất 2 người để tạo nhóm');
            return;
        }
        try {
            const conversation = await createGroupConversation(selectedUsers, groupName.trim() || undefined);
            console.log('Created group:', conversation);
            // Đóng modal tìm kiếm
            setShowSearchModal(false);
            setSearchQuery('');
            setSearchResults([]);
            setSelectedUsers([]);
            setGroupName('');
            // Chọn conversation mới
            setSelectedConversation(conversation);
            setShowChatInfo(true);
            // Load opponent info for new group
            await loadOpponentInfo(conversation);
            // Refresh danh sách conversations
            await load();
        }
        catch (error) {
            console.error('Error creating group:', error);
            Alert.alert('Lỗi', 'Không thể tạo nhóm');
        }
    };
    // Tìm kiếm với debounce
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            handleSearchUsers(searchQuery);
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [searchQuery]);
    // Cập nhật nút compose button để mở search modal
    const renderComposeButton = () => {
        const styles = isMobile ? mobileStyles : desktopStyles;
        return (_jsx(TouchableOpacity, { style: styles.composeButton, onPress: () => setShowSearchModal(true), children: _jsx(Text, { style: [styles.headerIcon, { color: colors.text }], children: "\u270F\uFE0F" }) }));
    };
    const handleConversationSelect = async (conversation) => {
        // Clear unread count when opening conversation
        try {
            await markAsRead(conversation._id);
            setUnreadCounts((prev) => ({ ...prev, [conversation._id]: 0 }));
        }
        catch (error) {
            console.error('Failed to mark as read:', error);
        }
        if (isMobile) {
            // For mobile, navigate to Chat screen
            navigation.navigate('Chat', {
                conversationId: conversation._id,
                name: conversation.title || 'Direct Message',
                targetUserId: conversation.members.find(id => id !== userId)
            });
        }
        else {
            // For desktop, show in same screen
            setSelectedConversation(conversation);
            setShowChatInfo(true);
            setShowShareLinkPanel(false); // Reset share link panel when switching conversations
            // Load opponent info
            await loadOpponentInfo(conversation);
        }
    };
    const renderConversationItem = ({ item }) => {
        let conversationName = 'Untitled';
        let conversationAvatar = 'https://via.placeholder.com/50'; // Default placeholder
        let lastMessage = 'Chưa có tin nhắn';
        // Get participant info from state
        const participantInfo = conversationParticipants[item._id];
        if (participantInfo) {
            conversationName = participantInfo.name;
            conversationAvatar = participantInfo.avatar || (item.isGroup ? 'https://via.placeholder.com/50/007AFF/FFFFFF?text=G' : 'https://via.placeholder.com/50/FF6B6B/FFFFFF?text=U');
            lastMessage = participantInfo.lastMessage || 'Chưa có tin nhắn';
            console.log('🎯 Participant info for', item._id, ':', participantInfo);
            console.log('🎯 Avatar URL:', conversationAvatar);
        }
        else {
            // Fallback for when participant info is not loaded yet
            if (item.isGroup) {
                conversationName = item.title || 'Group Chat';
                conversationAvatar = 'https://via.placeholder.com/50/007AFF/FFFFFF?text=G';
                lastMessage = 'Chưa có tin nhắn';
            }
            else {
                conversationName = item.title || 'Direct Message';
                conversationAvatar = 'https://via.placeholder.com/50/FF6B6B/FFFFFF?text=U';
                lastMessage = 'Chưa có tin nhắn';
            }
        }
        const styles = isMobile ? mobileStyles : desktopStyles;
        return (_jsxs(TouchableOpacity, { style: [
                styles.conversationItem,
                isMobile
                    ? { borderBottomColor: 'rgba(255, 255, 255, 0.08)' }
                    : { backgroundColor: colors.surface, borderBottomColor: colors.border },
                selectedConversation?._id === item._id && !isMobile && desktopStyles.selectedConversationItem
            ], onPress: () => handleConversationSelect(item), children: [_jsxs(View, { style: styles.conversationAvatar, children: [conversationAvatar && conversationAvatar.startsWith('http') ? (_jsx(Image, { source: { uri: conversationAvatar }, style: {
                                width: 50,
                                height: 50,
                                borderRadius: 25,
                                resizeMode: 'cover'
                            }, onError: () => {
                                console.log('❌ Avatar image failed to load:', conversationAvatar);
                            }, onLoad: () => {
                                console.log('✅ Avatar image loaded successfully:', conversationAvatar);
                            } })) : (_jsx(View, { style: {
                                width: 50,
                                height: 50,
                                borderRadius: 25,
                                backgroundColor: colors.avatarBackground,
                                justifyContent: 'center',
                                alignItems: 'center'
                            }, children: _jsx(Text, { style: { color: colors.avatarText, fontSize: 18, fontWeight: 'bold' }, children: conversationName.charAt(0).toUpperCase() }) })), unreadCounts[item._id] > 0 && (_jsx(View, { style: {
                                position: 'absolute',
                                top: -2,
                                right: -2,
                                backgroundColor: '#FF3B30',
                                borderRadius: 10,
                                minWidth: 20,
                                height: 20,
                                justifyContent: 'center',
                                alignItems: 'center',
                                paddingHorizontal: 6,
                                borderWidth: 2,
                                borderColor: '#FFFFFF'
                            }, children: _jsx(Text, { style: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' }, children: unreadCounts[item._id] > 99 ? '99+' : unreadCounts[item._id] }) })), !item.isGroup && item.members.length === 2 && (() => {
                            const otherUserId = item.members.find(id => id !== userId);
                            if (otherUserId && onlineStatuses[otherUserId]) {
                                return (_jsx(View, { style: {
                                        position: 'absolute',
                                        bottom: 0,
                                        right: 0,
                                        backgroundColor: '#FFFFFF',
                                        borderRadius: 10,
                                        padding: 2
                                    }, children: _jsx(OnlineStatusBadge, { status: onlineStatuses[otherUserId].onlineStatus, size: 12 }) }));
                            }
                            return null;
                        })(), item.isGroup && (_jsx(View, { style: {
                                position: 'absolute',
                                bottom: 0,
                                right: 0,
                                backgroundColor: '#007AFF',
                                borderRadius: 10,
                                width: 20,
                                height: 20,
                                justifyContent: 'center',
                                alignItems: 'center'
                            }, children: _jsx(Text, { style: { color: '#FFFFFF', fontSize: 10, fontWeight: '600' }, children: "G" }) }))] }), _jsxs(View, { style: styles.conversationContent, children: [_jsxs(View, { style: styles.conversationHeader, children: [_jsx(Text, { style: [styles.conversationName, { color: colors.text }], numberOfLines: 1, children: conversationName }), _jsx(Text, { style: [styles.conversationTime, { color: colors.textSecondary }], children: formatTime(item.lastMessageAt || item.createdAt) })] }), _jsx(View, { style: { flexDirection: 'row', alignItems: 'center', flex: 1 }, children: typingStatuses[item._id] && typingStatuses[item._id].length > 0 ? (_jsx(View, { style: { flexDirection: 'row', alignItems: 'center', flex: 1 }, children: _jsx(TypingIndicator, { userNames: typingStatuses[item._id], visible: true }) })) : (_jsx(Text, { style: [styles.conversationPreview, { color: colors.textTertiary }], numberOfLines: 1, children: lastMessage })) })] })] }));
    };
    // renderChatArea is only used on desktop, so always use desktopStyles
    const renderChatArea = () => {
        if (!selectedConversation) {
            return (_jsxs(View, { style: [desktopStyles.emptyChatArea, { backgroundColor: colors.background }], children: [_jsx(Text, { style: [desktopStyles.emptyChatTitle, { color: colors.text }], children: "Ch\u1ECDn m\u1ED9t cu\u1ED9c tr\u00F2 chuy\u1EC7n" }), _jsx(Text, { style: [desktopStyles.emptyChatSubtitle, { color: colors.textSecondary }], children: "Ch\u1ECDn t\u1EEB danh s\u00E1ch b\u00EAn tr\u00E1i \u0111\u1EC3 b\u1EAFt \u0111\u1EA7u tr\u00F2 chuy\u1EC7n" })] }));
        }
        return (_jsxs(View, { style: [desktopStyles.chatArea, { backgroundColor: colors.background }], children: [_jsxs(View, { style: [desktopStyles.chatHeader, { backgroundColor: colors.headerBackground, borderBottomColor: colors.headerBorder }], children: [_jsxs(View, { style: desktopStyles.chatHeaderLeft, children: [opponentInfo?.avatar ? (_jsx(Image, { source: { uri: opponentInfo.avatar }, style: desktopStyles.chatAvatar })) : (_jsx(View, { style: desktopStyles.chatHeaderDefaultAvatar, children: _jsx(Text, { style: desktopStyles.chatHeaderDefaultAvatarText, children: opponentInfo?.name ? opponentInfo.name.charAt(0).toUpperCase() : 'U' }) })), _jsxs(View, { style: desktopStyles.chatHeaderInfo, children: [_jsx(Text, { style: [desktopStyles.chatName, { color: colors.text }], children: opponentInfo?.name || (selectedConversation.isGroup
                                                ? (selectedConversation.title || 'Group Chat')
                                                : (selectedConversation.title || 'Direct Message')) }), _jsx(Text, { style: [desktopStyles.chatStatus, { color: colors.textSecondary }], children: opponentInfo?.status || 'Hoạt động 5 phút trước' })] })] }), _jsxs(View, { style: desktopStyles.chatHeaderActions, children: [_jsx(TouchableOpacity, { style: desktopStyles.chatActionButton, children: _jsx(Text, { style: desktopStyles.chatActionIcon, children: "\uD83D\uDCDE" }) }), _jsx(TouchableOpacity, { style: desktopStyles.chatActionButton, children: _jsx(Text, { style: desktopStyles.chatActionIcon, children: "\uD83D\uDCF9" }) }), _jsx(TouchableOpacity, { style: desktopStyles.chatActionButton, onPress: () => setShowChatInfo(!showChatInfo), children: _jsx(Text, { style: desktopStyles.chatActionIcon, children: "\u2139\uFE0F" }) })] })] }), _jsx(ChatComponent, { conversationId: selectedConversation._id, name: selectedConversation.isGroup
                        ? (selectedConversation.title || 'Group Chat')
                        : (selectedConversation.title || 'Direct Message'), targetUserId: selectedConversation.members.find(id => id !== userId), showHeader: false, navigation: navigation })] }));
    };
    // renderChatInfo is only used on desktop, so always use desktopStyles
    const renderChatInfo = () => {
        if (!selectedConversation || !showChatInfo)
            return null;
        // Nếu đang hiển thị ShareLinkPanel
        if (showShareLinkPanel && selectedConversation.isGroup) {
            return (_jsx(ShareLinkPanel, { conversationId: selectedConversation._id, conversationName: selectedConversation.title || 'Group Chat', onClose: () => {
                    setShowShareLinkPanel(false);
                    setShowChatInfo(false);
                } }));
        }
        // Panel thông tin nhóm/cuộc trò chuyện
        return (_jsxs(View, { style: [
                desktopStyles.chatInfoPanel,
                { backgroundColor: colors.surface, borderLeftColor: colors.border, borderLeftWidth: 1 },
            ], children: [_jsxs(View, { style: [
                        desktopStyles.chatInfoHeader,
                        { backgroundColor: colors.headerBackground, borderBottomColor: colors.border },
                    ], children: [selectedConversation.isGroup ? (_jsxs(_Fragment, { children: [_jsx(Image, { source: {
                                        uri: selectedConversation.groupAvatar || 'https://via.placeholder.com/60/007AFF/FFFFFF?text=G'
                                    }, style: desktopStyles.chatInfoAvatar }), _jsx(Text, { style: [desktopStyles.chatInfoName, { color: colors.text }], children: selectedConversation.title || 'Group Chat' })] })) : (_jsxs(_Fragment, { children: [_jsx(Image, { source: {
                                        uri: opponentInfo?.avatar || 'https://via.placeholder.com/60/FF6B6B/FFFFFF?text=U'
                                    }, style: desktopStyles.chatInfoAvatar }), _jsx(Text, { style: [desktopStyles.chatInfoName, { color: colors.text }], children: opponentInfo?.name || selectedConversation.title || 'Direct Message' })] })), _jsxs(View, { style: desktopStyles.encryptionBadge, children: [_jsx(Text, { style: desktopStyles.encryptionIcon, children: "\uD83D\uDD12" }), _jsx(Text, { style: [desktopStyles.encryptionText, { color: colors.textSecondary }], children: "\u0110\u01B0\u1EE3c m\u00E3 h\u00F3a \u0111\u1EA7u cu\u1ED1i" })] }), _jsx(TouchableOpacity, { style: {
                                position: 'absolute',
                                right: 16,
                                top: 16,
                                backgroundColor: colors.surface,
                                padding: 6,
                                borderRadius: 16,
                            }, onPress: () => setShowChatInfo(false), children: _jsx(Text, { style: { color: colors.text }, children: "\u2715" }) })] }), _jsxs(View, { style: [desktopStyles.chatInfoActions, { backgroundColor: colors.surface, borderBottomColor: colors.border }], children: [selectedConversation.isGroup ? (_jsxs(TouchableOpacity, { style: desktopStyles.chatInfoAction, onPress: () => setShowShareLinkPanel(true), children: [_jsx(Text, { style: desktopStyles.chatInfoActionIcon, children: "\uD83D\uDC65" }), _jsx(Text, { style: [desktopStyles.chatInfoActionText, { color: colors.text }], children: "M\u1EDDi v\u00E0o nh\u00F3m" })] })) : (_jsxs(TouchableOpacity, { style: desktopStyles.chatInfoAction, children: [_jsx(Text, { style: desktopStyles.chatInfoActionIcon, children: "\uD83D\uDC64" }), _jsx(Text, { style: [desktopStyles.chatInfoActionText, { color: colors.text }], children: "Trang c\u00E1 nh\u00E2n" })] })), _jsxs(TouchableOpacity, { style: desktopStyles.chatInfoAction, children: [_jsx(Text, { style: desktopStyles.chatInfoActionIcon, children: "\uD83D\uDD15" }), _jsx(Text, { style: [desktopStyles.chatInfoActionText, { color: colors.text }], children: "T\u1EAFt th\u00F4ng b\u00E1o" })] }), _jsxs(TouchableOpacity, { style: desktopStyles.chatInfoAction, children: [_jsx(Text, { style: desktopStyles.chatInfoActionIcon, children: "\uD83D\uDD0D" }), _jsx(Text, { style: [desktopStyles.chatInfoActionText, { color: colors.text }], children: "T\u00ECm ki\u1EBFm" })] })] }), _jsxs(ScrollView, { style: [desktopStyles.chatInfoContent, { backgroundColor: colors.surface }], children: [_jsxs(TouchableOpacity, { style: [desktopStyles.chatInfoSection, { backgroundColor: colors.surface, borderBottomColor: colors.border }], children: [_jsx(Text, { style: [desktopStyles.chatInfoSectionTitle, { color: colors.text }], children: "Th\u00F4ng tin v\u1EC1 \u0111o\u1EA1n chat" }), _jsx(Text, { style: [desktopStyles.chatInfoSectionArrow, { color: colors.textSecondary }], children: "\u203A" })] }), _jsxs(TouchableOpacity, { style: [desktopStyles.chatInfoSection, { backgroundColor: colors.surface, borderBottomColor: colors.border }], children: [_jsx(Text, { style: [desktopStyles.chatInfoSectionTitle, { color: colors.text }], children: "T\u00F9y ch\u1EC9nh \u0111o\u1EA1n chat" }), _jsx(Text, { style: [desktopStyles.chatInfoSectionArrow, { color: colors.textSecondary }], children: "\u203A" })] }), _jsxs(TouchableOpacity, { style: [desktopStyles.chatInfoSection, { backgroundColor: colors.surface, borderBottomColor: colors.border }], children: [_jsx(Text, { style: [desktopStyles.chatInfoSectionTitle, { color: colors.text }], children: "File ph\u01B0\u01A1ng ti\u1EC7n & file" }), _jsx(Text, { style: [desktopStyles.chatInfoSectionArrow, { color: colors.textSecondary }], children: "\u203A" })] }), _jsxs(TouchableOpacity, { style: [desktopStyles.chatInfoSection, { backgroundColor: colors.surface, borderBottomColor: colors.border }], children: [_jsx(Text, { style: [desktopStyles.chatInfoSectionTitle, { color: colors.text }], children: "Quy\u1EC1n ri\u00EAng t\u01B0 v\u00E0 h\u1ED7 tr\u1EE3" }), _jsx(Text, { style: [desktopStyles.chatInfoSectionArrow, { color: colors.textSecondary }], children: "\u203A" })] })] })] }));
    };
    if (isMobile) {
        // Mobile Layout - Single Column with Gradient Background (Theme-aware)
        return (_jsx(SafeAreaView, { style: { flex: 1 }, children: _jsxs(LinearGradient, { colors: [colors.gradientStart, colors.gradientEnd], start: { x: 0, y: 0 }, end: { x: 1, y: 1 }, style: { flex: 1 }, children: [_jsxs(View, { style: mobileStyles.header, children: [_jsx(Text, { style: [mobileStyles.headerTitle, { color: colors.text }], children: "messenger" }), _jsxs(View, { style: mobileStyles.headerActions, children: [renderComposeButton(), _jsxs(TouchableOpacity, { style: mobileStyles.avatarButtonMobile, onPress: () => navigation.navigate('Settings'), children: [(() => {
                                                console.log('🔍 Mobile avatar render - userInfo:', userInfo);
                                                console.log('🔍 Mobile avatar render - avatar URL:', userInfo?.avatar);
                                                return null;
                                            })(), userInfo?.avatar ? (_jsx(Image, { source: { uri: userInfo.avatar }, style: conversationsStyles.avatarImage, onError: () => {
                                                    console.log('❌ Mobile avatar image failed to load:', userInfo.avatar);
                                                }, onLoad: () => {
                                                    console.log('✅ Mobile avatar image loaded successfully:', userInfo.avatar);
                                                } })) : (_jsx(View, { style: conversationsStyles.defaultAvatar, children: _jsx(Text, { style: conversationsStyles.defaultAvatarText, children: userInfo?.name ? userInfo.name.charAt(0).toUpperCase() : userInfo?.username ? userInfo.username.charAt(0).toUpperCase() : '👤' }) }))] })] })] }), _jsx(View, { style: mobileStyles.searchContainer, children: _jsx(TextInput, { style: [mobileStyles.searchInput, { color: colors.text }], placeholder: "T\u00ECm ki\u1EBFm tr\u00EAn Messenger", placeholderTextColor: colors.textSecondary, value: searchText, onChangeText: setSearchText }) }), _jsxs(View, { style: mobileStyles.tabsContainer, children: [_jsx(TouchableOpacity, { style: [mobileStyles.tab, selectedTab === 'all' && { borderBottomColor: colors.primary }], onPress: () => setSelectedTab('all'), children: _jsx(Text, { style: [mobileStyles.tabText, { color: colors.textSecondary }, selectedTab === 'all' && { color: colors.primary }], children: "T\u1EA5t c\u1EA3" }) }), _jsx(TouchableOpacity, { style: [mobileStyles.tab, selectedTab === 'unread' && { borderBottomColor: colors.primary }], onPress: () => setSelectedTab('unread'), children: _jsx(Text, { style: [mobileStyles.tabText, { color: colors.textSecondary }, selectedTab === 'unread' && { color: colors.primary }], children: "Ch\u01B0a \u0111\u1ECDc" }) }), _jsx(TouchableOpacity, { style: [mobileStyles.tab, selectedTab === 'groups' && { borderBottomColor: colors.primary }], onPress: () => setSelectedTab('groups'), children: _jsx(Text, { style: [mobileStyles.tabText, { color: colors.textSecondary }, selectedTab === 'groups' && { color: colors.primary }], children: "Nh\u00F3m" }) })] }), _jsx(FlatList, { data: getFilteredConversations(), renderItem: renderConversationItem, keyExtractor: (item) => item._id, refreshControl: _jsx(RefreshControl, { refreshing: refreshing, onRefresh: onRefresh }), style: mobileStyles.conversationsList }), renderSearchModal()] }) }));
    }
    // Desktop Layout - Three Columns
    return (_jsxs(SafeAreaView, { style: [themeStyles.container], children: [_jsxs(View, { style: [desktopStyles.desktopLayout, { backgroundColor: colors.background }], children: [_jsxs(View, { style: [desktopStyles.leftPanel, { backgroundColor: colors.surface }], children: [_jsxs(View, { style: [desktopStyles.desktopHeader, { backgroundColor: colors.headerBackground }], children: [_jsx(Text, { style: [desktopStyles.desktopHeaderTitle, { color: colors.headerText }], children: "\u0110o\u1EA1n chat" }), _jsxs(View, { style: desktopStyles.desktopHeaderActions, children: [_jsxs(TouchableOpacity, { style: desktopStyles.avatarButton, onPress: () => navigation.navigate('Settings'), children: [(() => {
                                                        console.log('🔍 Desktop avatar render - userInfo:', userInfo);
                                                        console.log('🔍 Desktop avatar render - avatar URL:', userInfo?.avatar);
                                                        return null;
                                                    })(), userInfo?.avatar ? (_jsx(Image, { source: { uri: userInfo.avatar }, style: conversationsStyles.avatarImage, onError: () => {
                                                            console.log('❌ Avatar image failed to load:', userInfo.avatar);
                                                        }, onLoad: () => {
                                                            console.log('✅ Avatar image loaded successfully:', userInfo.avatar);
                                                        } })) : (_jsx(View, { style: conversationsStyles.defaultAvatar, children: _jsx(Text, { style: conversationsStyles.defaultAvatarText, children: userInfo?.name ? userInfo.name.charAt(0).toUpperCase() : userInfo?.username ? userInfo.username.charAt(0).toUpperCase() : '👤' }) }))] }), renderComposeButton()] })] }), _jsx(View, { style: desktopStyles.searchContainer, children: _jsx(TextInput, { style: [desktopStyles.searchInput, { backgroundColor: colors.inputBackground, color: colors.inputText, borderColor: colors.inputBorder }], placeholder: "T\u00ECm ki\u1EBFm tr\u00EAn Messenger", placeholderTextColor: colors.inputPlaceholder, value: searchText, onChangeText: setSearchText }) }), _jsxs(View, { style: [desktopStyles.tabsContainer, { backgroundColor: colors.tabBackground }], children: [_jsx(TouchableOpacity, { style: [
                                            desktopStyles.tab,
                                            selectedTab === 'all' && { backgroundColor: colors.tabActive }
                                        ], onPress: () => setSelectedTab('all'), children: _jsx(Text, { style: [
                                                desktopStyles.tabText,
                                                { color: selectedTab === 'all' ? colors.buttonText : colors.tabInactive }
                                            ], children: "T\u1EA5t c\u1EA3" }) }), _jsx(TouchableOpacity, { style: [
                                            desktopStyles.tab,
                                            selectedTab === 'unread' && { backgroundColor: colors.tabActive }
                                        ], onPress: () => setSelectedTab('unread'), children: _jsx(Text, { style: [
                                                desktopStyles.tabText,
                                                { color: selectedTab === 'unread' ? colors.buttonText : colors.tabInactive }
                                            ], children: "Ch\u01B0a \u0111\u1ECDc" }) }), _jsx(TouchableOpacity, { style: [
                                            desktopStyles.tab,
                                            selectedTab === 'groups' && { backgroundColor: colors.tabActive }
                                        ], onPress: () => setSelectedTab('groups'), children: _jsx(Text, { style: [
                                                desktopStyles.tabText,
                                                { color: selectedTab === 'groups' ? colors.buttonText : colors.tabInactive }
                                            ], children: "Nh\u00F3m" }) })] }), _jsx(FlatList, { data: getFilteredConversations(), renderItem: renderConversationItem, keyExtractor: (item) => item._id, refreshControl: _jsx(RefreshControl, { refreshing: refreshing, onRefresh: onRefresh }), style: desktopStyles.conversationsList })] }), _jsx(View, { style: [desktopStyles.centerPanel, { backgroundColor: colors.background }], children: renderChatArea() }), renderChatInfo()] }), renderSearchModal()] }));
}
