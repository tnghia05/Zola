import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
const COMMON_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🔥', '👏', '🎉', '✅', '❌', '💯'];
export function ReactionPicker({ isOpen, position, onSelect, onClose, anchorClassName, }) {
    const pickerRef = useRef(null);
    useEffect(() => {
        if (!isOpen)
            return;
        const handleClickOutside = (event) => {
            const target = event.target;
            if (pickerRef.current && !pickerRef.current.contains(target)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);
    if (!isOpen)
        return null;
    return createPortal(_jsx("div", { ref: pickerRef, className: ['chat-reaction-picker', anchorClassName].filter(Boolean).join(' '), style: {
            position: 'fixed',
            top: `${position.top}px`,
            ...(position.right !== undefined
                ? { right: `${position.right}px` }
                : { left: `${position.left}px` }),
            zIndex: 100000,
        }, children: _jsx("div", { className: "chat-reaction-picker-grid", children: COMMON_EMOJIS.map((emoji) => (_jsx("button", { className: "chat-reaction-picker-item", onClick: (e) => {
                    e.stopPropagation();
                    onSelect(emoji);
                    onClose();
                }, title: emoji, children: emoji }, emoji))) }) }), document.body);
}
