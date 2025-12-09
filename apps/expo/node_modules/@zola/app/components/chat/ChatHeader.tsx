import { ReactNode } from 'react';

interface ActiveCallInfo {
  id: string;
  type: 'video' | 'audio';
  callType: 'p2p' | 'sfu';
  livekitRoomName?: string;
}

interface ChatHeaderProps {
  title: string;
  subtitle?: string;
  avatar?: string;
  statusDotColor?: string;
  actions?: ReactNode;
  onVideoCall?: () => void;
  onAudioCall?: () => void;
  onToggleInfo?: () => void;
  isInfoVisible?: boolean;
  activeCall?: ActiveCallInfo | null;
  onJoinCall?: (callId: string, callType: string, livekitRoomName?: string) => void;
}

export function ChatHeader({ 
  title, 
  subtitle, 
  avatar, 
  statusDotColor, 
  actions,
  onVideoCall,
  onAudioCall,
  onToggleInfo,
  isInfoVisible,
  activeCall,
  onJoinCall,
}: ChatHeaderProps) {
  const handleJoinCall = () => {
    if (activeCall && onJoinCall) {
      onJoinCall(activeCall.id, activeCall.callType, activeCall.livekitRoomName);
    }
  };

  return (
    <div className="chat-header-content">
      <div className="chat-header-left">
        {avatar ? (
          <img src={avatar} alt={title} className="chat-header-avatar" />
        ) : (
          <div className="chat-header-avatar chat-header-avatar--fallback">
            {title.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div className="chat-header-text">
          <div className="chat-header-title">{title}</div>
          {subtitle ? (
            <div className="chat-header-subtitle">
              {statusDotColor ? (
                <span
                  className="chat-header-status-dot"
                  style={{ backgroundColor: statusDotColor }}
                />
              ) : null}
              {subtitle}
            </div>
          ) : null}
        </div>
      </div>
      
      {/* Active call banner */}
      {activeCall && (
        <div className="chat-header-active-call">
          <div className="chat-header-active-call-indicator">
            <span className="chat-header-active-call-pulse" />
            <span className="chat-header-active-call-text">
              {activeCall.type === 'video' ? '📹' : '📞'} Cuộc gọi đang diễn ra
            </span>
          </div>
          <button
            className="chat-header-join-call-btn"
            onClick={handleJoinCall}
            type="button"
          >
            Tham gia
          </button>
        </div>
      )}
      
      <div className="chat-header-actions">
        {/* Hide call buttons when there's an active call */}
        {!activeCall && onVideoCall && (
          <button
            className="chat-header-action-button"
            onClick={onVideoCall}
            title="Gọi video"
            type="button"
          >
            📹
          </button>
        )}
        {!activeCall && onAudioCall && (
          <button
            className="chat-header-action-button"
            onClick={onAudioCall}
            title="Gọi thoại"
            type="button"
          >
            📞
          </button>
        )}
        {onToggleInfo && (
          <button
            className="chat-header-action-button"
            onClick={onToggleInfo}
            title={isInfoVisible ? 'Ẩn thông tin đoạn chat' : 'Hiện thông tin đoạn chat'}
            type="button"
          >
            ℹ️
          </button>
        )}
        {actions}
      </div>
    </div>
  );
}
