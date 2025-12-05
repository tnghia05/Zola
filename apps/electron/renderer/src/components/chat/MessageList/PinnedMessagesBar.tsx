import { ChatMessage } from '../../../types/chat';

interface PinnedMessagesBarProps {
  messages: ChatMessage[];
  onSelect?: (messageId: string) => void;
}

export function PinnedMessagesBar({ messages, onSelect }: PinnedMessagesBarProps) {
  if (!messages.length) return null;

  return (
    <div className="chat-pinned-bar">
      <span className="chat-pinned-label">Tin nhắn đã ghim</span>
      <div className="chat-pinned-items">
        {messages.map((message) => (
          <button
            key={message._id}
            type="button"
            className="chat-pinned-item"
            onClick={() => onSelect?.(message._id)}
          >
            <span className="chat-pinned-icon">📌</span>
            <span className="chat-pinned-text">{message.text ?? '[Đính kèm]'}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
