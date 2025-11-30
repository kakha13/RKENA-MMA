
import React, { useEffect, useState } from 'react';
import { Fighter } from '../types';

interface FighterStats {
  health: number;
  maxHealth: number;
  stamina: number;
  maxStamina: number;
}

const HUD: React.FC = () => {
  const [p1, setP1] = useState<FighterStats>({ health: 100, maxHealth: 100, stamina: 100, maxStamina: 100 });
  const [p2, setP2] = useState<FighterStats>({ health: 100, maxHealth: 100, stamina: 100, maxStamina: 100 });

  useEffect(() => {
    const handler = (e: any) => {
      const { p1, p2 } = e.detail;
      setP1({ health: p1.health, maxHealth: p1.maxHealth, stamina: p1.stamina, maxStamina: p1.maxStamina });
      setP2({ health: p2.health, maxHealth: p2.maxHealth, stamina: p2.stamina, maxStamina: p2.maxStamina });
    };
    window.addEventListener('game-update', handler);
    return () => window.removeEventListener('game-update', handler);
  }, []);

  const Bar = ({ value, max, color, label }: { value: number, max: number, color: string, label?: string }) => (
    <div className="w-full mb-1">
      {label && <div className="hidden md:block text-[10px] text-white mb-0.5 uppercase tracking-widest text-shadow">{label}</div>}
      <div className="w-full h-3 md:h-4 bg-gray-800 border-2 border-gray-600 relative skew-x-[-10deg]">
        <div 
          className={`h-full ${color} transition-all duration-100 ease-linear`} 
          style={{ width: `${Math.max(0, (value / max) * 100)}%` }}
        />
      </div>
    </div>
  );

  return (
    <div className="absolute top-0 left-0 w-full p-2 md:p-4 flex justify-between items-start pointer-events-none z-20">
      {/* Player 1 */}
      <div className="w-5/12 max-w-[300px]">
        <h2 className="text-yellow-400 text-xs md:text-lg font-bold mb-1 drop-shadow-md truncate">MERAB SHARIKADZE</h2>
        <Bar value={p1.health} max={p1.maxHealth} color="bg-green-500" />
        <Bar value={p1.stamina} max={p1.maxStamina} color="bg-blue-400" />
      </div>

      {/* VS Badge */}
      <div className="mt-1 md:mt-2 shrink-0 px-2">
        <div className="bg-red-600 text-white font-black text-sm md:text-2xl border-2 md:border-4 border-white rounded-full w-10 h-10 md:w-16 md:h-16 flex items-center justify-center shadow-lg">
          VS
        </div>
      </div>

      {/* Player 2 */}
      <div className="w-5/12 max-w-[300px] text-right">
        <h2 className="text-red-500 text-xs md:text-lg font-bold mb-1 drop-shadow-md truncate">JON JONES BOT</h2>
        <div className="flex flex-col items-end">
          <Bar value={p2.health} max={p2.maxHealth} color="bg-yellow-500" />
          <Bar value={p2.stamina} max={p2.maxStamina} color="bg-blue-400" />
        </div>
      </div>
    </div>
  );
};

export default HUD;
