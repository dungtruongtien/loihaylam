export type Phase =
  | 'lobby'
  | 'role_reveal'
  | 'night'
  | 'day_discuss'
  | 'day_vote'
  | 'day_defend'
  | 'ended';

export type Role = 'wolf' | 'villager' | 'seer' | 'witch' | 'bodyguard' | 'hunter' | 'host' | string;
export type Winner = 'wolves' | 'villagers' | null;

export interface RoleConfig {
  seer: number;
  witch: number;
  bodyguard: number;
  hunter: number;
  customRoles: Array<{ name: string; desc: string }>;
}

export interface GameLogEntry {
  round?: number;
  phase: string;
  action: string;
  actorName?: string;
  targetName?: string;
  detail?: string;
  ts?: number;
}

export interface PlayerView {
  id: string;
  name: string;
  isAlive: boolean;
  isHost: boolean;
  isMe: boolean;
}

export interface RoomView {
  id: string;
  phase: Phase;
  wolfCount: number;
  discussionSeconds: number;
  winner: Winner;
  timerEndsAt: number | null;
  eliminatedLast: string | null;
  defenderId: string | null;
  defendMessage: string | null;
  defendEndsAt: number | null;
  roleConfig: RoleConfig;
}

export interface GameState {
  room: RoomView;
  players: PlayerView[];
  myRole: Role | null;
  myRoleDesc?: string | null;
  wolves: string[];                        // wolf player IDs
  nightVotes: Record<string, string>;      // voterId -> targetId (only for wolves)
  dayVotes: Record<string, string>;        // voterId -> targetId
  myVote: string | null;
  myNightVote: string | null;
  // Role-specific private state:
  seerResult?: { targetId: string; targetName: string; isWolf: boolean } | null;
  bodyguardLastTarget?: string | null;
  // Host only:
  gameLog?: GameLogEntry[];
  nightActions?: Record<string, boolean>;  // roleKey -> hasActed (for progress display)
}
