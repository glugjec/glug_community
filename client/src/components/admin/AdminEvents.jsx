import { useState, useEffect, useRef } from 'react';
import {
  Calendar,
  Plus,
  Search,
  X,
  Edit2,
  Trash2,
  Eye,
  Image as ImageIcon,
  Upload,
  Clock,
  MapPin,
  Video,
  Globe,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Layers,
  Sparkles,
} from 'lucide-react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { eventsApi, uploadApi } from '../../api.js';
import './AdminEvents.css';

const CATEGORIES = [
  { id: 'workshop', label: 'Workshop' },
  { id: 'hackathon', label: 'Hackathon' },
  { id: 'installation-drive', label: 'Linux Drive' },
  { id: 'talk', label: 'Tech Talk' },
  { id: 'meetup', label: 'Meetup' },
  { id: 'general', label: 'General' },
];

const INITIAL_FORM = {
  title: '',
  tagline: '',
  description: '',
  category: 'workshop',
  status: 'published',
  startDate: '',
  endDate: '',
  time: '',
  locationType: 'in-person',
  venue: '',
  mapUrl: '',
  virtualLink: '',
  bannerUrl: '',
  bannerPublicId: '',
  tags: '',
  registrationEnabled: false,
  registrationUrl: '',
  registrationCapacity: 0,
  speakers: [],
  resources: [],
};

export default function AdminEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stats, setStats] = useState({ total: 0, upcoming: 0, past: 0, totalPhotos: 0 });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [descPreviewTab, setDescPreviewTab] = useState('write');
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [galleryModalOpen, setGalleryModalOpen] = useState(false);
  const [activeGalleryEvent, setActiveGalleryEvent] = useState(null);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [galleryError, setGalleryError] = useState('');

  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewEvent, setPreviewEvent] = useState(null);

  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  const bannerInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [eventsRes, statsRes] = await Promise.all([
        eventsApi.list({
          includeDrafts: 'true',
          limit: 100,
        }),
        eventsApi.getStats(),
      ]);

      setEvents(eventsRes?.events || []);
      if (statsRes) {
        setStats(statsRes);
      }
    } catch (err) {
      console.error('Failed to load events in admin', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingId(null);
    setFormData(INITIAL_FORM);
    setSubmitError('');
    setDescPreviewTab('write');
    setModalOpen(true);
  };

  const openEditModal = (evt) => {
    setEditingId(evt._id);
    const startStr = evt.startDate ? new Date(evt.startDate).toISOString().slice(0, 16) : '';
    const endStr = evt.endDate ? new Date(evt.endDate).toISOString().slice(0, 16) : '';

    setFormData({
      title: evt.title || '',
      tagline: evt.tagline || '',
      description: evt.description || '',
      category: evt.category || 'workshop',
      status: evt.status || 'published',
      startDate: startStr,
      endDate: endStr,
      time: evt.time || '',
      locationType: evt.locationType || 'in-person',
      venue: evt.venue || '',
      mapUrl: evt.mapUrl || '',
      virtualLink: evt.virtualLink || '',
      bannerUrl: evt.bannerUrl || '',
      bannerPublicId: evt.bannerPublicId || '',
      tags: Array.isArray(evt.tags) ? evt.tags.join(', ') : '',
      registrationEnabled: Boolean(evt.registration?.enabled),
      registrationUrl: evt.registration?.url || '',
      registrationCapacity: evt.registration?.capacity || 0,
      speakers: evt.speakers || [],
      resources: evt.resources || [],
    });
    setSubmitError('');
    setDescPreviewTab('write');
    setModalOpen(true);
  };

  const handleBannerFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setBannerUploading(true);
      const res = await uploadApi.uploadImage(file);
      if (res?.url) {
        setFormData((prev) => ({
          ...prev,
          bannerUrl: res.url,
          bannerPublicId: res.publicId || '',
        }));
        showToast('Banner uploaded successfully');
      }
    } catch (err) {
      setSubmitError(err.message || 'Failed to upload banner');
    } finally {
      setBannerUploading(false);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setSubmitError('Title is required');
      return;
    }
    if (!formData.startDate) {
      setSubmitError('Start date is required');
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError('');

      const payload = {
        title: formData.title.trim(),
        tagline: formData.tagline.trim(),
        description: formData.description,
        category: formData.category,
        status: formData.status,
        startDate: new Date(formData.startDate),
        endDate: formData.endDate ? new Date(formData.endDate) : undefined,
        time: formData.time.trim(),
        locationType: formData.locationType,
        venue: formData.venue.trim(),
        mapUrl: formData.mapUrl.trim(),
        virtualLink: formData.virtualLink.trim(),
        bannerUrl: formData.bannerUrl,
        bannerPublicId: formData.bannerPublicId,
        tags: formData.tags
          ? formData.tags
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean)
          : [],
        registration: {
          enabled: formData.registrationEnabled,
          url: formData.registrationUrl.trim(),
          capacity: Number(formData.registrationCapacity) || 0,
        },
        speakers: formData.speakers,
        resources: formData.resources,
      };

      if (editingId) {
        await eventsApi.update(editingId, payload);
        showToast('Event updated successfully');
      } else {
        await eventsApi.create(payload);
        showToast('Event created successfully');
      }

      setModalOpen(false);
      loadData();
    } catch (err) {
      setSubmitError(err.message || 'Failed to save event');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (evt) => {
    const nextStatus = evt.status === 'published' ? 'draft' : 'published';
    try {
      await eventsApi.updateStatus(evt._id, nextStatus);
      showToast(`Status updated to ${nextStatus}`);
      loadData();
    } catch (err) {
      showToast('Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    try {
      await eventsApi.delete(id);
      showToast('Event deleted successfully');
      setDeleteConfirmId(null);
      loadData();
    } catch (err) {
      showToast('Failed to delete event');
    }
  };

  const openGalleryManager = (evt) => {
    setActiveGalleryEvent(evt);
    setGalleryError('');
    setGalleryModalOpen(true);
  };

  const handleGalleryUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !activeGalleryEvent) return;

    try {
      setGalleryUploading(true);
      setGalleryError('');
      const res = await uploadApi.uploadMultiple(files);
      if (res?.images && res.images.length > 0) {
        const updateRes = await eventsApi.addGalleryPhotos(activeGalleryEvent._id, res.images);
        if (updateRes?.gallery) {
          setActiveGalleryEvent((prev) => ({ ...prev, gallery: updateRes.gallery }));
          showToast(`${res.images.length} photos added to gallery`);
          loadData();
        }
      }
    } catch (err) {
      setGalleryError(err.message || 'Failed to upload gallery images');
    } finally {
      setGalleryUploading(false);
      if (galleryInputRef.current) galleryInputRef.current.value = '';
    }
  };

  const handleDeleteGalleryImage = async (imageId) => {
    if (!activeGalleryEvent) return;
    try {
      const res = await eventsApi.deleteGalleryPhoto(activeGalleryEvent._id, imageId);
      if (res?.gallery) {
        setActiveGalleryEvent((prev) => ({ ...prev, gallery: res.gallery }));
        showToast('Photo removed from gallery');
        loadData();
      }
    } catch (err) {
      setGalleryError('Failed to remove photo');
    }
  };

  const addSpeaker = () => {
    setFormData((prev) => ({
      ...prev,
      speakers: [
        ...prev.speakers,
        { name: '', role: '', company: '', avatar: '', bio: '', github: '', linkedin: '' },
      ],
    }));
  };

  const removeSpeaker = (idx) => {
    setFormData((prev) => ({
      ...prev,
      speakers: prev.speakers.filter((_, i) => i !== idx),
    }));
  };

  const updateSpeaker = (idx, field, val) => {
    setFormData((prev) => {
      const copy = [...prev.speakers];
      copy[idx] = { ...copy[idx], [field]: val };
      return { ...prev, speakers: copy };
    });
  };

  const addResource = () => {
    setFormData((prev) => ({
      ...prev,
      resources: [...prev.resources, { label: '', url: '', type: 'code' }],
    }));
  };

  const removeResource = (idx) => {
    setFormData((prev) => ({
      ...prev,
      resources: prev.resources.filter((_, i) => i !== idx),
    }));
  };

  const updateResource = (idx, field, val) => {
    setFormData((prev) => {
      const copy = [...prev.resources];
      copy[idx] = { ...copy[idx], [field]: val };
      return { ...prev, resources: copy };
    });
  };

  const filteredEvents = events.filter((evt) => {
    const matchesSearch =
      !search.trim() ||
      evt.title?.toLowerCase().includes(search.toLowerCase()) ||
      evt.venue?.toLowerCase().includes(search.toLowerCase()) ||
      evt.category?.toLowerCase().includes(search.toLowerCase());

    const isUpcoming = new Date(evt.startDate) >= new Date();
    if (statusFilter === 'published') return matchesSearch && evt.status === 'published';
    if (statusFilter === 'draft') return matchesSearch && evt.status === 'draft';
    if (statusFilter === 'upcoming')
      return matchesSearch && evt.status === 'published' && isUpcoming;
    if (statusFilter === 'past') return matchesSearch && evt.status === 'published' && !isUpcoming;
    return matchesSearch;
  });

  return (
    <div className="admin-events-pane">
      {toastMessage && (
        <div className="admin-events-toast">
          <CheckCircle2 size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="admin-events-stats-row">
        <div className="admin-stat-widget">
          <span className="stat-label">Total Events</span>
          <span className="stat-number">{stats.total || 0}</span>
        </div>
        <div className="admin-stat-widget">
          <span className="stat-label">Upcoming</span>
          <span className="stat-number highlight-blue">{stats.upcoming || 0}</span>
        </div>
        <div className="admin-stat-widget">
          <span className="stat-label">Concluded Recaps</span>
          <span className="stat-number highlight-gold">{stats.past || 0}</span>
        </div>
        <div className="admin-stat-widget">
          <span className="stat-label">Gallery Media</span>
          <span className="stat-number">{stats.totalPhotos || 0}</span>
        </div>
      </div>

      <div className="admin-events-toolbar">
        <div className="toolbar-left">
          <div className="admin-events-search-wrap">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search events by title, venue..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="admin-events-search-input"
            />
            {search && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setSearch('')}
                title="Clear"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="status-filter-pills">
            {['all', 'published', 'draft', 'upcoming', 'past'].map((filter) => (
              <button
                key={filter}
                type="button"
                className={`filter-pill-btn ${statusFilter === filter ? 'active' : ''}`}
                onClick={() => setStatusFilter(filter)}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <button type="button" className="admin-create-event-btn" onClick={openCreateModal}>
          <Plus size={16} />
          <span>New Event</span>
        </button>
      </div>

      <div className="admin-events-table-wrapper">
        {loading ? (
          <div className="admin-events-loading">
            <div className="spinner-mini" />
            <span>Loading events...</span>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="admin-events-empty">
            <Calendar size={40} />
            <h4>No Events Found</h4>
            <p>Try clearing filters or create a new event.</p>
          </div>
        ) : (
          <table className="admin-events-table">
            <thead>
              <tr>
                <th>Event</th>
                <th>Category</th>
                <th>Date & Location</th>
                <th>Photos</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map((evt) => {
                const dateStr = evt.startDate
                  ? new Date(evt.startDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : '';
                const isPast = new Date(evt.startDate) < new Date();

                return (
                  <tr key={evt._id}>
                    <td>
                      <div className="table-event-info">
                        {evt.bannerUrl ? (
                          <img src={evt.bannerUrl} alt="" className="table-banner-thumb" />
                        ) : (
                          <div className="table-banner-thumb-empty">
                            <Calendar size={18} />
                          </div>
                        )}
                        <div className="table-title-col">
                          <span className="table-event-title">{evt.title}</span>
                          {evt.tagline && (
                            <span className="table-event-sub">{evt.tagline.slice(0, 60)}...</span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className="table-category-chip">{evt.category}</span>
                    </td>

                    <td>
                      <div className="table-date-col">
                        <span className="table-date-text">
                          <Calendar size={13} /> {dateStr}
                        </span>
                        <span className="table-venue-text">
                          {evt.locationType === 'virtual' ? (
                            <>
                              <Video size={13} /> Virtual
                            </>
                          ) : (
                            <>
                              <MapPin size={13} /> {evt.venue || 'Campus'}
                            </>
                          )}
                        </span>
                      </div>
                    </td>

                    <td>
                      <button
                        type="button"
                        className="table-gallery-btn"
                        onClick={() => openGalleryManager(evt)}
                        title="Manage gallery photos"
                      >
                        <ImageIcon size={14} />
                        <span>{evt.gallery?.length || 0}</span>
                      </button>
                    </td>

                    <td>
                      <button
                        type="button"
                        className={`table-status-pill ${evt.status}`}
                        onClick={() => handleToggleStatus(evt)}
                        title="Click to toggle status"
                      >
                        {evt.status}
                      </button>
                    </td>

                    <td>
                      <div className="table-actions-cell">
                        <button
                          type="button"
                          className="table-action-btn"
                          onClick={() => {
                            setPreviewEvent(evt);
                            setPreviewModalOpen(true);
                          }}
                          title="Live Preview"
                        >
                          <Eye size={15} />
                        </button>

                        <button
                          type="button"
                          className="table-action-btn"
                          onClick={() => openEditModal(evt)}
                          title="Edit Event"
                        >
                          <Edit2 size={15} />
                        </button>

                        <button
                          type="button"
                          className="table-action-btn delete-btn"
                          onClick={() => setDeleteConfirmId(evt._id)}
                          title="Delete Event"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {modalOpen && (
        <div className="admin-modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="admin-modal-window large" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>{editingId ? 'Edit Event' : 'Create New Event'}</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="admin-modal-form">
              {submitError && (
                <div className="admin-form-error">
                  <AlertCircle size={16} />
                  <span>{submitError}</span>
                </div>
              )}

              <div className="form-group-row">
                <div className="form-group flex-2">
                  <label>Event Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Linux Kernel Internals & eBPF"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>

                <div className="form-group flex-1">
                  <label>Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Tagline / Short Summary</label>
                <input
                  type="text"
                  placeholder="A concise one-liner about this event..."
                  value={formData.tagline}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                />
              </div>

              <div className="form-group-row">
                <div className="form-group">
                  <label>Start Date & Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>End Date & Time</label>
                  <input
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Time Display String</label>
                  <input
                    type="text"
                    placeholder="e.g. 02:00 PM - 05:30 PM IST"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group-row">
                <div className="form-group">
                  <label>Location Type</label>
                  <select
                    value={formData.locationType}
                    onChange={(e) => setFormData({ ...formData, locationType: e.target.value })}
                  >
                    <option value="in-person">In-Person</option>
                    <option value="virtual">Virtual</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>

                <div className="form-group flex-2">
                  <label>Venue (for In-Person / Hybrid)</label>
                  <input
                    type="text"
                    placeholder="e.g. GLUG Lab, CSE Block Room 302"
                    value={formData.venue}
                    onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group-row">
                <div className="form-group">
                  <label>Google Maps Link</label>
                  <input
                    type="url"
                    placeholder="https://maps.google.com/..."
                    value={formData.mapUrl}
                    onChange={(e) => setFormData({ ...formData, mapUrl: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Virtual Room URL (Meet / Discord)</label>
                  <input
                    type="url"
                    placeholder="https://meet.google.com/..."
                    value={formData.virtualLink}
                    onChange={(e) => setFormData({ ...formData, virtualLink: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Banner Cover Image</label>
                <div className="banner-upload-box">
                  {formData.bannerUrl ? (
                    <div className="banner-preview-box">
                      <img src={formData.bannerUrl} alt="Banner preview" />
                      <button
                        type="button"
                        className="banner-remove-btn"
                        onClick={() =>
                          setFormData({ ...formData, bannerUrl: '', bannerPublicId: '' })
                        }
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div
                      className="banner-upload-dropzone"
                      onClick={() => bannerInputRef.current?.click()}
                    >
                      <Upload size={24} />
                      <span>
                        {bannerUploading ? 'Uploading to Cloudinary...' : 'Click to Upload Banner Image'}
                      </span>
                    </div>
                  )}
                  <input
                    type="file"
                    ref={bannerInputRef}
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleBannerFileSelect}
                  />
                </div>
              </div>

              <div className="form-group">
                <div className="desc-tabs-header">
                  <label>Detailed Description (Markdown Supported)</label>
                  <div className="desc-tabs-pills">
                    <button
                      type="button"
                      className={`desc-tab-btn ${descPreviewTab === 'write' ? 'active' : ''}`}
                      onClick={() => setDescPreviewTab('write')}
                    >
                      Write
                    </button>
                    <button
                      type="button"
                      className={`desc-tab-btn ${descPreviewTab === 'preview' ? 'active' : ''}`}
                      onClick={() => setDescPreviewTab('preview')}
                    >
                      Preview
                    </button>
                  </div>
                </div>

                {descPreviewTab === 'write' ? (
                  <textarea
                    rows={8}
                    placeholder="Write event overview, schedule agenda, prerequisites, etc..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                ) : (
                  <div
                    className="admin-desc-preview"
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(marked.parse(formData.description || '')),
                    }}
                  />
                )}
              </div>

              <div className="form-group">
                <label>Tags (comma separated)</label>
                <input
                  type="text"
                  placeholder="Linux, Kernel, eBPF, OpenSource"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                />
              </div>

              <div className="form-collapsible-section">
                <div className="collapsible-header">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.registrationEnabled}
                      onChange={(e) =>
                        setFormData({ ...formData, registrationEnabled: e.target.checked })
                      }
                    />
                    <span>Enable Registration / RSVP</span>
                  </label>
                </div>

                {formData.registrationEnabled && (
                  <div className="form-group-row mt-2">
                    <div className="form-group flex-2">
                      <label>Registration Link (Google Forms, Luma, etc.)</label>
                      <input
                        type="url"
                        placeholder="https://forms.gle/..."
                        value={formData.registrationUrl}
                        onChange={(e) =>
                          setFormData({ ...formData, registrationUrl: e.target.value })
                        }
                      />
                    </div>
                    <div className="form-group flex-1">
                      <label>Capacity</label>
                      <input
                        type="number"
                        placeholder="e.g. 100"
                        value={formData.registrationCapacity}
                        onChange={(e) =>
                          setFormData({ ...formData, registrationCapacity: e.target.value })
                        }
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="form-collapsible-section">
                <div className="collapsible-header">
                  <label>Speakers & Hosts ({formData.speakers.length})</label>
                  <button type="button" className="btn-add-mini" onClick={addSpeaker}>
                    <Plus size={14} /> Add Speaker
                  </button>
                </div>

                {formData.speakers.map((spk, idx) => (
                  <div key={idx} className="sub-item-card">
                    <div className="form-group-row">
                      <input
                        type="text"
                        placeholder="Name *"
                        value={spk.name}
                        onChange={(e) => updateSpeaker(idx, 'name', e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="Role / Title"
                        value={spk.role}
                        onChange={(e) => updateSpeaker(idx, 'role', e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="Company / Org"
                        value={spk.company}
                        onChange={(e) => updateSpeaker(idx, 'company', e.target.value)}
                      />
                      <button
                        type="button"
                        className="btn-remove-sub"
                        onClick={() => removeSpeaker(idx)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="form-collapsible-section">
                <div className="collapsible-header">
                  <label>Resources & Links ({formData.resources.length})</label>
                  <button type="button" className="btn-add-mini" onClick={addResource}>
                    <Plus size={14} /> Add Resource
                  </button>
                </div>

                {formData.resources.map((res, idx) => (
                  <div key={idx} className="sub-item-card">
                    <div className="form-group-row">
                      <input
                        type="text"
                        placeholder="Label (e.g. Slides)"
                        value={res.label}
                        onChange={(e) => updateResource(idx, 'label', e.target.value)}
                      />
                      <input
                        type="url"
                        placeholder="URL"
                        value={res.url}
                        onChange={(e) => updateResource(idx, 'url', e.target.value)}
                      />
                      <select
                        value={res.type}
                        onChange={(e) => updateResource(idx, 'type', e.target.value)}
                      >
                        <option value="code">Code / Repo</option>
                        <option value="slides">Slides</option>
                        <option value="recording">Recording</option>
                        <option value="notes">Notes</option>
                      </select>
                      <button
                        type="button"
                        className="btn-remove-sub"
                        onClick={() => removeResource(idx)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="form-group">
                <label>Publication Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="published">Published (Visible on site)</option>
                  <option value="draft">Draft (Hidden)</option>
                </select>
              </div>

              <div className="admin-modal-actions">
                <button
                  type="button"
                  className="admin-btn-cancel"
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="admin-btn-submit">
                  {submitting ? 'Saving...' : editingId ? 'Update Event' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {galleryModalOpen && activeGalleryEvent && (
        <div className="admin-modal-overlay" onClick={() => setGalleryModalOpen(false)}>
          <div className="admin-modal-window" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <h3>Photo Gallery Manager</h3>
                <span className="modal-sub">{activeGalleryEvent.title}</span>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setGalleryModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="gallery-manager-body">
              {galleryError && (
                <div className="admin-form-error mb-3">
                  <AlertCircle size={16} />
                  <span>{galleryError}</span>
                </div>
              )}

              <div
                className="gallery-upload-dropzone"
                onClick={() => galleryInputRef.current?.click()}
              >
                <Upload size={24} />
                <span>
                  {galleryUploading
                    ? 'Uploading photos to Cloudinary...'
                    : 'Click to Upload Multiple Photos to Gallery'}
                </span>
                <input
                  type="file"
                  ref={galleryInputRef}
                  multiple
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleGalleryUpload}
                />
              </div>

              <div className="gallery-manager-grid">
                {activeGalleryEvent.gallery?.length === 0 ? (
                  <div className="gallery-empty-state">
                    <ImageIcon size={32} />
                    <p>No photos in this event gallery yet.</p>
                  </div>
                ) : (
                  activeGalleryEvent.gallery.map((img) => (
                    <div key={img._id} className="gallery-manage-card">
                      <img src={img.url} alt="" />
                      <button
                        type="button"
                        className="gallery-delete-btn"
                        onClick={() => handleDeleteGalleryImage(img._id)}
                        title="Remove photo"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {previewModalOpen && previewEvent && (
        <div className="admin-modal-overlay" onClick={() => setPreviewModalOpen(false)}>
          <div className="admin-modal-window large" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Live Preview: {previewEvent.title}</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setPreviewModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="admin-live-preview-content">
              {previewEvent.bannerUrl && (
                <div className="preview-banner">
                  <img src={previewEvent.bannerUrl} alt="" />
                </div>
              )}

              <div className="preview-header">
                <span className="preview-cat">{previewEvent.category}</span>
                <h2>{previewEvent.title}</h2>
                <p className="preview-tagline">{previewEvent.tagline}</p>
              </div>

              <div className="preview-meta-row">
                <span>
                  <Calendar size={15} /> {new Date(previewEvent.startDate).toLocaleDateString()}
                </span>
                {previewEvent.time && (
                  <span>
                    <Clock size={15} /> {previewEvent.time}
                  </span>
                )}
                <span>
                  <MapPin size={15} /> {previewEvent.venue || previewEvent.locationType}
                </span>
              </div>

              <div
                className="preview-body"
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(marked.parse(previewEvent.description || '')),
                }}
              />
            </div>
          </div>
        </div>
      )}

      {deleteConfirmId && (
        <div className="admin-modal-overlay" onClick={() => setDeleteConfirmId(null)}>
          <div className="admin-modal-window small" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Delete Event</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setDeleteConfirmId(null)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4 text-center">
              <p>Are you sure you want to permanently delete this event and its gallery photos?</p>
              <div className="admin-modal-actions mt-4">
                <button
                  type="button"
                  className="admin-btn-cancel"
                  onClick={() => setDeleteConfirmId(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="admin-btn-delete"
                  onClick={() => handleDelete(deleteConfirmId)}
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
