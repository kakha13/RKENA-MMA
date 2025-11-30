
import React, { useEffect, useState } from 'react';

interface FighterStats {
  health: number;
  maxHealth: number;
  stamina: number;
  maxStamina: number;
}

const HUD: React.FC = () => {
  const [p1, setP1] = useState<FighterStats>({ health: 100, maxHealth: 100, stamina: 100, maxStamina: 100 });
  const [p2, setP2] = useState<FighterStats>({ health: 100, maxHealth: 100, stamina: 100, maxStamina: 100 });
  const [time, setTime] = useState(180);

  useEffect(() => {
    const handler = (e: any) => {
      const { p1, p2, time } = e.detail;
      setP1({ health: p1.health, maxHealth: p1.maxHealth, stamina: p1.stamina, maxStamina: p1.maxStamina });
      setP2({ health: p2.health, maxHealth: p2.maxHealth, stamina: p2.stamina, maxStamina: p2.maxStamina });
      setTime(time || 0);
    };
    window.addEventListener('game-update', handler);
    return () => window.removeEventListener('game-update', handler);
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `0${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="absolute top-2 md:top-4 left-0 w-full px-1 md:px-6 flex justify-center items-start pointer-events-none z-20" style={{ fontFamily: '"Press Start 2P", monospace' }}>
      <div className="flex w-full max-w-5xl items-stretch h-auto relative filter drop-shadow-lg md:scale-100 origin-top mx-auto">
        
        {/* LEFT SIDE (Player 1) */}
        <div className="flex-1 flex flex-col items-end relative mr-[-10px] md:mr-[-20px] z-10">
          {/* Skewed Name Bar */}
          <div className="w-full h-6 md:h-12 bg-[#d10d25] transform -skew-x-[20deg] flex items-center justify-end pr-4 md:pr-8 pl-2 md:pl-4 border-r-2 md:border-r-4 border-black/20">
            <h2 className="text-white text-[5px] md:text-[10px] uppercase transform skew-x-[20deg] truncate leading-tight">
              MERAB SHARIKADZE
            </h2>
          </div>
          
          {/* Health Bar */}
          <div className="w-[95%] h-1.5 md:h-2.5 mt-0.5 bg-gray-900 transform -skew-x-[20deg] overflow-hidden border border-white/20">
             <div 
               className="h-full bg-green-500 transition-all duration-200"
               style={{ width: `${(p1.health / p1.maxHealth) * 100}%` }}
             />
          </div>

          {/* Stamina Bar (Immediately below health) */}
          <div className="w-[60%] h-1 md:h-1.5 mt-0.5 bg-gray-900/80 transform -skew-x-[20deg] overflow-hidden">
             <div 
               className="h-full bg-blue-400 transition-all duration-200"
               style={{ width: `${(p1.stamina / p1.maxStamina) * 100}%` }}
             />
          </div>
        </div>

        {/* CENTER BLOCK */}
        <div className="w-[130px] md:w-[340px] shrink-0 z-20 flex relative -mt-0.5 md:-mt-1 h-8 md:h-14">
           {/* Center Black Background */}
           <div className="absolute inset-0 bg-black transform -skew-x-[20deg] border-x-2 md:border-x-4 border-white/10"></div>
           
           <div className="relative w-full h-full flex items-center justify-between px-2 md:px-6 text-white transform -skew-x-[20deg] overflow-hidden">
               
               {/* RKENA LOGO */}
               <div className="flex items-center gap-1 transform skew-x-[20deg]">
                  <span className="text-[6px] md:text-base">RKENA</span>
                  <div className="w-1.5 h-1.5 md:w-3 md:h-3 bg-[#d10d25]"></div>
               </div>

               {/* TIMER */}
               <div className="text-[8px] md:text-sm transform skew-x-[20deg]">
                  {formatTime(time)}
               </div>

               {/* ROUND INDICATOR */}
               <div className="bg-[#d10d25] px-1 md:px-1.5 py-0.5 transform skew-x-[0deg] ml-0.5 md:ml-1">
                  <span className="text-[5px] md:text-xs transform skew-x-[20deg] block">R1</span>
               </div>
           </div>
        </div>

        {/* RIGHT SIDE (Player 2) */}
        <div className="flex-1 flex flex-col items-start relative ml-[-10px] md:ml-[-20px] z-10">
          {/* Skewed Name Bar */}
          <div className="w-full h-6 md:h-12 bg-[#d10d25] transform -skew-x-[20deg] flex items-center justify-start pl-4 md:pl-8 pr-2 md:pr-4 border-l-2 md:border-l-4 border-black/20">
             <h2 className="text-white text-[5px] md:text-[10px] uppercase transform skew-x-[20deg] truncate leading-tight">
               JON JONES BOT
             </h2>
          </div>
          
          {/* Health Bar */}
          <div className="w-[95%] h-1.5 md:h-2.5 mt-0.5 bg-gray-900 transform -skew-x-[20deg] overflow-hidden border border-white/20 ml-auto">
             <div 
               className="h-full bg-yellow-500 transition-all duration-200 ml-auto"
               style={{ width: `${(p2.health / p2.maxHealth) * 100}%` }}
             />
          </div>

          {/* Stamina Bar (Immediately below health) */}
          <div className="w-[60%] h-1 md:h-1.5 mt-0.5 bg-gray-900/80 transform -skew-x-[20deg] overflow-hidden ml-auto">
             <div 
               className="h-full bg-blue-400 transition-all duration-200 ml-auto"
               style={{ width: `${(p2.stamina / p2.maxStamina) * 100}%` }}
             />
          </div>
        </div>

      </div>
    </div>
  );
};

export default HUD;
