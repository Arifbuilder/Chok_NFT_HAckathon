import React from 'react';
import { ChogCharacter } from '../types/game';
import { Hand, Sparkles, ShieldCheck, Users, Compass, MessageSquare } from 'lucide-react';

interface EmoteBarProps {
  character: ChogCharacter;
  onWave: () => void;
  onTraitEmote: () => void;
  onToggleIdentity: () => void;
  onTogglePlayerList: () => void;
  onToggleChat?: () => void;
  discoveredCount: number;
}

export const EmoteBar: React.FC<EmoteBarProps> = ({
  character,
  onWave,
  onTraitEmote,
  onToggleIdentity,
  onTogglePlayerList,
  onToggleChat,
  discoveredCount,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 bg-slate-900/95 border border-purple-500/30 rounded-2xl p-1.5 sm:p-2 shadow-2xl backdrop-blur-md max-w-full">
      {/* Wave Emote Button */}
      <button
        onClick={onWave}
        className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 bg-purple-950/60 hover:bg-purple-900/80 border border-purple-500/40 text-purple-200 hover:text-white rounded-xl text-[11px] sm:text-xs font-bold transition flex items-center gap-1 sm:gap-1.5 shadow-md active:scale-95 whitespace-nowrap"
      >
        <Hand className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400" /> Wave
      </button>

      {/* Trait Emote Button */}
      <button
        onClick={onTraitEmote}
        className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/40 text-emerald-200 hover:text-white rounded-xl text-[11px] sm:text-xs font-bold transition flex items-center gap-1 sm:gap-1.5 shadow-md active:scale-95 whitespace-nowrap"
      >
        <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" /> {character.emoteEffect.icon} <span className="hidden xs:inline">{character.emoteEffect.label}</span>
      </button>

      {/* Mobile Chat Toggle Button */}
      {onToggleChat && (
        <button
          onClick={onToggleChat}
          className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 hover:text-white rounded-xl text-[11px] sm:text-xs font-semibold transition flex items-center gap-1 sm:gap-1.5 active:scale-95 lg:hidden whitespace-nowrap"
        >
          <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400" /> Chat
        </button>
      )}

      <div className="h-4 w-px bg-slate-800 mx-0.5 hidden sm:block" />

      {/* Identity Card Button */}
      <button
        onClick={onToggleIdentity}
        className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 hover:text-white rounded-xl text-[11px] sm:text-xs font-semibold transition flex items-center gap-1 sm:gap-1.5 active:scale-95 whitespace-nowrap"
      >
        <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400" /> Card
      </button>

      {/* Player List Toggle */}
      <button
        onClick={onTogglePlayerList}
        className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 hover:text-white rounded-xl text-[11px] sm:text-xs font-semibold transition flex items-center gap-1 sm:gap-1.5 active:scale-95 whitespace-nowrap"
      >
        <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" /> Chogs
      </button>

      {/* Discovery Counter Badge */}
      <div className="px-2.5 sm:px-3 py-1.5 sm:py-2 bg-slate-950 border border-slate-800 text-slate-300 rounded-xl text-[11px] sm:text-xs font-medium flex items-center gap-1 sm:gap-1.5 whitespace-nowrap">
        <Compass className="w-3.5 h-3.5 text-amber-400" />
        <span><strong className="text-emerald-400">{discoveredCount}/3</strong></span>
      </div>
    </div>
  );
};
