
import React from 'react';
import { ArrowLeft, ArrowRight, Zap } from 'lucide-react';

interface ControlsProps {
  onInput: (action: string, active: boolean) => void;
}

const Controls: React.FC<ControlsProps> = ({ onInput }) => {
  const handlePointer = (action: string, active: boolean) => (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onInput(action, active);
  };

  const Btn = ({
    action, icon, className,
  }: {
    action: string, icon?: React.ReactNode, className: string,
  }) => (
    <button
      className={`${className} rounded-full border border-white/20 shadow-lg active:scale-95 flex flex-col items-center justify-center transition-transform touch-none select-none backdrop-blur-sm relative z-50`}
      onPointerDown={handlePointer(action, true)}
      onPointerUp={handlePointer(action, false)}
      onPointerLeave={handlePointer(action, false)}
      onPointerCancel={handlePointer(action, false)}
      onContextMenu={(e) => e.preventDefault()}
      style={{ touchAction: 'none', WebkitTouchCallout: 'none', WebkitUserSelect: 'none', userSelect: 'none' }}
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
        fontFamily: '"Press Start 2P", cursive'
      }}
    >
      <span className="text-white text-base landscape:text-sm drop-shadow-md pt-0.5">{label}</span>
    </button>
  );

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex flex-col justify-end pb-2 landscape:pb-1 px-4 landscape:px-2 select-none touch-none">
      <div className="w-full flex justify-between items-end pb-safe">

        {/* LEFT: Movement */}
        <div className="pointer-events-auto flex flex-col gap-1 items-center pb-1">
          <div className="flex gap-2 landscape:gap-1">
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
          {/* Special button below movement */}
          <button
            className="pointer-events-auto w-28 landscape:w-24 h-9 landscape:h-8 bg-gradient-to-r from-yellow-500 to-amber-600 rounded-full shadow-[0_4px_15px_rgba(245,158,11,0.6)] border-2 border-yellow-400/50 active:shadow-none active:translate-y-1 flex items-center justify-center gap-1.5 touch-none select-none z-50"
            onPointerDown={handlePointer('special', true)}
            onPointerUp={handlePointer('special', false)}
            onPointerLeave={handlePointer('special', false)}
            onPointerCancel={handlePointer('special', false)}
            onContextMenu={(e) => e.preventDefault()}
            style={{
              touchAction: 'none',
              WebkitTouchCallout: 'none',
              WebkitUserSelect: 'none',
              userSelect: 'none',
              fontFamily: '"Press Start 2P", cursive'
            }}
          >
            <Zap size={12} className="text-yellow-200" />
            <span className="text-white text-[8px] drop-shadow-md">SPECIAL</span>
          </button>
        </div>

        {/* RIGHT: Combat */}
        <div className="pointer-events-auto relative w-[140px] h-[140px] landscape:w-[110px] landscape:h-[110px] mb-1 mr-1">
          {/* Top (Yellow) - Block */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 translate-y-1">
            <FaceBtn
              action="block"
              label="E"
              colorClass="bg-gradient-to-b from-yellow-400 to-orange-500"
              sizeClass="w-11 h-11 landscape:w-9 landscape:h-9"
            />
          </div>
          {/* Right (Orange) - Kick */}
          <div className="absolute top-1/2 right-0 -translate-y-1/2">
            <FaceBtn
              action="kick"
              label="W"
              colorClass="bg-gradient-to-b from-orange-400 to-red-600"
              sizeClass="w-11 h-11 landscape:w-9 landscape:h-9"
            />
          </div>
          {/* Left (Purple) - Takedown */}
          <div className="absolute top-1/2 left-0 -translate-y-1/2">
            <FaceBtn
              action="takedown"
              label="R"
              colorClass="bg-gradient-to-b from-purple-400 to-violet-600"
              sizeClass="w-11 h-11 landscape:w-9 landscape:h-9"
            />
          </div>
          {/* Bottom (Teal) - Punch */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
            <FaceBtn
              action="punch"
              label="Q"
              colorClass="bg-gradient-to-b from-teal-300 to-teal-500"
              sizeClass="w-14 h-14 landscape:w-11 landscape:h-11"
            />
          </div>
          {/* Center (Blue) - Dodge */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <FaceBtn
              action="dodge"
              label="S"
              colorClass="bg-gradient-to-b from-sky-400 to-blue-600"
              sizeClass="w-10 h-10 landscape:w-8 landscape:h-8"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Controls;
