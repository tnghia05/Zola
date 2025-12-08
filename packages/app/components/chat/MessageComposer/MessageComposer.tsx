import { ChangeEvent, FormEvent, useCallback, useMemo, useRef, useState } from 'react';
import { SendMessagePayload } from '../../../types/chat';
import { uploadChatFile } from '../../../api';
import { CameraIcon, MicIcon } from '../../Icons';

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
  const mediaInputRef = useRef<HTMLInputElement | null>(null);
  const audioInputRef = useRef<HTMLInputElement | null>(null);

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

  const handleUpload =
    (kind: 'media' | 'audio') =>
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = '';
      if (!file) return;

      try {
        setSending(true);
        const uploaded = await uploadChatFile(file);
        if (!uploaded?.url) {
          console.warn('Upload did not return URL');
          return;
        }

        const baseFile = {
          url: uploaded.url,
          name: uploaded.name ?? file.name,
          mime: uploaded.mime ?? file.type,
          size: uploaded.size ?? file.size,
        };

        if (kind === 'media') {
          const isImageOrVideo =
            baseFile.mime?.startsWith('image/') ||
            baseFile.mime?.startsWith('video/') ||
            file.type.startsWith('image/') ||
            file.type.startsWith('video/');

          const payload: SendMessagePayload = {
            type: isImageOrVideo ? 'image' : 'file',
            file: baseFile,
          };
          await onSend(payload);
        } else {
          const payload: SendMessagePayload = {
            type: 'file',
            file: baseFile,
          };
          await onSend(payload);
        }
      } finally {
        setSending(false);
      }
    };

  return (
    <form className="chat-composer-form" onSubmit={handleSubmit}>
      <input
        ref={mediaInputRef}
        type="file"
        accept="image/*,video/*"
        hidden
        onChange={handleUpload('media')}
      />
      <input ref={audioInputRef} type="file" accept="audio/*" hidden onChange={handleUpload('audio')} />
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
      <div className="chat-composer-left">
        <button
          type="button"
          className="chat-composer-icon-btn"
          disabled={disabled || sending}
          title="Gửi ảnh/video"
          onClick={() => mediaInputRef.current?.click()}
        >
          <CameraIcon size={20} color="#0966FF" />
        </button>
        <button
          type="button"
          className="chat-composer-icon-btn"
          disabled={disabled || sending}
          title="Gửi âm thanh"
          onClick={() => audioInputRef.current?.click()}
        >
          <MicIcon size={20} color="#0966FF" />
        </button>
      </div>
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
