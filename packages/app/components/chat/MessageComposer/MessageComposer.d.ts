import { SendMessagePayload } from '../../../types/chat';
interface MessageComposerProps {
    onSend: (payload: SendMessagePayload) => Promise<void> | void;
    disabled?: boolean;
    onValueChange?: (value: string) => void;
    replyPreview?: string | undefined;
    onCancelReply?: () => void;
    editingLabel?: string;
    onCancelEdit?: () => void;
    value?: string;
}
export declare function MessageComposer({ onSend, disabled, onValueChange, replyPreview, onCancelReply, editingLabel, onCancelEdit, value, }: MessageComposerProps): import("react/jsx-runtime").JSX.Element;
export {};
