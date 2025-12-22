import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useRef, useEffect } from "react";
import { sharePostApi } from "../api";
import "../styles/feed.css";
export const SharePostModal = ({ isOpen, onClose, postId, onShareSuccess, currentUser, }) => {
    const [content, setContent] = useState("");
    const [visibility, setVisibility] = useState("PUBLIC");
    const [isSharing, setIsSharing] = useState(false);
    const [showVisibilityMenu, setShowVisibilityMenu] = useState(false);
    const textareaRef = useRef(null);
    const visibilityMenuRef = useRef(null);
    useEffect(() => {
        if (isOpen && textareaRef.current) {
            textareaRef.current.focus();
        }
    }, [isOpen]);
    useEffect(() => {
        if (!isOpen) {
            setContent("");
            setShowVisibilityMenu(false);
        }
    }, [isOpen]);
    useEffect(() => {
        if (!showVisibilityMenu)
            return;
        const handleClick = (event) => {
            if (visibilityMenuRef.current &&
                !visibilityMenuRef.current.contains(event.target)) {
                setShowVisibilityMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [showVisibilityMenu]);
    const handleShare = async () => {
        try {
            setIsSharing(true);
            await sharePostApi(postId, {
                content: content.trim() || undefined,
                visibility,
            });
            onShareSuccess?.();
            onClose();
        }
        catch (error) {
            console.error("Failed to share post:", error);
            alert("Lỗi khi chia sẻ bài viết");
        }
        finally {
            setIsSharing(false);
        }
    };
    if (!isOpen)
        return null;
    return (_jsx("div", { className: "create-post-modal-overlay", onClick: onClose, children: _jsxs("div", { className: "create-post-modal", onClick: (e) => e.stopPropagation(), children: [_jsxs("div", { className: "create-post-modal-header", children: [_jsx("h2", { children: "Chia s\u1EBB b\u00E0i vi\u1EBFt" }), _jsx("button", { className: "create-post-modal-close", onClick: onClose, children: "\u00D7" })] }), _jsxs("div", { className: "create-post-modal-body", children: [_jsx("div", { className: "create-post-modal-user", children: currentUser ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "create-post-modal-avatar", children: currentUser.avatar ? (_jsx("img", { src: currentUser.avatar, alt: currentUser.name })) : (_jsx("div", { className: "create-post-modal-avatar-initials", children: currentUser.name?.charAt(0)?.toUpperCase() || "U" })) }), _jsxs("div", { className: "create-post-modal-user-info", children: [_jsx("div", { className: "create-post-modal-user-name", children: currentUser.name }), _jsxs("div", { className: "create-post-modal-privacy-wrapper", ref: visibilityMenuRef, children: [_jsxs("button", { className: "create-post-modal-privacy", onClick: () => setShowVisibilityMenu(!showVisibilityMenu), children: [visibility === "PUBLIC" ? (_jsxs(_Fragment, { children: [_jsx("span", { children: "\uD83C\uDF10" }), " C\u00F4ng khai"] })) : visibility === "FRIENDS" ? (_jsxs(_Fragment, { children: [_jsx("span", { children: "\uD83D\uDC65" }), " B\u1EA1n b\u00E8"] })) : (_jsxs(_Fragment, { children: [_jsx("span", { children: "\uD83D\uDD12" }), " Ch\u1EC9 m\u00ECnh t\u00F4i"] })), _jsx("span", { children: "\u25BC" })] }), showVisibilityMenu && (_jsxs("div", { className: "create-post-modal-privacy-menu", children: [_jsxs("button", { onClick: () => {
                                                                    setVisibility("PUBLIC");
                                                                    setShowVisibilityMenu(false);
                                                                }, className: visibility === "PUBLIC" ? "active" : "", children: [_jsx("span", { children: "\uD83C\uDF10" }), _jsxs("div", { children: [_jsx("div", { children: "C\u00F4ng khai" }), _jsx("div", { className: "create-post-modal-privacy-menu-desc", children: "M\u1ECDi ng\u01B0\u1EDDi \u0111\u1EC1u c\u00F3 th\u1EC3 xem" })] })] }), _jsxs("button", { onClick: () => {
                                                                    setVisibility("FRIENDS");
                                                                    setShowVisibilityMenu(false);
                                                                }, className: visibility === "FRIENDS" ? "active" : "", children: [_jsx("span", { children: "\uD83D\uDC65" }), _jsxs("div", { children: [_jsx("div", { children: "B\u1EA1n b\u00E8" }), _jsx("div", { className: "create-post-modal-privacy-menu-desc", children: "Ch\u1EC9 b\u1EA1n b\u00E8 c\u00F3 th\u1EC3 xem" })] })] }), _jsxs("button", { onClick: () => {
                                                                    setVisibility("ONLY_ME");
                                                                    setShowVisibilityMenu(false);
                                                                }, className: visibility === "ONLY_ME" ? "active" : "", children: [_jsx("span", { children: "\uD83D\uDD12" }), _jsxs("div", { children: [_jsx("div", { children: "Ch\u1EC9 m\u00ECnh t\u00F4i" }), _jsx("div", { className: "create-post-modal-privacy-menu-desc", children: "Ch\u1EC9 b\u1EA1n c\u00F3 th\u1EC3 xem" })] })] })] }))] })] })] })) : (_jsx("div", { children: "Loading..." })) }), _jsx("textarea", { ref: textareaRef, className: "create-post-modal-textarea", value: content, onChange: (e) => setContent(e.target.value), placeholder: "Vi\u1EBFt g\u00EC \u0111\u00F3 v\u1EC1 b\u00E0i vi\u1EBFt n\u00E0y...", rows: 4 })] }), _jsx("div", { className: "create-post-modal-footer", children: _jsx("button", { className: "create-post-modal-submit", onClick: handleShare, disabled: isSharing, children: isSharing ? "Đang chia sẻ..." : "Chia sẻ" }) })] }) }));
};
