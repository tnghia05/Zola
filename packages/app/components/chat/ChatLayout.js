import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import '../../styles/chat.css';
export function ChatLayout({ header, messageArea, composer, rightPanel }) {
    return (_jsxs("div", { className: "chat-container", children: [_jsxs("div", { className: "chat-main", children: [_jsx("div", { className: "chat-header", children: header }), _jsx("div", { className: "chat-content", children: messageArea }), _jsx("div", { className: "chat-composer", children: composer })] }), rightPanel ? _jsx("aside", { className: "chat-side-panel", children: rightPanel }) : null] }));
}
