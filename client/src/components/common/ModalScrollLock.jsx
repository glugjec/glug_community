import { useEffect, useRef } from 'react'

const MODAL_SELECTORS = [
  '.res-modal-backdrop',
  '.confirm-delete-overlay',
  '.report-modal-overlay',
  '.forum-modal-backdrop',
  '.terminal-modal-backdrop',
  '.admin-modal-overlay',
  '.admin-confirm-overlay',
  '.modal-backdrop',
  '.event-lightbox-overlay',
  '.ban-modal-backdrop',
  '.rte-link-modal-overlay'
].join(', ')

const DIALOG_SELECTORS = [
  '.res-modal-sheet',
  '.confirm-delete-card',
  '.report-modal-dialog',
  '.forum-modal',
  '.terminal-modal',
  '.admin-modal-box',
  '.admin-modal-sheet',
  '.admin-modal-sheet-body',
  '.admin-modal-window',
  '.modal-container',
  '.profile-edit-modal',
  '.settings-appeal-modal',
  '.event-lightbox-content',
  '.ban-modal-card',
  '.rte-link-modal',
  '[role="dialog"]'
].join(', ')

export default function ModalScrollLock() {
  const isLockedRef = useRef(false)
  const savedScrollYRef = useRef(0)

  useEffect(() => {
    const updateLock = () => {
      const hasModal = Boolean(document.querySelector(MODAL_SELECTORS))

      if (hasModal && !isLockedRef.current) {
        savedScrollYRef.current = window.scrollY || document.documentElement.scrollTop || 0
        document.body.classList.add('glug-modal-open')
        document.body.style.overflow = 'hidden'
        isLockedRef.current = true
      } else if (!hasModal && isLockedRef.current) {
        document.body.classList.remove('glug-modal-open')
        document.body.style.overflow = ''
        const restoreY = savedScrollYRef.current
        isLockedRef.current = false
        if (typeof restoreY === 'number') {
          window.scrollTo({ top: restoreY, left: 0, behavior: 'instant' })
        }
      }
    }

    updateLock()

    const observer = new MutationObserver(() => {
      updateLock()
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true
    })

    const handleWheelOrTouch = (e) => {
      if (!isLockedRef.current) return
      if (e.target && typeof e.target.matches === 'function') {
        if (e.target.matches(MODAL_SELECTORS)) {
          e.preventDefault()
          return
        }
      }
      if (e.target && typeof e.target.closest === 'function') {
        const isInsideOverlay = Boolean(e.target.closest(MODAL_SELECTORS))
        const isInsideDialog = Boolean(e.target.closest(DIALOG_SELECTORS))
        if (isInsideOverlay && !isInsideDialog) {
          e.preventDefault()
        }
      }
    }

    window.addEventListener('wheel', handleWheelOrTouch, { passive: false })
    window.addEventListener('touchmove', handleWheelOrTouch, { passive: false })

    return () => {
      observer.disconnect()
      window.removeEventListener('wheel', handleWheelOrTouch)
      window.removeEventListener('touchmove', handleWheelOrTouch)
      if (isLockedRef.current) {
        document.body.classList.remove('glug-modal-open')
        document.body.style.overflow = ''
      }
    }
  }, [])

  return null
}
