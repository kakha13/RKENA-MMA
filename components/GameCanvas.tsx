
import React, { useRef, useEffect } from 'react';
import {
  ActionState, Fighter, InputState, Particle, Rect, CharacterConfig, Difficulty
} from '../types';
import {
  CANVAS_WIDTH, CANVAS_HEIGHT, GROUND_Y, FIGHTER_WIDTH, FIGHTER_HEIGHT,
  MOVE_SPEED, HIT_STUN_FRAMES, SLAMMED_FRAMES, PUNCH_FRAMES, KICK_FRAMES,
  TAKEDOWN_FRAMES, SPRAWL_FRAMES, BLOCK_COOLDOWN, SPECIAL_FRAMES,
  STAMINA_COST_PUNCH, STAMINA_COST_KICK, STAMINA_COST_TAKEDOWN, STAMINA_COST_SPECIAL, STAMINA_REGEN,
  POWER_METER_MAX, POWER_GAIN_PUNCH, POWER_GAIN_KICK, POWER_GAIN_TAKEDOWN, POWER_GAIN_ON_HIT,
  SCREEN_SHAKE_HEAVY, SCREEN_SHAKE_LIGHT, SCREEN_SHAKE_DECAY,
  COMBO_WINDOW_MS, DIFFICULTY_SETTINGS
} from '../constants';
import { drawFighter, drawBackground } from '../utils/sprites';
import {
  playHitSound, playBlockSound, playWhooshSound, playSlamSound,
  playTakedownSound, playKOSound, playSpecialSound, playRoundBellSound,
  playVictorySound, playCrowdCheer, playComboSound
} from '../utils/audio';

export interface GameCanvasProps {
  onRoundEnd: (winner: 'PLAYER' | 'ENEMY' | 'DRAW') => void;
  input: InputState;
  isMuted: boolean;
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
  general: ["OOOW!", "BIG SHOT!", "EXCELLENT!", "THIS IS INCREDIBLE!"]
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
  specialType: config.specialType
});

function GameCanvas({ onRoundEnd, input, isMuted, playerConfig, enemyConfig, difficulty, round }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const frameRef = useRef({ lastTime: 0, accumulator: 0 });

  const diffSettings = DIFFICULTY_SETTINGS[difficulty];

  const gameState = useRef({
    player: createFighter(150, true, playerConfig),
    enemy: createFighter(550, false, enemyConfig),
    particles: [] as Particle[],
    isRoundOver: false,
    timeRemaining: 180,
    lastTimeUpdate: Date.now(),
    aiMoveDirection: 0 as -1 | 0 | 1,
    aiMoveTimer: 0,
    commentatorShout: null as { text: string; timer: number; x: number } | null,
    introShoutPlayed: false,
    screenShake: 0,
    moveAnnouncement: null as { text: string; timer: number; color: string; x: number; y: number } | null,
    roundStarted: false
  });

  const pickRandom = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

  const checkCollision = (r1: Rect, r2: Rect) =>
    r1.x < r2.x + r2.w && r1.x + r1.w > r2.x && r1.y < r2.y + r2.h && r1.y + r1.h > r2.y;

  const spawnParticles = (x: number, y: number, count: number, type: 'blood' | 'spark' | 'sweat' | 'star' = 'blood') => {
    const colors: Record<typeof type, string[]> = {
      blood: ['#aa0000', '#cc0000', '#880000'],
      spark: ['#ffff00', '#ffaa00', '#ffffff'],
      sweat: ['#aaddff', '#88ccff'],
      star: ['#ffff88', '#ffcc00', '#ffffff']
    };
    for (let i = 0; i < count; i++) {
      const colorArr = colors[type];
      gameState.current.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * (type === 'star' ? 8 : 15),
        vy: (Math.random() - 0.5) * 15 - (type === 'star' ? 3 : 0),
        life: 20 + Math.random() * 20,
        maxLife: 40,
        color: colorArr[Math.floor(Math.random() * colorArr.length)],
        size: Math.random() * (type === 'star' ? 5 : 6) + (type === 'star' ? 4 : 3),
        type
      });
    }
  };

  const triggerCommentator = (text: string, forceIndex?: number) => {
    const idx = forceIndex !== undefined ? forceIndex : Math.floor(Math.random() * 3);
    gameState.current.commentatorShout = {
      text,
      timer: 90,
      x: idx / 3
    };
  };

  const showMoveAnnouncement = (text: string, color: string, x: number, y: number) => {
    gameState.current.moveAnnouncement = {
      text,
      timer: 50,
      color,
      x,
      y
    };
  };

  const applyScreenShake = (amount: number) => {
    gameState.current.screenShake = Math.max(gameState.current.screenShake, amount);
  };

  const updateFighter = (f: Fighter, controls: InputState, target: Fighter) => {
    if (f.state === ActionState.KO || f.state === ActionState.VICTORY_POSE) return;

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
        if (f.state === ActionState.HIT || f.state === ActionState.SPRAWL || f.state === ActionState.SLAMMED) {
          f.state = ActionState.IDLE;
          f.y = GROUND_Y - FIGHTER_HEIGHT;
        } else if (f.state === ActionState.PUNCH || f.state === ActionState.KICK ||
          f.state === ActionState.BLOCK || f.state === ActionState.TAKEDOWN ||
          f.state === ActionState.SPECIAL) {
          f.state = ActionState.IDLE;
          f.hitbox = null;
        }
      }
    }

    const isBusy = [
      ActionState.PUNCH, ActionState.KICK, ActionState.HIT, ActionState.BLOCK,
      ActionState.TAKEDOWN, ActionState.SPRAWL, ActionState.SLAMMED, ActionState.SPECIAL
    ].includes(f.state);

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

    // Movement
    if (!isBusy) {
      const speed = MOVE_SPEED * f.speed;
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
      if (f.stateTimer > TAKEDOWN_FRAMES * 0.3 && f.stateTimer <= TAKEDOWN_FRAMES * 0.8) {
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
      // Special move
      if (controls.special && f.powerMeter >= POWER_METER_MAX && f.stamina >= STAMINA_COST_SPECIAL) {
        f.state = ActionState.SPECIAL;
        f.stateTimer = SPECIAL_FRAMES;
        f.stamina -= STAMINA_COST_SPECIAL;
        f.powerMeter = 0;
        f.vx = 0;
        playSpecialSound(isMuted);
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
        playWhooshSound(isMuted);
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
        playWhooshSound(isMuted);
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
        playWhooshSound(isMuted);
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
    const controls: InputState = {
      left: false, right: false, punch: false, kick: false, block: false, takedown: false, special: false
    };
    if (ai.state === ActionState.KO || ai.state === ActionState.VICTORY_POSE) return controls;
    if (ai.stateTimer > 0) return controls;

    const dist = Math.abs(ai.x - player.x);
    const attackRange = ai.width * 1.2;
    const facingPlayer = (ai.direction === 1 && player.x > ai.x) || (ai.direction === -1 && player.x < ai.x);

    // Sprawl vs takedown
    if (player.state === ActionState.TAKEDOWN && dist < attackRange + 80 && facingPlayer) {
      if (Math.random() > (1 - diffSettings.aiSprawlChance)) {
        controls.block = true;
        return controls;
      }
    }

    // Use special move when power is full (AI uses it less often)
    if (ai.powerMeter >= POWER_METER_MAX && Math.random() < 0.3 && dist < attackRange * 1.5) {
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

    if (Math.random() > diffSettings.aiReactionChance) return controls;

    if (dist > attackRange + 20) {
      gameState.current.aiMoveTimer = 30 + Math.floor(Math.random() * 30);
      if (player.x > ai.x) {
        gameState.current.aiMoveDirection = 1;
        controls.right = true;
      } else {
        gameState.current.aiMoveDirection = -1;
        controls.left = true;
      }
      if (Math.random() < 0.03 && ai.stamina > 50) {
        controls.takedown = true;
      }
    } else if (dist < attackRange && facingPlayer) {
      gameState.current.aiMoveDirection = 0;
      gameState.current.aiMoveTimer = 0;

      const rand = Math.random();
      const freq = diffSettings.aiAttackFrequency;
      if (rand < 0.40 * freq && ai.stamina > 20) controls.punch = true;
      else if (rand < 0.70 * freq && ai.stamina > 20) controls.kick = true;
      else if (rand < 0.85 * freq && ai.stamina > 40 && dist > ai.width * 0.5) controls.takedown = true;
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
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.8;
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

    // Special move
    if (attacker.state === ActionState.SPECIAL) {
      if (defender.state === ActionState.BLOCK) {
        defender.stamina -= 25;
        defender.state = ActionState.HIT;
        defender.stateTimer = HIT_STUN_FRAMES * 0.5;
        playBlockSound(isMuted);
      } else {
        const dmg = attacker.specialDamage * diffSettings.damageMultiplier;
        defender.health -= dmg;
        attacker.damageDealt += dmg;
        defender.state = ActionState.SLAMMED;
        defender.stateTimer = SLAMMED_FRAMES;
        defender.hitbox = null;
        defender.vx = 0;
        defender.hitFlash = 8;
        spawnParticles(defender.x + defender.width / 2, defender.y + defender.height * 0.3, 20, 'star');
        spawnParticles(defender.x + defender.width / 2, defender.y + defender.height * 0.3, 15, 'blood');
        playSpecialSound(isMuted);
        playCrowdCheer(isMuted);
        applyScreenShake(SCREEN_SHAKE_HEAVY * 1.5);
        triggerCommentator(pickRandom(COMMENTATOR_LINES.special));
        showMoveAnnouncement(
          attacker.specialName,
          '#f59e0b',
          attacker.x + attacker.width / 2,
          attacker.y - 20
        );
      }
      attacker.hitbox = null;
      return;
    }

    // Takedown
    if (attacker.state === ActionState.TAKEDOWN) {
      if (defender.state === ActionState.TAKEDOWN) {
        attacker.stamina -= 10;
        attacker.hitbox = null;
        playBlockSound(isMuted);
        defender.stamina -= 10;
        defender.state = ActionState.IDLE;
        defender.stateTimer = 15;
        defender.hitbox = null;
        defender.x -= defender.direction * 20;
        return;
      } else if (defender.state === ActionState.BLOCK) {
        attacker.stamina -= 15;
        attacker.hitbox = null;
        attacker.x -= attacker.direction * 20;
        playBlockSound(isMuted);
        defender.state = ActionState.IDLE;
        defender.stateTimer = 15;
        defender.hitbox = null;
        triggerCommentator(pickRandom(COMMENTATOR_LINES.block));
        return;
      } else {
        const dmg = attacker.takedownDamage * diffSettings.damageMultiplier;
        defender.health -= dmg;
        attacker.damageDealt += dmg;
        attacker.powerMeter = Math.min(attacker.maxPowerMeter, attacker.powerMeter + POWER_GAIN_TAKEDOWN);
        defender.powerMeter = Math.min(defender.maxPowerMeter, defender.powerMeter + POWER_GAIN_ON_HIT);
        defender.state = ActionState.SLAMMED;
        defender.stateTimer = SLAMMED_FRAMES;
        defender.hitbox = null;
        defender.vx = 0;
        defender.hitFlash = 8;
        defender.direction = defender.x < attacker.x ? 1 : -1;
        spawnParticles(defender.x + defender.width / 2, defender.y + defender.height * 0.8, 15, 'blood');
        spawnParticles(defender.x + defender.width / 2, defender.y + defender.height * 0.5, 8, 'sweat');
        playTakedownSound(isMuted);
        setTimeout(() => playSlamSound(isMuted), 300);
        applyScreenShake(SCREEN_SHAKE_HEAVY);
        triggerCommentator(pickRandom(COMMENTATOR_LINES.takedown));
        showMoveAnnouncement('TAKEDOWN!', '#ef4444', attacker.x + attacker.width / 2, attacker.y - 20);
        attacker.hitbox = null;
        return;
      }
    }

    // Punch / Kick
    const damage = (attacker.state === ActionState.PUNCH ? attacker.punchDamage : attacker.kickDamage) * diffSettings.damageMultiplier;

    if (defender.state === ActionState.BLOCK) {
      defender.stamina -= damage * 2;
      spawnParticles(defender.x + defender.width / 2, defender.y + defender.height * 0.2, 3, 'sweat');
      playBlockSound(isMuted);
      triggerCommentator(pickRandom(COMMENTATOR_LINES.block));
    } else {
      defender.health -= damage;
      attacker.damageDealt += damage;
      attacker.powerMeter = Math.min(
        attacker.maxPowerMeter,
        attacker.powerMeter + (attacker.state === ActionState.PUNCH ? POWER_GAIN_PUNCH : POWER_GAIN_KICK)
      );
      defender.powerMeter = Math.min(defender.maxPowerMeter, defender.powerMeter + POWER_GAIN_ON_HIT);

      // Combo detection
      const timeSinceLastHit = now - attacker.lastHitTime;
      if (timeSinceLastHit < COMBO_WINDOW_MS && attacker.lastHitTime > 0) {
        attacker.comboCount++;
        if (attacker.comboCount >= 2) {
          playComboSound(isMuted, attacker.comboCount);
          if (attacker.comboCount >= 3) {
            triggerCommentator(pickRandom(COMMENTATOR_LINES.combo));
            showMoveAnnouncement(`${attacker.comboCount}x COMBO!`, '#f59e0b', attacker.x + attacker.width / 2, attacker.y - 20);
          }
        }
      } else {
        attacker.comboCount = 1;
      }
      attacker.lastHitTime = now;

      defender.state = ActionState.HIT;
      defender.stateTimer = HIT_STUN_FRAMES;
      defender.hitbox = null;
      defender.hitFlash = 6;

      spawnParticles(defender.x + defender.width / 2, defender.y + defender.height * 0.2, 12, 'blood');
      spawnParticles(defender.x + defender.width / 2, defender.y + defender.height * 0.2, 5, 'sweat');

      playHitSound(isMuted, attacker.state === ActionState.KICK);
      applyScreenShake(attacker.state === ActionState.KICK ? SCREEN_SHAKE_LIGHT * 1.5 : SCREEN_SHAKE_LIGHT);

      // Low health commentary
      if (defender.health < defender.maxHealth * 0.25) {
        triggerCommentator(pickRandom(COMMENTATOR_LINES.danger));
      } else if (damage > 5 && Math.random() < 0.3) {
        triggerCommentator(pickRandom(COMMENTATOR_LINES.general));
      }

      const moveLabel = attacker.state === ActionState.PUNCH ? 'PUNCH!' : 'KICK!';
      const moveColor = attacker.state === ActionState.PUNCH ? '#38bdf8' : '#f97316';
      if (Math.random() < 0.4) {
        showMoveAnnouncement(moveLabel, moveColor, defender.x + defender.width / 2, defender.y - 10);
      }
    }
    attacker.hitbox = null;
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
    frameRef.current.accumulator += deltaTime;

    if (frameRef.current.accumulator > 200) frameRef.current.accumulator = 200;

    const FIXED_TIME_STEP = 1000 / 60;

    if (!gameState.current.introShoutPlayed) {
      gameState.current.introShoutPlayed = true;
      setTimeout(() => {
        playRoundBellSound(isMuted);
        triggerCommentator(pickRandom(COMMENTATOR_LINES.start), 2);
      }, 500);
    }

    while (frameRef.current.accumulator >= FIXED_TIME_STEP) {
      const { player, enemy } = gameState.current;

      updateFighter(player, input, enemy);
      const aiInput = updateAI(enemy, player);
      updateFighter(enemy, aiInput, player);

      checkCombatCollisions(player, enemy);
      checkCombatCollisions(enemy, player);

      updateParticles();
      updateCommentatorShout();

      // Screen shake decay
      if (gameState.current.screenShake > 0) {
        gameState.current.screenShake *= SCREEN_SHAKE_DECAY;
        if (gameState.current.screenShake < 0.5) gameState.current.screenShake = 0;
      }

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
          playKOSound(isMuted);
          enemy.state = ActionState.VICTORY_POSE;
          setTimeout(() => onRoundEnd('ENEMY'), 3000);
        }
      }
      if (enemy.health <= 0 && enemy.state !== ActionState.KO) {
        enemy.state = ActionState.KO;
        enemy.health = 0;
        if (!gameState.current.isRoundOver) {
          gameState.current.isRoundOver = true;
          playKOSound(isMuted);
          playVictorySound(isMuted);
          player.state = ActionState.VICTORY_POSE;
          setTimeout(() => onRoundEnd('PLAYER'), 3000);
        }
      }

      // Timer expires → judge decision
      if (gameState.current.timeRemaining <= 0 && !gameState.current.isRoundOver) {
        gameState.current.isRoundOver = true;
        playRoundBellSound(isMuted);
        const winner = player.damageDealt > enemy.damageDealt ? 'PLAYER' :
          enemy.damageDealt > player.damageDealt ? 'ENEMY' : 'DRAW';
        setTimeout(() => onRoundEnd(winner), 2000);
      }

      frameRef.current.accumulator -= FIXED_TIME_STEP;
    }

    // Apply screen shake
    ctx.save();
    if (gameState.current.screenShake > 0) {
      const sx = (Math.random() - 0.5) * gameState.current.screenShake;
      const sy = (Math.random() - 0.5) * gameState.current.screenShake;
      ctx.translate(sx, sy);
    }

    ctx.clearRect(-20, -20, CANVAS_WIDTH + 40, CANVAS_HEIGHT + 40);
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

    // Dispatch HUD event
    const event = new CustomEvent('game-update', {
      detail: {
        p1: { health: player.health, maxHealth: player.maxHealth, stamina: player.stamina, maxStamina: player.maxStamina, powerMeter: player.powerMeter, maxPowerMeter: player.maxPowerMeter, name: playerConfig.name, comboCount: player.comboCount },
        p2: { health: enemy.health, maxHealth: enemy.maxHealth, stamina: enemy.stamina, maxStamina: enemy.maxStamina, powerMeter: enemy.powerMeter, maxPowerMeter: enemy.maxPowerMeter, name: enemyConfig.name, comboCount: enemy.comboCount },
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
  }, [input, onRoundEnd]);

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
