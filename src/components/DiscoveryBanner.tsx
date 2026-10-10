import React, { useEffect } from 'react';
import { ISLAND_LOCATIONS } from '../data/locations';
import { ChogCharacter } from '../types/game';
import { Compass, Sparkles, X } from 'lucide-react';

interface DiscoveryBannerProps {
  locationId: string;
  locationName: string;
  character: ChogCharacter;
  nickname: string;
  totalDiscovered: number;
  onClose: () => void;
}

export const DiscoveryBanner: React.FC<DiscoveryBannerProps> = ({
  locationId,
  locationName,
  character,
  nickname,
  totalDiscovered,
  onClose,
}) => {
  const locDef = ISLAND_LOCATIONS.find((l) => l.id === locationId);

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 6000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 animate-bounce-short w-full max-w-md px-4">
      <div className="bg-slate-900/95 border-2 border-emerald-400/80 rounded-2xl p-4 shadow-2xl shadow-emerald-950/80 backdrop-blur-xl text-white flex flex-col gap-2 relative overflow-hidden">
        {/* Animated Background Glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-purple-500/10 to-transparent pointer-events-none" />

        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2 font-bold text-sm font-outfit text-emerald-300">
            <Compass className="w-5 h-5 text-emerald-400 animate-spin-slow" /> LANDMARK DISCOVERED!
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-start gap-3 mt-1">
          <div className="text-3xl bg-slate-950/80 border border-slate-800 rounded-xl p-2 shrink-0">
            {locDef?.icon || '📍'}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-extrabold text-base text-slate-100 font-outfit">{locationName}</h3>
            <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{locDef?.description}</p>
            {locDef?.chogLore && (
              <p className="text-[11px] text-purple-300 italic mt-1 bg-purple-950/40 p-1.5 rounded-lg border border-purple-800/30">
                "{locDef.chogLore}"
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] font-medium text-slate-400 pt-2 border-t border-slate-800/80">
          <span className="flex items-center gap-1 text-slate-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Recorded for <strong>{nickname}</strong> ({character.name})
          </span>
          <span className="text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-800/40">
            {totalDiscovered}/3 Landmarks Found
          </span>
        </div>
      </div>
    </div>
  );
};
