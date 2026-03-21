// Werewolf game rules: role assignment, phase transitions, win conditions
const { getDb } = require('../db');
const { getRoom, getPlayers, updateRoom, eliminatePlayer } = require('./room-manager');

const SPECIAL_ROLES = ['seer', 'witch', 'bodyguard', 'hunter'];
const WOLF_ROLES = new Set(['wolf']);

function isVillagerTeam(role) {
  return !WOLF_ROLES.has(role);
}

function assignRoles(roomId) {
  const db = getDb();
  const room = getRoom(roomId);
  if (!room) return { error: 'Room not found' };

  const players = getPlayers(roomId);
  const hostId = room.host_player_id;

  // Exclude host from game role assignment — host is always 'host'
  const nonHostPlayers = players.filter((p) => p.id !== hostId);
  if (nonHostPlayers.length < 3) return { error: 'Need at least 3 non-host players' };

  const assign = db.prepare('UPDATE players SET role=? WHERE id=?');

  // Assign host role
  assign.run('host', hostId);

  // If all non-host players already have roles seeded (e.g. via test API), skip random assignment
  if (nonHostPlayers.every((p) => p.role)) {
    const wolfIds = nonHostPlayers.filter((p) => p.role === 'wolf').map((p) => p.id);
    return { wolfIds };
  }

  const roleConfig = JSON.parse(room.role_config || '{"seer":0,"witch":0,"bodyguard":0,"hunter":0,"customRoles":[]}');
  const maxWolves = Math.floor((nonHostPlayers.length - 1) / 2);
  if (room.wolf_count > maxWolves) {
    return { error: `Wolf count must be at most ${maxWolves} for ${nonHostPlayers.length} players (wolves < players / 2)` };
  }
  const wolfCount = room.wolf_count;
  const shuffled = [...nonHostPlayers].sort(() => Math.random() - 0.5);

  let idx = 0;

  // Assign wolves
  for (let i = 0; i < wolfCount; i++) {
    assign.run('wolf', shuffled[idx].id);
    idx++;
  }

  // Assign special villager roles
  for (const role of SPECIAL_ROLES) {
    if (roleConfig[role] >= 1 && idx < shuffled.length) {
      assign.run(role, shuffled[idx].id);
      idx++;
    }
  }

  // Assign custom roles then regular villagers
  const customRoles = roleConfig.customRoles || [];
  let customIdx = 0;
  for (; idx < shuffled.length; idx++) {
    if (customIdx < customRoles.length) {
      assign.run(customRoles[customIdx].name, shuffled[idx].id);
      customIdx++;
    } else {
      assign.run('villager', shuffled[idx].id);
    }
  }

  const wolfIds = shuffled.slice(0, wolfCount).map((p) => p.id);
  return { wolfIds };
}

function checkWinCondition(roomId) {
  const players = getPlayers(roomId);
  const alive = players.filter((p) => p.is_alive && p.role !== 'host');
  const wolves = alive.filter((p) => p.role === 'wolf');
  const villagers = alive.filter((p) => isVillagerTeam(p.role));

  if (wolves.length === 0) return 'villagers';
  if (wolves.length >= villagers.length) return 'wolves';
  return null;
}

function tallyVotes(votes) {
  const counts = {};
  for (const targetId of Object.values(votes)) {
    counts[targetId] = (counts[targetId] || 0) + 1;
  }
  if (!Object.keys(counts).length) return null;
  let maxVotes = 0;
  let winner = null;
  let tie = false;
  for (const [id, count] of Object.entries(counts)) {
    if (count > maxVotes) { maxVotes = count; winner = id; tie = false; }
    else if (count === maxVotes) { tie = true; }
  }
  return tie ? null : winner;
}

function resolveNightKills(room) {
  const actions = JSON.parse(room.night_actions || '{}');
  const wolfTarget = tallyVotes(JSON.parse(room.night_votes || '{}'));
  let eliminated = wolfTarget;

  // Bodyguard protection
  if (actions.bodyguardTargetId && actions.bodyguardTargetId === wolfTarget) {
    eliminated = null;
  }

  return { eliminated, wolfTarget };
}

function startGame(roomId) {
  const result = assignRoles(roomId);
  if (result.error) return result;
  updateRoom(roomId, {
    phase: 'role_reveal',
    night_votes: '{}', day_votes: '{}',
    eliminated_last: null, winner: null,
    night_actions: '{}',
    last_bodyguard_target: null,
    defender_id: null, defend_message: null, defend_ends_at: null,
    game_log: '[]',
  });
  return { ok: true };
}

function advanceToNight(roomId) {
  updateRoom(roomId, { phase: 'night', night_votes: '{}', night_actions: '{}' });
  return { ok: true };
}

function castNightVote(roomId, voterId, targetId) {
  const room = getRoom(roomId);
  if (!room || room.phase !== 'night') return { error: 'Not in night phase' };

  const players = getPlayers(roomId);
  const voter = players.find((p) => p.id === voterId);
  if (!voter || voter.role !== 'wolf' || !voter.is_alive) return { error: 'Not a wolf or not alive' };

  const target = players.find((p) => p.id === targetId);
  if (!target || !target.is_alive || target.role === 'wolf' || target.role === 'host') return { error: 'Invalid target' };

  const votes = JSON.parse(room.night_votes || '{}');
  votes[voterId] = targetId;
  updateRoom(roomId, { night_votes: JSON.stringify(votes) });

  return { ok: true, pending: true };
}

function castDayVote(roomId, voterId, targetId) {
  const room = getRoom(roomId);
  if (!room || room.phase !== 'day_vote') return { error: 'Not in voting phase' };

  const players = getPlayers(roomId);
  const voter = players.find((p) => p.id === voterId);
  if (!voter || !voter.is_alive) return { error: 'Player not alive' };

  const target = players.find((p) => p.id === targetId);
  if (!target || !target.is_alive || target.role === 'host') return { error: 'Invalid target' };

  const votes = JSON.parse(room.day_votes || '{}');
  votes[voterId] = targetId;
  updateRoom(roomId, { day_votes: JSON.stringify(votes) });

  // Auto-resolve when all alive non-host players voted
  const alivePlayers = players.filter((p) => p.is_alive && p.role !== 'host');
  if (alivePlayers.every((p) => votes[p.id])) return { ok: true, autoResolve: true };

  return { ok: true, pending: true };
}

function startDayVote(roomId) {
  updateRoom(roomId, { phase: 'day_vote', day_votes: '{}' });
  return { ok: true };
}

function restartGame(roomId) {
  const db = getDb();
  db.prepare('UPDATE players SET role=NULL, is_alive=1 WHERE room_id=?').run(roomId);
  updateRoom(roomId, {
    phase: 'lobby',
    night_votes: '{}', day_votes: '{}',
    winner: null, eliminated_last: null,
    timer_ends_at: null,
    night_actions: '{}',
    last_bodyguard_target: null,
    defender_id: null, defend_message: null, defend_ends_at: null,
    game_log: '[]',
  });
  return { ok: true };
}

module.exports = {
  startGame, advanceToNight, castNightVote,
  castDayVote, startDayVote,
  checkWinCondition, restartGame, tallyVotes, resolveNightKills, SPECIAL_ROLES, isVillagerTeam,
};
