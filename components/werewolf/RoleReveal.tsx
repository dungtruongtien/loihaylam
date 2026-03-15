'use client';
import { useTranslation } from '@/lib/i18n/useTranslation';
import type { GameState } from '@/lib/werewolf/types';
import RoleCard from './RoleCard';

interface Props {
  gameState: GameState;
  onSend: (type: string, payload?: unknown) => void;
}

export default function RoleReveal({ gameState, onSend }: Props) {
  const { t } = useTranslation();
  const isHost = gameState.players.find((p) => p.isMe)?.isHost ?? false;
  const { myRole, wolves, players } = gameState;

  const wolfNames = wolves.map((id) => players.find((p) => p.id === id)?.name).filter(Boolean);

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '2rem 1rem', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>{t('ww.roleReveal')}</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{t('ww.readYourRole')}</p>
      </div>

      {myRole && <RoleCard role={myRole} customDesc={gameState.myRoleDesc} />}

      {/* Show wolf teammates to wolves */}
      {myRole === 'wolf' && wolfNames.length > 1 && (
        <div className="panel" style={{ background: 'rgba(127,29,29,0.4)', borderColor: 'rgba(239,68,68,0.3)' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>🐺 {t('ww.yourPack')}:</p>
          <p style={{ fontWeight: 700, color: '#fca5a5' }}>{wolfNames.join(', ')}</p>
        </div>
      )}

      {isHost && (
        <button className="btn primary full" onClick={() => onSend('advance_to_night')}>
          {t('ww.proceedToNight')} 🌙
        </button>
      )}
      {!isHost && (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>⏳ {t('ww.waitingHost')}</p>
      )}
    </div>
  );
}
