import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function PinnedMessagesBar({ messages, onSelect }) {
    if (!messages.length)
        return null;
    return (_jsxs("div", { className: "chat-pinned-bar", children: [_jsx("span", { className: "chat-pinned-label", children: "Tin nh\u1EAFn \u0111\u00E3 ghim" }), _jsx("div", { className: "chat-pinned-items", children: messages.map((message) => (_jsxs("button", { type: "button", className: "chat-pinned-item", onClick: () => onSelect?.(message._id), children: [_jsx("span", { className: "chat-pinned-icon", children: "\uD83D\uDCCC" }), _jsx("span", { className: "chat-pinned-text", children: message.text ?? '[Đính kèm]' })] }, message._id))) })] }));
}
