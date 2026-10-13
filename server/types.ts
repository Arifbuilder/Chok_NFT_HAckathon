export interface ServerPlayer {
  id: string;
  nickname: string;
  characterId: string;
  x: number;
  y: number;
  direction: 'up' | 'down' | 'left' | 'right';
  isMoving: boolean;
  currentEmote: {
    type: string;
    text: string;
    timestamp: number;
  } | null;
  discoveredLocations: string[];
  joinedAt: number;
  isRealNFT?: boolean;
  isVerifiedNFT?: boolean;
  nftTokenId?: string;
  nftImageUrl?: string;
  walletAddress?: string;
  health: number;
  maxHealth: number;
  isDead: boolean;
  lastAttackTime: number;
}

export interface ServerChatMessage {
  id: string;
  senderId: string;
  senderNickname: string;
  characterId: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
  isVerifiedNFT?: boolean;
}

export interface ServerRoom {
  roomId: string;
  players: Record<string, ServerPlayer>;
  chatHistory: ServerChatMessage[];
}
