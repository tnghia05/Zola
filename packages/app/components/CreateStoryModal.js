import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState, useCallback, useRef } from "react";
import { searchMusicApi } from "../api";
import { uploadMediaApi } from "../api";
export const CreateStoryModal = ({ isOpen, onClose, onSubmit, currentUser }) => {
    const [caption, setCaption] = useState("");
    const [media, setMedia] = useState([]);
    const [visibility, setVisibility] = useState("FRIENDS");
    const [music, setMusic] = useState(null);
    const [showMusicInput, setShowMusicInput] = useState(false);
    const [musicTitle, setMusicTitle] = useState("");
    const [musicArtist, setMusicArtist] = useState("");
    const [musicUrl, setMusicUrl] = useState("");
    const [musicSearchQuery, setMusicSearchQuery] = useState("");
    const [musicSearchResults, setMusicSearchResults] = useState([]);
    const [isSearchingMusic, setIsSearchingMusic] = useState(false);
    const [showMusicSearch, setShowMusicSearch] = useState(false);
    const [selectedTrack, setSelectedTrack] = useState(null);
    const [showSegmentSelector, setShowSegmentSelector] = useState(false);
    const [segmentStart, setSegmentStart] = useState(0);
    const [segmentEnd, setSegmentEnd] = useState(30);
    const [isPlayingPreview, setIsPlayingPreview] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const audioPreviewRef = useRef(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    useEffect(() => {
        if (!isOpen) {
            setCaption("");
            setMedia([]);
            setVisibility("FRIENDS");
            setMusic(null);
            setShowMusicInput(false);
            setMusicTitle("");
            setMusicArtist("");
            setMusicUrl("");
            setMusicSearchQuery("");
            setMusicSearchResults([]);
            setShowMusicSearch(false);
            setSelectedTrack(null);
            setShowSegmentSelector(false);
            setSegmentStart(0);
            setSegmentEnd(30);
            setIsPlayingPreview(false);
            setCurrentTime(0);
            if (audioPreviewRef.current) {
                audioPreviewRef.current.pause();
                audioPreviewRef.current.src = "";
            }
            setError(null);
            setIsUploading(false);
            setIsSubmitting(false);
        }
    }, [isOpen]);
    const handleSearchMusic = useCallback(async (query) => {
        if (!query.trim()) {
            setMusicSearchResults([]);
            return;
        }
        setIsSearchingMusic(true);
        try {
            const results = await searchMusicApi(query);
            setMusicSearchResults(results);
        }
        catch (err) {
            setError("Tìm kiếm nhạc thất bại");
        }
        finally {
            setIsSearchingMusic(false);
        }
    }, []);
    const handleSelectMusic = (track) => {
        if (track.previewUrl) {
            setSelectedTrack(track);
            setShowSegmentSelector(true);
            setSegmentStart(0);
            setSegmentEnd(30);
            setCurrentTime(0);
        }
        else {
            // No preview URL, add directly
            setMusic({
                title: track.trackName,
                artist: track.artistName,
                url: undefined,
                thumbnail: track.artworkUrl100 || track.artworkUrl60,
                durationMs: track.trackTimeMillis,
                source: "itunes",
                startTime: 0,
                endTime: 30,
            });
            setShowMusicInput(false);
            setShowMusicSearch(false);
            setMusicSearchQuery("");
            setMusicSearchResults([]);
            setError(null);
        }
    };
    const handleConfirmSegment = () => {
        if (!selectedTrack)
            return;
        setMusic({
            title: selectedTrack.trackName,
            artist: selectedTrack.artistName,
            url: selectedTrack.previewUrl,
            thumbnail: selectedTrack.artworkUrl100 || selectedTrack.artworkUrl60,
            durationMs: selectedTrack.trackTimeMillis,
            source: "itunes",
            startTime: segmentStart,
            endTime: segmentEnd,
        });
        setShowSegmentSelector(false);
        setShowMusicInput(false);
        setShowMusicSearch(false);
        setMusicSearchQuery("");
        setMusicSearchResults([]);
        setSelectedTrack(null);
        setIsPlayingPreview(false);
        setCurrentTime(0);
        if (audioPreviewRef.current) {
            audioPreviewRef.current.pause();
            audioPreviewRef.current.src = "";
        }
        setError(null);
    };
    const handleCancelSegment = () => {
        setShowSegmentSelector(false);
        setSelectedTrack(null);
        setIsPlayingPreview(false);
        setCurrentTime(0);
        setSegmentStart(0);
        setSegmentEnd(30);
        if (audioPreviewRef.current) {
            audioPreviewRef.current.pause();
            audioPreviewRef.current.src = "";
        }
    };
    // Audio preview controls
    useEffect(() => {
        const audio = audioPreviewRef.current;
        if (!audio || !selectedTrack?.previewUrl)
            return;
        audio.src = selectedTrack.previewUrl;
        audio.currentTime = segmentStart;
        const updateTime = () => {
            const time = audio.currentTime;
            setCurrentTime(time);
            if (time >= segmentEnd) {
                audio.pause();
                setIsPlayingPreview(false);
                audio.currentTime = segmentStart;
            }
        };
        audio.addEventListener("timeupdate", updateTime);
        audio.addEventListener("ended", () => {
            setIsPlayingPreview(false);
            audio.currentTime = segmentStart;
        });
        return () => {
            audio.removeEventListener("timeupdate", updateTime);
        };
    }, [selectedTrack, segmentStart, segmentEnd]);
    const handlePlayPause = () => {
        const audio = audioPreviewRef.current;
        if (!audio)
            return;
        if (isPlayingPreview) {
            audio.pause();
            setIsPlayingPreview(false);
        }
        else {
            audio.currentTime = segmentStart;
            audio.play().then(() => setIsPlayingPreview(true)).catch(() => setIsPlayingPreview(false));
        }
    };
    const handleTimelineClick = (e) => {
        const audio = audioPreviewRef.current;
        if (!audio || !selectedTrack?.previewUrl)
            return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = x / rect.width;
        const totalDuration = 30; // iTunes previews are usually 30s
        const newTime = Math.max(0, Math.min(totalDuration, percentage * totalDuration));
        if (newTime < segmentStart) {
            setSegmentStart(Math.max(0, newTime - 15));
            setSegmentEnd(Math.max(30, newTime + 15));
        }
        else if (newTime > segmentEnd) {
            setSegmentEnd(Math.min(totalDuration, newTime + 15));
            setSegmentStart(Math.max(0, newTime - 15));
        }
        else {
            audio.currentTime = newTime;
            setCurrentTime(newTime);
        }
    };
    const handleSegmentDrag = (type, e) => {
        const audio = audioPreviewRef.current;
        if (!audio || !selectedTrack?.previewUrl)
            return;
        const totalDuration = 30;
        const rect = e.currentTarget.closest(".story-music-segment-timeline")?.getBoundingClientRect();
        if (!rect)
            return;
        const handleMouseMove = (moveEvent) => {
            const x = moveEvent.clientX - rect.left;
            const percentage = Math.max(0, Math.min(1, x / rect.width));
            const time = percentage * totalDuration;
            if (type === "start") {
                const newStart = Math.max(0, Math.min(time, segmentEnd - 5));
                setSegmentStart(newStart);
                if (audio.currentTime < newStart) {
                    audio.currentTime = newStart;
                }
            }
            else {
                const newEnd = Math.max(segmentStart + 5, Math.min(totalDuration, time));
                setSegmentEnd(newEnd);
                if (audio.currentTime > newEnd) {
                    audio.currentTime = newEnd;
                }
            }
        };
        const handleMouseUp = () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };
        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
    };
    if (!isOpen)
        return null;
    const handleFiles = async (files) => {
        if (!files || files.length === 0)
            return;
        setIsUploading(true);
        setError(null);
        try {
            const uploads = [];
            for (const file of Array.from(files)) {
                if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
                    setError("Chỉ hỗ trợ ảnh hoặc video.");
                    continue;
                }
                const uploaded = await uploadMediaApi(file);
                uploads.push({
                    url: uploaded.url,
                    type: uploaded.type === "video" ? "video" : "image",
                });
            }
            setMedia((prev) => [...prev, ...uploads]);
        }
        catch (err) {
            setError(err?.message || "Upload thất bại");
        }
        finally {
            setIsUploading(false);
        }
    };
    const handleAddMusic = () => {
        if (!musicTitle.trim() || !musicArtist.trim()) {
            setError("Vui lòng nhập tên bài hát và nghệ sĩ.");
            return;
        }
        setMusic({
            title: musicTitle.trim(),
            artist: musicArtist.trim(),
            url: musicUrl.trim() || undefined,
            source: "custom",
        });
        setShowMusicInput(false);
        setError(null);
    };
    const handleRemoveMusic = () => {
        setMusic(null);
        setMusicTitle("");
        setMusicArtist("");
        setMusicUrl("");
    };
    const handleSubmit = async () => {
        if (media.length === 0) {
            setError("Vui lòng thêm ít nhất một ảnh hoặc video.");
            return;
        }
        setIsSubmitting(true);
        setError(null);
        try {
            await onSubmit({
                media,
                caption: caption.trim() || undefined,
                visibility,
                music: music || undefined,
            });
            setCaption("");
            setMedia([]);
            setVisibility("FRIENDS");
            setMusic(null);
            setMusicTitle("");
            setMusicArtist("");
            setMusicUrl("");
            onClose();
        }
        catch (err) {
            setError(err?.message || "Đăng tin thất bại");
        }
        finally {
            setIsSubmitting(false);
        }
    };
    const removeMedia = (index) => {
        setMedia((prev) => prev.filter((_, i) => i !== index));
    };
    return (_jsx("div", { className: "modal-backdrop", children: _jsxs("div", { className: "modal-card", children: [_jsxs("header", { className: "modal-header", children: [_jsx("h3", { children: "T\u1EA1o tin" }), _jsx("button", { className: "modal-close", onClick: onClose, children: "\u2715" })] }), _jsxs("div", { className: "modal-body", children: [_jsxs("div", { className: "modal-user-row", children: [_jsx("div", { className: "feed-avatar-circle", children: currentUser?.avatar ? (_jsx("img", { src: currentUser.avatar, alt: currentUser.name })) : (_jsx("div", { className: "feed-avatar-initials", children: currentUser?.name?.charAt(0)?.toUpperCase() || "U" })) }), _jsxs("div", { children: [_jsx("div", { className: "modal-user-name", children: currentUser?.name || "Bạn" }), _jsxs("select", { className: "modal-select", value: visibility, onChange: (e) => setVisibility(e.target.value), children: [_jsx("option", { value: "FRIENDS", children: "B\u1EA1n b\u00E8" }), _jsx("option", { value: "PUBLIC", children: "C\u00F4ng khai" })] })] })] }), _jsx("textarea", { className: "modal-textarea", placeholder: "Chia s\u1EBB c\u1EA3m ngh\u0129...", value: caption, onChange: (e) => setCaption(e.target.value) }), _jsxs("div", { className: "story-media-preview", children: [media.map((item, index) => (_jsxs("div", { className: "story-media-item", children: [_jsx("button", { className: "story-media-remove", onClick: () => removeMedia(index), children: "\u2715" }), item.type === "video" ? (_jsx("video", { src: item.url, controls: true })) : (_jsx("img", { src: item.url, alt: `story-${index}` }))] }, index))), _jsxs("label", { className: "story-media-upload", style: { display: 'block', width: '100%' }, children: [_jsx("span", { style: { pointerEvents: 'none' }, children: isUploading ? "Đang upload..." : "Thêm ảnh/video" }), _jsx("input", { type: "file", accept: "image/*,video/*", multiple: true, onChange: (e) => handleFiles(e.target.files), disabled: isUploading, style: { position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer' } })] })] }), _jsxs("div", { className: "story-music-section", children: [music ? (_jsxs("div", { className: "story-music-display", children: [_jsxs("div", { className: "story-music-info", children: [_jsx("span", { className: "story-music-icon", children: "\uD83C\uDFB5" }), _jsxs("div", { children: [_jsx("div", { className: "story-music-title", children: music.title }), _jsx("div", { className: "story-music-artist", children: music.artist })] })] }), _jsx("button", { className: "story-music-remove", onClick: handleRemoveMusic, children: "\u2715" })] })) : (_jsxs("button", { className: "story-music-add-btn", onClick: () => setShowMusicInput(!showMusicInput), children: [_jsx("span", { children: "\uD83C\uDFB5" }), _jsx("span", { children: "Th\u00EAm nh\u1EA1c" })] })), showMusicInput && !music && (_jsxs("div", { className: "story-music-input", children: [_jsxs("div", { className: "story-music-tabs", children: [_jsx("button", { className: `story-music-tab ${!showMusicSearch ? "active" : ""}`, onClick: () => setShowMusicSearch(false), children: "Nh\u1EADp th\u1EE7 c\u00F4ng" }), _jsx("button", { className: `story-music-tab ${showMusicSearch ? "active" : ""}`, onClick: () => setShowMusicSearch(true), children: "T\u00ECm ki\u1EBFm nh\u1EA1c" })] }), showMusicSearch ? (_jsxs("div", { className: "story-music-search", children: [_jsxs("div", { className: "story-music-search-box", children: [_jsx("input", { type: "text", placeholder: "T\u00ECm ki\u1EBFm b\u00E0i h\u00E1t, ngh\u1EC7 s\u0129...", value: musicSearchQuery, onChange: (e) => {
                                                                setMusicSearchQuery(e.target.value);
                                                                const query = e.target.value.trim();
                                                                if (query.length > 2) {
                                                                    handleSearchMusic(query);
                                                                }
                                                                else {
                                                                    setMusicSearchResults([]);
                                                                }
                                                            }, className: "story-music-field" }), isSearchingMusic && _jsx("span", { className: "story-music-search-loading", children: "\uD83D\uDD0D" })] }), musicSearchResults.length > 0 && (_jsx("div", { className: "story-music-results", children: musicSearchResults.map((track) => (_jsxs("div", { className: "story-music-result-item", onClick: () => handleSelectMusic(track), children: [track.artworkUrl60 && (_jsx("img", { src: track.artworkUrl60, alt: track.trackName, className: "story-music-result-thumb" })), _jsxs("div", { className: "story-music-result-info", children: [_jsx("div", { className: "story-music-result-title", children: track.trackName }), _jsx("div", { className: "story-music-result-artist", children: track.artistName })] }), track.previewUrl && (_jsx("span", { className: "story-music-result-preview", children: "\u25B6" }))] }, track.trackId))) })), musicSearchQuery.length > 2 && musicSearchResults.length === 0 && !isSearchingMusic && (_jsx("div", { className: "story-music-no-results", children: "Kh\u00F4ng t\u00ECm th\u1EA5y k\u1EBFt qu\u1EA3" }))] })) : (_jsxs(_Fragment, { children: [_jsx("input", { type: "text", placeholder: "T\u00EAn b\u00E0i h\u00E1t", value: musicTitle, onChange: (e) => setMusicTitle(e.target.value), className: "story-music-field" }), _jsx("input", { type: "text", placeholder: "Ngh\u1EC7 s\u0129", value: musicArtist, onChange: (e) => setMusicArtist(e.target.value), className: "story-music-field" }), _jsx("input", { type: "text", placeholder: "URL nh\u1EA1c (t\u00F9y ch\u1ECDn)", value: musicUrl, onChange: (e) => setMusicUrl(e.target.value), className: "story-music-field" })] })), _jsxs("div", { className: "story-music-actions", children: [_jsx("button", { className: "story-music-cancel-btn", onClick: () => {
                                                        setShowMusicInput(false);
                                                        setMusicTitle("");
                                                        setMusicArtist("");
                                                        setMusicUrl("");
                                                        setMusicSearchQuery("");
                                                        setMusicSearchResults([]);
                                                        setShowMusicSearch(false);
                                                    }, children: "H\u1EE7y" }), !showMusicSearch && (_jsx("button", { className: "story-music-confirm-btn", onClick: handleAddMusic, children: "Th\u00EAm" }))] })] }))] }), error && _jsx("div", { className: "modal-error", children: error })] }), showSegmentSelector && selectedTrack && (_jsx("div", { className: "story-music-segment-overlay", children: _jsxs("div", { className: "story-music-segment-modal", children: [_jsxs("div", { className: "story-music-segment-header", children: [_jsxs("div", { className: "story-music-segment-track-info", children: [selectedTrack.artworkUrl60 && (_jsx("img", { src: selectedTrack.artworkUrl60, alt: selectedTrack.trackName, className: "story-music-segment-thumb" })), _jsxs("div", { children: [_jsx("div", { className: "story-music-segment-track-title", children: selectedTrack.trackName }), _jsx("div", { className: "story-music-segment-track-artist", children: selectedTrack.artistName })] })] }), _jsx("button", { className: "story-music-segment-close", onClick: handleCancelSegment, children: "\u2715" })] }), _jsxs("div", { className: "story-music-segment-content", children: [_jsxs("div", { className: "story-music-segment-timeline", onClick: handleTimelineClick, children: [_jsx("div", { className: "story-music-segment-waveform", children: Array.from({ length: 60 }).map((_, i) => {
                                                    const time = (i / 60) * 30;
                                                    const isInSegment = time >= segmentStart && time <= segmentEnd;
                                                    const isPlayed = time <= currentTime;
                                                    const height = Math.random() * 40 + 20;
                                                    return (_jsx("div", { className: `story-music-segment-wave-bar ${isInSegment ? "active" : ""} ${isPlayed && isInSegment ? "played" : ""}`, style: { height: `${height}%` } }, i));
                                                }) }), _jsxs("div", { className: "story-music-segment-range", style: {
                                                    left: `${(segmentStart / 30) * 100}%`,
                                                    width: `${((segmentEnd - segmentStart) / 30) * 100}%`,
                                                }, children: [_jsx("div", { className: "story-music-segment-handle start", onMouseDown: (e) => handleSegmentDrag("start", e) }), _jsx("div", { className: "story-music-segment-handle end", onMouseDown: (e) => handleSegmentDrag("end", e) })] }), _jsx("div", { className: "story-music-segment-playhead", style: { left: `${(currentTime / 30) * 100}%` } })] }), _jsxs("div", { className: "story-music-segment-time-info", children: [_jsxs("span", { children: [Math.floor(segmentStart), "s - ", Math.floor(segmentEnd), "s"] }), _jsxs("span", { className: "story-music-segment-duration", children: ["(", Math.floor(segmentEnd - segmentStart), "s)"] })] }), _jsxs("div", { className: "story-music-segment-controls", children: [_jsx("button", { className: "story-music-segment-control-btn", onClick: handlePlayPause, children: isPlayingPreview ? "⏸" : "▶" }), _jsx("button", { className: "story-music-segment-control-btn", onClick: () => {
                                                    if (audioPreviewRef.current) {
                                                        audioPreviewRef.current.currentTime = segmentStart;
                                                        setCurrentTime(segmentStart);
                                                    }
                                                }, children: "\u21BA" }), _jsx("button", { className: "story-music-segment-control-btn confirm", onClick: handleConfirmSegment, children: "\u2713" })] })] }), _jsx("audio", { ref: audioPreviewRef, preload: "metadata" })] }) })), _jsxs("footer", { className: "modal-footer", children: [_jsx("button", { className: "modal-secondary-btn", onClick: onClose, disabled: isSubmitting, children: "H\u1EE7y" }), _jsx("button", { className: "modal-primary-btn", onClick: handleSubmit, disabled: isSubmitting, children: isSubmitting ? "Đang đăng..." : "Đăng tin" })] })] }) }));
};
