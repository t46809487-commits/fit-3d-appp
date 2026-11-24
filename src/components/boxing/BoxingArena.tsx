import React, { useState, useEffect, useRef } from 'react';
import { Boxing3DModel } from '../3d/Boxing3DModel';
import { BOXING_DRILLS, PUNCHES } from '../../data/boxingWorkout';
import { sounds } from '../../utils/audio';
import { CharacterModelId, AvatarConfiguration } from '../../types';
import confetti from 'canvas-confetti';
import { Play, Pause, SkipForward, X, Plus, Check, Award } from 'lucide-react';

interface BoxingArenaProps {
  onClose: () => void;
  onFinishBoxingSession?: (stats: {
    durationSeconds: number;
    punchesThrown: number;
    combosCompleted: number;
    caloriesBurned: number;
  }) => void;
  characterId?: CharacterModelId;
  avatarConfig?: AvatarConfiguration;
}

const ORDINALS = ['1st', '2nd', '3rd', '4th', '5th', '6th'];

// ---------------------------------------------------------------------------
// Boxing workout player. Works like the normal WorkoutPlayer:
// the 3D boxer performs every drill BY HIMSELF, drill after drill, in order.
// Inside a drill the punches also go in order (1st, 2nd, 3rd ...).
// Drills that need it get a punching bag, the others are shadow boxing.
// ---------------------------------------------------------------------------
export const BoxingArena: React.FC<BoxingArenaProps> = ({
  onClose,
  onFinishBoxingSession,
  characterId,
  avatarConfig,
}) => {
  const total = BOXING_DRILLS.length;

  const [idx, setIdx] = useState<number>(0);
  const [isResting, setIsResting] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [modelReady, setModelReady] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(BOXING_DRILLS[0].durationSeconds);
  const [totalSeconds, setTotalSeconds] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  const [activePunchPos, setActivePunchPos] = useState<number>(-1); // which punch of the sequence is being thrown now
  const [totalPunches, setTotalPunches] = useState<number>(0);
  const [combosCompleted, setCombosCompleted] = useState<number>(0);
  const [roundReps, setRoundReps] = useState<number>(0);

  const drill = BOXING_DRILLS[idx];
  const nextDrill = BOXING_DRILLS[idx + 1];
  // While resting, the model already shows the next drill so the bag is in place when it starts
  const shownDrill = isResting && nextDrill ? nextDrill : drill;

  const stripRef = useRef<HTMLDivElement>(null);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Announce the first drill once the boxer is on screen
  useEffect(() => {
    if (modelReady) {
      sounds.playGoTone();
      sounds.speak(`${BOXING_DRILLS[0].name}. Go!`);
    }
  }, [modelReady]);

  // Countdown (does not run while paused, resting is still counted, or the boxer is loading)
  useEffect(() => {
    if (isPaused || isCompleted || !modelReady) return;
    const interval = setInterval(() => {
      setTotalSeconds((s) => s + 1);
      setTimeLeft((prev) => {
        const next = prev - 1;
        if (next >= 1 && next <= 3) {
          if (isResting) sounds.speak(next === 3 ? 'Three' : next === 2 ? 'Two' : 'One');
          else sounds.playTick();
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isPaused, isCompleted, isResting, modelReady]);

  // Time is up -> rest, next drill or finish
  useEffect(() => {
    if (timeLeft <= 0 && !isCompleted && modelReady) advance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  const startDrill = (i: number) => {
    setIdx(i);
    setIsResting(false);
    setTimeLeft(BOXING_DRILLS[i].durationSeconds);
    setActivePunchPos(-1);
    setRoundReps(0);
    sounds.playGoTone();
    sounds.speak(`${BOXING_DRILLS[i].name}. Go!`);
  };

  const finishWorkout = () => {
    setIsCompleted(true);
    sounds.playVictory();
    sounds.speak('Boxing workout completed! Outstanding work!');
    try {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    } catch {}
  };

  const advance = () => {
    if (!isResting) {
      if (idx >= total - 1) {
        finishWorkout();
      } else {
        setIsResting(true);
        setTimeLeft(drill.restSeconds);
        setActivePunchPos(-1);
        sounds.playTick();
        sounds.speak(`Rest. Next, ${nextDrill.name}`);
      }
    } else {
      startDrill(idx + 1);
    }
  };

  const addRestTime = (seconds: number) => setTimeLeft((prev) => prev + seconds);

  const calories = Math.round(totalPunches * 1.5 + (totalSeconds / 60) * 12);

  const handleSave = () => {
    onFinishBoxingSession?.({
      durationSeconds: totalSeconds,
      punchesThrown: totalPunches,
      combosCompleted,
      caloriesBurned: calories,
    });
    onClose();
  };

  // "End" button: save what was done so far (if anything), then close
  const handleEnd = () => {
    if (totalSeconds > 0) handleSave();
    else onClose();
  };

  // Keep the current drill visible in the order strip
  useEffect(() => {
    const el = stripRef.current?.querySelector<HTMLElement>(`[data-drill="${idx}"]`);
    el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [idx]);

  // --------------------------- Completed screen ---------------------------
  if (isCompleted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fade-in">
        <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 text-center space-y-6 shadow-2xl">
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-tr from-red-600 to-orange-500 flex items-center justify-center shadow-lg shadow-red-600/40">
            <Award className="w-10 h-10 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-white tracking-tight">Boxing Crushed!</h2>
            <p className="text-neutral-400 text-sm mt-1">{total} drills completed</p>
          </div>
          <div className="grid grid-cols-4 gap-2 p-4 rounded-2xl bg-neutral-800/60 border border-neutral-800 text-center">
            <div>
              <div className="text-[11px] text-neutral-400">Time</div>
              <div className="text-base font-black text-white mt-0.5">{formatTime(totalSeconds)}</div>
            </div>
            <div>
              <div className="text-[11px] text-neutral-400">Punches</div>
              <div className="text-base font-black text-red-400 mt-0.5">{totalPunches}</div>
            </div>
            <div>
              <div className="text-[11px] text-neutral-400">Combos</div>
              <div className="text-base font-black text-emerald-400 mt-0.5">{combosCompleted}</div>
            </div>
            <div>
              <div className="text-[11px] text-neutral-400">Kcal</div>
              <div className="text-base font-black text-orange-400 mt-0.5">{calories}</div>
            </div>
          </div>
          <button
            onClick={handleSave}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white font-black tracking-wide shadow-lg shadow-red-600/30 transition active:scale-95"
          >
            SAVE WORKOUT & PROGRESS
          </button>
        </div>
      </div>
    );
  }

  // Chips that show the punches of a drill in order (1st, 2nd, 3rd ...)
  const renderSequence = (seq: number[], activePos: number, big = false) => (
    <div className="flex items-start gap-1.5 flex-wrap">
      {seq.map((punch, i) => {
        const active = i === activePos;
        const done = activePos > i;
        return (
          <React.Fragment key={i}>
            {i > 0 && <span className="text-neutral-600 text-xs mt-2.5">→</span>}
            <div className="flex flex-col items-center">
              <div
                className={`${big ? 'min-w-[3.25rem] px-2 h-10' : 'min-w-[2.75rem] px-1.5 h-8'} rounded-xl flex flex-col items-center justify-center font-black transition-all ${
                  active
                    ? 'bg-red-500 text-white scale-110 shadow-[0_0_14px_rgba(239,68,68,0.9)]'
                    : done
                    ? 'bg-emerald-600/80 text-white'
                    : 'bg-neutral-800 text-neutral-300'
                }`}
              >
                <span className="font-mono text-sm leading-none">{punch}</span>
                <span className="text-[8px] tracking-wider leading-none mt-0.5">{PUNCHES[punch].label}</span>
              </div>
              <span className={`text-[9px] mt-0.5 font-bold uppercase ${active ? 'text-red-400' : 'text-neutral-500'}`}>
                {ORDINALS[i]}
              </span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );

  // --------------------------- Active screen ---------------------------
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-neutral-950 text-white animate-fade-in select-none">
      {/* Top header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-red-950/40 bg-neutral-950/90 backdrop-blur z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-red-600 flex items-center justify-center shadow-lg shadow-red-600/40">🥊</div>
          <div>
            <div className="text-xs uppercase font-extrabold tracking-widest text-red-500">Boxing Workout</div>
            <div className="text-sm font-black text-white">
              Drill {Math.min(idx + (isResting ? 2 : 1), total)} of {total}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleEnd}
            className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-black uppercase tracking-wider text-white shadow-md transition"
          >
            End
          </button>
          <button onClick={onClose} className="p-2 rounded-xl bg-neutral-900 text-neutral-400 hover:text-white transition" title="Exit">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 3D boxer (always mounted; rest screen is drawn on top) */}
      <div className="relative flex-1 w-full bg-black overflow-hidden">
        <Boxing3DModel
          sequence={shownDrill.sequence}
          useBag={shownDrill.useBag}
          isPaused={isPaused || isResting || !modelReady}
          characterId={characterId}
          avatarConfig={avatarConfig}
          height="100%"
          onReady={() => setModelReady(true)}
          onPunchStart={(i) => {
            setActivePunchPos(i);
            if (i >= 0) setTotalPunches((p) => p + 1);
          }}
          onSequenceComplete={() => {
            setRoundReps((r) => r + 1);
            if (shownDrill.sequence.length >= 2) setCombosCompleted((c) => c + 1);
          }}
        />

        {!isResting && (
          <>
            {/* Bag / shadow badge + reps */}
            <div className="absolute top-3 left-3 z-10 flex items-center gap-2 bg-black/75 backdrop-blur-md border border-neutral-800 px-3 py-1.5 rounded-xl shadow-lg">
              <span className="text-xs font-bold text-red-300">{drill.useBag ? '🥊 Heavy Bag' : '👤 Shadow Boxing'}</span>
              <span className="text-neutral-600">•</span>
              <span className="text-xs font-mono font-bold text-orange-400">{roundReps} REPS</span>
            </div>

            {/* Punch order HUD */}
            <div className="absolute top-14 inset-x-3 z-10 flex justify-center pointer-events-none">
              <div className="bg-black/80 backdrop-blur-md border border-neutral-800 px-3 py-2 rounded-2xl shadow-2xl">
                {drill.sequence.length > 0 ? (
                  renderSequence(drill.sequence, activePunchPos)
                ) : (
                  <span className="text-xs font-bold text-neutral-300">Guard stance • stay light on your feet</span>
                )}
              </div>
            </div>

            {/* Live stats */}
            <div className="absolute bottom-3 left-3 z-10 flex items-center gap-3 bg-black/80 backdrop-blur-md border border-neutral-800 px-3.5 py-2 rounded-2xl text-xs">
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
          </>
        )}

        {/* Rest screen */}
        {isResting && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 bg-gradient-to-b from-blue-950/90 via-neutral-950 to-black text-center space-y-5 animate-fade-in">
            <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              Rest & Recover
            </span>
            <div className="text-6xl font-mono font-black text-white tracking-wider">{formatTime(timeLeft)}</div>
            <button
              onClick={() => addRestTime(15)}
              className="px-3.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-neutral-300 flex items-center gap-1 transition"
            >
              <Plus className="w-3.5 h-3.5" /> +15s
            </button>
            {nextDrill && (
              <div className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800 max-w-sm w-full text-left space-y-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 block">
                  Next: Drill {idx + 2} of {total}
                </span>
                <div className="text-base font-bold text-white">{nextDrill.name}</div>
                <div className="text-xs text-red-400">{nextDrill.useBag ? '🥊 With heavy bag' : '👤 Shadow boxing, no bag'}</div>
                {nextDrill.sequence.length > 0 && renderSequence(nextDrill.sequence, -1)}
              </div>
            )}
            <button
              onClick={advance}
              className="px-6 py-3 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-sm tracking-wide transition active:scale-95 flex items-center gap-2"
            >
              <SkipForward className="w-4 h-4" /> SKIP REST
            </button>
          </div>
        )}
      </div>

      {/* Bottom panel */}
      <div className="px-4 pt-3 pb-4 border-t border-neutral-900 bg-neutral-950 space-y-3 z-20">
        <div className="flex items-center justify-between">
          <div className="min-w-0 pr-3">
            <div className="text-lg font-black text-white tracking-tight truncate">{drill.name}</div>
            <div className="text-xs text-neutral-400 mt-0.5 line-clamp-2">{drill.description}</div>
          </div>
          <div className="text-3xl font-mono font-black text-red-500">{formatTime(Math.max(timeLeft, 0))}</div>
        </div>

        {/* Order of all drills: 1, 2, 3 ... */}
        <div ref={stripRef} className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {BOXING_DRILLS.map((d, i) => {
            const done = i < idx;
            const current = i === idx;
            return (
              <div
                key={d.id}
                data-drill={i}
                title={d.name}
                className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black transition ${
                  current
                    ? 'bg-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.7)]'
                    : done
                    ? 'bg-emerald-600/80 text-white'
                    : 'bg-neutral-900 border border-neutral-800 text-neutral-500'
                }`}
              >
                {done ? <Check className="w-4 h-4" /> : i + 1}
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-neutral-900 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-red-600 to-orange-400 transition-all duration-300 rounded-full"
            style={{ width: `${((idx + (isResting ? 1 : 0)) / total) * 100}%` }}
          />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="p-4 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-white transition active:scale-95"
            title={isPaused ? 'Resume' : 'Pause'}
          >
            {isPaused ? <Play className="w-6 h-6 fill-current" /> : <Pause className="w-6 h-6" />}
          </button>
          <button
            onClick={advance}
            className="px-6 py-4 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-red-600/25 flex items-center gap-2 transition active:scale-95"
          >
            <span>NEXT / SKIP</span>
            <SkipForward className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
