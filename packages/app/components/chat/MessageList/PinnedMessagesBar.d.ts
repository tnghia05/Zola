import { ChatMessage } from '../../../types/chat';
interface PinnedMessagesBarProps {
    messages: ChatMessage[];
    onSelect?: (messageId: string) => void;
}
export declare function PinnedMessagesBar({ messages, onSelect }: PinnedMessagesBarProps): import("react/jsx-runtime").JSX.Element | null;
export {};
