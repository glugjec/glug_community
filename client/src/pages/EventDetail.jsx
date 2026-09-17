import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  Video,
  Globe,
  Share2,
  ChevronLeft,
  ExternalLink,
  Users,
  Layers,
  FileText,
  CheckCircle2,
  Image as ImageIcon,
  AlertCircle,
} from 'lucide-react';
import { eventsApi } from '../api.js';
import EventLightbox from '../components/events/EventLightbox.jsx';
import MarkdownRenderer from '../components/common/MarkdownRenderer.jsx';
import './EventDetail.css';

function GithubIcon({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
    </svg>
  );
}

function LinkedinIcon({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

function formatEventDate(dateString) {
  if (!dateString) return '';
  const d = new Date(dateString);
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function generateGoogleCalendarUrl(event) {
  const start = new Date(event.startDate).toISOString().replace(/-|:|\.\d\d\d/g, '');
  const end = event.endDate
    ? new Date(event.endDate).toISOString().replace(/-|:|\.\d\d\d/g, '')
    : new Date(new Date(event.startDate).getTime() + 2 * 60 * 60 * 1000)
        .toISOString()
        .replace(/-|:|\.\d\d\d/g, '');

  const text = encodeURIComponent(event.title);
  const details = encodeURIComponent(event.tagline || event.description?.slice(0, 300) || '');
  const location = encodeURIComponent(
    event.locationType === 'virtual'
      ? event.virtualLink || 'Online Event'
      : event.venue || 'GLUG Campus'
  );

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${start}/${end}&details=${details}&location=${location}`;
}

function downloadIcsFile(event) {
  const start = new Date(event.startDate).toISOString().replace(/-|:|\.\d\d\d/g, '');
  const end = event.endDate
    ? new Date(event.endDate).toISOString().replace(/-|:|\.\d\d\d/g, '')
    : new Date(new Date(event.startDate).getTime() + 2 * 60 * 60 * 1000)
        .toISOString()
        .replace(/-|:|\.\d\d\d/g, '');

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//GLUG//Community Events//EN',
    'BEGIN:VEVENT',
    `UID:${event._id}@glug.dev`,
    `DTSTAMP:${start}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${event.tagline || ''}`,
    `LOCATION:${event.locationType === 'virtual' ? event.virtualLink || 'Online' : event.venue || ''}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute('download', `${event.slug || 'event'}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export default function EventDetail() {
  const { id, idOrSlug } = useParams();
  const eventParam = idOrSlug || id;
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shareToast, setShareToast] = useState('');
  const [calendarMenuOpen, setCalendarMenuOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  useEffect(() => {
    async function loadEvent() {
      try {
        setLoading(true);
        setError(null);
        const res = await eventsApi.get(eventParam);
        if (res?.event) {
          setEvent(res.event);
        } else {
          setError('Event not found');
        }
      } catch (err) {
        setError(err.message || 'Failed to load event details');
      } finally {
        setLoading(false);
      }
    }
    if (eventParam) {
      loadEvent();
    }
  }, [eventParam]);

  const handleShare = async () => {
    const currentUrl = window.location.href;
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(currentUrl);
      setShareToast('Event link copied to clipboard!');
      setTimeout(() => setShareToast(''), 3000);
    }
  };

  const handleOpenLightbox = (index) => {
    setActivePhotoIdx(index);
    setLightboxOpen(true);
  };

  if (loading) {
    return (
      <div className="event-detail-loading-state">
        <div className="event-detail-spinner" />
        <p>Loading event information...</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="event-detail-error-state">
        <AlertCircle size={44} className="text-danger" />
        <h2>{error || 'Event Not Found'}</h2>
        <p>The event you are looking for does not exist or has been removed.</p>
        <Link to="/events" className="event-btn-back">
          <ChevronLeft size={16} />
          <span>Back to All Events</span>
        </Link>
      </div>
    );
  }

  const isPast = new Date(event.startDate) < new Date();
  const hasGallery = Array.isArray(event.gallery) && event.gallery.length > 0;

  return (
    <div className="event-detail-page">
      {shareToast && (
        <div className="event-detail-toast">
          <CheckCircle2 size={16} />
          <span>{shareToast}</span>
        </div>
      )}

      {lightboxOpen && hasGallery && (
        <EventLightbox
          images={event.gallery}
          currentIndex={activePhotoIdx}
          onClose={() => setLightboxOpen(false)}
          onIndexChange={setActivePhotoIdx}
        />
      )}

      <div className="event-hero-banner-area">
        {event.bannerUrl && (
          <div
            className="event-hero-ambient-bg"
            style={{ backgroundImage: `url(${event.bannerUrl})` }}
          />
        )}

        <div className="event-hero-banner-container">
          <div className="event-detail-breadcrumbs">
            <Link to="/events" className="breadcrumb-link">
              <ChevronLeft size={15} />
              <span>Events Hub</span>
            </Link>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-current">{event.title}</span>
          </div>

          <div className="event-hero-media-box">
            {event.bannerUrl ? (
              <img src={event.bannerUrl} alt={event.title} className="event-hero-banner-img" />
            ) : (
              <div className="event-hero-banner-fallback">
                <Calendar size={64} />
              </div>
            )}

            <div className="event-hero-status-tag">
              {isPast ? (
                <span className="status-badge past">Event Concluded · Recap</span>
              ) : (
                <span className="status-badge upcoming">Upcoming Event</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="event-detail-main-layout">
        <div className="event-detail-content-col">
          <div className="event-title-header">
            <div className="event-category-pill">{event.category}</div>
            <h1 className="event-main-title">{event.title}</h1>
            {event.tagline && <p className="event-main-tagline">{event.tagline}</p>}
          </div>

          <div className="event-action-bar">
            <div className="event-action-bar-left">
              {!isPast && (
                <div className="event-calendar-dropdown-wrap">
                  <button
                    type="button"
                    className="event-btn-action"
                    onClick={() => setCalendarMenuOpen(!calendarMenuOpen)}
                  >
                    <Calendar size={16} />
                    <span>Add to Calendar</span>
                  </button>

                  {calendarMenuOpen && (
                    <div className="event-calendar-dropdown">
                      <a
                        href={generateGoogleCalendarUrl(event)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="dropdown-link"
                        onClick={() => setCalendarMenuOpen(false)}
                      >
                        Google Calendar
                      </a>
                      <button
                        type="button"
                        className="dropdown-link"
                        onClick={() => {
                          downloadIcsFile(event);
                          setCalendarMenuOpen(false);
                        }}
                      >
                        iCal / Outlook (.ics)
                      </button>
                    </div>
                  )}
                </div>
              )}

              <button type="button" className="event-btn-action" onClick={handleShare}>
                <Share2 size={16} />
                <span>Share</span>
              </button>
            </div>

            <div className="event-action-bar-right">
              {event.registration?.enabled && !isPast && (
                <a
                  href={event.registration.url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="event-btn-register"
                >
                  <span>Register for Event</span>
                  <ExternalLink size={15} />
                </a>
              )}
            </div>
          </div>

          <section className="event-content-section">
            <h2 className="section-title">
              <FileText size={20} />
              <span>About this Event</span>
            </h2>
            <div className="event-rich-body">
              <MarkdownRenderer content={event.description || ''} />
            </div>
          </section>

          {event.speakers && event.speakers.length > 0 && (
            <section className="event-content-section">
              <h2 className="section-title">
                <Users size={20} />
                <span>Speakers & Organizers</span>
              </h2>

              <div className="event-speakers-grid">
                {event.speakers.map((speaker, idx) => (
                  <div key={idx} className="event-speaker-card">
                    <img
                      src={
                        speaker.avatar ||
                        `https://api.dicebear.com/7.x/identicon/svg?seed=${speaker.name}`
                      }
                      alt={speaker.name}
                      className="speaker-avatar"
                    />
                    <div className="speaker-info">
                      <h3 className="speaker-name">{speaker.name}</h3>
                      <p className="speaker-role">
                        {speaker.role}
                        {speaker.company ? ` · ${speaker.company}` : ''}
                      </p>
                      {speaker.bio && <p className="speaker-bio">{speaker.bio}</p>}

                      <div className="speaker-links">
                        {speaker.github && (
                          <a
                            href={speaker.github}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="speaker-social-btn"
                          >
                            <GithubIcon size={15} />
                          </a>
                        )}
                        {speaker.linkedin && (
                          <a
                            href={speaker.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="speaker-social-btn"
                          >
                            <LinkedinIcon size={15} />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {hasGallery && (
            <section className="event-content-section">
              <div className="section-header-row">
                <h2 className="section-title">
                  <ImageIcon size={20} />
                  <span>Photo Showcase & Recap</span>
                </h2>
                <span className="gallery-count-pill">{event.gallery.length} Photos</span>
              </div>

              <div className="event-bento-gallery">
                {event.gallery.map((photo, pIdx) => {
                  const isLarge = pIdx === 0 && event.gallery.length >= 3;
                  return (
                    <div
                      key={pIdx}
                      className={`bento-gallery-item ${isLarge ? 'item-large' : ''}`}
                      onClick={() => handleOpenLightbox(pIdx)}
                    >
                      <img src={photo.url} alt={photo.caption || ''} loading="lazy" />
                      <div className="bento-gallery-overlay">
                        {photo.caption && <p className="bento-caption">{photo.caption}</p>}
                        <span className="bento-zoom-icon">
                          <ImageIcon size={16} />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>

        <aside className="event-detail-sidebar-col">
          <div className="event-sidebar-card">
            <h3 className="sidebar-card-title">Event Logistics</h3>

            <div className="logistics-list">
              <div className="logistics-item">
                <Calendar size={18} className="logistics-icon" />
                <div className="logistics-text">
                  <span className="logistics-label">Date</span>
                  <span className="logistics-value">{formatEventDate(event.startDate)}</span>
                </div>
              </div>

              {event.time && (
                <div className="logistics-item">
                  <Clock size={18} className="logistics-icon" />
                  <div className="logistics-text">
                    <span className="logistics-label">Time</span>
                    <span className="logistics-value">{event.time}</span>
                  </div>
                </div>
              )}

              <div className="logistics-item">
                {event.locationType === 'virtual' ? (
                  <Video size={18} className="logistics-icon" />
                ) : event.locationType === 'hybrid' ? (
                  <Globe size={18} className="logistics-icon" />
                ) : (
                  <MapPin size={18} className="logistics-icon" />
                )}
                <div className="logistics-text">
                  <span className="logistics-label">Location Type</span>
                  <span className="logistics-value text-capitalize">
                    {event.locationType || 'In-Person'}
                  </span>
                </div>
              </div>

              {event.locationType !== 'virtual' && event.venue && (
                <div className="logistics-item">
                  <MapPin size={18} className="logistics-icon" />
                  <div className="logistics-text">
                    <span className="logistics-label">Venue</span>
                    <span className="logistics-value">{event.venue}</span>
                    {event.mapUrl && (
                      <a
                        href={event.mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="logistics-map-link"
                      >
                        View on Map <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                </div>
              )}

              {event.virtualLink && (
                <div className="logistics-item">
                  <Video size={18} className="logistics-icon" />
                  <div className="logistics-text">
                    <span className="logistics-label">Online Link</span>
                    <a
                      href={event.virtualLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="logistics-meeting-link"
                    >
                      Join Virtual Room <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              )}
            </div>

            {event.registration?.enabled && (
              <div className="registration-box">
                <div className="reg-status-row">
                  <span className="reg-badge-active">Registration Open</span>
                  {event.registration.capacity > 0 && (
                    <span className="reg-capacity">Capacity: {event.registration.capacity}</span>
                  )}
                </div>
                {!isPast && (
                  <a
                    href={event.registration.url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="reg-submit-btn"
                  >
                    Register Now
                  </a>
                )}
              </div>
            )}
          </div>

          {event.resources && event.resources.length > 0 && (
            <div className="event-sidebar-card">
              <h3 className="sidebar-card-title">Event Resources</h3>
              <div className="event-resources-list">
                {event.resources.map((res, rIdx) => (
                  <a
                    key={rIdx}
                    href={res.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="event-resource-link"
                  >
                    <div className="resource-meta">
                      <span className="resource-label">{res.label}</span>
                      <span className="resource-type">{res.type}</span>
                    </div>
                    <ExternalLink size={14} />
                  </a>
                ))}
              </div>
            </div>
          )}

          {event.tags && event.tags.length > 0 && (
            <div className="event-sidebar-card">
              <h3 className="sidebar-card-title">Topics & Tags</h3>
              <div className="event-tags-cloud">
                {event.tags.map((tag, tIdx) => (
                  <span key={tIdx} className="event-topic-tag">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
