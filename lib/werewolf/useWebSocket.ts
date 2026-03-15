'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import type { GameState } from './types';

export function useWebSocket(roomId: string | null, playerId: string | null) {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roomClosed, setRoomClosed] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!roomId || !playerId) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws?roomId=${roomId}&playerId=${playerId}`);

    ws.onopen = () => { setConnected(true); setError(null); };
    ws.onclose = () => { setConnected(false); };
    ws.onerror = () => { setError('Connection lost. Please refresh.'); setConnected(false); };
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'state_update') setGameState(msg.payload);
        if (msg.type === 'error') setError(msg.payload.message);
        if (msg.type === 'room_closed') setRoomClosed(true);
      } catch { /* ignore */ }
    };

    wsRef.current = ws;
    return () => ws.close();
  }, [roomId, playerId]);

  const send = useCallback((type: string, payload: unknown = {}) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, payload }));
    }
  }, []);

  return { gameState, connected, error, send, roomClosed };
}
