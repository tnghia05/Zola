import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  StoryAuthorGroup,
  ReactionType,
  reactToStoryApi,
  removeStoryReactionApi,
  createStoryReplyApi,
} from '../api';

export type StoryPointer = {
  groupIndex: number;
  storyIndex: number;
};

type Props = {
  groups: StoryAuthorGroup[];
  state: StoryPointer | null;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  onStorySeen: (storyId: string) => void;
  onDeleteStory?: (storyId: string) => Promise<void> | void;
  currentUserId?: string;
};

const REACTIONS: { type: ReactionType; emoji: string; label: string }[] = [
  { type: "LIKE", emoji: "👍", label: "Thích" },
  { type: "LOVE", emoji: "❤️", label: "Yêu thích" },
  { type: "HAHA", emoji: "😆", label: "Haha" },
  { type: "WOW", emoji: "😮", label: "Wow" },
  { type: "SAD", emoji: "😢", label: "Buồn" },
  { type: "ANGRY", emoji: "😡", label: "Phẫn nộ" },
];

export const StoryViewer = ({
  groups,
  state,
  onClose,
  onNext,
  onPrev,
  onStorySeen,
  onDeleteStory,
  currentUserId,
}: Props) => {
  // ==========================================
  // 1. ALL HOOKS FIRST (UNCONDITIONAL)
  // ==========================================
  const [replyText, setReplyText] = useState("");
  const [currentReaction, setCurrentReaction] = useState<ReactionType | null>(null);
  const [reactionCounts, setReactionCounts] = useState<Record<string, number>>({});
  const [pickerVisible, setPickerVisible] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const pickerTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Reset input when story changes
  useEffect(() => {
    setReplyText('');
  }, [state?.storyIndex, state?.groupIndex]);

  // Compute activeGroup and activeStory (may be null/undefined)
  const activeGroup = (groups && state) ? groups[state.groupIndex] : null;
  const activeStory = activeGroup?.stories?.[state?.storyIndex];

  // Load reaction state (unconditional useEffect)
  useEffect(() => {
    if (activeStory) {
      setCurrentReaction(activeStory.userReaction || null);
      setReactionCounts(activeStory.reactionCounts || {});
    }
  }, [activeStory?._id]);

  // Mark story as seen (unconditional useEffect)
  useEffect(() => {
    if (activeStory && !activeStory.isSeen) {
      onStorySeen(activeStory._id);
    }
  }, [activeStory?._id, activeStory?.isSeen, onStorySeen]);

  // Audio playback with segment support
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const musicUrl = activeStory?.music?.url;

    if (musicUrl) {
      audio.src = musicUrl;
      audio.volume = isMuted ? 0 : 0.7;

      const startTime = activeStory.music?.startTime || 0;
      const endTime = activeStory.music?.endTime || 30;

      // Set current time to start position
      audio.currentTime = startTime;

      // Auto-play
      audio.play()
        .then(() => {
          setIsMusicPlaying(true);
        })
        .catch((err) => {
          console.log("Autoplay blocked:", err);
          setIsMusicPlaying(false);
        });

      // Handle time update to loop within segment
      const handleTimeUpdate = () => {
        if (audio.currentTime >= endTime) {
          audio.currentTime = startTime;
        }
      };

      audio.addEventListener('timeupdate', handleTimeUpdate);

      return () => {
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.pause();
        audio.src = '';
      };
    } else {
      // No music, stop playback
      audio.pause();
      audio.src = '';
      setIsMusicPlaying(false);
    }
  }, [state?.storyIndex, state?.groupIndex, activeStory?.music?.url, isMuted]);

  // ==========================================
  // 2. VISIBILITY CHECK ONLY
  // ==========================================
  if (!state) return null;

  // ==========================================
  // 3. DATA PREPARATION (SAFE MODE)
  // ==========================================
  const mediaItem = activeStory?.media?.[0];
  const mediaUrl = mediaItem?.url;
  const isVideo = mediaItem?.type === 'video';
  const authorName = activeGroup?.author?.name || activeGroup?.author?.username || 'Loading User...';
  const authorAvatar = activeGroup?.author?.avatar;
  const music = activeStory?.music;
  const caption = activeStory?.caption;

  // Check navigation availability
  const hasPrev = state.storyIndex > 0 || state.groupIndex > 0;
  const hasNext = activeGroup
    ? (state.storyIndex < activeGroup.stories.length - 1 || state.groupIndex < groups.length - 1)
    : false;
  const isOwner = currentUserId && activeGroup?.author._id === currentUserId;

  // Event handlers
  const handleReactionClick = async (type: ReactionType) => {
    if (!activeStory) return;
    try {
      if (currentReaction === type) {
        const result = await removeStoryReactionApi(activeStory._id);
        setCurrentReaction(null);
        setReactionCounts(result.reactionCounts);
      } else {
        const result = await reactToStoryApi(activeStory._id, type);
        setCurrentReaction(result.reaction);
        setReactionCounts(result.reactionCounts);
      }
      setPickerVisible(false);
    } catch (error) {
      console.error("Failed to react to story:", error);
    }
  };

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeStory) return;
    try {
      await createStoryReplyApi(activeStory._id, replyText.trim());
      setReplyText("");
    } catch (error) {
      console.error("Failed to reply to story:", error);
    }
  };

  const totalReactions = Object.values(reactionCounts).reduce((sum, count) => sum + count, 0);

  // ==========================================
  // 4. RENDER PORTAL (INLINE STYLES FOR SAFETY)
  // ==========================================
  if (!state || !activeGroup || !activeStory) {
    return null;
  }

  return createPortal(
    <>
      {/* Inline CSS Animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.2);
            opacity: 0.8;
          }
        }
      `}</style>

      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 99999,
          backgroundColor: '#000000',
          display: 'flex',
          flexDirection: 'row',
          overflow: 'hidden',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
      {/* --- LEFT SIDEBAR --- */}
      <div
        style={{
          width: '360px',
          flexShrink: 0,
          backgroundColor: '#242526',
          borderRight: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 50,
          position: 'relative',
        }}
      >
        {/* Header */}
        <div
          style={{
            height: '64px',
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <button
            onClick={onClose}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: '#3A3B3C',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              cursor: 'pointer',
              marginRight: '16px',
              fontSize: '20px',
            }}
            aria-label="Close"
          >
            ✕
          </button>
          <span style={{ color: 'white', fontWeight: 'bold', fontSize: '20px' }}>Stories</span>
        </div>

        {/* Stories List */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: '8px',
          }}
        >
          <h3 style={{ color: 'white', fontWeight: '600', padding: '8px', margin: '8px 0' }}>
            All Stories
          </h3>
          {groups?.map((group, idx) => {
            const hasUnseenStories = group.stories.some(s => !s.isSeen);
            return (
              <div
                key={group.author._id}
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                  backgroundColor: idx === state?.groupIndex ? '#3A3B3C' : 'transparent',
                  transition: 'background-color 0.2s',
                  marginBottom: '4px',
                }}
              >
                {group.author.avatar ? (
                  <img
                    src={group.author.avatar}
                    alt={group.author.name}
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: `2px solid ${hasUnseenStories ? '#0084FF' : '#555'}`,
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      border: `2px solid ${hasUnseenStories ? '#0084FF' : '#555'}`,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: '600',
                      fontSize: '18px',
                      flexShrink: 0,
                    }}
                  >
                    {group.author.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: hasUnseenStories ? '600' : '400',
                      fontSize: '14px',
                      color: hasUnseenStories ? 'white' : '#B0B3B8',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {group.author.name || group.author.username || 'User'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#B0B3B8' }}>
                    {group.stories.length} story
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* --- RIGHT STAGE --- */}
      <div
        style={{
          flex: 1,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#000000',
          zIndex: 40,
        }}
      >
        {/* CLOSE BUTTON (Desktop - Top Right) */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '24px',
            right: '24px',
            zIndex: 100,
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '24px',
            border: 'none',
            cursor: 'pointer',
            transition: 'background-color 0.2s',
          }}
          aria-label="Close"
        >
          ✕
        </button>

        {/* CONTENT CHECK: Show Loading or Story */}
        {!activeStory ? (
          // FALLBACK IF DATA IS MISSING
          <div
            style={{
              color: 'white',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '24px' }}>⏳</div>
            <p style={{ fontSize: '20px', marginBottom: '16px' }}>Loading Story...</p>
            <button
              onClick={onClose}
              style={{
                marginTop: '24px',
                padding: '12px 24px',
                backgroundColor: '#0084FF',
                color: 'white',
                borderRadius: '24px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '16px',
              }}
            >
              Close Viewer
            </button>
          </div>
        ) : (
          // REAL STORY CARD
          <>
            <div
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: '450px',
                aspectRatio: '9/16',
                backgroundColor: '#18191A',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
              }}
            >
              {/* MEDIA LAYER */}
              {mediaUrl && (
                isVideo ? (
                  <video
                    src={mediaUrl}
                    autoPlay
                    loop
                    muted={isMuted}
                    playsInline
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      backgroundColor: '#000',
                    }}
                  />
                ) : (
                  <img
                    src={mediaUrl}
                    alt="Story"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      backgroundColor: '#000',
                    }}
                  />
                )
              )}

              {/* OVERLAY: Header */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  padding: '16px',
                  background: 'linear-gradient(180deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)',
                  zIndex: 20,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      border: '2px solid rgba(255, 255, 255, 0.2)',
                      overflow: 'hidden',
                      flexShrink: 0,
                    }}
                  >
                    {authorAvatar ? (
                      <img
                        src={authorAvatar}
                        alt={authorName}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontWeight: '600',
                          fontSize: '14px',
                        }}
                      >
                        {authorName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <div
                      style={{
                        color: 'white',
                        fontWeight: '600',
                        fontSize: '14px',
                        textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                      }}
                    >
                      {authorName}
                    </div>
                    <div
                      style={{
                        color: '#E4E6EB',
                        fontSize: '12px',
                        textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                      }}
                    >
                      {new Date(activeStory.createdAt).toLocaleString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {/* Video Mute/Unmute Button */}
                  {isVideo && (
                    <button
                      onClick={() => setIsMuted(!isMuted)}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(10px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '14px',
                      }}
                      title={isMuted ? "Unmute" : "Mute"}
                    >
                      {isMuted ? '🔇' : '🔊'}
                    </button>
                  )}

                  {/* Delete Button */}
                  {isOwner && (
                    <button
                      onClick={() => onDeleteStory?.(activeStory._id)}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(10px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '14px',
                      }}
                      title="Delete"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>

              {/* OVERLAY: Music Pill */}
              {music && (
                <div
                  style={{
                    position: 'absolute',
                    top: '80px',
                    left: '16px',
                    zIndex: 20,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                  }}
                >
                  <span
                    style={{
                      fontSize: '12px',
                      animation: isMusicPlaying ? 'pulse 1.5s ease-in-out infinite' : 'none',
                    }}
                  >
                    🎵
                  </span>
                  <span
                    style={{
                      color: 'white',
                      fontSize: '12px',
                      fontWeight: '500',
                      maxWidth: '150px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {music.title}
                  </span>

                  {/* Play/Pause Button */}
                  {music.url && (
                    <button
                      onClick={() => {
                        if (audioRef.current) {
                          if (isMusicPlaying) {
                            audioRef.current.pause();
                            setIsMusicPlaying(false);
                          } else {
                            audioRef.current.play()
                              .then(() => setIsMusicPlaying(true))
                              .catch(err => console.log("Play failed:", err));
                          }
                        }
                      }}
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        color: 'white',
                        transition: 'background-color 0.2s',
                      }}
                    >
                      {isMusicPlaying ? '⏸' : '▶'}
                    </button>
                  )}

                  {/* Mute/Unmute Button */}
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px',
                      color: 'white',
                      transition: 'background-color 0.2s',
                    }}
                  >
                    {isMuted ? '🔇' : '🔊'}
                  </button>
                </div>
              )}

              {/* OVERLAY: Caption */}
              {caption && (
                <div
                  style={{
                    position: 'absolute',
                    top: '112px',
                    left: '16px',
                    right: '16px',
                    zIndex: 20,
                  }}
                >
                  <div
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(0, 0, 0, 0.5)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                    }}
                  >
                    <p style={{ color: 'white', fontSize: '14px', margin: 0 }}>{caption}</p>
                  </div>
                </div>
              )}

              {/* OVERLAY: Footer */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: '16px',
                  paddingBottom: '24px',
                  background: 'linear-gradient(0deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.5) 50%, transparent 100%)',
                  zIndex: 20,
                }}
              >
                {/* Reaction Summary */}
                {totalReactions > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '12px',
                      padding: '0 8px',
                    }}
                  >
                    {REACTIONS.map((reaction) => {
                      const count = reactionCounts[reaction.type] || 0;
                      if (count === 0) return null;
                      return (
                        <span
                          key={reaction.type}
                          style={{
                            fontSize: '12px',
                            color: 'rgba(255, 255, 255, 0.8)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <span>{reaction.emoji}</span>
                          <span>{count}</span>
                        </span>
                      );
                    })}
                  </div>
                )}

                <form
                  onSubmit={handleReplySubmit}
                  style={{ display: 'flex', gap: '12px', alignItems: 'center' }}
                >
                  <input
                    type="text"
                    placeholder="Trả lời..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    style={{
                      flex: 1,
                      height: '40px',
                      backgroundColor: 'transparent',
                      border: '1px solid rgba(255, 255, 255, 0.5)',
                      borderRadius: '20px',
                      padding: '0 16px',
                      color: 'white',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  />

                  {/* Reaction Picker */}
                  <div
                    style={{ position: 'relative', display: 'flex', alignItems: 'center' }}
                    onMouseEnter={() => {
                      if (pickerTimeoutRef.current) clearTimeout(pickerTimeoutRef.current);
                      setPickerVisible(true);
                    }}
                    onMouseLeave={() => {
                      pickerTimeoutRef.current = setTimeout(() => {
                        setPickerVisible(false);
                      }, 300);
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        if (currentReaction) {
                          handleReactionClick(currentReaction);
                        } else {
                          handleReactionClick("LIKE");
                        }
                      }}
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px',
                        transition: 'transform 0.2s',
                      }}
                    >
                      {currentReaction
                        ? REACTIONS.find((r) => r.type === currentReaction)?.emoji || "👍"
                        : "👍"}
                    </button>

                    {/* Reaction Picker Dropdown */}
                    {pickerVisible && (
                      <div
                        style={{
                          position: 'absolute',
                          bottom: '100%',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          marginBottom: '8px',
                          display: 'flex',
                          gap: '4px',
                          padding: '8px',
                          borderRadius: '24px',
                          backgroundColor: 'rgba(0, 0, 0, 0.9)',
                          backdropFilter: 'blur(10px)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5)',
                        }}
                      >
                        {REACTIONS.map((reaction) => (
                          <button
                            type="button"
                            key={reaction.type}
                            onClick={() => handleReactionClick(reaction.type)}
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              backgroundColor: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '20px',
                              transition: 'transform 0.2s',
                            }}
                            title={reaction.label}
                          >
                            {reaction.emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={!replyText.trim()}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: replyText.trim() ? '#0084FF' : 'rgba(255, 255, 255, 0.1)',
                      border: 'none',
                      cursor: replyText.trim() ? 'pointer' : 'not-allowed',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '14px',
                      transition: 'background-color 0.2s',
                    }}
                  >
                    ➤
                  </button>
                </form>
              </div>

              {/* Hidden Audio Element */}
              <audio
                ref={audioRef}
                onEnded={() => setIsMusicPlaying(false)}
                onError={() => setIsMusicPlaying(false)}
                style={{ display: 'none' }}
              />
            </div>

            {/* NAVIGATION ARROWS */}
            {hasPrev && (
              <button
                onClick={onPrev}
                style={{
                  position: 'absolute',
                  left: '40px',
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '32px',
                  transition: 'background-color 0.2s',
                  zIndex: 50,
                }}
                aria-label="Previous"
              >
                ‹
              </button>
            )}
            {hasNext && (
              <button
                onClick={onNext}
                style={{
                  position: 'absolute',
                  right: '40px',
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '32px',
                  transition: 'background-color 0.2s',
                  zIndex: 50,
                }}
                aria-label="Next"
              >
                ›
              </button>
            )}
          </>
        )}
      </div>
      </div>
    </>,
    document.body
  );
};
