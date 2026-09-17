import { useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Download, ExternalLink } from 'lucide-react';
import './EventLightbox.css';

export default function EventLightbox({ images = [], currentIndex = 0, onClose, onIndexChange }) {
  const current = images[currentIndex] || null;

  const handlePrev = useCallback(() => {
    if (images.length <= 1) return;
    const nextIdx = (currentIndex - 1 + images.length) % images.length;
    onIndexChange(nextIdx);
  }, [currentIndex, images.length, onIndexChange]);

  const handleNext = useCallback(() => {
    if (images.length <= 1) return;
    const nextIdx = (currentIndex + 1) % images.length;
    onIndexChange(nextIdx);
  }, [currentIndex, images.length, onIndexChange]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [onClose, handlePrev, handleNext]);

  if (!current) return null;

  return (
    <div className="event-lightbox-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="event-lightbox-content" onClick={(e) => e.stopPropagation()}>
        <div className="event-lightbox-topbar">
          <div className="event-lightbox-counter">
            {currentIndex + 1} / {images.length}
          </div>
          <div className="event-lightbox-actions">
            <a
              href={current.url}
              target="_blank"
              rel="noopener noreferrer"
              className="event-lightbox-action-btn"
              title="Open full size"
            >
              <ExternalLink size={18} />
            </a>
            <a
              href={current.url}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="event-lightbox-action-btn"
              title="Download image"
            >
              <Download size={18} />
            </a>
            <button
              type="button"
              className="event-lightbox-action-btn close-btn"
              onClick={onClose}
              title="Close viewer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="event-lightbox-main">
          {images.length > 1 && (
            <button
              type="button"
              className="event-lightbox-nav prev"
              onClick={handlePrev}
              aria-label="Previous photo"
            >
              <ChevronLeft size={28} />
            </button>
          )}

          <div className="event-lightbox-img-wrapper">
            <img
              src={current.url}
              alt={current.caption || `Event photo ${currentIndex + 1}`}
              className="event-lightbox-img"
            />
          </div>

          {images.length > 1 && (
            <button
              type="button"
              className="event-lightbox-nav next"
              onClick={handleNext}
              aria-label="Next photo"
            >
              <ChevronRight size={28} />
            </button>
          )}
        </div>

        {current.caption && (
          <div className="event-lightbox-caption">
            <p>{current.caption}</p>
          </div>
        )}
      </div>
    </div>
  );
}
