import { useState } from 'react';
import { AlertTriangle, X, ShieldAlert, CheckCircle2 } from 'lucide-react';
import './ReportModal.css';

export default function ReportModal({
  isOpen,
  onClose,
  onSubmit,
  title = 'Report Content',
  description = 'Help us keep the GLUG community safe and welcoming.',
  contentType = 'post',
}) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successResult, setSuccessResult] = useState(null);

  if (!isOpen) return null;

  const handleClose = () => {
    setReason('');
    setError('');
    setSuccessResult(null);
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await onSubmit(reason);
      setSuccessResult(res);
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="report-modal-overlay" onClick={handleClose}>
      <div className="report-modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="report-modal-header">
          <div className="report-modal-icon-wrap">
            <ShieldAlert size={20} className="report-modal-icon" />
          </div>
          <div className="report-modal-titles">
            <h3 className="report-modal-title">{title}</h3>
            <p className="report-modal-desc">{description}</p>
          </div>
          <button type="button" className="report-modal-close" onClick={handleClose}>
            <X size={18} />
          </button>
        </div>

        {successResult ? (
          <div className="report-modal-success">
            <CheckCircle2 size={36} className="text-emerald" />
            <h4>Report Submitted</h4>
            <p>{successResult.message || 'Automated moderation has reviewed the report.'}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="report-modal-body">
            {error && (
              <div className="report-modal-error">
                <AlertTriangle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div className="report-modal-field">
              <label htmlFor="report-reason">
                Reason for reporting (optional):
              </label>
              <textarea
                id="report-reason"
                rows="3"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Inappropriate language, targeted abuse, harassment, NSFW content..."
                maxLength={500}
                className="report-modal-textarea"
              />
              <span className="report-modal-char-count">{reason.length}/500</span>
            </div>

            <div className="report-modal-info">
              <p>
                All reports are checked by our automated moderation system. If abuse or NSFW content is confirmed, the content is immediately hidden and strikes are applied.
              </p>
            </div>

            <div className="report-modal-actions">
              <button
                type="button"
                className="report-btn secondary"
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="report-btn danger"
                disabled={loading}
              >
                {loading ? 'Reviewing...' : 'Submit Report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

