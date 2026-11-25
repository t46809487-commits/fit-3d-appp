// Built-in workout music. These are ORIGINAL beats generated live with the Web Audio API
// (no audio files, no copyrighted songs). For real songs the user can pick Spotify instead.

export interface Track {
  id: string;
  name: string;
  mood: string;
  bpm: number;
  rootMidi: number; // bass root note
  scale: number[]; // semitone offsets used for bass / lead
  kick: string; // 16 steps, 'x' = hit
  snare: string;
  hat: string;
  bass: number[]; // 16 steps: scale degree index, -1 = rest
  lead: number[]; // 16 steps: scale degree index (one octave up), -1 = rest
  leadWave: OscillatorType;
}

const MINOR = [0, 3, 5, 7, 10, 12, 15];
const PENTA = [0, 3, 5, 7, 10, 12, 15];

export const TRACKS: Track[] = [
  {
    id: 'power-pump', name: 'Power Pump', mood: 'Heavy & driving', bpm: 128, rootMidi: 38, scale: MINOR,
    kick: 'x...x...x...x...', snare: '....x.......x...', hat: '..x...x...x...x.',
    bass: [0, -1, 0, 0, -1, 0, 2, -1, 0, -1, 0, 0, -1, 3, 2, -1],
    lead: [-1, -1, 4, -1, -1, -1, 3, -1, -1, -1, 4, -1, 5, -1, 3, -1], leadWave: 'sawtooth',
  },
  {
    id: 'hype-run', name: 'Hype Run', mood: 'Fast cardio', bpm: 140, rootMidi: 40, scale: MINOR,
    kick: 'x..x..x...x..x..', snare: '....x.......x..x', hat: 'x.x.x.x.x.x.x.x.',
    bass: [0, 0, -1, 0, 3, -1, 0, -1, 0, 0, -1, 2, 3, -1, 4, -1],
    lead: [4, -1, 5, -1, 4, -1, 3, -1, 4, -1, 5, -1, 6, -1, 5, -1], leadWave: 'square',
  },
  {
    id: 'chill-flow', name: 'Chill Flow', mood: 'Warm-up & stretch', bpm: 92, rootMidi: 43, scale: PENTA,
    kick: 'x.......x.x.....', snare: '........x.......', hat: 'x.x.x.x.x.x.x.x.',
    bass: [0, -1, -1, -1, 2, -1, -1, -1, 3, -1, -1, -1, 2, -1, -1, -1],
    lead: [4, -1, -1, 3, -1, -1, 2, -1, 4, -1, -1, 5, -1, -1, 3, -1], leadWave: 'triangle',
  },
  {
    id: 'focus-beat', name: 'Focus Beat', mood: 'Strength & control', bpm: 104, rootMidi: 36, scale: MINOR,
    kick: 'x.....x.x.......', snare: '....x.......x...', hat: '..x...x...x...x.',
    bass: [0, -1, -1, 0, -1, -1, 2, -1, 0, -1, -1, 0, -1, 3, -1, -1],
    lead: [-1, -1, -1, -1, 3, -1, -1, -1, -1, -1, -1, -1, 2, -1, 4, -1], leadWave: 'triangle',
  },
];

const midiToHz = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

class MusicPlayer {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private timer: number | null = null;
  private track: Track | null = null;
  private step = 0;
  private nextTime = 0;
  private volume = 0.5;
  private ducked = false;

  get playing(): boolean {
    return this.timer !== null;
  }

  private ensure(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0;
      this.master.connect(this.ctx.destination);
      // 1 second of white noise, reused for snare and hats
      const len = this.ctx.sampleRate;
      this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noise.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
    return this.ctx;
  }

  private level(): number {
    // Music is intentionally quiet (max ~0.35 gain) so it never drowns the coach.
    return this.volume * 0.35 * (this.ducked ? 0.3 : 1);
  }

  private applyLevel(fade = 0.15) {
    if (!this.ctx || !this.master) return;
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setTargetAtTime(this.level(), now, fade);
  }

  setVolume(v: number) {
    this.volume = Math.min(1, Math.max(0, v));
    this.applyLevel();
  }

  /** Called by the coach: lowers the music while the coach is speaking. */
  duck(on: boolean) {
    this.ducked = on;
    this.applyLevel(0.08);
  }

  start(trackId: string, volume: number) {
    const track = TRACKS.find((t) => t.id === trackId) ?? TRACKS[0];
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    this.stopTimerOnly();
    this.track = track;
    this.volume = volume;
    this.step = 0;
    this.nextTime = ctx.currentTime + 0.08;
    this.applyLevel(0.4);
    this.timer = window.setInterval(() => this.schedule(), 25);
  }

  private stopTimerOnly() {
    if (this.timer !== null) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
  }

  stop() {
    this.stopTimerOnly();
    if (this.ctx && this.master) {
      const now = this.ctx.currentTime;
      this.master.gain.cancelScheduledValues(now);
      this.master.gain.setTargetAtTime(0, now, 0.1);
    }
  }

  pause() {
    this.stopTimerOnly();
    if (this.ctx && this.master) this.master.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
  }

  resume() {
    if (!this.track || this.timer !== null) return;
    const ctx = this.ensure();
    if (!ctx) return;
    this.nextTime = ctx.currentTime + 0.05;
    this.applyLevel(0.2);
    this.timer = window.setInterval(() => this.schedule(), 25);
  }

  // Looks ~120 ms ahead and schedules every 16th note that falls in that window.
  private schedule() {
    const ctx = this.ctx;
    const t = this.track;
    if (!ctx || !t) return;
    const stepLen = 60 / t.bpm / 4;
    while (this.nextTime < ctx.currentTime + 0.12) {
      this.playStep(t, this.step % 16, this.nextTime, stepLen);
      this.nextTime += stepLen;
      this.step += 1;
    }
  }

  private playStep(t: Track, i: number, when: number, stepLen: number) {
    if (t.kick[i] === 'x') this.kick(when);
    if (t.snare[i] === 'x') this.snare(when);
    if (t.hat[i] === 'x') this.hat(when, i % 4 === 2);
    const b = t.bass[i];
    if (b >= 0) this.tone(midiToHz(t.rootMidi + t.scale[b % t.scale.length]), when, stepLen * 1.8, 'sawtooth', 0.5, 420);
    const l = t.lead[i];
    if (l >= 0) this.tone(midiToHz(t.rootMidi + 24 + t.scale[l % t.scale.length]), when, stepLen * 1.6, t.leadWave, 0.16, 2600);
  }

  private kick(when: number) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(150, when);
    o.frequency.exponentialRampToValueAtTime(42, when + 0.14);
    g.gain.setValueAtTime(1, when);
    g.gain.exponentialRampToValueAtTime(0.001, when + 0.22);
    o.connect(g).connect(this.master!);
    o.start(when);
    o.stop(when + 0.24);
  }

  private noiseHit(when: number, dur: number, freq: number, type: BiquadFilterType, vol: number) {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, when);
    g.gain.exponentialRampToValueAtTime(0.001, when + dur);
    src.connect(f).connect(g).connect(this.master!);
    src.start(when, Math.random() * 0.5);
    src.stop(when + dur + 0.02);
  }

  private snare(when: number) {
    this.noiseHit(when, 0.16, 1800, 'bandpass', 0.55);
  }

  private hat(when: number, open: boolean) {
    this.noiseHit(when, open ? 0.12 : 0.04, 7500, 'highpass', open ? 0.22 : 0.16);
  }

  private tone(freq: number, when: number, dur: number, wave: OscillatorType, vol: number, cutoff: number) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    const f = ctx.createBiquadFilter();
    const g = ctx.createGain();
    o.type = wave;
    o.frequency.value = freq;
    f.type = 'lowpass';
    f.frequency.value = cutoff;
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(vol, when + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, when + dur);
    o.connect(f).connect(g).connect(this.master!);
    o.start(when);
    o.stop(when + dur + 0.02);
  }
}

export const musicPlayer = new MusicPlayer();
