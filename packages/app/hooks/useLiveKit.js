import { useCallback, useEffect, useRef, useState } from 'react';
import { Room, RoomEvent, RemoteTrack, LocalVideoTrack, LocalAudioTrack, VideoPresets } from 'livekit-client';
export function useLiveKit({ roomName, token, url, autoSubscribe = true, }) {
    const [room, setRoom] = useState(null);
    const [localStream, setLocalStream] = useState(null);
    const [remoteStreams, setRemoteStreams] = useState(new Map());
    const [remoteTracks, setRemoteTracks] = useState(new Map());
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState(null);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);
    const roomRef = useRef(null);
    const connectPromiseRef = useRef(null);
    const latestOptionsRef = useRef({ roomName, token, url });
    useEffect(() => {
        latestOptionsRef.current = { roomName, token, url };
    }, [roomName, token, url]);
    const buildMediaStreamFromLocal = useCallback((currentRoom) => {
        try {
            const publications = Array.from(currentRoom.localParticipant.trackPublications.values());
            const tracks = [];
            publications.forEach((pub) => {
                const lkTrack = pub.track;
                if (lkTrack &&
                    (lkTrack instanceof LocalVideoTrack || lkTrack instanceof LocalAudioTrack)) {
                    const mediaTrack = lkTrack.mediaStreamTrack;
                    if (mediaTrack) {
                        tracks.push(mediaTrack);
                    }
                }
            });
            if (tracks.length > 0) {
                const stream = new MediaStream(tracks);
                setLocalStream(stream);
            }
        }
        catch (err) {
            console.warn('[LiveKit] Failed to build local stream:', err);
        }
    }, []);
    const addRemoteTrack = useCallback((participantId, mediaTrack) => {
        setRemoteStreams((prev) => {
            const next = new Map(prev);
            const existing = next.get(participantId);
            // Create a NEW MediaStream with all existing tracks + new track
            // This ensures React detects the state change
            const allTracks = [];
            if (existing) {
                existing.getTracks().forEach(t => {
                    if (t.id !== mediaTrack.id) {
                        allTracks.push(t);
                    }
                });
            }
            allTracks.push(mediaTrack);
            const newStream = new MediaStream(allTracks);
            next.set(participantId, newStream);
            return next;
        });
    }, []);
    const removeRemoteTrack = useCallback((participantId, mediaTrack) => {
        setRemoteStreams((prev) => {
            const next = new Map(prev);
            const existing = next.get(participantId);
            if (!existing)
                return prev;
            if (mediaTrack) {
                existing.removeTrack(mediaTrack);
            }
            if (existing.getTracks().length === 0) {
                next.delete(participantId);
            }
            else {
                next.set(participantId, existing);
            }
            return next;
        });
    }, []);
    const disconnect = useCallback(() => {
        if (roomRef.current) {
            roomRef.current.disconnect();
            roomRef.current = null;
        }
        connectPromiseRef.current = null;
        setRoom(null);
        setIsConnected(false);
        setLocalStream(null);
        setRemoteStreams(new Map());
        setError(null);
    }, []);
    const connect = useCallback(async () => {
        const { roomName: currentRoomName, token: currentToken, url: currentUrl } = latestOptionsRef.current;
        if (!currentRoomName || !currentToken || !currentUrl) {
            setError('Thiếu thông tin LiveKit (room/token/url)');
            return;
        }
        if (roomRef.current && roomRef.current.state === 'connected') {
            return;
        }
        if (connectPromiseRef.current) {
            return connectPromiseRef.current;
        }
        const promise = (async () => {
            try {
                setError(null);
                // Optimized room options for better performance
                const roomOptions = {
                    adaptiveStream: true,
                    dynacast: true,
                    // Video capture settings - use 720p for better performance
                    videoCaptureDefaults: {
                        resolution: VideoPresets.h720.resolution,
                        facingMode: 'user',
                    },
                    // Video publish settings - lower bitrate for smoother streaming
                    publishDefaults: {
                        videoSimulcastLayers: [VideoPresets.h180, VideoPresets.h360],
                        videoCodec: 'vp8', // VP8 has better compatibility
                        dtx: true, // Discontinuous transmission for audio - saves bandwidth
                        red: true, // Redundant encoding for audio - better quality
                        stopMicTrackOnMute: false,
                    },
                };
                const newRoom = new Room(roomOptions);
                roomRef.current = newRoom;
                setRoom(newRoom);
                newRoom.on(RoomEvent.Connected, () => {
                    setIsConnected(true);
                });
                newRoom.on(RoomEvent.Disconnected, () => {
                    setIsConnected(false);
                    setLocalStream(null);
                    setRemoteStreams(new Map());
                    setRemoteTracks(new Map());
                });
                newRoom.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
                    if (track instanceof RemoteTrack) {
                        // Store the RemoteTrack for direct attachment in components
                        setRemoteTracks((prev) => {
                            const next = new Map(prev);
                            const existing = next.get(participant.identity) || {};
                            if (track.kind === 'video') {
                                next.set(participant.identity, { ...existing, videoTrack: track });
                            }
                            else if (track.kind === 'audio') {
                                next.set(participant.identity, { ...existing, audioTrack: track });
                            }
                            return next;
                        });
                        // Also add to remoteStreams for backward compatibility
                        const mediaTrack = track.mediaStreamTrack;
                        if (mediaTrack) {
                            addRemoteTrack(participant.identity, mediaTrack);
                        }
                    }
                });
                // Handle track unmuted events - re-add track when unmuted
                newRoom.on(RoomEvent.TrackUnmuted, (publication, participant) => {
                    if (publication.track instanceof RemoteTrack) {
                        const mediaTrack = publication.track.mediaStreamTrack;
                        if (mediaTrack) {
                            addRemoteTrack(participant.identity, mediaTrack);
                        }
                    }
                });
                newRoom.on(RoomEvent.ParticipantConnected, () => {
                    // Participant connected - tracks will be handled by TrackSubscribed event
                });
                newRoom.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
                    if (track instanceof RemoteTrack) {
                        // Remove from remoteTracks
                        setRemoteTracks((prev) => {
                            const next = new Map(prev);
                            const existing = next.get(participant.identity);
                            if (existing) {
                                if (track.kind === 'video') {
                                    next.set(participant.identity, { ...existing, videoTrack: undefined });
                                }
                                else if (track.kind === 'audio') {
                                    next.set(participant.identity, { ...existing, audioTrack: undefined });
                                }
                            }
                            return next;
                        });
                        const mediaTrack = track.mediaStreamTrack;
                        removeRemoteTrack(participant.identity, mediaTrack);
                    }
                });
                newRoom.on(RoomEvent.ParticipantDisconnected, (participant) => {
                    setRemoteStreams((prev) => {
                        const next = new Map(prev);
                        next.delete(participant.identity);
                        return next;
                    });
                    setRemoteTracks((prev) => {
                        const next = new Map(prev);
                        next.delete(participant.identity);
                        return next;
                    });
                });
                await newRoom.connect(currentUrl, currentToken);
                // Subscribe to any existing remote participant tracks
                newRoom.remoteParticipants.forEach((participant) => {
                    participant.trackPublications.forEach((pub) => {
                        if (pub.track && pub.track instanceof RemoteTrack) {
                            const mediaTrack = pub.track.mediaStreamTrack;
                            if (mediaTrack) {
                                addRemoteTrack(participant.identity, mediaTrack);
                            }
                        }
                    });
                });
                await newRoom.localParticipant.enableCameraAndMicrophone();
                buildMediaStreamFromLocal(newRoom);
            }
            catch (err) {
                console.error('[LiveKit] Error connecting:', err);
                setError(err?.message || 'Không thể kết nối LiveKit');
                disconnect();
            }
            finally {
                connectPromiseRef.current = null;
            }
        })();
        connectPromiseRef.current = promise;
        return promise;
    }, [addRemoteTrack, autoSubscribe, buildMediaStreamFromLocal, disconnect, removeRemoteTrack]);
    const toggleVideo = useCallback(() => {
        if (!roomRef.current)
            return;
        const enabled = !isVideoEnabled;
        roomRef.current.localParticipant.setCameraEnabled(enabled);
        setIsVideoEnabled(enabled);
    }, [isVideoEnabled]);
    const toggleAudio = useCallback(() => {
        if (!roomRef.current)
            return;
        const enabled = !isAudioEnabled;
        roomRef.current.localParticipant.setMicrophoneEnabled(enabled);
        setIsAudioEnabled(enabled);
    }, [isAudioEnabled]);
    useEffect(() => {
        return () => {
            disconnect();
        };
    }, [disconnect]);
    return {
        room,
        localStream,
        remoteStreams,
        remoteTracks,
        isConnected,
        error,
        connect,
        disconnect,
        toggleVideo,
        toggleAudio,
        isVideoEnabled,
        isAudioEnabled,
    };
}
