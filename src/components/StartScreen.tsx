import React, { useState } from 'react';
import { CHOG_CHARACTERS } from '../data/characters';
import { ChogCharacter } from '../types/game';
import { Sparkles, User, Play, ShieldAlert, Zap, Layers } from 'lucide-react';

interface StartScreenProps {
  onStart: (nickname: string, selectedCharacter: ChogCharacter) => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({ onStart }) => {
  const [nickname, setNickname] = useState('ChogMaster' + Math.floor(100 + Math.random() * 900));
  const [selectedChar, setSelectedChar] = useState<ChogCharacter>(CHOG_CHARACTERS[0]);

  const handleRandomizeName = () => {
    const prefixes = ['Hyper', 'Aurum', 'Cyber', 'Verdant', 'Monad', 'Turbo', 'Pixel', 'Cosmic'];
    const suffix = Math.floor(100 + Math.random() * 900);
    const randPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    setNickname(`${randPrefix}Chog#${suffix}`);
  };

  const handleEnterWorld = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = nickname.trim() || 'ChogExplorer';
    onStart(cleanName, selectedChar);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto">
      {/* Dynamic Animated Background Glow */}
      <div className="absolute w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute w-[400px] h-[400px] bg-emerald-500/15 rounded-full blur-[100px] pointer-events-none -bottom-20 -right-20" />

      <div className="relative w-full max-w-4xl bg-slate-900/90 border border-purple-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-purple-950/80 backdrop-blur-xl flex flex-col gap-6 my-auto">
        {/* Header Title Section */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 rounded-full flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-emerald-400" /> Monad Ecosystem Inspired
              </span>
              <span className="px-3 py-1 text-xs font-semibold text-purple-300 bg-purple-950/60 border border-purple-500/30 rounded-full flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-purple-400" /> Simulated Demo Mode
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-outfit">
              Chog World <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-emerald-400 to-cyan-400">— Your Chog, Your Identity</span>
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Explore the 2D real-time multiplayer island, socialize with other Chogs, and express your Monad NFT identity.
            </p>
          </div>
        </div>

        {/* Form Body: Nickname + Character Selector */}
        <form onSubmit={handleEnterWorld} className="flex flex-col gap-6">
          {/* Nickname Input */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
            <label className="text-sm font-semibold text-slate-300 flex items-center gap-2 whitespace-nowrap">
              <User className="w-4 h-4 text-purple-400" /> Player Nickname:
            </label>
            <div className="flex items-center gap-2 w-full">
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={18}
                required
                className="w-full bg-slate-900 border border-purple-500/30 rounded-xl px-4 py-2.5 text-white font-medium focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 transition"
                placeholder="Enter nickname..."
              />
              <button
                type="button"
                onClick={handleRandomizeName}
                className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition whitespace-nowrap"
              >
                🎲 Randomize
              </button>
            </div>
          </div>

          {/* Character Selection Grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" /> Select Your Chog NFT Identity:
              </label>
              <span className="text-xs text-slate-400">4 Original Preset Traits Available</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {CHOG_CHARACTERS.map((char) => {
                const isSelected = selectedChar.id === char.id;
                return (
                  <div
                    key={char.id}
                    onClick={() => setSelectedChar(char)}
                    className={`relative cursor-pointer rounded-2xl p-4 border transition-all duration-200 flex flex-col justify-between ${
                      isSelected
                        ? 'bg-slate-800/90 border-purple-400 ring-2 ring-purple-500/50 shadow-lg shadow-purple-950/50 scale-[1.02]'
                        : 'bg-slate-950/40 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                    }`}
                  >
                    {/* Top Rarity Badge */}
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className="px-2 py-0.5 text-[10px] font-bold rounded-md uppercase"
                        style={{
                          backgroundColor: `${char.colorHex}25`,
                          color: char.colorHex,
                          border: `1px solid ${char.colorHex}50`,
                        }}
                      >
                        {char.rarity}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">{char.simulatedTokenId}</span>
                    </div>

                    {/* Character Color Avatar Circle */}
                    <div className="relative w-20 h-20 mx-auto my-2 rounded-full flex items-center justify-center border-2 border-slate-700 shadow-md overflow-hidden"
                      style={{ backgroundColor: `${char.colorHex}20` }}
                    >
                      <div
                        className="w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold shadow-inner"
                        style={{ backgroundColor: char.colorHex, color: '#121026' }}
                      >
                        🐸
                      </div>
                      <div
                        className="absolute inset-0 rounded-full blur-md opacity-40"
                        style={{ backgroundColor: char.auraColorHex }}
                      />
                    </div>

                    {/* Name & Tagline */}
                    <div className="text-center mt-2">
                      <h3 className="font-bold text-slate-100 text-sm">{char.name}</h3>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">{char.tagline}</p>
                    </div>

                    {/* Key Traits List */}
                    <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-col gap-1 text-[11px] text-slate-400">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Hat:</span>
                        <span className="font-medium text-slate-300">{char.traits.headwear}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Aura:</span>
                        <span className="font-medium text-slate-300 truncate max-w-[110px]">{char.traits.aura}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Action Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800">
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400 shrink-0" />
              <span>
                Selected: <strong className="text-slate-200">{selectedChar.name}</strong> ({selectedChar.simulatedTokenId})
              </span>
            </div>

            <button
              type="submit"
              className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-purple-600 to-emerald-500 hover:from-purple-500 hover:to-emerald-400 text-white font-bold rounded-2xl shadow-lg shadow-purple-600/30 hover:shadow-emerald-500/40 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 text-base font-outfit"
            >
              <Play className="w-5 h-5 fill-current" /> Enter Chog World
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
