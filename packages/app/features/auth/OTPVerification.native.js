import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { verifyOTP, resendOTP, login, setAuthToken, api } from '../api';
export default function OTPVerificationScreen({ navigation, route }) {
    const { email } = route.params;
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
    const [canResend, setCanResend] = useState(false);
    const otpInputRef = useRef(null);
    // Timer countdown
    useEffect(() => {
        if (timeLeft > 0) {
            const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
            return () => clearTimeout(timer);
        }
        else {
            setCanResend(true);
        }
    }, [timeLeft]);
    // Auto-submit when OTP is complete
    useEffect(() => {
        if (otp.length === 6) {
            handleVerifyOTP();
        }
    }, [otp]);
    // Focus on input when screen loads
    useEffect(() => {
        const timer = setTimeout(() => {
            otpInputRef.current?.focus();
        }, 500);
        return () => clearTimeout(timer);
    }, []);
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };
    const handleVerifyOTP = async () => {
        if (otp.length !== 6) {
            Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ 6 chữ số');
            return;
        }
        try {
            setLoading(true);
            // ĐÚNG LOGIC: Verify OTP để update isEmailVerified: true
            // Step 1: Verify OTP (update isEmailVerified: true)
            console.log('🔍 Verifying OTP to update isEmailVerified: true');
            const verifyResult = await verifyOTP(email, otp);
            console.log('🔍 OTP verification response:', verifyResult);
            // Step 2: Auto login after successful verification
            console.log('🔍 Auto logging in after email verification');
            const loginResult = await login(email, route.params.password);
            console.log('🔍 Auto login response:', loginResult);
            // Save tokens and user info
            const token = loginResult.accessToken;
            const userId = loginResult.user.id;
            await AsyncStorage.setItem('auth_token', token);
            await AsyncStorage.setItem('user_id', userId);
            await AsyncStorage.setItem('user_data', JSON.stringify(loginResult.user));
            console.log('Token saved to storage:', token);
            console.log('User ID saved to storage:', userId);
            console.log('User data saved to storage:', loginResult.user);
            setAuthToken(token);
            console.log('Token set in axios:', api.defaults.headers.common['Authorization']);
            // Navigate directly to Conversations without Alert
            console.log('🔍 Navigating to Conversations...');
            navigation.replace('Conversations');
            console.log('🔍 Navigation to Conversations completed');
        }
        catch (e) {
            console.error('❌ OTP verification error:', e);
            Alert.alert('Xác thực thất bại', e?.response?.data?.message || e.message || 'Mã OTP không đúng hoặc đã hết hạn');
            setOtp(''); // Clear OTP on error
        }
        finally {
            setLoading(false);
        }
    };
    const handleResendOTP = async () => {
        try {
            setResendLoading(true);
            const res = await resendOTP(email);
            console.log('🔍 Resend OTP response:', res);
            // Reset timer and OTP input
            setTimeLeft(300);
            setCanResend(false);
            setOtp('');
            // Check if email was sent successfully
            if (res && res.emailSent === false) {
                // OTP was created but email sending failed
                Alert.alert('Cảnh báo', res.message || 'OTP mới đã được tạo nhưng không thể gửi email. Vui lòng thử lại sau hoặc liên hệ quản trị viên.', [{ text: 'OK' }]);
            }
            else {
                // Email sent successfully
                Alert.alert('Đã gửi lại mã OTP', `Mã OTP mới đã được gửi đến ${email}`);
            }
            // Focus back to input
            setTimeout(() => {
                otpInputRef.current?.focus();
            }, 500);
        }
        catch (e) {
            console.error('❌ Resend OTP error:', e);
            // Real error - show error message
            Alert.alert('Gửi lại thất bại', e?.response?.data?.message || e.message || 'Không thể gửi lại mã OTP. Vui lòng thử lại sau.');
        }
        finally {
            setResendLoading(false);
        }
    };
    const goBack = () => {
        navigation.goBack();
    };
    return (_jsx(KeyboardAvoidingView, { style: styles.container, behavior: Platform.OS === 'ios' ? 'padding' : 'height', children: _jsxs(View, { style: styles.content, children: [_jsx(Text, { style: styles.title, children: "X\u00E1c th\u1EF1c OTP" }), _jsx(Text, { style: styles.subtitle, children: "Nh\u1EADp m\u00E3 6 ch\u1EEF s\u1ED1 \u0111\u00E3 \u0111\u01B0\u1EE3c g\u1EEDi \u0111\u1EBFn:" }), _jsx(Text, { style: styles.email, children: email }), _jsx(View, { style: styles.otpContainer, children: _jsx(TextInput, { ref: otpInputRef, style: styles.otpInput, value: otp, onChangeText: setOtp, keyboardType: "numeric", maxLength: 6, textAlign: "center" }) }), _jsx(View, { style: styles.timerContainer, children: !canResend ? (_jsxs(Text, { style: styles.timer, children: ["G\u1EEDi l\u1EA1i sau: ", formatTime(timeLeft)] })) : (_jsx(TouchableOpacity, { onPress: handleResendOTP, disabled: resendLoading, style: styles.resendButton, children: _jsx(Text, { style: styles.resendText, children: resendLoading ? 'Đang gửi...' : 'Gửi lại mã OTP' }) })) }), _jsx(Button, { title: loading ? 'Đang xác thực...' : 'Xác thực', onPress: handleVerifyOTP, disabled: loading || otp.length !== 6 }), _jsx(TouchableOpacity, { onPress: goBack, style: styles.backButton, children: _jsx(Text, { style: styles.backText, children: "\u2190 Quay l\u1EA1i \u0111\u0103ng k\u00FD" }) })] }) }));
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    content: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
        color: '#333',
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 10,
    },
    email: {
        fontSize: 16,
        color: '#007AFF',
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 30,
    },
    otpContainer: {
        alignItems: 'center',
        marginBottom: 30,
    },
    otpInput: {
        borderWidth: 2,
        borderColor: '#007AFF',
        borderRadius: 15,
        padding: 20,
        width: 200,
        backgroundColor: '#fff',
        textAlign: 'center',
        fontSize: 24,
        fontWeight: 'bold',
        letterSpacing: 10,
    },
    timerContainer: {
        alignItems: 'center',
        marginBottom: 30,
    },
    timer: {
        fontSize: 16,
        color: '#FF6B6B',
        fontWeight: '600',
    },
    resendButton: {
        padding: 10,
    },
    resendText: {
        fontSize: 16,
        color: '#007AFF',
        fontWeight: '600',
    },
    backButton: {
        alignItems: 'center',
        marginTop: 20,
        padding: 10,
    },
    backText: {
        fontSize: 16,
        color: '#666',
    },
});
