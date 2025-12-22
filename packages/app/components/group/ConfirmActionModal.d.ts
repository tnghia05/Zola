import '../../styles/group-modals.css';
interface ConfirmActionModalProps {
    isOpen: boolean;
    title: string;
    description: string;
    confirmLabel?: string;
    onClose: () => void;
    onConfirm: () => Promise<void> | void;
    variant?: 'danger' | 'default';
}
export declare function ConfirmActionModal({ isOpen, title, description, confirmLabel, onClose, onConfirm, variant, }: ConfirmActionModalProps): import("react/jsx-runtime").JSX.Element | null;
export {};
