import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useRef, useEffect } from "react";
import { uploadMediaApi, getFriends, getUsersByIds, createReelApi } from "../api";
import { ReelIcon, FriendsIcon, GlobeIcon, LockIcon } from "./Icons";
import "../styles/feed.css";
export const CreateReelModal = ({ isOpen, onClose, onSubmit, currentUser, }) => {
    const [caption, setCaption] = useState("");
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [videoPreview, setVideoPreview] = useState(null);
    const [thumbnailPreview, setThumbnailPreview] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [visibility, setVisibility] = useState("PUBLIC");
    const [showVisibilityMenu, setShowVisibilityMenu] = useState(false);
    const [taggedUsers, setTaggedUsers] = useState([]);
    const [friends, setFriends] = useState([]);
    const [showTagMenu, setShowTagMenu] = useState(false);
    const [tagSearchQuery, setTagSearchQuery] = useState("");
    const [videoDuration, setVideoDuration] = useState(0);
    const videoInputRef = useRef(null);
    const videoElementRef = useRef(null);
    const captionRef = useRef(null);
    const visibilityMenuRef = useRef(null);
    const tagMenuRef = useRef(null);
    useEffect(() => {
        if (isOpen && captionRef.current) {
            captionRef.current.focus();
        }
    }, [isOpen]);
    useEffect(() => {
        if (!isOpen) {
            // Reset form when modal closes
            setCaption("");
            setSelectedVideo(null);
            if (videoPreview)
                URL.revokeObjectURL(videoPreview);
            if (thumbnailPreview)
                URL.revokeObjectURL(thumbnailPreview);
            setVideoPreview(null);
            setThumbnailPreview(null);
            setShowVisibilityMenu(false);
            setTaggedUsers([]);
            setShowTagMenu(false);
            setTagSearchQuery("");
            setVideoDuration(0);
            setUploadProgress(0);
            if (videoInputRef.current) {
                videoInputRef.current.value = "";
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
    const handleVideoSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file)
            return;
        if (!file.type.startsWith("video/")) {
            alert("Vui lòng chọn file video");
            return;
        }
        // Check file size (max 100MB)
        if (file.size > 100 * 1024 * 1024) {
            alert("Video không được vượt quá 100MB");
            return;
        }
        setSelectedVideo(file);
        const videoUrl = URL.createObjectURL(file);
        setVideoPreview(videoUrl);
        // Load video to get duration and generate thumbnail
        const video = document.createElement("video");
        video.src = videoUrl;
        video.onloadedmetadata = () => {
            setVideoDuration(video.duration);
            // Generate thumbnail at 1 second
            video.currentTime = Math.min(1, video.duration / 2);
            video.onseeked = () => {
                const canvas = document.createElement("canvas");
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                const ctx = canvas.getContext("2d");
                if (ctx) {
                    ctx.drawImage(video, 0, 0);
                    const thumbnailUrl = canvas.toDataURL("image/jpeg");
                    setThumbnailPreview(thumbnailUrl);
                }
            };
        };
    };
    const handleRemoveVideo = () => {
        setSelectedVideo(null);
        if (videoPreview) {
            URL.revokeObjectURL(videoPreview);
            setVideoPreview(null);
        }
        if (thumbnailPreview) {
            URL.revokeObjectURL(thumbnailPreview);
            setThumbnailPreview(null);
        }
        setVideoDuration(0);
        if (videoInputRef.current) {
            videoInputRef.current.value = "";
        }
    };
    const handleSubmit = async () => {
        if (!selectedVideo) {
            alert("Vui lòng chọn video");
            return;
        }
        setIsUploading(true);
        setUploadProgress(0);
        try {
            // Upload video
            const videoResult = await uploadMediaApi(selectedVideo);
            setUploadProgress(50);
            // Upload thumbnail if available
            let thumbnailUrl = "";
            if (thumbnailPreview) {
                // Convert data URL to blob
                const response = await fetch(thumbnailPreview);
                const blob = await response.blob();
                const thumbnailFile = new File([blob], "thumbnail.jpg", { type: "image/jpeg" });
                const thumbnailResult = await uploadMediaApi(thumbnailFile);
                thumbnailUrl = thumbnailResult.url;
            }
            setUploadProgress(75);
            // Create reel
            await createReelApi({
                videoUrl: videoResult.url,
                thumbnailUrl: thumbnailUrl || videoResult.url, // Fallback to video URL if no thumbnail
                caption: caption.trim(),
                duration: videoDuration,
                visibility,
                taggedUsers: taggedUsers.map((u) => u._id),
            });
            setUploadProgress(100);
            // Call onSubmit callback if provided
            if (onSubmit) {
                await onSubmit();
            }
            // Close modal and reset
            onClose();
        }
        catch (error) {
            console.error("Failed to create reel:", error);
            alert(error.response?.data?.error || "Không thể đăng reel. Vui lòng thử lại.");
        }
        finally {
            setIsUploading(false);
            setUploadProgress(0);
        }
    };
    const filteredFriends = friends.filter((friend) => friend.name?.toLowerCase().includes(tagSearchQuery.toLowerCase()) ||
        friend.username?.toLowerCase().includes(tagSearchQuery.toLowerCase()) ||
        friend.email?.toLowerCase().includes(tagSearchQuery.toLowerCase()));
    const handleTagUser = (user) => {
        if (!taggedUsers.find((u) => u._id === user._id)) {
            setTaggedUsers([...taggedUsers, user]);
        }
        setTagSearchQuery("");
        setShowTagMenu(false);
    };
    const handleRemoveTag = (userId) => {
        setTaggedUsers(taggedUsers.filter((u) => u._id !== userId));
    };
    if (!isOpen)
        return null;
    return (_jsx("div", { className: "modal-backdrop", onClick: onClose, children: _jsxs("div", { className: "modal-panel", style: { maxWidth: 600 }, onClick: (e) => e.stopPropagation(), children: [_jsxs("div", { className: "modal-header", children: [_jsx("div", { className: "modal-title", children: "T\u1EA1o Reel" }), _jsx("button", { className: "modal-close", onClick: onClose, children: "\u00D7" })] }), _jsxs("div", { className: "modal-body", children: [_jsxs("div", { style: { marginBottom: "16px" }, children: [videoPreview ? (_jsxs("div", { style: { position: "relative", width: "100%", background: "#000", borderRadius: "8px", overflow: "hidden" }, children: [_jsx("video", { ref: videoElementRef, src: videoPreview, controls: true, style: { width: "100%", maxHeight: "400px", display: "block" } }), _jsx("button", { onClick: handleRemoveVideo, style: {
                                                position: "absolute",
                                                top: "8px",
                                                right: "8px",
                                                background: "rgba(0,0,0,0.7)",
                                                color: "#fff",
                                                border: "none",
                                                borderRadius: "50%",
                                                width: "32px",
                                                height: "32px",
                                                cursor: "pointer",
                                                fontSize: "18px",
                                            }, children: "\u00D7" }), videoDuration > 0 && (_jsxs("div", { style: { position: "absolute", bottom: "8px", left: "8px", background: "rgba(0,0,0,0.7)", color: "#fff", padding: "4px 8px", borderRadius: "4px", fontSize: "12px" }, children: [Math.floor(videoDuration / 60), ":", (Math.floor(videoDuration % 60)).toString().padStart(2, "0")] }))] })) : (_jsxs("div", { onClick: () => videoInputRef.current?.click(), style: {
                                        border: "2px dashed #3a3b3c",
                                        borderRadius: "8px",
                                        padding: "60px 20px",
                                        textAlign: "center",
                                        cursor: "pointer",
                                        background: "#242526",
                                        transition: "background 0.2s",
                                    }, onMouseEnter: (e) => (e.currentTarget.style.background = "#2a2b2c"), onMouseLeave: (e) => (e.currentTarget.style.background = "#242526"), children: [_jsx("div", { style: { marginBottom: "12px", display: "flex", justifyContent: "center" }, children: _jsx(ReelIcon, { size: 48, color: "#0966FF" }) }), _jsx("div", { style: { color: "#e4e6eb", fontSize: "16px", fontWeight: 600, marginBottom: "4px" }, children: "Ch\u1ECDn video \u0111\u1EC3 \u0111\u0103ng" }), _jsx("div", { style: { color: "#b0b3b8", fontSize: "14px" }, children: "T\u1ED1i \u0111a 100MB" })] })), _jsx("input", { ref: videoInputRef, type: "file", accept: "video/*", style: { display: "none" }, onChange: handleVideoSelect })] }), _jsxs("div", { style: { marginBottom: "16px" }, children: [_jsx("textarea", { ref: captionRef, value: caption, onChange: (e) => setCaption(e.target.value), placeholder: "Vi\u1EBFt ch\u00FA th\u00EDch...", maxLength: 2200, style: {
                                        width: "100%",
                                        minHeight: "100px",
                                        padding: "12px",
                                        background: "#3a3b3c",
                                        border: "1px solid #4a4b4c",
                                        borderRadius: "8px",
                                        color: "#e4e6eb",
                                        fontSize: "15px",
                                        fontFamily: "inherit",
                                        resize: "vertical",
                                    } }), _jsxs("div", { style: { textAlign: "right", color: "#b0b3b8", fontSize: "12px", marginTop: "4px" }, children: [caption.length, "/2200"] })] }), taggedUsers.length > 0 && (_jsx("div", { style: { marginBottom: "16px", display: "flex", flexWrap: "wrap", gap: "8px" }, children: taggedUsers.map((user) => (_jsxs("div", { style: {
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    background: "#3a3b3c",
                                    padding: "6px 12px",
                                    borderRadius: "20px",
                                    fontSize: "14px",
                                }, children: [_jsxs("span", { style: { color: "#e4e6eb" }, children: ["@", user.name || user.username || user.email] }), _jsx("button", { onClick: () => handleRemoveTag(user._id), style: {
                                            background: "transparent",
                                            border: "none",
                                            color: "#b0b3b8",
                                            cursor: "pointer",
                                            fontSize: "16px",
                                            padding: 0,
                                            width: "20px",
                                            height: "20px",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }, children: "\u00D7" })] }, user._id))) })), _jsxs("div", { style: { marginBottom: "16px", position: "relative" }, children: [_jsx("input", { type: "text", value: tagSearchQuery, onChange: (e) => {
                                        setTagSearchQuery(e.target.value);
                                        setShowTagMenu(true);
                                    }, onFocus: () => setShowTagMenu(true), placeholder: "G\u1EAFn th\u1EBB b\u1EA1n b\u00E8...", style: {
                                        width: "100%",
                                        padding: "10px 12px",
                                        background: "#3a3b3c",
                                        border: "1px solid #4a4b4c",
                                        borderRadius: "8px",
                                        color: "#e4e6eb",
                                        fontSize: "14px",
                                    } }), showTagMenu && filteredFriends.length > 0 && (_jsx("div", { ref: tagMenuRef, style: {
                                        position: "absolute",
                                        top: "100%",
                                        left: 0,
                                        right: 0,
                                        marginTop: "4px",
                                        background: "#242526",
                                        border: "1px solid #3a3b3c",
                                        borderRadius: "8px",
                                        maxHeight: "200px",
                                        overflowY: "auto",
                                        zIndex: 1000,
                                    }, children: filteredFriends.map((friend) => (_jsxs("div", { onClick: () => handleTagUser(friend), style: {
                                            padding: "12px",
                                            cursor: "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "12px",
                                            transition: "background 0.2s",
                                        }, onMouseEnter: (e) => (e.currentTarget.style.background = "#3a3b3c"), onMouseLeave: (e) => (e.currentTarget.style.background = "transparent"), children: [friend.avatar ? (_jsx("img", { src: friend.avatar, alt: friend.name || "", style: { width: "40px", height: "40px", borderRadius: "50%" } })) : (_jsx("div", { style: {
                                                    width: "40px",
                                                    height: "40px",
                                                    borderRadius: "50%",
                                                    background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    color: "#fff",
                                                    fontWeight: 700,
                                                }, children: friend.name?.charAt(0)?.toUpperCase() || "U" })), _jsx("div", { children: _jsx("div", { style: { color: "#e4e6eb", fontSize: "14px", fontWeight: 600 }, children: friend.name || friend.username || friend.email }) })] }, friend._id))) }))] }), _jsxs("div", { style: { marginBottom: "16px", position: "relative" }, children: [_jsxs("button", { onClick: () => setShowVisibilityMenu(!showVisibilityMenu), style: {
                                        width: "100%",
                                        padding: "10px 12px",
                                        background: "#3a3b3c",
                                        border: "1px solid #4a4b4c",
                                        borderRadius: "8px",
                                        color: "#e4e6eb",
                                        fontSize: "14px",
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                    }, children: [_jsxs("span", { style: { display: "flex", alignItems: "center", gap: "8px" }, children: [visibility === "PUBLIC" && _jsxs(_Fragment, { children: [_jsx(GlobeIcon, { size: 16, color: "currentColor" }), " C\u00F4ng khai"] }), visibility === "FRIENDS" && _jsxs(_Fragment, { children: [_jsx(FriendsIcon, { size: 16, color: "currentColor" }), " B\u1EA1n b\u00E8"] }), visibility === "ONLY_ME" && _jsxs(_Fragment, { children: [_jsx(LockIcon, { size: 16, color: "currentColor" }), " Ch\u1EC9 m\u00ECnh t\u00F4i"] })] }), _jsx("span", { children: "\u25BC" })] }), showVisibilityMenu && (_jsx("div", { ref: visibilityMenuRef, style: {
                                        position: "absolute",
                                        top: "100%",
                                        left: 0,
                                        right: 0,
                                        marginTop: "4px",
                                        background: "#242526",
                                        border: "1px solid #3a3b3c",
                                        borderRadius: "8px",
                                        overflow: "hidden",
                                        zIndex: 1000,
                                    }, children: [
                                        { value: "PUBLIC", label: "Công khai", desc: "Mọi người có thể xem", Icon: GlobeIcon },
                                        { value: "FRIENDS", label: "Bạn bè", desc: "Chỉ bạn bè có thể xem", Icon: FriendsIcon },
                                        { value: "ONLY_ME", label: "Chỉ mình tôi", desc: "Chỉ bạn có thể xem", Icon: LockIcon },
                                    ].map((option) => (_jsxs("button", { onClick: () => {
                                            setVisibility(option.value);
                                            setShowVisibilityMenu(false);
                                        }, style: {
                                            width: "100%",
                                            padding: "12px",
                                            background: visibility === option.value ? "#3a3b3c" : "transparent",
                                            border: "none",
                                            color: "#e4e6eb",
                                            fontSize: "14px",
                                            textAlign: "left",
                                            cursor: "pointer",
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: "4px",
                                        }, onMouseEnter: (e) => {
                                            if (visibility !== option.value) {
                                                e.currentTarget.style.background = "#3a3b3c";
                                            }
                                        }, onMouseLeave: (e) => {
                                            if (visibility !== option.value) {
                                                e.currentTarget.style.background = "transparent";
                                            }
                                        }, children: [_jsxs("span", { style: { fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }, children: [_jsx(option.Icon, { size: 16, color: "currentColor" }), " ", option.label] }), _jsx("span", { style: { fontSize: "12px", color: "#b0b3b8" }, children: option.desc })] }, option.value))) }))] }), isUploading && (_jsxs("div", { style: { marginBottom: "16px" }, children: [_jsxs("div", { style: { display: "flex", justifyContent: "space-between", marginBottom: "4px" }, children: [_jsx("span", { style: { color: "#e4e6eb", fontSize: "14px" }, children: "\u0110ang t\u1EA3i l\u00EAn..." }), _jsxs("span", { style: { color: "#b0b3b8", fontSize: "14px" }, children: [uploadProgress, "%"] })] }), _jsx("div", { style: {
                                        width: "100%",
                                        height: "8px",
                                        background: "#3a3b3c",
                                        borderRadius: "4px",
                                        overflow: "hidden",
                                    }, children: _jsx("div", { style: {
                                            width: `${uploadProgress}%`,
                                            height: "100%",
                                            background: "#2374e1",
                                            transition: "width 0.3s",
                                        } }) })] }))] }), _jsxs("div", { className: "modal-footer", children: [_jsx("button", { className: "modal-button modal-button--secondary", onClick: onClose, disabled: isUploading, children: "H\u1EE7y" }), _jsx("button", { className: "modal-button modal-button--primary", onClick: handleSubmit, disabled: !selectedVideo || isUploading, children: isUploading ? "Đang đăng..." : "Đăng Reel" })] })] }) }));
};
