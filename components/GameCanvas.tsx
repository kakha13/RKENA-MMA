
import React, { useRef, useEffect } from 'react';
import {
  ActionState, Fighter, InputState, Particle, Rect, CharacterConfig, Difficulty,
  RoundEndPayload, createEmptyStats
} from '../types';
import {
  CANVAS_WIDTH, CANVAS_HEIGHT, GROUND_Y, FIGHTER_WIDTH, FIGHTER_HEIGHT,
  MOVE_SPEED, FRICTION, HIT_STUN_FRAMES, SLAMMED_FRAMES, PUNCH_FRAMES, KICK_FRAMES,
  TAKEDOWN_FRAMES, BLOCK_COOLDOWN, SPECIAL_FRAMES,
  STAMINA_COST_PUNCH, STAMINA_COST_KICK, STAMINA_COST_TAKEDOWN, STAMINA_COST_SPECIAL,
  STAMINA_COST_DODGE, STAMINA_REGEN, STAMINA_EXHAUSTED_THRESHOLD,
  POWER_METER_MAX, POWER_GAIN_PUNCH, POWER_GAIN_KICK, POWER_GAIN_TAKEDOWN, POWER_GAIN_ON_HIT, POWER_GAIN_PARRY,
  SCREEN_SHAKE_HEAVY, SCREEN_SHAKE_LIGHT, SCREEN_SHAKE_DECAY,
  COMBO_WINDOW_MS, DIFFICULTY_SETTINGS, ROUND_DURATION,
  DODGE_FRAMES, DODGE_IFRAME_START, DODGE_IFRAME_END, DODGE_COOLDOWN_FRAMES, DODGE_SLIDE_SPEED,
  COUNTER_WINDOW_FRAMES, COUNTER_DAMAGE_MULT,
  PARRY_WINDOW_FRAMES, PARRY_STUN_FRAMES,
  DIZZY_HITS_REQUIRED, DIZZY_WINDOW_MS, DIZZY_FRAMES, DIZZY_DAMAGE_MULT,
  COMBO_DAMAGE_DECAY, COMBO_DAMAGE_FLOOR,
  HITSTOP_LIGHT, HITSTOP_HEAVY, HITSTOP_SPECIAL,
  KNOCKBACK_PUNCH, KNOCKBACK_KICK,
  INTRO_ROUND_FRAMES, INTRO_FIGHT_FRAMES,
  KO_SLOWMO_FRAMES, KO_SLOWMO_FACTOR
} from '../constants';
import { drawFighter, drawBackground } from '../utils/sprites';
import {
  playHitSound, playBlockSound, playWhooshSound, playSlamSound,
  playTakedownSound, playKOSound, playSpecialSound, playRoundBellSound,
  playVictorySound, playCrowdCheer, playComboSound, playParrySound, playDodgeSound, playDizzySound
} from '../utils/audio';

export interface GameCanvasProps {
  onRoundEnd: (payload: RoundEndPayload) => void;
  inputRef: React.MutableRefObject<InputState>;
  isMuted: boolean;
  paused: boolean;
  playerConfig: CharacterConfig;
  enemyConfig: CharacterConfig;
  difficulty: Difficulty;
  round: number;
}

const COMMENTATOR_LINES = {
  start: ["LET'S GET IT ON!", "LET'S FUCKING GO!", "HERE WE GO!", "FIGHT!"],
  punch: ["NICE JAB!", "STRAIGHT RIGHT!", "BOXING CLINIC!", "CLEAN SHOT!"],
  kick: ["BODY KICK!", "THAT'S A LEG KICK!", "DEVASTATING ROUNDHOUSE!", "HIGH KICK!"],
  takedown: ["TAKEDOWN!", "GETS HIM DOWN!", "HUGE SLAM!", "SHOOTING FOR THE LEGS!"],
  block: ["GOOD DEFENSE!", "HE SEES IT!", "NICE BLOCK!", "SMART FIGHTING!"],
  combo: ["COMBINATION!", "BEAUTIFUL COMBO!", "ON A ROLL!", "LIGHTS HIM UP!"],
  danger: ["HE'S HURT!", "IN SERIOUS TROUBLE!", "ALMOST FINISHED!", "WOBBLED!"],
  special: ["WHAT A MOVE!", "SIGNATURE TECHNIQUE!", "UNBELIEVABLE!", "CROWD GOES WILD!"],
  parry: ["WHAT A COUNTER!", "READ IT PERFECTLY!", "INCREDIBLE TIMING!", "MATRIX STUFF!"],
  dodge: ["SLIPS IT!", "MISSES BY INCHES!", "GREAT HEAD MOVEMENT!", "CAN'T TOUCH HIM!"],
  dizzy: ["HE'S ROCKED!", "ON WOBBLY LEGS!", "THE LIGHTS ARE FLICKERING!", "FINISH HIM!"],
  general: ["OOOW!", "BIG SHOT!", "EXCELLENT!", "THIS IS INCREDIBLE!"]
};

const AI_ATTACK_WEIGHTS: Record<string, { punch: number; kick: number; takedown: number }> = {
  striker: { punch: 0.35, kick: 0.45, takedown: 0.05 },
  grappler: { punch: 0.20, kick: 0.12, takedown: 0.48 },
  power: { punch: 0.45, kick: 0.28, takedown: 0.08 },
  balanced: { punch: 0.33, kick: 0.30, takedown: 0.20 }
};

const createFighter = (x: number, isPlayer: boolean, config: CharacterConfig): Fighter => ({
  x,
  y: GROUND_Y - FIGHTER_HEIGHT,
  vx: 0,
  width: FIGHTER_WIDTH,
  height: FIGHTER_HEIGHT,
  color: config.skinColor,
  shortsColor: config.shortsColor,
  gloveColor: config.gloveColor,
  accentColor: config.accentColor,
  direction: isPlayer ? 1 : -1,
  health: config.health,
  maxHealth: config.health,
  stamina: config.stamina,
  maxStamina: config.stamina,
  powerMeter: 0,
  maxPowerMeter: POWER_METER_MAX,
  state: ActionState.IDLE,
  stateTimer: 0,
  isPlayer,
  hitbox: null,
  characterId: config.id,
  damageDealt: 0,
  hitFlash: 0,
  comboCount: 0,
  lastHitTime: 0,
  speed: config.speed,
  punchDamage: config.punchDamage,
  kickDamage: config.kickDamage,
  takedownDamage: config.takedownDamage,
  specialName: config.specialName,
  specialDamage: config.specialDamage,
  specialType: config.specialType,
  dodgeCooldown: 0,
  counterWindow: 0,
  recentHitsTaken: [],
  hasBeenDizzy: false,
  stats: createEmptyStats()
});

const NO_INPUT: InputState = {
  left: false, right: false, punch: false, kick: false, block: false, takedown: false, special: false, dodge: false
};

function GameCanvas({ onRoundEnd, inputRef, isMuted, paused, playerConfig, enemyConfig, difficulty, round }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const frameRef = useRef({ lastTime: 0, accumulator: 0 });
  const mutedRef = useRef(isMuted);
  const pausedRef = useRef(paused);
  const onRoundEndRef = useRef(onRoundEnd);
  mutedRef.current = isMuted;
  pausedRef.current = paused;
  onRoundEndRef.current = onRoundEnd;

  const diffSettings = DIFFICULTY_SETTINGS[difficulty];

  const gameState = useRef({
    player: createFighter(150, true, playerConfig),
    enemy: createFighter(550, false, enemyConfig),
    particles: [] as Particle[],
    isRoundOver: false,
    timeRemaining: ROUND_DURATION,
    lastTimeUpdate: Date.now(),
    aiMoveDirection: 0 as -1 | 0 | 1,
    aiMoveTimer: 0,
    commentatorShout: null as { text: string; timer: number; x: number } | null,
    introBellPlayed: false,
    screenShake: 0,
    moveAnnouncement: null as { text: string; timer: number; color: string; x: number; y: number } | null,
    introTimer: INTRO_ROUND_FRAMES + INTRO_FIGHT_FRAMES,
    hitstop: 0,
    slowMo: 0,
    slowMoTick: 0,
    koTarget: null as Fighter | null,
    koBannerTimer: 0
  });

  const pickRandom = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

  const checkCollision = (r1: Rect, r2: Rect) =>
    r1.x < r2.x + r2.w && r1.x + r1.w > r2.x && r1.y < r2.y + r2.h && r1.y + r1.h > r2.y;

  const spawnParticles = (x: number, y: number, count: number, type: Particle['type'] = 'blood') => {
    const colors: Record<Particle['type'], string[]> = {
      blood: ['#aa0000', '#cc0000', '#880000'],
      spark: ['#ffff00', '#ffaa00', '#ffffff'],
      sweat: ['#aaddff', '#88ccff'],
      star: ['#ffff88', '#ffcc00', '#ffffff'],
      dust: ['#8a8a7a', '#6e6e60', '#a0a090'],
      ring: ['#ffffff']
    };
    for (let i = 0; i < count; i++) {
      const colorArr = colors[type];
      gameState.current.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * (type === 'star' ? 8 : type === 'dust' ? 6 : 15),
        vy: type === 'dust' ? -(Math.random() * 3) : (Math.random() - 0.5) * 15 - (type === 'star' ? 3 : 0),
        life: type === 'ring' ? 14 : 20 + Math.random() * 20,
        maxLife: type === 'ring' ? 14 : 40,
        color: colorArr[Math.floor(Math.random() * colorArr.length)],
        size: type === 'ring' ? 8 : Math.random() * (type === 'star' ? 5 : 6) + (type === 'star' ? 4 : 3),
        type
      });
    }
  };

  const triggerCommentator = (text: string, forceIndex?: number) => {
    const idx = forceIndex !== undefined ? forceIndex : Math.floor(Math.random() * 3);
    gameState.current.commentatorShout = { text, timer: 90, x: idx / 3 };
  };

  const showMoveAnnouncement = (text: string, color: string, x: number, y: number) => {
    gameState.current.moveAnnouncement = { text, timer: 50, color, x, y };
  };

  const applyScreenShake = (amount: number) => {
    gameState.current.screenShake = Math.max(gameState.current.screenShake, amount);
  };

  const applyHitstop = (frames: number) => {
    gameState.current.hitstop = Math.max(gameState.current.hitstop, frames);
  };

  const clampVitals = (f: Fighter) => {
    f.health = Math.max(0, Math.min(f.health, f.maxHealth));
    f.stamina = Math.max(0, Math.min(f.stamina, f.maxStamina));
  };

  const updateFighter = (f: Fighter, controls: InputState, target: Fighter) => {
    if (f.state === ActionState.KO || f.state === ActionState.VICTORY_POSE) return;

    // Cooldowns / windows
    if (f.dodgeCooldown > 0) f.dodgeCooldown--;
    if (f.counterWindow > 0) f.counterWindow--;

    // Stamina regen
    if (f.state === ActionState.IDLE || f.state === ActionState.WALK) {
      f.stamina = Math.min(f.stamina + STAMINA_REGEN, f.maxStamina);
    }

    // Hit flash decay
    if (f.hitFlash > 0) f.hitFlash--;

    // State timer tick
    if (f.stateTimer > 0) {
      f.stateTimer--;
      if (f.stateTimer <= 0) {
        if (f.state === ActionState.HIT || f.state === ActionState.SPRAWL ||
          f.state === ActionState.SLAMMED || f.state === ActionState.DIZZY) {
          f.state = ActionState.IDLE;
          f.vx = 0;
          f.y = GROUND_Y - FIGHTER_HEIGHT;
        } else if (f.state === ActionState.PUNCH || f.state === ActionState.KICK ||
          f.state === ActionState.BLOCK || f.state === ActionState.TAKEDOWN ||
          f.state === ActionState.SPECIAL || f.state === ActionState.DODGE) {
          f.state = ActionState.IDLE;
          f.hitbox = null;
        }
      }
    }

    const isBusy = [
      ActionState.PUNCH, ActionState.KICK, ActionState.HIT, ActionState.BLOCK,
      ActionState.TAKEDOWN, ActionState.SPRAWL, ActionState.SLAMMED, ActionState.SPECIAL,
      ActionState.DODGE, ActionState.DIZZY
    ].includes(f.state);

    // Knockback slide while stunned
    if (f.state === ActionState.HIT || f.state === ActionState.DIZZY) {
      if (Math.abs(f.vx) > 0.2) {
        f.x += f.vx;
        f.vx *= FRICTION;
      } else {
        f.vx = 0;
      }
    }

    // Slammed vertical animation
    if (f.state === ActionState.SLAMMED) {
      f.vx = 0;
      const max = SLAMMED_FRAMES;
      const t = f.stateTimer;
      const progress = 1 - t / max;
      if (progress < 0.3) {
        const lift = Math.sin(progress / 0.3 * Math.PI) * 120;
        f.y = (GROUND_Y - FIGHTER_HEIGHT) - lift;
      } else {
        f.y = GROUND_Y - FIGHTER_HEIGHT;
      }
      return;
    }

    // Dodge slide (slips back, away from facing direction)
    if (f.state === ActionState.DODGE) {
      f.x -= f.direction * DODGE_SLIDE_SPEED * (f.stateTimer / DODGE_FRAMES);
    }

    // Movement (exhausted fighters slow down)
    const exhausted = f.stamina < STAMINA_EXHAUSTED_THRESHOLD;
    if (!isBusy) {
      const speed = MOVE_SPEED * f.speed * (exhausted ? 0.55 : 1);
      if (controls.left) {
        f.x -= speed;
        f.state = ActionState.WALK;
      } else if (controls.right) {
        f.x += speed;
        f.state = ActionState.WALK;
      } else {
        f.state = ActionState.IDLE;
      }
    } else if (f.state === ActionState.TAKEDOWN || f.state === ActionState.SPECIAL) {
      const totalFrames = f.state === ActionState.TAKEDOWN ? TAKEDOWN_FRAMES : SPECIAL_FRAMES;
      if (f.stateTimer > totalFrames * 0.3 && f.stateTimer <= totalFrames * 0.8) {
        const dashSpeed = MOVE_SPEED * f.speed * 1.2;
        const distToTarget = Math.abs(f.x - target.x);
        if (distToTarget > f.width * 0.8) {
          f.x += f.direction * dashSpeed;
        }
      }
      if (f.hitbox) {
        const reach = f.width * 1.2;
        f.hitbox.x = f.direction === 1 ? f.x + f.width * 0.3 : f.x - reach + f.width * 0.7;
      }
    }

    // Actions
    if (!isBusy && f.stamina >= 10) {
      if (controls.dodge && f.dodgeCooldown <= 0 && f.stamina >= STAMINA_COST_DODGE) {
        f.state = ActionState.DODGE;
        f.stateTimer = DODGE_FRAMES;
        f.dodgeCooldown = DODGE_COOLDOWN_FRAMES;
        f.stamina -= STAMINA_COST_DODGE;
        f.vx = 0;
        playDodgeSound(mutedRef.current);
      } else if (controls.special && f.powerMeter >= POWER_METER_MAX && f.stamina >= STAMINA_COST_SPECIAL) {
        f.state = ActionState.SPECIAL;
        f.stateTimer = SPECIAL_FRAMES;
        f.stamina -= STAMINA_COST_SPECIAL;
        f.powerMeter = 0;
        f.vx = 0;
        f.stats.strikesThrown++;
        playSpecialSound(mutedRef.current);
        const reach = f.width * 1.4;
        f.hitbox = {
          x: f.direction === 1 ? f.x + f.width * 0.3 : f.x - reach + f.width * 0.7,
          y: f.y + f.height * 0.1,
          w: reach,
          h: f.height * 0.85
        };
      } else if (controls.takedown && f.stamina >= STAMINA_COST_TAKEDOWN) {
        f.state = ActionState.TAKEDOWN;
        f.stateTimer = TAKEDOWN_FRAMES;
        f.stamina -= STAMINA_COST_TAKEDOWN;
        f.vx = 0;
        f.stats.strikesThrown++;
        playWhooshSound(mutedRef.current);
        const reach = f.width * 1.2;
        f.hitbox = {
          x: f.direction === 1 ? f.x + f.width * 0.5 : f.x - reach + f.width * 0.5,
          y: f.y + f.height * 0.4,
          w: reach,
          h: f.height * 0.4
        };
      } else if (controls.punch) {
        f.state = ActionState.PUNCH;
        f.stateTimer = PUNCH_FRAMES;
        f.stamina -= STAMINA_COST_PUNCH;
        f.stats.strikesThrown++;
        playWhooshSound(mutedRef.current);
        const reach = f.width * 0.8;
        f.hitbox = {
          x: f.direction === 1 ? f.x + f.width * 0.5 : f.x - reach + f.width * 0.5,
          y: f.y + f.height * 0.15,
          w: reach,
          h: f.height * 0.2
        };
      } else if (controls.kick) {
        f.state = ActionState.KICK;
        f.stateTimer = KICK_FRAMES;
        f.stamina -= STAMINA_COST_KICK;
        f.stats.strikesThrown++;
        playWhooshSound(mutedRef.current);
        const reach = f.width * 1.0;
        f.hitbox = {
          x: f.direction === 1 ? f.x + f.width * 0.5 : f.x - reach + f.width * 0.5,
          y: f.y + f.height * 0.45,
          w: reach,
          h: f.height * 0.25
        };
      } else if (controls.block) {
        f.state = ActionState.BLOCK;
        f.stateTimer = BLOCK_COOLDOWN;
      }
    }

    f.x = Math.max(0, Math.min(f.x, CANVAS_WIDTH - f.width));

    if ((f.state === ActionState.IDLE || f.state === ActionState.WALK) && f.stateTimer <= 0) {
      f.direction = f.x < target.x ? 1 : -1;
    }
  };

  const updateAI = (ai: Fighter, player: Fighter): InputState => {
    const controls: InputState = { ...NO_INPUT };
    if (ai.state === ActionState.KO || ai.state === ActionState.VICTORY_POSE) return controls;
    if (ai.stateTimer > 0) return controls;

    const dist = Math.abs(ai.x - player.x);
    const attackRange = ai.width * 1.2;
    const facingPlayer = (ai.direction === 1 && player.x > ai.x) || (ai.direction === -1 && player.x < ai.x);
    const weights = AI_ATTACK_WEIGHTS[enemyConfig.aiProfile] ?? AI_ATTACK_WEIGHTS.balanced;

    // Sprawl vs takedown
    if (player.state === ActionState.TAKEDOWN && dist < attackRange + 80 && facingPlayer) {
      if (Math.random() > (1 - diffSettings.aiSprawlChance)) {
        controls.block = true;
        return controls;
      }
    }

    // Defensive reads: dodge or parry incoming strikes
    const playerAttacking = (player.state === ActionState.PUNCH || player.state === ActionState.KICK ||
      player.state === ActionState.SPECIAL);
    if (playerAttacking && dist < attackRange + 40 && facingPlayer) {
      if (ai.dodgeCooldown <= 0 && Math.random() < diffSettings.aiDodgeChance) {
        controls.dodge = true;
        return controls;
      }
      if (Math.random() < diffSettings.aiParryChance) {
        controls.block = true;
        return controls;
      }
    }

    // Smell blood: swarm a rocked opponent
    const playerVulnerable = player.state === ActionState.DIZZY;

    // Use special move when power is full
    const specialRange = ai.specialType === 'takedown' ? attackRange * 1.8 : attackRange * 1.5;
    if (ai.powerMeter >= POWER_METER_MAX && Math.random() < (playerVulnerable ? 0.6 : 0.3) && dist < specialRange) {
      controls.special = true;
      return controls;
    }

    // Sticky movement
    if (gameState.current.aiMoveTimer > 0) {
      gameState.current.aiMoveTimer--;
      if (gameState.current.aiMoveDirection === -1) controls.left = true;
      else if (gameState.current.aiMoveDirection === 1) controls.right = true;
      return controls;
    }

    const reaction = playerVulnerable ? Math.min(0.5, diffSettings.aiReactionChance * 2.5) : diffSettings.aiReactionChance;
    if (Math.random() > reaction) return controls;

    if (dist > attackRange + 20) {
      gameState.current.aiMoveTimer = 30 + Math.floor(Math.random() * 30);
      if (player.x > ai.x) {
        gameState.current.aiMoveDirection = 1;
        controls.right = true;
      } else {
        gameState.current.aiMoveDirection = -1;
        controls.left = true;
      }
      if (Math.random() < weights.takedown * 0.1 && ai.stamina > 50) {
        controls.takedown = true;
      }
    } else if (dist < attackRange && facingPlayer) {
      gameState.current.aiMoveDirection = 0;
      gameState.current.aiMoveTimer = 0;

      const rand = Math.random();
      const freq = diffSettings.aiAttackFrequency * (playerVulnerable ? 1.5 : 1);
      const pPunch = weights.punch * freq;
      const pKick = pPunch + weights.kick * freq;
      const pTakedown = pKick + weights.takedown * freq;
      if (rand < pPunch && ai.stamina > 20) controls.punch = true;
      else if (rand < pKick && ai.stamina > 20) controls.kick = true;
      else if (rand < pTakedown && ai.stamina > 40 && dist > ai.width * 0.5) controls.takedown = true;
      else if (Math.random() < diffSettings.aiBlockChance) controls.block = true;
    } else {
      gameState.current.aiMoveTimer = 20 + Math.floor(Math.random() * 20);
      if (player.x > ai.x) {
        gameState.current.aiMoveDirection = -1;
        controls.left = true;
      } else {
        gameState.current.aiMoveDirection = 1;
        controls.right = true;
      }
    }

    return controls;
  };

  const updateParticles = () => {
    gameState.current.particles = gameState.current.particles.filter(p => p.life > 0);
    gameState.current.particles.forEach(p => {
      if (p.type === 'ring') {
        p.size += 3;
      } else {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.type === 'dust' ? 0.15 : 0.8;
      }
      p.life--;
    });
  };

  const drawParticles = (ctx: CanvasRenderingContext2D) => {
    gameState.current.particles.forEach(p => {
      const alpha = p.life / (p.maxLife || 40);
      ctx.globalAlpha = alpha;
      if (p.type === 'star') {
        ctx.fillStyle = p.color;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.life * 0.2);
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      } else if (p.type === 'ring') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      }
    });
    ctx.globalAlpha = 1;
  };

  const updateCommentatorShout = () => {
    if (gameState.current.commentatorShout) {
      gameState.current.commentatorShout.timer--;
      if (gameState.current.commentatorShout.timer <= 0) {
        gameState.current.commentatorShout = null;
      }
    }
    if (gameState.current.moveAnnouncement) {
      gameState.current.moveAnnouncement.timer--;
      if (gameState.current.moveAnnouncement.timer <= 0) {
        gameState.current.moveAnnouncement = null;
      }
    }
  };

  const drawCommentatorShout = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const shout = gameState.current.commentatorShout;
    if (!shout) return;
    const alpha = Math.min(1, shout.timer / 30);
    const scale = 1 + (90 - shout.timer) * 0.003;
    ctx.save();
    ctx.globalAlpha = alpha;
    const offsets = [-110, 0, 110];
    const commentatorIndex = Math.round(shout.x * 3);
    const commentatorX = width / 2 + offsets[Math.min(commentatorIndex, 2)];
    const commentatorHeadY = height - 180;
    const x = commentatorX;
    const y = commentatorHeadY - 60;
    ctx.font = `bold ${Math.floor(14 * scale)}px "Press Start 2P", monospace`;
    const textWidth = ctx.measureText(shout.text).width;
    const bubbleWidth = textWidth + 24;
    const bubbleHeight = 32;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 2;
    const bx = x - bubbleWidth / 2;
    const by = y - bubbleHeight / 2;
    const radius = 8;
    ctx.beginPath();
    ctx.moveTo(bx + radius, by);
    ctx.lineTo(bx + bubbleWidth - radius, by);
    ctx.quadraticCurveTo(bx + bubbleWidth, by, bx + bubbleWidth, by + radius);
    ctx.lineTo(bx + bubbleWidth, by + bubbleHeight - radius);
    ctx.quadraticCurveTo(bx + bubbleWidth, by + bubbleHeight, bx + bubbleWidth - radius, by + bubbleHeight);
    ctx.lineTo(bx + radius, by + bubbleHeight);
    ctx.quadraticCurveTo(bx, by + bubbleHeight, bx, by + bubbleHeight - radius);
    ctx.lineTo(bx, by + radius);
    ctx.quadraticCurveTo(bx, by, bx + radius, by);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - 6, y + bubbleHeight / 2 - 2);
    ctx.lineTo(x, y + bubbleHeight / 2 + 12);
    ctx.lineTo(x + 6, y + bubbleHeight / 2 - 2);
    ctx.closePath();
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(x, y + bubbleHeight / 2 + 20, 4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y + bubbleHeight / 2 + 30, 2.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#dc2626';
    ctx.fillText(shout.text, x, y);
    ctx.restore();
  };

  const drawMoveAnnouncement = (ctx: CanvasRenderingContext2D) => {
    const ann = gameState.current.moveAnnouncement;
    if (!ann) return;
    const progress = ann.timer / 50;
    const alpha = progress;
    const scale = 1.5 - progress * 0.5;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(ann.x, ann.y - (1 - progress) * 30);
    ctx.scale(scale, scale);
    ctx.font = 'bold 18px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.strokeText(ann.text, 0, 0);
    ctx.fillStyle = ann.color;
    ctx.fillText(ann.text, 0, 0);
    ctx.restore();
  };

  const drawCenterBanner = (ctx: CanvasRenderingContext2D, text: string, color: string, sub?: string) => {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 44px "Press Start 2P", monospace';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 10;
    ctx.strokeText(text, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
    ctx.fillStyle = color;
    ctx.fillText(text, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
    if (sub) {
      ctx.font = 'bold 14px "Press Start 2P", monospace';
      ctx.lineWidth = 5;
      ctx.strokeText(sub, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(sub, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
    }
    ctx.restore();
  };

  const registerHitTaken = (defender: Fighter) => {
    const now = Date.now();
    defender.recentHitsTaken.push(now);
    defender.recentHitsTaken = defender.recentHitsTaken.filter(t => now - t < DIZZY_WINDOW_MS);
    if (!defender.hasBeenDizzy &&
      defender.recentHitsTaken.length >= DIZZY_HITS_REQUIRED &&
      defender.health > 0 &&
      defender.state !== ActionState.SLAMMED) {
      defender.hasBeenDizzy = true;
      defender.state = ActionState.DIZZY;
      defender.stateTimer = DIZZY_FRAMES;
      defender.hitbox = null;
      playDizzySound(mutedRef.current);
      playCrowdCheer(mutedRef.current);
      triggerCommentator(pickRandom(COMMENTATOR_LINES.dizzy));
      showMoveAnnouncement('ROCKED!', '#facc15', defender.x + defender.width / 2, defender.y - 30);
      spawnParticles(defender.x + defender.width / 2, defender.y - 10, 8, 'star');
    }
  };

  const comboScaledDamage = (base: number, comboCount: number) =>
    base * Math.max(COMBO_DAMAGE_FLOOR, 1 - Math.max(0, comboCount - 1) * COMBO_DAMAGE_DECAY);

  const checkCombatCollisions = (attacker: Fighter, defender: Fighter) => {
    if (!attacker.hitbox) return;
    if ([ActionState.HIT, ActionState.SLAMMED, ActionState.KO, ActionState.SPRAWL].includes(defender.state)) return;

    if (attacker.state === ActionState.TAKEDOWN) {
      if (attacker.stateTimer <= TAKEDOWN_FRAMES * 0.3 || attacker.stateTimer > TAKEDOWN_FRAMES * 0.8) return;
    } else if (attacker.state === ActionState.SPECIAL) {
      if (attacker.stateTimer <= SPECIAL_FRAMES * 0.35 || attacker.stateTimer > SPECIAL_FRAMES * 0.85) return;
    } else {
      if (attacker.stateTimer <= 5) return;
    }

    const defenderHurtbox: Rect = { x: defender.x, y: defender.y, w: defender.width, h: defender.height };
    if (!checkCollision(attacker.hitbox, defenderHurtbox)) return;

    const now = Date.now();

    // Dodge i-frames: attack whiffs, defender earns a counter window
    if (defender.state === ActionState.DODGE &&
      defender.stateTimer <= DODGE_IFRAME_START && defender.stateTimer > DODGE_IFRAME_END) {
      attacker.hitbox = null;
      defender.counterWindow = COUNTER_WINDOW_FRAMES;
      defender.stats.dodges++;
      playWhooshSound(mutedRef.current);
      triggerCommentator(pickRandom(COMMENTATOR_LINES.dodge));
      showMoveAnnouncement('MISS!', '#38bdf8', defender.x + defender.width / 2, defender.y - 15);
      spawnParticles(defender.x + defender.width / 2, defender.y + defender.height * 0.2, 4, 'sweat');
      return;
    }

    const defenderDizzy = defender.state === ActionState.DIZZY;
    const counterMult = attacker.counterWindow > 0 ? COUNTER_DAMAGE_MULT : 1;

    // Special move
    if (attacker.state === ActionState.SPECIAL) {
      if (defender.state === ActionState.BLOCK) {
        defender.stamina -= 25;
        defender.state = ActionState.HIT;
        defender.stateTimer = HIT_STUN_FRAMES * 0.5;
        playBlockSound(mutedRef.current);
      } else {
        const dmg = attacker.specialDamage * diffSettings.damageMultiplier * counterMult * (defenderDizzy ? DIZZY_DAMAGE_MULT : 1);
        defender.health -= dmg;
        attacker.damageDealt += dmg;
        attacker.stats.damageDealt += dmg;
        attacker.stats.strikesLanded++;
        attacker.stats.specialsLanded++;
        if (counterMult > 1) attacker.counterWindow = 0;
        defender.state = ActionState.SLAMMED;
        defender.stateTimer = SLAMMED_FRAMES;
        defender.hitbox = null;
        defender.vx = 0;
        defender.hitFlash = 8;
        registerHitTaken(defender);
        spawnParticles(defender.x + defender.width / 2, defender.y + defender.height * 0.3, 20, 'star');
        spawnParticles(defender.x + defender.width / 2, defender.y + defender.height * 0.3, 15, 'blood');
        spawnParticles(defender.x + defender.width / 2, defender.y + defender.height * 0.3, 1, 'ring');
        playSpecialSound(mutedRef.current);
        playCrowdCheer(mutedRef.current);
        applyScreenShake(SCREEN_SHAKE_HEAVY * 1.5);
        applyHitstop(HITSTOP_SPECIAL);
        triggerCommentator(pickRandom(COMMENTATOR_LINES.special));
        showMoveAnnouncement(
          attacker.specialName,
          '#f59e0b',
          attacker.x + attacker.width / 2,
          attacker.y - 20
        );
      }
      clampVitals(defender);
      attacker.hitbox = null;
      return;
    }

    // Takedown
    if (attacker.state === ActionState.TAKEDOWN) {
      if (defender.state === ActionState.TAKEDOWN) {
        attacker.stamina -= 10;
        attacker.hitbox = null;
        playBlockSound(mutedRef.current);
        defender.stamina -= 10;
        defender.state = ActionState.IDLE;
        defender.stateTimer = 15;
        defender.hitbox = null;
        defender.x -= defender.direction * 20;
        clampVitals(attacker);
        clampVitals(defender);
        return;
      } else if (defender.state === ActionState.BLOCK) {
        attacker.stamina -= 15;
        attacker.hitbox = null;
        attacker.x -= attacker.direction * 20;
        playBlockSound(mutedRef.current);
        defender.state = ActionState.IDLE;
        defender.stateTimer = 15;
        defender.hitbox = null;
        triggerCommentator(pickRandom(COMMENTATOR_LINES.block));
        clampVitals(attacker);
        return;
      } else {
        const dmg = attacker.takedownDamage * diffSettings.damageMultiplier * counterMult * (defenderDizzy ? DIZZY_DAMAGE_MULT : 1);
        defender.health -= dmg;
        attacker.damageDealt += dmg;
        attacker.stats.damageDealt += dmg;
        attacker.stats.takedowns++;
        if (counterMult > 1) attacker.counterWindow = 0;
        attacker.powerMeter = Math.min(attacker.maxPowerMeter, attacker.powerMeter + POWER_GAIN_TAKEDOWN);
        defender.powerMeter = Math.min(defender.maxPowerMeter, defender.powerMeter + POWER_GAIN_ON_HIT);
        defender.state = ActionState.SLAMMED;
        defender.stateTimer = SLAMMED_FRAMES;
        defender.hitbox = null;
        defender.vx = 0;
        defender.hitFlash = 8;
        defender.direction = defender.x < attacker.x ? 1 : -1;
        registerHitTaken(defender);
        spawnParticles(defender.x + defender.width / 2, defender.y + defender.height * 0.8, 15, 'blood');
        spawnParticles(defender.x + defender.width / 2, defender.y + defender.height * 0.5, 8, 'sweat');
        spawnParticles(defender.x + defender.width / 2, GROUND_Y - 10, 10, 'dust');
        playTakedownSound(mutedRef.current);
        setTimeout(() => playSlamSound(mutedRef.current), 300);
        applyScreenShake(SCREEN_SHAKE_HEAVY);
        applyHitstop(HITSTOP_HEAVY);
        triggerCommentator(pickRandom(COMMENTATOR_LINES.takedown));
        showMoveAnnouncement('TAKEDOWN!', '#ef4444', attacker.x + attacker.width / 2, attacker.y - 20);
        clampVitals(defender);
        attacker.hitbox = null;
        return;
      }
    }

    // Punch / Kick
    const isKick = attacker.state === ActionState.KICK;
    const baseDamage = (isKick ? attacker.kickDamage : attacker.punchDamage) * diffSettings.damageMultiplier;

    if (defender.state === ActionState.BLOCK) {
      // Perfect block = parry: block started just before the hit landed
      const blockAge = BLOCK_COOLDOWN - defender.stateTimer;
      if (blockAge <= PARRY_WINDOW_FRAMES) {
        attacker.state = ActionState.HIT;
        attacker.stateTimer = PARRY_STUN_FRAMES;
        attacker.hitbox = null;
        attacker.vx = attacker.direction * -3;
        attacker.comboCount = 0;
        defender.state = ActionState.IDLE;
        defender.stateTimer = 0;
        defender.powerMeter = Math.min(defender.maxPowerMeter, defender.powerMeter + POWER_GAIN_PARRY);
        defender.counterWindow = COUNTER_WINDOW_FRAMES;
        defender.stats.parries++;
        spawnParticles(defender.x + defender.width * (defender.direction === 1 ? 0.9 : 0.1), defender.y + defender.height * 0.3, 10, 'spark');
        spawnParticles(defender.x + defender.width / 2, defender.y + defender.height * 0.3, 1, 'ring');
        playParrySound(mutedRef.current);
        applyHitstop(HITSTOP_HEAVY);
        applyScreenShake(SCREEN_SHAKE_LIGHT);
        triggerCommentator(pickRandom(COMMENTATOR_LINES.parry));
        showMoveAnnouncement('PARRY!', '#22d3ee', defender.x + defender.width / 2, defender.y - 20);
        return;
      }
      defender.stamina -= baseDamage * 2;
      spawnParticles(defender.x + defender.width / 2, defender.y + defender.height * 0.2, 3, 'sweat');
      playBlockSound(mutedRef.current);
      triggerCommentator(pickRandom(COMMENTATOR_LINES.block));
      clampVitals(defender);
    } else {
      const wasDizzy = defenderDizzy;

      // Combo detection (scales damage down on long strings)
      const timeSinceLastHit = now - attacker.lastHitTime;
      if (timeSinceLastHit < COMBO_WINDOW_MS && attacker.lastHitTime > 0) {
        attacker.comboCount++;
        if (attacker.comboCount >= 2) {
          playComboSound(mutedRef.current, attacker.comboCount);
          if (attacker.comboCount >= 3) {
            triggerCommentator(pickRandom(COMMENTATOR_LINES.combo));
            showMoveAnnouncement(`${attacker.comboCount}x COMBO!`, '#f59e0b', attacker.x + attacker.width / 2, attacker.y - 20);
          }
        }
      } else {
        attacker.comboCount = 1;
      }
      attacker.lastHitTime = now;
      attacker.stats.maxCombo = Math.max(attacker.stats.maxCombo, attacker.comboCount);

      const damage = comboScaledDamage(baseDamage, attacker.comboCount) * counterMult * (wasDizzy ? DIZZY_DAMAGE_MULT : 1);
      defender.health -= damage;
      attacker.damageDealt += damage;
      attacker.stats.damageDealt += damage;
      attacker.stats.strikesLanded++;
      if (counterMult > 1) {
        attacker.counterWindow = 0;
        showMoveAnnouncement('COUNTER!', '#22d3ee', attacker.x + attacker.width / 2, attacker.y - 40);
      }
      attacker.powerMeter = Math.min(
        attacker.maxPowerMeter,
        attacker.powerMeter + (isKick ? POWER_GAIN_KICK : POWER_GAIN_PUNCH)
      );
      defender.powerMeter = Math.min(defender.maxPowerMeter, defender.powerMeter + POWER_GAIN_ON_HIT);

      defender.state = ActionState.HIT;
      defender.stateTimer = HIT_STUN_FRAMES;
      defender.hitbox = null;
      defender.hitFlash = 6;
      defender.vx = attacker.direction * (isKick ? KNOCKBACK_KICK : KNOCKBACK_PUNCH);
      registerHitTaken(defender);

      spawnParticles(defender.x + defender.width / 2, defender.y + defender.height * 0.2, 12, 'blood');
      spawnParticles(defender.x + defender.width / 2, defender.y + defender.height * 0.2, 5, 'sweat');

      playHitSound(mutedRef.current, isKick);
      applyScreenShake(isKick ? SCREEN_SHAKE_LIGHT * 1.5 : SCREEN_SHAKE_LIGHT);
      applyHitstop(isKick ? HITSTOP_HEAVY : HITSTOP_LIGHT);

      // Low health commentary
      if (defender.health < defender.maxHealth * 0.25) {
        triggerCommentator(pickRandom(COMMENTATOR_LINES.danger));
      } else if (damage > 5 && Math.random() < 0.3) {
        triggerCommentator(pickRandom(COMMENTATOR_LINES.general));
      }

      const moveLabel = isKick ? 'KICK!' : 'PUNCH!';
      const moveColor = isKick ? '#f97316' : '#38bdf8';
      if (Math.random() < 0.4 && counterMult === 1) {
        showMoveAnnouncement(moveLabel, moveColor, defender.x + defender.width / 2, defender.y - 10);
      }
      clampVitals(defender);
    }
    attacker.hitbox = null;
  };

  const stepSimulation = () => {
    const { player, enemy } = gameState.current;

    updateFighter(player, inputRef.current, enemy);
    const aiInput = updateAI(enemy, player);
    updateFighter(enemy, aiInput, player);

    checkCombatCollisions(player, enemy);
    checkCombatCollisions(enemy, player);

    // Timer
    const now = Date.now();
    if (now - gameState.current.lastTimeUpdate > 1000 && !gameState.current.isRoundOver) {
      if (gameState.current.timeRemaining > 0) {
        gameState.current.timeRemaining--;
      }
      gameState.current.lastTimeUpdate = now;
    }

    // Check KO
    if (player.health <= 0 && player.state !== ActionState.KO) {
      player.state = ActionState.KO;
      player.health = 0;
      if (!gameState.current.isRoundOver) {
        gameState.current.isRoundOver = true;
        gameState.current.slowMo = KO_SLOWMO_FRAMES;
        gameState.current.koTarget = player;
        gameState.current.koBannerTimer = 150;
        playKOSound(mutedRef.current);
        enemy.state = ActionState.VICTORY_POSE;
        setTimeout(() => onRoundEndRef.current({
          winner: 'ENEMY', method: 'KO',
          playerStats: { ...player.stats }, enemyStats: { ...enemy.stats }
        }), 3200);
      }
    }
    if (enemy.health <= 0 && enemy.state !== ActionState.KO) {
      enemy.state = ActionState.KO;
      enemy.health = 0;
      if (!gameState.current.isRoundOver) {
        gameState.current.isRoundOver = true;
        gameState.current.slowMo = KO_SLOWMO_FRAMES;
        gameState.current.koTarget = enemy;
        gameState.current.koBannerTimer = 150;
        playKOSound(mutedRef.current);
        playVictorySound(mutedRef.current);
        player.state = ActionState.VICTORY_POSE;
        setTimeout(() => onRoundEndRef.current({
          winner: 'PLAYER', method: 'KO',
          playerStats: { ...player.stats }, enemyStats: { ...enemy.stats }
        }), 3200);
      }
    }

    // Timer expires → judge decision
    if (gameState.current.timeRemaining <= 0 && !gameState.current.isRoundOver) {
      gameState.current.isRoundOver = true;
      playRoundBellSound(mutedRef.current);
      const winner = player.damageDealt > enemy.damageDealt ? 'PLAYER' :
        enemy.damageDealt > player.damageDealt ? 'ENEMY' : 'DRAW';
      setTimeout(() => onRoundEndRef.current({
        winner, method: 'DECISION',
        playerStats: { ...player.stats }, enemyStats: { ...enemy.stats }
      }), 2000);
    }
  };

  const gameLoop = (time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (frameRef.current.lastTime === 0) {
      frameRef.current.lastTime = time;
    }
    const deltaTime = Math.min(time - frameRef.current.lastTime, 100);
    frameRef.current.lastTime = time;

    if (pausedRef.current) {
      // Freeze the simulation without accumulating time
      frameRef.current.accumulator = 0;
      gameState.current.lastTimeUpdate = Date.now();
      requestRef.current = requestAnimationFrame(gameLoop);
      return;
    }

    frameRef.current.accumulator += deltaTime;
    if (frameRef.current.accumulator > 200) frameRef.current.accumulator = 200;

    const FIXED_TIME_STEP = 1000 / 60;

    while (frameRef.current.accumulator >= FIXED_TIME_STEP) {
      frameRef.current.accumulator -= FIXED_TIME_STEP;

      // Round intro: fighters wait, banner counts down
      if (gameState.current.introTimer > 0) {
        gameState.current.introTimer--;
        if (gameState.current.introTimer === INTRO_FIGHT_FRAMES && !gameState.current.introBellPlayed) {
          gameState.current.introBellPlayed = true;
          playRoundBellSound(mutedRef.current);
          triggerCommentator(pickRandom(COMMENTATOR_LINES.start), 2);
        }
        gameState.current.lastTimeUpdate = Date.now();
        updateCommentatorShout();
        continue;
      }

      // Hitstop: freeze everything for impact frames
      if (gameState.current.hitstop > 0) {
        gameState.current.hitstop--;
        gameState.current.lastTimeUpdate = Date.now();
        continue;
      }

      // KO slow-motion: run physics at reduced rate
      if (gameState.current.slowMo > 0) {
        gameState.current.slowMo--;
        gameState.current.slowMoTick++;
        if (gameState.current.slowMoTick % KO_SLOWMO_FACTOR !== 0) {
          updateParticles();
          continue;
        }
      }

      stepSimulation();
      updateParticles();
      updateCommentatorShout();

      if (gameState.current.koBannerTimer > 0) gameState.current.koBannerTimer--;

      // Screen shake decay
      if (gameState.current.screenShake > 0) {
        gameState.current.screenShake *= SCREEN_SHAKE_DECAY;
        if (gameState.current.screenShake < 0.5) gameState.current.screenShake = 0;
      }
    }

    // ==================== RENDER ====================
    ctx.save();

    // KO cinematic zoom toward the fallen fighter
    if (gameState.current.slowMo > 0 && gameState.current.koTarget) {
      const t = 1 - gameState.current.slowMo / KO_SLOWMO_FRAMES;
      const zoom = 1 + Math.min(t * 2, 1) * 0.3;
      const target = gameState.current.koTarget;
      const fx = target.x + target.width / 2;
      const fy = target.y + target.height * 0.7;
      ctx.translate(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      ctx.scale(zoom, zoom);
      ctx.translate(
        -Math.max(CANVAS_WIDTH * 0.25, Math.min(fx, CANVAS_WIDTH * 0.75)),
        -Math.max(CANVAS_HEIGHT * 0.35, Math.min(fy, CANVAS_HEIGHT * 0.65))
      );
    } else {
      if (gameState.current.screenShake > 0) {
        const sx = (Math.random() - 0.5) * gameState.current.screenShake;
        const sy = (Math.random() - 0.5) * gameState.current.screenShake;
        ctx.translate(sx, sy);
      }
    }

    ctx.clearRect(-CANVAS_WIDTH, -CANVAS_HEIGHT, CANVAS_WIDTH * 3, CANVAS_HEIGHT * 3);
    drawBackground(ctx, CANVAS_WIDTH, CANVAS_HEIGHT);
    drawCommentatorShout(ctx, CANVAS_WIDTH, CANVAS_HEIGHT);

    const { player, enemy } = gameState.current;

    if (player.y < enemy.y) {
      drawFighter(ctx, player);
      drawFighter(ctx, enemy);
    } else {
      drawFighter(ctx, enemy);
      drawFighter(ctx, player);
    }

    drawParticles(ctx);
    drawMoveAnnouncement(ctx);

    ctx.restore();

    // Overlays drawn without camera transform
    if (gameState.current.introTimer > 0) {
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.restore();
      if (gameState.current.introTimer > INTRO_FIGHT_FRAMES) {
        drawCenterBanner(ctx, `ROUND ${round}`, '#e8e4d9', `${playerConfig.name.split(' ')[0]}  VS  ${enemyConfig.name.split(' ')[0]}`);
      } else {
        drawCenterBanner(ctx, 'FIGHT!', '#dc2626');
      }
    }

    if (gameState.current.koBannerTimer > 0) {
      const method = gameState.current.koTarget === gameState.current.enemy ? 'KO!' : 'KO!';
      drawCenterBanner(ctx, method, '#dc2626',
        gameState.current.koTarget === gameState.current.enemy ? 'WHAT A FINISH!' : 'DOWN GOES THE CHALLENGER!');
    }

    // Dispatch HUD event
    const event = new CustomEvent('game-update', {
      detail: {
        p1: {
          health: player.health, maxHealth: player.maxHealth, stamina: player.stamina, maxStamina: player.maxStamina,
          powerMeter: player.powerMeter, maxPowerMeter: player.maxPowerMeter, name: playerConfig.name,
          comboCount: player.comboCount, counterWindow: player.counterWindow, dizzy: player.state === ActionState.DIZZY
        },
        p2: {
          health: enemy.health, maxHealth: enemy.maxHealth, stamina: enemy.stamina, maxStamina: enemy.maxStamina,
          powerMeter: enemy.powerMeter, maxPowerMeter: enemy.maxPowerMeter, name: enemyConfig.name,
          comboCount: enemy.comboCount, counterWindow: enemy.counterWindow, dizzy: enemy.state === ActionState.DIZZY
        },
        time: gameState.current.timeRemaining,
        round
      }
    });
    window.dispatchEvent(event);

    requestRef.current = requestAnimationFrame(gameLoop);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      className="w-full h-full object-contain pixelated"
    />
  );
}

export default GameCanvas;
