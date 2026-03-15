'use client';
import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import type { GameState } from '@/lib/werewolf/types';

interface Props {
  gameState: GameState;
  onSend: (type: string, payload?: unknown) => void;
}

export default function DayDefend({ gameState, onSend }: Props) {
  const { t } = useTranslation();
  const { room, players } = gameState;
  const me = players.find((p) => p.isMe);
  const isDefender = me?.id === room.defenderId;
  const isHost = me?.isHost ?? false;
  const defender = players.find((p) => p.id === room.defenderId);
  const [text, setText] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(15);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!room.defendEndsAt) return;
    const tick = () => {
      const left = Math.max(0, Math.ceil((room.defendEndsAt! - Date.now()) / 1000));
      setSecondsLeft(left);
    };
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [room.defendEndsAt]);

  const handleSubmit = () => {
    if (submitted) return;
    onSend('defend_message', { text });
    setSubmitted(true);
  };

  const handleSkip = () => {
    onSend('skip_defend');
  };

  const timerPct = Math.max(0, (secondsLeft / 15) * 100);

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '2rem 1rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>⚖️</div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>{t('ww.defend.title')}</h2>
        <p style={{ color: 'var(--text-muted)' }}>
          <strong style={{ color: 'var(--wolf)' }}>{defender?.name}</strong>{' '}
          {t('ww.defend.subtitle').replace('{seconds}', String(secondsLeft))}
        </p>
      </div>

      {/* Timer bar */}
      <div style={{ background: 'var(--panel2)', borderRadius: 999, height: 8, overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 999,
          background: secondsLeft > 7 ? 'var(--truth)' : secondsLeft > 3 ? '#f59e0b' : 'var(--wolf)',
          width: `${timerPct}%`,
          transition: 'width 0.5s linear',
        }} />
      </div>

      {/* Defense message display */}
      {room.defendMessage && (
        <div className="panel" style={{ background: 'rgba(37,99,235,0.06)', border: '1px solid rgba(37,99,235,0.2)' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>{defender?.name} says:</p>
          <p style={{ fontStyle: 'italic', lineHeight: 1.6 }}>"{room.defendMessage}"</p>
        </div>
      )}

      {/* Defender input */}
      {isDefender && !submitted && (
        <div className="panel">
          <p style={{ fontWeight: 700, marginBottom: '0.75rem', color: 'var(--wolf)' }}>🗣 You are being voted out — defend yourself!</p>
          <textarea
            className="input"
            style={{ minHeight: 80, resize: 'vertical' }}
            placeholder={t('ww.defend.placeholder')}
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={300}
          />
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
            <button className="btn primary full" onClick={handleSubmit} disabled={!text.trim()}>
              {t('ww.defend.send')}
            </button>
            <button className="btn ghost" onClick={handleSkip}>
              {t('ww.defend.skip')}
            </button>
          </div>
        </div>
      )}

      {isDefender && submitted && (
        <div className="panel" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          ✓ Defense submitted. Waiting for the village to decide...
        </div>
      )}

      {/* Non-defender view */}
      {!isDefender && !room.defendMessage && (
        <div className="panel" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
          <p>{t('ww.defend.waiting').replace('{name}', defender?.name || '')}</p>
        </div>
      )}

      {/* Host skip button */}
      {isHost && !isDefender && (
        <button className="btn ghost full" onClick={handleSkip}>
          ⏭ Skip Defense
        </button>
      )}
    </div>
  );
}
