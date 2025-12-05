import { useCallback, useEffect, useRef, useState } from 'react';
import { Room, RoomEvent, RemoteTrack, LocalVideoTrack, LocalAudioTrack } from 'livekit-client';

// NOTE: This hook is now web-first. React Native globals registration has been
// removed to avoid bundling 'react-native' in Next.js. If you need native
// support later, create a separate 'useLiveKit.native.ts' implementation.

interface UseLiveKitOptions {
  roomName?: string;
  token?: string;
  url?: string;
  autoSubscribe?: boolean;
}

export interface UseLiveKitResult {
  room: Room | null;
  localStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;
  isConnected: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  toggleVideo: () => void;
  toggleAudio: () => void;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
}

export function useLiveKit({
  roomName,
  token,
  url,
  autoSubscribe = true,
}: UseLiveKitOptions): UseLiveKitResult {
  const [room, setRoom] = useState<Room | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);

  const roomRef = useRef<Room | null>(null);
  const connectPromiseRef = useRef<Promise<void> | null>(null);
  const latestOptionsRef = useRef({ roomName, token, url });

  useEffect(() => {
    latestOptionsRef.current = { roomName, token, url };
  }, [roomName, token, url]);

  const buildMediaStreamFromLocal = useCallback((currentRoom: Room) => {
    try {
      const publications = Array.from(currentRoom.localParticipant.trackPublications.values());
      const tracks: MediaStreamTrack[] = [];
      publications.forEach((pub) => {
        const lkTrack = pub.track;
        if (
          lkTrack &&
          (lkTrack instanceof LocalVideoTrack || lkTrack instanceof LocalAudioTrack)
        ) {
          const mediaTrack = (lkTrack as any).mediaStreamTrack as MediaStreamTrack | undefined;
          if (mediaTrack) {
            tracks.push(mediaTrack);
          }
        }
      });
      if (tracks.length > 0) {
        const stream = new MediaStream(tracks);
        setLocalStream(stream);
      }
    } catch (err) {
      console.warn('[LiveKit] Failed to build local stream:', err);
    }
  }, []);

  const addRemoteTrack = useCallback((participantId: string, mediaTrack: MediaStreamTrack) => {
    setRemoteStreams((prev) => {
      const next = new Map(prev);
      const existing = next.get(participantId) ?? new MediaStream();
      if (!existing.getTracks().some((t) => t.id === mediaTrack.id)) {
        existing.addTrack(mediaTrack);
      }
      next.set(participantId, existing);
      return next;
    });
  }, []);

  const removeRemoteTrack = useCallback((participantId: string, mediaTrack?: MediaStreamTrack) => {
    setRemoteStreams((prev) => {
      const next = new Map(prev);
      const existing = next.get(participantId);
      if (!existing) return prev;
      if (mediaTrack) {
        existing.removeTrack(mediaTrack);
      }
      if (existing.getTracks().length === 0) {
        next.delete(participantId);
      } else {
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
    const { roomName: currentRoomName, token: currentToken, url: currentUrl } =
      latestOptionsRef.current;

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
        const newRoom = new Room({
          adaptiveStream: true,
          dynacast: true,
        });

        roomRef.current = newRoom;
        setRoom(newRoom);

        newRoom.on(RoomEvent.Connected, () => {
          setIsConnected(true);
        });

        newRoom.on(RoomEvent.Disconnected, () => {
          setIsConnected(false);
          setLocalStream(null);
          setRemoteStreams(new Map());
        });

        newRoom.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
          if (track instanceof RemoteTrack) {
            const mediaTrack = (track as any).mediaStreamTrack as MediaStreamTrack | undefined;
            if (mediaTrack) {
              addRemoteTrack(participant.identity, mediaTrack);
            }
          }
        });

        newRoom.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
          if (track instanceof RemoteTrack) {
            const mediaTrack = (track as any).mediaStreamTrack as MediaStreamTrack | undefined;
            removeRemoteTrack(participant.identity, mediaTrack);
          }
        });

        newRoom.on(RoomEvent.ParticipantDisconnected, (participant) => {
          setRemoteStreams((prev) => {
            const next = new Map(prev);
            next.delete(participant.identity);
            return next;
          });
        });

        await newRoom.connect(currentUrl, currentToken);
        await newRoom.localParticipant.enableCameraAndMicrophone();
        buildMediaStreamFromLocal(newRoom);
      } catch (err: any) {
        console.error('[LiveKit] Error connecting:', err);
        setError(err?.message || 'Không thể kết nối LiveKit');
        disconnect();
      } finally {
        connectPromiseRef.current = null;
      }
    })();

    connectPromiseRef.current = promise;
    return promise;
  }, [addRemoteTrack, autoSubscribe, buildMediaStreamFromLocal, disconnect, removeRemoteTrack]);

  const toggleVideo = useCallback(() => {
    if (!roomRef.current) return;
    const enabled = !isVideoEnabled;
    roomRef.current.localParticipant.setCameraEnabled(enabled);
    setIsVideoEnabled(enabled);
  }, [isVideoEnabled]);

  const toggleAudio = useCallback(() => {
    if (!roomRef.current) return;
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

