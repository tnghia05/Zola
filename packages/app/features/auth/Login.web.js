"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { login, setAuthToken, sendVerificationOTP } from '../../api';
import './Login.css';
export default function LoginScreen() {
    console.log('🔐 LoginScreen component rendering...');
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    // Redirect to home if already logged in
    useEffect(() => {
        const token = localStorage.getItem('auth_token');
        if (token) {
            console.log('🔍 Already logged in, redirecting to home...');
            router.push('/conversations');
        }
    }, [router]);
    console.log('🔐 LoginScreen render complete');
    const onSubmit = async () => {
        if (!email || !password) {
            alert('Thiếu thông tin: Nhập email và mật khẩu');
            return;
        }
        try {
            setLoading(true);
            const res = await login(email, password);
            console.log('🔍 Login response:', res);
            const token = res.accessToken;
            const userId = res.user.id || res.user._id || res.user.userId;
            if (!userId) {
                console.error('❌ No userId found in login response!');
                alert('Lỗi: Không tìm thấy user ID trong phản hồi đăng nhập');
                return;
            }
            localStorage.setItem('auth_token', token);
            localStorage.setItem('user_id', userId);
            localStorage.setItem('user_data', JSON.stringify(res.user));
            setAuthToken(token);
            // Dispatch custom event to notify App.tsx that login succeeded
            window.dispatchEvent(new Event('auth:login'));
            console.log('🔍 Login successful, navigating to Conversations...');
            router.push('/conversations');
        }
        catch (e) {
            console.error('❌ Login error:', e);
            if (e?.response?.status === 403) {
                const resend = confirm('Email chưa được xác thực. Vui lòng kiểm tra email và xác thực tài khoản trước khi đăng nhập. Bạn có muốn gửi lại mã OTP không?');
                if (resend) {
                    try {
                        setLoading(true);
                        await sendVerificationOTP(email);
                        alert(`Mã OTP xác thực đã được gửi đến ${email}. Vui lòng kiểm tra email và thử đăng nhập lại.`);
                        setPassword('');
                    }
                    catch (error) {
                        console.error('❌ Send verification OTP error:', error);
                        alert(error?.response?.data?.message || 'Không thể gửi lại OTP. Vui lòng thử lại sau.');
                    }
                    finally {
                        setLoading(false);
                    }
                }
            }
            else {
                alert('Đăng nhập thất bại: ' + (e?.response?.data?.message || e.message));
            }
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs("div", { className: "auth-container", children: [_jsxs("div", { className: "auth-brand-area", children: [_jsx("div", { className: "auth-gradient-bg" }), _jsx("div", { className: "auth-shape auth-shape-1" }), _jsx("div", { className: "auth-shape auth-shape-2" }), _jsx("div", { className: "auth-shape auth-shape-3" }), _jsxs("div", { className: "auth-brand-content", children: [_jsxs("div", { className: "auth-logo-large", children: [_jsx("div", { className: "auth-logo-icon", children: "D" }), _jsx("div", { className: "auth-logo-text", children: "ZoLa" })] }), _jsx("p", { className: "auth-brand-tagline", children: "K\u1EBFt n\u1ED1i v\u1EDBi b\u1EA1n b\u00E8 v\u00E0 th\u1EBF gi\u1EDBi xung quanh b\u1EA1n" }), _jsxs("div", { className: "auth-brand-features", children: [_jsxs("div", { className: "auth-feature", children: [_jsx("svg", { className: "auth-feature-icon", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" }) }), _jsx("span", { children: "Nh\u1EAFn tin th\u1EDDi gian th\u1EF1c" })] }), _jsxs("div", { className: "auth-feature", children: [_jsx("svg", { className: "auth-feature-icon", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" }) }), _jsx("span", { children: "G\u1ECDi video & chia s\u1EBB m\u00E0n h\u00ECnh" })] }), _jsxs("div", { className: "auth-feature", children: [_jsx("svg", { className: "auth-feature-icon", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" }) }), _jsx("span", { children: "Chia s\u1EBB kho\u1EA3nh kh\u1EAFc v\u1EDBi b\u1EA1n b\u00E8" })] })] })] })] }), _jsxs("div", { className: "auth-form-area", children: [_jsx("div", { className: "auth-glow-effect" }), _jsxs("div", { className: "auth-form-container", children: [_jsxs("div", { className: "auth-form-header", children: [_jsx("h1", { className: "auth-form-title", children: "Ch\u00E0o m\u1EEBng tr\u1EDF l\u1EA1i" }), _jsx("p", { className: "auth-form-subtitle", children: "Nh\u1EADp th\u00F4ng tin c\u1EE7a b\u1EA1n \u0111\u1EC3 ti\u1EBFp t\u1EE5c" })] }), _jsxs("div", { className: "auth-form", children: [_jsxs("div", { className: "auth-input-group", children: [_jsx("label", { className: "auth-label", children: "Email" }), _jsx("input", { type: "email", placeholder: "you@example.com", className: "auth-input", value: email, onChange: (e) => setEmail(e.target.value), onKeyPress: (e) => e.key === 'Enter' && onSubmit(), autoComplete: "email" })] }), _jsxs("div", { className: "auth-input-group", children: [_jsx("label", { className: "auth-label", children: "M\u1EADt kh\u1EA9u" }), _jsx("input", { type: "password", placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", className: "auth-input", value: password, onChange: (e) => setPassword(e.target.value), onKeyPress: (e) => e.key === 'Enter' && onSubmit(), autoComplete: "current-password" })] }), _jsx("button", { className: "auth-button-primary", onClick: onSubmit, disabled: loading, children: loading ? (_jsxs("span", { className: "auth-button-loading", children: [_jsxs("svg", { className: "auth-spinner", viewBox: "0 0 24 24", children: [_jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4", fill: "none" }), _jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" })] }), "\u0110ang \u0111\u0103ng nh\u1EADp..."] })) : ('Đăng nhập') })] }), _jsxs("div", { className: "auth-form-footer", children: [_jsx("span", { className: "auth-footer-text", children: "Ch\u01B0a c\u00F3 t\u00E0i kho\u1EA3n?" }), _jsx("button", { className: "auth-link", onClick: () => router.push('/register'), children: "T\u1EA1o t\u00E0i kho\u1EA3n" })] }), _jsx("div", { className: "auth-decorative-line" })] })] })] }));
}
