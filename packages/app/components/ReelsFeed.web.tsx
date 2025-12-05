"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Reel, getReelsFeedApi, likeReelApi, unlikeReelApi, syncReelsFromPostsApi } from "../api";
import { ReelPlayer } from "./ReelPlayer.web";
import { SharePostModal } from "./SharePostModal";

type Props = {
  initialReels?: Reel[];
};

export const ReelsFeed = ({ initialReels = [] }: Props) => {
  const [reels, setReels] = useState<Reel[]>(initialReels);
  const [activeIndex, setActiveIndex] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasNext, setHasNext] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSynced, setHasSynced] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedReel, setSelectedReel] = useState<Reel | null>(null);

  const loadMoreReels = useCallback(async () => {
    if (isLoading || !hasNext) return;
    setIsLoading(true);
    try {
      const data = await getReelsFeedApi(nextCursor || undefined);
      setReels((prev) => [...prev, ...data.items]);
      setNextCursor(data.nextCursor);
      setHasNext(data.hasNext);
      return data.items.length;
    } catch (error) {
      console.error("Failed to load reels:", error);
      return 0;
    } finally {
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
        } catch (error) {
          console.error("Failed to sync reels:", error);
        }
      }
    };
    
    initReels();
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let isScrolling = false;
    let scrollTimeout: NodeJS.Timeout;

    const handleScroll = () => {
      if (isScrolling) return;
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
        if (
          scrollTop + containerHeight >= container.scrollHeight - containerHeight * 0.5 &&
          hasNext &&
          !isLoading
        ) {
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

  const handleLike = async (reelId: string, liked: boolean) => {
    setReels((prev) =>
      prev.map((reel) => {
        if (reel._id === reelId) {
          return {
            ...reel,
            likeCount: liked ? reel.likeCount + 1 : Math.max(0, reel.likeCount - 1),
          };
        }
        return reel;
      })
    );
  };

  const handleShare = (reel: Reel) => {
    setSelectedReel(reel);
    setShowShareModal(true);
  };

  if (reels.length === 0 && !isLoading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          color: "#e4e6eb",
        }}
      >
        Chưa có reels nào
      </div>
    );
  }

  return (
    <>
      <div
        ref={containerRef}
        style={{
          height: "100vh",
          overflowY: "scroll",
          scrollSnapType: "y mandatory",
          scrollBehavior: "smooth",
        }}
      >
        {reels.map((reel, index) => (
          <div
            key={reel._id}
            style={{
              height: "100vh",
              scrollSnapAlign: "start",
              scrollSnapStop: "always",
            }}
          >
            <ReelPlayer
              reel={reel}
              isActive={index === activeIndex}
              onLike={handleLike}
              onShare={handleShare}
            />
          </div>
        ))}
        {isLoading && (
          <div
            style={{
              height: "100vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#e4e6eb",
            }}
          >
            Đang tải...
          </div>
        )}
      </div>

      {showShareModal && selectedReel && (
        <SharePostModal
          isOpen={showShareModal}
          post={selectedReel as any}
          onClose={() => {
            setShowShareModal(false);
            setSelectedReel(null);
          }}
          onSubmit={async () => {
            setShowShareModal(false);
            setSelectedReel(null);
          }}
          isSubmitting={false}
        />
      )}
    </>
  );
};

