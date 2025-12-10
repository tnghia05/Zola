const { app, BrowserWindow, ipcMain, session, Notification, Tray, Menu, protocol, desktopCapturer } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

let mainWindow;
let tray = null;
const DEEP_LINK_PROTOCOL = 'zola';
let pendingDeepLinkPayloads = [];
let unsentDeepLinkPayloads = [];
const isWindows = process.platform === 'win32';
const isMac = process.platform === 'darwin';

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
  process.exit(0);
} else {
  app.on('second-instance', (_event, commandLine) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
      mainWindow.focus();
    }
    if (isWindows) {
      const url = commandLine.find(arg => arg.startsWith(`${DEEP_LINK_PROTOCOL}://`));
      if (url) {
        handleDeepLinkUrl(url);
      }
    }
  });
}

if (isMac) {
  app.on('open-url', (event, url) => {
    event.preventDefault();
    handleDeepLinkUrl(url);
  });
}

// ============================================================================
// 1. REGISTER PROTOCOL SCHEMES (BEFORE app.whenReady)
// ============================================================================
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'app',
    privileges: {
      secure: true,
      standard: true,
      corsEnabled: true,
      supportFetchAPI: true,
      stream: true,
    },
  },
]);

// ============================================================================
// 2. SETUP COMMAND LINE SWITCHES (BEFORE app.whenReady)
// ============================================================================
// Enable media devices API
app.commandLine.appendSwitch('enable-features', 'MediaDevicesGetUserMedia');
// Allow autoplay without user gesture (for testing)
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
// Enable screen capturing
app.commandLine.appendSwitch('enable-usermedia-screen-capturing');
// Force secure context for file:// protocol
app.commandLine.appendSwitch('unsafely-treat-insecure-origin-as-secure', 'file://');

// ============================================================================
// 3. REGISTER CUSTOM PROTOCOL
// ============================================================================
function registerAppProtocol() {
  protocol.registerFileProtocol('app', (request, callback) => {
    const filePath = request.url.replace('app://', '');
    const decodedPath = decodeURIComponent(filePath);
    const fullPath = path.join(app.getAppPath(), decodedPath);
    console.log('[PROTOCOL] Serving:', fullPath);
    callback({ path: fullPath });
  });
}

function registerDeepLinkProtocol() {
  try {
    if (process.defaultApp && isWindows) {
      app.setAsDefaultProtocolClient(DEEP_LINK_PROTOCOL, process.execPath, [path.resolve(process.argv[1])]);
    } else {
      app.setAsDefaultProtocolClient(DEEP_LINK_PROTOCOL);
    }
    console.log(`[DEEP LINK] Registered protocol ${DEEP_LINK_PROTOCOL}://`);
  } catch (error) {
    console.error('[DEEP LINK] Failed to register protocol:', error);
  }
}

function parseInviteFromUrl(rawUrl) {
  if (!rawUrl) return null;
  try {
    const parsed = new URL(rawUrl);
    if (!parsed.protocol || !parsed.protocol.startsWith(`${DEEP_LINK_PROTOCOL}:`)) {
      return null;
    }
    let inviteCode = parsed.searchParams.get('code') || '';
    if (!inviteCode) {
      const pathSegments = parsed.pathname.replace(/^\/+/, '').split('/');
      if (pathSegments[0] === 'invite' && pathSegments[1]) {
        inviteCode = pathSegments[1];
      }
    }
    if (!inviteCode) {
      return null;
    }
    return { inviteCode };
  } catch (error) {
    console.error('[DEEP LINK] Failed to parse URL:', rawUrl, error);
    return null;
  }
}

function dispatchDeepLinkPayload(payload) {
  if (mainWindow && mainWindow.webContents && !mainWindow.webContents.isDestroyed()) {
    try {
      mainWindow.webContents.send('app:invite-link', payload);
      return true;
    } catch (error) {
      console.error('[DEEP LINK] Failed to send payload to renderer:', error);
    }
  }
  return false;
}

function flushPendingDeepLinks() {
  if (!unsentDeepLinkPayloads.length) {
    return;
  }
  const copy = [...unsentDeepLinkPayloads];
  unsentDeepLinkPayloads = [];
  copy.forEach(payload => {
    if (!dispatchDeepLinkPayload(payload)) {
      unsentDeepLinkPayloads.push(payload);
    }
  });
}

function handleDeepLinkUrl(url) {
  const payload = parseInviteFromUrl(url);
  if (!payload) {
    return;
  }
  pendingDeepLinkPayloads.push(payload);
  if (!dispatchDeepLinkPayload(payload)) {
    unsentDeepLinkPayloads.push(payload);
  }
}

// ============================================================================
// 4. SETUP PERMISSIONS (MUST BE CALLED BEFORE createWindow)
// ============================================================================
function setupPermissions() {
  console.log('[PERMISSIONS] Setting up permission handlers...');
  console.log('[PERMISSIONS] Platform:', process.platform);
  console.log('[PERMISSIONS] App path:', app.getPath('exe'));
  console.log('[PERMISSIONS] App name:', app.getName());
  console.log('[PERMISSIONS] App ID:', app.getName());

  // Permission Request Handler - called when renderer requests permission
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback, details) => {
    const origin = webContents.getURL();
    const timestamp = new Date().toISOString();
    
    console.log(`[PERMISSION REQUEST] ${timestamp}`);
    console.log(`[PERMISSION REQUEST] Permission: ${permission}`);
    console.log(`[PERMISSION REQUEST] Origin: ${origin}`);
    console.log(`[PERMISSION REQUEST] Requesting URL: ${details.requestingUrl || 'N/A'}`);
    console.log(`[PERMISSION REQUEST] Details:`, JSON.stringify(details, null, 2));
    console.log(`[PERMISSION REQUEST] WebContents ID: ${webContents.id}`);

    // Handle camera, microphone, and media permissions
    // Note: getUserMedia can request 'media' permission which includes both camera and microphone
    if (permission === 'camera' || permission === 'microphone' || permission === 'media') {
      console.log(`[PERMISSION REQUEST] ✅ Allowing ${permission} - Windows will handle actual permission dialog`);
      console.log(`[PERMISSION REQUEST] Note: Electron allows the request, but Windows will show its own permission dialog`);
      
      // Check mediaTypes in details to see what's being requested
      if (details.mediaTypes) {
        console.log(`[PERMISSION REQUEST] Media types requested: ${JSON.stringify(details.mediaTypes)}`);
      }
      
      console.log(`[PERMISSION REQUEST] Calling callback(true) immediately...`);
      
      // Always allow immediately - Windows will check registry and show dialog if needed
      // The actual permission is checked by Windows OS, not by Electron
      callback(true);
      console.log(`[PERMISSION REQUEST] Callback called with true`);
      return;
    }

    // Handle other permissions
    const allowedPermissions = ['notifications'];
    if (allowedPermissions.includes(permission)) {
      console.log(`[PERMISSION REQUEST] ✅ Allowing: ${permission}`);
      callback(true);
    } else {
      console.log(`[PERMISSION REQUEST] ❌ Denying: ${permission}`);
      callback(false);
    }
  });

  // Permission Check Handler - called when renderer checks permission status
  session.defaultSession.setPermissionCheckHandler((webContents, permission, requestingOrigin, details) => {
    const origin = webContents.getURL();
    const timestamp = new Date().toISOString();
    
    console.log(`[PERMISSION CHECK] ${timestamp}`);
    console.log(`[PERMISSION CHECK] Permission: ${permission}`);
    console.log(`[PERMISSION CHECK] Origin: ${origin}`);
    console.log(`[PERMISSION CHECK] Requesting origin: ${requestingOrigin || 'N/A'}`);
    console.log(`[PERMISSION CHECK] Details:`, JSON.stringify(details || {}, null, 2));

    // For camera, microphone, and media, always return true to allow the check
    // Windows will verify against registry when getUserMedia is actually called
    if (permission === 'camera' || permission === 'microphone' || permission === 'media') {
      console.log(`[PERMISSION CHECK] ✅ Allowing check for: ${permission}`);
      console.log(`[PERMISSION CHECK] Note: Windows will verify actual permission when getUserMedia is called`);
      return true;
    }

    // Handle other permissions
    const allowedPermissions = ['notifications'];
    if (allowedPermissions.includes(permission)) {
      console.log(`[PERMISSION CHECK] ✅ Allowing: ${permission}`);
      return true;
    }
    
    console.log(`[PERMISSION CHECK] ❌ Denying: ${permission}`);
    return false;
  });

  // Additional logging for debugging
  console.log('[PERMISSIONS] Permission handlers registered successfully');
  console.log('[PERMISSIONS] setPermissionRequestHandler: registered');
  console.log('[PERMISSIONS] setPermissionCheckHandler: registered');

  console.log('[PERMISSIONS] Permission handlers setup complete');
}

// ============================================================================
// 5. CREATE WINDOW
// ============================================================================
function createWindow() {
  console.log('[WINDOW] Creating main window...');
  console.log('[WINDOW] isDev:', isDev);
  console.log('[WINDOW] app.isPackaged:', app.isPackaged);
  console.log('[WINDOW] NODE_ENV:', process.env.NODE_ENV);
  
  // Icon path - adjust for monorepo structure
  const iconPath = path.join(__dirname, '../../build/icon.png');
  const hasIcon = fs.existsSync(iconPath);
  
  const windowOptions = {
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: false, // Allow loading local files in production
    },
    show: false,
    backgroundColor: '#1a1a1a',
    title: 'Zola Desktop', // Ensure window has a title
  };
  
  if (hasIcon) {
    windowOptions.icon = iconPath;
  }
  
  mainWindow = new BrowserWindow(windowOptions);

  // Enable DevTools for debugging (both dev and production)
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // Log console messages from renderer
  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    const levelMap = { 0: 'DEBUG', 1: 'INFO', 2: 'WARN', 3: 'ERROR' };
    console.log(`[RENDERER ${levelMap[level] || 'UNKNOWN'}] ${message} (${sourceId}:${line})`);
  });

  // Listen for media access requests (this might be called before permission handler)
  mainWindow.webContents.on('media-started-playing', () => {
    console.log('[MEDIA] Media started playing');
  });

  mainWindow.webContents.on('media-paused', () => {
    console.log('[MEDIA] Media paused');
  });

  // Log page load events
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('[WINDOW] Page finished loading');
    // Log environment info
    mainWindow.webContents.executeJavaScript(`
      console.log('[RENDERER] Environment info:');
      console.log('[RENDERER] Origin:', window.location.origin);
      console.log('[RENDERER] URL:', window.location.href);
      console.log('[RENDERER] Is secure context:', window.isSecureContext);
      console.log('[RENDERER] MediaDevices available:', !!navigator.mediaDevices);
      console.log('[RENDERER] getUserMedia available:', !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    `);
    flushPendingDeepLinks();
  });

  // Log load errors
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('[WINDOW] Failed to load:', {
      errorCode,
      errorDescription,
      validatedURL,
    });
  });

  // Load the app
  if (isDev) {
    console.log('[WINDOW] Loading from dev server: http://localhost:5173');
    mainWindow.loadURL('http://localhost:5173');
  } else {
    // In production, use file:// protocol for better Windows permission handling
    const htmlPath = path.join(app.getAppPath(), 'renderer', 'dist', 'index.html');
    const fileUrl = `file://${htmlPath.replace(/\\/g, '/')}`;
    console.log('[WINDOW] Loading from file:// protocol:', fileUrl);
    console.log('[WINDOW] App path:', app.getAppPath());
    console.log('[WINDOW] HTML path:', htmlPath);
    
    mainWindow.loadFile(htmlPath).catch((error) => {
      console.error('[WINDOW] Error loading file with loadFile:', error);
      // Fallback to loadURL with file://
      mainWindow.loadURL(fileUrl).catch((urlError) => {
        console.error('[WINDOW] Error loading file:// URL:', urlError);
        // Last resort: try app:// protocol
        try {
          const appUrl = `app://renderer/dist/index.html`;
          console.log('[WINDOW] Falling back to app:// protocol:', appUrl);
          mainWindow.loadURL(appUrl);
        } catch (err) {
          console.error('[WINDOW] All loading methods failed:', err);
        }
      });
    });
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    console.log('[WINDOW] Window ready to show');
    mainWindow.show();
    flushPendingDeepLinks();
  });

  // Handle window state changes
  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('window-maximize');
  });

  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('window-unmaximize');
  });

  mainWindow.on('closed', () => {
    console.log('[WINDOW] Window closed');
    mainWindow = null;
  });
}

// ============================================================================
// 6. AUTO-UPDATER SETUP
// ============================================================================
function setupAutoUpdater() {
  if (isDev) {
    console.log('[AUTO-UPDATER] Skipping auto-update in development mode');
    return;
  }

  console.log('[AUTO-UPDATER] Setting up auto-updater...');
  
  // Configure auto-updater
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.checkForUpdatesAndNotify();

  // Check for updates every 4 hours
  setInterval(() => {
    console.log('[AUTO-UPDATER] Checking for updates...');
    autoUpdater.checkForUpdatesAndNotify();
  }, 4 * 60 * 60 * 1000); // 4 hours

  // Event handlers
  autoUpdater.on('checking-for-update', () => {
    console.log('[AUTO-UPDATER] Checking for update...');
    if (mainWindow) {
      mainWindow.webContents.send('update-checking');
    }
  });

  autoUpdater.on('update-available', (info) => {
    console.log('[AUTO-UPDATER] Update available:', info.version);
    if (mainWindow) {
      mainWindow.webContents.send('update-available', info);
    }
    
    // Show notification
    if (Notification.isSupported()) {
      new Notification({
        title: 'Cập nhật mới có sẵn',
        body: `Phiên bản ${info.version} đang được tải xuống...`,
        silent: false,
      }).show();
    }
  });

  autoUpdater.on('update-not-available', (info) => {
    console.log('[AUTO-UPDATER] Update not available. Current version is latest.');
    if (mainWindow) {
      mainWindow.webContents.send('update-not-available', info);
    }
  });

  autoUpdater.on('error', (err) => {
    console.error('[AUTO-UPDATER] Error:', err);
    if (mainWindow) {
      mainWindow.webContents.send('update-error', err.message);
    }
  });

  autoUpdater.on('download-progress', (progressObj) => {
    const percent = Math.round(progressObj.percent);
    console.log(`[AUTO-UPDATER] Download progress: ${percent}%`);
    if (mainWindow) {
      mainWindow.webContents.send('update-download-progress', progressObj);
    }
  });

  autoUpdater.on('update-downloaded', (info) => {
    console.log('[AUTO-UPDATER] Update downloaded:', info.version);
    if (mainWindow) {
      mainWindow.webContents.send('update-downloaded', info);
    }
    
    // Show notification
    if (Notification.isSupported()) {
      const notification = new Notification({
        title: 'Cập nhật đã tải xong',
        body: 'App sẽ tự động cập nhật khi bạn đóng ứng dụng.',
        silent: false,
      });
      
      notification.on('click', () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      });
      
      notification.show();
    }
  });
}

// ============================================================================
// 7. APP INITIALIZATION
// ============================================================================
app.whenReady().then(() => {
  console.log('[APP] App is ready');
  
  // 1. Register custom protocol first
  registerAppProtocol();
  registerDeepLinkProtocol();
  
  // 2. Setup permissions BEFORE creating window
  setupPermissions();
  
  // 3. Create window after permissions are setup
  createWindow();
  
  // 4. Create system tray
  createTray();
  
  // 5. Setup auto-updater (only in production)
  setupAutoUpdater();

  if (isWindows) {
    const urlArg = process.argv.find(arg => arg.startsWith(`${DEEP_LINK_PROTOCOL}://`));
    if (urlArg) {
      handleDeepLinkUrl(urlArg);
    }
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// ============================================================================
// 8. IPC HANDLERS
// ============================================================================

// Manual update check
ipcMain.handle('check-for-updates', () => {
  if (isDev) {
    return { error: 'Auto-update is disabled in development mode' };
  }
  autoUpdater.checkForUpdatesAndNotify();
  return { success: true };
});

// Restart and install update
ipcMain.handle('restart-and-install-update', () => {
  if (isDev) {
    return { error: 'Auto-update is disabled in development mode' };
  }
  autoUpdater.quitAndInstall(false, true);
  return { success: true };
});

// Get app version
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

// Request media permissions - for testing/debugging
ipcMain.handle('request-media-permissions', async () => {
  console.log('[IPC] Requesting media permissions');
  console.log('[IPC] Note: Permission handlers are active. Windows will show dialog when getUserMedia is called.');
  return {
    granted: false, // Don't assume granted - let Windows decide
    note: 'Permission request will be handled by Windows when getUserMedia is called',
    ready: true,
  };
});

ipcMain.handle('consume-pending-invites', () => {
  const payloads = [...pendingDeepLinkPayloads];
  pendingDeepLinkPayloads = [];
  return payloads;
});

// Window controls
ipcMain.handle('minimize-window', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.handle('maximize-window', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
    return mainWindow.isMaximized();
  }
  return false;
});

ipcMain.handle('is-window-maximized', () => {
  return mainWindow ? mainWindow.isMaximized() : false;
});

ipcMain.handle('close-window', () => {
  if (mainWindow) mainWindow.close();
});

// Notifications
ipcMain.handle('show-notification', (event, options) => {
  if (!Notification.isSupported()) {
    console.warn('[NOTIFICATION] Notifications not supported');
    return;
  }

  const { title, body, icon, onClick } = options;
  
  const defaultIconPath = path.join(__dirname, '../../build/icon.png');
  const notificationIcon = icon || (fs.existsSync(defaultIconPath) ? defaultIconPath : undefined);
  
  const notification = new Notification({
    title: title || 'Tin nhắn mới',
    body: body || '',
    icon: notificationIcon,
    silent: false,
  });

  if (onClick) {
    notification.on('click', () => {
      if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
        if (onClick.conversationId) {
          mainWindow.webContents.send('navigate-to-conversation', onClick.conversationId);
        }
      }
    });
  }

  notification.show();
  return true;
});

ipcMain.handle('screen-share:get-source', async () => {
  try {
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      fetchWindowIcons: false,
      thumbnailSize: { width: 0, height: 0 },
    });
    if (!sources || !sources.length) {
      console.warn('[SCREEN SHARE] No screen sources available');
      return null;
    }
    const primaryScreen =
      sources.find((source) => source.id.toLowerCase().includes('screen')) || sources[0];
    console.log('[SCREEN SHARE] Selected source:', primaryScreen.id, primaryScreen.name);
    return primaryScreen.id;
  } catch (error) {
    console.error('[SCREEN SHARE] Failed to obtain sources:', error);
    return null;
  }
});

// ============================================================================
// 9. SYSTEM TRAY
// ============================================================================
function createTray() {
  if (process.platform === 'darwin') {
    // macOS uses different approach
    return;
  }

  const iconPath = path.join(__dirname, '../../build/icon.png');
  if (!fs.existsSync(iconPath)) {
    console.log('[TRAY] Icon not found, skipping tray creation');
    return;
  }
  
  tray = new Tray(iconPath);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Hiển thị',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      },
    },
    {
      label: 'Ẩn',
      click: () => {
        if (mainWindow) {
          mainWindow.hide();
        }
      },
    },
    { type: 'separator' },
    {
      label: 'Thoát',
      click: () => {
        app.quit();
      },
    },
  ]);

  tray.setToolTip('Zola Desktop');
  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });
}

