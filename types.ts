export enum GameState {
  MENU = 'MENU',
  CHARACTER_SELECT = 'CHARACTER_SELECT',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  ROUND_TRANSITION = 'ROUND_TRANSITION',
  MATCH_RESULT = 'MATCH_RESULT',
  GAMEOVER = 'GAMEOVER',
  VICTORY = 'VICTORY',
  TOURNAMENT_CHAMPION = 'TOURNAMENT_CHAMPION'
}

export enum GameMode {
  QUICK_FIGHT = 'QUICK_FIGHT',
  TOURNAMENT = 'TOURNAMENT'
}

export enum Difficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD'
}

export enum ActionState {
  IDLE = 'IDLE',
  WALK = 'WALK',
  PUNCH = 'PUNCH',
  KICK = 'KICK',
  BLOCK = 'BLOCK',
  DODGE = 'DODGE',
  HIT = 'HIT',
  DIZZY = 'DIZZY',
  KO = 'KO',
  TAKEDOWN = 'TAKEDOWN',
  SPRAWL = 'SPRAWL',
  SLAMMED = 'SLAMMED',
  SPECIAL = 'SPECIAL',
  VICTORY_POSE = 'VICTORY_POSE'
}

export type AIProfile = 'striker' | 'grappler' | 'power' | 'balanced';

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface CharacterConfig {
  id: string;
  name: string;
  skinColor: string;
  shortsColor: string;
  gloveColor: string;
  accentColor: string;
  health: number;
  stamina: number;
  speed: number;
  punchDamage: number;
  kickDamage: number;
  takedownDamage: number;
  specialName: string;
  specialDamage: number;
  specialType: 'punch' | 'kick' | 'takedown';
  nationality: string;
  style: string;
  aiProfile: AIProfile;
}

export interface FightStats {
  strikesLanded: number;
  strikesThrown: number;
  takedowns: number;
  maxCombo: number;
  damageDealt: number;
  parries: number;
  dodges: number;
  specialsLanded: number;
}

export const createEmptyStats = (): FightStats => ({
  strikesLanded: 0,
  strikesThrown: 0,
  takedowns: 0,
  maxCombo: 0,
  damageDealt: 0,
  parries: 0,
  dodges: 0,
  specialsLanded: 0
});

export interface Fighter {
  x: number;
  y: number;
  vx: number;
  width: number;
  height: number;
  color: string;
  shortsColor: string;
  gloveColor: string;
  accentColor: string;
  direction: -1 | 1;
  health: number;
  maxHealth: number;
  stamina: number;
  maxStamina: number;
  powerMeter: number;
  maxPowerMeter: number;
  state: ActionState;
  stateTimer: number;
  isPlayer: boolean;
  hitbox: Rect | null;
  characterId: string;
  damageDealt: number;
  hitFlash: number;
  comboCount: number;
  lastHitTime: number;
  speed: number;
  punchDamage: number;
  kickDamage: number;
  takedownDamage: number;
  specialName: string;
  specialDamage: number;
  specialType: 'punch' | 'kick' | 'takedown';
  // Advanced combat
  dodgeCooldown: number;
  counterWindow: number;
  recentHitsTaken: number[];
  hasBeenDizzy: boolean;
  stats: FightStats;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  type: 'blood' | 'spark' | 'sweat' | 'star' | 'dust' | 'ring';
}

export interface InputState {
  left: boolean;
  right: boolean;
  punch: boolean;
  kick: boolean;
  block: boolean;
  takedown: boolean;
  special: boolean;
  dodge: boolean;
}

export interface RoundEndPayload {
  winner: 'PLAYER' | 'ENEMY' | 'DRAW';
  method: 'KO' | 'DECISION';
  playerStats: FightStats;
  enemyStats: FightStats;
}

export interface CareerRecord {
  wins: number;
  losses: number;
  koWins: number;
  bestCombo: number;
  tournamentsWon: number;
}
