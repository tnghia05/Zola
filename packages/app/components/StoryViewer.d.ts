import { StoryAuthorGroup } from '../api';
export type StoryPointer = {
    groupIndex: number;
    storyIndex: number;
};
type Props = {
    groups: StoryAuthorGroup[];
    state: StoryPointer | null;
    onClose: () => void;
    onNext: () => void;
    onPrev: () => void;
    onStorySeen: (storyId: string) => void;
    onDeleteStory?: (storyId: string) => Promise<void> | void;
    currentUserId?: string;
};
export declare const StoryViewer: ({ groups, state, onClose, onNext, onPrev, onStorySeen, onDeleteStory, currentUserId, }: Props) => import("react").ReactPortal | null;
export {};
