import "../styles/feed.css";
interface AvatarCropModalProps {
    imageFile: File | null;
    onClose: () => void;
    onSave: (croppedImageBlob: Blob) => void;
}
export declare const AvatarCropModal: ({ imageFile, onClose, onSave }: AvatarCropModalProps) => import("react/jsx-runtime").JSX.Element | null;
export {};
