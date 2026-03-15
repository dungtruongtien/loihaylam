'use client';
import { useState, useEffect } from 'react';
import { useWebSocket } from '@/lib/werewolf/useWebSocket';
import { useTranslation } from '@/lib/i18n/useTranslation';
import Lobby from './Lobby';
import RoleReveal from './RoleReveal';
import NightPhase from './NightPhase';
import NightWitch from './NightWitch';
import DayPhase from './DayPhase';
import VotePanel from './VotePanel';
import DayDefend from './DayDefend';
import HunterShoot from './HunterShoot';
import ResultBanner from './ResultBanner';
import GameLog from './GameLog';

const ROOM_KEY = 'ww_room_id';
const PLAYER_KEY = 'ww_player_id';

type View = 'home' | 'creating' | 'joining' | 'game';

export default function WerewolfGame() {
  const { t } = useTranslation();
  const [view, setView] = useState<View>('home');
  const [roomId, setRoomId] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const { gameState, connected, error: wsError, send, roomClosed } = useWebSocket(roomId, playerId);

  useEffect(() => { if (roomClosed) clearSession(); }, [roomClosed]);

  // Restore session on load
  useEffect(() => {
    const storedRoom = sessionStorage.getItem(ROOM_KEY);
    const storedPlayer = sessionStorage.getItem(PLAYER_KEY);
    if (storedRoom && storedPlayer) {
      setRoomId(storedRoom);
      setPlayerId(storedPlayer);
      setView('game');
    }
  }, []);

  const persist = (rId: string, pId: string) => {
    sessionStorage.setItem(ROOM_KEY, rId);
    sessionStorage.setItem(PLAYER_KEY, pId);
  };

  const clearSession = () => {
    sessionStorage.removeItem(ROOM_KEY);
    sessionStorage.removeItem(PLAYER_KEY);
    setRoomId(null);
    setPlayerId(null);
    setView('home');
  };

  const handleCreate = async () => {
    if (!nameInput.trim()) { setFormError(`${t('ww.yourName')} ${t('ww.required')}`); return; }
    setLoading(true); setFormError(null);
    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostName: nameInput.trim() }),
      });
      const data = await res.json();
      if (data.error) { setFormError(data.error); return; }
      persist(data.roomId, data.playerId);
      setRoomId(data.roomId);
      setPlayerId(data.playerId);
      setView('game');
    } catch { setFormError(t('ww.networkError')); }
    finally { setLoading(false); }
  };

  const handleJoin = async () => {
    if (!nameInput.trim()) { setFormError(`${t('ww.yourName')} ${t('ww.required')}`); return; }
    if (!codeInput.trim()) { setFormError(`${t('ww.roomCode')} ${t('ww.required')}`); return; }
    setLoading(true); setFormError(null);
    try {
      const res = await fetch(`/api/rooms/${codeInput.trim().toUpperCase()}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName: nameInput.trim() }),
      });
      const data = await res.json();
      if (data.error) { setFormError(data.error); return; }
      persist(data.roomId, data.playerId);
      setRoomId(data.roomId);
      setPlayerId(data.playerId);
      setView('game');
    } catch { setFormError(t('ww.networkError')); }
    finally { setLoading(false); }
  };

  // ── Home screen ──
  if (view === 'home') {
    return (
      <div style={{ maxWidth: 400, margin: '0 auto', padding: '3rem 1rem', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ fontSize: '4rem' }}>🐺</div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>{t('ww.title')}</h1>
        <p style={{ color: 'var(--text-muted)' }}>{t('ww.description')}</p>
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', justifyContent: 'center' }}>
          <button className="btn primary" onClick={() => { setView('creating'); setFormError(null); }}>{t('ww.createRoom')}</button>
          <button className="btn ghost" onClick={() => { setView('joining'); setFormError(null); }}>{t('ww.joinRoom')}</button>
        </div>
      </div>
    );
  }

  // ── Create / Join forms ──
  if (view === 'creating' || view === 'joining') {
    const isCreate = view === 'creating';
    return (
      <div style={{ maxWidth: 380, margin: '0 auto', padding: '2rem 1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', alignSelf: 'flex-start', fontSize: '0.9rem' }}
          onClick={() => setView('home')}>{t('ww.back')}</button>
        <h2 style={{ fontWeight: 800, fontSize: '1.4rem' }}>{isCreate ? t('ww.createRoom') : t('ww.joinRoom')}</h2>

        <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{t('ww.yourName')}</label>
        <input className="input" value={nameInput} onChange={(e) => setNameInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (isCreate ? handleCreate() : handleJoin())}
          placeholder={t('ww.namePlaceholder')} autoFocus />

        {!isCreate && (
          <>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{t('ww.roomCode')}</label>
            <input className="input" value={codeInput}
              onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
              placeholder={t('ww.roomCodePlaceholder')}
              style={{ letterSpacing: '0.1em', fontWeight: 700 }} />
          </>
        )}

        {formError && <p style={{ color: 'var(--penalty)', fontSize: '0.9rem' }}>⚠️ {formError}</p>}

        <button className="btn primary full" disabled={loading}
          onClick={isCreate ? handleCreate : handleJoin}>
          {loading ? '...' : (isCreate ? t('ww.create') : t('ww.join'))}
        </button>
      </div>
    );
  }

  // ── Game screen ──
  if (!roomId || !playerId) return null;

  if (!connected && !gameState) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
        <p style={{ color: 'var(--text-muted)' }}>{t('ww.connecting')}</p>
        {wsError && <p style={{ color: 'var(--penalty)', marginTop: '0.5rem' }}>{wsError}</p>}
        <button className="btn ghost sm" style={{ marginTop: '1rem' }} onClick={clearSession}>{t('ww.leaveRoom')}</button>
      </div>
    );
  }

  if (!gameState) return <div style={{ textAlign: 'center', padding: '3rem' }}>{t('ww.loading')}</div>;

  const phase = gameState.room.phase;
  const myRole = gameState.myRole;
  const myName = gameState.players.find((p) => p.isMe)?.name;
  const showIdentityBar = phase !== 'lobby' && myRole !== null;

  return (
    <div>
      {/* Connection status bar */}
      <div style={{
        position: 'sticky', top: 64, zIndex: 50,
        background: connected ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
        borderBottom: `1px solid ${connected ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
        padding: '0.35rem 1rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        fontSize: '0.8rem', color: connected ? 'var(--truth)' : 'var(--penalty)',
      }}>
        <span>{connected ? `● ${t('ww.connected')}` : `○ ${t('ww.reconnecting')}`}</span>
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.8rem' }}
          onClick={clearSession}>{t('ww.leaveRoom')}</button>
      </div>

      {/* Player identity bar — shown after roles are assigned */}
      {showIdentityBar && myRole && myName && (
        <div style={{
          position: 'sticky', top: 92, zIndex: 49,
          background: myRole === 'wolf' ? 'rgba(127,29,29,0.6)' : 'rgba(30,58,95,0.6)',
          borderBottom: `1px solid ${myRole === 'wolf' ? 'rgba(239,68,68,0.25)' : 'rgba(59,130,246,0.25)'}`,
          backdropFilter: 'blur(8px)',
          padding: '0.4rem 1rem',
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          fontSize: '0.85rem', fontWeight: 700,
        }}>
          <span>{myRole === 'wolf' ? '🐺' : myRole === 'seer' ? '🔮' : myRole === 'witch' ? '🧙' : myRole === 'bodyguard' ? '🛡' : myRole === 'hunter' ? '🏹' : '🏡'}</span>
          <span style={{ color: '#fff' }}>{myName}</span>
          <span style={{ color: 'rgba(255,255,255,0.35)', fontWeight: 400 }}>•</span>
          <span style={{ color: myRole === 'wolf' ? '#fca5a5' : '#93c5fd' }}>
            {['wolf','villager','seer','witch','bodyguard','hunter'].includes(myRole) ? t(`ww.role.${myRole}`) : myRole}
          </span>
        </div>
      )}

      {wsError && (
        <div style={{ background: 'rgba(239,68,68,0.1)', padding: '0.5rem 1rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--penalty)' }}>
          {wsError}
        </div>
      )}

      {phase === 'lobby' && <Lobby gameState={gameState} myPlayerId={playerId} onSend={send} />}
      {phase === 'role_reveal' && <RoleReveal gameState={gameState} onSend={send} />}
      {phase === 'night' && <NightPhase gameState={gameState} onSend={send} />}
      {phase === 'night_witch' && <NightWitch gameState={gameState} onSend={send} />}
      {phase === 'day_discuss' && <DayPhase gameState={gameState} onSend={send} />}
      {phase === 'day_vote' && <VotePanel gameState={gameState} onSend={send} />}
      {phase === 'day_defend' && <DayDefend gameState={gameState} onSend={send} />}
      {phase === 'hunter_shoot' && <HunterShoot gameState={gameState} onSend={send} />}
      {phase === 'ended' && <ResultBanner gameState={gameState} onSend={send} />}

      {/* Host-only game log — shown during all active phases */}
      {gameState.players.find((p) => p.isMe)?.isHost && phase !== 'lobby' && phase !== 'role_reveal' && (
        <GameLog gameState={gameState} />
      )}
    </div>
  );
}
