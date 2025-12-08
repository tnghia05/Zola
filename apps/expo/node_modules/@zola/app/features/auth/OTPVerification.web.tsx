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
  const otpInputRef = useRef<HTMLInputElement>(null);

  const email = searchParams.get('email') || '';
  const password = searchParams.get('password') || '';
  const name = searchParams.get('name') || '';

  // Timer countdown
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
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

  const formatTime = (seconds: number) => {
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
    } catch (e: any) {
      console.error('❌ OTP verification error:', e);
      const errorMessage =
        e?.response?.data?.message || e.message || 'Mã OTP không đúng hoặc đã hết hạn';
      setError(errorMessage);
      setOtp(''); // Clear OTP on error
    } finally {
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
        alert(
          res.message ||
            'OTP mới đã được tạo nhưng không thể gửi email. Vui lòng thử lại sau.'
        );
      } else {
        alert(`Đã gửi lại mã OTP\nMã OTP mới đã được gửi đến ${email}`);
      }

      // Focus back to input
      setTimeout(() => {
        otpInputRef.current?.focus();
      }, 500);
    } catch (e: any) {
      console.error('❌ Resend OTP error:', e);
      const errorMessage =
        e?.response?.data?.message || e.message || 'Không thể gửi lại mã OTP. Vui lòng thử lại sau.';
      setError(errorMessage);
    } finally {
      setResendLoading(false);
    }
  };

  const goBack = () => {
    router.push('/register');
  };

  if (!email) {
    return (
      <div className="auth-container">
        <div className="auth-form-area">
          <div className="auth-form-container">
            <div className="auth-error-message">
              Email không hợp lệ. Vui lòng đăng ký lại.
            </div>
            <button className="auth-button-primary" onClick={goBack}>
              Quay lại đăng ký
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-form-area">
        <div className="auth-glow-effect"></div>
        <div className="auth-form-container">
          <div className="auth-form-header">
            <h1 className="auth-form-title">Xác thực OTP</h1>
            <p className="auth-form-subtitle">
              Nhập mã 6 chữ số đã được gửi đến:
            </p>
            <p style={{ color: '#0866FF', fontWeight: 600, marginTop: 8 }}>{email}</p>
          </div>

          <div className="auth-form">
            <div className="auth-input-group">
              <label className="auth-label">Mã OTP</label>
              <input
                ref={otpInputRef}
                type="text"
                placeholder="000000"
                className={`auth-input ${error ? 'auth-input-error' : ''}`}
                style={{
                  textAlign: 'center',
                  fontSize: 24,
                  fontWeight: 700,
                  letterSpacing: 8,
                  fontFamily: 'monospace',
                }}
                value={otp}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setOtp(value);
                  if (error) setError('');
                }}
                maxLength={6}
                autoComplete="one-time-code"
              />
              {error && <span className="auth-error-text">{error}</span>}
            </div>

            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              {!canResend ? (
                <p style={{ color: '#f02849', fontSize: 14, fontWeight: 600 }}>
                  Gửi lại sau: {formatTime(timeLeft)}
                </p>
              ) : (
                <button
                  className="auth-link"
                  onClick={handleResendOTP}
                  disabled={resendLoading}
                  style={{ background: 'none', border: 'none', padding: 0 }}
                >
                  {resendLoading ? 'Đang gửi...' : 'Gửi lại mã OTP'}
                </button>
              )}
            </div>

            <button
              className="auth-button-primary"
              onClick={handleVerifyOTP}
              disabled={loading || otp.length !== 6}
            >
              {loading ? (
                <span className="auth-button-loading">
                  <svg className="auth-spinner" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang xác thực...
                </span>
              ) : (
                'Xác thực'
              )}
            </button>

            <div className="auth-form-footer" style={{ marginTop: 20 }}>
              <button className="auth-link" onClick={goBack} style={{ background: 'none', border: 'none', padding: 0 }}>
                ← Quay lại đăng ký
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

