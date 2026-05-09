
import React, { useState, useEffect, useCallback, useRef } from 'react';
import GameCanvas from './components/GameCanvas';
import HUD from './components/HUD';
import Controls from './components/Controls';
import { GameState, InputState, Difficulty, CharacterConfig } from './types';
import { PLAYER_CHARACTERS, ENEMY_CHARACTERS, DIFFICULTY_SETTINGS, ROUNDS_TO_WIN, MAX_ROUNDS } from './constants';
import { Trophy, Maximize, Minimize, Volume2, VolumeX, Shield, Zap, Swords } from 'lucide-react';
import bgMusic from './assets/audio-bg.mp3';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [selectedPlayerChar, setSelectedPlayerChar] = useState<CharacterConfig>(PLAYER_CHARACTERS[0]);
  const [selectedEnemyChar, setSelectedEnemyChar] = useState<CharacterConfig>(ENEMY_CHARACTERS[0]);
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.MEDIUM);
  const [roundsWon, setRoundsWon] = useState({ player: 0, enemy: 0 });
  const [currentRound, setCurrentRound] = useState(1);
  const [roundResult, setRoundResult] = useState<{ winner: 'PLAYER' | 'ENEMY' | 'DRAW'; method: string } | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [gameKey, setGameKey] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const [input, setInput] = useState<InputState>({
    left: false, right: false, punch: false, kick: false, block: false, takedown: false, special: false
  });

  const handleInput = useCallback((action: string, active: boolean) => {
    setInput(prev => ({ ...prev, [action]: active }));
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

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
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen?.();
    }
  };

  // Keyboard listeners
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
        case 'a': handleInput('special', active); break;
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

  const handleRoundEnd = (winner: 'PLAYER' | 'ENEMY' | 'DRAW') => {
    const newRoundsWon = {
      player: roundsWon.player + (winner === 'PLAYER' ? 1 : 0),
      enemy: roundsWon.enemy + (winner === 'ENEMY' ? 1 : 0)
    };
    setRoundResult({ winner, method: winner === 'DRAW' ? 'DECISION' : 'KO' });
    setRoundsWon(newRoundsWon);
    setGameState(GameState.ROUND_TRANSITION);

    // Determine if match is over
    const matchOver = newRoundsWon.player >= ROUNDS_TO_WIN || newRoundsWon.enemy >= ROUNDS_TO_WIN ||
      currentRound >= MAX_ROUNDS;

    setTimeout(() => {
      if (newRoundsWon.player >= ROUNDS_TO_WIN) {
        setGameState(GameState.VICTORY);
      } else if (newRoundsWon.enemy >= ROUNDS_TO_WIN) {
        setGameState(GameState.GAMEOVER);
      } else if (matchOver) {
        // Final round draw or tiebreaker - more points wins
        setGameState(newRoundsWon.player >= newRoundsWon.enemy ? GameState.VICTORY : GameState.GAMEOVER);
      } else {
        // Next round
        setCurrentRound(r => r + 1);
        setGameKey(k => k + 1);
        setGameState(GameState.PLAYING);
      }
    }, 3500);
  };

  const startGame = () => {
    setRoundsWon({ player: 0, enemy: 0 });
    setCurrentRound(1);
    setRoundResult(null);
    setGameKey(k => k + 1);
    setGameState(GameState.PLAYING);
  };

  const goToCharacterSelect = () => setGameState(GameState.CHARACTER_SELECT);
  const goToMenu = () => setGameState(GameState.MENU);

  const diffSettings = DIFFICULTY_SETTINGS[difficulty];

  return (
    <div className="w-full h-[100dvh] bg-black flex items-center justify-center overflow-hidden relative">
      <audio ref={audioRef} src={bgMusic} loop />

      {/* Control Buttons */}
      <div className="absolute top-2 right-2 z-[100] flex gap-1.5">
        <button
          onClick={toggleMute}
          className="p-1.5 bg-gray-800/80 text-white rounded-full hover:bg-gray-700/80 transition-all backdrop-blur-sm border border-white/30 shadow-lg active:scale-95"
        >
          {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
        <button
          onClick={toggleFullScreen}
          className="p-1.5 bg-gray-800/80 text-white rounded-full hover:bg-gray-700/80 transition-all backdrop-blur-sm border border-white/30 shadow-lg active:scale-95"
        >
          {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
        </button>
      </div>

      {/* Game Container */}
      <div className="relative w-full max-w-5xl h-full max-h-full aspect-video bg-black overflow-hidden">

        {/* ===================== MENU ===================== */}
        {gameState === GameState.MENU && (
          <div className="absolute inset-0 bg-gradient-to-b from-black via-gray-900/95 to-black z-50 flex flex-col items-center justify-center text-center p-4 overflow-hidden">
            <div className="absolute top-4 left-4 z-50">
              <a
                href="https://www.kisa.ge/donate/kakha13"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 text-white/70 hover:text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 border border-white/20 rounded hover:border-white/40"
                style={{ fontFamily: '"Press Start 2P", monospace' }}
              >
                🎁 DONATE
              </a>
            </div>

            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-red-600/10 rounded-full blur-3xl" />
              <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-red-600/10 rounded-full blur-3xl" />
            </div>

            {/* Logo */}
            <div className="relative mb-5 landscape:mb-3">
              <div className="absolute -inset-8 bg-red-600/20 rounded-full blur-3xl" />
              <div className="relative flex flex-col items-center">
                <h1
                  className="text-4xl landscape:text-3xl md:text-8xl font-black tracking-tight"
                  style={{ fontFamily: '"Press Start 2P", monospace', color: '#e8e4d9', textShadow: '4px 4px 0 #000' }}
                >
                  RKE
                </h1>
                <div className="flex items-end gap-1">
                  <h1
                    className="text-4xl landscape:text-3xl md:text-8xl font-black tracking-tight"
                    style={{ fontFamily: '"Press Start 2P", monospace', color: '#e8e4d9', textShadow: '4px 4px 0 #000' }}
                  >
                    NA
                  </h1>
                  <div className="w-6 h-6 landscape:w-5 landscape:h-5 md:w-12 md:h-12 bg-[#dc2626] mb-1 md:mb-2" />
                </div>
              </div>
              <div className="flex items-center justify-center gap-2 mt-2">
                <div className="h-0.5 w-8 md:w-20 bg-gradient-to-r from-transparent to-red-500" />
                <span className="text-white/90 text-[9px] md:text-sm font-bold tracking-[0.4em] uppercase" style={{ fontFamily: '"Press Start 2P", monospace' }}>MMA CHAMPIONSHIP</span>
                <div className="h-0.5 w-8 md:w-20 bg-gradient-to-l from-transparent to-red-500" />
              </div>
            </div>

            {/* Controls hint */}
            <div className="hidden portrait:block md:block mb-4 p-3 bg-black/50 border border-white/10 rounded-lg backdrop-blur-sm" style={{ fontFamily: '"Press Start 2P", monospace' }}>
              <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-left text-xs">
                <span className="text-gray-500">[<span className="text-white">← →</span>]</span><span className="text-gray-300">MOVE</span>
                <span className="text-gray-500">[<span className="text-teal-400">Q</span>]</span><span className="text-gray-300">PUNCH</span>
                <span className="text-gray-500">[<span className="text-orange-400">W</span>]</span><span className="text-gray-300">KICK</span>
                <span className="text-gray-500">[<span className="text-yellow-400">E</span>]</span><span className="text-gray-300">BLOCK</span>
                <span className="text-gray-500">[<span className="text-purple-400">R</span>]</span><span className="text-gray-300">TAKEDOWN</span>
                <span className="text-gray-500">[<span className="text-yellow-300">A</span>]</span><span className="text-yellow-200">SPECIAL ⚡</span>
              </div>
            </div>

            <button
              onClick={goToCharacterSelect}
              className="px-10 py-4 landscape:px-6 landscape:py-2 md:px-16 md:py-5 bg-gradient-to-r from-[#d10d25] via-red-600 to-[#d10d25] text-white font-black text-xl landscape:text-base md:text-3xl uppercase tracking-widest hover:brightness-125 active:scale-95 transition-all border-b-4 border-[#8a0918] hover:border-b-2 hover:translate-y-[2px] shadow-[0_4px_30px_rgba(209,13,37,0.5)] touch-manipulation"
              style={{ fontFamily: '"Press Start 2P", monospace' }}
            >
              PLAY NOW
            </button>
          </div>
        )}

        {/* ===================== CHARACTER SELECT ===================== */}
        {gameState === GameState.CHARACTER_SELECT && (
          <div className="absolute inset-0 bg-gradient-to-b from-black via-[#0d0d1a] to-black z-50 flex flex-col items-center justify-start p-3 md:p-6 overflow-y-auto">
            <h2
              className="text-lg md:text-2xl text-white font-black mb-3 md:mb-5 tracking-widest"
              style={{ fontFamily: '"Press Start 2P", monospace', textShadow: '2px 2px 0 #d10d25' }}
            >
              SELECT FIGHTER
            </h2>

            {/* Player Characters */}
            <div className="w-full max-w-3xl mb-4">
              <div className="text-[10px] md:text-xs text-red-400 mb-2 tracking-widest" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                YOUR FIGHTER
              </div>
              <div className="grid grid-cols-3 gap-2">
                {PLAYER_CHARACTERS.map(char => (
                  <button
                    key={char.id}
                    onClick={() => setSelectedPlayerChar(char)}
                    className={`relative p-2 md:p-3 rounded-lg border-2 transition-all ${
                      selectedPlayerChar.id === char.id
                        ? 'border-red-500 bg-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.4)]'
                        : 'border-white/10 bg-white/5 hover:border-white/30'
                    }`}
                  >
                    {/* Fighter avatar */}
                    <div
                      className="w-full h-10 md:h-16 rounded mb-2 flex items-center justify-center text-2xl"
                      style={{ backgroundColor: char.skinColor + '33', borderBottom: `3px solid ${char.shortsColor}` }}
                    >
                      <div style={{ color: char.accentColor }}>👊</div>
                    </div>

                    <div className="text-[6px] md:text-[9px] text-white font-bold truncate" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                      {char.name.split(' ')[0]}
                    </div>
                    <div className="text-[5px] md:text-[7px] mt-0.5" style={{ fontFamily: '"Press Start 2P", monospace', color: char.accentColor }}>
                      {char.style}
                    </div>

                    {/* Stats mini bars */}
                    <div className="mt-1.5 space-y-0.5">
                      <StatMiniBar label="HP" value={char.health} max={120} color="#22c55e" />
                      <StatMiniBar label="SP" value={char.stamina} max={120} color="#3b82f6" />
                      <StatMiniBar label="SPD" value={Math.round(char.speed * 100)} max={120} color="#f59e0b" />
                    </div>

                    {/* Special name */}
                    <div className="mt-1.5 text-[5px] md:text-[6px] text-yellow-400/80 truncate" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                      ⚡ {char.specialName}
                    </div>

                    {selectedPlayerChar.id === char.id && (
                      <div className="absolute top-1 right-1 w-3 h-3 md:w-4 md:h-4 bg-red-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-[6px]">✓</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* VS Divider */}
            <div className="flex items-center gap-3 mb-4 w-full max-w-3xl">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent to-red-500/50" />
              <span className="text-red-500 font-black text-base md:text-xl" style={{ fontFamily: '"Press Start 2P", monospace' }}>VS</span>
              <div className="flex-1 h-px bg-gradient-to-l from-transparent to-red-500/50" />
            </div>

            {/* Enemy Characters */}
            <div className="w-full max-w-3xl mb-4">
              <div className="text-[10px] md:text-xs text-gray-400 mb-2 tracking-widest" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                OPPONENT
              </div>
              <div className="grid grid-cols-3 gap-2">
                {ENEMY_CHARACTERS.map(char => (
                  <button
                    key={char.id}
                    onClick={() => setSelectedEnemyChar(char)}
                    className={`relative p-2 md:p-3 rounded-lg border-2 transition-all ${
                      selectedEnemyChar.id === char.id
                        ? 'border-gray-400 bg-gray-400/20 shadow-[0_0_20px_rgba(156,163,175,0.3)]'
                        : 'border-white/10 bg-white/5 hover:border-white/30'
                    }`}
                  >
                    <div
                      className="w-full h-10 md:h-16 rounded mb-2 flex items-center justify-center text-2xl"
                      style={{ backgroundColor: char.skinColor + '33', borderBottom: `3px solid ${char.shortsColor}` }}
                    >
                      <div style={{ color: char.accentColor }}>🥊</div>
                    </div>
                    <div className="text-[6px] md:text-[9px] text-white font-bold truncate" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                      {char.name.split(' ')[0]}
                    </div>
                    <div className="text-[5px] md:text-[7px] mt-0.5" style={{ fontFamily: '"Press Start 2P", monospace', color: char.accentColor }}>
                      {char.style}
                    </div>
                    <div className="mt-1.5 space-y-0.5">
                      <StatMiniBar label="HP" value={char.health} max={120} color="#22c55e" />
                      <StatMiniBar label="SP" value={char.stamina} max={120} color="#3b82f6" />
                      <StatMiniBar label="PWR" value={Math.round(char.punchDamage * 10)} max={100} color="#ef4444" />
                    </div>
                    <div className="mt-1.5 text-[5px] md:text-[6px] text-yellow-400/80 truncate" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                      ⚡ {char.specialName}
                    </div>
                    {selectedEnemyChar.id === char.id && (
                      <div className="absolute top-1 right-1 w-3 h-3 md:w-4 md:h-4 bg-gray-400 rounded-full flex items-center justify-center">
                        <span className="text-black text-[6px]">✓</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty Selection */}
            <div className="w-full max-w-3xl mb-4">
              <div className="text-[10px] md:text-xs text-white/60 mb-2 tracking-widest" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                DIFFICULTY
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(DIFFICULTY_SETTINGS) as Difficulty[]).map(diff => {
                  const settings = DIFFICULTY_SETTINGS[diff];
                  return (
                    <button
                      key={diff}
                      onClick={() => setDifficulty(diff)}
                      className={`p-2 md:p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${
                        difficulty === diff
                          ? 'border-opacity-100 shadow-lg'
                          : 'border-white/10 bg-white/5 hover:border-white/30'
                      }`}
                      style={{
                        borderColor: difficulty === diff ? settings.color : undefined,
                        backgroundColor: difficulty === diff ? settings.color + '22' : undefined
                      }}
                    >
                      <span className="text-[7px] md:text-[10px] font-bold" style={{ fontFamily: '"Press Start 2P", monospace', color: settings.color }}>
                        {settings.label}
                      </span>
                      <span className="text-[5px] md:text-[7px] text-white/60" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                        {settings.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Matchup preview */}
            <div className="flex items-center gap-3 mb-4 text-center">
              <div className="text-[7px] md:text-[9px] text-red-400" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                {selectedPlayerChar.name}
              </div>
              <div className="text-red-500 font-black text-sm" style={{ fontFamily: '"Press Start 2P", monospace' }}>VS</div>
              <div className="text-[7px] md:text-[9px] text-gray-400" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                {selectedEnemyChar.name}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                onClick={goToMenu}
                className="px-4 py-2 md:px-6 md:py-3 bg-gray-800 text-white font-black text-xs md:text-sm uppercase tracking-wider hover:bg-gray-700 active:scale-95 transition-all border border-white/20 rounded"
                style={{ fontFamily: '"Press Start 2P", monospace' }}
              >
                ← BACK
              </button>
              <button
                onClick={startGame}
                className="px-8 py-3 md:px-12 md:py-4 bg-gradient-to-r from-[#d10d25] via-red-600 to-[#d10d25] text-white font-black text-sm md:text-xl uppercase tracking-widest hover:brightness-125 active:scale-95 transition-all border-b-4 border-[#8a0918] shadow-[0_4px_30px_rgba(209,13,37,0.5)]"
                style={{ fontFamily: '"Press Start 2P", monospace' }}
              >
                FIGHT! 👊
              </button>
            </div>
          </div>
        )}

        {/* ===================== ROUND TRANSITION ===================== */}
        {gameState === GameState.ROUND_TRANSITION && roundResult && (
          <div className="absolute inset-0 bg-black/90 z-50 flex flex-col items-center justify-center">
            <div className="text-center">
              {/* Round result */}
              <div
                className="text-2xl md:text-5xl font-black mb-3 animate-bounce"
                style={{
                  fontFamily: '"Press Start 2P", monospace',
                  color: roundResult.winner === 'PLAYER' ? '#22c55e' : roundResult.winner === 'DRAW' ? '#f59e0b' : '#ef4444'
                }}
              >
                {roundResult.winner === 'PLAYER' ? '✓ YOU WIN!' :
                  roundResult.winner === 'DRAW' ? 'DRAW!' : 'KNOCKED OUT!'}
              </div>
              <div className="text-xs md:text-sm text-white/60 mb-6" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                ROUND {currentRound} - {roundResult.method}
              </div>

              {/* Round scoreboard */}
              <div className="flex items-center gap-6 justify-center mb-6">
                <div className="text-center">
                  <div className="text-[9px] md:text-xs text-red-400 mb-2" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                    {selectedPlayerChar.name.split(' ')[0]}
                  </div>
                  <div className="flex gap-2">
                    {Array.from({ length: ROUNDS_TO_WIN }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-5 h-5 md:w-8 md:h-8 rounded-full border-2 flex items-center justify-center ${
                          i < roundsWon.player ? 'bg-green-500 border-green-400' : 'bg-gray-800 border-gray-600'
                        }`}
                      >
                        {i < roundsWon.player && <span className="text-white text-xs">✓</span>}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="text-red-500 font-black text-xl" style={{ fontFamily: '"Press Start 2P", monospace' }}>VS</div>
                <div className="text-center">
                  <div className="text-[9px] md:text-xs text-gray-400 mb-2" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                    {selectedEnemyChar.name.split(' ')[0]}
                  </div>
                  <div className="flex gap-2">
                    {Array.from({ length: ROUNDS_TO_WIN }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-5 h-5 md:w-8 md:h-8 rounded-full border-2 flex items-center justify-center ${
                          i < roundsWon.enemy ? 'bg-red-500 border-red-400' : 'bg-gray-800 border-gray-600'
                        }`}
                      >
                        {i < roundsWon.enemy && <span className="text-white text-xs">✓</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="text-[8px] md:text-xs text-white/40 animate-pulse" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                {roundsWon.player < ROUNDS_TO_WIN && roundsWon.enemy < ROUNDS_TO_WIN
                  ? `ROUND ${currentRound + 1} STARTING...`
                  : 'MATCH OVER...'}
              </div>
            </div>
          </div>
        )}

        {/* ===================== VICTORY / GAMEOVER ===================== */}
        {(gameState === GameState.VICTORY || gameState === GameState.GAMEOVER) && (
          <div className="absolute inset-0 bg-gradient-to-b from-black/95 via-black/90 to-black/95 z-50 flex flex-col items-center justify-center p-4">
            <div className={`relative mb-4 ${gameState === GameState.VICTORY ? 'animate-bounce' : 'animate-pulse'}`}>
              {gameState === GameState.VICTORY ? (
                <div className="relative">
                  <Trophy className="w-16 h-16 md:w-28 md:h-28 text-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,0.5)]" />
                  <div className="absolute -inset-2 bg-yellow-400/20 rounded-full blur-xl -z-10" />
                </div>
              ) : (
                <div className="relative">
                  <div className="w-20 h-20 md:w-32 md:h-32 bg-gradient-to-br from-red-600 to-red-900 rounded-full flex items-center justify-center border-4 border-red-500 shadow-[0_0_40px_rgba(220,38,38,0.6)]">
                    <span className="text-white text-2xl md:text-5xl font-black" style={{ fontFamily: '"Press Start 2P", monospace' }}>KO</span>
                  </div>
                  <div className="absolute -inset-4 bg-red-600/30 rounded-full blur-2xl -z-10 animate-pulse" />
                </div>
              )}
            </div>

            <h2
              className={`text-2xl md:text-6xl font-black mb-2 tracking-tight ${
                gameState === GameState.VICTORY
                  ? 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500'
                  : 'text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-red-500 to-red-600'
              }`}
              style={{ fontFamily: '"Press Start 2P", monospace' }}
            >
              {gameState === GameState.VICTORY ? 'CHAMPION!' : 'DEFEATED!'}
            </h2>

            {/* Final score */}
            <div className="flex gap-6 items-center mb-4">
              <div className="text-center">
                <div className="text-lg md:text-3xl font-black text-green-400" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                  {roundsWon.player}
                </div>
                <div className="text-[7px] md:text-[9px] text-white/50" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                  {selectedPlayerChar.name.split(' ')[0]}
                </div>
              </div>
              <div className="text-white/40 font-black text-sm" style={{ fontFamily: '"Press Start 2P", monospace' }}>-</div>
              <div className="text-center">
                <div className="text-lg md:text-3xl font-black text-red-400" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                  {roundsWon.enemy}
                </div>
                <div className="text-[7px] md:text-[9px] text-white/50" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                  {selectedEnemyChar.name.split(' ')[0]}
                </div>
              </div>
            </div>

            <div className="flex gap-3 flex-wrap justify-center">
              <button
                onClick={startGame}
                className="px-8 py-3 md:px-12 md:py-4 bg-gradient-to-r from-[#d10d25] to-[#ff1a3d] text-white font-black text-base md:text-2xl uppercase tracking-widest hover:brightness-125 active:scale-95 transition-all border-b-4 border-[#8a0918]"
                style={{ fontFamily: '"Press Start 2P", monospace' }}
              >
                👊 REMATCH
              </button>
              <button
                onClick={goToCharacterSelect}
                className="px-6 py-3 md:px-8 md:py-4 bg-gray-800 text-white font-black text-sm md:text-base uppercase tracking-widest hover:bg-gray-700 active:scale-95 transition-all border border-white/20"
                style={{ fontFamily: '"Press Start 2P", monospace' }}
              >
                ⚙ CHANGE
              </button>
            </div>

            <a
              href="https://www.kisa.ge/donate/kakha13"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 px-4 py-2 text-white/80 hover:text-white font-bold text-xs uppercase tracking-wider transition-colors flex items-center gap-2 border border-white/20 rounded hover:border-white/40"
              style={{ fontFamily: '"Press Start 2P", monospace' }}
            >
              🎁 DONATE
            </a>
          </div>
        )}

        {/* ===================== ACTIVE GAME ===================== */}
        {gameState === GameState.PLAYING && (
          <>
            <HUD roundsWon={roundsWon} currentRound={currentRound} />
            {/* key on div forces full remount of GameCanvas each round */}
            <div key={gameKey} className="w-full h-full">
              <GameCanvas
                onRoundEnd={handleRoundEnd}
                input={input}
                isMuted={isMuted}
                playerConfig={selectedPlayerChar}
                enemyConfig={selectedEnemyChar}
                difficulty={difficulty}
                round={currentRound}
              />
            </div>
          </>
        )}
      </div>

      {/* Mobile Controls */}
      {gameState === GameState.PLAYING && (
        <div className="lg:hidden">
          <Controls onInput={handleInput} />
        </div>
      )}
    </div>
  );
};

// Mini stat bar for character select
const StatMiniBar = ({ label, value, max, color }: { label: string; value: number; max: number; color: string }) => (
  <div className="flex items-center gap-1">
    <span className="text-[4px] md:text-[5px] text-white/40 w-5 shrink-0" style={{ fontFamily: '"Press Start 2P", monospace' }}>{label}</span>
    <div className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full"
        style={{ width: `${(value / max) * 100}%`, backgroundColor: color }}
      />
    </div>
  </div>
);

export default App;
