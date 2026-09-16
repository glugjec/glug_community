import { useState } from 'react'
import {
  X,
  Download,
  ExternalLink,
  FileText,
  FileArchive,
  Code,
  Disc,
  Book,
  File,
  Bookmark,
  Share2,
  Check,
  GraduationCap,
  Terminal,
  FolderGit2,
  Sparkles,
  Layers,
  Eye,
  CheckCircle2,
} from 'lucide-react'
import { resourcesApi } from '../../api.js'
import { useAuth } from '../../context/AuthContext.jsx'

function getFileIcon(format) {
  switch (format) {
    case 'pdf':
    case 'doc':
      return <FileText size={18} />
    case 'zip':
    case 'archive':
      return <FileArchive size={18} />
    case 'code':
      return <Code size={18} />
    case 'iso':
      return <Disc size={18} />
    case 'epub':
      return <Book size={18} />
    default:
      return <File size={18} />
  }
}

function getLinkIcon(type) {
  switch (type) {
    case 'course':
      return <GraduationCap size={16} />
    case 'book':
      return <Book size={16} />
    case 'interactive':
      return <Terminal size={16} />
    case 'repo':
      return <FolderGit2 size={16} />
    case 'tool':
      return <Code size={16} />
    default:
      return <ExternalLink size={16} />
  }
}

export default function ResourceDetailModal({
  resource,
  onClose,
  onBookmarkToggle,
}) {
  const { user } = useAuth()
  const [copied, setCopied] = useState(false)
  const [downloadCount, setDownloadCount] = useState(resource?.downloadCount || 0)

  if (!resource) return null

  const files = Array.isArray(resource.files) ? resource.files : []
  const links = Array.isArray(resource.links) ? resource.links : []
  const items = Array.isArray(resource.items) ? resource.items : []

  const handleDownloadClick = async (fileUrl) => {
    try {
      resourcesApi.trackDownload(resource.id)
      setDownloadCount((prev) => prev + 1)
    } catch {
      // Telemetry error ignored
    }
    window.open(fileUrl, '_blank', 'noopener,noreferrer')
  }

  const handleCopyLink = () => {
    const url = `${window.location.origin}/resources?q=${encodeURIComponent(resource.title)}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="res-modal-backdrop" onClick={onClose}>
      <div className="res-modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="res-modal-header">
          <div className="res-modal-tags">
            <span className="res-pill category">#{resource.category}</span>
            {resource.difficulty && resource.difficulty !== 'all-levels' && (
              <span className={`res-pill difficulty ${resource.difficulty}`}>
                {resource.difficulty}
              </span>
            )}
            {resource.isFeatured && (
              <span className="res-pill featured">
                <Sparkles size={12} /> Featured Track
              </span>
            )}
          </div>

          <button
            type="button"
            className="res-icon-btn close"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>

        <div className="res-modal-body">
          <h2 className="res-modal-title">{resource.title}</h2>
          <p className="res-modal-desc">{resource.description}</p>

          <div className="res-modal-meta-row">
            <span className="res-meta-item">
              Curated by{' '}
              <strong className="res-author">
                {resource.author?.username
                  ? `@${resource.author.username}`
                  : resource.author?.name
                  ? `@${resource.author.name}`
                  : 'Admin'}
              </strong>
            </span>
            <span className="res-meta-dot">•</span>
            <span className="res-meta-item">
              <Eye size={13} /> {resource.viewsCount || 0} views
            </span>
            {(downloadCount > 0 || files.length > 0) && (
              <>
                <span className="res-meta-dot">•</span>
                <span className="res-meta-item">
                  <Download size={13} /> {downloadCount} downloads
                </span>
              </>
            )}
          </div>

          {/* Download Center Section */}
          {files.length > 0 && (
            <section className="res-section download-center">
              <div className="res-section-title-wrap">
                <div className="res-section-icon-wrap download">
                  <Download size={18} />
                </div>
                <div>
                  <h3 className="res-section-title">
                    Downloadable Files & Materials ({files.length})
                  </h3>
                  <p className="res-section-sub">
                    Cloud mirrors for offline study, lab exercises, and starter source code.
                  </p>
                </div>
              </div>

              <div className="res-files-grid">
                {files.map((file, idx) => (
                  <div className="res-file-card" key={idx}>
                    <div className="res-file-card-main">
                      <div className={`res-file-format-icon ${file.format || 'other'}`}>
                        {getFileIcon(file.format)}
                      </div>
                      <div className="res-file-details">
                        <h4 className="res-file-name">{file.name}</h4>
                        <div className="res-file-sub-row">
                          <span className="res-file-format-badge">
                            {(file.format || 'FILE').toUpperCase()}
                          </span>
                          {file.size && (
                            <span className="res-file-size-badge">{file.size}</span>
                          )}
                          {file.description && (
                            <span className="res-file-note">{file.description}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="res-download-action-btn"
                      onClick={() => handleDownloadClick(file.url)}
                      title="Open external download link"
                    >
                      <Download size={14} />
                      <span>Download</span>
                      <ExternalLink size={12} className="res-ext-icon" />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Curriculum Subtopics */}
          {items.length > 0 && (
            <section className="res-section">
              <div className="res-section-title-wrap">
                <div className="res-section-icon-wrap curriculum">
                  <Layers size={18} />
                </div>
                <div>
                  <h3 className="res-section-title">Curriculum Topics & Key Concepts</h3>
                  <p className="res-section-sub">
                    Core subjects, architectures, and practical competencies covered.
                  </p>
                </div>
              </div>

              <div className="res-topics-checklist">
                {items.map((item, idx) => (
                  <div className="res-topic-item" key={idx}>
                    <CheckCircle2 size={16} className="res-topic-check" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* External Links */}
          {links.length > 0 && (
            <section className="res-section">
              <div className="res-section-title-wrap">
                <div className="res-section-icon-wrap portals">
                  <ExternalLink size={18} />
                </div>
                <div>
                  <h3 className="res-section-title">
                    Official Portals & Learning Tracks ({links.length})
                  </h3>
                  <p className="res-section-sub">
                    Authoritative web documentation, video courses, and code repositories.
                  </p>
                </div>
              </div>

              <div className="res-links-grid">
                {links.map((link, idx) => (
                  <a
                    key={idx}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="res-portal-link-card"
                  >
                    <div className="res-portal-icon">{getLinkIcon(link.type)}</div>
                    <div className="res-portal-info">
                      <span className="res-portal-title">{link.title}</span>
                      <span className="res-portal-type">
                        {(link.type || 'link').toUpperCase()}
                      </span>
                    </div>
                    <ExternalLink size={14} className="res-portal-arrow" />
                  </a>
                ))}
              </div>
            </section>
          )}
        </div>

        <div className="res-modal-footer">
          <div className="res-footer-left">
            <button
              type="button"
              className="res-footer-btn"
              onClick={handleCopyLink}
            >
              {copied ? <Check size={15} /> : <Share2 size={15} />}
              <span>{copied ? 'Copied Link' : 'Share Resource'}</span>
            </button>

            {user && (
              <button
                type="button"
                className={`res-footer-btn ${resource.isBookmarked ? 'active' : ''}`}
                onClick={() => onBookmarkToggle && onBookmarkToggle(resource.id)}
              >
                <Bookmark
                  size={15}
                  fill={resource.isBookmarked ? '#38bdf8' : 'none'}
                />
                <span>{resource.isBookmarked ? 'Saved' : 'Bookmark'}</span>
              </button>
            )}
          </div>

          <button
            type="button"
            className="res-primary-btn"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
