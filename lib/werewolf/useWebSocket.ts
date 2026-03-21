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

    setRoomClosed(false);
    setGameState(null);
    setError(null);

    let cancelled = false;
    let retryTimeout: ReturnType<typeof setTimeout> | null = null;

    function connect() {
      if (cancelled) return;

      let hadStateUpdate = false;
      let intentionalClose = false;

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${protocol}//${window.location.host}/ws?roomId=${roomId}&playerId=${playerId}`);
      wsRef.current = ws;

      ws.onopen = () => { setConnected(true); setError(null); };
      ws.onerror = () => { setConnected(false); };
      ws.onclose = () => {
        setConnected(false);
        if (!cancelled && !intentionalClose) {
          retryTimeout = setTimeout(connect, 3000);
        }
      };
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'state_update') { hadStateUpdate = true; setGameState(msg.payload); }
          if (msg.type === 'error') {
            if (!hadStateUpdate) { intentionalClose = true; setRoomClosed(true); }
            else setError(msg.payload.message);
          }
          if (msg.type === 'room_closed') { intentionalClose = true; setRoomClosed(true); }
        } catch { /* ignore */ }
      };
    }

    connect();

    return () => {
      cancelled = true;
      if (retryTimeout) clearTimeout(retryTimeout);
      wsRef.current?.close();
    };
  }, [roomId, playerId]);

  const send = useCallback((type: string, payload: unknown = {}) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, payload }));
    }
  }, []);

  return { gameState, connected, error, send, roomClosed };
}
