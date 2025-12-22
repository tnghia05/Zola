import { Post } from "../api";
type ReportPayload = {
    reason: string;
    details?: string;
};
type Props = {
    isOpen: boolean;
    post: Post | null;
    onClose: () => void;
    onSubmit: (payload: ReportPayload) => Promise<void>;
    isSubmitting?: boolean;
};
export declare const ReportPostModal: ({ isOpen, post, onClose, onSubmit, isSubmitting }: Props) => import("react/jsx-runtime").JSX.Element | null;
export default ReportPostModal;
