import React from 'react';
import { Wifi, WifiOff, Users, ShieldAlert } from 'lucide-react';

interface ConnectionBadgeProps {
  isConnected: boolean;
  onlineCount: number;
  roomId: string;
  socketId: string;
}

export const ConnectionBadge: React.FC<ConnectionBadgeProps> = ({
  isConnected,
  onlineCount,
  roomId,
  socketId,
}) => {
  return (
    <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 rounded-2xl px-4 py-2 shadow-xl backdrop-blur-md text-xs">
      {/* Server Status Indicator */}
      <div className="flex items-center gap-1.5 font-semibold">
        {isConnected ? (
          <>
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="text-emerald-400">Online</span>
          </>
        ) : (
          <>
            <WifiOff className="w-3.5 h-3.5 text-rose-400" />
            <span className="text-rose-400">Connecting...</span>
          </>
        )}
      </div>

      <span className="text-slate-700">|</span>

      {/* Online Players Count */}
      <div className="flex items-center gap-1 font-medium text-slate-300">
        <Users className="w-3.5 h-3.5 text-purple-400" />
        <span>{onlineCount} Chogs</span>
      </div>

      <span className="text-slate-700 hidden sm:inline">|</span>

      {/* Room Code */}
      <div className="hidden sm:flex items-center gap-1 text-slate-400 font-mono text-[11px]">
        <span>Room:</span>
        <span className="text-purple-300 bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-800/40">
          {roomId}
        </span>
      </div>
    </div>
  );
};
