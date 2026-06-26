/**
 * Anime War — Firebase Cloud Function (2nd gen)
 * Hosts the Socket.IO game server
 */
const { onRequest } = require('firebase-functions/v2/https');
const { setGlobalOptions } = require('firebase-functions/v2');
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const RoomManager = require('./game/RoomManager');

// Set region (use us-central1 for lowest latency from most regions)
setGlobalOptions({ region: 'us-central1', memory: '512MiB', timeoutSeconds: 3600 });

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', game: 'Anime War' }));

const server = createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  // Cloud Functions compatible transport
  transports: ['polling', 'websocket'],
  allowEIO3: true,
  path: '/socket.io'
});

const roomManager = new RoomManager(io);

// ─── Socket Events ────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[+] ${socket.id} connected`);

  socket.on('lobby:join', ({ playerName }) => {
    socket.playerName = playerName || `Hero_${socket.id.slice(0, 5)}`;
    socket.emit('lobby:joined', { socketId: socket.id, playerName: socket.playerName });
    io.emit('lobby:playerList', roomManager.getLobbyPlayers(io));
  });

  socket.on('room:create', ({ mode, isPrivate }) => {
    const room = roomManager.createRoom(socket, mode || '3v3', isPrivate || false);
    socket.join(room.id);
    socket.emit('room:created', room.getSummary());
    io.emit('room:list', roomManager.getPublicRooms());
  });

  socket.on('room:join', ({ roomId }) => {
    const result = roomManager.joinRoom(socket, roomId);
    if (result.error) { socket.emit('error', result.error); return; }
    socket.join(roomId);
    io.to(roomId).emit('room:updated', result.room.getSummary());
    io.emit('room:list', roomManager.getPublicRooms());
  });

  socket.on('room:quickMatch', ({ mode }) => {
    const result = roomManager.quickMatch(socket, mode || '3v3');
    socket.join(result.room.id);
    io.to(result.room.id).emit('room:updated', result.room.getSummary());
    io.emit('room:list', roomManager.getPublicRooms());
  });

  socket.on('room:invite', ({ targetSocketId, roomId }) => {
    io.to(targetSocketId).emit('room:inviteReceived', {
      from: socket.playerName, fromId: socket.id, roomId
    });
  });

  socket.on('room:inviteAccept', ({ roomId }) => {
    const result = roomManager.joinRoom(socket, roomId);
    if (result.error) { socket.emit('error', result.error); return; }
    socket.join(roomId);
    io.to(roomId).emit('room:updated', result.room.getSummary());
  });

  socket.on('room:switchTeam', ({ roomId }) => {
    const room = roomManager.getRoom(roomId);
    if (room) { room.switchTeam(socket.id); io.to(roomId).emit('room:updated', room.getSummary()); }
  });

  socket.on('room:addBot', ({ roomId, difficulty }) => {
    const room = roomManager.getRoom(roomId);
    if (room) { room.addBot(difficulty || 'medium'); io.to(roomId).emit('room:updated', room.getSummary()); }
  });

  socket.on('hero:select', ({ roomId, heroId }) => {
    const room = roomManager.getRoom(roomId);
    if (room) { room.selectHero(socket.id, heroId); io.to(roomId).emit('room:updated', room.getSummary()); }
  });

  socket.on('spell:select', ({ roomId, spellId }) => {
    const room = roomManager.getRoom(roomId);
    if (room) { room.selectSpell(socket.id, spellId); io.to(roomId).emit('room:updated', room.getSummary()); }
  });

  socket.on('game:start', ({ roomId }) => {
    const room = roomManager.getRoom(roomId);
    if (room && room.host === socket.id) {
      room.startGame();
      io.to(roomId).emit('game:starting', room.getGameInitData());
    }
  });

  socket.on('game:move', ({ roomId, x, y }) => {
    const room = roomManager.getRoom(roomId);
    if (room?.gameState) room.gameState.movePlayer(socket.id, x, y);
  });

  socket.on('game:skill', ({ roomId, skillIndex, targetX, targetY }) => {
    const room = roomManager.getRoom(roomId);
    if (room?.gameState) {
      const result = room.gameState.useSkill(socket.id, skillIndex, targetX, targetY);
      if (result) io.to(roomId).emit('game:skillEffect', result);
    }
  });

  socket.on('game:spell', ({ roomId, targetX, targetY }) => {
    const room = roomManager.getRoom(roomId);
    if (room?.gameState) {
      const result = room.gameState.useSpell(socket.id, targetX, targetY);
      if (result) io.to(roomId).emit('game:spellEffect', result);
    }
  });

  socket.on('game:attack', ({ roomId, targetId }) => {
    const room = roomManager.getRoom(roomId);
    if (room?.gameState) {
      const result = room.gameState.attack(socket.id, targetId);
      if (result) io.to(roomId).emit('game:attackResult', result);
    }
  });

  socket.on('room:getList', () => {
    socket.emit('room:list', roomManager.getPublicRooms());
  });

  socket.on('chat:send', ({ roomId, message }) => {
    io.to(roomId).emit('chat:message', {
      from: socket.playerName, message, timestamp: Date.now()
    });
  });

  socket.on('disconnect', () => {
    console.log(`[-] ${socket.id} disconnected`);
    roomManager.handleDisconnect(socket);
    io.emit('lobby:playerList', roomManager.getLobbyPlayers(io));
    io.emit('room:list', roomManager.getPublicRooms());
  });
});

// Game tick — 20 ticks/sec
setInterval(() => {
  roomManager.tickAll((roomId, state) => {
    io.to(roomId).emit('game:state', state);
  });
}, 50);

// Export as Cloud Function (2nd gen)
exports.socketServer = onRequest(
  { invoker: 'public', concurrency: 80 },
  (req, res) => {
    // Let Socket.IO / Express handle it
    server.emit('request', req, res);
  }
);
