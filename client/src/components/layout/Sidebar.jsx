import { useState, useEffect } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import {
  Home,
  MessageSquare,
  Folder,
  Users,
  Calendar,
  FileText,
  Terminal,
  Code2,
  Info,
  Sparkles,
  Sun,
  Moon,
  Shield,
  PanelLeftClose,
  PanelLeft,
  Menu,
  X
} from 'lucide-react'

const NAV_ITEMS = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/for-you', label: 'For You', icon: Sparkles },
  { to: '/forum', label: 'Discussions', icon: MessageSquare },
  { to: '/categories', label: 'Categories', icon: Folder },
  { to: '/members', label: 'Members', icon: Users },
  { to: '/events', label: 'Events', icon: Calendar },
  { to: '/resources', label: 'Resources', icon: FileText },
  { to: '/terminal', label: 'Terminal', icon: Terminal },
  { to: '/compiler', label: 'Compiler', icon: Code2 },
  { to: '/about', label: 'About', icon: Info },
]

export default function Sidebar({ collapsed, onToggle, mobileOpen, onToggleMobile }) {
  const { user } = useAuth()
  const [theme, setTheme] = useState(() => localStorage.getItem('glug_theme') || 'dark')

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
    localStorage.setItem('glug_theme', nextTheme)
    document.documentElement.setAttribute('data-theme', nextTheme)
    window.dispatchEvent(new CustomEvent('glug-theme-change', { detail: nextTheme }))
  }

  useEffect(() => {
    const saved = localStorage.getItem('glug_theme') || 'dark'
    setTheme(saved)
    document.documentElement.setAttribute('data-theme', saved)

    const handleExternalTheme = (e) => {
      const t = e.detail || localStorage.getItem('glug_theme') || 'dark'
      setTheme(t)
      document.documentElement.setAttribute('data-theme', t)
    }

    window.addEventListener('glug-theme-change', handleExternalTheme)
    return () => window.removeEventListener('glug-theme-change', handleExternalTheme)
  }, [])

  const linkClass = ({ isActive }) =>
    `sb-nav-item${isActive ? ' sb-nav-item-active' : ''}`

  const handleNavClick = () => {
    if (mobileOpen && onToggleMobile) {
      onToggleMobile()
    }
  }

  return (
    <>
      <button
        type="button"
        className={`sidebar-hamburger${mobileOpen ? ' is-open' : ''}`}
        onClick={onToggleMobile}
        aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
        title={mobileOpen ? 'Close menu' : 'Open menu'}
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <aside className={`sidebar-v2${collapsed ? ' is-collapsed' : ''}${mobileOpen ? ' is-mobile-open' : ''}`}>
        <div className="sb-header">
          <Link to="/" className="sb-brand" onClick={handleNavClick}>
            <img src="/GLUG-LOGO.png" alt="GLUG" className="sb-brand-logo" />
            <div className="sb-brand-meta">
              <span className="sb-brand-title">GLUG</span>
              <span className="sb-brand-sub">Learn · Share · Grow</span>
            </div>
          </Link>
          <button
            type="button"
            className="sb-collapse-btn"
            onClick={onToggle}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <PanelLeft size={17} /> : <PanelLeftClose size={17} />}
          </button>
        </div>

        <nav className="sb-nav-list">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={linkClass}
                onClick={handleNavClick}
                title={collapsed ? item.label : undefined}
              >
                <span className="sb-nav-icon">
                  <Icon size={19} />
                </span>
                <span className="sb-nav-text">{item.label}</span>
              </NavLink>
            )
          })}

          {user?.role === 'admin' && (
            <NavLink
              to="/admin"
              className={linkClass}
              onClick={handleNavClick}
              title={collapsed ? 'Admin Panel' : undefined}
            >
              <span className="sb-nav-icon" style={{ color: '#f59e0b' }}>
                <Shield size={19} />
              </span>
              <span className="sb-nav-text" style={{ color: '#f59e0b', fontWeight: 600 }}>
                Admin Panel
              </span>
            </NavLink>
          )}
        </nav>

        <div className="sb-footer">
          <div className="sb-quote-card">
            <p className="sb-quote-text">“Open minds build a better world.”</p>
            <span className="sb-quote-author">— GLUG</span>
            <div className="sb-quote-art">
              <svg viewBox="0 0 100 45" className="sb-tux-mini-svg">
                <ellipse cx="50" cy="38" rx="45" ry="12" fill="#090d16" />
                <ellipse cx="50" cy="22" rx="14" ry="16" fill="#0f172a" />
                <ellipse cx="50" cy="24" rx="9" ry="12" fill="#f8fafc" />
                <circle cx="50" cy="11" r="8" fill="#0f172a" />
                <polygon points="48,13 52,13 50,17" fill="#f59e0b" />
                <ellipse cx="44" cy="35" rx="5" ry="2.5" fill="#f59e0b" />
                <ellipse cx="56" cy="35" rx="5" ry="2.5" fill="#f59e0b" />
              </svg>
            </div>
          </div>

          <div className="sb-controls">
            <button
              type="button"
              className={`sb-theme-pill-toggle ${theme === 'dark' ? 'is-dark' : 'is-light'}`}
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              <div className="sb-theme-pill-thumb" />
              <span className="sb-theme-pill-item sb-theme-pill-sun">
                <Sun size={14} />
              </span>
              <span className="sb-theme-pill-item sb-theme-pill-moon">
                <Moon size={14} />
              </span>
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}