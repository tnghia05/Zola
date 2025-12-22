import React from 'react';
interface IncomingCallModalProps {
    visible: boolean;
    callerName: string;
    callerAvatar?: string;
    onAccept: () => void;
    onDecline: () => void;
}
export declare const IncomingCallModal: React.FC<IncomingCallModalProps>;
export {};
