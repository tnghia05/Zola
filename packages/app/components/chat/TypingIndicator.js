import { jsx as _jsx } from "react/jsx-runtime";
export function TypingIndicator({ users }) {
    if (!users.length)
        return null;
    const text = users.length === 1
        ? `${users[0].name ?? 'Ai đó'} đang nhập...`
        : `${users.length} người đang nhập...`;
    return _jsx("div", { className: "chat-typing-indicator", children: text });
}
