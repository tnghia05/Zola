import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSocket } from '../socket';
import { acceptCall, rejectCall, getOpponentInfo, getConversations, getCall } from '../api';
import { showNotification } from '../services/notificationService';
import '../styles/incoming-call.css';

interface IncomingCallData {
  callId: string;
  conversationId: string;
  initiatorId: string;
  type: 'video' | 'audio';
  roomId?: string;
  callType?: 'p2p' | 'sfu';
  livekitRoomName?: string;
}

export function IncomingCallModal() {
  const [incomingCall, setIncomingCall] = useState<IncomingCallData | null>(null);
  const [callerName, setCallerName] = useState<string>('Ai đó');
  const [callerAvatar, setCallerAvatar] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGroupCall, setIsGroupCall] = useState(false);
  const [groupName, setGroupName] = useState<string | null>(null);
  const navigate = useNavigate();

  // Listen for socket events globally
  useEffect(() => {
    const socket = getSocket();
    if (!socket) {
      console.warn('[IncomingCallModal] Socket not available, retrying...');
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
      
      // Get current user ID
      const currentUserId = localStorage.getItem('user_id');
      
      // Only show modal if this is NOT a call we initiated ourselves
      if (data.initiatorId === currentUserId) {
        console.log('[IncomingCallModal] Ignoring call:incoming - we are the initiator');
        return;
      }
      
      // Only set if we don't already have a call and not currently processing
      if (!incomingCall && !isProcessing) {
        setIncomingCall(data);
        
        // Show system notification
        showNotification({
          title: 'Cuộc gọi đến',
          body: `Ai đó đang gọi ${data.type === 'video' ? 'video' : 'audio'}...`,
          conversationId: data.conversationId,
        }).catch(err => {
          console.error('[IncomingCallModal] Error showing notification:', err);
        });
      } else {
        console.log('[IncomingCallModal] Already have an incoming call or processing, ignoring new one');
      }
    };

    console.log('[IncomingCallModal] Setting up call:incoming listener');
    socket.on('call:incoming', handleIncomingCall);

    socket.on('connect', () => {
      console.log('[IncomingCallModal] Socket connected, ready to receive calls');
    });

    return () => {
      console.log('[IncomingCallModal] Cleaning up call:incoming listener');
      socket.off('call:incoming', handleIncomingCall);
      socket.off('connect');
    };
  }, [incomingCall, isProcessing]);

  // Load caller/group info and call details
  useEffect(() => {
    if (!incomingCall) return;

    let cancelled = false;

    const loadInfo = async () => {
      try {
        // Fetch call info to get callType and livekitRoomName if not provided
        if (!incomingCall.callType || !incomingCall.livekitRoomName) {
          try {
            const callInfo = await getCall(incomingCall.callId);
            if (!cancelled && callInfo) {
              setIncomingCall(prev => prev ? {
                ...prev,
                callType: callInfo.callType || prev.callType,
                livekitRoomName: callInfo.metadata?.livekitRoomName || prev.livekitRoomName,
              } : prev);
              console.log('[IncomingCallModal] Call info loaded:', {
                callType: callInfo.callType,
                livekitRoomName: callInfo.metadata?.livekitRoomName
              });
            }
          } catch (err) {
            console.warn('[IncomingCallModal] Could not fetch call info:', err);
          }
        }
        
        // Check if this is a group call by getting conversation info
        const conversations = await getConversations();
        const conversation = conversations.find((c: any) => c._id === incomingCall.conversationId);
        
        if (cancelled) return;
        
        if (conversation?.isGroup) {
          // Group call
          setIsGroupCall(true);
          setGroupName(conversation.title || `Nhóm (${conversation.members?.length || 0} thành viên)`);
          setCallerAvatar(conversation.avatar || null);
          
          // Also try to get the initiator's name
          try {
            const info = await getOpponentInfo(incomingCall.conversationId);
            if (!cancelled && info?.user?.name) {
              setCallerName(info.user.name);
            }
          } catch {
            // Ignore error, use group name
          }
        } else {
          // 1-1 call
          setIsGroupCall(false);
          setGroupName(null);
          const info = await getOpponentInfo(incomingCall.conversationId);
          if (cancelled) return;
          setCallerName(info?.user?.name || info?.user?.email || 'Ai đó');
          setCallerAvatar(info?.user?.avatar || null);
        }
      } catch (err) {
        console.error('[IncomingCallModal] Failed to load caller info', err);
        if (!cancelled) {
          setCallerName('Ai đó');
          setCallerAvatar(null);
          setIsGroupCall(false);
        }
      }
    };

    loadInfo();

    return () => {
      cancelled = true;
    };
  }, [incomingCall?.callId, incomingCall?.conversationId]);

  const clearState = () => {
    setIncomingCall(null);
    setIsProcessing(false);
    setIsGroupCall(false);
    setGroupName(null);
    setCallerName('Ai đó');
    setCallerAvatar(null);
  };

  const handleAccept = async () => {
    if (!incomingCall || isProcessing) {
      console.log('[IncomingCallModal] Cannot accept: no call or already processing');
      return;
    }
    
    setIsProcessing(true);
    const callData = { ...incomingCall };
    
    try {
      console.log('[IncomingCallModal] Accepting call:', callData.callId);
      await acceptCall(callData.callId);
      console.log('[IncomingCallModal] Call accepted via API');
    } catch (error) {
      console.error('[IncomingCallModal] Error accepting call (will still navigate):', error);
    }

    // Navigate to call screen with call info using React Router
    console.log('[IncomingCallModal] Navigating to call screen:', callData.callId);
    navigate(`/call/${callData.callId}`, {
      state: {
        conversationId: callData.conversationId,
        initiatorId: callData.initiatorId,
        remoteUserId: callData.initiatorId,
        type: callData.type,
        callType: callData.callType || (isGroupCall ? 'sfu' : 'p2p'),
        livekitRoomName: callData.livekitRoomName,
        isInitiator: false,
        acceptedFromModal: true,
      },
      replace: false,
    });
    
    console.log('[IncomingCallModal] Navigated to call screen');
    
    // Clear state after navigation
    setTimeout(() => {
      clearState();
    }, 100);
  };

  const handleReject = async () => {
    if (!incomingCall || isProcessing) {
      console.log('[IncomingCallModal] Cannot reject: no call or already processing');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      console.log('[IncomingCallModal] Rejecting call:', incomingCall.callId);
      await rejectCall(incomingCall.callId);
    } catch (error) {
      console.error('[IncomingCallModal] Error rejecting call:', error);
    }
    
    clearState();
  };

  // Auto-dismiss after 30 seconds
  useEffect(() => {
    if (!incomingCall) return;
    
    const timer = setTimeout(() => {
      console.log('[IncomingCallModal] Auto-dismissing call after timeout');
      handleReject();
    }, 30000);

    return () => clearTimeout(timer);
  }, [incomingCall]);

  if (!incomingCall) return null;

  const displayName = isGroupCall ? (groupName || 'Nhóm') : callerName;
  const displaySubtitle = isGroupCall 
    ? `${callerName} đang gọi ${incomingCall.type === 'video' ? 'video' : 'thoại'} nhóm`
    : (incomingCall.type === 'video' ? 'Gọi video' : 'Gọi thoại');

  return (
    <div
      className="incoming-call-overlay"
      onClick={(e) => e.stopPropagation()}
    >
      <div 
        className={`incoming-call-card ${isGroupCall ? 'incoming-call-card--group' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="incoming-call-header">
          {isGroupCall ? 'Cuộc gọi nhóm' : 'Cuộc gọi đến'}
        </div>
        
        <div className="incoming-call-body">
          <div className={`incoming-call-avatar ${isGroupCall ? 'incoming-call-avatar--group' : ''}`}>
            {callerAvatar ? (
              <img 
                src={callerAvatar} 
                alt={displayName}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div className="incoming-call-avatar-fallback">
                {isGroupCall ? '👥' : displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          
          <div className="incoming-call-info">
            <div className="incoming-call-name">{displayName}</div>
            <div className="incoming-call-type">{displaySubtitle}</div>
          </div>
        </div>
        
        <div className="incoming-call-actions">
          <button
            className="incoming-call-btn incoming-call-btn--reject"
            onClick={handleReject}
            disabled={isProcessing}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Từ chối
          </button>
          
          <button
            className="incoming-call-btn incoming-call-btn--accept"
            onClick={handleAccept}
            disabled={isProcessing}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Tham gia
          </button>
        </div>
      </div>
    </div>
  );
}
