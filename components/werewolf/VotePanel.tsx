'use client';
import { useTranslation } from '@/lib/i18n/useTranslation';
import type { GameState } from '@/lib/werewolf/types';

interface Props {
  gameState: GameState;
  onSend: (type: string, payload?: unknown) => void;
}

export default function VotePanel({ gameState, onSend }: Props) {
  const { t } = useTranslation();
  const { players, dayVotes, myVote } = gameState;
  const isHost = players.find((p) => p.isMe)?.isHost ?? false;
  const me = players.find((p) => p.isMe);
  const canVote = me?.isAlive && !myVote;

  const alivePlayers = players.filter((p) => p.isAlive);
  const votedCount = alivePlayers.filter((p) => dayVotes[p.id]).length;

  // Count votes per target for display
  const voteCounts: Record<string, number> = {};
  for (const targetId of Object.values(dayVotes)) {
    voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
  }

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '2rem 1rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🗳️</div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>{t('ww.phase.vote')}</h2>
        <p style={{ color: 'var(--text-muted)' }}>{t('ww.phase.voteDesc')}</p>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
          {votedCount}/{alivePlayers.length} {t('ww.allVoted')}
        </p>
      </div>

      {myVote && (
        <div style={{ background: 'rgba(14,165,233,0.15)', borderRadius: 12, padding: '0.75rem', textAlign: 'center', border: '1px solid rgba(14,165,233,0.3)' }}>
          <p style={{ fontSize: '0.9rem' }}>
            {t('ww.phase.youVoted')} <strong>{players.find((p) => p.id === myVote)?.name}</strong>
          </p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {alivePlayers.map((p) => {
          const voteCount = voteCounts[p.id] || 0;
          const isMeVotingThis = myVote === p.id;
          return (
            <button key={p.id} className="btn"
              disabled={!canVote || p.isMe}
              onClick={() => canVote && !p.isMe && onSend('day_vote', { targetId: p.id })}
              style={{
                background: isMeVotingThis ? 'rgba(239,68,68,0.2)' : 'var(--panel2)',
                border: `1px solid ${isMeVotingThis ? 'rgba(239,68,68,0.5)' : 'var(--border)'}`,
                color: 'var(--text)',
                justifyContent: 'space-between',
                padding: '0.75rem 1rem',
                cursor: (canVote && !p.isMe) ? 'pointer' : 'default',
              }}>
              <span>{p.name} {p.isMe ? `(${t('ww.you')})` : ''}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {voteCount > 0 && (
                  <span style={{ background: 'rgba(239,68,68,0.3)', borderRadius: 999, padding: '0.1rem 0.5rem', fontSize: '0.8rem', fontWeight: 700 }}>
                    {voteCount} 🗳️
                  </span>
                )}
                {isMeVotingThis && <span style={{ fontSize: '0.8rem', color: 'var(--penalty)' }}>✓ {t('ww.voted')}</span>}
              </div>
            </button>
          );
        })}
      </div>

      {isHost && (
        <button className="btn ghost full" onClick={() => onSend('force_resolve_day')}>
          {t('ww.phase.forceResolve')}
        </button>
      )}
    </div>
  );
}
