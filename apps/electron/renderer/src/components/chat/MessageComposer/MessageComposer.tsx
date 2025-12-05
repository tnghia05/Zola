import { FormEvent, useCallback, useMemo, useState } from 'react';
import { SendMessagePayload } from '../../../types/chat';

interface MessageComposerProps {
  onSend: (payload: SendMessagePayload) => Promise<void> | void;
  disabled?: boolean;
  onValueChange?: (value: string) => void;
  replyPreview?: string | undefined;
  onCancelReply?: () => void;
  editingLabel?: string;
  onCancelEdit?: () => void;
  value?: string;
}

export function MessageComposer({
  onSend,
  disabled,
  onValueChange,
  replyPreview,
  onCancelReply,
  editingLabel,
  onCancelEdit,
  value,
}: MessageComposerProps) {
  const [internalValue, setInternalValue] = useState('');
  const text = useMemo(() => (value !== undefined ? value : internalValue), [value, internalValue]);
  const [sending, setSending] = useState(false);

  const updateValue = useCallback(
    (next: string) => {
      if (value !== undefined) {
        onValueChange?.(next);
      } else {
        setInternalValue(next);
        onValueChange?.(next);
      }
    },
    [onValueChange, value],
  );

  const resetValue = useCallback(() => {
    if (value !== undefined) {
      onValueChange?.('');
    } else {
      setInternalValue('');
      onValueChange?.('');
    }
  }, [onValueChange, value]);

  const handleSubmit = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      const trimmed = text.trim();
      if (!trimmed && !replyPreview) return;

      try {
        setSending(true);
        await onSend({ text: trimmed });
        resetValue();
      } finally {
        setSending(false);
      }
    },
    [onSend, text, replyPreview, resetValue],
  );

  return (
    <form className="chat-composer-form" onSubmit={handleSubmit}>
      {replyPreview ? (
        <div className="chat-composer-reply-preview">
          <div className="chat-reply-indicator" />
          <div className="chat-composer-reply-body">
            <span className="chat-reply-label">Trả lời</span>
            <span className="chat-reply-text">{replyPreview}</span>
          </div>
          <button type="button" className="chat-reply-cancel" onClick={onCancelReply}>
            ✕
          </button>
        </div>
      ) : null}
      {editingLabel ? (
        <div className="chat-composer-edit-banner">
          <span>{editingLabel}</span>
          <button type="button" onClick={onCancelEdit}>
            Hủy
          </button>
        </div>
      ) : null}
      <input
        className="chat-composer-input"
        placeholder="Nhập tin nhắn..."
        value={text}
        onChange={(event) => updateValue(event.target.value)}
        disabled={disabled || sending}
      />
      <button className="chat-composer-send" type="submit" disabled={disabled || sending || !text.trim()}>
        Gửi
      </button>
    </form>
  );
}
