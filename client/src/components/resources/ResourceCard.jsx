import React from 'react'
import {
  ExternalLink,
  BookOpen,
  GraduationCap,
  Terminal,
  Code2,
  FolderGit2,
  Cpu,
  Layers,
  Sparkles,
  Link as LinkIcon
} from 'lucide-react'

const CATEGORY_LABELS = {
  'cs-intro': { label: 'CS Introduction', color: '#58a6ff', bg: 'rgba(56, 139, 253, 0.12)' },
  'algorithms-dsa': { label: 'Algorithms & DSA', color: '#bc8cff', bg: 'rgba(188, 140, 255, 0.12)' },
  'systems-arch': { label: 'Systems & Architecture', color: '#f0883e', bg: 'rgba(240, 136, 62, 0.12)' },
  'operating-systems': { label: 'Operating Systems', color: '#e3b341', bg: 'rgba(227, 179, 65, 0.12)' },
  'linux-basics': { label: 'Linux Basics', color: '#3fb950', bg: 'rgba(63, 185, 80, 0.12)' },
  'linux-sysadmin': { label: 'Sysadmin & DevOps', color: '#39c5bb', bg: 'rgba(57, 197, 187, 0.12)' },
  'git-vcs': { label: 'Git & Version Control', color: '#f78166', bg: 'rgba(247, 129, 102, 0.12)' },
  'open-source': { label: 'Open Source & FOSS', color: '#56d364', bg: 'rgba(86, 211, 100, 0.12)' },
  'dev-tools': { label: 'Developer Tooling', color: '#d29922', bg: 'rgba(210, 153, 34, 0.12)' },
  'systems-c-prog': { label: 'C & Systems Programming', color: '#79c0ff', bg: 'rgba(121, 192, 255, 0.12)' },
}

function getLinkIcon(type) {
  switch (type) {
    case 'course':
      return <GraduationCap size={14} />
    case 'book':
      return <BookOpen size={14} />
    case 'interactive':
      return <Terminal size={14} />
    case 'repo':
      return <FolderGit2 size={14} />
    case 'tool':
      return <Code2 size={14} />
    default:
      return <ExternalLink size={14} />
  }
}

export default function ResourceCard({
  title,
  description,
  category,
  items = [],
  links = [],
  author,
}) {
  const catMeta = CATEGORY_LABELS[category] || {
    label: category || 'Resource',
    color: '#8b949e',
    bg: 'rgba(139, 148, 158, 0.12)',
  }

  const authorName = author?.username ? `@${author.username}` : '@glug_jec'

  return (
    <div
      style={{
        background: '#161b22',
        border: '1px solid #30363d',
        borderRadius: '12px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: '16px',
        transition: 'transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#58a6ff'
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.35)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#30363d'
        e.currentTarget.style.transform = 'none'
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)'
      }}
    >
      <div>
        {/* Top bar: Category Badge & Author */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            marginBottom: '12px',
          }}
        >
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '3px 10px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.3px',
              textTransform: 'uppercase',
              color: catMeta.color,
              background: catMeta.bg,
              border: `1px solid ${catMeta.color}33`,
            }}
          >
            {catMeta.label}
          </span>

          <span
            style={{
              fontSize: '11px',
              color: '#8b949e',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
            title={`Curated by ${authorName}`}
          >
            Curator: <strong style={{ color: '#58a6ff', fontWeight: 600 }}>{authorName}</strong>
          </span>
        </div>

        {/* Title */}
        <h3
          style={{
            fontSize: '17px',
            fontWeight: 700,
            color: '#f0f6fc',
            margin: '0 0 8px 0',
            lineHeight: 1.35,
          }}
        >
          {title}
        </h3>

        {/* Description */}
        <p
          style={{
            fontSize: '13.5px',
            lineHeight: 1.55,
            color: '#8b949e',
            margin: '0 0 16px 0',
          }}
        >
          {description}
        </p>

        {/* Topic Pills */}
        {items && items.length > 0 && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '6px',
              marginBottom: '16px',
            }}
          >
            {items.map((item, idx) => (
              <span
                key={idx}
                style={{
                  fontSize: '11px',
                  background: '#21262d',
                  color: '#c9d1d9',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  border: '1px solid #30363d',
                }}
              >
                {item}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Action Links */}
      {links && links.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            paddingTop: '12px',
            borderTop: '1px solid #21262d',
          }}
        >
          {links.map((link, idx) => (
            <a
              key={idx}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 12px',
                borderRadius: '6px',
                fontSize: '12.5px',
                fontWeight: 600,
                textDecoration: 'none',
                color: idx === 0 ? '#ffffff' : '#58a6ff',
                background: idx === 0 ? '#238636' : 'rgba(56, 139, 253, 0.1)',
                border: idx === 0 ? '1px solid #2ea043' : '1px solid rgba(56, 139, 253, 0.3)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (idx === 0) {
                  e.currentTarget.style.background = '#2ea043'
                } else {
                  e.currentTarget.style.background = 'rgba(56, 139, 253, 0.2)'
                  e.currentTarget.style.borderColor = '#58a6ff'
                }
              }}
              onMouseLeave={(e) => {
                if (idx === 0) {
                  e.currentTarget.style.background = '#238636'
                } else {
                  e.currentTarget.style.background = 'rgba(56, 139, 253, 0.1)'
                  e.currentTarget.style.borderColor = 'rgba(56, 139, 253, 0.3)'
                }
              }}
            >
              {getLinkIcon(link.type)}
              <span>{link.title || 'Open Resource'}</span>
              <ExternalLink size={11} style={{ opacity: 0.7, marginLeft: '2px' }} />
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
