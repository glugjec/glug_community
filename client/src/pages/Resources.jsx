import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { resourcesApi } from '../api.js'
import ResourceCard from '../components/resources/ResourceCard.jsx'
import { Search, X, Sparkles, BookOpen, Terminal, Layers } from 'lucide-react'

const GENRE_FILTERS = [
  { id: 'all', label: 'All Curated' },
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
]

export default function Resources() {
  const { user } = useAuth()
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedGenre, setSelectedGenre] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    resourcesApi
      .list()
      .then((data) => {
        if (Array.isArray(data)) {
          setResources(data)
        }
      })
      .catch((err) => console.warn('Could not load dynamic resources:', err))
      .finally(() => setLoading(false))
  }, [])

  // Calculate counts per genre
  const genreCounts = useMemo(() => {
    const counts = { all: resources.length }
    for (const r of resources) {
      if (r.category) {
        counts[r.category] = (counts[r.category] || 0) + 1
      }
    }
    return counts
  }, [resources])

  // Filtered resources based on genre and search query
  const filteredResources = useMemo(() => {
    return resources.filter((r) => {
      const matchesGenre = selectedGenre === 'all' || r.category === selectedGenre

      if (!matchesGenre) return false

      if (!searchQuery.trim()) return true

      const q = searchQuery.toLowerCase().trim()
      const titleMatch = (r.title || '').toLowerCase().includes(q)
      const descMatch = (r.description || '').toLowerCase().includes(q)
      const itemsMatch = Array.isArray(r.items) && r.items.some((i) => i.toLowerCase().includes(q))
      const authorMatch = r.author?.username?.toLowerCase().includes(q)

      return titleMatch || descMatch || itemsMatch || authorMatch
    })
  }, [resources, selectedGenre, searchQuery])

  return (
    <section className="page" style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 20px' }}>
      {/* Header Section */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '20px',
          marginBottom: '24px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                background: 'rgba(56, 139, 253, 0.15)',
                color: '#58a6ff',
                padding: '3px 10px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 600,
                border: '1px solid rgba(56, 139, 253, 0.3)',
              }}
            >
              <Sparkles size={13} /> Curriculum & Knowledge Hub
            </span>
            <span
              style={{
                fontSize: '12px',
                color: '#8b949e',
              }}
            >
              Maintained by <strong style={{ color: '#58a6ff' }}>@glug_jec</strong>
            </span>
          </div>

          <h1 className="page-title" style={{ fontSize: '28px', fontWeight: 800, margin: '0 0 6px 0' }}>
            CS, Linux & Open Source Resources
          </h1>
          <p className="page-subtitle" style={{ color: '#8b949e', fontSize: '14.5px', margin: 0, maxWidth: '750px' }}>
            A battle-tested, student-friendly collection of 100+ authoritative courses, books, interactive simulators,
            and developer tooling for computer science and open-source mastery.
          </p>
        </div>

        {user?.role === 'admin' && (
          <Link
            to="/admin?tab=resources"
            style={{
              background: '#238636',
              color: '#ffffff',
              padding: '9px 18px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#2ea043')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#238636')}
          >
            🛡️ Manage Resources
          </Link>
        )}
      </div>

      {/* Admin Quick Banner */}
      {user?.role === 'admin' && (
        <div
          style={{
            background: 'rgba(88, 166, 255, 0.08)',
            border: '1px solid rgba(88, 166, 255, 0.25)',
            borderRadius: '10px',
            padding: '12px 18px',
            marginBottom: '24px',
            fontSize: '13px',
            color: '#8b949e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <span>
            💡 <strong>Administrator Access:</strong> You can publish, modify, or reorder curriculum resources from the Admin Console.
          </span>
          <Link to="/admin?tab=resources" style={{ color: '#58a6ff', fontWeight: 600, textDecoration: 'none' }}>
            Open Resource Publisher &rarr;
          </Link>
        </div>
      )}

      {/* Search & Stats Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
          marginBottom: '18px',
        }}
      >
        {/* Search Input */}
        <div
          style={{
            position: 'relative',
            flex: '1',
            minWidth: '280px',
            maxWidth: '480px',
          }}
        >
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#8b949e',
              pointerEvents: 'none',
            }}
          />
          <input
            type="text"
            placeholder="Search 100+ resources by title, topic, or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 36px 10px 38px',
              background: '#0d1117',
              border: '1px solid #30363d',
              borderRadius: '8px',
              color: '#f0f6fc',
              fontSize: '13.5px',
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color 0.15s ease',
            }}
            onFocus={(e) => (e.target.style.borderColor = '#58a6ff')}
            onBlur={(e) => (e.target.style.borderColor = '#30363d')}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                color: '#8b949e',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
              }}
              title="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Counter readout */}
        <div style={{ fontSize: '13px', color: '#8b949e', fontWeight: 500 }}>
          Showing <strong style={{ color: '#f0f6fc' }}>{filteredResources.length}</strong> of{' '}
          <strong style={{ color: '#f0f6fc' }}>{resources.length}</strong> resources
        </div>
      </div>

      {/* Genre Filter Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '12px',
          marginBottom: '20px',
          scrollbarWidth: 'thin',
        }}
      >
        {GENRE_FILTERS.map((genre) => {
          const count = genreCounts[genre.id] || 0
          const isActive = selectedGenre === genre.id

          return (
            <button
              key={genre.id}
              onClick={() => setSelectedGenre(genre.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '20px',
                fontSize: '12.5px',
                fontWeight: isActive ? 600 : 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                background: isActive ? '#58a6ff' : '#161b22',
                color: isActive ? '#0d1117' : '#c9d1d9',
                border: isActive ? '1px solid #58a6ff' : '1px solid #30363d',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.borderColor = '#58a6ff'
                  e.currentTarget.style.color = '#f0f6fc'
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.borderColor = '#30363d'
                  e.currentTarget.style.color = '#c9d1d9'
                }
              }}
            >
              <span>{genre.label}</span>
              <span
                style={{
                  fontSize: '11px',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  background: isActive ? 'rgba(0, 0, 0, 0.25)' : '#21262d',
                  color: isActive ? '#0d1117' : '#8b949e',
                  fontWeight: 700,
                }}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#8b949e' }}>
          <div style={{ fontSize: '15px', fontWeight: 600, color: '#c9d1d9', marginBottom: '8px' }}>
            Loading curated resources...
          </div>
          <p style={{ fontSize: '13px', margin: 0 }}>Fetching 100+ verified courses, books, and tools.</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredResources.length === 0 && (
        <div
          style={{
            background: '#161b22',
            border: '1px solid #30363d',
            borderRadius: '12px',
            padding: '48px 24px',
            textAlign: 'center',
            color: '#8b949e',
            margin: '20px 0',
          }}
        >
          <BookOpen size={36} style={{ color: '#58a6ff', opacity: 0.8, marginBottom: '12px' }} />
          <h3 style={{ color: '#f0f6fc', fontSize: '17px', margin: '0 0 8px 0' }}>
            No resources match your criteria
          </h3>
          <p style={{ fontSize: '13.5px', maxWidth: '400px', margin: '0 auto 16px auto' }}>
            We couldn't find any resources matching your search query. Try searching for different keywords or clear your filters.
          </p>
          <button
            onClick={() => {
              setSelectedGenre('all')
              setSearchQuery('')
            }}
            style={{
              background: '#21262d',
              color: '#58a6ff',
              border: '1px solid #30363d',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Reset All Filters
          </button>
        </div>
      )}

      {/* Resources Cards Grid */}
      {!loading && filteredResources.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '20px',
            alignItems: 'stretch',
          }}
        >
          {filteredResources.map((topic) => (
            <ResourceCard
              key={topic.id || topic._id || topic.title}
              title={topic.title}
              description={topic.description}
              category={topic.category}
              items={topic.items || []}
              links={topic.links || []}
              author={topic.author}
            />
          ))}
        </div>
      )}
    </section>
  )
}
