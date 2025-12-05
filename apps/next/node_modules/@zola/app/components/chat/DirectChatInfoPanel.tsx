import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import '../../styles/group-info-panel.css';
import type { Conversation } from '../../api';
import type { ChatMessage } from '../../types/chat';

interface DirectChatInfoPanelProps {
  conversation: Conversation;
  opponentName?: string;
  opponentAvatar?: string;
  messages?: ChatMessage[];
}

export function DirectChatInfoPanel({
  conversation,
  opponentName,
  opponentAvatar,
  messages = [],
}: DirectChatInfoPanelProps) {
  const [isMediaOpen, setIsMediaOpen] = useState(false);
  const [mediaTab, setMediaTab] = useState<'media' | 'files'>('media');
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerImages, setViewerImages] = useState<string[]>([]);
  const [viewerIndex, setViewerIndex] = useState(0);

  const title = useMemo(
    () => opponentName || conversation.title || 'Đoạn chat',
    [opponentName, conversation.title],
  );

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
    <div className="group-info-panel direct-chat-panel">
      {/* Thông tin về đoạn chat */}
      <div className="group-info-section">
        <div className="group-info-header direct-chat-header">
          <div className="group-info-avatar large">
            {opponentAvatar ? <img src={opponentAvatar} alt="" /> : '👤'}
          </div>
          <div className="direct-chat-header-text">
            <div className="group-info-title">{title}</div>
            <div className="group-info-subtitle">Đoạn chat cá nhân</div>
          </div>
        </div>


        <div className="direct-chat-action-row">
          <button className="direct-chat-circle-btn">
            <span className="circle-icon">👤</span>
            <span className="circle-label">Trang cá nhân</span>
          </button>
          <button className="direct-chat-circle-btn">
            <span className="circle-icon">🔔</span>
            <span className="circle-label">Tắt thông báo</span>
          </button>
          <button className="direct-chat-circle-btn">
            <span className="circle-icon">🔍</span>
            <span className="circle-label">Tìm kiếm</span>
          </button>
        </div>

        <div className="group-info-divider" />
      </div>

      {/* Tuỳ chỉnh đoạn chat */}
      <div className="group-info-section">
        <div className="group-info-section-title">Tuỳ chỉnh đoạn chat</div>
        <div className="group-info-list">
          <button className="group-info-item">
            <span className="group-info-item-icon">🎨</span>
            <span>Đổi chủ đề</span>
          </button>
          <button className="group-info-item">
            <span className="group-info-item-icon">👍</span>
            <span>Thay đổi biểu tượng cảm xúc</span>
          </button>
          <button className="group-info-item">
            <span className="group-info-item-icon">Aa</span>
            <span>Chỉnh sửa biệt danh</span>
          </button>
        </div>
      </div>

      {/* File phương tiện & file */}
      <div className="group-info-section">
        <div className="group-info-section-title">File phương tiện & file</div>
        <div className="group-info-list">
          <button
            className="group-info-item"
            onClick={() => {
              setMediaTab('media');
              setIsMediaOpen(true);
            }}
          >
            <span className="group-info-item-icon">🖼️</span>
            <span>File phương tiện</span>
          </button>
          <button
            className="group-info-item"
            onClick={() => {
              setMediaTab('files');
              setIsMediaOpen(true);
            }}
          >
            <span className="group-info-item-icon">📁</span>
            <span>File</span>
          </button>
        </div>
      </div>

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
                        <div className="media-file-icon">📄</div>
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
      {viewerOpen
        ? createPortal(
            <div
              className="chat-image-viewer-backdrop"
              onClick={() => setViewerOpen(false)}
            >
              <div
                className="chat-image-viewer-content"
                onClick={(e) => e.stopPropagation()}
              >
                {viewerImages[viewerIndex] ? (
                  <img src={viewerImages[viewerIndex]} alt="attachment-large" />
                ) : null}
                {viewerImages.length > 1 ? (
                  <div className="chat-image-viewer-thumbs">
                    {viewerImages.map((src, index) => (
                      <button
                        key={src + index}
                        type="button"
                        className={[
                          'chat-image-viewer-thumb',
                          index === viewerIndex ? 'chat-image-viewer-thumb--active' : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
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


