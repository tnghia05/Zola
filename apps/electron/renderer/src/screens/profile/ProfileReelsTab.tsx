import { useNavigate } from "react-router-dom";
import type { Reel } from "@zola/app/api";

interface ProfileReelsTabProps {
  user: any;
  isSelf: boolean;
  reels: Reel[];
  reelsLoading: boolean;
  reelsHasNext: boolean;
  reelsNextCursor: string | null;
  loadReels: (cursor?: string) => void;
}

export const ProfileReelsTab = ({
  user,
  isSelf,
  reels,
  reelsLoading,
  reelsHasNext,
  reelsNextCursor,
  loadReels,
}: ProfileReelsTabProps) => {
  const navigate = useNavigate();

  return (
    <div className="profile-reels-tab">
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: "16px", padding: "0 16px" }}>Reels</h2>
      {reelsLoading && reels.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#B0B3B8" }}>
          Đang tải...
        </div>
      ) : reels.length > 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "16px", padding: "0 16px" }}>
          {reels.map((reel) => (
            <div
              key={reel._id}
              onClick={() => navigate(`/reels?reel=${reel._id}`)}
              style={{
                cursor: "pointer",
                borderRadius: "8px",
                overflow: "hidden",
                background: "#242526",
                position: "relative",
                aspectRatio: "9/16",
              }}
            >
              {reel.thumbnailUrl ? (
                <img
                  src={reel.thumbnailUrl}
                  alt={reel.caption || "Reel"}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <video
                  src={reel.videoUrl}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  muted
                  playsInline
                />
              )}
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)",
                  padding: "12px",
                  color: "white",
                  fontSize: "13px",
                  fontWeight: 600,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  <span>▶</span>
                  <span>{reel.viewCount || 0} lượt xem</span>
                </div>
                {reel.caption && (
                  <div style={{ fontSize: "12px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {reel.caption}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: "40px", color: "#B0B3B8" }}>
          {isSelf ? "Bạn chưa có reel nào." : "Người dùng này chưa có reel nào."}
        </div>
      )}
      {reelsHasNext && (
        <div style={{ textAlign: "center", padding: "16px" }}>
          <button
            onClick={() => loadReels(reelsNextCursor || undefined)}
            disabled={reelsLoading}
            style={{
              padding: "8px 16px",
              background: "#1877F2",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: reelsLoading ? "not-allowed" : "pointer",
              opacity: reelsLoading ? 0.6 : 1,
            }}
          >
            {reelsLoading ? "Đang tải..." : "Tải thêm"}
          </button>
        </div>
      )}
    </div>
  );
};

