
import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface ControlsProps {
  onInput: (action: string, active: boolean) => void;
}

const Controls: React.FC<ControlsProps> = ({ onInput }) => {
  // Use Pointer Events for robust cross-platform handling (mouse + touch)
  const handlePointer = (action: string, active: boolean) => (e: React.PointerEvent) => {
    // Prevent defaults to avoid scrolling/zooming/context menus
    e.preventDefault();
    e.stopPropagation();
    onInput(action, active);
  };

  const Btn = ({ 
    action, 
    icon, 
    className,
  }: { 
    action: string, 
    icon?: React.ReactNode, 
    className: string,
  }) => (
    <button
      className={`${className} rounded-full border border-white/20 shadow-lg active:scale-95 flex flex-col items-center justify-center transition-transform touch-none select-none backdrop-blur-sm relative z-50`}
      onPointerDown={handlePointer(action, true)}
      onPointerUp={handlePointer(action, false)}
      onPointerLeave={handlePointer(action, false)}
      onPointerCancel={handlePointer(action, false)}
      onContextMenu={(e) => e.preventDefault()}
      style={{ 
          touchAction: 'none', 
          WebkitTouchCallout: 'none',
          WebkitUserSelect: 'none',
          userSelect: 'none'
      }} 
    >
      {icon}
    </button>
  );

  const FaceBtn = ({ 
      action, label, colorClass, sizeClass = "w-14 h-14"
  }: { 
      action: string, label: string, colorClass: string, sizeClass?: string 
  }) => (
    <button
      className={`${sizeClass} ${colorClass} rounded-full shadow-[0_4px_10px_rgba(0,0,0,0.5)] border-2 border-white/20 active:shadow-none active:translate-y-1 active:brightness-110 flex items-center justify-center transition-all touch-none select-none z-50`}
      onPointerDown={handlePointer(action, true)}
      onPointerUp={handlePointer(action, false)}
      onPointerLeave={handlePointer(action, false)}
      onPointerCancel={handlePointer(action, false)}
      onContextMenu={(e) => e.preventDefault()}
      style={{ 
          touchAction: 'none', 
          WebkitTouchCallout: 'none',
          WebkitUserSelect: 'none',
          userSelect: 'none',
          fontFamily: '"Press Start 2P", cursive' // Enforce Pixel Font
      }}
    >
        <span className="text-white text-lg landscape:text-sm drop-shadow-md pt-0.5">{label}</span>
    </button>
  );

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex flex-col justify-end pb-2 landscape:pb-1 px-4 landscape:px-2 select-none touch-none">
      
      {/* Container for controls at bottom of screen */}
      <div className="w-full flex justify-between items-end pb-safe">
        
        {/* LEFT ZONE: Movement (Arrows) */}
        <div className="pointer-events-auto flex gap-2 landscape:gap-1 items-end pl-1 pb-1">
          <Btn 
            action="left" 
            className="w-14 h-14 landscape:w-12 landscape:h-12 bg-gray-800/80 active:bg-gray-700 text-white" 
            icon={<ArrowLeft size={28} className="landscape:w-6 landscape:h-6" />} 
          />
          <Btn 
            action="right" 
            className="w-14 h-14 landscape:w-12 landscape:h-12 bg-gray-800/80 active:bg-gray-700 text-white" 
            icon={<ArrowRight size={28} className="landscape:w-6 landscape:h-6" />} 
          />
        </div>

        {/* RIGHT ZONE: Combat Layout (Closer Cluster) */}
        <div className="pointer-events-auto relative w-[140px] h-[140px] landscape:w-[110px] landscape:h-[110px] mb-1 mr-1">
            
            {/* Top (Yellow) - Block -> Keyboard E */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 translate-y-1">
                <FaceBtn 
                    action="block" 
                    label="E" 
                    colorClass="bg-gradient-to-b from-yellow-400 to-orange-500" 
                    sizeClass="w-11 h-11 landscape:w-9 landscape:h-9"
                />
            </div>

            {/* Right (Red) - Kick -> Keyboard W */}
            <div className="absolute top-1/2 right-0 -translate-y-1/2 -translate-x-0">
                <FaceBtn 
                    action="kick" 
                    label="W" 
                    colorClass="bg-gradient-to-b from-red-400 to-rose-600" 
                    sizeClass="w-11 h-11 landscape:w-9 landscape:h-9"
                />
            </div>

            {/* Left (Purple) - Takedown -> Keyboard R */}
            <div className="absolute top-1/2 left-0 -translate-y-1/2 translate-x-0">
                <FaceBtn 
                    action="takedown" 
                    label="R" 
                    colorClass="bg-gradient-to-b from-purple-400 to-violet-600" 
                    sizeClass="w-11 h-11 landscape:w-9 landscape:h-9"
                />
            </div>

            {/* Bottom (Teal) - Punch -> Keyboard Q */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 -translate-y-0">
                <FaceBtn 
                    action="punch" 
                    label="Q" 
                    colorClass="bg-gradient-to-b from-teal-300 to-teal-500" 
                    sizeClass="w-14 h-14 landscape:w-11 landscape:h-11"
                />
            </div>
        </div>

      </div>
    </div>
  );
};

export default Controls;
