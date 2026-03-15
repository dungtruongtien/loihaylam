'use client';
import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import type { GameState } from '@/lib/werewolf/types';

interface Props {
  gameState: GameState;
  onSend: (type: string, payload?: unknown) => void;
}

export default function DayPhase({ gameState, onSend }: Props) {
  const { t } = useTranslation();
  const { room, players } = gameState;
  const isHost = players.find((p) => p.isMe)?.isHost ?? false;
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const eliminated = room.eliminatedLast
    ? players.find((p) => p.id === room.eliminatedLast)?.name ?? null
    : null;

  useEffect(() => {
    if (!room.timerEndsAt) return;
    const tick = () => {
      const left = Math.max(0, Math.ceil((room.timerEndsAt! - Date.now()) / 1000));
      setTimeLeft(left);
      if (left === 0 && isHost) onSend('start_day_vote');
    };
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [room.timerEndsAt, isHost, onSend]);

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '2rem 1rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>☀️</div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>{t('ww.phase.day')}</h2>

        {/* Elimination announcement */}
        {eliminated ? (
          <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, padding: '0.75rem 1.5rem', marginBottom: '1rem' }}>
            <p>💀 <strong>{eliminated}</strong> {t('ww.phase.eliminated')}</p>
          </div>
        ) : (
          <div style={{ background: 'var(--panel2)', borderRadius: 12, padding: '0.5rem 1rem', marginBottom: '1rem', display: 'inline-block' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{t('ww.phase.noElimination')}</p>
          </div>
        )}

        <p style={{ color: 'var(--text-muted)' }}>{t('ww.phase.discussDesc')}</p>
      </div>

      {/* Timer */}
      {timeLeft !== null && (
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: '3rem', fontWeight: 800, fontVariantNumeric: 'tabular-nums',
            color: timeLeft <= 10 ? 'var(--penalty)' : 'var(--brand)',
          }}>
            {timeLeft}s
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{t('ww.phase.timerLeft')}</p>
        </div>
      )}

      {/* Alive players */}
      <div className="panel">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {players.map((p) => (
            <span key={p.id} style={{
              padding: '0.35rem 0.8rem', borderRadius: 999, fontWeight: 600, fontSize: '0.9rem',
              background: p.isAlive ? 'var(--panel2)' : 'transparent',
              color: p.isAlive ? 'var(--text)' : 'var(--text-muted)',
              textDecoration: p.isAlive ? 'none' : 'line-through',
              border: '1px solid var(--border)',
            }}>
              {p.name} {p.isAlive ? '' : '💀'}
            </span>
          ))}
        </div>
      </div>

      {isHost && (
        <button className="btn primary full" onClick={() => onSend('start_day_vote')}>
          {t('ww.phase.startVote')} 🗳️
        </button>
      )}
    </div>
  );
}
