import { StoryAuthorGroup } from "../api";
type Props = {
    currentUser?: {
        _id: string;
        name: string;
        avatar?: string;
    } | null;
    groups: StoryAuthorGroup[];
    loading?: boolean;
    onCreateStory: () => void;
    onSelectStory: (groupIndex: number, storyIndex: number) => void;
};
export declare const StoriesBar: ({ currentUser, groups, loading, onCreateStory, onSelectStory, }: Props) => import("react/jsx-runtime").JSX.Element;
export {};
