import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef, useEffect } from 'react';
export function MediaTest() {
    const [videoStream, setVideoStream] = useState(null);
    const [audioStream, setAudioStream] = useState(null);
    const [error, setError] = useState(null);
    const [logs, setLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    // Device lists
    const [videoDevices, setVideoDevices] = useState([]);
    const [audioDevices, setAudioDevices] = useState([]);
    const [selectedVideoDeviceId, setSelectedVideoDeviceId] = useState('');
    const [selectedAudioDeviceId, setSelectedAudioDeviceId] = useState('');
    const [devicesLoaded, setDevicesLoaded] = useState(false);
    const videoRef = useRef(null);
    const addLog = (message) => {
        const timestamp = new Date().toLocaleTimeString();
        const logMessage = `[${timestamp}] ${message}`;
        console.log(logMessage);
        setLogs((prev) => [...prev, logMessage]);
    };
    const clearLogs = () => {
        setLogs([]);
    };
    // Load available devices
    const loadDevices = async () => {
        try {
            addLog('Loading available devices...');
            if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
                addLog('❌ enumerateDevices not available');
                return;
            }
            // First, request permission to get device labels (they'll be empty without permission)
            try {
                await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                addLog('✅ Permission granted, device labels will be available');
            }
            catch (err) {
                addLog('⚠️ Permission not granted, device labels may be empty');
            }
            const devices = await navigator.mediaDevices.enumerateDevices();
            addLog(`Found ${devices.length} devices total`);
            const videoDevs = devices.filter(d => d.kind === 'videoinput');
            const audioDevs = devices.filter(d => d.kind === 'audioinput');
            addLog(`Video devices: ${videoDevs.length}`);
            videoDevs.forEach((dev, index) => {
                addLog(`  ${index + 1}. ${dev.label || `Camera ${index + 1}`} (${dev.deviceId.substring(0, 20)}...)`);
            });
            addLog(`Audio devices: ${audioDevs.length}`);
            audioDevs.forEach((dev, index) => {
                addLog(`  ${index + 1}. ${dev.label || `Microphone ${index + 1}`} (${dev.deviceId.substring(0, 20)}...)`);
            });
            setVideoDevices(videoDevs.map(d => ({
                deviceId: d.deviceId,
                kind: d.kind,
                label: d.label || `Camera ${videoDevs.indexOf(d) + 1}`,
                groupId: d.groupId,
            })));
            setAudioDevices(audioDevs.map(d => ({
                deviceId: d.deviceId,
                kind: d.kind,
                label: d.label || `Microphone ${audioDevs.indexOf(d) + 1}`,
                groupId: d.groupId,
            })));
            // Auto-select first device if available
            if (videoDevs.length > 0 && !selectedVideoDeviceId) {
                setSelectedVideoDeviceId(videoDevs[0].deviceId);
            }
            if (audioDevs.length > 0 && !selectedAudioDeviceId) {
                setSelectedAudioDeviceId(audioDevs[0].deviceId);
            }
            setDevicesLoaded(true);
            addLog('✅ Devices loaded successfully');
        }
        catch (err) {
            addLog(`❌ Error loading devices: ${err.message}`);
            setError(`Failed to load devices: ${err.message}`);
        }
    };
    const stopAllStreams = () => {
        if (videoStream) {
            videoStream.getTracks().forEach((track) => {
                track.stop();
                addLog(`Stopped ${track.kind} track: ${track.id}`);
            });
            setVideoStream(null);
        }
        if (audioStream) {
            audioStream.getTracks().forEach((track) => {
                track.stop();
                addLog(`Stopped ${track.kind} track: ${track.id}`);
            });
            setAudioStream(null);
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setError(null);
        addLog('All streams stopped');
    };
    const testCamera = async () => {
        setIsLoading(true);
        setError(null);
        addLog('=== Testing Camera ===');
        addLog('Environment check:');
        addLog(`  - Origin: ${window.location.origin}`);
        addLog(`  - URL: ${window.location.href}`);
        addLog(`  - Is secure context: ${window.isSecureContext}`);
        addLog(`  - MediaDevices available: ${!!navigator.mediaDevices}`);
        addLog(`  - getUserMedia available: ${!!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)}`);
        // Check if electronAPI is available
        if (window.electronAPI) {
            addLog('  - Electron API available: YES');
            try {
                const permResult = await window.electronAPI.requestMediaPermissions();
                addLog(`  - Permission request result: ${JSON.stringify(permResult)}`);
            }
            catch (err) {
                addLog(`  - Permission request error: ${err.message}`);
            }
        }
        else {
            addLog('  - Electron API available: NO');
        }
        try {
            // Stop existing streams
            stopAllStreams();
            addLog('Requesting camera access...');
            const constraints = {
                video: selectedVideoDeviceId
                    ? { deviceId: { exact: selectedVideoDeviceId } }
                    : true,
            };
            if (selectedVideoDeviceId) {
                addLog(`Using selected camera: ${videoDevices.find(d => d.deviceId === selectedVideoDeviceId)?.label || selectedVideoDeviceId}`);
            }
            addLog(`Calling navigator.mediaDevices.getUserMedia(${JSON.stringify(constraints)})...`);
            console.log('[MediaTest] About to call getUserMedia for camera', constraints);
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            console.log('[MediaTest] getUserMedia succeeded:', stream);
            addLog('✅ Camera access granted!');
            addLog(`Stream ID: ${stream.id}`);
            addLog(`Stream active: ${stream.active}`);
            const tracks = stream.getVideoTracks();
            addLog(`Video tracks: ${tracks.length}`);
            tracks.forEach((track, index) => {
                addLog(`  Track ${index + 1}:`);
                addLog(`    - ID: ${track.id}`);
                addLog(`    - Label: ${track.label}`);
                addLog(`    - Enabled: ${track.enabled}`);
                addLog(`    - Muted: ${track.muted}`);
                addLog(`    - ReadyState: ${track.readyState}`);
                addLog(`    - Settings: ${JSON.stringify(track.getSettings(), null, 2)}`);
            });
            setVideoStream(stream);
            // Video will be attached via useEffect
            addLog('Video stream set, will be attached to video element');
        }
        catch (err) {
            const errorName = err.name || 'UnknownError';
            const errorMessage = err.message || 'Unknown error';
            addLog(`❌ Error: ${errorName}`);
            addLog(`   Message: ${errorMessage}`);
            let userMessage = '';
            switch (errorName) {
                case 'NotAllowedError':
                    userMessage = 'Camera permission denied. Please allow access in Windows Settings (Privacy → Camera).';
                    break;
                case 'NotFoundError':
                    userMessage = 'No camera found. Please connect a camera device.';
                    break;
                case 'NotReadableError':
                    userMessage = 'Camera is already in use by another application.';
                    break;
                case 'OverconstrainedError':
                    userMessage = 'Camera constraints cannot be satisfied.';
                    break;
                case 'SecurityError':
                    userMessage = 'Security error: App must run in secure context.';
                    break;
                default:
                    userMessage = `Error: ${errorMessage}`;
            }
            setError(userMessage);
            addLog(`   User message: ${userMessage}`);
        }
        finally {
            setIsLoading(false);
        }
    };
    const testMicrophone = async () => {
        setIsLoading(true);
        setError(null);
        addLog('=== Testing Microphone ===');
        addLog('Environment check:');
        addLog(`  - Origin: ${window.location.origin}`);
        addLog(`  - URL: ${window.location.href}`);
        addLog(`  - Is secure context: ${window.isSecureContext}`);
        addLog(`  - MediaDevices available: ${!!navigator.mediaDevices}`);
        // Check if electronAPI is available
        if (window.electronAPI) {
            addLog('  - Electron API available: YES');
        }
        else {
            addLog('  - Electron API available: NO');
        }
        try {
            // Stop existing streams
            stopAllStreams();
            addLog('Requesting microphone access...');
            const constraints = {
                audio: selectedAudioDeviceId
                    ? { deviceId: { exact: selectedAudioDeviceId } }
                    : true,
            };
            if (selectedAudioDeviceId) {
                addLog(`Using selected microphone: ${audioDevices.find(d => d.deviceId === selectedAudioDeviceId)?.label || selectedAudioDeviceId}`);
            }
            addLog(`Calling navigator.mediaDevices.getUserMedia(${JSON.stringify(constraints)})...`);
            console.log('[MediaTest] About to call getUserMedia for microphone', constraints);
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            console.log('[MediaTest] getUserMedia succeeded:', stream);
            addLog('✅ Microphone access granted!');
            addLog(`Stream ID: ${stream.id}`);
            addLog(`Stream active: ${stream.active}`);
            const tracks = stream.getAudioTracks();
            addLog(`Audio tracks: ${tracks.length}`);
            tracks.forEach((track, index) => {
                addLog(`  Track ${index + 1}:`);
                addLog(`    - ID: ${track.id}`);
                addLog(`    - Label: ${track.label}`);
                addLog(`    - Enabled: ${track.enabled}`);
                addLog(`    - Muted: ${track.muted}`);
                addLog(`    - ReadyState: ${track.readyState}`);
                addLog(`    - Settings: ${JSON.stringify(track.getSettings(), null, 2)}`);
            });
            setAudioStream(stream);
        }
        catch (err) {
            const errorName = err.name || 'UnknownError';
            const errorMessage = err.message || 'Unknown error';
            addLog(`❌ Error: ${errorName}`);
            addLog(`   Message: ${errorMessage}`);
            let userMessage = '';
            switch (errorName) {
                case 'NotAllowedError':
                    userMessage = 'Microphone permission denied. Please allow access in Windows Settings (Privacy → Microphone).';
                    break;
                case 'NotFoundError':
                    userMessage = 'No microphone found. Please connect a microphone device.';
                    break;
                case 'NotReadableError':
                    userMessage = 'Microphone is already in use by another application.';
                    break;
                case 'OverconstrainedError':
                    userMessage = 'Microphone constraints cannot be satisfied.';
                    break;
                case 'SecurityError':
                    userMessage = 'Security error: App must run in secure context.';
                    break;
                default:
                    userMessage = `Error: ${errorMessage}`;
            }
            setError(userMessage);
            addLog(`   User message: ${userMessage}`);
        }
        finally {
            setIsLoading(false);
        }
    };
    const testBoth = async () => {
        setIsLoading(true);
        setError(null);
        addLog('=== Testing Camera + Microphone ===');
        addLog('Environment check:');
        addLog(`  - Origin: ${window.location.origin}`);
        addLog(`  - URL: ${window.location.href}`);
        addLog(`  - Is secure context: ${window.isSecureContext}`);
        addLog(`  - MediaDevices available: ${!!navigator.mediaDevices}`);
        // Check if electronAPI is available
        if (window.electronAPI) {
            addLog('  - Electron API available: YES');
        }
        else {
            addLog('  - Electron API available: NO');
        }
        try {
            // Stop existing streams
            stopAllStreams();
            addLog('Requesting camera and microphone access...');
            const constraints = {
                video: selectedVideoDeviceId
                    ? {
                        deviceId: { exact: selectedVideoDeviceId },
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                    }
                    : {
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                        facingMode: 'user',
                    },
                audio: selectedAudioDeviceId
                    ? {
                        deviceId: { exact: selectedAudioDeviceId },
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true,
                    }
                    : {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true,
                    },
            };
            if (selectedVideoDeviceId) {
                addLog(`Using selected camera: ${videoDevices.find(d => d.deviceId === selectedVideoDeviceId)?.label || selectedVideoDeviceId}`);
            }
            if (selectedAudioDeviceId) {
                addLog(`Using selected microphone: ${audioDevices.find(d => d.deviceId === selectedAudioDeviceId)?.label || selectedAudioDeviceId}`);
            }
            addLog(`Calling navigator.mediaDevices.getUserMedia(${JSON.stringify(constraints, null, 2)})...`);
            console.log('[MediaTest] About to call getUserMedia for both', constraints);
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            addLog('✅ Camera and microphone access granted!');
            addLog(`Stream ID: ${stream.id}`);
            addLog(`Stream active: ${stream.active}`);
            const videoTracks = stream.getVideoTracks();
            const audioTracks = stream.getAudioTracks();
            addLog(`Video tracks: ${videoTracks.length}`);
            videoTracks.forEach((track, index) => {
                addLog(`  Video Track ${index + 1}: ${track.label} (${track.id})`);
            });
            addLog(`Audio tracks: ${audioTracks.length}`);
            audioTracks.forEach((track, index) => {
                addLog(`  Audio Track ${index + 1}: ${track.label} (${track.id})`);
            });
            setVideoStream(stream);
            setAudioStream(stream);
            // Video will be attached via useEffect
            addLog('Video and audio streams set, will be attached to video element');
        }
        catch (err) {
            const errorName = err.name || 'UnknownError';
            const errorMessage = err.message || 'Unknown error';
            addLog(`❌ Error: ${errorName}`);
            addLog(`   Message: ${errorMessage}`);
            let userMessage = '';
            switch (errorName) {
                case 'NotAllowedError':
                    userMessage = 'Camera/microphone permission denied. Please allow access in Windows Settings (Privacy → Camera/Microphone).';
                    break;
                case 'NotFoundError':
                    userMessage = 'No camera/microphone found. Please connect devices.';
                    break;
                case 'NotReadableError':
                    userMessage = 'Camera/microphone is already in use by another application.';
                    break;
                case 'OverconstrainedError':
                    userMessage = 'Camera/microphone constraints cannot be satisfied.';
                    break;
                case 'SecurityError':
                    userMessage = 'Security error: App must run in secure context.';
                    break;
                default:
                    userMessage = `Error: ${errorMessage}`;
            }
            setError(userMessage);
            addLog(`   User message: ${userMessage}`);
        }
        finally {
            setIsLoading(false);
        }
    };
    // Load devices on mount
    useEffect(() => {
        loadDevices();
    }, []);
    // Attach video stream to video element
    useEffect(() => {
        if (videoRef.current && videoStream) {
            console.log('[MediaTest] Attaching stream to video element');
            console.log('[MediaTest] Stream:', videoStream);
            console.log('[MediaTest] Video element:', videoRef.current);
            videoRef.current.srcObject = videoStream;
            // Ensure video plays
            videoRef.current.play().then(() => {
                console.log('[MediaTest] Video play() succeeded');
                addLog('Video element playing');
            }).catch((err) => {
                console.error('[MediaTest] Video play() failed:', err);
                addLog(`Video play() error: ${err.message}`);
            });
        }
        else if (videoRef.current && !videoStream) {
            // Clear video when stream is removed
            videoRef.current.srcObject = null;
        }
    }, [videoStream]);
    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopAllStreams();
        };
    }, []);
    return (_jsxs("div", { style: { padding: '20px', maxWidth: '1200px', margin: '0 auto' }, children: [_jsx("h1", { style: { color: '#fff', marginBottom: '20px' }, children: "Media Test" }), _jsxs("div", { style: {
                    marginBottom: '20px',
                    padding: '15px',
                    backgroundColor: '#2a2a2a',
                    borderRadius: '5px'
                }, children: [_jsx("h2", { style: { color: '#fff', marginBottom: '15px', fontSize: '18px' }, children: "Ch\u1ECDn thi\u1EBFt b\u1ECB" }), _jsxs("div", { style: { display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '15px' }, children: [_jsxs("div", { style: { flex: '1', minWidth: '250px' }, children: [_jsx("label", { style: { color: '#fff', display: 'block', marginBottom: '5px', fontSize: '14px' }, children: "\uD83D\uDCF9 Camera:" }), _jsx("select", { value: selectedVideoDeviceId, onChange: (e) => setSelectedVideoDeviceId(e.target.value), disabled: !devicesLoaded || videoDevices.length === 0, style: {
                                            width: '100%',
                                            padding: '8px',
                                            backgroundColor: '#1a1a1a',
                                            color: '#fff',
                                            border: '1px solid #444',
                                            borderRadius: '5px',
                                            fontSize: '14px',
                                        }, children: !devicesLoaded ? (_jsx("option", { children: "\u0110ang t\u1EA3i..." })) : videoDevices.length === 0 ? (_jsx("option", { children: "Kh\u00F4ng c\u00F3 camera" })) : (_jsxs(_Fragment, { children: [_jsx("option", { value: "", children: "M\u1EB7c \u0111\u1ECBnh" }), videoDevices.map((device) => (_jsx("option", { value: device.deviceId, children: device.label }, device.deviceId)))] })) })] }), _jsxs("div", { style: { flex: '1', minWidth: '250px' }, children: [_jsx("label", { style: { color: '#fff', display: 'block', marginBottom: '5px', fontSize: '14px' }, children: "\uD83C\uDFA4 Microphone:" }), _jsx("select", { value: selectedAudioDeviceId, onChange: (e) => setSelectedAudioDeviceId(e.target.value), disabled: !devicesLoaded || audioDevices.length === 0, style: {
                                            width: '100%',
                                            padding: '8px',
                                            backgroundColor: '#1a1a1a',
                                            color: '#fff',
                                            border: '1px solid #444',
                                            borderRadius: '5px',
                                            fontSize: '14px',
                                        }, children: !devicesLoaded ? (_jsx("option", { children: "\u0110ang t\u1EA3i..." })) : audioDevices.length === 0 ? (_jsx("option", { children: "Kh\u00F4ng c\u00F3 microphone" })) : (_jsxs(_Fragment, { children: [_jsx("option", { value: "", children: "M\u1EB7c \u0111\u1ECBnh" }), audioDevices.map((device) => (_jsx("option", { value: device.deviceId, children: device.label }, device.deviceId)))] })) })] })] }), _jsx("button", { onClick: loadDevices, style: {
                            padding: '8px 16px',
                            backgroundColor: '#666',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            fontSize: '14px',
                        }, children: "\uD83D\uDD04 Refresh Devices" })] }), _jsxs("div", { style: { marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }, children: [_jsx("button", { onClick: testCamera, disabled: isLoading, style: {
                            padding: '10px 20px',
                            backgroundColor: isLoading ? '#666' : '#4CAF50',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                            fontSize: '14px',
                            fontWeight: 'bold',
                        }, children: "\uD83D\uDCF9 Test Camera" }), _jsx("button", { onClick: testMicrophone, disabled: isLoading, style: {
                            padding: '10px 20px',
                            backgroundColor: isLoading ? '#666' : '#2196F3',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                            fontSize: '14px',
                            fontWeight: 'bold',
                        }, children: "\uD83C\uDFA4 Test Microphone" }), _jsx("button", { onClick: testBoth, disabled: isLoading, style: {
                            padding: '10px 20px',
                            backgroundColor: isLoading ? '#666' : '#FF9800',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                            fontSize: '14px',
                            fontWeight: 'bold',
                        }, children: "\uD83D\uDCF9\uD83C\uDFA4 Test Both" }), _jsx("button", { onClick: stopAllStreams, disabled: isLoading, style: {
                            padding: '10px 20px',
                            backgroundColor: '#f44336',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: 'bold',
                        }, children: "\u23F9 Stop All" }), _jsx("button", { onClick: clearLogs, style: {
                            padding: '10px 20px',
                            backgroundColor: '#666',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: 'bold',
                        }, children: "\uD83D\uDDD1 Clear Logs" })] }), error && (_jsxs("div", { style: {
                    padding: '15px',
                    backgroundColor: '#f44336',
                    color: 'white',
                    borderRadius: '5px',
                    marginBottom: '20px',
                }, children: [_jsx("strong", { children: "Error:" }), " ", error] })), videoStream && (_jsxs("div", { style: { marginBottom: '20px' }, children: [_jsx("h2", { style: { color: '#fff', marginBottom: '10px' }, children: "Video Stream" }), _jsx("video", { ref: videoRef, autoPlay: true, playsInline: true, muted: true, onLoadedMetadata: () => {
                            console.log('[MediaTest] Video metadata loaded');
                            addLog('Video metadata loaded');
                        }, onPlay: () => {
                            console.log('[MediaTest] Video started playing');
                            addLog('Video started playing');
                        }, onError: (e) => {
                            console.error('[MediaTest] Video error:', e);
                            addLog(`Video error: ${e.currentTarget.error?.message || 'Unknown error'}`);
                        }, style: {
                            width: '100%',
                            maxWidth: '640px',
                            height: 'auto',
                            minHeight: '360px',
                            backgroundColor: '#000',
                            borderRadius: '5px',
                            objectFit: 'contain',
                        } })] })), _jsxs("div", { style: { marginBottom: '20px', color: '#fff' }, children: [_jsx("h2", { style: { marginBottom: '10px' }, children: "Status" }), _jsxs("div", { children: [_jsx("strong", { children: "Video Stream:" }), " ", videoStream ? '✅ Active' : '❌ None'] }), _jsxs("div", { children: [_jsx("strong", { children: "Audio Stream:" }), " ", audioStream ? '✅ Active' : '❌ None'] }), _jsxs("div", { children: [_jsx("strong", { children: "Loading:" }), " ", isLoading ? '⏳ Yes' : '✅ No'] })] }), _jsxs("div", { style: { marginTop: '20px' }, children: [_jsx("h2", { style: { color: '#fff', marginBottom: '10px' }, children: "Logs" }), _jsx("div", { style: {
                            backgroundColor: '#1a1a1a',
                            border: '1px solid #333',
                            borderRadius: '5px',
                            padding: '15px',
                            maxHeight: '400px',
                            overflowY: 'auto',
                            fontFamily: 'monospace',
                            fontSize: '12px',
                            color: '#0f0',
                        }, children: logs.length === 0 ? (_jsx("div", { style: { color: '#666' }, children: "No logs yet. Click a test button to start." })) : (logs.map((log, index) => (_jsx("div", { style: { marginBottom: '5px' }, children: log }, index)))) })] })] }));
}
