import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChatMessage } from '../../../types/chat';
import { ReplyPreview } from './ReplyPreview';
import { ReactionSummary } from './ReactionSummary';
import { MessageContextMenu } from './MessageContextMenu';
import { ReactionPicker } from './ReactionPicker';

interface MessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
  senderName?: string;
  senderAvatar?: string;
  onReply?: (message: ChatMessage) => void;
  onReact?: (messageId: string, emoji: string) => void;
  onTogglePin?: (messageId: string, shouldPin: boolean) => void;
  onEdit?: (message: ChatMessage) => void;
  onDelete?: (message: ChatMessage) => void;
  onForward?: (message: ChatMessage) => void;
  onStar?: (message: ChatMessage) => void;
  onRevoke?: (message: ChatMessage) => void;
}

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export function MessageBubble({
  message,
  isOwn,
  senderName,
  senderAvatar,
  onReply,
  onReact,
  onTogglePin,
  onEdit,
  onDelete,
  onForward,
  onStar,
  onRevoke,
}: MessageBubbleProps) {
  const displayName = senderName || message.sender?.name || 'Người dùng';
  const displayAvatar = senderAvatar || message.sender?.avatar;
  const [menuOpen, setMenuOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number; right?: number } | null>(null);
  const [pickerPosition, setPickerPosition] = useState<{ top: number; left: number; right?: number } | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerImages, setViewerImages] = useState<string[]>([]);
  const [viewerIndex, setViewerIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);

  const wrapperClass = useMemo(
    () => ['chat-bubble-wrapper', isOwn ? 'chat-bubble-wrapper--own' : 'chat-bubble-wrapper--other'].join(' '),
    [isOwn],
  );

  const rowClass = useMemo(
    () => ['chat-bubble-row', isOwn ? 'chat-bubble-row--own' : 'chat-bubble-row--other'].join(' '),
    [isOwn],
  );

  const footerClass = useMemo(
    () => ['chat-bubble-footer', isOwn ? 'chat-bubble-footer--own' : 'chat-bubble-footer--other'].join(' '),
    [isOwn],
  );

  const classes = useMemo(
    () => ['chat-bubble', isOwn ? 'chat-bubble--own' : 'chat-bubble--other'].join(' '),
    [isOwn],
  );

  const replyPreviewContent = (() => {
    if (!message.replyTo) return undefined;
    if (typeof message.replyTo === 'string') {
      return '[Trả lời tin nhắn trước]';
    }
    return message.replyTo;
  })();

  useEffect(() => {
    if (!menuOpen || !buttonRef.current) return;

    const updateMenuPosition = () => {
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setMenuPosition({
          top: rect.bottom + 6,
          right: window.innerWidth - rect.right,
          left: rect.left,
        });
      }
    };

    updateMenuPosition();
    window.addEventListener('scroll', updateMenuPosition, true);
    window.addEventListener('resize', updateMenuPosition);

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setMenuOpen(false);
        setMenuPosition(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', updateMenuPosition, true);
      window.removeEventListener('resize', updateMenuPosition);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!pickerOpen || !emojiButtonRef.current) return;

    const updatePickerPosition = () => {
      if (emojiButtonRef.current) {
        const rect = emojiButtonRef.current.getBoundingClientRect();
        setPickerPosition({
          top: rect.bottom + 6,
          right: window.innerWidth - rect.right,
          left: rect.left,
        });
      }
    };

    updatePickerPosition();
    window.addEventListener('scroll', updatePickerPosition, true);
    window.addEventListener('resize', updatePickerPosition);

    return () => {
      window.removeEventListener('scroll', updatePickerPosition, true);
      window.removeEventListener('resize', updatePickerPosition);
    };
  }, [pickerOpen]);

  const isRevoked = Boolean(message.isRevoked);
  const isDeleted = Boolean(message.deletedAt);
  const hasContent = Boolean(message.text) || Boolean(message.imageUrl);
  const isActionDisabled = isRevoked || isDeleted;

  const openImageViewer = () => {
    if (!message.imageUrl) return;

    try {
      const nodes = Array.from(document.querySelectorAll<HTMLImageElement>('.chat-bubble-image'));
      const srcs = nodes.map((n) => n.src);
      const idx = srcs.indexOf(message.imageUrl);

      setViewerImages(srcs);
      setViewerIndex(idx >= 0 ? idx : 0);
      setViewerOpen(true);
    } catch {
      setViewerImages([message.imageUrl]);
      setViewerIndex(0);
      setViewerOpen(true);
    }
  };

  const renderMessageBody = () => {
    if (isRevoked) {
      return <div className="chat-bubble-removed">Tin nhắn đã bị thu hồi</div>;
    }

    if (isDeleted) {
      return <div className="chat-bubble-removed">Tin nhắn đã bị xóa</div>;
    }

    if (!hasContent) {
      return <div className="chat-bubble-removed">[Không có nội dung hiển thị]</div>;
    }

    return (
      <>
        {message.text ? <div className="chat-bubble-text">{message.text}</div> : null}
        {message.imageUrl ? (
          <div className="chat-bubble-image-wrapper">
            <img
              src={message.imageUrl}
              alt="attachment"
              className="chat-bubble-image"
              onClick={openImageViewer}
            />
          </div>
        ) : null}
      </>
    );
  };

  return (
    <div className={wrapperClass} data-message-id={message._id}>
      <div className={rowClass}>
        {!isOwn && (
          <div className="chat-bubble-sender-avatar">
            {displayAvatar ? (
              <img src={displayAvatar} alt={displayName} className="chat-bubble-sender-avatar-img" />
            ) : (
              <div className="chat-bubble-sender-avatar-initials">{getInitials(displayName)}</div>
            )}
          </div>
        )}
        <div
          className={[
            classes,
            !message.text && message.imageUrl ? 'chat-bubble--image-only' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {!isOwn && (
            <div className="chat-bubble-sender-name">{displayName}</div>
          )}
          {message.isPinned ? <div className="chat-bubble-pinned">📌 Đã ghim</div> : null}
          {message.isStarred ? <div className="chat-bubble-starred">⭐ Đã đánh dấu</div> : null}
          {replyPreviewContent ? <ReplyPreview message={replyPreviewContent} /> : null}
          <div className="chat-bubble-body">
            {renderMessageBody()}
          </div>
        </div>
        <div
          className={[
            'chat-bubble-actions',
            isOwn ? 'chat-bubble-actions--own' : 'chat-bubble-actions--other',
            menuOpen || pickerOpen ? 'chat-bubble-actions--visible' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <button
            ref={emojiButtonRef}
            className="chat-bubble-action"
            onClick={() => {
              if (isActionDisabled) return;
              if (emojiButtonRef.current) {
                const rect = emojiButtonRef.current.getBoundingClientRect();
                setPickerPosition({
                  top: rect.bottom + 6,
                  right: window.innerWidth - rect.right,
                  left: rect.left,
                });
              }
              setPickerOpen((prev) => !prev);
            }}
            title="Thêm cảm xúc"
            type="button"
            disabled={isActionDisabled}
          >
            😊
          </button>
          <button
            ref={buttonRef}
            className="chat-bubble-action"
            onClick={() => {
              if (isActionDisabled) return;
              setMenuOpen((prev) => !prev);
            }}
            title="Tùy chọn"
            type="button"
            disabled={isActionDisabled}
          >
            ⋯
          </button>
          {pickerOpen && pickerPosition ? (
            <ReactionPicker
              isOpen={pickerOpen}
              position={pickerPosition}
              onSelect={(emoji) => {
                onReact?.(message._id, emoji);
                setPickerOpen(false);
                setPickerPosition(null);
              }}
              onClose={() => {
                setPickerOpen(false);
                setPickerPosition(null);
              }}
              anchorClassName={isOwn ? undefined : 'chat-reaction-picker--other'}
            />
          ) : null}
          {menuOpen && menuPosition
            ? createPortal(
                <MessageContextMenu
                  ref={menuRef}
                  message={message}
                  isOwn={isOwn}
                  style={{
                    top: `${menuPosition.top}px`,
                    ...(isOwn ? { right: `${menuPosition.right}px` } : { left: `${menuPosition.left}px` }),
                  }}
                  onReply={(msg) => {
                    onReply?.(msg);
                    setMenuOpen(false);
                    setMenuPosition(null);
                  }}
                  onCopy={() => {
                    setMenuOpen(false);
                    setMenuPosition(null);
                  }}
                  onPinToggle={(shouldPin) => {
                    onTogglePin?.(message._id, shouldPin);
                    setMenuOpen(false);
                    setMenuPosition(null);
                  }}
                  onEdit={() => {
                    onEdit?.(message);
                    setMenuOpen(false);
                    setMenuPosition(null);
                  }}
                  onDelete={() => {
                    onDelete?.(message);
                    setMenuOpen(false);
                    setMenuPosition(null);
                  }}
                  onRevoke={() => {
                    onRevoke?.(message);
                    setMenuOpen(false);
                    setMenuPosition(null);
                  }}
                  onStar={() => {
                    onStar?.(message);
                    setMenuOpen(false);
                    setMenuPosition(null);
                  }}
                  onForward={(msg) => {
                    onForward?.(msg);
                    setMenuOpen(false);
                    setMenuPosition(null);
                  }}
                  anchorClassName={isOwn ? undefined : 'chat-context-menu--other'}
                />,
                document.body,
              )
            : null}
        </div>
      </div>
      <div className={footerClass}>
        <div className="chat-bubble-meta">
          <span className="chat-bubble-time">
            {new Date(message.createdAt).toLocaleTimeString('vi-VN', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
          {message.isEdited ? <span className="chat-bubble-edited">(đã chỉnh sửa)</span> : null}
          {message.pending ? <span className="chat-bubble-pending">Đang gửi…</span> : null}
          {message.error ? <span className="chat-bubble-error">{message.error}</span> : null}
          {isOwn && message.readBy && message.readBy.length > 0 && !message.pending && !message.error ? (
            <span className="chat-bubble-read" title={`Đã đọc bởi ${message.readBy.length} người`}>
              ✓✓
            </span>
          ) : isOwn && !message.pending && !message.error ? (
            <span className="chat-bubble-sent" title="Đã gửi">✓</span>
          ) : null}
        </div>
        <ReactionSummary reactions={message.reactions} />
      </div>
      {viewerOpen
        ? createPortal(
            <div
              className="chat-image-viewer-backdrop"
              onClick={() => setViewerOpen(false)}
            >
              <div
                className="chat-image-viewer-content"
                onClick={(e) => e.stopPropagation()}
              >
                {viewerImages[viewerIndex] ? (
                  <img src={viewerImages[viewerIndex]} alt="attachment-large" />
                ) : null}
                {viewerImages.length > 1 ? (
                  <div className="chat-image-viewer-thumbs">
                    {viewerImages.map((src, index) => (
                      <button
                        key={src + index}
                        type="button"
                        className={[
                          'chat-image-viewer-thumb',
                          index === viewerIndex ? 'chat-image-viewer-thumb--active' : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                        onClick={() => setViewerIndex(index)}
                      >
                        <img src={src} alt={`thumb-${index}`} />
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
