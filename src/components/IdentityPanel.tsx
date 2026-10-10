import React, { useEffect, useState } from 'react';
import { ChogCharacter } from '../types/game';
import { defaultNFTVerifier, realMonadNFTVerifier, NFTVerificationResult } from '../services/nftAdapter';
import { MONAD_NFT_CONFIG } from '../config/nftConfig';
import { ShieldCheck, Info, X, Sparkles, Cpu, Award, ExternalLink, CheckCircle2 } from 'lucide-react';

interface IdentityPanelProps {
  character: ChogCharacter;
  nickname: string;
  onClose: () => void;
}

export const IdentityPanel: React.FC<IdentityPanelProps> = ({ character, nickname, onClose }) => {
  const [verification, setVerification] = useState<NFTVerificationResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const verifier = character.isRealNFT ? realMonadNFTVerifier : defaultNFTVerifier;

    verifier
      .verifyCharacter(character.id, character.ownerAddress)
      .then((res) => {
        if (isMounted) {
          setVerification(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Verification error:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [character.id, character.isRealNFT, character.ownerAddress]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-slate-900 border border-purple-500/40 rounded-3xl p-6 shadow-2xl shadow-purple-950/90 text-white flex flex-col gap-5">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-bold font-outfit text-slate-100">Chog Identity Card</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 flex flex-col items-center gap-2">
            <Cpu className="w-8 h-8 text-purple-400 animate-spin" />
            <span>Reading Monad EVM Contract Metadata...</span>
          </div>
        ) : verification ? (
          <div className="flex flex-col gap-4">
            {/* Verification Notice Banner */}
            <div
              className={`border rounded-2xl p-3.5 flex items-start gap-3 text-xs ${
                character.isRealNFT
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                  : 'bg-amber-950/40 border-amber-500/40 text-amber-200'
              }`}
            >
              {character.isRealNFT ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              )}
              <div>
                <div
                  className={`font-bold uppercase tracking-wide ${
                    character.isRealNFT ? 'text-emerald-300' : 'text-amber-300'
                  }`}
                >
                  {verification.verificationBadgeText}
                </div>
                <div className="mt-0.5 opacity-90">{verification.statusNote}</div>
              </div>
            </div>

            {/* Character Display */}
            <div className="flex items-center gap-4 bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
              {character.nftImageUrl ? (
                <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-emerald-500/50 bg-slate-950 shrink-0 shadow-md">
                  <img src={character.nftImageUrl} alt={character.name} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-inner shrink-0 border"
                  style={{
                    backgroundColor: `${character.colorHex}25`,
                    borderColor: `${character.colorHex}60`,
                  }}
                >
                  🐸
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-lg text-slate-100 truncate">{character.name}</h3>
                  <span className="font-mono text-xs text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded-md border border-purple-800/40">
                    {character.nftTokenId ? `#${character.nftTokenId}` : character.simulatedTokenId}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Player: <strong className="text-emerald-400">{nickname}</strong>
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
                      character.isRealNFT ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40' : ''
                    }`}
                    style={{
                      backgroundColor: !character.isRealNFT ? `${character.colorHex}30` : undefined,
                      color: !character.isRealNFT ? character.colorHex : undefined,
                    }}
                  >
                    {character.isRealNFT ? 'VERIFIED NFT' : character.rarity}
                  </span>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Award className="w-3 h-3 text-amber-400" /> Rarity Score: {character.rarityScore}
                  </span>
                </div>
              </div>
            </div>

            {/* Cosmetic Traits Breakdown */}
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Verified Cosmetic Traits
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries(verification.traits).map(([key, val]) => (
                  <div key={key} className="bg-slate-950/40 border border-slate-800 rounded-xl p-2.5 flex flex-col gap-0.5">
                    <span className="text-[10px] uppercase font-semibold text-slate-500">{key}</span>
                    <span className="font-medium text-slate-200 truncate">{val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Network & Contract Technical Details */}
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 text-[11px] text-slate-400 font-mono flex flex-col gap-1">
              <div className="flex justify-between">
                <span>Network:</span>
                <span className="text-slate-300">{verification.network}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Contract:</span>
                <a
                  href={MONAD_NFT_CONFIG.openseaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-400 hover:underline flex items-center gap-1 truncate max-w-[220px]"
                >
                  {MONAD_NFT_CONFIG.contractAddress} <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
              </div>
              {character.ownerAddress && (
                <div className="flex justify-between">
                  <span>Owner:</span>
                  <span className="text-emerald-400 truncate max-w-[200px]">{character.ownerAddress}</span>
                </div>
              )}
            </div>
          </div>
        ) : null}

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm rounded-xl transition"
        >
          Close Identity Card
        </button>
      </div>
    </div>
  );
};
