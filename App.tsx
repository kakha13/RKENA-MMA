
import React, { useState, useEffect, useCallback } from 'react';
import GameCanvas from './components/GameCanvas';
import HUD from './components/HUD';
import Controls from './components/Controls';
import { GameState, InputState } from './types';
import { Trophy, Skull, MonitorPlay, Maximize, Minimize } from 'lucide-react';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [winner, setWinner] = useState<'PLAYER' | 'ENEMY' | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Input State
  const [input, setInput] = useState<InputState>({
    left: false, right: false, punch: false, kick: false, block: false, takedown: false
  });

  const handleInput = useCallback((action: string, active: boolean) => {
    setInput(prev => ({ ...prev, [action]: active }));
  }, []);

  // Fullscreen Listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error("Error attempting to enable fullscreen mode:", err);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  // Keyboard Listeners
  useEffect(() => {
    const handleKey = (e: KeyboardEvent, active: boolean) => {
      if (gameState !== GameState.PLAYING) return;
      
      switch (e.key.toLowerCase()) {
        case 'arrowleft': handleInput('left', active); break;
        case 'arrowright': handleInput('right', active); break;
        case 'z': handleInput('punch', active); break;
        case 'x': handleInput('kick', active); break;
        case 'c': handleInput('block', active); break;
        case 'v': handleInput('takedown', active); break;
        case 'arrowdown': handleInput('takedown', active); break;
      }
    };

    const down = (e: KeyboardEvent) => handleKey(e, true);
    const up = (e: KeyboardEvent) => handleKey(e, false);

    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, [gameState, handleInput]);

  const handleGameOver = (win: 'PLAYER' | 'ENEMY') => {
    setWinner(win);
    setGameState(win === 'PLAYER' ? GameState.VICTORY : GameState.GAMEOVER);
  };

  const startGame = () => {
    setGameState(GameState.PLAYING);
    setWinner(null);
  };

  return (
    <div className="w-full h-[100dvh] bg-black flex items-center justify-center overflow-hidden relative">
      
      {/* Fullscreen Toggle Button */}
      <button 
        onClick={toggleFullScreen}
        className="absolute top-3 right-3 z-[100] p-2 bg-gray-800/60 text-white rounded-full hover:bg-gray-700/80 transition-all backdrop-blur-sm border border-white/20 shadow-lg active:scale-95"
        title="Toggle Fullscreen"
      >
        {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
      </button>

      {/* Game Container */}
      <div className="relative w-full max-w-5xl h-full max-h-full aspect-video bg-gray-900 shadow-2xl overflow-hidden border-y-4 md:border-8 border-gray-800 md:rounded-lg">
        
        {/* Menu Screen */}
        {gameState === GameState.MENU && (
          <div className="absolute inset-0 bg-black/90 z-50 flex flex-col items-center justify-center text-center p-4 md:p-8">
            <h1 className="text-4xl md:text-6xl font-bold text-red-600 mb-6 md:mb-8 tracking-tighter drop-shadow-[4px_4px_0_rgba(180,180,180,0.2)]">
              RKENA MMA
              <br/>
              <span className="text-2xl md:text-3xl text-white">CHAMPIONSHIP</span>
            </h1>
            
            <div className="hidden md:block space-y-4 mb-8 text-gray-400 font-mono">
              <p>CONTROLS:</p>
              <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-left">
                <span>[<span className="text-white">←</span> / <span className="text-white">→</span>]</span> <span>MOVE</span>
                <span>[<span className="text-white">Z</span>]</span> <span>PUNCH</span>
                <span>[<span className="text-white">X</span>]</span> <span>KICK</span>
                <span>[<span className="text-white">C</span>]</span> <span>BLOCK</span>
                <span>[<span className="text-white">V</span>]</span> <span>TAKEDOWN</span>
              </div>
            </div>

            <div className="md:hidden text-gray-400 mb-8 text-sm max-w-[200px] leading-relaxed">
              Use on-screen controls to Fight!
            </div>

            <button 
              onClick={startGame}
              className="group relative px-8 py-4 bg-red-600 text-white font-bold text-xl uppercase tracking-widest hover:bg-red-500 transition-colors border-b-4 border-red-800 active:border-b-0 active:translate-y-1 touch-manipulation"
            >
              <div className="flex items-center gap-2">
                <MonitorPlay className="w-6 h-6" />
                Fight!
              </div>
            </button>
          </div>
        )}

        {/* Victory/Game Over Screen */}
        {(gameState === GameState.VICTORY || gameState === GameState.GAMEOVER) && (
          <div className="absolute inset-0 bg-black/80 z-50 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300">
            {gameState === GameState.VICTORY ? (
              <Trophy className="w-20 h-20 md:w-24 md:h-24 text-yellow-400 mb-4 animate-bounce" />
            ) : (
              <Skull className="w-20 h-20 md:w-24 md:h-24 text-gray-500 mb-4" />
            )}
            
            <h2 className={`text-4xl md:text-5xl font-bold mb-8 ${gameState === GameState.VICTORY ? 'text-green-500' : 'text-red-600'}`}>
              {gameState === GameState.VICTORY ? 'YOU WIN!' : 'K.O.'}
            </h2>

            <button 
              onClick={startGame}
              className="px-6 py-3 bg-white text-black font-bold text-lg uppercase tracking-wider hover:bg-gray-200 active:scale-95 transition-transform"
            >
              Rematch
            </button>
          </div>
        )}

        {/* Active Game Layer */}
        {gameState === GameState.PLAYING && (
          <>
            <HUD />
            <GameCanvas onGameOver={handleGameOver} input={input} />
          </>
        )}
      </div>

      {/* Mobile Controls Layer (Outside game container for maximizing space usage) */}
      {gameState === GameState.PLAYING && (
        <div className="md:hidden">
          <Controls onInput={handleInput} />
        </div>
      )}
    </div>
  );
};

export default App;
