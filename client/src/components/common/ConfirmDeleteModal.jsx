import { useEffect, useRef } from 'react'
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react'
import './ConfirmDeleteModal.css'

function formatItemPreview(text) {
  if (!text) return ''
  let cleaned = String(text)
    .replace(/<img[^>]*>/gi, ' [Image] ')
    .replace(/!\[.*?\]\(.*?\)/g, ' [Image] ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/[`#*~_>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  if (!cleaned && (text.includes('<img') || text.includes('!['))) {
    return '[Image]'
  }
  if (!cleaned) return ''
  return cleaned.length > 120 ? cleaned.slice(0, 120) + '...' : cleaned
}

export default function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Deletion',
  description = 'Are you sure you want to delete this item? This action cannot be undone.',
  itemTitle,
  warningNote,
  confirmText = 'Delete Permanently',
  cancelText = 'Cancel',
  isDeleting = false
}) {
  const previewText = formatItemPreview(itemTitle)
  const overlayRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return

    const scrollY = window.scrollY || document.documentElement.scrollTop || 0
    document.body.classList.add('glug-modal-open')
    const prevBodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const overlay = overlayRef.current
    const preventBackdropScroll = (e) => {
      if (e.target === overlay) {
        e.preventDefault()
      }
    }

    if (overlay) {
      overlay.addEventListener('wheel', preventBackdropScroll, { passive: false })
      overlay.addEventListener('touchmove', preventBackdropScroll, { passive: false })
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isDeleting) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.classList.remove('glug-modal-open')
      document.body.style.overflow = prevBodyOverflow

      if (overlay) {
        overlay.removeEventListener('wheel', preventBackdropScroll)
        overlay.removeEventListener('touchmove', preventBackdropScroll)
      }
      window.removeEventListener('keydown', handleKeyDown)

      if (typeof scrollY === 'number') {
        window.scrollTo({ top: scrollY, left: 0, behavior: 'instant' })
      }
    }
  }, [isOpen, isDeleting, onClose])

  if (!isOpen) return null

  return (
    <div ref={overlayRef} className="confirm-delete-overlay" onClick={isDeleting ? undefined : onClose}>
      <div
        className="confirm-delete-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-delete-title"
      >
        <button
          type="button"
          className="confirm-delete-close"
          onClick={onClose}
          disabled={isDeleting}
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <div className="confirm-delete-header">
          <div className="confirm-delete-icon-badge">
            <Trash2 size={24} className="confirm-delete-trash-icon" />
          </div>
          <div className="confirm-delete-title-wrap">
            <h3 id="confirm-delete-title" className="confirm-delete-title">
              {title}
            </h3>
            <p className="confirm-delete-desc">{description}</p>
          </div>
        </div>

        {previewText && (
          <div className="confirm-delete-item-preview">
            <span className="confirm-delete-item-name">{previewText}</span>
          </div>
        )}

        <div className="confirm-delete-warning-box">
          <AlertTriangle size={18} className="confirm-delete-warning-icon" />
          <div className="confirm-delete-warning-text">
            <strong>Warning:</strong> {warningNote || 'This action is permanent and cannot be reversed.'}
          </div>
        </div>

        <div className="confirm-delete-actions">
          <button
            type="button"
            className="confirm-delete-btn confirm-delete-btn-cancel"
            onClick={onClose}
            disabled={isDeleting}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className="confirm-delete-btn confirm-delete-btn-danger"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 size={16} className="btn-spinner" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 size={16} />
                <span>{confirmText}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
