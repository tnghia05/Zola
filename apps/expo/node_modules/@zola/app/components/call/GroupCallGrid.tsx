import React, { useEffect, useRef } from 'react';
import '../../styles/group-call-grid.css';

interface ParticipantVideo {
  participantId: string;
  stream: MediaStream;
  name?: string;
  avatar?: string;
}

interface ParticipantVideoTileProps {
  participant: ParticipantVideo & { isLocal: boolean };
}

function ParticipantVideoTile({ participant }: ParticipantVideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && participant.stream) {
      videoRef.current.srcObject = participant.stream;
    }
  }, [participant.stream]);

  return (
    <div className="participant-video-tile">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={participant.isLocal}
        className="participant-video"
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
}

export function GroupCallGrid({ participants, localStream, localParticipantId }: GroupCallGridProps) {
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
      {allParticipants.map((participant) => (
        <ParticipantVideoTile key={participant.participantId} participant={participant} />
      ))}
    </div>
  );
}

