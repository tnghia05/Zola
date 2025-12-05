// src/types/call.ts
export interface CallState {
    callId: string;
    conversationId: string;
    status: 'idle' | 'ringing_out' | 'ringing_in' | 'connecting' | 'in_call' | 'ended';
    participants: string[];
    startTime?: Date;
    endTime?: Date;
    callType: 'video' | 'audio';
  }
  
  export interface IncomingCallData {
    callId: string;
    fromUserId: string;
    fromUserName: string;
    conversationId: string;
    callType: 'video' | 'audio';
  }
  
  export interface CallControls {
    isMuted: boolean;
    isVideoEnabled: boolean;
    isSpeakerOn: boolean;
    cameraPosition: 'front' | 'back';
  }