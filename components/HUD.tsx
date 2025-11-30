
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
    <div className="absolute top-4 left-0 w-full px-2 md:px-6 flex justify-center items-start pointer-events-none z-20 font-sans">
      <div className="flex w-full max-w-5xl items-stretch h-auto relative filter drop-shadow-lg">
        
        {/* LEFT SIDE (Player 1) */}
        <div className="flex-1 flex flex-col items-end relative mr-[-20px] z-10">
          {/* Skewed Name Bar */}
          <div className="w-full h-8 md:h-12 bg-[#d10d25] transform -skew-x-[20deg] flex items-center justify-end pr-8 pl-4 border-r-4 border-black/20">
            <h2 className="text-white text-sm md:text-xl font-black uppercase tracking-tighter transform skew-x-[20deg] truncate">
              MERAB SHARIKADZE
            </h2>
          </div>
          
          {/* Health Bar */}
          <div className="w-[95%] h-2 mt-1 bg-gray-900 transform -skew-x-[20deg] overflow-hidden border border-white/20">
             <div 
               className="h-full bg-green-500 transition-all duration-200"
               style={{ width: `${(p1.health / p1.maxHealth) * 100}%` }}
             />
          </div>

          {/* Stamina Bar */}
          <div className="w-[60%] h-1.5 mt-1 bg-gray-900/80 transform -skew-x-[20deg] overflow-hidden">
             <div 
               className="h-full bg-blue-400 transition-all duration-200"
               style={{ width: `${(p1.stamina / p1.maxStamina) * 100}%` }}
             />
          </div>
        </div>

        {/* CENTER BLOCK */}
        <div className="w-[280px] md:w-[340px] shrink-0 z-20 flex relative -mt-1 h-10 md:h-14">
           {/* Center Black Background */}
           <div className="absolute inset-0 bg-black transform -skew-x-[20deg] border-x-4 border-white/10"></div>
           
           <div className="relative w-full h-full flex items-center justify-between px-4 md:px-6 text-white transform -skew-x-[20deg] overflow-hidden">
               
               {/* RKENA LOGO */}
               <div className="flex items-center gap-1 transform skew-x-[20deg]">
                  <span className="font-black text-lg md:text-3xl tracking-tighter">RKENA</span>
                  <div className="w-2 h-2 md:w-4 md:h-4 bg-[#d10d25]"></div>
               </div>

               {/* TIMER */}
               <div className="font-mono font-bold text-lg md:text-3xl tracking-widest transform skew-x-[20deg]">
                  {formatTime(time)}
               </div>

               {/* ROUND INDICATOR */}
               <div className="bg-[#d10d25] px-2 py-0.5 md:py-1 transform skew-x-[0deg] ml-2">
                  <span className="font-bold text-xs md:text-lg transform skew-x-[20deg] block">R1</span>
               </div>
           </div>
        </div>

        {/* RIGHT SIDE (Player 2) */}
        <div className="flex-1 flex flex-col items-start relative ml-[-20px] z-10">
          {/* Skewed Name Bar */}
          <div className="w-full h-8 md:h-12 bg-[#d10d25] transform -skew-x-[20deg] flex items-center justify-start pl-8 pr-4 border-l-4 border-black/20">
             <h2 className="text-white text-sm md:text-xl font-black uppercase tracking-tighter transform skew-x-[20deg] truncate">
               JON JONES BOT
             </h2>
          </div>
          
          {/* Health Bar */}
          <div className="w-[95%] h-2 mt-1 bg-gray-900 transform -skew-x-[20deg] overflow-hidden border border-white/20 ml-auto">
             <div 
               className="h-full bg-yellow-500 transition-all duration-200 ml-auto"
               style={{ width: `${(p2.health / p2.maxHealth) * 100}%` }}
             />
          </div>

          {/* Stamina Bar */}
          <div className="w-[60%] h-1.5 mt-1 bg-gray-900/80 transform -skew-x-[20deg] overflow-hidden ml-auto">
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
