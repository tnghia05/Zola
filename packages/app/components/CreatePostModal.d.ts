import "../styles/feed.css";
interface CreatePostModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (content: string, media: any[], visibility?: "PUBLIC" | "FRIENDS" | "ONLY_ME", taggedUsers?: string[]) => Promise<void>;
    currentUser: {
        _id: string;
        name: string;
        avatar?: string;
    } | null;
}
export declare const CreatePostModal: ({ isOpen, onClose, onSubmit, currentUser, }: CreatePostModalProps) => import("react/jsx-runtime").JSX.Element | null;
export {};
