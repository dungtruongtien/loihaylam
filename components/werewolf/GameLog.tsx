'use client';
import { useState } from 'react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import type { GameState, GameLogEntry } from '@/lib/werewolf/types';

interface Props {
  gameState: GameState;
}

const ACTION_ICONS: Record<string, string> = {
  wolf_vote: '🐺',
  seer_investigate: '🔍',
  seer_skip: '🔍',
  bodyguard_protect: '🛡',
  bodyguard_skip: '🛡',
  defend: '🗣',
  day_vote: '🗳',
  day_vote_resolved: '⚖️',
  eliminated: '💀',
  custom_action: '⚡',
};

function formatEntry(entry: GameLogEntry): string {
  const icon = ACTION_ICONS[entry.action] || '•';
  const actor = entry.actorName ? `${entry.actorName} ` : '';
  const target = entry.targetName ? `→ ${entry.targetName}` : '';
  const detail = entry.detail ? ` (${entry.detail})` : '';

  switch (entry.action) {
    case 'wolf_vote': return `${icon} ${actor}voted to eliminate ${entry.targetName}`;
    case 'seer_investigate': return `${icon} ${actor}investigated ${entry.targetName}${detail}`;
    case 'seer_skip': return `${icon} ${actor}skipped (no investigation)`;
    case 'bodyguard_protect': return `${icon} ${actor}protected ${entry.targetName}`;
    case 'bodyguard_skip': return `${icon} ${actor}skipped (no protection)`;
    case 'defend': return `${icon} ${actor}: "${entry.detail}"`;
    case 'day_vote': return `${icon} ${actor}voted for ${entry.targetName}`;
    case 'day_vote_resolved': return `${icon} Day vote: ${entry.targetName} convicted`;
    case 'eliminated': return `${icon} ${entry.targetName} was eliminated`;
    case 'custom_action': return `${icon} ${actor}used action: ${entry.detail}`;
    default: return `• ${actor}${target}${detail}`;
  }
}

function phaseLabel(phase: string): string {
  const map: Record<string, string> = {
    night: '🌙 Night',
    day_vote: '🗳 Day Vote',
    day_defend: '⚖️ Defense',
  };
  return map[phase] || phase;
}

export default function GameLog({ gameState }: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const log = gameState.gameLog || [];

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 1rem 1.5rem' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          background: 'var(--panel)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: '0.65rem 1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          fontWeight: 700,
          fontSize: '0.9rem',
          color: 'var(--text)',
        }}>
        <span>📋 {t('ww.gameLog')} ({log.length})</span>
        <span>{open ? '▲' : '▼'}</span>
      </button>

      {open && log.length > 0 && (
        <div className="panel" style={{ marginTop: '0.5rem', padding: '1rem', maxHeight: 360, overflowY: 'auto' }}>
          {/* Group by phase */}
          {(() => {
            const groups: Array<{ key: string; entries: GameLogEntry[] }> = [];
            for (const entry of log) {
              const key = entry.phase;
              if (!groups.length || groups[groups.length - 1].key !== key) {
                groups.push({ key, entries: [entry] });
              } else {
                groups[groups.length - 1].entries.push(entry);
              }
            }
            return groups.map((g, gi) => (
              <div key={gi} style={{ marginBottom: '1rem' }}>
                <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--brand)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {phaseLabel(g.key)}
                </p>
                {g.entries.map((entry, i) => (
                  <p key={i} style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.7, paddingLeft: '0.5rem' }}>
                    {formatEntry(entry)}
                  </p>
                ))}
              </div>
            ));
          })()}
        </div>
      )}

      {open && log.length === 0 && (
        <div className="panel" style={{ marginTop: '0.5rem', textAlign: 'center', color: 'var(--text-muted)', padding: '1rem', fontSize: '0.85rem' }}>
          No actions yet.
        </div>
      )}
    </div>
  );
}
