import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ReplyPreview } from './ReplyPreview';
import { ReactionSummary } from './ReactionSummary';
import { MessageContextMenu } from './MessageContextMenu';
import { ReactionPicker } from './ReactionPicker';
const getInitials = (name) => {
    return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
};
export function MessageBubble({ message, isOwn, senderName, senderAvatar, onReply, onReact, onTogglePin, onEdit, onDelete, onForward, onStar, onRevoke, }) {
    const displayName = senderName || message.sender?.name || 'Người dùng';
    const displayAvatar = senderAvatar || message.sender?.avatar;
    const [menuOpen, setMenuOpen] = useState(false);
    const [pickerOpen, setPickerOpen] = useState(false);
    const [menuPosition, setMenuPosition] = useState(null);
    const [pickerPosition, setPickerPosition] = useState(null);
    const [viewerOpen, setViewerOpen] = useState(false);
    const [viewerImages, setViewerImages] = useState([]);
    const [viewerIndex, setViewerIndex] = useState(0);
    const menuRef = useRef(null);
    const buttonRef = useRef(null);
    const emojiButtonRef = useRef(null);
    const wrapperClass = useMemo(() => ['chat-bubble-wrapper', isOwn ? 'chat-bubble-wrapper--own' : 'chat-bubble-wrapper--other'].join(' '), [isOwn]);
    const rowClass = useMemo(() => ['chat-bubble-row', isOwn ? 'chat-bubble-row--own' : 'chat-bubble-row--other'].join(' '), [isOwn]);
    const footerClass = useMemo(() => ['chat-bubble-footer', isOwn ? 'chat-bubble-footer--own' : 'chat-bubble-footer--other'].join(' '), [isOwn]);
    const classes = useMemo(() => ['chat-bubble', isOwn ? 'chat-bubble--own' : 'chat-bubble--other'].join(' '), [isOwn]);
    const replyPreviewContent = (() => {
        if (!message.replyTo)
            return undefined;
        if (typeof message.replyTo === 'string') {
            return '[Trả lời tin nhắn trước]';
        }
        return message.replyTo;
    })();
    useEffect(() => {
        if (!menuOpen || !buttonRef.current)
            return;
        const updateMenuPosition = () => {
            if (buttonRef.current) {
                const rect = buttonRef.current.getBoundingClientRect();
                setMenuPosition({
                    top: rect.bottom + 6,
                    right: window.innerWidth - rect.right,
                    left: rect.left,
                });
            }
        };
        updateMenuPosition();
        window.addEventListener('scroll', updateMenuPosition, true);
        window.addEventListener('resize', updateMenuPosition);
        const handleClickOutside = (event) => {
            const target = event.target;
            if (menuRef.current &&
                !menuRef.current.contains(target) &&
                buttonRef.current &&
                !buttonRef.current.contains(target)) {
                setMenuOpen(false);
                setMenuPosition(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', updateMenuPosition, true);
            window.removeEventListener('resize', updateMenuPosition);
        };
    }, [menuOpen]);
    useEffect(() => {
        if (!pickerOpen || !emojiButtonRef.current)
            return;
        const updatePickerPosition = () => {
            if (emojiButtonRef.current) {
                const rect = emojiButtonRef.current.getBoundingClientRect();
                setPickerPosition({
                    top: rect.bottom + 6,
                    right: window.innerWidth - rect.right,
                    left: rect.left,
                });
            }
        };
        updatePickerPosition();
        window.addEventListener('scroll', updatePickerPosition, true);
        window.addEventListener('resize', updatePickerPosition);
        return () => {
            window.removeEventListener('scroll', updatePickerPosition, true);
            window.removeEventListener('resize', updatePickerPosition);
        };
    }, [pickerOpen]);
    const isRevoked = Boolean(message.isRevoked);
    const isDeleted = Boolean(message.deletedAt);
    const hasContent = Boolean(message.text) || Boolean(message.imageUrl);
    const isActionDisabled = isRevoked || isDeleted;
    const openImageViewer = () => {
        if (!message.imageUrl)
            return;
        try {
            const nodes = Array.from(document.querySelectorAll('.chat-bubble-image'));
            const srcs = nodes.map((n) => n.src);
            const idx = srcs.indexOf(message.imageUrl);
            setViewerImages(srcs);
            setViewerIndex(idx >= 0 ? idx : 0);
            setViewerOpen(true);
        }
        catch {
            setViewerImages([message.imageUrl]);
            setViewerIndex(0);
            setViewerOpen(true);
        }
    };
    const renderMessageBody = () => {
        if (isRevoked) {
            return _jsx("div", { className: "chat-bubble-removed", children: "Tin nh\u1EAFn \u0111\u00E3 b\u1ECB thu h\u1ED3i" });
        }
        if (isDeleted) {
            return _jsx("div", { className: "chat-bubble-removed", children: "Tin nh\u1EAFn \u0111\u00E3 b\u1ECB x\u00F3a" });
        }
        if (!hasContent) {
            return _jsx("div", { className: "chat-bubble-removed", children: "[Kh\u00F4ng c\u00F3 n\u1ED9i dung hi\u1EC3n th\u1ECB]" });
        }
        return (_jsxs(_Fragment, { children: [message.text ? _jsx("div", { className: "chat-bubble-text", children: message.text }) : null, message.imageUrl ? (_jsx("div", { className: "chat-bubble-image-wrapper", children: _jsx("img", { src: message.imageUrl, alt: "attachment", className: "chat-bubble-image", onClick: openImageViewer }) })) : null] }));
    };
    return (_jsxs("div", { className: wrapperClass, "data-message-id": message._id, children: [_jsxs("div", { className: rowClass, children: [!isOwn && (_jsx("div", { className: "chat-bubble-sender-avatar", children: displayAvatar ? (_jsx("img", { src: displayAvatar, alt: displayName, className: "chat-bubble-sender-avatar-img" })) : (_jsx("div", { className: "chat-bubble-sender-avatar-initials", children: getInitials(displayName) })) })), _jsxs("div", { className: [
                            classes,
                            !message.text && message.imageUrl ? 'chat-bubble--image-only' : '',
                        ]
                            .filter(Boolean)
                            .join(' '), children: [!isOwn && (_jsx("div", { className: "chat-bubble-sender-name", children: displayName })), message.isPinned ? _jsx("div", { className: "chat-bubble-pinned", children: "\uD83D\uDCCC \u0110\u00E3 ghim" }) : null, message.isStarred ? _jsx("div", { className: "chat-bubble-starred", children: "\u2B50 \u0110\u00E3 \u0111\u00E1nh d\u1EA5u" }) : null, replyPreviewContent ? _jsx(ReplyPreview, { message: replyPreviewContent }) : null, _jsx("div", { className: "chat-bubble-body", children: renderMessageBody() })] }), _jsxs("div", { className: [
                            'chat-bubble-actions',
                            isOwn ? 'chat-bubble-actions--own' : 'chat-bubble-actions--other',
                            menuOpen || pickerOpen ? 'chat-bubble-actions--visible' : '',
                        ]
                            .filter(Boolean)
                            .join(' '), children: [_jsx("button", { ref: emojiButtonRef, className: "chat-bubble-action", onClick: () => {
                                    if (isActionDisabled)
                                        return;
                                    if (emojiButtonRef.current) {
                                        const rect = emojiButtonRef.current.getBoundingClientRect();
                                        setPickerPosition({
                                            top: rect.bottom + 6,
                                            right: window.innerWidth - rect.right,
                                            left: rect.left,
                                        });
                                    }
                                    setPickerOpen((prev) => !prev);
                                }, title: "Th\u00EAm c\u1EA3m x\u00FAc", type: "button", disabled: isActionDisabled, children: "\uD83D\uDE0A" }), _jsx("button", { ref: buttonRef, className: "chat-bubble-action", onClick: () => {
                                    if (isActionDisabled)
                                        return;
                                    setMenuOpen((prev) => !prev);
                                }, title: "T\u00F9y ch\u1ECDn", type: "button", disabled: isActionDisabled, children: "\u22EF" }), pickerOpen && pickerPosition ? (_jsx(ReactionPicker, { isOpen: pickerOpen, position: pickerPosition, onSelect: (emoji) => {
                                    onReact?.(message._id, emoji);
                                    setPickerOpen(false);
                                    setPickerPosition(null);
                                }, onClose: () => {
                                    setPickerOpen(false);
                                    setPickerPosition(null);
                                }, anchorClassName: isOwn ? undefined : 'chat-reaction-picker--other' })) : null, menuOpen && menuPosition
                                ? createPortal(_jsx(MessageContextMenu, { ref: menuRef, message: message, isOwn: isOwn, style: {
                                        top: `${menuPosition.top}px`,
                                        ...(isOwn ? { right: `${menuPosition.right}px` } : { left: `${menuPosition.left}px` }),
                                    }, onReply: (msg) => {
                                        onReply?.(msg);
                                        setMenuOpen(false);
                                        setMenuPosition(null);
                                    }, onCopy: () => {
                                        setMenuOpen(false);
                                        setMenuPosition(null);
                                    }, onPinToggle: (shouldPin) => {
                                        onTogglePin?.(message._id, shouldPin);
                                        setMenuOpen(false);
                                        setMenuPosition(null);
                                    }, onEdit: () => {
                                        onEdit?.(message);
                                        setMenuOpen(false);
                                        setMenuPosition(null);
                                    }, onDelete: () => {
                                        onDelete?.(message);
                                        setMenuOpen(false);
                                        setMenuPosition(null);
                                    }, onRevoke: () => {
                                        onRevoke?.(message);
                                        setMenuOpen(false);
                                        setMenuPosition(null);
                                    }, onStar: () => {
                                        onStar?.(message);
                                        setMenuOpen(false);
                                        setMenuPosition(null);
                                    }, onForward: (msg) => {
                                        onForward?.(msg);
                                        setMenuOpen(false);
                                        setMenuPosition(null);
                                    }, anchorClassName: isOwn ? undefined : 'chat-context-menu--other' }), document.body)
                                : null] })] }), _jsxs("div", { className: footerClass, children: [_jsxs("div", { className: "chat-bubble-meta", children: [_jsx("span", { className: "chat-bubble-time", children: new Date(message.createdAt).toLocaleTimeString('vi-VN', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                }) }), message.isEdited ? _jsx("span", { className: "chat-bubble-edited", children: "(\u0111\u00E3 ch\u1EC9nh s\u1EEDa)" }) : null, message.pending ? _jsx("span", { className: "chat-bubble-pending", children: "\u0110ang g\u1EEDi\u2026" }) : null, message.error ? _jsx("span", { className: "chat-bubble-error", children: message.error }) : null, isOwn && message.readBy && message.readBy.length > 0 && !message.pending && !message.error ? (_jsx("span", { className: "chat-bubble-read", title: `Đã đọc bởi ${message.readBy.length} người`, children: "\u2713\u2713" })) : isOwn && !message.pending && !message.error ? (_jsx("span", { className: "chat-bubble-sent", title: "\u0110\u00E3 g\u1EEDi", children: "\u2713" })) : null] }), _jsx(ReactionSummary, { reactions: message.reactions })] }), viewerOpen
                ? createPortal(_jsx("div", { className: "chat-image-viewer-backdrop", onClick: () => setViewerOpen(false), children: _jsxs("div", { className: "chat-image-viewer-content", onClick: (e) => e.stopPropagation(), children: [viewerImages[viewerIndex] ? (_jsx("img", { src: viewerImages[viewerIndex], alt: "attachment-large" })) : null, viewerImages.length > 1 ? (_jsx("div", { className: "chat-image-viewer-thumbs", children: viewerImages.map((src, index) => (_jsx("button", { type: "button", className: [
                                        'chat-image-viewer-thumb',
                                        index === viewerIndex ? 'chat-image-viewer-thumb--active' : '',
                                    ]
                                        .filter(Boolean)
                                        .join(' '), onClick: () => setViewerIndex(index), children: _jsx("img", { src: src, alt: `thumb-${index}` }) }, src + index))) })) : null] }) }), document.body)
                : null] }));
}
