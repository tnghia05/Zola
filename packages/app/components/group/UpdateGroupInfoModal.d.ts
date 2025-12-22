import '../../styles/group-modals.css';
interface UpdateGroupInfoModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: {
        title?: string;
        avatar?: string;
    }) => Promise<void> | void;
    initialTitle?: string;
    initialAvatar?: string;
}
export declare function UpdateGroupInfoModal({ isOpen, onClose, onSave, initialTitle, initialAvatar, }: UpdateGroupInfoModalProps): import("react/jsx-runtime").JSX.Element | null;
export {};
