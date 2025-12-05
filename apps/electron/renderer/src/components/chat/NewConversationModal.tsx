import { useEffect, useMemo, useState } from 'react';
import {
  Conversation,
  createConversationWithUser,
  createGroupConversation,
  searchUsers,
} from '../../api';
import '../../styles/new-conversation-modal.css';

type SearchUser = {
  _id: string;
  name: string;
  email: string;
  username?: string;
  avatar?: string;
};

interface NewConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (conversation: Conversation) => void;
}

export function NewConversationModal({ isOpen, onClose, onCreated }: NewConversationModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<SearchUser[]>([]);
  const [groupName, setGroupName] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const currentUserId = useMemo(() => localStorage.getItem('user_id') || '', []);

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setSearchResults([]);
      setSelectedUsers([]);
      setGroupName('');
      setError(null);
      setInfoMessage(null);
      setIsSearching(false);
      setIsSubmitting(false);
      return;
    }

    setGroupName('');
  }, [isOpen]);

  useEffect(() => {
    if (selectedUsers.length < 2 && groupName) {
      setGroupName('');
    }
  }, [selectedUsers.length, groupName]);

  useEffect(() => {
    let active = true;

    if (!isOpen) {
      return;
    }

    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setInfoMessage('Nhập ít nhất 2 ký tự để tìm kiếm');
      setError(null);
      return;
    }

    async function runSearch() {
      setIsSearching(true);
      setInfoMessage(null);
      try {
        const result = await searchUsers(searchQuery.trim());
        if (!active) return;
        const filtered = result.users.filter((user) => user._id !== currentUserId);
        setSearchResults(filtered);
        setError(filtered.length === 0 ? 'Không tìm thấy người dùng phù hợp' : null);
      } catch (err) {
        console.error('Search users error:', err);
        if (!active) return;
        setError('Không thể tìm kiếm lúc này, thử lại sau');
      } finally {
        if (active) {
          setIsSearching(false);
        }
      }
    }

    const timeout = setTimeout(runSearch, 350);
    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [searchQuery, isOpen, currentUserId]);

  const isSelected = (userId: string) => selectedUsers.some((user) => user._id === userId);

  const toggleUser = (user: SearchUser) => {
    setSelectedUsers((prev) => {
      if (prev.some((item) => item._id === user._id)) {
        return prev.filter((item) => item._id !== user._id);
      }
      return [...prev, user];
    });
  };

  const selectedIds = selectedUsers.map((user) => user._id);

  const handleCreate = async () => {
    if (selectedUsers.length === 0) {
      setError('Hãy chọn ít nhất một người dùng');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      let conversation: Conversation;
      if (selectedUsers.length === 1) {
        conversation = await createConversationWithUser(selectedUsers[0]._id);
      } else {
        conversation = await createGroupConversation(selectedIds, groupName.trim() || undefined);
      }
      onCreated?.(conversation);
      onClose();
    } catch (err: any) {
      console.error('Create conversation error:', err);
      const apiError = err?.response?.data?.error || err?.message;
      setError(apiError || 'Không thể tạo cuộc trò chuyện, thử lại sau');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const canSubmit = selectedUsers.length >= 1 && !isSubmitting;
  const isGroup = selectedUsers.length >= 2;

  return (
    <div className="new-conversation-modal-overlay" role="dialog" aria-modal="true">
      <div className="new-conversation-modal">
        <header className="new-conversation-modal__header">
          <div>
            <h2>Tạo cuộc trò chuyện</h2>
            <p>Chọn một hoặc nhiều người để bắt đầu trò chuyện</p>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Đóng">
            ✕
          </button>
        </header>

        <div className="new-conversation-modal__body">
          {isGroup && (
            <div className="form-group">
              <label htmlFor="groupName">Tên nhóm</label>
              <input
                id="groupName"
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Ví dụ: Nhóm dự án, Team marketing..."
              />
              <span className="hint">Nhóm sẽ xuất hiện khi bạn chọn từ 2 người trở lên</span>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="searchUsers">Tìm kiếm người dùng</label>
            <input
              id="searchUsers"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Nhập tên, email hoặc username"
            />
          </div>

          {isSearching && <div className="hint">Đang tìm kiếm...</div>}
          {infoMessage && !isSearching && <div className="hint">{infoMessage}</div>}
          {error && !isSearching && <div className="error-message">{error}</div>}

          <div className="search-results">
            {searchResults.map((user) => (
              <button
                key={user._id}
                type="button"
                className={`search-result-item ${isSelected(user._id) ? 'selected' : ''}`}
                onClick={() => toggleUser(user)}
              >
                <div className="result-avatar">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} />
                  ) : (
                    user.name?.[0]?.toUpperCase() || '?'
                  )}
                </div>
                <div className="result-info">
                  <div className="result-name">{user.name}</div>
                  <div className="result-subline">
                    {user.email}
                    {user.username ? ` · @${user.username}` : ''}
                  </div>
                </div>
                {isSelected(user._id) && <span className="result-check">✓</span>}
              </button>
            ))}
          </div>

          {selectedUsers.length > 0 && (
            <div className="selected-users">
              {selectedUsers.map((user) => (
                <span key={user._id} className="selected-chip" onClick={() => toggleUser(user)}>
                  {user.name}
                  <span className="chip-remove">✕</span>
                </span>
              ))}
            </div>
          )}
        </div>

        <footer className="new-conversation-modal__footer">
          <button className="secondary-btn" onClick={onClose} disabled={isSubmitting}>
            Hủy
          </button>
          <button className="primary-btn" onClick={handleCreate} disabled={!canSubmit}>
            {isSubmitting ? 'Đang tạo...' : 'Tạo'}
          </button>
        </footer>
      </div>
    </div>
  );
}

