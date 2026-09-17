import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api.js';
import AuthLayout from '../components/auth/AuthLayout.jsx';
import OtpInput from '../components/auth/OtpInput.jsx';
import {
  Mail,
  Lock,
  ArrowRight,
  ArrowLeft,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';
import './Auth.css';

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleSendResetCode = async (e) => {
    e.preventDefault();
    setError('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      await authApi.forgotPassword({ email: cleanEmail });
      setResendCooldown(45);
      setStep(2);
    } catch (err) {
      setError(err.message || 'Failed to send reset code');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || loading) return;
    setError('');
    setLoading(true);
    try {
      await authApi.forgotPassword({ email: email.trim().toLowerCase() });
      setResendCooldown(45);
      setOtp('');
    } catch (err) {
      setError(err.message || 'Failed to resend code');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (otp.length !== 6) {
      setError('Please enter all 6 digits of your reset code');
      return;
    }
    if (!newPassword) {
      setError('Please enter a new password');
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword({
        email: email.trim().toLowerCase(),
        otp,
        newPassword,
      });
      setStep(3);
    } catch (err) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="auth-card">
        <div className="auth-card-glow" />

        {error && (
          <div className="auth-error-banner" role="alert">
            <AlertCircle size={16} className="auth-error-icon" />
            <span>{error}</span>
          </div>
        )}

        {step === 1 && (
          <div>
            <div className="auth-brand">
              <img src="/GLUG-LOGO.png" alt="GLUG" className="auth-logo" />
              <h1 className="auth-title">Reset password</h1>
              <p className="auth-subtitle">
                Enter your registered student email to receive a 6-digit reset code.
              </p>
            </div>

            <form className="auth-form" onSubmit={handleSendResetCode} noValidate>
              <div className="auth-field-wrap">
                <label className="auth-field-label">EMAIL ADDRESS</label>
                <div className="auth-input-relative">
                  <input
                    type="email"
                    className="auth-input"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError('');
                    }}
                    required
                    autoFocus
                  />
                </div>
              </div>

              <button type="submit" className="auth-submit" disabled={loading}>
                {loading ? 'Sending reset code…' : (
                  <>
                    Send Reset Code <ArrowRight size={16} />
                  </>
                )}
                <span className="auth-submit-glint" />
              </button>

              <div className="auth-divider" />

              <p className="auth-footer">
                Remembered your password? <Link to="/login">Back to log in</Link>
              </p>
            </form>
          </div>
        )}

        {step === 2 && (
          <div className="auth-step-wrapper">
            <div className="auth-icon-badge">
              <KeyRound size={26} color="#3b82f6" />
            </div>

            <div className="auth-brand" style={{ marginBottom: '1.25rem' }}>
              <h1 className="auth-title">Enter reset code</h1>
              <p className="auth-subtitle">
                We sent a 6-digit code to <strong style={{ color: 'var(--text)' }}>{email}</strong>
              </p>
            </div>

            <form onSubmit={handleResetPassword} className="auth-otp-form">
              <div className="auth-otp-block">
                <OtpInput
                  value={otp}
                  onChange={(val) => {
                    setOtp(val);
                    if (error) setError('');
                  }}
                  disabled={loading}
                  error={Boolean(error)}
                />
              </div>

              <div className="auth-resend-row">
                {resendCooldown > 0 ? (
                  <span className="auth-resend-cooldown">
                    Resend code in <strong>{resendCooldown}s</strong>
                  </span>
                ) : (
                  <button
                    type="button"
                    className="auth-link-btn"
                    onClick={handleResend}
                    disabled={loading}
                  >
                    <RefreshCw size={13} /> Resend reset code
                  </button>
                )}
              </div>

              <div className="auth-field-wrap">
                <label className="auth-field-label">NEW PASSWORD</label>
                <div className="auth-input-relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="auth-input"
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (error) setError('');
                    }}
                    required
                  />
                  <button
                    type="button"
                    className="auth-eye-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="auth-field-wrap">
                <label className="auth-field-label">CONFIRM NEW PASSWORD</label>
                <div className="auth-input-relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="auth-input"
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (error) setError('');
                    }}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="auth-submit"
                disabled={otp.length !== 6 || !newPassword || loading}
              >
                {loading ? 'Updating password…' : 'Set New Password'}
                <span className="auth-submit-glint" />
              </button>

              <button
                type="button"
                className="auth-back-btn"
                onClick={() => {
                  setStep(1);
                  setError('');
                }}
              >
                <ArrowLeft size={14} /> Back to email entry
              </button>
            </form>
          </div>
        )}

        {step === 3 && (
          <div className="auth-step-wrapper" style={{ textAlign: 'center' }}>
            <div className="auth-icon-badge" style={{ background: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
              <CheckCircle2 size={32} color="#10b981" />
            </div>

            <h1 className="auth-title">Password reset!</h1>
            <p className="auth-subtitle" style={{ marginBottom: '1.75rem' }}>
              Your password has been successfully updated. You can now log in with your new credentials.
            </p>

            <button
              type="button"
              className="auth-submit"
              onClick={() => navigate('/login')}
            >
              Proceed to Log In <ArrowRight size={16} />
              <span className="auth-submit-glint" />
            </button>
          </div>
        )}
      </div>
    </AuthLayout>
  );
}
