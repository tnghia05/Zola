import { useCallback, useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { joinConversationByInvite, setAuthToken } from './api';
import type { Conversation } from './api';
import { connectSocket } from './socket';
// Use shared components from @zola/app (only those compatible with HashRouter)
import Login from '@zola/app/features/auth/Login.web';
import Register from '@zola/app/features/auth/Register.web';
import OTPVerification from '@zola/app/features/auth/OTPVerification.web';
import Feed from './screens/Feed';
import Conversations from './screens/Conversations';
import Chat from './screens/Chat';
import Friends from '@zola/app/features/friends/Friends.web';
import Search from '@zola/app/features/search/Search.web';
import Settings from '@zola/app/features/settings/Settings.web';
import HashtagScreen from '@zola/app/features/hashtag/Hashtag.web';

// Use local CallScreen (compatible with HashRouter)
import CallScreen from './screens/CallScreen';

// Local screens
import Profile from './screens/Profile';
import SavedPosts from './screens/SavedPosts';
import Reels from './screens/Reels';
import PostDetail from './screens/PostDetail';
import { IncomingCallModal as GlobalIncomingCall } from './components/IncomingCallModal';
import { UpdateNotification } from './components/UpdateNotification';
import '@zola/app/styles/floating-chat.css';
import './styles/index.css';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<{ version: string; releaseDate?: string } | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number | undefined>(undefined);
  const [showUpdateNotification, setShowUpdateNotification] = useState(false);
  const [showUpdateSuccessNotification, setShowUpdateSuccessNotification] = useState(false);

  useEffect(() => {
    console.log('🚀 App component mounted');
    
    // Check if app was just updated
    const checkUpdateSuccess = async () => {
      if (window.electronAPI?.getAppVersion) {
        try {
          const currentVersion = await window.electronAPI.getAppVersion();
          const lastKnownVersion = localStorage.getItem('last_known_version');
          
          if (lastKnownVersion && lastKnownVersion !== currentVersion) {
            // App was updated!
            setShowUpdateSuccessNotification(true);
            // Auto-hide after 5 seconds
            setTimeout(() => {
              setShowUpdateSuccessNotification(false);
            }, 5000);
          }
          
          localStorage.setItem('last_known_version', currentVersion);
        } catch (error) {
          console.error('Error checking app version:', error);
        }
      }
    };
    
    const restoreToken = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const userId = localStorage.getItem('user_id');
        console.log('🔍 App.tsx - Restored token from storage:', token ? 'Present' : 'Missing');
        console.log('🔍 App.tsx - Restored user ID from storage:', userId ? 'Present' : 'Missing');
        if (token) {
          setAuthToken(token);
          setIsLoggedIn(true);
          if (userId) {
            (window as any).__currentUserId = userId;
          }
        } else {
          setIsLoggedIn(false);
        }
      } catch (error) {
        console.error('Error restoring token:', error);
        setIsLoggedIn(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    restoreToken();
    checkUpdateSuccess();

    // Listen for storage changes (login/logout from other tabs or same tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth_token') {
        setIsLoggedIn(!!e.newValue);
      }
    };

    // Listen for custom login event
    const handleLogin = () => {
      const token = localStorage.getItem('auth_token');
      setIsLoggedIn(!!token);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('auth:login', handleLogin);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth:login', handleLogin);
    };
  }, []);

  // Connect socket when logged in
  useEffect(() => {
    if (isLoggedIn) {
      const token = localStorage.getItem('auth_token');
      if (token) {
        console.log('[App] Connecting socket...');
        const result = connectSocket(token);
        if (result instanceof Promise) {
          result.catch((err: unknown) => {
            console.error('[App] Error connecting socket:', err);
          });
        }
      }
    }
  }, [isLoggedIn]);

  // Listen for update events
  useEffect(() => {
    if (!window.electronAPI) {
      return;
    }

    const unsubscribeChecking = window.electronAPI.onUpdateChecking?.(() => {
      console.log('[App] Checking for updates...');
    });

    const unsubscribeAvailable = window.electronAPI.onUpdateAvailable?.((info: any) => {
      console.log('[App] Update available:', info);
      setUpdateInfo({
        version: info.version || 'N/A',
        releaseDate: info.releaseDate,
        releaseName: info.releaseName,
      });
      setShowUpdateNotification(true);
      setDownloadProgress(0);
    });

    const unsubscribeProgress = window.electronAPI.onUpdateDownloadProgress?.((progress: any) => {
      console.log('[App] Download progress:', progress.percent);
      setDownloadProgress(progress.percent || 0);
    });

    const unsubscribeDownloaded = window.electronAPI.onUpdateDownloaded?.((info: any) => {
      console.log('[App] Update downloaded:', info);
      setUpdateInfo({
        version: info.version || 'N/A',
        releaseDate: info.releaseDate,
        releaseName: info.releaseName,
      });
      setDownloadProgress(100);
      setShowUpdateNotification(true);
    });

    const unsubscribeError = window.electronAPI.onUpdateError?.((error: string) => {
      console.error('[App] Update error:', error);
      setShowUpdateNotification(false);
    });

    return () => {
      unsubscribeChecking?.();
      unsubscribeAvailable?.();
      unsubscribeProgress?.();
      unsubscribeDownloaded?.();
      unsubscribeError?.();
    };
  }, []);

  console.log('🔄 App render - isLoading:', isLoading, 'isLoggedIn:', isLoggedIn);

  if (isLoading) {
    return (
      <div style={{ 
        width: '100%', 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#1a1a1a',
        color: '#fff',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div style={{ fontSize: '24px' }}>Loading Day2 Desktop...</div>
        <div style={{ fontSize: '14px', color: '#999' }}>Please wait</div>
      </div>
    );
  }

  console.log('📍 Current route should be:', isLoggedIn ? '/' : '/login');
  console.log('📍 isLoggedIn:', isLoggedIn);
  console.log('📦 Login component type:', typeof Login);

  // Wrap Login in a component that logs when it renders
  const LoginWithLogging = () => {
    const location = useLocation();
    console.log('🔐 LoginWithLogging wrapper rendering...');
    console.log('📍 Current location:', location.pathname);
    return <Login />;
  };

  return (
    <ThemeProvider>
      <HashRouter>
        <DeepLinkListener isLoggedIn={isLoggedIn} />
        <Routes>
          {isLoggedIn ? (
            <>
              <Route path="/" element={<Feed />} />
              <Route path="/feed" element={<Feed />} />
              <Route path="/reels" element={<Reels />} />
              <Route path="/hashtag/:tag" element={<HashtagScreen />} />
              <Route path="/post/:postId" element={<PostDetail />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/profile/:userId" element={<Profile />} />
              <Route path="/friends" element={<Friends />} />
              <Route path="/search" element={<Search />} />
              <Route path="/saved" element={<SavedPosts />} />
              <Route path="/conversations" element={<Conversations />} />
              <Route path="/chat/:conversationId" element={<Chat />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/call/:callId" element={<CallScreen />} />
              <Route path="/login" element={<LoginWithLogging />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          ) : (
            <>
              <Route path="/login" element={<LoginWithLogging />} />
              <Route path="/register" element={<Register />} />
              <Route path="/otp-verification" element={<OTPVerification />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </>
          )}
        </Routes>
        {isLoggedIn && <GlobalIncomingCall />}
        {showUpdateNotification && updateInfo && (
          <UpdateNotification
            updateInfo={updateInfo}
            downloadProgress={downloadProgress}
            onInstallNow={() => {
              if (window.electronAPI?.restartAndInstallUpdate) {
                window.electronAPI.restartAndInstallUpdate();
              }
            }}
            onInstallLater={() => {
              setShowUpdateNotification(false);
            }}
            onDismiss={() => {
              setShowUpdateNotification(false);
            }}
          />
        )}
        {showUpdateSuccessNotification && (
          <div
            style={{
              position: 'fixed',
              top: '20px',
              right: '20px',
              zIndex: 10001,
              backgroundColor: '#10b981',
              border: '1px solid #059669',
              borderRadius: '12px',
              padding: '16px 20px',
              minWidth: '300px',
              maxWidth: '400px',
              boxShadow: '0 8px 32px rgba(16, 185, 129, 0.3)',
              animation: 'slideInRight 0.3s ease-out',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                color: '#10b981',
                flexShrink: 0,
              }}
            >
              ✓
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '16px', fontWeight: '600', color: '#fff', marginBottom: '4px' }}>
                Cập nhật thành công!
              </div>
              <div style={{ fontSize: '14px', color: '#d1fae5' }}>
                Ứng dụng đã được cập nhật lên phiên bản mới nhất.
              </div>
            </div>
            <button
              onClick={() => setShowUpdateSuccessNotification(false)}
              style={{
                background: 'none',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '20px',
                padding: '0',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0.8,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '1';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '0.8';
              }}
            >
              ×
            </button>
          </div>
        )}
      </HashRouter>
    </ThemeProvider>
  );
}

function DeepLinkListener({ isLoggedIn }: { isLoggedIn: boolean }) {
  const navigate = useNavigate();

  const handleInviteCode = useCallback(
    async (inviteCode?: string | null) => {
      if (!inviteCode) {
        return;
      }
      const token = localStorage.getItem('auth_token');
      if (!token) {
        localStorage.setItem('pending_invite_code', inviteCode);
        return;
      }
      try {
        console.log('[DeepLink] Joining via invite code:', inviteCode);
        const response = await joinConversationByInvite(inviteCode);
        const conversation = response?.conversation as Conversation | undefined;
        if (conversation?._id) {
          window.dispatchEvent(
            new CustomEvent('conversation:joined', {
              detail: { conversation },
            })
          );
          navigate('/', { replace: true });
        } else {
          console.warn('[DeepLink] No conversation returned for invite code', inviteCode);
        }
      } catch (error) {
        console.error('[DeepLink] Failed to join conversation via invite', error);
      }
    },
    [navigate]
  );

  useEffect(() => {
    if (!window.electronAPI) {
      return;
    }

    window.electronAPI.consumePendingInvites?.()
      .then((payloads) => {
        payloads?.forEach((payload) => handleInviteCode(payload?.inviteCode));
      })
      .catch((error) => console.error('[DeepLink] Failed to consume pending invites', error));

    const unsubscribe = window.electronAPI.onDeepLinkInvite?.((payload) => {
      handleInviteCode(payload?.inviteCode);
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [handleInviteCode]);

  useEffect(() => {
    if (!isLoggedIn) {
      return;
    }
    const stored = localStorage.getItem('pending_invite_code');
    if (stored) {
      localStorage.removeItem('pending_invite_code');
      handleInviteCode(stored);
    }
  }, [isLoggedIn, handleInviteCode]);

  return null;
}
