import React from 'react';
import { ChogCharacter } from '../types/game';
import { Hand, Sparkles, ShieldCheck, Users, Compass, MessageSquare, Swords } from 'lucide-react';

interface EmoteBarProps {
  character: ChogCharacter;
  onWave: () => void;
  onTraitEmote: () => void;
  onToggleIdentity: () => void;
  onTogglePlayerList: () => void;
  onToggleChat?: () => void;
  discoveredCount: number;
  onAttack?: () => void;
}

export const EmoteBar: React.FC<EmoteBarProps> = ({
  character,
  onWave,
  onTraitEmote,
  onToggleIdentity,
  onTogglePlayerList,
  onToggleChat,
  discoveredCount,
  onAttack,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-1.5 bg-slate-900/95 border border-purple-500/30 rounded-2xl px-2 py-1.5 sm:px-3 sm:py-2 shadow-2xl backdrop-blur-md max-w-full">

      {/* ⚔️ Attack — primary action, most prominent */}
      {onAttack && (
        <button
          onPointerDown={(e) => { e.preventDefault(); onAttack(); }}
          className="flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 bg-red-950/80 hover:bg-red-900/90 active:bg-red-800 border border-red-500/50 hover:border-red-400/70 text-red-200 hover:text-white rounded-xl text-[11px] sm:text-xs font-bold transition shadow-md active:scale-95 touch-none select-none"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <Swords className="w-4 h-4 text-red-400" />
          <span>Attack</span>
        </button>
      )}

      <div className="w-px h-4 bg-slate-700 hidden sm:block" />

      {/* 👋 Wave */}
      <button
        onClick={onWave}
        className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-purple-950/60 hover:bg-purple-900/80 border border-purple-500/40 text-purple-200 hover:text-white rounded-xl text-[10px] sm:text-xs font-semibold transition active:scale-95 whitespace-nowrap"
      >
        <Hand className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400" />
        <span className="hidden sm:inline">Wave</span>
      </button>

      {/* Trait emote */}
      <button
        onClick={onTraitEmote}
        className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/40 text-emerald-200 hover:text-white rounded-xl text-[10px] sm:text-xs font-semibold transition active:scale-95 whitespace-nowrap"
      >
        <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
        <span>{character.emoteEffect.icon}</span>
        <span className="hidden md:inline">{character.emoteEffect.label}</span>
      </button>

      <div className="w-px h-4 bg-slate-700 hidden sm:block" />

      {/* Chat toggle — mobile only (desktop has sidebar) */}
      {onToggleChat && (
        <button
          onClick={onToggleChat}
          className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-600 text-slate-300 hover:text-white rounded-xl text-[10px] sm:text-xs font-semibold transition active:scale-95 lg:hidden"
        >
          <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
          <span className="hidden sm:inline">Chat</span>
        </button>
      )}

      {/* Identity */}
      <button
        onClick={onToggleIdentity}
        className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-600 text-slate-300 hover:text-white rounded-xl text-[10px] sm:text-xs font-semibold transition active:scale-95 whitespace-nowrap"
      >
        <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400" />
        <span className="hidden sm:inline">Card</span>
      </button>

      {/* Player list */}
      <button
        onClick={onTogglePlayerList}
        className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-600 text-slate-300 hover:text-white rounded-xl text-[10px] sm:text-xs font-semibold transition active:scale-95 whitespace-nowrap"
      >
        <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
        <span className="hidden sm:inline">Chogs</span>
      </button>

      {/* Discovery */}
      <div className="flex items-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2 bg-slate-950/80 border border-slate-700 text-slate-300 rounded-xl text-[10px] sm:text-xs font-medium whitespace-nowrap">
        <Compass className="w-3.5 h-3.5 text-amber-400" />
        <strong className="text-emerald-400">{discoveredCount}/3</strong>
      </div>
    </div>
  );
};
