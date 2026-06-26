const { v4: uuidv4 } = require('uuid');
const Room = require('./Room');

class RoomManager {
  constructor(io) {
    this.io = io;
    this.rooms = new Map(); // roomId -> Room
  }

  createRoom(socket, mode, isPrivate) {
    const room = new Room(uuidv4(), socket.id, socket.playerName, mode, isPrivate);
    room.addPlayer(socket.id, socket.playerName, 1);
    this.rooms.set(room.id, room);
    return room;
  }

  joinRoom(socket, roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return { error: 'Room not found' };
    if (room.isFull()) return { error: 'Room is full' };
    if (room.status !== 'waiting') return { error: 'Game already started' };

    // Assign to team with fewer players
    const team = room.getTeamWithFewerPlayers();
    room.addPlayer(socket.id, socket.playerName, team);
    return { room };
  }

  quickMatch(socket, mode) {
    // Find an available public room with same mode
    for (const [, room] of this.rooms) {
      if (!room.isPrivate && room.status === 'waiting' && room.mode === mode && !room.isFull()) {
        const team = room.getTeamWithFewerPlayers();
        room.addPlayer(socket.id, socket.playerName, team);
        return { room };
      }
    }
    // No room found, create one
    const room = new Room(uuidv4(), socket.id, socket.playerName, mode, false);
    room.addPlayer(socket.id, socket.playerName, 1);
    this.rooms.set(room.id, room);
    return { room };
  }

  getRoom(roomId) {
    return this.rooms.get(roomId);
  }

  getPublicRooms() {
    return Array.from(this.rooms.values())
      .filter(r => !r.isPrivate && r.status === 'waiting')
      .map(r => r.getSummary());
  }

  getLobbyPlayers(io) {
    const players = [];
    for (const [id, socket] of io.sockets.sockets) {
      if (socket.playerName) players.push({ id, name: socket.playerName });
    }
    return players;
  }

  handleDisconnect(socket) {
    for (const [roomId, room] of this.rooms) {
      if (room.hasPlayer(socket.id)) {
        room.removePlayer(socket.id);
        if (room.isEmpty()) {
          this.rooms.delete(roomId);
        } else {
          // Transfer host if host left
          if (room.host === socket.id) {
            room.host = room.getFirstPlayer();
          }
          this.io.to(roomId).emit('room:updated', room.getSummary());
        }
        break;
      }
    }
  }

  tickAll(callback) {
    for (const [roomId, room] of this.rooms) {
      if (room.status === 'playing' && room.gameState) {
        room.gameState.tick();
        callback(roomId, room.gameState.getState());
      }
    }
  }
}

module.exports = RoomManager;
