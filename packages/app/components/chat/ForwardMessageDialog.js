import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { getConversations, createMessageWithPayload } from '../../api';
export function ForwardMessageDialog({ message, onClose, onForwarded }) {
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedConversationId, setSelectedConversationId] = useState(null);
    const [forwarding, setForwarding] = useState(false);
    useEffect(() => {
        if (!message)
            return;
        loadConversations();
    }, [message]);
    const loadConversations = async () => {
        try {
            setLoading(true);
            const data = await getConversations();
            setConversations(data);
        }
        catch (err) {
            console.error('Failed to load conversations:', err);
        }
        finally {
            setLoading(false);
        }
    };
    const handleForward = async () => {
        if (!message || !selectedConversationId)
            return;
        try {
            setForwarding(true);
            await createMessageWithPayload(selectedConversationId, {
                text: message.text,
                imageUrl: message.imageUrl,
                type: message.type,
            });
            onForwarded?.();
            onClose();
        }
        catch (err) {
            console.error('Failed to forward message:', err);
            alert('Không thể chuyển tiếp tin nhắn. Vui lòng thử lại.');
        }
        finally {
            setForwarding(false);
        }
    };
    if (!message)
        return null;
    return (_jsx("div", { className: "chat-forward-dialog-overlay", onClick: onClose, children: _jsxs("div", { className: "chat-forward-dialog", onClick: (e) => e.stopPropagation(), children: [_jsxs("div", { className: "chat-forward-dialog-header", children: [_jsx("h3", { children: "Chuy\u1EC3n ti\u1EBFp tin nh\u1EAFn" }), _jsx("button", { className: "chat-forward-dialog-close", onClick: onClose, children: "\u00D7" })] }), _jsx("div", { className: "chat-forward-dialog-preview", children: _jsxs("div", { className: "chat-forward-preview-message", children: [message.text && _jsx("div", { className: "chat-forward-preview-text", children: message.text }), message.imageUrl && (_jsx("img", { src: message.imageUrl, alt: "Preview", className: "chat-forward-preview-image" }))] }) }), _jsx("div", { className: "chat-forward-dialog-list", children: loading ? (_jsx("div", { className: "chat-forward-dialog-loading", children: "\u0110ang t\u1EA3i..." })) : conversations.length === 0 ? (_jsx("div", { className: "chat-forward-dialog-empty", children: "Kh\u00F4ng c\u00F3 cu\u1ED9c tr\u00F2 chuy\u1EC7n n\u00E0o" })) : (conversations.map((conv) => (_jsxs("button", { className: `chat-forward-dialog-item ${selectedConversationId === conv._id ? 'chat-forward-dialog-item--selected' : ''}`, onClick: () => setSelectedConversationId(conv._id), children: [_jsx("div", { className: "chat-forward-dialog-item-avatar", children: conv.isGroup ? '👥' : '💬' }), _jsx("div", { className: "chat-forward-dialog-item-info", children: _jsx("div", { className: "chat-forward-dialog-item-name", children: conv.isGroup ? conv.title || `Nhóm (${conv.members.length})` : conv.title || 'Người dùng' }) })] }, conv._id)))) }), _jsxs("div", { className: "chat-forward-dialog-actions", children: [_jsx("button", { className: "chat-forward-dialog-cancel", onClick: onClose, children: "H\u1EE7y" }), _jsx("button", { className: "chat-forward-dialog-forward", onClick: handleForward, disabled: !selectedConversationId || forwarding, children: forwarding ? 'Đang chuyển tiếp...' : 'Chuyển tiếp' })] })] }) }));
}
