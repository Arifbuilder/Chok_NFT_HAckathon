export type RarityRank = 'Genesis' | 'Legendary' | 'Epic' | 'Rare';

export interface ChogTraits {
  skin: string;
  headwear: string;
  eyes: string;
  aura: string;
  expression: string;
  clothing: string;
}

export interface ChogCharacter {
  id: string;
  name: string;
  tagline: string;
  rarity: RarityRank;
  rarityScore: number;
  simulatedTokenId: string;
  colorHex: string;
  secondaryColorHex: string;
  auraColorHex: string;
  particleColor: number;
  traits: ChogTraits;
  emoteEffect: {
    name: string;
    icon: string;
    label: string;
    particleColor: number;
  };
  bio: string;
}

export interface PlayerState {
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
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderNickname: string;
  characterId: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
}

export interface IslandLocation {
  id: string;
  name: string;
  description: string;
  x: number;
  y: number;
  radius: number;
  icon: string;
  chogLore: string;
}

export interface RoomState {
  roomId: string;
  players: Record<string, PlayerState>;
  chatHistory: ChatMessage[];
}
