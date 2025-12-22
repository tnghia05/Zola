import '../../styles/group-info-panel.css';
interface MemberRowProps {
    memberId: string;
    name?: string;
    email?: string;
    avatar?: string;
    isAdmin: boolean;
    isSelf: boolean;
    canManage: boolean;
    onMakeAdmin?: (userId: string) => void;
    onRemoveAdmin?: (userId: string) => void;
    onRemove?: (userId: string) => void;
}
export declare function MemberRow({ memberId, name, email, avatar, isAdmin, isSelf, canManage, onMakeAdmin, onRemoveAdmin, onRemove, }: MemberRowProps): import("react/jsx-runtime").JSX.Element;
export {};
