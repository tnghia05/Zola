import { useEffect, useState, useCallback, useRef } from "react";
import { StoryMedia, StoryMusic, searchMusicApi, iTunesTrack } from "../api";
import { uploadMediaApi } from "../api";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    media: StoryMedia[];
    caption?: string;
    visibility?: "FRIENDS" | "PUBLIC";
    music?: StoryMusic;
  }) => Promise<void>;
  currentUser?: {
    _id: string;
    name: string;
    avatar?: string;
  } | null;
};

export const CreateStoryModal = ({ isOpen, onClose, onSubmit, currentUser }: Props) => {
  const [caption, setCaption] = useState("");
  const [media, setMedia] = useState<StoryMedia[]>([]);
  const [visibility, setVisibility] = useState<"FRIENDS" | "PUBLIC">("FRIENDS");
  const [music, setMusic] = useState<StoryMusic | null>(null);
  const [showMusicInput, setShowMusicInput] = useState(false);
  const [musicTitle, setMusicTitle] = useState("");
  const [musicArtist, setMusicArtist] = useState("");
  const [musicUrl, setMusicUrl] = useState("");
  const [musicSearchQuery, setMusicSearchQuery] = useState("");
  const [musicSearchResults, setMusicSearchResults] = useState<iTunesTrack[]>([]);
  const [isSearchingMusic, setIsSearchingMusic] = useState(false);
  const [showMusicSearch, setShowMusicSearch] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<iTunesTrack | null>(null);
  const [showSegmentSelector, setShowSegmentSelector] = useState(false);
  const [segmentStart, setSegmentStart] = useState(0);
  const [segmentEnd, setSegmentEnd] = useState(30);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleSearchMusic = useCallback(async (query: string) => {
    if (!query.trim()) {
      setMusicSearchResults([]);
      return;
    }
    setIsSearchingMusic(true);
    try {
      const results = await searchMusicApi(query);
      setMusicSearchResults(results);
    } catch (err: any) {
      setError("Tìm kiếm nhạc thất bại");
    } finally {
      setIsSearchingMusic(false);
    }
  }, []);

  const handleSelectMusic = (track: iTunesTrack) => {
    if (track.previewUrl) {
      setSelectedTrack(track);
      setShowSegmentSelector(true);
      setSegmentStart(0);
      setSegmentEnd(30);
      setCurrentTime(0);
    } else {
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
    if (!selectedTrack) return;
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
    if (!audio || !selectedTrack?.previewUrl) return;

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
    if (!audio) return;

    if (isPlayingPreview) {
      audio.pause();
      setIsPlayingPreview(false);
    } else {
      audio.currentTime = segmentStart;
      audio.play().then(() => setIsPlayingPreview(true)).catch(() => setIsPlayingPreview(false));
    }
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioPreviewRef.current;
    if (!audio || !selectedTrack?.previewUrl) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const totalDuration = 30; // iTunes previews are usually 30s
    const newTime = Math.max(0, Math.min(totalDuration, percentage * totalDuration));

    if (newTime < segmentStart) {
      setSegmentStart(Math.max(0, newTime - 15));
      setSegmentEnd(Math.max(30, newTime + 15));
    } else if (newTime > segmentEnd) {
      setSegmentEnd(Math.min(totalDuration, newTime + 15));
      setSegmentStart(Math.max(0, newTime - 15));
    } else {
      audio.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleSegmentDrag = (type: "start" | "end", e: React.MouseEvent) => {
    const audio = audioPreviewRef.current;
    if (!audio || !selectedTrack?.previewUrl) return;

    const totalDuration = 30;
    const rect = e.currentTarget.closest(".story-music-segment-timeline")?.getBoundingClientRect();
    if (!rect) return;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const x = moveEvent.clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, x / rect.width));
      const time = percentage * totalDuration;

      if (type === "start") {
        const newStart = Math.max(0, Math.min(time, segmentEnd - 5));
        setSegmentStart(newStart);
        if (audio.currentTime < newStart) {
          audio.currentTime = newStart;
        }
      } else {
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

  if (!isOpen) return null;

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    setError(null);
    try {
      const uploads: StoryMedia[] = [];
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
    } catch (err: any) {
      setError(err?.message || "Upload thất bại");
    } finally {
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
    } catch (err: any) {
      setError(err?.message || "Đăng tin thất bại");
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeMedia = (index: number) => {
    setMedia((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <header className="modal-header">
          <h3>Tạo tin</h3>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </header>
        <div className="modal-body">
          <div className="modal-user-row">
            <div className="feed-avatar-circle">
              {currentUser?.avatar ? (
                <img src={currentUser.avatar} alt={currentUser.name} />
              ) : (
                <div className="feed-avatar-initials">
                  {currentUser?.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
              )}
            </div>
            <div>
              <div className="modal-user-name">
                {currentUser?.name || "Bạn"}
              </div>
              <select
                className="modal-select"
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as "FRIENDS" | "PUBLIC")}
              >
                <option value="FRIENDS">Bạn bè</option>
                <option value="PUBLIC">Công khai</option>
              </select>
            </div>
          </div>

          <textarea
            className="modal-textarea"
            placeholder="Chia sẻ cảm nghĩ..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
          />

          <div className="story-media-preview">
            {media.map((item, index) => (
              <div key={index} className="story-media-item">
                <button className="story-media-remove" onClick={() => removeMedia(index)}>
                  ✕
                </button>
                {item.type === "video" ? (
                  <video src={item.url} controls />
                ) : (
                  <img src={item.url} alt={`story-${index}`} />
                )}
              </div>
            ))}
            <label className="story-media-upload">
              <span>{isUploading ? "Đang upload..." : "Thêm ảnh/video"}</span>
              <input
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={(e) => handleFiles(e.target.files)}
                disabled={isUploading}
              />
            </label>
          </div>

          <div className="story-music-section">
            {music ? (
              <div className="story-music-display">
                <div className="story-music-info">
                  <span className="story-music-icon">🎵</span>
                  <div>
                    <div className="story-music-title">{music.title}</div>
                    <div className="story-music-artist">{music.artist}</div>
                  </div>
                </div>
                <button className="story-music-remove" onClick={handleRemoveMusic}>
                  ✕
                </button>
              </div>
            ) : (
              <button
                className="story-music-add-btn"
                onClick={() => setShowMusicInput(!showMusicInput)}
              >
                <span>🎵</span>
                <span>Thêm nhạc</span>
              </button>
            )}

            {showMusicInput && !music && (
              <div className="story-music-input">
                <div className="story-music-tabs">
                  <button
                    className={`story-music-tab ${!showMusicSearch ? "active" : ""}`}
                    onClick={() => setShowMusicSearch(false)}
                  >
                    Nhập thủ công
                  </button>
                  <button
                    className={`story-music-tab ${showMusicSearch ? "active" : ""}`}
                    onClick={() => setShowMusicSearch(true)}
                  >
                    Tìm kiếm nhạc
                  </button>
                </div>

                {showMusicSearch ? (
                  <div className="story-music-search">
                    <div className="story-music-search-box">
                      <input
                        type="text"
                        placeholder="Tìm kiếm bài hát, nghệ sĩ..."
                        value={musicSearchQuery}
                        onChange={(e) => {
                          setMusicSearchQuery(e.target.value);
                          const query = e.target.value.trim();
                          if (query.length > 2) {
                            handleSearchMusic(query);
                          } else {
                            setMusicSearchResults([]);
                          }
                        }}
                        className="story-music-field"
                      />
                      {isSearchingMusic && <span className="story-music-search-loading">🔍</span>}
                    </div>
                    {musicSearchResults.length > 0 && (
                      <div className="story-music-results">
                        {musicSearchResults.map((track) => (
                          <div
                            key={track.trackId}
                            className="story-music-result-item"
                            onClick={() => handleSelectMusic(track)}
                          >
                            {track.artworkUrl60 && (
                              <img
                                src={track.artworkUrl60}
                                alt={track.trackName}
                                className="story-music-result-thumb"
                              />
                            )}
                            <div className="story-music-result-info">
                              <div className="story-music-result-title">{track.trackName}</div>
                              <div className="story-music-result-artist">{track.artistName}</div>
                            </div>
                            {track.previewUrl && (
                              <span className="story-music-result-preview">▶</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    {musicSearchQuery.length > 2 && musicSearchResults.length === 0 && !isSearchingMusic && (
                      <div className="story-music-no-results">Không tìm thấy kết quả</div>
                    )}
                  </div>
                ) : (
                  <>
                    <input
                      type="text"
                      placeholder="Tên bài hát"
                      value={musicTitle}
                      onChange={(e) => setMusicTitle(e.target.value)}
                      className="story-music-field"
                    />
                    <input
                      type="text"
                      placeholder="Nghệ sĩ"
                      value={musicArtist}
                      onChange={(e) => setMusicArtist(e.target.value)}
                      className="story-music-field"
                    />
                    <input
                      type="text"
                      placeholder="URL nhạc (tùy chọn)"
                      value={musicUrl}
                      onChange={(e) => setMusicUrl(e.target.value)}
                      className="story-music-field"
                    />
                  </>
                )}
                <div className="story-music-actions">
                  <button
                    className="story-music-cancel-btn"
                    onClick={() => {
                      setShowMusicInput(false);
                      setMusicTitle("");
                      setMusicArtist("");
                      setMusicUrl("");
                      setMusicSearchQuery("");
                      setMusicSearchResults([]);
                      setShowMusicSearch(false);
                    }}
                  >
                    Hủy
                  </button>
                  {!showMusicSearch && (
                    <button className="story-music-confirm-btn" onClick={handleAddMusic}>
                      Thêm
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {error && <div className="modal-error">{error}</div>}
        </div>

        {/* Music Segment Selector */}
        {showSegmentSelector && selectedTrack && (
          <div className="story-music-segment-overlay">
            <div className="story-music-segment-modal">
              <div className="story-music-segment-header">
                <div className="story-music-segment-track-info">
                  {selectedTrack.artworkUrl60 && (
                    <img
                      src={selectedTrack.artworkUrl60}
                      alt={selectedTrack.trackName}
                      className="story-music-segment-thumb"
                    />
                  )}
                  <div>
                    <div className="story-music-segment-track-title">{selectedTrack.trackName}</div>
                    <div className="story-music-segment-track-artist">{selectedTrack.artistName}</div>
                  </div>
                </div>
                <button className="story-music-segment-close" onClick={handleCancelSegment}>
                  ✕
                </button>
              </div>

              <div className="story-music-segment-content">
                <div className="story-music-segment-timeline" onClick={handleTimelineClick}>
                  {/* Waveform visualization */}
                  <div className="story-music-segment-waveform">
                    {Array.from({ length: 60 }).map((_, i) => {
                      const time = (i / 60) * 30;
                      const isInSegment = time >= segmentStart && time <= segmentEnd;
                      const isPlayed = time <= currentTime;
                      const height = Math.random() * 40 + 20;
                      return (
                        <div
                          key={i}
                          className={`story-music-segment-wave-bar ${
                            isInSegment ? "active" : ""
                          } ${isPlayed && isInSegment ? "played" : ""}`}
                          style={{ height: `${height}%` }}
                        />
                      );
                    })}
                  </div>

                  {/* Segment selection overlay */}
                  <div
                    className="story-music-segment-range"
                    style={{
                      left: `${(segmentStart / 30) * 100}%`,
                      width: `${((segmentEnd - segmentStart) / 30) * 100}%`,
                    }}
                  >
                    <div
                      className="story-music-segment-handle start"
                      onMouseDown={(e) => handleSegmentDrag("start", e)}
                    />
                    <div
                      className="story-music-segment-handle end"
                      onMouseDown={(e) => handleSegmentDrag("end", e)}
                    />
                  </div>

                  {/* Playhead */}
                  <div
                    className="story-music-segment-playhead"
                    style={{ left: `${(currentTime / 30) * 100}%` }}
                  />
                </div>

                <div className="story-music-segment-time-info">
                  <span>
                    {Math.floor(segmentStart)}s - {Math.floor(segmentEnd)}s
                  </span>
                  <span className="story-music-segment-duration">
                    ({Math.floor(segmentEnd - segmentStart)}s)
                  </span>
                </div>

                <div className="story-music-segment-controls">
                  <button
                    className="story-music-segment-control-btn"
                    onClick={handlePlayPause}
                  >
                    {isPlayingPreview ? "⏸" : "▶"}
                  </button>
                  <button
                    className="story-music-segment-control-btn"
                    onClick={() => {
                      if (audioPreviewRef.current) {
                        audioPreviewRef.current.currentTime = segmentStart;
                        setCurrentTime(segmentStart);
                      }
                    }}
                  >
                    ↺
                  </button>
                  <button
                    className="story-music-segment-control-btn confirm"
                    onClick={handleConfirmSegment}
                  >
                    ✓
                  </button>
                </div>
              </div>

              <audio ref={audioPreviewRef} preload="metadata" />
            </div>
          </div>
        )}

        <footer className="modal-footer">
          <button className="modal-secondary-btn" onClick={onClose} disabled={isSubmitting}>
            Hủy
          </button>
          <button className="modal-primary-btn" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Đang đăng..." : "Đăng tin"}
          </button>
        </footer>
      </div>
    </div>
  );
};


