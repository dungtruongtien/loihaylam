'use client';
import { useState } from 'react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import type { GameState } from '@/lib/werewolf/types';

interface Props {
  gameState: GameState;
  onSend: (type: string, payload?: unknown) => void;
}

export default function NightWitch({ gameState, onSend }: Props) {
  const { t } = useTranslation();
  const { players, myRole, witchState } = gameState;
  const isHost = players.find((p) => p.isMe)?.isHost ?? false;
  const isWitch = myRole === 'witch';
  const [showPoisonList, setShowPoisonList] = useState(false);
  const [acted, setActed] = useState(false);

  const alivePlayers = players.filter((p) => p.isAlive && !p.isMe);

  const handleHeal = () => {
    if (!witchState?.nightTarget) return;
    onSend('witch_act', { useHeal: true, healTarget: witchState.nightTarget, usePoison: false });
    setActed(true);
  };

  const handlePoison = (targetId: string) => {
    onSend('witch_act', { useHeal: false, usePoison: true, poisonTarget: targetId });
    setActed(true);
  };

  const handleSkip = () => {
    onSend('skip_witch');
    setActed(true);
  };

  // Non-witch players see the waiting screen
  if (!isWitch) {
    return (
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '2rem 1rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🌙</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>{t('ww.phase.night')}</h2>
          <p style={{ color: 'var(--text-muted)' }}>{t('ww.nightActions.waiting')}</p>
        </div>
        <div className="panel" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>😴</div>
          <p style={{ color: 'var(--text-muted)' }}>{t('ww.phase.nightDesc')}</p>
        </div>
        {isHost && (
          <button className="btn ghost full" onClick={() => onSend('force_resolve_night')}>
            {t('ww.forceNight')}
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '2rem 1rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🧙</div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>{t('ww.witch.title')}</h2>
      </div>

      {acted ? (
        <div className="panel" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          ✓ You have acted. Waiting for night to resolve...
        </div>
      ) : (
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Wolf target info */}
          {witchState?.nightTarget ? (
            <div style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 10, padding: '0.75rem 1rem' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Tonight the wolves target:</p>
              <p style={{ fontWeight: 700, color: 'var(--wolf)', fontSize: '1.1rem' }}>💀 {witchState.nightTargetName}</p>
            </div>
          ) : (
            <div style={{ background: 'var(--panel2)', borderRadius: 10, padding: '0.75rem 1rem' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>The wolves haven't voted yet...</p>
            </div>
          )}

          {/* Heal potion */}
          <button
            className="btn primary full"
            disabled={!witchState?.nightTarget || witchState.usedHeal}
            onClick={handleHeal}
            style={{ opacity: witchState?.usedHeal ? 0.4 : 1 }}
          >
            {witchState?.usedHeal
              ? `💊 ${t('ww.witch.usedHeal')}`
              : `💊 ${t('ww.witch.save').replace('{name}', witchState?.nightTargetName || '...')}`}
          </button>

          {/* Poison */}
          {!showPoisonList ? (
            <button
              className="btn ghost full"
              disabled={witchState?.usedPoison}
              onClick={() => setShowPoisonList(true)}
              style={{ opacity: witchState?.usedPoison ? 0.4 : 1, color: 'var(--penalty)', borderColor: 'var(--penalty)' }}
            >
              {witchState?.usedPoison ? `☠️ ${t('ww.witch.usedPoison')}` : `☠️ ${t('ww.witch.poison')}`}
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Choose a target to poison:</p>
              {alivePlayers.map((p) => (
                <button key={p.id} className="btn ghost full"
                  style={{ justifyContent: 'flex-start', color: 'var(--penalty)', borderColor: 'rgba(225,29,72,0.3)' }}
                  onClick={() => handlePoison(p.id)}>
                  ☠️ {p.name}
                </button>
              ))}
              <button className="btn ghost full" onClick={() => setShowPoisonList(false)}>Cancel</button>
            </div>
          )}

          {/* Skip */}
          <button className="btn ghost full" onClick={handleSkip} style={{ color: 'var(--text-muted)' }}>
            {t('ww.witch.skip')}
          </button>

          {/* Potion status */}
          <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <span style={{ opacity: witchState?.usedHeal ? 0.4 : 1 }}>💊 Heal</span>
            <span>·</span>
            <span style={{ opacity: witchState?.usedPoison ? 0.4 : 1 }}>☠️ Poison</span>
          </div>
        </div>
      )}
    </div>
  );
}
