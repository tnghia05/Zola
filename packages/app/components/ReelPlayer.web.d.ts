import { Reel } from "../api";
type Props = {
    reel: Reel;
    isActive?: boolean;
    onLike?: (reelId: string, liked: boolean) => void;
    onComment?: (reelId: string) => void;
    onShare?: (reel: Reel) => void;
};
export declare const ReelPlayer: ({ reel, isActive, onLike, onComment, onShare, }: Props) => import("react/jsx-runtime").JSX.Element;
export {};
