import React, { useState, useRef } from 'react';
import { CHOG_CHARACTERS } from './data/characters';
import { ChogCharacter, PlayerState, ChatMessage } from './types/game';
import { socketService } from './services/socket';
import { PhaserGame, PhaserGameHandle } from './game/PhaserGame';
import { StartScreen } from './components/StartScreen';
import { IdentityPanel } from './components/IdentityPanel';
import { ChatBox } from './components/ChatBox';
import { PlayerList } from './components/PlayerList';
import { DiscoveryBanner } from './components/DiscoveryBanner';
import { ConnectionBadge } from './components/ConnectionBadge';
import { EmoteBar } from './components/EmoteBar';
import { RefreshCw, ShieldCheck, Sparkles } from 'lucide-react';

export default function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [mode, setMode] = useState<'simulation' | 'real_nft'>('simulation');
  const [nickname, setNickname] = useState('');
  const [character, setCharacter] = useState<ChogCharacter>(CHOG_CHARACTERS[0]);

  const [players, setPlayers] = useState<Record<string, PlayerState>>({});
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [currentSocketId, setCurrentSocketId] = useState('');

  const [showIdentity, setShowIdentity] = useState(false);
  const [showPlayerList, setShowPlayerList] = useState(false);
  const [showChatMobile, setShowChatMobile] = useState(false);

  const [discoveredLocations, setDiscoveredLocations] = useState<string[]>([]);
  const [activeDiscovery, setActiveDiscovery] = useState<{ id: string; name: string } | null>(null);

  const phaserRef = useRef<PhaserGameHandle>(null);

  const handleStartGame = (userNickname: string, selectedChar: ChogCharacter, gameMode: 'simulation' | 'real_nft') => {
    setNickname(userNickname);
    setCharacter(selectedChar);
    setMode(gameMode);
    setGameStarted(true);

    const socket = socketService.connect();

    socket.on('connect', () => {
      setIsConnected(true);
      if (socket.id) setCurrentSocketId(socket.id);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('roomInit', (data: { selfId: string; room: { players: Record<string, PlayerState>; chatHistory: ChatMessage[] } }) => {
      setCurrentSocketId(data.selfId);
      setPlayers(data.room.players);
      setChatHistory(data.room.chatHistory || []);
    });

    socket.on('playerJoined', (newPlayer: PlayerState) => {
      setPlayers((prev) => ({ ...prev, [newPlayer.id]: newPlayer }));
    });

    socket.on('playerLeft', (data: { id: string }) => {
      setPlayers((prev) => {
        const next = { ...prev };
        delete next[data.id];
        return next;
      });
    });

    socket.on('chatBroadcast', (msg: ChatMessage) => {
      setChatHistory((prev) => [...prev, msg]);
    });

    socket.on('locationDiscovered', (data: { locationId: string; locationName: string; discoveredLocations: string[] }) => {
      setDiscoveredLocations(data.discoveredLocations);
      setActiveDiscovery({ id: data.locationId, name: data.locationName });
    });
  };

  const handleWave = () => {
    if (phaserRef.current) {
      phaserRef.current.triggerEmote('wave', `👋 ${nickname} waved!`);
    }
  };

  const handleTraitEmote = () => {
    if (phaserRef.current) {
      phaserRef.current.triggerEmote(
        character.emoteEffect.name,
        `${character.emoteEffect.icon} ${character.emoteEffect.label}`
      );
    }
  };

  const handleDiscoveryFromGame = (locId: string, locName: string) => {
    setDiscoveredLocations((prev) => (prev.includes(locId) ? prev : [...prev, locId]));
    setActiveDiscovery({ id: locId, name: locName });
  };

  const handleLeaveWorld = () => {
    socketService.disconnect();
    setGameStarted(false);
    setPlayers({});
    setChatHistory([]);
    setDiscoveredLocations([]);
  };

  if (!gameStarted) {
    return <StartScreen onStart={handleStartGame} />;
  }

  return (
    <div className="relative w-screen h-screen bg-slate-950 overflow-hidden flex flex-col justify-between p-2 sm:p-3 select-none">
      {/* Top Floating Header Bar */}
      <header className="absolute top-2 sm:top-4 left-2 sm:left-4 right-2 sm:right-4 z-40 flex flex-row items-center justify-between gap-2 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-2 max-w-[70%] sm:max-w-none">
          <div className="bg-slate-900/90 border border-purple-500/30 rounded-2xl px-2.5 sm:px-4 py-1.5 sm:py-2 shadow-xl backdrop-blur-md flex items-center gap-2">
            <img src="/chog_main.png" alt="Chog" className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg object-cover" />
            <div>
              <h1 className="text-xs sm:text-sm font-extrabold text-white tracking-wide font-outfit truncate">Chog World</h1>
              <p className="text-[9px] sm:text-[10px] text-purple-300 font-medium hidden sm:block">Monad NFT Edition</p>
            </div>
          </div>

          <ConnectionBadge
            isConnected={isConnected}
            onlineCount={Object.keys(players).length}
            roomId="chog-island-1"
            socketId={currentSocketId}
          />
        </div>

        <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2">
          {mode === 'real_nft' ? (
            <span className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/70 border border-emerald-500/50 rounded-xl text-[11px] font-bold text-emerald-300 shadow-md">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> VERIFIED MONAD NFT
            </span>
          ) : (
            <span className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-amber-950/50 border border-amber-500/40 rounded-xl text-[11px] font-semibold text-amber-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> SIMULATED DEMO
            </span>
          )}

          <button
            onClick={handleLeaveWorld}
            className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 bg-slate-900/90 hover:bg-rose-950/80 border border-slate-800 hover:border-rose-500/40 text-slate-300 hover:text-rose-200 rounded-xl text-[11px] sm:text-xs font-semibold shadow-lg backdrop-blur-md transition flex items-center gap-1.5 whitespace-nowrap"
          >
            <RefreshCw className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Leave</span>
          </button>
        </div>
      </header>

      {/* Phaser Game Engine Viewport */}
      <main className="relative flex-1 w-full h-full flex items-center justify-center pt-12 sm:pt-14 pb-14 sm:pb-16">
        <PhaserGame
          ref={phaserRef}
          nickname={nickname}
          characterId={character.id}
          isRealNFT={character.isRealNFT}
          nftImageUrl={character.nftImageUrl}
          nftTokenId={character.nftTokenId}
          walletAddress={character.ownerAddress}
          onDiscovery={handleDiscoveryFromGame}
        />
      </main>

      {/* Bottom Controls & Emote Toolbar */}
      <footer className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 right-2 sm:right-4 z-40 flex flex-col sm:flex-row items-center justify-between gap-2 pointer-events-none">
        <div className="pointer-events-auto hidden lg:flex items-center gap-2 bg-slate-900/80 border border-slate-800 rounded-2xl px-3.5 py-2 text-[11px] text-slate-400 backdrop-blur-md">
          <span className="font-bold text-slate-300">Controls:</span>
          <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px] font-mono text-purple-300">WASD</kbd> or <span className="text-emerald-400">Tap / Click to move</span>
        </div>

        {/* Center Emote Bar */}
        <div className="pointer-events-auto mx-auto sm:mx-0">
          <EmoteBar
            character={character}
            onWave={handleWave}
            onTraitEmote={handleTraitEmote}
            onToggleIdentity={() => setShowIdentity((prev) => !prev)}
            onTogglePlayerList={() => setShowPlayerList((prev) => !prev)}
            onToggleChat={() => setShowChatMobile((prev) => !prev)}
            discoveredCount={discoveredLocations.length}
          />
        </div>

        {/* Desktop Permanent Right Chat Box */}
        <div className="pointer-events-auto hidden lg:block">
          <ChatBox chatHistory={chatHistory} currentUserId={currentSocketId} />
        </div>
      </footer>

      {/* Mobile Chat Drawer / Overlay Modal */}
      {showChatMobile && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 bg-slate-950/70 backdrop-blur-sm lg:hidden">
          <div className="pointer-events-auto">
            <ChatBox
              chatHistory={chatHistory}
              currentUserId={currentSocketId}
              onClose={() => setShowChatMobile(false)}
            />
          </div>
        </div>
      )}

      {/* Overlays / Modals */}
      {showPlayerList && (
        <div className="fixed sm:absolute top-16 sm:top-20 right-2 sm:right-4 z-50 max-w-[95vw]">
          <PlayerList
            players={players}
            currentUserId={currentSocketId}
            onClose={() => setShowPlayerList(false)}
          />
        </div>
      )}

      {showIdentity && (
        <IdentityPanel
          character={character}
          nickname={nickname}
          onClose={() => setShowIdentity(false)}
        />
      )}

      {activeDiscovery && (
        <DiscoveryBanner
          locationId={activeDiscovery.id}
          locationName={activeDiscovery.name}
          character={character}
          nickname={nickname}
          totalDiscovered={discoveredLocations.length}
          onClose={() => setActiveDiscovery(null)}
        />
      )}
    </div>
  );
}
