import React, { useEffect, useRef } from 'react';
import type { RemoteTrack } from 'livekit-client';
import '../../styles/group-call-grid.css';

interface ParticipantVideo {
  participantId: string;
  stream: MediaStream;
  name?: string;
  avatar?: string;
}

interface RemoteParticipantTracks {
  audioTrack?: RemoteTrack;
  videoTrack?: RemoteTrack;
}

interface ParticipantVideoTileProps {
  participant: ParticipantVideo & { isLocal: boolean };
  remoteVideoTrack?: RemoteTrack; // For direct LiveKit attachment
}

function ParticipantVideoTile({ participant, remoteVideoTrack }: ParticipantVideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // For remote participants with LiveKit track, use track.attach()
  useEffect(() => {
    if (!participant.isLocal && remoteVideoTrack && videoRef.current) {
      // Use LiveKit's attach method which properly starts the track
      remoteVideoTrack.attach(videoRef.current);
      
      return () => {
        if (videoRef.current) {
          remoteVideoTrack.detach(videoRef.current);
        }
      };
    }
  }, [remoteVideoTrack, participant.participantId, participant.isLocal]);

  // For local stream or fallback, use srcObject
  useEffect(() => {
    // Skip if using LiveKit attach for remote
    if (!participant.isLocal && remoteVideoTrack) return;
    
    if (videoRef.current && participant.stream) {
      videoRef.current.srcObject = participant.stream;
      
      // Force play the video with retry
      const playVideo = async () => {
        try {
          await videoRef.current?.play();
        } catch (err: any) {
          // If interrupted, retry after a short delay
          if (err.name === 'AbortError') {
            setTimeout(playVideo, 100);
          }
        }
      };
      playVideo();
    }
  }, [participant.stream, participant.participantId, participant.isLocal, remoteVideoTrack]);

  return (
    <div className="participant-video-tile">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={participant.isLocal}
        className="participant-video"
        // Performance optimizations
        style={{
          transform: 'translateZ(0)', // Force GPU acceleration
          willChange: 'transform', // Hint for browser optimization
        }}
      />
      <div className="participant-info">
        {participant.avatar ? (
          <img src={participant.avatar} alt={participant.name || participant.participantId} className="participant-avatar" />
        ) : (
          <div className="participant-avatar-placeholder">
            {(participant.name || participant.participantId).charAt(0).toUpperCase()}
          </div>
        )}
        <span className="participant-name">
          {participant.isLocal ? 'Bạn' : (participant.name || participant.participantId)}
        </span>
      </div>
    </div>
  );
}

interface GroupCallGridProps {
  participants: ParticipantVideo[];
  localStream: MediaStream | null;
  localParticipantId: string;
  remoteTracks?: Map<string, RemoteParticipantTracks>; // For direct LiveKit track attachment
}

export function GroupCallGrid({ participants, localStream, localParticipantId, remoteTracks }: GroupCallGridProps) {
  const allParticipants = React.useMemo(() => {
    const result: Array<ParticipantVideo & { isLocal: boolean }> = [];
    
    // Thêm local stream nếu có
    if (localStream) {
      result.push({
        participantId: localParticipantId,
        stream: localStream,
        isLocal: true,
      });
    }
    
    // Thêm remote participants
    participants.forEach(p => {
      if (p.participantId !== localParticipantId) {
        result.push({
          ...p,
          isLocal: false,
        });
      }
    });
    
    return result;
  }, [participants, localStream, localParticipantId]);

  const gridClass = React.useMemo(() => {
    const count = allParticipants.length;
    if (count === 1) return 'grid-1';
    if (count === 2) return 'grid-2';
    if (count === 3) return 'grid-3';
    if (count === 4) return 'grid-4';
    if (count === 5) return 'grid-5';
    return 'grid-6';
  }, [allParticipants.length]);

  return (
    <div className={`group-call-grid ${gridClass}`}>
      {allParticipants.map((participant) => {
        const tracks = remoteTracks?.get(participant.participantId);
        return (
          <ParticipantVideoTile 
            key={participant.participantId} 
            participant={participant} 
            remoteVideoTrack={participant.isLocal ? undefined : tracks?.videoTrack}
          />
        );
      })}
    </div>
  );
}

