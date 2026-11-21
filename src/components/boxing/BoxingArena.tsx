import React, { useState, useEffect } from 'react';
import { Boxing3DModel } from '../3d/Boxing3DModel';
import { BOXING_COMBOS } from '../../data/exercises';
import { sounds } from '../../utils/audio';
import { BoxingCombo } from '../../types';
import { Play, Pause, RotateCcw, Flame, Trophy, Shield, Zap, X, ChevronRight } from 'lucide-react';

interface BoxingArenaProps {
  onClose: () => void;
  onFinishBoxingSession?: (stats: {
    durationSeconds: number;
    punchesThrown: number;
    combosCompleted: number;
    caloriesBurned: number;
  }) => void;
}

export const BoxingArena: React.FC<BoxingArenaProps> = ({
  onClose,
  onFinishBoxingSession,
}) => {
  const [selectedCombo, setSelectedCombo] = useState<BoxingCombo>(BOXING_COMBOS[0]);
  const [roundNumber, setRoundNumber] = useState<number>(1);
  const [roundTimeLeft, setRoundTimeLeft] = useState<number>(180); // 3 minutes
  const [isActive, setIsActive] = useState<boolean>(false);
  const [currentPunchNumber, setCurrentPunchNumber] = useState<number>(0);
  const [userComboStep, setUserComboStep] = useState<number>(0);
  const [totalPunches, setTotalPunches] = useState<number>(0);
  const [combosCompleted, setCombosCompleted] = useState<number>(0);
  const [totalSeconds, setTotalSeconds] = useState<number>(0);

  // Round countdown
  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setTotalSeconds((s) => s + 1);
      setRoundTimeLeft((prev) => {
        if (prev <= 1) {
          sounds.playVictory();
          sounds.speak('Round over! Catch your breath!');
          setIsActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive]);

  const handleManualPunch = (num: number) => {
    setCurrentPunchNumber(num);
    setTotalPunches((p) => p + 1);

    // Check if matching current combo expectation
    const targetPunch = selectedCombo.sequence[userComboStep];
    if (num === targetPunch) {
      const nextStep = userComboStep + 1;
      if (nextStep >= selectedCombo.sequence.length) {
        // Completed full combo!
        setCombosCompleted((c) => c + 1);
        setUserComboStep(0);
        sounds.speak('Combo complete!');
      } else {
        setUserComboStep(nextStep);
      }
    } else {
      // Reset combo sequence on mistake
      setUserComboStep(0);
    }
  };

  const handlePunchFinished = () => {
    setCurrentPunchNumber(0);
  };

  const toggleRound = () => {
    if (!isActive && roundTimeLeft === 0) {
      setRoundTimeLeft(180);
      setRoundNumber((r) => r + 1);
    }
    const nextState = !isActive;
    setIsActive(nextState);
    if (nextState) {
      sounds.playGoTone();
      sounds.speak(`Round ${roundNumber}! Fight!`);
    }
  };

  const handleFinish = () => {
    const calories = Math.round(totalPunches * 1.5 + (totalSeconds / 60) * 12);
    if (onFinishBoxingSession) {
      onFinishBoxingSession({
        durationSeconds: totalSeconds,
        punchesThrown: totalPunches,
        combosCompleted,
        caloriesBurned: calories,
      });
    }
    onClose();
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-neutral-950 text-white animate-fade-in select-none">
      
      {/* Top Combat Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-red-950/40 bg-neutral-950/90 backdrop-blur z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-red-600 flex items-center justify-center font-black text-white shadow-lg shadow-red-600/40">
            🥊
          </div>
          <div>
            <div className="text-xs uppercase font-extrabold tracking-widest text-red-500">
              Combat Boxing Arena
            </div>
            <div className="text-sm font-black text-white">
              Round {roundNumber.toString().padStart(2, '0')} • {formatTimer(roundTimeLeft)}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleFinish}
            className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-black uppercase tracking-wider text-white shadow-md transition"
          >
            End Session
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-neutral-900 text-neutral-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main 3D Boxer Arena */}
      <div className="relative flex-1 w-full bg-black flex flex-col items-center justify-center overflow-hidden">
        <Boxing3DModel
          currentPunch={currentPunchNumber}
          comboSequence={selectedCombo.sequence}
          onPunchComplete={handlePunchFinished}
          height="100%"
        />

        {/* Floating Combo Target HUD (PRD page 25) */}
        <div className="absolute top-4 inset-x-4 sm:inset-x-8 z-10 flex flex-col items-center pointer-events-none">
          <div className="bg-black/85 backdrop-blur-md border border-neutral-800 px-4 py-2.5 rounded-2xl flex items-center gap-3 shadow-2xl">
            <span className="text-xs font-black uppercase tracking-wider text-red-400">
              {selectedCombo.name}:
            </span>
            <div className="flex items-center gap-1.5">
              {selectedCombo.sequence.map((pNum, idx) => (
                <div
                  key={idx}
                  className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono font-black text-sm transition-all ${
                    idx < userComboStep
                      ? 'bg-emerald-500 text-white'
                      : idx === userComboStep
                      ? 'bg-red-500 text-white animate-bounce shadow-[0_0_12px_rgba(239,68,68,0.8)]'
                      : 'bg-neutral-800 text-neutral-400'
                  }`}
                >
                  {pNum}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Live Punch Stats overlay */}
        <div className="absolute bottom-4 left-4 z-10 flex items-center gap-3 bg-black/80 backdrop-blur-md border border-neutral-800 px-3.5 py-2 rounded-2xl text-xs">
          <div>
            <span className="text-neutral-400 text-[10px] uppercase font-bold block">Punches</span>
            <span className="font-mono font-black text-white text-base">{totalPunches}</span>
          </div>
          <div className="h-6 w-px bg-neutral-800" />
          <div>
            <span className="text-neutral-400 text-[10px] uppercase font-bold block">Combos</span>
            <span className="font-mono font-black text-orange-400 text-base">{combosCompleted}</span>
          </div>
        </div>
      </div>

      {/* Interactive Punch Pad & Combo Controller (PRD section 18 & 25) */}
      <div className="px-4 py-4 border-t border-neutral-900 bg-neutral-950 space-y-3 z-20">
        
        {/* Combo Selection Carousel */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {BOXING_COMBOS.map((combo) => (
            <button
              key={combo.id}
              onClick={() => {
                setSelectedCombo(combo);
                setUserComboStep(0);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                selectedCombo.id === combo.id
                  ? 'bg-red-600 text-white shadow-md'
                  : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              {combo.name}
            </button>
          ))}
        </div>

        {/* Punch Trigger Grid (1 = Jab, 2 = Cross, 3 = Hook, etc. from PRD page 25) */}
        <div className="grid grid-cols-6 gap-2">
          {[
            { num: 1, label: 'JAB', hand: 'L-Lead', color: 'from-blue-600 to-indigo-600' },
            { num: 2, label: 'CROSS', hand: 'R-Power', color: 'from-red-600 to-rose-600' },
            { num: 3, label: 'L-HOOK', hand: 'L-Torque', color: 'from-amber-600 to-orange-600' },
            { num: 4, label: 'R-HOOK', hand: 'R-Torque', color: 'from-amber-600 to-orange-600' },
            { num: 5, label: 'L-UPPER', hand: 'L-Lift', color: 'from-purple-600 to-pink-600' },
            { num: 6, label: 'R-UPPER', hand: 'R-Lift', color: 'from-purple-600 to-pink-600' },
          ].map((punch) => (
            <button
              key={punch.num}
              onClick={() => handleManualPunch(punch.num)}
              className="group relative flex flex-col items-center justify-center py-3 px-1 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-red-500/60 active:scale-95 transition shadow-lg overflow-hidden"
            >
              <div className="text-xl sm:text-2xl font-mono font-black text-white group-hover:text-red-400">
                {punch.num}
              </div>
              <div className="text-[10px] sm:text-xs font-black tracking-wider text-neutral-300 mt-0.5">
                {punch.label}
              </div>
              <div className="text-[9px] text-neutral-400 scale-90">
                {punch.hand}
              </div>
            </button>
          ))}
        </div>

        {/* Round Play/Pause Button */}
        <div className="flex items-center justify-center pt-1">
          <button
            onClick={toggleRound}
            className={`px-6 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2 transition active:scale-95 shadow-lg ${
              isActive
                ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                : 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/30'
            }`}
          >
            {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
            {isActive ? 'Pause Round Timer' : 'Start Round (3:00)'}
          </button>
        </div>
      </div>
    </div>
  );
};
