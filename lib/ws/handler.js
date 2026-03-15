// WebSocket message router — handles all game actions and state broadcasts
const { getRoom, getPlayers, updateRoom, updateSettings, deleteRoom, eliminatePlayer } = require('../werewolf/room-manager');
const {
  startGame, advanceToNight, castNightVote,
  castDayVote, startDayVote,
  checkWinCondition, restartGame, tallyVotes, resolveNightKills, SPECIAL_ROLES, isVillagerTeam,
} = require('../werewolf/game-logic');

// ── Game log helper ──────────────────────────────────────────────────────────
function appendLog(roomId, entry) {
  const room = getRoom(roomId);
  if (!room) return;
  const log = JSON.parse(room.game_log || '[]');
  log.push({ ...entry, ts: Date.now() });
  updateRoom(roomId, { game_log: JSON.stringify(log) });
}

// ── Night resolution ─────────────────────────────────────────────────────────
function resolveAndAdvanceFromNight(roomId, roomSockets) {
  const room = getRoom(roomId);
  const players = getPlayers(roomId);
  const { eliminated, poisonTarget } = resolveNightKills(room);

  if (eliminated) {
    eliminatePlayer(eliminated);
    appendLog(roomId, { phase: 'night', action: 'eliminated', targetName: players.find((p) => p.id === eliminated)?.name });
  }
  if (poisonTarget) {
    eliminatePlayer(poisonTarget);
    appendLog(roomId, { phase: 'night', action: 'witch_poison_kill', targetName: players.find((p) => p.id === poisonTarget)?.name });
  }

  // Update bodyguard last target
  const actions = JSON.parse(room.night_actions || '{}');
  if (actions.bodyguardTargetId) {
    updateRoom(roomId, { last_bodyguard_target: actions.bodyguardTargetId });
  }

  // Reset night state
  updateRoom(roomId, { night_actions: '{}', night_votes: '{}' });

  const winner = checkWinCondition(roomId);

  // Check if any eliminated player is hunter
  const allPlayers = getPlayers(roomId);
  const eliminatedPlayer = eliminated ? allPlayers.find((p) => p.id === eliminated) : null;
  const poisonPlayer = poisonTarget ? allPlayers.find((p) => p.id === poisonTarget) : null;
  const hunterEliminated = [eliminatedPlayer, poisonPlayer].find((p) => p && p.role === 'hunter');

  if (hunterEliminated) {
    updateRoom(roomId, {
      phase: 'hunter_shoot',
      hunter_id: hunterEliminated.id,
      pre_hunter_phase: winner ? 'ended' : 'day_discuss',
      winner: winner || null,
      eliminated_last: eliminated || poisonTarget || null,
    });
  } else if (winner) {
    updateRoom(roomId, { phase: 'ended', winner, eliminated_last: eliminated || poisonTarget || null });
  } else {
    const room2 = getRoom(roomId);
    const timerEndsAt = Date.now() + room2.discussion_seconds * 1000;
    updateRoom(roomId, { phase: 'day_discuss', eliminated_last: eliminated || null, day_votes: '{}', timer_ends_at: timerEndsAt });
  }

  broadcast(roomSockets, roomId);
}

// ── Check if all night roles have acted ──────────────────────────────────────
function checkNightComplete(roomId, roomSockets) {
  const room = getRoom(roomId);
  const players = getPlayers(roomId).filter((p) => p.is_alive);
  const actions = JSON.parse(room.night_actions || '{}');
  const nightVotes = JSON.parse(room.night_votes || '{}');

  const wolves = players.filter((p) => p.role === 'wolf');
  const seer = players.find((p) => p.role === 'seer');
  const bodyguard = players.find((p) => p.role === 'bodyguard');

  const allWolvesVoted = wolves.length > 0 && wolves.every((w) => nightVotes[w.id]);
  const seerActed = !seer || actions.seerTargetId || actions.seerSkipped;
  const bodyguardActed = !bodyguard || actions.bodyguardTargetId || actions.bodyguardSkipped;

  if (allWolvesVoted && seerActed && bodyguardActed) {
    const witch = players.find((p) => p.role === 'witch');
    const witchHasPotions = witch && (!room.witch_used_heal || !room.witch_used_poison);
    if (witchHasPotions) {
      updateRoom(roomId, { phase: 'night_witch' });
      broadcast(roomSockets, roomId);
    } else {
      resolveAndAdvanceFromNight(roomId, roomSockets);
    }
  }
}

// ── Defend phase advancement ──────────────────────────────────────────────────
function advanceFromDefend(roomId, roomSockets) {
  const room = getRoom(roomId);
  const defenderId = room.defender_id;
  if (!defenderId) return;

  // Get all players BEFORE elimination to check role
  const allPlayers = getPlayers(roomId);
  const defenderPlayer = allPlayers.find((p) => p.id === defenderId);

  eliminatePlayer(defenderId);
  appendLog(roomId, { phase: 'day_defend', action: 'eliminated', targetName: defenderPlayer?.name });
  updateRoom(roomId, { defender_id: null, defend_message: null, defend_ends_at: null });

  const winner = checkWinCondition(roomId);

  if (defenderPlayer?.role === 'hunter') {
    updateRoom(roomId, {
      phase: 'hunter_shoot',
      hunter_id: defenderId,
      pre_hunter_phase: winner ? 'ended' : 'night',
      winner: winner || null,
      eliminated_last: defenderId,
    });
  } else if (winner) {
    updateRoom(roomId, { phase: 'ended', winner, eliminated_last: defenderId });
  } else {
    updateRoom(roomId, { phase: 'night', eliminated_last: defenderId });
  }

  broadcast(roomSockets, roomId);
}

// ── Day vote resolution ───────────────────────────────────────────────────────
function resolveDayVote(roomId, roomSockets) {
  const room = getRoom(roomId);
  const votes = JSON.parse(room.day_votes || '{}');
  const convicted = tallyVotes(votes);
  appendLog(roomId, { phase: 'day_vote', action: 'day_vote_resolved', targetName: convicted ? getPlayers(roomId).find((p) => p.id === convicted)?.name : 'nobody (tie)' });

  if (convicted) {
    const defendEndsAt = Date.now() + 15000;
    updateRoom(roomId, { phase: 'day_defend', defender_id: convicted, defend_ends_at: defendEndsAt, day_votes: '{}' });
    broadcast(roomSockets, roomId);
    // Auto-advance after 15.5s if still in defend phase for this defender
    setTimeout(() => {
      const current = getRoom(roomId);
      if (current && current.phase === 'day_defend' && current.defender_id === convicted) {
        advanceFromDefend(roomId, roomSockets);
      }
    }, 15500);
  } else {
    // Tie — no elimination
    updateRoom(roomId, { phase: 'night', day_votes: '{}', eliminated_last: null });
    broadcast(roomSockets, roomId);
  }
}

// ── Build personalized state for a player ────────────────────────────────────
function buildStateFor(roomId, playerId) {
  const room = getRoom(roomId);
  if (!room) return null;
  const players = getPlayers(roomId);
  const me = players.find((p) => p.id === playerId);

  const nightVotes = JSON.parse(room.night_votes || '{}');
  const dayVotes = JSON.parse(room.day_votes || '{}');
  const wolves = players.filter((p) => p.role === 'wolf').map((p) => p.id);
  const isWolf = me?.role === 'wolf';
  const roleConfig = JSON.parse(room.role_config || '{"seer":0,"witch":0,"bodyguard":0,"hunter":0,"customRoles":[]}');
  const nightActions = JSON.parse(room.night_actions || '{}');

  // Role-specific private data
  let seerResult = null;
  if (me?.role === 'seer' && nightActions.seerTargetId) {
    const seerTarget = players.find((p) => p.id === nightActions.seerTargetId);
    seerResult = {
      targetId: nightActions.seerTargetId,
      targetName: seerTarget?.name || '',
      isWolf: wolves.includes(nightActions.seerTargetId),
    };
  }

  let witchState = null;
  if (me?.role === 'witch') {
    // Wolf target is determined by night votes tally
    const wolfTarget = tallyVotes(nightVotes);
    const wolfTargetPlayer = wolfTarget ? players.find((p) => p.id === wolfTarget) : null;
    witchState = {
      usedHeal: !!room.witch_used_heal,
      usedPoison: !!room.witch_used_poison,
      nightTarget: wolfTarget || null,
      nightTargetName: wolfTargetPlayer?.name || null,
    };
  }

  const bodyguardLastTarget = me?.role === 'bodyguard' ? (room.last_bodyguard_target || null) : null;

  // Night actions progress (for progress display — which roles have acted)
  const nightActionsProgress = {
    seerActed: !!(nightActions.seerTargetId || nightActions.seerSkipped),
    bodyguardActed: !!(nightActions.bodyguardTargetId || nightActions.bodyguardSkipped),
    wolfVotes: Object.keys(nightVotes).length,
  };

  // Custom role description
  const customRole = roleConfig.customRoles?.find((r) => r.name === me?.role);
  const myRoleDesc = customRole?.desc || null;

  // Game log — host only
  const gameLog = me?.is_host ? JSON.parse(room.game_log || '[]') : undefined;

  return {
    room: {
      id: room.id,
      phase: room.phase,
      wolfCount: room.wolf_count,
      discussionSeconds: room.discussion_seconds,
      winner: room.winner || null,
      timerEndsAt: room.timer_ends_at || null,
      eliminatedLast: room.eliminated_last || null,
      defenderId: room.defender_id || null,
      defendMessage: room.defend_message || null,
      defendEndsAt: room.defend_ends_at || null,
      hunterId: room.hunter_id || null,
      roleConfig,
    },
    players: players.map((p) => ({
      id: p.id,
      name: p.name,
      isAlive: !!p.is_alive,
      isHost: !!p.is_host,
      isMe: p.id === playerId,
    })),
    myRole: me?.role || null,
    myRoleDesc,
    wolves: (isWolf || room.phase === 'ended') ? wolves : [],
    nightVotes: isWolf ? nightVotes : {},
    dayVotes,
    myVote: dayVotes[playerId] || null,
    myNightVote: isWolf ? (nightVotes[playerId] || null) : null,
    seerResult,
    witchState,
    bodyguardLastTarget,
    gameLog,
    nightActions: nightActionsProgress,
  };
}

// ── Broadcast state to all sockets in a room ─────────────────────────────────
function broadcast(roomSockets, roomId) {
  const clients = roomSockets.get(roomId);
  if (!clients) return;
  for (const { ws, playerId } of clients) {
    if (ws.readyState !== 1) continue;
    const state = buildStateFor(roomId, playerId);
    if (state) ws.send(JSON.stringify({ type: 'state_update', payload: state }));
  }
}

function send(ws, type, payload) {
  if (ws.readyState === 1) ws.send(JSON.stringify({ type, payload }));
}

// ── Main message handler ──────────────────────────────────────────────────────
function handleWsMessage(msg, ws, roomSockets, roomId, playerId) {
  const { type, payload = {} } = msg;

  switch (type) {
    case 'sync': {
      const state = buildStateFor(roomId, playerId);
      if (state) send(ws, 'state_update', state);
      else send(ws, 'error', { message: 'Room not found' });
      break;
    }

    case 'start_game': {
      const room = getRoom(roomId);
      if (!room || room.host_player_id !== playerId) {
        send(ws, 'error', { message: 'Only the host can start the game' }); return;
      }
      const result = startGame(roomId);
      if (result.error) { send(ws, 'error', { message: result.error }); return; }
      broadcast(roomSockets, roomId);
      break;
    }

    case 'advance_to_night': {
      const room = getRoom(roomId);
      if (!room || room.host_player_id !== playerId) {
        send(ws, 'error', { message: 'Only the host can advance phases' }); return;
      }
      advanceToNight(roomId);
      broadcast(roomSockets, roomId);
      break;
    }

    case 'night_vote': {
      const result = castNightVote(roomId, playerId, payload.targetId);
      if (result.error) { send(ws, 'error', { message: result.error }); return; }
      const room = getRoom(roomId);
      appendLog(roomId, { phase: 'night', action: 'wolf_vote', actorName: getPlayers(roomId).find((p) => p.id === playerId)?.name, targetName: getPlayers(roomId).find((p) => p.id === payload.targetId)?.name });
      broadcast(roomSockets, roomId);
      checkNightComplete(roomId, roomSockets);
      break;
    }

    case 'force_resolve_night': {
      const room = getRoom(roomId);
      if (!room || room.host_player_id !== playerId) {
        send(ws, 'error', { message: 'Only the host can force resolve' }); return;
      }
      if (room.phase === 'night' || room.phase === 'night_witch') {
        resolveAndAdvanceFromNight(roomId, roomSockets);
      } else if (room.phase === 'hunter_shoot') {
        // Force skip hunter shot
        const winner2 = checkWinCondition(roomId);
        const prePhase = room.pre_hunter_phase || 'day_discuss';
        updateRoom(roomId, { hunter_id: null, phase: winner2 ? 'ended' : prePhase, winner: winner2 || room.winner || null });
        broadcast(roomSockets, roomId);
      }
      break;
    }

    case 'seer_investigate': {
      const room = getRoom(roomId);
      if (!room || room.phase !== 'night') { send(ws, 'error', { message: 'Not in night phase' }); return; }
      const players = getPlayers(roomId);
      const me = players.find((p) => p.id === playerId);
      if (!me || me.role !== 'seer' || !me.is_alive) { send(ws, 'error', { message: 'Not the seer' }); return; }
      const target = players.find((p) => p.id === payload.targetId);
      if (!target || !target.is_alive) { send(ws, 'error', { message: 'Invalid target' }); return; }

      const actions = JSON.parse(room.night_actions || '{}');
      actions.seerTargetId = payload.targetId;
      updateRoom(roomId, { night_actions: JSON.stringify(actions) });
      appendLog(roomId, { phase: 'night', action: 'seer_investigate', actorName: me.name, targetName: target.name, detail: target.role === 'wolf' ? 'wolf' : 'not wolf' });
      broadcast(roomSockets, roomId);
      checkNightComplete(roomId, roomSockets);
      break;
    }

    case 'bodyguard_protect': {
      const room = getRoom(roomId);
      if (!room || room.phase !== 'night') { send(ws, 'error', { message: 'Not in night phase' }); return; }
      const players = getPlayers(roomId);
      const me = players.find((p) => p.id === playerId);
      if (!me || me.role !== 'bodyguard' || !me.is_alive) { send(ws, 'error', { message: 'Not the bodyguard' }); return; }
      if (payload.targetId === room.last_bodyguard_target) {
        send(ws, 'error', { message: 'Cannot protect the same player twice in a row' }); return;
      }
      const target = players.find((p) => p.id === payload.targetId);
      if (!target || !target.is_alive) { send(ws, 'error', { message: 'Invalid target' }); return; }

      const actions = JSON.parse(room.night_actions || '{}');
      actions.bodyguardTargetId = payload.targetId;
      updateRoom(roomId, { night_actions: JSON.stringify(actions) });
      appendLog(roomId, { phase: 'night', action: 'bodyguard_protect', actorName: me.name, targetName: target.name });
      broadcast(roomSockets, roomId);
      checkNightComplete(roomId, roomSockets);
      break;
    }

    case 'skip_night_action': {
      const room = getRoom(roomId);
      if (!room || room.phase !== 'night') { send(ws, 'error', { message: 'Not in night phase' }); return; }
      const me = getPlayers(roomId).find((p) => p.id === playerId);
      if (!me || !me.is_alive) return;

      const actions = JSON.parse(room.night_actions || '{}');
      if (me.role === 'seer') actions.seerSkipped = true;
      else if (me.role === 'bodyguard') actions.bodyguardSkipped = true;
      else return;
      updateRoom(roomId, { night_actions: JSON.stringify(actions) });
      broadcast(roomSockets, roomId);
      checkNightComplete(roomId, roomSockets);
      break;
    }

    case 'witch_act': {
      const room = getRoom(roomId);
      if (!room || room.phase !== 'night_witch') { send(ws, 'error', { message: 'Not witch phase' }); return; }
      const me = getPlayers(roomId).find((p) => p.id === playerId);
      if (!me || me.role !== 'witch' || !me.is_alive) { send(ws, 'error', { message: 'Not the witch' }); return; }

      const { useHeal, healTarget, usePoison, poisonTarget } = payload;
      const actions = JSON.parse(room.night_actions || '{}');
      const updates = {};

      if (useHeal && !room.witch_used_heal && healTarget) {
        actions.witchHealTarget = healTarget;
        updates.witch_used_heal = 1;
        appendLog(roomId, { phase: 'night', action: 'witch_heal', actorName: me.name, targetName: getPlayers(roomId).find((p) => p.id === healTarget)?.name });
      }
      if (usePoison && !room.witch_used_poison && poisonTarget) {
        actions.witchPoisonTarget = poisonTarget;
        updates.witch_used_poison = 1;
        appendLog(roomId, { phase: 'night', action: 'witch_poison', actorName: me.name, targetName: getPlayers(roomId).find((p) => p.id === poisonTarget)?.name });
      }
      updates.night_actions = JSON.stringify(actions);
      updateRoom(roomId, updates);
      resolveAndAdvanceFromNight(roomId, roomSockets);
      break;
    }

    case 'skip_witch': {
      const room = getRoom(roomId);
      if (!room || room.phase !== 'night_witch') { send(ws, 'error', { message: 'Not witch phase' }); return; }
      const me = getPlayers(roomId).find((p) => p.id === playerId);
      if (!me || me.role !== 'witch') { send(ws, 'error', { message: 'Not the witch' }); return; }
      resolveAndAdvanceFromNight(roomId, roomSockets);
      break;
    }

    case 'start_day_vote': {
      const room = getRoom(roomId);
      if (!room || room.host_player_id !== playerId) {
        send(ws, 'error', { message: 'Only the host can start voting' }); return;
      }
      startDayVote(roomId);
      broadcast(roomSockets, roomId);
      break;
    }

    case 'day_vote': {
      const result = castDayVote(roomId, playerId, payload.targetId);
      if (result.error) { send(ws, 'error', { message: result.error }); return; }
      appendLog(roomId, { phase: 'day_vote', action: 'day_vote', actorName: getPlayers(roomId).find((p) => p.id === playerId)?.name, targetName: getPlayers(roomId).find((p) => p.id === payload.targetId)?.name });
      broadcast(roomSockets, roomId);
      if (result.autoResolve) resolveDayVote(roomId, roomSockets);
      break;
    }

    case 'force_resolve_day': {
      const room = getRoom(roomId);
      if (!room || room.host_player_id !== playerId) {
        send(ws, 'error', { message: 'Only the host can force resolve' }); return;
      }
      resolveDayVote(roomId, roomSockets);
      break;
    }

    case 'defend_message': {
      const room = getRoom(roomId);
      if (!room || room.phase !== 'day_defend') { send(ws, 'error', { message: 'Not in defend phase' }); return; }
      if (room.defender_id !== playerId) { send(ws, 'error', { message: 'Not the defender' }); return; }
      const text = String(payload.text || '').slice(0, 300);
      updateRoom(roomId, { defend_message: text });
      appendLog(roomId, { phase: 'day_defend', action: 'defend', actorName: getPlayers(roomId).find((p) => p.id === playerId)?.name, detail: text });
      broadcast(roomSockets, roomId);
      break;
    }

    case 'skip_defend': {
      const room = getRoom(roomId);
      if (!room || room.phase !== 'day_defend') { send(ws, 'error', { message: 'Not in defend phase' }); return; }
      if (room.defender_id !== playerId && room.host_player_id !== playerId) {
        send(ws, 'error', { message: 'Not authorized' }); return;
      }
      advanceFromDefend(roomId, roomSockets);
      break;
    }

    case 'hunter_shoot': {
      const room = getRoom(roomId);
      if (!room || room.phase !== 'hunter_shoot') { send(ws, 'error', { message: 'Not hunter phase' }); return; }
      if (room.hunter_id !== playerId) { send(ws, 'error', { message: 'Not the hunter' }); return; }
      const players = getPlayers(roomId);
      const target = players.find((p) => p.id === payload.targetId);
      if (!target || !target.is_alive) { send(ws, 'error', { message: 'Invalid target' }); return; }

      const me = players.find((p) => p.id === playerId);
      eliminatePlayer(payload.targetId);
      appendLog(roomId, { phase: 'hunter_shoot', action: 'hunter_shoot', actorName: me?.name, targetName: target.name });
      updateRoom(roomId, { hunter_id: null });

      const winner = checkWinCondition(roomId);
      const prePhase = room.pre_hunter_phase || 'day_discuss';

      if (winner) {
        updateRoom(roomId, { phase: 'ended', winner });
      } else {
        updateRoom(roomId, { phase: prePhase });
      }
      broadcast(roomSockets, roomId);
      break;
    }

    case 'update_settings': {
      const result = updateSettings(roomId, playerId, payload);
      if (result.error) { send(ws, 'error', { message: result.error }); return; }
      broadcast(roomSockets, roomId);
      break;
    }

    case 'update_role_config': {
      const room = getRoom(roomId);
      if (!room || room.host_player_id !== playerId || room.phase !== 'lobby') {
        send(ws, 'error', { message: 'Not authorized or not in lobby' }); return;
      }
      updateRoom(roomId, { role_config: JSON.stringify(payload.roleConfig) });
      broadcast(roomSockets, roomId);
      break;
    }

    case 'restart_game': {
      const room = getRoom(roomId);
      if (!room || room.host_player_id !== playerId) {
        send(ws, 'error', { message: 'Only the host can restart' }); return;
      }
      restartGame(roomId);
      broadcast(roomSockets, roomId);
      break;
    }

    case 'end_game': {
      const room = getRoom(roomId);
      if (!room || room.host_player_id !== playerId) {
        send(ws, 'error', { message: 'Only the host can end the game' }); return;
      }
      const clients = roomSockets.get(roomId);
      if (clients) {
        for (const { ws: cws } of clients) {
          if (cws.readyState === 1) cws.send(JSON.stringify({ type: 'room_closed' }));
        }
      }
      deleteRoom(roomId);
      roomSockets.delete(roomId);
      break;
    }

    default:
      send(ws, 'error', { message: `Unknown message type: ${type}` });
  }
}

module.exports = { handleWsMessage, buildStateFor, broadcast };
