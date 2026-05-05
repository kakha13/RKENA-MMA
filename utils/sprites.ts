
import { Fighter, ActionState } from '../types';
import {
  PUNCH_FRAMES, KICK_FRAMES, TAKEDOWN_FRAMES, SLAMMED_FRAMES, HIT_STUN_FRAMES, SPECIAL_FRAMES
} from '../constants';

const drawBorjgali = (ctx: CanvasRenderingContext2D, bx: number, by: number, bs: number, color: string = '#ffffff') => {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(bx, by, bs, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let i = 0; i < 7; i++) {
    const angle = (i * Math.PI * 2) / 7;
    const armLen = bs * 3;
    const cx2 = bx + Math.cos(angle) * armLen;
    const cy2 = by + Math.sin(angle) * armLen;
    const tx = bx + Math.cos(angle + 0.5) * (armLen + 3);
    const ty = by + Math.sin(angle + 0.5) * (armLen + 3);
    ctx.moveTo(bx, by);
    ctx.quadraticCurveTo(cx2, cy2, tx, ty);
  }
  ctx.stroke();
};

const drawHead = (ctx: CanvasRenderingContext2D, fighter: Fighter, headX: number, headBaseY: number, headSize: number, isKO: boolean) => {
  const { color, characterId, state } = fighter;

  // Base head
  ctx.fillStyle = color;
  ctx.fillRect(headX, headBaseY, headSize, headSize);

  if (characterId === 'merab') {
    const hairColor = '#1a1a1a';
    const beardColor = '#6d4c41';
    ctx.fillStyle = beardColor;
    ctx.fillRect(headX, headBaseY + headSize * 0.55, headSize, headSize * 0.45);
    ctx.fillRect(headX, headBaseY + headSize * 0.3, headSize * 0.25, headSize * 0.4);
    ctx.fillStyle = hairColor;
    ctx.fillRect(headX, headBaseY - 5, headSize, 12);
    ctx.fillRect(headX, headBaseY, headSize * 0.2, headSize * 0.5);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(headX + headSize * 0.65, headBaseY + headSize * 0.35, headSize * 0.25, headSize * 0.1);
    ctx.fillStyle = '#3e2723';
    ctx.fillRect(headX + headSize * 0.4, headBaseY + headSize * 0.75, headSize * 0.3, headSize * 0.05);
  } else if (characterId === 'khabib') {
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(headX, headBaseY - 5, headSize, 14);
    ctx.fillRect(headX, headBaseY, headSize * 0.2, headSize * 0.5);
    ctx.fillStyle = '#2d1b00';
    ctx.fillRect(headX, headBaseY + headSize * 0.6, headSize, headSize * 0.4);
    ctx.fillRect(headX, headBaseY + headSize * 0.4, headSize * 0.3, headSize * 0.3);
    // Khabib's beard is thicker/shorter
    ctx.fillStyle = '#1a1000';
    ctx.fillRect(headX + headSize * 0.1, headBaseY + headSize * 0.55, headSize * 0.8, headSize * 0.35);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(headX + headSize * 0.65, headBaseY + headSize * 0.35, headSize * 0.25, headSize * 0.1);
  } else if (characterId === 'gsp') {
    ctx.fillStyle = '#1a1000';
    ctx.fillRect(headX, headBaseY - 3, headSize, 10);
    ctx.fillRect(headX, headBaseY, headSize * 0.15, headSize * 0.4);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(headX + headSize * 0.65, headBaseY + headSize * 0.35, headSize * 0.25, headSize * 0.1);
    // Stubble
    ctx.fillStyle = 'rgba(100,70,30,0.4)';
    ctx.fillRect(headX + headSize * 0.1, headBaseY + headSize * 0.6, headSize * 0.8, headSize * 0.35);
  } else if (characterId === 'jones') {
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(headX, headBaseY - 3, headSize, 10);
    ctx.fillRect(headX, headBaseY, headSize * 0.15, headSize * 0.4);
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(headX + headSize * 0.6, headBaseY + headSize * 0.7, headSize * 0.4, headSize * 0.3);
    ctx.fillStyle = 'rgba(10,10,10,0.5)';
    ctx.fillRect(headX, headBaseY + headSize * 0.8, headSize, headSize * 0.2);
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(headX + headSize * 0.65, headBaseY + headSize * 0.35, headSize * 0.25, headSize * 0.1);
    ctx.fillStyle = '#2d1b15';
    ctx.fillRect(headX + headSize * 0.4, headBaseY + headSize * 0.8, headSize * 0.2, headSize * 0.05);
  } else if (characterId === 'adesanya') {
    ctx.fillStyle = '#0f0f0f';
    ctx.fillRect(headX, headBaseY - 3, headSize, 8);
    // Dreads/twists
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = '#111';
      ctx.fillRect(headX + i * (headSize * 0.25) - 2, headBaseY - 14, 6, 16);
    }
    ctx.fillStyle = 'rgba(20,10,10,0.5)';
    ctx.fillRect(headX + headSize * 0.05, headBaseY + headSize * 0.65, headSize * 0.9, headSize * 0.25);
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(headX + headSize * 0.65, headBaseY + headSize * 0.35, headSize * 0.25, headSize * 0.1);
  } else if (characterId === 'ngannou') {
    ctx.fillStyle = '#0f0f0f';
    ctx.fillRect(headX, headBaseY - 5, headSize, 8);
    // Very short hair/bald look
    ctx.fillStyle = 'rgba(20, 10, 5, 0.6)';
    ctx.fillRect(headX, headBaseY - 5, headSize, 16);
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(headX + headSize * 0.65, headBaseY + headSize * 0.35, headSize * 0.25, headSize * 0.1);
    // Big jaw
    ctx.fillStyle = fighter.color;
    ctx.fillRect(headX, headBaseY + headSize * 0.5, headSize, headSize * 0.5);
    ctx.fillStyle = 'rgba(10,5,0,0.3)';
    ctx.fillRect(headX, headBaseY + headSize * 0.7, headSize, headSize * 0.3);
  }

  if (isKO) {
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(headX + headSize * 0.15, headBaseY + headSize * 0.3);
    ctx.lineTo(headX + headSize * 0.35, headBaseY + headSize * 0.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(headX + headSize * 0.35, headBaseY + headSize * 0.3);
    ctx.lineTo(headX + headSize * 0.15, headBaseY + headSize * 0.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(headX + headSize * 0.65, headBaseY + headSize * 0.3);
    ctx.lineTo(headX + headSize * 0.85, headBaseY + headSize * 0.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(headX + headSize * 0.85, headBaseY + headSize * 0.3);
    ctx.lineTo(headX + headSize * 0.65, headBaseY + headSize * 0.5);
    ctx.stroke();
    ctx.fillStyle = '#ff9999';
    ctx.strokeStyle = '#cc0000';
    ctx.lineWidth = 1;
    ctx.fillRect(headX + headSize * 0.4, headBaseY + headSize * 0.85, headSize * 0.2, headSize * 0.25);
    ctx.strokeRect(headX + headSize * 0.4, headBaseY + headSize * 0.85, headSize * 0.2, headSize * 0.25);
  } else if (state === ActionState.VICTORY_POSE) {
    // Big smile
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(headX + headSize * 0.5, headBaseY + headSize * 0.65, headSize * 0.2, 0, Math.PI);
    ctx.stroke();
  }
};

const drawTorsoDetails = (ctx: CanvasRenderingContext2D, fighter: Fighter, torsoWidth: number, bodyY: number, h: number) => {
  const { characterId, isPlayer, shortsColor } = fighter;

  // Shorts
  ctx.fillStyle = shortsColor;
  ctx.fillRect(-torsoWidth / 2 - 2, bodyY + h * 0.45, torsoWidth + 4, h * 0.3);

  if (characterId === 'merab') {
    drawBorjgali(ctx, -torsoWidth * 0.3, bodyY + h * 0.55, 3);
    ctx.strokeStyle = '#b00219';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-torsoWidth / 2, bodyY + h * 0.47);
    ctx.lineTo(torsoWidth / 2, bodyY + h * 0.47);
    ctx.stroke();
  } else if (characterId === 'khabib') {
    // Russian Eagle-inspired stripe
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillRect(-torsoWidth * 0.4, bodyY + h * 0.47, torsoWidth * 0.8, 4);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(-torsoWidth * 0.4, bodyY + h * 0.47 + 5, torsoWidth * 0.8, 3);
    // Khabib's torso is more muscular - add chest definition
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    ctx.fillRect(0, bodyY + h * 0.22, 3, h * 0.2);
  } else if (characterId === 'gsp') {
    ctx.fillStyle = '#10b981';
    ctx.fillRect(-torsoWidth * 0.45, bodyY + h * 0.47, torsoWidth * 0.9, 3);
    ctx.fillRect(-torsoWidth * 0.45, bodyY + h * 0.47 + 5, torsoWidth * 0.9, 2);
    // Maple leaf hint
    ctx.fillStyle = 'rgba(239,68,68,0.6)';
    ctx.beginPath();
    ctx.arc(-torsoWidth * 0.1, bodyY + h * 0.54, 5, 0, Math.PI * 2);
    ctx.fill();
  } else if (characterId === 'jones') {
    // Tattoo lines
    ctx.save();
    ctx.translate(torsoWidth * 0.1, bodyY + h * 0.35);
    ctx.rotate(-0.1);
    ctx.fillStyle = 'rgba(20, 10, 10, 0.7)';
    ctx.fillRect(-25, -5, 50, 4);
    ctx.fillRect(-15, 2, 30, 3);
    ctx.fillRect(-20, 8, 40, 3);
    ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fillRect(-10, bodyY + h * 0.5, 20, 8);
  } else if (characterId === 'adesanya') {
    // Stylized tattoo pattern
    ctx.fillStyle = 'rgba(100,60,255,0.5)';
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
      ctx.fillRect(-torsoWidth * 0.3 + i * 14, bodyY + h * 0.25, 6, 30);
    }
    // Shorts stripe
    ctx.fillStyle = '#8b5cf6';
    ctx.fillRect(-torsoWidth * 0.45, bodyY + h * 0.47, torsoWidth * 0.9, 4);
  } else if (characterId === 'ngannou') {
    // Muscular definition
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.fillRect(-torsoWidth * 0.15, bodyY + h * 0.22, 8, h * 0.2);
    ctx.fillRect(torsoWidth * 0.05, bodyY + h * 0.22, 8, h * 0.2);
    // Orange stripe on shorts
    ctx.fillStyle = '#f97316';
    ctx.fillRect(-torsoWidth * 0.45, bodyY + h * 0.47, torsoWidth * 0.9, 5);
  }
};

export const drawFighter = (ctx: CanvasRenderingContext2D, fighter: Fighter) => {
  const { x, y, width, height, color, shortsColor, accentColor, direction, state, stateTimer, isPlayer, hitFlash } = fighter;

  ctx.save();
  ctx.translate(x + width / 2, y + height);

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  const shadowScale = state === ActionState.SLAMMED || state === ActionState.TAKEDOWN ? 0.8 : 1;
  ctx.ellipse(0, -5, width * 0.6 * shadowScale, height * 0.05, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.scale(direction, 1);

  if (state === ActionState.HIT) {
    ctx.translate((Math.random() - 0.5) * 8, 0);
  }

  const w = width;
  const h = height;
  const headSize = w * 0.55;
  const limbWidth = w * 0.32;
  const torsoWidth = w * 0.9;

  const time = Date.now();
  let bodyY = -h;
  let bodyLean = 0;

  let frontArmRot = -0.5;
  let backArmRot = 0.5;
  let frontLegRot = 0;
  let backLegRot = 0;
  let frontArmExt = 0;
  let headOffsetY = 0;
  let headOffsetX = 0;

  if (state === ActionState.IDLE) {
    const bounceSpeed = 600;
    const bounce = Math.sin(time / bounceSpeed);
    bodyY += bounce * (h * 0.015);
    bodyLean = 0.05 + Math.sin(time / 800) * 0.02;
    frontArmRot = -0.5 + bounce * 0.05;
    backArmRot = 0.8 + bounce * 0.05;
  } else if (state === ActionState.WALK) {
    const walkSpeed = 250;
    const walkCycle = time / walkSpeed;
    const strideSize = 0.5;
    frontLegRot = Math.sin(walkCycle) * strideSize;
    backLegRot = Math.sin(walkCycle + Math.PI) * strideSize;
    bodyY += Math.abs(Math.sin(walkCycle)) * (h * 0.02);
    bodyLean = 0.08;
    frontArmRot = -0.5 + Math.sin(walkCycle + Math.PI) * 0.35;
    backArmRot = 0.5 + Math.sin(walkCycle) * 0.35;
  } else if (state === ActionState.BLOCK) {
    const breath = Math.sin(time / 250) * 0.02;
    bodyY += h * 0.05;
    bodyLean = -0.2 + breath;
    frontArmRot = -2.2 + breath;
    backArmRot = -2.4 + breath;
    headOffsetY = 2;
  } else if (state === ActionState.PUNCH) {
    const progress = 1 - stateTimer / PUNCH_FRAMES;
    if (progress < 0.2) {
      frontArmRot = -1.2; bodyLean = -0.15; backArmRot = 0.6;
    } else if (progress < 0.5) {
      frontArmRot = -1.9; frontArmExt = w * 0.55; bodyLean = 0.2; backArmRot = 0.9;
    } else {
      frontArmRot = -1.4; frontArmExt = w * 0.1; bodyLean = 0.1; backArmRot = 0.7;
    }
  } else if (state === ActionState.KICK) {
    const progress = 1 - stateTimer / KICK_FRAMES;
    bodyLean = -0.4;
    if (progress < 0.3) {
      frontLegRot = -1.0; backLegRot = 0.2;
    } else if (progress < 0.6) {
      frontLegRot = -1.9;
    } else {
      frontLegRot = 0;
    }
    frontArmRot = 0.5; backArmRot = -1.5;
  } else if (state === ActionState.HIT) {
    const impact = stateTimer / HIT_STUN_FRAMES;
    bodyLean = -0.4 * impact;
    headOffsetX = -5 * impact;
    headOffsetY = 2 * impact;
    frontArmRot = -1.0 - impact * 0.5;
    backArmRot = -0.5 - impact * 0.5;
  } else if (state === ActionState.TAKEDOWN) {
    const t = stateTimer;
    if (t > TAKEDOWN_FRAMES * 0.8) {
      bodyLean = 0.4; bodyY = -h * 0.6; frontArmRot = -1.0;
    } else if (t > TAKEDOWN_FRAMES * 0.3) {
      bodyLean = 1.3; bodyY = -h * 0.4;
      frontArmRot = -1.8; backArmRot = -1.8; frontArmExt = w * 0.5;
      backLegRot = -1.0; frontLegRot = -1.5;
    } else {
      bodyLean = 0.6; bodyY = -h * 0.7;
    }
  } else if (state === ActionState.SPECIAL) {
    const progress = 1 - stateTimer / SPECIAL_FRAMES;
    if (progress < 0.15) {
      // Wind-up - big lean back
      bodyLean = -0.5; frontArmRot = 0.8; backArmRot = 1.2; bodyY = -h * 0.95;
    } else if (progress < 0.45) {
      // Explosive forward lunge
      bodyLean = 0.6; frontArmRot = -2.2; frontArmExt = w * 0.7; backArmRot = 1.0;
      bodyY = -h * 0.85; frontLegRot = -0.3;
    } else if (progress < 0.65) {
      // Impact hold
      bodyLean = 0.4; frontArmRot = -1.8; frontArmExt = w * 0.4;
    } else {
      // Recovery
      bodyLean = 0.1; frontArmRot = -0.8; frontArmExt = 0;
    }
  } else if (state === ActionState.SPRAWL) {
    bodyLean = 1.4; bodyY = -h * 0.25;
    frontLegRot = 1.5; backLegRot = 1.5;
    frontArmRot = -0.5; backArmRot = -0.5;
  } else if (state === ActionState.SLAMMED) {
    const t = stateTimer;
    const max = SLAMMED_FRAMES;
    const progress = 1 - t / max;
    if (progress < 0.2) {
      bodyLean = -0.5 - progress * 4; bodyY = -h;
    } else if (progress < 0.3) {
      bodyLean = -1.6; bodyY = -h * 0.9;
      frontArmRot = -2.5; backArmRot = -2.5;
      frontLegRot = -0.5; backLegRot = -0.5;
    } else {
      bodyLean = -1.57; bodyY = -h;
      frontArmRot = -2.8; backArmRot = -2.8;
      frontLegRot = 0.1; backLegRot = 0.1;
      headOffsetY = 5;
    }
  } else if (state === ActionState.KO) {
    bodyLean = -1.57; bodyY = -h * 0.12;
    frontArmRot = -2.8; backArmRot = -2.8;
    frontLegRot = 0.1; backLegRot = 0.1;
    headOffsetY = 5;
  } else if (state === ActionState.VICTORY_POSE) {
    const wave = Math.sin(time / 300);
    bodyLean = 0.05;
    frontArmRot = -2.5 + wave * 0.3;
    backArmRot = -0.5 + wave * 0.2;
    bodyY = -h + Math.abs(Math.sin(time / 400)) * 8;
  }

  ctx.rotate(bodyLean);

  const shoulderY = bodyY + h * 0.25;
  const hipY_back = bodyY + h * 0.5;
  const hipY_front = bodyY + h * 0.45;

  // Back Arm
  ctx.save();
  ctx.translate(torsoWidth * 0.2, shoulderY);
  ctx.rotate(backArmRot);
  ctx.fillStyle = color;
  ctx.fillRect(-limbWidth / 2, 0, limbWidth, h * 0.35);
  const gloveY = h * 0.35;
  const gloveH = limbWidth + 4;
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(-limbWidth / 2 - 2, gloveY, limbWidth + 4, gloveH);
  ctx.fillStyle = accentColor;
  ctx.fillRect(-limbWidth / 2 - 2, gloveY + gloveH * 0.3, limbWidth + 4, 4);
  ctx.restore();

  // Back Leg
  ctx.save();
  ctx.translate(-torsoWidth * 0.25, hipY_back);
  ctx.rotate(backLegRot);
  ctx.fillStyle = color;
  ctx.fillRect(-limbWidth / 2, 0, limbWidth, h * 0.5);
  ctx.fillStyle = shortsColor;
  ctx.fillRect(-limbWidth / 2 - 2, -5, limbWidth + 4, h * 0.25);
  if (fighter.characterId === 'merab') {
    drawBorjgali(ctx, 0, h * 0.12, 3);
  } else if (fighter.characterId === 'khabib') {
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(-limbWidth / 2, h * 0.22, limbWidth, 2);
  }
  ctx.restore();

  // Torso
  ctx.fillStyle = color;
  ctx.fillRect(-torsoWidth / 2, bodyY + h * 0.2, torsoWidth, h * 0.45);

  drawTorsoDetails(ctx, fighter, torsoWidth, bodyY, h);

  // Front Leg
  ctx.save();
  ctx.translate(torsoWidth * 0.25, hipY_front);
  ctx.rotate(frontLegRot);
  ctx.fillStyle = color;
  ctx.fillRect(-limbWidth / 2, 0, limbWidth, h * 0.55);
  ctx.fillStyle = shortsColor;
  ctx.fillRect(-limbWidth / 2 - 2, -5, limbWidth + 4, h * 0.25);
  if (['jones', 'adesanya', 'ngannou'].includes(fighter.characterId)) {
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillRect(-limbWidth / 2 - 2, h * 0.22, limbWidth + 4, 3);
  }
  if (state === ActionState.KICK) {
    ctx.fillStyle = color;
    ctx.fillRect(-limbWidth / 2, h * 0.55, limbWidth * 2, limbWidth);
  }
  ctx.restore();

  // Front Arm
  const frontArmLen = h * 0.35 + frontArmExt;
  ctx.save();
  ctx.translate(-torsoWidth * 0.2, shoulderY);
  ctx.rotate(frontArmRot);
  ctx.fillStyle = color;
  ctx.fillRect(-limbWidth / 2, 0, limbWidth, frontArmLen);
  const frontGloveH = limbWidth + 6;
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(-limbWidth / 2 - 2, frontArmLen, limbWidth + 4, frontGloveH);
  ctx.fillStyle = accentColor;
  ctx.fillRect(-limbWidth / 2 - 2, frontArmLen + frontGloveH * 0.3, limbWidth + 4, 4);
  ctx.restore();

  // Head
  const neckH = h * 0.10;
  ctx.fillStyle = color;
  ctx.fillRect(-headSize * 0.3 + headOffsetX, bodyY + h * 0.15 + headOffsetY, headSize * 0.6, neckH);
  const headX = -headSize / 2 + headOffsetX;
  const headBaseY = bodyY + h * 0.15 - headSize + headOffsetY;
  drawHead(ctx, fighter, headX, headBaseY, headSize, state === ActionState.KO);

  // Hit flash overlay
  if (hitFlash > 0) {
    const alpha = (hitFlash / 8) * 0.7;
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.fillRect(-torsoWidth / 2 - 5, bodyY, torsoWidth + 10, h);
  }

  ctx.restore();
};

const drawCommentators = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  const time = Date.now();
  const centerX = width / 2;
  const tableY = height - 130;
  const scale = 0.8;

  ctx.save();
  ctx.translate(centerX, tableY);
  ctx.scale(scale, scale);

  ctx.fillStyle = '#111';
  ctx.fillRect(-160, 0, 320, 40);
  ctx.fillStyle = '#262626';
  ctx.fillRect(-160, 0, 320, 4);

  const drawGuy = (x: number, type: 1 | 2 | 3) => {
    ctx.save();
    ctx.translate(x, 0);
    const interval = 2000 + type * 500;
    const talkPhase = time % interval < 800;
    const isTalking = talkPhase && Math.floor(time / 100) % 2 === 0;
    const mouthOpen = isTalking ? 5 : 1;
    const headBob = isTalking ? Math.sin(time / 80) * 1.5 : 0;
    const armWave = type === 3 && talkPhase ? Math.sin(time / 150) * 3 : 0;

    ctx.fillStyle = type === 1 ? '#202020' : type === 3 ? '#1a237e' : '#171717';
    ctx.fillRect(-30, -55, 60, 55);
    if (type === 2) {
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(-12, -35, 24, 14);
      ctx.fillStyle = 'black';
      ctx.beginPath();
      ctx.arc(0, -28, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    if (type === 1) {
      ctx.fillStyle = '#444';
      ctx.fillRect(-10, -40, 20, 20);
    }

    ctx.translate(0, -55 + headBob);
    ctx.fillStyle = '#e5bfa1';
    ctx.fillRect(-18, -35, 36, 35);

    if (type === 1) {
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(-20, -40, 40, 10);
      ctx.fillRect(-20, -40, 4, 25);
      ctx.fillStyle = 'rgba(28, 25, 23, 0.3)';
      ctx.fillRect(-18, -12, 36, 12);
    } else if (type === 2) {
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-18, -12, 36, 14);
      ctx.fillRect(-19, -12, 4, -15);
      ctx.fillStyle = '#292524';
      ctx.fillRect(-19, -38, 38, 8);
    } else {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-19, -38, 38, 10);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-18, -10, 36, 12);
      ctx.fillRect(-19, -10, 4, -15);
    }

    ctx.fillStyle = '#000';
    ctx.fillRect(-10, -22, 5, 5);
    ctx.fillRect(5, -22, 5, 5);
    ctx.fillStyle = '#4a2c2a';
    ctx.fillRect(-6, -8, 12, mouthOpen);

    ctx.restore();
    if (type === 3) {
      ctx.fillStyle = '#e5bfa1';
      ctx.save();
      ctx.translate(15, -45 + headBob + armWave);
      ctx.rotate(-0.2);
      ctx.fillRect(0, 0, 12, 20);
      ctx.restore();
    }
  };

  drawGuy(-110, 2);
  drawGuy(0, 1);
  drawGuy(110, 3);
  ctx.restore();
};

export const drawBackground = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  const centerX = width / 2;
  const wallBaseY = height - 100;
  const fenceHeight = 220;
  const fenceTopY = wallBaseY - fenceHeight;

  const gradient = ctx.createLinearGradient(0, 0, 0, wallBaseY);
  gradient.addColorStop(0, '#0a0a0a');
  gradient.addColorStop(0.5, '#151515');
  gradient.addColorStop(1, '#050505');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, wallBaseY);

  for (let i = 0; i < 20; i++) {
    ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.04})`;
    const lx = Math.random() * width;
    const ly = Math.random() * (wallBaseY - 50);
    ctx.beginPath();
    ctx.arc(lx, ly, Math.random() * 40 + 10, 0, Math.PI * 2);
    ctx.fill();
  }

  drawCommentators(ctx, width, height);

  const octPoints = {
    backLeft: { x: centerX - 200, y: wallBaseY, topY: fenceTopY },
    backRight: { x: centerX + 200, y: wallBaseY, topY: fenceTopY },
    cornerLeft: { x: centerX - 350, y: wallBaseY + 30, topY: fenceTopY - 30 },
    cornerRight: { x: centerX + 350, y: wallBaseY + 30, topY: fenceTopY - 30 },
    sideLeft: { x: -80, y: wallBaseY + 80, topY: fenceTopY - 80 },
    sideRight: { x: width + 80, y: wallBaseY + 80, topY: fenceTopY - 80 },
    frontLeft: { x: -80, y: height + 50 },
    frontRight: { x: width + 80, y: height + 50 }
  };

  const drawFenceSegment = (x1: number, y1_bot: number, y1_top: number, x2: number, y2_bot: number, y2_top: number) => {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x1, y1_bot); ctx.lineTo(x1, y1_top); ctx.lineTo(x2, y2_top); ctx.lineTo(x2, y2_bot);
    ctx.closePath();
    ctx.fillStyle = 'rgba(10, 10, 10, 0.5)';
    ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 2;
    const meshSize = 16;
    ctx.beginPath();
    for (let ix = Math.min(x1, x2) - 100; ix < Math.max(x1, x2) + 100; ix += meshSize) {
      ctx.moveTo(ix, 0); ctx.lineTo(ix + 80, height);
      ctx.moveTo(ix, 0); ctx.lineTo(ix - 80, height);
    }
    ctx.stroke();
    ctx.restore();
    ctx.lineWidth = 16; ctx.strokeStyle = '#0a0a0a'; ctx.lineCap = 'butt';
    ctx.beginPath(); ctx.moveTo(x1, y1_top); ctx.lineTo(x2, y2_top); ctx.stroke();
    ctx.lineWidth = 2; ctx.strokeStyle = '#333';
    ctx.beginPath(); ctx.moveTo(x1, y1_top - 4); ctx.lineTo(x2, y2_top - 4); ctx.stroke();
    ctx.lineWidth = 16; ctx.strokeStyle = '#0a0a0a';
    ctx.beginPath(); ctx.moveTo(x1, y1_bot); ctx.lineTo(x2, y2_bot); ctx.stroke();
    ctx.restore();
  };

  drawFenceSegment(octPoints.backLeft.x, octPoints.backLeft.y, octPoints.backLeft.topY,
    octPoints.backRight.x, octPoints.backRight.y, octPoints.backRight.topY);
  drawFenceSegment(octPoints.cornerLeft.x, octPoints.cornerLeft.y, octPoints.cornerLeft.topY,
    octPoints.backLeft.x, octPoints.backLeft.y, octPoints.backLeft.topY);
  drawFenceSegment(octPoints.backRight.x, octPoints.backRight.y, octPoints.backRight.topY,
    octPoints.cornerRight.x, octPoints.cornerRight.y, octPoints.cornerRight.topY);
  drawFenceSegment(octPoints.sideLeft.x, octPoints.sideLeft.y, octPoints.sideLeft.topY,
    octPoints.cornerLeft.x, octPoints.cornerLeft.y, octPoints.cornerLeft.topY);
  drawFenceSegment(octPoints.cornerRight.x, octPoints.cornerRight.y, octPoints.cornerRight.topY,
    octPoints.sideRight.x, octPoints.sideRight.y, octPoints.sideRight.topY);

  const drawPost = (x: number, y_base: number, h: number) => {
    ctx.fillStyle = '#050505';
    ctx.fillRect(x - 10, y_base - h - 10, 20, h + 20);
    ctx.fillStyle = '#222';
    ctx.fillRect(x - 6, y_base - h - 10, 5, h + 20);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(x - 10, y_base - h + 30, 20, 12);
  };
  drawPost(octPoints.backLeft.x, octPoints.backLeft.y, fenceHeight);
  drawPost(octPoints.backRight.x, octPoints.backRight.y, fenceHeight);
  drawPost(octPoints.cornerLeft.x, octPoints.cornerLeft.y, fenceHeight + 60);
  drawPost(octPoints.cornerRight.x, octPoints.cornerRight.y, fenceHeight + 60);
  drawPost(octPoints.sideLeft.x, octPoints.sideLeft.y, fenceHeight + 160);
  drawPost(octPoints.sideRight.x, octPoints.sideRight.y, fenceHeight + 160);

  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.moveTo(octPoints.backLeft.x, octPoints.backLeft.y);
  ctx.lineTo(octPoints.backRight.x, octPoints.backRight.y);
  ctx.lineTo(octPoints.cornerRight.x, octPoints.cornerRight.y);
  ctx.lineTo(octPoints.sideRight.x, octPoints.sideRight.y);
  ctx.lineTo(octPoints.frontRight.x, octPoints.frontRight.y);
  ctx.lineTo(octPoints.frontLeft.x, octPoints.frontLeft.y);
  ctx.lineTo(octPoints.sideLeft.x, octPoints.sideLeft.y);
  ctx.lineTo(octPoints.cornerLeft.x, octPoints.cornerLeft.y);
  ctx.closePath();
  ctx.fill();

  ctx.save();
  ctx.translate(centerX, wallBaseY + 50);
  ctx.scale(1, 0.4);

  ctx.fillStyle = '#0a0a0a';
  ctx.beginPath();
  ctx.arc(0, 0, 120, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2;
  ctx.stroke();

  const cream = '#e8e4d9';
  const px = 7;

  let startX = -52;
  let startY = -65;
  ctx.fillStyle = cream;
  // R
  ctx.fillRect(startX, startY, px, px * 7); ctx.fillRect(startX, startY, px * 4, px); ctx.fillRect(startX, startY + px * 3, px * 4, px);
  ctx.fillRect(startX + px * 3, startY, px, px * 3); ctx.fillRect(startX + px * 2, startY + px * 4, px, px); ctx.fillRect(startX + px * 3, startY + px * 5, px, px * 2);
  startX += px * 5;
  // K
  ctx.fillRect(startX, startY, px, px * 7); ctx.fillRect(startX + px * 3, startY, px, px * 2); ctx.fillRect(startX + px * 2, startY + px * 2, px, px);
  ctx.fillRect(startX + px * 1, startY + px * 3, px, px); ctx.fillRect(startX + px * 2, startY + px * 4, px, px); ctx.fillRect(startX + px * 3, startY + px * 5, px, px * 2);
  startX += px * 5;
  // E
  ctx.fillRect(startX, startY, px, px * 7); ctx.fillRect(startX, startY, px * 4, px); ctx.fillRect(startX, startY + px * 3, px * 3, px); ctx.fillRect(startX, startY + px * 6, px * 4, px);

  startX = -52; startY = 10;
  // N
  ctx.fillRect(startX, startY, px, px * 7); ctx.fillRect(startX + px * 4, startY, px, px * 7);
  ctx.fillRect(startX + px, startY + px, px, px * 2); ctx.fillRect(startX + px * 2, startY + px * 3, px, px * 2); ctx.fillRect(startX + px * 3, startY + px * 5, px, px);
  startX += px * 6;
  // A
  ctx.fillRect(startX, startY + px, px, px * 6); ctx.fillRect(startX + px * 3, startY + px, px, px * 6);
  ctx.fillRect(startX + px, startY, px * 2, px); ctx.fillRect(startX, startY + px * 3, px * 4, px);
  startX += px * 5;
  // Red square
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(startX, startY + px * 3, px * 3, px * 4);
  ctx.restore();

  const drawFloorSponsor = (tx: number, ty: number) => {
    ctx.save();
    ctx.translate(tx, ty);
    ctx.scale(1, 0.5);
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(0, 0, 40, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = '18px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('any', 0, 2);
    ctx.shadowColor = 'black'; ctx.shadowBlur = 0; ctx.shadowOffsetX = 2; ctx.shadowOffsetY = 2;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText('any.ge', 0, 75);
    ctx.restore();
  };
  drawFloorSponsor(width * 0.15, wallBaseY + 50);
  drawFloorSponsor(width * 0.85, wallBaseY + 50);

  const vignette = ctx.createRadialGradient(centerX, height / 2 + 50, 200, centerX, height / 2, 800);
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.5)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);
};
