import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ChatMessage } from '../../types/chat';
import '../../styles/direct-chat-panel.css';

interface DirectChatInfoPanelProps {
  conversationId: string;
  opponentName?: string;
  opponentAvatar?: string;
  messages?: ChatMessage[];
  onClose?: () => void;
}

export function DirectChatInfoPanel({
  conversationId,
  opponentName,
  opponentAvatar,
  messages = [],
  onClose,
}: DirectChatInfoPanelProps) {
  const [isMediaOpen, setIsMediaOpen] = useState(false);
  const [mediaTab, setMediaTab] = useState<'media' | 'files'>('media');
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerImages, setViewerImages] = useState<string[]>([]);
  const [viewerIndex, setViewerIndex] = useState(0);

  const title = useMemo(() => opponentName || 'Đoạn chat', [opponentName]);

  const mediaMessages = useMemo(
    () =>
      messages.filter((msg) => {
        const hasImageUrl = Boolean(msg.imageUrl);
        const isImageType = msg.type === 'image';
        const isFileImage = (msg as any).file?.mime?.startsWith?.('image/');
        return hasImageUrl || isImageType || isFileImage;
      }),
    [messages],
  );

  const fileMessages = useMemo(
    () =>
      messages.filter((msg) => {
        const isFileType = msg.type === 'file';
        const hasFile = Boolean((msg as any).file);
        const isNonImageFile = (msg as any).file && !(msg as any).file.mime?.startsWith?.('image/');
        return isFileType || (hasFile && isNonImageFile);
      }),
    [messages],
  );

  const mediaUrls = useMemo(
    () =>
      mediaMessages
        .map((msg) => {
          const url =
            msg.imageUrl ||
            ((msg as any).file?.mime?.startsWith?.('image/') ? (msg as any).file.url : undefined);
          return url || null;
        })
        .filter((u): u is string => Boolean(u)),
    [mediaMessages],
  );

  const openViewerAt = (index: number) => {
    if (!mediaUrls.length) return;
    const clamped = Math.max(0, Math.min(index, mediaUrls.length - 1));
    setViewerImages(mediaUrls);
    setViewerIndex(clamped);
    setViewerOpen(true);
  };

  return (
    <div className="direct-chat-panel">
      {/* Header với avatar và tên */}
      <div className="direct-chat-panel-section">
        <div className="direct-chat-panel-header">
          <div className="direct-chat-panel-avatar">
            {opponentAvatar ? (
              <img src={opponentAvatar} alt={title} />
            ) : (
              <div className="direct-chat-panel-avatar-fallback">
                {title.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="direct-chat-panel-header-text">
            <div className="direct-chat-panel-title">{title}</div>
            <div className="direct-chat-panel-subtitle">Đoạn chat cá nhân</div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="direct-chat-panel-actions">
          <button className="direct-chat-panel-action-btn">
            <span className="action-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
            <span className="action-label">Trang cá nhân</span>
          </button>
          <button className="direct-chat-panel-action-btn">
            <span className="action-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
            <span className="action-label">Tắt thông báo</span>
          </button>
          <button className="direct-chat-panel-action-btn">
            <span className="action-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
            <span className="action-label">Tìm kiếm</span>
          </button>
        </div>

        <div className="direct-chat-panel-divider" />
      </div>

      {/* Tuỳ chỉnh đoạn chat */}
      <div className="direct-chat-panel-section">
        <div className="direct-chat-panel-section-title">TUỲ CHỈNH ĐOẠN CHAT</div>
        <div className="direct-chat-panel-list">
          <button className="direct-chat-panel-item">
            <span className="item-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
            <span>Đổi chủ đề</span>
          </button>
          <button className="direct-chat-panel-item">
            <span className="item-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
            <span>Thay đổi biểu tượng cảm xúc</span>
          </button>
          <button className="direct-chat-panel-item">
            <span className="item-icon item-icon-text">Aa</span>
            <span>Chỉnh sửa biệt danh</span>
          </button>
        </div>
      </div>

      {/* File phương tiện & file */}
      <div className="direct-chat-panel-section">
        <div className="direct-chat-panel-section-title">FILE PHƯƠNG TIỆN & FILE</div>
        <div className="direct-chat-panel-list">
          <button
            className="direct-chat-panel-item"
            onClick={() => {
              setMediaTab('media');
              setIsMediaOpen(true);
            }}
          >
            <span className="item-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
                <path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
            <span>File phương tiện</span>
          </button>
          <button
            className="direct-chat-panel-item"
            onClick={() => {
              setMediaTab('files');
              setIsMediaOpen(true);
            }}
          >
            <span className="item-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2v11z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
            <span>File</span>
          </button>
        </div>
      </div>

      {/* Media overlay */}
      {isMediaOpen && (
        <div className="media-overlay">
          <div className="media-overlay-inner">
            <div className="media-overlay-header">
              <button className="media-back-btn" onClick={() => setIsMediaOpen(false)}>
                ←
              </button>
              <div className="media-title-group">
                <div className="media-title">File phương tiện & file</div>
                <div className="media-subtitle">{title}</div>
              </div>
            </div>

            <div className="media-tabs">
              <button
                className={`media-tab ${mediaTab === 'media' ? 'active' : ''}`}
                onClick={() => setMediaTab('media')}
              >
                File phương tiện
              </button>
              <button
                className={`media-tab ${mediaTab === 'files' ? 'active' : ''}`}
                onClick={() => setMediaTab('files')}
              >
                File
              </button>
            </div>

            <div className="media-content">
              {mediaTab === 'media' ? (
                mediaMessages.length === 0 ? (
                  <div className="media-placeholder">
                    <p>Chưa có file phương tiện nào trong đoạn chat này.</p>
                  </div>
                ) : (
                  <div className="media-grid">
                    {mediaMessages.map((msg, index) => {
                      const key = msg._id || msg.localId || `${msg.createdAt}-${msg.senderId}`;
                      const url =
                        msg.imageUrl ||
                        ((msg as any).file?.mime?.startsWith?.('image/') ? (msg as any).file.url : undefined);
                      if (!url) return null;
                      return (
                        <button
                          key={key}
                          type="button"
                          className="media-grid-item"
                          onClick={() => openViewerAt(index)}
                        >
                          <img src={url} alt="" />
                        </button>
                      );
                    })}
                  </div>
                )
              ) : fileMessages.length === 0 ? (
                <div className="media-placeholder">
                  <p>Chưa có file nào trong đoạn chat này.</p>
                </div>
              ) : (
                <div className="media-file-list">
                  {fileMessages.map((msg) => {
                    const file = (msg as any).file;
                    if (!file) return null;
                    const key = msg._id || msg.localId || `${msg.createdAt}-${msg.senderId}`;
                    return (
                      <a
                        key={key}
                        href={file.url}
                        target="_blank"
                        rel="noreferrer"
                        className="media-file-item"
                      >
                        <div className="media-file-icon">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="#0966FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="#0966FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                        <div className="media-file-info">
                          <div className="media-file-name">{file.name || 'File đính kèm'}</div>
                          <div className="media-file-meta">
                            {new Date(msg.createdAt).toLocaleDateString('vi-VN')}
                          </div>
                        </div>
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Image viewer */}
      {viewerOpen
        ? createPortal(
            <div
              className="image-viewer-backdrop"
              onClick={() => setViewerOpen(false)}
            >
              <div
                className="image-viewer-content"
                onClick={(e) => e.stopPropagation()}
              >
                {viewerImages[viewerIndex] ? (
                  <img src={viewerImages[viewerIndex]} alt="attachment-large" />
                ) : null}
                {viewerImages.length > 1 ? (
                  <div className="image-viewer-thumbs">
                    {viewerImages.map((src, index) => (
                      <button
                        key={src + index}
                        type="button"
                        className={`image-viewer-thumb ${index === viewerIndex ? 'active' : ''}`}
                        onClick={() => setViewerIndex(index)}
                      >
                        <img src={src} alt={`thumb-${index}`} />
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

