const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // App info
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  platform: process.platform,

  // Window controls
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  maximizeWindow: () => ipcRenderer.invoke('maximize-window'),
  closeWindow: () => ipcRenderer.invoke('close-window'),
  isWindowMaximized: () => ipcRenderer.invoke('is-window-maximized'),

  // Window state listeners
  onWindowMaximize: (callback) => {
    if (typeof callback !== 'function') {
      console.error('onWindowMaximize: callback must be a function');
      return;
    }
    const handleMaximize = () => callback(true);
    const handleUnmaximize = () => callback(false);
    ipcRenderer.on('window-maximize', handleMaximize);
    ipcRenderer.on('window-unmaximize', handleUnmaximize);
    // Return cleanup function
    return () => {
      ipcRenderer.removeListener('window-maximize', handleMaximize);
      ipcRenderer.removeListener('window-unmaximize', handleUnmaximize);
    };
  },

  // Notifications
  showNotification: (options) => ipcRenderer.invoke('show-notification', options),

  // Media permissions (for testing/debugging)
  requestMediaPermissions: () => ipcRenderer.invoke('request-media-permissions'),
  selectScreenSource: () => ipcRenderer.invoke('screen-share:get-source'),

  // Deep link invites
  onDeepLinkInvite: (callback) => {
    if (typeof callback !== 'function') {
      console.error('onDeepLinkInvite: callback must be a function');
      return;
    }
    const handler = (_event, payload) => callback(payload);
    ipcRenderer.on('app:invite-link', handler);
    return () => {
      ipcRenderer.removeListener('app:invite-link', handler);
    };
  },
  consumePendingInvites: () => ipcRenderer.invoke('consume-pending-invites'),

  // Auto-updater
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  restartAndInstallUpdate: () => ipcRenderer.invoke('restart-and-install-update'),
  onUpdateChecking: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('update-checking', handler);
    return () => ipcRenderer.removeListener('update-checking', handler);
  },
  onUpdateAvailable: (callback) => {
    const handler = (_event, info) => callback(info);
    ipcRenderer.on('update-available', handler);
    return () => ipcRenderer.removeListener('update-available', handler);
  },
  onUpdateNotAvailable: (callback) => {
    const handler = (_event, info) => callback(info);
    ipcRenderer.on('update-not-available', handler);
    return () => ipcRenderer.removeListener('update-not-available', handler);
  },
  onUpdateError: (callback) => {
    const handler = (_event, error) => callback(error);
    ipcRenderer.on('update-error', handler);
    return () => ipcRenderer.removeListener('update-error', handler);
  },
  onUpdateDownloadProgress: (callback) => {
    const handler = (_event, progress) => callback(progress);
    ipcRenderer.on('update-download-progress', handler);
    return () => ipcRenderer.removeListener('update-download-progress', handler);
  },
  onUpdateDownloaded: (callback) => {
    const handler = (_event, info) => callback(info);
    ipcRenderer.on('update-downloaded', handler);
    return () => ipcRenderer.removeListener('update-downloaded', handler);
  },
});

