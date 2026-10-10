import React from 'react';
import { ChogCharacter } from '../types/game';
import { Hand, Sparkles, ShieldCheck, Users, Compass } from 'lucide-react';

interface EmoteBarProps {
  character: ChogCharacter;
  onWave: () => void;
  onTraitEmote: () => void;
  onToggleIdentity: () => void;
  onTogglePlayerList: () => void;
  discoveredCount: number;
}

export const EmoteBar: React.FC<EmoteBarProps> = ({
  character,
  onWave,
  onTraitEmote,
  onToggleIdentity,
  onTogglePlayerList,
  discoveredCount,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 bg-slate-900/90 border border-purple-500/30 rounded-2xl p-2 shadow-2xl backdrop-blur-md">
      {/* Wave Emote Button */}
      <button
        onClick={onWave}
        className="px-3.5 py-2 bg-purple-950/60 hover:bg-purple-900/80 border border-purple-500/40 text-purple-200 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md active:scale-95"
      >
        <Hand className="w-4 h-4 text-purple-400" /> 👋 Wave
      </button>

      {/* Trait Emote Button */}
      <button
        onClick={onTraitEmote}
        className="px-3.5 py-2 bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/40 text-emerald-200 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md active:scale-95"
      >
        <Sparkles className="w-4 h-4 text-emerald-400" /> {character.emoteEffect.icon} {character.emoteEffect.label}
      </button>

      <div className="h-4 w-px bg-slate-800 mx-1 hidden sm:block" />

      {/* Identity Card Button */}
      <button
        onClick={onToggleIdentity}
        className="px-3.5 py-2 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 active:scale-95"
      >
        <ShieldCheck className="w-4 h-4 text-purple-400" /> 🪪 Identity Card
      </button>

      {/* Player List Toggle */}
      <button
        onClick={onTogglePlayerList}
        className="px-3.5 py-2 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 active:scale-95"
      >
        <Users className="w-4 h-4 text-emerald-400" /> 👥 Players
      </button>

      {/* Discovery Counter Badge */}
      <div className="px-3 py-2 bg-slate-950 border border-slate-800 text-slate-300 rounded-xl text-xs font-medium flex items-center gap-1.5">
        <Compass className="w-3.5 h-3.5 text-amber-400" />
        <span>Landmarks: <strong className="text-emerald-400">{discoveredCount}/3</strong></span>
      </div>
    </div>
  );
};
