'use client';
import { useState } from 'react';

export default function ReportButton() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [issue, setIssue] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const submit = async () => {
    if (!issue.trim()) return;
    setStatus('sending');
    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, issue }),
      });
      setStatus(res.ok ? 'sent' : 'error');
      if (res.ok) {
        setEmail('');
        setIssue('');
        setTimeout(() => { setOpen(false); setStatus('idle'); }, 2000);
      }
    } catch {
      setStatus('error');
    }
  };

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => { setOpen(true); setStatus('idle'); }}
        style={{
          position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 999,
          background: 'var(--panel)', border: '1px solid var(--border)',
          borderRadius: 999, padding: '0.5rem 1rem',
          fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
          boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
          color: 'var(--text-muted)',
          display: 'flex', alignItems: 'center', gap: '0.4rem',
        }}
        aria-label="Report an issue"
      >
        🚩 Report
      </button>

      {/* Modal overlay */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.4)', display: 'flex',
            alignItems: 'flex-end', justifyContent: 'flex-end',
            padding: '1.5rem',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--panel)', borderRadius: 16,
              padding: '1.5rem', width: '100%', maxWidth: 360,
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
              display: 'flex', flexDirection: 'column', gap: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>Report an Issue</h3>
              <button onClick={() => setOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1.2rem', lineHeight: 1 }}>
                ✕
              </button>
            </div>

            <input
              className="input"
              placeholder="Your email (optional)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
            />
            <textarea
              className="input"
              placeholder="Describe the issue..."
              value={issue}
              onChange={(e) => setIssue(e.target.value)}
              rows={4}
              style={{ resize: 'vertical', fontFamily: 'inherit', fontSize: '0.9rem' }}
            />

            {status === 'sent' && (
              <p style={{ color: 'var(--truth)', fontSize: '0.85rem' }}>✓ Report sent — thank you!</p>
            )}
            {status === 'error' && (
              <p style={{ color: 'var(--penalty)', fontSize: '0.85rem' }}>⚠️ Failed to send. Please try again.</p>
            )}

            <button
              className="btn primary full"
              onClick={submit}
              disabled={!issue.trim() || status === 'sending' || status === 'sent'}
            >
              {status === 'sending' ? 'Sending...' : 'Send Report'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
