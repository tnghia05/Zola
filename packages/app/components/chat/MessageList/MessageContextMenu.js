import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { forwardRef } from 'react';
export const MessageContextMenu = forwardRef(({ message, isOwn, onReply, onCopy, onPinToggle, onEdit, onDelete, onForward, onStar, onRevoke, anchorClassName, style, }, ref) => {
    return (_jsxs("div", { ref: ref, className: ['chat-context-menu', anchorClassName].filter(Boolean).join(' '), style: style, children: [_jsx("button", { className: "chat-context-menu-item", onClick: (e) => {
                    e.stopPropagation();
                    onReply(message);
                }, children: "\u21A9 Tr\u1EA3 l\u1EDDi" }), _jsx("button", { className: "chat-context-menu-item", onClick: (e) => {
                    e.stopPropagation();
                    navigator.clipboard.writeText(message.text ?? '');
                    onCopy?.(message);
                }, children: "\uD83D\uDCCB Sao ch\u00E9p" }), _jsx("button", { className: "chat-context-menu-item", onClick: (e) => {
                    e.stopPropagation();
                    onPinToggle?.(!message.isPinned);
                }, children: message.isPinned ? '📌 Bỏ ghim' : '📌 Ghim tin nhắn' }), !message.isStarred ? (_jsx("button", { className: "chat-context-menu-item", onClick: (e) => {
                    e.stopPropagation();
                    onStar?.();
                }, children: "\u2B50 \u0110\u00E1nh d\u1EA5u sao" })) : (_jsx("button", { className: "chat-context-menu-item", disabled: true, children: "\u2B50 \u0110\u00E3 \u0111\u00E1nh d\u1EA5u" })), isOwn ? (_jsx("button", { className: "chat-context-menu-item", onClick: (e) => {
                    e.stopPropagation();
                    onEdit?.();
                }, children: "\u270F\uFE0F Ch\u1EC9nh s\u1EEDa" })) : null, isOwn && !message.isRevoked ? (_jsx("button", { className: "chat-context-menu-item", onClick: (e) => {
                    e.stopPropagation();
                    onRevoke?.();
                }, children: "\u21A9\uFE0F Thu h\u1ED3i" })) : null, isOwn ? (_jsx("button", { className: "chat-context-menu-item chat-context-menu-item--danger", onClick: (e) => {
                    e.stopPropagation();
                    onDelete?.();
                }, children: "\uD83D\uDDD1\uFE0F X\u00F3a" })) : null, _jsx("button", { className: "chat-context-menu-item", onClick: (e) => {
                    e.stopPropagation();
                    onForward?.(message);
                }, children: "\u21AA\uFE0F Chuy\u1EC3n ti\u1EBFp" })] }));
});
MessageContextMenu.displayName = 'MessageContextMenu';
