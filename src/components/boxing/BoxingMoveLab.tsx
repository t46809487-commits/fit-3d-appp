import React, { useState } from 'react';
import { X, Play, Pause, RotateCcw } from 'lucide-react';
import { Boxing3DModel } from '../3d/Boxing3DModel';
import { ALL_MOVES, MoveDef } from '../3d/boxing/boxingMoves';
import { MOVE_INFO } from '../3d/boxing/boxingCatalog';
import { CharacterModelId, AvatarConfiguration } from '../../types';

interface BoxingMoveLabProps {
  onClose: () => void;
  characterId?: CharacterModelId;
  avatarConfig?: AvatarConfiguration;
}

const GROUPS: Array<{ title: string; kind: MoveDef['kind']; moves: MoveDef[] }> = [
  { title: 'Punches', kind: 'punch', moves: ALL_MOVES.filter((m) => m.kind === 'punch') },
  { title: 'Footwork', kind: 'footwork', moves: ALL_MOVES.filter((m) => m.kind === 'footwork') },
  { title: 'Defence', kind: 'defense', moves: ALL_MOVES.filter((m) => m.kind === 'defense') },
];
const SPEEDS: Array<{ label: string; value: number }> = [
  { label: '0.25x', value: 0.25 },
  { label: '0.5x', value: 0.5 },
  { label: 'Normal', value: 1 },
];

/** Practice lab: pick any punch, footwork or defence move and watch the 3D boxer perform it (with slow motion). */
export const BoxingMoveLab: React.FC<BoxingMoveLabProps> = ({ onClose, characterId, avatarConfig }) => {
  const [moveId, setMoveId] = useState<string>('box_jab');
  const [speed, setSpeed] = useState<number>(1);
  const [paused, setPaused] = useState<boolean>(false);
  const [ready, setReady] = useState<boolean>(false);
  const [restartKey, setRestartKey] = useState<number>(0);

  const move = ALL_MOVES.find((m) => m.id === moveId) ?? ALL_MOVES[0];
  const info = MOVE_INFO[moveId];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-neutral-950 text-white select-none">
      <div className="flex items-center justify-between px-4 py-3 border-b border-red-950/40 bg-neutral-950/90">
        <div>
          <div className="text-xs uppercase font-extrabold tracking-widest text-red-500">Boxing Move Lab</div>
          <div className="text-sm font-black">{move.name}</div>
        </div>
        <button onClick={onClose} className="p-2 rounded-xl bg-neutral-900 text-neutral-400 hover:text-white" title="Close">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="relative w-full bg-black" style={{ height: '46%' }}>
        <Boxing3DModel
          sequence={[]}
          useBag={false}
          move={moveId}
          restartKey={restartKey}
          isPaused={paused || !ready}
          speed={speed}
          characterId={characterId}
          avatarConfig={avatarConfig}
          height="100%"
          onReady={() => setReady(true)}
        />
        <div className="absolute bottom-2 left-0 right-0 flex items-center justify-center gap-2">
          <button
            onClick={() => setPaused((p) => !p)}
            className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-black flex items-center gap-1"
          >
            {paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />} {paused ? 'Play' : 'Pause'}
          </button>
          <button
            onClick={() => setRestartKey((k) => k + 1)}
            className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-bold flex items-center gap-1"
          >
            <RotateCcw className="w-4 h-4" /> Restart
          </button>
          {SPEEDS.map((s) => (
            <button
              key={s.label}
              onClick={() => setSpeed(s.value)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold ${speed === s.value ? 'bg-white text-black' : 'bg-neutral-800 text-neutral-300'}`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {GROUPS.map((g) => (
          <div key={g.title} className="pt-3">
            <div className="text-[11px] uppercase tracking-widest font-extrabold text-neutral-500 mb-1.5">{g.title}</div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {g.moves.map((m) => (
                <button
                  key={m.id}
                  onClick={() => { setMoveId(m.id); setRestartKey((k) => k + 1); }}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border ${
                    moveId === m.id ? 'bg-red-600 border-red-500 text-white' : 'bg-neutral-900 border-neutral-800 text-neutral-300'
                  }`}
                >
                  {m.name}
                </button>
              ))}
            </div>
          </div>
        ))}

        {info && (
          <div className="mt-4 rounded-2xl bg-neutral-900 border border-neutral-800 p-4 space-y-3 text-sm">
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2 py-0.5 rounded-full bg-red-600/20 text-red-400 font-bold">{info.difficulty}</span>
              <span className="text-neutral-400">Practice: {info.practice}</span>
            </div>
            <div>
              <div className="text-xs font-extrabold uppercase text-neutral-500 mb-1">How to do it</div>
              <ol className="list-decimal pl-5 space-y-0.5 text-neutral-200">{info.how.map((s) => <li key={s}>{s}</li>)}</ol>
            </div>
            <div>
              <div className="text-xs font-extrabold uppercase text-neutral-500 mb-1">Common mistakes</div>
              <ul className="list-disc pl-5 space-y-0.5 text-neutral-300">{info.mistakes.map((s) => <li key={s}>{s}</li>)}</ul>
            </div>
            <div>
              <div className="text-xs font-extrabold uppercase text-neutral-500 mb-1">Safety</div>
              <p className="text-neutral-300">{info.safety}</p>
            </div>
            <div>
              <div className="text-xs font-extrabold uppercase text-neutral-500 mb-1">Muscles</div>
              <div className="flex flex-wrap gap-1.5">
                {info.muscles.map((s) => <span key={s} className="px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-200 text-xs">{s}</span>)}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
