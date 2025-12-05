import { useCallback, useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { joinConversationByInvite, setAuthToken } from './api';
import type { Conversation } from './api';
import { connectSocket } from './socket';
import Login from './screens/Login';
import Register from './screens/Register';
import OTPVerification from './screens/OTPVerification';
import Conversations from './screens/Conversations';
import Feed from './screens/Feed';
import Profile from './screens/Profile';
import Friends from './screens/Friends';
import Settings from './screens/Settings';
import Chat from './screens/Chat';
import CallScreen from './screens/CallScreen';
import Search from './screens/Search';
import SavedPosts from './screens/SavedPosts';
import { IncomingCallModal } from './components/IncomingCallModal';
import './styles/index.css';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    console.log('🚀 App component mounted');
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
        {isLoggedIn && <IncomingCallModal />}
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
