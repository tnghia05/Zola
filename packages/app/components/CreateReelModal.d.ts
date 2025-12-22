import "../styles/feed.css";
interface CreateReelModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit?: () => Promise<void> | void;
    currentUser: {
        _id: string;
        name: string;
        avatar?: string;
    } | null;
}
export declare const CreateReelModal: ({ isOpen, onClose, onSubmit, currentUser, }: CreateReelModalProps) => import("react/jsx-runtime").JSX.Element | null;
export {};
