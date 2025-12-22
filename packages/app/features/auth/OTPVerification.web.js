import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { verifyOTP, resendOTP, login } from '@zola/app/api';
import './Login.css';
export default function OTPVerificationScreen() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
    const [canResend, setCanResend] = useState(false);
    const [error, setError] = useState('');
    const otpInputRef = useRef(null);
    const email = searchParams.get('email') || '';
    const password = searchParams.get('password') || '';
    const name = searchParams.get('name') || '';
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
        if (otp.length === 6 && !loading) {
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
            setError('Vui lòng nhập đầy đủ 6 chữ số');
            return;
        }
        try {
            setLoading(true);
            setError('');
            console.log('🔍 Verifying OTP');
            const verifyResult = await verifyOTP(email, otp);
            console.log('🔍 OTP verification response:', verifyResult);
            // Auto login after successful verification
            console.log('🔍 Auto logging in after email verification');
            const loginResult = await login(email, password);
            console.log('🔍 Auto login response:', loginResult);
            // Save tokens and user info
            if (typeof window !== 'undefined') {
                localStorage.setItem('auth_token', loginResult.accessToken);
                localStorage.setItem('user_id', loginResult.user.id);
                localStorage.setItem('user_data', JSON.stringify(loginResult.user));
            }
            // Navigate to feed
            router.push('/feed');
        }
        catch (e) {
            console.error('❌ OTP verification error:', e);
            const errorMessage = e?.response?.data?.message || e.message || 'Mã OTP không đúng hoặc đã hết hạn';
            setError(errorMessage);
            setOtp(''); // Clear OTP on error
        }
        finally {
            setLoading(false);
        }
    };
    const handleResendOTP = async () => {
        try {
            setResendLoading(true);
            setError('');
            const res = await resendOTP(email);
            console.log('🔍 Resend OTP response:', res);
            // Reset timer and OTP input
            setTimeLeft(300);
            setCanResend(false);
            setOtp('');
            if (res && res.emailSent === false) {
                alert(res.message ||
                    'OTP mới đã được tạo nhưng không thể gửi email. Vui lòng thử lại sau.');
            }
            else {
                alert(`Đã gửi lại mã OTP\nMã OTP mới đã được gửi đến ${email}`);
            }
            // Focus back to input
            setTimeout(() => {
                otpInputRef.current?.focus();
            }, 500);
        }
        catch (e) {
            console.error('❌ Resend OTP error:', e);
            const errorMessage = e?.response?.data?.message || e.message || 'Không thể gửi lại mã OTP. Vui lòng thử lại sau.';
            setError(errorMessage);
        }
        finally {
            setResendLoading(false);
        }
    };
    const goBack = () => {
        router.push('/register');
    };
    if (!email) {
        return (_jsx("div", { className: "auth-container", children: _jsx("div", { className: "auth-form-area", children: _jsxs("div", { className: "auth-form-container", children: [_jsx("div", { className: "auth-error-message", children: "Email kh\u00F4ng h\u1EE3p l\u1EC7. Vui l\u00F2ng \u0111\u0103ng k\u00FD l\u1EA1i." }), _jsx("button", { className: "auth-button-primary", onClick: goBack, children: "Quay l\u1EA1i \u0111\u0103ng k\u00FD" })] }) }) }));
    }
    return (_jsx("div", { className: "auth-container", children: _jsxs("div", { className: "auth-form-area", children: [_jsx("div", { className: "auth-glow-effect" }), _jsxs("div", { className: "auth-form-container", children: [_jsxs("div", { className: "auth-form-header", children: [_jsx("h1", { className: "auth-form-title", children: "X\u00E1c th\u1EF1c OTP" }), _jsx("p", { className: "auth-form-subtitle", children: "Nh\u1EADp m\u00E3 6 ch\u1EEF s\u1ED1 \u0111\u00E3 \u0111\u01B0\u1EE3c g\u1EEDi \u0111\u1EBFn:" }), _jsx("p", { style: { color: '#0866FF', fontWeight: 600, marginTop: 8 }, children: email })] }), _jsxs("div", { className: "auth-form", children: [_jsxs("div", { className: "auth-input-group", children: [_jsx("label", { className: "auth-label", children: "M\u00E3 OTP" }), _jsx("input", { ref: otpInputRef, type: "text", placeholder: "000000", className: `auth-input ${error ? 'auth-input-error' : ''}`, style: {
                                                textAlign: 'center',
                                                fontSize: 24,
                                                fontWeight: 700,
                                                letterSpacing: 8,
                                                fontFamily: 'monospace',
                                            }, value: otp, onChange: (e) => {
                                                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                                                setOtp(value);
                                                if (error)
                                                    setError('');
                                            }, maxLength: 6, autoComplete: "one-time-code" }), error && _jsx("span", { className: "auth-error-text", children: error })] }), _jsx("div", { style: { textAlign: 'center', marginBottom: 20 }, children: !canResend ? (_jsxs("p", { style: { color: '#f02849', fontSize: 14, fontWeight: 600 }, children: ["G\u1EEDi l\u1EA1i sau: ", formatTime(timeLeft)] })) : (_jsx("button", { className: "auth-link", onClick: handleResendOTP, disabled: resendLoading, style: { background: 'none', border: 'none', padding: 0 }, children: resendLoading ? 'Đang gửi...' : 'Gửi lại mã OTP' })) }), _jsx("button", { className: "auth-button-primary", onClick: handleVerifyOTP, disabled: loading || otp.length !== 6, children: loading ? (_jsxs("span", { className: "auth-button-loading", children: [_jsxs("svg", { className: "auth-spinner", viewBox: "0 0 24 24", children: [_jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4", fill: "none" }), _jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" })] }), "\u0110ang x\u00E1c th\u1EF1c..."] })) : ('Xác thực') }), _jsx("div", { className: "auth-form-footer", style: { marginTop: 20 }, children: _jsx("button", { className: "auth-link", onClick: goBack, style: { background: 'none', border: 'none', padding: 0 }, children: "\u2190 Quay l\u1EA1i \u0111\u0103ng k\u00FD" }) })] })] })] }) }));
}
