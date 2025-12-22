import "../styles/feed.css";
interface SharePostModalProps {
    isOpen: boolean;
    onClose: () => void;
    postId: string;
    onShareSuccess?: () => void;
    currentUser: {
        _id: string;
        name: string;
        avatar?: string;
    } | null;
}
export declare const SharePostModal: ({ isOpen, onClose, postId, onShareSuccess, currentUser, }: SharePostModalProps) => import("react/jsx-runtime").JSX.Element | null;
export {};
