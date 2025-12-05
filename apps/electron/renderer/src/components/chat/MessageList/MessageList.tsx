import { useEffect, useRef } from 'react';
import { ChatMessage } from '../../../types/chat';
import { MessageBubble } from './MessageBubble';
import { PinnedMessagesBar } from './PinnedMessagesBar';

interface MessageListProps {
  messages: ChatMessage[];
  currentUserId: string | null;
  loading?: boolean;
  hasMore?: boolean;
  opponentName?: string;
  opponentAvatar?: string;
  onReply?: (message: ChatMessage) => void;
  onLoadMore?: () => void;
  onReact?: (messageId: string, emoji: string) => void;
  onTogglePin?: (messageId: string, shouldPin: boolean) => void;
  onScrollToMessage?: (messageId: string) => void;
  focusMessageId?: string | null;
  onFocusHandled?: () => void;
  onEdit?: (message: ChatMessage) => void;
  onDelete?: (message: ChatMessage) => void;
  onForward?: (message: ChatMessage) => void;
  onStar?: (message: ChatMessage) => void;
  onRevoke?: (message: ChatMessage) => void;
}

export function MessageList({
  messages,
  currentUserId,
  loading,
  hasMore,
  opponentName,
  opponentAvatar,
  onReply,
  onLoadMore,
  onReact,
  onTogglePin,
  onScrollToMessage,
  focusMessageId,
  onFocusHandled,
  onEdit,
  onDelete,
  onForward,
  onStar,
  onRevoke,
}: MessageListProps) {
  const listRef = useRef<HTMLDivElement | null>(null);
  const rowRefs = useRef<Record<string, HTMLDivElement>>({});

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages]);

  useEffect(() => {
    const el = listRef.current;
    if (!el || !onLoadMore) return;

    const handleScroll = () => {
      if (el.scrollTop <= 32) {
        onLoadMore();
      }
    };

    el.addEventListener('scroll', handleScroll);
    return () => el.removeEventListener('scroll', handleScroll);
  }, [onLoadMore]);

  const pinnedMessages = messages.filter((message) => message.isPinned);

  const scrollToMessage = (messageId: string) => {
    const target = rowRefs.current[messageId];
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      target.classList.add('chat-message-row--highlight');
      setTimeout(() => target.classList.remove('chat-message-row--highlight'), 1200);
    } else {
      onScrollToMessage?.(messageId);
    }
  };

  useEffect(() => {
    if (focusMessageId) {
      scrollToMessage(focusMessageId);
      onFocusHandled?.();
    }
  }, [focusMessageId, messages]);

  return (
    <div className="chat-message-list-wrapper">
      <PinnedMessagesBar messages={pinnedMessages} onSelect={scrollToMessage} />
      <div className="chat-message-list" ref={listRef}>
        {hasMore ? (
          <button
            type="button"
            className="chat-load-more"
            onClick={() => onLoadMore?.()}
          >
            Xem thêm tin nhắn cũ
          </button>
        ) : null}
        {loading ? <div className="chat-message-placeholder">Đang tải tin nhắn...</div> : null}
        {!loading && messages.length === 0 ? (
          <div className="chat-message-placeholder">Bắt đầu cuộc trò chuyện đầu tiên!</div>
        ) : null}
        {messages.map((message) => {
          const isOwn = message.senderId === currentUserId;
          return (
            <div
              key={message._id || message.localId}
              className={`chat-message-row ${isOwn ? 'mine' : ''}`}
              ref={(el) => {
                if (el && message._id) {
                  rowRefs.current[message._id] = el;
                }
              }}
              onMouseEnter={() => {
                /* future: show contextual actions */
              }}
            >
            <MessageBubble
              message={message}
              isOwn={message.senderId === currentUserId}
              senderName={message.sender?.name || (message.senderId !== currentUserId ? opponentName : undefined)}
              senderAvatar={message.sender?.avatar || (message.senderId !== currentUserId ? opponentAvatar : undefined)}
              onReply={onReply}
              onReact={onReact}
              onTogglePin={onTogglePin}
              onEdit={onEdit}
              onDelete={onDelete}
              onForward={onForward}
              onStar={onStar}
              onRevoke={onRevoke}
            />
            <div className="chat-message-actions">
              <button
                className="chat-message-action"
                onClick={() => onReply?.(message)}
                title="Trả lời"
              >
                ↩
              </button>
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
}
