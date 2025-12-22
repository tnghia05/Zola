import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function ReplyPreview({ message }) {
    if (!message)
        return null;
    const previewText = typeof message === 'string' ? message : message.text ?? '[Đính kèm]';
    return (_jsxs("div", { className: "chat-reply-preview", children: [_jsx("div", { className: "chat-reply-indicator" }), _jsxs("div", { className: "chat-reply-content", children: [_jsx("div", { className: "chat-reply-label", children: "Tr\u1EA3 l\u1EDDi" }), _jsx("div", { className: "chat-reply-text", children: previewText })] })] }));
}
