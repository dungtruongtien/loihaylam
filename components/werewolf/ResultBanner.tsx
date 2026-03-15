'use client';
import { useTranslation } from '@/lib/i18n/useTranslation';
import type { GameState } from '@/lib/werewolf/types';
import RoleCard from './RoleCard';

interface Props {
  gameState: GameState;
  onSend: (type: string, payload?: unknown) => void;
}

export default function ResultBanner({ gameState, onSend }: Props) {
  const { t } = useTranslation();
  const { room, players } = gameState;
  const isHost = players.find((p) => p.isMe)?.isHost ?? false;
  const winner = room.winner;

  const wolfPlayers = players.filter((p) => gameState.wolves.includes(p.id));
  // If I'm a wolf I can see all wolves; otherwise show all after game ends
  const allWolves = players.filter((p) => {
    // After game ended, all wolves are revealed via broadcast (server sends full wolves list to everyone)
    return gameState.wolves.includes(p.id);
  });

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '2rem 1rem', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{
        padding: '2.5rem 2rem',
        borderRadius: 20,
        background: winner === 'wolves'
          ? 'linear-gradient(135deg,#dc2626,#ef4444)'
          : 'linear-gradient(135deg,#2563eb,#3b82f6)',
      }}>
        <div style={{ fontSize: '4rem', marginBottom: '0.5rem' }}>{winner === 'wolves' ? '🐺' : '🏆'}</div>
        <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', marginBottom: '0.5rem' }}>
          {t(winner === 'wolves' ? 'ww.win.wolves' : 'ww.win.villagers')}
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.8)' }}>
          {t(winner === 'wolves' ? 'ww.win.wolvesDesc' : 'ww.win.villagersDesc')}
        </p>
      </div>

      {/* Reveal wolves */}
      {allWolves.length > 0 && (
        <div className="panel">
          <p style={{ fontWeight: 700, marginBottom: '0.75rem' }}>🐺 {t('ww.wolves')}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
            {allWolves.map((p) => (
              <span key={p.id} style={{
                background: 'rgba(220,38,38,0.12)', border: '1px solid rgba(220,38,38,0.3)',
                color: '#b91c1c', borderRadius: 999, padding: '0.3rem 0.8rem', fontWeight: 600,
              }}>{p.name}</span>
            ))}
          </div>
        </div>
      )}

      {/* Player roles reveal */}
      <div className="panel">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {players.map((p) => {
            const isWolf = gameState.wolves.includes(p.id);
            return (
              <div key={p.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'var(--panel2)', borderRadius: 10, padding: '0.6rem 1rem',
              }}>
                <span style={{ fontWeight: 600 }}>{p.name}</span>
                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem' }}>{isWolf ? '🐺' : '🏡'}</span>
                  <span style={{
                    fontSize: '0.75rem', borderRadius: 6, padding: '0.2rem 0.5rem', fontWeight: 600,
                    background: isWolf ? 'rgba(220,38,38,0.12)' : 'rgba(37,99,235,0.12)',
                    color: isWolf ? '#b91c1c' : '#1d4ed8',
                  }}>{isWolf ? t('ww.role.wolf') : t('ww.role.villager')}</span>
                  {!p.isAlive && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>💀</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {isHost && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn ghost full" onClick={() => onSend('restart_game')}>
              🔄 {t('ww.playAgain')}
            </button>
            <button className="btn danger full" onClick={() => onSend('end_game')}
              style={{ fontSize: '1rem', padding: '0.75rem' }}>
              🚪 {t('ww.endGame')}
            </button>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
            {t('ww.endGameHint')}
          </p>
        </div>
      )}
    </div>
  );
}
