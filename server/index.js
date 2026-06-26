const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const RoomManager = require('./game/RoomManager');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:8080',
      'https://anime-war-game.web.app',
      'https://anime-war-game.firebaseapp.com',
      /\.web\.app$/,
      /\.firebaseapp\.com$/
    ],
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client')));

const roomManager = new RoomManager(io);

// ─── Socket Events ───────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[+] Player connected: ${socket.id}`);

  // Player joins lobby with a chosen name
  socket.on('lobby:join', ({ playerName }) => {
    socket.playerName = playerName || `Player_${socket.id.slice(0, 5)}`;
    socket.emit('lobby:joined', { socketId: socket.id, playerName: socket.playerName });
    io.emit('lobby:playerList', roomManager.getLobbyPlayers(io));
  });

  // Create a new room
  socket.on('room:create', ({ mode, isPrivate }) => {
    const room = roomManager.createRoom(socket, mode || '3v3', isPrivate || false);
    socket.join(room.id);
    socket.emit('room:created', room.getSummary());
    io.emit('room:list', roomManager.getPublicRooms());
  });

  // Join an existing room
  socket.on('room:join', ({ roomId }) => {
    const result = roomManager.joinRoom(socket, roomId);
    if (result.error) {
      socket.emit('error', result.error);
      return;
    }
    socket.join(roomId);
    io.to(roomId).emit('room:updated', result.room.getSummary());
    io.emit('room:list', roomManager.getPublicRooms());
  });

  // Quick match (auto-join or create)
  socket.on('room:quickMatch', ({ mode }) => {
    const result = roomManager.quickMatch(socket, mode || '3v3');
    socket.join(result.room.id);
    io.to(result.room.id).emit('room:updated', result.room.getSummary());
    io.emit('room:list', roomManager.getPublicRooms());
  });

  // Invite a player to your room
  socket.on('room:invite', ({ targetSocketId, roomId }) => {
    io.to(targetSocketId).emit('room:inviteReceived', {
      from: socket.playerName,
      fromId: socket.id,
      roomId
    });
  });

  // Accept/decline invite
  socket.on('room:inviteAccept', ({ roomId }) => {
    const result = roomManager.joinRoom(socket, roomId);
    if (result.error) { socket.emit('error', result.error); return; }
    socket.join(roomId);
    io.to(roomId).emit('room:updated', result.room.getSummary());
  });

  // Switch team
  socket.on('room:switchTeam', ({ roomId }) => {
    const room = roomManager.getRoom(roomId);
    if (room) {
      room.switchTeam(socket.id);
      io.to(roomId).emit('room:updated', room.getSummary());
    }
  });

  // Add a bot to the room
  socket.on('room:addBot', ({ roomId, difficulty }) => {
    const room = roomManager.getRoom(roomId);
    if (room) {
      room.addBot(difficulty || 'medium');
      io.to(roomId).emit('room:updated', room.getSummary());
    }
  });

  // Select hero
  socket.on('hero:select', ({ roomId, heroId }) => {
    const room = roomManager.getRoom(roomId);
    if (room) {
      room.selectHero(socket.id, heroId);
      io.to(roomId).emit('room:updated', room.getSummary());
    }
  });

  // Select spell
  socket.on('spell:select', ({ roomId, spellId }) => {
    const room = roomManager.getRoom(roomId);
    if (room) {
      room.selectSpell(socket.id, spellId);
      io.to(roomId).emit('room:updated', room.getSummary());
    }
  });

  // Start game (host only)
  socket.on('game:start', ({ roomId }) => {
    const room = roomManager.getRoom(roomId);
    if (room && room.host === socket.id) {
      room.startGame();
      io.to(roomId).emit('game:starting', room.getGameInitData());
    }
  });

  // ─── In-Game Events ────────────────────────────────────────────────────────

  // Player movement input
  socket.on('game:move', ({ roomId, x, y }) => {
    const room = roomManager.getRoom(roomId);
    if (room && room.gameState) {
      room.gameState.movePlayer(socket.id, x, y);
    }
  });

  // Player uses skill
  socket.on('game:skill', ({ roomId, skillIndex, targetX, targetY }) => {
    const room = roomManager.getRoom(roomId);
    if (room && room.gameState) {
      const result = room.gameState.useSkill(socket.id, skillIndex, targetX, targetY);
      if (result) io.to(roomId).emit('game:skillEffect', result);
    }
  });

  // Player uses battle spell
  socket.on('game:spell', ({ roomId, targetX, targetY }) => {
    const room = roomManager.getRoom(roomId);
    if (room && room.gameState) {
      const result = room.gameState.useSpell(socket.id, targetX, targetY);
      if (result) io.to(roomId).emit('game:spellEffect', result);
    }
  });

  // Player attacks
  socket.on('game:attack', ({ roomId, targetId }) => {
    const room = roomManager.getRoom(roomId);
    if (room && room.gameState) {
      const result = room.gameState.attack(socket.id, targetId);
      if (result) io.to(roomId).emit('game:attackResult', result);
    }
  });

  // Get public room list
  socket.on('room:getList', () => {
    socket.emit('room:list', roomManager.getPublicRooms());
  });

  // Chat message
  socket.on('chat:send', ({ roomId, message }) => {
    io.to(roomId).emit('chat:message', {
      from: socket.playerName,
      message,
      timestamp: Date.now()
    });
  });

  socket.on('disconnect', () => {
    console.log(`[-] Player disconnected: ${socket.id}`);
    roomManager.handleDisconnect(socket);
    io.emit('lobby:playerList', roomManager.getLobbyPlayers(io));
    io.emit('room:list', roomManager.getPublicRooms());
  });
});

// Game tick loop — broadcast state to all rooms at 20 ticks/sec
setInterval(() => {
  roomManager.tickAll((roomId, state) => {
    io.to(roomId).emit('game:state', state);
  });
}, 50);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Anime War server running on http://localhost:${PORT}`);
});
