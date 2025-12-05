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
      <div className="story-card story-card--add" onClick={onCreateStory}>
        <div className="story-card-avatar story-card-avatar--mine">
          {currentUser?.avatar ? (
            <img src={currentUser.avatar} alt={currentUser.name} />
          ) : (
            <div className="story-card-initials">
              {currentUser?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
          )}
          <div className="story-card-add-icon">＋</div>
        </div>
        <div className="story-card-name">Tạo tin</div>
      </div>
      <div className="stories-scroll">
        {loading && groups.length === 0 ? (
          <div className="story-card story-card--loading">Đang tải...</div>
        ) : (
          groups.map((group, groupIndex) => {
            const hasUnseen = group.stories.some((story) => !story.hasSeen);
            const firstStory = group.stories[0];
            if (!firstStory) return null;
            const avatar = group.author.avatar || firstStory.media[0]?.url;
            return (
              <div
                key={group.author._id}
                className={`story-card ${hasUnseen ? "story-card--unseen" : "story-card--seen"}`}
                onClick={() => onSelectStory(groupIndex, 0)}
              >
                <div className="story-card-avatar">
                  {avatar ? (
                    <img src={avatar} alt={group.author.name || "Story"} />
                  ) : (
                    <div className="story-card-initials">
                      {group.author.name?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                  )}
                  {hasUnseen && <span className="story-card-ring" />}
                </div>
                <div className="story-card-name">
                  {group.author.name || group.author.username || "Người dùng"}
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
};


