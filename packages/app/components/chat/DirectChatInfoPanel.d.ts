import '../../styles/group-info-panel.css';
import type { Conversation } from '../../api';
import type { ChatMessage } from '../../types/chat';
interface DirectChatInfoPanelProps {
    conversation: Conversation;
    opponentName?: string;
    opponentAvatar?: string;
    messages?: ChatMessage[];
}
export declare function DirectChatInfoPanel({ conversation, opponentName, opponentAvatar, messages, }: DirectChatInfoPanelProps): import("react/jsx-runtime").JSX.Element;
export {};
