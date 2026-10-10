import { ServerRoom, ServerPlayer, ServerChatMessage } from './types';

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
            text: 'Welcome to Chog World! Explore the island, meet other Chogs, wave, and discover ancient landmarks.',
            timestamp: Date.now(),
            isSystem: true,
          },
        ],
      };
      this.rooms.set(roomId, room);
    }
    return room;
  }

  addPlayer(
    roomId: string,
    player: { id: string; nickname: string; characterId: string; x?: number; y?: number }
  ): { room: ServerRoom; newPlayer: ServerPlayer } {
    const room = this.getOrCreateRoom(roomId);
    
    // Spawn player at central plaza if x/y not provided
    const defaultX = 500 + (Math.random() * 100 - 50);
    const defaultY = 480 + (Math.random() * 100 - 50);

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
    };

    room.players[player.id] = newPlayer;

    // Add join message to chat history
    const joinMsg: ServerChatMessage = {
      id: `join-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      senderId: 'system',
      senderNickname: 'System',
      characterId: player.characterId,
      text: `${newPlayer.nickname} entered Chog World!`,
      timestamp: Date.now(),
      isSystem: true,
    };

    this.addChatMessage(roomId, joinMsg);

    return { room, newPlayer };
  }

  updatePlayerMove(
    roomId: string,
    socketId: string,
    moveData: { x: number; y: number; direction?: 'up' | 'down' | 'left' | 'right'; isMoving?: boolean }
  ): ServerPlayer | null {
    const room = this.rooms.get(roomId);
    if (!room || !room.players[socketId]) return null;

    const player = room.players[socketId];
    player.x = moveData.x;
    player.y = moveData.y;
    if (moveData.direction) player.direction = moveData.direction;
    if (moveData.isMoving !== undefined) player.isMoving = moveData.isMoving;

    return player;
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

    // Keep max 100 messages in room history
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
