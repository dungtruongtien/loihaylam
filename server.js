// Custom Next.js server with WebSocket support (ws library)
// Single process: HTTP (Next.js) + WebSocket on same port — works on Render
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { WebSocketServer } = require('ws');
const { handleWsMessage } = require('./lib/ws/handler');
const { initDb } = require('./lib/db');

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT || '9999', 10);

// roomSockets: Map<roomId, Set<{ ws, playerId }>>
const roomSockets = new Map();

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  initDb();

  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const wss = new WebSocketServer({ noServer: true });

  wss.on('connection', (ws, _req, playerId, roomId) => {
    if (!roomSockets.has(roomId)) roomSockets.set(roomId, new Set());
    const client = { ws, playerId };
    roomSockets.get(roomId).add(client);

    // Send current state on connect
    handleWsMessage({ type: 'sync', payload: {} }, ws, roomSockets, roomId, playerId);

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        handleWsMessage(msg, ws, roomSockets, roomId, playerId);
      } catch {
        ws.send(JSON.stringify({ type: 'error', payload: { message: 'Invalid message format' } }));
      }
    });

    ws.on('close', () => {
      const room = roomSockets.get(roomId);
      if (room) {
        room.forEach((c) => { if (c.ws === ws) room.delete(c); });
        if (room.size === 0) roomSockets.delete(roomId);
      }
    });
  });

  httpServer.on('upgrade', (req, socket, head) => {
    const { pathname, query } = parse(req.url, true);
    if (pathname === '/ws') {
      const roomId = query.roomId;
      const playerId = query.playerId;
      if (!roomId || !playerId) { socket.destroy(); return; }
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit('connection', ws, req, String(playerId), String(roomId));
      });
    }
    // Other paths (e.g. _next/webpack-hmr) are left for Next.js to handle
  });

  httpServer.listen(port, hostname, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
