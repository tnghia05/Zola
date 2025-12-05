import { useEffect, useRef, useState, useCallback } from 'react';
import { getSocket } from '../socket';

export type FilterType =
  | 'none'
  | 'beauty'
  | 'warm'
  | 'cool'
  | 'party'
  | 'birthday';

type FilterConfig = {
  label: string;
  emoji: string;
  cssFilter?: string;
  overlay?: (ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => void;
};

const FILTER_CONFIG: Record<FilterType, FilterConfig> = {
  none: { label: 'Gốc', emoji: '🙂' },
  beauty: {
    label: 'Mịn',
    emoji: '✨',
    cssFilter: 'brightness(1.08) contrast(1.05) saturate(1.25)',
  },
  warm: {
    label: 'Ấm',
    emoji: '🌅',
    cssFilter: 'brightness(1.05) saturate(1.25) hue-rotate(-5deg)',
  },
  cool: {
    label: 'Mát',
    emoji: '❄️',
    cssFilter: 'brightness(1.08) saturate(1.15) hue-rotate(185deg)',
  },
  party: {
    label: 'Party',
    emoji: '🎉',
    cssFilter: 'brightness(1.05) saturate(1.25)',
    overlay: (ctx, width, height, time) => {
      ctx.save();
      ctx.globalAlpha = 0.35;
      for (let i = 0; i < 20; i += 1) {
        const x = (i * 73 + (time / 12) % width) % width;
        const y = (i * 41 + (time / 18) % height) % height;
        const size = 12 + (i % 5) * 3;
        ctx.fillStyle = ['#ff6b6b', '#ffd93d', '#6bc2ff', '#b070ff'][i % 4];
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    },
  },
  birthday: {
    label: 'Sinh nhật',
    emoji: '🎂',
    cssFilter: 'brightness(1.05) saturate(1.15)',
    overlay: (ctx, width, height) => {
      ctx.save();
      
      // Balloons
      const balloonColors = ['#ff7eb6', '#7dbbff', '#ffd966'];
      balloonColors.forEach((color, index) => {
        const bx = index === 0 ? width * 0.15 : index === 1 ? width * 0.85 : width * 0.5;
        const by = index === 2 ? height * 0.2 : height * 0.15;
        const radius = index === 2 ? 80 : 70;
        const gradient = ctx.createRadialGradient(bx - 20, by - 30, 20, bx, by, radius);
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.2, '#ffffff');
        gradient.addColorStop(1, color);
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.ellipse(bx, by, radius * 0.75, radius, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(bx, by + radius);
        ctx.quadraticCurveTo(bx - 10, by + radius + 60, bx, by + radius + 110);
        ctx.stroke();
      });

      // Party hat
      ctx.fillStyle = '#ff8ce6';
      ctx.beginPath();
      ctx.moveTo(width / 2, height * 0.02);
      ctx.lineTo(width / 2 - 80, height * 0.28);
      ctx.lineTo(width / 2 + 80, height * 0.28);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      for (let i = -60; i <= 60; i += 30) {
        ctx.beginPath();
        ctx.arc(width / 2 + i, height * 0.18, 18, 0, Math.PI * 2);
        ctx.fill();
      }

      // Cake base
      const cakeHeight = 90;
      ctx.fillStyle = '#ffd1dc';
      ctx.fillRect(width * 0.2, height - cakeHeight - 20, width * 0.6, cakeHeight);
      ctx.fillStyle = '#ff9ebe';
      ctx.fillRect(width * 0.2, height - cakeHeight - 20, width * 0.6, 25);

      // Candles
      for (let i = -1; i <= 1; i++) {
        const cx = width / 2 + i * 35;
        ctx.fillStyle = '#5dade2';
        ctx.fillRect(cx - 6, height - cakeHeight - 60, 12, 40);
        ctx.fillStyle = '#ffd966';
        ctx.beginPath();
        ctx.ellipse(cx, height - cakeHeight - 68, 7, 10, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    },
  },
};

interface UseWebRTCOptions {
  callId: string;
  conversationId: string;
  isInitiator: boolean;
  localUserId: string;
  remoteUserId: string;
  videoDeviceId?: string;
  audioDeviceId?: string;
}

interface UseWebRTCResult {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isConnected: boolean;
  error: string | null;
  startCall: () => Promise<void>;
  endCall: () => void;
  toggleVideo: () => void;
  toggleAudio: () => void;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  applyFilter: (filter: FilterType) => Promise<void>;
  currentFilter: FilterType;
  startScreenShare: () => Promise<void>;
  stopScreenShare: () => Promise<void>;
  isScreenSharing: boolean;
  localVideoRef: React.RefObject<HTMLVideoElement | null>;
  remoteVideoRef: React.RefObject<HTMLVideoElement | null>;
}

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

export function useWebRTC({
  callId,
  conversationId: _conversationId,
  isInitiator,
  localUserId: _localUserId,
  remoteUserId,
  videoDeviceId,
  audioDeviceId,
}: UseWebRTCOptions): UseWebRTCResult {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [currentFilter, setCurrentFilter] = useState<FilterType>('none');
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const socketRef = useRef(getSocket());
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  
  // Queue for ICE candidates received before remote description is set
  const iceCandidateQueueRef = useRef<RTCIceCandidateInit[]>([]);
  const hasReceivedOfferRef = useRef<boolean>(false);
  const offerRetryTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rawCameraStreamRef = useRef<MediaStream | null>(null);
  const screenShareStreamRef = useRef<MediaStream | null>(null);
  const processedFilterStreamRef = useRef<MediaStream | null>(null);
  const filterCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const filterVideoRef = useRef<HTMLVideoElement | null>(null);
  const filterAnimationFrameRef = useRef<number | null>(null);
  const currentFilterRef = useRef<FilterType>('none');
  
  // Refs to store latest functions for use in socket handlers (will be set after functions are defined)
  const initPeerConnectionRef = useRef<(() => RTCPeerConnection) | null>(null);
  const getUserMediaRef = useRef<((video: boolean, audio: boolean) => Promise<MediaStream>) | null>(null);

  useEffect(() => {
    currentFilterRef.current = currentFilter;
  }, [currentFilter]);

  const replaceVideoTrack = useCallback(
    async (track: MediaStreamTrack | null) => {
      if (!track) return;
      const pc = peerConnectionRef.current;
      if (!pc) return;
      const sender = pc.getSenders().find((s) => s.track && s.track.kind === 'video');
      if (sender) {
        await sender.replaceTrack(track);
      }
    },
    [],
  );

  const stopFilterProcessing = useCallback(() => {
    if (filterAnimationFrameRef.current) {
      cancelAnimationFrame(filterAnimationFrameRef.current);
      filterAnimationFrameRef.current = null;
    }
    if (processedFilterStreamRef.current) {
      processedFilterStreamRef.current.getTracks().forEach((track) => track.stop());
      processedFilterStreamRef.current = null;
    }
    if (filterVideoRef.current) {
      try {
        filterVideoRef.current.pause();
      } catch (err) {
        // ignore
      }
      filterVideoRef.current.srcObject = null;
      filterVideoRef.current = null;
    }
    filterCanvasRef.current = null;
  }, []);

  const startFilterProcessing = useCallback(
    (filter: FilterType) => {
      const rawStream = rawCameraStreamRef.current;
      if (!rawStream) return;
      stopFilterProcessing();

      const videoEl = document.createElement('video');
      videoEl.srcObject = rawStream;
      videoEl.muted = true;
      videoEl.playsInline = true;
      videoEl.autoplay = true;
      videoEl.play().catch(() => {});
      filterVideoRef.current = videoEl;

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.error('[Filter] Canvas context unavailable');
        return;
      }
      filterCanvasRef.current = canvas;

      const render = () => {
        if (!filterVideoRef.current) {
          return;
        }
        const video = filterVideoRef.current;
        const width = video.videoWidth || 640;
        const height = video.videoHeight || 480;

        if (width === 0 || height === 0) {
          filterAnimationFrameRef.current = requestAnimationFrame(render);
          return;
        }

        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
        }

        ctx.clearRect(0, 0, width, height);
        const config = FILTER_CONFIG[filter];
        ctx.filter = config.cssFilter || 'none';
        ctx.drawImage(video, 0, 0, width, height);
        ctx.filter = 'none';
        if (config.overlay) {
          config.overlay(ctx, width, height, performance.now());
        }
        filterAnimationFrameRef.current = requestAnimationFrame(render);
      };

      render();

      const processedStream = canvas.captureStream(30);
      processedFilterStreamRef.current = processedStream;
      const processedTrack = processedStream.getVideoTracks()[0];
      replaceVideoTrack(processedTrack);
      setLocalStream(processedStream);
    },
    [replaceVideoTrack, stopFilterProcessing],
  );

  const stopScreenShare = useCallback(async () => {
    if (!screenShareStreamRef.current) return;
    screenShareStreamRef.current.getTracks().forEach((track) => track.stop());
    screenShareStreamRef.current = null;
    setIsScreenSharing(false);

    const cameraStream = rawCameraStreamRef.current;
    if (!cameraStream) return;

    if (currentFilterRef.current !== 'none') {
      startFilterProcessing(currentFilterRef.current);
    } else {
      const cameraTrack = cameraStream.getVideoTracks()[0];
      await replaceVideoTrack(cameraTrack);
      setLocalStream(cameraStream);
    }
  }, [replaceVideoTrack, startFilterProcessing]);

  const startScreenShare = useCallback(async () => {
    if (isScreenSharing) return;
    try {
      const electronAPI = typeof window !== 'undefined' ? window.electronAPI : undefined;
      let shareStream: MediaStream | null = null;

      if (electronAPI?.selectScreenSource) {
        const sourceId = await electronAPI.selectScreenSource();
        if (!sourceId) {
          setError('Không tìm thấy màn hình để chia sẻ.');
          return;
        }
        const electronConstraints: MediaStreamConstraints = {
          audio: false,
          video: {
            mandatory: {
              chromeMediaSource: 'desktop',
              chromeMediaSourceId: sourceId,
              maxFrameRate: 30,
              minFrameRate: 5,
            },
          } as MediaTrackConstraints,
        };
        shareStream = await navigator.mediaDevices.getUserMedia(electronConstraints as any);
      } else if (navigator.mediaDevices?.getDisplayMedia) {
        shareStream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            frameRate: 30,
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            displaySurface: 'monitor',
          } as MediaTrackConstraints,
          audio: false,
        });
      } else {
        throw new Error('SCREEN_SHARE_NOT_SUPPORTED');
      }

      screenShareStreamRef.current = shareStream;
      const track = shareStream.getVideoTracks()[0];
      track.onended = () => {
        stopScreenShare().catch(() => {});
      };

      stopFilterProcessing();
      setLocalStream(shareStream);
      await replaceVideoTrack(track);
      setIsScreenSharing(true);
    } catch (err: any) {
      console.error('[ScreenShare] Error starting screen share:', err);
      if (err?.name === 'NotAllowedError') {
        setError('Bạn đã từ chối quyền chia sẻ màn hình.');
      } else if (err?.name === 'NotFoundError') {
        setError('Không tìm thấy màn hình phù hợp để chia sẻ.');
      } else {
        setError('Chia sẻ màn hình chưa được hỗ trợ trong môi trường này.');
      }
      throw err;
    }
  }, [isScreenSharing, replaceVideoTrack, stopFilterProcessing, stopScreenShare]);

  const applyFilter = useCallback(
    async (filter: FilterType) => {
      setCurrentFilter(filter);
      if (isScreenSharing) {
        console.warn('[Filter] Cannot apply filter while sharing screen');
        return;
      }
      if (!rawCameraStreamRef.current) return;

      if (filter === 'none') {
        stopFilterProcessing();
        const cameraTrack = rawCameraStreamRef.current.getVideoTracks()[0];
        await replaceVideoTrack(cameraTrack);
        setLocalStream(rawCameraStreamRef.current);
        return;
      }

      startFilterProcessing(filter);
    },
    [isScreenSharing, replaceVideoTrack, startFilterProcessing, stopFilterProcessing],
  );

  // ============================================================================
  // ERROR HANDLING HELPERS
  // ============================================================================
  const handleGetUserMediaError = useCallback((err: any): string => {
    const timestamp = new Date().toISOString();
    console.error(`[getUserMedia ERROR] ${timestamp}`);
    console.error(`[getUserMedia ERROR] Error name: ${err.name}`);
    console.error(`[getUserMedia ERROR] Error message: ${err.message}`);
    console.error(`[getUserMedia ERROR] Full error:`, err);

    switch (err.name) {
      case 'NotAllowedError':
        console.error('[getUserMedia ERROR] NotAllowedError: Permission denied by user or system');
        return 'Camera/microphone permission denied. Please allow access in Windows Settings (Privacy → Camera/Microphone).';
      
      case 'NotFoundError':
        console.error('[getUserMedia ERROR] NotFoundError: No media device found');
        return 'No camera/microphone found. Please connect a device.';
      
      case 'NotReadableError':
        console.error('[getUserMedia ERROR] NotReadableError: Device is already in use');
        return 'Camera/microphone is already in use by another application.';
      
      case 'OverconstrainedError':
        console.error('[getUserMedia ERROR] OverconstrainedError: Constraints cannot be satisfied');
        return 'Camera/microphone constraints cannot be satisfied. Please try different settings.';
      
      case 'SecurityError':
        console.error('[getUserMedia ERROR] SecurityError: Not in secure context');
        return 'Security error: App must run in secure context.';
      
      case 'TypeError':
        console.error('[getUserMedia ERROR] TypeError: Invalid constraints or API not available');
        return 'Invalid media constraints or API not available.';
      
      default:
        console.error(`[getUserMedia ERROR] Unknown error: ${err.name}`);
        return err.message || 'Failed to access camera/microphone.';
    }
  }, []);

  // ============================================================================
  // GET USER MEDIA WITH DETAILED ERROR HANDLING
  // ============================================================================
  const getUserMedia = useCallback(async (video: boolean, audio: boolean) => {
    const timestamp = new Date().toISOString();
    console.log(`[getUserMedia] ${timestamp} - Starting request`);
    console.log(`[getUserMedia] Video: ${video}, Audio: ${audio}`);

    // Check if mediaDevices API is available
    if (!navigator.mediaDevices) {
      const errorMsg = 'MediaDevices API is not available in this browser.';
      console.error(`[getUserMedia ERROR] ${errorMsg}`);
      throw new Error(errorMsg);
    }

    if (!navigator.mediaDevices.getUserMedia) {
      const errorMsg = 'getUserMedia is not supported in this browser.';
      console.error(`[getUserMedia ERROR] ${errorMsg}`);
      throw new Error(errorMsg);
    }

    // Log environment info
    console.log(`[getUserMedia] Environment info:`);
    console.log(`[getUserMedia] Origin: ${window.location.origin}`);
    console.log(`[getUserMedia] URL: ${window.location.href}`);
    console.log(`[getUserMedia] Is secure context: ${window.isSecureContext}`);
    console.log(`[getUserMedia] MediaDevices available: ${!!navigator.mediaDevices}`);

    // Prepare constraints with device selection
    const constraints: MediaStreamConstraints = {
      video: video
        ? videoDeviceId
          ? {
              deviceId: { exact: videoDeviceId },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            }
          : {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: 'user',
            }
        : false,
      audio: audio
        ? audioDeviceId
          ? {
              deviceId: { exact: audioDeviceId },
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            }
          : {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            }
        : false,
    };
    
    if (videoDeviceId) {
      console.log(`[getUserMedia] Using selected video device: ${videoDeviceId}`);
    }
    if (audioDeviceId) {
      console.log(`[getUserMedia] Using selected audio device: ${audioDeviceId}`);
    }

    console.log(`[getUserMedia] Constraints:`, JSON.stringify(constraints, null, 2));

    try {
      console.log(`[getUserMedia] Calling navigator.mediaDevices.getUserMedia...`);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      console.log(`[getUserMedia] ✅ Success! Stream obtained`);
      console.log(`[getUserMedia] Stream ID: ${stream.id}`);
      console.log(`[getUserMedia] Stream active: ${stream.active}`);
      console.log(`[getUserMedia] Tracks:`, stream.getTracks().map(track => ({
        kind: track.kind,
        id: track.id,
        label: track.label,
        enabled: track.enabled,
        muted: track.muted,
        readyState: track.readyState,
      })));

      if (rawCameraStreamRef.current && rawCameraStreamRef.current !== stream) {
        rawCameraStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      rawCameraStreamRef.current = stream;

      if (!isScreenSharing && currentFilterRef.current === 'none') {
        setLocalStream(stream);
      }
      setError(null);

      // Add tracks to peer connection if it exists
      if (peerConnectionRef.current) {
        stream.getTracks().forEach((track) => {
          console.log(`[getUserMedia] Adding ${track.kind} track to peer connection`);
          peerConnectionRef.current?.addTrack(track, stream);
        });
      }

      if (!isScreenSharing && currentFilterRef.current !== 'none') {
        startFilterProcessing(currentFilterRef.current);
      }

      return stream;
    } catch (err: any) {
      const errorMessage = handleGetUserMediaError(err);
      setError(errorMessage);
      throw err;
    }
  }, [handleGetUserMediaError, isScreenSharing, startFilterProcessing]);
  
  // Update getUserMedia ref
  useEffect(() => {
    getUserMediaRef.current = getUserMedia;
  }, [getUserMedia]);

  // ============================================================================
  // INITIALIZE PEER CONNECTION
  // ============================================================================
  const initPeerConnection = useCallback(() => {
    console.log('[PeerConnection] Initializing...');

    if (peerConnectionRef.current) {
      console.log('[PeerConnection] Closing existing connection');
      peerConnectionRef.current.close();
    }

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    console.log('[PeerConnection] Created new RTCPeerConnection');

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('[PeerConnection] ICE candidate:', event.candidate);
        const socket = socketRef.current;
        if (socket) {
          socket.emit('webrtc:ice-candidate', {
            callId,
            candidate: event.candidate,
            targetUserId: remoteUserId,
          });
        }
      } else {
        console.log('[PeerConnection] ICE gathering complete');
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      console.log(`[PeerConnection] Connection state: ${state}`);
      
      if (state === 'connected') {
        setIsConnected(true);
        setError(null);
      } else if (state === 'disconnected' || state === 'failed' || state === 'closed') {
        setIsConnected(false);
      }
    };

    // Handle remote stream
    pc.ontrack = (event) => {
      console.log('[PeerConnection] Received remote track:', event.track.kind);
      if (event.streams && event.streams[0]) {
        console.log('[PeerConnection] Setting remote stream');
        setRemoteStream(event.streams[0]);
      }
    };

    // Handle ICE connection state
    pc.oniceconnectionstatechange = () => {
      const state = pc.iceConnectionState;
      console.log(`[PeerConnection] ICE connection state: ${state}`);
      
      if (state === 'failed') {
        console.error('[PeerConnection] ICE connection failed');
        setError('Connection failed. Please try again.');
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  }, [callId, remoteUserId]);
  
  // Update initPeerConnection ref
  useEffect(() => {
    initPeerConnectionRef.current = initPeerConnection;
  }, [initPeerConnection]);

  const requestOffer = useCallback((reason: string) => {
    const socket = socketRef.current;
    if (!socket) {
      console.warn('[Socket] Cannot request offer - socket not available');
      return;
    }
    console.log(`[Socket] Requesting offer (${reason}) for callId ${callId}`);
    socket.emit('webrtc:request-offer', {
      callId,
      fromUserId: _localUserId,
      targetUserId: remoteUserId,
    });
  }, [callId, _localUserId, remoteUserId]);

  useEffect(() => {
    return () => {
      if (offerRetryTimerRef.current) {
        clearInterval(offerRetryTimerRef.current);
        offerRetryTimerRef.current = null;
      }
    };
  }, []);

  // ============================================================================
  // START CALL
  // ============================================================================
  const startCall = useCallback(async () => {
    const timestamp = new Date().toISOString();
    console.log(`[startCall] ${timestamp} - Starting call`);
    console.log(`[startCall] Call ID: ${callId}`);
    console.log(`[startCall] Is initiator: ${isInitiator}`);

    try {
      setError(null);

      const socket = socketRef.current;
      if (!socket) {
        throw new Error('Socket not connected');
      }

      // Initialize peer connection
      const pc = initPeerConnection();

      // Get user media (both initiator and non-initiator need this)
      console.log('[startCall] Requesting user media...');
      await getUserMedia(isVideoEnabled, isAudioEnabled);

      if (isInitiator) {
        // Initiator: Create and send offer
        console.log('[startCall] Creating offer...');
        console.log('[startCall] Initiator details:', {
          callId,
          remoteUserId,
          socketConnected: socket.connected,
          socketId: socket.id
        });
        
        const offer = await pc.createOffer();
        console.log('[startCall] Offer created:', {
          type: offer.type,
          sdpLength: offer.sdp?.length
        });
        
        await pc.setLocalDescription(offer);
        console.log('[startCall] Local description set, signalingState:', pc.signalingState);

        // Send offer
        console.log('[startCall] Sending offer via socket...');
        const offerData = {
          callId,
          offer: offer,
          targetUserId: remoteUserId,
        };
        console.log('[startCall] Offer data to send:', {
          callId: offerData.callId,
          targetUserId: offerData.targetUserId,
          offerType: offerData.offer.type
        });
        
        socket.emit('webrtc:offer', offerData);
        console.log('[startCall] ✅ Offer emitted to socket');
        
        // Verify socket is connected
        if (!socket.connected) {
          console.error('[startCall] ⚠️ Socket not connected when sending offer!');
        }
      } else {
        // Non-initiator: Just setup peer connection and wait for offer
        // The offer handler will create answer when offer is received
        console.log('[startCall] Non-initiator: Peer connection ready, waiting for offer...');
        console.log('[startCall] Socket listeners should be set up to receive offer');
        hasReceivedOfferRef.current = false;
        requestOffer('start');
        if (offerRetryTimerRef.current) {
          clearInterval(offerRetryTimerRef.current);
        }
        offerRetryTimerRef.current = setInterval(() => {
          if (hasReceivedOfferRef.current) {
            if (offerRetryTimerRef.current) {
              clearInterval(offerRetryTimerRef.current);
              offerRetryTimerRef.current = null;
            }
            return;
          }
          requestOffer('retry');
        }, 2000);
      }
    } catch (err: any) {
      console.error('[startCall] Error:', err);
      const errorMessage = err.message || 'Failed to start call';
      setError(errorMessage);
    }
  }, [callId, isInitiator, remoteUserId, isVideoEnabled, isAudioEnabled, initPeerConnection, getUserMedia, requestOffer]);

  // ============================================================================
  // END CALL
  // ============================================================================
  const endCall = useCallback(() => {
    console.log('[endCall] Ending call...');

    stopFilterProcessing();
    stopScreenShare().catch(() => {});

    // Stop local stream tracks
    if (localStream) {
      console.log('[endCall] Stopping local stream tracks');
      localStream.getTracks().forEach((track) => {
        track.stop();
        console.log(`[endCall] Stopped ${track.kind} track`);
      });
      setLocalStream(null);
    }

    if (rawCameraStreamRef.current) {
      rawCameraStreamRef.current.getTracks().forEach((track) => track.stop());
      rawCameraStreamRef.current = null;
    }

    // Stop remote stream tracks
    if (remoteStream) {
      console.log('[endCall] Stopping remote stream tracks');
      remoteStream.getTracks().forEach((track) => {
        track.stop();
      });
      setRemoteStream(null);
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      console.log('[endCall] Closing peer connection');
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    setIsConnected(false);
    setError(null);
    console.log('[endCall] Call ended');
  }, [localStream, remoteStream, stopFilterProcessing, stopScreenShare]);

  // ============================================================================
  // TOGGLE VIDEO/AUDIO
  // ============================================================================
  const toggleVideo = useCallback(() => {
    console.log(`[toggleVideo] Current state: ${isVideoEnabled}, toggling...`);
    setIsVideoEnabled(!isVideoEnabled);

    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      videoTracks.forEach((track) => {
        track.enabled = !isVideoEnabled;
        console.log(`[toggleVideo] Video track ${track.id} enabled: ${track.enabled}`);
      });
    }
  }, [isVideoEnabled, localStream]);

  const toggleAudio = useCallback(() => {
    console.log(`[toggleAudio] Current state: ${isAudioEnabled}, toggling...`);
    setIsAudioEnabled(!isAudioEnabled);

    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = !isAudioEnabled;
        console.log(`[toggleAudio] Audio track ${track.id} enabled: ${track.enabled}`);
      });
    }
  }, [isAudioEnabled, localStream]);

  // ============================================================================
  // SETUP SOCKET LISTENERS
  // ============================================================================
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) {
      console.log('[Socket] Socket not available, skipping listener setup');
      return;
    }

    // Setup listeners even if peer connection not ready yet
    // Peer connection will be created in startCall()
    console.log('[Socket] Setting up WebRTC listeners for callId:', callId);

    const handleOffer = async (data: { callId: string; offer: RTCSessionDescriptionInit; fromUserId: string }) => {
      console.log('[Socket] ===== OFFER RECEIVED =====');
      console.log('[Socket] Offer data:', {
        callId: data.callId,
        expectedCallId: callId,
        fromUserId: data.fromUserId,
        offerType: data.offer?.type,
        offerSdpLength: data.offer?.sdp?.length
      });
      hasReceivedOfferRef.current = true;
      if (offerRetryTimerRef.current) {
        clearInterval(offerRetryTimerRef.current);
        offerRetryTimerRef.current = null;
      }
      
      if (data.callId !== callId) {
        console.log('[Socket] ❌ Offer callId mismatch:', data.callId, 'expected:', callId);
        return;
      }
      console.log('[Socket] ✅ Offer callId matches, processing...');

      try {
        let pc = peerConnectionRef.current;
        
        // If peer connection doesn't exist or is closed, create a new one
        const isClosed = !pc || (pc as any).signalingState === 'closed' || (pc as any).connectionState === 'closed';
        if (isClosed) {
          console.log('[Socket] Peer connection not found or closed, creating new one...');
          if (!initPeerConnectionRef.current) {
            console.error('[Socket] initPeerConnection not available');
            return;
          }
          pc = initPeerConnectionRef.current();
          
          // Get user media if not already obtained
          if (!localStream) {
            console.log('[Socket] Getting user media for answer...');
            if (!getUserMediaRef.current) {
              console.error('[Socket] getUserMedia not available');
              return;
            }
            await getUserMediaRef.current(isVideoEnabled, isAudioEnabled);
          }
          
          // Double check after creating - if still closed, something went wrong
          if ((pc as any).signalingState === 'closed' || (pc as any).connectionState === 'closed') {
            console.error('[Socket] Peer connection was closed immediately after creation');
            return;
          }
        }

        // Final check - ensure pc is not null
        if (!pc) {
          console.error('[Socket] Peer connection is null after creation');
          return;
        }

        // Final check signaling state before setting remote description
        if ((pc as any).signalingState === 'closed' || (pc as any).connectionState === 'closed') {
          console.error('[Socket] Cannot set remote description: peer connection is closed');
          console.error('[Socket] Signaling state:', pc.signalingState, 'Connection state:', pc.connectionState);
          return;
        }

        await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
        console.log('[Socket] Remote description set');

        // Process queued ICE candidates now that remote description is set
        if (iceCandidateQueueRef.current.length > 0) {
          console.log(`[Socket] Processing ${iceCandidateQueueRef.current.length} queued ICE candidates`);
          for (const candidate of iceCandidateQueueRef.current) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
              console.log('[Socket] Queued ICE candidate added');
            } catch (err) {
              console.error('[Socket] Error adding queued ICE candidate:', err);
            }
          }
          iceCandidateQueueRef.current = [];
        }

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        console.log('[Socket] Answer created and set, signalingState:', pc.signalingState);

        const answerData = {
          callId,
          answer: answer,
          targetUserId: data.fromUserId,
        };
        console.log('[Socket] Sending answer:', {
          callId: answerData.callId,
          targetUserId: answerData.targetUserId,
          answerType: answerData.answer.type,
          socketConnected: socket.connected,
          socketId: socket.id
        });
        
        socket.emit('webrtc:answer', answerData);
        console.log('[Socket] ✅ Answer emitted to socket');
        
        // Verify socket is connected
        if (!socket.connected) {
          console.error('[Socket] ⚠️ Socket not connected when sending answer!');
        }
      } catch (err) {
        console.error('[Socket] Error handling offer:', err);
        setError('Failed to handle incoming call');
      }
    };

    const handleAnswer = async (data: { callId: string; answer: RTCSessionDescriptionInit; fromUserId?: string }) => {
      console.log('[Socket] ===== ANSWER RECEIVED =====');
      console.log('[Socket] Answer data:', {
        callId: data.callId,
        expectedCallId: callId,
        fromUserId: data.fromUserId,
        answerType: data.answer?.type,
        answerSdpLength: data.answer?.sdp?.length
      });
      
      if (data.callId !== callId) {
        console.log('[Socket] ❌ Answer callId mismatch:', data.callId, 'expected:', callId);
        return;
      }
      console.log('[Socket] ✅ Answer callId matches, processing...');

      try {
        const pc = peerConnectionRef.current;
        if (!pc) return;

        await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
        console.log('[Socket] Remote description set from answer');

        // Process queued ICE candidates now that remote description is set
        if (iceCandidateQueueRef.current.length > 0) {
          console.log(`[Socket] Processing ${iceCandidateQueueRef.current.length} queued ICE candidates`);
          for (const candidate of iceCandidateQueueRef.current) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
              console.log('[Socket] Queued ICE candidate added');
            } catch (err) {
              console.error('[Socket] Error adding queued ICE candidate:', err);
            }
          }
          iceCandidateQueueRef.current = [];
        }
      } catch (err) {
        console.error('[Socket] Error handling answer:', err);
        setError('Failed to handle call answer');
      }
    };

    const handleIceCandidate = async (data: { callId: string; candidate: RTCIceCandidateInit; fromUserId?: string }) => {
      if (data.callId !== callId) return;
      console.log('[Socket] Received ICE candidate:', data);

      try {
        const pc = peerConnectionRef.current;
        if (!pc) {
          console.log('[Socket] Peer connection not ready, queueing ICE candidate');
          iceCandidateQueueRef.current.push(data.candidate);
          return;
        }

        // Check if remote description is set
        if (!pc.remoteDescription) {
          console.log('[Socket] Remote description not set yet, queueing ICE candidate');
          iceCandidateQueueRef.current.push(data.candidate);
          return;
        }

        await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        console.log('[Socket] ICE candidate added');
      } catch (err) {
        // If error is because remote description is null, queue it
        if (err instanceof Error && err.message.includes('remote description')) {
          console.log('[Socket] Remote description not set, queueing ICE candidate');
          iceCandidateQueueRef.current.push(data.candidate);
        } else {
          console.error('[Socket] Error handling ICE candidate:', err);
        }
      }
    };

    socket.on('webrtc:offer', handleOffer);
    socket.on('webrtc:answer', handleAnswer);
    socket.on('webrtc:ice-candidate', handleIceCandidate);

    return () => {
      console.log('[Socket] Cleaning up WebRTC listeners');
      socket.off('webrtc:offer', handleOffer);
      socket.off('webrtc:answer', handleAnswer);
      socket.off('webrtc:ice-candidate', handleIceCandidate);
    };
    // Note: We intentionally don't include initPeerConnection, getUserMedia, etc. in deps
    // to avoid re-setting up listeners. These functions are stable (useCallback).
    // The handlers use refs/current values when needed.
  }, [callId]);

  // ============================================================================
  // ATTACH STREAMS TO VIDEO ELEMENTS
  // ============================================================================
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      console.log('[Video] Attaching local stream to video element');
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      console.log('[Video] Attaching remote stream to video element');
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // ============================================================================
  // CLEANUP ON UNMOUNT
  // ============================================================================
  // Use ref to store latest endCall function to avoid cleanup re-running
  const endCallRef = useRef(endCall);
  useEffect(() => {
    endCallRef.current = endCall;
  }, [endCall]);

  useEffect(() => {
    return () => {
      console.log('[Cleanup] Component unmounting, cleaning up...');
      // Use ref to call latest endCall without triggering re-runs
      endCallRef.current();
    };
    // Empty deps - only run on unmount
  }, []);

  return {
    localStream,
    remoteStream,
    isConnected,
    error,
    startCall,
    endCall,
    toggleVideo,
    toggleAudio,
    isVideoEnabled,
    isAudioEnabled,
    applyFilter,
    currentFilter,
    startScreenShare,
    stopScreenShare,
    isScreenSharing,
    localVideoRef,
    remoteVideoRef,
  };
}

