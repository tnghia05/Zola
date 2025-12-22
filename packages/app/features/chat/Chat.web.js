"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { useSearchParams } from "next/navigation";
import { DesktopChat } from "../../components/chat/DesktopChat";
export default function ChatScreen() {
    const searchParams = useSearchParams();
    const conversationId = searchParams.get("conversationId") ?? "";
    if (!conversationId) {
        return (_jsx("div", { style: {
                width: "100%",
                height: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                backgroundColor: "#0f172a",
            }, children: "Kh\u00F4ng t\u00ECm th\u1EA5y cu\u1ED9c tr\u00F2 chuy\u1EC7n." }));
    }
    return _jsx(DesktopChat, { conversationId: conversationId });
}
