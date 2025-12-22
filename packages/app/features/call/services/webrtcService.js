import { Platform } from 'react-native';
// Utility function to check WebRTC support
export const checkWebRTCSupport = () => {
    if (typeof window === 'undefined') {
        return { supported: false, error: 'Window object is not available' };
    }
    if (!navigator) {
        return { supported: false, error: 'Navigator is not available' };
    }
    if (!navigator.mediaDevices) {
        const isHttps = window.location.protocol === 'https:';
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        if (!isHttps && !isLocalhost) {
            return { supported: false, error: 'MediaDevices API requires HTTPS. Please access the app via HTTPS or localhost.' };
        }
        else {
            return { supported: false, error: 'MediaDevices API is not available in this browser.' };
        }
    }
    if (!navigator.mediaDevices.getUserMedia) {
        return { supported: false, error: 'getUserMedia is not available in this browser' };
    }
    if (!window.RTCPeerConnection) {
        return { supported: false, error: 'RTCPeerConnection is not available in this browser' };
    }
    return { supported: true };
};
export class WebRTCService {
    // ════════════════════════════════════════════════════════════
    // ICE SERVERS - STUN/TURN (UDP Protocol)
    // ════════════════════════════════════════════════════════════
    // Use multiple STUN servers + Metered TURN (mix for better reliability)
    // Thêm nhiều STUN servers để có fallback tốt hơn
    getPreferredIceServers() {
        return [
            // Google STUN servers (primary)
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
            { urls: "stun:stun2.l.google.com:19302" },
            { urls: "stun:stun3.l.google.com:19302" },
            { urls: "stun:stun4.l.google.com:19302" },
            // Open Relay STUN servers (backup)
            { urls: "stun:stun.stunprotocol.org:3478" },
            { urls: "stun:stun.voiparound.com" },
            { urls: "stun:stun.voipbuster.com" },
            // TURN servers (Metered) - ưu tiên TCP/TLS để tránh firewall issues
            {
                urls: "turns:standard.relay.metered.ca:443?transport=tcp",
                username: "ac1c979785feb61d89d10f9e",
                credential: "IfBd3uXzDApKCXU/"
            },
            {
                urls: "turn:standard.relay.metered.ca:443",
                username: "ac1c979785feb61d89d10f9e",
                credential: "IfBd3uXzDApKCXU/"
            },
            {
                urls: "turn:standard.relay.metered.ca:80?transport=tcp",
                username: "ac1c979785feb61d89d10f9e",
                credential: "IfBd3uXzDApKCXU/"
            },
            {
                urls: "turn:standard.relay.metered.ca:80",
                username: "ac1c979785feb61d89d10f9e",
                credential: "IfBd3uXzDApKCXU/"
            }
        ];
    }
    constructor(callId, targetUserId, socket) {
        this.peerConnection = null;
        this.localStream = null;
        this.remoteStream = null;
        this.pendingIceCandidates = [];
        this.localIceQueue = [];
        this.onRemoteStream = null;
        this.renegotiationScheduled = false;
        this.icePhase = 0; // 0: STUN+TURN(UDP first), 1: TURN-UDP only, 2: TURN TCP/TLS only
        this.lastLocalAnswer = null;
        this.iceErrorCount = 0;
        this.lastIceErrorTs = 0;
        this.answering = false;
        this.currentFacingMode = 'user';
        this.isSpeakerOn = false;
        this.currentFilter = 'none';
        this.filterCanvas = null;
        this.filterContext = null;
        this.filterVideoElement = null;
        this.filterStream = null;
        this.screenShareStream = null;
        this.isScreenSharing = false;
        this.callId = callId;
        this.targetUserId = targetUserId;
        this.socket = socket;
    }
    // Method to update socket reference
    updateSocket(socket) {
        console.log('📞 [WEBRTC] Updating socket reference:', {
            oldSocket: !!this.socket,
            newSocket: !!socket,
            newSocketConnected: socket?.connected,
            newSocketId: socket?.id
        });
        this.socket = socket;
    }
    // Method to update target user dynamically during negotiation
    updateTargetUser(targetUserId) {
        if (!targetUserId || targetUserId === this.targetUserId)
            return;
        console.log('📞 [WEBRTC] Updating target user ID:', {
            oldTargetUserId: this.targetUserId,
            newTargetUserId: targetUserId
        });
        this.targetUserId = targetUserId;
    } // ════════════════════════════════════════════════════════════
    // INITIALIZE WEBRTC - PEER-TO-PEER Setup
    // ════════════════════════════════════════════════════════════
    async initializeCall() {
        if (Platform.OS === 'web') {
            return this.initializeWebCall();
        }
        else {
            return this.initializeMobileCall();
        }
    }
    async initializeWebCall() {
        try {
            console.log('📞 [WEBRTC] Initializing web call for callId:', this.callId);
            console.log('📞 [WEBRTC] Target user ID:', this.targetUserId);
            // Check if navigator and mediaDevices are available
            if (!navigator) {
                throw new Error('Navigator is not available');
            }
            if (!navigator.mediaDevices) {
                throw new Error('MediaDevices API is not available. This usually means the page is not served over HTTPS or the browser does not support WebRTC.');
            }
            if (!navigator.mediaDevices.getUserMedia) {
                throw new Error('getUserMedia is not available in this browser');
            }
            // Get user media for web
            console.log('📞 [WEBRTC] Requesting user media...');
            console.log('📞 [WEBRTC] Navigator available:', !!navigator);
            console.log('📞 [WEBRTC] MediaDevices available:', !!navigator.mediaDevices);
            console.log('📞 [WEBRTC] getUserMedia available:', !!navigator.mediaDevices.getUserMedia);
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'user',
                    width: { ideal: 1920, min: 1280 },
                    height: { ideal: 1080, min: 720 },
                    frameRate: { ideal: 30, max: 30 }, // 30fps để cân bằng quality và latency
                    aspectRatio: { ideal: 16 / 9 }
                },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 48000, // High quality audio
                    channelCount: 1 // Mono để giảm bandwidth
                },
            });
            console.log('📞 [WEBRTC] Got local stream:', stream);
            console.log('📞 [WEBRTC] Stream tracks:', stream.getTracks().length);
            this.localStream = stream;
            // Ensure tracks are enabled
            try {
                this.localStream.getVideoTracks()?.forEach((t) => t.enabled = true);
                this.localStream.getAudioTracks()?.forEach((t) => t.enabled = true);
            }
            catch { }
            // Create peer connection for web
            if (!window.RTCPeerConnection) {
                throw new Error('RTCPeerConnection is not available in this browser');
            }
            // Use preferred ICE servers directly (no API fetch)
            // ════════════════════════════════════════════════════════════
            // CREATE PEER CONNECTION - P2P Foundation
            // ═══════════════════════════════════════════════════════════
            // Prefer dynamic TURN list from Metered; fallback to local defaults
            const iceServers = await this.fetchMeteredIceServers().catch(() => this.getPreferredIceServers());
            this.peerConnection = new RTCPeerConnection({
                iceServers: iceServers,
                // Start with 'all' to prefer direct P2P for lower latency; fallback handled by dynamic phases
                iceTransportPolicy: 'all',
                bundlePolicy: 'max-compat', // Tối ưu compatibility
                rtcpMuxPolicy: 'require',
                iceCandidatePoolSize: 4 // Tăng pool size để giảm latency khi gather
            });
            console.log('📞 [WEBRTC] Created peer connection:', this.peerConnection);
            // Optional: start from stricter phase via localStorage override (only if socket is connected)
            try {
                const startPhaseRaw = (typeof window !== 'undefined') ? localStorage.getItem('ice_phase_start') : null;
                const startPhase = startPhaseRaw != null ? Number(startPhaseRaw) : null;
                if ((startPhase === 1 || startPhase === 2) && this.socket && this.socket.connected) {
                    console.log('📞 [WEBRTC] Applying start phase override:', startPhase);
                    await this.restartIceWithPhase(startPhase);
                }
            }
            catch { }
            // Expose for debugging in DevTools
            try {
                window.pc = this.peerConnection;
                window.localStream = this.localStream;
                window.getReceivers = () => this.peerConnection.getReceivers?.();
                window.getSenders = () => this.peerConnection.getSenders?.();
            }
            catch { }
            // Add local stream to peer connection first
            stream.getTracks().forEach((track) => {
                this.peerConnection.addTrack(track, stream);
            });
            // Ensure bidirectional media: set all transceivers to sendrecv
            try {
                const transceivers = this.peerConnection.getTransceivers?.() || [];
                console.log('📞 [WEBRTC] Found transceivers:', transceivers.length);
                // Set all transceivers to sendrecv for bidirectional communication
                transceivers.forEach((transceiver) => {
                    if (transceiver.direction !== 'sendrecv') {
                        console.log(`📞 [WEBRTC] Setting transceiver (${transceiver.sender?.track?.kind || 'unknown'}) to sendrecv`);
                        // Use setDirection() if available, otherwise set property directly
                        if (typeof transceiver.setDirection === 'function') {
                            transceiver.setDirection('sendrecv');
                        }
                        else {
                            transceiver.direction = 'sendrecv';
                        }
                    }
                });
                // If no transceivers exist, create them explicitly
                if (transceivers.length === 0 && this.peerConnection.addTransceiver) {
                    console.log('📞 [WEBRTC] No transceivers found, creating sendrecv transceivers (web)');
                    const v = this.peerConnection.addTransceiver('video', { direction: 'sendrecv' });
                    const a = this.peerConnection.addTransceiver('audio', { direction: 'sendrecv' });
                    // Prefer codecs: VP9/H.264 for video (better compression), Opus for audio
                    try {
                        const prefer = (kind, t) => {
                            const codecs = RTCRtpReceiver.getCapabilities?.(kind)?.codecs || [];
                            let filtered;
                            if (kind === 'video') {
                                // Ưu tiên VP9 (tốt nhất), sau đó H.264, cuối cùng VP8
                                const vp9 = codecs.filter((c) => /vp9/i.test(c.mimeType));
                                const h264 = codecs.filter((c) => /h264|avc/i.test(c.mimeType));
                                const vp8 = codecs.filter((c) => /vp8/i.test(c.mimeType));
                                filtered = vp9.length ? vp9 : (h264.length ? h264 : vp8);
                            }
                            else {
                                filtered = codecs.filter((c) => /opus/i.test(c.mimeType));
                            }
                            if (filtered.length && typeof t.setCodecPreferences === 'function') {
                                t.setCodecPreferences(filtered);
                                console.log(`📞 [WEBRTC] Preferred ${kind} codec:`, filtered[0]?.mimeType);
                            }
                        };
                        prefer('video', v);
                        prefer('audio', a);
                    }
                    catch { }
                }
                else {
                    // Set codec preferences on existing transceivers
                    try {
                        const prefer = (kind, t) => {
                            const codecs = RTCRtpReceiver.getCapabilities?.(kind)?.codecs || [];
                            let filtered;
                            if (kind === 'video') {
                                const vp9 = codecs.filter((c) => /vp9/i.test(c.mimeType));
                                const h264 = codecs.filter((c) => /h264|avc/i.test(c.mimeType));
                                const vp8 = codecs.filter((c) => /vp8/i.test(c.mimeType));
                                filtered = vp9.length ? vp9 : (h264.length ? h264 : vp8);
                            }
                            else {
                                filtered = codecs.filter((c) => /opus/i.test(c.mimeType));
                            }
                            if (filtered.length && typeof t.setCodecPreferences === 'function') {
                                t.setCodecPreferences(filtered);
                                console.log(`📞 [WEBRTC] Preferred ${kind} codec:`, filtered[0]?.mimeType);
                            }
                        };
                        transceivers.forEach((t) => {
                            const kind = t.sender?.track?.kind || t.receiver?.track?.kind;
                            if (kind)
                                prefer(kind, t);
                        });
                    }
                    catch { }
                }
            }
            catch (e) {
                console.warn('⚠️ [WEBRTC] Failed setting transceivers to sendrecv (web):', e);
            }
            // Apply optimized sender params for high quality and low latency
            try {
                const senders = this.peerConnection.getSenders?.() || [];
                for (const s of senders) {
                    if (s.track?.kind === 'video') {
                        const p = s.getParameters();
                        // Tăng bitrate cho Full HD và tối ưu latency
                        p.encodings = [{
                                maxBitrate: 2500000, // 2.5 Mbps cho Full HD
                                minBitrate: 500000, // Min 500 kbps
                                maxFramerate: 30, // 30fps
                                scaleResolutionDownBy: 1, // Không scale down
                                // Low latency mode
                                networkPriority: 'high'
                            }];
                        await s.setParameters(p);
                    }
                    if (s.track?.kind === 'audio') {
                        const p = s.getParameters();
                        p.encodings = [{
                                maxBitrate: 64000, // 64 kbps cho audio chất lượng cao
                                priority: 'high'
                            }];
                        await s.setParameters(p);
                    }
                }
            }
            catch { }
            console.log('📞 [WEBRTC] Added local tracks to peer connection');
            try {
                const senders = this.peerConnection.getSenders?.() || [];
                console.log('📞 [WEBRTC] Current senders:', senders.map((s) => s.track?.kind + ':' + s.track?.readyState));
            }
            catch { }
            // Handle remote stream
            this.peerConnection.ontrack = (event) => {
                console.log('📞 [WEBRTC] ===== REMOTE TRACK RECEIVED =====');
                console.log('📞 [WEBRTC] Track kind:', event.track?.kind, 'readyState:', event.track?.readyState);
                console.log('📞 [WEBRTC] Received remote track:', event);
                console.log('📞 [WEBRTC] Remote streams provided by event:', event.streams);
                // Prefer event.streams[0] if available (Chrome/Firefox)
                if (event.streams && event.streams.length > 0) {
                    this.remoteStream = event.streams[0];
                }
                else {
                    // Safari sometimes doesn't populate event.streams
                    if (!this.remoteStream) {
                        console.log('📞 [WEBRTC] Creating new MediaStream for remote tracks');
                        this.remoteStream = new MediaStream();
                    }
                    if (event.track) {
                        console.log('📞 [WEBRTC] Adding incoming track to remote MediaStream');
                        this.remoteStream.addTrack(event.track);
                    }
                }
                if (this.remoteStream) {
                    const tracks = this.remoteStream.getTracks();
                    console.log('📞 [WEBRTC] Remote stream now has tracks:', tracks.map((t) => t.kind + ':' + t.readyState));
                    if (this.onRemoteStream) {
                        console.log('📞 [WEBRTC] Calling onRemoteStream callback with updated stream');
                        this.onRemoteStream(this.remoteStream);
                    }
                    else {
                        console.warn('⚠️ [WEBRTC] onRemoteStream callback is null!');
                    }
                }
                else {
                    console.warn('⚠️ [WEBRTC] Remote stream still null after ontrack');
                }
                console.log('📞 [WEBRTC] ===== END REMOTE TRACK =====');
            };
            // Watchdog: if after 3s post-connection there is still no remote track, trigger ICE restart with stricter phase
            try {
                setTimeout(async () => {
                    try {
                        const hasRemoteTracks = !!this.remoteStream && this.remoteStream.getTracks().length > 0;
                        if (!hasRemoteTracks && this.socket && this.socket.connected) {
                            console.warn('⚠️ [WEBRTC] No remote tracks after watchdog timeout → ICE restart phase 1');
                            await this.restartIceWithPhase(1);
                        }
                    }
                    catch { }
                }, 3000);
            }
            catch { }
            // Note: additional receiver attachment handled in class method attachExistingRemoteTracks()
            // Add connection state monitoring
            this.peerConnection.onconnectionstatechange = () => {
                console.log('📞 [WEBRTC] Connection state changed:', this.peerConnection.connectionState);
                if (this.peerConnection.connectionState === 'connected') {
                    console.log('📞 [WEBRTC] Peer connection established!');
                    // Once connected, ensure remote stream is pushed to UI
                    if (this.remoteStream && this.onRemoteStream) {
                        console.log('📞 [WEBRTC] Connection established - pushing remote stream to UI');
                        this.onRemoteStream(this.remoteStream);
                    }
                    else {
                        // Try to attach receivers in case ontrack missed
                        this.attachExistingRemoteTracks();
                        // One-time fallback: schedule ICE restart renegotiation if no remote tracks shortly after connect
                        if (!this.renegotiationScheduled) {
                            this.renegotiationScheduled = true;
                            setTimeout(async () => {
                                try {
                                    const hasRemoteTracks = !!this.remoteStream && this.remoteStream.getTracks().length > 0;
                                    console.log('📞 [WEBRTC] Post-connected remote track check:', hasRemoteTracks);
                                    if (!hasRemoteTracks && this.socket && this.socket.connected) {
                                        console.warn('⚠️ [WEBRTC] No remote tracks after connect - attempting ICE restart');
                                        await this.restartIceWithPhase(0); // reuse dynamic config
                                    }
                                }
                                catch (e) {
                                    console.error('❌ [WEBRTC] ICE restart renegotiation failed:', e);
                                }
                            }, 2500);
                        }
                    }
                }
            };
            // Add ICE connection state monitoring
            this.peerConnection.oniceconnectionstatechange = () => {
                console.log('📞 [WEBRTC] ===== ICE CONNECTION STATE CHANGED =====');
                console.log('📞 [WEBRTC] ICE connection state:', this.peerConnection.iceConnectionState);
                console.log('📞 [WEBRTC] ICE gathering state:', this.peerConnection.iceGatheringState);
                console.log('📞 [WEBRTC] ===== END ICE CONNECTION STATE =====');
                const state = this.peerConnection.iceConnectionState;
                if (state === 'failed') {
                    console.warn('⚠️ [WEBRTC] ICE failed → restarting ICE with phase 1');
                    this.restartIceWithPhase(1);
                }
                else if (state === 'disconnected') {
                    // small debounce before restart to avoid flapping
                    setTimeout(() => {
                        const cur = this.peerConnection.iceConnectionState;
                        if (cur === 'disconnected') {
                            console.warn('⚠️ [WEBRTC] ICE disconnected persists → restarting ICE');
                            this.restartIceWithPhase(1);
                        }
                    }, 1500);
                }
            };
            // Add signaling state monitoring
            this.peerConnection.onsignalingstatechange = () => {
                console.log('📞 [WEBRTC] ===== SIGNALING STATE CHANGED =====');
                console.log('📞 [WEBRTC] Signaling state:', this.peerConnection.signalingState);
                console.log('📞 [WEBRTC] Connection state:', this.peerConnection.connectionState);
                console.log('📞 [WEBRTC] ===== END SIGNALING STATE =====');
            };
            // Handle ICE candidates
            this.peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    // Guard: only emit after localDescription is set (avoid race on callee)
                    if (!this.peerConnection.localDescription) {
                        this.localIceQueue.push(event.candidate);
                        console.log('📞 [WEBRTC] Queueing local ICE until localDescription present');
                        return;
                    }
                    this.emitIceCandidate(event.candidate);
                }
                else {
                    console.log('📞 [WEBRTC] ICE gathering complete (null candidate)');
                    // As soon as ICE gathering completes, if we already have remoteDescription but no remote stream visible,
                    // attempt to re-emit currently assembled remote stream to UI
                    if (this.remoteStream && this.onRemoteStream) {
                        console.log('📞 [WEBRTC] Re-emitting remote stream after ICE completed');
                        this.onRemoteStream(this.remoteStream);
                    }
                }
            };
            // Log ICE candidate errors for diagnostics
            // Lưu ý: STUN timeout (701) là bình thường nếu có nhiều STUN servers, chỉ log warning
            this.peerConnection.onicecandidateerror = (event) => {
                try {
                    const errorCode = event?.errorCode;
                    const errorText = event?.errorText || '';
                    const url = event?.url || '';
                    // STUN timeout (701) là phổ biến và không nghiêm trọng nếu có TURN servers
                    // Chỉ log warning thay vì error để giảm noise trong console
                    if (errorCode === 701 && url.includes('stun:')) {
                        console.warn('⚠️ [WEBRTC] STUN server timeout (normal if TURN available):', url);
                    }
                    else {
                        // Các lỗi khác hoặc TURN errors thì log error
                        console.error('❌ [WEBRTC] ICE CANDIDATE ERROR (web):', {
                            errorCode,
                            errorText,
                            url,
                            hostCandidate: event?.hostCandidate
                        });
                    }
                }
                catch (e) {
                    console.error('❌ [WEBRTC] ICE CANDIDATE ERROR (web)');
                }
                this.handleIceError(event);
            };
            return stream;
        }
        catch (error) {
            console.error('Error initializing web call:', error);
            throw error;
        }
    }
    async initializeMobileCall() {
        try {
            // Dynamically import react-native-webrtc only when needed
            const WebRTC = require('react-native-webrtc');
            const { mediaDevices, RTCPeerConnection } = WebRTC;
            // Get user media for mobile
            const stream = await mediaDevices.getUserMedia({
                video: {
                    facingMode: 'user',
                    width: { ideal: 1920, min: 1280 },
                    height: { ideal: 1080, min: 720 },
                    frameRate: { ideal: 30, max: 30 },
                },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 48000,
                    channelCount: 1,
                },
            });
            this.localStream = stream;
            // Create peer connection for mobile (use same ICE servers as web)
            const iceServers = await this.fetchMeteredIceServers().catch(() => this.getPreferredIceServers());
            this.peerConnection = new RTCPeerConnection({
                iceServers: iceServers,
                // Prefer direct when possible on mobile too
                iceTransportPolicy: 'all',
                bundlePolicy: 'max-compat',
                rtcpMuxPolicy: 'require',
                iceCandidatePoolSize: 4 // Tăng pool size để giảm latency
            });
            // Add local stream to peer connection first
            stream.getTracks().forEach((track) => {
                this.peerConnection.addTrack(track, stream);
            });
            // Apply optimized bitrate for high quality
            try {
                const senders = this.peerConnection.getSenders?.() || [];
                for (const s of senders) {
                    if (s.track?.kind === 'video') {
                        const p = s.getParameters();
                        p.encodings = [{
                                maxBitrate: 2500000, // 2.5 Mbps cho Full HD
                                minBitrate: 500000,
                                maxFramerate: 30,
                                scaleResolutionDownBy: 1,
                                networkPriority: 'high'
                            }];
                        await s.setParameters(p);
                    }
                    if (s.track?.kind === 'audio') {
                        const p = s.getParameters();
                        p.encodings = [{
                                maxBitrate: 64000,
                                priority: 'high'
                            }];
                        await s.setParameters(p);
                    }
                }
            }
            catch { }
            // Ensure bidirectional media on mobile too: set all transceivers to sendrecv
            try {
                const transceivers = this.peerConnection.getTransceivers?.() || [];
                console.log('📞 [WEBRTC] Found transceivers (mobile):', transceivers.length);
                // Set all transceivers to sendrecv for bidirectional communication
                transceivers.forEach((transceiver) => {
                    if (transceiver.direction !== 'sendrecv') {
                        console.log(`📞 [WEBRTC] Setting transceiver (${transceiver.sender?.track?.kind || 'unknown'}) to sendrecv (mobile)`);
                        // Use setDirection() if available, otherwise set property directly
                        if (typeof transceiver.setDirection === 'function') {
                            transceiver.setDirection('sendrecv');
                        }
                        else {
                            transceiver.direction = 'sendrecv';
                        }
                    }
                });
                // If no transceivers exist, create them explicitly
                if (transceivers.length === 0 && this.peerConnection.addTransceiver) {
                    console.log('📞 [WEBRTC] No transceivers found, creating sendrecv transceivers (mobile)');
                    const v = this.peerConnection.addTransceiver('video', { direction: 'sendrecv' });
                    const a = this.peerConnection.addTransceiver('audio', { direction: 'sendrecv' });
                    try {
                        const prefer = (kind, t) => {
                            const codecs = RTCRtpReceiver.getCapabilities?.(kind)?.codecs || [];
                            let filtered;
                            if (kind === 'video') {
                                // Ưu tiên VP9 (tốt nhất), sau đó H.264, cuối cùng VP8
                                const vp9 = codecs.filter((c) => /vp9/i.test(c.mimeType));
                                const h264 = codecs.filter((c) => /h264|avc/i.test(c.mimeType));
                                const vp8 = codecs.filter((c) => /vp8/i.test(c.mimeType));
                                filtered = vp9.length ? vp9 : (h264.length ? h264 : vp8);
                            }
                            else {
                                filtered = codecs.filter((c) => /opus/i.test(c.mimeType));
                            }
                            if (filtered.length && typeof t.setCodecPreferences === 'function') {
                                t.setCodecPreferences(filtered);
                                console.log(`📞 [WEBRTC] Preferred ${kind} codec (mobile):`, filtered[0]?.mimeType);
                            }
                        };
                        prefer('video', v);
                        prefer('audio', a);
                    }
                    catch { }
                }
                else {
                    // Set codec preferences on existing transceivers
                    try {
                        const prefer = (kind, t) => {
                            const codecs = RTCRtpReceiver.getCapabilities?.(kind)?.codecs || [];
                            let filtered;
                            if (kind === 'video') {
                                const vp9 = codecs.filter((c) => /vp9/i.test(c.mimeType));
                                const h264 = codecs.filter((c) => /h264|avc/i.test(c.mimeType));
                                const vp8 = codecs.filter((c) => /vp8/i.test(c.mimeType));
                                filtered = vp9.length ? vp9 : (h264.length ? h264 : vp8);
                            }
                            else {
                                filtered = codecs.filter((c) => /opus/i.test(c.mimeType));
                            }
                            if (filtered.length && typeof t.setCodecPreferences === 'function') {
                                t.setCodecPreferences(filtered);
                                console.log(`📞 [WEBRTC] Preferred ${kind} codec (mobile):`, filtered[0]?.mimeType);
                            }
                        };
                        transceivers.forEach((t) => {
                            const kind = t.sender?.track?.kind || t.receiver?.track?.kind;
                            if (kind)
                                prefer(kind, t);
                        });
                    }
                    catch { }
                }
            }
            catch (e) {
                console.warn('⚠️ [WEBRTC] Failed setting transceivers to sendrecv (mobile):', e);
            }
            // Handle remote stream
            this.peerConnection.ontrack = (event) => {
                console.log('📞 [WEBRTC][MOBILE] ===== REMOTE TRACK RECEIVED =====');
                if (event.streams && event.streams.length > 0) {
                    this.remoteStream = event.streams[0];
                }
                else if (event.track) {
                    if (!this.remoteStream)
                        this.remoteStream = new MediaStream();
                    this.remoteStream.addTrack(event.track);
                }
                if (this.remoteStream) {
                    console.log('📞 [WEBRTC][MOBILE] Remote tracks:', this.remoteStream.getTracks().map((t) => t.kind + ':' + t.readyState));
                    this.onRemoteStream?.(this.remoteStream);
                }
                else {
                    console.warn('⚠️ [WEBRTC][MOBILE] Remote stream still null after ontrack');
                }
                console.log('📞 [WEBRTC][MOBILE] ===== END REMOTE TRACK =====');
            };
            // Connection/ICE state logs similar to web
            ;
            this.peerConnection.onconnectionstatechange = () => {
                console.log('📞 [WEBRTC][MOBILE] Connection state changed:', this.peerConnection.connectionState);
                if (this.peerConnection.connectionState === 'connected') {
                    if (this.remoteStream && this.onRemoteStream) {
                        console.log('📞 [WEBRTC][MOBILE] Connected - pushing remote stream to UI');
                        this.onRemoteStream(this.remoteStream);
                    }
                    else {
                        this.attachExistingRemoteTracks();
                    }
                }
            };
            ;
            this.peerConnection.oniceconnectionstatechange = () => {
                console.log('📞 [WEBRTC][MOBILE] ICE state:', this.peerConnection.iceConnectionState);
                const state = this.peerConnection.iceConnectionState;
                if (state === 'failed') {
                    console.warn('⚠️ [WEBRTC][MOBILE] ICE failed → restart');
                    this.restartIceWithPhase(1);
                }
                else if (state === 'disconnected') {
                    setTimeout(() => {
                        const cur = this.peerConnection.iceConnectionState;
                        if (cur === 'disconnected') {
                            console.warn('⚠️ [WEBRTC][MOBILE] ICE disconnected persists → restart');
                            this.restartIceWithPhase(1);
                        }
                    }, 1500);
                }
            };
            ;
            this.peerConnection.onsignalingstatechange = () => {
                console.log('📞 [WEBRTC][MOBILE] Signaling state:', this.peerConnection.signalingState);
            };
            // Handle ICE candidates
            this.peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    this.socket?.emit('webrtc:ice-candidate', {
                        targetUserId: this.targetUserId,
                        candidate: event.candidate,
                        callId: this.callId
                    });
                }
                else {
                    console.log('📞 [WEBRTC][MOBILE] ICE gathering complete (null candidate)');
                    if (this.remoteStream && this.onRemoteStream) {
                        this.onRemoteStream(this.remoteStream);
                    }
                }
            };
            // Log ICE candidate errors for mobile (tương tự web)
            this.peerConnection.onicecandidateerror = (event) => {
                try {
                    const errorCode = event?.errorCode;
                    const errorText = event?.errorText || '';
                    const url = event?.url || '';
                    // STUN timeout (701) là phổ biến và không nghiêm trọng nếu có TURN servers
                    if (errorCode === 701 && url.includes('stun:')) {
                        console.warn('⚠️ [WEBRTC] STUN server timeout (mobile, normal if TURN available):', url);
                    }
                    else {
                        console.error('❌ [WEBRTC] ICE CANDIDATE ERROR (mobile):', {
                            errorCode,
                            errorText,
                            url,
                            hostCandidate: event?.hostCandidate
                        });
                    }
                }
                catch (e) {
                    console.error('❌ [WEBRTC] ICE CANDIDATE ERROR (mobile)');
                }
                this.handleIceError(event);
            };
            return stream;
        }
        catch (error) {
            console.error('Error initializing mobile call:', error);
            throw error;
        }
    }
    async createOffer(options) {
        try {
            console.log('📞 [WEBRTC] ===== START CREATE OFFER =====');
            console.log('📞 [WEBRTC] CallId:', this.callId);
            console.log('📞 [WEBRTC] TargetUserId:', this.targetUserId);
            console.log('📞 [WEBRTC] PeerConnection exists:', !!this.peerConnection);
            console.log('📞 [WEBRTC] LocalStream exists:', !!this.localStream);
            // Ensure peer connection is ready before creating offer (caller path)
            console.log('📞 [WEBRTC] Waiting for peer ready...');
            await this.waitForPeerReady();
            console.log('📞 [WEBRTC] Peer is ready, creating offer...');
            console.log('📞 [WEBRTC] Creating offer for callId:', this.callId);
            console.log('📞 [WEBRTC] Target user ID:', this.targetUserId);
            console.log('📞 [WEBRTC] Socket connected:', this.socket?.connected);
            console.log('📞 [WEBRTC] Socket ID:', this.socket?.id);
            console.log('📞 [WEBRTC] Peer connection state:', this.peerConnection?.connectionState);
            // Validate socket connection before proceeding
            if (!this.socket || !this.socket.connected) {
                console.error('❌ [WEBRTC] Socket not connected - cannot send offer');
                console.error('❌ [WEBRTC] Socket state:', {
                    socket: !!this.socket,
                    connected: this.socket?.connected,
                    id: this.socket?.id
                });
                throw new Error('Socket not connected - cannot send offer');
            }
            const offer = await this.peerConnection.createOffer(options || {});
            console.log('📞 [WEBRTC] Created offer:', offer);
            // SDP munging: strip IPv6 and, in strict phases, keep relay-only
            const munged = this.mungeSdpForPhase(offer.sdp || '');
            const localDesc = new RTCSessionDescription({ type: offer.type, sdp: munged });
            await this.peerConnection.setLocalDescription(localDesc);
            console.log('📞 [WEBRTC] Set local description');
            // Flush queued local ICE now that localDescription exists
            if (this.localIceQueue.length > 0) {
                console.log('📞 [WEBRTC] Flushing', this.localIceQueue.length, 'queued local ICE candidates');
                for (const c of this.localIceQueue) {
                    this.emitIceCandidate(c);
                }
                this.localIceQueue = [];
            }
            console.log('📞 [WEBRTC] Emitting offer to target user:', this.targetUserId);
            // Only include targetUserId if it's set, otherwise let backend resolve from call participants
            const offerData = {
                offer,
                callId: this.callId
            };
            if (this.targetUserId) {
                offerData.targetUserId = this.targetUserId;
            }
            console.log('📞 [WEBRTC] Offer data to emit:', offerData);
            console.log('📞 [WEBRTC] Socket state before emit:', {
                connected: this.socket?.connected,
                id: this.socket?.id,
                readyState: this.socket?.readyState
            });
            console.log('📞 [WEBRTC] ===== EMITTING OFFER TO SOCKET =====');
            console.log('📞 [WEBRTC] Socket connected:', this.socket?.connected);
            console.log('📞 [WEBRTC] Socket ID:', this.socket?.id);
            console.log('📞 [WEBRTC] Offer data:', JSON.stringify(offerData, null, 2).substring(0, 500));
            this.socket.emit('webrtc:offer', offerData);
            console.log('📞 [WEBRTC] ✅ Offer emitted to socket successfully');
            console.log('📞 [WEBRTC] ===== END EMITTING OFFER =====');
        }
        catch (error) {
            console.error('❌ [WEBRTC] Error creating offer:', error);
            throw error;
        }
    }
    async handleOffer(offer) {
        try {
            console.log('📞 [WEBRTC] Handling incoming offer:', offer);
            console.log('📞 [WEBRTC] Socket connected:', this.socket?.connected);
            // Validate socket connection before proceeding
            if (!this.socket || !this.socket.connected) {
                throw new Error('Socket not connected - cannot send answer');
            }
            if (!this.peerConnection) {
                throw new Error('PeerConnection not initialized');
            }
            // Check peer connection state before setting remote description
            console.log('📞 [WEBRTC] Peer connection state before setting offer:', this.peerConnection.signalingState);
            // Be tolerant: attempt to set remote description even if not exactly 'stable'
            // Returning early here can deadlock negotiation and keep UI stuck on "Waiting for video"
            try {
                // Guard: if signaling not stable, wait a micro task to avoid "Called in wrong state"
                if (this.peerConnection.signalingState !== 'stable') {
                    await new Promise(r => setTimeout(r, 50));
                }
                await this.peerConnection.setRemoteDescription(offer);
            }
            catch (err) {
                console.warn('⚠️ [WEBRTC] setRemoteDescription(offer) failed, state:', this.peerConnection.signalingState, 'error:', err);
                // In glare or unexpected state, try rollback then apply remote offer
                try {
                    if (this.peerConnection.signalingState === 'have-local-offer') {
                        console.log('📞 [WEBRTC] Rolling back local offer to apply remote offer');
                        await this.peerConnection.setLocalDescription({ type: 'rollback' });
                        await this.peerConnection.setRemoteDescription(offer);
                    }
                }
                catch (rollbackErr) {
                    console.error('❌ [WEBRTC] Rollback + setRemoteDescription(offer) failed:', rollbackErr);
                    throw rollbackErr;
                }
            }
            console.log('📞 [WEBRTC] Set remote description from offer');
            // Try to attach existing receivers' tracks immediately
            this.attachExistingRemoteTracks();
            console.log('📞 [WEBRTC] ===== OFFER PROCESSING COMPLETE =====');
            console.log('📞 [WEBRTC] Peer connection state after offer:', this.peerConnection?.connectionState);
            console.log('📞 [WEBRTC] ICE connection state after offer:', this.peerConnection?.iceConnectionState);
            console.log('📞 [WEBRTC] Signaling state after offer:', this.peerConnection?.signalingState);
            console.log('📞 [WEBRTC] ===== END OFFER PROCESSING =====');
            // Process any pending ICE candidates
            await this.processPendingIceCandidates();
            // Avoid concurrent answer creation
            if (this.answering) {
                console.warn('⚠️ [WEBRTC] Already answering, skipping duplicate createAnswer');
                return;
            }
            this.answering = true;
            // Wait until signaling state is have-remote-offer before creating answer
            let attempts = 0;
            while (this.peerConnection.signalingState !== 'have-remote-offer' && attempts < 10) {
                await new Promise(r => setTimeout(r, 50));
                attempts++;
            }
            if (this.peerConnection.signalingState !== 'have-remote-offer') {
                console.warn('⚠️ [WEBRTC] Skipping createAnswer due to signalingState:', this.peerConnection.signalingState);
                this.answering = false;
                return;
            }
            const answer = await this.peerConnection.createAnswer();
            console.log('📞 [WEBRTC] ===== ANSWER CREATED =====');
            console.log('📞 [WEBRTC] Created answer:', answer);
            console.log('📞 [WEBRTC] Answer type:', answer.type);
            console.log('📞 [WEBRTC] Answer sdp length:', answer.sdp?.length);
            const munged = this.mungeSdpForPhase(answer.sdp || '');
            await this.peerConnection.setLocalDescription({ type: answer.type, sdp: munged });
            console.log('📞 [WEBRTC] Set local description from answer');
            console.log('📞 [WEBRTC] Local description set successfully');
            // Keep a copy to allow resend on request
            this.lastLocalAnswer = answer;
            // Only include targetUserId if it's set, otherwise let backend resolve from call participants
            const answerData = {
                answer,
                callId: this.callId
            };
            if (this.targetUserId) {
                answerData.targetUserId = this.targetUserId;
            }
            console.log('📞 [WEBRTC] ===== EMITTING ANSWER =====');
            console.log('📞 [WEBRTC] Answer data to emit:', answerData);
            console.log('📞 [WEBRTC] Socket connected for answer:', this.socket?.connected);
            console.log('📞 [WEBRTC] Socket ID for answer:', this.socket?.id);
            console.log('📞 [WEBRTC] ===== EMITTING ANSWER TO SOCKET =====');
            console.log('📞 [WEBRTC] Socket connected:', this.socket?.connected);
            console.log('📞 [WEBRTC] Socket ID:', this.socket?.id);
            console.log('📞 [WEBRTC] Answer data:', JSON.stringify(answerData, null, 2).substring(0, 500));
            this.socket.emit('webrtc:answer', answerData);
            console.log('📞 [WEBRTC] ✅ Answer emitted to socket successfully');
            console.log('📞 [WEBRTC] ===== END EMITTING ANSWER =====');
            this.answering = false;
        }
        catch (error) {
            console.error('❌ [WEBRTC] Error handling offer:', error);
            this.answering = false;
            throw error;
        }
    }
    async handleAnswer(answer) {
        try {
            console.log('📞 [WEBRTC] ===== HANDLING ANSWER =====');
            console.log('📞 [WEBRTC] Handling incoming answer:', answer);
            console.log('📞 [WEBRTC] Answer type:', answer.type);
            console.log('📞 [WEBRTC] Answer sdp length:', answer.sdp?.length);
            console.log('📞 [WEBRTC] Socket state for answer handling:', {
                connected: this.socket?.connected,
                id: this.socket?.id
            });
            if (!this.peerConnection) {
                throw new Error('PeerConnection not initialized');
            }
            // Check peer connection state before setting remote description
            console.log('📞 [WEBRTC] Peer connection state before setting answer:', this.peerConnection.signalingState);
            // If already stable with an answer applied, ignore duplicate answers
            if (this.peerConnection.signalingState === 'stable') {
                const rd = this.peerConnection.remoteDescription;
                if (rd?.type === 'answer') {
                    console.log('📞 [WEBRTC] Duplicate/late answer received in stable state - ignoring');
                    return;
                }
            }
            // Be tolerant: try to set the remote answer even if state is unexpected
            try {
                await this.peerConnection.setRemoteDescription(answer);
            }
            catch (err) {
                console.warn('⚠️ [WEBRTC] setRemoteDescription(answer) failed, state:', this.peerConnection.signalingState, 'error:', err);
                // Try minor recovery by rolling back and retrying if we still have a local offer
                try {
                    if (this.peerConnection.signalingState === 'have-local-offer') {
                        console.log('📞 [WEBRTC] Retrying setRemoteDescription(answer) after brief wait');
                        await new Promise(r => setTimeout(r, 100));
                        await this.peerConnection.setRemoteDescription(answer);
                    }
                    else if (this.peerConnection.signalingState === 'stable') {
                        // If stable at this point, safely ignore
                        console.log('📞 [WEBRTC] Stable state during answer apply - ignoring');
                        return;
                    }
                }
                catch (retryErr) {
                    console.error('❌ [WEBRTC] Retry setRemoteDescription(answer) failed:', retryErr);
                    throw retryErr;
                }
            }
            console.log('📞 [WEBRTC] Set remote description from answer');
            // Try to attach existing receivers' tracks immediately
            try {
                const receivers = this.peerConnection.getReceivers?.() || [];
                console.log('📞 [WEBRTC] Post-answer receivers:', receivers.length);
            }
            catch { }
            // Fallback attach
            try {
                const receivers = this.peerConnection.getReceivers?.() || [];
                if (receivers.length > 0) {
                    if (!this.remoteStream)
                        this.remoteStream = new MediaStream();
                    receivers.forEach((r) => r.track && !this.remoteStream.getTracks().includes(r.track) && this.remoteStream.addTrack(r.track));
                    this.onRemoteStream?.(this.remoteStream);
                }
            }
            catch (e) {
                console.warn('⚠️ [WEBRTC] Failed to attach receivers after answer:', e);
            }
            console.log('📞 [WEBRTC] Remote description set successfully');
            // Process any pending ICE candidates
            await this.processPendingIceCandidates();
            console.log('📞 [WEBRTC] ===== ANSWER PROCESSING COMPLETE =====');
            console.log('📞 [WEBRTC] Peer connection state after answer:', this.peerConnection?.connectionState);
            console.log('📞 [WEBRTC] ICE connection state after answer:', this.peerConnection?.iceConnectionState);
            console.log('📞 [WEBRTC] Signaling state after answer:', this.peerConnection?.signalingState);
            console.log('📞 [WEBRTC] ICE gathering state after answer:', this.peerConnection?.iceGatheringState);
            console.log('📞 [WEBRTC] ===== END ANSWER PROCESSING =====');
        }
        catch (error) {
            console.error('❌ [WEBRTC] Error handling answer:', error);
            throw error;
        }
    }
    async handleIceCandidate(candidate) {
        try {
            console.log('📞 [WEBRTC] Handling ICE candidate:', candidate);
            console.log('📞 [WEBRTC] Socket state for ICE candidate:', {
                connected: this.socket?.connected,
                id: this.socket?.id
            });
            if (!this.peerConnection) {
                throw new Error('PeerConnection not initialized');
            }
            // Check if remote description is set before adding ICE candidate
            console.log('📞 [WEBRTC] Peer connection signaling state:', this.peerConnection.signalingState);
            console.log('📞 [WEBRTC] Remote description set:', !!this.peerConnection.remoteDescription);
            if (!this.peerConnection.remoteDescription) {
                console.warn('⚠️ [WEBRTC] Remote description not set yet, queueing ICE candidate');
                // Queue the candidate to be added later
                this.pendingIceCandidates.push(candidate);
                return;
            }
            await this.peerConnection.addIceCandidate(candidate);
            console.log('📞 [WEBRTC] ICE candidate added successfully');
            console.log('📞 [WEBRTC] ICE connection state after candidate:', this.peerConnection?.iceConnectionState);
        }
        catch (error) {
            console.error('❌ [WEBRTC] Error handling ICE candidate:', error);
            throw error;
        }
    }
    async processPendingIceCandidates() {
        if (this.pendingIceCandidates.length === 0) {
            return;
        }
        console.log(`📞 [WEBRTC] Processing ${this.pendingIceCandidates.length} pending ICE candidates`);
        for (const candidate of this.pendingIceCandidates) {
            try {
                await this.peerConnection.addIceCandidate(candidate);
                console.log('📞 [WEBRTC] Pending ICE candidate added successfully');
            }
            catch (error) {
                console.error('❌ [WEBRTC] Error adding pending ICE candidate:', error);
            }
        }
        // Clear the pending candidates
        this.pendingIceCandidates = [];
        console.log('📞 [WEBRTC] All pending ICE candidates processed');
    }
    // Remove IPv6 candidates; in strict phases remove non-relay (host/srflx) from SDP
    mungeSdpForPhase(sdp) {
        try {
            const lines = sdp.split(/\r?\n/);
            const out = [];
            for (const line of lines) {
                if (line.startsWith('a=candidate:')) {
                    const isIpv6 = / IP6 /i.test(line);
                    const isRelay = / typ relay /i.test(line);
                    const isHost = / typ host /i.test(line);
                    const isSrflx = / typ srflx /i.test(line);
                    if (isIpv6)
                        continue; // drop ipv6
                    if (this.icePhase >= 1 && !(isRelay))
                        continue; // keep relay only in strict phases
                    if (this.icePhase >= 1 && (isHost || isSrflx))
                        continue;
                }
                out.push(line);
            }
            return out.join('\r\n');
        }
        catch {
            return sdp;
        }
    }
    // Build ICE servers by phase (TLS-only for reliability on restricted networks)
    buildIceServers(phase) {
        // Allow runtime TURN override via window.TURN_CONFIG or localStorage 'turn_config'
        let runtimeCfg = null;
        let forceHostV4 = null;
        try {
            runtimeCfg = (typeof window !== 'undefined' && window.TURN_CONFIG) || null;
            if (!runtimeCfg && typeof window !== 'undefined') {
                const raw = localStorage.getItem('turn_config');
                if (raw)
                    runtimeCfg = JSON.parse(raw);
                forceHostV4 = localStorage.getItem('turn_host_v4');
            }
        }
        catch { }
        const buildFrom = (host, username, credential) => {
            const targetHost = (forceHostV4 && /^(\d+\.){3}\d+$/.test(forceHostV4)) ? forceHostV4 : host;
            return [{ urls: [`turns:${targetHost}:443`], username, credential }];
        };
        if (runtimeCfg?.host && runtimeCfg?.username && runtimeCfg?.credential) {
            return buildFrom(runtimeCfg.host, runtimeCfg.username, runtimeCfg.credential);
        }
        // Fallback to day2call.metered.live using provided credentials
        return buildFrom('day2call.metered.live', 'ac1c979785feb61d89d10f9e', 'lfBd3uXzDApKCXU/');
    }
    async fetchMeteredIceServers() {
        try {
            const endpoint = 'https://day2call.metered.live/api/v1/turn/credentials?apiKey=24f1a6c2f728ac32bbc7e00c8af77b0e7be1';
            const res = await fetch(endpoint, { cache: 'no-store' });
            const servers = await res.json();
            console.log('📞 [WEBRTC] Metered iceServers fetched:', servers);
            // Ensure only TLS entries are used by default (drop UDP + non‑TLS TCP)
            if (Array.isArray(servers)) {
                let forceHostV4 = null;
                try {
                    forceHostV4 = (typeof window !== 'undefined') ? localStorage.getItem('turn_host_v4') : null;
                }
                catch { }
                servers.forEach((s) => {
                    const toArray = (u) => Array.isArray(u) ? u : (u ? [u] : []);
                    const urls = toArray(s.urls);
                    const filtered = urls.filter((u) => u.startsWith('turns:'));
                    if (filtered.length > 0)
                        s.urls = filtered;
                });
                // Normalize: ensure every entry has urls[] and username/credential
                const fallbackUser = servers.find((s) => s?.username)?.username || 'ac1c979785feb61d89d10f9e';
                const fallbackCred = servers.find((s) => s?.credential)?.credential || 'lfBd3uXzDApKCXU/';
                const normalized = [];
                servers.forEach((s) => {
                    const toArray = (u) => Array.isArray(u) ? u : (u ? [u] : []);
                    let urls = toArray(s.urls).filter((u) => !!u);
                    urls = urls.filter((u) => u.startsWith('turns:'));
                    if (urls.length === 0)
                        return; // skip non‑TURN rows
                    normalized.push({ urls, username: s.username || fallbackUser, credential: s.credential || fallbackCred });
                });
                // Replace servers with normalized list
                servers.length = 0;
                normalized.forEach((e) => servers.push(e));
                // If user explicitly forces an IPv4 literal, append TURN over TCP 443 using that IPv4.
                // Keep 'turns:' hostnames for TLS/SNI, and offer an IPv4 TCP fallback for networks with IPv6 issues.
                if (forceHostV4 && /^(\d+\.){3}\d+$/.test(forceHostV4)) {
                    const first = servers[0];
                    if (first) {
                        const toArray = (u) => Array.isArray(u) ? u : (u ? [u] : []);
                        const urls = toArray(first.urls) || [];
                        const tcpUrl = `turn:${forceHostV4}:443?transport=tcp`;
                        if (!urls.includes(tcpUrl)) {
                            first.urls = [...urls, tcpUrl];
                        }
                    }
                }
                // Optionally remove TURN over TLS (tcp) entries entirely
                try {
                    const disableTls = (typeof window !== 'undefined') ? localStorage.getItem('disable_turns_tls') === 'true' : false;
                    if (disableTls) {
                        servers.forEach((s) => {
                            const toArray = (u) => Array.isArray(u) ? u : (u ? [u] : []);
                            const urls = toArray(s.urls);
                            s.urls = urls.filter((u) => !u.startsWith('turns:') && !u.includes('transport=tcp'));
                        });
                    }
                }
                catch { }
                const hasTcp = servers.some((s) => Array.isArray(s.urls)
                    ? s.urls.some((u) => u.startsWith('turns:'))
                    : typeof s.urls === 'string' && s.urls.startsWith('turns:'));
                if (!hasTcp) {
                    // try to infer host from first entry
                    const first = servers[0];
                    const urls = Array.isArray(first?.urls) ? first.urls : [first?.urls].filter(Boolean);
                    const hostMatch = urls?.map((u) => /turns?:([^:]+):/.exec(u) || /stun:([^:]+):/.exec(u))
                        .find(Boolean);
                    const host = hostMatch?.[1] || 'global.relay.metered.ca';
                    servers.push({ urls: [`turns:${host}:443`], username: first?.username, credential: first?.credential });
                }
            }
            return servers;
        }
        catch (e) {
            console.warn('⚠️ [WEBRTC] Failed to fetch Metered iceServers, falling back to defaults:', e);
            return this.getPreferredIceServers();
        }
    }
    emitIceCandidate(candidate) {
        console.log('📞 [WEBRTC] Sending ICE candidate:', candidate);
        console.log('📞 [WEBRTC] Socket connected for ICE:', this.socket?.connected);
        if (!this.socket || !this.socket.connected) {
            console.error('❌ [WEBRTC] Socket not connected - cannot send ICE candidate');
            return;
        }
        // Only include targetUserId if it's set, otherwise let backend resolve from call participants
        const iceData = {
            candidate,
            callId: this.callId
        };
        if (this.targetUserId) {
            iceData.targetUserId = this.targetUserId;
        }
        this.socket.emit('webrtc:ice-candidate', iceData);
        console.log('📞 [WEBRTC] ICE candidate emitted successfully');
    }
    getLastLocalAnswer() {
        return this.lastLocalAnswer || this.peerConnection?.localDescription?.type === 'answer' ? this.peerConnection.localDescription : null;
    }
    async waitForPeerReady() {
        let attempts = 0;
        const maxAttempts = 20; // ~4s
        while (attempts < maxAttempts) {
            attempts++;
            const pc = this.peerConnection;
            const ready = !!pc && pc.signalingState !== 'closed' && !!this.localStream;
            if (ready) {
                // small extra wait if signaling is busy
                if (pc.signalingState === 'stable' || pc.signalingState === 'have-local-offer' || pc.signalingState === 'have-remote-offer') {
                    return;
                }
            }
            await new Promise(r => setTimeout(r, 200));
        }
        console.warn('⚠️ [WEBRTC] waitForPeerReady timeout - continuing to createOffer anyway');
    }
    async restartIceWithPhase(phase) {
        try {
            this.icePhase = phase;
            const state = this.peerConnection.signalingState;
            // Avoid renegotiation glare: only proceed when safe
            if (state === 'have-remote-offer' || state === 'closed') {
                console.warn('⚠️ [WEBRTC] restartIceWithPhase deferred due to signalingState:', state);
                setTimeout(() => this.restartIceWithPhase(phase), 1000);
                return;
            }
            // Wait for socket connection before proceeding
            if (!this.socket || !this.socket.connected) {
                console.warn('⚠️ [WEBRTC] Socket not connected, skipping ICE restart');
                return;
            }
            const config = this.peerConnection.getConfiguration?.();
            const nextIce = this.getPreferredIceServers(); // Use direct servers instead of buildIceServers
            console.log('📞 [WEBRTC] Restart ICE with phase:', phase, nextIce, 'state:', state);
            if (typeof this.peerConnection.setConfiguration === 'function') {
                this.peerConnection.setConfiguration({
                    ...(config || {}),
                    iceServers: nextIce,
                    // In stricter phases, force relay-only to avoid local/srflx candidates that fail on some networks
                    iceTransportPolicy: phase >= 1 ? 'relay' : 'all'
                });
            }
            // Only restart when stable or when we already have a local offer (caller path)
            if (state === 'stable' || state === 'have-local-offer') {
                await this.createOffer({ iceRestart: true });
            }
            else {
                console.warn('⚠️ [WEBRTC] Skipping immediate iceRestart due to signalingState:', state);
            }
        }
        catch (e) {
            console.error('❌ [WEBRTC] restartIceWithPhase failed:', e);
        }
    }
    // Heuristic: if we see repeated 701 (STUN/TURN timeout) errors, progressively
    // tighten the strategy: phase 0 -> 1 -> 2
    handleIceError(event) {
        const now = Date.now();
        if (now - this.lastIceErrorTs > 10000) {
            // reset window every 10s
            this.iceErrorCount = 0;
        }
        this.lastIceErrorTs = now;
        this.iceErrorCount++;
        const code = event?.errorCode;
        const text = (event?.errorText || '').toString().toLowerCase();
        const isTimeout = code === 701 || text.includes('timed out') || text.includes('timeout');
        if (!isTimeout)
            return;
        // After a few consecutive timeouts, escalate phase
        if (this.iceErrorCount === 5 && this.icePhase === 0) {
            console.warn('⚠️ [WEBRTC] Repeated ICE timeouts on phase 0 → switching to TURN-UDP only');
            this.restartIceWithPhase(1);
        }
        else if (this.iceErrorCount === 10 && this.icePhase <= 1) {
            console.warn('⚠️ [WEBRTC] Continued ICE timeouts → switching to TURN TCP/TLS');
            this.restartIceWithPhase(2);
        }
    }
    // Attach existing remote tracks from RTCRtpReceivers in case ontrack hasn't fired yet
    attachExistingRemoteTracks() {
        try {
            if (!this.peerConnection || typeof this.peerConnection.getReceivers !== 'function') {
                return;
            }
            const receivers = this.peerConnection.getReceivers() || [];
            const tracks = receivers.map((r) => r.track).filter((t) => !!t);
            console.log('📞 [WEBRTC] attachExistingRemoteTracks receivers:', receivers.length, 'tracks:', tracks.map((t) => t?.kind + ':' + t?.readyState));
            if (tracks.length === 0)
                return;
            if (!this.remoteStream)
                this.remoteStream = new MediaStream();
            tracks.forEach((t) => {
                if (!this.remoteStream.getTracks().includes(t)) {
                    this.remoteStream.addTrack(t);
                }
            });
            this.onRemoteStream?.(this.remoteStream);
        }
        catch (error) {
            console.warn('⚠️ [WEBRTC] attachExistingRemoteTracks error:', error);
        }
    }
    getLocalStream() {
        return this.localStream;
    }
    getRemoteStream() {
        return this.remoteStream;
    }
    toggleMute() {
        if (this.localStream) {
            const audioTrack = this.localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                return !audioTrack.enabled;
            }
        }
        return false;
    }
    toggleVideo() {
        if (this.localStream) {
            const videoTrack = this.localStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                return videoTrack.enabled;
            }
        }
        return false;
    }
    async switchCamera() {
        try {
            console.log('📞 [WEBRTC] Switching camera from', this.currentFacingMode);
            // Toggle facing mode
            this.currentFacingMode = this.currentFacingMode === 'user' ? 'environment' : 'user';
            if (!this.localStream) {
                console.warn('⚠️ [WEBRTC] No local stream to switch camera');
                return false;
            }
            // Get current video track
            const videoTrack = this.localStream.getVideoTracks()[0];
            if (!videoTrack) {
                console.warn('⚠️ [WEBRTC] No video track found');
                return false;
            }
            // Stop current track
            videoTrack.stop();
            // Get new stream with opposite facing mode
            let newStream;
            if (Platform.OS === 'web') {
                newStream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: this.currentFacingMode,
                        width: { ideal: 1920, min: 1280 },
                        height: { ideal: 1080, min: 720 },
                        frameRate: { ideal: 30, max: 30 },
                        aspectRatio: { ideal: 16 / 9 }
                    },
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true,
                        sampleRate: 48000,
                        channelCount: 1
                    },
                });
            }
            else {
                const WebRTC = require('react-native-webrtc');
                const { mediaDevices } = WebRTC;
                newStream = await mediaDevices.getUserMedia({
                    video: {
                        facingMode: this.currentFacingMode,
                        width: { ideal: 1920, min: 1280 },
                        height: { ideal: 1080, min: 720 },
                        frameRate: { ideal: 30, max: 30 },
                    },
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true,
                        sampleRate: 48000,
                        channelCount: 1,
                    },
                });
            }
            // Get new video track
            const newVideoTrack = newStream.getVideoTracks()[0];
            if (!newVideoTrack) {
                console.error('❌ [WEBRTC] No video track in new stream');
                return false;
            }
            // Replace track in peer connection
            if (this.peerConnection) {
                const sender = this.peerConnection.getSenders().find((s) => s.track && s.track.kind === 'video');
                if (sender) {
                    await sender.replaceTrack(newVideoTrack);
                    console.log('📞 [WEBRTC] Video track replaced in peer connection');
                }
            }
            // Update local stream
            this.localStream.removeTrack(videoTrack);
            this.localStream.addTrack(newVideoTrack);
            // Keep audio track from original stream
            const audioTrack = this.localStream.getAudioTracks()[0];
            if (audioTrack && newStream.getAudioTracks().length > 0) {
                // Use audio from new stream if available, otherwise keep old
                const newAudioTrack = newStream.getAudioTracks()[0];
                if (newAudioTrack) {
                    this.localStream.removeTrack(audioTrack);
                    this.localStream.addTrack(newAudioTrack);
                }
            }
            console.log('📞 [WEBRTC] Camera switched to', this.currentFacingMode);
            return true;
        }
        catch (error) {
            console.error('❌ [WEBRTC] Error switching camera:', error);
            return false;
        }
    }
    toggleSpeaker() {
        try {
            this.isSpeakerOn = !this.isSpeakerOn;
            console.log('📞 [WEBRTC] Speaker toggled to', this.isSpeakerOn);
            if (Platform.OS === 'web') {
                // For web, we can't directly control speaker, but we can set volume
                // The browser handles audio routing
                console.log('📞 [WEBRTC] Web platform - speaker control handled by browser');
                return this.isSpeakerOn;
            }
            else {
                // For mobile, we need to use native audio routing
                // This would typically require a native module
                // For now, we'll just track the state
                console.log('📞 [WEBRTC] Mobile platform - speaker state:', this.isSpeakerOn);
                return this.isSpeakerOn;
            }
        }
        catch (error) {
            console.error('❌ [WEBRTC] Error toggling speaker:', error);
            return false;
        }
    }
    getCameraPosition() {
        return this.currentFacingMode === 'user' ? 'front' : 'back';
    }
    getSpeakerState() {
        return this.isSpeakerOn;
    }
    getPeerConnection() {
        return this.peerConnection;
    }
    async applyFilter(filterType) {
        this.currentFilter = filterType;
        if (Platform.OS !== 'web') {
            // For mobile, filters would require native modules or complex processing
            // For now, we'll just track the filter state
            console.log('📞 [WEBRTC] Filter applied (mobile):', filterType);
            return;
        }
        if (!this.localStream) {
            console.warn('⚠️ [WEBRTC] No local stream to apply filter');
            return;
        }
        try {
            // If filter is 'none', use original stream
            if (filterType === 'none') {
                if (this.filterStream) {
                    this.filterStream.getTracks().forEach(track => track.stop());
                    this.filterStream = null;
                }
                if (this.filterVideoElement) {
                    this.filterVideoElement.srcObject = null;
                    this.filterVideoElement = null;
                }
                if (this.filterCanvas) {
                    this.filterCanvas = null;
                    this.filterContext = null;
                }
                return;
            }
            // Create video element to capture frames
            if (!this.filterVideoElement) {
                this.filterVideoElement = document.createElement('video');
                this.filterVideoElement.autoplay = true;
                this.filterVideoElement.playsInline = true;
                this.filterVideoElement.srcObject = this.localStream;
            }
            // Create canvas for processing
            if (!this.filterCanvas) {
                this.filterCanvas = document.createElement('canvas');
                this.filterContext = this.filterCanvas.getContext('2d', { willReadFrequently: true });
                const videoTrack = this.localStream.getVideoTracks()[0];
                if (videoTrack && videoTrack.getSettings) {
                    const settings = videoTrack.getSettings();
                    this.filterCanvas.width = settings.width || 1280;
                    this.filterCanvas.height = settings.height || 720;
                }
            }
            // Create filtered stream
            if (!this.filterStream) {
                this.filterStream = this.filterCanvas.captureStream(30); // 30 fps
                // Replace video track in peer connection
                const videoTrack = this.filterStream.getVideoTracks()[0];
                if (this.peerConnection && videoTrack) {
                    const sender = this.peerConnection.getSenders().find((s) => s.track && s.track.kind === 'video');
                    if (sender) {
                        await sender.replaceTrack(videoTrack);
                    }
                }
            }
            // Process frames with filter
            const processFrame = () => {
                if (!this.filterVideoElement || !this.filterCanvas || !this.filterContext)
                    return;
                if (this.filterVideoElement.readyState >= 2) {
                    // Draw video frame to canvas
                    this.filterContext.drawImage(this.filterVideoElement, 0, 0, this.filterCanvas.width, this.filterCanvas.height);
                    // Apply filter based on type
                    const imageData = this.filterContext.getImageData(0, 0, this.filterCanvas.width, this.filterCanvas.height);
                    const data = imageData.data;
                    switch (filterType) {
                        case 'beauty-smooth':
                            // Simple smoothing (box blur approximation)
                            this.applyBoxBlur(data, imageData.width, imageData.height, 2);
                            break;
                        case 'beauty-bright':
                            // Increase brightness
                            for (let i = 0; i < data.length; i += 4) {
                                data[i] = Math.min(255, data[i] * 1.2); // R
                                data[i + 1] = Math.min(255, data[i + 1] * 1.2); // G
                                data[i + 2] = Math.min(255, data[i + 2] * 1.2); // B
                            }
                            break;
                        case 'beauty-contrast':
                            // Increase contrast
                            const factor = 1.3;
                            const intercept = 128 * (1 - factor);
                            for (let i = 0; i < data.length; i += 4) {
                                data[i] = Math.min(255, Math.max(0, data[i] * factor + intercept));
                                data[i + 1] = Math.min(255, Math.max(0, data[i + 1] * factor + intercept));
                                data[i + 2] = Math.min(255, Math.max(0, data[i + 2] * factor + intercept));
                            }
                            break;
                        case 'fun-blur':
                            this.applyBoxBlur(data, imageData.width, imageData.height, 5);
                            break;
                        case 'fun-vintage':
                            // Vintage effect (warm tone + slight desaturation)
                            for (let i = 0; i < data.length; i += 4) {
                                const r = data[i];
                                const g = data[i + 1];
                                const b = data[i + 2];
                                data[i] = Math.min(255, r * 1.1 + 10);
                                data[i + 1] = Math.min(255, g * 0.95);
                                data[i + 2] = Math.min(255, b * 0.9);
                            }
                            break;
                        case 'fun-sepia':
                            // Sepia effect
                            for (let i = 0; i < data.length; i += 4) {
                                const r = data[i];
                                const g = data[i + 1];
                                const b = data[i + 2];
                                data[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189));
                                data[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168));
                                data[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131));
                            }
                            break;
                        case 'fun-bw':
                            // Black and white
                            for (let i = 0; i < data.length; i += 4) {
                                const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
                                data[i] = gray;
                                data[i + 1] = gray;
                                data[i + 2] = gray;
                            }
                            break;
                    }
                    this.filterContext.putImageData(imageData, 0, 0);
                }
                if (this.currentFilter !== 'none') {
                    requestAnimationFrame(processFrame);
                }
            };
            this.filterVideoElement.addEventListener('loadedmetadata', () => {
                processFrame();
            });
            if (this.filterVideoElement.readyState >= 2) {
                processFrame();
            }
            console.log('📞 [WEBRTC] Filter applied:', filterType);
        }
        catch (error) {
            console.error('❌ [WEBRTC] Error applying filter:', error);
        }
    }
    applyBoxBlur(data, width, height, radius) {
        // Simple box blur implementation
        const temp = new Uint8ClampedArray(data);
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                let r = 0, g = 0, b = 0, count = 0;
                for (let dy = -radius; dy <= radius; dy++) {
                    for (let dx = -radius; dx <= radius; dx++) {
                        const nx = x + dx;
                        const ny = y + dy;
                        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                            const idx = (ny * width + nx) * 4;
                            r += temp[idx];
                            g += temp[idx + 1];
                            b += temp[idx + 2];
                            count++;
                        }
                    }
                }
                const idx = (y * width + x) * 4;
                data[idx] = r / count;
                data[idx + 1] = g / count;
                data[idx + 2] = b / count;
            }
        }
    }
    getCurrentFilter() {
        return this.currentFilter;
    }
    async startScreenShare() {
        try {
            if (Platform.OS !== 'web') {
                console.warn('⚠️ [WEBRTC] Screen sharing not supported on mobile');
                return false;
            }
            if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
                console.error('❌ [WEBRTC] getDisplayMedia not supported');
                return false;
            }
            console.log('📞 [WEBRTC] Starting screen share...');
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    displaySurface: 'monitor',
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                },
                audio: false // Screen share typically doesn't include audio
            });
            this.screenShareStream = stream;
            this.isScreenSharing = true;
            // Replace video track in peer connection
            const videoTrack = stream.getVideoTracks()[0];
            if (this.peerConnection && videoTrack) {
                const sender = this.peerConnection.getSenders().find((s) => s.track && s.track.kind === 'video');
                if (sender) {
                    await sender.replaceTrack(videoTrack);
                    console.log('📞 [WEBRTC] Screen share track replaced in peer connection');
                }
            }
            // Handle screen share end (user clicks stop sharing)
            videoTrack.onended = () => {
                console.log('📞 [WEBRTC] Screen share ended by user');
                this.stopScreenShare();
            };
            console.log('📞 [WEBRTC] Screen share started successfully');
            return true;
        }
        catch (error) {
            console.error('❌ [WEBRTC] Error starting screen share:', error);
            return false;
        }
    }
    async stopScreenShare() {
        try {
            if (this.screenShareStream) {
                this.screenShareStream.getTracks().forEach(track => track.stop());
                this.screenShareStream = null;
            }
            this.isScreenSharing = false;
            // Restore original video track
            if (this.localStream && this.peerConnection) {
                const videoTrack = this.localStream.getVideoTracks()[0];
                if (videoTrack) {
                    const sender = this.peerConnection.getSenders().find((s) => s.track && s.track.kind === 'video');
                    if (sender) {
                        await sender.replaceTrack(videoTrack);
                        console.log('📞 [WEBRTC] Restored original video track');
                    }
                }
            }
            console.log('📞 [WEBRTC] Screen share stopped');
        }
        catch (error) {
            console.error('❌ [WEBRTC] Error stopping screen share:', error);
        }
    }
    getScreenShareState() {
        return this.isScreenSharing;
    }
    endCall() {
        if (this.localStream) {
            this.localStream.getTracks().forEach((track) => track.stop());
        }
        if (this.screenShareStream) {
            this.screenShareStream.getTracks().forEach((track) => track.stop());
            this.screenShareStream = null;
        }
        if (this.filterStream) {
            this.filterStream.getTracks().forEach((track) => track.stop());
            this.filterStream = null;
        }
        if (this.peerConnection) {
            this.peerConnection.close();
        }
        this.socket?.emit('call:end', { callId: this.callId });
    }
}
