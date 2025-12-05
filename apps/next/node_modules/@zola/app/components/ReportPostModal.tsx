import { useEffect, useState } from "react";
import { Post } from "../api";

const DEFAULT_REASONS = [
  "Spam hoặc quảng cáo",
  "Nội dung phản cảm",
  "Tin giả/misleading",
  "Quấy rối hoặc thù địch",
  "Vi phạm bản quyền",
  "Khác",
];

type ReportPayload = {
  reason: string;
  details?: string;
};

type Props = {
  isOpen: boolean;
  post: Post | null;
  onClose: () => void;
  onSubmit: (payload: ReportPayload) => Promise<void>;
  isSubmitting?: boolean;
};

export const ReportPostModal = ({ isOpen, post, onClose, onSubmit, isSubmitting }: Props) => {
  const [reason, setReason] = useState(DEFAULT_REASONS[0]);
  const [details, setDetails] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setReason(DEFAULT_REASONS[0]);
      setDetails("");
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen || !post) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason || reason.trim().length < 3) {
      setError("Vui lòng chọn lý do");
      return;
    }
    try {
      await onSubmit({ reason, details: details.trim() ? details.trim() : undefined });
    } catch (err: any) {
      setError(err?.message || "Không thể gửi báo cáo lúc này");
    }
  };

  return (
    <div className="report-modal-overlay">
      <div className="report-modal-card">
        <div className="report-modal-header">
          <div>
            <h3>Báo cáo bài viết</h3>
            <p>Bài viết của {post.author?.name || "người dùng"}</p>
          </div>
          <button className="report-modal-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="report-modal-section">
            <label className="report-modal-label">Lý do</label>
            <div className="report-modal-reasons">
              {DEFAULT_REASONS.map((item) => (
                <label key={item} className="report-reason-option">
                  <input
                    type="radio"
                    name="report-reason"
                    value={item}
                    checked={reason === item}
                    onChange={() => setReason(item)}
                    disabled={isSubmitting}
                  />
                  <span>{item}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="report-modal-section">
            <label className="report-modal-label">
              Mô tả thêm <span style={{ opacity: 0.6 }}>(tuỳ chọn)</span>
            </label>
            <textarea
              className="report-modal-textarea"
              placeholder="Nhập mô tả chi tiết nếu cần..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              disabled={isSubmitting}
              rows={4}
            />
          </div>
          {error && <div className="report-modal-error">{error}</div>}
          <div className="report-modal-actions">
            <button type="button" className="report-modal-secondary" onClick={onClose} disabled={isSubmitting}>
              Huỷ
            </button>
            <button type="submit" className="report-modal-primary" disabled={isSubmitting}>
              {isSubmitting ? "Đang gửi..." : "Gửi báo cáo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportPostModal;

