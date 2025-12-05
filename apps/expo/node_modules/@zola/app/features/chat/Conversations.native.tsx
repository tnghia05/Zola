import React, { useEffect, useState, useCallback } from 'react';
import { 
	View, 
	Text, 
	FlatList, 
	TouchableOpacity, 
	RefreshControl, 
	StyleSheet, 
	Alert, 
	TextInput,
	ScrollView,
	Image,
	Dimensions,
	SafeAreaView,
	Linking,
	Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import AsyncStorage from '@react-native-async-storage/async-storage';

import { 
	getConversations, 
	Conversation, 
	api, 
	setAuthToken, 
	logout, 
	searchUsers, 
	createConversationWithUser,
	createGroupConversation,
	getUnreadCount,
	getOnlineUsers,
	getMessages,
	markAsRead,
	joinConversationByInvite
} from '../api';
import { disconnectSocket, getSocket } from '../socket';
import { OnlineStatusBadge } from '../components/OnlineStatusBadge';
import { TypingIndicator } from '../components/TypingIndicator';
import { conversationsStyles } from '../styles/conversations.styles';
import { mobileStyles } from '../styles/conversations.mobile.styles';
import { desktopStyles } from '../styles/conversations.desktop.styles';
import { ChatComponent } from './Chat';
import { useTheme } from '../contexts/ThemeContext';
import { createThemeStyles } from '../styles/theme.styles';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { ShareLinkPanel } from '../components/ShareLinkPanel';

const { width } = Dimensions.get('window');

type RootStackParamList = {
	Conversations: undefined;
	Settings: undefined;
	Chat: { conversationId: string; name: string; targetUserId?: string };
	Call: { callId: string; conversationId: string; isIncoming?: boolean };
	Login: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'Conversations'>;

export default function ConversationsScreen({ navigation }: Props) {
	const { colors } = useTheme();
	const themeStyles = createThemeStyles(colors);
	const [data, setData] = useState<Conversation[]>([]);
	const [refreshing, setRefreshing] = useState(false);
	const [searchText, setSearchText] = useState('');
	const [selectedTab, setSelectedTab] = useState('all');
	const [isMobile, setIsMobile] = useState(width < 768);
	const [userInfo, setUserInfo] = useState<{ name: string; email: string; username: string; avatar?: string } | null>(null);
	const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
	const [pendingInviteConversationId, setPendingInviteConversationId] = useState<string | null>(null);
	const [showChatInfo, setShowChatInfo] = useState(false);
	const [showShareLinkPanel, setShowShareLinkPanel] = useState(false);
	
	// Select platform-specific styles based on screen width
	const platformStyles = isMobile ? mobileStyles : desktopStyles;
	
	// User info state
	const [userId, setUserId] = useState<string | null>(null);
	
	// Opponent info state
	const [opponentInfo, setOpponentInfo] = useState<{
		name: string;
		avatar?: string;
		status: string;
	} | null>(null);
	
	// Conversation participants info state
	const [conversationParticipants, setConversationParticipants] = useState<{
		[conversationId: string]: {
			name: string;
			avatar?: string;
			lastMessage?: string;
		}
	}>({});

	// New state for messaging features
	const [unreadCounts, setUnreadCounts] = useState<{ [conversationId: string]: number }>({});
	const [onlineStatuses, setOnlineStatuses] = useState<{ [userId: string]: { onlineStatus: string; lastSeen?: Date } }>({});
	const [typingStatuses, setTypingStatuses] = useState<{ [conversationId: string]: string[] }>({});
	
	const [showSearchModal, setShowSearchModal] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');
	const [searchResults, setSearchResults] = useState<any[]>([]);
	const [isSearching, setIsSearching] = useState(false);
	const [searchError, setSearchError] = useState<string | null>(null);
	const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
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
					} else {
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
		} catch (error) {
			console.error('Error loading conversations:', error);
		} finally {
			setRefreshing(false);
		}
	};

	// Load unread counts for all conversations
	const loadUnreadCounts = async (conversations: Conversation[]) => {
		const counts: { [conversationId: string]: number } = {};
		for (const conv of conversations) {
			try {
				const { unreadCount } = await getUnreadCount(conv._id);
				counts[conv._id] = unreadCount;
			} catch (error) {
				console.error(`Failed to load unread count for ${conv._id}:`, error);
				counts[conv._id] = 0;
			}
		}
		setUnreadCounts(counts);
	};

	// Load online statuses for users in conversations
	const loadOnlineStatuses = async (conversations: Conversation[]) => {
		const allUserIds = new Set<string>();
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
			} catch (error) {
				console.error('Failed to load online statuses:', error);
			}
		}
	};
	
	// Load participant info for all conversations
	const loadConversationParticipants = async (conversations: Conversation[]) => {
		const participants: { [conversationId: string]: { name: string; avatar?: string; lastMessage?: string } } = {};
		
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
								} else if (lastMsg.type === 'image') {
									lastMessageText = '📷 Image';
								} else if (lastMsg.type === 'file') {
									lastMessageText = '📎 File';
								}
							}
						} catch (error) {
							console.log('Could not load last message:', error);
						}

						participants[conversation._id] = {
							name: opponent.user.name || opponent.user.username || 'Unknown User',
							avatar: opponent.user.avatar,
							lastMessage: lastMessageText
						};
					} else {
						participants[conversation._id] = {
							name: conversation.title || 'Direct Message',
							avatar: undefined,
							lastMessage: 'Chưa có tin nhắn'
						};
					}
				} catch (error) {
					console.log('Could not fetch participant info for conversation:', conversation._id);
					participants[conversation._id] = {
						name: conversation.title || 'Direct Message',
						avatar: undefined,
							lastMessage: 'Chưa có tin nhắn'
					};
				}
			} else {
				// Get last message for group
				let lastMessageText = 'Chưa có tin nhắn';
				try {
					const messages = await getMessages(conversation._id);
					if (messages && messages.length > 0) {
						const lastMsg = messages[messages.length - 1];
						if (lastMsg.text) {
							lastMessageText = lastMsg.text;
						} else if (lastMsg.type === 'image') {
							lastMessageText = '📷 Image';
						} else if (lastMsg.type === 'file') {
							lastMessageText = '📎 File';
						}
					}
				} catch (error) {
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
			} catch (apiError) {
				console.log('⚠️ Could not fetch fresh user profile:', apiError);
			}
		} catch (error) {
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
			} else {
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
					} catch (e) {
						console.log('Could not decode token:', e);
					}
				}
			}
		} catch (error) {
			console.error('Error loading user ID:', error);
		}
	}, []);

	useFocusEffect(
		useCallback(() => {
			loadUserInfo();
			loadUserId(); // Load userId when screen focuses
		}, [loadUserInfo, loadUserId])
	);

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
			
			let inviteCode: string | null = null;
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
				} catch (error: any) {
					console.error('Join via invite error:', error);
					const message =
						error?.response?.data?.error ||
						error?.message ||
						'Không thể tham gia nhóm bằng link mời.';
					Alert.alert('Không thể tham gia', message);
				} finally {
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
		if (!socket) return;

		// Listen for conversation updates
		const handleConversationUpdate = async (data: { conversationId: string; lastMessageAt: Date }) => {
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
		const handleTypingStart = (data: { conversationId: string; userId: string; userName?: string }) => {
			setTypingStatuses((prev) => {
				const current = prev[data.conversationId] || [];
				if (!current.includes(data.userId)) {
					return { ...prev, [data.conversationId]: [...current, data.userId] };
				}
				return prev;
			});
		};

		const handleTypingStop = (data: { conversationId: string; userId: string }) => {
			setTypingStatuses((prev) => {
				const current = prev[data.conversationId] || [];
				return { ...prev, [data.conversationId]: current.filter(id => id !== data.userId) };
			});
		};

		// Listen for online status updates
		const handleUserStatus = (data: { userId: string; status: string; lastSeen?: Date }) => {
			setOnlineStatuses((prev) => ({
				...prev,
				[data.userId]: {
					onlineStatus: data.status,
					lastSeen: data.lastSeen
				}
			}));
		};

		// Listen for new messages (to update last message and unread count)
		const handleNewMessage = async (message: any) => {
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
	const loadOpponentInfo = async (conversation: Conversation) => {
		if (!conversation || !userId) return;
		
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
					} catch (error) {
						console.log('Could not fetch opponent info from API:', error);
					}
					
					// Fallback: use conversation title or generic name
					setOpponentInfo({
						name: conversation.title || 'Direct Message',
						avatar: undefined,
						status: 'Hoạt động 5 phút trước'
					});
			}
		} else {
				// For group chats, use group info
				setOpponentInfo({
					name: conversation.title || 'Group Chat',
					avatar: undefined,
					status: `${conversation.members.length} thành viên`
				});
			}
		} catch (error) {
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
						} catch (error) {
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

	const formatTime = (dateString: string) => {
		const date = new Date(dateString);
		const now = new Date();
		const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
		
		if (diffInMinutes < 1) return 'Vừa xong';
		if (diffInMinutes < 60) return `${diffInMinutes} phút`;
		if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} giờ`;
		if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)} ngày`;
		return date.toLocaleDateString('vi-VN');
	};





	const getFilteredConversations = () => {
		let filtered = data.filter(conversation => 
			(conversation.title || 'Untitled').toLowerCase().includes(searchText.toLowerCase())
		);

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
	const handleSearchUsers = async (query: string) => {
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
		} catch (error: any) {
			console.error('Search error:', error);
			console.error('Error response:', error.response?.data);
			console.error('Error status:', error.response?.status);
			
			let errorMessage = 'Không thể tìm kiếm người dùng';
			if (error.response?.status === 401) {
				errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
			} else if (error.response?.status === 400) {
				errorMessage = 'Truy vấn tìm kiếm không hợp lệ.';
			} else if (error.response?.data?.error) {
				errorMessage = error.response.data.error;
			}
			
			setSearchError(errorMessage);
			setSearchResults([]);
		} finally {
			setIsSearching(false);
		}
	};

		// ... existing functions ...

	// Toggle user selection
	const toggleUserSelection = (userId: string) => {
		setSelectedUsers(prev => {
			if (prev.includes(userId)) {
				return prev.filter(id => id !== userId);
			} else {
				return [...prev, userId];
			}
		});
	};

	// Render search modal
	const renderSearchModal = () => {
		if (!showSearchModal) return null;

		const hasSelectedUsers = selectedUsers.length > 0;
		const isGroupMode = selectedUsers.length >= 2;

		// Get selected users data
		const selectedUsersData = searchResults.filter(u => selectedUsers.includes(u._id));
		const overlayStyles = [
			themeStyles.modalOverlay,
			{
				position: 'absolute' as const,
				top: 0,
				left: 0,
				right: 0,
				bottom: 0,
				zIndex: 9999,
				justifyContent: 'flex-start' as const,
				paddingTop: isMobile ? 80 : 120,
				paddingBottom: isMobile ? 40 : 80,
				backgroundColor: 'rgba(15, 23, 42, 0.45)',
			},
		];

		return (
			<View style={overlayStyles}>
				<View style={[themeStyles.modalContainer, { maxHeight: '85%', maxWidth: isMobile ? '95%' : 500, zIndex: 10000 }]}>
					{/* Header */}
					<View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
						<Text style={[themeStyles.modalTitle, { fontSize: 20, fontWeight: '600' }]}>
							{isGroupMode ? 'Tạo nhóm mới' : hasSelectedUsers ? 'Chọn thành viên' : 'Tạo chat mới'}
						</Text>
						<TouchableOpacity 
							style={{ padding: 8, borderRadius: 20, backgroundColor: colors.surface }}
							onPress={() => {
								setShowSearchModal(false);
								setSearchQuery('');
								setSearchResults([]);
								setSearchError(null);
								setSelectedUsers([]);
								setGroupName('');
							}}
						>
							<Text style={[themeStyles.text, { fontSize: 20, color: colors.textSecondary }]}>✕</Text>
						</TouchableOpacity>
					</View>
					
					{/* Search Input */}
					<View style={{ marginBottom: 16 }}>
						<TextInput
							style={[themeStyles.input, { fontSize: 15, paddingVertical: 12 }]}
							placeholder="Tìm kiếm theo tên, email hoặc username..."
							placeholderTextColor={colors.inputPlaceholder}
							value={searchQuery}
							onChangeText={setSearchQuery}
							autoFocus
						/>
					</View>

					{/* Selected Users List */}
					{hasSelectedUsers && (
						<View style={{ marginBottom: 16 }}>
							<View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
								<Text style={[themeStyles.text, { fontSize: 14, fontWeight: '500', color: colors.textSecondary }]}>
									Đã chọn ({selectedUsers.length})
								</Text>
							</View>
							<ScrollView 
								horizontal 
								showsHorizontalScrollIndicator={false}
								style={{ marginBottom: 8 }}
							>
								<View style={{ flexDirection: 'row', gap: 8 }}>
									{selectedUsersData.map((user) => (
										<View 
											key={user._id}
											style={{
												flexDirection: 'row',
												alignItems: 'center',
												backgroundColor: colors.primary + '15',
												padding: 8,
												borderRadius: 20,
												borderWidth: 1,
												borderColor: colors.primary + '40',
												gap: 8
											}}
										>
											{user.avatar ? (
												<Image 
													source={{ uri: user.avatar }} 
													style={{ width: 24, height: 24, borderRadius: 12 }}
												/>
											) : (
												<View style={{
													width: 24,
													height: 24,
													borderRadius: 12,
													backgroundColor: colors.primary,
													justifyContent: 'center',
													alignItems: 'center'
												}}>
													<Text style={{ color: colors.buttonText, fontSize: 12, fontWeight: '600' }}>
														{user.name.charAt(0).toUpperCase()}
													</Text>
												</View>
											)}
											<Text 
												style={{ 
													color: colors.text, 
													fontSize: 13, 
													fontWeight: '500',
													maxWidth: 100
												}}
												numberOfLines={1}
											>
												{user.name}
											</Text>
											<TouchableOpacity
												onPress={() => toggleUserSelection(user._id)}
												style={{
													width: 20,
													height: 20,
													borderRadius: 10,
													backgroundColor: colors.textSecondary + '30',
													justifyContent: 'center',
													alignItems: 'center'
												}}
											>
												<Text style={{ color: colors.text, fontSize: 12 }}>✕</Text>
											</TouchableOpacity>
										</View>
									))}
								</View>
							</ScrollView>
							{selectedUsers.length === 1 && (
								<Text style={[themeStyles.text, { fontSize: 12, color: colors.textSecondary, fontStyle: 'italic' }]}>
									💡 Chọn thêm người để tạo nhóm
								</Text>
							)}
						</View>
					)}

					{/* Group name input - only show when creating group (2+ users) */}
					{isGroupMode && (
						<View style={{ marginBottom: 16 }}>
							<Text style={[themeStyles.text, { fontSize: 14, fontWeight: '500', marginBottom: 8, color: colors.textSecondary }]}>
								Tên nhóm (tùy chọn)
							</Text>
							<TextInput
								style={[themeStyles.input, { fontSize: 15, paddingVertical: 12 }]}
								placeholder="Nhập tên nhóm..."
								placeholderTextColor={colors.inputPlaceholder}
								value={groupName}
								onChangeText={setGroupName}
							/>
						</View>
					)}
					
					{/* Hint text when no users selected */}
					{!hasSelectedUsers && searchQuery && searchResults.length > 0 && (
						<View style={{ marginBottom: 12, padding: 12, backgroundColor: colors.surface, borderRadius: 8, borderWidth: 1, borderColor: colors.border }}>
							<Text style={[themeStyles.text, { fontSize: 13, color: colors.textSecondary, lineHeight: 18 }]}>
								💡 Chọn user để tạo chat 1-1, hoặc chọn nhiều user để tạo nhóm
							</Text>
						</View>
					)}

					{/* Search Results */}
					<View style={[conversationsStyles.searchResults, { maxHeight: 300, marginBottom: 16 }]}>
						{isSearching ? (
							<View style={conversationsStyles.loadingContainer}>
								<Text style={conversationsStyles.loadingText}>Đang tìm...</Text>
							</View>
						) : searchError ? (
							<View style={conversationsStyles.errorContainer}>
								<Text style={conversationsStyles.errorText}>{searchError}</Text>
							</View>
						) : searchResults.length === 0 && searchQuery ? (
							<View style={conversationsStyles.noResultsContainer}>
								<Text style={conversationsStyles.noResultsText}>Không tìm thấy người dùng nào</Text>
							</View>
						) : searchResults.length > 0 ? (
							<FlatList
								data={searchResults}
								keyExtractor={(item) => item._id}
								renderItem={({ item }) => {
									const isSelected = selectedUsers.includes(item._id);
									return (
										<TouchableOpacity 
											style={[
												conversationsStyles.searchResultItem,
												{
													backgroundColor: isSelected ? colors.primary + '15' : colors.surface,
													borderWidth: 1,
													borderColor: isSelected ? colors.primary + '40' : colors.border,
													borderRadius: 12,
													padding: 12,
													marginBottom: 8
												}
											]}
											onPress={() => {
												toggleUserSelection(item._id);
											}}
										>
											{/* Checkbox - always visible */}
											<View style={{
												width: 24,
												height: 24,
												borderRadius: 12,
												borderWidth: 2,
												borderColor: isSelected ? colors.primary : colors.border,
												backgroundColor: isSelected ? colors.primary : 'transparent',
												justifyContent: 'center',
												alignItems: 'center',
												marginRight: 12
											}}>
												{isSelected && (
													<Text style={{ color: colors.buttonText, fontSize: 14, fontWeight: 'bold' }}>✓</Text>
												)}
											</View>
											{/* Avatar */}
											<View style={conversationsStyles.searchResultAvatar}>
												{item.avatar ? (
													<Image 
														source={{ uri: item.avatar }} 
														style={conversationsStyles.searchResultAvatarImage}
													/>
												) : (
													<View style={conversationsStyles.searchResultDefaultAvatar}>
														<Text style={conversationsStyles.searchResultDefaultAvatarText}>
															{item.name.charAt(0).toUpperCase()}
														</Text>
													</View>
												)}
											</View>
											{/* User Info */}
											<View style={[conversationsStyles.searchResultInfo, { flex: 1 }]}>
												<Text style={[conversationsStyles.searchResultName, { fontWeight: '500' }]}>{item.name}</Text>
												<Text style={[conversationsStyles.searchResultEmail, { fontSize: 12 }]}>{item.email}</Text>
												{item.username && (
													<Text style={[conversationsStyles.searchResultUsername, { fontSize: 12 }]}>@{item.username}</Text>
												)}
											</View>
										</TouchableOpacity>
									);
								}}
							/>
						) : null}
					</View>

					{/* Action buttons */}
					{hasSelectedUsers && (
						<View style={{ 
							flexDirection: 'row', 
							gap: 12, 
							paddingTop: 16,
							borderTopWidth: 1,
							borderTopColor: colors.border
						}}>
							{selectedUsers.length > 1 ? (
								<TouchableOpacity
									style={{
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
									}}
									onPress={handleCreateGroup}
								>
									<Text style={{ color: colors.buttonText, fontSize: 16, fontWeight: '600' }}>
										{groupName.trim() ? `Tạo nhóm "${groupName.trim()}"` : 'Tạo nhóm'}
									</Text>
								</TouchableOpacity>
							) : (
								<TouchableOpacity
									style={{
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
									}}
									onPress={() => {
										const user = searchResults.find(u => u._id === selectedUsers[0]);
										if (user) {
											handleCreateConversation(user);
										}
									}}
								>
									<Text style={{ color: colors.buttonText, fontSize: 16, fontWeight: '600' }}>
										Tạo chat
									</Text>
								</TouchableOpacity>
							)}
							<TouchableOpacity
								style={{
									paddingHorizontal: 20,
									paddingVertical: 16,
									borderRadius: 12,
									alignItems: 'center',
									justifyContent: 'center',
									borderWidth: 1,
									borderColor: colors.border,
									backgroundColor: colors.surface
								}}
								onPress={() => {
									setSelectedUsers([]);
									setGroupName('');
								}}
							>
								<Text style={{ color: colors.text, fontSize: 16, fontWeight: '500' }}>Hủy</Text>
							</TouchableOpacity>
						</View>
					)}
				</View>
			</View>
		);
	};

	// ... existing code ...

	// Tạo conversation với user
	const handleCreateConversation = async (user: any) => {
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
		} catch (error) {
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
			const conversation = await createGroupConversation(
				selectedUsers,
				groupName.trim() || undefined
			);
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
		} catch (error) {
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
		return (
			<TouchableOpacity 
				style={styles.composeButton}
				onPress={() => setShowSearchModal(true)}
			>
				<Text style={[styles.headerIcon, { color: colors.text }]}>✏️</Text>
			</TouchableOpacity>
		);
	};

	const handleConversationSelect = async (conversation: Conversation) => {
		// Clear unread count when opening conversation
		try {
			await markAsRead(conversation._id);
			setUnreadCounts((prev) => ({ ...prev, [conversation._id]: 0 }));
		} catch (error) {
			console.error('Failed to mark as read:', error);
		}

		if (isMobile) {
			// For mobile, navigate to Chat screen
			navigation.navigate('Chat', {
				conversationId: conversation._id,
				name: conversation.title || 'Direct Message',
				targetUserId: conversation.members.find(id => id !== userId)
			});
		} else {
			// For desktop, show in same screen
			setSelectedConversation(conversation);
			setShowChatInfo(true);
			setShowShareLinkPanel(false); // Reset share link panel when switching conversations
			
			// Load opponent info
			await loadOpponentInfo(conversation);
		}
	};

	const renderConversationItem = ({ item }: { item: Conversation }) => {
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
		} else {
			// Fallback for when participant info is not loaded yet
			if (item.isGroup) {
				conversationName = item.title || 'Group Chat';
				conversationAvatar = 'https://via.placeholder.com/50/007AFF/FFFFFF?text=G';
				lastMessage = 'Chưa có tin nhắn';
			} else {
				conversationName = item.title || 'Direct Message';
				conversationAvatar = 'https://via.placeholder.com/50/FF6B6B/FFFFFF?text=U';
				lastMessage = 'Chưa có tin nhắn';
			}
		}

		const styles = isMobile ? mobileStyles : desktopStyles;
		
		return (
				<TouchableOpacity 
				style={[
					styles.conversationItem,
					isMobile 
						? { borderBottomColor: 'rgba(255, 255, 255, 0.08)' } 
						: { backgroundColor: colors.surface, borderBottomColor: colors.border },
					selectedConversation?._id === item._id && !isMobile && desktopStyles.selectedConversationItem
				]}
					onPress={() => handleConversationSelect(item)}
				>
				<View style={styles.conversationAvatar}>
					{conversationAvatar && conversationAvatar.startsWith('http') ? (
						<Image 
							source={{ uri: conversationAvatar }} 
							style={{ 
								width: 50, 
								height: 50, 
								borderRadius: 25,
								resizeMode: 'cover'
							}}
							onError={() => {
								console.log('❌ Avatar image failed to load:', conversationAvatar);
							}}
							onLoad={() => {
								console.log('✅ Avatar image loaded successfully:', conversationAvatar);
							}}
						/>
					) : (
						<View style={{ 
							width: 50, 
							height: 50, 
							borderRadius: 25,
							backgroundColor: colors.avatarBackground, 
							justifyContent: 'center', 
							alignItems: 'center' 
						}}>
							<Text style={{ color: colors.avatarText, fontSize: 18, fontWeight: 'bold' }}>
								{conversationName.charAt(0).toUpperCase()}
							</Text>
						</View>
					)}
					{/* Unread badge */}
					{unreadCounts[item._id] > 0 && (
						<View style={{
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
						}}>
							<Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '600' }}>
								{unreadCounts[item._id] > 99 ? '99+' : unreadCounts[item._id]}
							</Text>
						</View>
					)}
					{/* Online status badge for 1-1 chats */}
					{!item.isGroup && item.members.length === 2 && (() => {
						const otherUserId = item.members.find(id => id !== userId);
						if (otherUserId && onlineStatuses[otherUserId]) {
							return (
								<View style={{
									position: 'absolute',
									bottom: 0,
									right: 0,
									backgroundColor: '#FFFFFF',
									borderRadius: 10,
									padding: 2
								}}>
									<OnlineStatusBadge 
										status={onlineStatuses[otherUserId].onlineStatus as 'online' | 'offline' | 'away'} 
										size={12}
									/>
								</View>
							);
						}
						return null;
					})()}
					{/* Group indicator */}
					{item.isGroup && (
						<View style={{
							position: 'absolute',
							bottom: 0,
							right: 0,
							backgroundColor: '#007AFF',
							borderRadius: 10,
							width: 20,
							height: 20,
							justifyContent: 'center',
							alignItems: 'center'
						}}>
							<Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '600' }}>G</Text>
						</View>
					)}
				</View>
				<View style={styles.conversationContent}>
					<View style={styles.conversationHeader}>
						<Text style={[styles.conversationName, { color: colors.text }]} numberOfLines={1}>
								{conversationName}
							</Text>
						<Text style={[styles.conversationTime, { color: colors.textSecondary }]}>
								{formatTime(item.lastMessageAt || item.createdAt)}
							</Text>
						</View>
					<View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
						{typingStatuses[item._id] && typingStatuses[item._id].length > 0 ? (
							<View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
								<TypingIndicator 
									userNames={typingStatuses[item._id]} 
									visible={true}
								/>
							</View>
						) : (
					<Text style={[styles.conversationPreview, { color: colors.textTertiary }]} numberOfLines={1}>
							{lastMessage}
						</Text>
						)}
					</View>
					</View>
				</TouchableOpacity>
		);
	};

	// renderChatArea is only used on desktop, so always use desktopStyles
	const renderChatArea = () => {
		if (!selectedConversation) {
		return (
				<View style={[desktopStyles.emptyChatArea, { backgroundColor: colors.background }]}>
					<Text style={[desktopStyles.emptyChatTitle, { color: colors.text }]}>Chọn một cuộc trò chuyện</Text>
					<Text style={[desktopStyles.emptyChatSubtitle, { color: colors.textSecondary }]}>
						Chọn từ danh sách bên trái để bắt đầu trò chuyện
					</Text>
				</View>
			);
		}

		return (
			<View style={[desktopStyles.chatArea, { backgroundColor: colors.background }]}>
				{/* Chat Header */}
				<View style={[desktopStyles.chatHeader, { backgroundColor: colors.headerBackground, borderBottomColor: colors.headerBorder }]}>
					<View style={desktopStyles.chatHeaderLeft}>
						{opponentInfo?.avatar ? (
								<Image 
								source={{ uri: opponentInfo.avatar }} 
								style={desktopStyles.chatAvatar}
								/>
							) : (
							<View style={desktopStyles.chatHeaderDefaultAvatar}>
								<Text style={desktopStyles.chatHeaderDefaultAvatarText}>
									{opponentInfo?.name ? opponentInfo.name.charAt(0).toUpperCase() : 'U'}
									</Text>
								</View>
						)}
						<View style={desktopStyles.chatHeaderInfo}>
							<Text style={[desktopStyles.chatName, { color: colors.text }]}>
								{opponentInfo?.name || (selectedConversation.isGroup 
									? (selectedConversation.title || 'Group Chat')
									: (selectedConversation.title || 'Direct Message')
								)}
							</Text>
							<Text style={[desktopStyles.chatStatus, { color: colors.textSecondary }]}>
								{opponentInfo?.status || 'Hoạt động 5 phút trước'}
							</Text>
						</View>
					</View>
					<View style={desktopStyles.chatHeaderActions}>
						<TouchableOpacity style={desktopStyles.chatActionButton}>
							<Text style={desktopStyles.chatActionIcon}>📞</Text>
						</TouchableOpacity>
						<TouchableOpacity style={desktopStyles.chatActionButton}>
							<Text style={desktopStyles.chatActionIcon}>📹</Text>
						</TouchableOpacity>
							<TouchableOpacity 
							style={desktopStyles.chatActionButton}
							onPress={() => setShowChatInfo(!showChatInfo)}
						>
							<Text style={desktopStyles.chatActionIcon}>ℹ️</Text>
							</TouchableOpacity>
					</View>
				</View>

				{/* Chat Component */}
				<ChatComponent
					conversationId={selectedConversation._id}
					name={selectedConversation.isGroup 
						? (selectedConversation.title || 'Group Chat')
						: (selectedConversation.title || 'Direct Message')
					}
					targetUserId={selectedConversation.members.find(id => id !== userId)}
					showHeader={false}
					navigation={navigation}
				/>
			</View>
		);
	};

	// renderChatInfo is only used on desktop, so always use desktopStyles
	const renderChatInfo = () => {
		if (!selectedConversation || !showChatInfo) return null;

		// Nếu đang hiển thị ShareLinkPanel
		if (showShareLinkPanel && selectedConversation.isGroup) {
			return (
				<ShareLinkPanel
					conversationId={selectedConversation._id}
					conversationName={selectedConversation.title || 'Group Chat'}
					onClose={() => {
						setShowShareLinkPanel(false);
						setShowChatInfo(false);
					}}
				/>
			);
		}

		// Panel thông tin nhóm/cuộc trò chuyện
		return (
			<View
				style={[
					desktopStyles.chatInfoPanel,
					{ backgroundColor: colors.surface, borderLeftColor: colors.border, borderLeftWidth: 1 },
				]}
			>
				<View
					style={[
						desktopStyles.chatInfoHeader,
						{ backgroundColor: colors.headerBackground, borderBottomColor: colors.border },
					]}
				>
					{selectedConversation.isGroup ? (
						<>
							<Image 
								source={{ 
									uri: selectedConversation.groupAvatar || 'https://via.placeholder.com/60/007AFF/FFFFFF?text=G'
								}} 
								style={desktopStyles.chatInfoAvatar}
							/>
							<Text style={[desktopStyles.chatInfoName, { color: colors.text }]}>
								{selectedConversation.title || 'Group Chat'}
							</Text>
						</>
					) : (
						<>
							<Image 
								source={{ 
									uri: opponentInfo?.avatar || 'https://via.placeholder.com/60/FF6B6B/FFFFFF?text=U'
								}} 
								style={desktopStyles.chatInfoAvatar}
							/>
							<Text style={[desktopStyles.chatInfoName, { color: colors.text }]}>
								{opponentInfo?.name || selectedConversation.title || 'Direct Message'}
							</Text>
						</>
					)}
					<View style={desktopStyles.encryptionBadge}>
						<Text style={desktopStyles.encryptionIcon}>🔒</Text>
						<Text style={[desktopStyles.encryptionText, { color: colors.textSecondary }]}>Được mã hóa đầu cuối</Text>
					</View>
					<TouchableOpacity
						style={{
							position: 'absolute',
							right: 16,
							top: 16,
							backgroundColor: colors.surface,
							padding: 6,
							borderRadius: 16,
						}}
						onPress={() => setShowChatInfo(false)}
					>
						<Text style={{ color: colors.text }}>✕</Text>
					</TouchableOpacity>
				</View>

				<View style={[desktopStyles.chatInfoActions, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
					{selectedConversation.isGroup ? (
						<TouchableOpacity 
							style={desktopStyles.chatInfoAction}
							onPress={() => setShowShareLinkPanel(true)}
						>
							<Text style={desktopStyles.chatInfoActionIcon}>👥</Text>
							<Text style={[desktopStyles.chatInfoActionText, { color: colors.text }]}>Mời vào nhóm</Text>
						</TouchableOpacity>
					) : (
						<TouchableOpacity style={desktopStyles.chatInfoAction}>
							<Text style={desktopStyles.chatInfoActionIcon}>👤</Text>
							<Text style={[desktopStyles.chatInfoActionText, { color: colors.text }]}>Trang cá nhân</Text>
						</TouchableOpacity>
					)}
					<TouchableOpacity style={desktopStyles.chatInfoAction}>
						<Text style={desktopStyles.chatInfoActionIcon}>🔕</Text>
						<Text style={[desktopStyles.chatInfoActionText, { color: colors.text }]}>Tắt thông báo</Text>
					</TouchableOpacity>
					<TouchableOpacity style={desktopStyles.chatInfoAction}>
						<Text style={desktopStyles.chatInfoActionIcon}>🔍</Text>
						<Text style={[desktopStyles.chatInfoActionText, { color: colors.text }]}>Tìm kiếm</Text>
					</TouchableOpacity>
				</View>

				<ScrollView style={[desktopStyles.chatInfoContent, { backgroundColor: colors.surface }]}>
					<TouchableOpacity style={[desktopStyles.chatInfoSection, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
						<Text style={[desktopStyles.chatInfoSectionTitle, { color: colors.text }]}>Thông tin về đoạn chat</Text>
						<Text style={[desktopStyles.chatInfoSectionArrow, { color: colors.textSecondary }]}>›</Text>
					</TouchableOpacity>
					<TouchableOpacity style={[desktopStyles.chatInfoSection, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
						<Text style={[desktopStyles.chatInfoSectionTitle, { color: colors.text }]}>Tùy chỉnh đoạn chat</Text>
						<Text style={[desktopStyles.chatInfoSectionArrow, { color: colors.textSecondary }]}>›</Text>
					</TouchableOpacity>
					<TouchableOpacity style={[desktopStyles.chatInfoSection, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
						<Text style={[desktopStyles.chatInfoSectionTitle, { color: colors.text }]}>File phương tiện & file</Text>
						<Text style={[desktopStyles.chatInfoSectionArrow, { color: colors.textSecondary }]}>›</Text>
					</TouchableOpacity>
					<TouchableOpacity style={[desktopStyles.chatInfoSection, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
						<Text style={[desktopStyles.chatInfoSectionTitle, { color: colors.text }]}>Quyền riêng tư và hỗ trợ</Text>
						<Text style={[desktopStyles.chatInfoSectionArrow, { color: colors.textSecondary }]}>›</Text>
					</TouchableOpacity>
				</ScrollView>
			</View>
		);
	};

	if (isMobile) {
		// Mobile Layout - Single Column with Gradient Background (Theme-aware)
		return (
			<SafeAreaView style={{ flex: 1 }}>
				<LinearGradient
					colors={[colors.gradientStart, colors.gradientEnd]}  // Theme-based gradient
					start={{ x: 0, y: 0 }}    // Top-left
					end={{ x: 1, y: 1 }}      // Bottom-right
					style={{ flex: 1 }}
				>
				{/* Header */}
			<View style={mobileStyles.header}>
					<Text style={[mobileStyles.headerTitle, { color: colors.text }]}>messenger</Text>
					<View style={mobileStyles.headerActions}>
						{renderComposeButton()}
						<TouchableOpacity 
							style={mobileStyles.avatarButtonMobile} 
							onPress={() => navigation.navigate('Settings')}
						>
							{(() => {
								console.log('🔍 Mobile avatar render - userInfo:', userInfo);
								console.log('🔍 Mobile avatar render - avatar URL:', userInfo?.avatar);
								return null;
							})()}
							{userInfo?.avatar ? (
								<Image 
									source={{ uri: userInfo.avatar }} 
									style={conversationsStyles.avatarImage}
									onError={() => {
										console.log('❌ Mobile avatar image failed to load:', userInfo.avatar);
									}}
									onLoad={() => {
										console.log('✅ Mobile avatar image loaded successfully:', userInfo.avatar);
									}}
								/>
							) : (
								<View style={conversationsStyles.defaultAvatar}>
									<Text style={conversationsStyles.defaultAvatarText}>
										{userInfo?.name ? userInfo.name.charAt(0).toUpperCase() : userInfo?.username ? userInfo.username.charAt(0).toUpperCase() : '👤'}
									</Text>
								</View>
							)}
						</TouchableOpacity>
				</View>
			</View>

				{/* Search Bar */}
				<View style={mobileStyles.searchContainer}>
					<TextInput
						style={[mobileStyles.searchInput, { color: colors.text }]}
						placeholder="Tìm kiếm trên Messenger"
						placeholderTextColor={colors.textSecondary}
						value={searchText}
						onChangeText={setSearchText}
					/>
				</View>

			{/* Filter Tabs */}
			<View style={mobileStyles.tabsContainer}>
				<TouchableOpacity 
					style={[mobileStyles.tab, selectedTab === 'all' && { borderBottomColor: colors.primary }]}
					onPress={() => setSelectedTab('all')}
				>
					<Text style={[mobileStyles.tabText, { color: colors.textSecondary }, selectedTab === 'all' && { color: colors.primary }]}>
						Tất cả
					</Text>
				</TouchableOpacity>
				<TouchableOpacity 
					style={[mobileStyles.tab, selectedTab === 'unread' && { borderBottomColor: colors.primary }]}
					onPress={() => setSelectedTab('unread')}
				>
					<Text style={[mobileStyles.tabText, { color: colors.textSecondary }, selectedTab === 'unread' && { color: colors.primary }]}>
						Chưa đọc
					</Text>
				</TouchableOpacity>
				<TouchableOpacity 
					style={[mobileStyles.tab, selectedTab === 'groups' && { borderBottomColor: colors.primary }]}
					onPress={() => setSelectedTab('groups')}
				>
					<Text style={[mobileStyles.tabText, { color: colors.textSecondary }, selectedTab === 'groups' && { color: colors.primary }]}>
						Nhóm
					</Text>
				</TouchableOpacity>
			</View>

				{/* Conversations List */}
			<FlatList
					data={getFilteredConversations()}
					renderItem={renderConversationItem}
				keyExtractor={(item) => item._id}
					refreshControl={
						<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
					}
					style={mobileStyles.conversationsList}
				/>
				
				{renderSearchModal()}
				</LinearGradient>
			</SafeAreaView>
		);
	}

	// Desktop Layout - Three Columns
					return (
		<SafeAreaView style={[themeStyles.container]}>
			<View style={[desktopStyles.desktopLayout, { backgroundColor: colors.background }]}>
				{/* Left Panel - Conversations List */}
				<View style={[desktopStyles.leftPanel, { backgroundColor: colors.surface }]}>
					{/* Header */}
					<View style={[desktopStyles.desktopHeader, { backgroundColor: colors.headerBackground }]}>
						<Text style={[desktopStyles.desktopHeaderTitle, { color: colors.headerText }]}>Đoạn chat</Text>
						<View style={desktopStyles.desktopHeaderActions}>
							<TouchableOpacity 
								style={desktopStyles.avatarButton} 
								onPress={() => navigation.navigate('Settings')}
							>
								{(() => {
									console.log('🔍 Desktop avatar render - userInfo:', userInfo);
									console.log('🔍 Desktop avatar render - avatar URL:', userInfo?.avatar);
									return null;
								})()}
								{userInfo?.avatar ? (
									<Image 
										source={{ uri: userInfo.avatar }} 
										style={conversationsStyles.avatarImage}
										onError={() => {
											console.log('❌ Avatar image failed to load:', userInfo.avatar);
										}}
										onLoad={() => {
											console.log('✅ Avatar image loaded successfully:', userInfo.avatar);
										}}
									/>
								) : (
									<View style={conversationsStyles.defaultAvatar}>
										<Text style={conversationsStyles.defaultAvatarText}>
											{userInfo?.name ? userInfo.name.charAt(0).toUpperCase() : userInfo?.username ? userInfo.username.charAt(0).toUpperCase() : '👤'}
										</Text>
									</View>
								)}
							</TouchableOpacity>
							{renderComposeButton()}
						</View>
					</View>

					{/* Search Bar */}
					<View style={desktopStyles.searchContainer}>
						<TextInput
							style={[desktopStyles.searchInput, { backgroundColor: colors.inputBackground, color: colors.inputText, borderColor: colors.inputBorder }]}
							placeholder="Tìm kiếm trên Messenger"
							placeholderTextColor={colors.inputPlaceholder}
							value={searchText}
							onChangeText={setSearchText}
						/>
					</View>

					{/* Filter Tabs */}
					<View style={[desktopStyles.tabsContainer, { backgroundColor: colors.tabBackground }]}>
						<TouchableOpacity 
							style={[
								desktopStyles.tab,
								selectedTab === 'all' && { backgroundColor: colors.tabActive }
							]}
							onPress={() => setSelectedTab('all')}
						>
							<Text style={[
								desktopStyles.tabText,
								{ color: selectedTab === 'all' ? colors.buttonText : colors.tabInactive }
							]}>
								Tất cả
							</Text>
						</TouchableOpacity>
						<TouchableOpacity 
							style={[
								desktopStyles.tab,
								selectedTab === 'unread' && { backgroundColor: colors.tabActive }
							]}
							onPress={() => setSelectedTab('unread')}
						>
							<Text style={[
								desktopStyles.tabText,
								{ color: selectedTab === 'unread' ? colors.buttonText : colors.tabInactive }
							]}>
								Chưa đọc
							</Text>
						</TouchableOpacity>
						<TouchableOpacity 
							style={[
								desktopStyles.tab,
								selectedTab === 'groups' && { backgroundColor: colors.tabActive }
							]}
							onPress={() => setSelectedTab('groups')}
						>
							<Text style={[
								desktopStyles.tabText,
								{ color: selectedTab === 'groups' ? colors.buttonText : colors.tabInactive }
							]}>
								Nhóm
							</Text>
						</TouchableOpacity>
					</View>

					{/* Conversations List */}
				<FlatList
					data={getFilteredConversations()}
					renderItem={renderConversationItem}
					keyExtractor={(item) => item._id}
						refreshControl={
							<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
						}
						style={desktopStyles.conversationsList}
			/>
		</View>

				{/* Center Panel - Chat Area */}
				<View style={[desktopStyles.centerPanel, { backgroundColor: colors.background }]}>
					{renderChatArea()}
				</View>

				{/* Right Panel - Chat Info */}
				{renderChatInfo()}
			</View>
			
			{/* Call functionality is now handled by ChatComponent */}
			
			{renderSearchModal()}
		</SafeAreaView>
	);
}

// Helper functions are now in Chat.tsx

