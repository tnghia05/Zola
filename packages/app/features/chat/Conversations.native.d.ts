import type { NativeStackScreenProps } from '@react-navigation/native-stack';
type RootStackParamList = {
    Conversations: undefined;
    Settings: undefined;
    Chat: {
        conversationId: string;
        name: string;
        targetUserId?: string;
    };
    Call: {
        callId: string;
        conversationId: string;
        isIncoming?: boolean;
    };
    Login: undefined;
};
type Props = NativeStackScreenProps<RootStackParamList, 'Conversations'>;
export default function ConversationsScreen({ navigation }: Props): import("react/jsx-runtime").JSX.Element;
export {};
