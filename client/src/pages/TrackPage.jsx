import { useState } from 'react';
import { api } from '../utils/api';
import { Search, Loader2, CheckCircle2, Circle, AlertTriangle, ArrowRight } from 'lucide-react';

export default function TrackPage() {
  const [ref, setRef] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!ref.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const data = await api.get(`/public/track/${ref.trim()}`);
      setResult(data);
    } catch (err) {
      setError(err.message || 'Tracking reference not found.');
    } finally {
      setLoading(false);
    }
  };

  const getSteps = (type, currentStatus) => {
    if (type === 'visa') {
      const allSteps = [
        { label: 'Submitted', key: 'submitted', desc: 'Application received by our team' },
        { label: 'Documents Complete', key: 'document_complete', desc: 'All documents reviewed and verified' },
        { label: 'Embassy Submission', key: 'embassy_submitted', desc: 'Application lodged at consulate' },
        { label: 'Interview', key: 'interview_scheduled', desc: 'consulate appointment scheduled' },
        { label: 'Decision', key: 'visa_successful', alternateKey: 'visa_refused', desc: 'Final visa outcome' }
      ];
      
      let activeIndex = 0;
      if (['in_review', 'document_complete'].includes(currentStatus)) activeIndex = 1;
      if (['fee_processing', 'embassy_submitted'].includes(currentStatus)) activeIndex = 2;
      if (currentStatus === 'interview_scheduled') activeIndex = 3;
      if (['approved', 'visa_successful', 'visa_refused', 'rejected'].includes(currentStatus)) activeIndex = 4;
      
      return { steps: allSteps, activeIndex };
    } else {
      const allSteps = [
        { label: 'Received', key: 'pending', desc: 'Booking request registered' },
        { label: 'Confirmed', key: 'confirmed', desc: 'Booking confirmed and tickets issued' },
        { label: 'Completed', key: 'completed', desc: 'Travel successfully completed' }
      ];
      
      let activeIndex = 0;
      if (currentStatus === 'confirmed') activeIndex = 1;
      if (currentStatus === 'completed') activeIndex = 2;
      if (currentStatus === 'cancelled') activeIndex = -1; // Special check
      
      return { steps: allSteps, activeIndex };
    }
  };

  const renderTracker = () => {
    if (!result) return null;
    const { steps, activeIndex } = getSteps(result.type, result.status);
    const isCancelled = result.status === 'cancelled' || result.status === 'visa_refused' || result.status === 'rejected';

    return (
      <div className="card" style={{ padding: 32, marginTop: 24, animation: 'fadeIn 0.5s ease-out' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: 16, marginBottom: 24 }}>
          <div>
            <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-primary)', background: 'rgba(11,29,53,0.08)', padding: '4px 10px', borderRadius: 20 }}>
              {result.type} status
            </span>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-text)', marginTop: 8 }}>{result.title}</h3>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 4 }}>Ref: {result.ref}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Last updated</p>
            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', marginTop: 2 }}>
              {new Date(result.updated_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
        </div>

        {isCancelled ? (
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: 16, borderRadius: 8, color: '#ef4444', marginBottom: 24 }}>
            <AlertTriangle size={24} />
            <div>
              <h4 style={{ fontWeight: 700, fontSize: 15 }}>File Cancelled or Refused</h4>
              <p style={{ fontSize: 13, marginTop: 2, opacity: 0.9 }}>This travel file has been marked as cancelled or refused. Please contact support for more details.</p>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, position: 'relative', paddingLeft: 12 }}>
            {/* Timeline line */}
            <div style={{
              position: 'absolute', left: 23, top: 12, bottom: 12, width: 2,
              background: 'linear-gradient(to bottom, var(--color-primary) 50%, var(--color-border) 100%)',
              zIndex: 1
            }} />

            {steps.map((step, idx) => {
              const isDone = idx < activeIndex;
              const isCurrent = idx === activeIndex;
              
              return (
                <div key={idx} style={{ display: 'flex', gap: 20, zIndex: 2 }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%',
                    background: isDone || isCurrent ? 'var(--color-primary)' : 'var(--color-bg)',
                    border: `2px solid ${isDone || isCurrent ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: isDone || isCurrent ? 'white' : 'var(--color-text-muted)',
                    fontWeight: 700, fontSize: 12, transition: 'all 0.3s'
                  }}>
                    {isDone ? '✓' : idx + 1}
                  </div>
                  <div>
                    <h4 style={{ fontWeight: 700, color: isCurrent ? 'var(--color-primary)' : 'var(--color-text)', fontSize: 15 }}>
                      {step.label}
                    </h4>
                    <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 2 }}>{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ minHeight: '80vh', background: 'var(--color-bg)', padding: '100px 24px 60px' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-secondary)', letterSpacing: 1, textTransform: 'uppercase' }}>
            Live Tracker
          </span>
          <h1 className="heading-1" style={{ marginTop: 12, marginBottom: 16 }}>Track Your Application</h1>
          <p className="text-muted" style={{ maxWidth: 460, margin: '0 auto', fontSize: 15, lineHeight: 1.6 }}>
            Enter your booking reference or visa application reference below to view your real-time processing status.
          </p>
        </div>

        <div className="card" style={{ padding: 24 }}>
          <form onSubmit={handleTrack} style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
              <input
                className="form-input"
                placeholder="e.g. VISA-756688 or BKG-389104"
                value={ref}
                onChange={(e) => setRef(e.target.value)}
                style={{ paddingLeft: 42, textTransform: 'uppercase' }}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8, height: 46 }} disabled={loading}>
              {loading ? <Loader2 size={16} className="spinner" /> : 'Track Status'}
            </button>
          </form>

          {error && (
            <div style={{
              display: 'flex', gap: 10, alignItems: 'center',
              background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)',
              padding: '12px 16px', borderRadius: 8, color: '#ef4444', marginTop: 16, fontSize: 13
            }}>
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
          )}
        </div>

        {renderTracker()}
      </div>
    </div>
  );
}
