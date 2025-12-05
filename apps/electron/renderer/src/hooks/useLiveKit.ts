import { useEffect, useRef, useState, useCallback } from 'react';
import { Room, RoomEvent, RemoteTrack, LocalVideoTrack, LocalAudioTrack } from 'livekit-client';

interface UseLiveKitOptions {
  roomName: string;
  token: string;
  url: string;
}

interface UseLiveKitResult {
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

export function useLiveKit({ roomName, token, url }: UseLiveKitOptions): UseLiveKitResult {
  const [room, setRoom] = useState<Room | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);

  const roomRef = useRef<Room | null>(null);

  // Kết nối đến LiveKit room
  const connect = useCallback(async () => {
    try {
      setError(null);
      console.log('[LiveKit] Connecting to room:', roomName);

      // Tạo room mới
      const newRoom = new Room();
      roomRef.current = newRoom;
      setRoom(newRoom);

      // Xử lý sự kiện room
      newRoom.on(RoomEvent.Connected, () => {
        console.log('[LiveKit] Connected to room');
        setIsConnected(true);
      });

      newRoom.on(RoomEvent.Disconnected, (reason) => {
        console.log('[LiveKit] Disconnected from room:', reason);
        setIsConnected(false);
        setLocalStream(null);
        setRemoteStreams(new Map());
      });

      newRoom.on(RoomEvent.LocalTrackPublished, (publication) => {
        console.log('[LiveKit] Local track published:', publication.kind);
        if (publication.track) {
          setLocalStream(prev => {
            const newStream = prev ? new MediaStream(prev.getTracks()) : new MediaStream();
            if (publication.track instanceof LocalVideoTrack || publication.track instanceof LocalAudioTrack) {
              const mediaStreamTrack = (publication.track as any).mediaStreamTrack;
              if (mediaStreamTrack) {
                // Kiểm tra xem track đã có trong stream chưa
                const existingTrack = newStream.getTracks().find(t => t.id === mediaStreamTrack.id);
                if (!existingTrack) {
                  newStream.addTrack(mediaStreamTrack);
                }
              }
            }
            return newStream;
          });
        }
      });

      newRoom.on(RoomEvent.TrackSubscribed, (track, _publication, participant) => {
        console.log('[LiveKit] Track subscribed:', track.kind, 'from', participant.identity);
        
        if (track instanceof RemoteTrack) {
          setRemoteStreams(prev => {
            const newMap = new Map(prev);
            const participantId = participant.identity;
            
            // Lấy stream hiện có hoặc tạo mới
            let stream = newMap.get(participantId);
            if (!stream) {
              stream = new MediaStream();
              newMap.set(participantId, stream);
            }
            
            // Lấy MediaStreamTrack từ RemoteTrack
            const mediaTrack = (track as any).mediaStreamTrack;
            if (mediaTrack && !stream.getTracks().find(t => t.id === mediaTrack.id)) {
              stream.addTrack(mediaTrack);
            }
            return new Map(newMap);
          });
        }
      });

      newRoom.on(RoomEvent.TrackUnsubscribed, (track, _publication, participant) => {
        console.log('[LiveKit] Track unsubscribed:', track.kind, 'from', participant.identity);
        
        if (track instanceof RemoteTrack) {
          setRemoteStreams(prev => {
            const newMap = new Map(prev);
            const participantId = participant.identity;
            const stream = newMap.get(participantId);
            
            if (stream) {
              const mediaTrack = (track as any).mediaStreamTrack;
              if (mediaTrack) {
                stream.removeTrack(mediaTrack);
              }
              if (stream.getTracks().length === 0) {
                newMap.delete(participantId);
              }
            }
            
            return new Map(newMap);
          });
        }
      });

      newRoom.on(RoomEvent.ParticipantConnected, (participant) => {
        console.log('[LiveKit] Participant connected:', participant.identity);
      });

      newRoom.on(RoomEvent.ParticipantDisconnected, (participant) => {
        console.log('[LiveKit] Participant disconnected:', participant.identity);
        setRemoteStreams(prev => {
          const newMap = new Map(prev);
          newMap.delete(participant.identity);
          return newMap;
        });
      });

      // Kết nối đến room
      await newRoom.connect(url, token);
      console.log('[LiveKit] Room connection initiated');

      // Bật camera và microphone sau khi kết nối
      if (newRoom.state === 'connected') {
        await newRoom.localParticipant.enableCameraAndMicrophone();
        console.log('[LiveKit] Camera and microphone enabled');
        
        // Tạo local stream từ local tracks
        const localTracks = newRoom.localParticipant.trackPublications.values();
        const localMediaTracks: MediaStreamTrack[] = [];
        for (const publication of localTracks) {
          if (publication.track) {
            const mediaTrack = (publication.track as any).mediaStreamTrack;
            if (mediaTrack) {
              localMediaTracks.push(mediaTrack);
            }
          }
        }
        if (localMediaTracks.length > 0) {
          setLocalStream(new MediaStream(localMediaTracks));
        }
      }

    } catch (err: any) {
      console.error('[LiveKit] Error connecting:', err);
      setError(err.message || 'Failed to connect to LiveKit room');
      setIsConnected(false);
    }
  }, [roomName, token, url]);

  // Ngắt kết nối
  const disconnect = useCallback(() => {
    if (roomRef.current) {
      console.log('[LiveKit] Disconnecting from room');
      roomRef.current.disconnect();
      roomRef.current = null;
      setRoom(null);
      setIsConnected(false);
      setLocalStream(null);
      setRemoteStreams(new Map());
    }
  }, []);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (roomRef.current) {
      const enabled = !isVideoEnabled;
      roomRef.current.localParticipant.setCameraEnabled(enabled);
      setIsVideoEnabled(enabled);
      console.log('[LiveKit] Video toggled:', enabled);
    }
  }, [isVideoEnabled]);

  // Toggle audio
  const toggleAudio = useCallback(() => {
    if (roomRef.current) {
      const enabled = !isAudioEnabled;
      roomRef.current.localParticipant.setMicrophoneEnabled(enabled);
      setIsAudioEnabled(enabled);
      console.log('[LiveKit] Audio toggled:', enabled);
    }
  }, [isAudioEnabled]);

  // Cleanup khi unmount
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

