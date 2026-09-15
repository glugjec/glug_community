import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { authApi, usersApi } from '../api.js'
import ErrorMessage from '../components/common/ErrorMessage.jsx'
import { formatRelativeTime } from '../utils/timeAgo.js'
import {
  User,
  Shield,
  ShieldAlert,
  Palette,
  Bell,
  AlertTriangle,
  AlertCircle,
  Check,
  CheckCircle2,
  Lock,
  Mail,
  Moon,
  Sun,
  Monitor,
  Terminal,
  LogOut,
  Trash2,
  ArrowRight,
  Sparkles,
  FileText,
  ExternalLink,
  Loader2,
  Clock,
  XCircle,
  X
} from 'lucide-react'
import './Settings.css'

export default function Settings() {
  const { user, updateUser, logout } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const validTabs = user?.role === 'admin'
    ? ['account', 'security', 'appearance', 'notifications', 'danger']
    : ['account', 'security', 'standing', 'appearance', 'notifications', 'danger']
  const tabFromUrl = searchParams.get('tab')
  const [activeTab, setActiveTab] = useState(() => (validTabs.includes(tabFromUrl) ? tabFromUrl : 'account'))

  const [toastMessage, setToastMessage] = useState('')
  const [globalError, setGlobalError] = useState('')
  const [usernameError, setUsernameError] = useState('')
  const [passwordError, setPasswordError] = useState('')

  const clearErrors = () => {
    setGlobalError('')
    setUsernameError('')
    setPasswordError('')
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    clearErrors()
    if (tab === 'account') {
      setSearchParams({})
    } else {
      setSearchParams({ tab })
    }
  }

  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam && validTabs.includes(tabParam)) {
      setActiveTab(tabParam)
    } else if (tabParam === 'standing' && user?.role === 'admin') {
      setActiveTab('account')
      setSearchParams({})
    }
  }, [searchParams, user])

  // Community Standing & Appeals State
  const [modHistory, setModHistory] = useState(null)
  const [loadingModHistory, setLoadingModHistory] = useState(false)
  const [appealModalItem, setAppealModalItem] = useState(null)
  const [appealStatement, setAppealStatement] = useState('')
  const [submittingAppeal, setSubmittingAppeal] = useState(false)
  const [appealError, setAppealError] = useState('')

  const loadModHistory = async () => {
    if (!user) return
    setLoadingModHistory(true)
    try {
      const res = await usersApi.getModerationHistory()
      if (res) {
        setModHistory(res)
      }
    } catch (err) {
      console.error('[Load Moderation History Error]', err)
    } finally {
      setLoadingModHistory(false)
    }
  }

  useEffect(() => {
    if (user) {
      loadModHistory()
    }
  }, [user])

  const openAppealModal = (item) => {
    setAppealModalItem(item)
    setAppealStatement('')
    setAppealError('')
  }

  const closeAppealModal = () => {
    if (submittingAppeal) return
    setAppealModalItem(null)
    setAppealStatement('')
    setAppealError('')
  }

  const handleAppealSubmit = async (e) => {
    e.preventDefault()
    if (!appealStatement.trim() || !appealModalItem) return
    setSubmittingAppeal(true)
    setAppealError('')
    try {
      await usersApi.submitAppeal({
        itemType: appealModalItem.itemType,
        targetPostId: appealModalItem.targetPostId || null,
        targetCommentId: appealModalItem.targetCommentId || null,
        moderationLogId: appealModalItem.moderationLogId || null,
        strikeIndex: appealModalItem.strikeIndex || 1,
        originalReason: appealModalItem.reason || '',
        originalCategory: appealModalItem.category || '',
        statement: appealStatement.trim(),
      })
      showToast('Appeal submitted! An administrator will review your case.')
      closeAppealModal()
      loadModHistory()
    } catch (err) {
      setAppealError(err.message || 'Failed to submit appeal')
    } finally {
      setSubmittingAppeal(false)
    }
  }

  const getArray = (val) => {
    if (Array.isArray(val)) return val
    if (val && typeof val === 'object') return Object.values(val)
    return []
  }

  const strikeCount = typeof modHistory?.strikes === 'number'
    ? modHistory.strikes
    : typeof modHistory?.data?.strikes === 'number'
    ? modHistory.data.strikes
    : typeof user?.moderationStrikes === 'number'
    ? user.moderationStrikes
    : 0

function stripHtml(html) {
  if (!html || typeof html !== 'string') return ''
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

  const allFlaggedAndStrikes = []
  if (modHistory && typeof modHistory === 'object') {
    const flaggedPosts = getArray(modHistory.flaggedPosts ?? modHistory.data?.flaggedPosts)
    const flaggedComments = getArray(modHistory.flaggedComments ?? modHistory.data?.flaggedComments)
    const strikeLogs = getArray(modHistory.strikeLogs ?? modHistory.data?.strikeLogs)

    const handledCommentIds = new Set()
    const handledPostIds = new Set()

    strikeLogs.forEach((s, idx) => {
      if (!s || typeof s !== 'object') return
      const sId = s.id || s._id
      const pId = s.targetPostId || s.postId || null
      const cId = s.targetCommentId || null

      let matchedComment = null
      if (cId) {
        handledCommentIds.add(String(cId))
        matchedComment = flaggedComments.find((c) => String(c.id || c._id) === String(cId))
      }

      let matchedPost = null
      if (!cId && pId) {
        handledPostIds.add(String(pId))
        matchedPost = flaggedPosts.find((p) => String(p.targetPostId || p.postId || p.id || p._id) === String(pId))
      }

      const strikeMatch = s.details?.match(/Strike #(\d+)/i)
      const strikeNumber = strikeMatch ? parseInt(strikeMatch[1], 10) : (strikeLogs.length - idx)

      let itemType = 'strike'
      let title = ''
      let snippet = ''

      if (cId || matchedComment) {
        itemType = 'comment'
        const postTitle = s.targetPostTitle || matchedComment?.postTitle
        title = postTitle ? `Comment on "${postTitle}"` : 'Flagged Comment'
        snippet = stripHtml(matchedComment?.bodySnippet || s.targetCommentSnippet || '')
      } else if (pId || matchedPost) {
        itemType = 'post'
        const postTitle = s.targetPostTitle || matchedPost?.title
        title = postTitle ? `Post: "${postTitle}"` : 'Flagged Post'
        snippet = stripHtml(matchedPost?.bodySnippet || '')
      } else {
        itemType = 'strike'
        title = `Account Strike #${strikeNumber}`
      }

      if (!snippet && s.details && !/^strike #/i.test(s.details.trim())) {
        snippet = stripHtml(s.details)
      }

      allFlaggedAndStrikes.push({
        key: 'strike-' + (sId || idx),
        id: sId,
        itemType,
        isStrike: true,
        moderationLogId: sId,
        targetPostId: pId,
        postId: pId,
        targetCommentId: cId,
        strikeIndex: strikeNumber,
        title,
        snippet,
        reason: s.reason || matchedComment?.moderationReason || matchedPost?.moderationReason || 'Violates community guidelines',
        category: s.category || matchedComment?.moderationCategory || matchedPost?.moderationCategory,
        date: s.createdAt,
      })
    })

    flaggedComments.forEach((c) => {
      if (!c || typeof c !== 'object') return
      const cId = c.id || c._id
      if (cId && handledCommentIds.has(String(cId))) return
      const pId = c.targetPostId || c.postId || null

      allFlaggedAndStrikes.push({
        key: 'comment-' + (cId || Math.random()),
        id: cId,
        itemType: 'comment',
        targetCommentId: cId,
        targetPostId: pId,
        postId: pId,
        title: c.postTitle ? `Comment on "${c.postTitle}"` : 'Flagged Comment',
        snippet: stripHtml(c.bodySnippet || ''),
        reason: c.moderationReason || 'Violates community guidelines',
        category: c.moderationCategory,
        date: c.hiddenAt || c.createdAt,
      })
    })

    flaggedPosts.forEach((p) => {
      if (!p || typeof p !== 'object') return
      const pId = p.targetPostId || p.postId || p.id || p._id
      if (pId && handledPostIds.has(String(pId))) return

      allFlaggedAndStrikes.push({
        key: 'post-' + (pId || Math.random()),
        id: pId,
        itemType: 'post',
        targetPostId: pId,
        postId: pId,
        title: p.title ? `Post: "${p.title}"` : 'Flagged Post',
        snippet: stripHtml(p.bodySnippet || ''),
        reason: p.moderationReason || 'Violates community guidelines',
        category: p.moderationCategory,
        date: p.hiddenAt || p.createdAt,
      })
    })
  }

  const getAppealForItem = (item) => {
    const appeals = getArray(modHistory?.appeals ?? modHistory?.data?.appeals)
    return appeals.find((a) => {
      if (!a || typeof a !== 'object') return false

      if (item.moderationLogId && a.moderationLogId) {
        if (String(item.moderationLogId) === String(a.moderationLogId)) return true
      }

      if (item.targetCommentId) {
        return Boolean(a.targetCommentId && String(item.targetCommentId) === String(a.targetCommentId))
      }

      if (item.itemType === 'post' && !item.targetCommentId) {
        if (a.itemType === 'post' && !a.targetCommentId) {
          const itemPostId = item.targetPostId || item.postId || item.id
          const appealPostId = a.targetPostId || a.postId
          return Boolean(itemPostId && appealPostId && String(itemPostId) === String(appealPostId))
        }
        return false
      }

      if (item.strikeIndex && a.strikeIndex) {
        return Number(item.strikeIndex) === Number(a.strikeIndex)
      }

      return false
    })
  }

  // Account State
  const [username, setUsername] = useState(user?.username || '')
  const [savingAccount, setSavingAccount] = useState(false)

  // Security State
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)

  // Theme & Appearance State
  const [theme, setTheme] = useState(() => localStorage.getItem('glug_theme') || 'dark')
  const [fontSize, setFontSize] = useState(
    () => localStorage.getItem('glug_editor_font_size') || '14'
  )

  // Notification State
  const [notifs, setNotifs] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('glug_notif_prefs')) || {
        replies: true,
        events: true,
        newsletter: false,
        toasts: true
      }
    } catch {
      return { replies: true, events: true, newsletter: false, toasts: true }
    }
  })

  useEffect(() => {
    if (user) {
      setUsername(user.username || '')
      if (user.preferences?.theme) {
        setTheme(user.preferences.theme)
      }
      if (user.preferences) {
        setNotifs((prev) => ({
          ...prev,
          replies: user.preferences.replyNotifs !== false,
          events: user.preferences.eventNotifs !== false,
          newsletter: Boolean(user.preferences.newsletterNotifs),
        }))
      }
    }
  }, [user])

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(''), 3000)
  }

  const handleUpdateUsername = async (e) => {
    e.preventDefault()
    clearErrors()
    if (!username.trim() || username.trim() === user?.username) return

    setSavingAccount(true)
    try {
      const res = await authApi.updateProfile({ username: username.trim() })
      if (res?.user) {
        updateUser(res.user)
        showToast('Username updated successfully!')
      }
    } catch (err) {
      const msg = err.message || 'Failed to update username'
      if (/username/i.test(msg)) {
        setUsernameError(msg)
      } else {
        setGlobalError(msg)
      }
    } finally {
      setSavingAccount(false)
    }
  }

  const handleUpdatePassword = async (e) => {
    e.preventDefault()
    clearErrors()

    if (!newPassword) {
      setPasswordError('Please enter a new password.')
      return
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.')
      return
    }

    setSavingPassword(true)
    try {
      await authApi.updateProfile({ currentPassword, newPassword })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      showToast('Password changed successfully!')
    } catch (err) {
      const msg = err.message || 'Failed to update password'
      if (/password/i.test(msg)) {
        setPasswordError(msg)
      } else {
        setGlobalError(msg)
      }
    } finally {
      setSavingPassword(false)
    }
  }

  const handleThemeSelect = (selectedTheme) => {
    setTheme(selectedTheme)
    localStorage.setItem('glug_theme', selectedTheme)
    document.documentElement.setAttribute('data-theme', selectedTheme)
    window.dispatchEvent(new CustomEvent('glug-theme-change', { detail: selectedTheme }))
    showToast(`Switched to ${selectedTheme === 'dark' ? 'Dark' : selectedTheme === 'light' ? 'Light' : 'Cyber'} mode`)

    if (user) {
      authApi.updateProfile({ preferences: { ...user.preferences, theme: selectedTheme } }).catch(() => {})
    }
  }

  const handleFontSizeChange = (val) => {
    setFontSize(val)
    localStorage.setItem('glug_editor_font_size', val)
    showToast(`Editor font size set to ${val}px`)
  }

  const handleToggleNotif = (key) => {
    const updated = { ...notifs, [key]: !notifs[key] }
    setNotifs(updated)
    localStorage.setItem('glug_notif_prefs', JSON.stringify(updated))
    showToast('Preferences updated')

    if (user) {
      authApi.updateProfile({
        preferences: {
          ...user.preferences,
          emailNotifs: true,
          replyNotifs: updated.replies,
          eventNotifs: updated.events,
          newsletterNotifs: updated.newsletter
        }
      }).then((res) => {
        if (res?.user) updateUser(res.user)
      }).catch(() => {})
    }
  }

  const handleClearCache = () => {
    localStorage.removeItem('glug_terminal_state')
    showToast('Terminal session cache reset.')
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  if (!user) {
    return (
      <div className="settings-page-container">
        <div className="settings-section-card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
          <Lock size={44} style={{ color: 'var(--text-dim)', marginBottom: '1rem' }} />
          <h2 style={{ color: 'var(--text)', margin: '0 0 0.5rem' }}>Please sign in to view settings</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            You need to be logged into your student account to customize interface and security options.
          </p>
          <Link to="/login" className="profile-btn-primary" style={{ display: 'inline-flex' }}>
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="settings-page-container">
      <div className="settings-header-banner">
        <div>
          <h1 className="settings-header-title">Settings &amp; Preferences</h1>
          <p className="settings-header-subtitle">
            Manage your account security, appearance, and notification settings.
          </p>
        </div>
        <Link to="/profile" className="profile-btn-secondary">
          View Profile <ArrowRight size={14} />
        </Link>
      </div>

      <ErrorMessage message={globalError} />

      <div className="settings-layout-grid">
        <aside className="settings-sidebar-nav">
          <button
            type="button"
            className={`settings-nav-item ${activeTab === 'account' ? 'is-active' : ''}`}
            onClick={() => handleTabChange('account')}
          >
            <User size={16} />
            <span>Account</span>
          </button>

          <button
            type="button"
            className={`settings-nav-item ${activeTab === 'security' ? 'is-active' : ''}`}
            onClick={() => handleTabChange('security')}
          >
            <Shield size={16} />
            <span>Security &amp; Password</span>
          </button>

          {user?.role !== 'admin' && (
            <button
              type="button"
              className={`settings-nav-item ${activeTab === 'standing' ? 'is-active' : ''}`}
              onClick={() => handleTabChange('standing')}
            >
              <ShieldAlert size={16} color={strikeCount > 0 ? '#ef4444' : '#10b981'} />
              <span>Community Standing</span>
              {strikeCount > 0 ? (
                <span className="settings-nav-badge is-danger">
                  {strikeCount} {strikeCount === 1 ? 'Strike' : 'Strikes'}
                </span>
              ) : (
                <span className="settings-nav-badge is-good">
                  Good
                </span>
              )}
            </button>
          )}

          <button
            type="button"
            className={`settings-nav-item ${activeTab === 'appearance' ? 'is-active' : ''}`}
            onClick={() => handleTabChange('appearance')}
          >
            <Palette size={16} />
            <span>Theme &amp; Editor</span>
          </button>

          <button
            type="button"
            className={`settings-nav-item ${activeTab === 'notifications' ? 'is-active' : ''}`}
            onClick={() => handleTabChange('notifications')}
          >
            <Bell size={16} />
            <span>Notifications</span>
          </button>

          <button
            type="button"
            className={`settings-nav-item ${activeTab === 'danger' ? 'is-active' : ''}`}
            onClick={() => handleTabChange('danger')}
          >
            <AlertTriangle size={16} color="#ef4444" />
            <span style={{ color: '#ef4444' }}>Danger Zone</span>
          </button>
        </aside>

        <div className="settings-content-stack">
          {activeTab === 'account' && (
            <div className="settings-section-card">
              <div className="settings-section-header">
                <h2 className="settings-section-title">
                  <User size={20} color="#3b82f6" /> Account &amp; Identity
                </h2>
                <p className="settings-section-desc">
                  Update your display handle and view your registered student details.
                </p>
              </div>

              <form onSubmit={handleUpdateUsername}>
                <div className="settings-form-grid">
                  <div className="settings-field-group">
                    <label className="settings-input-label">Username</label>
                    <input
                      type="text"
                      className={`settings-input-control ${usernameError ? 'has-error' : ''}`}
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value)
                        if (usernameError) setUsernameError('')
                      }}
                      required
                    />
                    {usernameError ? (
                      <span className="settings-field-error">
                        <AlertCircle size={13} /> {usernameError}
                      </span>
                    ) : (
                      <span className="settings-field-hint">
                        Visible on all your forum discussions and comments.
                      </span>
                    )}
                  </div>

                  <div className="settings-field-group">
                    <label className="settings-input-label">Email Address</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="email"
                        className="settings-input-control"
                        value={user.email}
                        disabled
                      />
                    </div>
                    <span className="settings-field-hint">
                      Registered student email linked to your account.
                    </span>
                  </div>

                  <div className="settings-field-group">
                    <label className="settings-input-label">Community Role</label>
                    <input
                      type="text"
                      className="settings-input-control"
                      value={user.role === 'admin' ? 'Administrator' : 'Student Member'}
                      disabled
                    />
                  </div>

                  <div className="settings-field-group">
                    <label className="settings-input-label">Member Since</label>
                    <input
                      type="text"
                      className="settings-input-control"
                      value={user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Sep 2026'}
                      disabled
                    />
                  </div>
                </div>

                <div className="settings-save-bar">
                  <button
                    type="submit"
                    className="profile-btn-primary"
                    disabled={savingAccount || username === user.username}
                  >
                    {savingAccount ? 'Saving…' : <><Check size={14} /> Update Username</>}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="settings-section-card">
              <div className="settings-section-header">
                <h2 className="settings-section-title">
                  <Shield size={20} color="#10b981" /> Security &amp; Password
                </h2>
                <p className="settings-section-desc">
                  Protect your GLUG student account with a strong password.
                </p>
              </div>

              {user.googleId && (
                <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '1rem 1.25rem', borderRadius: 12, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <CheckCircle2 size={18} color="#3b82f6" />
                  <span style={{ fontSize: '0.9rem', color: 'var(--text)' }}>
                    Your account is securely connected to <strong>Google OAuth</strong>. You can also set a password below to log in directly via email.
                  </span>
                </div>
              )}

              <form onSubmit={handleUpdatePassword}>
                {passwordError && (
                  <div className="settings-field-error-banner" role="alert">
                    <AlertCircle size={15} style={{ flexShrink: 0 }} />
                    <span>{passwordError}</span>
                  </div>
                )}
                <div className="settings-form-grid">
                  <div className="settings-field-group settings-field-full">
                    <label className="settings-input-label">Current Password</label>
                    <input
                      type="password"
                      className="settings-input-control"
                      placeholder="Enter your current password"
                      value={currentPassword}
                      onChange={(e) => {
                        setCurrentPassword(e.target.value)
                        if (passwordError) setPasswordError('')
                      }}
                    />
                    <span className="settings-field-hint">
                      Required if you already have an existing password.
                    </span>
                  </div>

                  <div className="settings-field-group">
                    <label className="settings-input-label">New Password</label>
                    <input
                      type="password"
                      className={`settings-input-control ${passwordError ? 'has-error' : ''}`}
                      placeholder="At least 6 characters"
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value)
                        if (passwordError) setPasswordError('')
                      }}
                      required
                    />
                  </div>

                  <div className="settings-field-group">
                    <label className="settings-input-label">Confirm New Password</label>
                    <input
                      type="password"
                      className={`settings-input-control ${passwordError ? 'has-error' : ''}`}
                      placeholder="Repeat new password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value)
                        if (passwordError) setPasswordError('')
                      }}
                      required
                    />
                  </div>
                </div>

                <div className="settings-save-bar">
                  <button
                    type="submit"
                    className="profile-btn-primary"
                    disabled={savingPassword || !newPassword}
                  >
                    {savingPassword ? 'Updating…' : <><Check size={14} /> Update Password</>}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'standing' && user?.role !== 'admin' && (
            <div className="settings-section-card">
              <div className="settings-section-header">
                <h2 className="settings-section-title">
                  <ShieldAlert size={20} color={strikeCount > 0 ? '#ef4444' : '#10b981'} />
                  Community Standing &amp; Appeals
                </h2>
                <p className="settings-section-desc">
                  Review your account's moderation standing, active policy strikes, flagged content, and submit appeals.
                </p>
              </div>

              {/* Status Overview Hero */}
              <div className={`settings-standing-hero strike-${Math.min(strikeCount, 3)}`}>
                <div className="settings-standing-hero-top">
                  <div className="settings-standing-hero-info">
                    <div className="settings-standing-status-tag">
                      {strikeCount === 0 ? 'Good Standing' : strikeCount === 1 ? 'Warning Active' : strikeCount === 2 ? 'High Risk' : 'Suspended'}
                    </div>
                    <h3 className="settings-standing-hero-headline">
                      {strikeCount === 0
                        ? 'Your account is in excellent standing with zero violations.'
                        : strikeCount === 1
                        ? 'Warning active: 1 strike on record. Expires in 7 days if no further violations occur.'
                        : strikeCount === 2
                        ? 'Posting restricted: 2 strikes on record. One more violation will result in a permanent ban.'
                        : 'Your account has accumulated 3 strikes and has been suspended.'}
                    </h3>
                    <p className="settings-standing-hero-sub">
                      All GLUG community members are expected to maintain respectful, constructive, and open collaboration.
                    </p>
                  </div>

                  <div className="settings-standing-counter-box">
                    <div className="settings-standing-counter-val">
                      {strikeCount} <span className="settings-standing-counter-denom">/ 3 Strikes</span>
                    </div>
                    <div className="settings-standing-pips">
                      {[1, 2, 3].map((pip) => (
                        <div
                          key={pip}
                          className={`settings-standing-pip ${
                            strikeCount >= pip ? 'is-filled' : ''
                          } strike-pip-${pip}`}
                          title={`Strike ${pip}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* 3-Tier Community Policy */}
                <div className="settings-standing-policy-grid">
                  <div className={`settings-policy-card ${strikeCount >= 1 ? 'is-active' : ''}`}>
                    <span className="settings-policy-step">Strike 1</span>
                    <span className="settings-policy-title">Formal Warning</span>
                    <span className="settings-policy-desc">Offending content restricted; warning auto-expires in 7 days without further offences.</span>
                  </div>
                  <div className={`settings-policy-card ${strikeCount >= 2 ? 'is-active' : ''}`}>
                    <span className="settings-policy-step">Strike 2</span>
                    <span className="settings-policy-title">24h Restriction</span>
                    <span className="settings-policy-desc">Cannot create posts, comments, or replies for 24h. Resets to 0 in 30 days without further offences.</span>
                  </div>
                  <div className={`settings-policy-card is-danger ${strikeCount >= 3 ? 'is-active' : ''}`}>
                    <span className="settings-policy-step">Strike 3</span>
                    <span className="settings-policy-title">Permanent Ban</span>
                    <span className="settings-policy-desc">Account permanently suspended if further offence occurs during the 30-day period.</span>
                  </div>
                </div>
              </div>

              {/* Flagged Content & Appeals Section */}
              <div className="settings-standing-history-section">
                <div className="settings-subheading-bar">
                  <h4 className="settings-subheading-title">
                    <FileText size={16} /> Flagged Content &amp; Appeals ({allFlaggedAndStrikes.length})
                  </h4>
                  <button
                    type="button"
                    className="profile-btn-secondary"
                    onClick={loadModHistory}
                    disabled={loadingModHistory}
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                  >
                    {loadingModHistory ? <Loader2 size={13} className="glug-spin" /> : 'Refresh'}
                  </button>
                </div>

                {loadingModHistory ? (
                  <div className="profile-mod-loading">
                    <Loader2 size={16} className="glug-spin" /> Loading moderation records...
                  </div>
                ) : allFlaggedAndStrikes.length === 0 ? (
                  <div className="settings-standing-empty-box">
                    <CheckCircle2 size={36} color="#10b981" style={{ flexShrink: 0 }} />
                    <div>
                      <h5>No Moderation Flags or Active Strikes</h5>
                      <p>You have no restricted posts, flagged comments, or active strikes on your record. Thank you for keeping the GLUG community welcoming, constructive, and positive!</p>
                    </div>
                  </div>
                ) : (
                  <div className="settings-mod-list">
                    {allFlaggedAndStrikes.map((item) => {
                      const appeal = getAppealForItem(item)
                      return (
                        <div key={item.key} className="settings-mod-item">
                          <div className="settings-mod-item-main">
                            <div className="settings-mod-item-tags">
                              <span className={`settings-mod-type-badge type-${item.itemType}`}>
                                {item.itemType.toUpperCase()}
                              </span>
                              {item.strikeIndex && (
                                <span className="settings-mod-strike-badge">
                                  Strike {item.strikeIndex}
                                </span>
                              )}
                              <span className="settings-mod-date">
                                {formatRelativeTime(item.date)}
                              </span>
                            </div>

                            <h4 className="settings-mod-item-title">
                              {item.title}
                            </h4>
                            {item.snippet && (
                              <p className="settings-mod-item-snippet">"{item.snippet}"</p>
                            )}
                            <p className="settings-mod-item-reason">
                              <strong>Reason:</strong> {item.reason || 'Violates community guidelines'}
                            </p>
                            {(item.targetPostId || item.postId) && (
                              <Link
                                to={`/forum/posts/${item.targetPostId || item.postId}`}
                                className="settings-mod-view-post-pill"
                              >
                                <ExternalLink size={12} />
                                {item.itemType === 'comment'
                                  ? 'View Comment on Post'
                                  : item.itemType === 'post'
                                  ? 'View Restricted Post'
                                  : 'View Discussion Post'}
                              </Link>
                            )}
                          </div>

                          <div className="settings-mod-item-action">
                            {appeal ? (
                              <div className={`settings-appeal-badge status-${appeal.status}`}>
                                <div className="settings-appeal-badge-status">
                                  {appeal.status === 'pending' && (
                                    <>
                                      <Clock size={13} />
                                      <span>Appeal Pending</span>
                                    </>
                                  )}
                                  {appeal.status === 'approved' && (
                                    <>
                                      <CheckCircle2 size={13} />
                                      <span>Appeal Approved</span>
                                    </>
                                  )}
                                  {appeal.status === 'rejected' && (
                                    <>
                                      <XCircle size={13} />
                                      <span>Appeal Denied</span>
                                    </>
                                  )}
                                </div>
                                {appeal.adminNotes && (
                                  <span className="settings-appeal-note" title={appeal.adminNotes}>
                                    Note: {appeal.adminNotes}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <button
                                type="button"
                                className="settings-appeal-btn"
                                onClick={() => openAppealModal(item)}
                              >
                                {item.itemType === 'comment'
                                  ? 'Appeal Comment'
                                  : item.itemType === 'post'
                                  ? 'Appeal Post'
                                  : 'Appeal Strike'}
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="settings-section-card">
              <div className="settings-section-header">
                <h2 className="settings-section-title">
                  <Palette size={20} color="#a855f7" /> Theme &amp; Interface
                </h2>
                <p className="settings-section-desc">
                  Choose your visual style, color scheme, and coding font preferences.
                </p>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label className="settings-input-label" style={{ display: 'block', marginBottom: '0.5rem' }}>
                  Interface Theme
                </label>
                <div className="settings-theme-selector">
                  <div
                    className={`theme-card-option ${theme === 'dark' ? 'is-selected' : ''}`}
                    onClick={() => handleThemeSelect('dark')}
                  >
                    <div className="theme-preview-pill" style={{ background: '#090d16', border: '1px solid #1e293b' }}>
                      <Moon size={18} color="#3b82f6" />
                    </div>
                    <span className="theme-name">Dark Mode</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Default Midnight</span>
                  </div>

                  <div
                    className={`theme-card-option ${theme === 'light' ? 'is-selected' : ''}`}
                    onClick={() => handleThemeSelect('light')}
                  >
                    <div className="theme-preview-pill" style={{ background: '#f8fafc', border: '1px solid #cbd5e1' }}>
                      <Sun size={18} color="#f59e0b" />
                    </div>
                    <span className="theme-name">Light Mode</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Crisp &amp; Clean</span>
                  </div>

                  <div
                    className={`theme-card-option ${theme === 'cyber' ? 'is-selected' : ''}`}
                    onClick={() => handleThemeSelect('cyber')}
                  >
                    <div className="theme-preview-pill" style={{ background: '#05050f', border: '1px solid #3b0764' }}>
                      <Sparkles size={18} color="#a855f7" />
                    </div>
                    <span className="theme-name">Cyberpunk</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Neon Violet</span>
                  </div>
                </div>
              </div>

              <div className="settings-form-grid">
                <div className="settings-field-group">
                  <label className="settings-input-label">Online Compiler &amp; Editor Font Size</label>
                  <select
                    className="settings-select-control"
                    value={fontSize}
                    onChange={(e) => handleFontSizeChange(e.target.value)}
                  >
                    <option value="12">12px — Compact</option>
                    <option value="14">14px — Default Recommended</option>
                    <option value="16">16px — Comfortable</option>
                    <option value="18">18px — Large</option>
                  </select>
                  <span className="settings-field-hint">
                    Applies to the web code compiler and interactive terminal.
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="settings-section-card">
              <div className="settings-section-header">
                <h2 className="settings-section-title">
                  <Bell size={20} color="#f59e0b" /> Notification Preferences
                </h2>
                <p className="settings-section-desc">
                  Choose which community updates and activity alerts you wish to receive.
                </p>
              </div>

              <div className="settings-toggle-list">
                <div className="settings-toggle-row">
                  <div className="settings-toggle-meta">
                    <span className="settings-toggle-title">Discussion &amp; Reply Alerts</span>
                    <span className="settings-toggle-subtitle">
                      Notify me when someone replies to my post or comments on my discussion.
                    </span>
                  </div>
                  <label className="glug-switch">
                    <input
                      type="checkbox"
                      checked={notifs.replies}
                      onChange={() => handleToggleNotif('replies')}
                    />
                    <span className="glug-slider" />
                  </label>
                </div>

                <div className="settings-toggle-row">
                  <div className="settings-toggle-meta">
                    <span className="settings-toggle-title">GLUG Workshop &amp; Event Reminders</span>
                    <span className="settings-toggle-subtitle">
                      Receive notices about upcoming installation drives, hackathons, and guest lectures.
                    </span>
                  </div>
                  <label className="glug-switch">
                    <input
                      type="checkbox"
                      checked={notifs.events}
                      onChange={() => handleToggleNotif('events')}
                    />
                    <span className="glug-slider" />
                  </label>
                </div>

                <div className="settings-toggle-row">
                  <div className="settings-toggle-meta">
                    <span className="settings-toggle-title">Open Source Digest Newsletter</span>
                    <span className="settings-toggle-subtitle">
                      Monthly curated digest highlighting Linux utilities, campus projects, and GSoC tips.
                    </span>
                  </div>
                  <label className="glug-switch">
                    <input
                      type="checkbox"
                      checked={notifs.newsletter}
                      onChange={() => handleToggleNotif('newsletter')}
                    />
                    <span className="glug-slider" />
                  </label>
                </div>

                <div className="settings-toggle-row">
                  <div className="settings-toggle-meta">
                    <span className="settings-toggle-title">In-App Toast Alerts</span>
                    <span className="settings-toggle-subtitle">
                      Show popup confirmation bubbles when performing actions like copying links or upvoting.
                    </span>
                  </div>
                  <label className="glug-switch">
                    <input
                      type="checkbox"
                      checked={notifs.toasts}
                      onChange={() => handleToggleNotif('toasts')}
                    />
                    <span className="glug-slider" />
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'danger' && (
            <div className="settings-section-card danger-zone-card">
              <div className="settings-section-header" style={{ borderColor: 'rgba(239, 68, 68, 0.25)' }}>
                <h2 className="settings-section-title" style={{ color: '#ef4444' }}>
                  <AlertTriangle size={20} color="#ef4444" /> Danger Zone
                </h2>
                <p className="settings-section-desc">
                  Session management and local cache reset actions.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="danger-action-box">
                  <div>
                    <h4 style={{ margin: '0 0 0.2rem', color: 'var(--text)', fontSize: '0.95rem' }}>
                      Reset Terminal Local Cache
                    </h4>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      Clears offline file system state and command history stored in your browser.
                    </span>
                  </div>
                  <button
                    type="button"
                    className="profile-btn-secondary"
                    onClick={handleClearCache}
                  >
                    <Trash2 size={14} /> Clear Cache
                  </button>
                </div>

                <div className="danger-action-box">
                  <div>
                    <h4 style={{ margin: '0 0 0.2rem', color: 'var(--text)', fontSize: '0.95rem' }}>
                      Sign Out of Your Account
                    </h4>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      Terminates your current session and clears your local authentication token.
                    </span>
                  </div>
                  <button
                    type="button"
                    className="danger-btn"
                    onClick={handleLogout}
                  >
                    <LogOut size={14} /> Log Out
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {appealModalItem && (
        <div className="modal-backdrop" onClick={closeAppealModal}>
          <div
            className="modal-container settings-appeal-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldAlert size={18} color="#f59e0b" />
                {appealModalItem.itemType === 'comment'
                  ? 'Request Comment Appeal'
                  : appealModalItem.itemType === 'post'
                  ? 'Request Post Appeal'
                  : 'Request Moderation Appeal'}
              </h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={closeAppealModal}
                disabled={submittingAppeal}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAppealSubmit}>
              <div className="modal-body">
                <div className="settings-appeal-item-summary">
                  <div className="summary-label">
                    {appealModalItem.itemType === 'strike'
                      ? `Account Strike #${appealModalItem.strikeIndex || 1}`
                      : appealModalItem.itemType === 'post'
                      ? 'Restricted Post'
                      : 'Restricted Comment'}
                  </div>
                  <div className="summary-val">
                    {appealModalItem.title || 'Moderation Action'}
                  </div>
                  <p className="summary-reason">
                    <strong>Reason:</strong> {appealModalItem.reason || 'Violates community guidelines'}
                  </p>
                </div>

                <p className="settings-appeal-guidance">
                  Please explain why you believe this moderation action was a mistake or provide clarifying context. An administrator will review your defense and decide whether to revoke the strike or restore your content.
                </p>

                <div className="modal-field">
                  <label className="settings-input-label">Your Statement / Defense *</label>
                  <textarea
                    className="settings-appeal-textarea"
                    rows={5}
                    maxLength={1500}
                    required
                    placeholder="Explain clearly and respectfully why you are requesting an appeal..."
                    value={appealStatement}
                    onChange={(e) => setAppealStatement(e.target.value)}
                    disabled={submittingAppeal}
                  />
                  <span className="settings-field-hint" style={{ textAlign: 'right', display: 'block', marginTop: '0.25rem' }}>
                    {appealStatement.length} / 1500 characters
                  </span>
                </div>

                {appealError && (
                  <div className="settings-appeal-error">
                    <AlertCircle size={15} color="#ef4444" />
                    <span style={{ fontSize: '0.85rem', color: '#fca5a5' }}>{appealError}</span>
                  </div>
                )}
              </div>

              <div className="settings-save-bar" style={{ marginTop: 0, padding: '1rem 1.5rem' }}>
                <button
                  type="button"
                  className="profile-btn-secondary"
                  onClick={closeAppealModal}
                  disabled={submittingAppeal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="profile-btn-primary"
                  disabled={submittingAppeal || !appealStatement.trim()}
                >
                  {submittingAppeal ? (
                    <>
                      <Loader2 size={14} className="glug-spin" /> Submitting...
                    </>
                  ) : appealModalItem?.itemType === 'comment' ? (
                    'Submit Comment Appeal'
                  ) : appealModalItem?.itemType === 'post' ? (
                    'Submit Post Appeal'
                  ) : (
                    'Submit Appeal'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toastMessage && (
        <div className="profile-toast">
          <CheckCircle2 size={16} />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  )
}