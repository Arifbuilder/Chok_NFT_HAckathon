import { io, Socket } from 'socket.io-client';
import { PlayerState, ChatMessage, RoomState } from '../types/game';

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;

  public connect(serverUrl?: string): Socket {
    if (this.socket) {
      return this.socket;
    }

    // Default to current host or fallback to port 3001
    const url = serverUrl || (window.location.hostname === 'localhost' ? 'http://localhost:3001' : '');
    
    this.socket = io(url, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      this.isConnected = true;
      console.log('⚡ Connected to Chog World Socket Server:', this.socket?.id);
    });

    this.socket.on('disconnect', () => {
      this.isConnected = false;
      console.log('❌ Disconnected from Chog World Socket Server');
    });

    return this.socket;
  }

  public getSocket(): Socket | null {
    return this.socket;
  }

  public getIsConnected(): boolean {
    return this.isConnected;
  }

  public joinRoom(nickname: string, characterId: string, roomId = 'chog-island-1') {
    if (!this.socket) this.connect();
    this.socket?.emit('joinRoom', { roomId, nickname, characterId });
  }

  public sendMove(x: number, y: number, direction: 'up' | 'down' | 'left' | 'right', isMoving: boolean) {
    this.socket?.emit('move', { x, y, direction, isMoving });
  }

  public sendEmote(type: string, text: string) {
    this.socket?.emit('emote', { type, text });
  }

  public sendChat(text: string) {
    this.socket?.emit('chat', { text });
  }

  public sendDiscover(locationId: string, locationName: string) {
    this.socket?.emit('discover', { locationId, locationName });
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }
}

export const socketService = new SocketService();
