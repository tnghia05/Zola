import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { getUsersByIds } from '../../api';
import '../../styles/group-info-panel.css';
import { MemberRow } from './MemberRow';
export function GroupInfoPanel({ conversation, currentUserId, onAddMembers, onRemoveMember, onLeaveGroup, onMakeAdmin, onRemoveAdmin, onChangeInfo, onGenerateInvite, inviteLink, isGeneratingInvite, }) {
    const [showMembers, setShowMembers] = useState(true);
    const [membersInfo, setMembersInfo] = useState([]);
    const [copyState, setCopyState] = useState('idle');
    const isAdmin = useMemo(() => conversation.admins?.some((id) => id === currentUserId), [conversation.admins, currentUserId]);
    const members = conversation.members || [];
    const admins = conversation.admins || [];
    useEffect(() => {
        let active = true;
        async function loadMembers() {
            if (!conversation.isGroup || !members.length) {
                setMembersInfo([]);
                return;
            }
            const memberIds = members.map((m) => (typeof m === 'string' ? m : String(m)));
            try {
                const res = await getUsersByIds(memberIds);
                if (!active)
                    return;
                const mapped = res.users.map((user) => ({
                    _id: user._id,
                    name: user.name || user.username || user.email || user._id,
                    avatar: user.avatar,
                    email: user.email,
                }));
                setMembersInfo(mapped);
            }
            catch (err) {
                console.error('Failed to load member info', err);
            }
        }
        loadMembers();
        return () => {
            active = false;
        };
    }, [conversation._id, conversation.isGroup, members]);
    const getMemberInfo = (memberId) => {
        return membersInfo?.find((info) => info._id === memberId);
    };
    return (_jsxs("div", { className: "group-info-panel", children: [_jsxs("div", { className: "group-info-section", children: [_jsxs("div", { className: "group-info-header", children: [_jsx("div", { className: "group-info-avatar", children: conversation.groupAvatar ? _jsx("img", { src: conversation.groupAvatar, alt: "" }) : '👥' }), _jsxs("div", { children: [_jsx("div", { className: "group-info-title", children: conversation.title || `Nhóm (${members.length})` }), _jsxs("div", { className: "group-info-subtitle", children: [members.length, " th\u00E0nh vi\u00EAn"] })] })] }), isAdmin && (_jsx("button", { className: "group-info-action", onClick: onChangeInfo, children: "Ch\u1EC9nh s\u1EEDa t\u00EAn/\u1EA3nh nh\u00F3m" }))] }), _jsxs("div", { className: "group-info-section", children: [_jsxs("div", { className: "group-info-row", onClick: () => setShowMembers((prev) => !prev), children: [_jsx("span", { children: "Th\u00E0nh vi\u00EAn" }), _jsxs("span", { children: [showMembers ? 'Ẩn' : 'Xem', " (", members.length, ")"] })] }), showMembers && (_jsx("div", { className: "group-member-list", children: members.map((memberId) => {
                            const info = getMemberInfo(memberId);
                            const isMemberAdmin = admins.includes(memberId);
                            const isSelf = memberId === currentUserId;
                            const canManage = Boolean(isAdmin);
                            return (_jsx(MemberRow, { memberId: memberId, name: info?.name, email: info?.email, avatar: info?.avatar, isAdmin: isMemberAdmin, isSelf: isSelf, canManage: canManage, onMakeAdmin: onMakeAdmin, onRemoveAdmin: onRemoveAdmin, onRemove: onRemoveMember }, memberId));
                        }) }))] }), _jsxs("div", { className: "group-info-section", children: [isAdmin && (_jsx("button", { className: "group-info-action", onClick: onAddMembers, children: "Th\u00EAm th\u00E0nh vi\u00EAn" })), isAdmin && (_jsxs("div", { className: "group-info-invite", children: [_jsx("button", { className: "group-info-action", onClick: onGenerateInvite, disabled: isGeneratingInvite, children: isGeneratingInvite ? 'Đang tạo link...' : 'Tạo link mời' }), inviteLink && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "invite-link-box", children: [_jsx("div", { className: "invite-link-text", title: inviteLink, children: inviteLink }), _jsx("button", { className: "secondary-btn", onClick: async () => {
                                                    try {
                                                        await navigator.clipboard?.writeText(inviteLink);
                                                        setCopyState('copied');
                                                        setTimeout(() => setCopyState('idle'), 2000);
                                                    }
                                                    catch (err) {
                                                        console.error('Copy failed', err);
                                                        setCopyState('error');
                                                    }
                                                }, children: copyState === 'copied' ? 'Đã sao chép' : 'Sao chép' })] }), _jsxs("div", { className: "invite-link-actions", children: [_jsx("a", { className: "secondary-btn link-button", href: inviteLink, target: "_blank", rel: "noreferrer", children: "M\u1EDF link tr\u00EAn web" }), _jsxs("div", { className: "invite-code-chip", title: "Chia s\u1EBB m\u00E3 \u0111\u1EC3 nh\u1EADp th\u1EE7 c\u00F4ng", children: ["M\u00E3: ", inviteLink.split('/').pop() || inviteLink] })] }), copyState === 'error' && (_jsx("div", { className: "invite-link-hint", children: "Kh\u00F4ng sao ch\u00E9p \u0111\u01B0\u1EE3c, h\u00E3y b\u00F4i \u0111en \u0111\u01B0\u1EDDng d\u1EABn r\u1ED3i nh\u1EA5n Ctrl+C." }))] }))] })), _jsx("button", { className: "group-info-action danger", onClick: onLeaveGroup, children: "R\u1EDDi nh\u00F3m" })] })] }));
}
