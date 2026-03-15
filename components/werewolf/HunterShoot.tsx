'use client';
import { useTranslation } from '@/lib/i18n/useTranslation';
import type { GameState } from '@/lib/werewolf/types';

interface Props {
  gameState: GameState;
  onSend: (type: string, payload?: unknown) => void;
}

export default function HunterShoot({ gameState, onSend }: Props) {
  const { t } = useTranslation();
  const { room, players, myRole } = gameState;
  const me = players.find((p) => p.isMe);
  const isHunter = me?.id === room.hunterId;
  const isHost = me?.isHost ?? false;
  const hunter = players.find((p) => p.id === room.hunterId);

  const shootableTargets = players.filter((p) => p.isAlive && p.id !== room.hunterId);

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '2rem 1rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🏹</div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>{t('ww.hunter.title')}</h2>
        <p style={{ color: 'var(--text-muted)' }}>
          {t('ww.hunter.subtitle').replace('{name}', hunter?.name || '')}
        </p>
      </div>

      {isHunter ? (
        <div className="panel">
          <p style={{ fontWeight: 700, marginBottom: '0.75rem', color: 'var(--wolf)' }}>
            🏹 You were eliminated — choose someone to take down with you!
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {shootableTargets.map((p) => (
              <button key={p.id} className="btn"
                onClick={() => onSend('hunter_shoot', { targetId: p.id })}
                style={{
                  background: 'var(--panel2)',
                  color: 'var(--text)',
                  border: '1px solid var(--border)',
                  justifyContent: 'space-between',
                  padding: '0.75rem 1rem',
                }}>
                <span>{p.name}</span>
                <span style={{ color: 'var(--wolf)', fontSize: '0.85rem' }}>{t('ww.hunter.shoot')} 🏹</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="panel" style={{ textAlign: 'center', padding: '2.5rem 1.5rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
          <p style={{ color: 'var(--text-muted)' }}>
            {t('ww.hunter.waiting').replace('{name}', hunter?.name || '')}
          </p>
        </div>
      )}

      {isHost && !isHunter && (
        <button className="btn ghost full" onClick={() => onSend('force_resolve_night')}>
          ⏭ Skip Hunter Shot
        </button>
      )}
    </div>
  );
}
