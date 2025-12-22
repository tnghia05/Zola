import type { NativeStackScreenProps } from '@react-navigation/native-stack';
type RootStackParamList = {
    Login: undefined;
    Register: undefined;
    OTPVerification: {
        email: string;
        password: string;
        name?: string;
    };
    Conversations: undefined;
};
type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;
export default function LoginScreen({ navigation }: Props): import("react/jsx-runtime").JSX.Element;
export {};
