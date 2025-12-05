import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register } from '../api';
import './Login.css';

export default function RegisterScreen() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!email || !password) {
      alert('Thiếu thông tin: Nhập email và mật khẩu');
      return;
    }
    try {
      setLoading(true);
      const res = await register(email, password, name);
      console.log('🔍 Register response:', res);

      navigate('/otp-verification', {
        state: { email, password, name }
      });
    } catch (e: any) {
      console.error('❌ Register error:', e);
      alert('Đăng ký thất bại: ' + (e?.response?.data?.message || e.message));
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
                className="auth-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                autoComplete="new-password"
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
              onClick={() => navigate('/login')}
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
