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
type Props = NativeStackScreenProps<RootStackParamList, 'OTPVerification'>;
export default function OTPVerificationScreen({ navigation, route }: Props): import("react/jsx-runtime").JSX.Element;
export {};
