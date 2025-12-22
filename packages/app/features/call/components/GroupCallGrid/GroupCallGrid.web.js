import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect, useRef } from 'react';
import '../../styles/group-call-grid.css';
function ParticipantVideoTile({ participant }) {
    const videoRef = useRef(null);
    useEffect(() => {
        if (videoRef.current && participant.stream) {
            videoRef.current.srcObject = participant.stream;
        }
    }, [participant.stream]);
    return (_jsxs("div", { className: "participant-video-tile", children: [_jsx("video", { ref: videoRef, autoPlay: true, playsInline: true, muted: participant.isLocal, className: "participant-video" }), _jsxs("div", { className: "participant-info", children: [participant.avatar ? (_jsx("img", { src: participant.avatar, alt: participant.name || participant.participantId, className: "participant-avatar" })) : (_jsx("div", { className: "participant-avatar-placeholder", children: (participant.name || participant.participantId).charAt(0).toUpperCase() })), _jsx("span", { className: "participant-name", children: participant.isLocal ? 'Bạn' : (participant.name || participant.participantId) })] })] }));
}
export function GroupCallGrid({ participants, localStream, localParticipantId }) {
    const allParticipants = React.useMemo(() => {
        const result = [];
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
        if (count === 1)
            return 'grid-1';
        if (count === 2)
            return 'grid-2';
        if (count === 3)
            return 'grid-3';
        if (count === 4)
            return 'grid-4';
        if (count === 5)
            return 'grid-5';
        return 'grid-6';
    }, [allParticipants.length]);
    return (_jsx("div", { className: `group-call-grid ${gridClass}`, children: allParticipants.map((participant) => (_jsx(ParticipantVideoTile, { participant: participant }, participant.participantId))) }));
}
