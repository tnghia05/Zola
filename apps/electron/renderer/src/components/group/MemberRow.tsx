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

export function MemberRow({
  memberId,
  name,
  email,
  avatar,
  isAdmin,
  isSelf,
  canManage,
  onMakeAdmin,
  onRemoveAdmin,
  onRemove,
}: MemberRowProps) {
  return (
    <div className="group-member-item">
      <div className="member-info">
        <div className="member-avatar">
          {avatar ? <img src={avatar} alt={name || memberId} /> : (name || memberId).slice(0, 2).toUpperCase()}
        </div>
        <div className="member-meta">
          <div>{name || memberId}</div>
          {isAdmin && <span className="badge-admin">Admin</span>}
          {email && <span className="member-email">{email}</span>}
        </div>
      </div>
      <div className="member-actions">
        {canManage && !isSelf && (
          <>
            {isAdmin ? (
              <button onClick={() => onRemoveAdmin?.(memberId)}>Bỏ admin</button>
            ) : (
              <button onClick={() => onMakeAdmin?.(memberId)}>Chọn admin</button>
            )}
            <button onClick={() => onRemove?.(memberId)}>Xóa</button>
          </>
        )}
      </div>
    </div>
  );
}

