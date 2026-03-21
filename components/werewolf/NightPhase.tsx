'use client';
import { useTranslation } from '@/lib/i18n/useTranslation';
import type { GameState } from '@/lib/werewolf/types';

interface Props {
  gameState: GameState;
  onSend: (type: string, payload?: unknown) => void;
}

export default function NightPhase({ gameState, onSend }: Props) {
  const { t } = useTranslation();
  const { players, myRole, nightVotes, myNightVote, wolves, seerResult, bodyguardLastTarget } = gameState;
  const isHost = players.find((p) => p.isMe)?.isHost ?? false;
  const isWolf = myRole === 'wolf';
  const isSeer = myRole === 'seer';
  const isBodyguard = myRole === 'bodyguard';
  const me = players.find((p) => p.isMe);

  const aliveVillagers = players.filter((p) => p.isAlive && !wolves.includes(p.id));
  const aliveWolves = players.filter((p) => p.isAlive && wolves.includes(p.id));
  const votedCount = aliveWolves.filter((w) => nightVotes[w.id]).length;

  const nightActionsProgress = gameState.nightActions;
  const seerActed = isSeer && !!(nightActionsProgress?.seerActed);
  const bodyguardActed = isBodyguard && !!(nightActionsProgress?.bodyguardActed);

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '2rem 1rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🌙</div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>{t('ww.phase.night')}</h2>
        <p style={{ color: 'var(--text-muted)' }}>
          {isWolf ? t('ww.phase.nightWolf')
            : isSeer ? t('ww.role.seer.nightPrompt')
            : isBodyguard ? t('ww.role.bodyguard.nightPrompt')
            : t('ww.phase.villagerWait')}
        </p>
      </div>

      {/* Wolves: vote panel */}
      {isWolf && (
        <div className="panel">
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            🐺 {votedCount}/{aliveWolves.length} {t('ww.wolvesVoted')}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {aliveVillagers.map((p) => (
              <button key={p.id} className="btn"
                disabled={!!myNightVote}
                onClick={() => onSend('night_vote', { targetId: p.id })}
                style={{
                  background: myNightVote === p.id ? 'var(--wolf)' : 'var(--panel2)',
                  color: myNightVote === p.id ? '#fff' : 'var(--text)',
                  border: '1px solid var(--border)',
                  justifyContent: 'space-between',
                  padding: '0.75rem 1rem',
                }}>
                <span>🏡 {p.name}</span>
                {myNightVote === p.id && <span>✓ {t('ww.voted')}</span>}
                {myNightVote !== p.id && !myNightVote && <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{t('ww.vote')}</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Seer: investigate panel */}
      {isSeer && (
        <div className="panel">
          <p style={{ fontWeight: 700, marginBottom: '0.75rem' }}>🔍 {t('ww.role.seer')}</p>
          {seerActed ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1rem 0' }}>
              ✓ {t('ww.night.actionSubmitted')}
              {seerResult && (
                <div style={{
                  marginTop: '0.75rem',
                  padding: '0.5rem 1rem',
                  borderRadius: 8,
                  background: seerResult.isWolf ? 'rgba(220,38,38,0.1)' : 'rgba(37,99,235,0.1)',
                  color: seerResult.isWolf ? 'var(--wolf)' : 'var(--villager)',
                  fontWeight: 700,
                }}>
                  {seerResult.targetName}: {seerResult.isWolf ? '🐺 Wolf' : '🏡 Not a wolf'}
                </div>
              )}
            </div>
          ) : (
            <>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                Choose a player to investigate:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {players.filter((p) => p.isAlive && !p.isMe).map((p) => (
                  <button key={p.id} className="btn"
                    onClick={() => onSend('seer_investigate', { targetId: p.id })}
                    style={{ background: 'var(--panel2)', border: '1px solid var(--border)', justifyContent: 'space-between', padding: '0.65rem 1rem' }}>
                    <span>{p.name}</span>
                    <span style={{ color: 'var(--brand)', fontSize: '0.8rem' }}>🔍 Investigate</span>
                  </button>
                ))}
              </div>
              <button className="btn ghost full" style={{ marginTop: '0.5rem' }} onClick={() => onSend('skip_night_action')}>
                Skip (no action)
              </button>
            </>
          )}
        </div>
      )}

      {/* Bodyguard: protect panel */}
      {isBodyguard && (
        <div className="panel">
          <p style={{ fontWeight: 700, marginBottom: '0.75rem' }}>🛡 {t('ww.role.bodyguard')}</p>
          {bodyguardActed ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1rem 0' }}>
              ✓ {t('ww.night.actionSubmitted')}
            </div>
          ) : (
            <>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                Choose a player to protect tonight:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {players.filter((p) => p.isAlive).map((p) => {
                  const isSelf = p.isMe;
                  const isLastTarget = p.id === bodyguardLastTarget;
                  const disabled = isLastTarget;
                  return (
                    <button key={p.id} className="btn"
                      disabled={disabled}
                      onClick={() => !disabled && onSend('bodyguard_protect', { targetId: p.id })}
                      style={{
                        background: 'var(--panel2)',
                        border: '1px solid var(--border)',
                        justifyContent: 'space-between',
                        padding: '0.65rem 1rem',
                        opacity: disabled ? 0.4 : 1,
                      }}>
                      <span>{p.name}{isSelf ? ' (you)' : ''}</span>
                      {isLastTarget
                        ? <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Last night's pick</span>
                        : <span style={{ color: 'var(--brand)', fontSize: '0.8rem' }}>🛡 Protect</span>
                      }
                    </button>
                  );
                })}
              </div>
              <button className="btn ghost full" style={{ marginTop: '0.5rem' }} onClick={() => onSend('skip_night_action')}>
                Skip (no action)
              </button>
            </>
          )}
        </div>
      )}

      {/* Regular villager: waiting */}
      {!isWolf && !isSeer && !isBodyguard && (
        <div className="panel" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem', animation: 'pulse 2s infinite' }}>😴</div>
          <p style={{ color: 'var(--text-muted)' }}>{t('ww.phase.nightDesc')}</p>
        </div>
      )}

      {/* Host: end night manually */}
      {isHost && (
        <button className="btn primary full" onClick={() => onSend('end_night')}>
          {t('ww.endNight')}
        </button>
      )}
    </div>
  );
}
