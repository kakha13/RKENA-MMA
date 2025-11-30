

import { Fighter, ActionState } from '../types';

export const drawFighter = (ctx: CanvasRenderingContext2D, fighter: Fighter) => {
  const { x, y, width, height, color, shortsColor, direction, state, stateTimer, isPlayer } = fighter;
  
  // Flip context if facing left
  ctx.save();
  ctx.translate(x + width / 2, y + height);
  
  // Draw Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.ellipse(0, -5, width * 0.6, height * 0.05, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.scale(direction, 1);
  
  // Shake effect on hit
  if (state === ActionState.HIT) {
    ctx.translate((Math.random() - 0.5) * 10, 0);
  }

  // Dimensions relative to size
  const w = width;
  const h = height;
  const headSize = w * 0.55;
  const limbWidth = w * 0.32; // Slightly thicker limbs
  const torsoWidth = w * 0.9;
  
  // Calculate animation offsets based on state
  let armOffset = 0;
  let legOffset = 0;
  let bodyY = -h;
  let bodyLean = 0;
  let bodyHeightScale = 1;

  // Animation Logic
  const time = Date.now();
  if (state === ActionState.IDLE) {
    bodyY += Math.sin(time / 200) * (h * 0.02); // Breathing
    armOffset = Math.sin(time / 200 + Math.PI) * 5;
  } else if (state === ActionState.WALK) {
    const walkCycle = Math.sin(time / 80);
    legOffset = walkCycle * (w * 0.2);
    bodyY += Math.abs(Math.sin(time / 80)) * (h * 0.03);
    armOffset = -walkCycle * 10;
  } else if (state === ActionState.PUNCH) {
    const progress = 1 - (stateTimer / 20); // Normalized 0 to 1
    if (progress < 0.2) armOffset = -w * 0.2; // Windup
    else if (progress < 0.5) armOffset = w * 0.8; // Extension
    else armOffset = 0; // Return
    bodyLean = 0.15;
  } else if (state === ActionState.KICK) {
    const progress = 1 - (stateTimer / 30);
    bodyLean = -0.3;
    if (progress < 0.5) legOffset = w * 0.6;
  } else if (state === ActionState.BLOCK) {
    armOffset = -w * 0.1;
    bodyLean = -0.1;
  } else if (state === ActionState.KO) {
    bodyLean = -1.57; // 90 degrees flat
    bodyY = -h * 0.1;
  } else if (state === ActionState.TAKEDOWN) {
    // Dynamic Animation: Crouch -> Shoot -> Hold -> Recover
    // Timer starts at 30
    if (stateTimer > 25) {
        // Wind up / Crouch
        bodyLean = 0.4;
        bodyY = -h * 0.8;
    } else if (stateTimer > 10) {
        // SHOOT!
        bodyLean = 1.3; // Very low
        bodyY = -h * 0.4;
        armOffset = w * 0.8; // Arms full reach
    } else {
        // Recovery
        bodyLean = 0.6;
        bodyY = -h * 0.7;
    }
  } else if (state === ActionState.SPRAWL) {
    bodyLean = 1.4; // Almost flat forward
    bodyY = -h * 0.25;
    // Legs kick back visually handled by rotation
    legOffset = -w * 0.5;
  } else if (state === ActionState.SLAMMED) {
    bodyLean = -1.6; // Flat on back
    // Bounce animation
    // Timer starts at 45. 
    // 45-35: Being slammed down
    // 35-25: Bounce up slightly
    // 25-0: Flat
    if (stateTimer > 35) {
        bodyY = -h * 0.5 + (45 - stateTimer) * 10; // Falling fast
    } else if (stateTimer > 25) {
        bodyY = -h * 0.2 - (35 - stateTimer) * 3; // Bounce up
    } else {
        bodyY = -h * 0.1; // Rest on ground
    }
  }

  ctx.rotate(bodyLean);

  // --- DRAWING ORDER: Back Arm -> Back Leg -> Body -> Head -> Front Leg -> Front Arm ---

  // 1. Back Arm (Farthest Layer - Behind body)
  ctx.fillStyle = color;
  let backArmRot = state === ActionState.BLOCK ? -2.5 : 0.5; // Guard position or idle
  if (state === ActionState.PUNCH) backArmRot = 0.8; // Tucked
  if (state === ActionState.WALK) backArmRot += armOffset / 20;
  if (state === ActionState.TAKEDOWN) {
      if (stateTimer > 10 && stateTimer <= 25) backArmRot = -1.8; // Reaching forward
      else backArmRot = -0.5;
  }
  if (state === ActionState.SPRAWL) backArmRot = -0.5; // Stabilizing on ground
  if (state === ActionState.SLAMMED) backArmRot = -2.5; // Arms flailing up

  ctx.save();
  ctx.translate(torsoWidth * 0.2, -h * 0.75); // Shoulder pivot
  ctx.rotate(backArmRot);
  ctx.fillRect(-limbWidth/2, 0, limbWidth, h * 0.35); // Arm
  // Glove
  ctx.fillStyle = '#cc0000'; 
  ctx.fillRect(-limbWidth/2 - 2, h * 0.35, limbWidth + 4, limbWidth + 4);
  ctx.restore();

  // 2. Back Leg
  const backLegX = -torsoWidth * 0.25;
  let backLegRot = 0;
  if (state === ActionState.WALK) backLegRot = -legOffset / 20;
  if (state === ActionState.SPRAWL) backLegRot = 1.5; // Legs kicked back
  if (state === ActionState.SLAMMED) backLegRot = -0.2; // Slightly bent on ground
  if (state === ActionState.TAKEDOWN) {
      if (stateTimer > 10 && stateTimer <= 25) backLegRot = -1.2; // Driving leg
      else backLegRot = -0.5;
  }
  
  ctx.save();
  ctx.translate(backLegX, -h * 0.5);
  ctx.rotate(backLegRot);
  // Skin
  ctx.fillStyle = color; 
  ctx.fillRect(-limbWidth/2, 0, limbWidth, h * 0.5); 
  // Shorts Sleeve (Back)
  ctx.fillStyle = shortsColor;
  ctx.fillRect(-limbWidth/2 - 2, -5, limbWidth + 4, h * 0.25);
  ctx.restore();

  // 3. Torso (Body + Waistband)
  ctx.fillStyle = color;
  ctx.fillRect(-torsoWidth/2, bodyY + h*0.2, torsoWidth, h * 0.45); // Chest/Abdomen

  // TATTOO: Philippians (Opponent Only)
  if (!isPlayer) {
    ctx.save();
    ctx.translate(torsoWidth * 0.1, bodyY + h * 0.35); // Upper chest area
    ctx.rotate(-0.1);
    ctx.fillStyle = 'rgba(20, 10, 10, 0.7)'; // Dark ink color
    
    // Mimic "Philippians 4:13" text shape
    ctx.fillRect(-25, -5, 50, 4); // Main text block
    ctx.fillRect(-15, 2, 30, 3); // Secondary line
    
    ctx.restore();
  }

  // Shorts Waistband (Static on body)
  ctx.fillStyle = shortsColor;
  ctx.fillRect(-torsoWidth/2 - 2, bodyY + h*0.45, torsoWidth + 4, h * 0.18);
  
  // Shorts Detail
  if (isPlayer) {
      // BORJGALI SYMBOL (Georgian Sun) - Placed on the Rear Side of Shorts (Torso Layer)
      const bx = -torsoWidth * 0.3; // Rear/Left side
      const by = bodyY + h * 0.55; // Upper position of fighters bottom (shorts area)
      const bs = 3; // base scale
      
      ctx.fillStyle = '#ffffff';
      
      // Central point
      ctx.beginPath();
      ctx.arc(bx, by, bs, 0, Math.PI * 2);
      ctx.fill();

      // 7 Wings (Swirling pattern)
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for(let i=0; i<7; i++) {
        const angle = (i * Math.PI * 2) / 7;
        const armLen = bs * 3;
        // Curve point
        const cx = bx + Math.cos(angle) * armLen;
        const cy = by + Math.sin(angle) * armLen;
        // Tip (curved)
        const tx = bx + Math.cos(angle + 0.5) * (armLen + 3);
        const ty = by + Math.sin(angle + 0.5) * (armLen + 3);
        
        ctx.moveTo(bx, by);
        ctx.quadraticCurveTo(cx, cy, tx, ty);
      }
      ctx.stroke();

  } else {
      // White UFC Logo/Trim for P2 (Jon Jones)
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      // Center logo block on waistband
      ctx.fillRect(-10, bodyY + h*0.5, 20, 8);
  }

  // 4. Head
  ctx.fillStyle = color;
  const neckH = h * 0.08; 
  ctx.fillRect(-headSize * 0.3, bodyY + h*0.15, headSize * 0.6, neckH); // Neck
  ctx.fillRect(-headSize/2, bodyY + h*0.15 - headSize, headSize, headSize); // Head Base
  
  const hairY = bodyY + h * 0.15 - headSize;

  if (isPlayer) {
      // PLAYER 1: Short Dark Hair + Lighter Brown Beard (Aleksandar Rakic / Merab style)
      const hairColor = '#1a1a1a'; // Dark Black/Brown for head hair
      const beardColor = '#6d4c41'; // Lighter Brown for beard
      
      // Beard (covers jawline and sides)
      ctx.fillStyle = beardColor;
      ctx.fillRect(-headSize/2, bodyY + h*0.15 - headSize * 0.45, headSize, headSize * 0.45);
      // Beard Sideburns
      ctx.fillRect(-headSize/2, bodyY + h*0.15 - headSize * 0.7, headSize * 0.25, headSize * 0.4);

      // Hair (Short Crew Cut)
      ctx.fillStyle = hairColor;
      ctx.fillRect(-headSize/2, hairY - 5, headSize, 12); // Top
      ctx.fillRect(-headSize/2, hairY, headSize * 0.2, headSize * 0.5); // Side connection
      
      // Face Features
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; 
      ctx.fillRect(headSize * 0.15, bodyY + h*0.15 - headSize * 0.65, headSize * 0.25, headSize * 0.1); // Eye
      
      // Mouth (Inside beard area, dark)
      ctx.fillStyle = '#3e2723';
      ctx.fillRect(headSize * 0.2, bodyY + h*0.15 - headSize * 0.25, headSize * 0.3, headSize * 0.05);
  } else {
      // CPU: Jon Jones Model
      
      // Hair: Short Black Faded
      ctx.fillStyle = '#0a0a0a'; 
      ctx.fillRect(-headSize/2, hairY - 3, headSize, 10); // Very short top
      ctx.fillRect(-headSize/2, hairY, headSize * 0.15, headSize * 0.4); // Fade side

      // Beard: Black Goatee/Beard
      ctx.fillStyle = '#0a0a0a';
      // Goatee area
      ctx.fillRect(headSize * 0.1, bodyY + h*0.15 - headSize * 0.3, headSize * 0.4, headSize * 0.3);
      // Jawline stubble
      ctx.fillStyle = 'rgba(10,10,10,0.5)';
      ctx.fillRect(-headSize/2, bodyY + h*0.15 - headSize * 0.2, headSize, headSize * 0.2);

      // Face
      ctx.fillStyle = 'rgba(0,0,0,0.4)'; // Darker eye shadow
      ctx.fillRect(headSize * 0.15, bodyY + h*0.15 - headSize * 0.65, headSize * 0.25, headSize * 0.1); // Eye
      
      // Mouth
      ctx.fillStyle = '#2d1b15';
      ctx.fillRect(headSize * 0.2, bodyY + h*0.15 - headSize * 0.2, headSize * 0.2, headSize * 0.05);
  }

  // 5. Front Leg
  const frontLegX = torsoWidth * 0.25;
  let frontLegRot = 0;
  
  if (state === ActionState.KICK && stateTimer > 0) {
     frontLegRot = -1.8; // High kick
  } else if (state === ActionState.WALK) {
     frontLegRot = legOffset / 20;
  } else if (state === ActionState.TAKEDOWN) {
     if (stateTimer > 10 && stateTimer <= 25) frontLegRot = -1.5; // Deep lunge
     else frontLegRot = -0.5;
  } else if (state === ActionState.SPRAWL) {
     frontLegRot = 1.5; // Kicked back
  } else if (state === ActionState.SLAMMED) {
     frontLegRot = 0.2; // Legs flopped
  }

  ctx.save();
  ctx.translate(frontLegX, -h * 0.55); // Hip pivot
  ctx.rotate(frontLegRot);
  
  // Skin
  ctx.fillStyle = color;
  ctx.fillRect(-limbWidth/2, 0, limbWidth, h * 0.55); 
  
  // Shorts Sleeve (Front - Rotates with leg!)
  ctx.fillStyle = shortsColor;
  ctx.fillRect(-limbWidth/2 - 2, -5, limbWidth + 4, h * 0.25);

  if (!isPlayer) {
      // P2 (Jon Jones) Trim
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.fillRect(-limbWidth/2 - 2, h * 0.22, limbWidth + 4, 3); // Bottom hem
  }

  // Foot (if kicking)
  if (state === ActionState.KICK) {
      ctx.fillStyle = color;
      ctx.fillRect(-limbWidth/2, h*0.55, limbWidth * 2, limbWidth);
  }
  ctx.restore();

  // 6. Front Arm
  ctx.fillStyle = color;
  let frontArmRot = state === ActionState.BLOCK ? -2.2 : -0.5; // Guard or idle
  let frontArmLen = h * 0.35;
  let gloveX = -limbWidth/2 - 2;
  let gloveY = frontArmLen;

  if (state === ActionState.PUNCH) {
      frontArmRot = -1.57; // Horizontal
      frontArmLen += armOffset; // Extend
  } else if (state === ActionState.WALK) {
      frontArmRot += armOffset / 20;
  } else if (state === ActionState.TAKEDOWN) {
      if (stateTimer > 10 && stateTimer <= 25) frontArmRot = -1.8; // Reaching
      else frontArmRot = -0.5;
      frontArmLen += 15;
  } else if (state === ActionState.SPRAWL) {
      frontArmRot = -0.5;
  } else if (state === ActionState.SLAMMED) {
      frontArmRot = -2.5; // Flailing
  }

  ctx.save();
  ctx.translate(-torsoWidth * 0.2, -h * 0.75); // Shoulder pivot
  ctx.rotate(frontArmRot);
  ctx.fillRect(-limbWidth/2, 0, limbWidth, frontArmLen); // Arm
  // Glove
  ctx.fillStyle = '#cc0000';
  ctx.fillRect(gloveX, gloveY + (state === ActionState.PUNCH ? armOffset : 0), limbWidth + 4, limbWidth + 6);
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
    
    // 1. Red Circle
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(-30, 0, 24, 0, Math.PI * 2);
    ctx.fill();

    // 2. "any" Text (White, Sans-serif)
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px Arial, sans-serif'; // Clean font
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('any', -30, 2);

    // 3. ".ge" Text (White, Sans-serif)
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('.ge', 0, 2);

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

  // Banner background - Black (matches provided image)
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