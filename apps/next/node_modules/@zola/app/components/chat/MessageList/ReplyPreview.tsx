import { ChatMessage } from '../../../types/chat';

interface ReplyPreviewProps {
  message: ChatMessage | string | undefined;
}

export function ReplyPreview({ message }: ReplyPreviewProps) {
  if (!message) return null;

  const previewText = typeof message === 'string' ? message : message.text ?? '[Đính kèm]';

  return (
    <div className="chat-reply-preview">
      <div className="chat-reply-indicator" />
      <div className="chat-reply-content">
        <div className="chat-reply-label">Trả lời</div>
        <div className="chat-reply-text">{previewText}</div>
      </div>
    </div>
  );
}
