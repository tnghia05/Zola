import { ChatMessage } from '../../types/chat';
interface ForwardMessageDialogProps {
    message: ChatMessage | null;
    onClose: () => void;
    onForwarded?: () => void;
}
export declare function ForwardMessageDialog({ message, onClose, onForwarded }: ForwardMessageDialogProps): import("react/jsx-runtime").JSX.Element | null;
export {};
