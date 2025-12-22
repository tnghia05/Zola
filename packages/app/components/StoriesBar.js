import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export const StoriesBar = ({ currentUser, groups, loading, onCreateStory, onSelectStory, }) => {
    return (_jsxs("section", { className: "stories-bar", children: [_jsxs("div", { className: "story-card story-card--add", onClick: onCreateStory, children: [_jsx("div", { className: "story-card-bg", children: currentUser?.avatar ? (_jsx("img", { src: currentUser.avatar, alt: currentUser.name })) : (_jsx("div", { className: "story-card-bg-placeholder" })) }), _jsx("div", { className: "story-card-overlay" }), _jsx("div", { className: "story-card-add-btn", children: _jsx("span", { children: "\uFF0B" }) }), _jsx("div", { className: "story-card-name", children: "T\u1EA1o tin" })] }), _jsx("div", { className: "stories-scroll", children: loading && groups.length === 0 ? (_jsx("div", { className: "story-card story-card--loading", children: "\u0110ang t\u1EA3i..." })) : (groups.map((group, groupIndex) => {
                    const hasUnseen = group.stories.some((story) => !story.isSeen);
                    const firstStory = group.stories[0];
                    if (!firstStory)
                        return null;
                    const media = firstStory.media[0];
                    const isVideo = media?.type === "video";
                    const thumbnailUrl = media?.thumbnail || media?.url;
                    const authorAvatar = group.author.avatar;
                    return (_jsxs("div", { className: `story-card ${hasUnseen ? "story-card--unseen" : "story-card--seen"}`, onClick: () => onSelectStory(groupIndex, 0), children: [_jsx("div", { className: "story-card-bg", children: media ? (isVideo ? (
                                // Video: hiển thị thumbnail hoặc video muted
                                media.thumbnail ? (_jsx("img", { src: media.thumbnail, alt: group.author.name || "Story" })) : (_jsx("video", { src: media.url, muted: true, playsInline: true, preload: "metadata" }))) : (_jsx("img", { src: media.url, alt: group.author.name || "Story" }))) : (_jsx("div", { className: "story-card-bg-placeholder" })) }), _jsx("div", { className: "story-card-overlay" }), isVideo && (_jsx("div", { className: "story-card-play-icon", children: _jsx("svg", { viewBox: "0 0 24 24", fill: "currentColor", width: "24", height: "24", children: _jsx("path", { d: "M8 5v14l11-7z" }) }) })), _jsx("div", { className: `story-card-avatar-small ${hasUnseen ? "story-card-avatar-small--unseen" : ""}`, children: authorAvatar ? (_jsx("img", { src: authorAvatar, alt: group.author.name || "User" })) : (_jsx("div", { className: "story-card-initials-small", children: group.author.name?.charAt(0)?.toUpperCase() || "U" })) }), _jsx("div", { className: "story-card-name", children: group.author.name || "Người dùng" })] }, group.author._id));
                })) })] }));
};
