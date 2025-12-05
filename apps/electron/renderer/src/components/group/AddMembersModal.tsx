import { useEffect, useState } from 'react';
import { Conversation, searchUsers } from '../../api';
import '../../styles/group-modals.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (userIds: string[]) => Promise<void> | void;
  conversation: Conversation;
}

export function AddMembersModal({ isOpen, onClose, onConfirm, conversation }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Array<{ _id: string; name: string; avatar?: string; email?: string }>>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
      setSelected(new Set());
      setError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    let active = true;
    if (!isOpen || query.trim().length < 2) {
      setResults([]);
      return;
    }
    (async () => {
      setLoading(true);
      try {
        const res = await searchUsers(query.trim());
        if (!active) return;
        const conversationMemberSet = new Set(conversation.members.map((m) => String(m)));
        const filtered = res.users.filter((user) => !conversationMemberSet.has(user._id));
        setResults(filtered);
      } catch (err) {
        console.error('Search users error', err);
        if (active) setError('Không thể tìm kiếm người dùng, thử lại sau');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [isOpen, query, conversation.members]);

  const toggleUser = (userId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const handleConfirm = async () => {
    if (selected.size === 0) {
      setError('Hãy chọn ít nhất một người');
      return;
    }
    try {
      setSubmitting(true);
      await onConfirm(Array.from(selected));
      onClose();
    } catch (err: any) {
      console.error('Add members error', err);
      setError(err?.response?.data?.error || 'Không thể thêm thành viên');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="group-modal-overlay">
      <div className="group-modal">
        <header className="group-modal__header">
          <h2>Thêm thành viên</h2>
          <button onClick={onClose}>✕</button>
        </header>
        <div className="group-modal__body">
          <input
            type="text"
            placeholder="Nhập tên/email để tìm kiếm"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {loading && <div className="hint">Đang tìm...</div>}
          {error && <div className="error-message">{error}</div>}
          <div className="group-modal__list">
            {results.map((user) => (
              <button
                key={user._id}
                type="button"
                className={`group-modal__item ${selected.has(user._id) ? 'selected' : ''}`}
                onClick={() => toggleUser(user._id)}
              >
                <div className="member-avatar">
                  {user.avatar ? <img src={user.avatar} alt={user.name} /> : user.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="member-meta">
                  <div>{user.name}</div>
                  <span className="member-email">{user.email}</span>
                </div>
                {selected.has(user._id) && <span>✓</span>}
              </button>
            ))}
            {!loading && results.length === 0 && query.length >= 2 && (
              <div className="hint">Không tìm thấy người dùng nào</div>
            )}
          </div>
        </div>
        <footer className="group-modal__footer">
          <button className="secondary-btn" onClick={onClose} disabled={submitting}>
            Hủy
          </button>
          <button className="primary-btn" onClick={handleConfirm} disabled={submitting}>
            {submitting ? 'Đang thêm...' : 'Thêm thành viên'}
          </button>
        </footer>
      </div>
    </div>
  );
}

