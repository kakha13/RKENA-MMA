
import { Fighter, ActionState } from '../types';
import { 
  PUNCH_FRAMES, KICK_FRAMES, TAKEDOWN_FRAMES, SLAMMED_FRAMES, HIT_STUN_FRAMES 
} from '../constants';

export const drawFighter = (ctx: CanvasRenderingContext2D, fighter: Fighter) => {
  const { x, y, width, height, color, shortsColor, direction, state, stateTimer, isPlayer } = fighter;
  
  // Flip context if facing left
  ctx.save();
  ctx.translate(x + width / 2, y + height);
  
  // Draw Shadow (Dynamic scale based on height)
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  const shadowScale = state === ActionState.SLAMMED || state === ActionState.TAKEDOWN ? 0.8 : 1;
  ctx.ellipse(0, -5, width * 0.6 * shadowScale, height * 0.05, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.scale(direction, 1);
  
  // Shake effect on hit (Horizontal vibration)
  if (state === ActionState.HIT) {
    ctx.translate((Math.random() - 0.5) * 8, 0);
  }

  // Dimensions relative to size
  const w = width;
  const h = height;
  const headSize = w * 0.55;
  const limbWidth = w * 0.32; 
  const torsoWidth = w * 0.9;
  
  // Animation State Variables
  const time = Date.now();
  let bodyY = -h; // Base Y position
  let bodyLean = 0; // Rotation in radians
  
  // Limb Rotations (Base poses)
  let frontArmRot = -0.5;
  let backArmRot = 0.5;
  let frontLegRot = 0;
  let backLegRot = 0;
  
  // Extension variables
  let frontArmExt = 0;
  let headOffsetY = 0;
  let headOffsetX = 0;

  // --- ANIMATION LOGIC ---

  if (state === ActionState.IDLE) {
    // Rhythmic Fighter Bounce (Slower)
    const bounceSpeed = 600;
    const bounce = Math.sin(time / bounceSpeed);
    
    bodyY += bounce * (h * 0.015); // Subtle bob
    bodyLean = 0.05 + Math.sin(time / 800) * 0.02; // Slight sway
    
    // Arms float slightly
    frontArmRot = -0.5 + bounce * 0.05;
    backArmRot = 0.8 + bounce * 0.05;

  } else if (state === ActionState.WALK) {
    // Biomechanical Walk Cycle (Slower)
    const walkSpeed = 250;
    const walkCycle = (time / walkSpeed); 
    
    // Legs move in sine wave
    const strideSize = 0.6;
    frontLegRot = Math.sin(walkCycle) * strideSize;
    backLegRot = Math.sin(walkCycle + Math.PI) * strideSize; // Opposite phase
    
    // Body double-bobs (down when legs spread, up when crossing)
    bodyY += Math.abs(Math.sin(walkCycle)) * (h * 0.03); 
    bodyLean = 0.1; // Lean into walk

    // Arms swing opposite to legs
    frontArmRot = -0.5 + Math.sin(walkCycle + Math.PI) * 0.4; 
    backArmRot = 0.5 + Math.sin(walkCycle) * 0.4;

  } else if (state === ActionState.BLOCK) {
    // Turtle Up (Slower breathing)
    const breath = Math.sin(time / 250) * 0.02;
    bodyY += h * 0.05; // Crouch down
    bodyLean = -0.2 + breath; // Hunch forward
    
    // Hands high to cover face
    frontArmRot = -2.2 + breath; 
    backArmRot = -2.4 + breath; 
    headOffsetY = 2; // Tuck chin

  } else if (state === ActionState.PUNCH) {
    const progress = 1 - (stateTimer / PUNCH_FRAMES); // 0 to 1
    
    if (progress < 0.2) {
       // Windup
       frontArmRot = -0.2;
       bodyLean = -0.1;
    } else if (progress < 0.5) {
       // Snap
       frontArmRot = -1.57; // Straight out
       frontArmExt = w * 0.9;
       bodyLean = 0.2; // Lean in
    } else {
       // Retract
       frontArmRot = -1.0;
       frontArmExt = w * 0.2;
    }
    backArmRot = 0.8; // Guard face with other hand

  } else if (state === ActionState.KICK) {
    const progress = 1 - (stateTimer / KICK_FRAMES);
    bodyLean = -0.4; // Lean back to counterbalance
    
    if (progress < 0.3) {
        // Chamber knee
        frontLegRot = -1.0;
        backLegRot = 0.2;
    } else if (progress < 0.6) {
        // Extension
        frontLegRot = -1.9; // High!
    } else {
        // Retract
        frontLegRot = 0;
    }
    // Arms for balance
    frontArmRot = 0.5;
    backArmRot = -1.5;

  } else if (state === ActionState.HIT) {
    // Whiplash effect
    const impact = stateTimer / HIT_STUN_FRAMES; // 1.0 down to 0
    
    // Snap torso back
    bodyLean = -0.4 * impact; 
    
    // Head lags behind torso (Whiplash)
    headOffsetX = -5 * impact;
    headOffsetY = 2 * impact;
    
    // Arms flail out
    frontArmRot = -1.0 - (impact * 0.5);
    backArmRot = -0.5 - (impact * 0.5);

  } else if (state === ActionState.TAKEDOWN) {
    // Crouch -> Shoot -> Drive -> Recover
    
    const t = stateTimer;
    
    if (t > TAKEDOWN_FRAMES * 0.8) {
        // Level change (Crouch)
        bodyLean = 0.4;
        bodyY = -h * 0.6;
        frontArmRot = -1.0;
    } else if (t > TAKEDOWN_FRAMES * 0.3) {
        // SHOOT (Drive forward)
        bodyLean = 1.3; // Horizontal
        bodyY = -h * 0.4;
        frontArmRot = -1.8; // Reaching
        backArmRot = -1.8;
        frontArmExt = w * 0.5;
        backLegRot = -1.0; // Driving leg
        frontLegRot = -1.5; // Knee slide
    } else {
        // Recovery
        bodyLean = 0.6;
        bodyY = -h * 0.7;
    }

  } else if (state === ActionState.SPRAWL) {
    // Hips heavy
    bodyLean = 1.4; // Flat
    bodyY = -h * 0.25; // Low
    frontLegRot = 1.5; // Kicked back
    backLegRot = 1.5; // Kicked back
    frontArmRot = -0.5; // Post on ground
    backArmRot = -0.5;

  } else if (state === ActionState.SLAMMED) {
    // SLAMMED_FRAMES ~ 80
    bodyLean = -1.6; // Flat on back
    const t = stateTimer;
    const max = SLAMMED_FRAMES;
    
    // Physics bounce logic
    if (t > max * 0.5) {
        // Fall
        bodyY = -h * 0.5 + (max - t) * 6; 
        frontLegRot = -0.5; backLegRot = -0.8; // Legs up
        frontArmRot = -2.5; // Arms flailing
    } else if (t > max * 0.3) {
        // Bounce
        bodyY = -h * 0.2 - (max * 0.4 - t) * 2; 
        frontLegRot = 0; backLegRot = 0;
    } else {
        // Rest
        bodyY = -h * 0.1; 
        frontLegRot = 0.1; backLegRot = 0.1;
        frontArmRot = -2.8; // On floor
    }
  } else if (state === ActionState.KO) {
    bodyLean = -1.57; // 90 Degrees horizontal (Flat)
    bodyY = -h * 0.12; // Shifted slightly to align pivot
    
    // KO Specific Limb Adjustments to ensure connection
    frontArmRot = -2.8; // Flop back
    backArmRot = -2.8;
    frontLegRot = 0.1;
    backLegRot = 0.1;
    headOffsetY = 5; // Tucked closer to torso to close neck gap
  }

  // --- RENDERING ---
  
  // Apply Body Rotation
  ctx.rotate(bodyLean);

  // 1. Back Arm (Behind body)
  ctx.save();
  ctx.translate(torsoWidth * 0.2, -h * 0.75); // Shoulder
  ctx.rotate(backArmRot);
  ctx.fillStyle = color;
  ctx.fillRect(-limbWidth/2, 0, limbWidth, h * 0.35); 
  // Glove
  ctx.fillStyle = '#cc0000'; 
  ctx.fillRect(-limbWidth/2 - 2, h * 0.35, limbWidth + 4, limbWidth + 4);
  ctx.restore();

  // 2. Back Leg (Behind body)
  ctx.save();
  ctx.translate(-torsoWidth * 0.25, -h * 0.5); // Hip
  ctx.rotate(backLegRot);
  ctx.fillStyle = color; 
  ctx.fillRect(-limbWidth/2, 0, limbWidth, h * 0.5); 
  // Shorts Sleeve
  ctx.fillStyle = shortsColor;
  ctx.fillRect(-limbWidth/2 - 2, -5, limbWidth + 4, h * 0.25);
  // Borjgali Symbol (Player Only - Back Leg)
  if (isPlayer) {
      ctx.save();
      const bx = 0; 
      const by = h * 0.12; 
      const bs = 3; 
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(bx, by, bs, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for(let i=0; i<7; i++) {
        const angle = (i * Math.PI * 2) / 7;
        const armLen = bs * 3;
        const cx = bx + Math.cos(angle) * armLen;
        const cy = by + Math.sin(angle) * armLen;
        const tx = bx + Math.cos(angle + 0.5) * (armLen + 3);
        const ty = by + Math.sin(angle + 0.5) * (armLen + 3);
        ctx.moveTo(bx, by);
        ctx.quadraticCurveTo(cx, cy, tx, ty);
      }
      ctx.stroke();
      ctx.restore();
  }
  ctx.restore();

  // 3. Torso
  ctx.fillStyle = color;
  ctx.fillRect(-torsoWidth/2, bodyY + h*0.2, torsoWidth, h * 0.45); 

  // Opponent Tattoo (Philippians)
  if (!isPlayer) {
    ctx.save();
    ctx.translate(torsoWidth * 0.1, bodyY + h * 0.35); 
    ctx.rotate(-0.1);
    ctx.fillStyle = 'rgba(20, 10, 10, 0.7)'; 
    ctx.fillRect(-25, -5, 50, 4); 
    ctx.fillRect(-15, 2, 30, 3); 
    ctx.restore();
  }

  // Shorts Waistband
  ctx.fillStyle = shortsColor;
  // INCREASED HEIGHT to h * 0.3 to fully cover torso bottom (safer than 0.28)
  ctx.fillRect(-torsoWidth/2 - 2, bodyY + h*0.45, torsoWidth + 4, h * 0.3);
  
  // Borjgali on Torso/Shorts Rear (Player)
  if (isPlayer) {
      const bx = -torsoWidth * 0.3; 
      const by = bodyY + h * 0.55; 
      const bs = 3; 
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(bx, by, bs, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'white'; ctx.lineWidth = 1.5; ctx.beginPath();
      for(let i=0; i<7; i++) {
        const angle = (i * Math.PI * 2) / 7;
        const armLen = bs * 3;
        const cx = bx + Math.cos(angle) * armLen;
        const cy = by + Math.sin(angle) * armLen;
        const tx = bx + Math.cos(angle + 0.5) * (armLen + 3);
        const ty = by + Math.sin(angle + 0.5) * (armLen + 3);
        ctx.moveTo(bx, by); ctx.quadraticCurveTo(cx, cy, tx, ty);
      }
      ctx.stroke();
  } else {
      // P2 UFC Trim
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.fillRect(-10, bodyY + h*0.5, 20, 8);
  }

  // 4. Head
  const neckH = h * 0.10; // Slightly longer neck base
  ctx.fillStyle = color;
  // Neck moves with head offset
  ctx.fillRect(-headSize * 0.3 + headOffsetX, bodyY + h*0.15 + headOffsetY, headSize * 0.6, neckH); 
  
  const headX = -headSize/2 + headOffsetX;
  const headBaseY = bodyY + h*0.15 - headSize + headOffsetY;
  
  ctx.fillRect(headX, headBaseY, headSize, headSize); // Head Base
  
  if (isPlayer) {
      // P1: Merab Style
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
  } else {
      // P2: Jon Jones Style
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
  }
  
  // KO FACE OVERLAY (X Eyes + Tongue)
  if (state === ActionState.KO) {
      // Eyes "X"
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      
      // Left X
      ctx.beginPath(); 
      ctx.moveTo(headX + headSize*0.15, headBaseY + headSize*0.3); 
      ctx.lineTo(headX + headSize*0.35, headBaseY + headSize*0.5); 
      ctx.stroke();
      ctx.beginPath(); 
      ctx.moveTo(headX + headSize*0.35, headBaseY + headSize*0.3); 
      ctx.lineTo(headX + headSize*0.15, headBaseY + headSize*0.5); 
      ctx.stroke();

      // Right X
      ctx.beginPath(); 
      ctx.moveTo(headX + headSize*0.65, headBaseY + headSize*0.3); 
      ctx.lineTo(headX + headSize*0.85, headBaseY + headSize*0.5); 
      ctx.stroke();
      ctx.beginPath(); 
      ctx.moveTo(headX + headSize*0.85, headBaseY + headSize*0.3); 
      ctx.lineTo(headX + headSize*0.65, headBaseY + headSize*0.5); 
      ctx.stroke();

      // Tongue Hanging Out
      ctx.fillStyle = '#ff9999'; // Pink
      ctx.strokeStyle = '#cc0000';
      ctx.lineWidth = 1;
      // Draw protruding tongue
      ctx.fillRect(headX + headSize*0.4, headBaseY + headSize*0.85, headSize*0.2, headSize*0.25);
      ctx.strokeRect(headX + headSize*0.4, headBaseY + headSize*0.85, headSize*0.2, headSize*0.25);
  }

  // 5. Front Leg (Hip Pivot)
  ctx.save();
  ctx.translate(torsoWidth * 0.25, -h * 0.55); 
  ctx.rotate(frontLegRot);
  ctx.fillStyle = color;
  ctx.fillRect(-limbWidth/2, 0, limbWidth, h * 0.55); 
  ctx.fillStyle = shortsColor;
  ctx.fillRect(-limbWidth/2 - 2, -5, limbWidth + 4, h * 0.25);
  if (!isPlayer) {
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.fillRect(-limbWidth/2 - 2, h * 0.22, limbWidth + 4, 3);
  }
  if (state === ActionState.KICK) {
      ctx.fillStyle = color;
      ctx.fillRect(-limbWidth/2, h*0.55, limbWidth * 2, limbWidth); // Foot
  }
  ctx.restore();

  // 6. Front Arm (Shoulder Pivot)
  let frontArmLen = h * 0.35 + frontArmExt;
  ctx.save();
  ctx.translate(-torsoWidth * 0.2, -h * 0.75); 
  ctx.rotate(frontArmRot);
  ctx.fillStyle = color;
  ctx.fillRect(-limbWidth/2, 0, limbWidth, frontArmLen); 
  ctx.fillStyle = '#cc0000';
  ctx.fillRect(-limbWidth/2 - 2, frontArmLen, limbWidth + 4, limbWidth + 6);
  ctx.restore();

  ctx.restore();
};

export const drawBackground = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  const centerX = width / 2;
  const wallBaseY = height - 100; 
  const fenceHeight = 220;
  const fenceTopY = wallBaseY - fenceHeight;

  // 1. Dark Arena / Crowd Background (Top half)
  const gradient = ctx.createLinearGradient(0, 0, 0, wallBaseY);
  gradient.addColorStop(0, '#0a0a0a');
  gradient.addColorStop(0.5, '#151515');
  gradient.addColorStop(1, '#050505');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, wallBaseY);

  // Blurred crowd/lights effect
  for (let i = 0; i < 20; i++) {
     ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.04})`;
     const lx = Math.random() * width;
     const ly = Math.random() * (wallBaseY - 50);
     ctx.beginPath();
     ctx.arc(lx, ly, Math.random() * 40 + 10, 0, Math.PI * 2);
     ctx.fill();
  }

  // 2. The Octagon Fence Structure
  const centerPanelWidth = 500;
  const centerPanelLeft = centerX - centerPanelWidth / 2;
  const centerPanelRight = centerX + centerPanelWidth / 2;
  const angleOffset = 70; 

  const drawFenceSegment = (
      x1: number, y1_bot: number, y1_top: number, 
      x2: number, y2_bot: number, y2_top: number
  ) => {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x1, y1_bot);
      ctx.lineTo(x1, y1_top);
      ctx.lineTo(x2, y2_top);
      ctx.lineTo(x2, y2_bot);
      ctx.closePath();
      
      ctx.fillStyle = 'rgba(20, 20, 20, 0.8)';
      ctx.fill();

      ctx.save();
      ctx.clip();
      
      ctx.strokeStyle = '#444';
      ctx.lineWidth = 2;
      const meshSize = 16;
      ctx.beginPath();
      for(let ix = Math.min(x1, x2) - 100; ix < Math.max(x1, x2) + 100; ix+=meshSize) {
          ctx.moveTo(ix, 0); ctx.lineTo(ix + 80, height);
          ctx.moveTo(ix, 0); ctx.lineTo(ix - 80, height);
      }
      ctx.stroke();
      ctx.restore();

      ctx.lineWidth = 16;
      ctx.strokeStyle = '#0a0a0a'; 
      ctx.lineCap = 'butt';
      
      ctx.beginPath(); ctx.moveTo(x1, y1_top); ctx.lineTo(x2, y2_top); ctx.stroke();
      ctx.lineWidth = 2; ctx.strokeStyle = '#333'; 
      ctx.beginPath(); ctx.moveTo(x1, y1_top - 4); ctx.lineTo(x2, y2_top - 4); ctx.stroke();

      ctx.lineWidth = 16; ctx.strokeStyle = '#0a0a0a';
      ctx.beginPath(); ctx.moveTo(x1, y1_bot); ctx.lineTo(x2, y2_bot); ctx.stroke();

      ctx.restore();
  };

  drawFenceSegment(centerPanelLeft, wallBaseY, fenceTopY, centerPanelRight, wallBaseY, fenceTopY);
  drawFenceSegment(-150, wallBaseY + angleOffset, fenceTopY - angleOffset, centerPanelLeft, wallBaseY, fenceTopY);
  drawFenceSegment(centerPanelRight, wallBaseY, fenceTopY, width + 150, wallBaseY + angleOffset, fenceTopY - angleOffset);

  const drawPost = (x: number, y_base: number, h: number) => {
      ctx.fillStyle = '#050505'; 
      ctx.fillRect(x - 12, y_base - h - 12, 24, h + 24);
      ctx.fillStyle = '#222';
      ctx.fillRect(x - 8, y_base - h - 12, 6, h + 24);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(x - 12, y_base - h + 40, 24, 15);
  };

  drawPost(centerPanelLeft, wallBaseY, fenceHeight);
  drawPost(centerPanelRight, wallBaseY, fenceHeight);

  // Helper to draw High Quality "any.ge" Logo
  const drawAnyGe = (tx: number, ty: number) => {
    ctx.save();
    ctx.translate(tx, ty);
    
    // 1. Red Circle (Smooth High Quality)
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(-25, 0, 20, 0, Math.PI * 2);
    ctx.fill();

    // 2. "any" Text (Smooth Standard Font)
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Arial, Helvetica, sans-serif'; 
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('any', -25, 1);

    // 3. ".ge" Text (Smooth Standard Font)
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Arial, Helvetica, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('.ge', 0, 1); 

    ctx.restore();
  };


  // 3. The Canvas (Floor)
  ctx.fillStyle = '#e4e4e7'; 
  ctx.beginPath();
  ctx.moveTo(0, wallBaseY + angleOffset); 
  ctx.lineTo(centerPanelLeft, wallBaseY); 
  ctx.lineTo(centerPanelRight, wallBaseY); 
  ctx.lineTo(width, wallBaseY + angleOffset); 
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.closePath();
  ctx.fill();

  // 4. Floor Markings & Logo (RKENA)
  ctx.save();
  ctx.translate(centerX, wallBaseY + 60); 
  ctx.scale(1, 0.3); // Flatten effect for perspective

  // Draw Octagon Border Lines
  ctx.strokeStyle = '#18181b';
  ctx.lineWidth = 10;
  ctx.beginPath();
  const octSize = 400;
  for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4 + Math.PI / 8;
      const ox = Math.cos(angle) * octSize;
      const oy = Math.sin(angle) * octSize;
      if (i === 0) ctx.moveTo(ox, oy);
      else ctx.lineTo(ox, oy);
  }
  ctx.closePath();
  ctx.stroke();

  // RKENA LOGO (Pixel Art Style)
  
  // Outer Circle
  ctx.fillStyle = '#09090b';
  ctx.beginPath();
  ctx.arc(0, 0, 160, 0, Math.PI * 2);
  ctx.fill();

  // White Text
  ctx.fillStyle = '#ffffff';
  
  const px = 12; // Pixel unit size for the logo letters
  
  // --- ROW 1: R K E ---
  let startX = -84;
  let startY = -90; // Top half of the circle

  // Letter R
  ctx.fillRect(startX, startY, px, px * 7); // Left Vert
  ctx.fillRect(startX, startY, px * 4, px); // Top
  ctx.fillRect(startX, startY + px * 3, px * 4, px); // Mid
  ctx.fillRect(startX + px * 3, startY, px, px * 3); // Right Loop
  ctx.fillRect(startX + px * 2, startY + px * 4, px, px); // Leg diag 1
  ctx.fillRect(startX + px * 3, startY + px * 5, px, px * 2); // Leg diag 2

  startX += px * 5; 

  // Letter K
  ctx.fillRect(startX, startY, px, px * 7); // Left Vert
  ctx.fillRect(startX + px * 3, startY, px, px * 2); // Top right tip
  ctx.fillRect(startX + px * 2, startY + px * 2, px, px); // Top right mid
  ctx.fillRect(startX + px * 1, startY + px * 3, px, px); // Mid join
  ctx.fillRect(startX + px * 2, startY + px * 4, px, px); // Bot right mid
  ctx.fillRect(startX + px * 3, startY + px * 5, px, px * 2); // Bot right tip

  startX += px * 5; 

  // Letter E
  ctx.fillRect(startX, startY, px, px * 7); // Left Vert
  ctx.fillRect(startX, startY, px * 4, px); // Top
  ctx.fillRect(startX, startY + px * 3, px * 3, px); // Mid
  ctx.fillRect(startX, startY + px * 6, px * 4, px); // Bot

  // --- ROW 2: N A [Red Square] ---
  startX = -78;
  startY = 10; // Bottom half of the circle

  // Letter N
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(startX, startY, px, px * 7); // Left
  ctx.fillRect(startX + px * 4, startY, px, px * 7); // Right
  ctx.fillRect(startX + px, startY + px, px, px * 2); // Diag 1
  ctx.fillRect(startX + px * 2, startY + px * 3, px, px * 2); // Diag 2
  ctx.fillRect(startX + px * 3, startY + px * 5, px, px); // Diag 3

  startX += px * 5; 

  // Letter A
  ctx.fillRect(startX, startY + px, px, px * 6); // Left
  ctx.fillRect(startX + px * 3, startY + px, px, px * 6); // Right
  ctx.fillRect(startX + px, startY, px * 2, px); // Top
  ctx.fillRect(startX, startY + px * 3, px * 4, px); // Mid

  startX += px * 5; 

  // Red Square Accent
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(startX, startY + px * 2, px * 3, px * 5);

  ctx.restore();

  // 6. SPONSOR: ANY.GE (Fence Banner)
  // Draw on the top rail of the center panel
  const fenceBannerY = fenceTopY - 18;
  
  // Draw Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(centerX - 65, fenceBannerY - 26, 130, 60);

  // Banner background - Black
  ctx.fillStyle = '#000000'; 
  ctx.fillRect(centerX - 70, fenceBannerY - 30, 140, 60); 
  
  // Draw Logo Centered on Banner
  drawAnyGe(centerX, fenceBannerY);

  // 7. Vignette
  const vignette = ctx.createRadialGradient(centerX, height/2 + 50, 200, centerX, height/2, 800);
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.5)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);
};
