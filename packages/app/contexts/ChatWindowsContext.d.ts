import { ReactNode } from "react";
interface ChatWindow {
    id: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    isOnline?: boolean;
}
interface ChatWindowsContextType {
    chatWindows: ChatWindow[];
    openChat: (userId: string, userName: string, userAvatar?: string, isOnline?: boolean) => void;
    closeChat: (userId: string) => void;
    minimizeChat: (userId: string) => void;
    restoreChat: (userId: string) => void;
    minimizedChats: Set<string>;
}
export declare const ChatWindowsProvider: ({ children }: {
    children: ReactNode;
}) => import("react/jsx-runtime").JSX.Element;
export declare const useChatWindows: () => ChatWindowsContextType;
export {};
