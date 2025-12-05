import { forwardRef } from 'react';
import { ChatMessage } from '../../../types/chat';

interface MessageContextMenuProps {
  message: ChatMessage;
  isOwn: boolean;
  onReply: (message: ChatMessage) => void;
  onCopy?: (message: ChatMessage) => void;
  onPinToggle?: (shouldPin: boolean) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onForward?: (message: ChatMessage) => void;
  onStar?: () => void;
  onRevoke?: () => void;
  anchorClassName?: string;
  style?: React.CSSProperties;
}

export const MessageContextMenu = forwardRef<HTMLDivElement, MessageContextMenuProps>(
  (
    {
      message,
      isOwn,
      onReply,
      onCopy,
      onPinToggle,
      onEdit,
      onDelete,
      onForward,
      onStar,
      onRevoke,
      anchorClassName,
      style,
    },
    ref,
  ) => {
    return (
      <div ref={ref} className={['chat-context-menu', anchorClassName].filter(Boolean).join(' ')} style={style}>
      <button
        className="chat-context-menu-item"
        onClick={(e) => {
          e.stopPropagation();
          onReply(message);
        }}
      >
        ↩ Trả lời
      </button>
      <button
        className="chat-context-menu-item"
        onClick={(e) => {
          e.stopPropagation();
          navigator.clipboard.writeText(message.text ?? '');
          onCopy?.(message);
        }}
      >
        📋 Sao chép
      </button>
      <button
        className="chat-context-menu-item"
        onClick={(e) => {
          e.stopPropagation();
          onPinToggle?.(!message.isPinned);
        }}
      >
        {message.isPinned ? '📌 Bỏ ghim' : '📌 Ghim tin nhắn'}
      </button>
      {!message.isStarred ? (
        <button
          className="chat-context-menu-item"
          onClick={(e) => {
            e.stopPropagation();
            onStar?.();
          }}
        >
          ⭐ Đánh dấu sao
        </button>
      ) : (
        <button className="chat-context-menu-item" disabled>
          ⭐ Đã đánh dấu
        </button>
      )}
      {isOwn ? (
        <button
          className="chat-context-menu-item"
          onClick={(e) => {
            e.stopPropagation();
            onEdit?.();
          }}
        >
          ✏️ Chỉnh sửa
        </button>
      ) : null}
      {isOwn && !message.isRevoked ? (
        <button
          className="chat-context-menu-item"
          onClick={(e) => {
            e.stopPropagation();
            onRevoke?.();
          }}
        >
          ↩️ Thu hồi
        </button>
      ) : null}
      {isOwn ? (
        <button
          className="chat-context-menu-item chat-context-menu-item--danger"
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.();
          }}
        >
          🗑️ Xóa
        </button>
      ) : null}
      <button
        className="chat-context-menu-item"
        onClick={(e) => {
          e.stopPropagation();
          onForward?.(message);
        }}
      >
        ↪️ Chuyển tiếp
      </button>
      </div>
    );
  },
);

MessageContextMenu.displayName = 'MessageContextMenu';
