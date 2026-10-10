import React from 'react';
import { PlayerState } from '../types/game';
import { getCharacterById } from '../data/characters';
import { Users, X, MapPin } from 'lucide-react';

interface PlayerListProps {
  players: Record<string, PlayerState>;
  currentUserId: string;
  onClose: () => void;
}

export const PlayerList: React.FC<PlayerListProps> = ({ players, currentUserId, onClose }) => {
  const playerArray = Object.values(players);

  return (
    <div className="w-72 bg-slate-900/90 border border-purple-500/30 rounded-2xl p-4 shadow-2xl backdrop-blur-md text-white flex flex-col gap-3">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
          <Users className="w-4 h-4 text-emerald-400" /> Online Chogs ({playerArray.length})
        </div>
        <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Players List */}
      <div className="max-h-72 overflow-y-auto space-y-2 text-xs pr-1 scrollbar-thin scrollbar-thumb-slate-700">
        {playerArray.map((p) => {
          const charDef = getCharacterById(p.characterId);
          const isSelf = p.id === currentUserId;

          return (
            <div
              key={p.id}
              className={`flex items-center justify-between p-2.5 rounded-xl border transition ${
                isSelf
                  ? 'bg-purple-950/40 border-purple-500/40'
                  : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-sm border font-bold"
                  style={{
                    backgroundColor: `${charDef.colorHex}25`,
                    borderColor: `${charDef.colorHex}50`,
                  }}
                >
                  🐸
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-slate-200 truncate flex items-center gap-1">
                    {p.nickname} {isSelf && <span className="text-[10px] text-purple-400">(You)</span>}
                  </span>
                  <span className="text-[10px] text-slate-400 truncate">{charDef.name}</span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1">
                <span
                  className="px-1.5 py-0.5 text-[9px] font-bold rounded uppercase"
                  style={{
                    backgroundColor: `${charDef.colorHex}30`,
                    color: charDef.colorHex,
                  }}
                >
                  {charDef.rarity}
                </span>
                <span className="text-[9px] text-slate-500 flex items-center gap-0.5">
                  <MapPin className="w-2.5 h-2.5 text-emerald-400" /> {p.discoveredLocations?.length || 0}/3
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
