import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { ProfileIcon, BellIcon, SearchIcon, PaletteIcon, ThumbsUpIcon, MediaIcon, FolderIcon, FileIcon } from '../Icons';
import '../../styles/group-info-panel.css';
export function DirectChatInfoPanel({ conversation, opponentName, opponentAvatar, messages = [], }) {
    const [isMediaOpen, setIsMediaOpen] = useState(false);
    const [mediaTab, setMediaTab] = useState('media');
    const [viewerOpen, setViewerOpen] = useState(false);
    const [viewerImages, setViewerImages] = useState([]);
    const [viewerIndex, setViewerIndex] = useState(0);
    const title = useMemo(() => opponentName || conversation.title || 'Đoạn chat', [opponentName, conversation.title]);
    const mediaMessages = useMemo(() => messages.filter((msg) => {
        const hasImageUrl = Boolean(msg.imageUrl);
        const isImageType = msg.type === 'image';
        const isFileImage = msg.file?.mime?.startsWith?.('image/');
        return hasImageUrl || isImageType || isFileImage;
    }), [messages]);
    const fileMessages = useMemo(() => messages.filter((msg) => {
        const isFileType = msg.type === 'file';
        const hasFile = Boolean(msg.file);
        const isNonImageFile = msg.file && !msg.file.mime?.startsWith?.('image/');
        return isFileType || (hasFile && isNonImageFile);
    }), [messages]);
    const mediaUrls = useMemo(() => mediaMessages
        .map((msg) => {
        const url = msg.imageUrl ||
            (msg.file?.mime?.startsWith?.('image/') ? msg.file.url : undefined);
        return url || null;
    })
        .filter((u) => Boolean(u)), [mediaMessages]);
    const openViewerAt = (index) => {
        if (!mediaUrls.length)
            return;
        const clamped = Math.max(0, Math.min(index, mediaUrls.length - 1));
        setViewerImages(mediaUrls);
        setViewerIndex(clamped);
        setViewerOpen(true);
    };
    return (_jsxs("div", { className: "group-info-panel direct-chat-panel", children: [_jsxs("div", { className: "group-info-section", children: [_jsxs("div", { className: "group-info-header direct-chat-header", children: [_jsx("div", { className: "group-info-avatar large", children: opponentAvatar ? _jsx("img", { src: opponentAvatar, alt: "" }) : _jsx(ProfileIcon, { size: 40, color: "#0966FF" }) }), _jsxs("div", { className: "direct-chat-header-text", children: [_jsx("div", { className: "group-info-title", children: title }), _jsx("div", { className: "group-info-subtitle", children: "\u0110o\u1EA1n chat c\u00E1 nh\u00E2n" })] })] }), _jsxs("div", { className: "direct-chat-action-row", children: [_jsxs("button", { className: "direct-chat-circle-btn", children: [_jsx("span", { className: "circle-icon", children: _jsx(ProfileIcon, { size: 20, color: "#e4e6eb" }) }), _jsx("span", { className: "circle-label", children: "Trang c\u00E1 nh\u00E2n" })] }), _jsxs("button", { className: "direct-chat-circle-btn", children: [_jsx("span", { className: "circle-icon", children: _jsx(BellIcon, { size: 20, color: "#e4e6eb" }) }), _jsx("span", { className: "circle-label", children: "T\u1EAFt th\u00F4ng b\u00E1o" })] }), _jsxs("button", { className: "direct-chat-circle-btn", children: [_jsx("span", { className: "circle-icon", children: _jsx(SearchIcon, { size: 20, color: "#e4e6eb" }) }), _jsx("span", { className: "circle-label", children: "T\u00ECm ki\u1EBFm" })] })] }), _jsx("div", { className: "group-info-divider" })] }), _jsxs("div", { className: "group-info-section", children: [_jsx("div", { className: "group-info-section-title", children: "Tu\u1EF3 ch\u1EC9nh \u0111o\u1EA1n chat" }), _jsxs("div", { className: "group-info-list", children: [_jsxs("button", { className: "group-info-item", children: [_jsx("span", { className: "group-info-item-icon", children: _jsx(PaletteIcon, { size: 20, color: "#e4e6eb" }) }), _jsx("span", { children: "\u0110\u1ED5i ch\u1EE7 \u0111\u1EC1" })] }), _jsxs("button", { className: "group-info-item", children: [_jsx("span", { className: "group-info-item-icon", children: _jsx(ThumbsUpIcon, { size: 20, color: "#e4e6eb" }) }), _jsx("span", { children: "Thay \u0111\u1ED5i bi\u1EC3u t\u01B0\u1EE3ng c\u1EA3m x\u00FAc" })] }), _jsxs("button", { className: "group-info-item", children: [_jsx("span", { className: "group-info-item-icon", style: { fontWeight: 700, fontSize: '14px' }, children: "Aa" }), _jsx("span", { children: "Ch\u1EC9nh s\u1EEDa bi\u1EC7t danh" })] })] })] }), _jsxs("div", { className: "group-info-section", children: [_jsx("div", { className: "group-info-section-title", children: "File ph\u01B0\u01A1ng ti\u1EC7n & file" }), _jsxs("div", { className: "group-info-list", children: [_jsxs("button", { className: "group-info-item", onClick: () => {
                                    setMediaTab('media');
                                    setIsMediaOpen(true);
                                }, children: [_jsx("span", { className: "group-info-item-icon", children: _jsx(MediaIcon, { size: 20, color: "#e4e6eb" }) }), _jsx("span", { children: "File ph\u01B0\u01A1ng ti\u1EC7n" })] }), _jsxs("button", { className: "group-info-item", onClick: () => {
                                    setMediaTab('files');
                                    setIsMediaOpen(true);
                                }, children: [_jsx("span", { className: "group-info-item-icon", children: _jsx(FolderIcon, { size: 20, color: "#e4e6eb" }) }), _jsx("span", { children: "File" })] })] })] }), isMediaOpen && (_jsx("div", { className: "media-overlay", children: _jsxs("div", { className: "media-overlay-inner", children: [_jsxs("div", { className: "media-overlay-header", children: [_jsx("button", { className: "media-back-btn", onClick: () => setIsMediaOpen(false), children: "\u2190" }), _jsxs("div", { className: "media-title-group", children: [_jsx("div", { className: "media-title", children: "File ph\u01B0\u01A1ng ti\u1EC7n & file" }), _jsx("div", { className: "media-subtitle", children: title })] })] }), _jsxs("div", { className: "media-tabs", children: [_jsx("button", { className: `media-tab ${mediaTab === 'media' ? 'active' : ''}`, onClick: () => setMediaTab('media'), children: "File ph\u01B0\u01A1ng ti\u1EC7n" }), _jsx("button", { className: `media-tab ${mediaTab === 'files' ? 'active' : ''}`, onClick: () => setMediaTab('files'), children: "File" })] }), _jsx("div", { className: "media-content", children: mediaTab === 'media' ? (mediaMessages.length === 0 ? (_jsx("div", { className: "media-placeholder", children: _jsx("p", { children: "Ch\u01B0a c\u00F3 file ph\u01B0\u01A1ng ti\u1EC7n n\u00E0o trong \u0111o\u1EA1n chat n\u00E0y." }) })) : (_jsx("div", { className: "media-grid", children: mediaMessages.map((msg, index) => {
                                    const key = msg._id || msg.localId || `${msg.createdAt}-${msg.senderId}`;
                                    const url = msg.imageUrl ||
                                        (msg.file?.mime?.startsWith?.('image/') ? msg.file.url : undefined);
                                    if (!url)
                                        return null;
                                    return (_jsx("button", { type: "button", className: "media-grid-item", onClick: () => openViewerAt(index), children: _jsx("img", { src: url, alt: "" }) }, key));
                                }) }))) : fileMessages.length === 0 ? (_jsx("div", { className: "media-placeholder", children: _jsx("p", { children: "Ch\u01B0a c\u00F3 file n\u00E0o trong \u0111o\u1EA1n chat n\u00E0y." }) })) : (_jsx("div", { className: "media-file-list", children: fileMessages.map((msg) => {
                                    const file = msg.file;
                                    if (!file)
                                        return null;
                                    const key = msg._id || msg.localId || `${msg.createdAt}-${msg.senderId}`;
                                    return (_jsxs("a", { href: file.url, target: "_blank", rel: "noreferrer", className: "media-file-item", children: [_jsx("div", { className: "media-file-icon", children: _jsx(FileIcon, { size: 24, color: "#0966FF" }) }), _jsxs("div", { className: "media-file-info", children: [_jsx("div", { className: "media-file-name", children: file.name || 'File đính kèm' }), _jsx("div", { className: "media-file-meta", children: new Date(msg.createdAt).toLocaleDateString('vi-VN') })] })] }, key));
                                }) })) })] }) })), viewerOpen
                ? createPortal(_jsx("div", { className: "chat-image-viewer-backdrop", onClick: () => setViewerOpen(false), children: _jsxs("div", { className: "chat-image-viewer-content", onClick: (e) => e.stopPropagation(), children: [viewerImages[viewerIndex] ? (_jsx("img", { src: viewerImages[viewerIndex], alt: "attachment-large" })) : null, viewerImages.length > 1 ? (_jsx("div", { className: "chat-image-viewer-thumbs", children: viewerImages.map((src, index) => (_jsx("button", { type: "button", className: [
                                        'chat-image-viewer-thumb',
                                        index === viewerIndex ? 'chat-image-viewer-thumb--active' : '',
                                    ]
                                        .filter(Boolean)
                                        .join(' '), onClick: () => setViewerIndex(index), children: _jsx("img", { src: src, alt: `thumb-${index}` }) }, src + index))) })) : null] }) }), document.body)
                : null] }));
}
