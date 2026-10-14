import { io, Socket } from 'socket.io-client';

const LIVE_RENDER_SERVER_URL = 'https://chok-nft-hackathon.onrender.com';

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;

  private getSocketUrl(serverUrl?: string): string {
    if (serverUrl) return serverUrl;
    
    // Check environment variable (e.g. VITE_SERVER_URL when set)
    const envUrl = (import.meta as any).env?.VITE_SERVER_URL;
    if (envUrl) return envUrl;

    if (typeof window !== 'undefined') {
      // If running locally on any dev server port
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return `http://${window.location.hostname}:3001`;
      }
      // Production or deployed host (Netlify, Vercel, external domain) -> use live Render server!
      return LIVE_RENDER_SERVER_URL;
    }
    return LIVE_RENDER_SERVER_URL;
  }

  public connect(serverUrl?: string): Socket {
    if (this.socket) {
      if (!this.socket.connected) {
        this.socket.connect();
      }
      return this.socket;
    }

    const url = this.getSocketUrl(serverUrl);
    console.log('🔌 Connecting to Chog World Socket Server at:', url);
    
    this.socket = io(url, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 25,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      this.isConnected = true;
      console.log('✅ Connected to Chog World Socket Server:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      console.log('⚠️ Disconnected from Chog World Socket Server:', reason);
    });

    this.socket.on('connect_error', (err) => {
      console.warn('❌ Socket Connection Error:', err.message);
    });

    return this.socket;
  }

  public getSocket(): Socket | null {
    return this.socket;
  }

  public getIsConnected(): boolean {
    return this.socket ? this.socket.connected : false;
  }

  public joinRoom(
    nickname: string,
    characterId: string,
    options?: {
      roomId?: string;
      isRealNFT?: boolean;
      nftTokenId?: string;
      nftImageUrl?: string;
      walletAddress?: string;
    }
  ) {
    if (!this.socket) this.connect();
    this.socket?.emit('joinRoom', {
      roomId: options?.roomId || 'chog-island-1',
      nickname,
      characterId,
      isRealNFT: options?.isRealNFT,
      nftTokenId: options?.nftTokenId,
      nftImageUrl: options?.nftImageUrl,
      walletAddress: options?.walletAddress,
    });
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

  public sendAttack(targetId: string, damage: number) {
    this.socket?.emit('attack', { targetId, damage });
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
