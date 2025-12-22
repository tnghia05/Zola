"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { getMessages, createMessage, createMessageWithPayload, createConversationWithUser, getOpponentInfo, getCurrentUserId, markAsRead, uploadChatFile, initiateCall, pinMessage, unpinMessage, starMessage, } from "../api";
import { getSocket } from "../socket";
import { registerChatSocket } from "../services/chatSocket";
import { CallPopupManager } from "../services/callPopup";
import { ForwardMessageDialog } from "./chat/ForwardMessageDialog";
import "../styles/floating-chat.css";
export const FloatingChatWindow = ({ userId, userName, userAvatar, isOnline, onClose, onMinimize, }) => {
    const [messages, setMessages] = useState([]);
    const [conversationId, setConversationId] = useState(null);
    const [inputText, setInputText] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [opponentInfo, setOpponentInfo] = useState(null);
    const [currentUserId, setCurrentUserId] = useState(null);
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const mediaInputRef = useRef(null);
    const [contextMenu, setContextMenu] = useState(null);
    const [forwardMessage, setForwardMessage] = useState(null);
    // Helper: get image URL for message (imageUrl or file.url)
    const getImageUrl = useCallback((message) => {
        return message?.imageUrl ?? message?.file?.url;
    }, []);
    const toChatMessage = useCallback((message) => ({
        ...message,
    }), []);
    // Load current user ID
    useEffect(() => {
        getCurrentUserId().then(setCurrentUserId).catch(() => setCurrentUserId(null));
    }, []);
    // Sort messages by time
    const sortMessages = useCallback((msgs) => {
        return [...msgs].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }, []);
    // Load or create conversation
    useEffect(() => {
        const loadConversation = async () => {
            try {
                setIsLoading(true);
                // Try to create or get conversation
                const conversation = await createConversationWithUser(userId);
                setConversationId(conversation._id);
                // Get opponent info
                const opponent = await getOpponentInfo(conversation._id);
                setOpponentInfo(opponent.user);
                // Load messages
                const msgs = await getMessages(conversation._id);
                const messagesArray = Array.isArray(msgs) ? msgs : msgs?.messages || [];
                setMessages(sortMessages(messagesArray));
                // Mark as read after loading messages
                try {
                    console.log("📖 FloatingChat: Marking conversation as read:", conversation._id);
                    await markAsRead(conversation._id);
                    console.log("✅ FloatingChat: Marked as read successfully");
                }
                catch (err) {
                    console.error("❌ FloatingChat: Failed to mark as read:", err);
                }
            }
            catch (error) {
                console.error("Failed to load conversation:", error);
            }
            finally {
                setIsLoading(false);
            }
        };
        loadConversation();
    }, [userId, sortMessages]);
    // Socket integration for realtime messages
    useEffect(() => {
        if (!conversationId)
            return;
        const socket = getSocket();
        if (!socket) {
            console.warn("Socket not available for floating chat");
            return;
        }
        // Join conversation room
        const joinRoom = () => {
            console.log(`📱 FloatingChat: Joining conversation room: conv:${conversationId}`);
            socket.emit("conversation:join", conversationId);
        };
        if (socket.connected) {
            joinRoom();
        }
        else {
            const onConnect = () => {
                joinRoom();
                socket.off("connect", onConnect);
            };
            socket.on("connect", onConnect);
        }
        // Register socket handlers
        const unsubscribe = registerChatSocket(socket, conversationId, {
            onMessageCreated: (message) => {
                console.log("📨 FloatingChat: New message received:", message._id);
                setMessages((prev) => {
                    const exists = prev.some((item) => item._id === message._id);
                    if (exists)
                        return prev;
                    const newMessages = sortMessages([...prev, message]);
                    // Force scroll after state update
                    setTimeout(() => {
                        if (messagesContainerRef.current) {
                            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
                        }
                        if (messagesEndRef.current) {
                            messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
                        }
                    }, 50);
                    return newMessages;
                });
                // Mark as read when new message arrives (only if message is from opponent)
                if (message.senderId !== currentUserId) {
                    console.log("📖 FloatingChat: Marking as read (new message from opponent)");
                    markAsRead(conversationId, message._id)
                        .then(() => console.log("✅ FloatingChat: Marked as read successfully"))
                        .catch((err) => console.error("❌ FloatingChat: Failed to mark as read:", err));
                }
            },
            onMessageUpdated: (message) => {
                setMessages((prev) => sortMessages(prev.map((item) => (item._id === message._id ? message : item))));
            },
            onMessageDeleted: (messageId) => {
                setMessages((prev) => prev.filter((item) => item._id !== messageId));
            },
        });
        return () => {
            unsubscribe();
            if (socket.connected) {
                socket.emit("conversation:leave", conversationId);
            }
        };
    }, [conversationId, sortMessages, currentUserId]);
    // Mark as read when window becomes visible/focused
    useEffect(() => {
        if (!conversationId)
            return;
        const handleVisibilityChange = () => {
            if (!document.hidden && conversationId) {
                console.log("📖 FloatingChat: Window visible, marking as read");
                markAsRead(conversationId)
                    .then(() => console.log("✅ FloatingChat: Marked as read (visibility change)"))
                    .catch((err) => console.error("❌ FloatingChat: Failed to mark as read:", err));
            }
        };
        document.addEventListener("visibilitychange", handleVisibilityChange);
        // Also mark as read when component mounts (window is visible)
        if (!document.hidden) {
            markAsRead(conversationId)
                .then(() => console.log("✅ FloatingChat: Marked as read (mount)"))
                .catch((err) => console.error("❌ FloatingChat: Failed to mark as read:", err));
        }
        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [conversationId]);
    // Auto scroll to bottom when messages change
    useEffect(() => {
        if (messages.length === 0)
            return;
        // Use requestAnimationFrame to ensure DOM is updated
        requestAnimationFrame(() => {
            setTimeout(() => {
                if (messagesContainerRef.current) {
                    const container = messagesContainerRef.current;
                    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
                    // Only auto-scroll if user is near bottom (not scrolled up)
                    if (isNearBottom || messages.length <= 5) {
                        container.scrollTop = container.scrollHeight;
                    }
                }
                if (messagesEndRef.current) {
                    messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
                }
            }, 100);
        });
    }, [messages]);
    // Also scroll when conversation loads or when window opens
    useEffect(() => {
        if (!isLoading && messages.length > 0 && messagesContainerRef.current) {
            requestAnimationFrame(() => {
                setTimeout(() => {
                    if (messagesContainerRef.current) {
                        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
                    }
                }, 300);
            });
        }
    }, [isLoading, conversationId]);
    const handleSendMessage = async () => {
        if (!inputText.trim() || !conversationId || isSending)
            return;
        const text = inputText.trim();
        setInputText("");
        setIsSending(true);
        try {
            const newMessage = await createMessage(conversationId, text);
            setMessages((prev) => {
                const exists = prev.some((msg) => msg._id === newMessage._id);
                if (exists)
                    return prev;
                return sortMessages([...prev, newMessage]);
            });
            // Mark as read after sending (to update read receipts)
            markAsRead(conversationId)
                .then(() => console.log("✅ FloatingChat: Marked as read after sending"))
                .catch((err) => console.error("❌ FloatingChat: Failed to mark as read:", err));
        }
        catch (error) {
            console.error("Failed to send message:", error);
            setInputText(text); // Restore text on error
        }
        finally {
            setIsSending(false);
        }
    };
    const handleUploadMedia = async (event) => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file || !conversationId)
            return;
        try {
            setIsUploading(true);
            const uploaded = await uploadChatFile(file);
            if (!uploaded?.url) {
                console.warn("FloatingChat: Upload did not return URL");
                return;
            }
            const baseFile = {
                url: uploaded.url,
                name: uploaded.name ?? file.name,
                mime: uploaded.mime ?? file.type,
                size: uploaded.size ?? file.size,
            };
            const isImageOrVideo = baseFile.mime?.startsWith("image/") ||
                baseFile.mime?.startsWith("video/") ||
                file.type.startsWith("image/") ||
                file.type.startsWith("video/");
            const payload = {
                type: isImageOrVideo ? "image" : "file",
                file: baseFile,
            };
            const newMessage = await createMessageWithPayload(conversationId, payload);
            setMessages((prev) => {
                const exists = prev.some((msg) => msg._id === newMessage._id);
                if (exists)
                    return prev;
                return sortMessages([...prev, newMessage]);
            });
        }
        catch (error) {
            console.error("FloatingChat: Failed to upload/send media:", error);
        }
        finally {
            setIsUploading(false);
        }
    };
    const handleVideoCall = async () => {
        if (!conversationId)
            return;
        try {
            console.log("[FloatingChat] Initiating video call...", { conversationId, userId });
            const result = await initiateCall(conversationId, "video", userId);
            if (!result.call?.id) {
                console.error("[FloatingChat] No call ID in response:", result);
                return;
            }
            const callType = result.call.callType === "sfu" ? "sfu" : "p2p";
            const livekitRoomName = result.call.livekitRoomName;
            const popup = new CallPopupManager();
            popup.openCallWindow(result.call.id, conversationId, false, {
                callType,
                livekitRoomName,
            });
        }
        catch (error) {
            console.error("[FloatingChat] Error initiating video call:", error);
        }
    };
    const handleAudioCall = async () => {
        if (!conversationId)
            return;
        try {
            console.log("[FloatingChat] Initiating audio call...", { conversationId, userId });
            const result = await initiateCall(conversationId, "audio", userId);
            if (!result.call?.id) {
                console.error("[FloatingChat] No call ID in response:", result);
                return;
            }
            const callType = result.call.callType === "sfu" ? "sfu" : "p2p";
            const livekitRoomName = result.call.livekitRoomName;
            const popup = new CallPopupManager();
            popup.openCallWindow(result.call.id, conversationId, false, {
                callType,
                livekitRoomName,
            });
        }
        catch (error) {
            console.error("[FloatingChat] Error initiating audio call:", error);
        }
    };
    // Context menu actions
    const openContextMenu = (message, event) => {
        event.stopPropagation();
        const rect = event.currentTarget.getBoundingClientRect();
        const VIEWPORT_PADDING = 8;
        const ESTIMATED_MENU_WIDTH = 220;
        const ESTIMATED_MENU_HEIGHT = 220;
        let x = rect.right;
        let y = rect.bottom;
        // Ưu tiên mở sang trái nếu gần mép phải
        if (x + ESTIMATED_MENU_WIDTH > window.innerWidth - VIEWPORT_PADDING) {
            x = rect.left - ESTIMATED_MENU_WIDTH;
        }
        // Không để menu tràn trên hoặc dưới
        if (y + ESTIMATED_MENU_HEIGHT > window.innerHeight - VIEWPORT_PADDING) {
            y = window.innerHeight - ESTIMATED_MENU_HEIGHT - VIEWPORT_PADDING;
        }
        if (y < VIEWPORT_PADDING) {
            y = VIEWPORT_PADDING;
        }
        setContextMenu({
            message,
            x,
            y,
        });
    };
    const closeContextMenu = () => setContextMenu(null);
    const handleReply = (message) => {
        const base = message.text ?? "";
        setInputText((prev) => (prev ? `${prev}\n${base}` : base));
        closeContextMenu();
    };
    const handleCopy = async (message) => {
        try {
            await navigator.clipboard.writeText(message.text ?? "");
        }
        catch (err) {
            console.error("FloatingChat: Failed to copy text:", err);
        }
        closeContextMenu();
    };
    const handlePinToggle = async (message) => {
        const shouldPin = !message.isPinned;
        try {
            const updated = shouldPin
                ? await pinMessage(message._id)
                : await unpinMessage(message._id);
            setMessages((prev) => prev.map((m) => (m._id === message._id ? { ...m, ...updated } : m)));
        }
        catch (err) {
            console.error("FloatingChat: Failed to toggle pin:", err);
        }
        closeContextMenu();
    };
    const handleStar = async (message) => {
        try {
            const updated = await starMessage(message._id);
            setMessages((prev) => prev.map((m) => (m._id === message._id ? { ...m, ...updated } : m)));
        }
        catch (err) {
            console.error("FloatingChat: Failed to star message:", err);
        }
        closeContextMenu();
    };
    const handleForward = (message) => {
        setForwardMessage(toChatMessage(message));
        closeContextMenu();
    };
    const handleKeyPress = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };
    const displayName = opponentInfo?.name || userName;
    const displayAvatar = opponentInfo?.avatar || userAvatar;
    return createPortal(_jsxs("div", { className: "floating-chat-window", children: [_jsxs("div", { className: "floating-chat-header", children: [_jsxs("div", { className: "floating-chat-header-left", children: [_jsxs("div", { className: "floating-chat-avatar", children: [displayAvatar ? (_jsx("img", { src: displayAvatar, alt: displayName })) : (_jsx("div", { className: "floating-chat-avatar-fallback", children: displayName?.charAt(0)?.toUpperCase() || "U" })), isOnline && _jsx("span", { className: "floating-chat-online-dot" })] }), _jsxs("div", { className: "floating-chat-header-info", children: [_jsx("span", { className: "floating-chat-header-name", children: displayName }), _jsx("span", { className: "floating-chat-header-status", children: isOnline ? "Đang hoạt động" : "Không hoạt động" })] })] }), _jsxs("div", { className: "floating-chat-header-actions", children: [_jsx("button", { className: "floating-chat-header-btn", onClick: handleAudioCall, title: "G\u1ECDi tho\u1EA1i", children: _jsx("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "currentColor", children: _jsx("path", { d: "M6.62 10.79a15.464 15.464 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24 11.72 11.72 0 003.68.59 1 1 0 011 1V21a1 1 0 01-1 1C10.3 22 2 13.7 2 3a1 1 0 011-1h3.5a1 1 0 011 1 11.72 11.72 0 00.59 3.68 1 1 0 01-.25 1.01l-2.22 2.1z" }) }) }), _jsx("button", { className: "floating-chat-header-btn", onClick: handleVideoCall, title: "G\u1ECDi video", children: _jsx("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "currentColor", children: _jsx("path", { d: "M17 10.5V7a2 2 0 00-2-2H5A2 2 0 003 7v10a2 2 0 002 2h10a2 2 0 002-2v-3.5l4 4v-11l-4 4z" }) }) }), _jsx("button", { className: "floating-chat-header-btn", onClick: onMinimize, title: "Thu nh\u1ECF", children: _jsx("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "currentColor", children: _jsx("path", { d: "M19 13H5v-2h14v2z" }) }) }), _jsx("button", { className: "floating-chat-header-btn", onClick: onClose, title: "\u0110\u00F3ng", children: _jsx("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "currentColor", children: _jsx("path", { d: "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" }) }) })] })] }), _jsxs("div", { className: "floating-chat-messages", ref: messagesContainerRef, children: [isLoading ? (_jsx("div", { className: "floating-chat-loading", children: "\u0110ang t\u1EA3i..." })) : !messages || messages.length === 0 ? (_jsx("div", { className: "floating-chat-empty", children: "Ch\u01B0a c\u00F3 tin nh\u1EAFn n\u00E0o" })) : ((messages || []).map((message) => {
                        const isOwn = message.senderId === currentUserId;
                        const imageUrl = getImageUrl(message);
                        const hasText = !!message.text && message.text.trim().length > 0;
                        const hasImage = !!imageUrl;
                        return (_jsxs("div", { className: `floating-chat-message ${isOwn ? "floating-chat-message--own" : ""}`, children: [_jsx("button", { className: "floating-chat-message-menu-btn", onClick: (e) => openContextMenu(message, e), title: "T\u00F9y ch\u1ECDn", children: "\u22EF" }), _jsxs("div", { className: `floating-chat-message-bubble ${!hasText && hasImage ? "floating-chat-message-bubble--image-only" : ""}`, children: [message.isPinned && (_jsx("div", { className: "floating-chat-message-pinned", children: "\uD83D\uDCCC \u0110\u00E3 ghim" })), message.isStarred && (_jsx("div", { className: "floating-chat-message-starred", children: "\u2B50 \u0110\u00E3 \u0111\u00E1nh d\u1EA5u" })), hasText && (_jsx("div", { className: "floating-chat-message-text", children: message.text })), hasImage && (_jsx("div", { className: "floating-chat-message-image-wrapper", children: _jsx("img", { src: imageUrl, alt: "attachment", className: "floating-chat-message-image" }) }))] }), _jsx("div", { className: "floating-chat-message-time", children: new Date(message.createdAt).toLocaleTimeString("vi-VN", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    }) })] }, message._id));
                    })), _jsx("div", { ref: messagesEndRef })] }), _jsxs("div", { className: "floating-chat-input-wrapper", onClick: closeContextMenu, children: [_jsxs("div", { className: "floating-chat-input-actions", children: [_jsx("input", { ref: mediaInputRef, type: "file", accept: "image/*,video/*", hidden: true, onChange: handleUploadMedia }), _jsx("button", { className: "floating-chat-input-btn", title: isUploading ? "Đang gửi ảnh/video..." : "Thêm ảnh/video", onClick: () => mediaInputRef.current?.click(), disabled: isUploading || isSending, children: _jsx("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "currentColor", children: _jsx("path", { d: "M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" }) }) }), _jsx("button", { className: "floating-chat-input-btn", title: "Th\u00EAm emoji", children: _jsx("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "currentColor", children: _jsx("path", { d: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" }) }) })] }), _jsx("textarea", { className: "floating-chat-input", placeholder: "Aa", value: inputText, onChange: (e) => setInputText(e.target.value), onKeyPress: handleKeyPress, rows: 1 }), _jsx("button", { className: "floating-chat-send-btn", onClick: handleSendMessage, disabled: !inputText.trim() || isSending, title: "G\u1EEDi", children: _jsx("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "currentColor", children: _jsx("path", { d: "M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" }) }) })] }), contextMenu &&
                createPortal(_jsxs("div", { className: "chat-context-menu", style: {
                        position: "fixed",
                        top: contextMenu.y,
                        left: contextMenu.x,
                        zIndex: 11000,
                    }, onClick: (e) => e.stopPropagation(), children: [_jsx("button", { className: "chat-context-menu-item", onClick: () => handleReply(contextMenu.message), children: "\u21A9 Tr\u1EA3 l\u1EDDi" }), _jsx("button", { className: "chat-context-menu-item", onClick: () => handleCopy(contextMenu.message), children: "\uD83D\uDCCB Sao ch\u00E9p" }), _jsx("button", { className: "chat-context-menu-item", onClick: () => handlePinToggle(contextMenu.message), children: contextMenu.message.isPinned ? "📌 Bỏ ghim" : "📌 Ghim tin nhắn" }), _jsx("button", { className: "chat-context-menu-item", onClick: () => handleStar(contextMenu.message), disabled: !!contextMenu.message.isStarred, children: contextMenu.message.isStarred ? "⭐ Đã đánh dấu" : "⭐ Đánh dấu sao" }), _jsx("button", { className: "chat-context-menu-item", onClick: () => handleForward(contextMenu.message), children: "\u21AA\uFE0F Chuy\u1EC3n ti\u1EBFp" })] }), document.body), forwardMessage && (_jsx(ForwardMessageDialog, { message: forwardMessage, onClose: () => setForwardMessage(null) }))] }), document.body);
};
