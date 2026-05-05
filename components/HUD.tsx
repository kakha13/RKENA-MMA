
import React, { useEffect, useState } from 'react';
import { MAX_ROUNDS } from '../constants';

interface FighterHUDData {
  health: number;
  maxHealth: number;
  stamina: number;
  maxStamina: number;
  powerMeter: number;
  maxPowerMeter: number;
  name: string;
  comboCount: number;
}

interface HUDProps {
  roundsWon: { player: number; enemy: number };
  currentRound: number;
}

const HUD: React.FC<HUDProps> = ({ roundsWon, currentRound }) => {
  const [p1, setP1] = useState<FighterHUDData>({
    health: 100, maxHealth: 100, stamina: 100, maxStamina: 100,
    powerMeter: 0, maxPowerMeter: 100, name: 'PLAYER', comboCount: 0
  });
  const [p2, setP2] = useState<FighterHUDData>({
    health: 100, maxHealth: 100, stamina: 100, maxStamina: 100,
    powerMeter: 0, maxPowerMeter: 100, name: 'ENEMY', comboCount: 0
  });
  const [time, setTime] = useState(180);

  useEffect(() => {
    const handler = (e: any) => {
      const { p1: np1, p2: np2, time: t } = e.detail;
      setP1(np1);
      setP2(np2);
      setTime(t || 0);
    };
    window.addEventListener('game-update', handler);
    return () => window.removeEventListener('game-update', handler);
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const p1HealthPct = (p1.health / p1.maxHealth) * 100;
  const p2HealthPct = (p2.health / p2.maxHealth) * 100;
  const p1PowerPct = (p1.powerMeter / p1.maxPowerMeter) * 100;
  const p2PowerPct = (p2.powerMeter / p2.maxPowerMeter) * 100;

  const getHealthColor = (pct: number) => {
    if (pct > 60) return '#22c55e';
    if (pct > 30) return '#f59e0b';
    return '#ef4444';
  };

  const isLowHealth = (pct: number) => pct < 25;
  const isPowerFull = (pct: number) => pct >= 100;

  const RoundDots = ({ wins, total, flip = false }: { wins: number; total: number; flip?: boolean }) => (
    <div className={`flex gap-1 ${flip ? 'flex-row-reverse' : 'flex-row'}`}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`w-2 h-2 md:w-3 md:h-3 rounded-full border border-white/30 transition-all duration-300 ${
            i < wins ? 'bg-yellow-400 shadow-[0_0_6px_rgba(250,204,21,0.8)]' : 'bg-gray-700'
          }`}
        />
      ))}
    </div>
  );

  return (
    <div
      className="absolute top-2 md:top-3 left-0 w-full px-1 md:px-4 flex flex-col items-center pointer-events-none z-20"
      style={{ fontFamily: '"Press Start 2P", monospace' }}
    >
      {/* Main HUD Row */}
      <div className="flex w-full max-w-5xl items-stretch h-auto relative filter drop-shadow-lg origin-top mx-auto">

        {/* LEFT SIDE (Player 1) */}
        <div className="flex-1 flex flex-col items-end relative mr-[-10px] md:mr-[-20px] z-10">
          {/* Name Bar */}
          <div className="w-full h-6 md:h-11 bg-[#d10d25] transform -skew-x-[20deg] flex items-center justify-end pr-3 md:pr-6 pl-2 md:pl-4 border-r-2 border-black/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/20" />
            <div className="relative flex items-center gap-2 transform skew-x-[20deg]">
              <RoundDots wins={roundsWon.player} total={Math.ceil(MAX_ROUNDS / 2)} />
              <h2 className="text-white text-[5px] md:text-[9px] uppercase truncate leading-tight">
                {p1.name.split(' ')[0]}
              </h2>
            </div>
          </div>

          {/* Health Bar */}
          <div
            className={`w-[95%] h-2 md:h-3 mt-0.5 bg-gray-900 transform -skew-x-[20deg] overflow-hidden border ${
              isLowHealth(p1HealthPct) ? 'border-red-500/60 animate-pulse' : 'border-white/20'
            }`}
          >
            <div
              className="h-full transition-all duration-200"
              style={{
                width: `${p1HealthPct}%`,
                backgroundColor: getHealthColor(p1HealthPct),
                boxShadow: isLowHealth(p1HealthPct) ? '0 0 8px rgba(239,68,68,0.8)' : undefined
              }}
            />
          </div>

          {/* Stamina Bar */}
          <div className="w-[60%] h-1 md:h-1.5 mt-0.5 bg-gray-900/80 transform -skew-x-[20deg] overflow-hidden">
            <div
              className="h-full bg-blue-400 transition-all duration-200"
              style={{ width: `${(p1.stamina / p1.maxStamina) * 100}%` }}
            />
          </div>

          {/* Power Meter */}
          <div className="w-[75%] h-1 md:h-1.5 mt-0.5 bg-gray-900/80 transform -skew-x-[20deg] overflow-hidden border border-yellow-500/30">
            <div
              className={`h-full transition-all duration-200 ${isPowerFull(p1PowerPct) ? 'animate-pulse' : ''}`}
              style={{
                width: `${p1PowerPct}%`,
                background: isPowerFull(p1PowerPct)
                  ? 'linear-gradient(90deg, #f59e0b, #fde68a, #f59e0b)'
                  : '#b45309'
              }}
            />
          </div>

          {/* Combo display */}
          {p1.comboCount >= 2 && (
            <div className="transform skew-x-[20deg] mt-0.5">
              <span className="text-[6px] md:text-[8px] text-yellow-400 font-bold">{p1.comboCount}x COMBO</span>
            </div>
          )}
        </div>

        {/* CENTER BLOCK */}
        <div className="w-[120px] md:w-[300px] shrink-0 z-20 flex relative -mt-0.5 md:-mt-1 h-9 md:h-14">
          <div className="absolute inset-0 bg-black transform -skew-x-[20deg] border-x-2 border-white/10" />
          <div className="relative w-full h-full flex items-center justify-between px-2 md:px-5 text-white overflow-hidden">
            <div className="flex items-center gap-0.5 transform skew-x-[0deg]">
              <span className="text-[5px] md:text-[11px]">RKENA</span>
              <div className="w-1.5 h-1.5 md:w-2.5 md:h-2.5 bg-[#d10d25] ml-0.5" />
            </div>
            <div
              className={`text-[8px] md:text-sm font-bold ${
                time <= 30 ? 'text-red-400 animate-pulse' : 'text-white'
              }`}
            >
              {formatTime(time)}
            </div>
            <div className="bg-[#d10d25] px-1 py-0.5">
              <span className="text-[5px] md:text-[10px]">R{currentRound}</span>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE (Player 2) */}
        <div className="flex-1 flex flex-col items-start relative ml-[-10px] md:ml-[-20px] z-10">
          {/* Name Bar */}
          <div className="w-full h-6 md:h-11 bg-[#d10d25] transform -skew-x-[20deg] flex items-center justify-start pl-3 md:pl-6 pr-2 md:pr-4 border-l-2 border-black/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-l from-transparent to-black/20" />
            <div className="relative flex items-center gap-2 transform skew-x-[20deg]">
              <h2 className="text-white text-[5px] md:text-[9px] uppercase truncate leading-tight">
                {p2.name.split(' ')[0]}
              </h2>
              <RoundDots wins={roundsWon.enemy} total={Math.ceil(MAX_ROUNDS / 2)} flip />
            </div>
          </div>

          {/* Health Bar */}
          <div
            className={`w-[95%] h-2 md:h-3 mt-0.5 bg-gray-900 transform -skew-x-[20deg] overflow-hidden border ml-auto ${
              isLowHealth(p2HealthPct) ? 'border-red-500/60 animate-pulse' : 'border-white/20'
            }`}
          >
            <div
              className="h-full transition-all duration-200 ml-auto"
              style={{
                width: `${p2HealthPct}%`,
                backgroundColor: getHealthColor(p2HealthPct),
                boxShadow: isLowHealth(p2HealthPct) ? '0 0 8px rgba(239,68,68,0.8)' : undefined
              }}
            />
          </div>

          {/* Stamina Bar */}
          <div className="w-[60%] h-1 md:h-1.5 mt-0.5 bg-gray-900/80 transform -skew-x-[20deg] overflow-hidden ml-auto">
            <div
              className="h-full bg-blue-400 transition-all duration-200 ml-auto"
              style={{ width: `${(p2.stamina / p2.maxStamina) * 100}%` }}
            />
          </div>

          {/* Power Meter */}
          <div className="w-[75%] h-1 md:h-1.5 mt-0.5 bg-gray-900/80 transform -skew-x-[20deg] overflow-hidden border border-yellow-500/30 ml-auto">
            <div
              className={`h-full transition-all duration-200 ml-auto ${isPowerFull(p2PowerPct) ? 'animate-pulse' : ''}`}
              style={{
                width: `${p2PowerPct}%`,
                background: isPowerFull(p2PowerPct)
                  ? 'linear-gradient(90deg, #f59e0b, #fde68a, #f59e0b)'
                  : '#b45309'
              }}
            />
          </div>

          {/* Combo display */}
          {p2.comboCount >= 2 && (
            <div className="ml-auto mt-0.5 transform skew-x-[20deg]">
              <span className="text-[6px] md:text-[8px] text-yellow-400 font-bold">{p2.comboCount}x COMBO</span>
            </div>
          )}
        </div>
      </div>

      {/* Power meter legend row */}
      <div className="flex w-full max-w-5xl justify-between px-2 mt-0.5 opacity-60">
        {p1PowerPct >= 100 ? (
          <span className="text-[5px] md:text-[8px] text-yellow-400 animate-pulse ml-2">⚡ SPECIAL READY [A]</span>
        ) : (
          <span className="text-[5px] md:text-[7px] text-yellow-600/70 ml-2">PWR</span>
        )}
        {p2PowerPct >= 100 ? (
          <span className="text-[5px] md:text-[8px] text-yellow-400 animate-pulse mr-2">SPECIAL READY ⚡</span>
        ) : (
          <span className="text-[5px] md:text-[7px] text-yellow-600/70 mr-2 text-right">PWR</span>
        )}
      </div>
    </div>
  );
};

export default HUD;
