import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Calendar,
  MapPin,
  Video,
  Globe,
  Clock,
  Search,
  X,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Layers,
  Image as ImageIcon,
  CheckCircle2,
  Share2,
} from 'lucide-react';
import { eventsApi } from '../api.js';
import './Events.css';

const CATEGORIES = [
  { id: 'all', label: 'All Categories' },
  { id: 'workshop', label: 'Workshops' },
  { id: 'hackathon', label: 'Hackathons' },
  { id: 'installation-drive', label: 'Linux Drives' },
  { id: 'talk', label: 'Tech Talks' },
  { id: 'meetup', label: 'Meetups' },
];

function formatEventDate(dateString) {
  if (!dateString) return { month: '', day: '', weekday: '', year: '' };
  const d = new Date(dateString);
  const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
  const day = d.getDate();
  const weekday = d.toLocaleString('en-US', { weekday: 'short' });
  const year = d.getFullYear();
  return { month, day, weekday, year };
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

export default function Events() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'upcoming';
  const currentCategory = searchParams.get('category') || 'all';

  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({ total: 0, upcoming: 0, past: 0, totalPhotos: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [calendarMenuOpen, setCalendarMenuOpen] = useState(null);
  const [shareToast, setShareToast] = useState('');

  const fetchEventsAndStats = async () => {
    try {
      setLoading(true);
      const [eventsRes, statsRes] = await Promise.all([
        eventsApi.list({
          type: currentTab,
          category: currentCategory !== 'all' ? currentCategory : undefined,
          search: searchQuery.trim() || undefined,
          limit: 30,
        }),
        eventsApi.getStats(),
      ]);

      setEvents(eventsRes?.events || []);
      if (statsRes) {
        setStats(statsRes);
      }
    } catch (err) {
      console.error('Failed to load events', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventsAndStats();
  }, [currentTab, currentCategory]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchEventsAndStats();
  };

  const handleTabChange = (tab) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('tab', tab);
    setSearchParams(nextParams);
  };

  const handleCategoryChange = (cat) => {
    const nextParams = new URLSearchParams(searchParams);
    if (cat === 'all') {
      nextParams.delete('category');
    } else {
      nextParams.set('category', cat);
    }
    setSearchParams(nextParams);
  };

  const handleShare = async (e, event) => {
    e.preventDefault();
    e.stopPropagation();
    const eventUrl = `${window.location.origin}/events/${event.slug || event._id}`;
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(eventUrl);
      setShareToast('Link copied to clipboard!');
      setTimeout(() => setShareToast(''), 3000);
    }
  };

  return (
    <div className="events-hub-page">
      {shareToast && (
        <div className="events-toast">
          <CheckCircle2 size={16} />
          <span>{shareToast}</span>
        </div>
      )}

      <header className="events-hero-section">
        <div className="events-hero-glow" />
        <div className="events-hero-container">
          <div className="events-hero-badge">
            <Sparkles size={14} />
            <span>Community Gatherings & Knowledge Sharing</span>
          </div>

          <h1 className="events-hero-title">
            GLUG Events <span className="events-gradient-text">& Workshops</span>
          </h1>

          <p className="events-hero-subtitle">
            Explore hands-on Linux workshops, open source hackathons, guest lectures, and student
            meetups designed to foster software freedom and deep technical collaboration.
          </p>

          <div className="events-hero-stats">
            <div className="events-stat-pill">
              <span className="stat-number">{stats.upcoming || 0}</span>
              <span className="stat-label">Upcoming Events</span>
            </div>
            <div className="events-stat-pill">
              <span className="stat-number">{stats.past || 0}</span>
              <span className="stat-label">Past Meetups</span>
            </div>
            <div className="events-stat-pill">
              <span className="stat-number">{stats.totalPhotos || 0}</span>
              <span className="stat-label">Photo Recaps</span>
            </div>
          </div>
        </div>
      </header>

      <section className="events-control-bar">
        <div className="events-control-container">
          <div className="events-tabs-wrapper" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={currentTab === 'upcoming'}
              className={`events-tab-pill ${currentTab === 'upcoming' ? 'active' : ''}`}
              onClick={() => handleTabChange('upcoming')}
            >
              <Calendar size={16} />
              <span>Upcoming</span>
              <span className="events-count-badge">{stats.upcoming || 0}</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={currentTab === 'past'}
              className={`events-tab-pill ${currentTab === 'past' ? 'active' : ''}`}
              onClick={() => handleTabChange('past')}
            >
              <Layers size={16} />
              <span>Past & Recaps</span>
              <span className="events-count-badge">{stats.past || 0}</span>
            </button>
          </div>

          <div className="events-search-filter-row">
            <form onSubmit={handleSearchSubmit} className="events-search-box">
              <Search size={16} className="events-search-icon" />
              <input
                type="text"
                placeholder="Search events by title, venue, or topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="events-search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="events-search-clear"
                  onClick={() => {
                    setSearchQuery('');
                    setTimeout(fetchEventsAndStats, 0);
                  }}
                  title="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </form>

            <div className="events-category-scroll">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  className={`events-category-chip ${currentCategory === cat.id ? 'active' : ''}`}
                  onClick={() => handleCategoryChange(cat.id)}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <main className="events-cards-section">
        <div className="events-cards-container">
          {loading ? (
            <div className="events-loading-grid">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="event-skeleton-card">
                  <div className="skeleton-banner" />
                  <div className="skeleton-content">
                    <div className="skeleton-line w-40" />
                    <div className="skeleton-line w-80" />
                    <div className="skeleton-line w-60" />
                  </div>
                </div>
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="events-empty-state">
              <div className="events-empty-icon">
                <Calendar size={36} />
              </div>
              <h3>No Events Found</h3>
              <p>
                {searchQuery
                  ? `No events matching "${searchQuery}". Try a different keyword.`
                  : currentTab === 'upcoming'
                  ? 'There are currently no upcoming events scheduled. Stay tuned or check past recaps!'
                  : 'No past events found in this category.'}
              </p>
              {searchQuery && (
                <button
                  type="button"
                  className="events-btn-secondary"
                  onClick={() => {
                    setSearchQuery('');
                    setTimeout(fetchEventsAndStats, 0);
                  }}
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="events-cards-grid">
              {events.map((evt) => {
                const dateObj = formatEventDate(evt.startDate);
                const isPast = new Date(evt.startDate) < new Date();
                const hasGallery = evt.gallery && evt.gallery.length > 0;

                return (
                  <article key={evt._id} className="event-modern-card">
                    <Link to={`/events/${evt.slug || evt._id}`} className="event-card-media-link">
                      <div className="event-card-banner-wrapper">
                        {evt.bannerUrl ? (
                          <img
                            src={evt.bannerUrl}
                            alt={evt.title}
                            className="event-card-banner"
                            loading="lazy"
                          />
                        ) : (
                          <div className="event-card-banner-placeholder">
                            <Calendar size={42} />
                          </div>
                        )}

                        <div className="event-card-media-overlay">
                          <span className={`event-badge-location ${evt.locationType}`}>
                            {evt.locationType === 'virtual' ? (
                              <>
                                <Video size={13} /> Virtual
                              </>
                            ) : evt.locationType === 'hybrid' ? (
                              <>
                                <Globe size={13} /> Hybrid
                              </>
                            ) : (
                              <>
                                <MapPin size={13} /> In-Person
                              </>
                            )}
                          </span>

                          {hasGallery && (
                            <span className="event-badge-gallery">
                              <ImageIcon size={13} /> {evt.gallery.length} Photos
                            </span>
                          )}
                        </div>

                        <div className="event-date-pill">
                          <span className="date-month">{dateObj.month}</span>
                          <span className="date-day">{dateObj.day}</span>
                          <span className="date-weekday">{dateObj.weekday}</span>
                        </div>
                      </div>
                    </Link>

                    <div className="event-card-body">
                      <div className="event-card-meta-top">
                        <span className="event-category-tag">{evt.category}</span>
                        {evt.time && (
                          <span className="event-time-tag">
                            <Clock size={13} /> {evt.time}
                          </span>
                        )}
                      </div>

                      <h2 className="event-card-title">
                        <Link to={`/events/${evt.slug || evt._id}`}>{evt.title}</Link>
                      </h2>

                      {evt.tagline && <p className="event-card-tagline">{evt.tagline}</p>}

                      <div className="event-card-venue">
                        <MapPin size={15} className="venue-icon" />
                        <span className="venue-text">
                          {evt.locationType === 'virtual'
                            ? evt.virtualLink
                              ? 'Online Google Meet / Discord'
                              : 'Online Virtual Session'
                            : evt.venue || 'Campus Venue'}
                        </span>
                      </div>

                      {evt.speakers && evt.speakers.length > 0 && (
                        <div className="event-card-speakers">
                          <div className="speaker-avatars">
                            {evt.speakers.slice(0, 3).map((speaker, sIdx) => (
                              <img
                                key={sIdx}
                                src={
                                  speaker.avatar ||
                                  `https://api.dicebear.com/7.x/identicon/svg?seed=${speaker.name}`
                                }
                                alt={speaker.name}
                                className="speaker-mini-avatar"
                                title={`${speaker.name} (${speaker.role || 'Speaker'})`}
                              />
                            ))}
                          </div>
                          <span className="speakers-summary">
                            {evt.speakers[0].name}
                            {evt.speakers.length > 1
                              ? ` +${evt.speakers.length - 1} more`
                              : ` · ${evt.speakers[0].role || 'Speaker'}`}
                          </span>
                        </div>
                      )}

                      <div className="event-card-footer">
                        <Link
                          to={`/events/${evt.slug || evt._id}`}
                          className="event-card-btn-primary"
                        >
                          <span>{isPast ? 'View Recap & Media' : 'Event Details'}</span>
                          <ChevronRight size={15} />
                        </Link>

                        <div className="event-card-quick-actions">
                          {!isPast && (
                            <div className="calendar-dropdown-wrap">
                              <button
                                type="button"
                                className="event-action-icon-btn"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setCalendarMenuOpen(
                                    calendarMenuOpen === evt._id ? null : evt._id
                                  );
                                }}
                                title="Add to Calendar"
                              >
                                <Calendar size={16} />
                              </button>

                              {calendarMenuOpen === evt._id && (
                                <div className="calendar-dropdown-menu">
                                  <a
                                    href={generateGoogleCalendarUrl(evt)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="calendar-dropdown-item"
                                    onClick={() => setCalendarMenuOpen(null)}
                                  >
                                    Google Calendar
                                  </a>
                                  <button
                                    type="button"
                                    className="calendar-dropdown-item"
                                    onClick={() => {
                                      downloadIcsFile(evt);
                                      setCalendarMenuOpen(null);
                                    }}
                                  >
                                    iCal / Outlook (.ics)
                                  </button>
                                </div>
                              )}
                            </div>
                          )}

                          <button
                            type="button"
                            className="event-action-icon-btn"
                            onClick={(e) => handleShare(e, evt)}
                            title="Share event link"
                          >
                            <Share2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
