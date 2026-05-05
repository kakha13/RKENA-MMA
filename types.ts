export enum GameState {
  MENU = 'MENU',
  CHARACTER_SELECT = 'CHARACTER_SELECT',
  PLAYING = 'PLAYING',
  ROUND_TRANSITION = 'ROUND_TRANSITION',
  GAMEOVER = 'GAMEOVER',
  VICTORY = 'VICTORY'
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
  HIT = 'HIT',
  KO = 'KO',
  TAKEDOWN = 'TAKEDOWN',
  SPRAWL = 'SPRAWL',
  SLAMMED = 'SLAMMED',
  SPECIAL = 'SPECIAL',
  VICTORY_POSE = 'VICTORY_POSE'
}

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
}

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
  type: 'blood' | 'spark' | 'sweat' | 'star';
}

export interface InputState {
  left: boolean;
  right: boolean;
  punch: boolean;
  kick: boolean;
  block: boolean;
  takedown: boolean;
  special: boolean;
}

export interface RoundResult {
  winner: 'PLAYER' | 'ENEMY' | 'DRAW';
  method: 'KO' | 'DECISION';
  playerHealth: number;
  enemyHealth: number;
}
