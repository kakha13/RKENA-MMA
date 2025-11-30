export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  GAMEOVER = 'GAMEOVER',
  VICTORY = 'VICTORY'
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
  SPRAWL = 'SPRAWL'
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Fighter {
  x: number;
  y: number;
  vx: number;
  width: number;
  height: number;
  color: string;
  shortsColor: string;
  direction: -1 | 1; // 1 = facing right, -1 = facing left
  health: number;
  maxHealth: number;
  stamina: number;
  maxStamina: number;
  state: ActionState;
  stateTimer: number; // Frames remaining in current state
  isPlayer: boolean;
  hitbox: Rect | null;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

export interface InputState {
  left: boolean;
  right: boolean;
  punch: boolean;
  kick: boolean;
  block: boolean;
  takedown: boolean;
}