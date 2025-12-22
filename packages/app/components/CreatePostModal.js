import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useRef, useEffect } from "react";
import { uploadMediaApi, getFriends, getUsersByIds } from "../api";
import { CameraIcon, FriendsIcon, GlobeIcon, LockIcon } from "./Icons";
import "../styles/feed.css";
export const CreatePostModal = ({ isOpen, onClose, onSubmit, currentUser, }) => {
    const [content, setContent] = useState("");
    const [selectedMedia, setSelectedMedia] = useState([]);
    const [mediaPreviews, setMediaPreviews] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [visibility, setVisibility] = useState("PUBLIC");
    const [showVisibilityMenu, setShowVisibilityMenu] = useState(false);
    const [taggedUsers, setTaggedUsers] = useState([]);
    const [friends, setFriends] = useState([]);
    const [showTagMenu, setShowTagMenu] = useState(false);
    const [tagSearchQuery, setTagSearchQuery] = useState("");
    const fileInputRef = useRef(null);
    const textareaRef = useRef(null);
    const visibilityMenuRef = useRef(null);
    const tagMenuRef = useRef(null);
    useEffect(() => {
        if (isOpen && textareaRef.current) {
            textareaRef.current.focus();
        }
    }, [isOpen]);
    useEffect(() => {
        if (!isOpen) {
            // Reset form when modal closes
            setContent("");
            setSelectedMedia([]);
            mediaPreviews.forEach((url) => URL.revokeObjectURL(url));
            setMediaPreviews([]);
            setShowVisibilityMenu(false);
            setTaggedUsers([]);
            setShowTagMenu(false);
            setTagSearchQuery("");
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
        else {
            // Load friends when modal opens
            const loadFriends = async () => {
                try {
                    const friendsData = await getFriends();
                    if (friendsData.friendIds && friendsData.friendIds.length > 0) {
                        const usersData = await getUsersByIds(friendsData.friendIds);
                        setFriends(usersData.users || []);
                    }
                }
                catch (error) {
                    console.error("Failed to load friends:", error);
                }
            };
            loadFriends();
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
    useEffect(() => {
        if (!showTagMenu)
            return;
        const handleClick = (event) => {
            if (tagMenuRef.current &&
                !tagMenuRef.current.contains(event.target)) {
                setShowTagMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [showTagMenu]);
    const filteredFriends = friends.filter((friend) => (friend.name || "").toLowerCase().includes(tagSearchQuery.toLowerCase()) ||
        friend.username?.toLowerCase().includes(tagSearchQuery.toLowerCase())).filter((friend) => !taggedUsers.some((tagged) => tagged._id === friend._id));
    const handleTagFriend = (friend) => {
        if (!taggedUsers.some((tagged) => tagged._id === friend._id)) {
            setTaggedUsers([...taggedUsers, friend]);
        }
        setTagSearchQuery("");
        setShowTagMenu(false);
    };
    const handleRemoveTagged = (userId) => {
        setTaggedUsers(taggedUsers.filter((user) => user._id !== userId));
    };
    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0)
            return;
        // Validate files
        const validFiles = [];
        for (const file of files) {
            // Check file size (max 100MB for video, 20MB for image)
            const maxSize = file.type.startsWith("video/") ? 100 * 1024 * 1024 : 20 * 1024 * 1024;
            if (file.size > maxSize) {
                const maxSizeMB = file.type.startsWith("video/") ? 100 : 20;
                alert(`File ${file.name} quá lớn (tối đa ${maxSizeMB}MB)`);
                continue;
            }
            // Check file type
            if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
                alert(`File ${file.name} không phải ảnh hoặc video`);
                continue;
            }
            validFiles.push(file);
        }
        if (validFiles.length === 0)
            return;
        const limitedFiles = validFiles.slice(0, 4);
        setSelectedMedia(limitedFiles);
        const previews = limitedFiles.map((file) => URL.createObjectURL(file));
        setMediaPreviews(previews);
    };
    const removeMedia = (index) => {
        const newMedia = selectedMedia.filter((_, i) => i !== index);
        const newPreviews = mediaPreviews.filter((_, i) => i !== index);
        setSelectedMedia(newMedia);
        setMediaPreviews(newPreviews);
        URL.revokeObjectURL(mediaPreviews[index]);
    };
    const handleSubmit = async () => {
        if (!content.trim() && selectedMedia.length === 0)
            return;
        setIsUploading(true);
        try {
            const uploadedMedia = [];
            for (const file of selectedMedia) {
                try {
                    const media = await uploadMediaApi(file);
                    uploadedMedia.push(media);
                }
                catch (error) {
                    console.error("Failed to upload media:", error);
                    const errorMsg = error?.message || `Lỗi khi upload ${file.name}`;
                    alert(errorMsg);
                    // Stop uploading if one fails
                    throw error;
                }
            }
            await onSubmit(content, uploadedMedia, visibility, taggedUsers.map((u) => u._id));
            onClose();
        }
        catch (error) {
            console.error("Failed to create post:", error);
            alert("Lỗi khi đăng bài");
        }
        finally {
            setIsUploading(false);
        }
    };
    if (!isOpen)
        return null;
    return (_jsx("div", { className: "create-post-modal-overlay", onClick: onClose, children: _jsxs("div", { className: "create-post-modal", onClick: (e) => e.stopPropagation(), children: [_jsxs("div", { className: "create-post-modal-header", children: [_jsx("h2", { children: "T\u1EA1o b\u00E0i vi\u1EBFt" }), _jsx("button", { className: "create-post-modal-close", onClick: onClose, children: "\u00D7" })] }), _jsxs("div", { className: "create-post-modal-body", children: [_jsx("div", { className: "create-post-modal-user", children: currentUser ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "create-post-modal-avatar", children: currentUser.avatar ? (_jsx("img", { src: currentUser.avatar, alt: currentUser.name })) : (_jsx("div", { className: "create-post-modal-avatar-initials", children: currentUser.name?.charAt(0)?.toUpperCase() || "U" })) }), _jsxs("div", { className: "create-post-modal-user-info", children: [_jsx("div", { className: "create-post-modal-user-name", children: currentUser.name }), _jsxs("div", { className: "create-post-modal-privacy-wrapper", ref: visibilityMenuRef, children: [_jsxs("button", { className: "create-post-modal-privacy", onClick: () => setShowVisibilityMenu(!showVisibilityMenu), children: [visibility === "PUBLIC" ? (_jsxs(_Fragment, { children: [_jsx("span", { className: "visibility-icon", children: _jsx(GlobeIcon, { size: 14, color: "currentColor" }) }), " C\u00F4ng khai"] })) : visibility === "FRIENDS" ? (_jsxs(_Fragment, { children: [_jsx("span", { className: "visibility-icon", children: _jsx(FriendsIcon, { size: 14, color: "currentColor" }) }), " B\u1EA1n b\u00E8"] })) : (_jsxs(_Fragment, { children: [_jsx("span", { className: "visibility-icon", children: _jsx(LockIcon, { size: 14, color: "currentColor" }) }), " Ch\u1EC9 m\u00ECnh t\u00F4i"] })), _jsx("span", { children: "\u25BC" })] }), showVisibilityMenu && (_jsxs("div", { className: "create-post-modal-privacy-menu", children: [_jsxs("button", { onClick: () => {
                                                                    setVisibility("PUBLIC");
                                                                    setShowVisibilityMenu(false);
                                                                }, className: visibility === "PUBLIC" ? "active" : "", children: [_jsx("span", { className: "visibility-icon", children: _jsx(GlobeIcon, { size: 18, color: "currentColor" }) }), _jsxs("div", { children: [_jsx("div", { children: "C\u00F4ng khai" }), _jsx("div", { className: "create-post-modal-privacy-menu-desc", children: "M\u1ECDi ng\u01B0\u1EDDi \u0111\u1EC1u c\u00F3 th\u1EC3 xem" })] })] }), _jsxs("button", { onClick: () => {
                                                                    setVisibility("FRIENDS");
                                                                    setShowVisibilityMenu(false);
                                                                }, className: visibility === "FRIENDS" ? "active" : "", children: [_jsx("span", { className: "visibility-icon", children: _jsx(FriendsIcon, { size: 18, color: "currentColor" }) }), _jsxs("div", { children: [_jsx("div", { children: "B\u1EA1n b\u00E8" }), _jsx("div", { className: "create-post-modal-privacy-menu-desc", children: "Ch\u1EC9 b\u1EA1n b\u00E8 c\u00F3 th\u1EC3 xem" })] })] }), _jsxs("button", { onClick: () => {
                                                                    setVisibility("ONLY_ME");
                                                                    setShowVisibilityMenu(false);
                                                                }, className: visibility === "ONLY_ME" ? "active" : "", children: [_jsx("span", { className: "visibility-icon", children: _jsx(LockIcon, { size: 18, color: "currentColor" }) }), _jsxs("div", { children: [_jsx("div", { children: "Ch\u1EC9 m\u00ECnh t\u00F4i" }), _jsx("div", { className: "create-post-modal-privacy-menu-desc", children: "Ch\u1EC9 b\u1EA1n c\u00F3 th\u1EC3 xem" })] })] })] }))] })] })] })) : (_jsx("div", { children: "Loading..." })) }), _jsx("textarea", { ref: textareaRef, className: "create-post-modal-textarea", value: content, onChange: (e) => setContent(e.target.value), placeholder: `${currentUser?.name || "Bạn"} ơi, bạn đang nghĩ gì thế?`, rows: 4 }), mediaPreviews.length > 0 && (_jsx("div", { className: "create-post-modal-media-preview", children: mediaPreviews.map((preview, index) => {
                                const file = selectedMedia[index];
                                const isVideo = file?.type.startsWith("video/");
                                return (_jsxs("div", { className: "create-post-modal-media-item", children: [isVideo ? (_jsx("video", { src: preview, controls: true, style: { width: "100%", maxHeight: "400px" } })) : (_jsx("img", { src: preview, alt: `Preview ${index + 1}` })), _jsx("button", { className: "create-post-modal-media-remove", onClick: () => removeMedia(index), type: "button", children: "\u00D7" })] }, index));
                            }) })), _jsxs("div", { className: "create-post-modal-actions", children: [_jsx("div", { className: "create-post-modal-actions-label", children: "Th\u00EAm v\u00E0o b\u00E0i vi\u1EBFt c\u1EE7a b\u1EA1n" }), _jsxs("div", { className: "create-post-modal-actions-buttons", children: [_jsxs("button", { className: "create-post-modal-action-btn", onClick: () => fileInputRef.current?.click(), type: "button", title: "\u1EA2nh/Video", children: [_jsx("span", { className: "create-post-modal-action-icon", children: _jsx(CameraIcon, { size: 20, color: "#45bd62" }) }), _jsx("span", { children: "\u1EA2nh/Video" })] }), _jsxs("div", { className: "create-post-modal-action-wrapper", ref: tagMenuRef, children: [_jsxs("button", { className: "create-post-modal-action-btn", type: "button", title: "G\u1EAFn th\u1EBB b\u1EA1n b\u00E8", onClick: () => setShowTagMenu(!showTagMenu), children: [_jsx("span", { className: "create-post-modal-action-icon", children: _jsx(FriendsIcon, { size: 20, color: "#1877f2" }) }), _jsx("span", { children: "G\u1EAFn th\u1EBB b\u1EA1n b\u00E8" })] }), showTagMenu && (_jsxs("div", { className: "create-post-modal-tag-menu", children: [_jsx("input", { type: "text", placeholder: "T\u00ECm b\u1EA1n b\u00E8...", value: tagSearchQuery, onChange: (e) => setTagSearchQuery(e.target.value), className: "create-post-modal-tag-search", autoFocus: true }), _jsx("div", { className: "create-post-modal-tag-list", children: filteredFriends.length === 0 ? (_jsx("div", { className: "create-post-modal-tag-empty", children: tagSearchQuery ? "Không tìm thấy bạn bè" : "Không có bạn bè nào" })) : (filteredFriends.slice(0, 10).map((friend) => (_jsxs("button", { type: "button", className: "create-post-modal-tag-item", onClick: () => handleTagFriend(friend), children: [_jsx("div", { className: "create-post-modal-tag-avatar", children: friend.avatar ? (_jsx("img", { src: friend.avatar, alt: friend.name })) : (_jsx("div", { className: "create-post-modal-tag-avatar-initials", children: friend.name?.charAt(0)?.toUpperCase() || "U" })) }), _jsxs("div", { className: "create-post-modal-tag-info", children: [_jsx("div", { className: "create-post-modal-tag-name", children: friend.name }), friend.username && (_jsxs("div", { className: "create-post-modal-tag-username", children: ["@", friend.username] }))] })] }, friend._id)))) })] }))] }), taggedUsers.length > 0 && (_jsx("div", { className: "create-post-modal-tagged-list", children: taggedUsers.map((user) => (_jsxs("div", { className: "create-post-modal-tagged-item", children: [_jsxs("span", { children: ["@", user.name] }), _jsx("button", { type: "button", onClick: () => handleRemoveTagged(user._id), className: "create-post-modal-tagged-remove", children: "\u00D7" })] }, user._id))) })), _jsxs("button", { className: "create-post-modal-action-btn", type: "button", title: "C\u1EA3m x\u00FAc", disabled: true, children: [_jsx("span", { className: "create-post-modal-action-icon", children: "\uD83D\uDE0A" }), _jsx("span", { children: "C\u1EA3m x\u00FAc" })] }), _jsxs("button", { className: "create-post-modal-action-btn", type: "button", title: "V\u1ECB tr\u00ED", disabled: true, children: [_jsx("span", { className: "create-post-modal-action-icon", children: "\uD83D\uDCCD" }), _jsx("span", { children: "V\u1ECB tr\u00ED" })] }), _jsxs("button", { className: "create-post-modal-action-btn", type: "button", title: "GIF", disabled: true, children: [_jsx("span", { className: "create-post-modal-action-icon", children: "GIF" }), _jsx("span", { children: "GIF" })] })] })] }), _jsx("input", { ref: fileInputRef, type: "file", accept: "image/*,video/*", multiple: true, onChange: handleFileSelect, style: { display: "none" } })] }), _jsx("div", { className: "create-post-modal-footer", children: _jsx("button", { className: "create-post-modal-submit", onClick: handleSubmit, disabled: isUploading || (!content.trim() && selectedMedia.length === 0), children: isUploading ? "Đang đăng..." : "Đăng" }) })] }) }));
};
