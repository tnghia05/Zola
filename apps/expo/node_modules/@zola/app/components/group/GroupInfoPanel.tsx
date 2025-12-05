import { useEffect, useMemo, useState } from 'react';
import { Conversation, getUsersByIds, UserProfile } from '../../api';
import '../../styles/group-info-panel.css';
import { MemberRow } from './MemberRow';

interface MemberInfo {
  _id: string;
  name?: string;
  avatar?: string;
  email?: string;
}

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

export function GroupInfoPanel({
  conversation,
  currentUserId,
  onAddMembers,
  onRemoveMember,
  onLeaveGroup,
  onMakeAdmin,
  onRemoveAdmin,
  onChangeInfo,
  onGenerateInvite,
  inviteLink,
  isGeneratingInvite,
}: GroupInfoPanelProps) {
  const [showMembers, setShowMembers] = useState(true);
  const [membersInfo, setMembersInfo] = useState<MemberInfo[]>([]);
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle');
  const isAdmin = useMemo(
    () => conversation.admins?.some((id) => id === currentUserId),
    [conversation.admins, currentUserId]
  );
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
        if (!active) return;
        const mapped: MemberInfo[] = res.users.map((user: UserProfile) => ({
          _id: user._id,
          name: user.name || user.username || user.email || user._id,
          avatar: user.avatar,
          email: user.email,
        }));
        setMembersInfo(mapped);
      } catch (err) {
        console.error('Failed to load member info', err);
      }
    }
    loadMembers();
    return () => {
      active = false;
    };
  }, [conversation._id, conversation.isGroup, members]);

  const getMemberInfo = (memberId: string) => {
    return membersInfo?.find((info) => info._id === memberId);
  };

  return (
    <div className="group-info-panel">
      <div className="group-info-section">
        <div className="group-info-header">
          <div className="group-info-avatar">
            {conversation.groupAvatar ? <img src={conversation.groupAvatar} alt="" /> : '👥'}
          </div>
          <div>
            <div className="group-info-title">{conversation.title || `Nhóm (${members.length})`}</div>
            <div className="group-info-subtitle">{members.length} thành viên</div>
          </div>
        </div>
        {isAdmin && (
          <button className="group-info-action" onClick={onChangeInfo}>
            Chỉnh sửa tên/ảnh nhóm
          </button>
        )}
      </div>

      <div className="group-info-section">
        <div className="group-info-row" onClick={() => setShowMembers((prev) => !prev)}>
          <span>Thành viên</span>
          <span>
            {showMembers ? 'Ẩn' : 'Xem'} ({members.length})
          </span>
        </div>
        {showMembers && (
          <div className="group-member-list">
            {members.map((memberId) => {
              const info = getMemberInfo(memberId);
              const isMemberAdmin = admins.includes(memberId);
              const isSelf = memberId === currentUserId;
              const canManage = Boolean(isAdmin);
              return (
                <MemberRow
                  key={memberId}
                  memberId={memberId}
                  name={info?.name}
                  email={info?.email}
                  avatar={info?.avatar}
                  isAdmin={isMemberAdmin}
                  isSelf={isSelf}
                  canManage={canManage}
                  onMakeAdmin={onMakeAdmin}
                  onRemoveAdmin={onRemoveAdmin}
                  onRemove={onRemoveMember}
                />
              );
            })}
          </div>
        )}
      </div>

      <div className="group-info-section">
        {isAdmin && (
          <button className="group-info-action" onClick={onAddMembers}>
            Thêm thành viên
          </button>
        )}
        {isAdmin && (
          <div className="group-info-invite">
            <button className="group-info-action" onClick={onGenerateInvite} disabled={isGeneratingInvite}>
              {isGeneratingInvite ? 'Đang tạo link...' : 'Tạo link mời'}
            </button>
            {inviteLink && (
              <>
                <div className="invite-link-box">
                  <div className="invite-link-text" title={inviteLink}>
                    {inviteLink}
                  </div>
                  <button
                    className="secondary-btn"
                    onClick={async () => {
                      try {
                        await navigator.clipboard?.writeText(inviteLink);
                        setCopyState('copied');
                        setTimeout(() => setCopyState('idle'), 2000);
                      } catch (err) {
                        console.error('Copy failed', err);
                        setCopyState('error');
                      }
                    }}
                  >
                    {copyState === 'copied' ? 'Đã sao chép' : 'Sao chép'}
                  </button>
                </div>
                <div className="invite-link-actions">
                  <a
                    className="secondary-btn link-button"
                    href={inviteLink}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Mở link trên web
                  </a>
                <div className="invite-code-chip" title="Chia sẻ mã để nhập thủ công">
                  Mã: {inviteLink.split('/').pop() || inviteLink}
                </div>
                </div>
                {copyState === 'error' && (
                  <div className="invite-link-hint">
                    Không sao chép được, hãy bôi đen đường dẫn rồi nhấn Ctrl+C.
                  </div>
                )}
              </>
            )}
          </div>
        )}
        <button className="group-info-action danger" onClick={onLeaveGroup}>
          Rời nhóm
        </button>
      </div>
    </div>
  );
}

