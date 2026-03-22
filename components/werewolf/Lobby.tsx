'use client';
import { useState } from 'react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import type { GameState, RoleConfig } from '@/lib/werewolf/types';
import RoleCard from './RoleCard';

interface Props {
  gameState: GameState;
  myPlayerId: string;
  onSend: (type: string, payload?: unknown) => void;
}

const SPECIAL_ROLES = ['seer', 'witch', 'bodyguard', 'hunter'] as const;

export default function Lobby({ gameState, myPlayerId, onSend }: Props) {
  const { t } = useTranslation();
  const { room, players } = gameState;
  const isHost = players.find((p) => p.isMe)?.isHost ?? false;
  const [copied, setCopied] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showRoleGuide, setShowRoleGuide] = useState(false);
  const [showRoleConfig, setShowRoleConfig] = useState(false);
  const [wolfCount, setWolfCount] = useState(room.wolfCount ?? 1);
  const [discSecs, setDiscSecs] = useState(room.discussionSeconds ?? 60);
  const [gameMode, setGameMode] = useState<'phase' | 'reveal'>(room.gameMode ?? 'phase');

  // Role config state
  const [roleConfig, setRoleConfig] = useState<RoleConfig>(
    room.roleConfig || { seer: 0, witch: 0, bodyguard: 0, hunter: 0, customRoles: [] }
  );
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [newRoleActions, setNewRoleActions] = useState('');

  const maxWolves = Math.floor((players.length - 1) / 2) || 1;

  const copyCode = async () => {
    await navigator.clipboard.writeText(room.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const applySettings = () => {
    onSend('update_settings', { wolfCount, discussionSeconds: discSecs, gameMode });
    setShowSettings(false);
  };

  const updateAndSendRoleConfig = (updated: RoleConfig) => {
    setRoleConfig(updated);
    onSend('update_role_config', { roleConfig: updated });
  };

  const toggleRole = (role: typeof SPECIAL_ROLES[number]) => {
    const updated = { ...roleConfig, [role]: roleConfig[role] > 0 ? 0 : 1 };
    updateAndSendRoleConfig(updated);
  };

  const addCustomRole = () => {
    if (!newRoleName.trim()) return;
    const actions = newRoleActions.split(',').map((a) => a.trim()).filter(Boolean);
    const updated = {
      ...roleConfig,
      customRoles: [...roleConfig.customRoles, { name: newRoleName.trim(), desc: newRoleDesc.trim(), actions: actions.length ? actions : undefined }],
    };
    updateAndSendRoleConfig(updated);
    setNewRoleName('');
    setNewRoleDesc('');
    setNewRoleActions('');
  };

  const removeCustomRole = (idx: number) => {
    const updated = {
      ...roleConfig,
      customRoles: roleConfig.customRoles.filter((_, i) => i !== idx),
    };
    updateAndSendRoleConfig(updated);
  };

  const activeSpecialCount = SPECIAL_ROLES.filter((r) => roleConfig[r] > 0).length;
  const customCount = roleConfig.customRoles.length;

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '2rem 1rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Room code */}
      <div className="panel" style={{ textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>{t('ww.roomId')}</p>
        <div style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '0.15em', color: 'var(--brand)', marginBottom: '0.75rem' }}>
          {room.id}
        </div>
        <button className="btn ghost sm" onClick={copyCode}>
          {copied ? t('ww.copied') : t('ww.copyCode')}
        </button>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.75rem' }}>
          {t('ww.waitingForPlayers')}
        </p>
      </div>

      {/* Player list */}
      <div className="panel">
        <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>
          {t('ww.players')} ({players.length})
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {players.map((p) => (
            <div key={p.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'var(--panel2)', borderRadius: 10, padding: '0.6rem 1rem',
            }}>
              <span style={{ fontWeight: 600 }}>{p.name}</span>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                {p.isHost && <span style={{ fontSize: '0.75rem', background: 'var(--brand)', color: '#fff', borderRadius: 6, padding: '0.2rem 0.5rem', fontWeight: 600 }}>{t('ww.host')}</span>}
                {p.isMe && <span style={{ fontSize: '0.75rem', background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 6, padding: '0.2rem 0.5rem', color: 'var(--text-muted)' }}>{t('ww.you')}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Host controls */}
      {isHost && (
        <>
          {/* Settings */}
          <div className="panel">
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)', fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%' }}
              onClick={() => setShowSettings(!showSettings)}>
              ⚙️ {t('ww.settings')} {showSettings ? '▲' : '▼'}
            </button>

            {showSettings && (
              <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                    {t('ww.wolfCount')} — max {maxWolves} for {players.length} players
                  </label>
                  <input type="number" className="input" min={1} value={wolfCount}
                    onChange={(e) => setWolfCount(Math.max(1, +e.target.value))} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                    {t('ww.discussionTime')} ({t('ww.seconds')})
                  </label>
                  <select className="select" value={discSecs} onChange={(e) => setDiscSecs(+e.target.value)}>
                    {[30, 60, 90, 120].map((s) => <option key={s} value={s}>{s}s</option>)}
                  </select>
                </div>
                <div style={{ background: 'var(--panel2)', borderRadius: 10, padding: '0.75rem 1rem' }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {t('ww.wolfCount')}: <strong style={{ color: wolfCount > maxWolves ? 'var(--danger, #e53)' : 'var(--wolf)' }}>{wolfCount} 🐺</strong> &nbsp;
                    {t('ww.discussionTime')}: <strong style={{ color: 'var(--brand)' }}>{discSecs}s</strong>
                  </p>
                  {wolfCount > maxWolves && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--danger, #e53)', marginTop: '0.3rem' }}>
                      ⚠️ Wolf count too high — max {maxWolves} for {players.length} players
                    </p>
                  )}
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                    Game Mode
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {(['phase', 'reveal'] as const).map((mode) => (
                      <button key={mode} onClick={() => setGameMode(mode)}
                        className={gameMode === mode ? 'btn primary sm' : 'btn ghost sm'}
                        style={{ flex: 1 }}>
                        {mode === 'phase' ? '🌙 Phase Mode' : '🃏 Reveal Mode'}
                      </button>
                    ))}
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                    {gameMode === 'phase' ? 'Day/night phases with timer — app manages the game flow.' : 'Roles revealed only — players manage the game themselves.'}
                  </p>
                </div>
                <button className="btn primary" onClick={applySettings}>✓ {t('ww.apply')}</button>
              </div>
            )}
          </div>

          {/* Role Configuration */}
          <div className="panel">
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)', fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%' }}
              onClick={() => setShowRoleConfig(!showRoleConfig)}>
              🎭 {t('ww.roleConfig')}
              {(activeSpecialCount > 0 || customCount > 0) && (
                <span style={{ fontSize: '0.75rem', background: 'var(--brand)', color: '#fff', borderRadius: 999, padding: '0.1rem 0.5rem', fontWeight: 600 }}>
                  {activeSpecialCount + customCount}
                </span>
              )}
              <span style={{ marginLeft: 'auto' }}>{showRoleConfig ? '▲' : '▼'}</span>
            </button>

            {showRoleConfig && (
              <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Special roles toggles */}
                <div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>Special roles (villager team):</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {SPECIAL_ROLES.map((role) => (
                      <label key={role} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--panel2)', borderRadius: 8, padding: '0.6rem 1rem', cursor: 'pointer' }}>
                        <div>
                          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{t(`ww.role.${role}`)}</span>
                          <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                            {t(`ww.role.${role}.desc`)}
                          </span>
                        </div>
                        <input type="checkbox"
                          checked={roleConfig[role] > 0}
                          onChange={() => toggleRole(role)}
                          style={{ width: 18, height: 18, cursor: 'pointer', flexShrink: 0, marginLeft: '0.75rem' }}
                        />
                      </label>
                    ))}
                  </div>
                </div>

                {/* Custom roles */}
                <div>
                  <p style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.6rem' }}>{t('ww.customRoles')}:</p>
                  {roleConfig.customRoles.length === 0 && (
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>
                      No custom roles yet. Add cosmetic roles for villager-team players.
                    </p>
                  )}
                  {roleConfig.customRoles.map((r, i) => (
                    <div key={i} style={{ marginBottom: '0.4rem', background: 'var(--panel2)', borderRadius: 8, padding: '0.5rem 0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ flex: 1 }}>
                          <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{r.name}</span>
                          {r.desc && <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.desc}</span>}
                          {r.actions && r.actions.length > 0 && (
                            <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--brand)', marginTop: '0.2rem' }}>
                              Actions: {r.actions.join(', ')}
                            </span>
                          )}
                        </div>
                        <button className="btn ghost sm" onClick={() => removeCustomRole(i)} style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', flexShrink: 0 }}>✕</button>
                      </div>
                    </div>
                  ))}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <input className="input" placeholder={t('ww.roleNamePlaceholder')} value={newRoleName}
                      onChange={(e) => setNewRoleName(e.target.value)} />
                    <input className="input" placeholder={t('ww.roleDescPlaceholder')} value={newRoleDesc}
                      onChange={(e) => setNewRoleDesc(e.target.value)} />
                    <input className="input" placeholder='Actions (comma-separated, e.g. "Inspect, Curse")' value={newRoleActions}
                      onChange={(e) => setNewRoleActions(e.target.value)} />
                    <button className="btn ghost sm" onClick={addCustomRole} disabled={!newRoleName.trim()}>
                      + {t('ww.addCustomRole')}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Role guide */}
          <div className="panel">
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)', fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%' }}
              onClick={() => setShowRoleGuide(!showRoleGuide)}>
              📖 {t('ww.roleGuide')} {showRoleGuide ? '▲' : '▼'}
            </button>
            {showRoleGuide && (
              <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <RoleCard role="wolf" compact />
                <RoleCard role="villager" compact />
                {roleConfig.seer > 0 && <RoleCard role="seer" compact />}
                {roleConfig.witch > 0 && <RoleCard role="witch" compact />}
                {roleConfig.bodyguard > 0 && <RoleCard role="bodyguard" compact />}
                {roleConfig.hunter > 0 && <RoleCard role="hunter" compact />}
              </div>
            )}
          </div>

          <button className="btn primary full"
            disabled={players.length < 3}
            onClick={() => onSend('start_game')}
            title={players.length < 3 ? t('ww.minPlayers') : ''}
          >
            {players.length < 3 ? `${t('ww.minPlayers')} (${players.length}/3)` : t('ww.startGame')}
          </button>
        </>
      )}

      {!isHost && (
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          ⏳ {t('ww.waitingForPlayers')}
        </p>
      )}
    </div>
  );
}
