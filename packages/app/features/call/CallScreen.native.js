import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// src/screens/CallScreen.tsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, useWindowDimensions, ScrollView, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getSocket } from '../socket';
import { WebRTCService, checkWebRTCSupport } from '../services/webrtcService';
import { WebRTCView } from '../components/WebRTCView';
import { CallQualityIndicator } from '../components/CallQualityIndicator';
import { VideoFilters } from '../components/VideoFilters';
import { CallReactions } from '../components/CallReactions';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLiveKit } from '../hooks/useLiveKit';
import { GroupCallGrid } from '../components/call/GroupCallGrid';
import { getCall, getLiveKitToken, endCall as endCallApi } from '../api';
export default function CallScreen(props) {
    const { route } = props;
    if (route.params.callType === 'sfu') {
        return _jsx(GroupCallContent, { ...props });
    }
    return _jsx(P2PCallContent, { ...props });
}
function GroupCallContent({ route, navigation }) {
    const { callId, conversationId, isIncoming = false, livekitRoomName } = route.params;
    const safeAreaInsets = useSafeAreaInsets();
    const insets = Platform.OS === 'web'
        ? { top: 0, bottom: 0, left: 0, right: 0 }
        : safeAreaInsets;
    const [roomName, setRoomName] = useState(livekitRoomName || '');
    const [token, setToken] = useState(null);
    const [liveKitUrl, setLiveKitUrl] = useState('');
    const [statusMessage, setStatusMessage] = useState('Đang chuẩn bị cuộc gọi nhóm...');
    const [errorMessage, setErrorMessage] = useState(null);
    const [callDuration, setCallDuration] = useState(0);
    const [isEnding, setIsEnding] = useState(false);
    const timerRef = useRef(null);
    const socket = getSocket();
    const { localStream, remoteStreams, isConnected, error: liveKitError, connect, disconnect, toggleAudio, toggleVideo, isAudioEnabled, isVideoEnabled, } = useLiveKit({
        roomName,
        token: token ?? undefined,
        url: liveKitUrl,
    });
    useEffect(() => {
        let mounted = true;
        const prepareLiveKit = async () => {
            try {
                setErrorMessage(null);
                setStatusMessage('Đang lấy thông tin phòng...');
                let targetRoom = livekitRoomName || '';
                if (!targetRoom) {
                    const call = await getCall(callId);
                    if (!mounted)
                        return;
                    targetRoom = call?.metadata?.livekitRoomName || '';
                }
                if (!targetRoom) {
                    throw new Error('Không tìm thấy LiveKit room cho cuộc gọi này');
                }
                setRoomName(targetRoom);
                setStatusMessage('Đang tạo token LiveKit...');
                const tokenRes = await getLiveKitToken(callId);
                if (!mounted)
                    return;
                setToken(tokenRes.token);
                setLiveKitUrl(tokenRes.url);
                setStatusMessage('Đang kết nối tới LiveKit...');
            }
            catch (error) {
                console.error('❌ [GroupCall] Không thể chuẩn bị LiveKit:', error);
                if (!mounted)
                    return;
                setErrorMessage(error?.response?.data?.error || error?.message || 'Không thể chuẩn bị cuộc gọi nhóm');
            }
        };
        prepareLiveKit();
        return () => {
            mounted = false;
        };
    }, [callId, livekitRoomName]);
    useEffect(() => {
        if (!roomName || !token || !liveKitUrl)
            return;
        let mounted = true;
        (async () => {
            try {
                await connect();
            }
            catch (error) {
                console.error('❌ [GroupCall] Kết nối LiveKit thất bại:', error);
                if (mounted) {
                    setErrorMessage('Không thể kết nối LiveKit');
                }
            }
        })();
        return () => {
            mounted = false;
            disconnect();
        };
    }, [roomName, token, liveKitUrl, connect, disconnect]);
    useEffect(() => {
        if (liveKitError) {
            setErrorMessage(liveKitError);
        }
    }, [liveKitError]);
    useEffect(() => {
        if (isConnected) {
            setStatusMessage('Đang trong cuộc gọi nhóm');
            if (!timerRef.current) {
                timerRef.current = setInterval(() => {
                    setCallDuration((prev) => prev + 1);
                }, 1000);
            }
        }
        else {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        }
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [isConnected]);
    const participants = useMemo(() => {
        const list = [];
        if (localStream) {
            list.push({
                participantId: 'local',
                stream: localStream,
                isLocal: true,
                label: 'Bạn',
            });
        }
        remoteStreams.forEach((stream, participantId) => {
            list.push({
                participantId,
                stream,
                label: participantId,
            });
        });
        return list;
    }, [localStream, remoteStreams]);
    const handleEndCall = async () => {
        if (isEnding)
            return;
        setIsEnding(true);
        try {
            disconnect();
            socket?.emit('call:end', { callId });
            await endCallApi(callId).catch(() => undefined);
        }
        finally {
            setIsEnding(false);
            navigation.goBack();
        }
    };
    return (_jsxs(View, { style: groupStyles.container, children: [_jsxs(View, { style: [groupStyles.statusBar, { top: insets.top + 16 }], children: [_jsx(Text, { style: groupStyles.statusText, children: statusMessage }), callDuration > 0 && (_jsx(Text, { style: groupStyles.durationText, children: formatDuration(callDuration) }))] }), _jsx(View, { style: groupStyles.videoArea, children: participants.length > 0 ? (_jsx(GroupCallGrid, { participants: participants })) : (_jsx(View, { style: groupStyles.placeholder, children: errorMessage ? (_jsx(Text, { style: groupStyles.placeholderText, children: errorMessage })) : (_jsxs(_Fragment, { children: [_jsx(ActivityIndicator, { color: "#fff" }), _jsx(Text, { style: groupStyles.placeholderText, children: statusMessage })] })) })) }), errorMessage && (_jsx(View, { style: groupStyles.errorBanner, children: _jsx(Text, { style: groupStyles.errorText, children: errorMessage }) })), _jsxs(View, { style: [groupStyles.controls, { bottom: insets.bottom + 24 }], children: [_jsx(TouchableOpacity, { style: [
                            groupStyles.controlButton,
                            !isAudioEnabled && groupStyles.controlButtonDisabled,
                        ], onPress: toggleAudio, disabled: !isConnected, children: _jsx(Text, { style: groupStyles.controlText, children: isAudioEnabled ? '🎤' : '🔇' }) }), _jsx(TouchableOpacity, { style: [
                            groupStyles.controlButton,
                            !isVideoEnabled && groupStyles.controlButtonDisabled,
                        ], onPress: toggleVideo, disabled: !isConnected, children: _jsx(Text, { style: groupStyles.controlText, children: isVideoEnabled ? '📹' : '📷' }) }), _jsx(TouchableOpacity, { style: [groupStyles.controlButton, groupStyles.hangupButton], onPress: handleEndCall, disabled: isEnding, children: _jsx(Text, { style: groupStyles.controlText, children: "\uD83D\uDCDE" }) })] })] }));
}
function P2PCallContent({ route, navigation }) {
    const { callId, conversationId, isIncoming = false } = route.params;
    const isMobile = Platform.OS !== 'web';
    // Safe area insets - fallback to 0 for web
    const safeAreaInsets = useSafeAreaInsets();
    const insets = Platform.OS === 'web'
        ? { top: 0, bottom: 0, left: 0, right: 0 }
        : safeAreaInsets;
    const { width: screenWidth } = useWindowDimensions();
    const [callState, setCallState] = useState('ringing');
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [callDuration, setCallDuration] = useState(0);
    const [errorMessage, setErrorMessage] = useState(null);
    const [cameraPosition, setCameraPosition] = useState('front');
    const [isSpeakerOn, setIsSpeakerOn] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [currentFilter, setCurrentFilter] = useState('none');
    const [incomingReactions, setIncomingReactions] = useState([]);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [callParticipants, setCallParticipants] = useState([]);
    const webrtcService = useRef(null);
    const socket = getSocket();
    const intervalRef = useRef(null);
    const pendingSignalsRef = useRef([]);
    const offerHandledRef = useRef(false);
    const answerHandledRef = useRef(false);
    const offerRetryAttemptsRef = useRef(0);
    const requestOfferRetryRef = useRef(0);
    const answerWaitTimerRef = useRef(null);
    const lastRemoteIdRef = useRef(null);
    const scheduleOfferRetry = () => {
        // Caller-side: if chưa có answer sau khi gửi offer, thử gửi lại 2 lần
        if (isIncoming)
            return; // chỉ caller mới chủ động tạo offer
        if (offerRetryAttemptsRef.current >= 2)
            return;
        setTimeout(async () => {
            try {
                if (!answerHandledRef.current) {
                    offerRetryAttemptsRef.current += 1;
                    console.warn('⚠️ [CALLSCREEN] No answer yet - retry creating offer, attempt:', offerRetryAttemptsRef.current);
                    await createOffer();
                }
            }
            catch (e) {
                console.error('❌ [CALLSCREEN] Offer retry failed:', e);
            }
        }, 1500);
    };
    const requestOfferFromServer = (socketRef) => {
        try {
            const s = socketRef || getSocket();
            if (!s?.connected) {
                console.warn('⚠️ [CALLSCREEN] Socket not connected, cannot request offer');
                return;
            }
            console.log('📞 [CALLSCREEN] ===== REQUESTING OFFER FROM SERVER =====');
            console.log('📞 [CALLSCREEN] CallId:', callId);
            console.log('📞 [CALLSCREEN] Socket connected:', s.connected);
            console.log('📞 [CALLSCREEN] Socket ID:', s.id);
            s.emit('webrtc:request-offer', { callId });
            console.log('📞 [CALLSCREEN] ✅ Request offer emitted');
            console.log('📞 [CALLSCREEN] ===== END REQUEST OFFER =====');
        }
        catch (e) {
            console.error('❌ [CALLSCREEN] request-offer emit failed:', e);
        }
    };
    const hasPeerConnection = () => {
        const svc = webrtcService.current;
        return !!svc && !!svc['peerConnection'];
    };
    const processPendingSignals = async () => {
        if (!hasPeerConnection())
            return;
        const queue = pendingSignalsRef.current;
        pendingSignalsRef.current = [];
        for (const item of queue) {
            try {
                if (item.type === 'offer') {
                    await handleOffer(item.payload.offer);
                }
                else if (item.type === 'answer') {
                    await handleAnswer(item.payload.answer);
                }
                else if (item.type === 'ice') {
                    await handleIceCandidate(item.payload.candidate);
                }
            }
            catch (e) {
                console.error('❌ [CALLSCREEN] Error processing queued signal:', item.type, e);
            }
        }
    };
    useEffect(() => {
        console.log('📞 [CALLSCREEN] CallScreen mounted with params:', { callId, conversationId, isIncoming });
        console.log('📞 [CALLSCREEN] Platform:', Platform.OS);
        console.log('📞 [CALLSCREEN] Window location:', typeof window !== 'undefined' && window?.location ? window.location.href : 'N/A');
        initializeCall();
        setupSocketListeners();
        return () => {
            console.log('📞 [CALLSCREEN] CallScreen unmounting, cleaning up...');
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
            endCall();
        };
    }, []);
    const initializeCall = async () => {
        try {
            console.log('📞 [CALLSCREEN] Starting call initialization...');
            // Check WebRTC support first
            if (Platform.OS === 'web') {
                const webRTCSupport = checkWebRTCSupport();
                if (!webRTCSupport.supported) {
                    throw new Error(`WebRTC not supported: ${webRTCSupport.error}`);
                }
                console.log('📞 [CALLSCREEN] WebRTC support verified');
            }
            // Ensure socket is connected and stable before proceeding
            if (!socket || !socket.connected) {
                console.log('📞 [CALLSCREEN] Socket not connected, creating new connection...');
                // Create new socket connection instead of waiting for reconnection
                const token = await AsyncStorage.getItem('auth_token');
                if (token) {
                    const { connectSocket } = await import('../socket');
                    const newSocket = await connectSocket(token);
                    if (newSocket && newSocket.connected) {
                        console.log('📞 [CALLSCREEN] New socket created successfully');
                        // Update socket reference
                        if (socket) {
                            Object.assign(socket, newSocket);
                        }
                    }
                    else {
                        throw new Error('Failed to create new socket connection');
                    }
                }
                else {
                    throw new Error('No auth token available for socket connection');
                }
            }
            console.log('📞 [CALLSCREEN] Socket connection verified:', socket?.connected);
            // Setup socket listeners after socket is connected
            console.log('📞 [CALLSCREEN] Setting up socket listeners after connection...');
            setupSocketListeners();
            // Get target user ID from conversation context
            const targetUserId = await getTargetUserIdFromStorage();
            console.log('📞 [CALLSCREEN] Target user ID:', targetUserId);
            // Double-check socket stability before WebRTC initialization
            console.log('📞 [CALLSCREEN] Final socket check before WebRTC:', {
                connected: socket?.connected,
                id: socket?.id,
                transport: socket?.io?.engine?.transport?.name
            });
            if (!socket || !socket.connected) {
                console.log('📞 [CALLSCREEN] Socket not stable, attempting to reconnect...');
                // Try to reconnect socket
                const token = await AsyncStorage.getItem('auth_token');
                if (token) {
                    const { connectSocket } = await import('../socket');
                    const newSocket = await connectSocket(token);
                    if (newSocket && newSocket.connected) {
                        console.log('📞 [CALLSCREEN] Socket reconnected successfully');
                        // Update socket reference
                        if (socket) {
                            Object.assign(socket, newSocket);
                        }
                    }
                    else {
                        throw new Error('Failed to reconnect socket for WebRTC initialization');
                    }
                }
                else {
                    throw new Error('No auth token available for socket reconnection');
                }
            }
            // Initialize WebRTC service with retry logic
            let retryCount = 0;
            const maxRetries = 3;
            while (retryCount < maxRetries) {
                try {
                    console.log(`📞 [CALLSCREEN] WebRTC initialization attempt ${retryCount + 1}/${maxRetries}`);
                    webrtcService.current = new WebRTCService(callId, targetUserId, socket);
                    console.log('📞 [CALLSCREEN] WebRTC service created');
                    // Set up remote stream callback
                    webrtcService.current.onRemoteStream = (stream) => {
                        console.log('📞 [CALLSCREEN] ===== REMOTE STREAM CALLBACK =====');
                        console.log('📞 [CALLSCREEN] Remote stream received:', stream);
                        console.log('📞 [CALLSCREEN] Remote stream active:', stream.active);
                        console.log('📞 [CALLSCREEN] Remote stream tracks:', stream.getTracks());
                        console.log('📞 [CALLSCREEN] Setting remote stream state...');
                        // Avoid cloning to preserve stream identity for the <video> element
                        // Only update state if stream id actually changed
                        try {
                            const newId = stream?.id || '';
                            if (lastRemoteIdRef.current !== newId) {
                                lastRemoteIdRef.current = newId;
                                setRemoteStream(stream);
                            }
                            else {
                                console.log('📞 [CALLSCREEN] Remote stream unchanged, skip state set');
                            }
                        }
                        catch {
                            setRemoteStream(stream);
                        }
                        console.log('📞 [CALLSCREEN] Remote stream state set successfully');
                        // Chỉ chuyển sang active khi có ít nhất 1 video track ở trạng thái live
                        try {
                            const hasLiveVideo = stream
                                .getVideoTracks?.()
                                ?.some((t) => t?.readyState === 'live');
                            if (hasLiveVideo && callState !== 'active') {
                                setCallState('active');
                                if (!intervalRef.current) {
                                    startCallTimer();
                                }
                            }
                        }
                        catch { }
                        console.log('📞 [CALLSCREEN] ===== END REMOTE STREAM CALLBACK =====');
                    };
                    console.log('📞 [CALLSCREEN] Initializing WebRTC call...');
                    // Ensure target user is set correctly before init
                    webrtcService.current.updateTargetUser(targetUserId);
                    const stream = await webrtcService.current.initializeCall();
                    console.log('📞 [CALLSCREEN] WebRTC call initialized successfully');
                    setLocalStream(stream);
                    // Process any queued signals that came early
                    await processPendingSignals();
                    // Success - break out of retry loop
                    break;
                }
                catch (error) {
                    retryCount++;
                    console.error(`❌ [CALLSCREEN] WebRTC initialization attempt ${retryCount} failed:`, error);
                    if (retryCount >= maxRetries) {
                        throw error; // Re-throw if all retries failed
                    }
                    // Wait before retry
                    console.log(`📞 [CALLSCREEN] Waiting 2s before retry ${retryCount + 1}...`);
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            }
            // Call đã được tạo bởi backend, không cần emit call:initiate nữa
            console.log('📞 [CALLSCREEN] Call initialized with callId:', callId);
        }
        catch (error) {
            console.error('❌ [CALLSCREEN] Error initializing call:', error);
            console.error('❌ [CALLSCREEN] Error details:', error);
            console.log('📞 [CALLSCREEN] NOT calling endCall() - keeping window open for debugging');
            // Set error message for UI display
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            setErrorMessage(`Initialization error: ${errorMsg}`);
            // Don't end call immediately, show error state instead
            setCallState('ringing'); // Keep in ringing state
            console.log('📞 [CALLSCREEN] Call will remain in ringing state due to initialization error');
            // Only end call if it's a critical error
            if (error instanceof Error && error.message.includes('Permission denied')) {
                console.log('📞 [CALLSCREEN] Camera/microphone permission denied - this is expected');
                setErrorMessage('Camera/microphone permission denied. Please allow access and try again.');
            }
            else {
                console.log('📞 [CALLSCREEN] Non-critical error, keeping call alive');
            }
        }
    };
    // Get target user ID from call participants or storage
    const getTargetUserIdFromStorage = async () => {
        try {
            const userId = await AsyncStorage.getItem('user_id');
            console.log('📞 [CALLSCREEN] Current userId:', userId);
            console.log('📞 [CALLSCREEN] Call participants:', callParticipants);
            // First, try to get from call participants (most reliable)
            if (callParticipants.length > 0) {
                const targetUserId = callParticipants.find(id => id !== userId);
                if (targetUserId) {
                    console.log('📞 [CALLSCREEN] ✅ Using targetUserId from call participants:', targetUserId);
                    return targetUserId;
                }
            }
            // Try to get from opponent info via API
            try {
                const { getOpponentInfo } = await import('../api');
                const opponentInfo = await getOpponentInfo(conversationId);
                if (opponentInfo && opponentInfo.user && opponentInfo.user._id) {
                    const targetUserId = opponentInfo.user._id;
                    console.log('📞 [CALLSCREEN] ✅ Using targetUserId from opponent info:', targetUserId);
                    return targetUserId;
                }
            }
            catch (apiError) {
                console.warn('⚠️ [CALLSCREEN] Failed to get opponent info from API:', apiError);
            }
            // Try to get from all conversations and find this one
            try {
                const { getConversations } = await import('../api');
                const conversations = await getConversations();
                const conversation = conversations.find(conv => conv._id === conversationId);
                if (conversation && conversation.members) {
                    const targetUserId = conversation.members.find((id) => id !== userId);
                    if (targetUserId) {
                        console.log('📞 [CALLSCREEN] ✅ Using targetUserId from conversation members:', targetUserId);
                        // Update callParticipants for future use
                        setCallParticipants(conversation.members);
                        return targetUserId;
                    }
                }
            }
            catch (apiError) {
                console.warn('⚠️ [CALLSCREEN] Failed to get conversations from API:', apiError);
            }
            // Try to get from conversation context in storage
            const conversationData = await AsyncStorage.getItem(`conversation_${conversationId}`);
            if (conversationData) {
                const data = JSON.parse(conversationData);
                if (data.targetUserId) {
                    console.log('📞 [CALLSCREEN] ✅ Using targetUserId from storage:', data.targetUserId);
                    return data.targetUserId;
                }
                // Try to get from members in stored conversation
                if (data.members && Array.isArray(data.members)) {
                    const targetUserId = data.members.find((id) => id !== userId);
                    if (targetUserId) {
                        console.log('📞 [CALLSCREEN] ✅ Using targetUserId from stored conversation members:', targetUserId);
                        return targetUserId;
                    }
                }
            }
            // Last resort: return empty string, let backend resolve
            console.warn('⚠️ [CALLSCREEN] No targetUserId found, backend will resolve from call participants');
            return '';
        }
        catch (error) {
            console.error('❌ [CALLSCREEN] Error getting target user ID:', error);
            return '';
        }
    };
    const setupSocketListeners = () => {
        console.log('📞 [CALLSCREEN] Setting up socket listeners for callId:', callId);
        const socket = getSocket();
        console.log('📞 [CALLSCREEN] Socket connection state:', socket?.connected ? 'Connected' : 'Disconnected');
        console.log('📞 [CALLSCREEN] Socket ID:', socket?.id);
        console.log('📞 [CALLSCREEN] Socket transport:', socket?.io?.engine?.transport?.name);
        console.log('📞 [CALLSCREEN] Is incoming call:', isIncoming);
        // Wait for socket to be fully connected before setting up listeners
        if (!socket?.connected) {
            console.log('📞 [CALLSCREEN] Socket not connected, waiting for connection...');
            socket?.on('connect', () => {
                console.log('📞 [CALLSCREEN] Socket connected, setting up listeners now...');
                setupListenersOnConnected();
            });
            return;
        }
        console.log('📞 [CALLSCREEN] Socket already connected, setting up listeners immediately...');
        setupListenersOnConnected();
    };
    const setupListenersOnConnected = () => {
        const socket = getSocket();
        console.log('📞 [CALLSCREEN] Setting up listeners on connected socket:', socket?.id);
        // Optional: if server supports, respond to callee's request to resend offer
        socket?.on('webrtc:request-offer', async (data) => {
            try {
                console.log('📞 [CALLSCREEN] Received webrtc:request-offer:', data);
                if (!isIncoming) {
                    await createOffer();
                }
            }
            catch (e) {
                console.error('❌ [CALLSCREEN] Error responding to request-offer:', e);
            }
        });
        // If server asks this side (caller) to send offer to a specific target, honor that target
        socket?.on('webrtc:please-send-offer', async (data) => {
            try {
                console.log('📞 [CALLSCREEN] Received webrtc:please-send-offer:', data);
                if (!isIncoming) {
                    // Ensure targetUserId matches server's direction
                    if (webrtcService.current && data?.targetUserId) {
                        webrtcService.current.updateTargetUser(data.targetUserId);
                    }
                    await createOffer();
                }
            }
            catch (e) {
                console.error('❌ [CALLSCREEN] Error handling please-send-offer:', e);
            }
        });
        // If server asks caller to resend answer (rare), try to resend cached local answer
        socket?.on('webrtc:please-send-answer', async (data) => {
            try {
                console.log('📞 [CALLSCREEN] Received webrtc:please-send-answer:', data);
                if (!isIncoming && webrtcService.current) {
                    const ans = webrtcService.current.getLastLocalAnswer?.();
                    if (ans) {
                        const s = getSocket();
                        s?.emit('webrtc:answer', { callId, targetUserId: data?.targetUserId, answer: ans });
                        console.log('📞 [CALLSCREEN] Resent cached local answer');
                    }
                }
            }
            catch (e) {
                console.error('❌ [CALLSCREEN] Error handling please-send-answer:', e);
            }
        });
        console.log('📞 [CALLSCREEN] Socket connected state in setupListenersOnConnected:', socket?.connected);
        // Debug: Log all socket events
        socket?.onAny((eventName, ...args) => {
            console.log('🔍 [CALLSCREEN DEBUG] All socket events:', eventName, args.length > 0 ? args[0] : '');
            if (eventName.includes('webrtc') || eventName.includes('call')) {
                console.log('🔍 [CALLSCREEN DEBUG] Important socket event received:', eventName, args);
            }
        });
        // Listen for call:created to get participants
        socket?.on('call:created', (data) => {
            if (data.callId === callId && data.participants) {
                console.log('📞 [CALLSCREEN] Call created with participants:', data.participants);
                setCallParticipants(data.participants);
            }
        });
        // Listen for call events
        socket?.on('call:accepted', (data) => {
            console.log('📞 [CALLSCREEN] Call accepted:', data);
            console.log('📞 [CALLSCREEN] Call accepted - Current callId:', callId);
            console.log('📞 [CALLSCREEN] Call accepted - Event callId:', data.callId);
            console.log('📞 [CALLSCREEN] Call accepted - Is incoming:', isIncoming);
            if (data.callId === callId) {
                // Update participants if provided
                if (data.participants) {
                    setCallParticipants(data.participants);
                }
                setCallState('connecting');
                console.log('📞 [CALLSCREEN] Starting WebRTC negotiation...');
                // Start WebRTC negotiation immediately - caller creates offer
                setTimeout(async () => {
                    if (!isIncoming) {
                        console.log('📞 [CALLSCREEN] Caller creating offer in call:accepted...');
                        // Update targetUserId from participants before creating offer
                        const targetUserId = await getTargetUserIdFromStorage();
                        if (targetUserId && webrtcService.current) {
                            webrtcService.current.updateTargetUser(targetUserId);
                        }
                        createOffer();
                    }
                    else {
                        console.log('📞 [CALLSCREEN] Receiver accepted call, waiting for offer...');
                        // Update WebRTC service with fresh socket reference for receiver too
                        if (webrtcService.current) {
                            const currentSocket = getSocket();
                            webrtcService.current.updateSocket(currentSocket);
                            // Update targetUserId from participants
                            const targetUserId = await getTargetUserIdFromStorage();
                            if (targetUserId) {
                                webrtcService.current.updateTargetUser(targetUserId);
                            }
                        }
                    }
                }, 500); // Faster response
            }
            else {
                console.log('📞 [CALLSCREEN] Call accepted event callId mismatch, ignoring...');
            }
        });
        socket?.on('call:rejected', (data) => {
            console.log('📞 [CALLSCREEN] Received call:rejected event:', data);
            if (data.callId === callId) {
                console.log('📞 [CALLSCREEN] Call rejected for current callId, ending call.');
                endCall();
            }
        });
        // Handle incoming vs outgoing calls differently
        if (isIncoming) {
            console.log('📞 [CALLSCREEN] Incoming call - auto-accepting after delay');
            // Auto-accept incoming call after delay
            setTimeout(() => {
                console.log('📞 [CALLSCREEN] Incoming call - auto-accepting...');
                acceptCall();
            }, 1000); // 1 second delay for auto-accept
            // NOTE: Receiver should NOT create offer - only caller creates offer
            // Receiver waits for offer from caller and creates answer
            // Proactively request offer in case it was missed earlier
            setTimeout(() => {
                console.log('📞 [CALLSCREEN] Incoming call - checking if offer received...');
                if (!offerHandledRef.current) {
                    console.log('📞 [CALLSCREEN] No offer yet, requesting from server...');
                    requestOfferFromServer(socket);
                    // Retry multiple times if still no offer
                    const retryRequestOffer = (attempt, maxAttempts = 5) => {
                        setTimeout(() => {
                            if (!offerHandledRef.current && attempt < maxAttempts) {
                                console.log(`📞 [CALLSCREEN] Still no offer, retrying request (attempt ${attempt + 1}/${maxAttempts})...`);
                                requestOfferFromServer(socket);
                                retryRequestOffer(attempt + 1, maxAttempts);
                            }
                            else if (!offerHandledRef.current) {
                                console.error('❌ [CALLSCREEN] No offer received after multiple requests!');
                            }
                        }, 1000);
                    };
                    retryRequestOffer(0);
                }
                else {
                    console.log('📞 [CALLSCREEN] Offer already received, no need to request');
                }
            }, 1000); // Wait 1 second before first request
        }
        else {
            console.log('📞 [CALLSCREEN] Outgoing call - auto-accepting');
            // Wait for socket to be connected before accepting
            const waitForSocketAndAccept = async () => {
                // Get fresh socket reference
                const currentSocket = getSocket();
                console.log('📞 [CALLSCREEN] Checking socket status:', {
                    socket: !!socket,
                    socketConnected: socket?.connected,
                    currentSocket: !!currentSocket,
                    currentSocketConnected: currentSocket?.connected,
                    currentSocketId: currentSocket?.id
                });
                if (currentSocket && currentSocket.connected) {
                    console.log('📞 [CALLSCREEN] Socket is connected, accepting call now...');
                    acceptCall();
                    // Update WebRTC service with fresh socket reference
                    if (webrtcService.current) {
                        webrtcService.current.updateSocket(currentSocket);
                    }
                    // Update targetUserId before creating offer
                    const targetUserId = await getTargetUserIdFromStorage();
                    if (targetUserId && webrtcService.current) {
                        console.log('📞 [CALLSCREEN] Updating targetUserId before creating offer:', targetUserId);
                        webrtcService.current.updateTargetUser(targetUserId);
                    }
                    // Create offer immediately for caller (don't wait for call:accepted)
                    setTimeout(async () => {
                        console.log('📞 [CALLSCREEN] Caller creating offer NOW (outgoing call)...');
                        try {
                            await createOffer();
                            scheduleOfferRetry();
                        }
                        catch (error) {
                            console.error('❌ [CALLSCREEN] Error creating offer in outgoing call:', error);
                        }
                    }, 1500); // Give a bit more time for WebRTC to initialize
                }
                else {
                    console.log('📞 [CALLSCREEN] Socket not ready yet, retrying in 500ms...');
                    setTimeout(waitForSocketAndAccept, 500);
                }
            };
            setTimeout(waitForSocketAndAccept, 1000);
        }
        socket?.on('webrtc:offer', async (data) => {
            console.log('📞 [CALLSCREEN] Received WebRTC offer:', data);
            console.log('📞 [CALLSCREEN] Socket state when receiving offer:', {
                connected: socket?.connected,
                id: socket?.id
            });
            console.log('📞 [CALLSCREEN] Offer callId:', data.callId, 'Current callId:', callId);
            if (data.callId === callId || !offerHandledRef.current) {
                console.log('📞 [CALLSCREEN] Processing offer for current call...');
                if (!hasPeerConnection()) {
                    console.warn('⚠️ [CALLSCREEN] PeerConnection not ready - queueing offer');
                    pendingSignalsRef.current.push({ type: 'offer', payload: data });
                    // Try processing soon
                    setTimeout(processPendingSignals, 200);
                    return;
                }
                await handleOffer(data.offer);
                offerHandledRef.current = true;
            }
            else {
                console.log('📞 [CALLSCREEN] Ignoring offer for different callId:', data.callId);
            }
        });
        console.log('📞 [CALLSCREEN] Socket listeners setup complete - waiting for webrtc:offer...');
        socket?.on('webrtc:answer', async (data) => {
            console.log('📞 [CALLSCREEN] ===== RECEIVED WEBRTC ANSWER =====');
            console.log('📞 [CALLSCREEN] Received WebRTC answer:', data);
            console.log('📞 [CALLSCREEN] Answer data:', data);
            console.log('📞 [CALLSCREEN] Answer type:', data.answer?.type);
            console.log('📞 [CALLSCREEN] Answer sdp length:', data.answer?.sdp?.length);
            console.log('📞 [CALLSCREEN] Target user ID:', data.targetUserId);
            console.log('📞 [CALLSCREEN] Call ID:', data.callId);
            console.log('📞 [CALLSCREEN] Current call ID:', callId);
            console.log('📞 [CALLSCREEN] Current target user ID:', await getTargetUserIdFromStorage());
            console.log('📞 [CALLSCREEN] Socket state when receiving answer:', {
                connected: socket?.connected,
                id: socket?.id,
                transport: socket?.io.engine.transport.name
            });
            if (data.callId === callId || !answerHandledRef.current) {
                console.log('📞 [CALLSCREEN] ✅ Answer is for current call, processing...');
                if (!hasPeerConnection()) {
                    console.warn('⚠️ [CALLSCREEN] PeerConnection not ready - queueing answer');
                    pendingSignalsRef.current.push({ type: 'answer', payload: data });
                    setTimeout(processPendingSignals, 200);
                    return;
                }
                await handleAnswer(data.answer);
                console.log('📞 [CALLSCREEN] ✅ Answer processing completed');
                answerHandledRef.current = true;
                if (answerWaitTimerRef.current) {
                    clearTimeout(answerWaitTimerRef.current);
                    answerWaitTimerRef.current = null;
                }
            }
            else {
                console.log('📞 [CALLSCREEN] ❌ Answer is not for current call, ignoring');
                console.log('📞 [CALLSCREEN] ❌ Call ID match:', data.callId === callId);
                console.log('📞 [CALLSCREEN] ❌ Target user ID match:', data.targetUserId === await getTargetUserIdFromStorage());
            }
            console.log('📞 [CALLSCREEN] ===== END WEBRTC ANSWER =====');
        });
        socket?.on('webrtc:ice-candidate', async (data) => {
            console.log('📞 [CALLSCREEN] Received ICE candidate:', data);
            console.log('📞 [CALLSCREEN] Socket state when receiving ICE candidate:', {
                connected: socket?.connected,
                id: socket?.id
            });
            if (data.callId === callId) {
                console.log('📞 [CALLSCREEN] Processing ICE candidate for current call...');
                if (!hasPeerConnection()) {
                    console.warn('⚠️ [CALLSCREEN] PeerConnection not ready - queueing ICE');
                    pendingSignalsRef.current.push({ type: 'ice', payload: data });
                    setTimeout(processPendingSignals, 200);
                    return;
                }
                await handleIceCandidate(data.candidate);
            }
            else {
                console.log('📞 [CALLSCREEN] Ignoring ICE candidate for different callId:', data.callId);
            }
        });
        // Listen for call reactions
        socket?.on('call:reaction', (data) => {
            if (data.callId === callId) {
                console.log('🎉 [CALLSCREEN] Received reaction:', data.emoji);
                setIncomingReactions(prev => [...prev, { emoji: data.emoji, timestamp: data.timestamp }]);
            }
        });
    };
    const createOffer = async () => {
        try {
            console.log('📞 [CALLSCREEN] ===== CREATING OFFER =====');
            console.log('📞 [CALLSCREEN] CallId:', callId);
            console.log('📞 [CALLSCREEN] IsIncoming:', isIncoming);
            console.log('📞 [CALLSCREEN] WebRTC Service exists:', !!webrtcService.current);
            if (!webrtcService.current) {
                console.error('❌ [CALLSCREEN] WebRTC service not initialized!');
                return;
            }
            // Ensure WebRTC service has fresh socket reference
            const currentSocket = getSocket();
            console.log('📞 [CALLSCREEN] Updating WebRTC service with fresh socket before creating offer:', {
                socketConnected: currentSocket?.connected,
                socketId: currentSocket?.id
            });
            webrtcService.current.updateSocket(currentSocket);
            // Update targetUserId one more time
            const targetUserId = await getTargetUserIdFromStorage();
            if (targetUserId) {
                console.log('📞 [CALLSCREEN] Updating targetUserId before creating offer:', targetUserId);
                webrtcService.current.updateTargetUser(targetUserId);
            }
            else {
                console.warn('⚠️ [CALLSCREEN] No targetUserId, backend will resolve from call participants');
            }
            await webrtcService.current.createOffer();
            console.log('📞 [CALLSCREEN] ✅ Offer created and emitted successfully');
            console.log('📞 [CALLSCREEN] ===== END CREATING OFFER =====');
            // Start waiting for answer; if not received, trigger ICE restart re-offer
            if (answerWaitTimerRef.current)
                clearTimeout(answerWaitTimerRef.current);
            answerWaitTimerRef.current = setTimeout(async () => {
                if (!answerHandledRef.current) {
                    try {
                        console.warn('⚠️ [CALLSCREEN] No answer yet, attempting ICE restart re-offer');
                        await webrtcService.current?.createOffer({ iceRestart: true });
                    }
                    catch (e) {
                        console.error('❌ [CALLSCREEN] ICE restart re-offer failed:', e);
                    }
                }
            }, 2000);
        }
        catch (error) {
            console.error('❌ [CALLSCREEN] Error creating offer:', error);
            // Retry once after brief delay in case PC not ready yet
            setTimeout(async () => {
                try {
                    console.log('📞 [CALLSCREEN] Retrying createOffer after error...');
                    await webrtcService.current?.createOffer();
                }
                catch (e) {
                    console.error('❌ [CALLSCREEN] Retry createOffer failed:', e);
                }
            }, 500);
        }
    };
    const handleOffer = async (offer) => {
        try {
            console.log('📞 [CALLSCREEN] ===== HANDLING INCOMING OFFER =====');
            console.log('📞 [CALLSCREEN] Offer type:', offer?.type);
            console.log('📞 [CALLSCREEN] Offer SDP length:', offer?.sdp?.length);
            console.log('📞 [CALLSCREEN] WebRTC service exists:', !!webrtcService.current);
            if (!webrtcService.current) {
                console.error('❌ [CALLSCREEN] WebRTC service not initialized!');
                return;
            }
            // Ensure WebRTC service has fresh socket reference
            const currentSocket = getSocket();
            console.log('📞 [CALLSCREEN] Updating WebRTC service with fresh socket before handling offer:', {
                socketConnected: currentSocket?.connected,
                socketId: currentSocket?.id
            });
            webrtcService.current.updateSocket(currentSocket);
            // Update targetUserId before handling offer
            const targetUserId = await getTargetUserIdFromStorage();
            if (targetUserId) {
                console.log('📞 [CALLSCREEN] Updating targetUserId before handling offer:', targetUserId);
                webrtcService.current.updateTargetUser(targetUserId);
            }
            await webrtcService.current.handleOffer(offer);
            console.log('📞 [CALLSCREEN] ✅ Offer handled successfully, answer should be created automatically');
            console.log('📞 [CALLSCREEN] ===== END HANDLING OFFER =====');
        }
        catch (error) {
            console.error('❌ [CALLSCREEN] Error handling offer:', error);
            console.error('❌ [CALLSCREEN] Error details:', error);
        }
    };
    const handleAnswer = async (answer) => {
        try {
            console.log('📞 [CALLSCREEN] Handling incoming answer:', answer);
            // Ensure WebRTC service has fresh socket reference
            if (webrtcService.current) {
                const currentSocket = getSocket();
                console.log('📞 [CALLSCREEN] Updating WebRTC service with fresh socket before handling answer:', {
                    socketConnected: currentSocket?.connected,
                    socketId: currentSocket?.id
                });
                webrtcService.current.updateSocket(currentSocket);
            }
            await webrtcService.current?.handleAnswer(answer);
            console.log('📞 [CALLSCREEN] Answer handled successfully');
        }
        catch (error) {
            console.error('❌ [CALLSCREEN] Error handling answer:', error);
        }
    };
    const handleIceCandidate = async (candidate) => {
        try {
            await webrtcService.current?.handleIceCandidate(candidate);
        }
        catch (error) {
            console.error('Error handling ICE candidate:', error);
        }
    };
    const startCallTimer = () => {
        intervalRef.current = setInterval(() => {
            setCallDuration(prev => prev + 1);
        }, 1000);
    };
    const toggleMute = () => {
        const muted = webrtcService.current?.toggleMute();
        setIsMuted(muted || false);
    };
    const toggleVideo = () => {
        const enabled = webrtcService.current?.toggleVideo();
        setIsVideoEnabled(enabled || false);
    };
    const switchCamera = async () => {
        try {
            const success = await webrtcService.current?.switchCamera();
            if (success) {
                const newPosition = webrtcService.current?.getCameraPosition() || 'front';
                setCameraPosition(newPosition);
            }
        }
        catch (error) {
            console.error('Error switching camera:', error);
        }
    };
    const toggleSpeaker = () => {
        const speakerState = webrtcService.current?.toggleSpeaker();
        setIsSpeakerOn(speakerState || false);
    };
    const handleFilterChange = async (filter) => {
        setCurrentFilter(filter);
        await webrtcService.current?.applyFilter(filter);
    };
    const handleReaction = (emoji) => {
        socket?.emit('call:reaction', {
            callId,
            emoji
        });
    };
    const toggleScreenShare = async () => {
        if (isScreenSharing) {
            await webrtcService.current?.stopScreenShare();
            setIsScreenSharing(false);
            socket?.emit('call:screen-sharing-stopped', { callId });
        }
        else {
            const success = await webrtcService.current?.startScreenShare();
            if (success) {
                setIsScreenSharing(true);
                socket?.emit('call:screen-sharing-started', { callId });
            }
        }
    };
    const enterPictureInPicture = async () => {
        if (Platform.OS === 'web' && remoteStream) {
            try {
                const videoElement = document.querySelector('video');
                if (videoElement && videoElement.requestPictureInPicture) {
                    await videoElement.requestPictureInPicture();
                }
            }
            catch (error) {
                console.error('Error entering Picture-in-Picture:', error);
            }
        }
    };
    const endCall = () => {
        console.log('📞 [CALLSCREEN] endCall() triggered. Closing window...');
        setCallState('ended');
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }
        webrtcService.current?.endCall();
        if (Platform.OS === 'web') {
            // Add delay to ensure logs are flushed
            setTimeout(() => {
                console.log('📞 [CALLSCREEN] Executing window.close() after delay.');
                window.close();
            }, 100);
        }
        else {
            navigation.goBack();
        }
    };
    const acceptCall = () => {
        console.log('📞 [CALLSCREEN] acceptCall() called for callId:', callId);
        // Get fresh socket reference
        const currentSocket = getSocket();
        console.log('📞 [CALLSCREEN] Socket state when accepting:', {
            socket: !!socket,
            socketConnected: socket?.connected,
            currentSocket: !!currentSocket,
            currentSocketConnected: currentSocket?.connected,
            currentSocketId: currentSocket?.id
        });
        if (currentSocket && currentSocket.connected) {
            console.log('📞 [CALLSCREEN] Emitting call:accept event...');
            currentSocket.emit('call:accept', { callId });
            console.log('📞 [CALLSCREEN] call:accept event emitted successfully');
            // Update WebRTC service with fresh socket reference
            if (webrtcService.current) {
                webrtcService.current.updateSocket(currentSocket);
            }
        }
        else {
            console.error('❌ [CALLSCREEN] Cannot accept call - socket not connected');
        }
        setCallState('connecting');
    };
    const rejectCall = () => {
        socket?.emit('call:reject', { callId });
        endCall();
    };
    return (_jsxs(View, { style: styles.container, children: [_jsx(View, { style: styles.remoteVideoContainer, children: remoteStream ? (_jsx(WebRTCView, { streamURL: Platform.OS === 'web' ? remoteStream : remoteStream.toURL(), style: styles.remoteVideo, mirror: false, muted: Platform.OS === 'web' ? false : true, onVideoStarted: () => {
                        // Extra safety: if video starts playing but state not active yet
                        if (callState !== 'active') {
                            setCallState('active');
                            if (!intervalRef.current)
                                startCallTimer();
                        }
                    } })) : (_jsx(View, { style: styles.remoteVideoPlaceholder, children: _jsx(Text, { style: styles.placeholderText, children: "Waiting for video..." }) })) }), _jsx(View, { style: [
                    styles.localVideoContainer,
                    isMobile && styles.localVideoContainerMobile,
                    { top: insets.top + (isMobile ? 10 : 20) }
                ], children: localStream && (_jsx(WebRTCView, { streamURL: Platform.OS === 'web' ? localStream : localStream.toURL(), style: styles.localVideo, mirror: true, muted: true, onVideoStarted: () => {
                        // No-op for local; keep for consistency
                    } })) }), callState === 'active' && webrtcService.current && (_jsx(View, { style: [
                    { top: insets.top + (isMobile ? 10 : 20) },
                    isMobile && { left: 10, right: 'auto' }
                ], children: _jsx(CallQualityIndicator, { peerConnection: webrtcService.current.getPeerConnection(), visible: true, compact: isMobile }) })), _jsxs(View, { style: [
                    styles.statusContainer,
                    { top: insets.top + (isMobile ? 60 : 50) }
                ], children: [_jsxs(Text, { style: [
                            styles.statusText,
                            isMobile && styles.statusTextMobile
                        ], children: [callState === 'ringing' && (isIncoming ? 'Cuộc gọi đến...' : 'Đang gọi...'), callState === 'connecting' && 'Đang kết nối...', callState === 'active' && formatDuration(callDuration)] }), errorMessage && (_jsxs(View, { style: styles.errorContainer, children: [_jsx(Text, { style: styles.errorText, children: errorMessage }), errorMessage.includes('HTTPS') && (_jsxs(View, { children: [_jsxs(Text, { style: styles.errorHelpText, children: ["Try accessing via: https://", (typeof window !== 'undefined' && window?.location) ? window.location.hostname : 'your-domain', ":", (typeof window !== 'undefined' && window?.location) ? window.location.port : 'port'] }), _jsx(Text, { style: styles.errorHelpText, children: "Or run: npm run web:https" })] }))] }))] }), _jsxs(View, { style: [
                    styles.controlsContainer,
                    { bottom: insets.bottom + (isMobile ? 20 : 50) },
                    isMobile && styles.controlsContainerMobile
                ], children: [callState === 'ringing' && isIncoming && (_jsxs(_Fragment, { children: [_jsx(TouchableOpacity, { style: [
                                    styles.controlButton,
                                    styles.acceptButton,
                                    isMobile && styles.controlButtonMobile
                                ], onPress: acceptCall, activeOpacity: 0.7, children: _jsx(Text, { style: [styles.controlText, isMobile && styles.controlTextMobile], children: "\u2713" }) }), _jsx(TouchableOpacity, { style: [
                                    styles.controlButton,
                                    styles.rejectButton,
                                    isMobile && styles.controlButtonMobile
                                ], onPress: rejectCall, activeOpacity: 0.7, children: _jsx(Text, { style: [styles.controlText, isMobile && styles.controlTextMobile], children: "\u2715" }) })] })), callState === 'active' && (_jsx(_Fragment, { children: isMobile ? (
                        /* Mobile: Scrollable horizontal row */
                        _jsxs(ScrollView, { horizontal: true, showsHorizontalScrollIndicator: false, contentContainerStyle: styles.controlsScrollContent, style: styles.controlsScrollView, children: [_jsx(TouchableOpacity, { style: [
                                        styles.controlButton,
                                        isMuted ? styles.mutedButton : styles.normalButton,
                                        styles.controlButtonMobile
                                    ], onPress: toggleMute, activeOpacity: 0.7, children: _jsx(Text, { style: styles.controlTextMobile, children: isMuted ? '🔇' : '🎤' }) }), _jsx(TouchableOpacity, { style: [
                                        styles.controlButton,
                                        isVideoEnabled ? styles.normalButton : styles.mutedButton,
                                        styles.controlButtonMobile
                                    ], onPress: toggleVideo, activeOpacity: 0.7, children: _jsx(Text, { style: styles.controlTextMobile, children: isVideoEnabled ? '📹' : '📷' }) }), _jsx(TouchableOpacity, { style: [
                                        styles.controlButton,
                                        styles.normalButton,
                                        styles.controlButtonMobile
                                    ], onPress: switchCamera, activeOpacity: 0.7, children: _jsx(Text, { style: styles.controlTextMobile, children: "\uD83D\uDD04" }) }), _jsx(TouchableOpacity, { style: [
                                        styles.controlButton,
                                        isSpeakerOn ? styles.normalButton : styles.mutedButton,
                                        styles.controlButtonMobile
                                    ], onPress: toggleSpeaker, activeOpacity: 0.7, children: _jsx(Text, { style: styles.controlTextMobile, children: isSpeakerOn ? '🔊' : '🔈' }) }), _jsx(TouchableOpacity, { style: [
                                        styles.controlButton,
                                        currentFilter !== 'none' ? styles.normalButton : styles.mutedButton,
                                        styles.controlButtonMobile
                                    ], onPress: () => setShowFilters(!showFilters), activeOpacity: 0.7, children: _jsx(Text, { style: styles.controlTextMobile, children: "\uD83C\uDFA8" }) }), _jsx(TouchableOpacity, { style: [
                                        styles.controlButton,
                                        styles.endButton,
                                        styles.controlButtonMobile,
                                        styles.endButtonMobile
                                    ], onPress: endCall, activeOpacity: 0.7, children: _jsx(Text, { style: styles.controlTextMobile, children: "\uD83D\uDCDE" }) })] })) : (
                        /* Web: Single row without scroll */
                        _jsxs(View, { style: styles.controlsRow, children: [_jsx(TouchableOpacity, { style: [
                                        styles.controlButton,
                                        isMuted ? styles.mutedButton : styles.normalButton
                                    ], onPress: toggleMute, activeOpacity: 0.7, children: _jsx(Text, { style: styles.controlText, children: isMuted ? '🔇' : '🎤' }) }), _jsx(TouchableOpacity, { style: [
                                        styles.controlButton,
                                        isVideoEnabled ? styles.normalButton : styles.mutedButton
                                    ], onPress: toggleVideo, activeOpacity: 0.7, children: _jsx(Text, { style: styles.controlText, children: isVideoEnabled ? '📹' : '📷' }) }), _jsx(TouchableOpacity, { style: [
                                        styles.controlButton,
                                        styles.normalButton
                                    ], onPress: switchCamera, activeOpacity: 0.7, children: _jsx(Text, { style: styles.controlText, children: "\uD83D\uDD04" }) }), _jsx(TouchableOpacity, { style: [
                                        styles.controlButton,
                                        isSpeakerOn ? styles.normalButton : styles.mutedButton
                                    ], onPress: toggleSpeaker, activeOpacity: 0.7, children: _jsx(Text, { style: styles.controlText, children: isSpeakerOn ? '🔊' : '🔈' }) }), _jsx(TouchableOpacity, { style: [
                                        styles.controlButton,
                                        currentFilter !== 'none' ? styles.normalButton : styles.mutedButton
                                    ], onPress: () => setShowFilters(!showFilters), activeOpacity: 0.7, children: _jsx(Text, { style: styles.controlText, children: "\uD83C\uDFA8" }) }), _jsx(TouchableOpacity, { style: [
                                        styles.controlButton,
                                        isScreenSharing ? styles.normalButton : styles.mutedButton
                                    ], onPress: toggleScreenShare, activeOpacity: 0.7, children: _jsx(Text, { style: styles.controlText, children: "\uD83D\uDDA5\uFE0F" }) }), _jsx(TouchableOpacity, { style: [styles.controlButton, styles.normalButton], onPress: enterPictureInPicture, activeOpacity: 0.7, children: _jsx(Text, { style: styles.controlText, children: "\uD83D\uDCFA" }) }), _jsx(TouchableOpacity, { style: [styles.controlButton, styles.endButton], onPress: endCall, activeOpacity: 0.7, children: _jsx(Text, { style: styles.controlText, children: "\uD83D\uDCDE" }) })] })) })), errorMessage && (_jsx(TouchableOpacity, { style: [styles.controlButton, styles.retryButton], onPress: () => {
                            setErrorMessage(null);
                            initializeCall();
                        }, children: _jsx(Text, { style: styles.controlText, children: "\uD83D\uDD04" }) }))] }), _jsx(VideoFilters, { visible: showFilters, onClose: () => setShowFilters(false), onFilterChange: handleFilterChange, currentFilter: currentFilter }), callState === 'active' && (_jsx(CallReactions, { onReaction: handleReaction, incomingReactions: incomingReactions }))] }));
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    remoteVideoContainer: {
        flex: 1,
        backgroundColor: '#333',
        position: 'relative',
    },
    remoteVideo: {
        flex: 1,
    },
    remoteVideoPlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        color: '#fff',
        fontSize: 18,
    },
    localVideoContainer: {
        position: 'absolute',
        top: 20,
        right: 20,
        width: 120,
        height: 160,
        borderRadius: 10,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.3)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    localVideoContainerMobile: {
        width: 100,
        height: 133,
        right: 12,
        borderRadius: 8,
    },
    localVideo: {
        flex: 1,
    },
    statusContainer: {
        position: 'absolute',
        top: 50,
        left: 20,
        right: 20,
        alignItems: 'center',
        zIndex: 10,
    },
    statusText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    statusTextMobile: {
        fontSize: 18,
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderRadius: 20,
    },
    errorContainer: {
        marginTop: 10,
        paddingHorizontal: 20,
    },
    errorText: {
        color: '#ff6b6b',
        fontSize: 14,
        textAlign: 'center',
    },
    errorHelpText: {
        color: '#ffa726',
        fontSize: 12,
        textAlign: 'center',
        marginTop: 5,
        fontStyle: 'italic',
    },
    controlsContainer: {
        position: 'absolute',
        bottom: 50,
        left: 0,
        right: 0,
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
    },
    controlsContainerMobile: {
        bottom: 20,
        gap: 16,
    },
    controlsScrollView: {
        width: '100%',
    },
    controlsScrollContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        gap: 16,
    },
    controlsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 20,
        flexWrap: 'wrap',
    },
    controlButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    controlButtonMobile: {
        width: 70,
        height: 70,
        borderRadius: 35,
    },
    acceptButton: {
        backgroundColor: '#4CAF50',
    },
    rejectButton: {
        backgroundColor: '#F44336',
    },
    endButton: {
        backgroundColor: '#F44336',
        width: 70,
        height: 70,
    },
    endButtonMobile: {
        width: 80,
        height: 80,
        borderRadius: 40,
    },
    retryButton: {
        backgroundColor: '#4CAF50',
    },
    normalButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    mutedButton: {
        backgroundColor: '#F44336',
    },
    controlText: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
    },
    controlTextMobile: {
        fontSize: 28,
    },
});
const groupStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    statusBar: {
        position: 'absolute',
        left: 16,
        right: 16,
        alignItems: 'center',
        zIndex: 20,
    },
    statusText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
        textShadowColor: 'rgba(0,0,0,0.4)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    durationText: {
        color: '#fff',
        marginTop: 4,
        fontSize: 14,
    },
    videoArea: {
        flex: 1,
    },
    placeholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    placeholderText: {
        color: '#fff',
        fontSize: 16,
        marginTop: 12,
    },
    errorBanner: {
        position: 'absolute',
        left: 16,
        right: 16,
        top: 100,
        backgroundColor: 'rgba(255, 82, 82, 0.2)',
        borderRadius: 10,
        padding: 12,
    },
    errorText: {
        color: '#ff6b6b',
        textAlign: 'center',
    },
    controls: {
        position: 'absolute',
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    controlButton: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    controlButtonDisabled: {
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    hangupButton: {
        backgroundColor: '#F44336',
    },
    controlText: {
        fontSize: 28,
        color: '#fff',
    },
});
const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};
