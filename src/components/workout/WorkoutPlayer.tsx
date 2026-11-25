import React, { useState, useEffect, useRef } from 'react';
import { Exercise, WorkoutRoutine, CharacterModelId, AvatarConfiguration } from '../../types';
import { Human3DModel } from '../3d/Human3DModel';
import { sounds } from '../../utils/audio';
import confetti from 'canvas-confetti';
import { Play, Pause, SkipForward, X, CheckCircle, Flame, Clock, Dumbbell, Award, Plus, Mic, MicOff, Music } from 'lucide-react';
import { CoachPanel } from "../Coach/CoachPanel";
import {
  coach,
  encouragement,
  exerciseIntro,
  formCue,
  restLine,
  useCoachSettings,
} from '../../services/coach';
import { musicPlayer } from '../../services/music';

interface WorkoutPlayerProps {
  routine: WorkoutRoutine;
  onClose: () => void;
  onFinishWorkout: (summary: {
    workoutName: string;
    category: string;
    durationSeconds: number;
    caloriesBurned: number;
    exerciseCount: number;
  }) => void;
  characterId?: CharacterModelId;
  avatarConfig?: AvatarConfiguration;
}

export const WorkoutPlayer: React.FC<WorkoutPlayerProps> = ({
  routine,
  onClose,
  onFinishWorkout,
  characterId,
  avatarConfig,
}) => {
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [currentSet, setCurrentSet] = useState<number>(1);
  const [isResting, setIsResting] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(45); // default exercise active time
  const [totalSecondsElapsed, setTotalSecondsElapsed] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [showCoach, setShowCoach] = useState<boolean>(false);
  const [showSpotify, setShowSpotify] = useState<boolean>(true);
  const cs = useCoachSettings();
  const durationRef = useRef<number>(45);
  const lastCueRef = useRef<string>('');

  const currentExercise = routine.exercises[currentIdx] || routine.exercises[0];
  const nextExercise = routine.exercises[currentIdx + 1];

  const totalExercises = routine.exercises.length;

  // Initialize timer for current exercise (and let the coach introduce it)
  useEffect(() => {
    if (isResting) {
      const restSec = currentExercise.restSeconds || 30;
      setTimeLeft(restSec);
      sounds.playTick();
      const sameExercise = currentSet < currentExercise.sets;
      coach.say(restLine(sameExercise ? currentExercise : nextExercise, sameExercise));
    } else {
      // Active exercise duration (e.g. 45s for timed, or based on reps)
      const duration = currentExercise.durationSeconds || Math.max(30, currentExercise.reps * 3);
      durationRef.current = duration;
      lastCueRef.current = '';
      setTimeLeft(duration);
      sounds.playGoTone();
      coach.say(exerciseIntro(currentExercise, currentSet));
      coach.say('Go!', { queue: true });
    }
  }, [currentIdx, currentSet, isResting]);

  // Coach cues while the exercise is running: form tips, encouragement, last 10 seconds
  useEffect(() => {
    if (isPaused || isCompleted || isResting) return;
    const total = durationRef.current;
    const key = `${currentIdx}-${currentSet}-${timeLeft}`;
    if (key === lastCueRef.current) return;
    let line = '';
    if (timeLeft === Math.floor(total * 0.7)) line = formCue(currentExercise, 0);
    else if (timeLeft === Math.floor(total * 0.45)) line = formCue(currentExercise, 1);
    else if (timeLeft === Math.floor(total * 0.25)) line = encouragement(currentIdx + currentSet);
    else if (timeLeft === 10 && total > 25) line = 'Ten seconds left. Finish strong!';
    if (line) {
      lastCueRef.current = key;
      coach.say(line, { queue: true });
    }
  }, [timeLeft, isPaused, isCompleted, isResting, currentIdx, currentSet]);

  // Music + coach lifecycle
  useEffect(() => {
    coach.setDuckHandler((ducked) => musicPlayer.duck(ducked));
    return () => {
      coach.setDuckHandler(null);
      coach.cancel();
      musicPlayer.stop();
    };
  }, []);

  useEffect(() => {
    if (cs.musicMode === 'builtin' && !isCompleted) musicPlayer.start(cs.trackId, cs.musicVolume);
    else musicPlayer.stop();
  }, [cs.musicMode, cs.trackId, isCompleted]);

  useEffect(() => {
    musicPlayer.setVolume(cs.musicVolume);
  }, [cs.musicVolume]);

  useEffect(() => {
    if (isPaused) {
      coach.cancel();
      musicPlayer.pause();
    } else if (cs.musicMode === 'builtin' && !isCompleted) {
      musicPlayer.resume();
    }
  }, [isPaused]);

  // Main countdown timer interval
  useEffect(() => {
    if (isPaused || isCompleted) return;

    const interval = setInterval(() => {
      setTotalSecondsElapsed((prev) => prev + 1);

      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Timer reached 0
          handleTimerExpired();
          return 0;
        }

        // Voice countdown during last 3 seconds of rest
        if (isResting) {
          if (prev === 4) sounds.speak('Three');
          if (prev === 3) sounds.speak('Two');
          if (prev === 2) sounds.speak('One');
        } else if (prev <= 4) {
          sounds.playTick();
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, isCompleted, isResting, currentIdx, currentSet]);

  const handleTimerExpired = () => {
    if (!isResting) {
      // Finished set -> Enter rest
      if (currentSet < currentExercise.sets) {
        setIsResting(true);
      } else {
        // Finished all sets for this exercise
        if (currentIdx < totalExercises - 1) {
          setIsResting(true);
        } else {
          // Finished entire workout!
          finishWorkout();
        }
      }
    } else {
      // Rest is over -> Next set or next exercise
      setIsResting(false);
      if (currentSet < currentExercise.sets) {
        setCurrentSet((s) => s + 1);
      } else {
        setCurrentIdx((i) => i + 1);
        setCurrentSet(1);
      }
    }
  };

  const skipCurrent = () => {
    if (isResting) {
      // Skip rest directly to work
      setIsResting(false);
      if (currentSet < currentExercise.sets) {
        setCurrentSet((s) => s + 1);
      } else {
        if (currentIdx < totalExercises - 1) {
          setCurrentIdx((i) => i + 1);
          setCurrentSet(1);
        } else {
          finishWorkout();
        }
      }
    } else {
      // Skip active exercise to rest
      handleTimerExpired();
    }
  };

  const addRestTime = (seconds: number) => {
    setTimeLeft((prev) => prev + seconds);
  };

  const finishWorkout = () => {
    setIsCompleted(true);
    sounds.playVictory();
    sounds.speak('Workout completed! Outstanding work!');

    // Celebration Confetti
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {}
  };

  const handleSaveAndExit = () => {
    const caloriesBurned = Math.round(
      routine.exercises.reduce((acc, ex) => acc + ex.caloriesEstimate * (ex.sets || 1), 0)
    );

    onFinishWorkout({
      workoutName: routine.title,
      category: routine.category,
      durationSeconds: totalSecondsElapsed,
      caloriesBurned,
      exerciseCount: totalExercises,
    });
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Completed celebratory screen
  if (isCompleted) {
    const estCals = Math.round(
      routine.exercises.reduce((acc, ex) => acc + ex.caloriesEstimate * (ex.sets || 1), 0)
    );

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fade-in">
        <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 text-center space-y-6 shadow-2xl">
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/40">
            <Award className="w-10 h-10 text-white" />
          </div>

          <div>
            <h2 className="text-3xl font-black text-white tracking-tight">Workout Crushed!</h2>
            <p className="text-neutral-400 text-sm mt-1">{routine.title} completed</p>
          </div>

          <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-neutral-800/60 border border-neutral-800 text-center">
            <div>
              <div className="text-xs text-neutral-400">Time</div>
              <div className="text-lg font-black text-white mt-0.5">{formatTime(totalSecondsElapsed)}</div>
            </div>
            <div>
              <div className="text-xs text-neutral-400">Calories</div>
              <div className="text-lg font-black text-orange-400 mt-0.5">{estCals} kcal</div>
            </div>
            <div>
              <div className="text-xs text-neutral-400">Exercises</div>
              <div className="text-lg font-black text-emerald-400 mt-0.5">{totalExercises}</div>
            </div>
          </div>

          <button
            onClick={handleSaveAndExit}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black tracking-wide shadow-lg shadow-orange-500/30 transition active:scale-95"
          >
            SAVE WORKOUT & PROGRESS
          </button>
        </div>
      </div>
    );
  }

  // Active workout screen layout (PRD page 26)
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-neutral-950 text-white animate-fade-in select-none">
      
      {/* Top Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-neutral-900 bg-neutral-950/80 backdrop-blur z-20">
        <div>
          <span className="text-xs uppercase font-extrabold tracking-wider text-neutral-400">
            {routine.title}
          </span>
          <div className="text-sm font-black text-orange-400">
            Exercise {currentIdx + 1} of {totalExercises}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCoach(true)}
            className={`p-2 rounded-xl bg-neutral-900 transition flex items-center gap-1.5 ${
              cs.coachEnabled || cs.musicMode !== 'off' ? 'text-orange-400' : 'text-neutral-500'
            }`}
            title="AI Coach & Music"
          >
            {cs.coachEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            <Music className="w-5 h-5" />
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-neutral-900 text-neutral-400 hover:text-white transition"
            title="Exit Workout"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Center Area: 3D Model OR Rest Banner */}
      <div className="relative flex-1 w-full bg-black flex flex-col items-center justify-center overflow-hidden">
        {isResting ? (
          // REST SYSTEM SCREEN (PRD page 26)
          <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-gradient-to-b from-blue-950/40 via-neutral-950 to-black animate-fade-in text-center space-y-5">
            <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              Active Rest & Recovery
            </span>

            <div className="text-6xl sm:text-7xl font-mono font-black text-white tracking-wider">
              {formatTime(timeLeft)}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => addRestTime(15)}
                className="px-3.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-neutral-300 flex items-center gap-1 transition"
              >
                <Plus className="w-3.5 h-3.5" /> +15s
              </button>
            </div>

            {nextExercise && (
              <div className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800 max-w-sm w-full text-left">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 block">
                  Next Exercise
                </span>
                <div className="text-base font-bold text-white mt-1">{nextExercise.name}</div>
                <div className="text-xs text-orange-400 mt-0.5">
                  {nextExercise.sets} sets × {nextExercise.reps} reps • {nextExercise.equipment.join(', ')}
                </div>
              </div>
            )}

            <button
              onClick={skipCurrent}
              className="px-6 py-3 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-sm tracking-wide transition active:scale-95 flex items-center gap-2"
            >
              <SkipForward className="w-4 h-4" />
              SKIP REST
            </button>
          </div>
        ) : (
          // ACTIVE 3D EXERCISE MOVEMENT (PRD page 26)
          <div className="w-full h-full relative">
            <Human3DModel
              primaryMuscles={currentExercise.primaryMuscles}
              secondaryMuscles={currentExercise.secondaryMuscles}
              animationType={currentExercise.animationType}
              characterId={characterId || currentExercise.characterId || 'CHAR-M-01'}
              avatarConfig={avatarConfig}
              equipment={currentExercise.equipment}
              isPaused={isPaused}
              height="100%"
              showControls={false}
            />

            {/* Set & Rep Floating Badge */}
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-black/75 backdrop-blur-md border border-neutral-800 px-3 py-1.5 rounded-xl shadow-lg">
              <span className="text-xs font-mono font-bold text-orange-400">
                SET {currentSet} / {currentExercise.sets}
              </span>
              <span className="text-neutral-500">•</span>
              <span className="text-xs font-bold text-neutral-200">
                {currentExercise.reps} REPS
              </span>
            </div>

            {/* Breathing Guide Floating Pill */}
            {currentExercise.breathingPattern && (
              <div className="absolute top-4 right-4 z-10 hidden sm:flex items-center gap-1.5 bg-black/75 backdrop-blur-md border border-neutral-800 px-3 py-1.5 rounded-xl text-[11px] text-cyan-300 shadow-lg">
                <span>🌬️ {currentExercise.breathingPattern}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Spotify player (only when the user chose Spotify) */}
      {cs.musicMode === 'spotify' && cs.spotifyUrl && (
        <div className="px-4 pt-2 bg-neutral-950 border-t border-neutral-900">
          <button
            onClick={() => setShowSpotify((v) => !v)}
            className="text-[11px] font-bold text-emerald-400 mb-1"
          >
            {showSpotify ? 'Hide Spotify' : 'Show Spotify'}
          </button>
          {showSpotify && (
            <iframe
              title="Spotify player"
              src={cs.spotifyUrl}
              width="100%"
              height="152"
              style={{ border: 0, borderRadius: 12 }}
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
            />
          )}
        </div>
      )}

      {/* Bottom Exercise Controls & HUD */}
      <div className="px-5 py-4 border-t border-neutral-900 bg-neutral-950 space-y-4">
        {/* Exercise Name & Timer */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xl font-black text-white tracking-tight">
              {currentExercise.name}
            </div>
            <div className="text-xs text-neutral-400 mt-0.5">
              Focus: <span className="text-orange-400 capitalize">{currentExercise.primaryMuscles[0]?.replace('_', ' ')}</span>
            </div>
          </div>

          <div className="text-3xl font-mono font-black text-orange-500">
            {formatTime(timeLeft)}
          </div>
        </div>

        {/* Linear Progress Bar */}
        <div className="w-full h-2 bg-neutral-900 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-300 rounded-full"
            style={{
              width: `${
                ((currentIdx * (currentExercise.sets || 1) + currentSet) /
                  (totalExercises * (currentExercise.sets || 1))) *
                100
              }%`,
            }}
          />
        </div>

        {/* Action Buttons: Pause / Play / Skip */}
        <div className="flex items-center justify-center gap-4 pt-1">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="p-4 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold transition active:scale-95"
            title={isPaused ? 'Resume' : 'Pause'}
          >
            {isPaused ? <Play className="w-6 h-6 fill-current" /> : <Pause className="w-6 h-6" />}
          </button>

          <button
            onClick={skipCurrent}
            className="px-6 py-4 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm tracking-wide shadow-lg shadow-orange-500/25 flex items-center gap-2 transition active:scale-95"
          >
            <span>NEXT / SKIP</span>
            <SkipForward className="w-5 h-5" />
          </button>
        </div>
      </div>
      {showCoach && <CoachPanel onClose={() => setShowCoach(false)} />}
    </div>
  );
};
