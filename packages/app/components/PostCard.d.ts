import { Post, ReactionType } from "../api";
type PostWithSavedMeta = Post & {
    savedAt?: string;
};
type Props = {
    post: PostWithSavedMeta;
    reaction?: ReactionType | null;
    onSelectReaction?: (postId: string, reaction: ReactionType) => void;
    onClearReaction?: (postId: string) => void;
    onSavePost?: (postId: string) => Promise<void> | void;
    onUnsavePost?: (postId: string) => Promise<void> | void;
    onReportPost?: (post: PostWithSavedMeta) => void;
    isSaved?: boolean;
};
export declare const PostCard: ({ post, reaction, onSelectReaction, onClearReaction, onSavePost, onUnsavePost, onReportPost, isSaved, }: Props) => import("react/jsx-runtime").JSX.Element;
export default PostCard;
