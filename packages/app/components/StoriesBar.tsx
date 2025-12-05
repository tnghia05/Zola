import { StoryAuthorGroup } from "../api";

type Props = {
  currentUser?: {
    _id: string;
    name: string;
    avatar?: string;
  } | null;
  groups: StoryAuthorGroup[];
  loading?: boolean;
  onCreateStory: () => void;
  onSelectStory: (groupIndex: number, storyIndex: number) => void;
};

export const StoriesBar = ({
  currentUser,
  groups,
  loading,
  onCreateStory,
  onSelectStory,
}: Props) => {
  return (
    <section className="stories-bar">
      {/* Card tạo story mới */}
      <div className="story-card story-card--add" onClick={onCreateStory}>
        <div className="story-card-bg">
          {currentUser?.avatar ? (
            <img src={currentUser.avatar} alt={currentUser.name} />
          ) : (
            <div className="story-card-bg-placeholder" />
          )}
        </div>
        <div className="story-card-overlay" />
        <div className="story-card-add-btn">
          <span>＋</span>
        </div>
        <div className="story-card-name">Tạo tin</div>
      </div>

      {/* Danh sách stories */}
      <div className="stories-scroll">
        {loading && groups.length === 0 ? (
          <div className="story-card story-card--loading">Đang tải...</div>
        ) : (
          groups.map((group, groupIndex) => {
            const hasUnseen = group.stories.some((story) => !story.isSeen);
            const firstStory = group.stories[0];
            if (!firstStory) return null;
            const media = firstStory.media[0];
            const isVideo = media?.type === "video";
            const thumbnailUrl = media?.thumbnail || media?.url;
            const authorAvatar = group.author.avatar;

            return (
              <div
                key={group.author._id}
                className={`story-card ${hasUnseen ? "story-card--unseen" : "story-card--seen"}`}
                onClick={() => onSelectStory(groupIndex, 0)}
              >
                {/* Ảnh/Video story làm nền */}
                <div className="story-card-bg">
                  {media ? (
                    isVideo ? (
                      // Video: hiển thị thumbnail hoặc video muted
                      media.thumbnail ? (
                        <img src={media.thumbnail} alt={group.author.name || "Story"} />
                      ) : (
                        <video src={media.url} muted playsInline preload="metadata" />
                      )
                    ) : (
                      <img src={media.url} alt={group.author.name || "Story"} />
                    )
                  ) : (
                    <div className="story-card-bg-placeholder" />
                  )}
                </div>
                <div className="story-card-overlay" />
                
                {/* Icon play cho video */}
                {isVideo && (
                  <div className="story-card-play-icon">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                )}

                {/* Avatar nhỏ ở góc trên trái */}
                <div className={`story-card-avatar-small ${hasUnseen ? "story-card-avatar-small--unseen" : ""}`}>
                  {authorAvatar ? (
                    <img src={authorAvatar} alt={group.author.name || "User"} />
                  ) : (
                    <div className="story-card-initials-small">
                      {group.author.name?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                  )}
                </div>

                {/* Tên ở dưới cùng */}
                <div className="story-card-name">{group.author.name || "Người dùng"}</div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
};


