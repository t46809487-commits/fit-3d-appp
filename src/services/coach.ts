// AI Coach: spoken guidance for every exercise, using the browser's built-in speech engine
// (Web Speech API). No server and no API key needed. The user can turn it off at any time.
import { useSyncExternalStore } from 'react';
import type { Exercise } from '../types';

// ---------------------------------------------------------------------------------------------
// Settings (saved on the device)
// ---------------------------------------------------------------------------------------------
export type CoachId = 'arjun' | 'vikram' | 'priya' | 'meera';
export type MusicMode = 'off' | 'builtin' | 'spotify';

export interface CoachProfile {
  id: CoachId;
  name: string;
  gender: 'male' | 'female';
  style: string;
  pitch: number;
  rate: number;
}

// 4 coaches: 2 male + 2 female. Pitch/rate make each one sound different even when the
// device only has one male and one female system voice.
export const COACHES: CoachProfile[] = [
  { id: 'arjun', name: 'Arjun', gender: 'male', style: 'Energetic & loud', pitch: 1.0, rate: 1.12 },
  { id: 'vikram', name: 'Vikram', gender: 'male', style: 'Calm & deep', pitch: 0.75, rate: 0.95 },
  { id: 'priya', name: 'Priya', gender: 'female', style: 'Upbeat & motivating', pitch: 1.25, rate: 1.1 },
  { id: 'meera', name: 'Meera', gender: 'female', style: 'Calm & soothing', pitch: 1.0, rate: 0.95 },
];

export interface CoachSettings {
  coachEnabled: boolean;
  coachId: CoachId;
  voiceVolume: number; // 0..1
  musicMode: MusicMode;
  trackId: string;
  musicVolume: number; // 0..1
  spotifyUrl: string; // embed URL (see parseSpotifyUrl)
}

const STORAGE_KEY = 'fit3d.coach.v1';

const DEFAULTS: CoachSettings = {
  coachEnabled: true,
  coachId: 'arjun',
  voiceVolume: 1,
  musicMode: 'off',
  trackId: 'power-pump',
  musicVolume: 0.5,
  spotifyUrl: '',
};

function load(): CoachSettings {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (raw) return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<CoachSettings>) };
  } catch {
    /* ignore corrupt storage */
  }
  return { ...DEFAULTS };
}

let settings: CoachSettings = load();
const listeners = new Set<() => void>();

export function getCoachSettings(): CoachSettings {
  return settings;
}

export function updateCoachSettings(patch: Partial<CoachSettings>) {
  settings = { ...settings, ...patch };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    /* storage may be unavailable (private mode) */
  }
  if (patch.coachEnabled === false) coach.cancel();
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function useCoachSettings(): CoachSettings {
  return useSyncExternalStore(subscribe, getCoachSettings, getCoachSettings);
}

// ---------------------------------------------------------------------------------------------
// Voice selection
// ---------------------------------------------------------------------------------------------
const MALE_HINTS = [
  'male', 'david', 'mark', 'daniel', 'alex', 'fred', 'george', 'james', 'ravi', 'rishi', 'guy',
  'aaron', 'arthur', 'oliver', 'thomas', 'gordon', 'rocko', 'reed', 'eddy', 'ryan', 'liam', 'prabhat',
];
const FEMALE_HINTS = [
  'female', 'samantha', 'zira', 'susan', 'heera', 'hazel', 'karen', 'moira', 'tessa', 'fiona',
  'veena', 'victoria', 'allison', 'ava', 'serena', 'kalpana', 'aria', 'jenny', 'libby', 'sonia',
  'google us english', 'neerja', 'swara', 'priya', 'kate',
];

function langScore(v: SpeechSynthesisVoice): number {
  const l = v.lang.toLowerCase();
  if (l.startsWith('en-in')) return 3;
  if (l.startsWith('en-gb')) return 2;
  if (l.startsWith('en')) return 1;
  return 0;
}

function genderOf(v: SpeechSynthesisVoice): 'male' | 'female' | 'unknown' {
  const n = v.name.toLowerCase();
  // "google uk english male" contains both "male" and "female"-style substrings, so test male first
  // on explicit words and female hints second.
  if (/\bfemale\b/.test(n)) return 'female';
  if (/\bmale\b/.test(n)) return 'male';
  if (FEMALE_HINTS.some((h) => n.includes(h))) return 'female';
  if (MALE_HINTS.some((h) => n.includes(h))) return 'male';
  return 'unknown';
}

function pickVoice(profile: CoachProfile): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;
  const all = window.speechSynthesis
    .getVoices()
    .filter((v) => langScore(v) > 0)
    .sort((a, b) => langScore(b) - langScore(a));
  if (all.length === 0) return null;
  const sameGender = all.filter((v) => genderOf(v) === profile.gender);
  if (sameGender.length === 0) return all[0];
  // Two coaches share each gender: the first one gets the best voice, the second one the next.
  const second = profile.id === 'vikram' || profile.id === 'meera';
  return sameGender[second && sameGender.length > 1 ? 1 : 0];
}

// ---------------------------------------------------------------------------------------------
// Speaking
// ---------------------------------------------------------------------------------------------
type DuckFn = (ducked: boolean) => void;

class Coach {
  private duckFn: DuckFn | null = null;
  private pending = 0;

  /** Lets the music player lower its volume while the coach is talking. */
  setDuckHandler(fn: DuckFn | null) {
    this.duckFn = fn;
  }

  get supported(): boolean {
    return typeof window !== 'undefined' && !!window.speechSynthesis;
  }

  cancel() {
    if (!this.supported) return;
    try {
      window.speechSynthesis.cancel();
    } catch {
      /* ignore */
    }
    this.pending = 0;
    this.duckFn?.(false);
  }

  /**
   * Speak a line. By default it interrupts whatever the coach is saying (good for countdowns).
   * Use { queue: true } to wait for the current sentence to finish.
   */
  say(text: string, opts: { queue?: boolean; force?: boolean } = {}) {
    const s = getCoachSettings();
    if (!this.supported || !text) return;
    if (!s.coachEnabled && !opts.force) return;
    const profile = COACHES.find((c) => c.id === s.coachId) ?? COACHES[0];
    try {
      if (!opts.queue) {
        window.speechSynthesis.cancel();
        this.pending = 0;
      }
      const u = new SpeechSynthesisUtterance(text);
      const voice = pickVoice(profile);
      if (voice) {
        u.voice = voice;
        u.lang = voice.lang;
      } else {
        u.lang = 'en-IN';
      }
      u.pitch = profile.pitch;
      u.rate = profile.rate;
      u.volume = s.voiceVolume;
      this.pending += 1;
      u.onstart = () => this.duckFn?.(true);
      const done = () => {
        this.pending = Math.max(0, this.pending - 1);
        if (this.pending === 0) this.duckFn?.(false);
      };
      u.onend = done;
      u.onerror = done;
      window.speechSynthesis.speak(u);
    } catch {
      /* speech not available */
    }
  }

  /** Short sample so the user can compare the 4 coaches. */
  preview(id: CoachId) {
    const profile = COACHES.find((c) => c.id === id);
    if (!profile) return;
    const prev = getCoachSettings();
    settings = { ...prev, coachId: id };
    this.say(`Hi, I am ${profile.name}. Let's crush this workout together!`, { force: true });
    settings = prev;
  }
}

export const coach = new Coach();

// ---------------------------------------------------------------------------------------------
// What the coach says for each exercise
// ---------------------------------------------------------------------------------------------
const ENCOURAGE = [
  'Great form. Keep it up!',
  'You are doing amazing. Stay strong!',
  'Push through. Every rep counts!',
  'Nice and controlled. Keep going!',
  'Looking good. Do not slow down!',
];

const clean = (t: string) => t.replace(/\s+/g, ' ').replace(/[*_#]/g, '').trim();

function equipmentLine(ex: Exercise): string {
  const eq = ex.equipment.filter((e) => e !== 'No Equipment');
  if (eq.length === 0) return '';
  const names = eq.map((e) => e.replace(/s$/, '').toLowerCase());
  return `You will need ${names.join(' and ')}.`;
}

export function exerciseIntro(ex: Exercise, setNo: number): string {
  if (setNo > 1) return `Set ${setNo}. ${ex.name}. Get ready.`;
  const target = ex.durationSeconds ? `${ex.durationSeconds} seconds` : `${ex.reps} reps`;
  const setup = ex.instructions[0] ? clean(ex.instructions[0]) : '';
  return clean(`Next exercise: ${ex.name}. ${ex.sets} sets of ${target}. ${equipmentLine(ex)} ${setup}`);
}

/** i-th form cue for an exercise: its own instructions first, then common mistakes, then breathing. */
export function formCue(ex: Exercise, i: number): string {
  const cues: string[] = [];
  ex.instructions.slice(1).forEach((s) => cues.push(clean(s)));
  ex.commonMistakes.forEach((m) => cues.push(`Watch out: ${clean(m)}`));
  if (ex.breathingPattern) cues.push(`Breathing: ${clean(ex.breathingPattern)}`);
  if (cues.length === 0) return ENCOURAGE[i % ENCOURAGE.length];
  return cues[i % cues.length];
}

export function encouragement(i: number): string {
  return ENCOURAGE[i % ENCOURAGE.length];
}

export function restLine(next: Exercise | undefined, sameExercise: boolean): string {
  if (!next) return 'Rest. Breathe in slowly.';
  if (sameExercise) return `Rest. Breathe deeply. Next is another set of ${next.name}.`;
  return `Rest. Breathe deeply. Up next: ${next.name}. ${equipmentLine(next)}`;
}

// ---------------------------------------------------------------------------------------------
// Spotify
// ---------------------------------------------------------------------------------------------
export const SPOTIFY_PRESETS: Array<{ name: string; url: string }> = [
  { name: 'Beast Mode', url: 'https://open.spotify.com/playlist/37i9dQZF1DX76Wlfdnj7AP' },
  { name: 'Motivation Mix', url: 'https://open.spotify.com/playlist/37i9dQZF1DXdxcBWuJkbcy' },
  { name: 'Power Workout', url: 'https://open.spotify.com/playlist/37i9dQZF1DX70RN3TfWWJh' },
];

/** Turns any Spotify link (or spotify: URI) into an embeddable player URL, or null if invalid. */
export function parseSpotifyUrl(input: string): string | null {
  const text = input.trim();
  if (!text) return null;
  const web = text.match(/open\.spotify\.com\/(?:intl-[a-z]+\/)?(playlist|album|track|artist|show|episode)\/([A-Za-z0-9]+)/);
  if (web) return `https://open.spotify.com/embed/${web[1]}/${web[2]}?utm_source=generator&theme=0`;
  const uri = text.match(/^spotify:(playlist|album|track|artist|show|episode):([A-Za-z0-9]+)$/);
  if (uri) return `https://open.spotify.com/embed/${uri[1]}/${uri[2]}?utm_source=generator&theme=0`;
  return null;
}
