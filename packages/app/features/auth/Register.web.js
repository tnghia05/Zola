import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { register } from '@zola/app/api';
import './Login.css';
export default function RegisterScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const validateForm = () => {
        const newErrors = {};
        if (!email || !password || !confirmPassword) {
            newErrors.general = 'Vui lòng điền đầy đủ thông tin';
            setErrors(newErrors);
            return false;
        }
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            newErrors.email = 'Email không hợp lệ. Vui lòng nhập email đúng định dạng';
            setErrors(newErrors);
            return false;
        }
        // Password validation
        if (password.length < 6) {
            newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
            setErrors(newErrors);
            return false;
        }
        // Confirm password
        if (password !== confirmPassword) {
            newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
            setErrors(newErrors);
            return false;
        }
        setErrors({});
        return true;
    };
    const onSubmit = async () => {
        if (!validateForm())
            return;
        try {
            setLoading(true);
            setErrors({});
            console.log('🔍 Attempting to register user');
            const registerResult = await register(email, password, name || undefined);
            console.log('🔍 Register response:', registerResult);
            const otpResult = registerResult?.otp;
            console.log('🔍 OTP info from register response:', otpResult);
            // Navigate to OTP verification with state
            const params = new URLSearchParams({
                email,
                password,
                ...(name && { name }),
            });
            router.push(`/otp-verification?${params.toString()}`);
            if (otpResult?.emailSent === true) {
                alert(`Đăng ký thành công!\nMã OTP đã được gửi đến ${email}. Vui lòng nhập mã xác thực.`);
            }
            else if (otpResult?.otpCreated && otpResult.emailSent === false) {
                alert('Đăng ký thành công!\n' +
                    (otpResult.message ||
                        'OTP đã được tạo nhưng không thể gửi email. Bạn có thể thử gửi lại OTP ở màn hình tiếp theo.'));
            }
            else if (otpResult?.otpCreated === false || !otpResult) {
                alert('Đăng ký thành công!\nKhông thể gửi OTP tự động. Vui lòng sử dụng nút "Gửi lại OTP" ở màn hình tiếp theo.');
            }
        }
        catch (e) {
            console.error('❌ Registration error:', e);
            console.error('❌ Error response:', e?.response);
            console.error('❌ Error response data:', e?.response?.data);
            console.error('❌ Error response status:', e?.response?.status);
            let errorMessage = 'Có lỗi xảy ra, vui lòng thử lại';
            if (e?.response?.status === 400) {
                const errorData = e?.response?.data;
                if (errorData?.message) {
                    errorMessage = errorData.message;
                }
                else if (errorData?.errors) {
                    const errors = Array.isArray(errorData.errors)
                        ? errorData.errors.join(', ')
                        : JSON.stringify(errorData.errors);
                    errorMessage = `Lỗi validation: ${errors}`;
                }
                else {
                    errorMessage = 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.';
                }
            }
            else if (e?.response?.status === 409) {
                errorMessage = 'Email đã được sử dụng. Vui lòng chọn email khác.';
            }
            else if (e?.response?.data?.message) {
                errorMessage = e.response.data.message;
            }
            else if (e?.message) {
                errorMessage = e.message;
            }
            setErrors({ general: errorMessage });
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs("div", { className: "auth-container", children: [_jsxs("div", { className: "auth-brand-area", children: [_jsx("div", { className: "auth-gradient-bg" }), _jsx("div", { className: "auth-shape auth-shape-1" }), _jsx("div", { className: "auth-shape auth-shape-2" }), _jsx("div", { className: "auth-shape auth-shape-3" }), _jsxs("div", { className: "auth-brand-content", children: [_jsxs("div", { className: "auth-logo-large", children: [_jsx("div", { className: "auth-logo-icon", children: "D" }), _jsx("div", { className: "auth-logo-text", children: "Zola" })] }), _jsx("p", { className: "auth-brand-tagline", children: "Tham gia c\u1ED9ng \u0111\u1ED3ng v\u00E0 b\u1EAFt \u0111\u1EA7u k\u1EBFt n\u1ED1i ngay h\u00F4m nay" }), _jsxs("div", { className: "auth-brand-features", children: [_jsxs("div", { className: "auth-feature", children: [_jsx("svg", { className: "auth-feature-icon", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" }) }), _jsx("span", { children: "X\u00E2y d\u1EF1ng m\u1EA1ng l\u01B0\u1EDBi c\u1EE7a b\u1EA1n" })] }), _jsxs("div", { className: "auth-feature", children: [_jsx("svg", { className: "auth-feature-icon", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" }) }), _jsx("span", { children: "Gi\u1EEF li\u00EAn l\u1EA1c ngay l\u1EADp t\u1EE9c" })] }), _jsxs("div", { className: "auth-feature", children: [_jsx("svg", { className: "auth-feature-icon", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" }) }), _jsx("span", { children: "T\u1EF1 do th\u1EC3 hi\u1EC7n b\u1EA3n th\u00E2n" })] })] })] })] }), _jsxs("div", { className: "auth-form-area", children: [_jsx("div", { className: "auth-glow-effect" }), _jsxs("div", { className: "auth-form-container", children: [_jsxs("div", { className: "auth-form-header", children: [_jsx("h1", { className: "auth-form-title", children: "T\u1EA1o t\u00E0i kho\u1EA3n" }), _jsx("p", { className: "auth-form-subtitle", children: "B\u1EAFt \u0111\u1EA7u v\u1EDBi t\u00E0i kho\u1EA3n mi\u1EC5n ph\u00ED c\u1EE7a b\u1EA1n" })] }), _jsxs("div", { className: "auth-form", children: [_jsxs("div", { className: "auth-input-group", children: [_jsx("label", { className: "auth-label", children: "H\u1ECD v\u00E0 t\u00EAn" }), _jsx("input", { type: "text", placeholder: "Nguy\u1EC5n V\u0103n A", className: "auth-input", value: name, onChange: (e) => setName(e.target.value), autoComplete: "name" })] }), _jsxs("div", { className: "auth-input-group", children: [_jsx("label", { className: "auth-label", children: "Email" }), _jsx("input", { type: "email", placeholder: "you@example.com", className: `auth-input ${errors.email ? 'auth-input-error' : ''}`, value: email, onChange: (e) => {
                                                    setEmail(e.target.value);
                                                    if (errors.email)
                                                        setErrors({ ...errors, email: '' });
                                                }, autoComplete: "email" }), errors.email && _jsx("span", { className: "auth-error-text", children: errors.email })] }), _jsxs("div", { className: "auth-input-group", children: [_jsx("label", { className: "auth-label", children: "M\u1EADt kh\u1EA9u" }), _jsx("input", { type: "password", placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", className: `auth-input ${errors.password ? 'auth-input-error' : ''}`, value: password, onChange: (e) => {
                                                    setPassword(e.target.value);
                                                    if (errors.password)
                                                        setErrors({ ...errors, password: '' });
                                                }, onKeyPress: (e) => e.key === 'Enter' && onSubmit(), autoComplete: "new-password" }), errors.password && _jsx("span", { className: "auth-error-text", children: errors.password })] }), _jsxs("div", { className: "auth-input-group", children: [_jsx("label", { className: "auth-label", children: "X\u00E1c nh\u1EADn m\u1EADt kh\u1EA9u" }), _jsx("input", { type: "password", placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", className: `auth-input ${errors.confirmPassword ? 'auth-input-error' : ''}`, value: confirmPassword, onChange: (e) => {
                                                    setConfirmPassword(e.target.value);
                                                    if (errors.confirmPassword)
                                                        setErrors({ ...errors, confirmPassword: '' });
                                                }, onKeyPress: (e) => e.key === 'Enter' && onSubmit(), autoComplete: "new-password" }), errors.confirmPassword && _jsx("span", { className: "auth-error-text", children: errors.confirmPassword })] }), errors.general && (_jsx("div", { className: "auth-error-message", children: errors.general })), _jsx("button", { className: "auth-button-primary", onClick: onSubmit, disabled: loading, children: loading ? (_jsxs("span", { className: "auth-button-loading", children: [_jsxs("svg", { className: "auth-spinner", viewBox: "0 0 24 24", children: [_jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4", fill: "none" }), _jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" })] }), "\u0110ang t\u1EA1o t\u00E0i kho\u1EA3n..."] })) : ('Tạo tài khoản') }), _jsxs("p", { className: "auth-terms", children: ["B\u1EB1ng c\u00E1ch \u0111\u0103ng k\u00FD, b\u1EA1n \u0111\u1ED3ng \u00FD v\u1EDBi", ' ', _jsx("a", { href: "#", className: "auth-terms-link", children: "\u0110i\u1EC1u kho\u1EA3n" }), " v\u00E0", ' ', _jsx("a", { href: "#", className: "auth-terms-link", children: "Ch\u00EDnh s\u00E1ch b\u1EA3o m\u1EADt" })] })] }), _jsxs("div", { className: "auth-form-footer", children: [_jsx("span", { className: "auth-footer-text", children: "\u0110\u00E3 c\u00F3 t\u00E0i kho\u1EA3n?" }), _jsx("button", { className: "auth-link", onClick: () => router.push('/login'), children: "\u0110\u0103ng nh\u1EADp" })] }), _jsx("div", { className: "auth-decorative-line" })] })] })] }));
}
