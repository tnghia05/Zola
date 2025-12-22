import type { NativeStackScreenProps } from '@react-navigation/native-stack';
type RootStackParamList = {
    Conversations: undefined;
    Settings: undefined;
    Chat: {
        conversationId: string;
        name: string;
    };
    Login: undefined;
};
type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;
export default function SettingsScreen({ navigation }: Props): import("react/jsx-runtime").JSX.Element;
export {};
