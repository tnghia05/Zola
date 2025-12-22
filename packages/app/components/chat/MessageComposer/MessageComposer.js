import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useMemo, useRef, useState } from 'react';
import { uploadChatFile } from '../../../api';
import { CameraIcon, MicIcon } from '../../Icons';
export function MessageComposer({ onSend, disabled, onValueChange, replyPreview, onCancelReply, editingLabel, onCancelEdit, value, }) {
    const [internalValue, setInternalValue] = useState('');
    const text = useMemo(() => (value !== undefined ? value : internalValue), [value, internalValue]);
    const [sending, setSending] = useState(false);
    const mediaInputRef = useRef(null);
    const audioInputRef = useRef(null);
    const updateValue = useCallback((next) => {
        if (value !== undefined) {
            onValueChange?.(next);
        }
        else {
            setInternalValue(next);
            onValueChange?.(next);
        }
    }, [onValueChange, value]);
    const resetValue = useCallback(() => {
        if (value !== undefined) {
            onValueChange?.('');
        }
        else {
            setInternalValue('');
            onValueChange?.('');
        }
    }, [onValueChange, value]);
    const handleSubmit = useCallback(async (event) => {
        event.preventDefault();
        const trimmed = text.trim();
        if (!trimmed && !replyPreview)
            return;
        try {
            setSending(true);
            await onSend({ text: trimmed });
            resetValue();
        }
        finally {
            setSending(false);
        }
    }, [onSend, text, replyPreview, resetValue]);
    const handleUpload = (kind) => async (event) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file)
            return;
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
                const isImageOrVideo = baseFile.mime?.startsWith('image/') ||
                    baseFile.mime?.startsWith('video/') ||
                    file.type.startsWith('image/') ||
                    file.type.startsWith('video/');
                const payload = {
                    type: isImageOrVideo ? 'image' : 'file',
                    file: baseFile,
                };
                await onSend(payload);
            }
            else {
                const payload = {
                    type: 'file',
                    file: baseFile,
                };
                await onSend(payload);
            }
        }
        finally {
            setSending(false);
        }
    };
    return (_jsxs("form", { className: "chat-composer-form", onSubmit: handleSubmit, children: [_jsx("input", { ref: mediaInputRef, type: "file", accept: "image/*,video/*", hidden: true, onChange: handleUpload('media') }), _jsx("input", { ref: audioInputRef, type: "file", accept: "audio/*", hidden: true, onChange: handleUpload('audio') }), replyPreview ? (_jsxs("div", { className: "chat-composer-reply-preview", children: [_jsx("div", { className: "chat-reply-indicator" }), _jsxs("div", { className: "chat-composer-reply-body", children: [_jsx("span", { className: "chat-reply-label", children: "Tr\u1EA3 l\u1EDDi" }), _jsx("span", { className: "chat-reply-text", children: replyPreview })] }), _jsx("button", { type: "button", className: "chat-reply-cancel", onClick: onCancelReply, children: "\u2715" })] })) : null, editingLabel ? (_jsxs("div", { className: "chat-composer-edit-banner", children: [_jsx("span", { children: editingLabel }), _jsx("button", { type: "button", onClick: onCancelEdit, children: "H\u1EE7y" })] })) : null, _jsxs("div", { className: "chat-composer-left", children: [_jsx("button", { type: "button", className: "chat-composer-icon-btn", disabled: disabled || sending, title: "G\u1EEDi \u1EA3nh/video", onClick: () => mediaInputRef.current?.click(), children: _jsx(CameraIcon, { size: 20, color: "#0966FF" }) }), _jsx("button", { type: "button", className: "chat-composer-icon-btn", disabled: disabled || sending, title: "G\u1EEDi \u00E2m thanh", onClick: () => audioInputRef.current?.click(), children: _jsx(MicIcon, { size: 20, color: "#0966FF" }) })] }), _jsx("input", { className: "chat-composer-input", placeholder: "Nh\u1EADp tin nh\u1EAFn...", value: text, onChange: (event) => updateValue(event.target.value), disabled: disabled || sending }), _jsx("button", { className: "chat-composer-send", type: "submit", disabled: disabled || sending || !text.trim(), children: "G\u1EEDi" })] }));
}
