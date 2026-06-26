const { v4: uuidv4 } = require('uuid');
const GameState = require('./GameState');
const BOT_NAMES = [
  'Naruto-Bot', 'Goku-Bot', 'Ichigo-Bot', 'Luffy-Bot',
  'Sasuke-Bot', 'Vegeta-Bot', 'Zoro-Bot', 'Meliodas-Bot'
];

class Room {
  constructor(id, hostId, hostName, mode, isPrivate) {
    this.id = id;
    this.host = hostId;
    this.mode = mode; // '3v3' or '5v5' (future)
    this.isPrivate = isPrivate;
    this.status = 'waiting'; // waiting | selecting | playing | ended
    this.players = new Map(); // socketId -> playerData
    this.bots = [];
    this.gameState = null;
    this.maxPerTeam = mode === '5v5' ? 5 : 3;
  }

  addPlayer(socketId, name, team) {
    this.players.set(socketId, {
      id: socketId,
      name,
      team,
      isBot: false,
      heroId: null,
      spellId: 'flash',
      ready: false
    });
  }

  addBot(difficulty) {
    const team = this.getTeamWithFewerPlayers();
    const botId = 'bot_' + uuidv4().slice(0, 8);
    const botName = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
    const botData = {
      id: botId,
      name: botName,
      team,
      isBot: true,
      difficulty,
      heroId: this._randomHero(),
      spellId: 'flash',
      ready: true
    };
    this.players.set(botId, botData);
    this.bots.push(botId);
    return botData;
  }

  _randomHero() {
    const heroes = ['naruto', 'goku', 'ichigo', 'luffy', 'sasuke', 'vegeta', 'zoro', 'rem', 'erza', 'nezuko'];
    return heroes[Math.floor(Math.random() * heroes.length)];
  }

  removePlayer(socketId) {
    this.players.delete(socketId);
  }

  hasPlayer(socketId) {
    return this.players.has(socketId);
  }

  isEmpty() {
    const humans = Array.from(this.players.values()).filter(p => !p.isBot);
    return humans.length === 0;
  }

  isFull() {
    return this.players.size >= this.maxPerTeam * 2;
  }

  getTeamWithFewerPlayers() {
    let team1 = 0, team2 = 0;
    for (const p of this.players.values()) {
      if (p.team === 1) team1++;
      else team2++;
    }
    return team1 <= team2 ? 1 : 2;
  }

  getFirstPlayer() {
    for (const [id, p] of this.players) {
      if (!p.isBot) return id;
    }
    return null;
  }

  switchTeam(socketId) {
    const player = this.players.get(socketId);
    if (player) {
      player.team = player.team === 1 ? 2 : 1;
    }
  }

  selectHero(socketId, heroId) {
    const player = this.players.get(socketId);
    if (player) player.heroId = heroId;
  }

  selectSpell(socketId, spellId) {
    const player = this.players.get(socketId);
    if (player) player.spellId = spellId;
  }

  startGame() {
    this.status = 'playing';
    // Assign random heroes to players who haven't picked one
    for (const [, player] of this.players) {
      if (!player.heroId) player.heroId = this._randomHero();
    }
    this.gameState = new GameState(this.id, Array.from(this.players.values()), this.mode);
  }

  getGameInitData() {
    return {
      roomId: this.id,
      mode: this.mode,
      players: Array.from(this.players.values()),
      mapData: GameState.getMapData(this.mode)
    };
  }

  getSummary() {
    return {
      id: this.id,
      host: this.host,
      mode: this.mode,
      isPrivate: this.isPrivate,
      status: this.status,
      players: Array.from(this.players.values()),
      playerCount: this.players.size,
      maxPlayers: this.maxPerTeam * 2
    };
  }
}

module.exports = Room;
