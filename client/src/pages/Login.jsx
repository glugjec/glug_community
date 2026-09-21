import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import AuthLayout from '../components/auth/AuthLayout.jsx';
import GoogleAuthButton from '../components/auth/GoogleAuthButton.jsx';
import UsernameStep from '../components/auth/UsernameStep.jsx';
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, ShieldAlert, CheckCircle2, X, Clock, Calendar, ChevronLeft } from 'lucide-react';
import './Auth.css';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [oauthData, setOauthData] = useState(null);
  const [chosenUsername, setChosenUsername] = useState('');

  const initialBannedNotice = useMemo(() => {
    try {
      const stored = sessionStorage.getItem('glug_banned_notice');
      if (stored) {
        sessionStorage.removeItem('glug_banned_notice');
        return JSON.parse(stored);
      }
    } catch {}
    return null;
  }, []);

  const [bannedModalData, setBannedModalData] = useState(initialBannedNotice);
  const [showAppealModal, setShowAppealModal] = useState(Boolean(initialBannedNotice));
  const [appealStep, setAppealStep] = useState('notice');
  const [bannedBannerDismissed, setBannedBannerDismissed] = useState(false);
  const [appealStatement, setAppealStatement] = useState('');
  const [appealSubmitting, setAppealSubmitting] = useState(false);
  const [appealSuccess, setAppealSuccess] = useState('');
  const [appealError, setAppealError] = useState('');

  const is3rdStrikeBan = useMemo(() => {
    if (!bannedModalData) return false;
    return Boolean(
      bannedModalData.isStrikeBan ||
      (typeof bannedModalData.moderationStrikes === 'number' && bannedModalData.moderationStrikes >= 3) ||
      (bannedModalData.banReason && /strike/i.test(bannedModalData.banReason))
    );
  }, [bannedModalData]);

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
        setAppealStep('notice');
        setShowAppealModal(true);
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
      setBannedModalData((prev) => ({
        ...prev,
        pendingAppeal: {
          statement: appealStatement.trim(),
          createdAt: new Date().toISOString(),
          status: 'pending',
        },
      }));
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
                  {bannedModalData.banExpiresAt
                    ? 'Account Temporarily Suspended'
                    : is3rdStrikeBan
                    ? 'Account Banned (Strike 3/3)'
                    : 'Account Suspended by Admin'}
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
            <div
              style={{
                maxHeight: '76px',
                overflowY: 'auto',
                wordBreak: 'break-word',
                fontSize: '0.84rem',
                color: '#fca5a5',
                lineHeight: 1.45,
                margin: 0,
                width: '100%',
                paddingRight: '2px',
              }}
            >
              {is3rdStrikeBan
                ? (bannedModalData.banReason ? `3rd Strike Reason: ${bannedModalData.banReason}` : 'Your account was permanently suspended after accumulating 3 strikes.')
                : (bannedModalData.banReason ? `Reason: ${bannedModalData.banReason}` : 'Your account was suspended by an administrator.')}
            </div>
            {bannedModalData.banExpiresAt && (
              <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                Expires: {new Date(bannedModalData.banExpiresAt).toLocaleString()}
              </span>
            )}
            {bannedModalData.appealToken && (
              <button
                type="button"
                onClick={() => {
                  setAppealStep('notice');
                  setShowAppealModal(true);
                }}
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
                View Suspension & Appeal
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
              onError={(msg, errData) => {
                if (errData?.isBanned) {
                  setBannedModalData(errData);
                  setAppealStep('notice');
                  setShowAppealModal(true);
                } else {
                  setError(msg);
                }
              }}
              onRequiresUsername={handleGoogleRequiresUsername}
            />

            <div className="auth-divider" />
            <p className="auth-footer">
              New to GLUG? <Link to="/register">Create an account</Link>
            </p>
          </div>
        )}
      </div>

      {bannedModalData && showAppealModal && (
        <div
          className="ban-modal-backdrop"
          onClick={() => {
            setShowAppealModal(false);
            setAppealStep('notice');
          }}
        >
          <div
            className="ban-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ban-modal-header">
              <div className="ban-modal-header-left">
                <div className="ban-modal-icon-wrap">
                  <ShieldAlert size={24} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <h3 className="ban-modal-title">
                    {appealStep === 'form'
                      ? 'Submit Appeal'
                      : bannedModalData.banExpiresAt
                      ? 'Account Temporarily Suspended'
                      : is3rdStrikeBan
                      ? 'Account Banned (Strike 3/3)'
                      : 'Account Suspended'}
                  </h3>
                  <span className="ban-modal-sub">
                    {appealStep === 'form'
                      ? 'Explain your situation to administrators'
                      : is3rdStrikeBan
                      ? 'Community Guidelines Enforcement'
                      : 'Community Moderation Notice'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAppealModal(false);
                  setAppealStep('notice');
                }}
                className="ban-modal-close-btn"
                title="Dismiss popup"
              >
                <X size={18} />
              </button>
            </div>

            {appealSuccess ? (
              <div>
                <div style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '10px', padding: '16px', color: '#34d399', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <CheckCircle2 size={20} />
                  <span>{appealSuccess}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAppealModal(false);
                      setAppealStep('notice');
                    }}
                    className="ban-btn-secondary"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : appealStep === 'notice' ? (
              <div>
                <p className="ban-modal-desc">
                  {bannedModalData.banExpiresAt
                    ? 'Your access has been temporarily restricted by an administrator. You can review the details below or submit an appeal.'
                    : is3rdStrikeBan
                    ? 'Your account has been permanently suspended after accumulating 3 community guideline strikes. You can review the violation details below or submit an appeal for moderation review.'
                    : 'Your account has been suspended by an administrator. You can submit an appeal for moderation review.'}
                </p>

                <div className="ban-details-card">
                  <div>
                    <div className="ban-reason-label">
                      Violation Reason
                    </div>
                    <div className="ban-reason-box">
                      {bannedModalData.banReason || (is3rdStrikeBan ? 'Accumulated 3 community guideline strikes' : 'Violation of community guidelines')}
                    </div>
                  </div>

                  <div className="ban-meta-grid">
                    <div className="ban-meta-cell">
                      <div className="ban-meta-label">
                        <Calendar size={12} />
                        <span>Suspension Date</span>
                      </div>
                      <div className="ban-meta-val">
                        {bannedModalData.bannedAt ? new Date(bannedModalData.bannedAt).toLocaleString() : 'Recently'}
                      </div>
                    </div>

                    {bannedModalData.banExpiresAt ? (
                      <div className="ban-meta-cell">
                        <div className="ban-meta-label warning">
                          <Clock size={12} />
                          <span>Expires / Lift Time</span>
                        </div>
                        <div className="ban-meta-val warning">
                          {new Date(bannedModalData.banExpiresAt).toLocaleString()}
                        </div>
                      </div>
                    ) : (
                      <div className="ban-meta-cell">
                        <div className="ban-meta-label danger">
                          <Clock size={12} />
                          <span>Duration</span>
                        </div>
                        <div className="ban-meta-val danger">
                          Permanent / Indefinite
                        </div>
                      </div>
                    )}

                    {is3rdStrikeBan && (
                      <div className="ban-meta-cell">
                        <div className="ban-meta-label danger">
                          <ShieldAlert size={12} />
                          <span>Policy Status</span>
                        </div>
                        <div>
                          <span className="ban-strike-badge-pill">Strike 3 of 3</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {bannedModalData.pendingAppeal && (
                  <div className="ban-pending-appeal-box">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, marginBottom: '4px' }}>
                      <Clock size={13} />
                      <span>Appeal Currently Under Review</span>
                    </div>
                    <div style={{ maxHeight: '90px', overflowY: 'auto', wordBreak: 'break-word' }}>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: '#f1f5f9', fontStyle: 'italic', lineHeight: 1.4 }}>
                        "{bannedModalData.pendingAppeal.statement}"
                      </p>
                    </div>
                  </div>
                )}

                <div className="ban-modal-actions">
                  <button
                    type="button"
                    onClick={() => setShowAppealModal(false)}
                    className="ban-btn-secondary"
                  >
                    Close
                  </button>
                  {bannedModalData.appealToken && (
                    <button
                      type="button"
                      onClick={() => {
                        if (!appealStatement && bannedModalData.pendingAppeal?.statement) {
                          setAppealStatement(bannedModalData.pendingAppeal.statement);
                        }
                        setAppealStep('form');
                      }}
                      className="ban-btn-primary"
                    >
                      {bannedModalData.pendingAppeal ? 'Update Appeal' : 'Appeal Suspension'}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <form onSubmit={handleBannedAppealSubmit}>
                <div className="appeal-context-card">
                  <div className="appeal-context-text">
                    <span>
                      {is3rdStrikeBan ? 'Appealing 3rd strike ban for: ' : 'Appealing suspension for: '}
                      <strong style={{ color: '#fca5a5' }}>
                        {bannedModalData.banReason || 'Community Guidelines'}
                      </strong>
                    </span>
                  </div>
                  <span className="appeal-badge">
                    {is3rdStrikeBan ? 'Strike 3/3 Ban' : 'Account Suspension'}
                  </span>
                </div>

                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#c9d1d9', marginBottom: '6px' }}>
                  Appeal Statement
                </label>
                <textarea
                  value={appealStatement}
                  onChange={(e) => setAppealStatement(e.target.value)}
                  placeholder={
                    is3rdStrikeBan
                      ? 'Explain why you believe your 3rd strike suspension should be reconsidered or reviewed...'
                      : 'Explain why you believe this suspension should be reconsidered or reviewed...'
                  }
                  rows={4}
                  autoFocus
                  className="appeal-textarea"
                />

                {appealError && (
                  <div style={{ color: '#f87171', fontSize: '0.8rem', marginBottom: '10px' }}>
                    {appealError}
                  </div>
                )}

                <div className="appeal-form-footer">
                  <button
                    type="button"
                    onClick={() => setAppealStep('notice')}
                    className="appeal-back-btn"
                  >
                    <ChevronLeft size={16} />
                    <span>Back to Notice</span>
                  </button>

                  <div className="appeal-form-btn-group">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAppealModal(false);
                        setAppealStep('notice');
                      }}
                      className="ban-btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={appealSubmitting}
                      className="ban-btn-primary"
                    >
                      {appealSubmitting
                        ? 'Saving...'
                        : bannedModalData.pendingAppeal
                        ? 'Update Appeal'
                        : 'Submit Appeal'}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </AuthLayout>
  );
}
