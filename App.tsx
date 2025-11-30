
import React, { useState, useEffect, useCallback, useRef } from 'react';
import GameCanvas from './components/GameCanvas';
import HUD from './components/HUD';
import Controls from './components/Controls';
import { GameState, InputState } from './types';
import { Trophy, MonitorPlay, Maximize, Minimize, Volume2, VolumeX } from 'lucide-react';
import bgMusic from './assets/audio-bg.mp3';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [winner, setWinner] = useState<'PLAYER' | 'ENEMY' | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  
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

  // Background music - play when game starts
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.3;
      if (gameState === GameState.PLAYING) {
        audioRef.current.play().catch(() => {});
      }
    }
  }, [gameState]);

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !audioRef.current.muted;
      setIsMuted(!isMuted);
    }
  };

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
        case 'q': handleInput('punch', active); break;
        case 'w': handleInput('kick', active); break;
        case 'e': handleInput('block', active); break;
        case 'r': handleInput('takedown', active); break;
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
      
      {/* Background Music */}
      <audio ref={audioRef} src={bgMusic} loop />

      {/* Control Buttons - Always top right */}
      <div className="absolute top-2 right-2 z-[100] flex gap-1.5">
        {/* Mute Toggle Button */}
        <button 
          onClick={toggleMute}
          className="p-1.5 bg-gray-800/80 text-white rounded-full hover:bg-gray-700/80 transition-all backdrop-blur-sm border border-white/30 shadow-lg active:scale-95"
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>

        {/* Fullscreen Toggle Button */}
        <button 
          onClick={toggleFullScreen}
          className="p-1.5 bg-gray-800/80 text-white rounded-full hover:bg-gray-700/80 transition-all backdrop-blur-sm border border-white/30 shadow-lg active:scale-95"
          title="Toggle Fullscreen"
        >
          {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
        </button>
      </div>

      {/* Game Container */}
      <div className="relative w-full max-w-5xl h-full max-h-full aspect-video bg-black overflow-hidden">
        
        {/* Menu Screen */}
        {gameState === GameState.MENU && (
          <div className="absolute inset-0 bg-gradient-to-b from-black via-gray-900/95 to-black z-50 flex flex-col items-center justify-center text-center p-4 landscape:p-2 md:p-8 overflow-hidden">
            
            {/* Decorative background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-red-600/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-red-600/10 rounded-full blur-3xl"></div>
            </div>

            {/* RKENA Logo */}
            <div className="relative mb-6 landscape:mb-3 md:mb-10">
              <div className="absolute -inset-8 bg-red-600/20 rounded-full blur-3xl"></div>
              
              {/* Main Logo */}
              <div className="relative flex flex-col items-center">
                {/* RKE row */}
                <h1 
                  className="relative text-4xl landscape:text-3xl md:text-8xl font-black tracking-tight"
                  style={{fontFamily: '"Press Start 2P", monospace', color: '#e8e4d9', textShadow: '4px 4px 0 #000, -1px -1px 0 #000'}}
                >
                  RKE
                </h1>
                {/* NA row with red square */}
                <div className="flex items-end gap-1">
                  <h1 
                    className="relative text-4xl landscape:text-3xl md:text-8xl font-black tracking-tight"
                    style={{fontFamily: '"Press Start 2P", monospace', color: '#e8e4d9', textShadow: '4px 4px 0 #000, -1px -1px 0 #000'}}
                  >
                    NA
                  </h1>
                  <div className="w-6 h-6 landscape:w-5 landscape:h-5 md:w-12 md:h-12 bg-[#dc2626] mb-1 md:mb-2"></div>
                </div>
              </div>

              {/* Subtitle */}
              <div className="flex items-center justify-center gap-2 mt-3 md:mt-4">
                <div className="h-0.5 w-8 md:w-20 bg-gradient-to-r from-transparent to-red-500"></div>
                <span className="text-white/90 text-[10px] landscape:text-[9px] md:text-base font-bold tracking-[0.4em] uppercase">MMA CHAMPIONSHIP</span>
                <div className="h-0.5 w-8 md:w-20 bg-gradient-to-l from-transparent to-red-500"></div>
              </div>
            </div>
            
            {/* Controls - Desktop */}
            <div className="hidden md:block mb-6 p-4 bg-black/50 border border-white/10 rounded-lg backdrop-blur-sm">
              <p className="text-red-400 font-bold mb-3 tracking-widest text-sm">⌨️ CONTROLS</p>
              <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-left text-sm">
                <span className="text-gray-500">[<span className="text-white font-bold">← →</span>]</span> <span className="text-gray-300">MOVE</span>
                <span className="text-gray-500">[<span className="text-teal-400 font-bold">Q</span>]</span> <span className="text-gray-300">PUNCH</span>
                <span className="text-gray-500">[<span className="text-purple-400 font-bold">W</span>]</span> <span className="text-gray-300">KICK</span>
                <span className="text-gray-500">[<span className="text-yellow-400 font-bold">E</span>]</span> <span className="text-gray-300">BLOCK</span>
                <span className="text-gray-500">[<span className="text-red-400 font-bold">R</span>]</span> <span className="text-gray-300">TAKEDOWN</span>
              </div>
            </div>

            {/* Mobile hint */}
            <div className="md:hidden text-gray-400 mb-3 landscape:mb-2 text-xs landscape:text-[10px] flex items-center gap-2">
              <span className="text-xl">👆</span>
              <span>Use on-screen controls to Fight!</span>
            </div>

            {/* Fight Button */}
            <button 
              onClick={startGame}
              className="group relative px-10 py-4 landscape:px-6 landscape:py-2 md:px-16 md:py-5 bg-gradient-to-r from-[#d10d25] via-red-600 to-[#d10d25] text-white font-black text-xl landscape:text-base md:text-3xl uppercase tracking-widest hover:brightness-125 active:scale-95 transition-all border-b-4 landscape:border-b-2 border-[#8a0918] hover:border-b-2 hover:translate-y-[2px] shadow-[0_4px_30px_rgba(209,13,37,0.5)] touch-manipulation"
              style={{fontFamily: '"Press Start 2P", monospace'}}
            >
              <div className="flex items-center gap-3">
                <span>🥊</span>
                <span>FIGHT!</span>
                <span>🥊</span>
              </div>
            </button>

            {/* Donate */}
            <a 
              href="https://www.kisa.ge/donate/kakha13" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="mt-4 landscape:mt-2 md:mt-8 px-4 py-2 landscape:px-3 landscape:py-1 md:px-6 md:py-3 text-white/70 hover:text-white font-bold text-xs landscape:text-[10px] md:text-sm uppercase tracking-wider transition-all active:scale-95 flex items-center gap-2 border border-white/20 rounded hover:border-white/40 hover:bg-white/5"
            >
              <span>🎁</span> დონაცია
            </a>
          </div>
        )}

        {/* Victory/Game Over Screen */}
        {(gameState === GameState.VICTORY || gameState === GameState.GAMEOVER) && (
          <div className="absolute inset-0 bg-gradient-to-b from-black/95 via-black/90 to-black/95 z-50 flex flex-col items-center justify-center p-4">
            
            {/* Dramatic KO/Victory Badge */}
            <div className={`relative mb-4 landscape:mb-2 md:mb-6 ${gameState === GameState.VICTORY ? 'animate-bounce' : 'animate-pulse'}`}>
              {gameState === GameState.VICTORY ? (
                <div className="relative">
                  <Trophy className="w-16 h-16 landscape:w-12 landscape:h-12 md:w-28 md:h-28 text-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,0.5)]" />
                  <div className="absolute -inset-2 bg-yellow-400/20 rounded-full blur-xl -z-10"></div>
                </div>
              ) : (
                <div className="relative">
                  <div className="w-20 h-20 landscape:w-16 landscape:h-16 md:w-32 md:h-32 bg-gradient-to-br from-red-600 to-red-900 rounded-full flex items-center justify-center border-4 md:border-8 border-red-500 shadow-[0_0_40px_rgba(220,38,38,0.6)]">
                    <span className="text-white text-2xl landscape:text-xl md:text-5xl font-black tracking-tight drop-shadow-lg" style={{fontFamily: '"Press Start 2P", monospace'}}>KO</span>
                  </div>
                  <div className="absolute -inset-4 bg-red-600/30 rounded-full blur-2xl -z-10 animate-pulse"></div>
                </div>
              )}
            </div>
            
            {/* Main Title */}
            <h2 
              className={`text-3xl landscape:text-2xl md:text-6xl font-black mb-2 landscape:mb-1 md:mb-4 tracking-tight ${
                gameState === GameState.VICTORY 
                  ? 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 drop-shadow-[0_2px_10px_rgba(250,204,21,0.5)]' 
                  : 'text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-red-500 to-red-600 drop-shadow-[0_2px_10px_rgba(220,38,38,0.5)]'
              }`}
              style={{fontFamily: '"Press Start 2P", monospace'}}
            >
              {gameState === GameState.VICTORY ? 'VICTORY!' : 'KNOCKOUT!'}
            </h2>

            {/* Subtitle */}
            <p className={`text-sm landscape:text-xs md:text-xl mb-6 landscape:mb-3 md:mb-8 font-bold tracking-widest ${
              gameState === GameState.VICTORY ? 'text-yellow-200/80' : 'text-red-300/80'
            }`}>
              {gameState === GameState.VICTORY ? '🏆 CHAMPION 🏆' : '💀 DEFEATED 💀'}
            </p>

            {/* Rematch Button */}
            <button 
              onClick={startGame}
              className="group relative px-8 py-3 landscape:px-5 landscape:py-2 md:px-12 md:py-4 bg-gradient-to-r from-[#d10d25] to-[#ff1a3d] text-white font-black text-lg landscape:text-base md:text-2xl uppercase tracking-widest hover:brightness-125 active:scale-95 transition-all border-b-4 border-[#8a0918] hover:border-b-2 hover:translate-y-[2px] shadow-[0_4px_20px_rgba(209,13,37,0.4)]"
              style={{fontFamily: '"Press Start 2P", monospace'}}
            >
              <span className="relative z-10">⚔️ REMATCH ⚔️</span>
            </button>

            {/* Donate Button */}
            <a 
              href="https://www.kisa.ge/donate/kakha13" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="mt-4 landscape:mt-2 md:mt-8 px-4 py-2 landscape:px-3 landscape:py-1 md:px-6 md:py-3 text-white/80 hover:text-white font-bold text-xs landscape:text-[10px] md:text-base uppercase tracking-wider transition-colors active:scale-95 flex items-center gap-2 border border-white/20 rounded hover:border-white/40 hover:bg-white/5"
            >
              <span>🎁</span> დონაცია
            </a>
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
