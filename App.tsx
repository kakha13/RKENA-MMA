
import React, { useState, useEffect, useCallback, useRef } from 'react';
import GameCanvas from './components/GameCanvas';
import HUD from './components/HUD';
import Controls from './components/Controls';
import {
  GameState, GameMode, InputState, Difficulty, CharacterConfig,
  FightStats, RoundEndPayload, CareerRecord, createEmptyStats
} from './types';
import {
  ROSTER, DIFFICULTY_SETTINGS, ROUNDS_TO_WIN, MAX_ROUNDS,
  fighterRating, TOURNAMENT_LADDER_SIZE, TOURNAMENT_DIFFICULTY_RAMP, CAREER_STORAGE_KEY
} from './constants';
import { Trophy, Maximize, Minimize, Volume2, VolumeX, Play, Pause, Crown } from 'lucide-react';
import bgMusic from './assets/audio-bg.mp3';

const EMPTY_INPUT: InputState = {
  left: false, right: false, punch: false, kick: false, block: false, takedown: false, special: false, dodge: false
};

const loadCareer = (): CareerRecord => {
  try {
    const raw = localStorage.getItem(CAREER_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        wins: parsed.wins || 0,
        losses: parsed.losses || 0,
        koWins: parsed.koWins || 0,
        bestCombo: parsed.bestCombo || 0,
        tournamentsWon: parsed.tournamentsWon || 0
      };
    }
  } catch (e) { /* corrupted storage — start fresh */ }
  return { wins: 0, losses: 0, koWins: 0, bestCombo: 0, tournamentsWon: 0 };
};

const saveCareer = (record: CareerRecord) => {
  try { localStorage.setItem(CAREER_STORAGE_KEY, JSON.stringify(record)); } catch (e) { /* private mode */ }
};

const buildLadder = (playerId: string): CharacterConfig[] => {
  const others = ROSTER.filter(c => c.id !== playerId).sort((a, b) => fighterRating(a) - fighterRating(b));
  const count = Math.min(TOURNAMENT_LADDER_SIZE, others.length);
  const idxs = Array.from({ length: count }, (_, i) =>
    Math.round((i * (others.length - 1)) / Math.max(1, count - 1)));
  return [...new Set(idxs)].map(i => others[i]);
};

const addStats = (a: FightStats, b: FightStats): FightStats => ({
  strikesLanded: a.strikesLanded + b.strikesLanded,
  strikesThrown: a.strikesThrown + b.strikesThrown,
  takedowns: a.takedowns + b.takedowns,
  maxCombo: Math.max(a.maxCombo, b.maxCombo),
  damageDealt: a.damageDealt + b.damageDealt,
  parries: a.parries + b.parries,
  dodges: a.dodges + b.dodges,
  specialsLanded: a.specialsLanded + b.specialsLanded
});

const PIXEL_FONT = { fontFamily: '"Press Start 2P", monospace' } as const;

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [gameMode, setGameMode] = useState<GameMode>(GameMode.QUICK_FIGHT);
  const [selectedPlayerChar, setSelectedPlayerChar] = useState<CharacterConfig>(ROSTER[0]);
  const [selectedEnemyChar, setSelectedEnemyChar] = useState<CharacterConfig>(ROSTER[4]);
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.MEDIUM);
  const [roundsWon, setRoundsWon] = useState({ player: 0, enemy: 0 });
  const [currentRound, setCurrentRound] = useState(1);
  const [roundResult, setRoundResult] = useState<{ winner: 'PLAYER' | 'ENEMY' | 'DRAW'; method: string } | null>(null);
  const [matchStats, setMatchStats] = useState<{ player: FightStats; enemy: FightStats }>({
    player: createEmptyStats(), enemy: createEmptyStats()
  });
  const [lastMatchMethod, setLastMatchMethod] = useState<'KO' | 'DECISION'>('KO');
  const [ladder, setLadder] = useState<CharacterConfig[]>([]);
  const [ladderStage, setLadderStage] = useState(0);
  const [career, setCareer] = useState<CareerRecord>(loadCareer);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [gameKey, setGameKey] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Input lives in a ref: the 60fps game loop reads it directly, so keypresses
  // never re-render the app or restart the loop.
  const inputRef = useRef<InputState>({ ...EMPTY_INPUT });
  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

  const handleInput = useCallback((action: string, active: boolean) => {
    (inputRef.current as any)[action] = active;
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
      } else if (gameState === GameState.PAUSED) {
        audioRef.current.pause();
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

  const togglePause = useCallback(() => {
    setGameState(prev => {
      if (prev === GameState.PLAYING) {
        inputRef.current = { ...EMPTY_INPUT };
        return GameState.PAUSED;
      }
      if (prev === GameState.PAUSED) return GameState.PLAYING;
      return prev;
    });
  }, []);

  // Keyboard listeners
  useEffect(() => {
    const handleKey = (e: KeyboardEvent, active: boolean) => {
      const gs = gameStateRef.current;
      if (active && (e.key === 'Escape' || e.key.toLowerCase() === 'p') &&
        (gs === GameState.PLAYING || gs === GameState.PAUSED)) {
        togglePause();
        return;
      }
      if (gs !== GameState.PLAYING) return;
      switch (e.key.toLowerCase()) {
        case 'arrowleft': handleInput('left', active); break;
        case 'arrowright': handleInput('right', active); break;
        case 'q': handleInput('punch', active); break;
        case 'w': handleInput('kick', active); break;
        case 'e': handleInput('block', active); break;
        case 'r': handleInput('takedown', active); break;
        case 'arrowdown': handleInput('takedown', active); break;
        case 'a': handleInput('special', active); break;
        case 's': handleInput('dodge', active); break;
        case 'arrowup': handleInput('dodge', active); break;
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
  }, [handleInput, togglePause]);

  const recordMatchResult = (playerWon: boolean, method: 'KO' | 'DECISION', stats: FightStats, wonTournament: boolean) => {
    setCareer(prev => {
      const next: CareerRecord = {
        wins: prev.wins + (playerWon ? 1 : 0),
        losses: prev.losses + (playerWon ? 0 : 1),
        koWins: prev.koWins + (playerWon && method === 'KO' ? 1 : 0),
        bestCombo: Math.max(prev.bestCombo, stats.maxCombo),
        tournamentsWon: prev.tournamentsWon + (wonTournament ? 1 : 0)
      };
      saveCareer(next);
      return next;
    });
  };

  const handleRoundEnd = (payload: RoundEndPayload) => {
    const { winner, method } = payload;
    const newRoundsWon = {
      player: roundsWon.player + (winner === 'PLAYER' ? 1 : 0),
      enemy: roundsWon.enemy + (winner === 'ENEMY' ? 1 : 0)
    };
    const newStats = {
      player: addStats(matchStats.player, payload.playerStats),
      enemy: addStats(matchStats.enemy, payload.enemyStats)
    };
    setMatchStats(newStats);
    setRoundResult({ winner, method });
    setRoundsWon(newRoundsWon);
    setLastMatchMethod(method);
    setGameState(GameState.ROUND_TRANSITION);
    inputRef.current = { ...EMPTY_INPUT };

    const matchOver = newRoundsWon.player >= ROUNDS_TO_WIN || newRoundsWon.enemy >= ROUNDS_TO_WIN ||
      currentRound >= MAX_ROUNDS;

    setTimeout(() => {
      if (newRoundsWon.player >= ROUNDS_TO_WIN || (matchOver && newRoundsWon.player >= newRoundsWon.enemy)) {
        // Player wins the match
        const isTournament = gameMode === GameMode.TOURNAMENT;
        const isFinalStage = isTournament && ladderStage >= ladder.length - 1;
        recordMatchResult(true, method, newStats.player, isFinalStage);
        setGameState(isFinalStage ? GameState.TOURNAMENT_CHAMPION : GameState.VICTORY);
      } else if (newRoundsWon.enemy >= ROUNDS_TO_WIN || matchOver) {
        recordMatchResult(false, method, newStats.player, false);
        setGameState(GameState.GAMEOVER);
      } else {
        setCurrentRound(r => r + 1);
        setGameKey(k => k + 1);
        setGameState(GameState.PLAYING);
      }
    }, 3500);
  };

  const resetMatchState = () => {
    setRoundsWon({ player: 0, enemy: 0 });
    setCurrentRound(1);
    setRoundResult(null);
    setMatchStats({ player: createEmptyStats(), enemy: createEmptyStats() });
    inputRef.current = { ...EMPTY_INPUT };
    setGameKey(k => k + 1);
  };

  const startGame = () => {
    if (gameMode === GameMode.TOURNAMENT) {
      const newLadder = buildLadder(selectedPlayerChar.id);
      setLadder(newLadder);
      setLadderStage(0);
      setSelectedEnemyChar(newLadder[0]);
      setDifficulty(TOURNAMENT_DIFFICULTY_RAMP[0] ?? Difficulty.EASY);
    }
    resetMatchState();
    setGameState(GameState.PLAYING);
  };

  const nextTournamentFight = () => {
    const nextStage = ladderStage + 1;
    setLadderStage(nextStage);
    setSelectedEnemyChar(ladder[nextStage]);
    setDifficulty(TOURNAMENT_DIFFICULTY_RAMP[Math.min(nextStage, TOURNAMENT_DIFFICULTY_RAMP.length - 1)]);
    resetMatchState();
    setGameState(GameState.PLAYING);
  };

  const rematch = () => {
    resetMatchState();
    setGameState(GameState.PLAYING);
  };

  const goToCharacterSelect = (mode: GameMode) => {
    setGameMode(mode);
    setGameState(GameState.CHARACTER_SELECT);
  };
  const goToMenu = () => setGameState(GameState.MENU);

  const isTournament = gameMode === GameMode.TOURNAMENT;
  const accuracy = matchStats.player.strikesThrown > 0
    ? Math.round((matchStats.player.strikesLanded / matchStats.player.strikesThrown) * 100)
    : 0;

  const inGame = gameState === GameState.PLAYING || gameState === GameState.PAUSED;

  return (
    <div className="w-full h-[100dvh] bg-black flex items-center justify-center overflow-hidden relative">
      <audio ref={audioRef} src={bgMusic} loop />

      {/* Control Buttons */}
      <div className="absolute top-2 right-2 z-[100] flex gap-1.5">
        {inGame && (
          <button
            onClick={togglePause}
            className="p-1.5 bg-gray-800/80 text-white rounded-full hover:bg-gray-700/80 transition-all backdrop-blur-sm border border-white/30 shadow-lg active:scale-95"
          >
            {gameState === GameState.PAUSED ? <Play size={18} /> : <Pause size={18} />}
          </button>
        )}
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
                style={PIXEL_FONT}
              >
                🎁 DONATE
              </a>
            </div>

            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-red-600/10 rounded-full blur-3xl" />
              <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-red-600/10 rounded-full blur-3xl" />
            </div>

            {/* Logo */}
            <div className="relative mb-4 landscape:mb-2">
              <div className="absolute -inset-8 bg-red-600/20 rounded-full blur-3xl" />
              <div className="relative flex flex-col items-center">
                <h1
                  className="text-4xl landscape:text-3xl md:text-8xl font-black tracking-tight"
                  style={{ ...PIXEL_FONT, color: '#e8e4d9', textShadow: '4px 4px 0 #000' }}
                >
                  RKE
                </h1>
                <div className="flex items-end gap-1">
                  <h1
                    className="text-4xl landscape:text-3xl md:text-8xl font-black tracking-tight"
                    style={{ ...PIXEL_FONT, color: '#e8e4d9', textShadow: '4px 4px 0 #000' }}
                  >
                    NA
                  </h1>
                  <div className="w-6 h-6 landscape:w-5 landscape:h-5 md:w-12 md:h-12 bg-[#dc2626] mb-1 md:mb-2" />
                </div>
              </div>
              <div className="flex items-center justify-center gap-2 mt-2">
                <div className="h-0.5 w-8 md:w-20 bg-gradient-to-r from-transparent to-red-500" />
                <span className="text-white/90 text-[9px] md:text-sm font-bold tracking-[0.4em] uppercase" style={PIXEL_FONT}>MMA CHAMPIONSHIP</span>
                <div className="h-0.5 w-8 md:w-20 bg-gradient-to-l from-transparent to-red-500" />
              </div>
            </div>

            {/* Career record */}
            {(career.wins > 0 || career.losses > 0) && (
              <div className="mb-3 px-4 py-2 bg-black/50 border border-white/10 rounded-lg flex items-center gap-4" style={PIXEL_FONT}>
                <span className="text-[7px] md:text-[10px] text-green-400">{career.wins}W</span>
                <span className="text-[7px] md:text-[10px] text-red-400">{career.losses}L</span>
                <span className="text-[7px] md:text-[10px] text-orange-400">{career.koWins} KO</span>
                <span className="text-[7px] md:text-[10px] text-yellow-400">{career.bestCombo}x BEST</span>
                {career.tournamentsWon > 0 && (
                  <span className="text-[7px] md:text-[10px] text-amber-300 flex items-center gap-1">
                    <Crown size={10} /> {career.tournamentsWon}
                  </span>
                )}
              </div>
            )}

            {/* Controls hint */}
            <div className="hidden portrait:block md:block mb-4 p-3 bg-black/50 border border-white/10 rounded-lg backdrop-blur-sm" style={PIXEL_FONT}>
              <div className="grid grid-cols-4 gap-x-6 gap-y-1.5 text-left text-[9px] md:text-xs">
                <span className="text-gray-500">[<span className="text-white">← →</span>]</span><span className="text-gray-300">MOVE</span>
                <span className="text-gray-500">[<span className="text-teal-400">Q</span>]</span><span className="text-gray-300">PUNCH</span>
                <span className="text-gray-500">[<span className="text-orange-400">W</span>]</span><span className="text-gray-300">KICK</span>
                <span className="text-gray-500">[<span className="text-yellow-400">E</span>]</span><span className="text-gray-300">BLOCK</span>
                <span className="text-gray-500">[<span className="text-purple-400">R</span>]</span><span className="text-gray-300">TAKEDOWN</span>
                <span className="text-gray-500">[<span className="text-sky-400">S</span>]</span><span className="text-sky-200">DODGE</span>
                <span className="text-gray-500">[<span className="text-yellow-300">A</span>]</span><span className="text-yellow-200">SPECIAL ⚡</span>
                <span className="text-gray-500">[<span className="text-white">P</span>]</span><span className="text-gray-300">PAUSE</span>
              </div>
              <div className="mt-2 pt-2 border-t border-white/10 text-[7px] md:text-[9px] text-gray-500 text-left">
                TIP: BLOCK AT THE LAST INSTANT TO <span className="text-cyan-400">PARRY</span> · DODGE A STRIKE FOR A <span className="text-cyan-400">COUNTER</span> BONUS
              </div>
            </div>

            {/* Mode buttons */}
            <div className="flex flex-col md:flex-row gap-3 items-center">
              <button
                onClick={() => goToCharacterSelect(GameMode.QUICK_FIGHT)}
                className="px-8 py-3 landscape:px-5 landscape:py-2 md:px-12 md:py-4 bg-gradient-to-r from-[#d10d25] via-red-600 to-[#d10d25] text-white font-black text-base landscape:text-sm md:text-2xl uppercase tracking-widest hover:brightness-125 active:scale-95 transition-all border-b-4 border-[#8a0918] hover:border-b-2 hover:translate-y-[2px] shadow-[0_4px_30px_rgba(209,13,37,0.5)] touch-manipulation"
                style={PIXEL_FONT}
              >
                QUICK FIGHT
              </button>
              <button
                onClick={() => goToCharacterSelect(GameMode.TOURNAMENT)}
                className="px-8 py-3 landscape:px-5 landscape:py-2 md:px-12 md:py-4 bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 text-black font-black text-base landscape:text-sm md:text-2xl uppercase tracking-widest hover:brightness-125 active:scale-95 transition-all border-b-4 border-amber-800 hover:border-b-2 hover:translate-y-[2px] shadow-[0_4px_30px_rgba(245,158,11,0.5)] touch-manipulation flex items-center gap-2"
                style={PIXEL_FONT}
              >
                <Crown className="w-4 h-4 md:w-6 md:h-6" /> TOURNAMENT
              </button>
            </div>
          </div>
        )}

        {/* ===================== CHARACTER SELECT ===================== */}
        {gameState === GameState.CHARACTER_SELECT && (
          <div className="absolute inset-0 bg-gradient-to-b from-black via-[#0d0d1a] to-black z-50 flex flex-col items-center justify-start p-3 md:p-6 overflow-y-auto">
            <h2
              className="text-lg md:text-2xl text-white font-black mb-1 tracking-widest"
              style={{ ...PIXEL_FONT, textShadow: '2px 2px 0 #d10d25' }}
            >
              SELECT FIGHTER
            </h2>
            <div className="text-[8px] md:text-[10px] mb-3 md:mb-4 tracking-widest" style={{ ...PIXEL_FONT, color: isTournament ? '#f59e0b' : '#9ca3af' }}>
              {isTournament ? '👑 TOURNAMENT MODE — 4 FIGHT LADDER' : 'QUICK FIGHT'}
            </div>

            {/* Player Characters */}
            <div className="w-full max-w-3xl mb-4">
              <div className="text-[10px] md:text-xs text-red-400 mb-2 tracking-widest" style={PIXEL_FONT}>
                YOUR FIGHTER
              </div>
              <div className="grid grid-cols-4 gap-1.5 md:gap-2">
                {ROSTER.map(char => (
                  <button
                    key={char.id}
                    onClick={() => setSelectedPlayerChar(char)}
                    className={`relative p-1.5 md:p-3 rounded-lg border-2 transition-all ${
                      selectedPlayerChar.id === char.id
                        ? 'border-red-500 bg-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.4)]'
                        : 'border-white/10 bg-white/5 hover:border-white/30'
                    }`}
                  >
                    <div
                      className="w-full h-8 md:h-14 rounded mb-1.5 flex items-center justify-center text-xl"
                      style={{ backgroundColor: char.skinColor + '33', borderBottom: `3px solid ${char.shortsColor}` }}
                    >
                      <div style={{ color: char.accentColor }}>👊</div>
                    </div>

                    <div className="text-[6px] md:text-[9px] text-white font-bold truncate" style={PIXEL_FONT}>
                      {char.name.split(' ')[0]}
                    </div>
                    <div className="text-[5px] md:text-[7px] mt-0.5 truncate" style={{ ...PIXEL_FONT, color: char.accentColor }}>
                      {char.style}
                    </div>

                    <div className="mt-1.5 space-y-0.5">
                      <StatMiniBar label="HP" value={char.health} max={120} color="#22c55e" />
                      <StatMiniBar label="SP" value={char.stamina} max={120} color="#3b82f6" />
                      <StatMiniBar label="PWR" value={Math.round((char.punchDamage + char.kickDamage) * 6)} max={120} color="#ef4444" />
                    </div>

                    <div className="mt-1.5 text-[5px] md:text-[6px] text-yellow-400/80 truncate" style={PIXEL_FONT}>
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

            {isTournament ? (
              /* Tournament ladder preview */
              <div className="w-full max-w-3xl mb-4">
                <div className="text-[10px] md:text-xs text-amber-400 mb-2 tracking-widest" style={PIXEL_FONT}>
                  THE LADDER
                </div>
                <div className="flex items-center gap-1 md:gap-2 flex-wrap">
                  {buildLadder(selectedPlayerChar.id).map((char, i, arr) => (
                    <React.Fragment key={char.id}>
                      <div className="flex-1 min-w-[70px] p-1.5 md:p-2 rounded-lg border border-white/10 bg-white/5 text-center">
                        <div className="text-[5px] md:text-[7px] text-white/50 mb-1" style={PIXEL_FONT}>
                          FIGHT {i + 1}
                        </div>
                        <div
                          className="w-full h-6 md:h-10 rounded mb-1 flex items-center justify-center"
                          style={{ backgroundColor: char.skinColor + '33', borderBottom: `2px solid ${char.shortsColor}` }}
                        >
                          <span style={{ color: char.accentColor }}>{i === arr.length - 1 ? '👑' : '🥊'}</span>
                        </div>
                        <div className="text-[5px] md:text-[8px] text-white truncate" style={PIXEL_FONT}>
                          {char.name.split(' ')[0]}
                        </div>
                        <div className="text-[4px] md:text-[6px] mt-0.5" style={{ ...PIXEL_FONT, color: DIFFICULTY_SETTINGS[TOURNAMENT_DIFFICULTY_RAMP[Math.min(i, TOURNAMENT_DIFFICULTY_RAMP.length - 1)]].color }}>
                          {DIFFICULTY_SETTINGS[TOURNAMENT_DIFFICULTY_RAMP[Math.min(i, TOURNAMENT_DIFFICULTY_RAMP.length - 1)]].label}
                        </div>
                      </div>
                      {i < arr.length - 1 && (
                        <span className="text-white/30 text-[8px] md:text-xs" style={PIXEL_FONT}>▶</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {/* VS Divider */}
                <div className="flex items-center gap-3 mb-4 w-full max-w-3xl">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent to-red-500/50" />
                  <span className="text-red-500 font-black text-base md:text-xl" style={PIXEL_FONT}>VS</span>
                  <div className="flex-1 h-px bg-gradient-to-l from-transparent to-red-500/50" />
                </div>

                {/* Opponent */}
                <div className="w-full max-w-3xl mb-4">
                  <div className="text-[10px] md:text-xs text-gray-400 mb-2 tracking-widest" style={PIXEL_FONT}>
                    OPPONENT
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 md:gap-2">
                    {ROSTER.map(char => (
                      <button
                        key={char.id}
                        onClick={() => setSelectedEnemyChar(char)}
                        className={`relative p-1.5 md:p-3 rounded-lg border-2 transition-all ${
                          selectedEnemyChar.id === char.id
                            ? 'border-gray-400 bg-gray-400/20 shadow-[0_0_20px_rgba(156,163,175,0.3)]'
                            : 'border-white/10 bg-white/5 hover:border-white/30'
                        }`}
                      >
                        <div
                          className="w-full h-8 md:h-14 rounded mb-1.5 flex items-center justify-center text-xl"
                          style={{ backgroundColor: char.skinColor + '33', borderBottom: `3px solid ${char.shortsColor}` }}
                        >
                          <div style={{ color: char.accentColor }}>🥊</div>
                        </div>
                        <div className="text-[6px] md:text-[9px] text-white font-bold truncate" style={PIXEL_FONT}>
                          {char.name.split(' ')[0]}
                        </div>
                        <div className="text-[5px] md:text-[7px] mt-0.5 truncate" style={{ ...PIXEL_FONT, color: char.accentColor }}>
                          {char.style}
                        </div>
                        <div className="mt-1.5 space-y-0.5">
                          <StatMiniBar label="HP" value={char.health} max={120} color="#22c55e" />
                          <StatMiniBar label="SP" value={char.stamina} max={120} color="#3b82f6" />
                          <StatMiniBar label="PWR" value={Math.round((char.punchDamage + char.kickDamage) * 6)} max={120} color="#ef4444" />
                        </div>
                        <div className="mt-1.5 text-[5px] md:text-[6px] text-yellow-400/80 truncate" style={PIXEL_FONT}>
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
                  <div className="text-[10px] md:text-xs text-white/60 mb-2 tracking-widest" style={PIXEL_FONT}>
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
                          <span className="text-[7px] md:text-[10px] font-bold" style={{ ...PIXEL_FONT, color: settings.color }}>
                            {settings.label}
                          </span>
                          <span className="text-[5px] md:text-[7px] text-white/60" style={PIXEL_FONT}>
                            {settings.description}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Matchup preview */}
                <div className="flex items-center gap-3 mb-4 text-center">
                  <div className="text-[7px] md:text-[9px] text-red-400" style={PIXEL_FONT}>
                    {selectedPlayerChar.name}
                  </div>
                  <div className="text-red-500 font-black text-sm" style={PIXEL_FONT}>VS</div>
                  <div className="text-[7px] md:text-[9px] text-gray-400" style={PIXEL_FONT}>
                    {selectedEnemyChar.name}
                  </div>
                </div>
              </>
            )}

            {/* Action buttons */}
            <div className="flex gap-3 pb-4">
              <button
                onClick={goToMenu}
                className="px-4 py-2 md:px-6 md:py-3 bg-gray-800 text-white font-black text-xs md:text-sm uppercase tracking-wider hover:bg-gray-700 active:scale-95 transition-all border border-white/20 rounded"
                style={PIXEL_FONT}
              >
                ← BACK
              </button>
              <button
                onClick={startGame}
                className="px-8 py-3 md:px-12 md:py-4 bg-gradient-to-r from-[#d10d25] via-red-600 to-[#d10d25] text-white font-black text-sm md:text-xl uppercase tracking-widest hover:brightness-125 active:scale-95 transition-all border-b-4 border-[#8a0918] shadow-[0_4px_30px_rgba(209,13,37,0.5)]"
                style={PIXEL_FONT}
              >
                {isTournament ? 'START LADDER 👑' : 'FIGHT! 👊'}
              </button>
            </div>
          </div>
        )}

        {/* ===================== ROUND TRANSITION ===================== */}
        {gameState === GameState.ROUND_TRANSITION && roundResult && (
          <div className="absolute inset-0 bg-black/90 z-50 flex flex-col items-center justify-center">
            <div className="text-center">
              <div
                className="text-2xl md:text-5xl font-black mb-3 animate-bounce"
                style={{
                  ...PIXEL_FONT,
                  color: roundResult.winner === 'PLAYER' ? '#22c55e' : roundResult.winner === 'DRAW' ? '#f59e0b' : '#ef4444'
                }}
              >
                {roundResult.winner === 'PLAYER' ? '✓ YOU WIN!' :
                  roundResult.winner === 'DRAW' ? 'DRAW!' : 'KNOCKED OUT!'}
              </div>
              <div className="text-xs md:text-sm text-white/60 mb-6" style={PIXEL_FONT}>
                ROUND {currentRound} - {roundResult.method}
                {isTournament && <span className="text-amber-400"> · FIGHT {ladderStage + 1}/{ladder.length}</span>}
              </div>

              {/* Round scoreboard */}
              <div className="flex items-center gap-6 justify-center mb-6">
                <div className="text-center">
                  <div className="text-[9px] md:text-xs text-red-400 mb-2" style={PIXEL_FONT}>
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
                <div className="text-red-500 font-black text-xl" style={PIXEL_FONT}>VS</div>
                <div className="text-center">
                  <div className="text-[9px] md:text-xs text-gray-400 mb-2" style={PIXEL_FONT}>
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

              <div className="text-[8px] md:text-xs text-white/40 animate-pulse" style={PIXEL_FONT}>
                {roundsWon.player < ROUNDS_TO_WIN && roundsWon.enemy < ROUNDS_TO_WIN && currentRound < MAX_ROUNDS
                  ? `ROUND ${currentRound + 1} STARTING...`
                  : 'MATCH OVER...'}
              </div>
            </div>
          </div>
        )}

        {/* ===================== VICTORY / GAMEOVER / CHAMPION ===================== */}
        {(gameState === GameState.VICTORY || gameState === GameState.GAMEOVER || gameState === GameState.TOURNAMENT_CHAMPION) && (
          <div className="absolute inset-0 bg-gradient-to-b from-black/95 via-black/90 to-black/95 z-50 flex flex-col items-center justify-center p-4 overflow-y-auto">
            <div className={`relative mb-3 ${gameState !== GameState.GAMEOVER ? 'animate-bounce' : 'animate-pulse'}`}>
              {gameState === GameState.TOURNAMENT_CHAMPION ? (
                <div className="relative">
                  <Crown className="w-16 h-16 md:w-28 md:h-28 text-amber-300 drop-shadow-[0_0_25px_rgba(252,211,77,0.7)]" />
                  <div className="absolute -inset-2 bg-amber-400/25 rounded-full blur-xl -z-10" />
                </div>
              ) : gameState === GameState.VICTORY ? (
                <div className="relative">
                  <Trophy className="w-14 h-14 md:w-24 md:h-24 text-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,0.5)]" />
                  <div className="absolute -inset-2 bg-yellow-400/20 rounded-full blur-xl -z-10" />
                </div>
              ) : (
                <div className="relative">
                  <div className="w-16 h-16 md:w-28 md:h-28 bg-gradient-to-br from-red-600 to-red-900 rounded-full flex items-center justify-center border-4 border-red-500 shadow-[0_0_40px_rgba(220,38,38,0.6)]">
                    <span className="text-white text-xl md:text-4xl font-black" style={PIXEL_FONT}>KO</span>
                  </div>
                  <div className="absolute -inset-4 bg-red-600/30 rounded-full blur-2xl -z-10 animate-pulse" />
                </div>
              )}
            </div>

            <h2
              className={`text-xl md:text-5xl font-black mb-1 tracking-tight text-transparent bg-clip-text ${
                gameState === GameState.TOURNAMENT_CHAMPION
                  ? 'bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-400'
                  : gameState === GameState.VICTORY
                    ? 'bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500'
                    : 'bg-gradient-to-r from-red-400 via-red-500 to-red-600'
              }`}
              style={PIXEL_FONT}
            >
              {gameState === GameState.TOURNAMENT_CHAMPION ? 'UNDISPUTED!' :
                gameState === GameState.VICTORY ? (isTournament ? 'ADVANCING!' : 'CHAMPION!') : 'DEFEATED!'}
            </h2>

            {gameState === GameState.TOURNAMENT_CHAMPION && (
              <div className="text-[8px] md:text-xs text-amber-200/80 mb-2" style={PIXEL_FONT}>
                {selectedPlayerChar.name} CLEARED THE LADDER
              </div>
            )}
            {gameState === GameState.VICTORY && isTournament && (
              <div className="text-[8px] md:text-xs text-white/60 mb-2" style={PIXEL_FONT}>
                FIGHT {ladderStage + 1}/{ladder.length} WON — NEXT: {ladder[ladderStage + 1]?.name}
              </div>
            )}

            {/* Final score */}
            <div className="flex gap-6 items-center mb-3">
              <div className="text-center">
                <div className="text-base md:text-2xl font-black text-green-400" style={PIXEL_FONT}>
                  {roundsWon.player}
                </div>
                <div className="text-[7px] md:text-[9px] text-white/50" style={PIXEL_FONT}>
                  {selectedPlayerChar.name.split(' ')[0]}
                </div>
              </div>
              <div className="text-white/40 font-black text-sm" style={PIXEL_FONT}>-</div>
              <div className="text-center">
                <div className="text-base md:text-2xl font-black text-red-400" style={PIXEL_FONT}>
                  {roundsWon.enemy}
                </div>
                <div className="text-[7px] md:text-[9px] text-white/50" style={PIXEL_FONT}>
                  {selectedEnemyChar.name.split(' ')[0]}
                </div>
              </div>
            </div>

            {/* Fight stats */}
            <div className="w-full max-w-md mb-4 p-3 bg-black/60 border border-white/10 rounded-lg" style={PIXEL_FONT}>
              <div className="text-[7px] md:text-[9px] text-white/40 mb-2 text-center tracking-widest">FIGHT STATS</div>
              <div className="space-y-1.5">
                <StatCompareRow label="STRIKES" a={`${matchStats.player.strikesLanded}/${matchStats.player.strikesThrown}`} b={`${matchStats.enemy.strikesLanded}/${matchStats.enemy.strikesThrown}`} />
                <StatCompareRow label="ACCURACY" a={`${accuracy}%`} b={matchStats.enemy.strikesThrown > 0 ? `${Math.round((matchStats.enemy.strikesLanded / matchStats.enemy.strikesThrown) * 100)}%` : '0%'} />
                <StatCompareRow label="DAMAGE" a={`${Math.round(matchStats.player.damageDealt)}`} b={`${Math.round(matchStats.enemy.damageDealt)}`} />
                <StatCompareRow label="TAKEDOWNS" a={`${matchStats.player.takedowns}`} b={`${matchStats.enemy.takedowns}`} />
                <StatCompareRow label="MAX COMBO" a={`${matchStats.player.maxCombo}x`} b={`${matchStats.enemy.maxCombo}x`} />
                <StatCompareRow label="PARRIES" a={`${matchStats.player.parries}`} b={`${matchStats.enemy.parries}`} />
                <StatCompareRow label="DODGES" a={`${matchStats.player.dodges}`} b={`${matchStats.enemy.dodges}`} />
                <StatCompareRow label="SPECIALS" a={`${matchStats.player.specialsLanded}`} b={`${matchStats.enemy.specialsLanded}`} />
              </div>
            </div>

            <div className="flex gap-3 flex-wrap justify-center">
              {gameState === GameState.VICTORY && isTournament ? (
                <button
                  onClick={nextTournamentFight}
                  className="px-8 py-3 md:px-12 md:py-4 bg-gradient-to-r from-amber-600 to-yellow-500 text-black font-black text-base md:text-xl uppercase tracking-widest hover:brightness-125 active:scale-95 transition-all border-b-4 border-amber-800"
                  style={PIXEL_FONT}
                >
                  NEXT FIGHT ▶
                </button>
              ) : (
                <button
                  onClick={rematch}
                  className="px-8 py-3 md:px-12 md:py-4 bg-gradient-to-r from-[#d10d25] to-[#ff1a3d] text-white font-black text-base md:text-xl uppercase tracking-widest hover:brightness-125 active:scale-95 transition-all border-b-4 border-[#8a0918]"
                  style={PIXEL_FONT}
                >
                  {gameState === GameState.GAMEOVER && isTournament ? '👊 RETRY FIGHT' : '👊 REMATCH'}
                </button>
              )}
              <button
                onClick={() => setGameState(GameState.CHARACTER_SELECT)}
                className="px-6 py-3 md:px-8 md:py-4 bg-gray-800 text-white font-black text-sm md:text-base uppercase tracking-widest hover:bg-gray-700 active:scale-95 transition-all border border-white/20"
                style={PIXEL_FONT}
              >
                ⚙ CHANGE
              </button>
              <button
                onClick={goToMenu}
                className="px-6 py-3 md:px-8 md:py-4 bg-gray-900 text-white/70 font-black text-sm md:text-base uppercase tracking-widest hover:bg-gray-800 active:scale-95 transition-all border border-white/10"
                style={PIXEL_FONT}
              >
                MENU
              </button>
            </div>

            <a
              href="https://www.kisa.ge/donate/kakha13"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 px-4 py-2 text-white/80 hover:text-white font-bold text-xs uppercase tracking-wider transition-colors flex items-center gap-2 border border-white/20 rounded hover:border-white/40"
              style={PIXEL_FONT}
            >
              🎁 DONATE
            </a>
          </div>
        )}

        {/* ===================== PAUSE OVERLAY ===================== */}
        {gameState === GameState.PAUSED && (
          <div className="absolute inset-0 bg-black/80 z-40 flex flex-col items-center justify-center backdrop-blur-sm">
            <h2 className="text-2xl md:text-4xl text-white font-black mb-6 tracking-widest" style={{ ...PIXEL_FONT, textShadow: '3px 3px 0 #d10d25' }}>
              PAUSED
            </h2>
            <div className="flex flex-col gap-3">
              <button
                onClick={togglePause}
                className="px-10 py-3 bg-gradient-to-r from-[#d10d25] to-red-600 text-white font-black text-sm md:text-lg uppercase tracking-widest hover:brightness-125 active:scale-95 transition-all border-b-4 border-[#8a0918]"
                style={PIXEL_FONT}
              >
                ▶ RESUME
              </button>
              <button
                onClick={() => { inputRef.current = { ...EMPTY_INPUT }; setGameState(GameState.CHARACTER_SELECT); }}
                className="px-10 py-3 bg-gray-800 text-white font-black text-xs md:text-sm uppercase tracking-widest hover:bg-gray-700 active:scale-95 transition-all border border-white/20"
                style={PIXEL_FONT}
              >
                QUIT FIGHT
              </button>
            </div>
            <div className="mt-6 text-[7px] md:text-[9px] text-white/40" style={PIXEL_FONT}>
              PRESS [P] OR [ESC] TO RESUME
            </div>
          </div>
        )}

        {/* ===================== ACTIVE GAME ===================== */}
        {inGame && (
          <>
            <HUD roundsWon={roundsWon} currentRound={currentRound} />
            {isTournament && (
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
                <span className="text-[6px] md:text-[8px] text-amber-400/70" style={PIXEL_FONT}>
                  👑 FIGHT {ladderStage + 1}/{ladder.length}
                </span>
              </div>
            )}
            {/* key on div forces full remount of GameCanvas each round */}
            <div key={gameKey} className="w-full h-full">
              <GameCanvas
                onRoundEnd={handleRoundEnd}
                inputRef={inputRef}
                isMuted={isMuted}
                paused={gameState === GameState.PAUSED}
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
    <span className="text-[4px] md:text-[5px] text-white/40 w-5 shrink-0" style={PIXEL_FONT}>{label}</span>
    <div className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full"
        style={{ width: `${Math.min(100, (value / max) * 100)}%`, backgroundColor: color }}
      />
    </div>
  </div>
);

// Side-by-side stat comparison row for post-fight screens
const StatCompareRow = ({ label, a, b }: { label: string; a: string; b: string }) => (
  <div className="flex items-center justify-between gap-2">
    <span className="text-[7px] md:text-[9px] text-green-400 w-16 md:w-20 text-left">{a}</span>
    <span className="text-[6px] md:text-[8px] text-white/40 flex-1 text-center tracking-wider">{label}</span>
    <span className="text-[7px] md:text-[9px] text-red-400 w-16 md:w-20 text-right">{b}</span>
  </div>
);

export default App;
