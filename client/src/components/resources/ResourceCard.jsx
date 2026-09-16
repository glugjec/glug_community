import {
  ExternalLink,
  BookOpen,
  GraduationCap,
  Terminal,
  Code2,
  FolderGit2,
  Bookmark,
  Download,
  FileText,
  FileArchive,
  Disc,
  File,
  Eye,
  Sparkles,
  ChevronRight,
} from 'lucide-react'

function getLinkIcon(type) {
  switch (type) {
    case 'course':
      return <GraduationCap size={13} />
    case 'book':
      return <BookOpen size={13} />
    case 'interactive':
      return <Terminal size={13} />
    case 'repo':
      return <FolderGit2 size={13} />
    case 'tool':
      return <Code2 size={13} />
    default:
      return <ExternalLink size={13} />
  }
}

function getFileFormatBadge(format) {
  switch (format) {
    case 'pdf':
      return { icon: <FileText size={12} />, label: 'PDF' }
    case 'zip':
      return { icon: <FileArchive size={12} />, label: 'ZIP' }
    case 'iso':
      return { icon: <Disc size={12} />, label: 'ISO' }
    case 'code':
      return { icon: <Code2 size={12} />, label: 'CODE' }
    default:
      return { icon: <File size={12} />, label: (format || 'FILE').toUpperCase() }
  }
}

export default function ResourceCard({
  resource,
  viewMode = 'grid',
  onOpenDetail,
  onBookmarkToggle,
  isLoggedIn = false,
}) {
  const {
    id,
    title,
    description,
    category,
    difficulty,
    items = [],
    links = [],
    files = [],
    author,
    viewsCount = 0,
    downloadCount = 0,
    isFeatured,
    isBookmarked,
  } = resource

  const authorName = author?.username ? `@${author.username}` : '@glug_jec'
  const visibleItems = items.slice(0, 3)
  const remainingCount = items.length - visibleItems.length

  const handleDownloadClick = (e, fileUrl) => {
    e.stopPropagation()
    if (files.length === 1 && fileUrl) {
      window.open(fileUrl, '_blank', 'noopener,noreferrer')
    } else {
      onOpenDetail(resource)
    }
  }

  return (
    <article
      className={`res-card ${viewMode === 'list' ? 'list-mode' : ''}`}
      onClick={() => onOpenDetail(resource)}
    >
      <div className="res-card-top">
        <div className="res-card-badges">
          <span className="res-pill category">#{category}</span>
          {difficulty && difficulty !== 'all-levels' && (
            <span className={`res-pill difficulty ${difficulty}`}>{difficulty}</span>
          )}
          {isFeatured && (
            <span className="res-pill featured">
              <Sparkles size={11} /> Featured
            </span>
          )}
        </div>

        {isLoggedIn && (
          <button
            type="button"
            className={`res-card-bookmark-btn ${isBookmarked ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation()
              onBookmarkToggle && onBookmarkToggle(id)
            }}
            title={isBookmarked ? 'Remove Bookmark' : 'Save Resource'}
            aria-label="Toggle bookmark"
          >
            <Bookmark size={15} fill={isBookmarked ? '#38bdf8' : 'none'} />
          </button>
        )}
      </div>

      <div className="res-card-content">
        <h3 className="res-card-title">{title}</h3>
        <p className="res-card-description">{description}</p>

        {/* Curriculum Topics */}
        {visibleItems.length > 0 && (
          <div className="res-topic-pills">
            {visibleItems.map((item, idx) => (
              <span className="res-topic-pill" key={idx}>
                {item}
              </span>
            ))}
            {remainingCount > 0 && (
              <span className="res-topic-pill more">+{remainingCount} more</span>
            )}
          </div>
        )}

        {/* Downloadable Files Showcase */}
        {files.length > 0 && (
          <div
            className="res-card-download-box"
            onClick={(e) => handleDownloadClick(e, files[0]?.url)}
            title="View or download files"
          >
            <div className="res-download-box-left">
              <div className="res-download-icon-circle">
                <Download size={14} />
              </div>
              <div className="res-download-box-info">
                <div className="res-download-box-title">
                  <span>{files.length === 1 ? files[0].name : `${files.length} Downloadable Files`}</span>
                </div>
                <div className="res-download-box-sub">
                  {files.slice(0, 2).map((f, i) => {
                    const badge = getFileFormatBadge(f.format)
                    return (
                      <span className="res-download-file-chip" key={i}>
                        {badge.icon}
                        <span>{badge.label}</span>
                        {f.size && <span className="dim">({f.size})</span>}
                      </span>
                    )
                  })}
                  {files.length > 2 && (
                    <span className="res-download-file-chip dim">
                      +{files.length - 2} more
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              type="button"
              className="res-download-trigger-btn"
              onClick={(e) => handleDownloadClick(e, files[0]?.url)}
            >
              <span>{files.length === 1 ? 'Download' : 'View Files'}</span>
              <ChevronRight size={13} />
            </button>
          </div>
        )}

        {/* Web Links */}
        {links.length > 0 && (
          <div className="res-card-links-row">
            {links.slice(0, 2).map((link, idx) => (
              <a
                key={idx}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="res-card-link-pill"
                onClick={(e) => e.stopPropagation()}
              >
                {getLinkIcon(link.type)}
                <span>{link.title}</span>
                <ExternalLink size={10} className="res-card-ext-icon" />
              </a>
            ))}
            {links.length > 2 && (
              <span className="res-card-link-pill extra">
                +{links.length - 2} portals
              </span>
            )}
          </div>
        )}
      </div>

      <div className="res-card-footer">
        <div className="res-card-curator">
          <span>Curator:</span>
          <strong>{authorName}</strong>
        </div>

        <div className="res-card-metrics">
          <span className="res-card-metric" title="Views">
            <Eye size={12} />
            <span>{viewsCount}</span>
          </span>
          {downloadCount > 0 && (
            <span className="res-card-metric" title="Downloads">
              <Download size={12} />
              <span>{downloadCount}</span>
            </span>
          )}
        </div>
      </div>
    </article>
  )
}
