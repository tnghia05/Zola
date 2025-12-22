import { useEffect, useRef } from 'react';
import { getSocket } from '../socket';
import { showNotification, requestNotificationPermission } from '../services/notificationService';
export function useNotifications(currentConversationId) {
    const isWindowFocusedRef = useRef(true);
    const permissionRequestedRef = useRef(false);
    useEffect(() => {
        // Request permission on mount
        if (!permissionRequestedRef.current) {
            // Only request permission in browser
            if (typeof window !== 'undefined') {
                requestNotificationPermission();
            }
            permissionRequestedRef.current = true;
        }
        // Track window focus
        const handleFocus = () => {
            isWindowFocusedRef.current = true;
        };
        const handleBlur = () => {
            isWindowFocusedRef.current = false;
        };
        if (typeof window !== 'undefined') {
            window.addEventListener('focus', handleFocus);
            window.addEventListener('blur', handleBlur);
        }
        return () => {
            if (typeof window !== 'undefined') {
                window.removeEventListener('focus', handleFocus);
                window.removeEventListener('blur', handleBlur);
            }
        };
    }, []);
    useEffect(() => {
        const socket = getSocket();
        if (!socket)
            return;
        // Listen to all new messages (not just current conversation)
        const handleNewMessage = (payload) => {
            const { conversationId, message } = payload;
            // Don't notify if:
            // 1. It's the current conversation and window is focused
            // 2. Message is from current user
            const isCurrentConversation = conversationId === currentConversationId;
            let isOwnMessage = false;
            if (typeof window !== 'undefined') {
                try {
                    const userId = window.localStorage.getItem('user_id');
                    isOwnMessage = !!userId && message.senderId === userId;
                }
                catch {
                    isOwnMessage = false;
                }
            }
            const shouldNotify = !isCurrentConversation || !isWindowFocusedRef.current;
            if (!isOwnMessage && shouldNotify) {
                // Get sender name if available
                const senderName = message.sender?.name || 'Ai đó';
                const messageText = message.text || (message.imageUrl ? '📷 Hình ảnh' : 'Tin nhắn');
                showNotification({
                    title: senderName,
                    body: messageText.length > 100 ? messageText.substring(0, 100) + '...' : messageText,
                    conversationId,
                });
            }
        };
        socket.on('message:new', handleNewMessage);
        socket.on('newMessage', handleNewMessage);
        socket.on('chatMessage', handleNewMessage);
        return () => {
            socket.off('message:new', handleNewMessage);
            socket.off('newMessage', handleNewMessage);
            socket.off('chatMessage', handleNewMessage);
        };
    }, [currentConversationId]);
    // Social notifications (likes, comments, friend requests)
    useEffect(() => {
        const socket = getSocket();
        if (!socket)
            return;
        const handleSocialNotification = (notification) => {
            const actor = notification.actorName || 'Người dùng';
            let body = '';
            switch (notification.type) {
                case 'POST_LIKED':
                    body = `${actor} đã thích bài viết của bạn`;
                    break;
                case 'POST_COMMENTED':
                    body = `${actor} đã bình luận bài viết của bạn`;
                    break;
                case 'FRIEND_REQUEST':
                    body = `${actor} đã gửi lời mời kết bạn`;
                    break;
                case 'FRIEND_ACCEPTED':
                    body = `${actor} đã chấp nhận lời mời kết bạn`;
                    break;
                default:
                    body = 'Bạn có thông báo mới';
            }
            showNotification({
                title: 'Day2 Social',
                body,
            });
        };
        socket.on('social:notification', handleSocialNotification);
        return () => {
            socket.off('social:notification', handleSocialNotification);
        };
    }, []);
}
