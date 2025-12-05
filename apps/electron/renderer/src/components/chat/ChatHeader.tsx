import { ReactNode } from 'react';

interface ChatHeaderProps {
  title: string;
  subtitle?: string;
  avatar?: string;
  statusDotColor?: string;
  actions?: ReactNode;
  onVideoCall?: () => void;
  onAudioCall?: () => void;
}

export function ChatHeader({ 
  title, 
  subtitle, 
  avatar, 
  statusDotColor, 
  actions,
  onVideoCall,
  onAudioCall,
}: ChatHeaderProps) {
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
      <div className="chat-header-actions">
        {onVideoCall && (
          <button
            className="chat-header-action-button"
            onClick={onVideoCall}
            title="Gọi video"
            type="button"
          >
            📹
          </button>
        )}
        {onAudioCall && (
          <button
            className="chat-header-action-button"
            onClick={onAudioCall}
            title="Gọi thoại"
            type="button"
          >
            📞
          </button>
        )}
        {actions}
      </div>
    </div>
  );
}
