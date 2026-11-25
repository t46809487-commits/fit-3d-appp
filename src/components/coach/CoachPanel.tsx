import React, { useState } from 'react';
import { X, Mic, Music, Volume2, Check, Play, ExternalLink } from 'lucide-react';
import {
  COACHES,
  SPOTIFY_PRESETS,
  coach,
  parseSpotifyUrl,
  updateCoachSettings,
  useCoachSettings,
  type MusicMode,
} from '../../services/coach';
import { TRACKS } from '../../services/music';

interface CoachPanelProps {
  onClose: () => void;
}

const Switch: React.FC<{ on: boolean; onChange: (v: boolean) => void; label: string }> = ({ on, onChange, label }) => (
  <button
    type="button"
    role="switch"
    aria-checked={on}
    aria-label={label}
    onClick={() => onChange(!on)}
    className={`relative w-12 h-7 rounded-full transition ${on ? 'bg-orange-500' : 'bg-neutral-700'}`}
  >
    <span
      className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white transition-transform ${on ? 'translate-x-5' : ''}`}
    />
  </button>
);

const Slider: React.FC<{ value: number; onChange: (v: number) => void; label: string }> = ({ value, onChange, label }) => (
  <label className="flex items-center gap-3 text-xs text-neutral-400">
    <Volume2 className="w-4 h-4 shrink-0" />
    <span className="w-14 shrink-0">{label}</span>
    <input
      type="range"
      min={0}
      max={1}
      step={0.05}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="flex-1 accent-orange-500"
    />
    <span className="w-9 text-right text-neutral-300">{Math.round(value * 100)}%</span>
  </label>
);

export const CoachPanel: React.FC<CoachPanelProps> = ({ onClose }) => {
  const s = useCoachSettings();
  const [link, setLink] = useState<string>('');
  const [linkError, setLinkError] = useState<string>('');

  const setMode = (mode: MusicMode) => updateCoachSettings({ musicMode: mode });

  const applyLink = (raw: string) => {
    const embed = parseSpotifyUrl(raw);
    if (!embed) {
      setLinkError('Please paste a Spotify playlist, album or song link (open.spotify.com/...).');
      return;
    }
    setLinkError('');
    updateCoachSettings({ spotifyUrl: embed, musicMode: 'spotify' });
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg max-h-[92vh] overflow-y-auto bg-neutral-950 border border-neutral-800 rounded-t-3xl sm:rounded-3xl p-5 space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-white">AI Coach &amp; Music</h2>
          <button onClick={onClose} className="p-2 rounded-xl bg-neutral-900 text-neutral-400 hover:text-white" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ---------------- Coach ---------------- */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white font-bold">
              <Mic className="w-5 h-5 text-orange-400" /> Voice coach
            </div>
            <Switch on={s.coachEnabled} onChange={(v) => updateCoachSettings({ coachEnabled: v })} label="Voice coach" />
          </div>
          <p className="text-xs text-neutral-500">
            {s.coachEnabled
              ? 'The coach introduces every exercise, gives form tips, counts down and guides your rest.'
              : 'Coach is OFF. You will only hear the beeps.'}
          </p>

          <div className={`grid grid-cols-2 gap-3 ${s.coachEnabled ? '' : 'opacity-40 pointer-events-none'}`}>
            {COACHES.map((c) => {
              const active = s.coachId === c.id;
              return (
                <div
                  key={c.id}
                  className={`rounded-2xl border p-3 space-y-2 ${active ? 'border-orange-500 bg-orange-500/10' : 'border-neutral-800 bg-neutral-900'}`}
                >
                  <button
                    type="button"
                    onClick={() => updateCoachSettings({ coachId: c.id })}
                    className="w-full text-left"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-white">{c.name}</span>
                      {active && <Check className="w-4 h-4 text-orange-400" />}
                    </div>
                    <div className="text-[11px] uppercase tracking-wider text-neutral-400">
                      {c.gender === 'male' ? 'Male voice' : 'Female voice'}
                    </div>
                    <div className="text-xs text-neutral-300 mt-0.5">{c.style}</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => coach.preview(c.id)}
                    className="w-full py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-neutral-200 flex items-center justify-center gap-1"
                  >
                    <Play className="w-3.5 h-3.5" /> Listen
                  </button>
                </div>
              );
            })}
          </div>

          <div className={s.coachEnabled ? '' : 'opacity-40 pointer-events-none'}>
            <Slider value={s.voiceVolume} onChange={(v) => updateCoachSettings({ voiceVolume: v })} label="Coach" />
          </div>
          {!coach.supported && (
            <p className="text-xs text-amber-400">This browser does not support voice. Try Chrome or Safari.</p>
          )}
          <p className="text-[11px] text-neutral-500">
            Voices come from your phone/browser, so they can sound a little different on each device.
          </p>
        </section>

        {/* ---------------- Music ---------------- */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-white font-bold">
            <Music className="w-5 h-5 text-orange-400" /> Workout music
          </div>

          <div className="grid grid-cols-3 gap-2 p-1 rounded-2xl bg-neutral-900">
            {([
              ['off', 'Off'],
              ['builtin', 'Built-in beats'],
              ['spotify', 'Spotify'],
            ] as Array<[MusicMode, string]>).map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                onClick={() => setMode(mode)}
                className={`py-2 rounded-xl text-xs font-bold transition ${
                  s.musicMode === mode ? 'bg-orange-500 text-white' : 'text-neutral-400 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {s.musicMode === 'off' && <p className="text-xs text-neutral-500">Music is OFF.</p>}

          {s.musicMode === 'builtin' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {TRACKS.map((t) => {
                  const active = s.trackId === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => updateCoachSettings({ trackId: t.id })}
                      className={`text-left rounded-2xl border p-3 ${
                        active ? 'border-orange-500 bg-orange-500/10' : 'border-neutral-800 bg-neutral-900'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-sm">{t.name}</span>
                        {active && <Check className="w-4 h-4 text-orange-400" />}
                      </div>
                      <div className="text-xs text-neutral-400 mt-0.5">{t.mood}</div>
                      <div className="text-[11px] text-neutral-500">{t.bpm} BPM</div>
                    </button>
                  );
                })}
              </div>
              <Slider value={s.musicVolume} onChange={(v) => updateCoachSettings({ musicVolume: v })} label="Music" />
              <p className="text-[11px] text-neutral-500">
                These beats are created inside the app, so they are free to use. For real songs, choose Spotify.
              </p>
            </div>
          )}

          {s.musicMode === 'spotify' && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {SPOTIFY_PRESETS.map((p) => (
                  <button
                    key={p.url}
                    type="button"
                    onClick={() => applyLink(p.url)}
                    className="px-3 py-1.5 rounded-full bg-neutral-900 border border-neutral-800 hover:border-emerald-500 text-xs font-bold text-neutral-200"
                  >
                    {p.name}
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="Paste your Spotify playlist / song link"
                  className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => applyLink(link)}
                  className="px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold"
                >
                  Use
                </button>
              </div>
              {linkError && <p className="text-xs text-red-400">{linkError}</p>}
              {s.spotifyUrl && !linkError && (
                <p className="text-xs text-emerald-400 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Spotify player is ready. It appears in your workout screen.
                </p>
              )}
              <p className="text-[11px] text-neutral-500">
                Press play inside the Spotify player. Log in to Spotify in your browser to hear full songs;
                otherwise Spotify only plays 30-second previews. Premium is not required for the player to show.
              </p>
              <a
                href="https://open.spotify.com"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-neutral-400 hover:text-white"
              >
                Open Spotify <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </section>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-sm"
        >
          Done
        </button>
      </div>
    </div>
  );
};
