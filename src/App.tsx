import React, { useState, useRef, useEffect } from 'react';
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
import { RefreshCw, ShieldCheck, Sparkles, MessageSquare, Swords } from 'lucide-react';

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
  const [showChat, setShowChat] = useState(false);

  const [discoveredLocations, setDiscoveredLocations] = useState<string[]>([]);
  const [activeDiscovery, setActiveDiscovery] = useState<{ id: string; name: string } | null>(null);

  const phaserRef = useRef<PhaserGameHandle>(null);

  const handleStartGame = (userNickname: string, selectedChar: ChogCharacter, gameMode: 'simulation' | 'real_nft') => {
    setNickname(userNickname);
    setCharacter(selectedChar);
    setMode(gameMode);
    setGameStarted(true);

    const socket = socketService.connect();

    if (socket.connected) {
      setIsConnected(true);
      if (socket.id) setCurrentSocketId(socket.id);
    }

    socket.on('connect', () => {
      setIsConnected(true);
      if (socket.id) setCurrentSocketId(socket.id);
    });
    socket.on('disconnect', () => setIsConnected(false));

    socket.on('roomInit', (data: { selfId: string; room: { players: Record<string, PlayerState>; chatHistory: ChatMessage[] } }) => {
      setIsConnected(true);
      setCurrentSocketId(data.selfId);
      setPlayers(data.room.players);
      setChatHistory(data.room.chatHistory || []);
    });

    socket.on('playerJoined', (p: PlayerState) => {
      setPlayers((prev) => ({ ...prev, [p.id]: p }));
    });

    socket.on('playerLeft', (data: { id: string }) => {
      setPlayers((prev) => { const n = { ...prev }; delete n[data.id]; return n; });
    });

    socket.on('chatBroadcast', (msg: ChatMessage) => {
      setChatHistory((prev) => [...prev.slice(-199), msg]);
    });

    socket.on('locationDiscovered', (data: { locationId: string; locationName: string; discoveredLocations: string[]; isNew?: boolean }) => {
      setDiscoveredLocations(data.discoveredLocations);
      if (data.isNew !== false) {
        setActiveDiscovery({ id: data.locationId, name: data.locationName });
      }
    });

    socket.on('playerDiscoveredLocation', (data: { id: string; discoveredLocations: string[] }) => {
      setPlayers((prev) => {
        if (!prev[data.id]) return prev;
        return {
          ...prev,
          [data.id]: {
            ...prev[data.id],
            discoveredLocations: data.discoveredLocations,
          },
        };
      });
    });

    socket.on('playerHit', (data: { targetId: string; targetHealth: number }) => {
      setPlayers((prev) => {
        if (!prev[data.targetId]) return prev;
        return {
          ...prev,
          [data.targetId]: { ...prev[data.targetId], health: data.targetHealth },
        };
      });
    });

    socket.on('playerDied', (data: { targetId: string }) => {
      setPlayers((prev) => {
        if (!prev[data.targetId]) return prev;
        return {
          ...prev,
          [data.targetId]: { ...prev[data.targetId], isDead: true, health: 0 },
        };
      });
    });

    socket.on('playerRespawned', (data: { id: string; x: number; y: number; health: number }) => {
      setPlayers((prev) => {
        if (!prev[data.id]) return prev;
        return {
          ...prev,
          [data.id]: { ...prev[data.id], isDead: false, health: data.health, x: data.x, y: data.y },
        };
      });
    });
  };

  const handleWave = () => phaserRef.current?.triggerEmote('wave', `👋 ${nickname} waved!`);
  const handleTraitEmote = () => phaserRef.current?.triggerEmote(character.emoteEffect.name, `${character.emoteEffect.icon} ${character.emoteEffect.label}`);
  const handleAttack = () => phaserRef.current?.triggerAttack();

  const handleDiscoveryFromGame = (locId: string, locName: string) => {
    setDiscoveredLocations((prev) => (prev.includes(locId) ? prev : [...prev, locId]));
  };

  const handleLeaveWorld = () => {
    socketService.disconnect();
    setGameStarted(false);
    setPlayers({});
    setChatHistory([]);
    setDiscoveredLocations([]);
    setIsConnected(false);
  };

  if (!gameStarted) return <StartScreen onStart={handleStartGame} />;

  const playerCount = Object.keys(players).length;

  return (
    <div className="fixed inset-0 bg-slate-950 overflow-hidden select-none flex" style={{ touchAction: 'none' }}>

      {/* ── GAME VIEWPORT ── */}
      <div className="relative flex-1 min-w-0 h-full">
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

        {/* ── TOP HUD (floats over game) ── */}
        <header className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-2 py-1.5 sm:px-3 sm:py-2 pointer-events-none">
          {/* Left: Logo + badge */}
          <div className="flex items-center gap-1.5 pointer-events-auto">
            <div className="flex items-center gap-1.5 bg-slate-900/85 border border-purple-500/30 rounded-xl px-2 py-1 sm:px-3 sm:py-1.5 backdrop-blur-md shadow-lg">
              <img src="/chog_main.png" alt="Chog" className="w-5 h-5 rounded-md object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              <span className="text-xs font-extrabold text-white tracking-wide font-outfit hidden sm:inline">Chog World</span>
            </div>
            <ConnectionBadge isConnected={isConnected} onlineCount={playerCount} roomId="chog-island-1" socketId={currentSocketId} />
          </div>

          {/* Right: Mode + Leave */}
          <div className="flex items-center gap-1.5 pointer-events-auto">
            {mode === 'real_nft' ? (
              <span className="hidden sm:flex items-center gap-1 px-2 py-1 bg-emerald-950/70 border border-emerald-500/40 rounded-xl text-[10px] font-bold text-emerald-300">
                <ShieldCheck className="w-3 h-3" /> VERIFIED NFT
              </span>
            ) : (
              <span className="hidden sm:flex items-center gap-1 px-2 py-1 bg-amber-950/50 border border-amber-500/40 rounded-xl text-[10px] font-semibold text-amber-300">
                <Sparkles className="w-3 h-3" /> DEMO
              </span>
            )}
            <button
              onClick={handleLeaveWorld}
              className="flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-1.5 bg-slate-900/85 hover:bg-rose-950/80 border border-slate-700 hover:border-rose-500/40 text-slate-300 hover:text-rose-200 rounded-xl text-[11px] font-semibold backdrop-blur-md transition shadow-lg"
            >
              <RefreshCw className="w-3 h-3" /> <span className="hidden sm:inline">Leave</span>
            </button>
          </div>
        </header>

        {/* ── BOTTOM HUD (floats over game) ── */}
        <footer className="absolute bottom-0 left-0 right-0 z-30 pointer-events-none">
          <div className="flex items-end justify-between px-2 py-2 sm:px-3 sm:py-3 gap-2">

            {/* Controls hint — desktop only */}
            <div className="hidden lg:flex pointer-events-auto items-center gap-1.5 bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-1.5 text-[10px] text-slate-400 backdrop-blur-md">
              <kbd className="px-1.5 bg-slate-800 border border-slate-700 rounded text-[9px] font-mono text-purple-300">WASD</kbd>
              <span>move</span>
              <kbd className="px-1.5 bg-slate-800 border border-slate-700 rounded text-[9px] font-mono text-amber-300">SPACE</kbd>
              <span>attack</span>
            </div>

            {/* Center toolbar */}
            <div className="pointer-events-auto mx-auto">
              <EmoteBar
                character={character}
                onWave={handleWave}
                onTraitEmote={handleTraitEmote}
                onToggleIdentity={() => setShowIdentity(p => !p)}
                onTogglePlayerList={() => setShowPlayerList(p => !p)}
                onToggleChat={() => setShowChat(p => !p)}
                discoveredCount={discoveredLocations.length}
                onAttack={handleAttack}
              />
            </div>

            {/* Right spacer on desktop (where chat panel lives) */}
            <div className="hidden lg:block w-72 shrink-0" />
          </div>
        </footer>

        {/* ── OVERLAYS ── */}
        {showPlayerList && (
          <div className="absolute top-14 right-2 sm:top-16 sm:right-3 z-50">
            <PlayerList players={players} currentUserId={currentSocketId} onClose={() => setShowPlayerList(false)} />
          </div>
        )}

        {showIdentity && (
          <IdentityPanel character={character} nickname={nickname} onClose={() => setShowIdentity(false)} />
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

        {/* ── MOBILE CHAT DRAWER ── */}
        {showChat && (
          <div className="fixed inset-0 z-50 flex items-end justify-center pb-2 px-2 bg-slate-950/60 backdrop-blur-sm lg:hidden" onClick={() => setShowChat(false)}>
            <div className="pointer-events-auto w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
              <ChatBox chatHistory={chatHistory} currentUserId={currentSocketId} onClose={() => setShowChat(false)} />
            </div>
          </div>
        )}
      </div>

      {/* ── DESKTOP SIDE CHAT PANEL ── */}
      <aside className="hidden lg:flex flex-col w-72 shrink-0 h-full bg-slate-900/60 border-l border-purple-900/30 backdrop-blur-md">
        {/* Chat header */}
        <div className="flex items-center gap-2 px-3 py-3 border-b border-slate-800">
          <MessageSquare className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-bold text-slate-200">World Chat</span>
          <span className="ml-auto text-[10px] text-slate-500 font-mono">Live</span>
        </div>
        {/* Chat fills remaining height */}
        <div className="flex-1 min-h-0">
          <ChatBox chatHistory={chatHistory} currentUserId={currentSocketId} embedded />
        </div>
      </aside>
    </div>
  );
}
