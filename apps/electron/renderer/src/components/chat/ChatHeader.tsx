import { ReactNode } from 'react';

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
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="5" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
              <path d="M22 7l-6 5 6 5V7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}
        {onAudioCall && (
          <button
            className="chat-header-action-button"
            onClick={onAudioCall}
            title="Gọi thoại"
            type="button"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}
        {onToggleInfo && (
          <button
            className={`chat-header-action-button ${isInfoVisible ? 'active' : ''}`}
            onClick={onToggleInfo}
            title="Thông tin"
            type="button"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <line x1="12" y1="16" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <line x1="12" y1="8" x2="12.01" y2="8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        )}
        {actions}
      </div>
    </div>
  );
}
