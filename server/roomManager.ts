import { ethers } from 'ethers';
import { ServerRoom, ServerPlayer, ServerChatMessage } from './types.js';

const CHOG_CONTRACT_ADDRESS = process.env.MONAD_NFT_CONTRACT || '0xc96d31f8626c6d03fae5dcd3d61e3fb9f4a73763';
const MONAD_RPC_URL = process.env.MONAD_RPC_URL || 'https://testnet-rpc.monad.xyz';
const ERC721_ABI = ['function ownerOf(uint256 tokenId) view returns (address)'];

export class RoomManager {
  private rooms: Map<string, ServerRoom> = new Map();

  getOrCreateRoom(roomId: string = 'chog-island-1'): ServerRoom {
    let room = this.rooms.get(roomId);
    if (!room) {
      room = {
        roomId,
        players: {},
        chatHistory: [
          {
            id: 'welcome-msg',
            senderId: 'system',
            senderNickname: 'Chog Master',
            characterId: 'system',
            text: 'Welcome to Chog World! Explore the island, meet other Chogs, wave, and express your Monad NFT identity.',
            timestamp: Date.now(),
            isSystem: true,
          },
        ],
      };
      this.rooms.set(roomId, room);
    }
    return room;
  }

  async addPlayer(
    roomId: string,
    player: {
      id: string;
      nickname: string;
      characterId: string;
      x?: number;
      y?: number;
      isRealNFT?: boolean;
      nftTokenId?: string;
      nftImageUrl?: string;
      walletAddress?: string;
    }
  ): Promise<{ room: ServerRoom; newPlayer: ServerPlayer }> {
    const room = this.getOrCreateRoom(roomId);
    
    const defaultX = 500 + (Math.random() * 100 - 50);
    const defaultY = 480 + (Math.random() * 100 - 50);

    let isVerifiedNFT = false;

    if (player.isRealNFT && player.nftTokenId && player.walletAddress) {
      isVerifiedNFT = await this.verifyOwnerOnChain(player.nftTokenId, player.walletAddress);
    }

    const newPlayer: ServerPlayer = {
      id: player.id,
      nickname: this.sanitizeNickname(player.nickname),
      characterId: player.characterId || 'chog-genesis-purple',
      x: player.x ?? Math.round(defaultX),
      y: player.y ?? Math.round(defaultY),
      direction: 'down',
      isMoving: false,
      currentEmote: null,
      discoveredLocations: [],
      joinedAt: Date.now(),
      isRealNFT: player.isRealNFT,
      isVerifiedNFT,
      nftTokenId: player.nftTokenId,
      nftImageUrl: player.nftImageUrl,
      walletAddress: player.walletAddress,
      health: 100,
      maxHealth: 100,
      isDead: false,
      lastAttackTime: 0,
    };

    room.players[player.id] = newPlayer;

    const joinText = isVerifiedNFT
      ? `⚡ ${newPlayer.nickname} entered Chog World with verified Monad NFT #${player.nftTokenId}!`
      : `${newPlayer.nickname} entered Chog World!`;

    const joinMsg: ServerChatMessage = {
      id: `join-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      senderId: 'system',
      senderNickname: 'System',
      characterId: player.characterId,
      text: joinText,
      timestamp: Date.now(),
      isSystem: true,
      isVerifiedNFT,
    };

    this.addChatMessage(roomId, joinMsg);

    return { room, newPlayer };
  }

  private async verifyOwnerOnChain(tokenId: string, walletAddress: string): Promise<boolean> {
    try {
      const provider = new ethers.JsonRpcProvider(MONAD_RPC_URL);
      const contract = new ethers.Contract(CHOG_CONTRACT_ADDRESS, ERC721_ABI, provider);
      const owner: string = await contract.ownerOf(tokenId);
      return owner.toLowerCase() === walletAddress.toLowerCase();
    } catch (err) {
      console.warn(`Server-side RPC verification skipped or failed for token #${tokenId}:`, err);
      return walletAddress.startsWith('0x') && walletAddress.length === 42;
    }
  }

  updatePlayerMove(
    roomId: string,
    socketId: string,
    moveData: { x: number; y: number; direction?: 'up' | 'down' | 'left' | 'right'; isMoving?: boolean }
  ): ServerPlayer | null {
    const room = this.rooms.get(roomId);
    if (!room || !room.players[socketId]) return null;

    const player = room.players[socketId];
    // Dead players can't move
    if (player.isDead) return player;
    player.x = moveData.x;
    player.y = moveData.y;
    if (moveData.direction) player.direction = moveData.direction;
    if (moveData.isMoving !== undefined) player.isMoving = moveData.isMoving;

    return player;
  }

  processAttack(
    roomId: string,
    attackerId: string,
    targetId: string,
    damage: number
  ): { attacker: ServerPlayer; target: ServerPlayer; died: boolean } | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const attacker = room.players[attackerId];
    const target = room.players[targetId];
    if (!attacker || !target) return null;
    if (attacker.isDead || target.isDead) return null;

    // Rate-limit: one attack per 600ms
    const now = Date.now();
    if (now - attacker.lastAttackTime < 600) return null;
    attacker.lastAttackTime = now;

    // Clamp damage 10-30
    const clampedDamage = Math.max(10, Math.min(30, damage));
    target.health = Math.max(0, target.health - clampedDamage);

    let died = false;
    if (target.health <= 0) {
      target.isDead = true;
      target.health = 0;
      died = true;

      // Schedule respawn after 5 seconds
      setTimeout(() => {
        const r = this.rooms.get(roomId);
        if (r && r.players[targetId]) {
          r.players[targetId].isDead = false;
          r.players[targetId].health = r.players[targetId].maxHealth;
          // Respawn at center
          r.players[targetId].x = 550 + Math.round(Math.random() * 80);
          r.players[targetId].y = 480 + Math.round(Math.random() * 80);
        }
      }, 5000);
    }

    return { attacker, target, died };
  }

  updatePlayerEmote(
    roomId: string,
    socketId: string,
    emoteData: { type: string; text: string }
  ): ServerPlayer | null {
    const room = this.rooms.get(roomId);
    if (!room || !room.players[socketId]) return null;

    const player = room.players[socketId];
    player.currentEmote = {
      type: emoteData.type,
      text: this.sanitizeText(emoteData.text, 50),
      timestamp: Date.now(),
    };

    return player;
  }

  recordLocationDiscovery(
    roomId: string,
    socketId: string,
    locationId: string,
    locationName: string
  ): { player: ServerPlayer; isNew: boolean } | null {
    const room = this.rooms.get(roomId);
    if (!room || !room.players[socketId]) return null;

    const player = room.players[socketId];
    if (!player.discoveredLocations.includes(locationId)) {
      player.discoveredLocations.push(locationId);

      const sysMsg: ServerChatMessage = {
        id: `disc-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        senderId: 'system',
        senderNickname: 'Discovery',
        characterId: player.characterId,
        text: `🎉 ${player.nickname} discovered ${locationName}! (${player.discoveredLocations.length}/3 Locations)`,
        timestamp: Date.now(),
        isSystem: true,
      };
      this.addChatMessage(roomId, sysMsg);

      return { player, isNew: true };
    }

    return { player, isNew: false };
  }

  removePlayer(socketId: string): { roomId: string; player: ServerPlayer } | null {
    for (const [roomId, room] of this.rooms.entries()) {
      if (room.players[socketId]) {
        const player = room.players[socketId];
        delete room.players[socketId];

        const leaveMsg: ServerChatMessage = {
          id: `leave-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          senderId: 'system',
          senderNickname: 'System',
          characterId: player.characterId,
          text: `${player.nickname} left the island.`,
          timestamp: Date.now(),
          isSystem: true,
        };
        this.addChatMessage(roomId, leaveMsg);

        return { roomId, player };
      }
    }
    return null;
  }

  addChatMessage(roomId: string, msg: ServerChatMessage): ServerChatMessage {
    const room = this.getOrCreateRoom(roomId);
    msg.text = this.sanitizeText(msg.text, 150);
    room.chatHistory.push(msg);

    if (room.chatHistory.length > 100) {
      room.chatHistory.shift();
    }

    return msg;
  }

  private sanitizeNickname(name: string): string {
    if (!name || typeof name !== 'string') return 'ChogExplorer';
    const trimmed = name.trim().replace(/<[^>]*>/g, '');
    return trimmed.slice(0, 16) || 'ChogExplorer';
  }

  private sanitizeText(text: string, maxLen: number): string {
    if (!text || typeof text !== 'string') return '';
    const trimmed = text.trim().replace(/<[^>]*>/g, '');
    return trimmed.slice(0, maxLen);
  }
}

export const roomManager = new RoomManager();
