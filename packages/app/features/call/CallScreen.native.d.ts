import type { NativeStackScreenProps } from '@react-navigation/native-stack';
type RootStackParamList = {
    Call: {
        callId: string;
        conversationId: string;
        isIncoming?: boolean;
        callType?: 'p2p' | 'sfu';
        livekitRoomName?: string;
    };
};
type Props = NativeStackScreenProps<RootStackParamList, 'Call'>;
export default function CallScreen(props: Props): import("react/jsx-runtime").JSX.Element;
export {};
