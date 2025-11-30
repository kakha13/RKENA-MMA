
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
        <span className="text-white text-xl drop-shadow-md pt-1">{label}</span>
    </button>
  );

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex flex-col justify-end pb-6 px-6 select-none touch-none">
      
      {/* Container for controls at bottom of screen */}
      <div className="w-full flex justify-between items-end pb-safe">
        
        {/* LEFT ZONE: Movement (Arrows) */}
        <div className="pointer-events-auto flex gap-4 items-end pl-2 pb-2">
          <Btn 
            action="left" 
            className="w-16 h-16 bg-gray-800/80 active:bg-gray-700 text-white" 
            icon={<ArrowLeft size={32} />} 
          />
          <Btn 
            action="right" 
            className="w-16 h-16 bg-gray-800/80 active:bg-gray-700 text-white" 
            icon={<ArrowRight size={32} />} 
          />
        </div>

        {/* RIGHT ZONE: Combat Layout (Closer Cluster) */}
        <div className="pointer-events-auto relative w-[170px] h-[170px] mb-1 mr-1">
            
            {/* Top (Yellow) - Block -> Keyboard C */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 translate-y-2">
                <FaceBtn 
                    action="block" 
                    label="C" 
                    colorClass="bg-gradient-to-b from-yellow-400 to-orange-500" 
                />
            </div>

            {/* Right (Red) - Kick -> Keyboard X */}
            <div className="absolute top-1/2 right-0 -translate-y-1/2 -translate-x-1">
                <FaceBtn 
                    action="kick" 
                    label="X" 
                    colorClass="bg-gradient-to-b from-red-400 to-rose-600" 
                />
            </div>

            {/* Left (Purple) - Takedown -> Keyboard V */}
            <div className="absolute top-1/2 left-0 -translate-y-1/2 translate-x-1">
                <FaceBtn 
                    action="takedown" 
                    label="V" 
                    colorClass="bg-gradient-to-b from-purple-400 to-violet-600" 
                />
            </div>

            {/* Bottom (Teal) - Punch -> Keyboard Z */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 -translate-y-1">
                <FaceBtn 
                    action="punch" 
                    label="Z" 
                    colorClass="bg-gradient-to-b from-teal-300 to-teal-500" 
                    sizeClass="w-20 h-20"
                />
            </div>
        </div>

      </div>
    </div>
  );
};

export default Controls;
