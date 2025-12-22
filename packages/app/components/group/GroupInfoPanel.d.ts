import { Conversation } from '../../api';
import '../../styles/group-info-panel.css';
interface GroupInfoPanelProps {
    conversation: Conversation;
    currentUserId: string;
    onAddMembers?: () => void;
    onRemoveMember?: (userId: string) => void;
    onLeaveGroup?: () => void;
    onMakeAdmin?: (userId: string) => void;
    onRemoveAdmin?: (userId: string) => void;
    onChangeInfo?: () => void;
    onGenerateInvite?: () => void;
    inviteLink?: string;
    isGeneratingInvite?: boolean;
}
export declare function GroupInfoPanel({ conversation, currentUserId, onAddMembers, onRemoveMember, onLeaveGroup, onMakeAdmin, onRemoveAdmin, onChangeInfo, onGenerateInvite, inviteLink, isGeneratingInvite, }: GroupInfoPanelProps): import("react/jsx-runtime").JSX.Element;
export {};
