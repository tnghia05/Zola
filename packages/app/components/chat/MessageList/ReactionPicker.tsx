import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

const COMMON_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🔥', '👏', '🎉', '✅', '❌', '💯'];

interface ReactionPickerProps {
  isOpen: boolean;
  position: { top: number; left: number; right?: number };
  onSelect: (emoji: string) => void;
  onClose: () => void;
  anchorClassName?: string;
}

export function ReactionPicker({
  isOpen,
  position,
  onSelect,
  onClose,
  anchorClassName,
}: ReactionPickerProps) {
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (pickerRef.current && !pickerRef.current.contains(target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      ref={pickerRef}
      className={['chat-reaction-picker', anchorClassName].filter(Boolean).join(' ')}
      style={{
        position: 'fixed',
        top: `${position.top}px`,
        ...(position.right !== undefined
          ? { right: `${position.right}px` }
          : { left: `${position.left}px` }),
        zIndex: 100000,
      }}
    >
      <div className="chat-reaction-picker-grid">
        {COMMON_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            className="chat-reaction-picker-item"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(emoji);
              onClose();
            }}
            title={emoji}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>,
    document.body,
  );
}

