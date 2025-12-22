interface ReactionPickerProps {
    isOpen: boolean;
    position: {
        top: number;
        left: number;
        right?: number;
    };
    onSelect: (emoji: string) => void;
    onClose: () => void;
    anchorClassName?: string;
}
export declare function ReactionPicker({ isOpen, position, onSelect, onClose, anchorClassName, }: ReactionPickerProps): import("react").ReactPortal | null;
export {};
