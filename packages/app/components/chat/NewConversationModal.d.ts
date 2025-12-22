import { Conversation } from '../../api';
import '../../styles/new-conversation-modal.css';
interface NewConversationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreated?: (conversation: Conversation) => void;
}
export declare function NewConversationModal({ isOpen, onClose, onCreated }: NewConversationModalProps): import("react/jsx-runtime").JSX.Element | null;
export {};
