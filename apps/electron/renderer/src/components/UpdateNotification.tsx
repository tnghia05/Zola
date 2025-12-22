import { useEffect, useState } from 'react';

interface UpdateInfo {
  version: string;
  releaseDate?: string;
  releaseName?: string;
  releaseNotes?: string;
}

interface UpdateNotificationProps {
  updateInfo: UpdateInfo | null;
  downloadProgress?: number;
  onInstallNow: () => void;
  onInstallLater: () => void;
  onDismiss: () => void;
}

export const UpdateNotification = ({
  updateInfo,
  downloadProgress,
  onInstallNow,
  onInstallLater,
  onDismiss,
}: UpdateNotificationProps) => {
  if (!updateInfo) return null;

  const isDownloading = downloadProgress !== undefined && downloadProgress < 100;
  const isDownloaded = downloadProgress === 100;

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 10000,
        backgroundColor: '#1a1a1a',
        border: '1px solid #333',
        borderRadius: '12px',
        padding: '20px',
        minWidth: '350px',
        maxWidth: '400px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        animation: 'slideInRight 0.3s ease-out',
      }}
    >
      <style>
        {`
          @keyframes slideInRight {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
        `}
      </style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: isDownloaded ? '#10b981' : '#3b82f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
            }}
          >
            {isDownloaded ? '✓' : '⬇'}
          </div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: '600', color: '#fff', marginBottom: '4px' }}>
              {isDownloading
                ? 'Đang tải cập nhật...'
                : isDownloaded
                ? 'Cập nhật sẵn sàng!'
                : 'Có phiên bản mới'}
            </div>
            <div style={{ fontSize: '12px', color: '#999' }}>
              Phiên bản {updateInfo.version}
            </div>
          </div>
        </div>
        <button
          onClick={onDismiss}
          style={{
            background: 'none',
            border: 'none',
            color: '#999',
            cursor: 'pointer',
            fontSize: '20px',
            padding: '0',
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ×
        </button>
      </div>

      {/* Download Progress */}
      {isDownloading && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: '#999' }}>Tiến độ tải xuống</span>
            <span style={{ fontSize: '12px', color: '#999' }}>{Math.round(downloadProgress || 0)}%</span>
          </div>
          <div
            style={{
              width: '100%',
              height: '6px',
              backgroundColor: '#333',
              borderRadius: '3px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${downloadProgress || 0}%`,
                height: '100%',
                backgroundColor: '#3b82f6',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>
      )}

      {/* Message */}
      <div style={{ fontSize: '14px', color: '#ccc', marginBottom: '16px', lineHeight: '1.5' }}>
        {isDownloading
          ? 'Đang tải phiên bản mới. Vui lòng đợi...'
          : isDownloaded
          ? 'Phiên bản mới đã sẵn sàng để cài đặt. Bạn có muốn cài đặt ngay bây giờ không?'
          : 'Một phiên bản mới đã có sẵn. Đang tải xuống...'}
      </div>

      {/* Actions */}
      {isDownloaded && (
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            onClick={onInstallLater}
            style={{
              padding: '8px 16px',
              backgroundColor: 'transparent',
              border: '1px solid #444',
              borderRadius: '6px',
              color: '#ccc',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#2a2a2a';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            Để sau
          </button>
          <button
            onClick={onInstallNow}
            style={{
              padding: '8px 16px',
              backgroundColor: '#3b82f6',
              border: 'none',
              borderRadius: '6px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#2563eb';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#3b82f6';
            }}
          >
            Cài đặt ngay
          </button>
        </div>
      )}
    </div>
  );
};

