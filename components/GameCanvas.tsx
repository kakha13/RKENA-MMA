
import React, { useRef, useEffect } from 'react';
import { 
  ActionState, Fighter, InputState, Particle, Rect 
} from '../types';
import {
  CANVAS_WIDTH, CANVAS_HEIGHT, GROUND_Y, FIGHTER_WIDTH, FIGHTER_HEIGHT,
  MOVE_SPEED, HIT_STUN_FRAMES, PUNCH_FRAMES, KICK_FRAMES, TAKEDOWN_FRAMES, SPRAWL_FRAMES,
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
  
  // Mutable game state for performance
  const gameState = useRef({
    player: createFighter(150, true),
    enemy: createFighter(550, false),
    particles: [] as Particle[],
    isGameOver: false
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
        if (f.state === ActionState.HIT || f.state === ActionState.SPRAWL) {
          f.state = ActionState.IDLE;
        } else if (f.state === ActionState.PUNCH || f.state === ActionState.KICK || f.state === ActionState.BLOCK || f.state === ActionState.TAKEDOWN) {
          f.state = ActionState.IDLE;
          f.hitbox = null;
        }
      }
    }

    const isBusy = f.state === ActionState.PUNCH || f.state === ActionState.KICK || 
                   f.state === ActionState.HIT || f.state === ActionState.BLOCK ||
                   f.state === ActionState.TAKEDOWN || f.state === ActionState.SPRAWL;

    // Movement
    if (!isBusy) {
      if (controls.left) {
        f.x -= MOVE_SPEED;
        f.state = ActionState.WALK;
      } else if (controls.right) {
        f.x += MOVE_SPEED;
        f.state = ActionState.WALK;
      } else {
        f.state = ActionState.IDLE;
      }
    } else if (f.state === ActionState.TAKEDOWN) {
        // Lunge forward during the middle phase of the animation
        if (f.stateTimer > 10 && f.stateTimer < 25) {
             f.x += f.direction * MOVE_SPEED * 1.5;
             // Update hitbox position to follow the lunge
             if (f.hitbox) {
                f.hitbox.x += f.direction * MOVE_SPEED * 1.5;
             }
        }
    }

    // Actions
    if (!isBusy && f.stamina > 10) {
      if (controls.takedown && f.stamina > STAMINA_COST_TAKEDOWN) {
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
        f.stateTimer = 20; 
      }
    }

    // Wall constraints
    f.x = Math.max(0, Math.min(f.x, CANVAS_WIDTH - f.width));

    // Auto-face
    if (f.state === ActionState.IDLE || f.state === ActionState.WALK) {
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
       // High chance to block (sprawl) if player shoots takedown
       if (Math.random() > 0.3) {
         controls.block = true; 
         return controls;
       }
    }

    if (Math.random() > 0.15) return controls; 

    if (dist > attackRange + 20) {
      if (player.x > ai.x) controls.right = true;
      else controls.left = true;
      
      if (Math.random() < 0.05 && ai.stamina > 50) {
         controls.takedown = true;
      }
    } else if (dist < attackRange && facingPlayer) {
      const rand = Math.random();
      if (rand < 0.4 && ai.stamina > 20) controls.punch = true;
      else if (rand < 0.6 && ai.stamina > 20) controls.kick = true;
      else if (rand < 0.7 && ai.stamina > 40) controls.takedown = true;
      else if (rand < 0.9) controls.block = true;
    } else {
        if (player.x > ai.x) controls.left = true;
        else controls.right = true;
    }

    return controls;
  };

  const updateParticles = (ctx: CanvasRenderingContext2D) => {
    gameState.current.particles = gameState.current.particles.filter(p => p.life > 0);
    gameState.current.particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.8; 
      p.life--;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    });
  };

  const checkCombatCollisions = (attacker: Fighter, defender: Fighter) => {
     // Allow collision detection to run throughout the active phase of the takedown
     if (attacker.hitbox && (attacker.stateTimer > 5 || attacker.state === ActionState.TAKEDOWN) && defender.state !== ActionState.HIT && defender.state !== ActionState.KO) {
       const defenderHurtbox = { x: defender.x, y: defender.y, w: defender.width, h: defender.height };
       
       if (checkCollision(attacker.hitbox, defenderHurtbox)) {
          
          if (attacker.state === ActionState.TAKEDOWN) {
             if (defender.state === ActionState.BLOCK || defender.state === ActionState.TAKEDOWN) {
                // BLOCKED TAKEDOWN -> SPRAWL
                defender.state = ActionState.SPRAWL;
                defender.stateTimer = SPRAWL_FRAMES;
                defender.hitbox = null;
                
                attacker.stamina -= 15;
                attacker.state = ActionState.IDLE;
                attacker.stateTimer = 10;
                attacker.hitbox = null;
                return;
             } else {
                // SUCCESSFUL TAKEDOWN
                defender.health -= DAMAGE_TAKEDOWN;
                defender.state = ActionState.HIT;
                defender.stateTimer = HIT_STUN_FRAMES * 2;
                defender.hitbox = null;
                spawnBlood(defender.x + defender.width/2, defender.y + defender.height * 0.8, 8);
                attacker.hitbox = null;
                return;
             }
          }

          const damage = attacker.state === ActionState.PUNCH ? DAMAGE_PUNCH : DAMAGE_KICK;
          
          if (defender.state === ActionState.BLOCK) {
             defender.stamina -= damage * 2; 
             spawnBlood(defender.x + defender.width/2, defender.y + defender.height * 0.2, 2); 
          } else {
             defender.health -= damage;
             defender.state = ActionState.HIT;
             defender.stateTimer = HIT_STUN_FRAMES;
             defender.hitbox = null; 
             spawnBlood(defender.x + defender.width/2, defender.y + defender.height * 0.2, 12);
          }
          attacker.hitbox = null; 
       }
    }
  };

  const gameLoop = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    drawBackground(ctx, CANVAS_WIDTH, CANVAS_HEIGHT);

    const { player, enemy } = gameState.current;

    updateFighter(player, input, enemy);

    const aiInput = updateAI(enemy, player);
    updateFighter(enemy, aiInput, player);

    checkCombatCollisions(player, enemy);
    checkCombatCollisions(enemy, player);

    if (player.health <= 0 && player.state !== ActionState.KO) {
      player.state = ActionState.KO;
      player.health = 0;
      if (!gameState.current.isGameOver) {
        gameState.current.isGameOver = true;
        setTimeout(() => onGameOver('ENEMY'), 1000);
      }
    }
    if (enemy.health <= 0 && enemy.state !== ActionState.KO) {
      enemy.state = ActionState.KO;
      enemy.health = 0;
      if (!gameState.current.isGameOver) {
        gameState.current.isGameOver = true;
        setTimeout(() => onGameOver('PLAYER'), 1000);
      }
    }

    if (player.y < enemy.y) {
       drawFighter(ctx, player);
       drawFighter(ctx, enemy);
    } else {
       drawFighter(ctx, enemy);
       drawFighter(ctx, player);
    }

    updateParticles(ctx);

    const event = new CustomEvent('game-update', { detail: { p1: player, p2: enemy } });
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
