'use client';
import type { GameState } from '@/lib/werewolf/types';
import RoleCard from './RoleCard';

interface Props {
  gameState: GameState;
  onSend: (type: string, payload?: unknown) => void;
}

export default function RevealMode({ gameState, onSend }: Props) {
  const { myRole, wolves, players } = gameState;
  const isHost = players.find((p) => p.isMe)?.isHost ?? false;
  const wolfNames = wolves.map((id) => players.find((p) => p.id === id)?.name).filter(Boolean);

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '2rem 1rem', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>🃏 Reveal Mode</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Your role has been revealed. Play continues in person!</p>
      </div>

      {myRole && myRole !== 'host' && <RoleCard role={myRole} customDesc={gameState.myRoleDesc} />}
      {myRole === 'host' && <RoleCard role="host" />}

      {myRole === 'wolf' && wolfNames.length > 1 && (
        <div className="panel" style={{ background: 'rgba(127,29,29,0.4)', borderColor: 'rgba(239,68,68,0.3)' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>🐺 Your pack:</p>
          <p style={{ fontWeight: 700, color: '#fca5a5' }}>{wolfNames.join(', ')}</p>
        </div>
      )}

      <div className="panel" style={{ background: 'var(--panel2)' }}>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>Players</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {players.map((p) => (
            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--panel)', borderRadius: 8, padding: '0.5rem 0.75rem' }}>
              <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{p.name}</span>
              <div style={{ display: 'flex', gap: '0.3rem' }}>
                {p.isHost && <span style={{ fontSize: '0.7rem', background: 'var(--brand)', color: '#fff', borderRadius: 6, padding: '0.15rem 0.4rem' }}>host</span>}
                {p.isMe && <span style={{ fontSize: '0.7rem', background: 'var(--panel2)', border: '1px solid var(--border)', borderRadius: 6, padding: '0.15rem 0.4rem', color: 'var(--text-muted)' }}>you</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {isHost && (
        <button className="btn danger full" onClick={() => onSend('end_game')}>
          End Session
        </button>
      )}
    </div>
  );
}
