
import React, { useRef, useEffect } from 'react';
import {
  ActionState, Fighter, InputState, Particle, Rect
} from '../types';
import {
  CANVAS_WIDTH, CANVAS_HEIGHT, GROUND_Y, FIGHTER_WIDTH, FIGHTER_HEIGHT,
  MOVE_SPEED, HIT_STUN_FRAMES, SLAMMED_FRAMES, PUNCH_FRAMES, KICK_FRAMES, TAKEDOWN_FRAMES, SPRAWL_FRAMES, BLOCK_COOLDOWN,
  DAMAGE_PUNCH, DAMAGE_KICK, DAMAGE_TAKEDOWN,
  STAMINA_COST_PUNCH, STAMINA_COST_KICK, STAMINA_COST_TAKEDOWN, STAMINA_REGEN,
  COLOR_SKIN_P1, COLOR_SHORTS_P1, COLOR_SKIN_P2, COLOR_SHORTS_P2
} from '../constants';
import { drawFighter, drawBackground } from '../utils/sprites';

interface GameCanvasProps {
  onGameOver: (winner: 'PLAYER' | 'ENEMY') => void;
  input: InputState;
}

const createFighter = (x: number, isPlayer: boolean): Fighter => ({
  x,
  y: GROUND_Y - FIGHTER_HEIGHT,
  vx: 0,
  width: FIGHTER_WIDTH,
  height: FIGHTER_HEIGHT,
  color: isPlayer ? COLOR_SKIN_P1 : COLOR_SKIN_P2,
  shortsColor: isPlayer ? COLOR_SHORTS_P1 : COLOR_SHORTS_P2,
  direction: isPlayer ? 1 : -1,
  health: 100,
  maxHealth: 100,
  stamina: 100,
  maxStamina: 100,
  state: ActionState.IDLE,
  stateTimer: 0,
  isPlayer,
  hitbox: null
});

function GameCanvas({ onGameOver, input }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const frameRef = useRef({
    lastTime: 0,
    accumulator: 0
  });

  // Mutable game state for performance
  const gameState = useRef({
    player: createFighter(150, true),
    enemy: createFighter(550, false),
    particles: [] as Particle[],
    isGameOver: false,
    timeRemaining: 180, // 3 minutes round
    lastTimeUpdate: Date.now(),
    // AI movement state - keeps movement "sticky" to prevent rapid state changes
    aiMoveDirection: 0 as -1 | 0 | 1,  // -1 = left, 0 = idle, 1 = right
    aiMoveTimer: 0,  // frames remaining for current movement decision
    // Commentator shout system
    commentatorShout: null as { text: string; timer: number; x: number } | null
  });

  const checkCollision = (r1: Rect, r2: Rect) => {
    return (
      r1.x < r2.x + r2.w &&
      r1.x + r1.w > r2.x &&
      r1.y < r2.y + r2.h &&
      r1.y + r1.h > r2.y
    );
  };

  const spawnBlood = (x: number, y: number, count: number) => {
    for (let i = 0; i < count; i++) {
      gameState.current.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 15,
        vy: (Math.random() - 0.5) * 15,
        life: 20 + Math.random() * 20,
        color: '#aa0000',
        size: Math.random() * 6 + 3
      });
    }
  };

  const triggerCommentatorShout = (text: string) => {
    // Random commentator (0, 1, or 2 - left, center, right)
    const commentatorIndex = Math.floor(Math.random() * 3);
    gameState.current.commentatorShout = {
      text,
      timer: 90, // Show for ~1.5 seconds
      x: commentatorIndex / 3 // 0, 0.33, or 0.66
    };
  };

  const updateFighter = (f: Fighter, controls: InputState, target: Fighter) => {
    if (f.state === ActionState.KO) return;

    // Regen Stamina
    if (f.state === ActionState.IDLE || f.state === ActionState.WALK) {
      f.stamina = Math.min(f.stamina + STAMINA_REGEN, f.maxStamina);
    }

    // State Timer Tick
    if (f.stateTimer > 0) {
      f.stateTimer--;
      // Return to Idle when action complete
      if (f.stateTimer <= 0) {
        if (f.state === ActionState.HIT || f.state === ActionState.SPRAWL || f.state === ActionState.SLAMMED) {
          f.state = ActionState.IDLE;
        } else if (f.state === ActionState.PUNCH || f.state === ActionState.KICK || f.state === ActionState.BLOCK || f.state === ActionState.TAKEDOWN) {
          f.state = ActionState.IDLE;
          f.hitbox = null;
        }
      }
    }

    const isBusy = f.state === ActionState.PUNCH || f.state === ActionState.KICK ||
      f.state === ActionState.HIT || f.state === ActionState.BLOCK ||
      f.state === ActionState.TAKEDOWN || f.state === ActionState.SPRAWL ||
      f.state === ActionState.SLAMMED;

    // Movement
    if (!isBusy) {
      // Slow down the bot (Jon Jones) to make him feel heavier/more tactical vs the lighter player
      const speed = f.isPlayer ? MOVE_SPEED : MOVE_SPEED * 0.5;

      if (controls.left) {
        f.x -= speed;
        f.state = ActionState.WALK;
      } else if (controls.right) {
        f.x += speed;
        f.state = ActionState.WALK;
      } else {
        f.state = ActionState.IDLE;
      }
    } else if (f.state === ActionState.TAKEDOWN) {
      // Lock direction during takedown - face the direction we started
      // Lunge forward during the "SHOOT" phase of the animation (approx 30% to 80% of frames remaining)
      if (f.stateTimer > TAKEDOWN_FRAMES * 0.3 && f.stateTimer <= TAKEDOWN_FRAMES * 0.8) {
        const dashSpeed = f.isPlayer ? MOVE_SPEED * 1.2 : MOVE_SPEED * 0.8;
        // Only lunge if not too close to opponent (prevent passing through)
        const distToTarget = Math.abs(f.x - target.x);
        if (distToTarget > f.width * 0.8) {
          f.x += f.direction * dashSpeed;
        }
      }
      // Keep hitbox following the fighter during takedown
      if (f.hitbox) {
        const reach = f.width * 1.2;
        f.hitbox.x = f.direction === 1 ? f.x + f.width * 0.3 : f.x - reach + f.width * 0.7;
      }
    }

    // Actions
    if (!isBusy && f.stamina >= 10) {
      if (controls.takedown && f.stamina >= STAMINA_COST_TAKEDOWN) {
        f.state = ActionState.TAKEDOWN;
        f.stateTimer = TAKEDOWN_FRAMES;
        f.stamina -= STAMINA_COST_TAKEDOWN;
        const reach = f.width * 1.2; // Increase range slightly
        f.hitbox = {
          x: f.direction === 1 ? f.x + f.width * 0.5 : f.x - reach + f.width * 0.5,
          y: f.y + f.height * 0.4,
          w: reach,
          h: f.height * 0.4 // Taller hitbox to catch legs/torso
        };
      } else if (controls.punch) {
        f.state = ActionState.PUNCH;
        f.stateTimer = PUNCH_FRAMES;
        f.stamina -= STAMINA_COST_PUNCH;
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

    // Wall constraints
    f.x = Math.max(0, Math.min(f.x, CANVAS_WIDTH - f.width));

    // Auto-face - only when truly idle (not recovering from action)
    if ((f.state === ActionState.IDLE || f.state === ActionState.WALK) && f.stateTimer <= 0) {
      f.direction = f.x < target.x ? 1 : -1;
    }
  };

  const updateAI = (ai: Fighter, player: Fighter): InputState => {
    const dist = Math.abs(ai.x - player.x);
    const attackRange = ai.width * 1.2;
    const facingPlayer = (ai.direction === 1 && player.x > ai.x) || (ai.direction === -1 && player.x < ai.x);

    const controls: InputState = {
      left: false, right: false, punch: false, kick: false, block: false, takedown: false
    };

    if (ai.state === ActionState.KO) return controls;
    if (ai.stateTimer > 0) return controls;

    // Sprawl Logic
    if (player.state === ActionState.TAKEDOWN && dist < attackRange + 80 && facingPlayer) {
      if (Math.random() > 0.5) {
        controls.block = true;
        return controls;
      }
    }

    // Decrement AI move timer
    if (gameState.current.aiMoveTimer > 0) {
      gameState.current.aiMoveTimer--;
      // Continue current movement direction
      if (gameState.current.aiMoveDirection === -1) controls.left = true;
      else if (gameState.current.aiMoveDirection === 1) controls.right = true;
      return controls;
    }

    // Only make new decisions occasionally (15% chance per frame)
    if (Math.random() > 0.15) return controls;

    if (dist > attackRange + 20) {
      // Set sticky movement - move for 30-60 frames (0.5-1 second)
      gameState.current.aiMoveTimer = 30 + Math.floor(Math.random() * 30);
      if (player.x > ai.x) {
        gameState.current.aiMoveDirection = 1;
        controls.right = true;
      } else {
        gameState.current.aiMoveDirection = -1;
        controls.left = true;
      }

      if (Math.random() < 0.03 && ai.stamina > 50) {
        controls.takedown = true; // 3% chance while approaching
      }
    } else if (dist < attackRange && facingPlayer) {
      // In attack range - stop moving and attack
      gameState.current.aiMoveDirection = 0;
      gameState.current.aiMoveTimer = 0;
      
      const rand = Math.random();
      if (rand < 0.40 && ai.stamina > 20) controls.punch = true;
      else if (rand < 0.70 && ai.stamina > 20) controls.kick = true;
      else if (rand < 0.85 && ai.stamina > 40 && dist > ai.width * 0.5) controls.takedown = true; // 15% chance
      else controls.block = true;
    } else {
      // Set sticky movement for repositioning
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
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    });
  };

  const updateCommentatorShout = () => {
    if (gameState.current.commentatorShout) {
      gameState.current.commentatorShout.timer--;
      if (gameState.current.commentatorShout.timer <= 0) {
        gameState.current.commentatorShout = null;
      }
    }
  };

  const drawCommentatorShout = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const shout = gameState.current.commentatorShout;
    if (!shout) return;

    const alpha = Math.min(1, shout.timer / 30); // Fade out in last 0.5 seconds
    const scale = 1 + (90 - shout.timer) * 0.003; // Slight grow effect
    
    ctx.save();
    ctx.globalAlpha = alpha;
    
    // Commentators are at bottom center: positions are centerX-110, centerX, centerX+110
    // tableY = height - 130, heads are about 50px above that
    const offsets = [-110, 0, 110];
    const commentatorIndex = Math.round(shout.x * 3); // 0, 1, or 2
    const commentatorX = width / 2 + offsets[Math.min(commentatorIndex, 2)];
    const commentatorHeadY = height - 180; // Above the table
    
    // Bubble stays above commentator head (no floating animation)
    const x = commentatorX;
    const y = commentatorHeadY - 60;
    
    // Measure text for bubble size
    ctx.font = `bold ${Math.floor(18 * scale)}px "Press Start 2P", monospace`;
    const textWidth = ctx.measureText(shout.text).width;
    const bubbleWidth = textWidth + 30;
    const bubbleHeight = 36;
    
    // Draw speech bubble cloud
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 2;
    
    // Main bubble (rounded rectangle)
    ctx.beginPath();
    const bx = x - bubbleWidth / 2;
    const by = y - bubbleHeight / 2;
    const radius = 10;
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
    
    // Bubble tail (pointing down to commentator head)
    ctx.beginPath();
    ctx.moveTo(x - 6, y + bubbleHeight / 2 - 2);
    ctx.lineTo(x, y + bubbleHeight / 2 + 15);
    ctx.lineTo(x + 6, y + bubbleHeight / 2 - 2);
    ctx.closePath();
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.stroke();
    
    // Small thought bubbles going down to head
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x, y + bubbleHeight / 2 + 25, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y + bubbleHeight / 2 + 38, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // Draw text
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#dc2626';
    ctx.fillText(shout.text, x, y);
    
    ctx.restore();
  };

  const checkCombatCollisions = (attacker: Fighter, defender: Fighter) => {
    // Skip if no hitbox or defender is already in a hit/downed state
    if (!attacker.hitbox) return;
    if (defender.state === ActionState.HIT || defender.state === ActionState.SLAMMED || 
        defender.state === ActionState.KO || defender.state === ActionState.SPRAWL) return;
    
    // For takedowns, only check collision during the active lunge phase (30% to 80%)
    if (attacker.state === ActionState.TAKEDOWN) {
      if (attacker.stateTimer <= TAKEDOWN_FRAMES * 0.3 || attacker.stateTimer > TAKEDOWN_FRAMES * 0.8) {
        return; // Not in active phase
      }
    } else {
      // For punches/kicks, need active frames
      if (attacker.stateTimer <= 5) return;
    }

    const defenderHurtbox = { x: defender.x, y: defender.y, w: defender.width, h: defender.height };

    if (checkCollision(attacker.hitbox, defenderHurtbox)) {

      if (attacker.state === ActionState.TAKEDOWN) {
        // If both are doing takedowns - attacker continues animation, defender goes to idle (no animation)
        if (defender.state === ActionState.TAKEDOWN) {
          // Clash - attacker keeps playing takedown animation, defender stops
          attacker.stamina -= 10;
          attacker.hitbox = null; // No damage, but animation continues
          
          defender.stamina -= 10;
          defender.state = ActionState.IDLE; // Defender goes to idle, no special animation
          defender.stateTimer = 15;
          defender.hitbox = null;
          defender.x -= defender.direction * 20;
          return;
        } else if (defender.state === ActionState.BLOCK) {
          // BLOCKED - attacker continues animation, defender goes to idle (no sprawl animation)
          attacker.stamina -= 15;
          attacker.hitbox = null; // No damage, but animation continues
          attacker.x -= attacker.direction * 20;

          defender.state = ActionState.IDLE; // No special animation for defender
          defender.stateTimer = 15;
          defender.hitbox = null;
          return;
        } else {
          // SUCCESSFUL TAKEDOWN -> opponent plays SLAMMED animation
          defender.health -= DAMAGE_TAKEDOWN;
          defender.state = ActionState.SLAMMED;
          defender.stateTimer = SLAMMED_FRAMES;
          defender.hitbox = null;
          spawnBlood(defender.x + defender.width / 2, defender.y + defender.height * 0.8, 15);
          
          // Commentator shouts TAKEDOWN!
          triggerCommentatorShout('TAKEDOWN!');
          
          // Attacker animation continues to finish
          attacker.hitbox = null;
          return;
        }
      }

      // Punch/Kick damage
      const damage = attacker.state === ActionState.PUNCH ? DAMAGE_PUNCH : DAMAGE_KICK;

      if (defender.state === ActionState.BLOCK) {
        defender.stamina -= damage * 2;
        spawnBlood(defender.x + defender.width / 2, defender.y + defender.height * 0.2, 2);
      } else {
        defender.health -= damage;
        defender.state = ActionState.HIT;
        defender.stateTimer = HIT_STUN_FRAMES;
        defender.hitbox = null;
        spawnBlood(defender.x + defender.width / 2, defender.y + defender.height * 0.2, 12);
      }
      attacker.hitbox = null;
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

    const deltaTime = time - frameRef.current.lastTime;
    frameRef.current.lastTime = time;
    frameRef.current.accumulator += deltaTime;

    // Cap accumulator to prevent spiral of death
    if (frameRef.current.accumulator > 200) {
      frameRef.current.accumulator = 200;
    }

    const FIXED_TIME_STEP = 1000 / 60;

    while (frameRef.current.accumulator >= FIXED_TIME_STEP) {
      const { player, enemy } = gameState.current;

      updateFighter(player, input, enemy);

      const aiInput = updateAI(enemy, player);
      updateFighter(enemy, aiInput, player);

      checkCombatCollisions(player, enemy);
      checkCombatCollisions(enemy, player);

      updateParticles();
      updateCommentatorShout();

      // Update Timer (roughly every second)
      const now = Date.now();
      if (now - gameState.current.lastTimeUpdate > 1000 && !gameState.current.isGameOver) {
        if (gameState.current.timeRemaining > 0) {
          gameState.current.timeRemaining--;
        }
        gameState.current.lastTimeUpdate = now;
      }

      if (player.health <= 0 && player.state !== ActionState.KO) {
        player.state = ActionState.KO;
        player.health = 0;
        if (!gameState.current.isGameOver) {
          gameState.current.isGameOver = true;
          // Delayed KO screen (3 seconds) to see animation
          setTimeout(() => onGameOver('ENEMY'), 3000);
        }
      }
      if (enemy.health <= 0 && enemy.state !== ActionState.KO) {
        enemy.state = ActionState.KO;
        enemy.health = 0;
        if (!gameState.current.isGameOver) {
          gameState.current.isGameOver = true;
          // Delayed KO screen (3 seconds) to see animation
          setTimeout(() => onGameOver('PLAYER'), 3000);
        }
      }

      frameRef.current.accumulator -= FIXED_TIME_STEP;
    }

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    drawBackground(ctx, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Draw commentator shout behind players
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

    const event = new CustomEvent('game-update', {
      detail: {
        p1: player,
        p2: enemy,
        time: gameState.current.timeRemaining
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
  }, [input, onGameOver]);

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
