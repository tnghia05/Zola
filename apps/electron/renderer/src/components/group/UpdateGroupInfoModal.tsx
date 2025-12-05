import { useState, useEffect } from 'react';
import '../../styles/group-modals.css';

interface UpdateGroupInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { title?: string; avatar?: string }) => Promise<void> | void;
  initialTitle?: string;
  initialAvatar?: string;
}

export function UpdateGroupInfoModal({
  isOpen,
  onClose,
  onSave,
  initialTitle,
  initialAvatar,
}: UpdateGroupInfoModalProps) {
  const [title, setTitle] = useState(initialTitle || '');
  const [avatar, setAvatar] = useState(initialAvatar || '');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTitle(initialTitle || '');
      setAvatar(initialAvatar || '');
      setError(null);
    }
  }, [isOpen, initialTitle, initialAvatar]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError('Tên nhóm không được để trống');
      return;
    }
    try {
      setSaving(true);
      await onSave({ title: title.trim(), avatar: avatar.trim() || undefined });
      onClose();
    } catch (err: any) {
      console.error('Update group info error', err);
      setError(err?.response?.data?.error || 'Không thể cập nhật nhóm');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="group-modal-overlay">
      <div className="group-modal">
        <header className="group-modal__header">
          <h2>Chỉnh sửa nhóm</h2>
          <button onClick={onClose}>✕</button>
        </header>
        <div className="group-modal__body">
          {error && <div className="error-message">{error}</div>}
          <label>Tên nhóm</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nhập tên nhóm mới" />

          <label>Ảnh nhóm (URL)</label>
          <input value={avatar} onChange={(e) => setAvatar(e.target.value)} placeholder="https://..." />
          {avatar && (
            <div className="preview-avatar">
              <img src={avatar} alt="preview" />
            </div>
          )}
        </div>
        <footer className="group-modal__footer">
          <button className="secondary-btn" onClick={onClose} disabled={saving}>
            Hủy
          </button>
          <button className="primary-btn" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Đang lưu...' : 'Lưu'}
          </button>
        </footer>
      </div>
    </div>
  );
}

