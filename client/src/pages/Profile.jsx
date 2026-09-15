import { useEffect, useState, useRef } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { usersApi, authApi } from '../api.js'
import { avatarInitials, avatarColor } from '../components/common/avatar.js'
import LoadingSpinner from '../components/common/LoadingSpinner.jsx'
import ErrorMessage from '../components/common/ErrorMessage.jsx'
import {
  User,
  Settings as SettingsIcon,
  Edit3,
  Share2,
  Calendar,
  Mail,
  Shield,
  MessageSquare,
  ThumbsUp,
  Award,
  Sparkles,
  Terminal,
  Code2,
  ExternalLink,
  Crown,
  Globe,
  Plus,
  X,
  Check,
  CheckCircle2,
  Upload,
  Loader2,
  Camera,
  Trash2,
  AlertCircle,
  UserX,
  ArrowLeft,
  Home
} from 'lucide-react'
import { uploadApi } from '../api.js'
import { compressImage } from '../utils/imageCompressor.js'
import './Profile.css'

function GithubIcon({ size = 16, style = {} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
    </svg>
  )
}

function LinkedinIcon({ size = 16, style = {} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  )
}

function TwitterIcon({ size = 16, style = {} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
    </svg>
  )
}

function getDomain(url) {
  if (!url) return ''
  try {
    const validUrl = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`
    const parsed = new URL(validUrl)
    return (parsed.host || parsed.hostname).replace(/^www\./, '')
  } catch {
    return url.replace(/^(https?:\/\/)?(www\.)?/, '').split(/[/?#]/)[0]
  }
}

function getCleanHandle(val, platform) {
  if (!val) return ''
  let str = val.trim()
  if (platform === 'github') {
    str = str.replace(/^(https?:\/\/)?(www\.)?github\.com\//i, '')
  } else if (platform === 'linkedin') {
    str = str.replace(/^(https?:\/\/)?(www\.)?linkedin\.com\/(in\/)?/i, '')
  } else if (platform === 'twitter') {
    str = str.replace(/^(https?:\/\/)?(www\.)?(twitter|x)\.com\//i, '')
  }
  return str.split(/[?#]/)[0].replace(/\/$/, '')
}

function getSocialHref(val, platform) {
  if (!val) return '#'
  const clean = val.trim()
  if (clean.startsWith('http://') || clean.startsWith('https://')) {
    return clean
  }
  if (platform === 'github') {
    return `https://github.com/${clean.replace(/^(www\.)?github\.com\//i, '')}`
  }
  if (platform === 'linkedin') {
    return `https://linkedin.com/in/${clean.replace(/^(www\.)?linkedin\.com\/(in\/)?/i, '')}`
  }
  if (platform === 'twitter') {
    return `https://twitter.com/${clean.replace(/^(www\.)?(twitter|x)\.com\//i, '')}`
  }
  return `https://${clean}`
}

function UserAvatar({ src, username, size = 96, className = '' }) {
  const [error, setError] = useState(false)

  useEffect(() => {
    setError(false)
  }, [src])

  const isValidUrl = src && typeof src === 'string' && (src.startsWith('http') || src.startsWith('/') || src.startsWith('data:'))

  if (isValidUrl && !error) {
    return (
      <img
        src={src}
        alt={username || 'User'}
        referrerPolicy="no-referrer"
        onError={() => setError(true)}
        className={className}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
      />
    )
  }
  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: avatarColor(username),
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: `${Math.round(size * 0.42)}px`,
        fontWeight: 800,
        flexShrink: 0
      }}
    >
      {avatarInitials(username)}
    </div>
  )
}

export default function Profile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, updateUser, authLoading } = useAuth()
  const [profile, setProfile] = useState(null)
  const [userPosts, setUserPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('overview')
  const [toastMessage, setToastMessage] = useState('')

  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editForm, setEditForm] = useState({
    username: '',
    bio: '',
    avatar: '',
    skills: [],
    socials: { github: '', linkedin: '', website: '', twitter: '' }
  })
  const [newSkillInput, setNewSkillInput] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadProgressText, setUploadProgressText] = useState('')
  const [uploadError, setUploadError] = useState('')
  const [usernameError, setUsernameError] = useState('')
  const [globalModalError, setGlobalModalError] = useState('')
  const uploadTimerRef = useRef(null)

  const isOwnProfile = Boolean(
    !id ||
    (user && (
      (user.id && String(id).toLowerCase() === String(user.id).toLowerCase()) ||
      (user._id && String(id).toLowerCase() === String(user._id).toLowerCase()) ||
      (user.username && String(id).toLowerCase() === String(user.username).toLowerCase())
    ))
  )
  const currentUserId = user?.id || user?._id

  const isViewerStaff = Boolean(user && (user.role === 'admin' || user.communityRole?.isMember))
  const isTargetStaff = Boolean(profile && (profile.role === 'admin' || profile.communityRole?.isMember))
  const canMessage = !isOwnProfile && (isViewerStaff || isTargetStaff)

  useEffect(() => {
    if (id && user && isOwnProfile) {
      navigate('/profile', { replace: true })
    }
  }, [id, user, isOwnProfile, navigate])

  useEffect(() => {
    return () => {
      if (uploadTimerRef.current) clearTimeout(uploadTimerRef.current)
    }
  }, [])

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(''), 2500)
  }

  const openEditModal = () => {
    if (uploadTimerRef.current) clearTimeout(uploadTimerRef.current)
    setUploadProgressText('')
    setUploadError('')
    setUsernameError('')
    setGlobalModalError('')
    setEditModalOpen(true)
  }

  const closeEditModal = () => {
    if (uploadTimerRef.current) clearTimeout(uploadTimerRef.current)
    setUploadProgressText('')
    setUploadError('')
    setUsernameError('')
    setGlobalModalError('')
    setEditModalOpen(false)
  }

  useEffect(() => {
    if (editModalOpen) {
      document.body.classList.add('glug-modal-open')
    } else {
      document.body.classList.remove('glug-modal-open')
    }
    return () => document.body.classList.remove('glug-modal-open')
  }, [editModalOpen])

  useEffect(() => {
    if (!editModalOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') closeEditModal()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [editModalOpen])

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (uploadTimerRef.current) clearTimeout(uploadTimerRef.current)
    setUploadError('')
    setUploadingAvatar(true)
    try {
      setUploadProgressText('Compressing...')
      const { file: compressedFile, compressedSize } = await compressImage(file, 500 * 1024, 800, 800)
      const compKb = Math.round(compressedSize / 1024)
      setUploadProgressText(`Uploading (${compKb} KB)...`)

      const res = await uploadApi.uploadAvatar(compressedFile)
      if (res?.url) {
        setEditForm((prev) => ({ ...prev, avatar: res.url }))
        setProfile((prev) => ({ ...prev, avatar: res.url }))
        updateUser({ avatar: res.url })
        await authApi.updateProfile({ avatar: res.url })
        setUploadProgressText(`Uploaded! (${compKb} KB)`)
        showToast('Profile picture updated successfully!')
        if (uploadTimerRef.current) clearTimeout(uploadTimerRef.current)
        uploadTimerRef.current = setTimeout(() => {
          setUploadProgressText('')
        }, 3000)
      }
    } catch (err) {
      setUploadError(err.message || 'Failed to upload avatar')
    } finally {
      setUploadingAvatar(false)
      if (e.target) e.target.value = ''
    }
  }

  const handleRemoveAvatar = async () => {
    if (uploadTimerRef.current) clearTimeout(uploadTimerRef.current)
    setEditForm((prev) => ({ ...prev, avatar: '' }))
    setProfile((prev) => ({ ...prev, avatar: '' }))
    updateUser({ avatar: '' })
    await authApi.updateProfile({ avatar: '' }).catch(() => {})
    setUploadProgressText('')
    setUploadError('')
    showToast('Profile picture removed')
  }

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      setError('')
      try {
        const targetId = isOwnProfile ? (user?.id || user?._id || user?.username) : id
        if (!targetId) {
          setLoading(false)
          return
        }

        const [profData, postsData] = await Promise.all([
          usersApi.getProfile(targetId).catch(() => null),
          usersApi.getPosts(targetId).catch(() => [])
        ])

        if (profData) {
          setProfile(profData)
          if (isOwnProfile) {
            setEditForm({
              username: profData.username || '',
              bio: profData.bio || '',
              avatar: profData.avatar || '',
              skills: profData.skills || ['Linux', 'Git', 'Bash', 'Open Source'],
              socials: {
                github: profData.socials?.github || '',
                linkedin: profData.socials?.linkedin || '',
                website: profData.socials?.website || '',
                twitter: profData.socials?.twitter || ''
              }
            })
          }
        } else if (isOwnProfile && user) {
          const fallback = {
            id: user.id || user._id,
            username: user.username,
            email: user.email,
            role: user.role || 'student',
            bio: user.bio || '',
            skills: user.skills || ['Linux', 'Git', 'Bash', 'Open Source'],
            avatar: user.avatar || '',
            socials: user.socials || {},
            createdAt: user.createdAt,
            stats: { posts: 0, comments: 0, upvotes: 0 }
          }
          setProfile(fallback)
          setEditForm({
            username: fallback.username,
            bio: fallback.bio,
            avatar: fallback.avatar,
            skills: fallback.skills,
            socials: fallback.socials
          })
        }
        setUserPosts(postsData || [])
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [id, currentUserId, isOwnProfile])

  const handleCopyLink = async () => {
    const shareUsername = profile?.username || (isOwnProfile ? user?.username : id)
    const shareId = profile?.id || profile?._id || (isOwnProfile ? (user?.id || user?._id) : id)
    const targetIdentifier = shareUsername || shareId

    const publicUrl = targetIdentifier
      ? `${window.location.origin}/profile/${encodeURIComponent(targetIdentifier)}`
      : window.location.href

    try {
      await navigator.clipboard.writeText(publicUrl)
      showToast('Profile link copied to clipboard!')
    } catch {
      const textArea = document.createElement('textarea')
      textArea.value = publicUrl
      textArea.style.position = 'fixed'
      textArea.style.opacity = '0'
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      showToast('Profile link copied to clipboard!')
    }
  }

  const handleAddSkill = (e) => {
    e.preventDefault()
    const trimmed = newSkillInput.trim()
    if (!trimmed || editForm.skills.includes(trimmed)) return
    setEditForm((prev) => ({
      ...prev,
      skills: [...prev.skills, trimmed]
    }))
    setNewSkillInput('')
  }

  const handleRemoveSkill = (skill) => {
    setEditForm((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skill)
    }))
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    if (uploadTimerRef.current) clearTimeout(uploadTimerRef.current)
    setUploadProgressText('')
    setUploadError('')
    setUsernameError('')
    setGlobalModalError('')
    setSavingProfile(true)
    setError('')
    try {
      const res = await authApi.updateProfile({
        username: editForm.username.trim(),
        bio: editForm.bio.trim(),
        avatar: editForm.avatar.trim(),
        skills: editForm.skills,
        socials: editForm.socials
      })

      if (res?.user) {
        updateUser(res.user)
        setProfile((prev) => ({
          ...prev,
          ...res.user
        }))
        showToast('Profile updated successfully!')
        closeEditModal()
      }
    } catch (err) {
      const msg = err.message || 'Failed to update profile'
      if (/username/i.test(msg)) {
        setUsernameError(msg)
      } else {
        setGlobalModalError(msg)
      }
    } finally {
      setSavingProfile(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="profile-page-container profile-skeleton-wrap">
        <div className="profile-hero-card">
          <div className="profile-cover-banner profile-cover-skeleton glug-skeleton-shimmer">
            <div className="profile-cover-glow" />
          </div>
          <div className="profile-header-content">
            <div className="profile-avatar-row">
              <div className="profile-avatar-wrapper">
                <div className="profile-avatar-skeleton glug-skeleton-shimmer" />
              </div>
              <div className="profile-user-info-col" style={{ flex: 1, minWidth: 0 }}>
                <div className="profile-name-row" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div className="profile-skel-line profile-skel-title glug-skeleton-shimmer" />
                  <div className="profile-skel-badge glug-skeleton-shimmer" />
                </div>
                <div className="profile-skel-line profile-skel-sub glug-skeleton-shimmer" />
              </div>
            </div>
            <div className="profile-stats-bar">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="profile-stat-cell is-skeleton glug-skeleton-shimmer">
                  <div className="profile-skel-stat-num glug-skeleton-shimmer" />
                  <div className="profile-skel-stat-label glug-skeleton-shimmer" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="profile-tabs-skeleton">
          <div className="profile-skel-tab glug-skeleton-shimmer" />
          <div className="profile-skel-tab glug-skeleton-shimmer" />
        </div>

        <div className="profile-content-grid">
          <div className="profile-sidebar-col">
            <div className="profile-content-card profile-card-skeleton">
              <div className="profile-skel-line profile-skel-card-title glug-skeleton-shimmer" />
              <div className="profile-skel-line profile-skel-body-1 glug-skeleton-shimmer" />
              <div className="profile-skel-line profile-skel-body-2 glug-skeleton-shimmer" />
            </div>
            <div className="profile-content-card profile-card-skeleton">
              <div className="profile-skel-line profile-skel-card-title glug-skeleton-shimmer" />
              <div className="profile-skel-chips-wrap">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="profile-skel-chip glug-skeleton-shimmer" />
                ))}
              </div>
            </div>
          </div>
          <div className="profile-main-col">
            <div className="profile-content-card" style={{ minHeight: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <LoadingSpinner text="Loading profile…" size="md" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!user && isOwnProfile) {
    return (
      <div className="profile-page-container">
        <div className="profile-not-found-card">
          <div className="not-found-icon-halo not-found-halo-blue">
            <User size={38} strokeWidth={1.75} />
          </div>
          <span className="not-found-badge not-found-badge-blue">
            Authentication Required
          </span>
          <h2 className="not-found-title">Sign In to View Your Profile</h2>
          <p className="not-found-desc">
            Access your technical discussions, bookmarks, reputation points, skills, and account settings.
          </p>

          <div className="not-found-actions">
            <Link to="/login" className="not-found-btn not-found-btn-primary">
              Log in to GLUG
            </Link>
            <Link to="/register" className="not-found-btn not-found-btn-secondary">
              Create Account
            </Link>
            <Link to="/forum" className="not-found-btn not-found-btn-secondary">
              <MessageSquare size={16} /> Explore Community
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="profile-page-container">
        <div className="profile-not-found-card">
          <div className="not-found-icon-halo">
            <UserX size={38} strokeWidth={1.75} />
          </div>
          <span className="not-found-badge">404 · Member Profile</span>
          <h2 className="not-found-title">User Not Found</h2>
          <p className="not-found-desc">
            The member profile you are looking for {id ? <span className="not-found-highlight">@{id}</span> : 'this account'} does not exist, may have changed their username, or the account is no longer active.
          </p>

          <div className="not-found-actions">
            <button
              type="button"
              className="not-found-btn not-found-btn-secondary"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft size={16} /> Go Back
            </button>
            <Link to="/forum" className="not-found-btn not-found-btn-primary">
              <MessageSquare size={16} /> Explore Discussions
            </Link>
            <Link to="/" className="not-found-btn not-found-btn-secondary">
              <Home size={16} /> Home
            </Link>
          </div>

          {!user && (
            <div className="not-found-auth-hint">
              <span>Looking for your own profile?</span>
              <Link to="/login" className="not-found-login-link">
                Sign in to your account →
              </Link>
            </div>
          )}

          <div className="not-found-quick-links">
            <span className="quick-links-label">Popular sections:</span>
            <div className="quick-links-row">
              <Link to="/terminal" className="quick-link-pill">
                <Terminal size={13} /> Linux Terminal
              </Link>
              <Link to="/compiler" className="quick-link-pill">
                <Code2 size={13} /> Online Compiler
              </Link>
              <Link to="/resources" className="quick-link-pill">
                <Sparkles size={13} /> Resources
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const memberSince = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString(undefined, {
        month: 'short',
        year: 'numeric'
      })
    : 'Sep 2026'

  const repScore = (profile.stats?.upvotes || 0) * 5 + (profile.stats?.posts || userPosts.length) * 2 + (profile.stats?.comments || 0)

  return (
    <div className="profile-page-container">
      <ErrorMessage message={error} />

      <div className="profile-hero-card">
        <div className="profile-cover-banner">
          <div className="profile-cover-stars">
            <span className="pstar pstar-1">✦</span>
            <span className="pstar pstar-2">✦</span>
            <span className="pstar pstar-3">⋆</span>
            <span className="pstar pstar-4">✦</span>
            <span className="pstar pstar-5">⋆</span>
          </div>
          <div className="profile-cover-glow" />
        </div>

        <div className="profile-header-content">
          <div className="profile-avatar-row">
            <div className="profile-avatar-wrapper">
              <UserAvatar
                src={profile.avatar}
                username={profile.username}
                size={96}
                className="profile-avatar-img"
              />
            </div>

            <div className="profile-actions-group">
              {isOwnProfile ? (
                <>
                  <button
                    type="button"
                    className="profile-btn-primary"
                    onClick={openEditModal}
                  >
                    <Edit3 size={15} /> Edit Profile
                  </button>
                  <Link to="/settings" className="profile-btn-secondary">
                    <SettingsIcon size={15} /> Settings
                  </Link>
                  <button
                    type="button"
                    className="profile-btn-icon"
                    onClick={handleCopyLink}
                    title="Share Profile Link"
                  >
                    <Share2 size={16} />
                  </button>
                </>
              ) : (
                <>
                  {canMessage && (
                    <button
                      type="button"
                      className="profile-btn-primary"
                      onClick={() => {
                        if (!user) {
                          navigate('/login?redirect=/profile/' + (profile.username || id));
                          return;
                        }
                        navigate(`/chat?with=${profile.id || profile._id}`);
                      }}
                    >
                      <MessageSquare size={15} /> Message
                    </button>
                  )}
                  <button
                    type="button"
                    className="profile-btn-secondary"
                    onClick={handleCopyLink}
                  >
                    <Share2 size={15} /> Share Profile
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="profile-info-block">
            <div className="profile-title-badges">
              <h1 className="profile-display-name">
                {profile.username || 'Member'}
              </h1>
              {profile.role === 'admin' && (
                <span className="profile-role-badge role-admin">
                  <Shield size={12} />
                  Administrator
                </span>
              )}
              {profile.role === 'moderator' && (
                <span className="profile-role-badge role-mod">
                  <Shield size={12} />
                  Moderator
                </span>
              )}
              {profile.communityRole?.isMember && (
                <span className="profile-team-badge">
                  <Crown size={13} />
                  <span>
                    {profile.communityRole.positionTitle || profile.communityRole.category || 'Member'}
                  </span>
                </span>
              )}
            </div>

            <div className="profile-meta-row">
              <span className="profile-meta-item">
                <Mail size={14} /> {profile.email}
              </span>
              <span className="profile-meta-item">
                <Calendar size={14} /> Joined {memberSince}
              </span>
            </div>

            <p className="profile-bio-text">
              {profile.bio || 'Exploring Linux, contributing to open source, and building systems.'}
            </p>
          </div>
        </div>
      </div>

      <div className="profile-stats-strip">
        <div className="profile-stat-card">
          <div className="profile-stat-icon-wrap icon-blue-bg">
            <MessageSquare size={20} />
          </div>
          <div className="profile-stat-data">
            <span className="profile-stat-number">{profile.stats?.posts ?? userPosts.length}</span>
            <span className="profile-stat-title">Discussions Created</span>
          </div>
        </div>

        <div className="profile-stat-card">
          <div className="profile-stat-icon-wrap icon-emerald-bg">
            <MessageSquare size={20} />
          </div>
          <div className="profile-stat-data">
            <span className="profile-stat-number">{profile.stats?.comments ?? 0}</span>
            <span className="profile-stat-title">Comments Posted</span>
          </div>
        </div>

        <div className="profile-stat-card">
          <div className="profile-stat-icon-wrap icon-amber-bg">
            <ThumbsUp size={20} />
          </div>
          <div className="profile-stat-data">
            <span className="profile-stat-number">{profile.stats?.upvotes ?? 0}</span>
            <span className="profile-stat-title">Upvotes Received</span>
          </div>
        </div>

        <div className="profile-stat-card">
          <div className="profile-stat-icon-wrap icon-purple-bg">
            <Award size={20} />
          </div>
          <div className="profile-stat-data">
            <span className="profile-stat-number">{repScore}</span>
            <span className="profile-stat-title">Reputation Points</span>
          </div>
        </div>
      </div>

      <div className="profile-tabs-nav">
        <button
          type="button"
          className={`profile-tab-btn ${activeTab === 'overview' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <User size={16} /> Overview
        </button>
        <button
          type="button"
          className={`profile-tab-btn ${activeTab === 'discussions' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('discussions')}
        >
          <MessageSquare size={16} /> Discussions
          <span className="profile-tab-badge">{userPosts.length}</span>
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="profile-grid-2col">
          <div className="profile-col-main">
            <div className="profile-content-card">
              <h2 className="profile-card-title">
                <Code2 size={18} color="#3b82f6" /> Skills &amp; Tech Stack
              </h2>
              <div className="profile-skills-wrap">
                {(profile.skills && profile.skills.length > 0
                  ? profile.skills
                  : ['Linux', 'Git', 'Bash', 'Docker', 'Open Source']
                ).map((s) => (
                  <span key={s} className="profile-skill-badge" title={s}>
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="profile-content-card">
              <h2 className="profile-card-title">
                <Terminal size={18} color="#10b981" /> Terminal &amp; Systems
              </h2>
              <div className="profile-terminal-info-grid">
                <div className="profile-terminal-info-box">
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block', marginBottom: '0.2rem' }}>Default Shell</span>
                  <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text)' }}>zsh / bash</span>
                </div>
                <div className="profile-terminal-info-box">
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block', marginBottom: '0.2rem' }}>GLUG Terminal Status</span>
                  <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#10b981' }}>Active</span>
                </div>
              </div>
            </div>
          </div>

          <div className="profile-col-side">
            <div className="profile-content-card">
              <h2 className="profile-card-title">
                <Globe size={18} color="#a855f7" /> Connect &amp; Socials
              </h2>
              <div className="profile-socials-list">
                {profile.socials?.github && (
                  <a
                    href={getSocialHref(profile.socials.github, 'github')}
                    target="_blank"
                    rel="noreferrer"
                    className="profile-social-link"
                    title={profile.socials.github}
                  >
                    <GithubIcon size={16} />
                    <span>{getCleanHandle(profile.socials.github, 'github')}</span>
                    <ExternalLink size={12} style={{ marginLeft: 'auto', opacity: 0.6, flexShrink: 0 }} />
                  </a>
                )}
                {profile.socials?.linkedin && (
                  <a
                    href={getSocialHref(profile.socials.linkedin, 'linkedin')}
                    target="_blank"
                    rel="noreferrer"
                    className="profile-social-link"
                    title={profile.socials.linkedin}
                  >
                    <LinkedinIcon size={16} />
                    <span>{getCleanHandle(profile.socials.linkedin, 'linkedin')}</span>
                    <ExternalLink size={12} style={{ marginLeft: 'auto', opacity: 0.6, flexShrink: 0 }} />
                  </a>
                )}
                {profile.socials?.twitter && (
                  <a
                    href={getSocialHref(profile.socials.twitter, 'twitter')}
                    target="_blank"
                    rel="noreferrer"
                    className="profile-social-link"
                    title={profile.socials.twitter}
                  >
                    <TwitterIcon size={16} />
                    <span>{getCleanHandle(profile.socials.twitter, 'twitter')}</span>
                    <ExternalLink size={12} style={{ marginLeft: 'auto', opacity: 0.6, flexShrink: 0 }} />
                  </a>
                )}
                {profile.socials?.website && (
                  <a
                    href={getSocialHref(profile.socials.website, 'website')}
                    target="_blank"
                    rel="noreferrer"
                    className="profile-social-link"
                    title={profile.socials.website}
                  >
                    <Globe size={16} />
                    <span>{getDomain(profile.socials.website)}</span>
                    <ExternalLink size={12} style={{ marginLeft: 'auto', opacity: 0.6, flexShrink: 0 }} />
                  </a>
                )}
                {!profile.socials?.github && !profile.socials?.linkedin && !profile.socials?.twitter && !profile.socials?.website && (
                  <div className="profile-social-empty">
                    No social links linked yet.
                    {isOwnProfile && ' Click "Edit Profile" to connect your GitHub or LinkedIn.'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'discussions' && (
        <div className="profile-content-card">
          <h2 className="profile-card-title">
            <MessageSquare size={18} color="#3b82f6" /> Discussions Started ({userPosts.length})
          </h2>

          {userPosts.length === 0 ? (
            <div className="profile-empty-discussions">
              <MessageSquare size={36} className="profile-empty-icon" />
              <h3 style={{ margin: 0, color: 'var(--text)' }}>No discussions yet</h3>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                {isOwnProfile
                  ? 'Join the conversation by asking a question or sharing knowledge in the forum.'
                  : `${profile.username} hasn't posted any discussions yet.`}
              </p>
              {isOwnProfile && (
                <Link to="/forum" className="profile-btn-primary" style={{ marginTop: '0.5rem' }}>
                  Start a Discussion
                </Link>
              )}
            </div>
          ) : (
            <div className="profile-discussions-list">
              {userPosts.map((post) => (
                <Link
                  key={post.id || post._id}
                  to={`/forum/posts/${post.id || post._id}`}
                  className="profile-disc-item"
                >
                  <div className="profile-disc-main">
                    <span className="profile-disc-title">{post.title}</span>
                    <div className="profile-disc-meta">
                      <span style={{ color: '#3b82f6', fontWeight: 600 }}>{post.category || 'General'}</span>
                      <span>·</span>
                      <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="profile-disc-metrics">
                    <span className="profile-disc-metric">
                      <ThumbsUp size={13} /> {post.voteScore || 0}
                    </span>
                    <span className="profile-disc-metric">
                      <MessageSquare size={13} /> {post.commentCount || 0}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {editModalOpen && (
        <div className="modal-backdrop" onClick={closeEditModal}>
          <div className="profile-edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Edit Profile</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={closeEditModal}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile}>
              <div className="modal-body">
                {globalModalError && (
                  <div className="modal-global-error" role="alert">
                    <AlertCircle size={16} style={{ flexShrink: 0 }} />
                    <span>{globalModalError}</span>
                  </div>
                )}
                <div className="modal-field">
                  <label className="modal-label">Profile Picture</label>
                  <div className="avatar-uploader-card">
                    <div className="avatar-uploader-preview-wrap">
                      <UserAvatar
                        src={editForm.avatar}
                        username={editForm.username}
                        size={84}
                        className="avatar-uploader-preview"
                      />
                      {uploadingAvatar && (
                        <div className="avatar-uploader-overlay">
                          <Loader2 size={24} className="spin-icon" />
                        </div>
                      )}
                    </div>

                    <div className="avatar-uploader-content">
                      <div className="avatar-uploader-actions">
                        <input
                          type="file"
                          id="avatar-photo-input"
                          accept="image/png, image/jpeg, image/webp"
                          className="avatar-hidden-file-input"
                          onChange={handleAvatarUpload}
                          disabled={uploadingAvatar}
                        />
                        <label
                          htmlFor="avatar-photo-input"
                          className={`btn-upload-avatar ${uploadingAvatar ? 'is-disabled' : ''}`}
                        >
                          <Camera size={15} />
                          {uploadingAvatar ? 'Uploading...' : 'Upload Photo'}
                        </label>

                        {editForm.avatar && (
                          <button
                            type="button"
                            className="btn-remove-avatar"
                            onClick={handleRemoveAvatar}
                            disabled={uploadingAvatar}
                          >
                            <Trash2 size={14} /> Remove
                          </button>
                        )}
                      </div>

                      <p className="avatar-uploader-subtext">
                        Square photo recommended. JPG, PNG or WebP.
                      </p>

                      {uploadProgressText && !uploadError && (
                        <div className="upload-status-badge is-success">
                          <Check size={13} /> {uploadProgressText}
                        </div>
                      )}
                      {uploadError && (
                        <div className="upload-status-badge is-error">
                          <X size={13} /> {uploadError}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="modal-field">
                  <label className="modal-label">Username</label>
                  <input
                    type="text"
                    className={`modal-input ${usernameError ? 'has-error' : ''}`}
                    value={editForm.username}
                    onChange={(e) => {
                      setUsernameError('')
                      setGlobalModalError('')
                      setEditForm((prev) => ({ ...prev, username: e.target.value }))
                    }}
                    required
                  />
                  {usernameError && (
                    <span className="modal-field-error">
                      <AlertCircle size={13} /> {usernameError}
                    </span>
                  )}
                </div>

                <div className="modal-field">
                  <label className="modal-label">Bio</label>
                  <textarea
                    rows={3}
                    className="modal-textarea"
                    placeholder="Tell the community about your journey with Linux, projects, and interests..."
                    value={editForm.bio}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, bio: e.target.value }))
                    }
                  />
                </div>

                <div className="modal-field">
                  <label className="modal-label">Skills &amp; Technologies</label>
                  <div className="profile-skills-wrap" style={{ marginBottom: '0.5rem' }}>
                    {editForm.skills.map((skill) => (
                      <span key={skill} className="profile-skill-badge" style={{ gap: '0.35rem' }}>
                        {skill}
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skill)}
                          style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: 0, display: 'flex' }}
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="text"
                      className="modal-input"
                      placeholder="Add a skill (e.g. Docker, Rust, Arch)"
                      value={newSkillInput}
                      onChange={(e) => setNewSkillInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddSkill(e)
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="profile-btn-secondary"
                      onClick={handleAddSkill}
                    >
                      <Plus size={14} /> Add
                    </button>
                  </div>
                </div>

                <div className="modal-field">
                  <label className="modal-label">Social Links</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <GithubIcon size={16} style={{ color: 'var(--text-dim)', flexShrink: 0 }} />
                      <input
                        type="text"
                        className="modal-input"
                        placeholder="GitHub username or link"
                        value={editForm.socials.github}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            socials: { ...prev.socials, github: e.target.value }
                          }))
                        }
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <LinkedinIcon size={16} style={{ color: 'var(--text-dim)', flexShrink: 0 }} />
                      <input
                        type="text"
                        className="modal-input"
                        placeholder="LinkedIn username or link"
                        value={editForm.socials.linkedin}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            socials: { ...prev.socials, linkedin: e.target.value }
                          }))
                        }
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Globe size={16} style={{ color: 'var(--text-dim)', flexShrink: 0 }} />
                      <input
                        type="text"
                        className="modal-input"
                        placeholder="Portfolio or personal website"
                        value={editForm.socials.website}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            socials: { ...prev.socials, website: e.target.value }
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="profile-btn-secondary"
                  onClick={closeEditModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="profile-btn-primary"
                  disabled={savingProfile}
                >
                  {savingProfile ? 'Saving…' : <><Check size={14} /> Save Changes</>}
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
