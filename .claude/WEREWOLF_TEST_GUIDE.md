# Werewolf Online — Developer & Testing Guide

## Project Overview

Werewolf Online is a real-time multiplayer social deduction game at **http://localhost:9999/werewolf**.

- **Stack**: Next.js 16 App Router + custom Node.js WebSocket server (`ws` library) + SQLite (`better-sqlite3`)
- **Root**: `/Users/tiendung/Desktop/loihaylam_v6`
- **Start**: `node server.js` or `npm run dev` (same thing — both run `node server.js`)
- **Default port**: 9999

---

## Project File Map

```
/Users/tiendung/Desktop/loihaylam_v6/
├── server.js                          # Entry: HTTP + WebSocket server (single process)
├── db/schema.sql                      # SQLite schema (rooms + players tables)
├── lib/
│   ├── db.js                          # getDb() — initializes better-sqlite3
│   ├── werewolf/
│   │   ├── types.ts                   # TypeScript types: Phase, Role, GameState, RoleConfig
│   │   ├── game-logic.js              # Role assignment, win condition, night kill resolution
│   │   ├── room-manager.js            # CRUD: createRoom, joinRoom, getRoom, updateRoom, etc.
│   │   └── useWebSocket.ts            # React hook: connects WS, exposes gameState + send()
│   ├── ws/
│   │   └── handler.js                 # All WS message handling + buildStateFor() + broadcast()
│   └── i18n/
│       ├── en.json                    # English strings (all ww.* keys)
│       ├── vi.json                    # Vietnamese strings
│       └── useTranslation.ts          # t() hook
├── app/
│   ├── werewolf/page.tsx              # Server component — renders <WerewolfGame />
│   └── api/rooms/
│       ├── route.ts                   # POST /api/rooms — create room
│       └── [code]/join/route.ts       # POST /api/rooms/:code/join — join room
└── components/werewolf/
    ├── WerewolfGame.tsx               # Main router — picks phase component
    ├── Lobby.tsx                      # Phase: lobby — settings + role config
    ├── RoleReveal.tsx                 # Phase: role_reveal
    ├── RoleCard.tsx                   # Reusable role display card
    ├── NightPhase.tsx                 # Phase: night (wolf vote + seer + bodyguard panels)
    ├── NightWitch.tsx                 # Phase: night_witch (witch actions)
    ├── DayPhase.tsx                   # Phase: day_discuss + day_vote
    ├── VotePanel.tsx                  # Reusable voting UI
    ├── DayDefend.tsx                  # Phase: day_defend (convicted player's 15s defense)
    ├── HunterShoot.tsx                # Phase: hunter_shoot
    ├── ResultBanner.tsx               # Phase: ended
    └── GameLog.tsx                    # Host-only collapsible action log
```

---

## How the Server Works

`server.js` runs a single Node.js process that serves both:
1. **HTTP** — Next.js handles all page routes and API routes
2. **WebSocket** at `/ws?roomId=XXX&playerId=YYY`

```js
// server.js key structure:
httpServer.on('upgrade', (req, socket, head) => {
  const { pathname, query } = parse(req.url, true);
  if (pathname === '/ws') {
    // game WebSocket — validate roomId + playerId, then handleUpgrade
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit('connection', ws, req, String(playerId), String(roomId));
    });
  }
  // Other paths (e.g. _next/webpack-hmr) left for Next.js — do NOT destroy them
});
```

**roomSockets** is an in-memory `Map<roomId, Set<{ ws, playerId }>>` — lost on server restart.

---

## Database Schema (`db/schema.sql`)

```sql
CREATE TABLE IF NOT EXISTS rooms (
  id TEXT PRIMARY KEY,                   -- 6-char code e.g. "ABC123"
  host_player_id TEXT NOT NULL,
  phase TEXT NOT NULL DEFAULT 'lobby',
  wolf_count INTEGER NOT NULL DEFAULT 1,
  discussion_seconds INTEGER NOT NULL DEFAULT 60,
  night_votes TEXT NOT NULL DEFAULT '{}',   -- JSON: { wolfId: targetId }
  day_votes TEXT NOT NULL DEFAULT '{}',     -- JSON: { playerId: targetId }
  timer_ends_at INTEGER,                    -- ms timestamp for discussion countdown
  winner TEXT,                              -- 'wolves' | 'villagers' | null
  eliminated_last TEXT,                     -- playerId of last eliminated player
  created_at INTEGER NOT NULL,
  role_config TEXT NOT NULL DEFAULT '{"seer":0,"witch":0,"bodyguard":0,"hunter":0,"customRoles":[]}',
  night_actions TEXT NOT NULL DEFAULT '{}', -- JSON: { seerTargetId, bodyguardTargetId, witchHealTarget, witchPoisonTarget, seerSkipped, bodyguardSkipped }
  last_bodyguard_target TEXT,              -- playerId — bodyguard can't repeat
  witch_used_heal INTEGER NOT NULL DEFAULT 0,
  witch_used_poison INTEGER NOT NULL DEFAULT 0,
  defender_id TEXT,                         -- playerId convicted by day vote
  defend_message TEXT,                      -- what defender typed
  defend_ends_at INTEGER,                   -- ms timestamp for defend countdown
  hunter_id TEXT,                           -- hunter who must shoot
  pre_hunter_phase TEXT,                    -- where to resume after hunter shoots
  game_log TEXT NOT NULL DEFAULT '[]'       -- JSON: GameLogEntry[]
);

CREATE TABLE IF NOT EXISTS players (
  id TEXT PRIMARY KEY,                -- UUID
  room_id TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT,                          -- 'wolf'|'villager'|'seer'|'witch'|'bodyguard'|'hunter'|customName
  is_alive INTEGER NOT NULL DEFAULT 1,
  is_host INTEGER NOT NULL DEFAULT 0,
  joined_at INTEGER NOT NULL
);
```

**Important**: Schema uses `CREATE TABLE IF NOT EXISTS` — adding new columns requires deleting `data/game.db` and restarting.

---

## Phase State Machine

```
lobby → role_reveal → night → [night_witch?] → day_discuss → day_vote → day_defend → [hunter_shoot?] → (loop back to night OR ended)
                                    ↑                                         ↓
                               hunter_shoot ←─────────── (if hunter eliminated at night)
```

| Phase | Trigger | What happens |
|-------|---------|-------------|
| `lobby` | Initial | Players join; host configures settings/roles |
| `role_reveal` | Host clicks Start Game | Roles assigned; each player sees their card privately |
| `night` | Host clicks "Proceed to Night" | Wolves vote; Seer investigates; Bodyguard protects |
| `night_witch` | All wolves+seer+bodyguard acted AND witch has potions | Witch sees wolf target; can heal or poison |
| `day_discuss` | Night resolves | Timer countdown; host sees "Start Vote" button |
| `day_vote` | Host clicks "Start Vote" | All players vote; auto-resolves when everyone voted |
| `day_defend` | Day vote resolves with a winner (no tie) | Convicted gets 15s to type defense; server auto-advances after 15.5s |
| `hunter_shoot` | Eliminated player had role `'hunter'` | Hunter picks a target to shoot before dying |
| `ended` | Win condition met | Wolves revealed; host sees Play Again + End Game |

**Night auto-resolution** (`checkNightComplete` in `lib/ws/handler.js:70`):
- Triggers when: all wolves voted AND (no seer OR seer acted/skipped) AND (no bodyguard OR bodyguard acted/skipped)
- If witch is alive with ≥1 potion → advance to `night_witch`
- Otherwise → call `resolveAndAdvanceFromNight`

---

## Roles

| Role | Team | Key behavior |
|------|------|-------------|
| `wolf` | Wolves | Night vote to eliminate a villager; see each other's night votes |
| `villager` | Villagers | No ability |
| `seer` | Villagers | Night: investigate one player → see wolf/not wolf privately |
| `witch` | Villagers | Night (after wolves): one heal potion (save wolf target) + one poison (kill anyone) |
| `bodyguard` | Villagers | Night: protect one player (can't repeat same player two nights in a row) |
| `hunter` | Villagers | On elimination (day or night): shoots one player before dying |
| custom name | Villagers | Cosmetic only — counts as villager team, no ability |

**Win conditions** (`lib/werewolf/game-logic.js:57`):
- Villagers win: `wolves.length === 0`
- Wolves win: `wolves.length >= villagers.length` (alive counts)

---

## Key Implementation Files

### `lib/ws/handler.js` — Core game logic

**`buildStateFor(roomId, playerId)`** (line 155): Builds personalized state per player:
- `wolves[]` — wolf IDs: visible to wolves always; to everyone at `phase === 'ended'`
- `seerResult` — only sent if `me.role === 'seer'`
- `witchState` — only sent if `me.role === 'witch'`; includes `nightTarget` (wolf's intended victim)
- `bodyguardLastTarget` — only sent if `me.role === 'bodyguard'`
- `gameLog` — only sent if `me.is_host`
- `nightVotes` — only sent if wolf

**`checkNightComplete(roomId, roomSockets)`** (line 70): Called after every night action; triggers phase advance when all roles have acted.

**`resolveDayVote(roomId, roomSockets)`** (line 130): After all votes in, tallies, starts `day_defend` with 15s timer + `setTimeout` auto-advance.

**`advanceFromDefend(roomId, roomSockets)`** (line 97): Eliminates convicted player, checks if hunter → goes to `hunter_shoot`, else next night or `ended`.

**`resolveAndAdvanceFromNight(roomId, roomSockets)`** (line 19): Applies bodyguard/witch heal/witch poison, eliminates, checks hunter → `hunter_shoot`, else `day_discuss`.

### `lib/werewolf/game-logic.js`

**`resolveNightKills(room)`** (line 84):
```js
// Priority: bodyguard > witch heal (both block wolf kill)
// Witch poison = additional separate kill
return { eliminated, poisonTarget, wolfTarget };
```

**`assignRoles(roomId)`** (line 12): Shuffles players → assigns wolves first → then seer/witch/bodyguard/hunter → then custom roles → then villager.

### `lib/werewolf/useWebSocket.ts`

Connects to `ws://<host>/ws?roomId=&playerId=`, listens for `state_update` messages, exposes:
```ts
const { gameState, connected, error, send, roomClosed } = useWebSocket(roomId, playerId);
// send('night_vote', { targetId: 'uuid' })
```

### `components/werewolf/WerewolfGame.tsx`

Phase routing:
```tsx
if (phase === 'lobby') return <Lobby />;
if (phase === 'role_reveal') return <RoleReveal />;
if (phase === 'night') return <NightPhase />;
if (phase === 'night_witch') return <NightWitch />;
if (phase === 'day_discuss' || phase === 'day_vote') return <DayPhase />;
if (phase === 'day_defend') return <DayDefend />;
if (phase === 'hunter_shoot') return <HunterShoot />;
if (phase === 'ended') return <ResultBanner />;
// GameLog rendered below for host
```

---

## API Endpoints (HTTP)

| Method | Path | Body | Response |
|--------|------|------|----------|
| `POST` | `/api/rooms` | `{ hostName }` | `{ roomId, playerId }` |
| `POST` | `/api/rooms/:code/join` | `{ playerName }` | `{ roomId, playerId }` |

Room codes: 6 uppercase alphanumeric chars (e.g. `ABC123`), no ambiguous chars (0/O/1/I removed).

---

## WebSocket Message Reference

All messages: `{ type: string, payload?: object }`

### Client → Server

| Message | Who | Payload | Notes |
|---------|-----|---------|-------|
| `sync` | Anyone | `{}` | Get current state on connect |
| `start_game` | Host | `{}` | Assigns roles, phase → role_reveal |
| `advance_to_night` | Host | `{}` | phase role_reveal → night |
| `night_vote` | Wolf | `{ targetId }` | Can't target other wolves |
| `seer_investigate` | Seer | `{ targetId }` | Only in `night` phase |
| `bodyguard_protect` | Bodyguard | `{ targetId }` | Can't repeat last night's target |
| `skip_night_action` | Seer/Bodyguard | `{}` | Marks as acted, may trigger auto-resolve |
| `witch_act` | Witch | `{ useHeal, healTarget?, usePoison, poisonTarget? }` | Only in `night_witch` |
| `skip_witch` | Witch | `{}` | Skip witch turn |
| `force_resolve_night` | Host | `{}` | Force-advance `night`, `night_witch`, or `hunter_shoot` |
| `start_day_vote` | Host | `{}` | phase day_discuss → day_vote |
| `day_vote` | Anyone alive | `{ targetId }` | Auto-resolves when all voted |
| `force_resolve_day` | Host | `{}` | Force-resolve day vote early |
| `defend_message` | Convicted player | `{ text }` | Max 300 chars; updates live for all |
| `skip_defend` | Convicted / Host | `{}` | Immediately eliminate convicted |
| `hunter_shoot` | Hunter | `{ targetId }` | Only in `hunter_shoot` phase |
| `update_settings` | Host | `{ wolfCount?, discussionSeconds? }` | Lobby only |
| `update_role_config` | Host | `{ roleConfig }` | Lobby only; full RoleConfig object |
| `restart_game` | Host | `{}` | Reset to lobby (same players/room code) |
| `end_game` | Host | `{}` | Broadcasts `room_closed`, deletes room |

### Server → Client

| Message | Description |
|---------|-------------|
| `state_update` | Full personalized state (see `buildStateFor` shape below) |
| `error { message }` | Action rejected |
| `room_closed` | Host ended game; client redirects to home |

### `state_update` payload shape

```ts
{
  room: {
    id: string,           // room code
    phase: Phase,
    wolfCount: number,
    discussionSeconds: number,
    winner: string | null,        // 'wolves' | 'villagers'
    timerEndsAt: number | null,   // ms timestamp
    eliminatedLast: string | null, // playerId
    defenderId: string | null,
    defendMessage: string | null,
    defendEndsAt: number | null,  // ms timestamp
    hunterId: string | null,      // hunter's playerId
    roleConfig: RoleConfig,
  },
  players: Array<{
    id: string, name: string, isAlive: boolean, isHost: boolean, isMe: boolean
  }>,
  myRole: string | null,          // 'wolf'|'villager'|'seer'|etc or custom name
  myRoleDesc: string | null,      // custom role description only
  wolves: string[],               // wolf IDs (empty unless you're wolf or game ended)
  nightVotes: Record<string,string>, // wolf votes (empty unless you're wolf)
  dayVotes: Record<string,string>,
  myVote: string | null,
  myNightVote: string | null,
  seerResult: { targetId, targetName, isWolf } | null,  // seer only
  witchState: { usedHeal, usedPoison, nightTarget, nightTargetName } | null, // witch only
  bodyguardLastTarget: string | null,  // bodyguard only
  gameLog: GameLogEntry[] | undefined, // host only
  nightActions: { seerActed, bodyguardActed, wolfVotes },
}
```

---

## How to Start the Server

```bash
cd /Users/tiendung/Desktop/loihaylam_v6

# Kill any old server first
kill $(lsof -ti :9999)

# Start fresh
node server.js
```

**If schema changed**: delete the DB to force recreation:
```bash
rm data/game.db
node server.js
```

---

## Game Flow Overview

```
Lobby → Role Reveal → Night → [Night Witch?] → Day Discuss → Day Vote → Day Defend → [Hunter Shoot?] → (repeat or Ended)
```

---

## Testing Setup

### Minimum Setup
- Open **3+ browser tabs** at `http://localhost:9999/werewolf`
- Tab 1: Create room → becomes Host
- Tab 2+: Join room with the 6-character code

### Recommended Setup for Full Role Testing (6 players)
- 1 Wolf, 1 Seer, 1 Witch, 1 Bodyguard, 1 Hunter, 1 Villager
- In Lobby → Role Configuration → enable Seer, Witch, Bodyguard, Hunter

---

## Step-by-Step Test Scenarios

### Scenario 1: Basic Game (No Special Roles)

1. Tab 1 (Host): Go to `/werewolf` → Create Room → Enter name → Submit
2. Tab 2: Join Room → Enter name + room code → Submit
3. Tab 3: Join Room → Enter name + room code → Submit
4. Tab 1 (Host): Click **Start Game**
5. Each tab privately sees their role card
6. Tab 1 (Host): Click **Proceed to Night 🌙**
7. **Night Phase**: The wolf tab sees a list of villagers → click a name to vote
8. Tab 1 (Host): Can click **End Night** to force-resolve
9. **Day Discuss**: All tabs see who was eliminated; timer counts down
10. Tab 1 (Host): Click **Start Vote** after discussion
11. **Day Vote**: Each player clicks a name; auto-resolves when all vote
12. **Day Defend** (15s): Convicted player sees text input + "Submit Defense" + "Skip"; others see "Waiting..."
13. After defend timer or skip → convicted is eliminated → game checks win condition
14. Repeat night/day until someone wins
15. **Ended**: All tabs see winner + wolf reveal + full role list

### Scenario 2: Test Seer Role

1. Create room with 4+ players
2. Host enables **Seer** in Role Configuration panel (checkbox)
3. Start game
4. Night phase: The Seer tab sees a player list → click **🔍 Investigate** on any player
5. Seer immediately sees: `"[Name]: 🐺 Wolf"` or `"[Name]: 🏡 Not a wolf"`
6. This result persists on Seer's screen; nobody else sees it
7. Host game log shows: `"Seer investigated X → wolf/not wolf"`

### Scenario 3: Test Witch Role

1. Create room with 4+ players; enable **Witch**
2. Night phase: Wolves must vote first; after wolves+seer+bodyguard all act → `night_witch` phase
3. **Witch tab** sees: `"Tonight the wolves target: [Name]"` + three buttons:
   - **💊 Save [Name]** — heals wolf target (uses heal potion permanently)
   - **☠️ Poison someone** — opens player list to pick poison target
   - **Do nothing tonight** — skips
4. Non-witch tabs see "Night — waiting..." during witch phase
5. After witch acts or skips → night resolves

### Scenario 4: Test Bodyguard Role

1. Enable **Bodyguard**; start game
2. Night phase: Bodyguard tab sees player list → click **🛡 Protect** on any player
3. If Bodyguard picks the same player wolves targeted → that player survives the night
4. Bodyguard cannot protect the same player two nights in a row (button grayed with "Last night's pick" label)

### Scenario 5: Test Hunter Role

1. Enable **Hunter**; play until Hunter gets eliminated (by wolf at night or by day vote)
2. Game enters `hunter_shoot` phase immediately
3. **Hunter tab** sees player list → click **Shoot 🏹** on a target
4. Other tabs see "Waiting for [Hunter] to shoot..."
5. That player is eliminated → win condition checked → game continues

### Scenario 6: Test Defend Phase

1. Any game with 3+ players — play until Day Vote
2. All players vote → majority convicts someone
3. Game enters `day_defend` (15 seconds)
4. **Convicted player's tab**: countdown timer bar + text area + **Submit Defense** + **Skip**
5. Type a message → click **Submit Defense** → all other tabs see it live: `"Alice says: [message]"`
6. After 15s or skip → convicted is eliminated

### Scenario 7: Test Custom Roles

1. Lobby as host → expand **🎭 Role Configuration**
2. At bottom: enter Role Name (e.g. `"Priest"`) and Description (e.g. `"You have no special power"`)
3. Click **+ Add Custom Role**
4. Start game → one villager-team player gets `"Priest"` instead of `"Villager"`
5. Their role card shows `"Priest"` with the custom description
6. In result banner they appear as `"Priest"` (not wolf)

### Scenario 8: Test Host Game Log

1. Play any game with host tab visible
2. After game starts: **📋 Game Log (N)** button at bottom of host's screen
3. Click to expand → shows all actions: wolf votes, seer investigations, bodyguard protections, witch actions, day votes, defenses
4. Non-host tabs do NOT see this panel

### Scenario 9: Test End Game

1. From any phase as host: **🔄 Play Again** (ghost) + **🚪 End Game** (red)
2. **End Game** → all connected tabs immediately redirect to Werewolf home screen; SQLite room + players deleted
3. **Play Again** → game resets to lobby (same room code, same players); witch potions reset; bodyguard last target cleared

---

## State Privacy Rules

| Field | Who sees it |
|-------|-------------|
| `wolves[]` | Wolves always; everyone after `phase === 'ended'` |
| `nightVotes` | Wolves only |
| `seerResult` | Seer only |
| `witchState` | Witch only (includes wolf's intended target in `night_witch`) |
| `bodyguardLastTarget` | Bodyguard only |
| `gameLog[]` | Host only |

---

## Common Bugs to Check

1. **Seer result visible to others** — only the Seer tab should see investigation results
2. **Wolf list revealed too early** — non-wolves should NOT see wolf IDs until `phase === 'ended'`
3. **Defend timer doesn't auto-advance** — if 15s passes with no action, server should auto-eliminate (via `setTimeout` in `handler.js:141`)
4. **Bodyguard same-target guard** — should be blocked with error, not silently ignored
5. **Witch phase skipped** — should only appear if witch is alive AND has ≥1 potion remaining
6. **Hunter shoot after night vs after day vote** — both trigger `hunter_shoot` phase correctly
7. **Win condition after Hunter shoot** — if hunter kills last wolf, villagers win
8. **Custom roles in result banner** — custom role name (e.g. `"Priest"`) should appear instead of `"Villager"`
9. **Game log completeness** — host sees all actions; non-host sees no log panel
10. **Play Again resets witch potions** — `witch_used_heal` and `witch_used_poison` should be 0 after restart

---

## Debugging Tips

### WebSocket connection fails ("Connection lost. Please refresh.")
```bash
# 1. Check server is running
lsof -i :9999

# 2. Check for multiple server processes (port conflict)
ps aux | grep "node server.js"

# 3. Delete stale DB and restart
kill $(lsof -ti :9999)
rm data/game.db
node server.js
```

### DB schema out of date (new columns missing)
`CREATE TABLE IF NOT EXISTS` does NOT add new columns to existing tables.
Fix: `rm data/game.db && node server.js`

### HMR WebSocket warning in browser console
```
WebSocket connection to 'ws://localhost:9999/_next/webpack-hmr?...' failed
```
This is **harmless** in dev mode. The server intentionally doesn't handle HMR upgrades — Next.js handles them differently. Does not affect gameplay.

### Night phase stuck (wolves voted but day doesn't advance)
Check if seer or bodyguard exist in the game. They must act OR skip before night auto-resolves.
Host can use **End Night** button (`force_resolve_night` message) to force-advance.

### Inspect DB state directly
```bash
cd /Users/tiendung/Desktop/loihaylam_v6
node -e "
const { initDb } = require('./lib/db');
const { getDb } = require('./lib/db');
initDb();
const db = getDb();
console.log(db.prepare('SELECT * FROM rooms').all());
console.log(db.prepare('SELECT * FROM players').all());
"
```

---

## i18n

- All UI strings use `t('ww.key')` via `useTranslation()` hook
- Add/edit keys in `lib/i18n/en.json` and `lib/i18n/vi.json`
- Key namespace for werewolf: `ww.*`
- Key namespace for truth or dare: `td.*`
- Language toggle in site header (EN ↔ VI)
