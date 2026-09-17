import { useEffect, useState, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { postsApi, eventsApi } from '../api.js'
import { discussionsCache } from '../utils/discussionsCache.js'
import { avatarInitials, avatarColor } from '../components/common/avatar.js'
import { formatRelativeTime } from '../utils/timeAgo.js'
import { formatStatCount } from '../utils/statHelper.js'
import {
  ArrowRight,
  MessageSquare,
  Eye,
  Calendar,
  MapPin,
  Users,
  FileText,
  BookOpen,
  ChevronRight,
  Sparkles,
  Terminal,
  Code2
} from 'lucide-react'
import './Home.css'

const DEFAULT_DISCUSSIONS = [
  {
    id: 'distro-2025',
    title: 'Best Linux distro for beginners in 2025?',
    author: 'ananya',
    timeAgo: '2 hours ago',
    tags: [
      { label: 'Linux', color: '#3b82f6' },
      { label: 'Beginner', color: '#64748b' }
    ],
    replies: 12,
    views: 245,
    lastReply: {
      time: '5 min ago',
      user: 'kevin',
      avatarColor: '#10b981'
    },
    avatarType: 'tux',
    avatarBg: '#0f172a'
  },
  {
    id: 'dual-boot-win11',
    title: 'How to dual boot Ubuntu with Windows 11?',
    author: 'rishabh',
    timeAgo: '5 hours ago',
    tags: [
      { label: 'Installation', color: '#3b82f6' },
      { label: 'Support', color: '#6366f1' }
    ],
    replies: 8,
    views: 160,
    lastReply: {
      time: '1 hour ago',
      user: 'arjun',
      avatarColor: '#f59e0b'
    },
    avatarType: 'letter',
    avatarLetter: 'R',
    avatarBg: '#ea580c'
  },
  {
    id: 'useful-terminal-commands',
    title: 'Useful terminal commands everyone should know',
    author: 'kaustubh',
    timeAgo: '1 day ago',
    tags: [
      { label: 'Tips & Tricks', color: '#8b5cf6' },
      { label: 'Command Line', color: '#64748b' }
    ],
    replies: 24,
    views: 398,
    lastReply: {
      time: '3 hours ago',
      user: 'devansh',
      avatarColor: '#06b6d4'
    },
    avatarType: 'icon-terminal',
    avatarBg: '#059669'
  },
  {
    id: 'sys-programming-resources',
    title: 'Resources to learn system programming',
    author: 'kaustubh',
    timeAgo: '1 day ago',
    tags: [
      { label: 'Programming', color: '#3b82f6' },
      { label: 'Resources', color: '#6366f1' }
    ],
    replies: 15,
    views: 312,
    lastReply: {
      time: '4 hours ago',
      user: 'isha',
      avatarColor: '#ec4899'
    },
    avatarType: 'icon-code',
    avatarBg: '#9333ea'
  },
  {
    id: 'gluginit-planning',
    title: 'Planning GLUGINIT – Linux Installation Drive',
    author: 'team-glug',
    timeAgo: '2 days ago',
    tags: [
      { label: 'Events', color: '#3b82f6' },
      { label: 'GLUG', color: '#64748b' }
    ],
    replies: 18,
    views: 521,
    lastReply: {
      time: '6 hours ago',
      user: 'tarun',
      avatarColor: '#3b82f6'
    },
    avatarType: 'icon-users',
    avatarBg: '#2563eb'
  }
]

const UPCOMING_EVENTS = [
  {
    id: 'gluginit',
    title: 'GLUGINIT Linux Installation Drive',
    date: 'Sep 19, 2026 · 5:00 PM',
    location: 'Main Auditorium',
    type: 'install',
    iconBg: '#1e3a8a',
    iconColor: '#60a5fa'
  },
  {
    id: 'workshop-os',
    title: 'Intro to Open Source Workshop',
    date: 'Sep 26, 2026 · 4:00 PM',
    location: 'Online (Meet)',
    type: 'workshop',
    iconBg: '#3b0764',
    iconColor: '#c084fc'
  },
  {
    id: 'hangout',
    title: 'Community Hangout',
    date: 'Oct 5, 2026 · 6:00 PM',
    location: 'Cafeteria',
    type: 'social',
    iconBg: '#172554',
    iconColor: '#38bdf8'
  }
]

function UserAvatar({ src, username, size = 24, className = '' }) {
  const [error, setError] = useState(false)
  if (src && !error) {
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
        fontWeight: 700,
        flexShrink: 0
      }}
    >
      {avatarInitials(username)}
    </div>
  )
}

function renderDiscussionAvatar(item) {
  if (item.authorAvatar) {
    return (
      <UserAvatar
        src={item.authorAvatar}
        username={item.author}
        size={40}
        className="home-avatar"
      />
    )
  }
  if (item.avatarType === 'tux') {
    return (
      <div className="home-avatar" style={{ background: item.avatarBg }}>
        <svg viewBox="0 0 24 24" width="22" height="22" fill="#fbbf24">
          <path d="M12 2C9.24 2 7 4.24 7 7v4c0 .35.04.7.1 1.03C5.3 12.67 4 14.67 4 17c0 2.2 1.8 4 4 4h8c2.2 0 4-1.8 4-4 0-2.33-1.3-4.33-3.1-4.97.06-.33.1-.68.1-1.03V7c0-2.76-2.24-5-5-5zm-2 6c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm4 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm-2 2.5c1.1 0 2 .45 2 1h-4c0-.55.9-1 2-1z" />
        </svg>
      </div>
    )
  }
  if (item.avatarType === 'letter') {
    return (
      <UserAvatar
        src={item.authorAvatar}
        username={item.author}
        size={40}
        className="home-avatar"
      />
    )
  }
  if (item.avatarType === 'icon-terminal') {
    return (
      <div className="home-avatar" style={{ background: item.avatarBg }}>
        <Terminal size={18} color="#ffffff" />
      </div>
    )
  }
  if (item.avatarType === 'icon-code') {
    return (
      <div className="home-avatar" style={{ background: item.avatarBg }}>
        <Code2 size={18} color="#ffffff" />
      </div>
    )
  }
  if (item.avatarType === 'icon-users') {
    return (
      <div className="home-avatar" style={{ background: item.avatarBg }}>
        <Users size={18} color="#ffffff" />
      </div>
    )
  }
  return (
    <div className="home-avatar" style={{ background: avatarColor(item.author) }}>
      {avatarInitials(item.author)}
    </div>
  )
}

function HomeDiscTags({ tags }) {
  if (!tags || tags.length === 0) return null

  const firstTag = tags[0]
  const hiddenCount = tags.length - 1

  return (
    <div className="disc-tags">
      <span
        className="disc-tag"
        style={{
          backgroundColor: `${firstTag.color}1f`,
          color: firstTag.color,
          borderColor: `${firstTag.color}35`
        }}
        title={firstTag.label}
      >
        {firstTag.label}
      </span>
      {hiddenCount > 0 && (
        <span
          className="disc-tag tag-more-count"
          title={tags.slice(1).map((t) => t.label).join(', ')}
        >
          +{hiddenCount}
        </span>
      )}
    </div>
  )
}

export default function Home() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const cachedRecent = discussionsCache.get('home_recent_5')
  const [discussions, setDiscussions] = useState(() => cachedRecent?.data || [])
  const [loadingDiscussions, setLoadingDiscussions] = useState(() => !cachedRecent?.data?.length)
  const cachedStats = discussionsCache.get('community_stats')
  const [stats, setStats] = useState(() => cachedStats?.data || null)
  const [upcomingEvents, setUpcomingEvents] = useState([])

  useEffect(() => {
    let isMounted = true
    postsApi.getStats().then((data) => {
      if (!isMounted || !data) return
      discussionsCache.set('community_stats', data, 60000)
      setStats(data)
    }).catch(() => {})

    eventsApi.getUpcoming(3).then((res) => {
      if (isMounted && res?.events) {
        setUpcomingEvents(res.events)
      }
    }).catch(() => {})

    return () => {
      isMounted = false
    }
  }, [])

  const handlePrefetch = useCallback((postId) => {
    if (!postId) return
    const cacheKey = `post_detail_${postId}_${user?.id || 'anon'}`
    if (!discussionsCache.get(cacheKey)) {
      postsApi.get(postId).then((res) => {
        if (res?.post) {
          discussionsCache.set(cacheKey, { post: res.post, comments: res.comments || [] }, 60000)
        }
      }).catch(() => {})
    }
  }, [user?.id])

  useEffect(() => {
    const idleId = typeof window !== 'undefined' && window.requestIdleCallback
      ? window.requestIdleCallback(() => {
          postsApi.list({ limit: 20, sort: 'new' }).then((res) => {
            if (res?.posts) {
              discussionsCache.set(`forum_latest_all_${user?.id || 'anon'}`, res.posts, 45000)
            }
          }).catch(() => {})
        })
      : setTimeout(() => {
          postsApi.list({ limit: 20, sort: 'new' }).then((res) => {
            if (res?.posts) {
              discussionsCache.set(`forum_latest_all_${user?.id || 'anon'}`, res.posts, 45000)
            }
          }).catch(() => {})
        }, 1200)

    return () => {
      if (typeof window !== 'undefined' && window.cancelIdleCallback && typeof idleId === 'number') {
        window.cancelIdleCallback(idleId)
      } else {
        clearTimeout(idleId)
      }
    }
  }, [user?.id])

  useEffect(() => {
    let isMounted = true
    async function fetchRecent() {
      try {
        const data = await postsApi.list({ limit: 5, sort: 'new' })
        if (!isMounted) return
        if (data?.posts && data.posts.length > 0) {
          const formatted = data.posts.map((post) => {
            const timeAgo = formatRelativeTime(post.createdAt)
            return {
              id: post._id || post.id,
              title: post.title,
              author: post.author?.username || 'user',
              authorAvatar: post.author?.avatar,
              timeAgo,
              tags: (post.tags && post.tags.length > 0)
                ? post.tags.map((t, i) => ({ label: t, color: i === 0 ? '#3b82f6' : '#64748b' }))
                : [{ label: post.category || 'General', color: '#3b82f6' }],
              replies: post.commentCount || 0,
              views: post.views ?? 0,
              lastReply: {
                time: 'recently',
                user: post.author?.username || 'member',
                avatar: post.author?.avatar
              },
              avatarType: post.author?.avatar ? 'img' : 'letter',
              avatarLetter: avatarInitials(post.author?.username || 'U'),
              avatarBg: avatarColor(post.author?.username)
            }
          })
          discussionsCache.set('home_recent_5', formatted, 60000)
          setDiscussions(formatted)
        } else {
          setDiscussions(DEFAULT_DISCUSSIONS)
        }
      } catch {
        if (!cachedRecent?.data?.length) {
          setDiscussions(DEFAULT_DISCUSSIONS)
        }
      } finally {
        if (isMounted) {
          setLoadingDiscussions(false)
        }
      }
    }
    fetchRecent()
    return () => { isMounted = false }
  }, [])

  return (
    <div className="home-page-container">
      <div className="home-main-col">
        <div className="home-hero-card">
          <div className="home-hero-content">
            <span className="home-hero-badge">WELCOME TO GLUG</span>
            <h1 className="home-hero-title">
              Learn Linux.<br />
              Share Ideas.<br />
              <span className="home-gradient-text">Grow Together.</span>
            </h1>
            <p className="home-hero-desc">
              A student-driven community for open source, Linux and everything tech.
            </p>
            <div className="home-hero-actions">
              <Link to="/forum" className="hero-btn-primary">
                Start a Discussion <ArrowRight size={16} />
              </Link>
              <Link to="/categories" className="hero-btn-secondary">
                Explore Categories
              </Link>
            </div>
          </div>

          <div className="home-hero-banner-bg">
            <img
              src="/homebannerorg.png"
              alt="GLUG Community Banner"
              className="home-hero-banner-img"
            />
          </div>
        </div>

        <section className="home-discussions-section">
          <div className="home-section-header">
            <h2 className="home-section-title">Recent Discussions</h2>
            <Link to="/forum" className="home-view-all">
              View all <ArrowRight size={14} />
            </Link>
          </div>

          <div className="home-discussions-list">
            {loadingDiscussions ? (
              [1, 2, 3].map((n) => (
                <div key={n} className="discussion-card-row" style={{ opacity: 0.6, pointerEvents: 'none' }}>
                  <div className="disc-left">
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--bg-hover)' }} />
                    <div className="disc-info">
                      <div style={{ width: 220, height: 16, borderRadius: 4, background: 'var(--bg-hover)', marginBottom: 6 }} />
                      <div style={{ width: 120, height: 12, borderRadius: 4, background: 'var(--bg-hover)' }} />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              discussions.map((item) => (
                <div
                  key={item.id}
                  className="discussion-card-row"
                  onClick={() => navigate(`/forum/posts/${item.id}`)}
                  onMouseEnter={() => handlePrefetch(item.id)}
                  onFocus={() => handlePrefetch(item.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') navigate(`/forum/posts/${item.id}`)
                  }}
                >
                <div className="disc-left">
                  {renderDiscussionAvatar(item)}
                  <div className="disc-info">
                    <div className="disc-title-row">
                      <span className="disc-title">{item.title}</span>
                      <HomeDiscTags tags={item.tags} />
                    </div>
                    <div className="disc-meta">
                      <span className="disc-author">{item.author}</span>
                      <span className="disc-dot">·</span>
                      <span className="disc-time">{item.timeAgo}</span>
                    </div>
                  </div>
                </div>

                <div className="disc-right">
                  <div className="disc-metrics">
                    <span className="disc-metric">
                      <MessageSquare size={14} />
                      {item.replies} {item.replies === 1 ? 'reply' : 'replies'}
                    </span>
                    <span className="disc-metric">
                      <Eye size={14} />
                      {item.views} {item.views === 1 ? 'view' : 'views'}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
      </div>

      <aside className="home-widgets-col">
        {!user ? (
          <div className="home-widget-card cta-card">
            <h3 className="widget-card-title">Be Part of the Community</h3>
            <p className="widget-card-desc">
              Ask questions, share knowledge, and connect with fellow students.
            </p>
            <div className="cta-btn-group">
              <Link to="/register" className="cta-btn-signup">
                Sign Up
              </Link>
              <Link to="/login" className="cta-btn-login">
                Log In
              </Link>
            </div>
          </div>
        ) : (
          <div className="home-widget-card cta-card">
            <h3 className="widget-card-title">
              Welcome back, {user.username
                ? (user.username.includes('@') ? user.username.split('@')[0] : user.username)
                : (user.email ? user.email.split('@')[0] : 'Member')}!
            </h3>
            <p className="widget-card-desc">
              Ready to explore open source code or share your technical thoughts today?
            </p>
            <div className="cta-btn-group">
              <Link to="/forum" className="cta-btn-signup">
                Go to Forum
              </Link>
              <Link to="/terminal" className="cta-btn-login">
                Open Terminal
              </Link>
            </div>
          </div>
        )}

        <div className="home-widget-card stats-card">
          <div className="home-stats-2x2">
            <div className="home-stat-tile">
              <Users size={18} className="stat-tile-icon icon-blue" />
              <span className="stat-tile-number">
                {stats ? formatStatCount(stats.members) : '1.2K'}
              </span>
              <span className="stat-tile-label">Members</span>
            </div>
            <div className="home-stat-tile">
              <FileText size={18} className="stat-tile-icon icon-cyan" />
              <span className="stat-tile-number">
                {stats ? formatStatCount(stats.discussions) : '450'}
              </span>
              <span className="stat-tile-label">Discussions</span>
            </div>
            <div className="home-stat-tile">
              <Calendar size={18} className="stat-tile-icon icon-indigo" />
              <span className="stat-tile-number">
                {stats?.categories?.events ? formatStatCount(stats.categories.events.discussions) : '25'}
              </span>
              <span className="stat-tile-label">Events</span>
            </div>
            <div className="home-stat-tile">
              <BookOpen size={18} className="stat-tile-icon icon-purple" />
              <span className="stat-tile-number">
                {stats ? formatStatCount(stats.resources) : '120'}
              </span>
              <span className="stat-tile-label">Resources</span>
            </div>
          </div>
        </div>

        <div className="home-widget-card events-card">
          <div className="events-card-header">
            <h3 className="widget-card-title">Upcoming Events</h3>
            <Link to="/events" className="events-view-all">
              View all <ArrowRight size={13} />
            </Link>
          </div>

          <div className="events-list">
            {(upcomingEvents.length > 0 ? upcomingEvents : UPCOMING_EVENTS).map((evt) => {
              const isReal = Boolean(evt._id)
              const eventDate = isReal
                ? new Date(evt.startDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  }) + (evt.time ? ` · ${evt.time}` : '')
                : evt.date
              const eventLoc = isReal
                ? evt.locationType === 'virtual'
                  ? 'Online Virtual'
                  : evt.venue || 'Campus'
                : evt.location

              return (
                <Link
                  key={evt._id || evt.id}
                  to={isReal ? `/events/${evt.slug || evt._id}` : '/events'}
                  className="event-item"
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <div
                    className="event-icon-box"
                    style={{
                      background: evt.bannerUrl ? '#0f172a' : evt.iconBg || '#172554',
                      color: evt.iconColor || '#38bdf8',
                      overflow: 'hidden',
                    }}
                  >
                    {evt.bannerUrl ? (
                      <img
                        src={evt.bannerUrl}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <Calendar size={17} />
                    )}
                  </div>
                  <div className="event-info">
                    <h4 className="event-title">{evt.title}</h4>
                    <div className="event-sub">
                      <span>{eventDate}</span>
                    </div>
                    <div className="event-location">
                      <MapPin size={11} />
                      <span>{eventLoc}</span>
                    </div>
                  </div>
                  <ChevronRight size={16} className="event-arrow" />
                </Link>
              )
            })}
          </div>
        </div>

        <div className="home-widget-card quote-mountains-card">
          <div className="mountains-card-text">
            <p className="mountains-quote">“Same Students. A More Open Tomorrow.”</p>
            <span className="mountains-author">— GLUG</span>
          </div>
          <div className="mountains-silhouette">
            <svg viewBox="0 0 200 70" preserveAspectRatio="none" className="mountains-svg">
              <polygon points="0,70 30,35 65,55 105,20 145,50 175,25 200,70" fill="#2e1065" opacity="0.6" />
              <polygon points="0,70 45,45 80,60 120,32 160,58 200,40 200,70" fill="#1e1b4b" opacity="0.9" />
              <polygon points="0,70 25,55 70,70 110,48 150,65 185,50 200,70" fill="#0f172a" />
            </svg>
          </div>
        </div>
      </aside>
    </div>
  )
}