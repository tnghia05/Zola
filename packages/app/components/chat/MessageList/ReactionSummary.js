import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
export function ReactionSummary({ reactions }) {
    if (!reactions || reactions.length === 0)
        return null;
    const grouped = reactions.reduce((acc, reaction) => {
        acc[reaction.emoji] = (acc[reaction.emoji] ?? 0) + 1;
        return acc;
    }, {});
    return (_jsx("div", { className: "chat-reaction-summary", children: Object.entries(grouped).map(([emoji, count]) => (_jsxs("span", { className: "chat-reaction-chip", children: [emoji, " ", count] }, emoji))) }));
}
