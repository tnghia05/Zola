export interface ElectronAPI {
  // App info
  getAppVersion: () => Promise<string>;
  platform: string;

  // Window controls
  minimizeWindow: () => Promise<void>;
  maximizeWindow: () => Promise<boolean>;
  closeWindow: () => Promise<void>;
  isWindowMaximized: () => Promise<boolean>;

  // Window state listeners
  onWindowMaximize: (callback: (isMaximized: boolean) => void) => (() => void) | undefined;

  // Notifications
  showNotification: (options: {
    title?: string;
    body?: string;
    icon?: string;
    onClick?: {
      conversationId?: string;
    };
  }) => Promise<boolean | void>;

  // Media permissions (for testing/debugging)
  requestMediaPermissions: () => Promise<{
    granted: boolean;
    note?: string;
    ready?: boolean;
    error?: string;
  }>;

  selectScreenSource?: () => Promise<string | null>;

  // Deep link invites
  onDeepLinkInvite?: (callback: (payload: { inviteCode: string }) => void) => (() => void) | undefined;
  consumePendingInvites?: () => Promise<Array<{ inviteCode: string }>>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
