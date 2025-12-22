"use client";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getConversations, logout, setAuthToken } from '../../api';
import { disconnectSocket, connectSocket, getSocket } from '../../socket';
import '../../styles/conversations.css';
import { DesktopChat } from '../../components/chat/DesktopChat';
import { NewConversationModal } from '../../components/chat/NewConversationModal';
import { GroupInfoPanel, AddMembersModal, UpdateGroupInfoModal, ConfirmActionModal, } from '../../components/group';
import { addGroupMembers, leaveGroup, makeGroupAdmin, removeGroupAdmin, removeGroupMember, updateGroupInfo, createInviteLink, } from '../../api';
import packageJson from '../../package.json';
const APP_VERSION = packageJson.version || '1.0.0';
export default function ConversationsScreen() {
    console.log('💬 ConversationsScreen component rendering...');
    const router = useRouter();
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState('');
    const [selectedTab, setSelectedTab] = useState('all');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isAddMembersOpen, setIsAddMembersOpen] = useState(false);
    const [isUpdateGroupOpen, setIsUpdateGroupOpen] = useState(false);
    const [confirmLeaveOpen, setConfirmLeaveOpen] = useState(false);
    const [memberAction, setMemberAction] = useState(null);
    const [inviteLink, setInviteLink] = useState(null);
    const [inviteGenerating, setInviteGenerating] = useState(false);
    const [isInfoVisible, setIsInfoVisible] = useState(true);
    useEffect(() => {
        console.log('💬 ConversationsScreen useEffect - loading conversations...');
        // Connect socket if not connected
        const token = localStorage.getItem('auth_token');
        if (token) {
            const socket = getSocket();
            if (!socket || !socket.connected) {
                console.log('🔌 Connecting socket...');
                const result = connectSocket(token);
                if (result instanceof Promise) {
                    result.then((sock) => {
                        if (sock) {
                            console.log('✅ Socket connected successfully');
                        }
                    });
                }
                else if (result) {
                    console.log('✅ Socket connected successfully');
                }
            }
            else {
                console.log('✅ Socket already connected');
            }
        }
        loadConversations();
    }, []);
    useEffect(() => {
        const handleDeepLinkJoin = (event) => {
            const detail = event.detail;
            const conversation = detail?.conversation;
            if (!conversation?._id) {
                console.warn('[Conversations] Received deep link join event without conversation payload');
                return;
            }
            console.log('[Conversations] Deep link joined conversation:', conversation._id);
            setConversations((prev) => {
                const existingIndex = prev.findIndex((item) => item._id === conversation._id);
                if (existingIndex === -1) {
                    return [conversation, ...prev];
                }
                const clone = [...prev];
                clone[existingIndex] = conversation;
                return clone;
            });
            setSelectedConversation(conversation);
        };
        window.addEventListener('conversation:joined', handleDeepLinkJoin);
        return () => {
            window.removeEventListener('conversation:joined', handleDeepLinkJoin);
        };
    }, []);
    const loadConversations = async () => {
        try {
            setLoading(true);
            console.log('💬 Loading conversations from API...');
            const data = await getConversations();
            console.log('💬 Conversations loaded:', data.length, 'items');
            console.log('💬 Sample conversation:', data[0] ? {
                _id: data[0]._id,
                isGroup: data[0].isGroup,
                title: data[0].title,
                opponent: data[0].opponent,
                lastMessageSender: data[0].lastMessageSender
            } : 'No conversations');
            setConversations(data);
        }
        catch (error) {
            console.error('❌ Error loading conversations:', error);
        }
        finally {
            setLoading(false);
            console.log('💬 Loading complete, loading state:', false);
        }
    };
    const handleLogout = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            if (token) {
                await logout(token);
            }
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user_id');
            localStorage.removeItem('user_data');
            setAuthToken();
            disconnectSocket();
            window.location.href = '/login';
        }
        catch (error) {
            console.error('Logout error:', error);
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user_id');
            localStorage.removeItem('user_data');
            setAuthToken();
            disconnectSocket();
            window.location.href = '/login';
        }
    };
    const filteredConversations = conversations.filter(conv => {
        if (selectedTab === 'groups') {
            return conv.isGroup;
        }
        if (selectedTab === 'direct') {
            return !conv.isGroup;
        }
        return true;
    }).filter(conv => {
        if (!searchText)
            return true;
        const searchLower = searchText.toLowerCase();
        return (conv.title?.toLowerCase().includes(searchLower) ||
            conv.lastMessageSender?.name.toLowerCase().includes(searchLower));
    });
    const formatTime = (dateString) => {
        if (!dateString)
            return '';
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        if (days === 0) {
            return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        }
        else if (days === 1) {
            return 'Hôm qua';
        }
        else if (days < 7) {
            return date.toLocaleDateString('vi-VN', { weekday: 'short' });
        }
        else {
            return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
        }
    };
    const getInitials = (name) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };
    const getAvatar = (conv) => {
        if (conv.isGroup) {
            return '👥';
        }
        // Ưu tiên avatar từ opponent, sau đó từ lastMessageSender
        const avatar = conv.opponent?.avatar || conv.lastMessageSender?.avatar;
        if (avatar) {
            return _jsx("img", { src: avatar, alt: "", className: "conversation-avatar-img" });
        }
        // Nếu không có avatar, dùng initials
        const name = conv.title || conv.opponent?.name || conv.lastMessageSender?.name || 'U';
        return getInitials(name);
    };
    const handleConversationClick = (conv) => {
        setSelectedConversation(conv);
    };
    const handleOpenNewChat = () => {
        setIsCreateModalOpen(true);
    };
    const handleConversationCreated = (conversation) => {
        setConversations((prev) => {
            const filtered = prev.filter((item) => item._id !== conversation._id);
            return [conversation, ...filtered];
        });
        setSelectedConversation(conversation);
    };
    const refreshCurrentConversation = (updated) => {
        setSelectedConversation(updated);
        setConversations((prev) => {
            const index = prev.findIndex((item) => item._id === updated._id);
            if (index === -1)
                return [updated, ...prev];
            const clone = [...prev];
            clone[index] = updated;
            return clone;
        });
    };
    const handleAddMembersConfirm = async (userIds) => {
        if (!selectedConversation)
            return;
        const updated = await addGroupMembers(selectedConversation._id, userIds);
        refreshCurrentConversation(updated);
    };
    const handleUpdateGroupInfo = async (data) => {
        if (!selectedConversation)
            return;
        const updated = await updateGroupInfo(selectedConversation._id, data);
        refreshCurrentConversation(updated);
    };
    const handleMemberActionExecute = async () => {
        if (!selectedConversation || !memberAction)
            return;
        try {
            let updated = null;
            if (memberAction.type === 'remove') {
                updated = await removeGroupMember(selectedConversation._id, memberAction.userId);
            }
            else if (memberAction.type === 'makeAdmin') {
                updated = await makeGroupAdmin(selectedConversation._id, memberAction.userId);
            }
            else if (memberAction.type === 'removeAdmin') {
                updated = await removeGroupAdmin(selectedConversation._id, memberAction.userId);
            }
            if (updated) {
                refreshCurrentConversation(updated);
            }
        }
        catch (err) {
            console.error('Member action error:', err);
        }
        finally {
            setMemberAction(null);
        }
    };
    const handleLeaveGroupConfirm = async () => {
        if (!selectedConversation)
            return;
        try {
            await leaveGroup(selectedConversation._id);
            setSelectedConversation(null);
            loadConversations();
        }
        catch (err) {
            console.error('Leave group error:', err);
        }
        finally {
            setConfirmLeaveOpen(false);
        }
    };
    const inviteBaseUrl = import.meta?.env?.VITE_INVITE_BASE_URL ||
        'https://backend36.dev';
    const normalizeBase = (url) => url.replace(/\/+$/, '');
    const buildInviteUrl = (shareUrl, inviteCode) => {
        const base = normalizeBase(inviteBaseUrl);
        const normalizedShare = shareUrl?.trim();
        if (normalizedShare) {
            if (/^https?:\/\//i.test(normalizedShare)) {
                return normalizedShare;
            }
            const cleaned = normalizedShare.replace(/^\/+/, '');
            if (cleaned.startsWith('invite/')) {
                return `${base}/${cleaned}`;
            }
            if (!cleaned.includes('/')) {
                return `${base}/invite/${cleaned}`;
            }
            return `${base}/${cleaned}`;
        }
        if (inviteCode) {
            return `${base}/invite/${inviteCode}`;
        }
        return base;
    };
    const handleGenerateInvite = async () => {
        if (!selectedConversation)
            return;
        try {
            setInviteGenerating(true);
            const res = await createInviteLink(selectedConversation._id);
            const link = buildInviteUrl(res.shareUrl, res.inviteCode);
            setInviteLink(link);
        }
        catch (err) {
            console.error('Create invite link error:', err);
        }
        finally {
            setInviteGenerating(false);
        }
    };
    console.log('💬 ConversationsScreen render - loading:', loading, 'conversations:', conversations.length);
    // Test: Add visible content to verify rendering
    if (!loading && conversations.length === 0) {
        console.log('💬 No conversations, showing empty state');
    }
    const centerPanelClass = selectedConversation
        ? 'center-panel center-panel--chat-active'
        : 'center-panel';
    return (_jsxs("div", { className: "desktop-layout", children: [_jsxs("div", { className: "left-panel", children: [_jsxs("div", { className: "desktop-header", children: [_jsxs("h1", { className: "desktop-header-title", children: ["Day2", _jsxs("span", { className: "desktop-header-version", children: ["v", APP_VERSION] })] }), _jsxs("div", { className: "desktop-header-actions", children: [_jsx("button", { className: "header-button", title: "M\u1EA1ng x\u00E3 h\u1ED9i Day2", onClick: () => router.push('/feed'), children: "\uD83D\uDCF0" }), _jsx("button", { className: "header-button", title: "C\u00E0i \u0111\u1EB7t", onClick: () => router.push('/settings'), children: "\u2699\uFE0F" }), _jsx("button", { className: "header-button", onClick: handleLogout, children: "\uD83D\uDEAA" })] })] }), _jsx("div", { className: "search-container", children: _jsx("input", { type: "text", placeholder: "T\u00ECm ki\u1EBFm...", className: "search-input", value: searchText, onChange: (e) => setSearchText(e.target.value) }) }), _jsx("div", { className: "new-chat-actions single", children: _jsx("button", { className: "new-chat-button", onClick: handleOpenNewChat, children: "+ T\u1EA1o cu\u1ED9c tr\u00F2 chuy\u1EC7n" }) }), _jsxs("div", { className: "tabs-container", children: [_jsx("button", { className: `tab ${selectedTab === 'all' ? 'active' : ''}`, onClick: () => setSelectedTab('all'), children: "T\u1EA5t c\u1EA3" }), _jsx("button", { className: `tab ${selectedTab === 'direct' ? 'active' : ''}`, onClick: () => setSelectedTab('direct'), children: "Tin nh\u1EAFn" }), _jsx("button", { className: `tab ${selectedTab === 'groups' ? 'active' : ''}`, onClick: () => setSelectedTab('groups'), children: "Nh\u00F3m" })] }), _jsx("div", { className: "conversations-list", children: loading ? (_jsx("div", { style: { padding: 20, textAlign: 'center', color: '#999' }, children: "\u0110ang t\u1EA3i..." })) : filteredConversations.length === 0 ? (_jsx("div", { style: { padding: 20, textAlign: 'center', color: '#999' }, children: "Kh\u00F4ng c\u00F3 cu\u1ED9c tr\u00F2 chuy\u1EC7n" })) : (filteredConversations.map((conv) => (_jsxs("div", { className: `conversation-item ${selectedConversation?._id === conv._id ? 'selected' : ''}`, onClick: () => handleConversationClick(conv), children: [_jsx("div", { className: "conversation-avatar", children: getAvatar(conv) }), _jsxs("div", { className: "conversation-content", children: [_jsxs("div", { className: "conversation-header", children: [_jsx("span", { className: "conversation-name", children: conv.isGroup
                                                        ? conv.title || `Nhóm (${conv.members.length})`
                                                        : conv.title || conv.opponent?.name || conv.lastMessageSender?.name || 'Người dùng' }), conv.lastMessageAt && (_jsx("span", { className: "conversation-time", children: formatTime(conv.lastMessageAt) }))] }), _jsx("div", { className: "conversation-preview", children: conv.lastMessageSender?.name ? `${conv.lastMessageSender.name}: ` : '' })] })] }, conv._id)))) })] }), _jsx("div", { className: centerPanelClass, children: selectedConversation ? (_jsx(DesktopChat, { conversationId: selectedConversation._id, conversationName: selectedConversation.isGroup
                        ? selectedConversation.title || `Nhóm (${selectedConversation.members.length})`
                        : selectedConversation.title || selectedConversation.opponent?.name || 'Người dùng', isGroup: selectedConversation.isGroup, groupAvatar: selectedConversation.groupAvatar, groupMemberCount: selectedConversation.members.length, memberIds: selectedConversation.members, onToggleInfo: () => setIsInfoVisible((prev) => !prev), isInfoVisible: isInfoVisible })) : (_jsxs("div", { className: "empty-chat-area", children: [_jsx("div", { className: "empty-chat-title", children: "Ch\u1ECDn m\u1ED9t cu\u1ED9c tr\u00F2 chuy\u1EC7n" }), _jsx("div", { className: "empty-chat-subtitle", children: "Ch\u1ECDn m\u1ED9t cu\u1ED9c tr\u00F2 chuy\u1EC7n t\u1EEB danh s\u00E1ch \u0111\u1EC3 b\u1EAFt \u0111\u1EA7u nh\u1EAFn tin" })] })) }), selectedConversation && selectedConversation.isGroup && isInfoVisible && (_jsx("div", { className: "chat-info-panel", children: _jsx(GroupInfoPanel, { conversation: selectedConversation, currentUserId: localStorage.getItem('user_id') || '', onAddMembers: () => setIsAddMembersOpen(true), onRemoveMember: (userId) => setMemberAction({ type: 'remove', userId }), onLeaveGroup: () => setConfirmLeaveOpen(true), onMakeAdmin: (userId) => setMemberAction({ type: 'makeAdmin', userId }), onRemoveAdmin: (userId) => setMemberAction({ type: 'removeAdmin', userId }), onChangeInfo: () => setIsUpdateGroupOpen(true), onGenerateInvite: handleGenerateInvite, inviteLink: inviteLink ?? undefined, isGeneratingInvite: inviteGenerating }) })), _jsx(NewConversationModal, { isOpen: isCreateModalOpen, onClose: () => setIsCreateModalOpen(false), onCreated: handleConversationCreated }), selectedConversation && selectedConversation.isGroup && (_jsxs(_Fragment, { children: [_jsx(AddMembersModal, { isOpen: isAddMembersOpen, onClose: () => setIsAddMembersOpen(false), onConfirm: handleAddMembersConfirm, conversation: selectedConversation }), _jsx(UpdateGroupInfoModal, { isOpen: isUpdateGroupOpen, onClose: () => setIsUpdateGroupOpen(false), onSave: handleUpdateGroupInfo, initialTitle: selectedConversation.title, initialAvatar: selectedConversation.groupAvatar }), _jsx(ConfirmActionModal, { isOpen: Boolean(memberAction), onClose: () => setMemberAction(null), onConfirm: handleMemberActionExecute, title: memberAction?.type === 'remove'
                            ? 'Xóa thành viên'
                            : memberAction?.type === 'makeAdmin'
                                ? 'Chọn làm admin'
                                : 'Bỏ quyền admin', description: memberAction?.type === 'remove'
                            ? 'Bạn chắc chắn muốn xóa thành viên này khỏi nhóm?'
                            : memberAction?.type === 'makeAdmin'
                                ? 'Trao quyền admin cho thành viên này?'
                                : 'Bỏ quyền admin của thành viên này?', confirmLabel: memberAction?.type === 'remove'
                            ? 'Xóa khỏi nhóm'
                            : memberAction?.type === 'makeAdmin'
                                ? 'Chọn làm admin'
                                : 'Bỏ admin', variant: memberAction?.type === 'remove' ? 'danger' : 'default' }), _jsx(ConfirmActionModal, { isOpen: confirmLeaveOpen, onClose: () => setConfirmLeaveOpen(false), onConfirm: handleLeaveGroupConfirm, title: "R\u1EDDi nh\u00F3m", description: "B\u1EA1n ch\u1EAFc ch\u1EAFn mu\u1ED1n r\u1EDDi kh\u1ECFi nh\u00F3m n\u00E0y?", confirmLabel: "R\u1EDDi nh\u00F3m", variant: "danger" })] }))] }));
}
