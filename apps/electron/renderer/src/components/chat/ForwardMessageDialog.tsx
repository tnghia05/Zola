import { useEffect, useState } from 'react';
import { getConversations, Conversation, createMessageWithPayload } from '../../api';
import { ChatMessage } from '../../types/chat';

interface ForwardMessageDialogProps {
  message: ChatMessage | null;
  onClose: () => void;
  onForwarded?: () => void;
}

export function ForwardMessageDialog({ message, onClose, onForwarded }: ForwardMessageDialogProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [forwarding, setForwarding] = useState(false);

  useEffect(() => {
    if (!message) return;
    loadConversations();
  }, [message]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const data = await getConversations();
      setConversations(data);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleForward = async () => {
    if (!message || !selectedConversationId) return;

    try {
      setForwarding(true);
      await createMessageWithPayload(selectedConversationId, {
        text: message.text,
        imageUrl: message.imageUrl,
        type: message.type,
      });
      onForwarded?.();
      onClose();
    } catch (err) {
      console.error('Failed to forward message:', err);
      alert('Không thể chuyển tiếp tin nhắn. Vui lòng thử lại.');
    } finally {
      setForwarding(false);
    }
  };

  if (!message) return null;

  return (
    <div className="chat-forward-dialog-overlay" onClick={onClose}>
      <div className="chat-forward-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="chat-forward-dialog-header">
          <h3>Chuyển tiếp tin nhắn</h3>
          <button className="chat-forward-dialog-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="chat-forward-dialog-preview">
          <div className="chat-forward-preview-message">
            {message.text && <div className="chat-forward-preview-text">{message.text}</div>}
            {message.imageUrl && (
              <img src={message.imageUrl} alt="Preview" className="chat-forward-preview-image" />
            )}
          </div>
        </div>
        <div className="chat-forward-dialog-list">
          {loading ? (
            <div className="chat-forward-dialog-loading">Đang tải...</div>
          ) : conversations.length === 0 ? (
            <div className="chat-forward-dialog-empty">Không có cuộc trò chuyện nào</div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv._id}
                className={`chat-forward-dialog-item ${
                  selectedConversationId === conv._id ? 'chat-forward-dialog-item--selected' : ''
                }`}
                onClick={() => setSelectedConversationId(conv._id)}
              >
                <div className="chat-forward-dialog-item-avatar">
                  {conv.isGroup ? '👥' : '💬'}
                </div>
                <div className="chat-forward-dialog-item-info">
                  <div className="chat-forward-dialog-item-name">
                    {conv.isGroup ? conv.title || `Nhóm (${conv.members.length})` : conv.title || 'Người dùng'}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
        <div className="chat-forward-dialog-actions">
          <button className="chat-forward-dialog-cancel" onClick={onClose}>
            Hủy
          </button>
          <button
            className="chat-forward-dialog-forward"
            onClick={handleForward}
            disabled={!selectedConversationId || forwarding}
          >
            {forwarding ? 'Đang chuyển tiếp...' : 'Chuyển tiếp'}
          </button>
        </div>
      </div>
    </div>
  );
}

