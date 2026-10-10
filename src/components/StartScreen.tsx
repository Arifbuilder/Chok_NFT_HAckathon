import React, { useState, useEffect } from 'react';
import { CHOG_CHARACTERS } from '../data/characters';
import { ChogCharacter } from '../types/game';
import { walletService, WalletConnectionState } from '../services/wallet';
import { realMonadNFTVerifier, VerifiedNFTItem } from '../services/nftAdapter';
import { MONAD_NFT_CONFIG } from '../config/nftConfig';
import {
  Sparkles,
  User,
  Play,
  ShieldCheck,
  Zap,
  Wallet,
  ExternalLink,
  RefreshCw,
  AlertTriangle,
  Layers,
  CheckCircle2,
} from 'lucide-react';

interface StartScreenProps {
  onStart: (nickname: string, selectedCharacter: ChogCharacter, mode: 'simulation' | 'real_nft') => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({ onStart }) => {
  const [mode, setMode] = useState<'simulation' | 'real_nft'>('simulation');
  const [nickname, setNickname] = useState('ChogMaster' + Math.floor(100 + Math.random() * 900));

  const [simulatedChar, setSimulatedChar] = useState<ChogCharacter>(CHOG_CHARACTERS[0]);

  const [walletState, setWalletState] = useState<WalletConnectionState>({
    address: null,
    chainId: null,
    isConnected: false,
    isMonadNetwork: false,
    error: null,
  });

  const [loadingNFTs, setLoadingNFTs] = useState(false);
  const [ownedNFTs, setOwnedNFTs] = useState<VerifiedNFTItem[]>([]);
  const [selectedNFT, setSelectedNFT] = useState<VerifiedNFTItem | null>(null);

  useEffect(() => {
    walletService.listenToWalletEvents(
      (newAccount) => {
        if (newAccount) {
          handleConnectWallet();
        } else {
          setWalletState({
            address: null,
            chainId: null,
            isConnected: false,
            isMonadNetwork: false,
            error: 'Wallet disconnected.',
          });
          setOwnedNFTs([]);
          setSelectedNFT(null);
        }
      },
      () => {
        handleConnectWallet();
      }
    );
  }, []);

  const handleConnectWallet = async () => {
    const res = await walletService.connectWallet();
    setWalletState(res);

    if (res.isConnected && res.address) {
      fetchNFTsForWallet(res.address);
    }
  };

  const handleSwitchNetwork = async () => {
    const success = await walletService.switchToMonadNetwork();
    if (success) {
      handleConnectWallet();
    }
  };

  const fetchNFTsForWallet = async (address: string) => {
    setLoadingNFTs(true);
    try {
      if (realMonadNFTVerifier.fetchWalletNFTs) {
        const nfts = await realMonadNFTVerifier.fetchWalletNFTs(address);
        setOwnedNFTs(nfts);
        if (nfts.length > 0) {
          setSelectedNFT(nfts[0]);
        }
      }
    } catch (err: any) {
      console.error('Error fetching owned NFTs:', err);
    } finally {
      setLoadingNFTs(false);
    }
  };

  const handleRandomizeName = () => {
    const prefixes = ['Hyper', 'Aurum', 'Cyber', 'Verdant', 'Monad', 'Turbo', 'Pixel', 'Cosmic'];
    const suffix = Math.floor(100 + Math.random() * 900);
    const randPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    setNickname(`${randPrefix}Chog#${suffix}`);
  };

  const handleEnterWorld = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = nickname.trim() || 'ChogExplorer';

    if (mode === 'simulation') {
      onStart(cleanName, simulatedChar, 'simulation');
    } else {
      if (!walletState.isConnected || !selectedNFT) return;
      onStart(cleanName, selectedNFT.characterObj, 'real_nft');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto">
      <div className="absolute w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute w-[400px] h-[400px] bg-emerald-500/15 rounded-full blur-[100px] pointer-events-none -bottom-20 -right-20" />

      <div className="relative w-full max-w-4xl bg-slate-900/95 border border-purple-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-purple-950/90 backdrop-blur-xl flex flex-col gap-6 my-auto">
        {/* Header Title Section */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="text-center sm:text-left flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl border-2 border-purple-500/60 overflow-hidden bg-purple-950/60 shadow-lg shrink-0">
              <img src="/chog_main.png" alt="Chog Genesis" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 rounded-full flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-emerald-400" /> Monad Ecosystem Inspired
                </span>
                <span className="px-3 py-1 text-xs font-semibold text-purple-300 bg-purple-950/60 border border-purple-500/30 rounded-full flex items-center gap-1.5">
                  Contract: {MONAD_NFT_CONFIG.contractAddress.slice(0, 6)}...{MONAD_NFT_CONFIG.contractAddress.slice(-4)}
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-outfit">
                Chog World <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-emerald-400 to-cyan-400">— Your Chog, Your Identity</span>
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Explore the 2D real-time multiplayer island with official Chog Genesis artwork or verified wallet NFTs.
              </p>
            </div>
          </div>
        </div>

        {/* Mode Switch */}
        <div className="grid grid-cols-2 gap-3 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800">
          <button
            type="button"
            onClick={() => setMode('simulation')}
            className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 ${
              mode === 'simulation'
                ? 'bg-purple-900/80 text-white border border-purple-500/50 shadow-lg shadow-purple-950/50'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <Sparkles className="w-4 h-4 text-purple-400" /> 🎮 Simulation Mode (Instant Demo)
          </button>

          <button
            type="button"
            onClick={() => setMode('real_nft')}
            className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 ${
              mode === 'real_nft'
                ? 'bg-emerald-900/80 text-white border border-emerald-500/50 shadow-lg shadow-emerald-950/50'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> ⚡ Real NFT Mode (Monad Wallet)
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleEnterWorld} className="flex flex-col gap-6">
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

          {mode === 'simulation' ? (
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" /> Select Chog Genesis Character Preset:
                </label>
                <span className="text-xs text-amber-400 font-semibold bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30">
                  SIMULATED DEMO
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {CHOG_CHARACTERS.map((char) => {
                  const isSelected = simulatedChar.id === char.id;
                  return (
                    <div
                      key={char.id}
                      onClick={() => setSimulatedChar(char)}
                      className={`relative cursor-pointer rounded-2xl p-4 border transition-all duration-200 flex flex-col justify-between ${
                        isSelected
                          ? 'bg-slate-800/90 border-purple-400 ring-2 ring-purple-500/50 shadow-lg scale-[1.02]'
                          : 'bg-slate-950/40 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className="px-2 py-0.5 text-[10px] font-bold rounded uppercase"
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

                      <div
                        className="relative w-20 h-20 mx-auto my-2 rounded-2xl border-2 border-slate-700 overflow-hidden shadow-md"
                        style={{ backgroundColor: `${char.colorHex}20` }}
                      >
                        <img
                          src={char.nftImageUrl || '/chog_main.png'}
                          alt={char.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="text-center mt-2">
                        <h3 className="font-bold text-slate-100 text-sm">{char.name}</h3>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">{char.tagline}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-100">
                      {walletState.isConnected
                        ? `Connected: ${walletState.address?.slice(0, 6)}...${walletState.address?.slice(-4)}`
                        : 'Connect Monad Wallet'}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {walletState.isConnected
                        ? walletState.isMonadNetwork
                          ? `Active on ${MONAD_NFT_CONFIG.network.name}`
                          : 'Wrong Network Detected'
                        : 'Connect your Monad wallet to verify your Chog Genesis NFT'}
                    </p>
                  </div>
                </div>

                {!walletState.isConnected ? (
                  <button
                    type="button"
                    onClick={handleConnectWallet}
                    className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-lg transition flex items-center justify-center gap-2"
                  >
                    <Wallet className="w-4 h-4" /> Connect Wallet
                  </button>
                ) : !walletState.isMonadNetwork ? (
                  <button
                    type="button"
                    onClick={handleSwitchNetwork}
                    className="w-full sm:w-auto px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs shadow-lg transition flex items-center justify-center gap-2"
                  >
                    <AlertTriangle className="w-4 h-4" /> Switch to Monad
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => walletState.address && fetchNFTsForWallet(walletState.address)}
                    disabled={loadingNFTs}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition flex items-center gap-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingNFTs ? 'animate-spin' : ''}`} /> Refresh NFTs
                  </button>
                )}
              </div>

              {walletState.error && (
                <div className="bg-rose-950/40 border border-rose-500/40 rounded-xl p-3 text-xs text-rose-200 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{walletState.error}</span>
                </div>
              )}

              {walletState.isConnected && walletState.isMonadNetwork && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-bold text-slate-200 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" /> Your Verified Chog Genesis NFTs ({ownedNFTs.length}):
                    </label>
                    <a
                      href={MONAD_NFT_CONFIG.openseaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-emerald-400 hover:underline flex items-center gap-1"
                    >
                      OpenSea Collection <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  {loadingNFTs ? (
                    <div className="py-12 text-center text-slate-400 bg-slate-950/40 rounded-2xl border border-slate-800 flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-6 h-6 text-emerald-400 animate-spin" />
                      <span>Reading Monad EVM contract balance & metadata...</span>
                    </div>
                  ) : ownedNFTs.length === 0 ? (
                    <div className="p-6 text-center bg-amber-950/20 border border-amber-500/30 rounded-2xl text-amber-200 text-xs flex flex-col items-center gap-3">
                      <AlertTriangle className="w-8 h-8 text-amber-400" />
                      <div>
                        <strong className="text-amber-300 text-sm block">No Chog Genesis NFT Found</strong>
                        <p className="mt-1 opacity-90">
                          Connected wallet <strong>{walletState.address?.slice(0, 6)}...{walletState.address?.slice(-4)}</strong> does not hold a Chog Genesis NFT on contract <code className="text-purple-300">{MONAD_NFT_CONFIG.contractAddress}</code>.
                        </p>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <a
                          href={MONAD_NFT_CONFIG.openseaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5"
                        >
                          View OpenSea Collection <ExternalLink className="w-3 h-3" />
                        </a>
                        <button
                          type="button"
                          onClick={() => setMode('simulation')}
                          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs transition"
                        >
                          Play in Simulation Mode
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {ownedNFTs.map((item) => {
                        const isSelected = selectedNFT?.tokenId === item.tokenId;
                        return (
                          <div
                            key={item.tokenId}
                            onClick={() => setSelectedNFT(item)}
                            className={`relative cursor-pointer rounded-2xl p-4 border transition-all duration-200 flex flex-col justify-between ${
                              isSelected
                                ? 'bg-slate-800/90 border-emerald-400 ring-2 ring-emerald-500/50 shadow-lg scale-[1.02]'
                                : 'bg-slate-950/40 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="px-2 py-0.5 text-[10px] font-bold rounded uppercase bg-emerald-950 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> VERIFIED
                              </span>
                              <span className="text-[11px] font-mono text-slate-300">#{item.tokenId}</span>
                            </div>

                            <div className="w-24 h-24 mx-auto my-2 rounded-2xl border-2 border-slate-700 overflow-hidden bg-slate-950 shadow-md">
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/chog_main.png';
                                }}
                              />
                            </div>

                            <div className="text-center mt-1">
                              <h3 className="font-bold text-slate-100 text-sm truncate">{item.name}</h3>
                              <p className="text-[11px] text-slate-400 truncate mt-0.5">Skin: {item.traits.skin}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800">
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400 shrink-0" />
              <span>
                Mode: <strong className="text-slate-200 uppercase">{mode.replace('_', ' ')}</strong>
                {mode === 'real_nft' && selectedNFT && (
                  <span className="ml-2 text-emerald-400 font-bold">({selectedNFT.name})</span>
                )}
              </span>
            </div>

            <button
              type="submit"
              disabled={mode === 'real_nft' && (!walletState.isConnected || !selectedNFT)}
              className={`w-full sm:w-auto px-8 py-3.5 font-bold rounded-2xl shadow-lg transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 text-base font-outfit ${
                mode === 'real_nft' && (!walletState.isConnected || !selectedNFT)
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : 'bg-gradient-to-r from-purple-600 to-emerald-500 hover:from-purple-500 hover:to-emerald-400 text-white shadow-purple-600/30'
              }`}
            >
              <Play className="w-5 h-5 fill-current" /> Enter Chog World
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
