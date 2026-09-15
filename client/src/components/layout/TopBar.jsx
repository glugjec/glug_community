import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { avatarInitials, avatarColor } from '../common/avatar.js'
import { Search, Bell, ChevronDown, LogOut, User, Settings as SettingsIcon, MessageSquare, ArrowLeft, X, CheckCheck, ShieldAlert, CheckCircle2, AlertTriangle } from 'lucide-react'
import { notificationsApi, chatApi } from '../../api.js'

function formatRelativeTime(date) {
  if (!date) return ''
  const diff = (Date.now() - new Date(date).getTime()) / 1000
  if (diff < 60) return 'Just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return new Date(date).toLocaleDateString()
}

const NOTIF_STORAGE_PREFIX = 'glug_notifs_'

function getStoredNotifications(userId) {
  if (!userId) return null
  try {
    const raw = sessionStorage.getItem(`${NOTIF_STORAGE_PREFIX}${userId}`)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed && Array.isArray(parsed.data)) {
      return parsed
    }
  } catch (e) {}
  return null
}

function setStoredNotifications(userId, data) {
  if (!userId) return
  try {
    sessionStorage.setItem(
      `${NOTIF_STORAGE_PREFIX}${userId}`,
      JSON.stringify({ data, timestamp: Date.now() })
    )
  } catch (e) {}
}

let notificationsCache = {
  userId: null,
  data: [],
  timestamp: 0,
}

function getNotificationBadge(notif) {
  if (notif.type === 'moderation_strike') {
    if (/warning/i.test(notif.message) || /strike 1/i.test(notif.message)) {
      return <span className="notif-category-pill pill-warning">Warning · Strike 1</span>
    }
    if (/restriction/i.test(notif.message) || /strike 2/i.test(notif.message)) {
      return <span className="notif-category-pill pill-strike">Restriction · Strike 2</span>
    }
    if (/banned/i.test(notif.message) || /strike 3/i.test(notif.message)) {
      return <span className="notif-category-pill pill-strike">Banned · Strike 3</span>
    }
    return <span className="notif-category-pill pill-strike">Strike Alert</span>
  }
  if (notif.type === 'moderation_review') {
    return <span className="notif-category-pill pill-warning">Under Review</span>
  }
  if (notif.type === 'report_accepted') {
    if (/appeal/i.test(notif.message)) {
      return <span className="notif-category-pill pill-success">Appeal Approved</span>
    }
    return <span className="notif-category-pill pill-success">Report Accepted</span>
  }
  if (/appeal.*denied/i.test(notif.message)) {
    return <span className="notif-category-pill pill-strike">Appeal Denied</span>
  }
  return null
}

function renderNotificationRichText(message) {
  if (!message || typeof message !== 'string') return null

  let clean = message
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()

  clean = clean.replace(/^(Warning|Account Restriction|Account Banned):\s*/i, '')

  const parts = []
  const regex = /(\*\*[^*]+\*\*|"[^"]+")/g
  let lastIndex = 0
  let match

  while ((match = regex.exec(clean)) !== null) {
    if (match.index > lastIndex) {
      parts.push(clean.slice(lastIndex, match.index))
    }
    const token = match[0]
    if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(
        <strong key={match.index} className="notif-strong">
          {token.slice(2, -2)}
        </strong>
      )
    } else if (token.startsWith('"') && token.endsWith('"')) {
      parts.push(
        <span key={match.index} className="notif-quote-tag">
          {token}
        </span>
      )
    }
    lastIndex = regex.lastIndex
  }

  if (lastIndex < clean.length) {
    parts.push(clean.slice(lastIndex))
  }

  return parts
}

function TopBarAvatar({ src, username, email, size = 30, className = '' }) {
  const [error, setError] = useState(false)
  const name = username || email || 'User'

  useEffect(() => {
    setError(false)
  }, [src])

  if (src && !error && (src.startsWith('http') || src.startsWith('/') || src.startsWith('data:'))) {
    return (
      <img
        src={src}
        alt={name}
        referrerPolicy="no-referrer"
        onError={() => setError(true)}
        className={className}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
      />
    )
  }

  if (src === 'tux') {
    return (
      <div
        className={className}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: '#0f172a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}
      >
        <svg viewBox="0 0 24 24" width={Math.round(size * 0.55)} height={Math.round(size * 0.55)} fill="#fbbf24">
          <path d="M12 2C9.24 2 7 4.24 7 7v4c0 .35.04.7.1 1.03C5.3 12.67 4 14.67 4 17c0 2.2 1.8 4 4 4h8c2.2 0 4-1.8 4-4 0-2.33-1.3-4.33-3.1-4.97.06-.33.1-.68.1-1.03V7c0-2.76-2.24-5-5-5zm-2 6c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm4 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm-2 2.5c1.1 0 2 .45 2 1h-4c0-.55.9-1 2-1z" />
        </svg>
      </div>
    )
  }

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: avatarColor(name),
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: `${Math.round(size * 0.42)}px`,
        fontWeight: 700,
        flexShrink: 0
      }}
    >
      {avatarInitials(name)}
    </div>
  )
}

export default function TopBar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchTerm, setSearchTerm] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [unreadNotifCount, setUnreadNotifCount] = useState(0)
  const [unreadChatCount, setUnreadChatCount] = useState(0)
  const currentUserId = user?.id || user?._id
  const [notifications, setNotifications] = useState(() => {
    if (!currentUserId) return []
    if (notificationsCache.userId === currentUserId && notificationsCache.data.length > 0) {
      return notificationsCache.data
    }
    const stored = getStoredNotifications(currentUserId)
    if (stored) {
      notificationsCache = {
        userId: currentUserId,
        data: stored.data,
        timestamp: stored.timestamp,
      }
      return stored.data
    }
    return []
  })
  const [notifLoading, setNotifLoading] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const inputRef = useRef(null)
  const mobileInputRef = useRef(null)
  const menuRef = useRef(null)
  const notifRef = useRef(null)

  useEffect(() => {
    if (!user) {
      notificationsCache = { userId: null, data: [], timestamp: 0 }
      setUnreadNotifCount(0)
      setUnreadChatCount(0)
      setNotifications([])
      return
    }

    const uid = user.id || user._id
    if (notificationsCache.userId === uid && notificationsCache.data.length > 0) {
      setNotifications(notificationsCache.data)
    } else {
      const stored = getStoredNotifications(uid)
      if (stored && stored.data.length > 0) {
        notificationsCache = {
          userId: uid,
          data: stored.data,
          timestamp: stored.timestamp,
        }
        setNotifications(stored.data)
      }
    }

    let isMounted = true

    const fetchAllCounts = async () => {
      if (document.hidden) return
      try {
        const [notifRes, chatRes] = await Promise.all([
          notificationsApi.unreadCount(),
          chatApi.getUnreadCount(),
        ])
        if (!isMounted) return
        if (typeof notifRes?.unreadCount === 'number') {
          setUnreadNotifCount(notifRes.unreadCount)
        }
        if (typeof chatRes?.unreadCount === 'number') {
          setUnreadChatCount(chatRes.unreadCount)
        }
      } catch (err) {}
    }

    const prefetchNotifications = async () => {
      try {
        const res = await notificationsApi.list()
        if (isMounted && res?.notifications) {
          notificationsCache = {
            userId: uid,
            data: res.notifications,
            timestamp: Date.now(),
          }
          setStoredNotifications(uid, res.notifications)
          setNotifications(res.notifications)
        }
      } catch (err) {}
    }

    fetchAllCounts()
    prefetchNotifications()

    const interval = setInterval(() => {
      if (!document.hidden) {
        fetchAllCounts()
      }
    }, 60000)

    const handleVisibilityOrFocus = () => {
      if (!document.hidden) {
        fetchAllCounts()
      }
    }

    const handleChatUpdate = () => {
      chatApi.getUnreadCount().then((res) => {
        if (isMounted && typeof res?.unreadCount === 'number') {
          setUnreadChatCount(res.unreadCount)
        }
      }).catch(() => {})
    }

    window.addEventListener('chat-unread-updated', handleChatUpdate)
    window.addEventListener('focus', handleVisibilityOrFocus)
    document.addEventListener('visibilitychange', handleVisibilityOrFocus)

    return () => {
      isMounted = false
      clearInterval(interval)
      window.removeEventListener('chat-unread-updated', handleChatUpdate)
      window.removeEventListener('focus', handleVisibilityOrFocus)
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus)
    }
  }, [user])

  useEffect(() => {
    if (!user) {
      setUnreadChatCount(0)
      return
    }
    let isMounted = true
    chatApi.getUnreadCount().then((res) => {
      if (isMounted && typeof res?.unreadCount === 'number') {
        setUnreadChatCount(res.unreadCount)
      }
    }).catch(() => {})
    return () => {
      isMounted = false
    }
  }, [user, location.pathname])

  useEffect(() => {
    if (!notifOpen || !user) return
    const uid = user.id || user._id

    if (notificationsCache.userId === uid && notificationsCache.data.length > 0) {
      setNotifications(notificationsCache.data)
    } else {
      const stored = getStoredNotifications(uid)
      if (stored && stored.data.length > 0) {
        notificationsCache = {
          userId: uid,
          data: stored.data,
          timestamp: stored.timestamp,
        }
        setNotifications(stored.data)
      }
    }

    const hasData =
      (notificationsCache.userId === uid && notificationsCache.data.length > 0) ||
      notifications.length > 0

    if (!hasData) {
      setNotifLoading(true)
    }

    if (
      notificationsCache.userId === uid &&
      Date.now() - notificationsCache.timestamp < 30000 &&
      unreadNotifCount === 0
    ) {
      return
    }

    let isMounted = true
    notificationsApi
      .list()
      .then((res) => {
        if (isMounted && res?.notifications) {
          notificationsCache = {
            userId: uid,
            data: res.notifications,
            timestamp: Date.now(),
          }
          setStoredNotifications(uid, res.notifications)
          setNotifications(res.notifications)
        }
      })
      .catch((err) => {
        console.error('[Notifications Error]', err)
      })
      .finally(() => {
        if (isMounted) setNotifLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [notifOpen, user, unreadNotifCount])

  const handleBellHover = () => {
    if (!user) return
    const uid = user.id || user._id
    if (Date.now() - notificationsCache.timestamp > 30000) {
      notificationsApi
        .list()
        .then((res) => {
          if (res?.notifications) {
            notificationsCache = {
              userId: uid,
              data: res.notifications,
              timestamp: Date.now(),
            }
            setStoredNotifications(uid, res.notifications)
            setNotifications(res.notifications)
          }
        })
        .catch(() => {})
    }
  }

  const handleMarkAllRead = async () => {
    try {
      const uid = user?.id || user?._id
      notificationsApi.markAllRead().catch(() => {})
      setUnreadNotifCount(0)
      const updated = notifications.map((n) => ({ ...n, isRead: true }))
      setNotifications(updated)
      notificationsCache.data = updated
      if (uid) setStoredNotifications(uid, updated)
    } catch (err) {
      console.error('[Mark All Read Error]', err)
    }
  }

  const handleNotificationClick = async (notif) => {
    const uid = user?.id || user?._id
    if (!notif.isRead) {
      const notifId = notif.id || notif._id
      notificationsApi.markRead(notifId).catch(() => {})
      setUnreadNotifCount((prev) => Math.max(0, prev - 1))
      const updated = notifications.map((n) =>
        n.id === notifId || n._id === notifId ? { ...n, isRead: true } : n
      )
      setNotifications(updated)
      notificationsCache.data = updated
      if (uid) setStoredNotifications(uid, updated)
    }
    setNotifOpen(false)
    if (
      notif.type === 'moderation_strike' ||
      notif.type === 'moderation_review' ||
      /appeal/i.test(notif.message)
    ) {
      navigate('/settings?tab=standing')
      return
    }
    const targetPostId = notif.post?.id || notif.post?._id || notif.post
    if (targetPostId) {
      navigate(`/forum/posts/${targetPostId}`)
    }
  }

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    if (!mobileSearchOpen) return
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setMobileSearchOpen(false)
      }
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [mobileSearchOpen])

  useEffect(() => {
    if (mobileSearchOpen) {
      setTimeout(() => mobileInputRef.current?.focus(), 50)
    }
  }, [mobileSearchOpen])

  useEffect(() => {
    document.body.classList.toggle('glug-mobile-search-open', mobileSearchOpen)
    return () => document.body.classList.remove('glug-mobile-search-open')
  }, [mobileSearchOpen])

  useEffect(() => {
    setMobileSearchOpen(false)
    setMenuOpen(false)
    setNotifOpen(false)
  }, [location.pathname])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    const trimmed = searchTerm.trim()
    if (trimmed) {
      navigate(`/forum?search=${encodeURIComponent(trimmed)}`)
      setSearchTerm('')
      setMobileSearchOpen(false)
    } else if (location.pathname === '/forum') {
      const params = new URLSearchParams(location.search)
      params.delete('search')
      navigate({ pathname: '/forum', search: params.toString() ? `?${params.toString()}` : '' })
      setSearchTerm('')
      setMobileSearchOpen(false)
    }
  }

  const handleClearSearch = () => {
    setSearchTerm('')
    if (location.pathname === '/forum') {
      const params = new URLSearchParams(location.search)
      if (params.has('search')) {
        params.delete('search')
        navigate({ pathname: '/forum', search: params.toString() ? `?${params.toString()}` : '' })
      }
    }
  }

  const handleLogout = () => {
    setMenuOpen(false)
    logout()
    navigate('/login')
  }

  return (
    <header className={`topbar-v2${mobileSearchOpen ? ' has-mobile-search-open' : ''}`}>
      {mobileSearchOpen && (
        <div className="topbar-mobile-search-overlay">
          <button
            type="button"
            className="topbar-mobile-search-back"
            onClick={() => setMobileSearchOpen(false)}
            aria-label="Close search"
          >
            <ArrowLeft size={19} />
          </button>
          <form
            className="topbar-mobile-search-form"
            onSubmit={handleSearchSubmit}
          >
            <Search size={16} className="topbar-mobile-search-icon" />
            <input
              ref={mobileInputRef}
              type="text"
              className="topbar-mobile-search-input"
              placeholder="Search discussions, topics, members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                className="topbar-mobile-search-clear"
                onClick={handleClearSearch}
                aria-label="Clear search"
              >
                <X size={15} />
              </button>
            )}
          </form>
        </div>
      )}

      <form className="topbar-search-wrapper" onSubmit={handleSearchSubmit}>
        <Search size={17} className="topbar-search-icon" />
        <input
          ref={inputRef}
          type="text"
          className="topbar-search-input"
          placeholder="Search discussions, topics, or members..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button
            type="button"
            className="topbar-search-clear"
            onClick={handleClearSearch}
            aria-label="Clear search"
          >
            <X size={15} />
          </button>
        )}
      </form>

      <div className="topbar-actions">
        <button
          type="button"
          className="topbar-icon-btn topbar-mobile-search-trigger"
          onClick={() => setMobileSearchOpen(true)}
          aria-label="Search"
        >
          <Search size={18} />
        </button>

        <div className="topbar-notif-wrap" ref={notifRef}>
          <button
            type="button"
            className="topbar-icon-btn"
            onClick={() => setNotifOpen(!notifOpen)}
            onMouseEnter={handleBellHover}
            aria-label="Notifications"
          >
            <Bell size={19} />
            {unreadNotifCount > 0 && (
              <span className="notif-badge">
                {unreadNotifCount > 99 ? '99+' : unreadNotifCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="notif-popover">
              <div className="notif-header">
                <div className="notif-header-left">
                  <span className="notif-title">Notifications</span>
                  {unreadNotifCount > 0 && (
                    <span className="notif-count">{unreadNotifCount} new</span>
                  )}
                </div>
                {user && unreadNotifCount > 0 && (
                  <button
                    type="button"
                    className="notif-mark-all-btn"
                    onClick={handleMarkAllRead}
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="notif-list">
                {!user ? (
                  <div className="notif-auth-box">
                    <div className="notif-auth-icon-wrap">
                      <Bell size={20} />
                    </div>
                    <h4 className="notif-auth-title">Stay in the loop</h4>
                    <p className="notif-auth-desc">
                      Sign in to see replies, comments on your posts, and community alerts.
                    </p>
                    <div className="notif-auth-actions">
                      <Link
                        to="/login"
                        className="notif-auth-btn"
                        onClick={() => setNotifOpen(false)}
                      >
                        Log In
                      </Link>
                      <Link
                        to="/register"
                        className="notif-auth-btn-outline"
                        onClick={() => setNotifOpen(false)}
                      >
                        Sign Up
                      </Link>
                    </div>
                  </div>
                ) : notifLoading ? (
                  <div className="notif-loading">Loading notifications...</div>
                ) : notifications.length === 0 ? (
                  <div className="notif-empty">
                    <Bell size={26} style={{ opacity: 0.3, marginBottom: '2px' }} />
                    <p style={{ margin: 0, fontWeight: 600, color: 'var(--text)' }}>No notifications yet</p>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                      We will notify you when someone comments or replies to you.
                    </span>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id || notif._id}
                      className={`notif-item ${notif.isRead ? '' : 'is-unread'}`}
                      onClick={() => handleNotificationClick(notif)}
                    >
                      <div className="notif-avatar-wrap">
                        {notif.type === 'moderation_strike' ? (
                          <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <ShieldAlert size={16} />
                          </div>
                        ) : notif.type === 'moderation_review' ? (
                          <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: 'rgba(234, 179, 8, 0.15)', color: '#eab308', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <AlertTriangle size={15} />
                          </div>
                        ) : notif.type === 'report_accepted' ? (
                          <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <CheckCircle2 size={16} />
                          </div>
                        ) : notif.sender ? (
                          <TopBarAvatar
                            src={notif.sender?.avatar}
                            username={notif.sender?.username}
                            size={28}
                          />
                        ) : (
                          <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Bell size={15} />
                          </div>
                        )}
                      </div>
                      <div className="notif-content">
                        {getNotificationBadge(notif)}
                        <p className="notif-text">{renderNotificationRichText(notif.message)}</p>
                        <span className="notif-time">
                          {formatRelativeTime(notif.createdAt)}
                        </span>
                      </div>
                      {!notif.isRead && <div className="notif-dot-unread" />}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {user && (
          <Link to="/chat" className="topbar-icon-btn" title="Direct Messages">
            <MessageSquare size={17} />
            {unreadChatCount > 0 && (
              <span className="notif-badge">
                {unreadChatCount > 99 ? '99+' : unreadChatCount}
              </span>
            )}
          </Link>
        )}

        {user ? (
          <div className="topbar-user-wrap" ref={menuRef}>
            <button
              type="button"
              className={`topbar-user-pill${menuOpen ? ' is-active' : ''}`}
              onClick={() => setMenuOpen(!menuOpen)}
              aria-haspopup="true"
              aria-expanded={menuOpen}
            >
              <TopBarAvatar
                src={user.avatar}
                username={user.username}
                email={user.email}
                size={30}
                className="topbar-pill-avatar"
              />
              <span className="topbar-pill-name">
                {user.username
                  ? (user.username.includes('@') ? user.username.split('@')[0] : user.username)
                  : (user.email ? user.email.split('@')[0] : 'Member')}
              </span>
              <ChevronDown
                size={14}
                className={`topbar-pill-chevron${menuOpen ? ' is-open' : ''}`}
              />
            </button>

            {menuOpen && (
              <div className="topbar-dropdown-menu">
                <div className="topbar-dd-header">
                  <TopBarAvatar
                    src={user.avatar}
                    username={user.username}
                    email={user.email}
                    size={38}
                    className="topbar-dd-avatar"
                  />
                  <div className="topbar-dd-user-meta">
                    <span className="topbar-dd-name">
                      {user.username
                        ? (user.username.includes('@') ? user.username.split('@')[0] : user.username)
                        : (user.email ? user.email.split('@')[0] : 'Member')}
                    </span>
                    <span className="topbar-dd-email" title={user.email}>
                      {user.email}
                    </span>
                  </div>
                </div>

                <div className="topbar-dd-divider" />

                <Link
                  to="/profile"
                  className="topbar-dd-item"
                  onClick={() => setMenuOpen(false)}
                >
                  <User size={16} /> Profile
                </Link>
                <Link
                  to="/settings"
                  className="topbar-dd-item"
                  onClick={() => setMenuOpen(false)}
                >
                  <SettingsIcon size={16} /> Settings
                </Link>

                <div className="topbar-dd-divider" />

                <button
                  type="button"
                  className="topbar-dd-item topbar-dd-danger"
                  onClick={handleLogout}
                >
                  <LogOut size={16} /> Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="topbar-auth-btns">
            <Link to="/login" className="topbar-btn-login">
              Log In
            </Link>
            <Link to="/register" className="topbar-btn-signup">
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </header>
  )
}