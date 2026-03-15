CREATE TABLE IF NOT EXISTS rooms (
  id TEXT PRIMARY KEY,
  host_player_id TEXT NOT NULL,
  phase TEXT NOT NULL DEFAULT 'lobby',
  wolf_count INTEGER NOT NULL DEFAULT 1,
  discussion_seconds INTEGER NOT NULL DEFAULT 60,
  night_votes TEXT NOT NULL DEFAULT '{}',
  day_votes TEXT NOT NULL DEFAULT '{}',
  timer_ends_at INTEGER,
  winner TEXT,
  eliminated_last TEXT,
  created_at INTEGER NOT NULL,
  role_config TEXT NOT NULL DEFAULT '{"seer":0,"witch":0,"bodyguard":0,"hunter":0,"customRoles":[]}',
  night_actions TEXT NOT NULL DEFAULT '{}',
  last_bodyguard_target TEXT,
  witch_used_heal INTEGER NOT NULL DEFAULT 0,
  witch_used_poison INTEGER NOT NULL DEFAULT 0,
  defender_id TEXT,
  defend_message TEXT,
  defend_ends_at INTEGER,
  hunter_id TEXT,
  pre_hunter_phase TEXT,
  game_log TEXT NOT NULL DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS players (
  id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT,
  is_alive INTEGER NOT NULL DEFAULT 1,
  is_host INTEGER NOT NULL DEFAULT 0,
  joined_at INTEGER NOT NULL
);
