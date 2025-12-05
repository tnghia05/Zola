import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSocket } from '../socket';
import { acceptCall, rejectCall, getOpponentInfo } from '../api';
import { showNotification } from '../services/notificationService';

interface IncomingCallData {
  callId: string;
  conversationId: string;
  initiatorId: string;
  type: 'video' | 'audio';
  roomId?: string;
}

export function IncomingCallModal() {
  const [incomingCall, setIncomingCall] = useState<IncomingCallData | null>(null);
  const [callerName, setCallerName] = useState<string>('Ai đó');
  const [callerAvatar, setCallerAvatar] = useState<string | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const socket = getSocket();
    if (!socket) {
      console.warn('[IncomingCallModal] Socket not available, retrying...');
      // Retry after a short delay if socket is not ready
      const timer = setTimeout(() => {
        const retrySocket = getSocket();
        if (retrySocket) {
          console.log('[IncomingCallModal] Socket now available');
        }
      }, 1000);
      return () => clearTimeout(timer);
    }

    const handleIncomingCall = (data: IncomingCallData) => {
      console.log('[IncomingCallModal] Received call:incoming:', data);
      console.log('[IncomingCallModal] Current incomingCall state:', incomingCall);
      
      // Get current user ID
      const currentUserId = localStorage.getItem('user_id');
      
      // Only show modal if this is NOT a call we initiated ourselves
      // If initiatorId matches current user, this is our own call - don't show modal
      if (data.initiatorId === currentUserId) {
        console.log('[IncomingCallModal] Ignoring call:incoming - we are the initiator');
        return;
      }
      
      // Only set if we don't already have a call and not currently accepting/rejecting
      if (!incomingCall && !isAccepting && !isRejecting) {
        setIncomingCall(data);
        setIsAccepting(false);
        setIsRejecting(false);
        
        // Show system notification
        showNotification({
          title: 'Cuộc gọi đến',
          body: `Ai đó đang gọi ${data.type === 'video' ? 'video' : 'audio'}...`,
          conversationId: data.conversationId,
        }).catch(err => {
          console.error('[IncomingCallModal] Error showing notification:', err);
        });

        // Play sound (optional - can add later)
        // new Audio('/path/to/ringtone.mp3').play().catch(() => {});
      } else {
        console.log('[IncomingCallModal] Already have an incoming call or processing, ignoring new one');
      }
    };

    console.log('[IncomingCallModal] Setting up call:incoming listener');
    socket.on('call:incoming', handleIncomingCall);

    // Also listen for connection to ensure we're ready
    socket.on('connect', () => {
      console.log('[IncomingCallModal] Socket connected, ready to receive calls');
    });

    // Cleanup
      return () => {
        console.log('[IncomingCallModal] Cleaning up call:incoming listener');
        socket.off('call:incoming', handleIncomingCall);
        socket.off('connect');
      };
    }, [callerName, incomingCall, isAccepting, isRejecting]);

  // Fetch caller name and avatar when call comes in
  useEffect(() => {
    if (incomingCall) {
      const fetchCallerInfo = async () => {
        try {
          console.log('[IncomingCallModal] Fetching caller info for conversation:', incomingCall.conversationId);
          const opponentInfo = await getOpponentInfo(incomingCall.conversationId);
          console.log('[IncomingCallModal] Opponent info received:', opponentInfo);
          
          if (opponentInfo?.user) {
            if (opponentInfo.user.name) {
              setCallerName(opponentInfo.user.name);
            }
            if (opponentInfo.user.avatar) {
              setCallerAvatar(opponentInfo.user.avatar);
            } else {
              setCallerAvatar(null);
            }
          }
        } catch (error) {
          console.error('[IncomingCallModal] Error fetching caller info:', error);
          setCallerName('Ai đó');
          setCallerAvatar(null);
        }
      };
      fetchCallerInfo();
    } else {
      // Reset when no incoming call
      setCallerName('Ai đó');
      setCallerAvatar(null);
    }
  }, [incomingCall]);

  const handleAccept = async () => {
    if (!incomingCall || isAccepting || isRejecting) {
      console.log('[IncomingCallModal] Cannot accept: no call or already processing');
      return;
    }
    
    setIsAccepting(true);
    const callId = incomingCall.callId;
    const callData = { ...incomingCall };
    
    try {
      console.log('[IncomingCallModal] Accepting call:', callId);
      
      // First, accept the call via API
      await acceptCall(callId);
      console.log('[IncomingCallModal] Call accepted via API');
      
      // Navigate to call screen with call info FIRST
      // Don't close modal state until after navigation to prevent re-renders
      navigate(`/call/${callId}`, {
        state: {
          conversationId: callData.conversationId,
          initiatorId: callData.initiatorId,
          remoteUserId: callData.initiatorId,
          type: callData.type,
          isInitiator: false,
          acceptedFromModal: true, // Mark that user accepted from modal
        },
        replace: false, // Allow back navigation
      });
      
      console.log('[IncomingCallModal] Navigated to call screen');
      
      // Close the modal AFTER navigation to prevent re-renders during navigation
      // Use setTimeout to ensure navigation completes first
      setTimeout(() => {
        setIncomingCall(null);
        setIsAccepting(false);
      }, 100);
    } catch (error) {
      console.error('[IncomingCallModal] Error accepting call:', error);
      setIsAccepting(false);
      // Still navigate even if API call fails (might be network issue)
      setIncomingCall(null);
      navigate(`/call/${callId}`, {
        state: {
          conversationId: callData.conversationId,
          initiatorId: callData.initiatorId,
          remoteUserId: callData.initiatorId,
          type: callData.type,
          isInitiator: false,
          acceptedFromModal: true, // Mark that user accepted from modal
        },
      });
    }
  };

  const handleReject = async () => {
    if (!incomingCall || isAccepting || isRejecting) {
      console.log('[IncomingCallModal] Cannot reject: no call or already processing');
      return;
    }
    
    setIsRejecting(true);
    const callId = incomingCall.callId;
    
    try {
      console.log('[IncomingCallModal] Rejecting call:', callId);
      await rejectCall(callId);
      setIncomingCall(null);
      setIsRejecting(false);
    } catch (error) {
      console.error('[IncomingCallModal] Error rejecting call:', error);
      setIncomingCall(null);
      setIsRejecting(false);
    }
  };

  // Auto-dismiss after 30 seconds
  useEffect(() => {
    if (incomingCall) {
      const timer = setTimeout(() => {
        console.log('[IncomingCallModal] Auto-dismissing call after timeout');
        handleReject();
      }, 30000); // 30 seconds

      return () => clearTimeout(timer);
    }
  }, [incomingCall]);

  if (!incomingCall) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999, // Very high z-index to appear above everything
        backdropFilter: 'blur(5px)',
        pointerEvents: 'auto', // Ensure it can receive clicks
      }}
      onClick={(e) => {
        // Don't close on backdrop click - require explicit action
        e.stopPropagation();
      }}
    >
      <div
        style={{
          backgroundColor: '#1a1a1a',
          borderRadius: '16px',
          padding: '32px',
          minWidth: '320px',
          maxWidth: '400px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          {callerAvatar ? (
            <img
              src={callerAvatar}
              alt={callerName}
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                margin: '0 auto 16px',
                objectFit: 'cover',
                border: '2px solid rgba(255, 255, 255, 0.1)',
              }}
              onError={(e) => {
                // Fallback to placeholder if image fails to load
                const target = e.currentTarget;
                target.style.display = 'none';
                const placeholder = target.nextElementSibling as HTMLElement;
                if (placeholder) {
                  placeholder.style.display = 'flex';
                }
              }}
            />
          ) : null}
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: '#667eea',
              margin: '0 auto 16px',
              display: callerAvatar ? 'none' : 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              fontWeight: 'bold',
              color: '#fff',
            }}
          >
            {callerName.charAt(0).toUpperCase()}
          </div>
          <h2 style={{ color: '#fff', margin: '0 0 8px 0', fontSize: '20px', fontWeight: '600' }}>
            {callerName}
          </h2>
          <p style={{ color: 'rgba(255, 255, 255, 0.7)', margin: 0, fontSize: '14px' }}>
            Cuộc gọi {incomingCall.type === 'video' ? 'video' : 'audio'} đến
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
          }}
        >
          <button
            onClick={handleReject}
            disabled={isAccepting || isRejecting}
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: isAccepting || isRejecting ? '#666' : '#ef4444',
              border: 'none',
              color: '#fff',
              cursor: isAccepting || isRejecting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              transition: 'transform 0.2s',
              opacity: isAccepting || isRejecting ? 0.6 : 1,
            }}
            onMouseEnter={(e) => {
              if (!isAccepting && !isRejecting) {
                e.currentTarget.style.transform = 'scale(1.1)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
            title={isRejecting ? 'Đang từ chối...' : 'Từ chối'}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          <button
            onClick={handleAccept}
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: '#10b981',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
            title="Chấp nhận"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

