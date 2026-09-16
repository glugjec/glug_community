import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import AuthLayout from '../components/auth/AuthLayout.jsx';
import GoogleAuthButton from '../components/auth/GoogleAuthButton.jsx';
import UsernameStep from '../components/auth/UsernameStep.jsx';
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, ShieldAlert, CheckCircle2, X } from 'lucide-react';
import './Auth.css';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [oauthData, setOauthData] = useState(null);
  const [chosenUsername, setChosenUsername] = useState('');

  const [bannedModalData, setBannedModalData] = useState(() => {
    try {
      const stored = sessionStorage.getItem('glug_banned_notice');
      if (stored) {
        sessionStorage.removeItem('glug_banned_notice');
        return JSON.parse(stored);
      }
    } catch {}
    return null;
  });
  const [bannedBannerDismissed, setBannedBannerDismissed] = useState(false);
  const [appealStatement, setAppealStatement] = useState('');
  const [appealSubmitting, setAppealSubmitting] = useState(false);
  const [appealSuccess, setAppealSuccess] = useState('');
  const [appealError, setAppealError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBannedBannerDismissed(false);
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setError('Please enter your email address');
      return;
    }
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setLoading(true);
    try {
      const data = await authApi.login({ email: cleanEmail, password });
      login(data.user, data.token);
      navigate('/');
    } catch (err) {
      if (err.data?.isBanned) {
        setBannedModalData(err.data);
      } else {
        setError(err.message || 'Invalid email or password');
      }
      setLoading(false);
    }
  };

  const handleBannedAppealSubmit = async (e) => {
    e.preventDefault();
    if (!appealStatement.trim()) {
      setAppealError('Please provide an explanation for your appeal.');
      return;
    }
    setAppealSubmitting(true);
    setAppealError('');
    try {
      const res = await authApi.submitBannedAppeal({
        appealToken: bannedModalData.appealToken,
        statement: appealStatement.trim(),
      });
      setAppealSuccess(res.message || 'Your appeal has been submitted and queued for review.');
    } catch (aErr) {
      setAppealError(aErr.message || 'Failed to submit appeal. Please try logging in again.');
    } finally {
      setAppealSubmitting(false);
    }
  };

  const handleGoogleRequiresUsername = (data) => {
    setOauthData(data);
    setChosenUsername(data.suggestedUsername || '');
  };

  const handleOAuthComplete = async (username) => {
    setError('');
    setLoading(true);
    try {
      const res = await authApi.completeGoogleAuth({
        oauthToken: oauthData.oauthToken,
        username,
      });
      login(res.user, res.token);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Failed to complete registration');
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="auth-card">
        <div className="auth-card-glow" />

        <div className="auth-mode-switch">
          <button type="button" className="auth-mode-tab is-active">
            Log In
          </button>
          <Link to="/register" className="auth-mode-tab">
            Create Account
          </Link>
        </div>

        {bannedModalData && !bannedBannerDismissed && (
          <div
            className="auth-error-banner"
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              borderColor: 'rgba(239, 68, 68, 0.4)',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '6px',
              padding: '12px 14px',
              borderRadius: '12px',
            }}
            role="alert"
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldAlert size={18} className="text-red" />
                <strong style={{ fontSize: '0.9rem', color: '#f87171' }}>
                  {bannedModalData.banExpiresAt ? 'Account Temporarily Suspended' : 'Account Suspended by Admin'}
                </strong>
              </div>
              <button
                type="button"
                onClick={() => setBannedBannerDismissed(true)}
                style={{ background: 'none', border: 'none', color: '#8b949e', cursor: 'pointer', padding: 0 }}
              >
                <X size={15} />
              </button>
            </div>
            <p style={{ margin: 0, fontSize: '0.84rem', color: '#fca5a5', lineHeight: 1.45 }}>
              {bannedModalData.banReason
                ? `Reason: ${bannedModalData.banReason}`
                : 'Your account was suspended by an administrator.'}
            </p>
            {bannedModalData.banExpiresAt && (
              <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                Expires: {new Date(bannedModalData.banExpiresAt).toLocaleString()}
              </span>
            )}
            {bannedModalData.appealToken && (
              <button
                type="button"
                onClick={() => setBannedBannerDismissed(false)}
                style={{
                  marginTop: '4px',
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid rgba(239, 68, 68, 0.5)',
                  color: '#ffffff',
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  padding: '4px 10px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                Submit Appeal
              </button>
            )}
          </div>
        )}

        {error && (
          <div className="auth-error-banner" role="alert">
            <AlertCircle size={16} className="auth-error-icon" />
            <span>{error}</span>
          </div>
        )}

        {oauthData ? (
          <UsernameStep
            value={chosenUsername}
            onChange={(val) => {
              setChosenUsername(val);
              if (error) setError('');
            }}
            onSubmit={handleOAuthComplete}
            loading={loading}
            email={oauthData.email}
            avatar={oauthData.picture}
            title="Complete your profile"
            subtitle="Choose a unique username to finish signing in with Google."
            buttonText="Finish & Enter GLUG"
          />
        ) : (
          <div>
            <div className="auth-brand">
              <h2 className="auth-title">Welcome back</h2>
              <p className="auth-subtitle">Log in with your email or Google account.</p>
            </div>

            <form className="auth-form" onSubmit={submit} noValidate>
              <div className="auth-field-wrap">
                <label className="auth-field-label">EMAIL ADDRESS</label>
                <div className="auth-input-relative">
                  <span className="auth-input-icon">
                    <Mail size={16} />
                  </span>
                  <input
                    type="email"
                    className="auth-input has-icon"
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

              <div className="auth-field-wrap">
                <div className="auth-label-row">
                  <label className="auth-field-label">PASSWORD</label>
                  <Link to="/forgot-password" className="auth-forgot-link">
                    Forgot password?
                  </Link>
                </div>
                <div className="auth-input-relative">
                  <span className="auth-input-icon">
                    <Lock size={16} />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="auth-input has-icon"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError('');
                    }}
                    required
                  />
                  <button
                    type="button"
                    className="auth-eye-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="auth-submit" disabled={loading}>
                {loading ? 'Signing in…' : (
                  <>
                    Sign In <ArrowRight size={16} />
                  </>
                )}
                <span className="auth-submit-glint" />
              </button>
            </form>

            <div className="auth-separator">
              <span>OR CONTINUE WITH</span>
            </div>

            <GoogleAuthButton
              onError={(msg) => setError(msg)}
              onRequiresUsername={handleGoogleRequiresUsername}
            />

            <div className="auth-divider" />
            <p className="auth-footer">
              New to GLUG? <Link to="/register">Create an account</Link>
            </p>
          </div>
        )}
      </div>

      {bannedModalData && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px',
          }}
        >
          <div
            style={{
              backgroundColor: '#161b22',
              border: '1px solid #ef4444',
              borderRadius: '16px',
              maxWidth: '500px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7)',
              color: '#f0f6fc',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', padding: '8px', borderRadius: '10px', display: 'flex' }}>
                  <ShieldAlert size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#f87171', fontWeight: 700 }}>Account Suspended</h3>
                  <span style={{ fontSize: '0.78rem', color: '#8b949e' }}>Community Policy Enforcement</span>
                </div>
              </div>
              <button
                onClick={() => setBannedModalData(null)}
                style={{ background: 'transparent', border: 'none', color: '#8b949e', cursor: 'pointer', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.88rem', color: '#c9d1d9', lineHeight: 1.5, margin: '0 0 14px' }}>
              {bannedModalData.banExpiresAt
                ? `Your account has been temporarily suspended until ${new Date(bannedModalData.banExpiresAt).toLocaleString()}.`
                : 'Your account has been suspended by an administrator.'}
            </p>

            <div style={{ background: '#0d1117', border: '1px solid #30363d', borderRadius: '10px', padding: '12px 14px', marginBottom: '16px' }}>
              <div style={{ fontSize: '0.74rem', color: '#8b949e', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>
                Violation Details
              </div>
              <div style={{ fontSize: '0.86rem', color: '#fca5a5' }}>
                {bannedModalData.banReason || 'Violation of community safety standards'}
              </div>
              {bannedModalData.banExpiresAt && (
                <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '4px' }}>
                  Suspension Lift Time: {new Date(bannedModalData.banExpiresAt).toLocaleString()}
                </div>
              )}
            </div>

            {appealSuccess ? (
              <div style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '10px', padding: '14px', color: '#34d399', fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={18} />
                <span>{appealSuccess}</span>
              </div>
            ) : (
              <form onSubmit={handleBannedAppealSubmit}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#c9d1d9', marginBottom: '6px' }}>
                  Submit an Appeal
                </label>
                <textarea
                  value={appealStatement}
                  onChange={(e) => setAppealStatement(e.target.value)}
                  placeholder="Explain why you believe this suspension should be reviewed by administrators..."
                  rows={4}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    background: '#0d1117',
                    border: '1px solid #30363d',
                    borderRadius: '8px',
                    color: '#f0f6fc',
                    fontSize: '0.85rem',
                    padding: '10px',
                    outline: 'none',
                    resize: 'vertical',
                    marginBottom: '10px',
                  }}
                />

                {appealError && (
                  <div style={{ color: '#f87171', fontSize: '0.8rem', marginBottom: '10px' }}>
                    {appealError}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setBannedModalData(null)}
                    style={{
                      background: 'transparent',
                      border: '1px solid #30363d',
                      color: '#8b949e',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                    }}
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={appealSubmitting}
                    style={{
                      background: '#ef4444',
                      border: 'none',
                      color: '#ffffff',
                      padding: '8px 18px',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {appealSubmitting ? 'Submitting...' : 'Submit Appeal'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </AuthLayout>
  );
}
