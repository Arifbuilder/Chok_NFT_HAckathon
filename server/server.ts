import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import { roomManager } from './roomManager.js';

const app = express();
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
}));
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 3001;

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Chog World Backend Server',
    contractAddress: process.env.MONAD_NFT_CONTRACT || '0xc96d31f8626c6d03fae5dcd3d61e3fb9f4a73763',
    timestamp: Date.now(),
  });
});

app.get('/api/room/:roomId?', (req, res) => {
  const roomId = req.params.roomId || 'chog-island-1';
  const room = roomManager.getOrCreateRoom(roomId);
  res.json({
    roomId: room.roomId,
    playerCount: Object.keys(room.players).length,
    players: Object.values(room.players),
  });
});

io.on('connection', (socket: Socket) => {
  let currentRoomId = 'chog-island-1';

  socket.on(
    'joinRoom',
    async (data: {
      roomId?: string;
      nickname: string;
      characterId: string;
      x?: number;
      y?: number;
      isRealNFT?: boolean;
      nftTokenId?: string;
      nftImageUrl?: string;
      walletAddress?: string;
    }) => {
      currentRoomId = data.roomId || 'chog-island-1';
      socket.join(currentRoomId);

      const { room, newPlayer } = await roomManager.addPlayer(currentRoomId, {
        id: socket.id,
        nickname: data.nickname,
        characterId: data.characterId,
        x: data.x,
        y: data.y,
        isRealNFT: data.isRealNFT,
        nftTokenId: data.nftTokenId,
        nftImageUrl: data.nftImageUrl,
        walletAddress: data.walletAddress,
      });

      socket.emit('roomInit', {
        selfId: socket.id,
        room,
      });

      socket.to(currentRoomId).emit('playerJoined', newPlayer);

      const latestMsg = room.chatHistory[room.chatHistory.length - 1];
      if (latestMsg) {
        io.to(currentRoomId).emit('chatBroadcast', latestMsg);
      }

      console.log(
        `🎮 Player joined: ${newPlayer.nickname} (${newPlayer.characterId}) [Real NFT: ${
          newPlayer.isVerifiedNFT ? 'YES #' + newPlayer.nftTokenId : 'NO'
        }] Socket ID: ${socket.id}`
      );
    }
  );

  socket.on('move', (moveData: { x: number; y: number; direction?: 'up' | 'down' | 'left' | 'right'; isMoving?: boolean }) => {
    const updatedPlayer = roomManager.updatePlayerMove(currentRoomId, socket.id, moveData);
    if (updatedPlayer) {
      socket.to(currentRoomId).emit('playerMoved', {
        id: socket.id,
        x: updatedPlayer.x,
        y: updatedPlayer.y,
        direction: updatedPlayer.direction,
        isMoving: updatedPlayer.isMoving,
      });
    }
  });

  socket.on('emote', (emoteData: { type: string; text: string }) => {
    const updatedPlayer = roomManager.updatePlayerEmote(currentRoomId, socket.id, emoteData);
    if (updatedPlayer && updatedPlayer.currentEmote) {
      io.to(currentRoomId).emit('playerEmoted', {
        id: socket.id,
        nickname: updatedPlayer.nickname,
        characterId: updatedPlayer.characterId,
        emote: updatedPlayer.currentEmote,
        isVerifiedNFT: updatedPlayer.isVerifiedNFT,
      });
    }
  });

  socket.on('chat', (data: { text: string }) => {
    const room = roomManager.getOrCreateRoom(currentRoomId);
    const player = room.players[socket.id];
    if (!player) return;

    const chatMsg = roomManager.addChatMessage(currentRoomId, {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      senderId: socket.id,
      senderNickname: player.nickname,
      characterId: player.characterId,
      text: data.text,
      timestamp: Date.now(),
      isVerifiedNFT: player.isVerifiedNFT,
    });

    io.to(currentRoomId).emit('chatBroadcast', chatMsg);
  });

  socket.on('discover', (data: { locationId: string; locationName: string }) => {
    const result = roomManager.recordLocationDiscovery(currentRoomId, socket.id, data.locationId, data.locationName);
    if (result) {
      socket.emit('locationDiscovered', {
        locationId: data.locationId,
        locationName: data.locationName,
        discoveredLocations: result.player.discoveredLocations,
        isNew: result.isNew,
      });

      if (result.isNew) {
        const latestMsg = roomManager.getOrCreateRoom(currentRoomId).chatHistory.slice(-1)[0];
        if (latestMsg) {
          io.to(currentRoomId).emit('chatBroadcast', latestMsg);
        }
      }
    }
  });

  socket.on('disconnect', () => {
    const result = roomManager.removePlayer(socket.id);
    if (result) {
      io.to(result.roomId).emit('playerLeft', { id: socket.id });
      console.log(`👋 Player disconnected: ${result.player.nickname} [Socket: ${socket.id}]`);
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`🚀 Chog World Backend Server running on port ${PORT}`);
});
