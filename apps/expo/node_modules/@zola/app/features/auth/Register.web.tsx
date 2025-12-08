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
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

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
    if (!validateForm()) return;

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
      } else if (otpResult?.otpCreated && otpResult.emailSent === false) {
        alert(
          'Đăng ký thành công!\n' +
          (otpResult.message ||
            'OTP đã được tạo nhưng không thể gửi email. Bạn có thể thử gửi lại OTP ở màn hình tiếp theo.')
        );
      } else if (otpResult?.otpCreated === false || !otpResult) {
        alert(
          'Đăng ký thành công!\nKhông thể gửi OTP tự động. Vui lòng sử dụng nút "Gửi lại OTP" ở màn hình tiếp theo.'
        );
      }
    } catch (e: any) {
      console.error('❌ Registration error:', e);
      console.error('❌ Error response:', e?.response);
      console.error('❌ Error response data:', e?.response?.data);
      console.error('❌ Error response status:', e?.response?.status);

      let errorMessage = 'Có lỗi xảy ra, vui lòng thử lại';

      if (e?.response?.status === 400) {
        const errorData = e?.response?.data;
        if (errorData?.message) {
          errorMessage = errorData.message;
        } else if (errorData?.errors) {
          const errors = Array.isArray(errorData.errors)
            ? errorData.errors.join(', ')
            : JSON.stringify(errorData.errors);
          errorMessage = `Lỗi validation: ${errors}`;
        } else {
          errorMessage = 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.';
        }
      } else if (e?.response?.status === 409) {
        errorMessage = 'Email đã được sử dụng. Vui lòng chọn email khác.';
      } else if (e?.response?.data?.message) {
        errorMessage = e.response.data.message;
      } else if (e?.message) {
        errorMessage = e.message;
      }

      setErrors({ general: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* LEFT SIDE - Brand Area */}
      <div className="auth-brand-area">
        {/* Animated Background Gradient */}
        <div className="auth-gradient-bg"></div>

        {/* Floating Geometric Shapes */}
        <div className="auth-shape auth-shape-1"></div>
        <div className="auth-shape auth-shape-2"></div>
        <div className="auth-shape auth-shape-3"></div>

        {/* Brand Content */}
        <div className="auth-brand-content">
          <div className="auth-logo-large">
            <div className="auth-logo-icon">D</div>
            <div className="auth-logo-text">Zola</div>
          </div>
          <p className="auth-brand-tagline">
            Tham gia cộng đồng và bắt đầu kết nối ngay hôm nay
          </p>
          <div className="auth-brand-features">
            <div className="auth-feature">
              <svg className="auth-feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span>Xây dựng mạng lưới của bạn</span>
            </div>
            <div className="auth-feature">
              <svg className="auth-feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              <span>Giữ liên lạc ngay lập tức</span>
            </div>
            <div className="auth-feature">
              <svg className="auth-feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
              </svg>
              <span>Tự do thể hiện bản thân</span>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE - Form Area */}
      <div className="auth-form-area">
        {/* Atmospheric Glow Effect */}
        <div className="auth-glow-effect"></div>

        <div className="auth-form-container">
          {/* Header */}
          <div className="auth-form-header">
            <h1 className="auth-form-title">Tạo tài khoản</h1>
            <p className="auth-form-subtitle">Bắt đầu với tài khoản miễn phí của bạn</p>
          </div>

          {/* Form */}
          <div className="auth-form">
            <div className="auth-input-group">
              <label className="auth-label">Họ và tên</label>
              <input
                type="text"
                placeholder="Nguyễn Văn A"
                className="auth-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
            </div>

            <div className="auth-input-group">
              <label className="auth-label">Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                className={`auth-input ${errors.email ? 'auth-input-error' : ''}`}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors({ ...errors, email: '' });
                }}
                autoComplete="email"
              />
              {errors.email && <span className="auth-error-text">{errors.email}</span>}
            </div>

            <div className="auth-input-group">
              <label className="auth-label">Mật khẩu</label>
              <input
                type="password"
                placeholder="••••••••"
                className={`auth-input ${errors.password ? 'auth-input-error' : ''}`}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors({ ...errors, password: '' });
                }}
                onKeyPress={(e) => e.key === 'Enter' && onSubmit()}
                autoComplete="new-password"
              />
              {errors.password && <span className="auth-error-text">{errors.password}</span>}
            </div>

            <div className="auth-input-group">
              <label className="auth-label">Xác nhận mật khẩu</label>
              <input
                type="password"
                placeholder="••••••••"
                className={`auth-input ${errors.confirmPassword ? 'auth-input-error' : ''}`}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' });
                }}
                onKeyPress={(e) => e.key === 'Enter' && onSubmit()}
                autoComplete="new-password"
              />
              {errors.confirmPassword && <span className="auth-error-text">{errors.confirmPassword}</span>}
            </div>

            {errors.general && (
              <div className="auth-error-message">
                {errors.general}
              </div>
            )}

            <button
              className="auth-button-primary"
              onClick={onSubmit}
              disabled={loading}
            >
              {loading ? (
                <span className="auth-button-loading">
                  <svg className="auth-spinner" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang tạo tài khoản...
                </span>
              ) : (
                'Tạo tài khoản'
              )}
            </button>

            {/* Terms */}
            <p className="auth-terms">
              Bằng cách đăng ký, bạn đồng ý với{' '}
              <a href="#" className="auth-terms-link">Điều khoản</a> và{' '}
              <a href="#" className="auth-terms-link">Chính sách bảo mật</a>
            </p>
          </div>

          {/* Footer */}
          <div className="auth-form-footer">
            <span className="auth-footer-text">Đã có tài khoản?</span>
            <button
              className="auth-link"
              onClick={() => router.push('/login')}
            >
              Đăng nhập
            </button>
          </div>

          {/* Decorative Elements */}
          <div className="auth-decorative-line"></div>
        </div>
      </div>
    </div>
  );
}
