"use client";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useRef, useState, useCallback } from "react";
import { getReelsFeedApi, syncReelsFromPostsApi } from "../api";
import { ReelPlayer } from "./ReelPlayer.web";
import { SharePostModal } from "./SharePostModal";
export const ReelsFeed = ({ initialReels = [] }) => {
    const [reels, setReels] = useState(initialReels);
    const [activeIndex, setActiveIndex] = useState(0);
    const [nextCursor, setNextCursor] = useState(null);
    const [hasNext, setHasNext] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [hasSynced, setHasSynced] = useState(false);
    const containerRef = useRef(null);
    const [showShareModal, setShowShareModal] = useState(false);
    const [selectedReel, setSelectedReel] = useState(null);
    const loadMoreReels = useCallback(async () => {
        if (isLoading || !hasNext)
            return;
        setIsLoading(true);
        try {
            const data = await getReelsFeedApi(nextCursor || undefined);
            setReels((prev) => [...prev, ...data.items]);
            setNextCursor(data.nextCursor);
            setHasNext(data.hasNext);
            return data.items.length;
        }
        catch (error) {
            console.error("Failed to load reels:", error);
            return 0;
        }
        finally {
            setIsLoading(false);
        }
    }, [nextCursor, hasNext, isLoading]);
    // Auto-sync reels from video posts if feed is empty
    useEffect(() => {
        const initReels = async () => {
            if (initialReels.length > 0) {
                setReels(initialReels);
                return;
            }
            // First load
            const loadedCount = await loadMoreReels();
            // If no reels found and haven't synced yet, try to sync from posts
            if (loadedCount === 0 && !hasSynced) {
                setHasSynced(true);
                try {
                    console.log("No reels found, syncing from video posts...");
                    const syncResult = await syncReelsFromPostsApi();
                    console.log("Sync result:", syncResult);
                    if (syncResult.createdCount > 0) {
                        // Reload reels after sync
                        setHasNext(true);
                        setNextCursor(null);
                        const data = await getReelsFeedApi();
                        setReels(data.items);
                        setNextCursor(data.nextCursor);
                        setHasNext(data.hasNext);
                    }
                }
                catch (error) {
                    console.error("Failed to sync reels:", error);
                }
            }
        };
        initReels();
    }, []);
    useEffect(() => {
        const container = containerRef.current;
        if (!container)
            return;
        let isScrolling = false;
        let scrollTimeout;
        const handleScroll = () => {
            if (isScrolling)
                return;
            isScrolling = true;
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                const containerHeight = container.clientHeight;
                const scrollTop = container.scrollTop;
                const newIndex = Math.round(scrollTop / containerHeight);
                if (newIndex !== activeIndex && newIndex >= 0 && newIndex < reels.length) {
                    setActiveIndex(newIndex);
                }
                // Load more when near bottom
                if (scrollTop + containerHeight >= container.scrollHeight - containerHeight * 0.5 &&
                    hasNext &&
                    !isLoading) {
                    loadMoreReels();
                }
                isScrolling = false;
            }, 100);
        };
        container.addEventListener("scroll", handleScroll);
        return () => {
            container.removeEventListener("scroll", handleScroll);
            clearTimeout(scrollTimeout);
        };
    }, [activeIndex, reels.length, hasNext, isLoading, loadMoreReels]);
    const handleLike = async (reelId, liked) => {
        setReels((prev) => prev.map((reel) => {
            if (reel._id === reelId) {
                return {
                    ...reel,
                    likeCount: liked ? reel.likeCount + 1 : Math.max(0, reel.likeCount - 1),
                };
            }
            return reel;
        }));
    };
    const handleShare = (reel) => {
        setSelectedReel(reel);
        setShowShareModal(true);
    };
    if (reels.length === 0 && !isLoading) {
        return (_jsx("div", { style: {
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100vh",
                color: "#e4e6eb",
            }, children: "Ch\u01B0a c\u00F3 reels n\u00E0o" }));
    }
    return (_jsxs(_Fragment, { children: [_jsxs("div", { ref: containerRef, style: {
                    height: "100vh",
                    overflowY: "scroll",
                    scrollSnapType: "y mandatory",
                    scrollBehavior: "smooth",
                }, children: [reels.map((reel, index) => (_jsx("div", { style: {
                            height: "100vh",
                            scrollSnapAlign: "start",
                            scrollSnapStop: "always",
                        }, children: _jsx(ReelPlayer, { reel: reel, isActive: index === activeIndex, onLike: handleLike, onShare: handleShare }) }, reel._id))), isLoading && (_jsx("div", { style: {
                            height: "100vh",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#e4e6eb",
                        }, children: "\u0110ang t\u1EA3i..." }))] }), showShareModal && selectedReel && (_jsx(SharePostModal, { isOpen: showShareModal, post: selectedReel, onClose: () => {
                    setShowShareModal(false);
                    setSelectedReel(null);
                }, onSubmit: async () => {
                    setShowShareModal(false);
                    setSelectedReel(null);
                }, isSubmitting: false }))] }));
};
