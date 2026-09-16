import { useState, useEffect, useMemo, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { resourcesApi } from '../api.js'
import ResourceCard from '../components/resources/ResourceCard.jsx'
import ResourceDetailModal from '../components/resources/ResourceDetailModal.jsx'
import {
  Search,
  X,
  Sparkles,
  BookOpen,
  Download,
  LayoutGrid,
  List,
  Shield,
  Bookmark,
  Filter,
  Check,
} from 'lucide-react'
import './Resources.css'

const CATEGORY_LIST = [
  { id: 'all', label: 'All Resources' },
  { id: 'cs-intro', label: 'CS Introduction' },
  { id: 'algorithms-dsa', label: 'Algorithms & DSA' },
  { id: 'systems-arch', label: 'Computer Systems' },
  { id: 'operating-systems', label: 'Operating Systems' },
  { id: 'linux-basics', label: 'Linux Basics' },
  { id: 'linux-sysadmin', label: 'Sysadmin & DevOps' },
  { id: 'git-vcs', label: 'Git & VCS' },
  { id: 'open-source', label: 'Open Source' },
  { id: 'dev-tools', label: 'Developer Tools' },
  { id: 'systems-c-prog', label: 'C & Systems' },
  { id: 'web-dev', label: 'Web Development' },
  { id: 'security-crypto', label: 'Security & Networks' },
]

export default function Resources() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const searchInputRef = useRef(null)

  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all')
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [selectedDifficulty, setSelectedDifficulty] = useState('all')
  const [onlyWithFiles, setOnlyWithFiles] = useState(false)
  const [onlyBookmarked, setOnlyBookmarked] = useState(false)
  const [sortBy, setSortBy] = useState('featured')
  const [viewMode, setViewMode] = useState('grid')
  const [activeModalResource, setActiveModalResource] = useState(null)

  useEffect(() => {
    setLoading(true)
    resourcesApi
      .list()
      .then((data) => {
        if (Array.isArray(data)) {
          setResources(data)
        }
      })
      .catch((err) => console.warn('Could not load resources:', err))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const categoryCounts = useMemo(() => {
    const counts = { all: resources.length }
    for (const r of resources) {
      if (r.category) {
        counts[r.category] = (counts[r.category] || 0) + 1
      }
    }
    return counts
  }, [resources])

  const totalDownloadableFiles = useMemo(() => {
    return resources.reduce((acc, r) => acc + (Array.isArray(r.files) ? r.files.length : 0), 0)
  }, [resources])

  const totalCommunityDownloads = useMemo(() => {
    return resources.reduce((acc, r) => acc + (r.downloadCount || 0), 0)
  }, [resources])

  const filteredResources = useMemo(() => {
    return resources
      .filter((r) => {
        if (selectedCategory !== 'all' && r.category !== selectedCategory) {
          return false
        }

        if (selectedDifficulty !== 'all' && r.difficulty !== selectedDifficulty) {
          return false
        }

        if (onlyWithFiles && (!r.files || r.files.length === 0)) {
          return false
        }

        if (onlyBookmarked && !r.isBookmarked) {
          return false
        }

        if (!searchQuery.trim()) return true

        const q = searchQuery.toLowerCase().trim()
        const titleMatch = (r.title || '').toLowerCase().includes(q)
        const descMatch = (r.description || '').toLowerCase().includes(q)
        const detailsMatch = (r.details || '').toLowerCase().includes(q)
        const itemsMatch =
          Array.isArray(r.items) && r.items.some((i) => i.toLowerCase().includes(q))
        const fileMatch =
          Array.isArray(r.files) && r.files.some((f) => (f.name || '').toLowerCase().includes(q))
        const authorMatch = r.author?.username?.toLowerCase().includes(q)

        return titleMatch || descMatch || detailsMatch || itemsMatch || fileMatch || authorMatch
      })
      .sort((a, b) => {
        if (sortBy === 'featured') {
          if (a.isFeatured !== b.isFeatured) return b.isFeatured ? 1 : -1
          return (a.order || 0) - (b.order || 0)
        }
        if (sortBy === 'downloads') {
          return (b.downloadCount || 0) - (a.downloadCount || 0)
        }
        if (sortBy === 'views') {
          return (b.viewsCount || 0) - (a.viewsCount || 0)
        }
        if (sortBy === 'newest') {
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        }
        if (sortBy === 'alpha') {
          return (a.title || '').localeCompare(b.title || '')
        }
        return (a.order || 0) - (b.order || 0)
      })
  }, [
    resources,
    selectedCategory,
    selectedDifficulty,
    onlyWithFiles,
    onlyBookmarked,
    searchQuery,
    sortBy,
  ])

  const handleToggleBookmark = async (id) => {
    try {
      const res = await resourcesApi.bookmark(id)
      setResources((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, isBookmarked: res.isBookmarked } : r
        )
      )
      if (activeModalResource?.id === id) {
        setActiveModalResource((prev) =>
          prev ? { ...prev, isBookmarked: res.isBookmarked } : null
        )
      }
    } catch (err) {
      console.error('Bookmark error:', err)
    }
  }

  const handleResetFilters = () => {
    setSelectedCategory('all')
    setSearchQuery('')
    setSelectedDifficulty('all')
    setOnlyWithFiles(false)
    setOnlyBookmarked(false)
    setSortBy('featured')
  }

  return (
    <div className="res-page">
      {/* Hero Header */}
      <header className="res-hero">
        <div className="res-hero-top">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span className="res-hero-badge">
              <Sparkles size={13} /> Curriculum & Resources Hub
            </span>
            <span className="res-hero-curator">
              Curated by <strong>@glug_jec</strong>
            </span>
          </div>

          {user?.role === 'admin' && (
            <Link to="/admin?tab=resources" className="res-hero-admin-link">
              <Shield size={14} />
              <span>Admin Console</span>
            </Link>
          )}
        </div>

        <h1 className="res-hero-title">
          Computer Science, Linux & Open Source Resources
        </h1>
        <p className="res-hero-subtitle">
          An authoritative, battle-tested collection of university curriculums, offline lecture notes,
          lab code bundles, Linux distribution guides, and developer tooling shared directly via high-speed mirrors.
        </p>

        <div className="res-hero-stats">
          <div className="res-stat-item">
            <span className="res-stat-value">{resources.length}</span>
            <span className="res-stat-label">Curated Tracks</span>
          </div>
          <div className="res-stat-item">
            <span className="res-stat-value accent">{totalDownloadableFiles}</span>
            <span className="res-stat-label">Downloadable Files via Link</span>
          </div>
          <div className="res-stat-item">
            <span className="res-stat-value">{CATEGORY_LIST.length - 1}</span>
            <span className="res-stat-label">Subject Areas</span>
          </div>
          <div className="res-stat-item">
            <span className="res-stat-value">{totalCommunityDownloads}</span>
            <span className="res-stat-label">Total Downloads</span>
          </div>
        </div>
      </header>

      {/* Controls Bar */}
      <div className="res-controls-bar">
        {/* Search Bar */}
        <div className="res-search-row">
          <div className="res-search-box">
            <Search size={18} className="res-search-icon" />
            <input
              ref={searchInputRef}
              type="text"
              className="res-search-input"
              placeholder="Search resources, subtopics, textbooks, code packages, or files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery ? (
              <button
                type="button"
                className="res-search-clear-btn"
                onClick={() => setSearchQuery('')}
                title="Clear search"
              >
                <X size={15} />
              </button>
            ) : (
              <span className="res-search-shortcut">/</span>
            )}
          </div>
        </div>

        {/* Category Horizontal Scroll Pills */}
        <div className="res-category-scroll">
          {CATEGORY_LIST.map((cat) => {
            const count = categoryCounts[cat.id] || 0
            const isActive = selectedCategory === cat.id
            return (
              <button
                key={cat.id}
                type="button"
                className={`res-category-pill ${isActive ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                <span>{cat.label}</span>
                <span className="res-category-count">{count}</span>
              </button>
            )
          })}
        </div>

        {/* Secondary Filter Sub-bar */}
        <div className="res-filter-subbar">
          <div className="res-filter-group-left">
            <select
              className="res-filter-select"
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              title="Filter by difficulty"
            >
              <option value="all">All Difficulty Levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>

            <button
              type="button"
              className={`res-filter-toggle-btn ${onlyWithFiles ? 'active' : ''}`}
              onClick={() => setOnlyWithFiles((prev) => !prev)}
            >
              <Download size={14} />
              <span>Downloadable Files Only</span>
            </button>

            {user && (
              <button
                type="button"
                className={`res-filter-toggle-btn ${onlyBookmarked ? 'active' : ''}`}
                onClick={() => setOnlyBookmarked((prev) => !prev)}
              >
                <Bookmark size={14} />
                <span>Saved Tracks</span>
              </button>
            )}
          </div>

          <div className="res-filter-group-right">
            <div className="res-results-count">
              Showing <strong>{filteredResources.length}</strong> of <strong>{resources.length}</strong>
            </div>

            <select
              className="res-filter-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="featured">Featured First</option>
              <option value="downloads">Most Downloaded</option>
              <option value="views">Most Viewed</option>
              <option value="newest">Newest</option>
              <option value="alpha">Alphabetical (A-Z)</option>
            </select>

            <div className="res-view-toggle">
              <button
                type="button"
                className={`res-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                title="Grid layout"
              >
                <LayoutGrid size={15} />
              </button>
              <button
                type="button"
                className={`res-view-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                title="Compact list layout"
              >
                <List size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Loading Skeletons */}
      {loading && (
        <div className="res-skeleton-grid">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div className="res-skeleton-card" key={n} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredResources.length === 0 && (
        <div className="res-empty-state">
          <BookOpen size={40} className="res-empty-icon" />
          <h3 className="res-empty-title">No resources match your filters</h3>
          <p className="res-empty-desc">
            Try searching for a different keyword or resetting your category and difficulty filters.
          </p>
          <button
            type="button"
            className="res-reset-btn"
            onClick={handleResetFilters}
          >
            Reset All Filters
          </button>
        </div>
      )}

      {/* Resource Cards Grid */}
      {!loading && filteredResources.length > 0 && (
        <main className={`res-cards-grid ${viewMode === 'list' ? 'list-view' : ''}`}>
          {filteredResources.map((resource) => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              viewMode={viewMode}
              onOpenDetail={(r) => setActiveModalResource(r)}
              onBookmarkToggle={handleToggleBookmark}
              isLoggedIn={Boolean(user)}
            />
          ))}
        </main>
      )}

      {/* Detail / Download Center Modal */}
      {activeModalResource && (
        <ResourceDetailModal
          resource={activeModalResource}
          onClose={() => setActiveModalResource(null)}
          onBookmarkToggle={handleToggleBookmark}
        />
      )}
    </div>
  )
}
