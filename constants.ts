
export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 450;
export const GROUND_Y = 400; // Lowered ground to fit taller fighters

export const GRAVITY = 0; 
export const MOVE_SPEED = 6.0; // Reduced from 4.5 for slower pace
export const FRICTION = 0.8;

// Made fighters significantly larger
export const FIGHTER_WIDTH = 100;
export const FIGHTER_HEIGHT = 180;

// REDUCED DAMAGE BY ~50%
export const DAMAGE_PUNCH = 4;
export const DAMAGE_KICK = 6;
export const DAMAGE_TAKEDOWN = 12; 

export const STAMINA_COST_PUNCH = 8;
export const STAMINA_COST_KICK = 15;
export const STAMINA_COST_TAKEDOWN = 18; 
export const STAMINA_REGEN = 0.5; // Faster regen for more action

// INCREASED FRAME DURATIONS (Slower Gameplay)
export const HIT_STUN_FRAMES = 40;
export const SLAMMED_FRAMES = 100;
export const PUNCH_FRAMES = 20; 
export const KICK_FRAMES = 20;
export const TAKEDOWN_FRAMES = 20;
export const SPRAWL_FRAMES = 20;
export const BLOCK_COOLDOWN = 30;

// Colors
export const COLOR_SKIN_P1 = '#ffccaa';
export const COLOR_SHORTS_P1 = '#b00219'; // Deep Red (Georgian Style)
export const COLOR_SKIN_P2 = '#5d4037'; // Dark Skin (Jon Jones)
export const COLOR_SHORTS_P2 = '#1f2937'; // Dark Grey (UFC Style)
export const COLOR_BG = '#333333';
export const COLOR_FENCE = '#555555';
