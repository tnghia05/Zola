import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useWebRTC, FilterType } from '../hooks/useWebRTC';
import { useLiveKit } from '../hooks/useLiveKit';
import { getCall, endCall as endCallAPI, acceptCall, rejectCall, getLiveKitToken } from '../api';
import { getSocket } from '../socket';
import { useOpponentInfo } from '../hooks/useOpponentInfo';
import { GroupCallGrid } from '../components/call/GroupCallGrid';
import '../styles/call.css';

// Normalize LiveKit URL coming from backend to avoid "Failed to construct 'URL'" errors
function normalizeLiveKitUrl(rawUrl?: string | null): string {
  if (!rawUrl) return '';

  let url = rawUrl.trim();

  // If backend accidentally sends only host without protocol
  if (!/^https?:\/\//i.test(url) && !/^wss?:\/\//i.test(url)) {
    // Default to secure WebSocket
    url = `wss://${url}`;
  }

  // If HTTP(S) URL is provided, LiveKit client accepts both ws/wss and http/https,
  // but we still validate format so we don't pass an invalid value down.
  try {
    // This will throw if URL is still invalid
    // eslint-disable-next-line no-new
    new URL(url);
    return url;
  } catch {
    console.error('[CallScreen] Invalid LiveKit URL from backend:', rawUrl);
    return '';
  }
}

export default function CallScreen() {
  const { callId } = useParams<{ callId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [callInfo, setCallInfo] = useState<{
    conversationId: string;
    initiatorId: string;
    remoteUserId: string;
    type: 'video' | 'audio';
    callType?: 'p2p' | 'sfu';
    livekitRoomName?: string;
    participants?: string[];
  } | null>(null);
  const [isInitiator, setIsInitiator] = useState(false);
  const [localUserId] = useState(() => localStorage.getItem('user_id'));
  const [acceptedFromModal, setAcceptedFromModal] = useState(false);
  
  // Log component lifecycle
  useEffect(() => {
    console.log('[CallScreen] Component mounted, callId:', callId);
    return () => {
      console.log('[CallScreen] Component unmounting, callId:', callId);
    };
  }, [callId]);
  
  // Get call info from navigation state (if available)
  const locationState = location.state as {
    conversationId?: string;
    initiatorId?: string;
    remoteUserId?: string;
    type?: 'video' | 'audio';
    callType?: 'p2p' | 'sfu';
    livekitRoomName?: string;
    isInitiator?: boolean;
    acceptedFromModal?: boolean;
  } | null;
  const [callDuration, setCallDuration] = useState(0);
  const [callStartTime, setCallStartTime] = useState<Date | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const { info: opponentInfo } = useOpponentInfo(callInfo?.conversationId || '');

  const filterOptions: Array<{ id: FilterType; label: string; emoji: string }> = [
    { id: 'none', label: 'Gốc', emoji: '🙂' },
    { id: 'beauty', label: 'Mịn', emoji: '✨' },
    { id: 'warm', label: 'Ấm', emoji: '🌅' },
    { id: 'cool', label: 'Mát', emoji: '❄️' },
    { id: 'party', label: 'Party', emoji: '🎉' },
    { id: 'birthday', label: 'Sinh nhật', emoji: '🎂' },
  ];
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  // LiveKit state
  const [liveKitToken, setLiveKitToken] = useState<string | null>(null);
  const [liveKitUrl, setLiveKitUrl] = useState<string>('');

  // Chỉ sử dụng useWebRTC cho P2P calls
  const isP2PCall = !callInfo?.callType || callInfo.callType === 'p2p';
  
  // Luôn gọi useWebRTC để đảm bảo hooks order không đổi
  const {
    localStream: p2pLocalStream,
    remoteStream: p2pRemoteStream,
    isConnected: p2pIsConnected,
    error: p2pError,
    startCall,
    endCall: endWebRTC,
    toggleVideo: p2pToggleVideo,
    toggleAudio: p2pToggleAudio,
    isVideoEnabled: p2pIsVideoEnabled,
    isAudioEnabled: p2pIsAudioEnabled,
    applyFilter,
    currentFilter,
    startScreenShare,
    stopScreenShare,
    isScreenSharing,
    localVideoRef,
    remoteVideoRef,
  } = useWebRTC({
    callId: callId || '',
    conversationId: callInfo?.conversationId || '',
    isInitiator: isInitiator,
    localUserId: localUserId || '',
    remoteUserId: callInfo?.remoteUserId || '',
  });

  // Luôn gọi useLiveKit để đảm bảo hooks order không đổi
  const {
    localStream: liveKitLocalStream,
    remoteStreams: liveKitRemoteStreams,
    isConnected: liveKitIsConnected,
    error: liveKitError,
    connect: connectLiveKit,
    disconnect: disconnectLiveKit,
    toggleVideo: liveKitToggleVideo,
    toggleAudio: liveKitToggleAudio,
    isVideoEnabled: liveKitIsVideoEnabled,
    isAudioEnabled: liveKitIsAudioEnabled,
  } = useLiveKit({
    roomName: callInfo?.livekitRoomName || '',
    token: liveKitToken || '',
    url: liveKitUrl,
  });

  // Chọn stream và controls dựa trên call type
  const localStream = isP2PCall ? p2pLocalStream : liveKitLocalStream;
  const remoteStream = isP2PCall ? p2pRemoteStream : null;
  const isConnected = isP2PCall ? p2pIsConnected : liveKitIsConnected;
  const error = isP2PCall ? p2pError : liveKitError;
  const toggleVideo = isP2PCall ? p2pToggleVideo : liveKitToggleVideo;
  const toggleAudio = isP2PCall ? p2pToggleAudio : liveKitToggleAudio;
  const isVideoEnabled = isP2PCall ? p2pIsVideoEnabled : liveKitIsVideoEnabled;
  const isAudioEnabled = isP2PCall ? p2pIsAudioEnabled : liveKitIsAudioEnabled;
  const canUseEnhancements = isP2PCall && (callInfo?.type === 'video');

  useEffect(() => {
    if (!canUseEnhancements) {
      setShowFilterPanel(false);
    }
  }, [canUseEnhancements]);

  const handleToggleFilterPanel = () => {
    if (!canUseEnhancements) return;
    setShowFilterPanel((prev) => !prev);
  };

  // Ref to track if we've already auto-started
  const hasAutoStartedRef = useRef(false);
  // Ref to store latest startCall function to avoid re-triggering
  const startCallRef = useRef(startCall);
  useEffect(() => {
    startCallRef.current = startCall;
  }, [startCall]);

  // Calculate call duration
  useEffect(() => {
    if (isConnected && callStartTime) {
      durationIntervalRef.current = setInterval(() => {
        const now = new Date();
        const diff = Math.floor((now.getTime() - callStartTime.getTime()) / 1000);
        setCallDuration(diff);
      }, 1000);
    } else {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
    }

    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [isConnected, callStartTime]);

  useEffect(() => {
    if (isConnected && !callStartTime) {
      setCallStartTime(new Date());
    }
  }, [isConnected, callStartTime]);

  // Format duration as MM:SS or HH:MM:SS
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (!callId || !localUserId) return;

    // First, try to use location state (from navigation)
    if (locationState?.conversationId) {
      console.log('[CallScreen] Using call info from location state:', locationState);
      setCallInfo({
        conversationId: locationState.conversationId,
        initiatorId: locationState.initiatorId || localUserId,
        remoteUserId: locationState.remoteUserId || '',
        type: locationState.type || 'video',
        callType: locationState.callType || 'p2p',
        livekitRoomName: locationState.livekitRoomName,
      });
      setIsInitiator(locationState.isInitiator || false);
      
      // Nếu là cuộc gọi nhóm, lấy LiveKit token
      if (locationState.callType === 'sfu' && locationState.livekitRoomName && callId) {
        getLiveKitToken(callId).then(tokenData => {
          console.log('[CallScreen] LiveKit token response:', {
            hasToken: !!tokenData.token,
            hasUrl: !!tokenData.url,
            url: tokenData.url,
            roomName: tokenData.roomName
          });
          setLiveKitToken(tokenData.token);
          const normalizedUrl = normalizeLiveKitUrl(tokenData.url);
          console.log('[CallScreen] Normalized URL:', normalizedUrl);
          setLiveKitUrl(normalizedUrl);
          if (!normalizedUrl) {
            console.error('[CallScreen] LiveKit URL is invalid or empty. Please check LIVEKIT_URL on backend.');
            console.error('[CallScreen] Raw URL from backend:', tokenData.url);
          } else {
            console.log('[CallScreen] ✅ LiveKit URL set successfully:', normalizedUrl);
          }
          console.log('[CallScreen] LiveKit token obtained from location state');
        }).catch(err => {
          console.error('[CallScreen] Error getting LiveKit token:', err);
        });
      }
      
      // Mark as accepted from modal if coming from IncomingCallModal
      if (locationState.acceptedFromModal || (!locationState.isInitiator && locationState.conversationId)) {
        setAcceptedFromModal(true);
        console.log('[CallScreen] User accepted from modal, will auto-start call');
      }
      
      // Don't auto-start here - let the separate useEffect handle it
      // This prevents duplicate calls and race conditions
      return;
    }

    const loadCallInfo = async () => {
      try {
        console.log('[CallScreen] Loading call info for callId:', callId);
        const call = await getCall(callId);
        console.log('[CallScreen] Call info loaded:', call);
        
        const remoteUserId = call.participants.find((id) => String(id) !== localUserId) || '';
        const isInit = String(call.initiatorId) === localUserId;
        const callType = call.callType || 'p2p';

        setCallInfo({
          conversationId: String(call.conversationId),
          initiatorId: String(call.initiatorId),
          remoteUserId: String(remoteUserId),
          type: call.type,
          callType: callType,
          livekitRoomName: call.metadata?.livekitRoomName,
          participants: call.participants.map(p => String(p)),
        });
        setIsInitiator(isInit);

        // Nếu là cuộc gọi nhóm, lấy LiveKit token
        if (callType === 'sfu' && call.metadata?.livekitRoomName) {
          try {
            const tokenData = await getLiveKitToken(callId);
            console.log('[CallScreen] LiveKit token response:', {
              hasToken: !!tokenData.token,
              hasUrl: !!tokenData.url,
              url: tokenData.url,
              roomName: tokenData.roomName
            });
            setLiveKitToken(tokenData.token);
            const normalizedUrl = normalizeLiveKitUrl(tokenData.url);
            console.log('[CallScreen] Normalized URL:', normalizedUrl);
            setLiveKitUrl(normalizedUrl);
            if (!normalizedUrl) {
              console.error('[CallScreen] LiveKit URL is invalid or empty. Please check LIVEKIT_URL on backend.');
              console.error('[CallScreen] Raw URL from backend:', tokenData.url);
            } else {
              console.log('[CallScreen] ✅ LiveKit URL set successfully:', normalizedUrl);
            }
            console.log('[CallScreen] LiveKit token obtained');
          } catch (err) {
            console.error('[CallScreen] Error getting LiveKit token:', err);
          }
        }
      } catch (error: any) {
        console.error('[CallScreen] Error loading call info:', error);
        // If call not found, try to get info from socket or use fallback
        if (error.response?.status === 404) {
          console.warn('[CallScreen] Call not found (404), trying socket events...');
          // Try to get info from socket events instead
          const socket = getSocket();
          if (socket) {
            // Listen for call info from socket
            socket.once('call:info', (data: any) => {
              if (data.callId === callId) {
                console.log('[CallScreen] Got call info from socket:', data);
                setCallInfo({
                  conversationId: data.conversationId,
                  initiatorId: data.initiatorId,
                  remoteUserId: data.remoteUserId || data.initiatorId,
                  type: data.type || 'video',
                });
                setIsInitiator(String(data.initiatorId) === localUserId);
              }
            });
            
            // Also listen for incoming call event
            socket.once('call:incoming', (data: any) => {
              if (data.callId === callId) {
                console.log('[CallScreen] Got call info from call:incoming:', data);
                setCallInfo({
                  conversationId: data.conversationId,
                  initiatorId: data.initiatorId,
                  remoteUserId: data.initiatorId, // For incoming, initiator is the remote user
                  type: data.type || 'video',
                });
                setIsInitiator(false);
              }
            });
          }
        }
      }
    };

    loadCallInfo();

    const socket = getSocket();
    if (socket) {
      const handleCallIncoming = async (data: {
        callId: string;
        conversationId: string;
        initiatorId: string;
        type: 'video' | 'audio';
        callType?: 'p2p' | 'sfu';
        livekitRoomName?: string;
        participants?: string[];
        remoteUserId?: string;
      }) => {
        if (data.callId !== callId) return;

        console.log('[CallScreen] Received call:incoming event:', data);
        setCallInfo({
          conversationId: data.conversationId,
          initiatorId: data.initiatorId,
          remoteUserId: data.remoteUserId || data.initiatorId,
          type: data.type,
          callType: data.callType || 'p2p',
          livekitRoomName: data.livekitRoomName,
          participants: data.participants,
        });
        setIsInitiator(false);

        // Nếu là cuộc gọi nhóm, lấy LiveKit token
        if (data.callType === 'sfu' && data.livekitRoomName) {
          try {
            const tokenData = await getLiveKitToken(callId);
            console.log('[CallScreen] LiveKit token response (from incoming call):', {
              hasToken: !!tokenData.token,
              hasUrl: !!tokenData.url,
              url: tokenData.url,
              roomName: tokenData.roomName,
              fullResponse: tokenData
            });
            setLiveKitToken(tokenData.token);
            const normalizedUrl = normalizeLiveKitUrl(tokenData.url);
            console.log('[CallScreen] Normalized URL (from incoming call):', normalizedUrl);
            setLiveKitUrl(normalizedUrl);
            if (!normalizedUrl) {
              console.error('[CallScreen] LiveKit URL is invalid or empty. Please check LIVEKIT_URL on backend.');
              console.error('[CallScreen] Raw URL from backend:', tokenData.url);
            } else {
              console.log('[CallScreen] ✅ LiveKit URL set successfully (from incoming call):', normalizedUrl);
            }
            console.log('[CallScreen] LiveKit token obtained from incoming call');
          } catch (err) {
            console.error('[CallScreen] Error getting LiveKit token:', err);
          }
        }
      };

      const handleCallInfo = (data: {
        callId: string;
        conversationId: string;
        initiatorId: string;
        participants: string[];
        type: 'video' | 'audio';
      }) => {
        if (data.callId !== callId) return;

        console.log('[CallScreen] Received call:info event:', data);
        const remoteUserId = data.participants.find((id) => String(id) !== localUserId) || '';
        const isInit = String(data.initiatorId) === localUserId;

        setCallInfo({
          conversationId: data.conversationId,
          initiatorId: String(data.initiatorId),
          remoteUserId: String(remoteUserId),
          type: data.type,
        });
        setIsInitiator(isInit);
      };

      const handleCallAccepted = (data: {
        callId: string;
        conversationId?: string;
        initiatorId?: string;
        remoteUserId?: string;
        type?: 'video' | 'audio';
        participants?: string[];
      }) => {
        if (data.callId !== callId) return;

        console.log('[CallScreen] Received call:accepted event:', data);
        
        // Update call info if provided
        if (data.conversationId) {
          const remoteUserId = data.participants 
            ? data.participants.find((id) => String(id) !== localUserId) || ''
            : data.remoteUserId || '';
          
          setCallInfo(prev => prev ? {
            ...prev,
            conversationId: data.conversationId!,
            remoteUserId: remoteUserId || prev.remoteUserId,
            type: data.type || prev.type,
          } : {
            conversationId: data.conversationId!,
            initiatorId: data.initiatorId || localUserId,
            remoteUserId: remoteUserId,
            type: data.type || 'video',
          });
        }
        
        // If we're the initiator and call is accepted, auto-start the call
        // Only auto-start once
        if (isInitiator && !isConnected && !hasAutoStartedRef.current && callInfo) {
          console.log('[CallScreen] Call accepted, auto-starting call...');
          console.log('[CallScreen] CallInfo available:', callInfo);
          hasAutoStartedRef.current = true;
          setTimeout(async () => {
            console.log('[CallScreen] Attempting to start call as initiator...');
            if (callInfo.callType === 'sfu' && liveKitToken) {
              // Start LiveKit connection
              await connectLiveKit();
            } else {
              // Use ref to call latest startCall without triggering re-runs
              startCallRef.current().then(() => {
                console.log('[CallScreen] Call started successfully as initiator');
              }).catch(err => {
                console.error('[CallScreen] Error auto-starting call:', err);
                hasAutoStartedRef.current = false; // Reset on error
              });
            }
          }, 1000);
        }
      };

      const handleCallActive = (data: {
        callId: string;
        status?: string;
      }) => {
        if (data.callId !== callId) return;
        console.log('[CallScreen] Received call:active event:', data);
        // Call is now active, ensure we're connected
      };

      socket.on('call:incoming', handleCallIncoming);
      socket.on('call:info', handleCallInfo);
      socket.on('call:accepted', handleCallAccepted);
      socket.on('call:active', handleCallActive);

      return () => {
        socket.off('call:incoming', handleCallIncoming);
        socket.off('call:info', handleCallInfo);
        socket.off('call:accepted', handleCallAccepted);
        socket.off('call:active', handleCallActive);
      };
    }
  }, [callId, localUserId]);
  
  // Reset auto-start flag when call connects
  useEffect(() => {
    if (isConnected) {
      hasAutoStartedRef.current = false;
    }
  }, [isConnected]);

  // Auto-start call for initiator when callInfo is ready
  useEffect(() => {
    // Skip if already connected or already started
    if (isConnected || hasAutoStartedRef.current) return;
    
    // Initiator: auto-start when callInfo is fully ready (including remoteUserId for P2P)
    const isSFU = callInfo?.callType === 'sfu';
    const isP2PReady = !isSFU && callInfo?.remoteUserId;
    const isSFUReady = isSFU && callInfo?.livekitRoomName;
    
    if (isInitiator && callInfo && callInfo.conversationId && (isP2PReady || isSFUReady)) {
      console.log('[CallScreen] Auto-start effect triggered for initiator:', {
        isInitiator,
        isConnected,
        callInfo,
        isP2PReady,
        isSFUReady,
      });
      
      hasAutoStartedRef.current = true;
      console.log('[CallScreen] Starting call as initiator from auto-start effect...');
      
      // Delay slightly to ensure everything is set up
      setTimeout(async () => {
        if (isSFU) {
          // SFU: connect to LiveKit
          console.log('[CallScreen] Checking LiveKit readiness:', {
            hasToken: !!liveKitToken,
            hasUrl: !!liveKitUrl,
            url: liveKitUrl,
            hasRoomName: !!callInfo.livekitRoomName
          });
          if (liveKitToken && liveKitUrl && callInfo.livekitRoomName) {
            console.log('[CallScreen] Connecting to LiveKit...', { 
              hasToken: !!liveKitToken,
              hasUrl: !!liveKitUrl,
              url: liveKitUrl
            });
            try {
              await connectLiveKit();
            } catch (err) {
              console.error('[CallScreen] Error connecting to LiveKit:', err);
              hasAutoStartedRef.current = false;
            }
          } else {
            console.error('[CallScreen] LiveKit not ready:', {
              missingToken: !liveKitToken,
              missingUrl: !liveKitUrl,
              missingRoomName: !callInfo.livekitRoomName
            });
            hasAutoStartedRef.current = false;
          }
        } else {
          // P2P: start WebRTC call
          console.log('[CallScreen] Starting P2P call with remoteUserId:', callInfo.remoteUserId);
          startCallRef.current().then(() => {
            console.log('[CallScreen] ✅ Call started as initiator from auto-start effect');
          }).catch(err => {
            console.error('[CallScreen] ❌ Error starting call as initiator:', err);
            hasAutoStartedRef.current = false;
          });
        }
      }, 500);
    }
    // Non-initiator: auto-start when accepted from modal
    else if (acceptedFromModal && !isInitiator && callInfo && callInfo.conversationId && (isP2PReady || isSFUReady)) {
      console.log('[CallScreen] Auto-start effect triggered for non-initiator:', {
        acceptedFromModal,
        isInitiator,
        isConnected,
        callInfo,
        isP2PReady,
        isSFUReady,
      });
      
      hasAutoStartedRef.current = true;
      console.log('[CallScreen] Starting call from auto-start effect...');
      
      setTimeout(async () => {
        if (isSFU) {
          // SFU: connect to LiveKit
          console.log('[CallScreen] Checking LiveKit readiness (non-initiator):', {
            hasToken: !!liveKitToken,
            hasUrl: !!liveKitUrl,
            url: liveKitUrl,
            hasRoomName: !!callInfo.livekitRoomName
          });
          if (liveKitToken && liveKitUrl && callInfo.livekitRoomName) {
            console.log('[CallScreen] Connecting to LiveKit (non-initiator)...', { 
              hasToken: !!liveKitToken,
              hasUrl: !!liveKitUrl,
              url: liveKitUrl
            });
            try {
              await connectLiveKit();
            } catch (err) {
              console.error('[CallScreen] Error connecting to LiveKit:', err);
              hasAutoStartedRef.current = false;
            }
          } else {
            console.error('[CallScreen] LiveKit not ready (non-initiator):', {
              missingToken: !liveKitToken,
              missingUrl: !liveKitUrl,
              missingRoomName: !callInfo.livekitRoomName
            });
            hasAutoStartedRef.current = false;
          }
        } else {
          // P2P: start WebRTC call
          console.log('[CallScreen] Starting P2P call with remoteUserId:', callInfo.remoteUserId);
          startCallRef.current().then(() => {
            console.log('[CallScreen] ✅ Call started from auto-start effect');
          }).catch(err => {
            console.error('[CallScreen] ❌ Error starting call from auto-start effect:', err);
            hasAutoStartedRef.current = false;
          });
        }
      }, 500);
    }
  }, [acceptedFromModal, isInitiator, isConnected, callInfo, liveKitToken, liveKitUrl, connectLiveKit]);

  const handleAccept = async () => {
    if (!callId) return;
    try {
      console.log('[CallScreen] Accepting call:', callId);
      await acceptCall(callId);
      console.log('[CallScreen] Call accepted, starting call...');
      
      // Start the call immediately after accepting
      if (callInfo?.callType === 'sfu' && liveKitToken) {
        await connectLiveKit();
      } else {
        await startCall();
      }
      console.log('[CallScreen] Call started successfully');
    } catch (err) {
      console.error('[CallScreen] Error accepting call:', err);
      // Try to start call anyway if accept succeeded but startCall failed
      try {
        if (callInfo?.callType === 'sfu' && liveKitToken) {
          await connectLiveKit();
        } else {
          await startCall();
        }
      } catch (startErr) {
        console.error('[CallScreen] Error starting call after accept:', startErr);
      }
    }
  };

  const handleReject = async () => {
    if (!callId) return;
    try {
      await rejectCall(callId);
      navigate(-1);
    } catch (err) {
      console.error('Error rejecting call:', err);
    }
  };

  const handleEndCall = async () => {
    if (!callId) return;
    try {
      if (isP2PCall) {
        endWebRTC();
      } else {
        disconnectLiveKit();
      }
      await endCallAPI(callId);
      navigate(-1);
    } catch (err) {
      console.error('Error ending call:', err);
      navigate(-1);
    }
  };

  const handleFilterSelect = async (filter: FilterType) => {
    try {
      await applyFilter(filter);
      setShowFilterPanel(false);
    } catch (error) {
      console.error('[CallScreen] Error applying filter:', error);
    }
  };

  const handleScreenShareToggle = async () => {
    try {
      if (isScreenSharing) {
        await stopScreenShare();
      } else {
        await startScreenShare();
      }
    } catch (error) {
      console.error('[CallScreen] Screen share error:', error);
    }
  };

  // Chuyển đổi LiveKit remoteStreams thành format cho GroupCallGrid
  // PHẢI đặt trước early returns để tuân thủ Rules of Hooks
  const groupCallParticipants = React.useMemo(() => {
    if (isP2PCall) return [];
    
    const participants: Array<{ participantId: string; stream: MediaStream; name?: string; avatar?: string }> = [];
    liveKitRemoteStreams.forEach((stream, participantId) => {
      participants.push({
        participantId,
        stream,
        // TODO: Lấy name và avatar từ participant info
      });
    });
    return participants;
  }, [liveKitRemoteStreams, isP2PCall]);

  const opponentName = opponentInfo?.name || 'Unknown';
  const opponentAvatar = opponentInfo?.avatar;

  if (!callId) {
    return (
      <div className="call-screen">
        <div className="call-loading">Invalid call ID</div>
      </div>
    );
  }

  // Show loading only if we don't have callInfo yet
  if (!callInfo) {
    return (
      <div className="call-screen">
        <div className="call-loading">Loading call...</div>
        <div style={{ 
          position: 'absolute', 
          bottom: '20px', 
          left: '50%', 
          transform: 'translateX(-50%)',
          color: 'rgba(255, 255, 255, 0.5)',
          fontSize: '14px'
        }}>
          Call ID: {callId}
        </div>
        <div style={{ 
          position: 'absolute', 
          bottom: '60px', 
          left: '50%', 
          transform: 'translateX(-50%)',
          color: 'rgba(255, 255, 255, 0.3)',
          fontSize: '12px',
          textAlign: 'center',
          maxWidth: '400px'
        }}>
          Nếu call không tìm thấy, có thể đã bị kết thúc hoặc backend chưa có endpoint GET /calls/:callId
        </div>
      </div>
    );
  }

  return (
    <div className="call-screen">
      {/* Group call UI */}
      {!isP2PCall && callInfo.callType === 'sfu' ? (
        <div className="call-main-video" style={{ width: '100%', height: '100%', background: '#000' }}>
          {isConnected && (localStream || groupCallParticipants.length > 0) ? (
            <GroupCallGrid
              participants={groupCallParticipants}
              localStream={localStream}
              localParticipantId={localUserId || ''}
            />
          ) : (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '100%',
              color: '#fff'
            }}>
              {!liveKitToken ? (
                <>
                  <div style={{ fontSize: '18px', marginBottom: '10px' }}>Đang lấy token...</div>
                  <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>Vui lòng đợi</div>
                </>
              ) : !isConnected ? (
                <>
                  <div style={{ fontSize: '18px', marginBottom: '10px' }}>Đang kết nối...</div>
                  <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>Đang tham gia cuộc gọi nhóm</div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: '18px', marginBottom: '10px' }}>Đang tải video...</div>
                  <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>Vui lòng đợi</div>
                </>
              )}
              {error && (
                <div style={{ 
                  marginTop: '20px', 
                  padding: '10px 20px', 
                  background: 'rgba(255,0,0,0.2)', 
                  borderRadius: '8px',
                  color: '#ff6b6b'
                }}>
                  {error}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Main video area - remote video or avatar (P2P) */}
          <div className="call-main-video">
            {remoteStream ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="call-video-remote"
              />
            ) : (
              <div className="call-avatar-container">
                {opponentAvatar ? (
                  <img src={opponentAvatar} alt={opponentName} className="call-avatar" />
                ) : (
                  <div className="call-avatar-placeholder">
                    {opponentName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="call-name">{opponentName}</div>
                {!isConnected && (
                  <div className="call-status">
                    {isInitiator ? 'Đang gọi...' : (acceptedFromModal ? 'Đang kết nối...' : 'Cuộc gọi đến...')}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Self-view video (small, bottom right) - only show if video call and has local stream */}
          {callInfo.type === 'video' && localStream && (
            <div className="call-self-view">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="call-video-local"
              />
            </div>
          )}
        </>
      )}

      {/* Call duration (bottom left) */}
      {isConnected && callDuration > 0 && (
        <div className="call-duration">
          {formatDuration(callDuration)}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="call-error-banner">
          {error}
        </div>
      )}

      {/* Call controls (bottom center) */}
      <div className="call-controls">
        {!isInitiator && !isConnected && !acceptedFromModal && (
          <div className="call-incoming-controls">
            <button
              className="call-control-btn call-control-accept"
              onClick={handleAccept}
              title="Chấp nhận"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button
              className="call-control-btn call-control-reject"
              onClick={handleReject}
              title="Từ chối"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        )}

        {/* Removed "Start call" button - call auto-starts when initiator creates it */}

        {isConnected && (
          <div className="call-active-controls">
            {/* Message button */}
            <button
              className="call-control-btn call-control-secondary"
              onClick={() => navigate(`/chat/${callInfo.conversationId}`)}
              title="Tin nhắn"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {/* Filter panel toggle */}
            {canUseEnhancements && (
              <button
                className={`call-control-btn call-control-secondary ${showFilterPanel || currentFilter !== 'none' ? 'call-control-active' : ''}`}
                title="Bộ lọc làm đẹp"
                onClick={handleToggleFilterPanel}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M12 3L13.5 7.5L18 9L13.5 10.5L12 15L10.5 10.5L6 9L10.5 7.5L12 3Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M5 16H9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                  <path d="M15 16H19" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                </svg>
              </button>
            )}

            {/* Screen share */}
            {canUseEnhancements && (
              <button
                className={`call-control-btn call-control-secondary ${isScreenSharing ? 'call-control-active' : ''}`}
                title={isScreenSharing ? 'Dừng chia sẻ màn hình' : 'Chia sẻ màn hình'}
                onClick={handleScreenShareToggle}
              >
                {isScreenSharing ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M4 5H20C21.1046 5 22 5.89543 22 7V15C22 16.1046 21.1046 17 20 17H4C2.89543 17 2 16.1046 2 15V7C2 5.89543 2.89543 5 4 5Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 21V17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                    <path d="M8 21H16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                    <path d="M8 9L12 13L16 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M4 5H20C21.1046 5 22 5.89543 22 7V14C22 15.1046 21.1046 16 20 16H4C2.89543 16 2 15.1046 2 14V7C2 5.89543 2.89543 5 4 5Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 20V16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                    <path d="M8 20H16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                  </svg>
                )}
              </button>
            )}

            {/* Toggle microphone */}
            <button
              className={`call-control-btn ${!isAudioEnabled ? 'call-control-muted' : ''}`}
              onClick={toggleAudio}
              title={isAudioEnabled ? 'Tắt mic' : 'Bật mic'}
            >
              {isAudioEnabled ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 1C10.34 1 9 2.34 9 4V12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12V4C15 2.34 13.66 1 12 1Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M19 10V12C19 15.87 15.87 19 12 19C8.13 19 5 15.87 5 12V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 19V23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8 23H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M1 1L23 23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 9V12C9 13.66 10.34 15 12 15C12.41 15 12.81 14.92 13.17 14.77" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M5 10V12C5 15.87 8.13 19 12 19C12.69 19 13.35 18.89 13.97 18.7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 1V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M15 1V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 19V23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8 23H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>

            {/* Toggle camera (only for video calls) */}
            {callInfo.type === 'video' && (
              <button
                className={`call-control-btn ${!isVideoEnabled ? 'call-control-muted' : ''}`}
                onClick={toggleVideo}
                title={isVideoEnabled ? 'Tắt camera' : 'Bật camera'}
              >
                {isVideoEnabled ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M23 7L16 12L23 17V7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M14 5H3C1.89543 5 1 5.89543 1 7V17C1 18.1046 1.89543 19 3 19H14C15.1046 19 16 18.1046 16 17V7C16 5.89543 15.1046 5 14 5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M1 1L23 23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M16 12L23 7V17L16 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M14 5H3C1.89543 5 1 5.89543 1 7V17C1 18.1046 1.89543 19 3 19H14C15.1046 19 16 18.1046 16 17V7C16 5.89543 15.1046 5 14 5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
            )}

            {/* End call button */}
            <button
              className="call-control-btn call-control-end"
              onClick={handleEndCall}
              title="Kết thúc cuộc gọi"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M3 5C3 3.89543 3.89543 3 5 3H8.27924C8.70967 3 9.09181 3.27543 9.22792 3.68377L10.7257 8.17721C10.8831 8.64932 10.6694 9.16531 10.2243 9.38787L7.96701 10.5165C9.06925 12.9612 11.0388 14.9308 13.4835 16.033L14.6121 13.7757C14.8347 13.3306 15.3507 13.1169 15.8228 13.2743L20.3162 14.7721C20.7246 14.9082 21 15.2903 21 15.7208V19C21 20.1046 20.1046 21 19 21H18C9.71573 21 3 14.2843 3 6V5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        )}
      </div>
      {canUseEnhancements && isScreenSharing && (
        <div className="call-screen-share-indicator">
          <span>Đang chia sẻ màn hình</span>
          <button type="button" onClick={handleScreenShareToggle}>
            Dừng chia sẻ
          </button>
        </div>
      )}

      {canUseEnhancements && showFilterPanel && (
        <div className="call-filter-panel">
          <div className="call-filter-panel__header">
            <span>Bộ lọc & hiệu ứng</span>
            <button type="button" onClick={() => setShowFilterPanel(false)} aria-label="Đóng">×</button>
          </div>
          <div className="call-filter-panel__list">
            {filterOptions.map((option) => {
              const active = currentFilter === option.id;
              const disabled = isScreenSharing;
              return (
                <button
                  key={option.id}
                  type="button"
                  className={`filter-option ${active ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
                  onClick={() => !disabled && handleFilterSelect(option.id)}
                  disabled={disabled}
                >
                  <span className="filter-option__emoji">{option.emoji}</span>
                  <span className="filter-option__label">{option.label}</span>
                </button>
              );
            })}
          </div>
          {isScreenSharing && (
            <div className="call-filter-panel__notice">
              Tắt chia sẻ màn hình để sử dụng bộ lọc.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

