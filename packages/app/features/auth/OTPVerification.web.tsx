import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { verifyOTP, resendOTP } from '../api';
import { useTheme } from '../contexts/ThemeContext';

export default function OTPVerificationScreen() {
  const location = useLocation();
  const { colors } = useTheme();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  
  const email = (location.state as any)?.email || '';

  const onSubmit = async () => {
    if (!otp) {
      alert('Nhập mã OTP');
      return;
    }
    try {
      setLoading(true);
      const res = await verifyOTP(email, otp);
      console.log('🔍 OTP verification response:', res);
      
      localStorage.setItem('auth_token', res.accessToken);
      localStorage.setItem('user_id', res.user.id);
      localStorage.setItem('user_data', JSON.stringify(res.user));
      
      window.location.href = '/';
    } catch (e: any) {
      console.error('❌ OTP verification error:', e);
      alert('Xác thực OTP thất bại: ' + (e?.response?.data?.message || e.message));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await resendOTP(email);
      alert('Đã gửi lại mã OTP');
    } catch (e: any) {
      alert('Không thể gửi lại OTP: ' + (e?.response?.data?.message || e.message));
    }
  };

  return (
    <div style={{ 
      width: '100%', 
      height: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: colors.background 
    }}>
      <div style={{ width: '100%', maxWidth: 400, padding: 40, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <h1 style={{ color: colors.text, textAlign: 'center' }}>Xác thực OTP</h1>
        <p style={{ color: colors.textSecondary, textAlign: 'center' }}>
          Mã OTP đã được gửi đến {email}
        </p>
        <input
          type="text"
          placeholder="Mã OTP"
          style={{ padding: 12, borderRadius: 8, border: `1px solid ${colors.border}` }}
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
        />
        <button
          style={{ 
            padding: 12, 
            backgroundColor: colors.buttonPrimary, 
            color: colors.buttonText,
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer'
          }}
          onClick={onSubmit}
          disabled={loading}
        >
          {loading ? 'Đang xử lý...' : 'Xác thực'}
        </button>
        <button
          style={{ 
            background: 'none', 
            border: 'none', 
            color: colors.primary,
            cursor: 'pointer',
            textDecoration: 'underline'
          }}
          onClick={handleResend}
        >
          Gửi lại mã OTP
        </button>
      </div>
    </div>
  );
}

