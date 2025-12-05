import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, setAuthToken, sendVerificationOTP } from '../api';
import './Login.css';

export default function LoginScreen() {
  console.log('🔐 LoginScreen component rendering...');
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect to home if already logged in
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      console.log('🔍 Already logged in, redirecting to home...');
      navigate('/', { replace: true });
    }
  }, [navigate]);

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
      const userId = res.user.id || (res.user as any)._id || (res.user as any).userId;

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
      // Small delay to ensure state is updated
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 100);
    } catch (e: any) {
      console.error('❌ Login error:', e);

      if (e?.response?.status === 403) {
        const resend = confirm(
          'Email chưa được xác thực. Vui lòng kiểm tra email và xác thực tài khoản trước khi đăng nhập. Bạn có muốn gửi lại mã OTP không?'
        );
        if (resend) {
          try {
            setLoading(true);
            await sendVerificationOTP(email);
            alert(`Mã OTP xác thực đã được gửi đến ${email}. Vui lòng kiểm tra email và thử đăng nhập lại.`);
            setPassword('');
          } catch (error: any) {
            console.error('❌ Send verification OTP error:', error);
            alert(error?.response?.data?.message || 'Không thể gửi lại OTP. Vui lòng thử lại sau.');
          } finally {
            setLoading(false);
          }
        }
      } else {
        alert('Đăng nhập thất bại: ' + (e?.response?.data?.message || e.message));
      }
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
            <div className="auth-logo-text">ZoLa</div>
          </div>
          <p className="auth-brand-tagline">
            Kết nối với bạn bè và thế giới xung quanh bạn
          </p>
          <div className="auth-brand-features">
            <div className="auth-feature">
              <svg className="auth-feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
              </svg>
              <span>Nhắn tin thời gian thực</span>
            </div>
            <div className="auth-feature">
              <svg className="auth-feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>Gọi video & chia sẻ màn hình</span>
            </div>
            <div className="auth-feature">
              <svg className="auth-feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>Chia sẻ khoảnh khắc với bạn bè</span>
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
            <h1 className="auth-form-title">Chào mừng trở lại</h1>
            <p className="auth-form-subtitle">Nhập thông tin của bạn để tiếp tục</p>
          </div>

          {/* Form */}
          <div className="auth-form">
            <div className="auth-input-group">
              <label className="auth-label">Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                className="auth-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && onSubmit()}
                autoComplete="email"
              />
            </div>

            <div className="auth-input-group">
              <label className="auth-label">Mật khẩu</label>
              <input
                type="password"
                placeholder="••••••••"
                className="auth-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && onSubmit()}
                autoComplete="current-password"
              />
            </div>

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
                  Đang đăng nhập...
                </span>
              ) : (
                'Đăng nhập'
              )}
            </button>
          </div>

          {/* Footer */}
          <div className="auth-form-footer">
            <span className="auth-footer-text">Chưa có tài khoản?</span>
            <button
              className="auth-link"
              onClick={() => navigate('/register')}
            >
              Tạo tài khoản
            </button>
          </div>

          {/* Decorative Elements */}
          <div className="auth-decorative-line"></div>
        </div>
      </div>
    </div>
  );
}
