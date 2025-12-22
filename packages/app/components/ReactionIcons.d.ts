import React from 'react';
interface ReactionIconProps {
    size?: number;
    className?: string;
}
export declare const ReactionLikeIcon: React.FC<ReactionIconProps>;
export declare const ReactionLoveIcon: React.FC<ReactionIconProps>;
export declare const ReactionHahaIcon: React.FC<ReactionIconProps>;
export declare const ReactionWowIcon: React.FC<ReactionIconProps>;
export declare const ReactionSadIcon: React.FC<ReactionIconProps>;
export declare const ReactionAngryIcon: React.FC<ReactionIconProps>;
export declare const ReactionIconsMap: {
    LIKE: React.FC<ReactionIconProps>;
    LOVE: React.FC<ReactionIconProps>;
    HAHA: React.FC<ReactionIconProps>;
    WOW: React.FC<ReactionIconProps>;
    SAD: React.FC<ReactionIconProps>;
    ANGRY: React.FC<ReactionIconProps>;
};
export default ReactionIconsMap;
