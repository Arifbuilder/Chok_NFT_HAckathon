import React from 'react';
import { WifiOff, Users } from 'lucide-react';

interface ConnectionBadgeProps {
  isConnected: boolean;
  onlineCount: number;
  roomId: string;
  socketId: string;
}

export const ConnectionBadge: React.FC<ConnectionBadgeProps> = ({ isConnected, onlineCount }) => {
  return (
    <div className="flex items-center gap-1.5 bg-slate-900/85 border border-slate-700 rounded-xl px-2 py-1 sm:px-3 sm:py-1.5 backdrop-blur-md text-xs shadow-lg">
      {isConnected ? (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
      ) : (
        <WifiOff className="w-3 h-3 text-rose-400" />
      )}
      <span className={`font-semibold ${isConnected ? 'text-emerald-400' : 'text-rose-400'}`}>
        {isConnected ? 'Online' : 'Connecting'}
      </span>
      <span className="text-slate-600 hidden sm:inline">|</span>
      <div className="hidden sm:flex items-center gap-1 text-slate-300 font-medium">
        <Users className="w-3 h-3 text-purple-400" />
        <span>{onlineCount}</span>
      </div>
    </div>
  );
};
