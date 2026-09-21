import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { postsApi } from '../api.js'
import { discussionsCache } from '../utils/discussionsCache.js'
import { formatStatCount } from '../utils/statHelper.js'
import {
  Terminal,
  Code2,
  Settings,
  GitFork,
  Box,
  GraduationCap,
  Users,
  HelpCircle,
  Calendar,
  Lightbulb,
  Sparkles,
  ChevronRight,
  MessageSquare,
  FileText,
  Layers,
  ArrowRight
} from 'lucide-react'
import './Categories.css'

const CATEGORIES_DATA = [
  {
    id: 'linux',
    name: 'Linux',
    desc: 'Discussions about Linux distributions, usage, customization, and more.',
    color: '#eab308',
    borderColor: 'rgba(234, 179, 8, 0.4)',
    bgGlow: 'rgba(234, 179, 8, 0.1)',
    iconType: 'tux',
  },
  {
    id: 'command-line',
    name: 'Command Line',
    desc: 'Tips, tricks, and help with the terminal and shell scripting.',
    color: '#10b981',
    borderColor: 'rgba(16, 185, 129, 0.4)',
    bgGlow: 'rgba(16, 185, 129, 0.1)',
    iconType: 'terminal',
  },
  {
    id: 'programming',
    name: 'Programming',
    desc: 'Discuss programming languages, projects, and development.',
    color: '#a855f7',
    borderColor: 'rgba(168, 85, 247, 0.4)',
    bgGlow: 'rgba(168, 85, 247, 0.1)',
    iconType: 'code',
  },
  {
    id: 'installation',
    name: 'Installation',
    desc: 'Get help with installing Linux, dual booting, and setup.',
    color: '#3b82f6',
    borderColor: 'rgba(59, 130, 246, 0.4)',
    bgGlow: 'rgba(59, 130, 246, 0.1)',
    iconType: 'settings',
  },
  {
    id: 'open-source',
    name: 'Open Source',
    desc: 'Talk about open source projects, contributions, and communities.',
    color: '#f43f5e',
    borderColor: 'rgba(244, 63, 94, 0.4)',
    bgGlow: 'rgba(244, 63, 94, 0.1)',
    iconType: 'git-fork',
  },
  {
    id: 'tools-apps',
    name: 'Tools & Apps',
    desc: 'Discuss useful tools, applications, and productivity setups.',
    color: '#06b6d4',
    borderColor: 'rgba(6, 182, 212, 0.4)',
    bgGlow: 'rgba(6, 182, 212, 0.1)',
    iconType: 'box',
  },
  {
    id: 'learning-resources',
    name: 'Learning Resources',
    desc: 'Share and discover tutorials, courses, books, and guides.',
    color: '#f97316',
    borderColor: 'rgba(249, 115, 22, 0.4)',
    bgGlow: 'rgba(249, 115, 22, 0.1)',
    iconType: 'grad',
  },
  {
    id: 'general',
    name: 'General Discussion',
    desc: 'Off-topic discussions, introductions, and casual chats.',
    color: '#8b5cf6',
    borderColor: 'rgba(139, 92, 246, 0.4)',
    bgGlow: 'rgba(139, 92, 246, 0.1)',
    iconType: 'users',
  },
  {
    id: 'help',
    name: 'Help & Support',
    desc: 'Stuck? Get help from the community here.',
    color: '#22c55e',
    borderColor: 'rgba(34, 197, 94, 0.4)',
    bgGlow: 'rgba(34, 197, 94, 0.1)',
    iconType: 'help',
  },
  {
    id: 'events',
    name: 'Events',
    desc: 'Updates, announcements, and discussions about GLUG events.',
    color: '#ef4444',
    borderColor: 'rgba(239, 68, 68, 0.4)',
    bgGlow: 'rgba(239, 68, 68, 0.1)',
    iconType: 'calendar',
  },
  {
    id: 'projects',
    name: 'Project Showcase',
    desc: "Share your projects, ideas, and what you're building.",
    color: '#38bdf8',
    borderColor: 'rgba(56, 189, 248, 0.4)',
    bgGlow: 'rgba(56, 189, 248, 0.1)',
    iconType: 'lightbulb',
  },
  {
    id: 'careers',
    name: 'Career & Opportunities',
    desc: 'Internships, jobs, GSoC, and other opportunities.',
    color: '#ec4899',
    borderColor: 'rgba(236, 72, 153, 0.4)',
    bgGlow: 'rgba(236, 72, 153, 0.1)',
    iconType: 'star',
  },
]

const POPULAR_CATEGORIES = [
  { name: 'Linux', color: '#eab308', icon: 'tux', id: 'linux' },
  { name: 'Installation', color: '#3b82f6', icon: 'settings', id: 'installation' },
  { name: 'Command Line', color: '#10b981', icon: 'terminal', id: 'command-line' },
  { name: 'Programming', color: '#a855f7', icon: 'code', id: 'programming' },
  { name: 'Help & Support', color: '#22c55e', icon: 'help', id: 'help' },
]

function renderCategoryIcon(type, color) {
  if (type === 'tux') {
    return (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
        <path d="M12 2C9.24 2 7 4.24 7 7v4c0 .35.04.7.1 1.03C5.3 12.67 4 14.67 4 17c0 2.2 1.8 4 4 4h8c2.2 0 4-1.8 4-4 0-2.33-1.3-4.33-3.1-4.97.06-.33.1-.68.1-1.03V7c0-2.76-2.24-5-5-5zm-2 6c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm4 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm-2 2.5c1.1 0 2 .45 2 1h-4c0-.55.9-1 2-1z" />
      </svg>
    )
  }
  if (type === 'terminal') return <Terminal size={20} />
  if (type === 'code') return <Code2 size={20} />
  if (type === 'settings') return <Settings size={20} />
  if (type === 'git-fork') return <GitFork size={20} />
  if (type === 'box') return <Box size={20} />
  if (type === 'grad') return <GraduationCap size={20} />
  if (type === 'users') return <Users size={20} />
  if (type === 'help') return <HelpCircle size={20} />
  if (type === 'calendar') return <Calendar size={20} />
  if (type === 'lightbulb') return <Lightbulb size={20} />
  if (type === 'star') return <Sparkles size={20} />
  return <Layers size={20} />
}

export default function Categories() {
  const navigate = useNavigate()
  const cachedStats = discussionsCache.get('community_stats')
  const [stats, setStats] = useState(() => cachedStats?.data || null)

  useEffect(() => {
    let isMounted = true
    postsApi.getStats().then((data) => {
      if (!isMounted || !data) return
      discussionsCache.set('community_stats', data, 60000)
      setStats(data)
    }).catch(() => {})
    return () => {
      isMounted = false
    }
  }, [])

  const handleCategoryClick = (category) => {
    navigate(`/forum?category=${category.id}`)
  }

  return (
    <div className="cat-page-container">
      <div className="cat-main-content">
        <div className="cat-hero-banner">
          <div className="cat-hero-text">
            <h1 className="cat-hero-title">Categories</h1>
            <p className="cat-hero-desc">
              Explore topics, ask questions, share knowledge, and find your community.
            </p>
          </div>

          <div className="cat-hero-banner-bg">
            <img
              src="/categbanner.png"
              alt="GLUG Categories Banner"
              className="cat-hero-banner-img"
            />
          </div>
        </div>

        <div className="cat-cards-grid">
          {CATEGORIES_DATA.map((item) => {
            const catKey = item.id === 'learning-resources' ? 'resources' : item.id
            const catStat = stats?.categories?.[catKey]
            const discussionsCount = formatStatCount(catStat?.discussions ?? 0)
            const membersCount = formatStatCount(catStat?.members ?? 0)

            return (
              <div
                key={item.id}
                className="cat-card"
                style={{
                  '--cat-color': item.color,
                  '--cat-border': item.borderColor,
                  '--cat-glow': item.bgGlow,
                }}
                onClick={() => handleCategoryClick(item)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCategoryClick(item)
                }}
              >
                <div className="cat-card-top">
                  <div className="cat-card-icon" style={{ background: item.bgGlow, color: item.color, borderColor: item.borderColor }}>
                    {renderCategoryIcon(item.iconType, item.color)}
                  </div>
                  <div className="cat-card-title-row">
                    <h3 className="cat-card-name">{item.name}</h3>
                  </div>
                  <ChevronRight size={18} className="cat-card-arrow" />
                </div>

                <p className="cat-card-desc">{item.desc}</p>

                <div className="cat-card-footer">
                  <span className="cat-stat">
                    <MessageSquare size={13} />
                    <span>
                      <strong className="cat-stat-num">{discussionsCount}</strong> discussions
                    </span>
                  </span>
                  <span className="cat-stat">
                    <Users size={13} />
                    <span>
                      <strong className="cat-stat-num">{membersCount}</strong> members
                    </span>
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <aside className="cat-sidebar-widgets">
        <div className="cat-widget-card stats-widget">
          <h4 className="cat-widget-title">Community Stats</h4>
          <div className="cat-stats-grid">
            <Link to="/members" className="cat-stat-box" style={{ textDecoration: 'none' }}>
              <Users size={18} className="cat-stat-icon icon-blue" />
              <span className="cat-stat-val">
                {stats ? (
                  formatStatCount(stats.members ?? 0)
                ) : (
                  <span className="stat-num-skeleton glug-skeleton-shimmer" />
                )}
              </span>
              <span className="cat-stat-lbl">Members</span>
            </Link>
            <Link to="/forum" className="cat-stat-box" style={{ textDecoration: 'none' }}>
              <FileText size={18} className="cat-stat-icon icon-cyan" />
              <span className="cat-stat-val">
                {stats ? (
                  formatStatCount(stats.discussions ?? 0)
                ) : (
                  <span className="stat-num-skeleton glug-skeleton-shimmer" />
                )}
              </span>
              <span className="cat-stat-lbl">Discussions</span>
            </Link>
            <Link to="/categories" className="cat-stat-box" style={{ textDecoration: 'none' }}>
              <Layers size={18} className="cat-stat-icon icon-indigo" />
              <span className="cat-stat-val">
                {CATEGORIES_DATA.length}
              </span>
              <span className="cat-stat-lbl">Categories</span>
            </Link>
            <Link to="/events" className="cat-stat-box" style={{ textDecoration: 'none' }}>
              <Calendar size={18} className="cat-stat-icon icon-purple" />
              <span className="cat-stat-val">
                {stats ? (
                  formatStatCount(stats.events ?? (stats.categories?.events?.discussions ?? 0))
                ) : (
                  <span className="stat-num-skeleton glug-skeleton-shimmer" />
                )}
              </span>
              <span className="cat-stat-lbl">Events</span>
            </Link>
          </div>
        </div>

        <div className="cat-widget-card quote-widget">
          <div className="quote-widget-content">
            <p className="quote-widget-text">“Knowledge grows when shared.”</p>
            <span className="quote-widget-author">— GLUG</span>
          </div>
          <div className="quote-widget-art">
            <svg viewBox="0 0 100 80" className="quote-plant-svg">
              <ellipse cx="68" cy="50" rx="16" ry="22" fill="#0f172a" />
              <ellipse cx="68" cy="52" rx="11" ry="16" fill="#f8fafc" />
              <circle cx="68" cy="26" r="11" fill="#0f172a" />
              <circle cx="65" cy="24" r="1.5" fill="#f8fafc" />
              <polygon points="62,28 66,28 64,33" fill="#f59e0b" />
              <path d="M30 65 Q 32 35 34 25" stroke="#22c55e" strokeWidth="3" fill="none" strokeLinecap="round" />
              <path d="M34 38 Q 44 32 46 22 Q 38 24 34 36" fill="#4ade80" />
              <path d="M32 46 Q 20 40 18 30 Q 26 32 32 44" fill="#4ade80" />
              <path d="M34 25 Q 36 15 40 12 Q 38 20 34 25" fill="#22c55e" />
              <ellipse cx="32" cy="65" rx="12" ry="4" fill="#3f3f46" />
            </svg>
          </div>
        </div>

        <div className="cat-widget-card popular-widget">
          <h4 className="cat-widget-title">Popular Categories</h4>
          <div className="popular-list">
            {POPULAR_CATEGORIES.map((cat) => {
              const catStat = stats?.categories?.[cat.id]
              const displayCount = formatStatCount(catStat?.discussions ?? 0)
              return (
                <Link
                  key={cat.name}
                  to={`/forum?category=${cat.id}`}
                  className="popular-item"
                >
                  <div className="popular-item-left">
                    <span className="popular-bullet" style={{ color: cat.color }}>
                      {renderCategoryIcon(cat.icon, cat.color)}
                    </span>
                    <span className="popular-name">{cat.name}</span>
                  </div>
                  <span className="popular-count">{displayCount}</span>
                </Link>
              )
            })}
          </div>
        </div>

        <div className="cat-widget-card join-widget">
          <h4 className="cat-widget-title">New to GLUG?</h4>
          <p className="join-widget-desc">
            Introduce yourself and be part of an amazing community!
          </p>
          <Link to="/forum" className="join-widget-btn">
            Join the Discussion <ArrowRight size={15} />
          </Link>
        </div>
      </aside>
    </div>
  )
}
