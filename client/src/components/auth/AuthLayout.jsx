import { Link } from 'react-router-dom';
import { Terminal, MessageSquare, Code2, ArrowRight, Sparkles } from 'lucide-react';

export default function AuthLayout({ children }) {
  return (
    <div className="auth-portal-scene">
      <div className="auth-portal-glow-1" />
      <div className="auth-portal-glow-2" />
      <div className="auth-portal-grid" />

      <header className="auth-portal-topbar">
        <Link to="/" className="auth-portal-brand">
          <img src="/GLUG-LOGO.png" alt="GLUG" className="auth-portal-brand-img" />
          <div className="auth-portal-brand-info">
            <span className="auth-portal-brand-title">GLUG</span>
            <span className="auth-portal-brand-sub">Learn · Share · Grow</span>
          </div>
        </Link>

        <Link to="/forum" className="auth-portal-back-link">
          Explore Forum <ArrowRight size={14} />
        </Link>
      </header>

      <main className="auth-portal-body">
        <div className="auth-portal-container">
          <div className="auth-portal-hero">
            <div className="auth-hero-badge">
              <span className="auth-hero-badge-dot" />
              <span>GNU/Linux User Group</span>
            </div>

            <h1 className="auth-hero-title">
              Open Minds Build <span className="auth-hero-gradient">Brighter Tomorrows.</span>
            </h1>

            <p className="auth-hero-desc">
              Join the open developer community.
              Master Linux systems, collaborate on open-source code, and solve problems together.
            </p>

            <div className="auth-hero-features">
              <div className="auth-feature-card">
                <div className="auth-feature-icon-wrap" style={{ color: '#38bdf8' }}>
                  <Terminal size={18} />
                </div>
                <div className="auth-feature-content">
                  <h4 className="auth-feature-title">Cloud Linux Terminal</h4>
                  <p className="auth-feature-sub">Interactive cloud sandbox with GCC, Python 3, and file persistence.</p>
                </div>
              </div>

              <div className="auth-feature-card">
                <div className="auth-feature-icon-wrap" style={{ color: '#818cf8' }}>
                  <MessageSquare size={18} />
                </div>
                <div className="auth-feature-content">
                  <h4 className="auth-feature-title">Community Discussions</h4>
                  <p className="auth-feature-sub">Ask questions, share projects, and collaborate with peers and alumni.</p>
                </div>
              </div>

              <div className="auth-feature-card">
                <div className="auth-feature-icon-wrap" style={{ color: '#34d399' }}>
                  <Code2 size={18} />
                </div>
                <div className="auth-feature-content">
                  <h4 className="auth-feature-title">Online Compiler</h4>
                  <p className="auth-feature-sub">Multi-language code runner with real-time execution outputs.</p>
                </div>
              </div>
            </div>

            <div className="auth-hero-footer-stats">
              <div className="auth-stat-pill">
                <Sparkles size={14} color="#60a5fa" />
                <span>Free &amp; Open Source for everyone</span>
              </div>
            </div>
          </div>

          <div className="auth-portal-card-wrap">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}