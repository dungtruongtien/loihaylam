// CommonJS — shared between server.js WS handler and Next.js API routes
const { getDb } = require('../db');
const { randomUUID } = require('crypto');

function genRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function createRoom({ hostName, wolfCount = 1, discussionSeconds = 60 }) {
  const db = getDb();
  const playerId = randomUUID();
  let roomId;
  // Ensure unique code
  do { roomId = genRoomCode(); } while (db.prepare('SELECT 1 FROM rooms WHERE id=?').get(roomId));

  db.prepare(`
    INSERT INTO rooms (id, host_player_id, phase, wolf_count, discussion_seconds, created_at)
    VALUES (?, ?, 'lobby', ?, ?, ?)
  `).run(roomId, playerId, wolfCount, discussionSeconds, Date.now());

  db.prepare(`
    INSERT INTO players (id, room_id, name, is_host, joined_at)
    VALUES (?, ?, ?, 1, ?)
  `).run(playerId, roomId, hostName, Date.now());

  return { roomId, playerId };
}

function joinRoom({ roomCode, playerName }) {
  const db = getDb();
  const room = db.prepare('SELECT * FROM rooms WHERE id=?').get(roomCode.toUpperCase());
  if (!room) return { error: 'Room not found' };
  if (room.phase !== 'lobby') return { error: 'Game already started' };

  const existing = db.prepare('SELECT * FROM players WHERE room_id=? AND name=?').get(room.id, playerName);
  if (existing) return { error: 'Name already taken in this room' };

  const playerId = randomUUID();
  db.prepare(`
    INSERT INTO players (id, room_id, name, is_host, joined_at)
    VALUES (?, ?, ?, 0, ?)
  `).run(playerId, room.id, playerName, Date.now());

  return { roomId: room.id, playerId };
}

function getRoom(roomId) {
  return getDb().prepare('SELECT * FROM rooms WHERE id=?').get(roomId) || null;
}

function getPlayers(roomId) {
  return getDb().prepare('SELECT * FROM players WHERE room_id=? ORDER BY joined_at ASC').all(roomId);
}

function updateRoom(roomId, fields) {
  const db = getDb();
  const sets = Object.keys(fields).map(k => `${k}=?`).join(', ');
  db.prepare(`UPDATE rooms SET ${sets} WHERE id=?`).run(...Object.values(fields), roomId);
}

function eliminatePlayer(playerId) {
  getDb().prepare('UPDATE players SET is_alive=0 WHERE id=?').run(playerId);
}

function updateSettings(roomId, hostId, { wolfCount, discussionSeconds }) {
  const db = getDb();
  const room = db.prepare('SELECT * FROM rooms WHERE id=?').get(roomId);
  if (!room || room.host_player_id !== hostId) return { error: 'Not authorized' };
  if (room.phase !== 'lobby') return { error: 'Game already started' };
  const updates = {};
  if (wolfCount !== undefined) updates.wolf_count = wolfCount;
  if (discussionSeconds !== undefined) updates.discussion_seconds = discussionSeconds;
  if (Object.keys(updates).length) updateRoom(roomId, updates);
  return { ok: true };
}

function deleteRoom(roomId) {
  getDb().prepare('DELETE FROM rooms WHERE id=?').run(roomId);
  // Players deleted automatically via ON DELETE CASCADE
}

module.exports = { createRoom, joinRoom, getRoom, getPlayers, updateRoom, eliminatePlayer, updateSettings, deleteRoom };
