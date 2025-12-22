import { Conversation } from '../../api';
import '../../styles/group-modals.css';
interface Props {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (userIds: string[]) => Promise<void> | void;
    conversation: Conversation;
}
export declare function AddMembersModal({ isOpen, onClose, onConfirm, conversation }: Props): import("react/jsx-runtime").JSX.Element | null;
export {};
