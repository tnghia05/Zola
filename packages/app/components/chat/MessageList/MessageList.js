import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef } from 'react';
import { MessageBubble } from './MessageBubble';
import { PinnedMessagesBar } from './PinnedMessagesBar';
export function MessageList({ messages, currentUserId, loading, hasMore, opponentName, opponentAvatar, onReply, onLoadMore, onReact, onTogglePin, onScrollToMessage, focusMessageId, onFocusHandled, onEdit, onDelete, onForward, onStar, onRevoke, }) {
    const listRef = useRef(null);
    const rowRefs = useRef({});
    useEffect(() => {
        const el = listRef.current;
        if (!el)
            return;
        el.scrollTop = el.scrollHeight;
    }, [messages]);
    useEffect(() => {
        const el = listRef.current;
        if (!el || !onLoadMore)
            return;
        const handleScroll = () => {
            if (el.scrollTop <= 32) {
                onLoadMore();
            }
        };
        el.addEventListener('scroll', handleScroll);
        return () => el.removeEventListener('scroll', handleScroll);
    }, [onLoadMore]);
    const pinnedMessages = messages.filter((message) => message.isPinned);
    const scrollToMessage = (messageId) => {
        const target = rowRefs.current[messageId];
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
            target.classList.add('chat-message-row--highlight');
            setTimeout(() => target.classList.remove('chat-message-row--highlight'), 1200);
        }
        else {
            onScrollToMessage?.(messageId);
        }
    };
    useEffect(() => {
        if (focusMessageId) {
            scrollToMessage(focusMessageId);
            onFocusHandled?.();
        }
    }, [focusMessageId, messages]);
    return (_jsxs("div", { className: "chat-message-list-wrapper", children: [_jsx(PinnedMessagesBar, { messages: pinnedMessages, onSelect: scrollToMessage }), _jsxs("div", { className: "chat-message-list", ref: listRef, children: [hasMore ? (_jsx("button", { type: "button", className: "chat-load-more", onClick: () => onLoadMore?.(), children: "Xem th\u00EAm tin nh\u1EAFn c\u0169" })) : null, loading ? _jsx("div", { className: "chat-message-placeholder", children: "\u0110ang t\u1EA3i tin nh\u1EAFn..." }) : null, !loading && messages.length === 0 ? (_jsx("div", { className: "chat-message-placeholder", children: "B\u1EAFt \u0111\u1EA7u cu\u1ED9c tr\u00F2 chuy\u1EC7n \u0111\u1EA7u ti\u00EAn!" })) : null, messages.map((message) => {
                        const isOwn = message.senderId === currentUserId;
                        return (_jsxs("div", { className: `chat-message-row ${isOwn ? 'mine' : ''}`, ref: (el) => {
                                if (el && message._id) {
                                    rowRefs.current[message._id] = el;
                                }
                            }, onMouseEnter: () => {
                                /* future: show contextual actions */
                            }, children: [_jsx(MessageBubble, { message: message, isOwn: message.senderId === currentUserId, senderName: message.sender?.name || (message.senderId !== currentUserId ? opponentName : undefined), senderAvatar: message.sender?.avatar || (message.senderId !== currentUserId ? opponentAvatar : undefined), onReply: onReply, onReact: onReact, onTogglePin: onTogglePin, onEdit: onEdit, onDelete: onDelete, onForward: onForward, onStar: onStar, onRevoke: onRevoke }), _jsx("div", { className: "chat-message-actions", children: _jsx("button", { className: "chat-message-action", onClick: () => onReply?.(message), title: "Tr\u1EA3 l\u1EDDi", children: "\u21A9" }) })] }, message._id || message.localId));
                    })] })] }));
}
