import { CharacterConfig, Difficulty } from './types';

export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 450;
export const GROUND_Y = 400;

export const GRAVITY = 0;
export const MOVE_SPEED = 6.0;
export const FRICTION = 0.8;

export const FIGHTER_WIDTH = 100;
export const FIGHTER_HEIGHT = 180;

export const DAMAGE_PUNCH = 4;
export const DAMAGE_KICK = 6;
export const DAMAGE_TAKEDOWN = 12;
export const DAMAGE_SPECIAL = 20;

export const STAMINA_COST_PUNCH = 8;
export const STAMINA_COST_KICK = 15;
export const STAMINA_COST_TAKEDOWN = 18;
export const STAMINA_COST_SPECIAL = 30;
export const STAMINA_COST_DODGE = 12;
export const STAMINA_REGEN = 0.5;
export const STAMINA_EXHAUSTED_THRESHOLD = 15;

export const HIT_STUN_FRAMES = 40;
export const SLAMMED_FRAMES = 100;
export const PUNCH_FRAMES = 20;
export const KICK_FRAMES = 20;
export const TAKEDOWN_FRAMES = 20;
export const SPECIAL_FRAMES = 35;
export const SPRAWL_FRAMES = 20;
export const BLOCK_COOLDOWN = 30;
export const VICTORY_POSE_FRAMES = 999;

// Dodge / slip
export const DODGE_FRAMES = 22;
export const DODGE_IFRAME_START = 16; // stateTimer window: iframes while timer in (END, START]
export const DODGE_IFRAME_END = 4;
export const DODGE_COOLDOWN_FRAMES = 40;
export const DODGE_SLIDE_SPEED = 7;
export const COUNTER_WINDOW_FRAMES = 90; // frames after a successful dodge where hits do bonus damage
export const COUNTER_DAMAGE_MULT = 1.5;

// Parry (block within the first frames of an incoming hit)
export const PARRY_WINDOW_FRAMES = 7; // first N frames of block state count as parry
export const PARRY_STUN_FRAMES = 45;

// Dizzy / rocked state
export const DIZZY_HITS_REQUIRED = 4; // hits within window to get rocked
export const DIZZY_WINDOW_MS = 2600;
export const DIZZY_FRAMES = 110;
export const DIZZY_DAMAGE_MULT = 1.5;

// Combo damage scaling: each consecutive hit deals less
export const COMBO_DAMAGE_DECAY = 0.08;
export const COMBO_DAMAGE_FLOOR = 0.55;

// Hitstop (impact freeze frames)
export const HITSTOP_LIGHT = 4;
export const HITSTOP_HEAVY = 8;
export const HITSTOP_SPECIAL = 12;

// Knockback
export const KNOCKBACK_PUNCH = 5;
export const KNOCKBACK_KICK = 8;

export const POWER_METER_MAX = 100;
export const POWER_GAIN_PUNCH = 8;
export const POWER_GAIN_KICK = 12;
export const POWER_GAIN_TAKEDOWN = 20;
export const POWER_GAIN_ON_HIT = 5;
export const POWER_GAIN_PARRY = 15;

export const SCREEN_SHAKE_HEAVY = 10;
export const SCREEN_SHAKE_LIGHT = 4;
export const SCREEN_SHAKE_DECAY = 0.85;

export const COMBO_WINDOW_MS = 1800;

export const ROUND_DURATION = 99;
export const ROUNDS_TO_WIN = 2;
export const MAX_ROUNDS = 3;
export const ROUND_TRANSITION_DURATION = 4000;

// Round intro: "ROUND N" then "FIGHT!" before control is given
export const INTRO_ROUND_FRAMES = 90;
export const INTRO_FIGHT_FRAMES = 40;

// KO cinematic
export const KO_SLOWMO_FRAMES = 110;
export const KO_SLOWMO_FACTOR = 3; // physics runs 1/N speed during slow-mo

// Colors
export const COLOR_SKIN_P1 = '#ffccaa';
export const COLOR_SHORTS_P1 = '#b00219';
export const COLOR_SKIN_P2 = '#5d4037';
export const COLOR_SHORTS_P2 = '#1f2937';
export const COLOR_BG = '#333333';
export const COLOR_FENCE = '#555555';

// Unified roster — every fighter is selectable as player or opponent
export const ROSTER: CharacterConfig[] = [
  {
    id: 'merab',
    name: 'MERAB SHARIKADZE',
    skinColor: '#ffccaa',
    shortsColor: '#b00219',
    gloveColor: '#1a1a1a',
    accentColor: '#2563eb',
    health: 100,
    stamina: 100,
    speed: 1.0,
    punchDamage: 4,
    kickDamage: 6,
    takedownDamage: 12,
    specialName: 'BORJGALI RUSH',
    specialDamage: 20,
    specialType: 'punch',
    nationality: 'GEO',
    style: 'WRESTLER / STRIKER',
    aiProfile: 'balanced'
  },
  {
    id: 'topuria',
    name: 'ILIA TOPURIA',
    skinColor: '#f0b98d',
    shortsColor: '#0f172a',
    gloveColor: '#1a1a1a',
    accentColor: '#ef4444',
    health: 95,
    stamina: 105,
    speed: 1.05,
    punchDamage: 6,
    kickDamage: 5,
    takedownDamage: 13,
    specialName: 'EL MATADOR OVERHAND',
    specialDamage: 24,
    specialType: 'punch',
    nationality: 'GEO',
    style: 'BOXER / GRAPPLER',
    aiProfile: 'power'
  },
  {
    id: 'khabib',
    name: 'KHABIB NURMAGOMEDOV',
    skinColor: '#d4956a',
    shortsColor: '#1e3a5f',
    gloveColor: '#1a1a1a',
    accentColor: '#f59e0b',
    health: 110,
    stamina: 90,
    speed: 0.85,
    punchDamage: 3,
    kickDamage: 5,
    takedownDamage: 18,
    specialName: 'SAMBO SLAM',
    specialDamage: 22,
    specialType: 'takedown',
    nationality: 'RUS',
    style: 'SAMBO GRAPPLER',
    aiProfile: 'grappler'
  },
  {
    id: 'gsp',
    name: 'GEORGE ST-PIERRE',
    skinColor: '#f5cba7',
    shortsColor: '#1a1a2e',
    gloveColor: '#1a1a1a',
    accentColor: '#10b981',
    health: 95,
    stamina: 110,
    speed: 1.1,
    punchDamage: 5,
    kickDamage: 7,
    takedownDamage: 14,
    specialName: 'MONTREAL BLITZ',
    specialDamage: 18,
    specialType: 'kick',
    nationality: 'CAN',
    style: 'ALL-ROUNDER',
    aiProfile: 'balanced'
  },
  {
    id: 'jones',
    name: 'JON JONES',
    skinColor: '#5d4037',
    shortsColor: '#1f2937',
    gloveColor: '#1a1a1a',
    accentColor: '#dc2626',
    health: 100,
    stamina: 100,
    speed: 0.85,
    punchDamage: 5,
    kickDamage: 8,
    takedownDamage: 13,
    specialName: 'OBLIQUE KICK',
    specialDamage: 19,
    specialType: 'kick',
    nationality: 'USA',
    style: 'UNORTHODOX STRIKER',
    aiProfile: 'striker'
  },
  {
    id: 'adesanya',
    name: 'ISRAEL ADESANYA',
    skinColor: '#2d1b0e',
    shortsColor: '#111827',
    gloveColor: '#1a1a1a',
    accentColor: '#8b5cf6',
    health: 90,
    stamina: 110,
    speed: 1.1,
    punchDamage: 6,
    kickDamage: 9,
    takedownDamage: 8,
    specialName: 'STYLE BENDER COMBO',
    specialDamage: 21,
    specialType: 'punch',
    nationality: 'NGA',
    style: 'KICKBOXER',
    aiProfile: 'striker'
  },
  {
    id: 'pereira',
    name: 'ALEX PEREIRA',
    skinColor: '#c68958',
    shortsColor: '#14532d',
    gloveColor: '#1a1a1a',
    accentColor: '#22c55e',
    health: 105,
    stamina: 85,
    speed: 0.9,
    punchDamage: 7,
    kickDamage: 9,
    takedownDamage: 9,
    specialName: 'CHAMA LEFT HOOK',
    specialDamage: 26,
    specialType: 'punch',
    nationality: 'BRA',
    style: 'POWER KICKBOXER',
    aiProfile: 'power'
  },
  {
    id: 'ngannou',
    name: 'FRANCIS NGANNOU',
    skinColor: '#3d2314',
    shortsColor: '#1c1c1c',
    gloveColor: '#1a1a1a',
    accentColor: '#f97316',
    health: 120,
    stamina: 80,
    speed: 0.75,
    punchDamage: 8,
    kickDamage: 10,
    takedownDamage: 15,
    specialName: 'PREDATOR PUNCH',
    specialDamage: 28,
    specialType: 'punch',
    nationality: 'CMR',
    style: 'POWER STRIKER',
    aiProfile: 'power'
  }
];

// Rough threat rating used to order the tournament ladder
export const fighterRating = (c: CharacterConfig) =>
  c.health * 0.4 + (c.punchDamage + c.kickDamage) * 5 + c.takedownDamage * 2 + c.specialDamage;

export const TOURNAMENT_LADDER_SIZE = 4;

// Kept for backwards compatibility with older imports
export const PLAYER_CHARACTERS = ROSTER;
export const ENEMY_CHARACTERS = ROSTER;

export const CAREER_STORAGE_KEY = 'rkena-mma-career-v1';

export const DIFFICULTY_SETTINGS: Record<Difficulty, {
  aiSpeedMult: number;
  aiReactionChance: number;
  aiAttackFrequency: number;
  aiBlockChance: number;
  aiSprawlChance: number;
  aiDodgeChance: number;
  aiParryChance: number;
  damageMultiplier: number;
  label: string;
  description: string;
  color: string;
}> = {
  [Difficulty.EASY]: {
    aiSpeedMult: 0.4,
    aiReactionChance: 0.08,
    aiAttackFrequency: 0.5,
    aiBlockChance: 0.1,
    aiSprawlChance: 0.2,
    aiDodgeChance: 0.03,
    aiParryChance: 0.0,
    damageMultiplier: 0.7,
    label: 'EASY',
    description: 'ROOKIE',
    color: '#22c55e'
  },
  [Difficulty.MEDIUM]: {
    aiSpeedMult: 0.55,
    aiReactionChance: 0.15,
    aiAttackFrequency: 0.7,
    aiBlockChance: 0.2,
    aiSprawlChance: 0.4,
    aiDodgeChance: 0.08,
    aiParryChance: 0.05,
    damageMultiplier: 1.0,
    label: 'MEDIUM',
    description: 'CONTENDER',
    color: '#f59e0b'
  },
  [Difficulty.HARD]: {
    aiSpeedMult: 0.75,
    aiReactionChance: 0.25,
    aiAttackFrequency: 0.85,
    aiBlockChance: 0.35,
    aiSprawlChance: 0.65,
    aiDodgeChance: 0.15,
    aiParryChance: 0.12,
    damageMultiplier: 1.3,
    label: 'HARD',
    description: 'CHAMPION',
    color: '#ef4444'
  }
};

// Difficulty ramp across tournament ladder stages
export const TOURNAMENT_DIFFICULTY_RAMP: Difficulty[] = [
  Difficulty.EASY,
  Difficulty.MEDIUM,
  Difficulty.MEDIUM,
  Difficulty.HARD
];
