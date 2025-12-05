import "../styles/feed.css";

interface Contact {
  _id: string;
  name: string;
  avatar?: string;
  isOnline?: boolean;
  lastActive?: string; // e.g. "29 phút", "2 giờ"
}

interface GroupChat {
  _id: string;
  name: string;
  avatar?: string;
  lastActive?: string;
}

interface RightSidebarProps {
  contacts?: Contact[];
  groupChats?: GroupChat[];
  isLoading?: boolean;
  onContactClick?: (userId: string) => void;
  onGroupClick?: (groupId: string) => void;
  onCreateGroup?: () => void;
}

/**
 * Right Sidebar - Contacts & Group Chats Panel
 *
 * Design: Facebook Messenger Style
 * - Contacts list with online status indicators
 * - Group chats section
 * - Dark theme with subtle hover effects
 */
export const RightSidebar = ({
  contacts = [],
  groupChats = [],
  isLoading = false,
  onContactClick,
  onGroupClick,
  onCreateGroup,
}: RightSidebarProps) => {
  return (
    <div className="contacts-sidebar">
      {/* Contacts Section */}
      <div className="contacts-section">
        <div className="contacts-header">
          <span className="contacts-title">Người liên hệ</span>
          <div className="contacts-header-actions">
            <button className="contacts-header-btn" title="Tìm kiếm">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
              </svg>
            </button>
            <button className="contacts-header-btn" title="Tùy chọn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
              </svg>
            </button>
          </div>
        </div>

        {isLoading && (
          <div className="contacts-loading">Đang tải...</div>
        )}

        {!isLoading && contacts.length === 0 && (
          <p className="contacts-empty">Không có người liên hệ nào.</p>
        )}

        <div className="contacts-list">
          {contacts.map((contact) => (
            <div 
              key={contact._id} 
              className="contact-item"
              onClick={() => onContactClick?.(contact._id)}
            >
              <div className="contact-avatar-wrapper">
                <div className="contact-avatar">
                  {contact.avatar ? (
                    <img src={contact.avatar} alt={contact.name} />
                  ) : (
                    <div className="contact-avatar-initials">
                      {contact.name?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                  )}
                </div>
                {contact.isOnline && (
                  <span className="contact-online-dot" />
                )}
              </div>

              <div className="contact-info">
                <span className="contact-name">{contact.name}</span>
                {!contact.isOnline && contact.lastActive && (
                  <span className="contact-last-active">{contact.lastActive}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Group Chats Section */}
      <div className="contacts-section">
        <div className="contacts-header">
          <span className="contacts-title">Nhóm chat</span>
        </div>

        {!isLoading && groupChats.length === 0 && (
          <p className="contacts-empty">Chưa có nhóm chat nào.</p>
        )}

        <div className="contacts-list">
          {groupChats.map((group) => (
            <div 
              key={group._id} 
              className="contact-item"
              onClick={() => onGroupClick?.(group._id)}
            >
              <div className="contact-avatar-wrapper">
                <div className="contact-avatar contact-avatar--group">
                  {group.avatar ? (
                    <img src={group.avatar} alt={group.name} />
                  ) : (
                    <div className="contact-avatar-initials">
                      {group.name?.charAt(0)?.toUpperCase() || "G"}
                    </div>
                  )}
                </div>
              </div>

              <div className="contact-info">
                <span className="contact-name">{group.name}</span>
                {group.lastActive && (
                  <span className="contact-last-active">{group.lastActive}</span>
                )}
              </div>
            </div>
          ))}

          {/* Create Group Button */}
          <div 
            className="contact-item contact-item--create"
            onClick={onCreateGroup}
          >
            <div className="contact-avatar-wrapper">
              <div className="contact-avatar contact-avatar--create">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                </svg>
              </div>
            </div>
            <div className="contact-info">
              <span className="contact-name">Tạo nhóm chat</span>
            </div>
            <div className="contact-external-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
