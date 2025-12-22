import { StoryMedia, StoryMusic } from "../api";
type Props = {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (payload: {
        media: StoryMedia[];
        caption?: string;
        visibility?: "FRIENDS" | "PUBLIC";
        music?: StoryMusic;
    }) => Promise<void>;
    currentUser?: {
        _id: string;
        name: string;
        avatar?: string;
    } | null;
};
export declare const CreateStoryModal: ({ isOpen, onClose, onSubmit, currentUser }: Props) => import("react/jsx-runtime").JSX.Element | null;
export {};
